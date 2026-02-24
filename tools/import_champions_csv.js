#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(rootDir, "champions.csv");
const outputPath = path.join(rootDir, "data", "champions.js");
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
const POSITIONS = new Set(["TOP", "JNG", "MID", "ADC", "SPT"]);
const PROFILE_TYPES = new Set(["Dive", "Poke", "Anti"]);
const DMG_TYPES = new Set(["AD", "AP", "Hybrid"]);

function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
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
            cell = "";
        } else if (ch === '\n') {
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
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

function toInt(value, field, min, max, errors, rowNum) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max) {
        errors.push(`${rowNum}행 ${field}: ${value} (허용: ${min}~${max} 정수)`);
        return null;
    }
    return n;
}

function validateHeader(actual) {
    if (actual.length !== COLUMNS.length) return false;
    return COLUMNS.every((name, i) => actual[i] === name);
}

if (!fs.existsSync(inputPath)) {
    console.error(`CSV 파일을 찾을 수 없습니다: ${inputPath}`);
    process.exit(1);
}

const text = fs.readFileSync(inputPath, "utf8");
const rows = parseCsv(text);
if (rows.length < 2) {
    console.error("CSV 데이터가 비어있습니다.");
    process.exit(1);
}

if (!validateHeader(rows[0])) {
    console.error(`헤더가 올바르지 않습니다.\n기대: ${COLUMNS.join(",")}`);
    process.exit(1);
}

const errors = [];
const seen = new Set();
const db = {};

for (let i = 1; i < rows.length; i++) {
    const rowNum = i + 1;
    const row = rows[i];
    if (row.length === 1 && row[0].trim() === "") continue;
    if (row.length !== COLUMNS.length) {
        errors.push(`${rowNum}행 컬럼 수가 ${COLUMNS.length}개가 아닙니다.`);
        continue;
    }

    const rec = Object.fromEntries(COLUMNS.map((k, idx) => [k, row[idx].trim()]));
    const key = rec.key;
    if (!key) {
        errors.push(`${rowNum}행 key가 비어있습니다.`);
        continue;
    }
    if (seen.has(key)) {
        errors.push(`${rowNum}행 key 중복: ${key}`);
        continue;
    }
    seen.add(key);

    const posList = rec.pos
        .split(/[|/]/)
        .map((v) => v.trim())
        .filter(Boolean);
    if (posList.length === 0) {
        errors.push(`${rowNum}행 pos: 비어있음 (예: MID 또는 MID|JNG)`);
    }
    const invalidPos = posList.find((p) => !POSITIONS.has(p));
    if (invalidPos) errors.push(`${rowNum}행 pos: ${rec.pos} (허용: TOP/JNG/MID/ADC/SPT, 구분자 |)`);

    const profileType = rec.profileType;
    if (!PROFILE_TYPES.has(profileType)) errors.push(`${rowNum}행 profileType: ${profileType} (허용: Dive/Poke/Anti)`);

    const dmgType = rec.dmgType;
    if (!DMG_TYPES.has(dmgType)) errors.push(`${rowNum}행 dmgType: ${dmgType} (허용: AD/AP/Hybrid)`);

    const cc = toInt(rec.cc, "cc", 0, 3, errors, rowNum);
    const dmg = toInt(rec.dmg, "dmg", 1, 10, errors, rowNum);
    const tank = toInt(rec.tank, "tank", 1, 10, errors, rowNum);
    const profileScale = toInt(rec.profileScale, "profileScale", 1, 3, errors, rowNum);
    const phaseEarly = toInt(rec.phaseEarly, "phaseEarly", 1, 10, errors, rowNum);
    const phaseMid = toInt(rec.phaseMid, "phaseMid", 1, 10, errors, rowNum);
    const phaseLate = toInt(rec.phaseLate, "phaseLate", 1, 10, errors, rowNum);

    if (errors.length > 0 && errors[errors.length - 1].startsWith(`${rowNum}행`)) {
        continue;
    }

    db[key] = {
        name: rec.name || key,
        pos: [...new Set(posList)],
        cc,
        dmg,
        tank,
        profile: { type: profileType, scale: profileScale },
        dmgType,
        phase: { early: phaseEarly, mid: phaseMid, late: phaseLate }
    };
}

if (Object.keys(db).length === 0) {
    console.error("유효한 챔피언 데이터가 없습니다.");
    process.exit(1);
}

if (errors.length > 0) {
    console.error("검증 실패:");
    errors.slice(0, 30).forEach((e) => console.error(`- ${e}`));
    if (errors.length > 30) console.error(`... 외 ${errors.length - 30}개`);
    process.exit(1);
}

const keys = Object.keys(db);
const lines = [];
lines.push("// Champion dataset (single source of truth).");
lines.push("// Editable fields per champion:");
lines.push("// name: string (display name)");
lines.push("// pos: [\"TOP\"|\"JNG\"|\"MID\"|\"ADC\"|\"SPT\"] 1개 이상");
lines.push("// cc: 0~3");
lines.push("// dmg: 1~10, tank: 1~10");
lines.push("// profile.type: \"Dive\"|\"Poke\"|\"Anti\"");
lines.push("// profile.scale: 1~3");
lines.push("// dmgType: \"AD\"|\"AP\"|\"Hybrid\"");
lines.push("// phase.early/mid/late: 1~10");
lines.push("var CHAMP_DB = {");
keys.forEach((key, idx) => {
    const c = db[key];
    const comma = idx < keys.length - 1 ? "," : "";
    const name = c.name.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
    const posArr = (Array.isArray(c.pos) ? c.pos : []).map((p) => `\"${p}\"`).join(", ");
    lines.push(`    \"${key}\": { name: \"${name}\", pos: [${posArr}], cc: ${c.cc}, dmg: ${c.dmg}, tank: ${c.tank}, profile: { type: \"${c.profile.type}\", scale: ${c.profile.scale} }, dmgType: \"${c.dmgType}\", phase: { early: ${c.phase.early}, mid: ${c.phase.mid}, late: ${c.phase.late} } }${comma}`);
});
lines.push("};");
lines.push("");

fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log(`완료: ${path.relative(rootDir, outputPath)} (${keys.length}개 챔피언 반영)`);
