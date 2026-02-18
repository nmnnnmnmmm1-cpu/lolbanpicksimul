# LoL Ban/Pick Simulator

## 챔피언 데이터 수정 방법

챔피언 데이터의 단일 진입점은 `data/champions.js`의 `CHAMP_DB`입니다.
각 챔피언은 아래 필드를 모두 가집니다.

```js
"Ahri": {
  name: "아리",
  pos: ["MID"],
  cc: 1,
  dmg: 8,
  tank: 3,
  profile: { type: "Poke", scale: 2 },
  dmgType: "AP",
  phase: { early: 6, mid: 8, late: 7 }
}
```

## 유효값 범위

| 필드 | 범위/값 |
|---|---|
| `pos[0]` | `TOP`, `JNG`, `MID`, `ADC`, `SPT` (정확히 1개) |
| `cc` | `0~3` |
| `dmg`, `tank` | `1~10` |
| `profile.type` | `Dive`, `Poke`, `Anti` |
| `profile.scale` | `1~3` |
| `dmgType` | `AD`, `AP`, `Hybrid` |
| `phase.early/mid/late` | `1~10` |

## 방법 1) JS 직접 수정

1. `data/champions.js`에서 원하는 챔피언 레코드를 수정
2. 저장 후 브라우저 새로고침
3. 잘못된 값은 런타임에서 안전 기본값으로 보정되며 콘솔 경고가 출력됨

## 방법 2) CSV(엑셀/스프레드시트) 왕복

### 1. CSV 내보내기

```bash
node tools/export_champions_csv.js
```

생성 파일: `champions.csv`

### 2. 엑셀/스프레드시트에서 수정

고정 컬럼 순서:

`key,name,pos,cc,dmg,tank,profileType,profileScale,dmgType,phaseEarly,phaseMid,phaseLate`

### 3. CSV 다시 반영

```bash
node tools/import_champions_csv.js
```

또는 다른 파일 경로 지정:

```bash
node tools/import_champions_csv.js /path/to/your.csv
```

## CSV 반영 실패 시 체크

1. 헤더 순서가 정확한지 확인
2. `key` 중복이 없는지 확인
3. `pos/profileType/dmgType` enum 값 오타 확인
4. 숫자 필드가 정수 범위(`cc 0~3`, 나머지 규칙 범위)인지 확인
