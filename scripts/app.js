// Runtime logic (champion raw data is loaded from data/champions.js)
const CDN_VERSION = "14.24.1";
const CHAMP_IMG_KEY_MAP = {
    Ksante: "KSante"
};
const TYPE_LABEL = {
    Dive: "돌진",
    Poke: "포킹",
    Anti: "받아치기"
};
const CHAMP_TRAIT_UI = {
    "리 신": [{ name: "솔랭 박살", condition: "아군 MID가 르블랑/아리", effect: "팀 초반 +5" }],
    "니달리": [{ name: "핵창", condition: "아군 CC 합 10 이상", effect: "팀 딜링 +3" }],
    "세주아니": [{ name: "빙결 저항", condition: "상대에 애쉬/신지드 존재", effect: "팀 탱킹 +3" }],
    "엘리스": [{ name: "렛츠 다이브", condition: "아군 TOP이 레넥톤/다리우스", effect: "팀 초반/중반 +3" }],
    "바이": [{ name: "기동타격 연계", condition: "아군에 아리/리산드라 존재", effect: "상대 ADC 딜링 -20%" }],
    "마오카이": [{ name: "대자연의 마력", condition: "아군 JNG/SPT 모두 탱커", effect: "팀 탱킹 +10" }],
    "아이번": [{ name: "숲의 친구", condition: "아군에 렝가 존재", effect: "팀 초/중/후 +2" }],
    "녹턴": [{ name: "일단 불꺼", condition: "아군에 트위스티드 페이트/쉔", effect: "팀 승률 +12%" }],
    "헤카림": [{ name: "돌격하라", condition: "아군에 유미/룰루", effect: "팀 돌진 +1" }],
    "킨드레드": [{ name: "그건 제 정글이에요", condition: "상대 JNG 탱킹 7 이상", effect: "팀 중반 +4" }],
    "트런들": [{ name: "안티 탱커", condition: "상대 팀 탱킹 27 이상", effect: "상대 탱킹 -4 / 우리 탱킹 +4" }],
    "카직스": [{ name: "메뚜기 월드", condition: "상대 JNG 초반 3 이하", effect: "팀 초반 +4" }],
    "람머스": [{ name: "가시 갑옷", condition: "상대 AD 비율 70% 이상", effect: "본인 탱킹 +5" }],
    "말파이트": [{ name: "가시 갑옷", condition: "상대 AD 비율 70% 이상", effect: "본인 탱킹 +5" }],
    "라칸": [{ name: "커플", condition: "아군 ADC가 자야", effect: "팀 초반 +2 / 딜+1 / 탱+1 / 초반 승률 +5" }],
    "나미": [{ name: "근본 조합", condition: "아군 ADC가 루시안", effect: "팀 초반 +2 / 딜링 +5" }],
    "룰루": [{ name: "요정의 친구", condition: "아군 ADC가 코그모/징크스/베인", effect: "팀 후반 +10" }],
    "유미": [{ name: "완벽한 밀착", condition: "아군 ADC가 제리/이즈리얼", effect: "팀 딜링 +4" }],
    "밀리오": [{ name: "아늑한 캠프파이어", condition: "아군 ADC가 루시안/케이틀린", effect: "팀 초반 +4" }],
    "브라움": [{ name: "프렐요드의 방패", condition: "아군 ADC가 애쉬/루시안", effect: "팀 CC +1 / 팀 탱킹 +2" }],
    "노틸러스": [{ name: "심해의 압박", condition: "아군 ADC가 카이사/사미라", effect: "팀 딜링 +2" }],
    "카르마": [{ name: "렛츠 두 포킹", condition: "아군 ADC가 이즈리얼/시비르", effect: "팀 포킹 +4" }],
    "타릭": [{ name: "우주의 광휘", condition: "아군 JNG가 마스터 이", effect: "팀 중반 +6" }],
    "카사딘": [{ name: "못 버티겠어", condition: "상대 MID AP면", effect: "팀 후반 +5 (상대 MID AD면 초반 -5)" }],
    "피오라": [{ name: "치명적인 검무", condition: "상대 TOP 탱킹 8 이상", effect: "팀 후반 +3" }],
    "벡스": [{ name: "우울", condition: "상대 돌진 챔피언 4명 이상", effect: "팀 CC +3" }],
    "모르가나": [{ name: "블쉴좀 써라", condition: "상대 CC 합 12 이상", effect: "상대 CC -5" }],
    "베인": [{ name: "탱커 사냥", condition: "상대 팀 탱킹 27 이상", effect: "팀 딜링 +5" }],
    "시비르": [{ name: "사냥 개시", condition: "아군 돌진형 3명 이상", effect: "팀 딜링 +5" }],
    "직스": [{ name: "포탑부터 지켜", condition: "기본 발동", effect: "팀 후반 가중치 증가" }],
    "아지르": [{ name: "넘겨잇", condition: "상대 주 조합이 돌진", effect: "팀 받아치기 +3" }],
    "블리츠크랭크": [{ name: "이게 끌리네", condition: "상대 ADC/SPT가 모두 포킹", effect: "팀 딜링 +6" }],
    "오른": [{ name: "간이 대장간", condition: "기본 발동", effect: "팀 기본 스탯 +3 / 후반 +4" }],
    "갱플랭크": [{ name: "화약통", condition: "아군 AD/AP 밸런스 완벽", effect: "팀 딜링 +10" }],
    "야스오": [{ name: "탑님 말파 가능?", condition: "아군 CC 합 10 이상", effect: "팀 딜링 +10" }],
    "리산드라": [{ name: "얼음 무덤", condition: "상대 MID가 돌진형", effect: "팀 CC +2" }],
    "질리언": [{ name: "시간 역행", condition: "기본 발동", effect: "팀 초반/후반 스탯 교환" }],
    "오리아나": [{ name: "내 공을 부탁해", condition: "아군 JNG가 돌진형", effect: "팀 딜링 +3 + 정글 돌진 스케일" }],
    "스몰더": [{ name: "쌍포", condition: "아군 ADC가 직스", effect: "팀 중반 +4" }],
    "갈리오": [{ name: "안티 AP", condition: "상대 MID가 AP", effect: "팀 초반 +3" }]
};

function getTypeColorClass(type) {
    if (type === "Dive") return "type-dive";
    if (type === "Poke") return "type-poke";
    return "type-anti";
}

function getDmgTypeColorClass(dmgType) {
    if (dmgType === "AD") return "dmg-ad";
    if (dmgType === "AP") return "dmg-ap";
    return "dmg-hybrid";
}

function normalizeNameToken(v) {
    return String(v || "").toLowerCase().replace(/\s+/g, "");
}

const clampStat = (value) => Math.min(Math.max(value, 1), 10);
const clampScale = (value) => Math.min(Math.max(Math.round(value), 1), 3);
const VALID_POSITIONS = new Set(["TOP", "JNG", "MID", "ADC", "SPT"]);
const VALID_PROFILE_TYPES = new Set(["Dive", "Poke", "Anti"]);
const VALID_DMG_TYPES = new Set(["AD", "AP", "Hybrid"]);

function warnInvalidField(key, field, value, fallback) {
    console.warn(`[CHAMP_DB] ${key}.${field} 값이 잘못되어 기본값을 사용합니다.`, { value, fallback });
}

function normalizeChampion(key, raw) {
    const champ = raw || {};
    const name = typeof champ.name === "string" && champ.name.trim() ? champ.name.trim() : key;
    if (name === key && champ.name !== key) warnInvalidField(key, "name", champ.name, key);

    const pos0 = Array.isArray(champ.pos) ? champ.pos[0] : null;
    const pos = VALID_POSITIONS.has(pos0) ? pos0 : "MID";
    if (!VALID_POSITIONS.has(pos0)) warnInvalidField(key, "pos[0]", pos0, "MID");

    const cc = Number.isFinite(champ.cc) ? Math.min(Math.max(Math.round(champ.cc), 0), 3) : 1;
    if (cc !== champ.cc) warnInvalidField(key, "cc", champ.cc, cc);

    const dmg = Number.isFinite(champ.dmg) ? clampStat(champ.dmg) : 6;
    if (dmg !== champ.dmg) warnInvalidField(key, "dmg", champ.dmg, dmg);

    const tank = Number.isFinite(champ.tank) ? clampStat(champ.tank) : 6;
    if (tank !== champ.tank) warnInvalidField(key, "tank", champ.tank, tank);

    const profileTypeRaw = champ.profile && champ.profile.type;
    const profileType = VALID_PROFILE_TYPES.has(profileTypeRaw) ? profileTypeRaw : "Dive";
    if (!VALID_PROFILE_TYPES.has(profileTypeRaw)) warnInvalidField(key, "profile.type", profileTypeRaw, "Dive");

    const profileScale = Number.isFinite(champ.profile && champ.profile.scale) ? clampScale(champ.profile.scale) : 2;
    if (!champ.profile || profileScale !== champ.profile.scale) warnInvalidField(key, "profile.scale", champ.profile && champ.profile.scale, profileScale);

    const dmgTypeRaw = champ.dmgType;
    const dmgType = VALID_DMG_TYPES.has(dmgTypeRaw) ? dmgTypeRaw : "AD";
    if (!VALID_DMG_TYPES.has(dmgTypeRaw)) warnInvalidField(key, "dmgType", dmgTypeRaw, "AD");

    const phase = champ.phase || {};
    const early = Number.isFinite(phase.early) ? clampStat(phase.early) : 6;
    const mid = Number.isFinite(phase.mid) ? clampStat(phase.mid) : 6;
    const late = Number.isFinite(phase.late) ? clampStat(phase.late) : 6;
    if (early !== phase.early) warnInvalidField(key, "phase.early", phase.early, early);
    if (mid !== phase.mid) warnInvalidField(key, "phase.mid", phase.mid, mid);
    if (late !== phase.late) warnInvalidField(key, "phase.late", phase.late, late);

    return {
        name,
        pos: [pos],
        cc,
        dmg,
        tank,
        profile: { type: profileType, scale: profileScale },
        dmgType,
        phase: { early, mid, late }
    };
}

Object.keys(CHAMP_DB).forEach((key) => {
    CHAMP_DB[key] = normalizeChampion(key, CHAMP_DB[key]);
});

const CHAMP_KEYS = Object.keys(CHAMP_DB);
const CHAMP_KEYS_KO_SORTED = [...CHAMP_KEYS].sort((a, b) => {
    const nameA = CHAMP_DB[a]?.name || a;
    const nameB = CHAMP_DB[b]?.name || b;
    const byName = nameA.localeCompare(nameB, "ko-KR");
    if (byName !== 0) return byName;
    return a.localeCompare(b, "en");
});

const CHAMP_KEY_BY_KO_NAME = Object.fromEntries(
    CHAMP_KEYS.map((k) => [normalizeNameToken(CHAMP_DB[k]?.name || k), k])
);

const POSITIONS = ["TOP", "JNG", "MID", "ADC", "SPT"];
// 공식 밴픽 순서: 3밴-3픽-2밴-2픽 (전술적 스왑 고려하지 않은 정석 포지션 매핑 버전)
const DRAFT_ORDER = [
    {t:'blue', type:'ban', id:0}, {t:'red', type:'ban', id:0}, {t:'blue', type:'ban', id:1}, {t:'red', type:'ban', id:1}, {t:'blue', type:'ban', id:2}, {t:'red', type:'ban', id:2},
    {t:'blue', type:'pick', id:0}, {t:'red', type:'pick', id:0}, {t:'red', type:'pick', id:1}, {t:'blue', type:'pick', id:1}, {t:'blue', type:'pick', id:2}, {t:'red', type:'pick', id:2},
    {t:'red', type:'ban', id:3}, {t:'blue', type:'ban', id:3}, {t:'red', type:'ban', id:4}, {t:'blue', type:'ban', id:4},
    {t:'red', type:'pick', id:3}, {t:'blue', type:'pick', id:3}, {t:'blue', type:'pick', id:4}, {t:'red', type:'pick', id:4}
];

let currentStep = 0;
let picks = { blue: [null,null,null,null,null], red: [null,null,null,null,null] };
let bans = { blue: [null,null,null,null,null], red: [null,null,null,null,null] };
let swapSource = null;
let activePosFilter = "ALL";
let activeTypeFilter = "ALL";
let activeDmgTypeFilter = "ALL";
let activeCombatFilter = "ALL";
let userTeam = null;
let aiTeam = null;
let currentGame = 1;
let seriesWins = { blue: 0, red: 0 };
let seriesRoleWins = { user: 0, ai: 0 };
let fearlessLocked = new Set();
let aiThinking = false;
let lastSeriesEnded = false;
let maxGames = 5;
let winTarget = 3;
let hardFearless = true;
let selectedModeKey = "bo5";
let pendingAction = null;
let matchNarrationTimer = null;
let pendingSimulationResult = null;
let resultFlowState = "idle"; // idle | ready | simulating | done
const MODE_RECORDS_KEY = "lol_draft_mode_records_v1";
const TEAM_PROFILE_KEY = "lol_draft_team_profile_v1";
const MATCH_HISTORY_KEY = "lol_draft_match_history_v1";
const MAX_MATCH_HISTORY = 80;
const MODE_CONFIGS = {
    single: { label: "단판", maxGames: 1, winTarget: 1, hardFearless: false },
    bo3: { label: "3전제 (하드피어리스)", maxGames: 3, winTarget: 2, hardFearless: true },
    bo5: { label: "5전제 (하드피어리스)", maxGames: 5, winTarget: 3, hardFearless: true }
};
const STRATEGY_CONFIGS = {
    Dive: {
        key: "Dive",
        label: "돌진",
        desc: "돌진 챔피언 위주로 강한 이니시를 노립니다."
    },
    Poke: {
        key: "Poke",
        label: "포킹",
        desc: "포킹 챔피언 위주로 체력 우위를 누적합니다."
    },
    Anti: {
        key: "Anti",
        label: "받아치기",
        desc: "받아치기 챔피언 위주로 교전 역습을 노립니다."
    },
    Early: {
        key: "Early",
        label: "초반 스노우볼",
        desc: "초반 강세 챔피언으로 빠른 우위를 굴립니다."
    },
    Late: {
        key: "Late",
        label: "후반 밸류",
        desc: "후반 강세 챔피언으로 시간 가치를 확보합니다."
    }
};
const TUTORIAL_STEPS = [
    {
        title: "게임 소개",
        body: "이 게임은 리그 오브 레전드 밴픽 시뮬레이션을 통해 승패를 가르는 게임입니다."
    },
    {
        title: "기본 스탯 구성",
        body: "각 챔피언에는 딜링/탱킹/CC기 스탯, 데미지 종류, 챔피언 유형, 파워커브가 존재합니다."
    },
    {
        title: "1. 딜링 & 탱킹 스탯",
        body: "각 챔피언은 1~10 사이의 공격/방어 수치를 가집니다. 스탯이 높을수록 승률이 조금씩 상승하지만, 팀 전체의 균형이 더 중요합니다. 5명 챔피언의 스탯 총합이 어느 한쪽이라도 20 미만일 경우, 승률이 크게 떨어지니 주의하세요!"
    },
    {
        title: "2. CC기 스탯",
        body: "챔피언당 0~3의 CC 수치를 보유합니다. 팀의 CC 합계가 5 이하면 승리가 매우 어려워지지만, 10 이상을 확보하면 승률이 비약적으로 상승하여 게임을 유리하게 이끌 수 있습니다."
    },
    {
        title: "3. 데미지 밸런스 (AD/AP)",
        body: "챔피언은 AD, AP, 하이브리드 중 하나의 속성을 가집니다. 각 속성의 비중은 챔피언의 공격 스탯에 따라 결정됩니다. 데미지 비중이 한쪽으로 너무 쏠리면 적의 방어에 막혀 승률이 하락하므로, AD와 AP의 비율을 적절히 섞는 것이 핵심입니다."
    },
    {
        title: "4. 챔피언 상성 (유형)",
        body: "모든 챔피언은 [돌진 > 포킹 > 받아치기 > 돌진]의 가위바위보 상성을 가집니다(1~3단계).\n* 수치가 높을수록 상성 이득(또는 손해)을 크게 보고, 낮을수록 상성 영향을 덜 받습니다.\n* 만약 수치가 동일해 '밸런스 유형'이 되면 모든 상성에서 조금씩 불리해지니, 확실한 팀 컬러를 정하는 것이 좋습니다."
    },
    {
        title: "5. 파워 커브",
        body: "챔피언마다 전성기(초/중/후반)가 다릅니다. 만약 상대 팀과 특정 시점의 전력 차이가 너무 크게 벌어진다면, 게임이 그 즉시 종료될 수도 있습니다."
    },
    {
        title: "마무리",
        body: "그럼 즐거운 게임 되세요!"
    }
];
let tutorialStepIndex = 0;
let modeRecords = loadModeRecords();
let selectedStrategyKey = "Dive";
let teamProfile = loadTeamProfile();
let matchHistory = loadMatchHistory();

