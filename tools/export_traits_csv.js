#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
const sourcePath = path.join(rootDir, 'data', 'traits.js');
const outputPath = path.join(rootDir, 'traits.csv');
const COLUMNS = ['champName', 'traitName', 'condition', 'effect'];

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

const code = fs.readFileSync(sourcePath, 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(code, ctx);
const db = ctx.CHAMP_TRAIT_UI;

if (!db || typeof db !== 'object') {
  console.error('CHAMP_TRAIT_UI를 읽지 못했습니다.');
  process.exit(1);
}

const rows = [];
Object.keys(db).sort((a, b) => a.localeCompare(b, 'ko-KR')).forEach((champName) => {
  const traits = Array.isArray(db[champName]) ? db[champName] : [];
  traits.forEach((t) => {
    rows.push([
      champName,
      t?.name || '',
      t?.condition || '',
      t?.effect || ''
    ]);
  });
});

const lines = [COLUMNS.join(',')];
rows.forEach((r) => lines.push(r.map(csvEscape).join(',')));
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`완료: ${path.relative(rootDir, outputPath)} (${rows.length}개 특성)`);
