#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "data", "champions.js");
const outputPath = path.join(rootDir, "champions.csv");
const COLUMNS = [
    "key",
    "name",
    "pos",
    "cc",
    "dmg",
    "tank",
    "profileType",
    "profileScale",
    "dmgType",
    "phaseEarly",
    "phaseMid",
    "phaseLate"
];

function csvEscape(value) {
    const text = value == null ? "" : String(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
}

const code = fs.readFileSync(sourcePath, "utf8");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(code, ctx);
const db = ctx.CHAMP_DB;

if (!db || typeof db !== "object") {
    console.error("CHAMP_DB를 읽지 못했습니다.");
    process.exit(1);
}

const keys = Object.keys(db).sort((a, b) => {
    const nameA = db[a]?.name || a;
    const nameB = db[b]?.name || b;
    const byName = nameA.localeCompare(nameB, "ko-KR");
    if (byName !== 0) return byName;
    return a.localeCompare(b, "en");
});

const lines = [COLUMNS.join(",")];
keys.forEach((key) => {
    const c = db[key] || {};
    const row = [
        key,
        c.name || key,
        Array.isArray(c.pos) ? c.pos[0] || "" : "",
        c.cc ?? "",
        c.dmg ?? "",
        c.tank ?? "",
        c.profile?.type ?? "",
        c.profile?.scale ?? "",
        c.dmgType ?? "",
        c.phase?.early ?? "",
        c.phase?.mid ?? "",
        c.phase?.late ?? ""
    ];
    lines.push(row.map(csvEscape).join(","));
});

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`완료: ${path.relative(rootDir, outputPath)} (${keys.length}개 챔피언)`);