function getChampionImageUrl(key) {
    const imageKey = CHAMP_IMG_KEY_MAP[key] || key;
    return `https://ddragon.leagueoflegends.com/cdn/${CDN_VERSION}/img/champion/${imageKey}.png`;
}

function setDisplayById(id, display) {
    const el = document.getElementById(id);
    if (el) el.style.display = display;
}

function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    return el.getClientRects().length > 0;
}

function loadModeRecords() {
    const empty = {
        single: { wins: 0, losses: 0, streak: 0, bestStreak: 0 },
        bo3: { wins: 0, losses: 0, streak: 0, bestStreak: 0 },
        bo5: { wins: 0, losses: 0, streak: 0, bestStreak: 0 }
    };
    try {
        const raw = localStorage.getItem(MODE_RECORDS_KEY);
        if (!raw) return empty;
        const parsed = JSON.parse(raw);
        Object.keys(empty).forEach((k) => {
            if (!parsed[k]) parsed[k] = { ...empty[k] };
            Object.keys(empty[k]).forEach((m) => {
                if (typeof parsed[k][m] !== "number") parsed[k][m] = empty[k][m];
            });
        });
        return parsed;
    } catch (_) {
        return empty;
    }
}

function saveModeRecords() {
    try {
        localStorage.setItem(MODE_RECORDS_KEY, JSON.stringify(modeRecords));
    } catch (_) {
        // Ignore storage failures.
    }
}

function loadTeamProfile() {
    const fallback = { myTeamName: "MY TEAM", aiTeamName: "AI TEAM" };
    try {
        const raw = localStorage.getItem(TEAM_PROFILE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return {
            myTeamName: (parsed.myTeamName || "").trim() || fallback.myTeamName,
            aiTeamName: (parsed.aiTeamName || "").trim() || fallback.aiTeamName
        };
    } catch (_) {
        return fallback;
    }
}

function saveTeamProfile() {
    try {
        localStorage.setItem(TEAM_PROFILE_KEY, JSON.stringify(teamProfile));
    } catch (_) {
        // Ignore storage failures.
    }
}

function loadMatchHistory() {
    try {
        const raw = localStorage.getItem(MATCH_HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item) => item && typeof item === "object");
    } catch (_) {
        return [];
    }
}

function saveMatchHistory() {
    try {
        localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(matchHistory.slice(0, MAX_MATCH_HISTORY)));
    } catch (_) {
        // Ignore storage failures.
    }
}

function formatTimeLabel(ts) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}.${m}.${day} ${h}:${min}`;
}

function saveTeamNameInputs() {
    const myInput = document.getElementById("my-team-name");
    const aiInput = document.getElementById("ai-team-name");
    if (!myInput || !aiInput) return;
    teamProfile.myTeamName = myInput.value.trim() || "MY TEAM";
    teamProfile.aiTeamName = aiInput.value.trim() || "AI TEAM";
    myInput.value = teamProfile.myTeamName;
    aiInput.value = teamProfile.aiTeamName;
    saveTeamProfile();
    renderHomeHistory();
}

function applyTeamNameInputs() {
    const myInput = document.getElementById("my-team-name");
    const aiInput = document.getElementById("ai-team-name");
    if (!myInput || !aiInput) return;
    myInput.value = teamProfile.myTeamName;
    aiInput.value = teamProfile.aiTeamName;
}

function recordMatchHistory(entry) {
    matchHistory.unshift(entry);
    matchHistory = matchHistory.slice(0, MAX_MATCH_HISTORY);
    saveMatchHistory();
}

function getRankingRows() {
    const map = {};
    matchHistory.forEach((entry) => {
        const winner = entry.winnerTeam || "UNKNOWN";
        if (!map[winner]) map[winner] = { team: winner, wins: 0, games: 0 };
        map[winner].wins += 1;
        map[winner].games += 1;
        const loser = entry.loserTeam || "";
        if (loser) {
            if (!map[loser]) map[loser] = { team: loser, wins: 0, games: 0 };
            map[loser].games += 1;
        }
    });
    return Object.values(map)
        .sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.games - a.games;
        })
        .slice(0, 10);
}

function renderHomeHistory() {
    const logList = document.getElementById("home-log-list");
    const rankingList = document.getElementById("home-ranking-list");
    if (logList) {
        if (matchHistory.length === 0) {
            logList.innerHTML = '<div class="home-empty">아직 기록이 없습니다.</div>';
        } else {
            logList.innerHTML = matchHistory.slice(0, 12).map((entry) => {
                return `<div class="home-log-item"><b>${entry.modeLabel}</b> <span>${entry.winnerTeam} 승 (${entry.scoreText})</span><em>${formatTimeLabel(entry.playedAt)}</em></div>`;
            }).join("");
        }
    }
    if (rankingList) {
        const ranks = getRankingRows();
        if (ranks.length === 0) {
            rankingList.innerHTML = '<div class="home-empty">랭킹 데이터가 없습니다.</div>';
        } else {
            rankingList.innerHTML = ranks.map((row, idx) => {
                const wr = row.games > 0 ? ((row.wins / row.games) * 100).toFixed(1) : "0.0";
                return `<div class="home-rank-item"><span>#${idx + 1} ${row.team}</span><b>${row.wins}승 / ${row.games}전 (${wr}%)</b></div>`;
            }).join("");
        }
    }
}

function applyModeConfig(modeKey) {
    const mode = MODE_CONFIGS[modeKey] || MODE_CONFIGS.bo5;
    selectedModeKey = modeKey;
    maxGames = mode.maxGames;
    winTarget = mode.winTarget;
    hardFearless = mode.hardFearless;
}

function getModeRecordLine(modeKey) {
    const rec = modeRecords[modeKey];
    const total = rec.wins + rec.losses;
    const winRate = total > 0 ? (rec.wins / total) * 100 : 0;
    return `승률 ${winRate.toFixed(1)}% (${rec.wins}/${total}) | 연승 ${rec.streak} | 최고 ${rec.bestStreak}`;
}

function renderHomeStats() {
    const single = document.getElementById("record-single");
    const bo3 = document.getElementById("record-bo3");
    const bo5 = document.getElementById("record-bo5");
    if (single) single.innerText = getModeRecordLine("single");
    if (bo3) bo3.innerText = getModeRecordLine("bo3");
    if (bo5) bo5.innerText = getModeRecordLine("bo5");
}

function openHome() {
    renderHomeStats();
    renderHomeHistory();
    applyTeamNameInputs();
    setDisplayById("home-page", "flex");
    setDisplayById("game-shell", "none");
    setDisplayById("side-select-modal", "none");
    setDisplayById("strategy-modal", "none");
    setDisplayById("tutorial-modal", "none");
    setDisplayById("result-modal", "none");
}

function selectMode(modeKey) {
    applyModeConfig(modeKey);
    saveTeamNameInputs();
    setDisplayById("home-page", "none");
    // side-select/strategy 모달이 game-shell 내부에 있으므로 shell을 먼저 노출해야 함
    setDisplayById("game-shell", "block");
    const sideTitle = document.getElementById("side-title");
    const sideDesc = document.getElementById("side-desc");
    const sideModal = document.getElementById("side-select-modal");
    if (sideTitle) sideTitle.innerText = MODE_CONFIGS[modeKey].label;
    if (sideDesc) sideDesc.innerText = "진영을 선택하세요. 선택하지 않은 팀은 컴퓨터가 자동 밴픽합니다.";
    if (sideModal) {
        sideModal.style.display = "flex";
        // 일부 환경에서 모달이 비정상 표시되는 경우 검은 화면 방지 폴백
        setTimeout(() => {
            if (userTeam) return;
            const modalNow = document.getElementById("side-select-modal");
            const cardNow = modalNow ? modalNow.querySelector(".side-select-card") : null;
            const looksBroken = !isElementVisible(modalNow) || !cardNow || cardNow.getBoundingClientRect().height < 40;
            if (!looksBroken) return;
            console.warn("[MODE] side-select 모달 표시 실패로 폴백 시작");
            const isBlue = window.confirm("진영 선택 UI를 표시하지 못했습니다.\n확인: 블루팀 / 취소: 레드팀");
            chooseSide(isBlue ? "blue" : "red");
        }, 120);
    } else {
        // 안전 폴백: 모달이 없으면 기본 블루 진영으로 즉시 시작
        userTeam = "blue";
        aiTeam = "red";
        setDisplayById("game-shell", "block");
        resetSeries();
    }
    startYoutubeBgm();
}

function updateModeRecord(userWonSeries) {
    const rec = modeRecords[selectedModeKey];
    if (!rec) return;
    if (userWonSeries) {
        rec.wins += 1;
        rec.streak += 1;
        rec.bestStreak = Math.max(rec.bestStreak, rec.streak);
    } else {
        rec.losses += 1;
        rec.streak = 0;
    }
    saveModeRecords();
}

function startYoutubeBgm() {
    const iframe = document.getElementById("yt-bgm");
    const status = document.getElementById("yt-bgm-status");
    if (!iframe) return;
    if (!iframe.src) {
        iframe.src = "https://www.youtube.com/embed/eMCkLrF8C2s?autoplay=1&mute=1&loop=1&playlist=eMCkLrF8C2s&controls=1&modestbranding=1&rel=0";
        if (status) status.innerText = "유튜브 BGM 적용됨 (브라우저 정책상 음소거 자동재생)";
    }
}

function openTutorial() {
    tutorialStepIndex = 0;
    renderTutorialStep();
    document.getElementById("tutorial-modal").style.display = "flex";
}

function renderTutorialStep() {
    const body = document.getElementById("tutorial-step-body");
    const idx = document.getElementById("tutorial-step-index");
    const title = document.getElementById("tutorial-title");
    if (!body || !idx || !title) return;
    const step = TUTORIAL_STEPS[tutorialStepIndex];
    title.innerText = step.title;
    body.innerText = step.body;
    idx.innerText = `${tutorialStepIndex + 1} / ${TUTORIAL_STEPS.length}`;
}

function prevTutorialStep() {
    tutorialStepIndex = Math.max(0, tutorialStepIndex - 1);
    renderTutorialStep();
}

function nextTutorialStep() {
    tutorialStepIndex = Math.min(TUTORIAL_STEPS.length - 1, tutorialStepIndex + 1);
    renderTutorialStep();
}

function renderStatRow(label, icon, value, maxValue, color) {
    const percentage = Math.min((value / maxValue) * 100, 100);
    const width = value > 0 ? Math.max(percentage, 8) : 0;
    return `
        <div class="tip-stat">
            <span class="tip-stat-label">${icon} ${label}</span>
            <span class="tip-stat-track"><span class="tip-stat-fill" style="width:${width}%; background:${color};"></span></span>
            <span class="tip-stat-value">${value}/${maxValue}</span>
        </div>
    `;
}

function renderCcPips(cc) {
    const pips = [1, 2, 3].map((i) => `<span class="cc-pip ${i <= cc ? "on" : "off"}"></span>`).join("");
    return `
        <div class="tip-stat tip-stat-cc">
            <span class="tip-stat-label">🧩 CC</span>
            <span class="cc-pips">${pips}</span>
            <span class="tip-stat-value">${cc}/3</span>
        </div>
    `;
}

function renderChampionTraitInfo(champName) {
    const traits = CHAMP_TRAIT_UI[champName] || [];
    if (traits.length === 0) {
        return `
        <div class="tip-trait-box">
            <div class="tip-trait-title">고유 특성</div>
            <div class="tip-trait-empty">이 챔피언은 현재 등록된 특성이 없습니다.</div>
        </div>
        `;
    }
    return `
    <div class="tip-trait-box">
        <div class="tip-trait-title">고유 특성</div>
        ${traits.map((t) => `
            <div class="tip-trait-item">
                <b>${t.name}</b>
                <span>조건: ${t.condition}</span>
                <span>효과: ${t.effect}</span>
            </div>
        `).join("")}
    </div>
    `;
}

function isMobileView() {
    return window.matchMedia('(max-width: 900px)').matches;
}

function buildChampionInfoHtml(c, isFearlessLocked) {
    return `
        <div class="tip-title-row">
            <b class="tip-title-name">${c.name}</b>
            <span class="tip-title-meta">${c.pos[0]} | ${TYPE_LABEL[c.profile.type]} ${c.profile.scale} | ${c.dmgType}</span>
        </div>
        ${renderCcPips(c.cc)}
        ${renderStatRow("딜링", "⚔", c.dmg, 10, "#ef5350")}
        ${renderStatRow("탱킹", "🛡", c.tank, 10, "#42a5f5")}
        ${renderPhaseLineChart(c.phase)}
        ${renderChampionTraitInfo(c.name)}
        ${isFearlessLocked ? "<div style=\"margin-top:5px;color:#ef9a9a;\">피어리스 잠금됨 (이전 세트 픽)</div>" : ""}
    `;
}

function openMobileChampionInfo(key, isFearlessLocked) {
    const modal = document.getElementById('mobile-champ-modal');
    const body = document.getElementById('mobile-champ-body');
    const title = document.getElementById('mobile-champ-title');
    if (!modal || !body || !CHAMP_DB[key]) return;
    const c = CHAMP_DB[key];
    if (title) title.innerText = c.name;
    body.innerHTML = buildChampionInfoHtml(c, isFearlessLocked);
    modal.classList.add('show');
}

