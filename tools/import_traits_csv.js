#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(rootDir, 'traits.csv');
const outputPath = path.join(rootDir, 'data', 'traits.js');
const COLUMNS = ['champName', 'traitName', 'condition', 'effect'];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch === '\r') {
      continue;
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function escapeJs(value) {
  return String(value || '').replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

if (!fs.existsSync(inputPath)) {
  console.error(`CSV 파일을 찾을 수 없습니다: ${inputPath}`);
  process.exit(1);
}

const text = fs.readFileSync(inputPath, 'utf8');
const rows = parseCsv(text);
if (rows.length < 2) {
  console.error('CSV 데이터가 비어있습니다.');
  process.exit(1);
}

const header = rows[0].map((v) => v.trim());
if (header.length !== COLUMNS.length || !COLUMNS.every((c, i) => header[i] === c)) {
  console.error(`헤더가 올바르지 않습니다. 기대: ${COLUMNS.join(',')}`);
  process.exit(1);
}

const errors = [];
const out = {};
for (let i = 1; i < rows.length; i++) {
  const rowNum = i + 1;
  const row = rows[i];
  if (row.length === 1 && row[0].trim() === '') continue;
  if (row.length !== COLUMNS.length) {
    errors.push(`${rowNum}행 컬럼 수가 ${COLUMNS.length}개가 아닙니다.`);
    continue;
  }

  const rec = Object.fromEntries(COLUMNS.map((k, idx) => [k, (row[idx] || '').trim()]));
  if (!rec.champName) {
    errors.push(`${rowNum}행 champName이 비어있습니다.`);
    continue;
  }
  if (!rec.traitName) {
    errors.push(`${rowNum}행 traitName이 비어있습니다.`);
    continue;
  }

  if (!out[rec.champName]) out[rec.champName] = [];
  out[rec.champName].push({
    name: rec.traitName,
    condition: rec.condition || '발동 조건 충족',
    effect: rec.effect || '효과 데이터 없음'
  });
}

if (errors.length > 0) {
  console.error('검증 실패:');
  errors.forEach((e) => console.error(`- ${e}`));
  process.exit(1);
}

const champs = Object.keys(out).sort((a, b) => a.localeCompare(b, 'ko-KR'));
const lines = [];
lines.push('var CHAMP_TRAIT_UI = {');
champs.forEach((champName, idx) => {
  const traits = out[champName];
  const traitStr = traits.map((t) => `{ name: "${escapeJs(t.name)}", condition: "${escapeJs(t.condition)}", effect: "${escapeJs(t.effect)}" }`).join(', ');
  const comma = idx < champs.length - 1 ? ',' : '';
  lines.push(`  "${escapeJs(champName)}": [${traitStr}]${comma}`);
});
lines.push('};');
lines.push('');

fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
console.log(`완료: ${path.relative(rootDir, outputPath)} (${champs.length}개 챔피언 특성 반영)`);