function closeMobileChampionInfo() {
    const modal = document.getElementById('mobile-champ-modal');
    if (modal) modal.classList.remove('show');
}


function renderPhaseLineChart(phase) {
    const p = [phase.early, phase.mid, phase.late];
    const x = [18, 110, 202];
    const y = (v) => 62 - Math.round((v / 10) * 48);
    const points = `${x[0]},${y(p[0])} ${x[1]},${y(p[1])} ${x[2]},${y(p[2])}`;
    return `
        <div class="phase-line-wrap">
            <div class="phase-line-title">파워커브 (초/중/후)</div>
            <svg viewBox="0 0 220 74" class="phase-line-svg" role="img" aria-label="초중후반 선 그래프">
                <line x1="18" y1="62" x2="202" y2="62" class="phase-axis"/>
                <line x1="18" y1="14" x2="18" y2="62" class="phase-axis"/>
                <polyline points="${points}" class="phase-polyline"/>
                <circle cx="${x[0]}" cy="${y(p[0])}" r="3.5" class="phase-dot"/>
                <circle cx="${x[1]}" cy="${y(p[1])}" r="3.5" class="phase-dot"/>
                <circle cx="${x[2]}" cy="${y(p[2])}" r="3.5" class="phase-dot"/>
                <text x="${x[0]}" y="72" text-anchor="middle" class="phase-label">초</text>
                <text x="${x[1]}" y="72" text-anchor="middle" class="phase-label">중</text>
                <text x="${x[2]}" y="72" text-anchor="middle" class="phase-label">후</text>
                <text x="${x[0]}" y="${y(p[0]) - 8}" text-anchor="middle" class="phase-value">${p[0]}</text>
                <text x="${x[1]}" y="${y(p[1]) - 8}" text-anchor="middle" class="phase-value">${p[1]}</text>
                <text x="${x[2]}" y="${y(p[2]) - 8}" text-anchor="middle" class="phase-value">${p[2]}</text>
            </svg>
        </div>
    `;
}

function renderRadarChart(stats, teamClass) {
    const max = 50;
    const values = [
        Math.min(stats.dive * 3 + stats.cc, max),
        Math.min(stats.poke * 3 + stats.dmg, max),
        Math.min(stats.tank + stats.anti * 3, max),
        Math.min(stats.cc * 3 + stats.anti * 2, max),
        Math.min(stats.dmg + stats.tank, max),
        Math.min((stats.early + stats.mid + stats.late) / 2, max)
    ];
    const labels = ["이니시", "포킹", "유지", "CC", "난전", "운영"];
    const cx = 110, cy = 100, radius = 76;
    const points = values.map((v, i) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i / values.length);
        const r = (v / max) * radius;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const rings = [0.25, 0.5, 0.75, 1].map((ratio) => {
        const ringPoints = values.map((_, i) => {
            const angle = -Math.PI / 2 + (Math.PI * 2 * i / values.length);
            const x = cx + Math.cos(angle) * radius * ratio;
            const y = cy + Math.sin(angle) * radius * ratio;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ");
        return `<polygon points="${ringPoints}" class="radar-ring"></polygon>`;
    }).join("");
    const axes = values.map((_, i) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i / values.length);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="radar-axis"></line>`;
    }).join("");
    const labelEls = labels.map((label, i) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i / values.length);
        const x = cx + Math.cos(angle) * (radius + 16);
        const y = cy + Math.sin(angle) * (radius + 16);
        return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" class="radar-label">${label}</text>`;
    }).join("");
    return `<div class="radar-wrap ${teamClass}">
        <svg viewBox="0 0 220 200" class="radar-svg" role="img" aria-label="팀 시너지 레이더 차트">
            ${rings}
            ${axes}
            <polygon points="${points}" class="radar-area"></polygon>
            ${labelEls}
        </svg>
    </div>`;
}

function renderSynergyMeter(stats, teamClass) {
    const dominant = getDominantProfile(stats);
    const level = dominant.value >= 12 ? 3 : dominant.value >= 8 ? 2 : 1;
    const pct = Math.min((dominant.value / 15) * 100, 100);
    return `<div class="synergy-wrap ${teamClass}">
        <div class="synergy-top">
            <span class="synergy-name">${TYPE_LABEL[dominant.type]} 조합 Lv.${level}</span>
            <span class="synergy-score">${dominant.value}/15</span>
        </div>
        <div class="synergy-track"><span class="synergy-fill" style="width:${pct}%;"></span></div>
    </div>`;
}

function canAssignDistinctPositions(championKeys) {
    const used = {};
    const tryAssign = (idx, visited) => {
        if (visited[idx]) return false;
        visited[idx] = true;
        const key = championKeys[idx];
        const poss = CHAMP_DB[key].pos;
        for (const p of poss) {
            if (!used[p]) {
                used[p] = key;
                return true;
            }
        }
        for (const p of poss) {
            const prevKey = used[p];
            if (!prevKey) continue;
            used[p] = key;
            const prevIdx = championKeys.indexOf(prevKey);
            if (prevIdx >= 0 && tryAssign(prevIdx, visited)) return true;
            used[p] = prevKey;
        }
        return false;
    };

    for (let i = 0; i < championKeys.length; i++) {
        const ok = tryAssign(i, {});
        if (!ok) return false;
    }
    return true;
}

function canPickForTeam(team, key) {
    const selected = picks[team].filter(Boolean);
    return canAssignDistinctPositions([...selected, key]);
}

function updateSeriesInfo() {
    const mode = MODE_CONFIGS[selectedModeKey];
    const strategyLabel = STRATEGY_CONFIGS[selectedStrategyKey]?.label || "전략 미선택";
    document.getElementById('series-info').innerText = `${mode.label} | SET ${currentGame}/${maxGames} | SCORE ${teamProfile.myTeamName} ${seriesRoleWins.user} : ${seriesRoleWins.ai} ${teamProfile.aiTeamName} | 전략 ${strategyLabel}`;
}

function getTeamRoleLabel(team) {
    if (!userTeam) return team.toUpperCase();
    return team === userTeam ? teamProfile.myTeamName : teamProfile.aiTeamName;
}

function renderLockedChamps() {
    const list = document.getElementById('locked-list');
    if (!list) return;
    if (!hardFearless) {
        list.innerHTML = `<span style="font-size:10px;color:#7f95a3;">단판 모드는 잠금이 없습니다.</span>`;
        return;
    }
    const locked = [...fearlessLocked];
    if (locked.length === 0) {
        list.innerHTML = `<span style="font-size:10px;color:#7f95a3;">아직 잠금 없음</span>`;
        return;
    }
    list.innerHTML = locked.map((key) => `<span class="locked-chip"><img src="${getChampionImageUrl(key)}" alt="${CHAMP_DB[key]?.name || key}"><span>${CHAMP_DB[key]?.name || key}</span></span>`).join("");
}

function clearBoardUI() {
    for (let i = 0; i < 5; i++) {
        const bBan = document.getElementById(`b-ban-${i}`);
        const rBan = document.getElementById(`r-ban-${i}`);
        const bSlot = document.getElementById(`b-slot-${i}`);
        const rSlot = document.getElementById(`r-slot-${i}`);
        if (bBan) bBan.style.backgroundImage = "";
        if (rBan) rBan.style.backgroundImage = "";
        if (bSlot) {
            bSlot.querySelector('.champ-img').style.backgroundImage = "";
            bSlot.querySelector('.name').innerText = "-";
            bSlot.style.borderColor = "#222";
        }
        if (rSlot) {
            rSlot.querySelector('.champ-img').style.backgroundImage = "";
            rSlot.querySelector('.name').innerText = "-";
            rSlot.style.borderColor = "#222";
        }
    }
    document.querySelectorAll('.swap-btn').forEach((b) => b.style.display = 'none');
}

function startGameDraft() {
    if (matchNarrationTimer) {
        clearInterval(matchNarrationTimer);
        matchNarrationTimer = null;
    }
    currentStep = 0;
    picks = { blue: [null, null, null, null, null], red: [null, null, null, null, null] };
    bans = { blue: [null, null, null, null, null], red: [null, null, null, null, null] };
    swapSource = null;
    pendingAction = null;
    pendingSimulationResult = null;
    resultFlowState = "idle";
    aiThinking = false;
    clearBoardUI();
    document.getElementById('result-modal').style.display = 'none';
    const nextBtn = document.getElementById('result-next-btn');
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.style.opacity = "1";
    }
    updateSeriesInfo();
    renderLockedChamps();
    renderPool();
    updateUI();
    calculateStats();
}

function resetSeries() {
    currentGame = 1;
    seriesWins = { blue: 0, red: 0 };
    seriesRoleWins = { user: 0, ai: 0 };
    fearlessLocked = new Set();
    lastSeriesEnded = false;
    startGameDraft();
}

function renderStrategyModal() {
    const wrap = document.getElementById("strategy-list");
    if (!wrap) return;
    wrap.innerHTML = Object.keys(STRATEGY_CONFIGS).map((key) => {
        const item = STRATEGY_CONFIGS[key];
        const active = key === selectedStrategyKey ? "active" : "";
        return `<button type="button" class="strategy-option ${active}" onclick="selectStrategy('${key}')"><b>${item.label}</b><span>${item.desc}</span></button>`;
    }).join("");
}

function selectStrategy(key) {
    if (!STRATEGY_CONFIGS[key]) return;
    selectedStrategyKey = key;
    renderStrategyModal();
}

function confirmStrategyAndStart() {
    setDisplayById("strategy-modal", "none");
    setDisplayById("game-shell", "block");
    resetSeries();
}

function chooseSide(side) {
    userTeam = side;
    aiTeam = side === "blue" ? "red" : "blue";
    setDisplayById("side-select-modal", "none");
    renderStrategyModal();
    const strategyModal = document.getElementById("strategy-modal");
    if (strategyModal) {
        strategyModal.style.display = "flex";
        setTimeout(() => {
            if (currentStep > 0) return;
            const modalNow = document.getElementById("strategy-modal");
            const cardNow = modalNow ? modalNow.querySelector(".strategy-card") : null;
            const looksBroken = !isElementVisible(modalNow) || !cardNow || cardNow.getBoundingClientRect().height < 40;
            if (!looksBroken) return;
            console.warn("[MODE] strategy 모달 표시 실패로 자동 시작");
            confirmStrategyAndStart();
        }, 120);
    } else {
        // 안전 폴백: 전략 모달이 없으면 기본 전략으로 즉시 시작
        confirmStrategyAndStart();
    }
}

function init() {
    const bBans = document.getElementById('b-bans');
    const rBans = document.getElementById('r-bans');
    const bPicks = document.getElementById('b-picks');
    const rPicks = document.getElementById('r-picks');
    if (!bBans || !rBans || !bPicks || !rPicks) {
        console.error("[INIT] 필수 보드 DOM을 찾지 못했습니다. 홈 화면으로 폴백합니다.");
        setDisplayById("home-page", "flex");
        setDisplayById("game-shell", "none");
        return;
    }

    POSITIONS.forEach((pos, i) => {
        bBans.innerHTML += `<div class="ban-slot" id="b-ban-${i}"></div>`;
        rBans.innerHTML += `<div class="ban-slot" id="r-ban-${i}"></div>`;
        bPicks.innerHTML += `<div class="slot" id="b-slot-${i}"><span class="pos-indicator">${pos}</span><div class="champ-img"></div><div style="margin-left:10px;"><div class="name">-</div></div><button class="swap-btn" onclick="handleSwap('blue', ${i})">🔃</button></div>`;
        rPicks.innerHTML += `<div class="slot" id="r-slot-${i}" style="flex-direction:row-reverse; text-align:right;"><span class="pos-indicator" style="right:10px; left:auto;">${pos}</span><div class="champ-img"></div><div style="margin-right:10px;"><div class="name">-</div></div><button class="swap-btn" onclick="handleSwap('red', ${i})">🔃</button></div>`;
    });
    document.querySelectorAll('.pos-filter-btn').forEach((btn) => {
        if (btn.dataset.pos) {
            btn.addEventListener('click', () => {
                activePosFilter = btn.dataset.pos;
                document.querySelectorAll('#pos-nav .pos-filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
                renderPool();
            });
        }
        if (btn.dataset.type) {
            btn.addEventListener('click', () => {
                activeTypeFilter = btn.dataset.type;
                document.querySelectorAll('#type-nav .pos-filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
                renderPool();
            });
        }
        if (btn.dataset.dmgtype) {
            btn.addEventListener('click', () => {
                activeDmgTypeFilter = btn.dataset.dmgtype;
                document.querySelectorAll('#dmgtype-nav .pos-filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
                renderPool();
            });
        }
        if (btn.dataset.combat) {
            btn.addEventListener('click', () => {
                activeCombatFilter = btn.dataset.combat;
                document.querySelectorAll('#combat-nav .pos-filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
                renderPool();
            });
        }
    });
    renderPool();
    updateUI();
    calculateStats();
    const mobileModal = document.getElementById('mobile-champ-modal');
    if (mobileModal) {
        mobileModal.addEventListener('click', (e) => {
            if (e.target === mobileModal) closeMobileChampionInfo();
        });
    }
    const actionModal = document.getElementById('action-confirm-modal');
    if (actionModal) {
        actionModal.addEventListener('click', (e) => {
            if (e.target === actionModal) cancelPendingPick();
        });
    }
    const strategyModal = document.getElementById('strategy-modal');
    if (strategyModal) {
        strategyModal.addEventListener('click', (e) => {
            if (e.target === strategyModal) {
                e.stopPropagation();
            }
        });
    }
    renderStrategyModal();
    applyTeamNameInputs();
    startYoutubeBgm();
    openHome();
}

function getCombatRoleFilter(champ) {
    return champ.dmg >= champ.tank ? "Dealer" : "Tanker";
}

function renderPool() {
    const grid = document.getElementById('champ-grid');
    const term = document.getElementById('search').value.toLowerCase();
    grid.innerHTML = '';
    const step = currentStep < DRAFT_ORDER.length ? DRAFT_ORDER[currentStep] : null;
    const pickingTeam = step && step.type === 'pick' ? step.t : null;

    CHAMP_KEYS_KO_SORTED.forEach((key) => {
        const c = CHAMP_DB[key];
        const isSelected = [...picks.blue, ...picks.red, ...bans.blue, ...bans.red].includes(key);
        const isFearlessLocked = fearlessLocked.has(key);
        const matchesSearch = c.name.includes(term) || key.toLowerCase().includes(term) || TYPE_LABEL[c.profile.type].includes(term) || c.profile.type.toLowerCase().includes(term);
        const matchesPosFilter = activePosFilter === "ALL" || c.pos.includes(activePosFilter);
        const matchesTypeFilter = activeTypeFilter === "ALL" || c.profile.type === activeTypeFilter;
        const matchesDmgTypeFilter = activeDmgTypeFilter === "ALL" || c.dmgType === activeDmgTypeFilter;
        const matchesCombatFilter = activeCombatFilter === "ALL" || getCombatRoleFilter(c) === activeCombatFilter;
        const isPickValid = !pickingTeam || canPickForTeam(pickingTeam, key);

        if (matchesSearch && matchesPosFilter && matchesTypeFilter && matchesDmgTypeFilter && matchesCombatFilter) {
            const div = document.createElement('div');
            const isPending = pendingAction && pendingAction.key === key;
            div.className = `card ${isPending ? 'selected' : ''} ${isSelected || isFearlessLocked ? 'disabled' : ''} ${!isPickValid ? 'pos-mismatch' : ''}`;
            div.innerHTML = `
                <img src="${getChampionImageUrl(key)}" onerror="this.onerror=null;this.src='https://placehold.co/120x120/121c23/c8aa6e?text=${encodeURIComponent(c.name)}';">
                <button type="button" class="mobile-info-btn">정보</button>
                <p>${c.name}</p>
            `;

            const infoHtml = buildChampionInfoHtml(c, isFearlessLocked);
            if (!isMobileView()) {
                div.onmouseover = (e) => showTooltip(e, infoHtml);
                div.onmousemove = (e) => moveTooltip(e);
                div.onmouseout = hideTooltip;
            }

            const infoBtn = div.querySelector('.mobile-info-btn');
            if (infoBtn) {
                infoBtn.onclick = (ev) => {
                    ev.stopPropagation();
                    openMobileChampionInfo(key, isFearlessLocked);
                };
            }
            
            if (!isSelected && !isFearlessLocked && isPickValid) {
                div.onclick = () => {
                    if (step && step.t === userTeam) {
                        pendingAction = { key, type: step.type };
                        updatePickConfirmUI();
                        renderPool();
                        return;
                    }
                    selectChamp(key);
                };
            }
            grid.appendChild(div);
        }
    });
}

function updatePickConfirmUI() {
    const panel = document.getElementById("pick-confirm");
    const nameEl = document.getElementById("pick-confirm-name");
    const typeEl = document.getElementById("pick-confirm-type");
    const confirmBtn = panel ? panel.querySelector('.pick-confirm-btn.primary') : null;
    const actionModal = document.getElementById('action-confirm-modal');
    const actionTitle = document.getElementById('action-confirm-title');
    const actionName = document.getElementById('action-confirm-name');
    const actionYes = document.getElementById('action-confirm-yes');

    if (!panel || !nameEl) return;
    if (currentStep >= DRAFT_ORDER.length) {
        panel.classList.add("hidden");
        if (actionModal) actionModal.classList.remove('show');
        return;
    }
    const step = DRAFT_ORDER[currentStep];
    const canShow = !!pendingAction && step.t === userTeam;
    if (!canShow) {
        panel.classList.add("hidden");
        if (actionModal) actionModal.classList.remove('show');
        return;
    }

    const champName = CHAMP_DB[pendingAction.key]?.name || pendingAction.key;
    const isBan = pendingAction.type === 'ban';
    const actionLabel = isBan ? '밴 확정' : '픽 확정';

    nameEl.innerText = champName;
    if (typeEl) typeEl.innerText = isBan ? '(밴)' : '(픽)';
    if (confirmBtn) confirmBtn.innerText = actionLabel;

    if (isMobileView()) {
        panel.classList.add("hidden");
        if (actionModal) actionModal.classList.add('show');
        if (actionTitle) actionTitle.innerText = isBan ? '밴 선택 확인' : '픽 선택 확인';
        if (actionName) actionName.innerText = champName;
        if (actionYes) actionYes.innerText = actionLabel;
    } else {
        panel.classList.remove("hidden");
        if (actionModal) actionModal.classList.remove('show');
    }
}

function confirmPendingPick() {
    if (!pendingAction) return;
    const key = pendingAction.key;
    pendingAction = null;
    updatePickConfirmUI();
    selectChamp(key);
}

function cancelPendingPick() {
    pendingAction = null;
    const actionModal = document.getElementById('action-confirm-modal');
    if (actionModal) actionModal.classList.remove('show');
    updatePickConfirmUI();
    renderPool();
}

function selectChamp(key, byAI = false) {
    if (!userTeam) return;
    if (currentStep >= DRAFT_ORDER.length) return;
    const step = DRAFT_ORDER[currentStep];
    if (!byAI && step.t === aiTeam) return;
    
    if (step.type === 'ban') {
        bans[step.t][step.id] = key;
        document.getElementById(`${step.t[0]}-ban-${step.id}`).style.backgroundImage = `url(${getChampionImageUrl(key)})`;
    } else {
        picks[step.t][step.id] = key;
        refreshUI(step.t);
    }

    pendingAction = null;
    const actionModal = document.getElementById('action-confirm-modal');
    if (actionModal) actionModal.classList.remove('show');
    currentStep++;
    document.getElementById('search').value = '';
    renderPool();
    updateUI();
    calculateStats();
}

function updateUI() {
    document.querySelectorAll('.slot, .ban-slot').forEach(s => s.classList.remove('active'));
    updateSeriesInfo();
    const wrTrack = document.querySelector('.winrate-track');
    if (currentStep < DRAFT_ORDER.length) {
        wrTrack.style.display = "none";
        const step = DRAFT_ORDER[currentStep];
        const elId = step.type === 'ban' ? `${step.t[0]}-ban-${step.id}` : `${step.t[0]}-slot-${step.id}`;
        document.getElementById(elId).classList.add('active');
        
        const nextTeam = step.t.toUpperCase();
        const isAiTurn = userTeam && step.t === aiTeam;
        document.getElementById('step-msg').innerText = isAiTurn ? `AI(${nextTeam}) ${step.type.toUpperCase()}...` : `${nextTeam} ${step.type.toUpperCase()}...`;
        if (isAiTurn && !aiThinking) {
            aiThinking = true;
            setTimeout(aiTakeTurn, 550);
        }
    } else {
        wrTrack.style.display = "flex";
        document.getElementById('step-msg').innerText = `SET ${currentGame} 종료`;
        document.querySelectorAll('.swap-btn').forEach(b => b.style.display = 'block');
        showFinalResult();
    }
    updatePickConfirmUI();
}

function getCompLabel(stats) {
    const dominant = getDominantProfile(stats);
    if (dominant.type === "Dive") return "돌진 조합";
    if (dominant.type === "Poke") return "포킹 조합";
    return "받아치기 조합";
}

function getDominantProfile(stats) {
    const items = [
        { type: "Dive", value: stats.dive },
        { type: "Poke", value: stats.poke },
        { type: "Anti", value: stats.anti }
    ];
    // 동점 시에는 먼저 나온 유형을 택해 단일 조합으로 고정 반영
    let best = items[0];
    for (let i = 1; i < items.length; i++) {
        if (items[i].value > best.value) best = items[i];
    }
    return best;
}

function hasProfileTie(stats) {
    const values = [stats.dive, stats.poke, stats.anti];
    const maxValue = Math.max(...values);
    return values.filter((v) => v === maxValue).length >= 2;
}

function renderStrategySummary(strategyCtx, team) {
    if (!strategyCtx || !strategyCtx.effect || strategyCtx.effect.team !== team) {
        return '<span style="color:#7f95a3;">적용 없음</span>';
    }
    const strategyLabel = STRATEGY_CONFIGS[strategyCtx.effect.strategy]?.label || "전략";
    const fit = strategyCtx.effect.fit;
    const mismatch = strategyCtx.effect.mismatch;
    const winBonus = strategyCtx.effect.winBonus;
    const sign = winBonus >= 0 ? "+" : "";
    return `<span style="color:#ffe082;">${strategyLabel}</span> | 적합 ${fit} / 부조화 ${mismatch} | 승률보정 ${sign}${winBonus.toFixed(1)}`;
}

function updateTeamPanels(b, r, traitCtx = null, strategyCtx = null) {
    const maxProfileSum = 15;
    const makeBars = (teamStats, colorMap) => `
        <div class="mini-bars">
            <div class="mini-bar"><span class="mini-bar-label">돌진</span><span class="mini-bar-track"><span class="mini-bar-fill" style="width:${(teamStats.dive / maxProfileSum) * 100}%;background:${colorMap.dive};"></span></span><span class="mini-bar-value">${teamStats.dive}</span></div>
            <div class="mini-bar"><span class="mini-bar-label">포킹</span><span class="mini-bar-track"><span class="mini-bar-fill" style="width:${(teamStats.poke / maxProfileSum) * 100}%;background:${colorMap.poke};"></span></span><span class="mini-bar-value">${teamStats.poke}</span></div>
            <div class="mini-bar"><span class="mini-bar-label">받아</span><span class="mini-bar-track"><span class="mini-bar-fill" style="width:${(teamStats.anti / maxProfileSum) * 100}%;background:${colorMap.anti};"></span></span><span class="mini-bar-value">${teamStats.anti}</span></div>
        </div>
    `;
    const blueSummary = document.getElementById('b-team-summary');
    const redSummary = document.getElementById('r-team-summary');
    const blueRole = getTeamRoleLabel('blue');
    const redRole = getTeamRoleLabel('red');
    blueSummary.innerHTML = `
        <div class="title">블루팀 요약 (${blueRole})</div>
        <div class="row"><span>기본</span><span>CC ${b.cc} | 딜 ${b.dmg} | 탱 ${b.tank}</span></div>
        <div class="row"><span>시간대</span><span>초 ${b.early} / 중 ${b.mid} / 후 ${b.late}</span></div>
        <div class="row"><span>AD/AP</span><span><span class="dmg-ad">AD ${Math.round(b.adRatio * 100)}%</span> / <span class="dmg-ap">AP ${Math.round((1 - b.adRatio) * 100)}%</span> / <span class="dmg-hybrid">HYB ${Math.round((b.hybridCount / 5) * 100)}%</span></span></div>
        <div class="row"><span>성향</span><span><span class="type-dive">돌진 ${b.dive}</span> / <span class="type-poke">포킹 ${b.poke}</span> / <span class="type-anti">받아치기 ${b.anti}</span></span></div>
        <div class="row"><span>조합</span><span class="${getTypeColorClass(getDominantProfile(b).type)}">${getCompLabel(b)}</span></div>
        <div class="row"><span>전략</span><span>${renderStrategySummary(strategyCtx, "blue")}</span></div>
        ${renderSynergyMeter(b, "blue")}
        ${renderRadarChart(b, "blue")}
        ${makeBars(b, { dive: "#ef5350", poke: "#ffd54f", anti: "#66bb6a" })}
        <div class="trait-panel"><div class="trait-title">발동 특성</div>${renderTraitListHtml((traitCtx && traitCtx.traits && traitCtx.traits.blue) || [])}</div>
    `;
    redSummary.innerHTML = `
        <div class="title">레드팀 요약 (${redRole})</div>
        <div class="row"><span>기본</span><span>CC ${r.cc} | 딜 ${r.dmg} | 탱 ${r.tank}</span></div>
        <div class="row"><span>시간대</span><span>초 ${r.early} / 중 ${r.mid} / 후 ${r.late}</span></div>
        <div class="row"><span>AD/AP</span><span><span class="dmg-ad">AD ${Math.round(r.adRatio * 100)}%</span> / <span class="dmg-ap">AP ${Math.round((1 - r.adRatio) * 100)}%</span> / <span class="dmg-hybrid">HYB ${Math.round((r.hybridCount / 5) * 100)}%</span></span></div>
        <div class="row"><span>성향</span><span><span class="type-dive">돌진 ${r.dive}</span> / <span class="type-poke">포킹 ${r.poke}</span> / <span class="type-anti">받아치기 ${r.anti}</span></span></div>
        <div class="row"><span>조합</span><span class="${getTypeColorClass(getDominantProfile(r).type)}">${getCompLabel(r)}</span></div>
        <div class="row"><span>전략</span><span>${renderStrategySummary(strategyCtx, "red")}</span></div>
        ${renderSynergyMeter(r, "red")}
        ${renderRadarChart(r, "red")}
        ${makeBars(r, { dive: "#ef5350", poke: "#ffd54f", anti: "#66bb6a" })}
        <div class="trait-panel"><div class="trait-title">발동 특성</div>${renderTraitListHtml((traitCtx && traitCtx.traits && traitCtx.traits.red) || [])}</div>
    `;
}

function getTeamStats(team, picksState) {
    let res = {
        cc: 0, dmg: 0, tank: 0, dive: 0, poke: 0, anti: 0,
        early: 0, mid: 0, late: 0,
        adCount: 0, apCount: 0, hybridCount: 0,
        adDmg: 0, apDmg: 0, adPressure: 0, apPressure: 0, adRatio: 0.5
    };
    picksState[team].forEach((key) => {
        if (key) {
            const c = CHAMP_DB[key];
            res.cc += c.cc;
            res.dmg += c.dmg;
            res.tank += c.tank;
            res.early += c.phase.early;
            res.mid += c.phase.mid;
            res.late += c.phase.late;
            if (c.profile.type === "Dive") res.dive += c.profile.scale;
            if (c.profile.type === "Poke") res.poke += c.profile.scale;
            if (c.profile.type === "Anti") res.anti += c.profile.scale;
            if (c.dmgType === "AD") {
                res.adCount += 1;
                res.adDmg += c.dmg;
            } else if (c.dmgType === "AP") {
                res.apCount += 1;
                res.apDmg += c.dmg;
            } else {
                // 하이브리드는 AD/AP 영향도를 반반으로 분배
                res.hybridCount += 1;
                res.adCount += 0.5;
                res.apCount += 0.5;
                res.adDmg += c.dmg * 0.5;
                res.apDmg += c.dmg * 0.5;
            }
        }
    });
    res.adPower = res.adDmg;
    res.apPower = res.apDmg;
    const totalPower = res.adPower + res.apPower;
    res.adRatio = totalPower > 0 ? (res.adPower / totalPower) : 0.5;
    return res;
}

function getChampionKeyByName(name) {
    return CHAMP_KEY_BY_KO_NAME[normalizeNameToken(name)] || null;
}

function getTeamKeys(team, picksState) {
    return (picksState[team] || []).filter(Boolean);
}

function getTeamChampByPos(team, picksState, pos) {
    return getTeamKeys(team, picksState).find((k) => CHAMP_DB[k]?.pos?.[0] === pos) || null;
}

function teamHasChampionName(team, picksState, name) {
    const key = getChampionKeyByName(name);
    if (!key) return false;
    return getTeamKeys(team, picksState).includes(key);
}

function teamHasAnyChampionName(team, picksState, names) {
    return names.some((n) => teamHasChampionName(team, picksState, n));
}

function getCombatRoleByKey(key) {
    const c = CHAMP_DB[key];
    if (!c) return "Dealer";
    return c.dmg >= c.tank ? "Dealer" : "Tanker";
}

function renderTraitListHtml(list) {
    if (!list || list.length === 0) return '<div class="trait-empty">발동 없음</div>';
    return list.map((t) => '<div class="trait-item"><b>' + t.champName + ' · ' + t.traitName + '</b><span>' + t.effectText + '</span></div>').join('');
}

function evaluateTraitContext(picksState) {
    const stats = {
        blue: getTeamStats('blue', picksState),
        red: getTeamStats('red', picksState)
    };
    const traits = { blue: [], red: [] };
    const bonus = {
        blue: { win: 0, early: 0, mid: 0, late: 0, lateBias: 0 },
        red: { win: 0, early: 0, mid: 0, late: 0, lateBias: 0 }
    };

    const addStats = (team, delta) => {
        const t = stats[team];
        Object.keys(delta).forEach((k) => {
            if (!Number.isFinite(delta[k])) return;
            if (!Number.isFinite(t[k])) t[k] = 0;
            t[k] += delta[k];
        });
    };

    const addTrait = (team, champName, traitName, effectText, fn) => {
        if (!teamHasChampionName(team, picksState, champName)) return;
        const enemy = team === 'blue' ? 'red' : 'blue';
        if (!fn(team, enemy)) return;
        traits[team].push({ champName, traitName, effectText });
    };

    const applyTeamTraits = (team) => {
        const enemy = team === 'blue' ? 'red' : 'blue';
        const getMid = (t) => getTeamChampByPos(t, picksState, 'MID');
        const getTop = (t) => getTeamChampByPos(t, picksState, 'TOP');
        const getJng = (t) => getTeamChampByPos(t, picksState, 'JNG');
        const getAdc = (t) => getTeamChampByPos(t, picksState, 'ADC');
        const getSpt = (t) => getTeamChampByPos(t, picksState, 'SPT');

        addTrait(team, '리 신', '솔랭 박살', '초반 +5', () => {
            const mid = getMid(team); if (!mid) return false;
            if (!['르블랑', '아리'].includes(CHAMP_DB[mid].name)) return false;
            addStats(team, { early: 5 }); return true;
        });

        addTrait(team, '니달리', '핵창', '딜링 +3', () => {
            if (stats[team].cc < 10) return false;
            addStats(team, { dmg: 3 }); return true;
        });

        addTrait(team, '세주아니', '빙결 저항', '팀 탱킹 +3', () => {
            if (!teamHasAnyChampionName(enemy, picksState, ['애쉬', '신지드'])) return false;
            addStats(team, { tank: 3 }); return true;
        });

        addTrait(team, '엘리스', '렛츠 다이브', '초반/중반 +3', () => {
            const top = getTop(team); if (!top) return false;
            if (!['레넥톤', '다리우스'].includes(CHAMP_DB[top].name)) return false;
            addStats(team, { early: 3, mid: 3 }); return true;
        });

        addTrait(team, '바이', '기동타격 연계', '상대 원딜 딜링 -20%', () => {
            if (!teamHasAnyChampionName(team, picksState, ['아리', '리산드라'])) return false;
            const enemyAdc = getAdc(enemy); if (!enemyAdc) return false;
            addStats(enemy, { dmg: -(CHAMP_DB[enemyAdc].dmg * 0.2) }); return true;
        });

        addTrait(team, '마오카이', '대자연의 마력', '팀 탱킹 +10', () => {
            const jng = getJng(team), spt = getSpt(team);
            if (!jng || !spt) return false;
            if (getCombatRoleByKey(jng) !== 'Tanker' || getCombatRoleByKey(spt) !== 'Tanker') return false;
            addStats(team, { tank: 10 }); return true;
        });

        addTrait(team, '아이번', '숲의 친구', '팀 초/중/후 +2', () => {
            if (!teamHasChampionName(team, picksState, '렝가')) return false;
            addStats(team, { early: 2, mid: 2, late: 2 }); return true;
        });

        addTrait(team, '녹턴', '일단 불꺼', '승률 +12%', () => {
            if (!teamHasAnyChampionName(team, picksState, ['트위스티드 페이트', '쉔'])) return false;
            bonus[team].win += 12; return true;
        });

        addTrait(team, '헤카림', '돌격하라', '돌진 +1', () => {
            if (!teamHasAnyChampionName(team, picksState, ['유미', '룰루'])) return false;
            addStats(team, { dive: 1 }); return true;
        });

        addTrait(team, '킨드레드', '그건 제 정글이에요', '중반 +4', () => {
            const ej = getJng(enemy); if (!ej) return false;
            if ((CHAMP_DB[ej].tank || 0) < 7) return false;
            addStats(team, { mid: 4 }); return true;
        });

        addTrait(team, '트런들', '안티 탱커', '상대 탱킹 -4 / 우리 탱킹 +4', () => {
            if (stats[enemy].tank < 27) return false;
            addStats(team, { tank: 4 }); addStats(enemy, { tank: -4 }); return true;
        });

        addTrait(team, '카직스', '메뚜기 월드', '초반 +4', () => {
            const ej = getJng(enemy); if (!ej) return false;
            if ((CHAMP_DB[ej].phase?.early || 0) > 3) return false;
            addStats(team, { early: 4 }); return true;
        });

        ['람머스', '말파이트'].forEach((nm) => {
            addTrait(team, nm, '가시 갑옷', '탱킹 +5', () => {
                if (stats[enemy].adRatio < 0.7) return false;
                addStats(team, { tank: 5 }); return true;
            });
        });

        addTrait(team, '라칸', '커플', '초반 +2 / 딜+1 / 탱+1 / 초반 승률보정 +5', () => {
            const adc = getAdc(team); if (!adc || CHAMP_DB[adc].name !== '자야') return false;
            addStats(team, { early: 2, dmg: 1, tank: 1 }); bonus[team].early += 5; return true;
        });

        addTrait(team, '나미', '근본 조합', '초반 +2 / 딜 +5', () => {
            const adc = getAdc(team); if (!adc || CHAMP_DB[adc].name !== '루시안') return false;
            addStats(team, { early: 2, dmg: 5 }); return true;
        });

        addTrait(team, '룰루', '요정의 친구', '후반 +10', () => {
            const adc = getAdc(team); if (!adc) return false;
            if (!['코그모', '징크스', '베인'].includes(CHAMP_DB[adc].name)) return false;
            addStats(team, { late: 10 }); return true;
        });

        addTrait(team, '유미', '완벽한 밀착', '딜링 +4', () => {
            const adc = getAdc(team); if (!adc) return false;
            if (!['제리', '이즈리얼'].includes(CHAMP_DB[adc].name)) return false;
            addStats(team, { dmg: 4 }); return true;
        });

        addTrait(team, '밀리오', '아늑한 캠프파이어', '초반 +4', () => {
            const adc = getAdc(team); if (!adc) return false;
            if (!['루시안', '케이틀린'].includes(CHAMP_DB[adc].name)) return false;
            addStats(team, { early: 4 }); return true;
        });

        addTrait(team, '브라움', '프렐요드의 방패', 'CC +1 / 탱킹 +2', () => {
            const adc = getAdc(team); if (!adc) return false;
            if (!['애쉬', '루시안'].includes(CHAMP_DB[adc].name)) return false;
            addStats(team, { cc: 1, tank: 2 }); return true;
        });

        addTrait(team, '노틸러스', '심해의 압박', '딜링 +2', () => {
            const adc = getAdc(team); if (!adc) return false;
            if (!['카이사', '사미라'].includes(CHAMP_DB[adc].name)) return false;
            addStats(team, { dmg: 2 }); return true;
        });

        addTrait(team, '카르마', '렛츠 두 포킹', '포킹 +4', () => {
            const adc = getAdc(team); if (!adc) return false;
            if (!['이즈리얼', '시비르'].includes(CHAMP_DB[adc].name)) return false;
            addStats(team, { poke: 4 }); return true;
        });

        addTrait(team, '타릭', '우주의 광휘', '중반 +6', () => {
            const jng = getJng(team); if (!jng || CHAMP_DB[jng].name !== '마스터 이') return false;
            addStats(team, { mid: 6 }); return true;
        });

        addTrait(team, '카사딘', '못 버티겠어', '상대 미드 AP면 후반 +5 / AD면 초반 -5', () => {
            const em = getMid(enemy); if (!em) return false;
            if (CHAMP_DB[em].dmgType === 'AP') addStats(team, { late: 5 });
            else if (CHAMP_DB[em].dmgType === 'AD') addStats(team, { early: -5 });
            else return false;
            return true;
        });

        addTrait(team, '피오라', '치명적인 검무', '후반 +3', () => {
            const et = getTop(enemy); if (!et || (CHAMP_DB[et].tank || 0) < 8) return false;
            addStats(team, { late: 3 }); return true;
        });

        addTrait(team, '벡스', '우울', 'CC +3', () => {
            const c = getTeamKeys(enemy, picksState).filter((k) => CHAMP_DB[k].profile.type === 'Dive').length;
            if (c < 4) return false;
            addStats(team, { cc: 3 }); return true;
        });

        addTrait(team, '모르가나', '블쉴좀 써라', '상대 CC -5', () => {
            if (stats[enemy].cc < 12) return false;
            addStats(enemy, { cc: -5 }); return true;
        });

        addTrait(team, '베인', '탱커 사냥', '딜링 +5', () => {
            if (stats[enemy].tank < 27) return false;
            addStats(team, { dmg: 5 }); return true;
        });

        addTrait(team, '시비르', '사냥 개시', '딜링 +5', () => {
            const c = getTeamKeys(team, picksState).filter((k) => CHAMP_DB[k].profile.type === 'Dive').length;
            if (c < 3) return false;
            addStats(team, { dmg: 5 }); return true;
        });

        addTrait(team, '직스', '포탑부터 지켜', '후반 확률 보정', () => {
            addStats(team, { late: 3 }); bonus[team].late += 3; bonus[team].lateBias += 1; return true;
        });

        addTrait(team, '아지르', '넘겨잇', '받아치기 +3', () => {
            if (getDominantProfile(stats[enemy]).type !== 'Dive') return false;
            addStats(team, { anti: 3 }); return true;
        });

        addTrait(team, '블리츠크랭크', '이게 끌리네', '딜링 +6', () => {
            const ea = getAdc(enemy), es = getSpt(enemy);
            if (!ea || !es) return false;
            if (CHAMP_DB[ea].profile.type !== 'Poke' || CHAMP_DB[es].profile.type !== 'Poke') return false;
            addStats(team, { dmg: 6 }); return true;
        });

        addTrait(team, '오른', '간이 대장간', '기본 스탯 +3, 후반 +4', () => {
            addStats(team, { dmg: 3, tank: 3, cc: 3, late: 4 }); return true;
        });

        addTrait(team, '갱플랭크', '화약통', '딜링 +10', () => {
            if (Math.abs(stats[team].adRatio - 0.5) > 0.05) return false;
            addStats(team, { dmg: 10 }); return true;
        });

        addTrait(team, '야스오', '탑님 말파 가능?', '딜링 +10', () => {
            if (stats[team].cc < 10) return false;
            addStats(team, { dmg: 10 }); return true;
        });

        addTrait(team, '리산드라', '얼음 무덤', 'CC +2', () => {
            const em = getMid(enemy); if (!em || CHAMP_DB[em].profile.type !== 'Dive') return false;
            addStats(team, { cc: 2 }); return true;
        });

        addTrait(team, '질리언', '시간 역행', '초반/후반 스왑', () => {
            const t = stats[team].early;
            stats[team].early = stats[team].late;
            stats[team].late = t;
            return true;
        });

        addTrait(team, '오리아나', '내 공을 부탁해', '딜링 +3 + 정글 돌진 스케일', () => {
            const j = getJng(team); if (!j) return false;
            const cj = CHAMP_DB[j];
            if (cj.profile.type !== 'Dive') return false;
            addStats(team, { dmg: 3 + cj.profile.scale }); return true;
        });

        addTrait(team, '스몰더', '쌍포', '중반 +4', () => {
            const adc = getAdc(team); if (!adc || CHAMP_DB[adc].name !== '직스') return false;
            addStats(team, { mid: 4 }); return true;
        });

        addTrait(team, '갈리오', '안티 AP', '초반 +3', () => {
            const em = getMid(enemy); if (!em || CHAMP_DB[em].dmgType !== 'AP') return false;
            addStats(team, { early: 3 }); return true;
        });
    };

    applyTeamTraits('blue');
    applyTeamTraits('red');

    ['blue', 'red'].forEach((team) => {
        const t = stats[team];
        ['cc','dmg','tank','early','mid','late','dive','poke','anti'].forEach((k) => {
            t[k] = Math.max(0, t[k]);
        });
    });

    return { stats, traits, bonus };
}

function getStrategyFitState(champ, strategyKey) {
    if (!champ) return 0;
    if (strategyKey === "Dive") return champ.profile.type === "Dive" ? 1 : -1;
    if (strategyKey === "Poke") return champ.profile.type === "Poke" ? 1 : -1;
    if (strategyKey === "Anti") return champ.profile.type === "Anti" ? 1 : -1;
    if (strategyKey === "Early") {
        const isFit = champ.phase.early >= champ.phase.mid && champ.phase.early >= champ.phase.late;
        const isMismatch = champ.phase.late >= champ.phase.early + 2;
        return isFit ? 1 : (isMismatch ? -1 : 0);
    }
    if (strategyKey === "Late") {
        const isFit = champ.phase.late >= champ.phase.mid && champ.phase.late >= champ.phase.early;
        const isMismatch = champ.phase.early >= champ.phase.late + 2;
        return isFit ? 1 : (isMismatch ? -1 : 0);
    }
    return 0;
}

function evaluateStrategyContext(picksState, sourceStats) {
    const stats = {
        blue: { ...sourceStats.blue },
        red: { ...sourceStats.red }
    };
    const focusTeam = userTeam || "blue";
    const effect = {
        team: focusTeam,
        strategy: selectedStrategyKey,
        fit: 0,
        mismatch: 0,
        neutral: 0,
        winBonus: 0
    };
    const teamKeys = getTeamKeys(focusTeam, picksState);
    teamKeys.forEach((key) => {
        const state = getStrategyFitState(CHAMP_DB[key], selectedStrategyKey);
        if (state > 0) effect.fit += 1;
        else if (state < 0) effect.mismatch += 1;
        else effect.neutral += 1;
    });

    const t = stats[focusTeam];
    if (!t) return { stats, effect };

    const fit = effect.fit;
    const mismatch = effect.mismatch;
    const applyTypedStrategy = (typeKey) => {
        if (typeKey === "Dive") t.dive += fit * 1.4;
        if (typeKey === "Poke") t.poke += fit * 1.4;
        if (typeKey === "Anti") t.anti += fit * 1.4;
        t.dmg += fit * 0.9 - mismatch * 1.2;
        t.tank += fit * 0.5 - mismatch * 1.0;
        t.early += fit * 0.8 - mismatch * 1.0;
        t.mid += fit * 0.4 - mismatch * 0.7;
        t.late += fit * 0.4 - mismatch * 0.7;
        effect.winBonus += fit * 2.8 - mismatch * 3.4;
    };

    if (selectedStrategyKey === "Dive" || selectedStrategyKey === "Poke" || selectedStrategyKey === "Anti") {
        applyTypedStrategy(selectedStrategyKey);
    } else if (selectedStrategyKey === "Early") {
        t.early += fit * 2.5 - mismatch * 2.7;
        t.mid += fit * 0.8 - mismatch * 1.1;
        t.dmg += fit * 1.0 - mismatch * 0.9;
        t.tank += fit * 0.4 - mismatch * 0.8;
        effect.winBonus += fit * 3.2 - mismatch * 3.8;
    } else if (selectedStrategyKey === "Late") {
        t.late += fit * 2.5 - mismatch * 2.7;
        t.mid += fit * 0.9 - mismatch * 1.0;
        t.tank += fit * 1.1 - mismatch * 0.9;
        t.dmg += fit * 0.8 - mismatch * 0.7;
        effect.winBonus += fit * 3.2 - mismatch * 3.8;
    }

    ["cc", "dmg", "tank", "dive", "poke", "anti", "early", "mid", "late"].forEach((k) => {
        t[k] = Math.max(0, Number(t[k] || 0));
    });
    return { stats, effect };
}

function getCorePenalty(stats) {
    let penalty = 0;
    if (stats.dmg < 20) penalty -= 16 + (20 - stats.dmg) * 1.3;
    if (stats.tank < 20) penalty -= 16 + (20 - stats.tank) * 1.2;
    if (stats.cc <= 5) penalty -= 14 + (5 - stats.cc) * 2.0;
    return penalty;
}

function getDamageBalanceBonus(stats) {
    const total = stats.adPower + stats.apPower;
    if (total <= 0) return 0;
    const ratio = Math.max(stats.adPower, stats.apPower) / total;
    let penalty = 0;
    if (ratio > 0.65) penalty += 8;
    if (ratio > 0.8) penalty += 15;
    if (ratio > 0.9) penalty += 25;
    // Bonus 함수명을 유지하기 위해 음수 반환(페널티)
    return -penalty;
}

function clampPercent(v) {
    return Math.min(Math.max(v, 3), 97);
}

function getArchetypeCounterBonus(blueType, blueValue, redType, redValue) {
    // Dive > Poke > Anti > Dive
    // 핵심: 양 팀 유형 점수가 높을수록 상성 유불리가 더 크게 벌어짐
    const beats = { Dive: "Poke", Poke: "Anti", Anti: "Dive" };
    if (blueType === redType) return 0;

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
    const calcImpact = (winnerValue, loserValue) => {
        const sumIntensity = (winnerValue + loserValue) * 1.05;
        const diffIntensity = (winnerValue - loserValue) * 2.1;
        return clamp(2.0 + sumIntensity + diffIntensity, 0, 30);
    };

    if (beats[blueType] === redType) {
        return calcImpact(blueValue, redValue);
    }
    if (beats[redType] === blueType) {
        return -calcImpact(redValue, blueValue);
    }
    return 0;
}

function calcWinRateFromEdges(powerEdge, dmgBalanceEdge, archetypeEdge) {
    let blueWin = 50;
    blueWin += powerEdge * 0.56;
    blueWin += dmgBalanceEdge;
    blueWin += archetypeEdge * 1.22;
    return clampPercent(blueWin);
}

function getScalingEdge(b, r) {
    const blueCurve = b.early * 0.8 + b.mid * 1.0 + b.late * 1.2;
    const redCurve = r.early * 0.8 + r.mid * 1.0 + r.late * 1.2;
    return (blueCurve - redCurve) * 0.34;
}

function getVolatilityEdge(powerEdge, archetypeEdge, scalingEdge) {
    const magnitude = Math.abs(powerEdge) * 0.075 + Math.abs(archetypeEdge) * 0.32 + Math.abs(scalingEdge) * 0.85;
    const swing = Math.min(magnitude, 12);
    const direction = (powerEdge + archetypeEdge + scalingEdge) >= 0 ? 1 : -1;
    return swing * direction;
}

function getWinRateDetails(b, r) {
    const blueTeamScore = b.dmg + b.tank + b.cc * 3;
    const redTeamScore = r.dmg + r.tank + r.cc * 3;
    const powerEdge = blueTeamScore - redTeamScore;
    const dmgBalanceEdge = getDamageBalanceBonus(b) - getDamageBalanceBonus(r);
    const bMain = getDominantProfile(b);
    const rMain = getDominantProfile(r);
    const archetypeEdge = getArchetypeCounterBonus(bMain.type, bMain.value, rMain.type, rMain.value);
    const scalingEdge = getScalingEdge(b, r);
    const volatilityEdge = getVolatilityEdge(powerEdge, archetypeEdge, scalingEdge);
    const blueWin = clampPercent(calcWinRateFromEdges(powerEdge, dmgBalanceEdge, archetypeEdge) + scalingEdge + volatilityEdge);
    return { blueWin, powerEdge, dmgBalanceEdge, archetypeEdge, scalingEdge, volatilityEdge };
}

function getPhaseProjection(b, r, overallWin) {
    const bMain = getDominantProfile(b);
    const rMain = getDominantProfile(r);
    const dmgBalanceEdge = getDamageBalanceBonus(b) - getDamageBalanceBonus(r);
    const archetypeEdge = getArchetypeCounterBonus(bMain.type, bMain.value, rMain.type, rMain.value);

    // Step 2/3/4를 Early/Mid/Late에 각각 적용
    const earlyPowerEdge = (b.early * 2 + b.cc * 3) - (r.early * 2 + r.cc * 3);
    const midPowerEdge = (b.mid * 2 + b.cc * 3) - (r.mid * 2 + r.cc * 3);
    const latePowerEdge = (b.late * 2 + b.cc * 3) - (r.late * 2 + r.cc * 3);

    const earlyWinRaw = calcWinRateFromEdges(earlyPowerEdge, dmgBalanceEdge, archetypeEdge);
    const midWinRaw = calcWinRateFromEdges(midPowerEdge, dmgBalanceEdge, archetypeEdge);
    const lateWinRaw = calcWinRateFromEdges(latePowerEdge, dmgBalanceEdge, archetypeEdge);

    // 전체 기대승률과 완전히 분리되지 않도록 약하게 섞음
    const earlyWin = clampPercent(earlyWinRaw * 0.75 + overallWin * 0.25);
    const midWin = clampPercent(midWinRaw * 0.75 + overallWin * 0.25);
    const lateWin = clampPercent(lateWinRaw * 0.75 + overallWin * 0.25);
    return { earlyWin, midWin, lateWin };
}

function getWinRateByStats(b, r) {
    return getWinRateDetails(b, r).blueWin;
}

function renderMobileTeamMini(b, r, phases, traitCtx = null, strategyCtx = null) {
    const wrap = document.getElementById('mobile-team-mini');
    if (!wrap) return;
    const makeType = (stats) => {
        const d = getDominantProfile(stats);
        return `<span class="${getTypeColorClass(d.type)}">${TYPE_LABEL[d.type]} ${d.value}</span>`;
    };
    const phaseValues = (team) => {
        if (!phases) return { early: 0, mid: 0, late: 0 };
        return {
            early: team === 'blue' ? phases.earlyWin : (100 - phases.earlyWin),
            mid: team === 'blue' ? phases.midWin : (100 - phases.midWin),
            late: team === 'blue' ? phases.lateWin : (100 - phases.lateWin)
        };
    };
    const row = (team, stats) => {
        const color = team === 'blue' ? '#3db9ff' : '#ff7b6a';
        const apRatio = Math.max(0, Math.min(100, (1 - stats.adRatio) * 100));
        const adRatio = 100 - apRatio;
        const role = team === 'blue' ? 'BLUE' : 'RED';
        const pv = phaseValues(team);
        const traitList = ((traitCtx && traitCtx.traits && traitCtx.traits[team]) || []);
        const traitPreview = traitList.slice(0, 2).map((t) => t.champName + '·' + t.traitName).join(', ');
        const stratApplied = strategyCtx && strategyCtx.effect && strategyCtx.effect.team === team;
        const stratLabel = stratApplied ? (STRATEGY_CONFIGS[strategyCtx.effect.strategy]?.label || "전략") : "전략 없음";
        const stratMeta = stratApplied ? `${stratLabel} | 적합 ${strategyCtx.effect.fit} / 부조화 ${strategyCtx.effect.mismatch}` : stratLabel;
        return `<div class="mini-team-card ${team}">
            <div class="mini-team-head"><span class="mini-team-name">${role}</span><span class="mini-team-type">${makeType(stats)}</span></div>
            <div class="mini-team-phase-bars">
                <div class="mini-phase-row"><span>초</span><div class="mini-phase-track"><span class="mini-phase-fill" style="width:${pv.early.toFixed(1)}%; background:${color};"></span></div><em>${pv.early.toFixed(0)}</em></div>
                <div class="mini-phase-row"><span>중</span><div class="mini-phase-track"><span class="mini-phase-fill" style="width:${pv.mid.toFixed(1)}%; background:${color};"></span></div><em>${pv.mid.toFixed(0)}</em></div>
                <div class="mini-phase-row"><span>후</span><div class="mini-phase-track"><span class="mini-phase-fill" style="width:${pv.late.toFixed(1)}%; background:${color};"></span></div><em>${pv.late.toFixed(0)}</em></div>
            </div>
            <div class="mini-team-line"><span>AD/AP</span><span><span class="dmg-ad">${adRatio.toFixed(0)}</span> / <span class="dmg-ap">${apRatio.toFixed(0)}</span> / <span class="dmg-hybrid">${((stats.hybridCount / 5) * 100).toFixed(0)}</span></span></div>
            <div class="mini-team-line"><span>특성</span><span>${traitList.length}개</span></div>
            <div class="mini-team-traits">${stratMeta}</div>
            ${traitPreview ? `<div class="mini-team-traits">${traitPreview}${traitList.length > 2 ? ' ...' : ''}</div>` : ''}
            <div class="mini-team-adap-track">
                <span class="mini-team-ad" style="width:${adRatio.toFixed(1)}%; background:#ff9800;"></span><span class="mini-team-ap" style="width:${apRatio.toFixed(1)}%; background:#9c27b0;"></span>
            </div>
        </div>`;
    };
    wrap.innerHTML = row('blue', b) + row('red', r);
}

function calculateStats() {
    const traitCtx = evaluateTraitContext(picks);
    const strategyCtx = evaluateStrategyContext(picks, traitCtx.stats);
    const b = strategyCtx.stats.blue;
    const r = strategyCtx.stats.red;
    const blueRole = getTeamRoleLabel('blue');
    const redRole = getTeamRoleLabel('red');
    document.getElementById('blue-info').innerText = `${blueRole} (BLUE)`;
    document.getElementById('red-info').innerText = `${redRole} (RED)`;
    updateTeamPanels(b, r, traitCtx, strategyCtx);
    const details = getWinRateDetails(b, r);
    let strategyBlueEdge = 0;
    if (strategyCtx.effect.team === "blue") strategyBlueEdge += strategyCtx.effect.winBonus;
    if (strategyCtx.effect.team === "red") strategyBlueEdge -= strategyCtx.effect.winBonus;
    const bWin = clampPercent(details.blueWin + (traitCtx.bonus.blue.win - traitCtx.bonus.red.win) + strategyBlueEdge);
    const phases = getPhaseProjection(b, r, bWin);
    phases.earlyWin = clampPercent(phases.earlyWin + (traitCtx.bonus.blue.early - traitCtx.bonus.red.early));
    phases.midWin = clampPercent(phases.midWin + (traitCtx.bonus.blue.mid - traitCtx.bonus.red.mid));
    phases.lateWin = clampPercent(phases.lateWin + (traitCtx.bonus.blue.late - traitCtx.bonus.red.late) + (traitCtx.bonus.blue.lateBias - traitCtx.bonus.red.lateBias) * 2);
    renderMobileTeamMini(b, r, phases, traitCtx, strategyCtx);
    if (currentStep >= DRAFT_ORDER.length) {
        document.getElementById('blue-win-bar').style.width = bWin + "%";
        document.getElementById('b-wr-txt').innerText = bWin.toFixed(1) + "%";
        document.getElementById('r-wr-txt').innerText = (100-bWin).toFixed(1) + "%";
    }

    return { bWin, b, r, phases, details, traitCtx, strategyCtx };
}

function aiTakeTurn() {
    if (!userTeam || currentStep >= DRAFT_ORDER.length) return;
    const step = DRAFT_ORDER[currentStep];
    if (step.t !== aiTeam) return;

    const taken = new Set([...picks.blue, ...picks.red, ...bans.blue, ...bans.red, ...fearlessLocked]);
    let candidates = CHAMP_KEYS.filter((key) => !taken.has(key));
    if (step.type === 'pick') {
        candidates = candidates.filter((key) => canPickForTeam(aiTeam, key));
    }
    if (candidates.length === 0) {
        if (step.type === 'pick') candidates = CHAMP_KEYS.filter((key) => !taken.has(key));
        else {
            aiThinking = false;
            return;
        }
    }
    if (candidates.length === 0) {
        aiThinking = false;
        return;
    }

    let bestKey = candidates[0];
    let bestScore = -Infinity;
    const enemyTeam = aiTeam === 'blue' ? 'red' : 'blue';
    candidates.forEach((key) => {
        let score = 0;
        const champ = CHAMP_DB[key];
        if (step.type === 'pick') {
            const saved = picks[aiTeam][step.id];
            picks[aiTeam][step.id] = key;
            const b = getTeamStats('blue', picks);
            const r = getTeamStats('red', picks);
            const bWin = getWinRateByStats(b, r);
            const perspective = aiTeam === 'blue' ? bWin : (100 - bWin);
            const bonus = champ.profile.scale * 1.2 + champ.cc * 0.4;
            score = perspective + bonus;
            picks[aiTeam][step.id] = saved;
        } else {
            // 밴은 "상대가 가져갔을 때 내 승률이 가장 떨어지는 챔피언"을 우선 제거
            let simulatedThreat = 0;
            if (canPickForTeam(enemyTeam, key)) {
                const slotIdx = picks[enemyTeam].findIndex((v) => !v);
                if (slotIdx >= 0) {
                    const saved = picks[enemyTeam][slotIdx];
                    picks[enemyTeam][slotIdx] = key;
                    const b = getTeamStats('blue', picks);
                    const r = getTeamStats('red', picks);
                    const bWin = getWinRateByStats(b, r);
                    const aiPerspective = aiTeam === 'blue' ? bWin : (100 - bWin);
                    simulatedThreat = 100 - aiPerspective;
                    picks[enemyTeam][slotIdx] = saved;
                }
            }
            const rawPower = champ.dmg * 0.75 + champ.tank * 0.55 + champ.cc * 1.2 + champ.profile.scale * 1.1;
            score = simulatedThreat + rawPower * 0.45;
        }
        if (score > bestScore) {
            bestScore = score;
            bestKey = key;
        }
    });

    aiThinking = false;
    selectChamp(bestKey, true);
}

function handleSwap(team, idx) {
    if (swapSource === null) {
        swapSource = { team, idx };
        document.getElementById(`${team[0]}-slot-${idx}`).style.borderColor = "var(--gold)";
    } else {
        if (swapSource.team === team) {
            const temp = picks[team][swapSource.idx];
            picks[team][swapSource.idx] = picks[team][idx];
            picks[team][idx] = temp;
            refreshUI(team);
        }
        document.getElementById(`${swapSource.team[0]}-slot-${swapSource.idx}`).style.borderColor = "#222";
        swapSource = null;
    }
}

function refreshUI(team) {
    // 슬롯 표시 기준은 픽 순서가 아니라 챔피언의 실제 포지션
    POSITIONS.forEach((_, i) => {
        const slot = document.getElementById(`${team[0]}-slot-${i}`);
        slot.querySelector('.champ-img').style.backgroundImage = "";
        slot.querySelector('.name').innerText = "-";
    });

    picks[team].forEach((key) => {
        if (!key) return;
        const pos = CHAMP_DB[key].pos[0];
        const slotIdx = POSITIONS.indexOf(pos);
        if (slotIdx < 0) return;
        const slot = document.getElementById(`${team[0]}-slot-${slotIdx}`);
        slot.querySelector('.champ-img').style.backgroundImage = `url(${getChampionImageUrl(key)})`;
        slot.querySelector('.name').innerText = CHAMP_DB[key].name;
    });
}

function teamDisplayName(team) {
    if (!userTeam) return team.toUpperCase();
    return team === userTeam ? teamProfile.myTeamName : teamProfile.aiTeamName;
}

function randomPick(arr) {
    if (!arr || arr.length === 0) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

function buildPhaseCommentary(res, finalWinner) {
    const blueName = teamDisplayName("blue");
    const redName = teamDisplayName("red");
    const blueCarry = randomPick(picks.blue.filter(Boolean).map((k) => CHAMP_DB[k].name)) || "블루팀";
    const redCarry = randomPick(picks.red.filter(Boolean).map((k) => CHAMP_DB[k].name)) || "레드팀";
    const earlyFav = res.phases.earlyWin >= 50 ? "blue" : "red";
    const midFav = res.phases.midWin >= 50 ? "blue" : "red";
    const lateFav = res.phases.lateWin >= 50 ? "blue" : "red";
    const bMain = getDominantProfile(res.b);
    const rMain = getDominantProfile(res.r);
    const blueType = TYPE_LABEL[bMain.type];
    const redType = TYPE_LABEL[rMain.type];
    const bluePenalty = -getDamageBalanceBonus(res.b);
    const redPenalty = -getDamageBalanceBonus(res.r);
    const goldKill = buildGoldKillProjection(res);
    const winner = finalWinner || (res.bWin >= 50 ? "blue" : "red");
    const loser = winner === "blue" ? "red" : "blue";
    const winnerName = winner === "blue" ? blueName : redName;
    const loserName = loser === "blue" ? blueName : redName;
    const winnerCarry = winner === "blue" ? blueCarry : redCarry;
    const lines = [
        "해설: 밴픽 결과를 바탕으로 경기 시뮬레이션을 시작합니다.",
        (earlyFav === "blue" ? blueName : redName) + "이 초반 동선을 선점하며 퍼스트 블러드를 만들어냅니다!",
        (midFav === "blue" ? blueCarry : redCarry) + "가 오브젝트 교전에서 이니시를 열고 한타를 찢어냅니다!",
        (midFav === "blue" ? blueName : redName) + "의 " + (midFav === "blue" ? blueType : redType) + " 조합이 중반 교전 구도를 강하게 장악합니다.",
        (lateFav === "blue" ? blueName : redName) + "이 후반 핵심 한타에서 결정타를 꽂습니다!"
    ];
    goldKill.points.forEach((p) => lines.splice(Math.min(lines.length, 2 + goldKill.points.indexOf(p)), 0, p.line));
    if (bluePenalty > 0) {
        lines.push(blueName + "은(는) 데미지 비율이 치우쳐 아이템 대응에 막히며 피해 효율이 떨어집니다.");
    } else if (redPenalty > 0) {
        lines.push(redName + "은(는) 데미지 비율이 치우쳐 아이템 대응에 막히며 피해 효율이 떨어집니다.");
    }
    if (earlyFav !== winner && lateFav === winner) {
        lines.push(`${winnerName}이(가) 초반 열세를 버티고 후반 운영으로 경기를 뒤집습니다!`);
    } else if (midFav !== winner && lateFav === winner) {
        lines.push(`${winnerCarry}가 막판 교전에서 대역전 각을 만들며 흐름을 바꿉니다!`);
    } else {
        lines.push(`${winnerName} 쪽으로 경기의 무게추가 완전히 기웁니다.`);
    }
    lines.push(`최종 승자: ${winnerName}. ${loserName}은(는) 아쉽게 세트를 내줍니다.`);
    return lines;
}

function rollWinnerFromWinRate(blueWinRate) {
    return Math.random() * 100 < blueWinRate ? "blue" : "red";
}

function getPerspectiveWinBundle(res) {
    const isBlueMyTeam = userTeam !== "red";
    const myOverall = isBlueMyTeam ? res.bWin : (100 - res.bWin);
    const myEarly = isBlueMyTeam ? res.phases.earlyWin : (100 - res.phases.earlyWin);
    const myMid = isBlueMyTeam ? res.phases.midWin : (100 - res.phases.midWin);
    const myLate = isBlueMyTeam ? res.phases.lateWin : (100 - res.phases.lateWin);
    const myColor = isBlueMyTeam ? "#00a3ff" : "#e74c3c";
    return { myOverall, myEarly, myMid, myLate, myColor };
}

function renderPhaseRowsForPerspective(res) {
    const p = getPerspectiveWinBundle(res);
    return `
            <div style="font-size:11px;color:#9fb3c2;margin:0 0 4px;">우리 팀 기준 승률</div>
            <div class="phase-row"><span>초반</span><div class="phase-track"><div class="phase-fill" style="width:${p.myEarly.toFixed(1)}%; background:${p.myColor};"></div></div><span>${p.myEarly.toFixed(1)}%</span></div>
            <div class="phase-row"><span>중반</span><div class="phase-track"><div class="phase-fill" style="width:${p.myMid.toFixed(1)}%; background:${p.myColor};"></div></div><span>${p.myMid.toFixed(1)}%</span></div>
            <div class="phase-row"><span>후반</span><div class="phase-track"><div class="phase-fill" style="width:${p.myLate.toFixed(1)}%; background:${p.myColor};"></div></div><span>${p.myLate.toFixed(1)}%</span></div>
    `;
}

function formatGoldDiff(gold) {
    const sign = gold > 0 ? "+" : "";
    return `${sign}${Math.round(gold).toLocaleString()}G`;
}

function getGoldSwingByWinEdge(edge) {
    const sign = edge >= 0 ? 1 : -1;
    const abs = Math.abs(edge);
    let swing = abs * 150;
    if (abs > 30) swing += (abs - 30) * 100;
    return sign * swing;
}

function buildGoldKillProjection(res) {
    const isBlueMyTeam = userTeam !== "red";
    const myTeam = isBlueMyTeam ? "blue" : "red";
    const enemyTeam = myTeam === "blue" ? "red" : "blue";
    const myStats = myTeam === "blue" ? res.b : res.r;
    const enemyStats = enemyTeam === "blue" ? res.b : res.r;
    const phaseWins = [
        { key: "early", label: "초반", minute: 15, win: isBlueMyTeam ? res.phases.earlyWin : (100 - res.phases.earlyWin) },
        { key: "mid", label: "중반", minute: 25, win: isBlueMyTeam ? res.phases.midWin : (100 - res.phases.midWin) },
        { key: "late", label: "후반", minute: 35, win: isBlueMyTeam ? res.phases.lateWin : (100 - res.phases.lateWin) }
    ];
    let cumulativeGold = 0;
    let myKills = 0;
    let enemyKills = 0;
    const points = phaseWins.map((p) => {
        const edge = p.win - 50;
        const swing = getGoldSwingByWinEdge(edge);
        const snowball = cumulativeGold * (edge >= 0 ? 0.12 : -0.12);
        cumulativeGold = Math.round(cumulativeGold + swing + snowball);

        const myPhasePower = (myStats[p.key] || 0) * 2 + myStats.cc * 2 + myStats.dmg * 0.8 + myStats.tank * 0.5;
        const enemyPhasePower = (enemyStats[p.key] || 0) * 2 + enemyStats.cc * 2 + enemyStats.dmg * 0.8 + enemyStats.tank * 0.5;
        const freq = Math.max(2, Math.round(2 + Math.abs(myPhasePower - enemyPhasePower) / 10 + Math.abs(edge) / 12));
        const killEdge = Math.max(1, Math.round(Math.abs(edge) / 14));
        const myGain = edge >= 0 ? (freq + killEdge) : Math.max(0, freq - killEdge);
        const enemyGain = edge >= 0 ? Math.max(0, freq - killEdge) : (freq + killEdge);
        myKills += myGain;
        enemyKills += enemyGain;

        const dominantTeam = edge >= 0 ? myTeam : enemyTeam;
        const dominantName = teamDisplayName(dominantTeam);
        return {
            ...p,
            edge,
            goldDiff: cumulativeGold,
            myKills,
            enemyKills,
            line: `${p.minute}분 킬 스코어 ${myKills}:${enemyKills}, ${dominantName}이(가) 전투 우위를 잡습니다.`
        };
    });

    return {
        myTeam,
        enemyTeam,
        myTeamName: teamDisplayName(myTeam),
        enemyTeamName: teamDisplayName(enemyTeam),
        points,
        finalGoldDiff: cumulativeGold,
        finalMyKills: myKills,
        finalEnemyKills: enemyKills
    };
}

function renderGoldGraphSvg(points) {
    const maxAbs = Math.max(3500, ...points.map((p) => Math.abs(p.goldDiff)));
    const xPos = [20, 110, 200];
    const yMap = (gold) => 68 - ((gold + maxAbs) / (2 * maxAbs)) * 56;
    const polyline = points.map((p, idx) => `${xPos[idx]},${yMap(p.goldDiff).toFixed(1)}`).join(" ");
    const dots = points.map((p, idx) => `<circle cx="${xPos[idx]}" cy="${yMap(p.goldDiff).toFixed(1)}" r="3.5" class="econ-dot"></circle>`).join("");
    const labels = points.map((p, idx) => `<text x="${xPos[idx]}" y="80" text-anchor="middle" class="econ-label">${p.minute}m</text>`).join("");
    return `<svg viewBox="0 0 220 86" class="econ-svg" role="img" aria-label="골드 그래프">
        <line x1="18" y1="68" x2="202" y2="68" class="econ-axis"></line>
        <line x1="18" y1="40" x2="202" y2="40" class="econ-mid"></line>
        <polyline points="${polyline}" class="econ-line"></polyline>
        ${dots}
        ${labels}
    </svg>`;
}

function renderGoldKillSection(res) {
    const sim = buildGoldKillProjection(res);
    return `<div class="econ-wrap">
        <div class="econ-title">자금력 / 전투 결과</div>
        <div class="econ-grid">
            <div class="econ-card">
                <div class="econ-sub">골드 그래프 (스노우볼 반영)</div>
                ${renderGoldGraphSvg(sim.points)}
                <div class="econ-meta">최종 골드 격차: <b>${formatGoldDiff(sim.finalGoldDiff)}</b></div>
            </div>
            <div class="econ-card">
                <div class="econ-sub">킬 스코어 추이</div>
                <div class="econ-kill-list">
                    ${sim.points.map((p) => `<div class="econ-kill-item"><span>${p.minute}분</span><b>${sim.myTeamName} ${p.myKills} : ${p.enemyKills} ${sim.enemyTeamName}</b></div>`).join("")}
                </div>
            </div>
        </div>
    </div>`;
}

function buildNarrationOnlyBody(res) {
    return `
        <div class="sim-wrap">
            <div class="sim-title">10초 경기 시뮬레이션</div>
            ${renderPhaseRowsForPerspective(res)}
            ${renderGoldKillSection(res)}
            <div id="narrator-feed" class="narrator-feed"><div class="narrator-line">해설 준비중...</div></div>
        </div>
    `;
}

function buildSimulationLobbyBody(res) {
    return '<div class="sim-wrap">' +
            '<div class="sim-title">시뮬레이션 준비 완료</div>' +
            '<p style="margin:0 0 10px; color:#c8d7e2; font-size:13px;">밴픽 결과를 바탕으로 10초 해설 시뮬레이션을 시작합니다.</p>' +
            renderPhaseRowsForPerspective(res) +
            renderGoldKillSection(res) +
        '</div>';
}

function getTeamFactorBreakdown(team, res) {
    const own = team === "blue" ? res.b : res.r;
    const enemy = team === "blue" ? res.r : res.b;
    const edgeSign = team === "blue" ? 1 : -1;
    const factors = {
        Stat: ((own.dmg + own.tank) - (enemy.dmg + enemy.tank)) * 0.4,
        CC: (own.cc - enemy.cc) * 1.2,
        Synergy: (res.details?.archetypeEdge || 0) * edgeSign,
        Scaling: (res.details?.scalingEdge || 0) * edgeSign
    };
    let factor = "RawPower";
    let best = -Infinity;
    Object.entries(factors).forEach(([k, v]) => {
        if (v > best) {
            best = v;
            factor = k;
        }
    });
    if (best <= 0) factor = "RawPower";
    return { factor, value: best, factors };
}

function pickMvpChampionKey(team, res, factor) {
    const teamKeys = picks[team].filter(Boolean);
    const own = team === "blue" ? res.b : res.r;
    if (teamKeys.length === 0) return null;
    const dominant = getDominantProfile(own).type;
    const scoreByFactor = (key) => {
        const c = CHAMP_DB[key];
        if (!c) return -Infinity;
        if (factor === "Synergy") {
            const sameTypeBonus = c.profile.type === dominant ? 50 : 0;
            return sameTypeBonus + c.profile.scale * 10 + c.cc;
        }
        if (factor === "CC") return c.cc * 100 + c.profile.scale * 5 + c.tank;
        if (factor === "Scaling") return (c.phase.late + c.dmg) * 10 + c.phase.mid;
        return c.dmg + c.tank;
    };
    return [...teamKeys].sort((a, b) => scoreByFactor(b) - scoreByFactor(a))[0];
}

function getMvpTitleAndReason(champ, factor, team) {
    const teamName = teamDisplayName(team);
    const typeLabel = TYPE_LABEL[champ.profile.type] || "유형";
    const isLateCarry = champ.phase.late >= 8;
    const isEarlyCarry = champ.phase.early >= 8;
    const isTankCore = champ.tank >= 8;
    const isDmgCore = champ.dmg >= 8;

    if (factor === "Synergy") {
        if (champ.profile.type === "Dive") {
            return {
                title: champ.profile.scale >= 3 ? "돌진 선봉장" : "교전 개시자",
                reason: typeLabel + " 중심 조합의 진입 타이밍을 만들어 " + teamName + "의 시너지를 완성했습니다."
            };
        }
        if (champ.profile.type === "Poke") {
            return {
                title: champ.profile.scale >= 3 ? "견제 포격수" : "라인 압박가",
                reason: typeLabel + " 압박을 유지하며 상대 체력을 깎아 한타 전 구도를 유리하게 설계했습니다."
            };
        }
        return {
            title: champ.profile.scale >= 3 ? "반격 지휘관" : "역습 설계자",
            reason: typeLabel + " 구도에서 카운터 타이밍을 정확히 잡아 팀 시너지를 극대화했습니다."
        };
    }

    if (factor === "CC") {
        if (champ.cc >= 3) {
            return {
                title: "군중제어 지배자",
                reason: "핵심 CC 연계로 " + teamName + "의 한타 시작과 마무리를 모두 책임졌습니다."
            };
        }
        if (champ.cc === 2) {
            return {
                title: "교전 메이커",
                reason: "중요 교전마다 이니시 각을 열어 전투 흐름을 주도했습니다."
            };
        }
        return {
            title: "보조 제어자",
            reason: "한정된 CC를 핵심 순간에 정확히 사용해 승리 교두보를 만들었습니다."
        };
    }

    if (factor === "Scaling") {
        if (isLateCarry && isDmgCore) {
            return {
                title: "후반 캐리 코어",
                reason: "후반 파워커브와 화력이 맞물리며 게임의 결정 구간을 장악했습니다."
            };
        }
        if (isLateCarry && isTankCore) {
            return {
                title: "후반 철벽 엔진",
                reason: "후반 생존력으로 전선을 유지해 " + teamName + "의 승리 각을 끝까지 지켰습니다."
            };
        }
        return {
            title: "성장 완성형",
            reason: "시간이 지날수록 전투 가치가 커지며 결정적인 후반 교전에 영향력을 행사했습니다."
        };
    }

    if (isDmgCore && isTankCore) {
        return {
            title: "만능 전투병기",
            reason: "딜링과 탱킹을 동시에 수행하며 모든 교전 국면에서 높은 기여도를 보였습니다."
        };
    }
    if (isDmgCore) {
        return {
            title: isEarlyCarry ? "초반 파괴자" : "화력 핵심",
            reason: "순수 딜링 우위로 교전 피해량 격차를 만들어 승리 확률을 끌어올렸습니다."
        };
    }
    if (isTankCore) {
        return {
            title: "전선 버팀목",
            reason: "높은 탱킹 기여로 전투 지속 시간을 벌어 " + teamName + "의 운영 안정성을 높였습니다."
        };
    }

    return {
        title: "전장의 조율자",
        reason: "기본 전투 지표에서 고른 기여를 보이며 팀 승리에 핵심 역할을 수행했습니다."
    };
}
function buildTeamMvp(team, res) {
    const breakdown = getTeamFactorBreakdown(team, res);
    const key = pickMvpChampionKey(team, res, breakdown.factor);
    if (!key || !CHAMP_DB[key]) return null;
    const champ = CHAMP_DB[key];
    const meta = getMvpTitleAndReason(champ, breakdown.factor, team);
    return {
        key,
        name: champ.name,
        title: meta.title,
        reason: meta.reason
    };
}

function renderTraitResultSection(list) {
    if (!list || list.length === 0) return "<div class=\"trait-empty\">발동된 특성이 없습니다.</div>";
    return list.map((t) => "<div class=\"trait-item\"><b>" + t.champName + " · " + t.traitName + "</b><span>" + t.effectText + "</span></div>").join("");
}

function getFinishPhaseSummary(res, winner) {
    const blueWin = winner === "blue";
    const early = blueWin ? res.phases.earlyWin : (100 - res.phases.earlyWin);
    const mid = blueWin ? res.phases.midWin : (100 - res.phases.midWin);
    const late = blueWin ? res.phases.lateWin : (100 - res.phases.lateWin);

    if (early >= 66 && early >= mid + 6) {
        return { phase: "초반", reason: "초반 우위 " + early.toFixed(1) + "%로 스노우볼을 굴려 빠르게 끝냈습니다." };
    }
    if (mid >= 60 && mid >= late + 4) {
        return { phase: "중반", reason: "중반 한타 우위 " + mid.toFixed(1) + "%를 바탕으로 오브젝트를 연달아 가져가며 마무리했습니다." };
    }
    return { phase: "후반", reason: "후반 운영/한타 우위(후반 " + late.toFixed(1) + "%)로 최종 승부를 결정했습니다." };
}
function buildResultBody(res, winner, loser, seriesEnded) {
    const bComp = getCompLabel(res.b);
    const rComp = getCompLabel(res.r);
    const winnerMvp = buildTeamMvp(winner, res);
    const winnerTeamLabel = winner === "blue" ? "블루팀" : "레드팀";
    const finish = getFinishPhaseSummary(res, winner);
    const strategyEffect = res.strategyCtx && res.strategyCtx.effect ? res.strategyCtx.effect : null;
    const strategyTeamLabel = strategyEffect ? teamDisplayName(strategyEffect.team) : "-";
    const strategyName = strategyEffect ? (STRATEGY_CONFIGS[strategyEffect.strategy]?.label || "전략") : "-";
    const strategyText = strategyEffect ? `${strategyTeamLabel} 전략(${strategyName}) 적합 ${strategyEffect.fit} / 부조화 ${strategyEffect.mismatch} / 보정 ${strategyEffect.winBonus >= 0 ? "+" : ""}${strategyEffect.winBonus.toFixed(1)}` : "전략 보정 없음";
    const winnerRole = winner === userTeam ? "user" : "ai";
    const loserRole = winnerRole === "user" ? "ai" : "user";
    return `
        <p style="color:var(--gold);font-weight:bold;">세트 스코어: ${teamProfile.myTeamName} ${seriesRoleWins.user} : ${seriesRoleWins.ai} ${teamProfile.aiTeamName}</p>\n        <p style="font-size:13px;color:#ffd180;">종료 시점: <b>${finish.phase}</b> | ${finish.reason}</p>
        <p style="font-size:12px;color:#9ec4d9;">전략 적용: ${strategyText}</p>
        <p>🔵 블루팀: ${bComp} (CC ${res.b.cc} / 딜 ${res.b.dmg} / 탱 ${res.b.tank})</p>
        <p style="font-size:13px; color:#cfd8dc;">성향합: 돌진 ${res.b.dive} / 포킹 ${res.b.poke} / 받아치기 ${res.b.anti} | 시간대: 초 ${res.b.early} / 중 ${res.b.mid} / 후 ${res.b.late}</p>
        <p>🔴 레드팀: ${rComp} (CC ${res.r.cc} / 딜 ${res.r.dmg} / 탱 ${res.r.tank})</p>
        <p style="font-size:13px; color:#cfd8dc;">성향합: 돌진 ${res.r.dive} / 포킹 ${res.r.poke} / 받아치기 ${res.r.anti} | 시간대: 초 ${res.r.early} / 중 ${res.r.mid} / 후 ${res.r.late}</p>
        <div class="mvp-wrap single">
            <div class="mvp-card ${winner}">
                <div class="mvp-title">${winnerTeamLabel} MVP</div>
                ${
                    winnerMvp
                        ? `<div class="mvp-head"><img class="mvp-portrait" src="${getChampionImageUrl(winnerMvp.key)}" alt="${winnerMvp.name}" onerror="this.onerror=null;this.src='https://placehold.co/72x72/121c23/c8aa6e?text=${encodeURIComponent(winnerMvp.name)}';"><div class="mvp-name">${winnerMvp.name} (${winnerMvp.title})</div></div><div class="mvp-reason">${winnerMvp.reason}</div>`
                        : `<div class="mvp-name">-</div><div class="mvp-reason">선수 데이터가 없습니다.</div>`
                }
            </div>
        </div>
        <div class="mvp-wrap">
            <div class="mvp-card blue"><div class="mvp-title">블루팀 특성</div>${renderTraitResultSection(res.traitCtx && res.traitCtx.traits && res.traitCtx.traits.blue)}</div>
            <div class="mvp-card red"><div class="mvp-title">레드팀 특성</div>${renderTraitResultSection(res.traitCtx && res.traitCtx.traits && res.traitCtx.traits.red)}</div>
        </div>
        <div class="sim-wrap">
            <div class="sim-title">10초 경기 시뮬레이션</div>
            ${renderPhaseRowsForPerspective(res)}
            ${renderGoldKillSection(res)}
            <div class="narrator-feed"><div class="narrator-line">해설 종료. 결과가 확정되었습니다.</div></div>
        </div>
        <hr style="border-color:#333">
        <h2 style="color:var(--gold)">최종 승리 확률: ${winner === "blue" ? res.bWin.toFixed(1) : (100-res.bWin).toFixed(1)}%</h2>
        <p style="font-size:12px;color:${seriesEnded ? '#ffd180' : '#9fb3c2'};">${seriesEnded ? `시리즈 종료: ${winnerRole === "user" ? teamProfile.myTeamName : teamProfile.aiTeamName} 승리 (${seriesRoleWins[winnerRole]}-${seriesRoleWins[loserRole]})` : (hardFearless ? `다음 SET ${currentGame + 1}에서 하드 피어리스 잠금이 유지됩니다.` : `다음 SET ${currentGame + 1}은 잠금 없이 진행됩니다.`)}</p>
    `;
}

function startResultNarration(res, finalWinner, onComplete) {
    const nextBtn = document.getElementById('result-next-btn');
    const feed = document.getElementById('narrator-feed');
    const lines = buildPhaseCommentary(res, finalWinner);
    let idx = 0;

    nextBtn.disabled = true;
    nextBtn.style.opacity = "0.6";
    nextBtn.innerText = "경기 진행중... 10";
    feed.innerHTML = `<div class="narrator-line">🎙 해설: 밴픽 결과를 바탕으로 시뮬레이션을 시작합니다.</div>`;
    resultFlowState = "simulating";

    if (matchNarrationTimer) clearInterval(matchNarrationTimer);
    matchNarrationTimer = setInterval(() => {
        idx += 1;
        const remain = Math.max(10 - idx, 0);
        const maxNarrationLines = Math.min(lines.length, 9);
        if (idx <= maxNarrationLines) {
            const line = lines[idx - 1];
            feed.innerHTML += `<div class="narrator-line">🎙 ${line}</div>`;
            feed.scrollTop = feed.scrollHeight;
        }
        nextBtn.innerText = remain > 0 ? `경기 진행중... ${remain}` : "결과 계산중...";
        if (idx >= 10) {
            clearInterval(matchNarrationTimer);
            matchNarrationTimer = null;
            if (typeof onComplete === 'function') onComplete();
        }
    }, 1000);
}

function showFinalResult() {
    if (resultFlowState === "ready" || resultFlowState === "simulating" || resultFlowState === "done") return;
    const res = calculateStats();
    pendingSimulationResult = res;
    resultFlowState = "ready";
    const modal = document.getElementById('result-modal');
    modal.style.display = 'flex';

    const nextBtn = document.getElementById('result-next-btn');
    nextBtn.disabled = false;
    nextBtn.style.opacity = "1";
    nextBtn.innerText = "시뮬레이션 시작";

    document.getElementById('winner-text').innerText = "밴픽 완료";
    document.getElementById('winner-text').style.color = "var(--gold)";
    document.getElementById('final-stats').innerHTML = buildSimulationLobbyBody(res);
}

function startSimulationMatch() {
    if (resultFlowState !== "ready" || !pendingSimulationResult) return;
    const res = pendingSimulationResult;
    const simulatedWinner = rollWinnerFromWinRate(res.bWin);
    const nextBtn = document.getElementById('result-next-btn');
    document.getElementById('winner-text').innerText = "경기 시뮬레이션 진행중";
    document.getElementById('winner-text').style.color = "var(--gold)";
    document.getElementById('final-stats').innerHTML = buildNarrationOnlyBody(res);
    nextBtn.disabled = true;
    nextBtn.style.opacity = "0.6";
    nextBtn.innerText = "경기 진행중... 10";

    startResultNarration(res, simulatedWinner, () => {
        const winner = simulatedWinner;
        const loser = winner === "blue" ? "red" : "blue";
        const winnerRole = winner === userTeam ? "user" : "ai";
        const loserRole = winnerRole === "user" ? "ai" : "user";

        seriesWins[winner] += 1;
        seriesRoleWins[winnerRole] += 1;
        if (hardFearless) {
            [...picks.blue, ...picks.red].forEach((key) => { if (key) fearlessLocked.add(key); });
        }
        updateSeriesInfo();
        renderLockedChamps();

        const seriesEnded = seriesRoleWins[winnerRole] >= winTarget || currentGame >= maxGames;
        lastSeriesEnded = seriesEnded;
        if (seriesEnded) {
            const userWonSeries = winnerRole === "user";
            updateModeRecord(userWonSeries);
            recordMatchHistory({
                playedAt: Date.now(),
                modeKey: selectedModeKey,
                modeLabel: MODE_CONFIGS[selectedModeKey].label,
                winnerTeam: winnerRole === "user" ? teamProfile.myTeamName : teamProfile.aiTeamName,
                loserTeam: loserRole === "user" ? teamProfile.myTeamName : teamProfile.aiTeamName,
                scoreText: `${teamProfile.myTeamName} ${seriesRoleWins.user} : ${seriesRoleWins.ai} ${teamProfile.aiTeamName}`,
                strategyLabel: STRATEGY_CONFIGS[selectedStrategyKey]?.label || "-"
            });
        }

        document.getElementById('winner-text').innerText = winner.toUpperCase() + " SET WIN";
        document.getElementById('winner-text').style.color = winner === "blue" ? "var(--blue)" : "var(--red)";
        document.getElementById('final-stats').innerHTML = buildResultBody(res, winner, loser, seriesEnded);
        nextBtn.disabled = false;
        nextBtn.style.opacity = "1";
        nextBtn.innerText = seriesEnded ? "새 시리즈 시작" : "다음 세트 시작";
        resultFlowState = "done";
    });
}

function handleNextAction() {
    if (resultFlowState === "ready") {
        startSimulationMatch();
        return;
    }
    if (resultFlowState === "simulating") return;
    if (matchNarrationTimer) {
        clearInterval(matchNarrationTimer);
        matchNarrationTimer = null;
    }
    document.getElementById('result-modal').style.display = 'none';
    pendingSimulationResult = null;
    resultFlowState = "idle";
    if (lastSeriesEnded) {
        userTeam = null;
        aiTeam = null;
        openHome();
        return;
    }
    // 하드 피어리스 다전제에서는 세트마다 진영 자동 교대
    if (hardFearless && maxGames > 1) {
        userTeam = userTeam === "blue" ? "red" : "blue";
    }
    aiTeam = userTeam === "blue" ? "red" : "blue";
    currentGame += 1;
    renderStrategyModal();
    setDisplayById("strategy-modal", "flex");
}

function showTooltip(e, txt) {
    const tip = document.getElementById('tooltip');
    tip.innerHTML = `<button type="button" class="tip-close" onclick="hideTooltip()">닫기</button>${txt}`;
    tip.style.display = 'block';
    moveTooltip(e);
}
function moveTooltip(e) {
    const tip = document.getElementById('tooltip');
    if (tip.style.display !== 'block') return;
    const pad = 14;
    const tipRect = tip.getBoundingClientRect();
    let left = e.clientX + pad;
    let top = e.clientY + pad;
    if (left + tipRect.width > window.innerWidth - pad) left = e.clientX - tipRect.width - pad;
    if (top + tipRect.height > window.innerHeight - pad) top = e.clientY - tipRect.height - pad;
    if (left < pad) left = pad;
    if (top < pad) top = pad;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
}
function hideTooltip() { document.getElementById('tooltip').style.display = 'none'; }

function closeTutorial() {
    document.getElementById('tutorial-modal').style.display = 'none';
}

init();
