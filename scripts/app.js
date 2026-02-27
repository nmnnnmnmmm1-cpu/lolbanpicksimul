// Runtime logic (champion raw data is loaded from data/champions.js)
const CDN_VERSION = "14.24.1";
const CHAMP_IMG_KEY_MAP = {
    Ksante: "KSante"
};
const CUSTOM_CHAMP_IMG_MAP = {
    Yunara: "https://i.namu.wiki/i/ZQDhyfCrBAAUO5z3uzf3hEVFgm91ZgpSgKIvrPZ_e8b1onFSIBhTYSf6dh_7jNzZ29GD7REwGlBmCa_jsKInLA.webp",
    Jahen: "https://i.namu.wiki/i/-t-BQEioe2UV_OlqmYLkBScLVwk0Ilg-aoluyjYsSWup9rEN5DF4Vq70GoAgHJPC0FoMcw1REcmM_iCRCmyQ0Q.webp"
};
const TYPE_LABEL = {
    Dive: "돌진",
    Poke: "포킹",
    Anti: "받아치기"
};
const TRAIT_DB = (typeof globalThis !== "undefined" && globalThis.CHAMP_TRAIT_UI && typeof globalThis.CHAMP_TRAIT_UI === "object")
    ? globalThis.CHAMP_TRAIT_UI
    : {};

// 조건 난이도 기반 보정 테이블
const TRAIT_RULE_TABLE = {
    easy: { statScale: 0.9, winScale: 0.85, debuffScale: 0.8, statCap: 6, winCap: 7, debuffCap: 12 },
    medium: { statScale: 1.0, winScale: 1.0, debuffScale: 1.0, statCap: 7, winCap: 8, debuffCap: 12 },
    hard: { statScale: 1.1, winScale: 1.1, debuffScale: 1.05, statCap: 8, winCap: 10, debuffCap: 14 }
};

const TRAIT_DIFFICULTY_MAP = {
    "리신|솔랭 박살": "hard",
    "니달리|핵창": "medium",
    "세주아니|빙결 저항": "medium",
    "엘리스|렛츠 다이브": "hard",
    "바이|기동타격 연계": "hard",
    "마오카이|대자연의 마력": "hard",
    "아이번|숲의 친구": "medium",
    "녹턴|일단 불꺼": "hard",
    "헤카림|돌격하라": "easy",
    "킨드레드|그건 제 정글이에요": "medium",
    "트런들|안티 탱커": "medium",
    "카직스|메뚜기 월드": "medium",
    "람머스|가시 갑옷": "easy",
    "말파이트|가시 갑옷": "easy",
    "라칸|커플": "hard",
    "나미|근본 조합": "hard",
    "룰루|요정의 친구": "hard",
    "유미|완벽한 밀착": "medium",
    "밀리오|아늑한 캠프파이어": "medium",
    "브라움|프렐요드의 방패": "hard",
    "노틸러스|심해의 압박": "hard",
    "카르마|렛츠 두 포킹": "hard",
    "타릭|우주의 광휘": "hard",
    "카사딘|못 버티겠어": "medium",
    "피오라|치명적인 검무": "medium",
    "벡스|우울": "medium",
    "모르가나|블쉴좀 써라": "medium",
    "베인|탱커 사냥": "medium",
    "시비르|사냥 개시": "medium",
    "직스|포탑부터 지켜": "easy",
    "아지르|넘겨잇": "medium",
    "블리츠크랭크|이게 끌리네": "hard",
    "오른|간이 대장간": "easy",
    "갱플랭크|화약통": "hard",
    "야스오|탑님 말파 가능?": "hard",
    "리산드라|얼음 무덤": "medium",
    "질리언|시간 역행": "easy",
    "오리아나|내 공을 부탁해": "medium",
    "스몰더|쌍포": "hard",
    "갈리오|안티 AP": "medium"
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

function toRomanScale(scale) {
    const n = Math.max(1, Math.min(3, Number(scale) || 1));
    if (n === 1) return "I";
    if (n === 2) return "II";
    return "III";
}

function normalizeNameToken(v) {
    return String(v || "").toLowerCase().replace(/\s+/g, "");
}

function escapeHtml(v) {
    return String(v || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function roundToOne(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Number(n.toFixed(1));
}

function formatNum(value) {
    const v = roundToOne(value);
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function getChampionFallbackImageUrl(label = "CHAMP") {
    const raw = String(label || "CHAMP").slice(0, 12);
    const safe = raw.replace(/[&<>"']/g, "");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#1b2a34'/><stop offset='100%' stop-color='#0f171e'/></linearGradient></defs><rect width='120' height='120' fill='url(#g)'/><rect x='4' y='4' width='112' height='112' fill='none' stroke='#c8aa6e' stroke-opacity='0.6'/><text x='60' y='66' text-anchor='middle' fill='#e6d3a3' font-size='16' font-family='Arial,sans-serif'>${safe}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getTraitsByChampionName(champName) {
    const direct = TRAIT_DB[champName];
    if (direct) return direct;
    const target = normalizeNameToken(champName);
    const normalizedKey = Object.keys(TRAIT_DB).find((k) => normalizeNameToken(k) === target);
    return normalizedKey ? TRAIT_DB[normalizedKey] : [];
}

function conditionMentionsChampion(conditionText, champName) {
    const raw = String(conditionText || "");
    const target = String(champName || "");
    if (!raw || !target) return false;
    if (raw.includes(target)) return true;
    const normalize = (v) => String(v || "").toLowerCase().replace(/\s+/g, "");
    return normalize(raw).includes(normalize(target));
}

function getLinkedTraitsByChampionName(champName) {
    const target = String(champName || "");
    if (!target || !TRAIT_DB || typeof TRAIT_DB !== "object") return [];
    const out = [];
    const targetNorm = normalizeNameToken(target);
    Object.entries(TRAIT_DB).forEach(([ownerName, list]) => {
        if (normalizeNameToken(ownerName) === targetNorm) return;
        (Array.isArray(list) ? list : []).forEach((trait) => {
            if (!trait || !conditionMentionsChampion(trait.condition, target)) return;
            out.push({
                champName: ownerName,
                name: trait.name || "연계 특성",
                condition: trait.condition || "발동 조건 충족",
                effect: trait.effect || "효과 데이터 없음"
            });
        });
    });
    return out;
}

function getTraitRule(champName, traitName) {
    const level = TRAIT_DIFFICULTY_MAP[`${champName}|${traitName}`] || "medium";
    const rule = TRAIT_RULE_TABLE[level] || TRAIT_RULE_TABLE.medium;
    return { level, ...rule };
}

function scaleTraitStatDelta(champName, traitName, delta) {
    const rule = getTraitRule(champName, traitName);
    const out = {};
    Object.entries(delta || {}).forEach(([k, raw]) => {
        if (!Number.isFinite(raw)) return;
        if (raw > 0) {
            out[k] = Math.min(raw * rule.statScale, rule.statCap);
        } else if (raw < 0) {
            out[k] = -Math.min(Math.abs(raw) * rule.debuffScale, rule.debuffCap);
        } else {
            out[k] = 0;
        }
    });
    return out;
}

function scaleTraitWinDelta(champName, traitName, value) {
    if (!Number.isFinite(value)) return 0;
    const rule = getTraitRule(champName, traitName);
    if (value >= 0) return Math.min(value * rule.winScale, rule.winCap);
    return -Math.min(Math.abs(value) * rule.winScale, rule.winCap);
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

    let pos = Array.isArray(champ.pos) ? champ.pos.filter((p) => VALID_POSITIONS.has(p)) : [];
    if (pos.length === 0) {
        const pos0 = Array.isArray(champ.pos) ? champ.pos[0] : null;
        warnInvalidField(key, "pos", champ.pos, ["MID"]);
        if (VALID_POSITIONS.has(pos0)) pos = [pos0];
        else pos = ["MID"];
    } else {
        pos = [...new Set(pos)];
    }

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
        pos,
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
const CHAMPION_NAMES_KO_DESC = [...new Set(CHAMP_KEYS.map((k) => CHAMP_DB[k]?.name).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
const WORLDS_NAME_ALIAS = {
    "리신": "리신",
    "신짜오": "신짜오",
    "자르반": "자르반 4세",
    "자르반4세": "자르반 4세",
    "트페": "트위스티드페이트",
    "아솔": "아우렐리온 솔"
};

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
let shouldResetOnStrategyConfirm = true;
let pendingAction = null;
let matchNarrationTimer = null;
let pendingSimulationResult = null;
let resultFlowState = "idle"; // idle | ready | simulating | done
const MODE_RECORDS_KEY = "lol_draft_mode_records_v1";
const TEAM_PROFILE_KEY = "lol_draft_team_profile_v1";
const MATCH_HISTORY_KEY = "lol_draft_match_history_v1";
const TRAIT_ANALYTICS_KEY = "lol_trait_analytics_v1";
const REMOTE_CONFIG_KEY = "lol_remote_history_config_v1";
const MAX_MATCH_HISTORY = 80;
const DEFAULT_BLUE_COLOR = "#00a3ff";
const DEFAULT_RED_COLOR = "#e74c3c";
const AI_SHORTLIST_PICK = 18;
const AI_SHORTLIST_BAN = 24;
const AI_IMMEDIATE_WEIGHT = 0.6;
const AI_RESPONSE_WEIGHT = 0.4;
const AI_THINK_MIN_MS = 1000;
const AI_THINK_MAX_MS = 5000;
const WORLDS_CHALLENGE_STAGES = [
    { key: "QF", label: "8강", bestOf: 1, fearless: false },
    { key: "SF", label: "4강", bestOf: 3, fearless: true },
    { key: "F", label: "결승", bestOf: 5, fearless: true }
];
let homeActionBound = false;
let seriesDraftStats = { picks: [], bans: [] };
let worldsChallengeState = {
    selectionRandom: true,
    userTeamId: "",
    manualLck: ["", "", ""],
    manualIntl: ["", "", "", ""],
    participants: [],
    rounds: [],
    logs: [],
    running: false
};
let aiBalanceSimRunning = false;
const MODE_CONFIGS = {
    single: { label: "단판", maxGames: 1, winTarget: 1, hardFearless: false },
    bo3: { label: "3전제 (하드피어리스)", maxGames: 3, winTarget: 2, hardFearless: true },
    bo5: { label: "5전제 (하드피어리스)", maxGames: 5, winTarget: 3, hardFearless: true }
};
const STRATEGY_CONFIGS = {
    General: {
        key: "General",
        label: "일반적",
        desc: "유형 선호 없이 조합 밸런스를 우선합니다. (보정 없음)"
    },
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
        body: "이 게임은 리그 오브 레전드 밴픽 시뮬레이션으로 승패를 가르는 게임입니다.\n\n핵심은 단순 스탯 합이 아니라 조합 완성도입니다."
    },
    {
        title: "기본 스탯 구성",
        body: "각 챔피언은 아래 정보를 가집니다.\n- 딜링 / 탱킹 / CC\n- 데미지 유형(AD/AP/하이브리드)\n- 조합 유형(돌진/포킹/받아치기)\n- 파워커브(초반/중반/후반)"
    },
    {
        title: "1. 딜링 & 탱킹 스탯",
        body: "각 챔피언은 1~10 공격/방어 수치를 가집니다.\n\n- 개인 수치가 높을수록 기대승률이 오릅니다.\n- 하지만 팀 총합의 균형이 더 중요합니다.\n- 5인 합계 기준 딜링 또는 탱킹이 20 미만이면 큰 페널티를 받습니다."
    },
    {
        title: "2. CC기 스탯",
        body: "챔피언당 CC는 0~3 단계입니다.\n\n- 팀 CC 합계 5 이하: 교전 개시/연계가 부족해 승률이 크게 떨어집니다.\n- 팀 CC 합계 10 이상: 한타 안정성이 크게 올라갑니다."
    },
    {
        title: "3. 데미지 밸런스 (AD/AP)",
        body: "챔피언은 AD / AP / 하이브리드 중 하나입니다.\n\n- 공격 스탯을 가중치로 AD/AP 비율을 계산합니다.\n- 한쪽으로 과도하게 치우치면 상대 방어 아이템에 카운터를 당합니다.\n- AD/AP를 적절히 섞을수록 안정적인 승률을 기대할 수 있습니다."
    },
    {
        title: "4. 챔피언 상성 (유형)",
        body: "상성 구조는 [돌진 > 포킹 > 받아치기 > 돌진] 입니다.\n\n- 유형 수치가 높을수록 상성 이득/손해 폭이 커집니다.\n- 수치가 낮으면 상성 영향이 줄어듭니다.\n- 동점형 조합은 장점이 분산되어 결정력이 약해질 수 있습니다."
    },
    {
        title: "5. 파워 커브",
        body: "챔피언마다 전성기(초/중/후반)가 다릅니다.\n\n초반 격차가 크면 스노우볼로 빠르게 끝날 수 있고,\n후반 밸류가 높으면 역전 각이 만들어질 수 있습니다."
    },
    {
        title: "마무리",
        body: "그럼 즐거운 게임 되세요!"
    }
];
let tutorialStepIndex = 0;
let modeRecords = loadModeRecords();
let selectedStrategyKey = "General";
let teamProfile = loadTeamProfile();
let matchHistory = loadMatchHistory();
let remoteConfig = loadRemoteConfig();
let remoteMatchHistory = [];
let remoteSyncing = false;
let traitAnalytics = loadTraitAnalytics();
let worldsModeEnabled = false;
let worldsTeams = [];
let worldsPlayers = [];
let worldsRosters = [];
let worldsConfig = { myTeamId: "", enemyTeamId: "" };

function getChampionImageUrl(key) {
    if (CUSTOM_CHAMP_IMG_MAP[key]) {
        return CUSTOM_CHAMP_IMG_MAP[key];
    }
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

function hoistModalToBody(id) {
    const el = document.getElementById(id);
    if (!el || !document.body) return;
    if (el.parentElement !== document.body) {
        document.body.appendChild(el);
    }
}

function renderHomeWorldsTeamPanel() {
    const panel = document.getElementById("home-worlds-team-panel");
    const setup = document.getElementById("home-team-setup");
    const title = document.getElementById("home-worlds-team-title");
    const rosterWrap = document.getElementById("home-worlds-roster");
    if (!panel || !setup || !title || !rosterWrap) return;

    const active = !!(worldsModeEnabled && worldsConfig.myTeamId);
    setup.classList.toggle("hidden", active);
    panel.classList.toggle("hidden", !active);
    if (!active) {
        rosterWrap.innerHTML = "";
        return;
    }

    const myTeam = getWorldsTeamById(worldsConfig.myTeamId);
    const myRoster = getWorldsRosterByTeamId(worldsConfig.myTeamId);
    title.innerText = `${myTeam?.name || "내 팀"} 로스터`;
    if (!myRoster || !myRoster.players) {
        rosterWrap.innerHTML = '<div class="home-empty">로스터 데이터가 없습니다.</div>';
        return;
    }

    rosterWrap.innerHTML = POSITIONS.map((pos) => {
        const playerId = myRoster.players[pos];
        const player = getWorldsPlayerById(playerId);
        if (!player) {
            return `<div class="home-worlds-player"><div class="home-worlds-player-head"><b>${pos}</b></div><span>선수 정보 없음</span></div>`;
        }
        const sig = (player.signatureChamps || []).slice(0, 3).join(", ");
        const photo = player.photo || getWorldsPlayerPhotoFallback(player);
        return `<div class="home-worlds-player"><div class="home-worlds-player-head"><img src="${photo}" alt="${player.nick}" onerror="this.onerror=null;this.src='${getWorldsPlayerPhotoFallback(player)}';"><b>${pos} ${escapeHtml(player.nick)}</b></div><span>${escapeHtml(sig || "시그니처 없음")}</span></div>`;
    }).join("");
}

function requestWorldsTeamChange() {
    if (!worldsModeEnabled) {
        openWorldsModal();
        return;
    }
    teamProfile.worldsTeamLocked = false;
    saveTeamProfile();
    openWorldsModal(true);
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
    const fallback = { myTeamName: "MY TEAM", aiTeamName: "AI TEAM", worldsTeamLocked: false };
    try {
        const raw = localStorage.getItem(TEAM_PROFILE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return {
            myTeamName: (parsed.myTeamName || "").trim() || fallback.myTeamName,
            aiTeamName: (parsed.aiTeamName || "").trim() || fallback.aiTeamName,
            worldsTeamLocked: !!parsed.worldsTeamLocked
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

function loadRemoteConfig() {
    const fallback = {
        enabled: false,
        supabaseUrl: "",
        anonKey: ""
    };
    try {
        const raw = localStorage.getItem(REMOTE_CONFIG_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return fallback;
        const supabaseUrl = String(parsed.supabaseUrl || "").trim();
        const anonKey = String(parsed.anonKey || "").trim();
        return {
            enabled: !!parsed.enabled && !!supabaseUrl && !!anonKey,
            supabaseUrl,
            anonKey
        };
    } catch (_) {
        return fallback;
    }
}

function saveRemoteConfig() {
    try {
        localStorage.setItem(REMOTE_CONFIG_KEY, JSON.stringify(remoteConfig));
    } catch (_) {
        // Ignore storage failures.
    }
}

function normalizeSupabaseUrl(url) {
    return String(url || "").trim().replace(/\/+$/, "");
}

function isRemoteHistoryEnabled() {
    return !!(remoteConfig.enabled && remoteConfig.supabaseUrl && remoteConfig.anonKey);
}

function setRemoteStatus(text, tone = "neutral") {
    const el = document.getElementById("remote-status");
    if (!el) return;
    el.innerText = text;
    el.classList.remove("ok", "err");
    if (tone === "ok") el.classList.add("ok");
    if (tone === "err") el.classList.add("err");
}

function applyRemoteConfigInputs() {
    const urlInput = document.getElementById("remote-url");
    const keyInput = document.getElementById("remote-anon-key");
    if (urlInput) urlInput.value = remoteConfig.supabaseUrl || "";
    if (keyInput) keyInput.value = remoteConfig.anonKey || "";
    if (isRemoteHistoryEnabled()) {
        setRemoteStatus("온라인 기록: 연결됨 (Supabase)", "ok");
    } else {
        setRemoteStatus("온라인 기록: 비활성", "neutral");
    }
}

function getRemoteHeaders(jsonBody = false) {
    const headers = {
        apikey: remoteConfig.anonKey,
        Authorization: `Bearer ${remoteConfig.anonKey}`
    };
    if (jsonBody) headers["Content-Type"] = "application/json";
    return headers;
}

function normalizeHistoryEntry(entry, source = "local") {
    const payload = entry && typeof entry === "object" ? entry : {};
    return {
        playedAt: Number(payload.playedAt || payload.createdAt || Date.now()),
        modeKey: payload.modeKey || "",
        modeLabel: payload.modeLabel || payload.mode || "-",
        winnerTeam: payload.winnerTeam || payload.winner || "UNKNOWN",
        loserTeam: payload.loserTeam || "",
        scoreText: payload.scoreText || payload.score_text || "-",
        strategyLabel: payload.strategyLabel || "-",
        winnerSide: payload.winnerSide || "",
        loserSide: payload.loserSide || "",
        pickKeys: Array.isArray(payload.pickKeys) ? payload.pickKeys : [],
        banKeys: Array.isArray(payload.banKeys) ? payload.banKeys : [],
        bluePickKeys: Array.isArray(payload.bluePickKeys) ? payload.bluePickKeys : [],
        redPickKeys: Array.isArray(payload.redPickKeys) ? payload.redPickKeys : [],
        localMatchId: payload.localMatchId || "",
        remoteId: payload.remoteId || "",
        source
    };
}

function getAllHistoryRows() {
    const combined = [
        ...matchHistory.map((entry) => normalizeHistoryEntry(entry, "local")),
        ...remoteMatchHistory.map((entry) => normalizeHistoryEntry(entry, "remote"))
    ];
    const seen = new Set();
    const out = [];
    combined.forEach((row) => {
        const key = row.localMatchId
            ? `lid:${row.localMatchId}`
            : (row.remoteId
                ? `rid:${row.remoteId}`
                : `sig:${row.playedAt}|${row.scoreText}|${row.winnerTeam}`);
        if (seen.has(key)) return;
        seen.add(key);
        out.push(row);
    });
    out.sort((a, b) => b.playedAt - a.playedAt);
    return out;
}

async function refreshRemoteHistory() {
    if (!isRemoteHistoryEnabled()) {
        remoteMatchHistory = [];
        setRemoteStatus("온라인 기록: 비활성", "neutral");
        renderHomeHistory();
        return;
    }
    if (remoteSyncing) return;
    remoteSyncing = true;
    setRemoteStatus("온라인 기록: 서버에서 불러오는 중...", "neutral");
    try {
        const base = normalizeSupabaseUrl(remoteConfig.supabaseUrl);
        const query = "select=id,created_at,player_name,team_name,mode,winner,score_text,payload&order=created_at.desc&limit=200";
        const res = await fetch(`${base}/rest/v1/match_logs?${query}`, {
            method: "GET",
            headers: getRemoteHeaders(false),
            cache: "no-store"
        });
        if (!res.ok) {
            const errTxt = await res.text();
            throw new Error(`load failed ${res.status}: ${errTxt.slice(0, 160)}`);
        }
        const rows = await res.json();
        remoteMatchHistory = (Array.isArray(rows) ? rows : []).map((row) => {
            const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
            return normalizeHistoryEntry({
                playedAt: Date.parse(row.created_at || "") || Date.now(),
                modeLabel: row.mode || payload.modeLabel || "-",
                winnerTeam: row.winner || payload.winnerTeam || "UNKNOWN",
                loserTeam: payload.loserTeam || "",
                scoreText: row.score_text || payload.scoreText || "-",
                strategyLabel: payload.strategyLabel || "-",
                winnerSide: payload.winnerSide || "",
                loserSide: payload.loserSide || "",
                pickKeys: payload.pickKeys || [],
                banKeys: payload.banKeys || [],
                bluePickKeys: payload.bluePickKeys || [],
                redPickKeys: payload.redPickKeys || [],
                localMatchId: payload.localMatchId || "",
                remoteId: row.id || ""
            }, "remote");
        });
        setRemoteStatus(`온라인 기록: 연결됨 (${remoteMatchHistory.length}건 로드)`, "ok");
        renderHomeHistory();
    } catch (err) {
        console.warn("[REMOTE] history load failed", err);
        setRemoteStatus(`온라인 기록 오류: ${err.message}`, "err");
    } finally {
        remoteSyncing = false;
    }
}

async function uploadRemoteMatchHistory(entry) {
    if (!isRemoteHistoryEnabled() || !entry) return;
    try {
        const base = normalizeSupabaseUrl(remoteConfig.supabaseUrl);
        const payload = {
            localMatchId: entry.localMatchId || "",
            modeKey: entry.modeKey || "",
            modeLabel: entry.modeLabel || "",
            winnerTeam: entry.winnerTeam || "",
            loserTeam: entry.loserTeam || "",
            scoreText: entry.scoreText || "",
            strategyLabel: entry.strategyLabel || "",
            winnerSide: entry.winnerSide || "",
            loserSide: entry.loserSide || "",
            pickKeys: Array.isArray(entry.pickKeys) ? entry.pickKeys : [],
            banKeys: Array.isArray(entry.banKeys) ? entry.banKeys : [],
            bluePickKeys: Array.isArray(entry.bluePickKeys) ? entry.bluePickKeys : [],
            redPickKeys: Array.isArray(entry.redPickKeys) ? entry.redPickKeys : []
        };
        const body = {
            player_name: teamProfile.myTeamName || "MY TEAM",
            team_name: teamProfile.myTeamName || "MY TEAM",
            mode: entry.modeLabel || "-",
            winner: entry.winnerTeam || "-",
            score_text: entry.scoreText || "-",
            payload
        };
        const res = await fetch(`${base}/rest/v1/match_logs`, {
            method: "POST",
            headers: {
                ...getRemoteHeaders(true),
                Prefer: "return=minimal"
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const errTxt = await res.text();
            throw new Error(`upload failed ${res.status}: ${errTxt.slice(0, 160)}`);
        }
        setRemoteStatus("온라인 기록: 업로드 성공", "ok");
        refreshRemoteHistory();
    } catch (err) {
        console.warn("[REMOTE] upload failed", err);
        setRemoteStatus(`온라인 업로드 실패: ${err.message}`, "err");
    }
}

function disableRemoteHistory() {
    remoteConfig = { enabled: false, supabaseUrl: "", anonKey: "" };
    saveRemoteConfig();
    remoteMatchHistory = [];
    applyRemoteConfigInputs();
    updateWorldsChallengeButtonState();
    renderHomeHistory();
}

async function saveRemoteConfigFromInputs() {
    const urlInput = document.getElementById("remote-url");
    const keyInput = document.getElementById("remote-anon-key");
    const url = normalizeSupabaseUrl(urlInput ? urlInput.value : "");
    const key = String(keyInput ? keyInput.value : "").trim();
    if (!url || !key) {
        setRemoteStatus("URL/Anon key를 모두 입력해야 합니다.", "err");
        return;
    }
    remoteConfig = {
        enabled: true,
        supabaseUrl: url,
        anonKey: key
    };
    saveRemoteConfig();
    applyRemoteConfigInputs();
    await refreshRemoteHistory();
}

function loadTraitAnalytics() {
    const empty = { totalGames: 0, autoSamples: 0, byTrait: {} };
    try {
        const raw = localStorage.getItem(TRAIT_ANALYTICS_KEY);
        if (!raw) return empty;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return empty;
        if (!parsed.byTrait || typeof parsed.byTrait !== "object") parsed.byTrait = {};
        if (!Number.isFinite(parsed.totalGames)) parsed.totalGames = 0;
        if (!Number.isFinite(parsed.autoSamples)) parsed.autoSamples = 0;
        return parsed;
    } catch (_) {
        return empty;
    }
}

function saveTraitAnalytics() {
    try {
        localStorage.setItem(TRAIT_ANALYTICS_KEY, JSON.stringify(traitAnalytics));
    } catch (_) {
        // Ignore storage failures.
    }
}

async function loadWorldsData() {
    const loadJson = async (path) => {
        const res = await fetch(path, { cache: "no-store" });
        if (!res.ok) throw new Error(`${path} load failed: ${res.status}`);
        return res.json();
    };
    try {
        const [teams, players, rosters] = await Promise.all([
            loadJson("data/teams.json?v=20260224-9"),
            loadJson("data/players.json?v=20260228-01"),
            loadJson("data/worlds_roster.json?v=20260224-9")
        ]);
        worldsTeams = Array.isArray(teams) ? teams : [];
        worldsPlayers = Array.isArray(players) ? players.map((p) => ({
            ...p,
            signatureChamps: (p.signatureChamps || []).map((nm) => normalizeWorldsChampionName(nm))
        })) : [];
        worldsRosters = Array.isArray(rosters) ? rosters : [];
    } catch (err) {
        worldsTeams = [];
        worldsPlayers = [];
        worldsRosters = [];
        console.warn("[WORLDS] 데이터 로드 실패", err);
    }
}

function getWorldsTeamById(teamId) {
    return worldsTeams.find((t) => t.id === teamId) || null;
}

function getWorldsPlayerById(playerId) {
    return worldsPlayers.find((p) => p.id === playerId) || null;
}

function getWorldsRosterByTeamId(teamId) {
    return worldsRosters.find((r) => r.teamId === teamId) || null;
}

function getWorldsTeamColor(team, fallback) {
    return team?.primaryColor || team?.secondaryColor || fallback;
}

function applyWorldsTeamColors() {
    const root = document.documentElement;
    if (!root) return;
    if (!worldsModeEnabled || !userTeam) {
        root.style.setProperty("--blue", DEFAULT_BLUE_COLOR);
        root.style.setProperty("--red", DEFAULT_RED_COLOR);
        return;
    }
    const blueTeamId = userTeam === "blue" ? worldsConfig.myTeamId : worldsConfig.enemyTeamId;
    const redTeamId = userTeam === "red" ? worldsConfig.myTeamId : worldsConfig.enemyTeamId;
    const blueTeam = getWorldsTeamById(blueTeamId);
    const redTeam = getWorldsTeamById(redTeamId);
    root.style.setProperty("--blue", getWorldsTeamColor(blueTeam, DEFAULT_BLUE_COLOR));
    root.style.setProperty("--red", getWorldsTeamColor(redTeam, DEFAULT_RED_COLOR));
}

function getWorldsTeamIdBySideForUi(side) {
    if (!worldsModeEnabled || !userTeam) return "";
    if (side === userTeam) return worldsConfig.myTeamId || "";
    return worldsConfig.enemyTeamId || "";
}

function getPlayerPhotoFallbackByNick(nick, size = 36) {
    const txt = encodeURIComponent(String(nick || "P").slice(0, 2));
    return `https://placehold.co/${size}x${size}/101820/c8aa6e?text=${txt}`;
}

function getWorldsPlayerPhotoFallback(player) {
    return getPlayerPhotoFallbackByNick(player?.nick || "P", 36);
}

function getWorldsTeamIdByTeam(teamSide) {
    if (!worldsModeEnabled || !userTeam) return "";
    return teamSide === userTeam ? (worldsConfig.myTeamId || "") : (worldsConfig.enemyTeamId || "");
}

function renderWorldsSlotHints() {
    ["blue", "red"].forEach((side) => {
        const teamId = getWorldsTeamIdBySideForUi(side);
        const roster = getWorldsRosterByTeamId(teamId);
        POSITIONS.forEach((pos, idx) => {
            const slot = document.getElementById(`${side[0]}-slot-${idx}`);
            if (!slot) return;
            const noteEl = slot.querySelector(".player-note");
            const chipEl = slot.querySelector(".player-chip");
            const photoEl = slot.querySelector(".player-photo");
            const nickEl = slot.querySelector(".player-nick");
            if (!noteEl || !chipEl || !photoEl || !nickEl) return;
            if (!worldsModeEnabled || !roster || !roster.players) {
                noteEl.innerText = "";
                chipEl.classList.add("off");
                return;
            }
            const playerId = roster.players[pos];
            const player = getWorldsPlayerById(playerId);
            if (!player) {
                noteEl.innerText = "";
                chipEl.classList.add("off");
                return;
            }
            const champs = (player.signatureChamps || []).slice(0, 3).join(", ");
            nickEl.innerText = player.nick || "-";
            photoEl.src = player.photo || getWorldsPlayerPhotoFallback(player);
            photoEl.alt = player.nick || "PLAYER";
            photoEl.onerror = () => {
                photoEl.onerror = null;
                photoEl.src = getWorldsPlayerPhotoFallback(player);
            };
            noteEl.innerText = champs ? `주챔: ${champs}` : "";
            chipEl.classList.remove("off");
        });
    });
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
    updateObjectiveBrief(0, 0, 0, 0, teamProfile.myTeamName, teamProfile.aiTeamName);
    renderHomeWorldsTeamPanel();
    renderHomeHistory();
}

function applyTeamNameInputs() {
    const myInput = document.getElementById("my-team-name");
    const aiInput = document.getElementById("ai-team-name");
    if (!myInput || !aiInput) return;
    myInput.value = teamProfile.myTeamName;
    aiInput.value = teamProfile.aiTeamName;
    updateObjectiveBrief(0, 0, 0, 0, teamProfile.myTeamName, teamProfile.aiTeamName);
    renderHomeWorldsTeamPanel();
}

function recordMatchHistory(entry) {
    const safeEntry = normalizeHistoryEntry({
        ...entry,
        localMatchId: entry?.localMatchId || `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    }, "local");
    matchHistory.unshift(safeEntry);
    matchHistory = matchHistory.slice(0, MAX_MATCH_HISTORY);
    saveMatchHistory();
    uploadRemoteMatchHistory(safeEntry);
}

function getRankingRows(rows = null) {
    const sourceRows = Array.isArray(rows) ? rows : getAllHistoryRows();
    const map = {};
    sourceRows.forEach((entry) => {
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

function getChampionDisplayNameByKey(key) {
    return CHAMP_DB[key]?.name || key || "-";
}

function getDraftStatsRows(limit = 8, rows = null) {
    const sourceRows = Array.isArray(rows) ? rows : getAllHistoryRows();
    const pickMap = {};
    const banMap = {};
    let totalPickCount = 0;
    let totalBanCount = 0;
    sourceRows.forEach((entry) => {
        const pickKeys = Array.isArray(entry.pickKeys) ? entry.pickKeys : [];
        const banKeys = Array.isArray(entry.banKeys) ? entry.banKeys : [];
        pickKeys.forEach((k) => {
            if (!k) return;
            pickMap[k] = (pickMap[k] || 0) + 1;
            totalPickCount += 1;
        });
        banKeys.forEach((k) => {
            if (!k) return;
            banMap[k] = (banMap[k] || 0) + 1;
            totalBanCount += 1;
        });
    });
    const sortRows = (mapObj) => Object.keys(mapObj).map((key) => ({ key, name: getChampionDisplayNameByKey(key), count: mapObj[key] }))
        .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name, "ko-KR"))
        .slice(0, limit);
    return {
        totalSeries: sourceRows.length,
        totalPickCount,
        totalBanCount,
        topPicks: sortRows(pickMap),
        topBans: sortRows(banMap)
    };
}

function getChampionUsageRows(rows = null) {
    const sourceRows = Array.isArray(rows) ? rows : getAllHistoryRows();
    const statsMap = {};
    CHAMP_KEYS.forEach((key) => {
        statsMap[key] = { key, name: getChampionDisplayNameByKey(key), pick: 0, ban: 0, total: 0, games: 0, wins: 0, losses: 0, winRate: null };
    });

    sourceRows.forEach((entry) => {
        const pickKeys = Array.isArray(entry.pickKeys) ? entry.pickKeys : [];
        const banKeys = Array.isArray(entry.banKeys) ? entry.banKeys : [];

        pickKeys.forEach((k) => {
            if (!k) return;
            if (!statsMap[k]) statsMap[k] = { key: k, name: getChampionDisplayNameByKey(k), pick: 0, ban: 0, total: 0, games: 0, wins: 0, losses: 0, winRate: null };
            statsMap[k].pick += 1;
            statsMap[k].total += 1;
        });

        banKeys.forEach((k) => {
            if (!k) return;
            if (!statsMap[k]) statsMap[k] = { key: k, name: getChampionDisplayNameByKey(k), pick: 0, ban: 0, total: 0, games: 0, wins: 0, losses: 0, winRate: null };
            statsMap[k].ban += 1;
            statsMap[k].total += 1;
        });

        const bluePicks = Array.isArray(entry.bluePickKeys) ? entry.bluePickKeys.filter(Boolean) : [];
        const redPicks = Array.isArray(entry.redPickKeys) ? entry.redPickKeys.filter(Boolean) : [];
        const winnerSide = entry.winnerSide === "blue" || entry.winnerSide === "red" ? entry.winnerSide : "";

        if (!winnerSide || (bluePicks.length === 0 && redPicks.length === 0)) return;

        bluePicks.forEach((k) => {
            if (!statsMap[k]) return;
            statsMap[k].games += 1;
            if (winnerSide === "blue") statsMap[k].wins += 1;
            else statsMap[k].losses += 1;
        });
        redPicks.forEach((k) => {
            if (!statsMap[k]) return;
            statsMap[k].games += 1;
            if (winnerSide === "red") statsMap[k].wins += 1;
            else statsMap[k].losses += 1;
        });
    });

    Object.values(statsMap).forEach((row) => {
        row.winRate = row.games > 0 ? roundToOne((row.wins / row.games) * 100) : null;
    });

    return Object.values(statsMap).sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        if (b.games !== a.games) return b.games - a.games;
        return a.name.localeCompare(b.name, "ko-KR");
    });
}

function renderChampionStatsModal(rows) {
    const body = document.getElementById("champ-stats-body");
    if (!body) return;
    const visible = (rows || []).filter((r) => r.total > 0);
    if (visible.length === 0) {
        body.innerHTML = '<div class="home-empty">누적 챔피언 통계가 없습니다.</div>';
        return;
    }
    body.innerHTML = visible.map((row, idx) => `
        <div class="champ-stat-row">
            <span class="champ-stat-rank">#${idx + 1}</span>
            <img class="champ-stat-avatar" src="${getChampionImageUrl(row.key)}" alt="${row.name}" onerror="this.onerror=null;this.src='${getChampionFallbackImageUrl(row.name)}';">
            <div class="champ-stat-meta">
                <b>${row.name}</b>
                <span>픽 ${formatNum(row.pick)} / 밴 ${formatNum(row.ban)} / 총 ${formatNum(row.total)}</span>
                <span class="champ-winrate">승률 ${row.winRate === null ? "-" : `${formatNum(row.winRate)}%`} (전적 ${formatNum(row.wins)}승 ${formatNum(row.losses)}패)</span>
            </div>
        </div>
    `).join("");
}

function openChampionStatsModal() {
    const allRows = getChampionUsageRows(getAllHistoryRows());
    renderChampionStatsModal(allRows);
    setDisplayById("champ-stats-modal", "flex");
}

function closeChampionStatsModal() {
    setDisplayById("champ-stats-modal", "none");
}

function renderHomeHistory() {
    const logList = document.getElementById("home-log-list");
    const rankingList = document.getElementById("home-ranking-list");
    const champStats = document.getElementById("home-champ-stats");
    const allRows = getAllHistoryRows();
    if (logList) {
        if (allRows.length === 0) {
            logList.innerHTML = '<div class="home-empty">아직 기록이 없습니다.</div>';
        } else {
            logList.innerHTML = allRows.slice(0, 12).map((entry) => {
                const sourceText = entry.source === "remote" ? "온라인" : "로컬";
                return `<div class="home-log-item"><b>[${sourceText}] ${entry.modeLabel}</b> <span>${entry.winnerTeam} 승 (${entry.scoreText})</span><em>${formatTimeLabel(entry.playedAt)}</em></div>`;
            }).join("");
        }
    }
    if (rankingList) {
        const ranks = getRankingRows(allRows);
        if (ranks.length === 0) {
            rankingList.innerHTML = '<div class="home-empty">랭킹 데이터가 없습니다.</div>';
        } else {
            rankingList.innerHTML = ranks.map((row, idx) => {
                const wr = row.games > 0 ? ((row.wins / row.games) * 100).toFixed(1) : "0.0";
                return `<div class="home-rank-item"><span>#${idx + 1} ${row.team}</span><b>${row.wins}승 / ${row.games}전 (${wr}%)</b></div>`;
            }).join("");
        }
    }
    if (champStats) {
        const draftStats = getDraftStatsRows(7, allRows);
        const usageRows = getChampionUsageRows(allRows);
        const makeRows = (rows, tone) => {
            if (!rows || rows.length === 0) return '<div class="home-empty">아직 누적 데이터가 없습니다.</div>';
            return rows.map((row, idx) => {
                const key = row.key || getChampionKeyByName(row.name);
                const imgUrl = key ? getChampionImageUrl(key) : getChampionFallbackImageUrl(row.name);
                return `<div class="home-rank-item champ-mini-item">
                    <span class="champ-mini-head"><span class="champ-mini-rank">${idx + 1}</span><img class="champ-mini-avatar" src="${imgUrl}" alt="${row.name}" onerror="this.onerror=null;this.src='${getChampionFallbackImageUrl(row.name)}';"><span>${row.name}</span></span>
                    <b class="${tone}">${formatNum(row.count)}회</b>
                </div>`;
            }).join("");
        };
        champStats.innerHTML = `
            <div class="home-log-item"><b>누적 시리즈</b><span>${formatNum(draftStats.totalSeries)}회</span></div>
            <div class="home-log-item"><b>누적 픽 / 밴</b><span>${formatNum(draftStats.totalPickCount)} / ${formatNum(draftStats.totalBanCount)}</span></div>
            <div class="home-log-item"><b>TOP 픽</b><span></span></div>
            ${makeRows(draftStats.topPicks, "type-dive")}
            <div class="home-log-item"><b>TOP 밴</b><span></span></div>
            ${makeRows(draftStats.topBans, "type-poke")}
            <button type="button" class="home-champ-detail-btn" onclick="openChampionStatsModal()">챔피언 통계 상세 보기</button>
        `;
        renderChampionStatsModal(usageRows);
    }
}

function bindHomeActionButtons() {
    if (homeActionBound) return;
    const buttonMap = [
        { id: "home-btn-worlds-open", handler: openWorldsModal, label: "실제 팀 모드 설정" },
        { id: "home-btn-worlds-disable", handler: disableWorldsMode, label: "실제 팀 모드 해제" },
        { id: "home-btn-tutorial-open", handler: openTutorial, label: "게임 설명 보기" },
        { id: "home-btn-ai-balance", handler: openAiBalanceModal, label: "AI 밸런스 시뮬 20판" },
        { id: "home-btn-remote-save", handler: saveRemoteConfigFromInputs, label: "온라인 기록 연결" },
        { id: "home-btn-remote-refresh", handler: refreshRemoteHistory, label: "온라인 기록 새로고침" },
        { id: "home-btn-remote-disable", handler: disableRemoteHistory, label: "온라인 기록 해제" }
    ];
    buttonMap.forEach(({ id, handler, label }) => {
        const btn = document.getElementById(id);
        if (!btn) {
            console.warn(`[HOME] 버튼을 찾지 못했습니다: ${label} (${id})`);
            return;
        }
        if (btn.dataset.bound === "1") return;
        btn.addEventListener("click", handler);
        btn.dataset.bound = "1";
    });
    homeActionBound = true;
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

function renderWorldsPlayerCard(player, team) {
    if (!player) return "";
    const champs = (player.signatureChamps || []).join(", ");
    const edge = getWorldsTeamColor(team, "#456");
    return `<div class="worlds-player-card" style="border-color:${edge}; box-shadow: inset 3px 0 0 ${edge};">
        <img class="worlds-player-photo" src="${player.photo || ""}" alt="${player.nick}" onerror="this.onerror=null;this.src='https://placehold.co/72x72/101820/c8aa6e?text=${encodeURIComponent(player.nick)}';">
        <div class="worlds-player-meta">
            <b>${player.nick}</b>
            <span>${player.role} · ${team?.name || "-"}</span>
            <span>주챔: ${champs || "-"}</span>
        </div>
    </div>`;
}

function renderWorldsRosterPreview(containerId, teamId) {
    const box = document.getElementById(containerId);
    if (!box) return;
    const team = getWorldsTeamById(teamId);
    const roster = getWorldsRosterByTeamId(teamId);
    if (!team || !roster) {
        box.innerHTML = '<div class="worlds-empty">팀을 선택하면 선수 카드가 표시됩니다.</div>';
        return;
    }
    const cards = POSITIONS.map((pos) => {
        const playerId = roster.players && roster.players[pos];
        const player = getWorldsPlayerById(playerId);
        return renderWorldsPlayerCard(player, team);
    }).join("");
    const teamColor = getWorldsTeamColor(team, "#3f5563");
    const prefLabel = team.prefLabel || (STRATEGY_CONFIGS[team.prefStrategy || "General"]?.label || "일반적");
    box.innerHTML = `<div class="worlds-team-head" style="border-color:${teamColor};"><img src="${team.logo || ""}" alt="${team.name}" onerror="this.style.display='none'"><b style="color:${teamColor};">${team.name}</b><span style="font-size:11px;color:#9fb3c2;">팀 선호: ${prefLabel}</span></div>${cards}`;
}

function onWorldsTeamChange() {
    const mySel = document.getElementById("worlds-my-team");
    const enemySel = document.getElementById("worlds-enemy-team");
    if (!mySel || !enemySel) return;
    worldsConfig.myTeamId = mySel.value || "";
    const prevEnemy = enemySel.value;
    enemySel.innerHTML = worldsTeams
        .filter((t) => t.id !== worldsConfig.myTeamId)
        .map((t) => `<option value="${t.id}">${t.name}</option>`)
        .join("");
    enemySel.value = worldsTeams.some((t) => t.id === prevEnemy && t.id !== worldsConfig.myTeamId)
        ? prevEnemy
        : (enemySel.options[0] ? enemySel.options[0].value : "");
    worldsConfig.enemyTeamId = enemySel.value || "";
    renderWorldsRosterPreview("worlds-my-roster", worldsConfig.myTeamId);
    renderWorldsRosterPreview("worlds-enemy-roster", worldsConfig.enemyTeamId);
}

function renderWorldsModalOptions() {
    const mySel = document.getElementById("worlds-my-team");
    const enemySel = document.getElementById("worlds-enemy-team");
    const status = document.getElementById("worlds-status");
    if (!mySel || !enemySel || !status) return;
    if (worldsTeams.length === 0) {
        mySel.innerHTML = '<option value="">데이터 없음</option>';
        enemySel.innerHTML = '<option value="">데이터 없음</option>';
        status.innerText = "실제 팀 데이터 로드 실패 (data/*.json 확인)";
        return;
    }
    mySel.innerHTML = worldsTeams.map((t) => `<option value="${t.id}">${t.name}</option>`).join("");
    const defaultMy = worldsConfig.myTeamId || worldsTeams[0].id;
    mySel.value = defaultMy;
    worldsConfig.myTeamId = mySel.value;
    onWorldsTeamChange();
    status.innerText = worldsModeEnabled
        ? `실제 팀 모드 ON: ${teamProfile.myTeamName} vs ${teamProfile.aiTeamName}`
        : "실제 팀 모드 OFF";
    renderRealTeamModeBrief();
    updateWorldsChallengeButtonState();
    renderHomeWorldsTeamPanel();
}

function openWorldsModal(forceChange = false) {
    if (worldsModeEnabled && teamProfile.worldsTeamLocked && !forceChange) {
        alert("실제 선수 모드 팀은 1회 선택으로 잠겨 있습니다. 홈의 '팀 변경' 버튼을 눌러 변경하세요.");
        return;
    }
    renderWorldsModalOptions();
    updateWorldsChallengeButtonState();
    renderWorldsChallengeSetup();
    setDisplayById("worlds-modal", "flex");
}

function closeWorldsModal() {
    setDisplayById("worlds-modal", "none");
}

function confirmWorldsMode() {
    const mySel = document.getElementById("worlds-my-team");
    const enemySel = document.getElementById("worlds-enemy-team");
    if (!mySel || !enemySel) return;
    const myTeamObj = getWorldsTeamById(mySel.value);
    const enemyTeamObj = getWorldsTeamById(enemySel.value);
    if (!myTeamObj || !enemyTeamObj) return;
    worldsConfig.myTeamId = myTeamObj.id;
    worldsConfig.enemyTeamId = enemyTeamObj.id;
    worldsModeEnabled = true;
    teamProfile.worldsTeamLocked = true;
    teamProfile.myTeamName = myTeamObj.name;
    teamProfile.aiTeamName = enemyTeamObj.name;
    saveTeamProfile();
    applyTeamNameInputs();
    const status = document.getElementById("worlds-status");
    if (status) status.innerText = `실제 팀 모드 ON: ${teamProfile.myTeamName} vs ${teamProfile.aiTeamName}`;
    applyWorldsTeamColors();
    renderWorldsSlotHints();
    updateSeriesInfo();
    renderStrategyModal();
    renderRealTeamModeBrief();
    updateWorldsChallengeButtonState();
    renderHomeWorldsTeamPanel();
    closeWorldsModal();
}

function disableWorldsMode() {
    worldsModeEnabled = false;
    worldsConfig.myTeamId = "";
    worldsConfig.enemyTeamId = "";
    teamProfile.worldsTeamLocked = false;
    saveTeamProfile();
    const status = document.getElementById("worlds-status");
    if (status) status.innerText = "실제 팀 모드 OFF";
    applyWorldsTeamColors();
    renderWorldsSlotHints();
    updateSeriesInfo();
    renderStrategyModal();
    renderRealTeamModeBrief();
    updateWorldsChallengeButtonState();
    renderHomeWorldsTeamPanel();
}

function updateWorldsChallengeButtonState() {
    const btn = document.getElementById("home-btn-worlds-challenge");
    const status = document.getElementById("worlds-challenge-status");
    const modeState = document.getElementById("worlds-challenge-mode-state");
    const enabled = !!(worldsModeEnabled && worldsConfig.myTeamId && worldsConfig.enemyTeamId);
    if (btn) btn.disabled = !enabled;
    if (status) status.innerText = enabled ? `실제 팀 모드 ON (${teamProfile.myTeamName})` : "실제 팀 모드 OFF";
    if (modeState) modeState.innerText = enabled
        ? `실제 팀 모드 ON: ${teamProfile.myTeamName} vs ${teamProfile.aiTeamName}`
        : "실제 팀 모드 OFF (월즈 도전 비활성)";
}

function challengeShuffle(arr) {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

function challengeSample(arr, count) {
    return challengeShuffle(arr).slice(0, Math.max(0, Math.min(count, arr.length)));
}

function challengeUnique(values) {
    const out = [];
    values.forEach((v) => {
        if (!v || out.includes(v)) return;
        out.push(v);
    });
    return out;
}

function getChallengeRegionPools(userTeamId) {
    const others = worldsTeams.filter((t) => t.id !== userTeamId);
    const lck = others.filter((t) => String(t.region || "").toUpperCase() === "LCK");
    const intl = others.filter((t) => String(t.region || "").toUpperCase() !== "LCK");
    return { lck, intl };
}

function fillChallengeRandomSlots() {
    const userTeamId = worldsChallengeState.userTeamId;
    const pools = getChallengeRegionPools(userTeamId);
    worldsChallengeState.manualLck = challengeSample(pools.lck.map((t) => t.id), 3);
    worldsChallengeState.manualIntl = challengeSample(pools.intl.map((t) => t.id), 4);
}

function collectWorldsChallengeParticipants() {
    const userTeamId = worldsChallengeState.userTeamId;
    const userTeam = getWorldsTeamById(userTeamId);
    if (!userTeam) return { ok: false, msg: "내 팀을 선택해주세요.", teams: [] };
    const pools = getChallengeRegionPools(userTeamId);
    const lckIds = challengeUnique(worldsChallengeState.manualLck).slice(0, 3);
    const intlIds = challengeUnique(worldsChallengeState.manualIntl).slice(0, 4);
    if (lckIds.length !== 3 || intlIds.length !== 4) {
        return { ok: false, msg: "LCK 3팀 + 해외 4팀을 모두 지정해야 합니다.", teams: [] };
    }
    const validLck = lckIds.every((id) => pools.lck.some((t) => t.id === id));
    const validIntl = intlIds.every((id) => pools.intl.some((t) => t.id === id));
    if (!validLck || !validIntl) {
        return { ok: false, msg: "팀 구성이 잘못되었습니다. 다시 지정해주세요.", teams: [] };
    }
    const ids = [userTeamId, ...lckIds, ...intlIds];
    if (challengeUnique(ids).length !== 8) {
        return { ok: false, msg: "중복 팀 없이 8개 팀을 구성해주세요.", teams: [] };
    }
    const teams = ids.map((id) => getWorldsTeamById(id)).filter(Boolean);
    return { ok: teams.length === 8, msg: teams.length === 8 ? "" : "팀 데이터가 부족합니다.", teams };
}

function renderWorldsChallengeParticipantsPreview() {
    const box = document.getElementById("challenge-participants-preview");
    if (!box) return;
    const collected = collectWorldsChallengeParticipants();
    if (!collected.ok) {
        box.innerHTML = `<div class="worlds-empty">${escapeHtml(collected.msg || "팀을 구성해주세요.")}</div>`;
        return;
    }
    const chips = collected.teams.map((team) => `
        <div class="challenge-team-chip">
            <img src="${team.logo || ""}" alt="${escapeHtml(team.name)}" onerror="this.style.display='none'">
            <span>${escapeHtml(team.name)} <em style="color:#89a8bb;font-style:normal;">(${escapeHtml(team.region || "-")})</em></span>
        </div>
    `).join("");
    box.innerHTML = `<div class="challenge-manual-title">참가 팀 미리보기 (총 ${collected.teams.length}팀)</div><div class="challenge-preview-grid">${chips}</div>`;
}

function renderWorldsChallengeSetup() {
    const userSel = document.getElementById("challenge-user-team");
    if (!userSel) return;
    if (!worldsChallengeState.userTeamId) {
        worldsChallengeState.userTeamId = worldsConfig.myTeamId || worldsTeams[0]?.id || "";
    }
    const allOpts = worldsTeams.map((t) => `<option value="${t.id}">${t.name} (${t.region})</option>`).join("");
    userSel.innerHTML = allOpts;
    userSel.value = worldsChallengeState.userTeamId;

    const pools = getChallengeRegionPools(worldsChallengeState.userTeamId);
    const makeOptions = (arr, selected) => {
        const list = ['<option value="">선택</option>', ...arr.map((t) => `<option value="${t.id}">${t.name}</option>`)].join("");
        return { list, selected: selected || "" };
    };
    for (let i = 0; i < 3; i++) {
        const el = document.getElementById(`challenge-lck-${i}`);
        if (!el) continue;
        const opt = makeOptions(pools.lck, worldsChallengeState.manualLck[i]);
        el.innerHTML = opt.list;
        el.value = opt.selected;
    }
    for (let i = 0; i < 4; i++) {
        const el = document.getElementById(`challenge-intl-${i}`);
        if (!el) continue;
        const opt = makeOptions(pools.intl, worldsChallengeState.manualIntl[i]);
        el.innerHTML = opt.list;
        el.value = opt.selected;
    }

    const randomBtn = document.getElementById("challenge-random-btn");
    const manualBtn = document.getElementById("challenge-manual-btn");
    const manualWrap = document.getElementById("challenge-manual-wrap");
    if (randomBtn) randomBtn.classList.toggle("active", !!worldsChallengeState.selectionRandom);
    if (manualBtn) manualBtn.classList.toggle("active", !worldsChallengeState.selectionRandom);
    if (manualWrap) manualWrap.classList.toggle("off", !!worldsChallengeState.selectionRandom);
    updateWorldsChallengeButtonState();
    renderWorldsChallengeParticipantsPreview();
}

function onChallengeSetupChange() {
    const userSel = document.getElementById("challenge-user-team");
    if (userSel) worldsChallengeState.userTeamId = userSel.value || "";
    for (let i = 0; i < 3; i++) {
        const el = document.getElementById(`challenge-lck-${i}`);
        worldsChallengeState.manualLck[i] = el ? (el.value || "") : "";
    }
    for (let i = 0; i < 4; i++) {
        const el = document.getElementById(`challenge-intl-${i}`);
        worldsChallengeState.manualIntl[i] = el ? (el.value || "") : "";
    }
    if (worldsChallengeState.selectionRandom) fillChallengeRandomSlots();
    renderWorldsChallengeSetup();
}

function setChallengeSelectionMode(randomMode) {
    worldsChallengeState.selectionRandom = !!randomMode;
    if (worldsChallengeState.selectionRandom) fillChallengeRandomSlots();
    renderWorldsChallengeSetup();
}

function openWorldsChallengeSetup() {
    if (!worldsModeEnabled) {
        alert("실제 팀 모드를 먼저 활성화해주세요.");
        return;
    }
    worldsChallengeState.userTeamId = worldsConfig.myTeamId || worldsTeams[0]?.id || "";
    fillChallengeRandomSlots();
    renderWorldsChallengeSetup();
    setDisplayById("worlds-challenge-modal", "flex");
}

function closeWorldsChallengeSetup() {
    setDisplayById("worlds-challenge-modal", "none");
}

function closeWorldsChallengeLive() {
    worldsChallengeState.running = false;
    setDisplayById("worlds-challenge-live-modal", "none");
}

function challengeSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderWorldsChallengeLive() {
    const stageEl = document.getElementById("challenge-live-stage");
    const bracketEl = document.getElementById("challenge-live-bracket");
    const logEl = document.getElementById("challenge-live-log");
    if (!stageEl || !bracketEl || !logEl) return;
    const roundsHtml = worldsChallengeState.rounds.map((round) => {
        const lines = round.matches.map((m) => `<div class="challenge-match-line">${escapeHtml(m.blueName)} vs ${escapeHtml(m.redName)} · ${escapeHtml(m.score || "진행중")}${m.winnerName ? ` · 승자 ${escapeHtml(m.winnerName)}` : ""}</div>`).join("");
        return `<div><div class="challenge-round-title">${escapeHtml(round.label)}</div>${lines}</div>`;
    }).join("");
    bracketEl.innerHTML = roundsHtml || '<div class="worlds-empty">대진 생성 중...</div>';
    logEl.innerHTML = worldsChallengeState.logs.join("") || '<div class="worlds-empty">경기 로그 대기중...</div>';
    logEl.scrollTop = logEl.scrollHeight;
}

function challengeTeamNameById(teamId) {
    return getWorldsTeamById(teamId)?.name || teamId || "-";
}

function createChallengeMatches(teamIds) {
    const shuffled = challengeShuffle(teamIds);
    const matches = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        const a = shuffled[i];
        const b = shuffled[i + 1];
        if (!a || !b) continue;
        const blueFirst = Math.random() < 0.5;
        matches.push({
            blueTeamId: blueFirst ? a : b,
            redTeamId: blueFirst ? b : a
        });
    }
    return matches;
}

function getChallengeWinTarget(bestOf) {
    return Math.floor(bestOf / 2) + 1;
}

function getChallengeCandidates(step, picksState, bansState, teamLocks) {
    const taken = new Set();
    ["blue", "red"].forEach((t) => {
        (picksState[t] || []).forEach((k) => { if (k) taken.add(k); });
        (bansState[t] || []).forEach((k) => { if (k) taken.add(k); });
    });
    let candidates = CHAMP_KEYS.filter((key) => !taken.has(key));
    if (step.type === "pick") {
        candidates = candidates.filter((key) => canPickForTeamState(step.t, key, picksState));
        const lockSet = teamLocks[step.t] || new Set();
        const unlocked = candidates.filter((key) => !lockSet.has(key));
        if (unlocked.length > 0) candidates = unlocked;
    }
    return candidates;
}

function evaluateDraftStateForTeams(picksState, blueTeamId, redTeamId) {
    const snapshot = {
        worldsModeEnabled,
        userTeam,
        aiTeam,
        selectedStrategyKey,
        worldsConfig: { ...worldsConfig }
    };
    worldsModeEnabled = true;
    userTeam = "blue";
    aiTeam = "red";
    selectedStrategyKey = "General";
    worldsConfig.myTeamId = blueTeamId;
    worldsConfig.enemyTeamId = redTeamId;
    const out = evaluateDraftState(picksState);
    worldsModeEnabled = snapshot.worldsModeEnabled;
    userTeam = snapshot.userTeam;
    aiTeam = snapshot.aiTeam;
    selectedStrategyKey = snapshot.selectedStrategyKey;
    worldsConfig.myTeamId = snapshot.worldsConfig.myTeamId;
    worldsConfig.enemyTeamId = snapshot.worldsConfig.enemyTeamId;
    return out;
}

function getChallengeTeamStyleBonus(teamId, key) {
    const team = getWorldsTeamById(teamId);
    const champ = CHAMP_DB[key];
    if (!team || !champ) return 0;
    const style = team.prefStrategy || "General";
    const state = getWorldsTeamStyleFitState(champ, style);
    if (state > 0) return 2.6;
    if (state < 0) return -2.1;
    return 0;
}

function getChallengeSignatureBonus(teamId, key) {
    const champ = CHAMP_DB[key];
    const roster = getWorldsRosterByTeamId(teamId);
    if (!champ || !roster || !roster.players) return 0;
    let anySig = false;
    let posSig = 0;
    POSITIONS.forEach((pos) => {
        const pid = roster.players[pos];
        const player = getWorldsPlayerById(pid);
        if (!player) return;
        const sig = hasSignatureChampion(player, champ.name);
        if (!sig) return;
        anySig = true;
        if ((champ.pos || []).includes(pos)) posSig += 1;
    });
    if (posSig > 0) return 4.2 + posSig * 0.8;
    return anySig ? 1.6 : 0;
}

function scoreChallengePick(step, key, picksState, blueTeamId, redTeamId) {
    const champ = CHAMP_DB[key];
    if (!champ) return -999;
    const teamId = step.t === "blue" ? blueTeamId : redTeamId;
    const enemyTeamId = step.t === "blue" ? redTeamId : blueTeamId;
    const base = champ.dmg * 1.25 + champ.tank * 0.85 + champ.cc * 1.6 + champ.profile.scale * 1.15 + champ.phase.mid * 0.45;
    let score = base + getChallengeTeamStyleBonus(teamId, key) + getChallengeSignatureBonus(teamId, key);
    score += getChallengeSignatureBonus(enemyTeamId, key) * 0.25;
    return score;
}

function scoreChallengeBan(step, key, picksState, blueTeamId, redTeamId) {
    const champ = CHAMP_DB[key];
    if (!champ) return -999;
    const enemyTeamId = step.t === "blue" ? redTeamId : blueTeamId;
    const threat = champ.dmg * 1.1 + champ.cc * 1.5 + champ.profile.scale * 1.1 + champ.phase.mid * 0.4;
    return threat + getChallengeSignatureBonus(enemyTeamId, key) * 1.15 + getChallengeTeamStyleBonus(enemyTeamId, key) * 0.8;
}

function chooseChallengeAction(step, picksState, bansState, blueTeamId, redTeamId, teamLocks) {
    const candidates = getChallengeCandidates(step, picksState, bansState, teamLocks);
    if (candidates.length === 0) return null;
    const shortlist = candidates
        .map((key) => ({
            key,
            quick: step.type === "pick"
                ? scoreChallengePick(step, key, picksState, blueTeamId, redTeamId)
                : scoreChallengeBan(step, key, picksState, blueTeamId, redTeamId)
        }))
        .sort((a, b) => (b.quick - a.quick) || a.key.localeCompare(b.key, "en"))
        .slice(0, 12)
        .map((x) => x.key);

    let best = shortlist[0];
    let bestScore = -Infinity;
    shortlist.forEach((key) => {
        const prev = step.type === "pick" ? picksState[step.t][step.id] : bansState[step.t][step.id];
        if (step.type === "pick") picksState[step.t][step.id] = key;
        else bansState[step.t][step.id] = key;

        const ev = evaluateDraftStateForTeams(picksState, blueTeamId, redTeamId);
        const perspective = step.t === "blue" ? ev.blueWin : (100 - ev.blueWin);
        const score = perspective + (Math.random() * 0.8);

        if (step.type === "pick") picksState[step.t][step.id] = prev;
        else bansState[step.t][step.id] = prev;

        if (score > bestScore) {
            bestScore = score;
            best = key;
        }
    });
    return best;
}

function challengeDistribute(total, weights) {
    const safeWeights = weights.map((w) => Math.max(0.1, w));
    const sum = safeWeights.reduce((a, b) => a + b, 0);
    const raw = safeWeights.map((w) => (w / sum) * total);
    const out = raw.map((v) => Math.floor(v));
    let remain = total - out.reduce((a, b) => a + b, 0);
    const idxOrder = raw
        .map((v, i) => ({ i, frac: v - Math.floor(v) }))
        .sort((a, b) => b.frac - a.frac)
        .map((x) => x.i);
    let ptr = 0;
    while (remain > 0 && idxOrder.length) {
        out[idxOrder[ptr % idxOrder.length]] += 1;
        ptr += 1;
        remain -= 1;
    }
    return out;
}

function buildChallengeKdaRows(picksState, blueKills, redKills, blueTeamId, redTeamId) {
    const makeRows = (team, teamKills, enemyKills, teamId) => {
        const assigned = getTeamAssignedMap(team, picksState);
        const keys = POSITIONS.map((pos) => assigned.byPos[pos] || null);
        const champs = keys.map((k) => (k ? CHAMP_DB[k] : null));
        const killWeights = champs.map((c) => c ? (c.dmg + c.phase.mid * 0.4 + c.profile.scale) : 1);
        const deathWeights = champs.map((c) => c ? Math.max(1, 12 - c.tank - c.cc * 0.6) : 1);
        const assistWeights = champs.map((c) => c ? (c.tank + c.cc * 2 + c.profile.scale + 1) : 1);
        const kills = challengeDistribute(teamKills, killWeights);
        const deaths = challengeDistribute(enemyKills, deathWeights);
        const assists = challengeDistribute(Math.max(teamKills + 3, Math.round(teamKills * 1.8)), assistWeights);
        const roster = getWorldsRosterByTeamId(teamId);
        return POSITIONS.map((pos, idx) => {
            const key = keys[idx];
            const player = roster ? getWorldsPlayerById(roster.players[pos]) : null;
            return {
                pos,
                player: player?.nick || "-",
                champ: key ? (CHAMP_DB[key]?.name || key) : "-",
                k: kills[idx] || 0,
                d: deaths[idx] || 0,
                a: assists[idx] || 0
            };
        });
    };
    return {
        blue: makeRows("blue", blueKills, redKills, blueTeamId),
        red: makeRows("red", redKills, blueKills, redTeamId)
    };
}

function buildChallengeCasterLines(game, stageLabel, isMatchPoint) {
    const blueTeamName = challengeTeamNameById(game.blueTeamId);
    const redTeamName = challengeTeamNameById(game.redTeamId);
    const winnerTeamName = challengeTeamNameById(game.winnerTeamId);
    const winnerSide = game.winnerSide;
    const loserTeamName = winnerSide === "blue" ? redTeamName : blueTeamName;
    const favoredEarly = game.res.phases.earlyWin >= 50 ? "blue" : "red";
    const jungPosKey = getTeamChampByPos(favoredEarly, game.picksState, "JNG");
    const jungPlayer = jungPosKey ? getWorldsPlayerForChampion(favoredEarly, jungPosKey, game.picksState) : null;
    const jungLabel = jungPlayer?.nick || "정글러";
    const jungChamp = jungPosKey ? (CHAMP_DB[jungPosKey]?.name || jungPosKey) : "챔피언";

    const winnerCarryKey = getPhaseImpactChampion(winnerSide, "late");
    const sigLine = (() => {
        const assigned = getTeamAssignedMap(winnerSide, game.picksState);
        for (const pos of POSITIONS) {
            const key = assigned.byPos[pos];
            if (!key) continue;
            const player = getWorldsPlayerForChampion(winnerSide, key, game.picksState);
            if (player && hasSignatureChampion(player, CHAMP_DB[key]?.name || key)) {
                return `"${player.nick} 선수의 시그니처 카드 ${CHAMP_DB[key]?.name || key}, 협곡을 지배합니다!"`;
            }
        }
        return "";
    })();

    const lines = [];
    lines.push(`전용준: ${jungLabel}(${jungChamp})가 바텀 갱을 완벽히 성공시킵니다! 피지컬이 폭발합니다!`);
    lines.push(`이현우: ${favoredEarly === "blue" ? blueTeamName : redTeamName}의 전매특허 스노우볼링, 초반부터 굴러갑니다!`);
    if (sigLine) lines.push(`전용준: ${sigLine}`);
    lines.push(`이현우: ${winnerCarryKey}가 한타 구도를 장악합니다. ${winnerTeamName}이 전장을 찢어놓고 있어요!`);
    if (isMatchPoint) {
        lines.push(`전용준: 넥서스가 파괴됩니다! ${winnerTeamName}이 이변을 만들어내며 다음 라운드로 진출합니다!`);
    } else {
        lines.push(`전용준: ${winnerTeamName}이 세트를 가져갑니다! ${loserTeamName}은 다시 밴픽을 정비해야 합니다!`);
    }
    return lines;
}

function renderChallengeGoldTrack(blueGoldDiff) {
    const pct = Math.max(0, Math.min(100, 50 + (blueGoldDiff / 12000) * 50));
    return `<div class="challenge-gold-track"><span class="challenge-gold-fill" style="width:${pct.toFixed(1)}%"></span></div>`;
}

function renderChallengeKdaTable(rows, teamName) {
    return `<table class="challenge-kda-table"><thead><tr><th colspan="4">${escapeHtml(teamName)} KDA</th></tr><tr><th>포지션</th><th>선수/챔피언</th><th>K/D/A</th><th>KDA</th></tr></thead><tbody>${rows.map((r) => {
        const ratio = ((r.k + r.a) / Math.max(1, r.d)).toFixed(2);
        return `<tr><td>${r.pos}</td><td>${escapeHtml(r.player)} · ${escapeHtml(r.champ)}</td><td>${r.k}/${r.d}/${r.a}</td><td>${ratio}</td></tr>`;
    }).join("")}</tbody></table>`;
}

function simulateChallengeGame(blueTeamId, redTeamId, stageRule, teamLocksBySide) {
    const picksState = { blue: [null, null, null, null, null], red: [null, null, null, null, null] };
    const bansState = { blue: [null, null, null, null, null], red: [null, null, null, null, null] };

    DRAFT_ORDER.forEach((step) => {
        const key = chooseChallengeAction(step, picksState, bansState, blueTeamId, redTeamId, teamLocksBySide);
        if (!key) return;
        if (step.type === "pick") picksState[step.t][step.id] = key;
        else bansState[step.t][step.id] = key;
    });

    const res = evaluateDraftStateForTeams(picksState, blueTeamId, redTeamId);
    const winnerSide = rollWinnerFromWinRate(res.blueWin);
    const finish = getFinishPhaseSummary(res, winnerSide);

    const edge = res.blueWin - 50;
    const blueKills = Math.max(4, Math.min(20, Math.round(9 + edge / 6)));
    const redKills = Math.max(3, Math.min(18, Math.round(9 - edge / 7)));
    const blueGoldDiff = Math.round(edge * 210 + (res.phases.earlyWin - 50) * 90 + (res.phases.midWin - 50) * 70);

    const kda = buildChallengeKdaRows(picksState, blueKills, redKills, blueTeamId, redTeamId);
    return {
        blueTeamId,
        redTeamId,
        picksState,
        bansState,
        res,
        winnerSide,
        winnerTeamId: winnerSide === "blue" ? blueTeamId : redTeamId,
        finish,
        blueKills,
        redKills,
        blueGoldDiff,
        kda
    };
}

function simulateChallengeSeries(match, stageRule) {
    const target = getChallengeWinTarget(stageRule.bestOf);
    const score = { blue: 0, red: 0 };
    const games = [];
    const teamLocksBySide = {
        blue: new Set(),
        red: new Set()
    };

    for (let gameNo = 1; gameNo <= stageRule.bestOf; gameNo++) {
        if (score.blue >= target || score.red >= target) break;
        const game = simulateChallengeGame(match.blueTeamId, match.redTeamId, stageRule, teamLocksBySide);
        games.push(game);
        score[game.winnerSide] += 1;
        if (stageRule.fearless) {
            (game.picksState.blue || []).forEach((k) => { if (k) teamLocksBySide.blue.add(k); });
            (game.picksState.red || []).forEach((k) => { if (k) teamLocksBySide.red.add(k); });
        }
    }

    const winnerSide = score.blue > score.red ? "blue" : "red";
    const winnerTeamId = winnerSide === "blue" ? match.blueTeamId : match.redTeamId;
    const winnerName = challengeTeamNameById(winnerTeamId);
    return {
        ...match,
        bestOf: stageRule.bestOf,
        fearless: stageRule.fearless,
        score,
        scoreText: `${score.blue}:${score.red}`,
        winnerSide,
        winnerTeamId,
        winnerName,
        games
    };
}

function buildChallengeGameLogHtml(stageLabel, seriesResult, game, gameNo) {
    const blueName = challengeTeamNameById(game.blueTeamId);
    const redName = challengeTeamNameById(game.redTeamId);
    const lines = buildChallengeCasterLines(game, stageLabel, seriesResult.bestOf === 1 || gameNo === seriesResult.games.length);
    const bluePicks = getTeamAssignedMap("blue", game.picksState).byPos;
    const redPicks = getTeamAssignedMap("red", game.picksState).byPos;
    const pickLine = (teamPicks) => POSITIONS.map((pos) => `${pos}:${CHAMP_DB[teamPicks[pos]]?.name || '-'}`).join(" | ");
    return `
        <div class="challenge-log-entry">
            <div class="challenge-log-title">${stageLabel} G${gameNo} · ${blueName} vs ${redName} · 승자 ${challengeTeamNameById(game.winnerTeamId)}</div>
            <div class="challenge-log-line">종료 시점: <b>${game.finish.phase}</b> | ${game.finish.reason}</div>
            <div class="challenge-log-line">킬스코어: ${blueName} ${game.blueKills} : ${game.redKills} ${redName}</div>
            <div class="challenge-log-line">골드(블루 기준): ${formatGoldDiff(game.blueGoldDiff)}</div>
            ${renderChallengeGoldTrack(game.blueGoldDiff)}
            <div class="challenge-log-line" style="margin-top:4px;">블루 픽: ${pickLine(bluePicks)}</div>
            <div class="challenge-log-line">레드 픽: ${pickLine(redPicks)}</div>
            ${renderChallengeKdaTable(game.kda.blue, blueName)}
            ${renderChallengeKdaTable(game.kda.red, redName)}
            ${lines.map((line) => `<div class="challenge-log-line">🎙 ${escapeHtml(line)}</div>`).join("")}
        </div>
    `;
}

async function runWorldsChallengeTournament(participants) {
    worldsChallengeState.running = true;
    worldsChallengeState.participants = participants;
    worldsChallengeState.rounds = [];
    worldsChallengeState.logs = [];
    setDisplayById("worlds-challenge-live-modal", "flex");

    let currentTeams = participants.map((t) => t.id);
    for (let stageIdx = 0; stageIdx < WORLDS_CHALLENGE_STAGES.length; stageIdx++) {
        const stageRule = WORLDS_CHALLENGE_STAGES[stageIdx];
        const stageLabel = `${stageRule.label} · BO${stageRule.bestOf}${stageRule.fearless ? " (피어리스)" : ""}`;
        const stageEl = document.getElementById("challenge-live-stage");
        if (stageEl) stageEl.innerText = `${stageLabel} 진행 중...`;

        let matches = [];
        if (stageRule.key === "QF") {
            matches = createChallengeMatches(currentTeams);
        } else {
            const seeded = challengeShuffle(currentTeams);
            matches = [];
            for (let i = 0; i < seeded.length; i += 2) {
                const a = seeded[i];
                const b = seeded[i + 1];
                if (!a || !b) continue;
                const blueFirst = Math.random() < 0.5;
                matches.push({ blueTeamId: blueFirst ? a : b, redTeamId: blueFirst ? b : a });
            }
        }

        const roundRecord = { label: stageLabel, matches: [] };
        worldsChallengeState.rounds.push(roundRecord);
        renderWorldsChallengeLive();

        const winners = [];
        for (let i = 0; i < matches.length; i++) {
            if (!worldsChallengeState.running) return;
            const m = matches[i];
            const series = simulateChallengeSeries(m, stageRule);
            winners.push(series.winnerTeamId);
            roundRecord.matches.push({
                blueName: challengeTeamNameById(series.blueTeamId),
                redName: challengeTeamNameById(series.redTeamId),
                score: series.scoreText,
                winnerName: series.winnerName
            });
            worldsChallengeState.logs.push(`<div class="challenge-log-entry"><div class="challenge-log-title">${stageLabel} Match ${i + 1}</div><div class="challenge-log-line">${challengeTeamNameById(series.blueTeamId)} vs ${challengeTeamNameById(series.redTeamId)} · 결과 ${series.scoreText} · 승자 ${series.winnerName}</div></div>`);
            series.games.forEach((game, gameNo) => {
                worldsChallengeState.logs.push(buildChallengeGameLogHtml(stageLabel, series, game, gameNo + 1));
            });
            renderWorldsChallengeLive();
            await challengeSleep(350);
        }
        currentTeams = winners;
    }

    const championId = currentTeams[0];
    const championName = challengeTeamNameById(championId);
    worldsChallengeState.logs.push(`<div class="challenge-log-entry"><div class="challenge-log-title">대회 종료</div><div class="challenge-log-line">🏆 우승: ${escapeHtml(championName)}</div></div>`);
    const stageEl = document.getElementById("challenge-live-stage");
    if (stageEl) stageEl.innerText = `대회 종료 · 우승 ${championName}`;
    renderWorldsChallengeLive();
}

function startWorldsChallenge() {
    if (!worldsModeEnabled) {
        alert("실제 팀 모드를 먼저 활성화해주세요.");
        return;
    }
    const collected = collectWorldsChallengeParticipants();
    if (!collected.ok) {
        alert(collected.msg || "참가 팀 구성이 올바르지 않습니다.");
        return;
    }
    worldsChallengeState.userTeamId = collected.teams[0].id;
    closeWorldsChallengeSetup();
    runWorldsChallengeTournament(collected.teams);
}

function openAiBalanceModal() {
    const statusEl = document.getElementById("ai-balance-status");
    const resultsEl = document.getElementById("ai-balance-results");
    if (statusEl) statusEl.innerText = "대기중";
    if (resultsEl) resultsEl.innerHTML = '<div class="worlds-empty">20판 실행 버튼을 눌러주세요.</div>';
    setDisplayById("ai-balance-modal", "flex");
}

function closeAiBalanceModal() {
    if (aiBalanceSimRunning) return;
    setDisplayById("ai-balance-modal", "none");
}

function getAiBalanceTeamPair() {
    if (!Array.isArray(worldsTeams) || worldsTeams.length < 2) return null;
    const pool = [...worldsTeams];
    const a = pool[Math.floor(Math.random() * pool.length)];
    const remains = pool.filter((t) => t.id !== a.id);
    const b = remains[Math.floor(Math.random() * remains.length)];
    return a && b ? { blue: a, red: b } : null;
}

function renderAiBalanceTable(title, rows, cols) {
    if (!rows || rows.length === 0) return `<div class="ai-balance-section-title">${title}</div><div class="worlds-empty">데이터 없음</div>`;
    const head = cols.map((c) => `<th>${c.label}</th>`).join("");
    const body = rows.map((row) => `<tr>${cols.map((c) => `<td>${c.render(row)}</td>`).join("")}</tr>`).join("");
    return `<div class="ai-balance-section-title">${title}</div><table class="ai-balance-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

async function runAiBalanceSimulation(rounds = 20) {
    if (aiBalanceSimRunning) return;
    const statusEl = document.getElementById("ai-balance-status");
    const resultsEl = document.getElementById("ai-balance-results");
    if (!statusEl || !resultsEl) return;

    if (!Array.isArray(worldsTeams) || worldsTeams.length < 2) {
        statusEl.innerText = "실패: 실제 팀 데이터가 필요합니다.";
        return;
    }

    aiBalanceSimRunning = true;
    statusEl.innerText = `시뮬레이션 진행중... (0/${rounds})`;
    resultsEl.innerHTML = "";

    const champMap = {};
    const teamMap = {};
    const compMap = {};
    const logs = [];

    const pushChamp = (key, won) => {
        if (!key) return;
        if (!champMap[key]) champMap[key] = { key, name: CHAMP_DB[key]?.name || key, games: 0, wins: 0 };
        champMap[key].games += 1;
        if (won) champMap[key].wins += 1;
    };
    const pushTeam = (teamId, won) => {
        if (!teamId) return;
        if (!teamMap[teamId]) teamMap[teamId] = { teamId, name: getWorldsTeamById(teamId)?.name || teamId, games: 0, wins: 0 };
        teamMap[teamId].games += 1;
        if (won) teamMap[teamId].wins += 1;
    };
    const pushComp = (label, won) => {
        if (!label) return;
        if (!compMap[label]) compMap[label] = { label, games: 0, wins: 0 };
        compMap[label].games += 1;
        if (won) compMap[label].wins += 1;
    };

    try {
        for (let i = 1; i <= rounds; i++) {
            const pair = getAiBalanceTeamPair();
            if (!pair) break;
            const game = simulateChallengeGame(pair.blue.id, pair.red.id, { bestOf: 1, fearless: false }, { blue: new Set(), red: new Set() });
            const winnerTeamId = game.winnerTeamId;

            pushTeam(pair.blue.id, winnerTeamId === pair.blue.id);
            pushTeam(pair.red.id, winnerTeamId === pair.red.id);

            (game.picksState.blue || []).filter(Boolean).forEach((k) => pushChamp(k, winnerTeamId === pair.blue.id));
            (game.picksState.red || []).filter(Boolean).forEach((k) => pushChamp(k, winnerTeamId === pair.red.id));

            const bComp = getCompLabel(game.res.bStats || getTeamStats("blue", game.picksState));
            const rComp = getCompLabel(game.res.rStats || getTeamStats("red", game.picksState));
            pushComp(bComp, winnerTeamId === pair.blue.id);
            pushComp(rComp, winnerTeamId === pair.red.id);

            logs.push(`<div class="ai-balance-log-item">#${i} ${escapeHtml(pair.blue.name)} vs ${escapeHtml(pair.red.name)} · 승자 <b>${escapeHtml(getWorldsTeamById(winnerTeamId)?.name || winnerTeamId)}</b> · 종료 ${escapeHtml(game.finish.phase)}</div>`);

            if (i % 4 === 0 || i === rounds) {
                statusEl.innerText = `시뮬레이션 진행중... (${i}/${rounds})`;
                resultsEl.innerHTML = logs.slice(-8).join("");
                await challengeSleep(40);
            }
        }

        const champRows = Object.values(champMap)
            .map((r) => ({ ...r, winRate: r.games > 0 ? roundToOne((r.wins / r.games) * 100) : 0 }))
            .sort((a, b) => (b.winRate - a.winRate) || (b.games - a.games))
            .slice(0, 20);
        const teamRows = Object.values(teamMap)
            .map((r) => ({ ...r, winRate: r.games > 0 ? roundToOne((r.wins / r.games) * 100) : 0 }))
            .sort((a, b) => (b.winRate - a.winRate) || (b.games - a.games));
        const compRows = Object.values(compMap)
            .map((r) => ({ ...r, winRate: r.games > 0 ? roundToOne((r.wins / r.games) * 100) : 0 }))
            .sort((a, b) => (b.winRate - a.winRate) || (b.games - a.games));

        const html = [
            renderAiBalanceTable("챔피언 승률 TOP 20", champRows, [
                { label: "챔피언", render: (r) => `${escapeHtml(r.name)}` },
                { label: "승률", render: (r) => `${formatNum(r.winRate)}%` },
                { label: "전적", render: (r) => `${formatNum(r.wins)}승 ${formatNum(r.games - r.wins)}패` },
                { label: "표본", render: (r) => `${formatNum(r.games)}` }
            ]),
            renderAiBalanceTable("팀 승률", teamRows, [
                { label: "팀", render: (r) => `${escapeHtml(r.name)}` },
                { label: "승률", render: (r) => `${formatNum(r.winRate)}%` },
                { label: "전적", render: (r) => `${formatNum(r.wins)}승 ${formatNum(r.games - r.wins)}패` },
                { label: "표본", render: (r) => `${formatNum(r.games)}` }
            ]),
            renderAiBalanceTable("조합 유형 승률", compRows, [
                { label: "조합", render: (r) => `${escapeHtml(r.label)}` },
                { label: "승률", render: (r) => `${formatNum(r.winRate)}%` },
                { label: "전적", render: (r) => `${formatNum(r.wins)}승 ${formatNum(r.games - r.wins)}패` },
                { label: "표본", render: (r) => `${formatNum(r.games)}` }
            ]),
            '<div class="ai-balance-section-title">최근 경기 로그</div>' + logs.slice(-10).join("")
        ];
        resultsEl.innerHTML = html.join("");
        statusEl.innerText = `완료: ${rounds}판 시뮬레이션`;
    } finally {
        aiBalanceSimRunning = false;
    }
}


function openHome(showTutorialOnHome = true) {
    setDisplayById("home-page", "flex");
    setDisplayById("game-shell", "none");
    setDisplayById("side-select-modal", "none");
    setDisplayById("strategy-modal", "none");
    setDisplayById("tutorial-modal", "none");
    setDisplayById("result-modal", "none");
    setDisplayById("worlds-modal", "none");
    setDisplayById("worlds-challenge-modal", "none");
    setDisplayById("worlds-challenge-live-modal", "none");
    setDisplayById("champ-stats-modal", "none");
    setDisplayById("ai-balance-modal", "none");
    shouldResetOnStrategyConfirm = true;
    try {
        renderHomeStats();
        renderHomeHistory();
        applyTeamNameInputs();
        applyRemoteConfigInputs();
        updateWorldsChallengeButtonState();
        applyWorldsTeamColors();
        refreshRemoteHistory();
        if (showTutorialOnHome) {
            openTutorial();
        }
    } catch (err) {
        console.error("[HOME] 홈 화면 렌더 중 오류", err);
    }
}

function selectMode(modeKey) {
    applyModeConfig(modeKey);
    saveTeamNameInputs();
    shouldResetOnStrategyConfirm = true;
    setDisplayById("tutorial-modal", "none");
    setDisplayById("home-page", "none");
    // side-select/strategy 모달이 game-shell 내부에 있으므로 shell을 먼저 노출해야 함
    setDisplayById("game-shell", "flex");
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
        setDisplayById("game-shell", "flex");
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
    const stepTitle = document.getElementById("tutorial-step-title");
    if (!body || !idx || !stepTitle) return;
    const step = TUTORIAL_STEPS[tutorialStepIndex];
    stepTitle.innerText = step.title;
    body.innerHTML = formatTutorialBody(step.body);
    idx.innerText = `${tutorialStepIndex + 1} / ${TUTORIAL_STEPS.length}`;
}

function formatTutorialBody(text) {
    const lines = String(text || "").split("\n");
    const html = [];
    let listItems = [];
    const flushList = () => {
        if (listItems.length === 0) return;
        html.push(`<ul class="tutorial-list">${listItems.join("")}</ul>`);
        listItems = [];
    };
    lines.forEach((raw) => {
        const line = raw.trim();
        if (!line) {
            flushList();
            return;
        }
        if (/^[-*]\s+/.test(line)) {
            listItems.push(`<li>${escapeHtml(line.replace(/^[-*]\s+/, ""))}</li>`);
            return;
        }
        flushList();
        html.push(`<p class="tutorial-p">${escapeHtml(line)}</p>`);
    });
    flushList();
    return html.join("");
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

function detectChampionSideHint(text, fallback = "ally") {
    const raw = String(text || "");
    if (/(상대|적군)/.test(raw)) return "enemy";
    if (/(아군|우리|팀)/.test(raw)) return "ally";
    return fallback;
}

function highlightChampionNames(rawText, sideHint = "ally") {
    const text = String(rawText || "");
    if (!text) return "";
    let chunks = [{ text, isName: false }];
    CHAMPION_NAMES_KO_DESC.forEach((name) => {
        chunks = chunks.flatMap((chunk) => {
            if (chunk.isName) return [chunk];
            if (!chunk.text.includes(name)) return [chunk];
            const parts = chunk.text.split(name);
            const out = [];
            parts.forEach((part, idx) => {
                if (part) out.push({ text: part, isName: false });
                if (idx < parts.length - 1) out.push({ text: name, isName: true });
            });
            return out;
        });
    });
    const champClass = sideHint === "enemy" ? "trait-champ-enemy" : "trait-champ-ally";
    return chunks.map((chunk) => (
        chunk.isName
            ? `<b class="${champClass}">${escapeHtml(chunk.text)}</b>`
            : escapeHtml(chunk.text)
    )).join("");
}

function classifyEffectTone(segment) {
    const raw = String(segment || "");
    const hasNegative = /-\s*\d+|감소|저하|하락|패널티|약화|손해|차감|감점|불리/.test(raw);
    const hasPositive = /\+\s*\d+|증가|상승|가산|보정|강화|추가|발동|획득|유리/.test(raw);
    if (hasNegative && !hasPositive) return "bad";
    if (hasPositive && !hasNegative) return "good";
    return "neutral";
}

function formatTraitCondition(conditionText) {
    const raw = String(conditionText || "발동 조건 충족");
    const sideHint = detectChampionSideHint(raw, "ally");
    return highlightChampionNames(raw, sideHint);
}

function formatTraitEffect(effectText) {
    const raw = String(effectText || "효과 데이터 없음");
    const segments = raw.split("/").map((v) => v.trim()).filter(Boolean);
    if (segments.length === 0) {
        return `<span class="trait-effect-seg tone-neutral">${escapeHtml(raw)}</span>`;
    }
    return segments.map((segment, idx) => {
        const sideHint = detectChampionSideHint(segment, "ally");
        const toneClass = `tone-${classifyEffectTone(segment)}`;
        const segHtml = `<span class="trait-effect-seg ${toneClass}">${highlightChampionNames(segment, sideHint)}</span>`;
        if (idx === segments.length - 1) return segHtml;
        return `${segHtml}<span class="trait-sep"> / </span>`;
    }).join("");
}

function renderTraitBlock(opts) {
    const traitName = opts?.traitName || "특성";
    const champName = opts?.champName || "";
    const condition = opts?.condition || "발동 조건 충족";
    const effect = opts?.effect || "효과 데이터 없음";
    const wrapperClass = opts?.wrapperClass || "trait-item";
    const showOwner = opts?.showOwner !== false;
    const ownerHtml = showOwner && champName ? `<span class="trait-owner">${escapeHtml(champName)}</span>` : "";
    const rule = getTraitRule(champName, traitName);
    const levelLabel = rule.level === "hard" ? "난도 높음" : (rule.level === "easy" ? "난도 낮음" : "난도 보통");
    return `
        <div class="${wrapperClass} trait-item-unified">
            <div class="trait-head">
                <span class="trait-name-lg">${escapeHtml(traitName)}</span>
                ${ownerHtml}
                <span class="trait-diff">${levelLabel}</span>
            </div>
            <div class="trait-line"><span class="trait-key">조건</span><span class="trait-val">${formatTraitCondition(condition)}</span></div>
            <div class="trait-line"><span class="trait-key">효과</span><span class="trait-val">${formatTraitEffect(effect)}</span></div>
        </div>
    `;
}

function renderChampionTraitInfo(champName) {
    const traits = getTraitsByChampionName(champName);
    const linkedTraits = getLinkedTraitsByChampionName(champName);
    if (traits.length === 0 && linkedTraits.length === 0) {
        return `
        <div class="tip-trait-box">
            <div class="tip-trait-title">고유 특성</div>
            <div class="tip-trait-empty">이 챔피언은 현재 등록된 특성이 없습니다.</div>
        </div>
        `;
    }

    const ownHtml = traits.length > 0
        ? `${traits.map((t) => renderTraitBlock({
            champName,
            traitName: t.name,
            condition: t.condition,
            effect: t.effect,
            wrapperClass: "tip-trait-item",
            showOwner: false
        })).join("")}`
        : '<div class="tip-trait-empty">이 챔피언의 고유 특성은 없습니다.</div>';

    const linkedHtml = linkedTraits.length > 0
        ? `
            <div class="tip-trait-subtitle">연계 발동 특성</div>
            ${linkedTraits.map((t) => renderTraitBlock({
                champName: t.champName,
                traitName: t.name,
                condition: t.condition,
                effect: t.effect,
                wrapperClass: "tip-trait-item tip-trait-related",
                showOwner: true
            })).join("")}
        `
        : '';

    return `
    <div class="tip-trait-box">
        <div class="tip-trait-title">고유 특성</div>
        ${ownHtml}
        ${linkedHtml}
    </div>
    `;
}

function getTraitCatalogEntry(champName, traitName) {
    const list = getTraitsByChampionName(champName);
    return list.find((t) => t.name === traitName) || null;
}

function renderTraitUnifiedItem(trait) {
    const meta = getTraitCatalogEntry(trait.champName, trait.traitName) || {};
    const condition = trait.conditionText || meta.condition || "발동 조건 충족";
    const effect = trait.effectText || meta.effect || "효과 데이터 없음";
    return renderTraitBlock({
        champName: trait.champName,
        traitName: trait.traitName,
        condition,
        effect,
        wrapperClass: "trait-item"
    });
}

function isMobileView() {
    return window.matchMedia('(max-width: 900px)').matches;
}

function buildChampionInfoHtml(c, isFearlessLocked) {
    const posLabel = Array.isArray(c.pos) ? c.pos.join("/") : "-";
    const typeClass = getTypeColorClass(c.profile.type);
    const dmgClass = getDmgTypeColorClass(c.dmgType);
    const typeScaleRoman = toRomanScale(c.profile.scale);
    return `
        <div class="tip-title-row">
            <b class="tip-title-name">${c.name}</b>
            <span class="tip-title-meta">
                <span class="tip-pos-label">${posLabel}</span>
                <span class="tip-meta-sep">|</span>
                <span class="meta-badge ${typeClass}">
                    ${TYPE_LABEL[c.profile.type]} <span class="tip-roman-level">${typeScaleRoman}</span>
                </span>
                <span class="tip-meta-sep">|</span>
                <span class="meta-badge ${dmgClass}">${c.dmgType}</span>
            </span>
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
    const max = 15;
    const values = [
        Math.min(stats.dive, max),
        Math.min(stats.poke, max),
        Math.min(stats.anti, max)
    ];
    const labels = ["돌진", "포킹", "받아치기"];
    const cx = 110, cy = 98, radius = 76;
    const toPoint = (value, idx, scale = 1) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * idx / 3);
        const r = (value / max) * radius * scale;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        return { x, y };
    };
    const points = values.map((v, i) => {
        const p = toPoint(v, i);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");
    const rings = [0.25, 0.5, 0.75, 1].map((ratio) => {
        const ring = values.map((_, i) => {
            const p = toPoint(max * ratio, i);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        }).join(" ");
        return `<polygon points="${ring}" class="radar-ring"></polygon>`;
    }).join("");
    const axes = values.map((_, i) => {
        const p = toPoint(max, i);
        return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" class="radar-axis"></line>`;
    }).join("");
    const labelEls = labels.map((label, i) => {
        const p = toPoint(max, i, 1.2);
        return `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="middle" class="radar-label">${label}</text>`;
    }).join("");
    return `<div class="radar-wrap ${teamClass}">
        <svg viewBox="0 0 220 200" class="radar-svg" role="img" aria-label="팀 조합 삼각 차트">
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

function assignPositionsForKeys(championKeys) {
    const keys = (championKeys || []).filter(Boolean);
    const usedByPos = {};
    const assignedPosByKey = {};
    const assignByIdx = {};

    const dfs = (idx) => {
        if (idx >= keys.length) return true;
        const key = keys[idx];
        const poss = (CHAMP_DB[key]?.pos || []).filter((p) => VALID_POSITIONS.has(p));
        for (const p of poss) {
            if (usedByPos[p]) continue;
            usedByPos[p] = key;
            assignedPosByKey[key] = p;
            assignByIdx[idx] = p;
            if (dfs(idx + 1)) return true;
            delete usedByPos[p];
            delete assignedPosByKey[key];
            delete assignByIdx[idx];
        }
        return false;
    };

    const ok = dfs(0);
    if (!ok) {
        keys.forEach((key, idx) => {
            const fallback = CHAMP_DB[key]?.pos?.[0] || POSITIONS[idx] || "MID";
            assignedPosByKey[key] = fallback;
            assignByIdx[idx] = fallback;
        });
    }
    const posToKey = {};
    Object.entries(assignedPosByKey).forEach(([key, pos]) => {
        if (!posToKey[pos]) posToKey[pos] = key;
    });
    return { byKey: assignedPosByKey, byPos: posToKey, byIdx: assignByIdx };
}

function getTeamAssignedMap(team, picksState = picks) {
    const teamPicks = (picksState[team] || []).filter(Boolean);
    return assignPositionsForKeys(teamPicks);
}

function canPickForTeamState(team, key, picksState) {
    const selected = (picksState[team] || []).filter(Boolean);
    return canAssignDistinctPositions([...selected, key]);
}

function canPickForTeam(team, key) {
    return canPickForTeamState(team, key, picks);
}

function getWorldsStyleEffectText(style) {
    if (style === "Dive" || style === "Poke" || style === "Anti") {
        return "적합 1명당 유형 +1.2 / 딜 +0.5 / 탱 +0.3 / 중반 +0.6, 부조화 시 딜 -0.5";
    }
    if (style === "Early") {
        return "적합 1명당 초반 +2.0 / 중반 +0.6 / 딜 +0.6, 부조화 시 초반 -1.6";
    }
    if (style === "Mid") {
        return "적합 1명당 중반 +2.0 / CC +0.4 / 딜 +0.4, 부조화 시 중반 -1.6";
    }
    if (style === "Late") {
        return "적합 1명당 후반 +2.0 / 탱 +0.8 / 딜 +0.4, 부조화 시 후반 -1.6";
    }
    return "추가 보정 없음";
}

function getRealTeamEffectSummaryBySide(side) {
    const detail = getRealTeamStyleDetailBySide(side);
    if (!detail) return `${side === "blue" ? "블루" : "레드"}: 팀 미지정`;
    return `${detail.teamName} (${detail.prefLabel}) · ${detail.effectText}`;
}

function getRealTeamStyleDetailBySide(side) {
    const teamId = getWorldsTeamIdBySideForUi(side);
    const team = getWorldsTeamById(teamId);
    if (!team) return null;
    const style = team.prefStrategy || "General";
    const prefLabel = team.prefLabel || (STRATEGY_CONFIGS[style]?.label || "일반적");
    return {
        teamName: team.name || "-",
        prefLabel,
        effectText: getWorldsStyleEffectText(style)
    };
}

function getRealTeamStrategyGuideHtml() {
    if (!worldsModeEnabled || !userTeam) {
        return `<div class="strategy-guide-line"><b>실제 팀 모드 OFF</b> 상태입니다. 팀 성향/선수 주챔 보정이 적용되지 않습니다.</div>`;
    }
    const common = "공통 효과: 선수 주챔 픽 시 챔피언 강점 시간대 +1.6, 딜 +1.1, 보정 +2.2";
    const blueLine = getRealTeamEffectSummaryBySide("blue");
    const redLine = getRealTeamEffectSummaryBySide("red");
    return `
        <div class="strategy-guide-line"><b>실제 팀 모드 ON</b> (${teamProfile.myTeamName} vs ${teamProfile.aiTeamName})</div>
        <div class="strategy-guide-line">- 블루: ${blueLine}</div>
        <div class="strategy-guide-line">- 레드: ${redLine}</div>
        <div class="strategy-guide-line">- ${common}</div>
    `;
}

function renderRealTeamModeBrief() {
    const badge = document.getElementById("realteam-mode-badge");
    const brief = document.getElementById("realteam-brief");
    if (badge) {
        badge.classList.toggle("on", !!worldsModeEnabled);
        badge.classList.toggle("off", !worldsModeEnabled);
        badge.innerText = worldsModeEnabled ? "실제 팀 모드 ON" : "실제 팀 모드 OFF";
    }
    if (!brief) return;
    if (!worldsModeEnabled || !userTeam) {
        brief.innerHTML = `<span class="realteam-brief-muted">실제 팀 모드가 OFF 상태라 팀 성향/선수 보정이 적용되지 않습니다.</span>`;
        return;
    }
    const blueLine = getRealTeamEffectSummaryBySide("blue");
    const redLine = getRealTeamEffectSummaryBySide("red");
    brief.innerHTML = `
        <div class="realteam-brief-line"><b>블루</b> ${escapeHtml(blueLine)}</div>
        <div class="realteam-brief-line"><b>레드</b> ${escapeHtml(redLine)}</div>
    `;
}

function updateSeriesInfo() {
    const mode = MODE_CONFIGS[selectedModeKey];
    const strategyLabel = STRATEGY_CONFIGS[selectedStrategyKey]?.label || "전략 미선택";
    const realTeamTag = worldsModeEnabled ? " | 실제 팀 모드 ON" : " | 실제 팀 모드 OFF";
    document.getElementById('series-info').innerText = `${mode.label} | SET ${currentGame}/${maxGames} | SCORE ${teamProfile.myTeamName} ${seriesRoleWins.user} : ${seriesRoleWins.ai} ${teamProfile.aiTeamName} | 전략 ${strategyLabel}${realTeamTag}`;
    renderRealTeamModeBrief();
    updateWorldsChallengeButtonState();
    renderHomeWorldsTeamPanel();
}

function getTeamRoleLabel(team) {
    if (!userTeam) return team.toUpperCase();
    return team === userTeam ? teamProfile.myTeamName : teamProfile.aiTeamName;
}

function getTraitLogEntry(champName, traitName) {
    const id = `${champName}|${traitName}`;
    if (!traitAnalytics.byTrait[id]) {
        traitAnalytics.byTrait[id] = {
            id,
            champName,
            traitName,
            opportunities: 0,
            activations: 0,
            winsWhenActive: 0,
            winEdgeSum: 0
        };
    }
    return traitAnalytics.byTrait[id];
}

function recordTraitAnalyticsSample(picksState, traitCtx, winnerTeam, blueWinRate, isAuto = false) {
    if (!traitAnalytics || !traitCtx) return;
    const teamList = ["blue", "red"];
    teamList.forEach((team) => {
        const pickedKeys = getTeamKeys(team, picksState);
        pickedKeys.forEach((champKey) => {
            const champName = CHAMP_DB[champKey]?.name || champKey;
            const traits = getTraitsByChampionName(champName);
            traits.forEach((t) => {
                const entry = getTraitLogEntry(champName, t.name);
                entry.opportunities += 1;
            });
        });
        const activeTraits = traitCtx?.traits?.[team] || [];
        activeTraits.forEach((t) => {
            const entry = getTraitLogEntry(t.champName, t.traitName);
            entry.activations += 1;
            const teamEdge = team === "blue" ? (blueWinRate - 50) : (50 - blueWinRate);
            entry.winEdgeSum += teamEdge;
            if (winnerTeam === team) entry.winsWhenActive += 1;
        });
    });
    traitAnalytics.totalGames += 1;
    if (isAuto) traitAnalytics.autoSamples += 1;
}

function randomChampionByPos(pos, usedSet) {
    const pool = CHAMP_KEYS.filter((k) => (CHAMP_DB[k]?.pos || []).includes(pos) && !usedSet.has(k));
    if (pool.length === 0) return null;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    usedSet.add(pick);
    return pick;
}

function buildRandomSamplePicks() {
    const used = new Set();
    const out = { blue: [null, null, null, null, null], red: [null, null, null, null, null] };
    POSITIONS.forEach((pos, idx) => {
        out.blue[idx] = randomChampionByPos(pos, used);
        out.red[idx] = randomChampionByPos(pos, used);
    });
    return out;
}

function runTraitAutoSample(sampleCount = 80) {
    const beforeUserTeam = userTeam;
    userTeam = "blue";
    for (let i = 0; i < sampleCount; i++) {
        const samplePicks = buildRandomSamplePicks();
        const traitCtx = evaluateTraitContext(samplePicks);
        const b = traitCtx.stats.blue;
        const r = traitCtx.stats.red;
        const details = getWinRateDetails(b, r);
        const blueWin = clampPercent(details.blueWin + (traitCtx.bonus.blue.win - traitCtx.bonus.red.win));
        const winner = rollWinnerFromWinRate(blueWin);
        recordTraitAnalyticsSample(samplePicks, traitCtx, winner, blueWin, true);
    }
    saveTraitAnalytics();
    userTeam = beforeUserTeam;
}

function ensureTraitAutoSamples(target = 80) {
    const current = Number(traitAnalytics.autoSamples || 0);
    if (current >= target) return;
    runTraitAutoSample(target - current);
}

function getTraitBalanceReport(minOpportunity = 20) {
    const rows = Object.values(traitAnalytics.byTrait || {}).filter((row) => row.opportunities >= minOpportunity).map((row) => {
        const activationRate = row.opportunities > 0 ? (row.activations / row.opportunities) : 0;
        const activeWinRate = row.activations > 0 ? (row.winsWhenActive / row.activations) : 0;
        const avgWinEdge = row.activations > 0 ? (row.winEdgeSum / row.activations) : 0;
        return {
            특성: `${row.champName} · ${row.traitName}`,
            기회: row.opportunities,
            발동: row.activations,
            발동률: Number((activationRate * 100).toFixed(1)),
            발동승률: Number((activeWinRate * 100).toFixed(1)),
            평균승률기여: Number(avgWinEdge.toFixed(2))
        };
    });
    rows.sort((a, b) => b["평균승률기여"] - a["평균승률기여"]);
    return rows;
}

function getTraitRebalanceSuggestions(minOpportunity = 20) {
    return getTraitBalanceReport(minOpportunity).map((row) => {
        let 권장 = "유지";
        if (row["발동률"] >= 45 && row["평균승률기여"] >= 7) 권장 = "추가 하향";
        else if (row["발동률"] <= 18 && row["평균승률기여"] <= -4) 권장 = "조건 완화/상향";
        else if (row["발동승률"] >= 62 && row["평균승률기여"] >= 5) 권장 = "소폭 하향";
        else if (row["발동승률"] <= 43 && row["평균승률기여"] <= -3) 권장 = "소폭 상향";
        return { ...row, 권장 };
    });
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
    list.innerHTML = locked.map((key) => `<span class="locked-avatar" data-champ-key="${key}" title="${CHAMP_DB[key]?.name || key}"><img src="${getChampionImageUrl(key)}" alt="${CHAMP_DB[key]?.name || key}"></span>`).join("");
}

function clearBoardUI() {
    for (let i = 0; i < 5; i++) {
        const bBan = document.getElementById(`b-ban-${i}`);
        const rBan = document.getElementById(`r-ban-${i}`);
        const bSlot = document.getElementById(`b-slot-${i}`);
        const rSlot = document.getElementById(`r-slot-${i}`);
        if (bBan) {
            bBan.style.backgroundImage = "";
            bBan.dataset.champKey = "";
            bBan.classList.remove("has-info");
        }
        if (rBan) {
            rBan.style.backgroundImage = "";
            rBan.dataset.champKey = "";
            rBan.classList.remove("has-info");
        }
        if (bSlot) {
            const img = bSlot.querySelector('.champ-img');
            img.style.backgroundImage = "";
            img.dataset.champKey = "";
            img.classList.remove("has-info");
            bSlot.dataset.champKey = "";
            bSlot.classList.remove("has-info");
            bSlot.querySelector('.name').innerText = "-";
            bSlot.style.borderColor = "#222";
        }
        if (rSlot) {
            const img = rSlot.querySelector('.champ-img');
            img.style.backgroundImage = "";
            img.dataset.champKey = "";
            img.classList.remove("has-info");
            rSlot.dataset.champKey = "";
            rSlot.classList.remove("has-info");
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
    updateObjectiveBrief(0, 0, 0, 0, teamProfile.myTeamName, teamProfile.aiTeamName);
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
    seriesDraftStats = { picks: [], bans: [] };
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
    const guide = document.getElementById("strategy-guide");
    if (guide) {
        guide.innerHTML = `
            <div class="strategy-guide-title">전략 가이드</div>
            <div class="strategy-guide-line">선호 전략은 <b>내 팀(${teamProfile.myTeamName})</b>에만 적용됩니다.</div>
            <div class="strategy-guide-line">적합 챔피언을 많이 고를수록 보너스, 반대 성향을 고를수록 페널티가 생깁니다.</div>
            <div class="strategy-guide-line"><b>일반적</b> 선택 시 전략 보정 없이 기본 밴픽 점수만으로 계산됩니다.</div>
            <div class="strategy-guide-line">현재 선택: <b>${STRATEGY_CONFIGS[selectedStrategyKey]?.label || "일반적"}</b></div>
            ${getRealTeamStrategyGuideHtml()}
        `;
    }
}

function selectStrategy(key) {
    if (!STRATEGY_CONFIGS[key]) return;
    selectedStrategyKey = key;
    renderStrategyModal();
}

function confirmStrategyAndStart() {
    setDisplayById("strategy-modal", "none");
    setDisplayById("game-shell", "flex");
    if (shouldResetOnStrategyConfirm) {
        resetSeries();
    } else {
        startGameDraft();
    }
    shouldResetOnStrategyConfirm = false;
}

function chooseSide(side) {
    userTeam = side;
    aiTeam = side === "blue" ? "red" : "blue";
    applyWorldsTeamColors();
    renderWorldsSlotHints();
    shouldResetOnStrategyConfirm = true;
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

async function init() {
    ["tutorial-modal", "champ-stats-modal", "worlds-modal", "worlds-challenge-modal", "worlds-challenge-live-modal", "ai-balance-modal"].forEach(hoistModalToBody);
    ["tutorial-modal", "champ-stats-modal", "worlds-modal", "worlds-challenge-modal", "worlds-challenge-live-modal", "ai-balance-modal", "strategy-modal", "side-select-modal", "result-modal"].forEach((id) => setDisplayById(id, "none"));
    bindHomeActionButtons();
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
        bPicks.innerHTML += `<div class="slot" id="b-slot-${i}"><span class="pos-indicator">${pos}</span><div class="champ-img"></div><div class="slot-meta left"><div class="name">-</div><div class="player-hint"><div class="player-chip off"><img class="player-photo" src="" alt="PLAYER"><span class="player-nick">-</span></div><div class="player-note"></div></div></div><button class="swap-btn" onclick="handleSwap('blue', ${i})">🔃</button></div>`;
        rPicks.innerHTML += `<div class="slot" id="r-slot-${i}" style="flex-direction:row-reverse; text-align:right;"><span class="pos-indicator" style="right:10px; left:auto;">${pos}</span><div class="champ-img"></div><div class="slot-meta right"><div class="name">-</div><div class="player-hint"><div class="player-chip off"><img class="player-photo" src="" alt="PLAYER"><span class="player-nick">-</span></div><div class="player-note"></div></div></div><button class="swap-btn" onclick="handleSwap('red', ${i})">🔃</button></div>`;

        const bBan = document.getElementById(`b-ban-${i}`);
        const rBan = document.getElementById(`r-ban-${i}`);
        const bImg = document.querySelector(`#b-slot-${i} .champ-img`);
        const rImg = document.querySelector(`#r-slot-${i} .champ-img`);
        if (bBan) bBan.addEventListener("click", (e) => {
            e.stopPropagation();
            openChampionInfoByKey(bBan.dataset.champKey, bBan);
        });
        if (rBan) rBan.addEventListener("click", (e) => {
            e.stopPropagation();
            openChampionInfoByKey(rBan.dataset.champKey, rBan);
        });
        if (bImg) bImg.addEventListener("click", (e) => {
            e.stopPropagation();
            openChampionInfoByKey(bImg.dataset.champKey, bImg);
        });
        if (rImg) rImg.addEventListener("click", (e) => {
            e.stopPropagation();
            openChampionInfoByKey(rImg.dataset.champKey, rImg);
        });
    });
    bindChampionInfoInteractions();
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
    const worldsModal = document.getElementById('worlds-modal');
    if (worldsModal) {
        worldsModal.addEventListener('click', (e) => {
            if (e.target === worldsModal) closeWorldsModal();
        });
    }
    const challengeModal = document.getElementById('worlds-challenge-modal');
    if (challengeModal) {
        challengeModal.addEventListener('click', (e) => {
            if (e.target === challengeModal) closeWorldsChallengeSetup();
        });
    }
    const challengeLiveModal = document.getElementById('worlds-challenge-live-modal');
    if (challengeLiveModal) {
        challengeLiveModal.addEventListener('click', (e) => {
            if (e.target === challengeLiveModal) closeWorldsChallengeLive();
        });
    }
    const aiBalanceModal = document.getElementById('ai-balance-modal');
    if (aiBalanceModal) {
        aiBalanceModal.addEventListener('click', (e) => {
            if (e.target === aiBalanceModal) closeAiBalanceModal();
        });
    }
    const aiBalanceRunBtn = document.getElementById('ai-balance-run-btn');
    if (aiBalanceRunBtn && aiBalanceRunBtn.dataset.bound !== "1") {
        aiBalanceRunBtn.addEventListener('click', () => runAiBalanceSimulation(20));
        aiBalanceRunBtn.dataset.bound = "1";
    }
    const champStatsModal = document.getElementById('champ-stats-modal');
    if (champStatsModal) {
        champStatsModal.addEventListener('click', (e) => {
            if (e.target === champStatsModal) closeChampionStatsModal();
        });
    }
    renderStrategyModal();
    applyTeamNameInputs();
    await loadWorldsData();
    renderWorldsModalOptions();
    renderWorldsSlotHints();
    ensureTraitAutoSamples(80);
    window.getTraitBalanceReport = getTraitBalanceReport;
    window.printTraitBalanceReport = (minOpportunity = 20) => {
        const rows = getTraitBalanceReport(minOpportunity);
        console.table(rows);
        return rows;
    };
    window.printTraitRebalanceSuggestions = (minOpportunity = 20) => {
        const rows = getTraitRebalanceSuggestions(minOpportunity);
        console.table(rows);
        return rows;
    };
    startYoutubeBgm();
    openHome(true);
}

function bindChampionInfoInteractions() {
    const root = document.getElementById("game-shell");
    if (!root || root.dataset.infoBindDone === "1") return;
    root.dataset.infoBindDone = "1";
    root.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (target.closest(".swap-btn")) return;
        const infoEl = target.closest(".champ-img.has-info, .slot.has-info, .ban-slot.has-info, .locked-avatar[data-champ-key]");
        if (!infoEl) return;
        const key = infoEl.dataset?.champKey || resolveChampionKeyFromElement(infoEl);
        if (!key) return;
        e.preventDefault();
        e.stopPropagation();
        openChampionInfoByKey(key, infoEl);
    });
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
            const typeClass = getTypeColorClass(c.profile.type);
            const dmgClass = getDmgTypeColorClass(c.dmgType);
            div.className = `card ${isPending ? 'selected' : ''} ${isSelected || isFearlessLocked ? 'disabled' : ''} ${!isPickValid ? 'pos-mismatch' : ''}`;
            div.innerHTML = `
                <img src="${getChampionImageUrl(key)}" onerror="this.onerror=null;this.src='https://placehold.co/120x120/121c23/c8aa6e?text=${encodeURIComponent(c.name)}';">
                <button type="button" class="mobile-info-btn">정보</button>
                <p>${c.name}</p>
                <div class="card-meta">
                    <span class="card-meta-badge ${dmgClass}">${c.dmgType}</span>
                    <span class="card-meta-badge ${typeClass}">${TYPE_LABEL[c.profile.type]}</span>
                </div>
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
        seriesDraftStats.bans.push(key);
        const banEl = document.getElementById(`${step.t[0]}-ban-${step.id}`);
        banEl.style.backgroundImage = `url(${getChampionImageUrl(key)})`;
        banEl.dataset.champKey = key;
        banEl.classList.add("has-info");
    } else {
        picks[step.t][step.id] = key;
        seriesDraftStats.picks.push(key);
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
    renderWorldsSlotHints();
    const wrTrack = document.querySelector('.winrate-track');
    if (currentStep < DRAFT_ORDER.length) {
        wrTrack.style.display = "none";
        const step = DRAFT_ORDER[currentStep];
        if (step.type === 'ban') {
            const banEl = document.getElementById(`${step.t[0]}-ban-${step.id}`);
            if (banEl) banEl.classList.add('active');
        } else {
            const assigned = getTeamAssignedMap(step.t, picks);
            const pickedPosSet = new Set(Object.keys(assigned.byPos));
            POSITIONS.forEach((pos, idx) => {
                if (pickedPosSet.has(pos)) return;
                const slotEl = document.getElementById(`${step.t[0]}-slot-${idx}`);
                if (slotEl) slotEl.classList.add('active');
            });
        }
        
        const isAiTurn = userTeam && step.t === aiTeam;
        const actionLabel = step.type === "ban" ? "밴" : "픽";
        const actionObject = step.type === "ban" ? "밴할 챔피언" : "픽할 챔피언";
        const remainCount = getRemainingActionsInCurrentPhase(currentStep, step.t, step.type);
        const remainText = remainCount > 1 ? ` (이번 ${actionLabel} 페이즈 남은 ${remainCount}개)` : "";
        if (!userTeam || !aiTeam) {
            document.getElementById("step-msg").innerText = "진영을 선택하면 밴픽이 시작됩니다.";
        } else if (isAiTurn) {
            document.getElementById("step-msg").innerText = `AI가 ${actionLabel}을 하고 있습니다...${remainText}`;
        } else {
            document.getElementById("step-msg").innerText = `${actionObject}을 선택해주세요!${remainText}`;
        }
        if (isAiTurn && !aiThinking) {
            aiThinking = true;
            const thinkMs = Math.floor(Math.random() * (AI_THINK_MAX_MS - AI_THINK_MIN_MS + 1)) + AI_THINK_MIN_MS;
            setTimeout(aiTakeTurn, thinkMs);
        }
    } else {
        wrTrack.style.display = "flex";
        document.getElementById('step-msg').innerText = `SET ${currentGame} 종료`;
        document.querySelectorAll('.swap-btn').forEach(b => b.style.display = 'block');
        showFinalResult();
    }
    updatePickConfirmUI();
}

function getRemainingActionsInCurrentPhase(stepIndex, team, type) {
    if (stepIndex < 0 || stepIndex >= DRAFT_ORDER.length) return 0;
    let count = 0;
    for (let i = stepIndex; i < DRAFT_ORDER.length; i++) {
        const s = DRAFT_ORDER[i];
        if (!s || s.type !== type) break;
        if (s.t === team) count++;
    }
    return count;
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
    if (strategyCtx.effect.strategy === "General") {
        return `<span style="color:#c6d6df;">${strategyLabel}</span> | 보정 없음`;
    }
    const fit = strategyCtx.effect.fit;
    const mismatch = strategyCtx.effect.mismatch;
    const winBonus = strategyCtx.effect.winBonus;
    const sign = winBonus >= 0 ? "+" : "";
    return `<span style="color:#ffe082;">${strategyLabel}</span> | 적합 ${formatNum(fit)} / 부조화 ${formatNum(mismatch)} | 승률보정 ${sign}${formatNum(winBonus)}`;
}

function updateTeamPanels(b, r, traitCtx = null, strategyCtx = null, worldsCtx = null) {
    const maxProfileSum = 15;
    const makeBars = (teamStats, colorMap) => `
        <div class="mini-bars">
            <div class="mini-bar"><span class="mini-bar-label">돌진</span><span class="mini-bar-track"><span class="mini-bar-fill" style="width:${(teamStats.dive / maxProfileSum) * 100}%;background:${colorMap.dive};"></span></span><span class="mini-bar-value">${formatNum(teamStats.dive)}</span></div>
            <div class="mini-bar"><span class="mini-bar-label">포킹</span><span class="mini-bar-track"><span class="mini-bar-fill" style="width:${(teamStats.poke / maxProfileSum) * 100}%;background:${colorMap.poke};"></span></span><span class="mini-bar-value">${formatNum(teamStats.poke)}</span></div>
            <div class="mini-bar"><span class="mini-bar-label">받아</span><span class="mini-bar-track"><span class="mini-bar-fill" style="width:${(teamStats.anti / maxProfileSum) * 100}%;background:${colorMap.anti};"></span></span><span class="mini-bar-value">${formatNum(teamStats.anti)}</span></div>
        </div>
    `;
    const blueSummary = document.getElementById('b-team-summary');
    const redSummary = document.getElementById('r-team-summary');
    const blueRole = getTeamRoleLabel('blue');
    const redRole = getTeamRoleLabel('red');
    const worldsBlue = worldsCtx ? (worldsCtx.bonus.blue || 0) : 0;
    const worldsRed = worldsCtx ? (worldsCtx.bonus.red || 0) : 0;
    const blueRealTeamDetail = worldsModeEnabled ? getRealTeamStyleDetailBySide("blue") : null;
    const redRealTeamDetail = worldsModeEnabled ? getRealTeamStyleDetailBySide("red") : null;
    const blueRealTeamStyleText = blueRealTeamDetail
        ? `${blueRealTeamDetail.teamName} · ${blueRealTeamDetail.prefLabel}`
        : "미지정";
    const redRealTeamStyleText = redRealTeamDetail
        ? `${redRealTeamDetail.teamName} · ${redRealTeamDetail.prefLabel}`
        : "미지정";
    const blueRealTeamEffectText = blueRealTeamDetail
        ? blueRealTeamDetail.effectText
        : "실제 팀 정보를 찾지 못해 보정이 적용되지 않습니다.";
    const redRealTeamEffectText = redRealTeamDetail
        ? redRealTeamDetail.effectText
        : "실제 팀 정보를 찾지 못해 보정이 적용되지 않습니다.";
    blueSummary.innerHTML = `
        <div class="title">블루팀 요약 (${blueRole})</div>
        <div class="row"><span>기본</span><span>CC ${formatNum(b.cc)} | 딜 ${formatNum(b.dmg)} | 탱 ${formatNum(b.tank)}</span></div>
        <div class="row"><span>시간대</span><span>초 ${formatNum(b.early)} / 중 ${formatNum(b.mid)} / 후 ${formatNum(b.late)}</span></div>
        <div class="row"><span>AD/AP</span><span><span class="dmg-ad">AD ${Math.round(b.adRatio * 100)}%</span> / <span class="dmg-ap">AP ${Math.round((1 - b.adRatio) * 100)}%</span> / <span class="dmg-hybrid">HYB ${Math.round((b.hybridCount / 5) * 100)}%</span></span></div>
        <div class="row"><span>성향</span><span><span class="type-dive">돌진 ${formatNum(b.dive)}</span> / <span class="type-poke">포킹 ${formatNum(b.poke)}</span> / <span class="type-anti">받아치기 ${formatNum(b.anti)}</span></span></div>
        <div class="row"><span>조합</span><span class="${getTypeColorClass(getDominantProfile(b).type)}">${getCompLabel(b)}</span></div>
        <div class="row"><span>전략</span><span>${renderStrategySummary(strategyCtx, "blue")}</span></div>
        <div class="row"><span>실제 팀 보정</span><span>${worldsModeEnabled ? `+${formatNum(worldsBlue)}` : '<span style="color:#7f95a3;">OFF</span>'}</span></div>
        <div class="row"><span>실제 팀 성향</span><span>${worldsModeEnabled ? escapeHtml(blueRealTeamStyleText) : '<span style="color:#7f95a3;">OFF</span>'}</span></div>
        <div class="row row-wrap"><span>실제 팀 효과</span><span>${worldsModeEnabled ? escapeHtml(blueRealTeamEffectText) : '<span style="color:#7f95a3;">OFF</span>'}</span></div>
        ${renderSynergyMeter(b, "blue")}
        ${renderRadarChart(b, "blue")}
        ${makeBars(b, { dive: "#ef5350", poke: "#ffd54f", anti: "#66bb6a" })}
        <div class="trait-panel"><div class="trait-title">발동 특성</div>${renderTraitListHtml((traitCtx && traitCtx.traits && traitCtx.traits.blue) || [])}</div>
    `;
    redSummary.innerHTML = `
        <div class="title">레드팀 요약 (${redRole})</div>
        <div class="row"><span>기본</span><span>CC ${formatNum(r.cc)} | 딜 ${formatNum(r.dmg)} | 탱 ${formatNum(r.tank)}</span></div>
        <div class="row"><span>시간대</span><span>초 ${formatNum(r.early)} / 중 ${formatNum(r.mid)} / 후 ${formatNum(r.late)}</span></div>
        <div class="row"><span>AD/AP</span><span><span class="dmg-ad">AD ${Math.round(r.adRatio * 100)}%</span> / <span class="dmg-ap">AP ${Math.round((1 - r.adRatio) * 100)}%</span> / <span class="dmg-hybrid">HYB ${Math.round((r.hybridCount / 5) * 100)}%</span></span></div>
        <div class="row"><span>성향</span><span><span class="type-dive">돌진 ${formatNum(r.dive)}</span> / <span class="type-poke">포킹 ${formatNum(r.poke)}</span> / <span class="type-anti">받아치기 ${formatNum(r.anti)}</span></span></div>
        <div class="row"><span>조합</span><span class="${getTypeColorClass(getDominantProfile(r).type)}">${getCompLabel(r)}</span></div>
        <div class="row"><span>전략</span><span>${renderStrategySummary(strategyCtx, "red")}</span></div>
        <div class="row"><span>실제 팀 보정</span><span>${worldsModeEnabled ? `+${formatNum(worldsRed)}` : '<span style="color:#7f95a3;">OFF</span>'}</span></div>
        <div class="row"><span>실제 팀 성향</span><span>${worldsModeEnabled ? escapeHtml(redRealTeamStyleText) : '<span style="color:#7f95a3;">OFF</span>'}</span></div>
        <div class="row row-wrap"><span>실제 팀 효과</span><span>${worldsModeEnabled ? escapeHtml(redRealTeamEffectText) : '<span style="color:#7f95a3;">OFF</span>'}</span></div>
        ${renderSynergyMeter(r, "red")}
        ${renderRadarChart(r, "red")}
        ${makeBars(r, { dive: "#ef5350", poke: "#ffd54f", anti: "#66bb6a" })}
        <div class="trait-panel"><div class="trait-title">발동 특성</div>${renderTraitListHtml((traitCtx && traitCtx.traits && traitCtx.traits.red) || [])}</div>
    `;
}

function roundTeamStatsObject(stats) {
    if (!stats || typeof stats !== "object") return stats;
    const keys = [
        "cc", "dmg", "tank", "dive", "poke", "anti",
        "early", "mid", "late",
        "adCount", "apCount", "hybridCount",
        "adDmg", "apDmg", "adPressure", "apPressure",
        "adPower", "apPower", "adRatio"
    ];
    keys.forEach((k) => {
        if (!Number.isFinite(stats[k])) return;
        stats[k] = roundToOne(stats[k]);
    });
    if (Number.isFinite(stats.adRatio)) {
        stats.adRatio = Math.max(0, Math.min(1, roundToOne(stats.adRatio)));
    }
    return stats;
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
    return roundTeamStatsObject(res);
}

function getChampionKeyByName(name) {
    return CHAMP_KEY_BY_KO_NAME[normalizeNameToken(name)] || null;
}

function normalizeWorldsChampionName(name) {
    const raw = String(name || "").trim();
    if (!raw) return "";
    const token = normalizeNameToken(raw);
    const aliased = WORLDS_NAME_ALIAS[token];
    if (aliased && CHAMP_KEY_BY_KO_NAME[normalizeNameToken(aliased)]) return aliased;
    const exactKey = CHAMP_KEY_BY_KO_NAME[token];
    if (exactKey) return CHAMP_DB[exactKey]?.name || raw;
    const fuzzy = CHAMPION_NAMES_KO_DESC.find((nm) => {
        const n = normalizeNameToken(nm);
        return n.startsWith(token) || token.startsWith(n);
    });
    return fuzzy || raw;
}

function hasSignatureChampion(player, champName) {
    const target = normalizeNameToken(champName);
    return (player?.signatureChamps || []).some((nm) => normalizeNameToken(normalizeWorldsChampionName(nm)) === target);
}

function getTeamKeys(team, picksState) {
    return (picksState[team] || []).filter(Boolean);
}

function getTeamChampByPos(team, picksState, pos) {
    const assigned = getTeamAssignedMap(team, picksState);
    return assigned.byPos[pos] || null;
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
    return list.map((t) => renderTraitUnifiedItem(t)).join('');
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
    let activeTraitMeta = null;

    const addStats = (team, delta) => {
        const t = stats[team];
        const applied = activeTraitMeta
            ? scaleTraitStatDelta(activeTraitMeta.champName, activeTraitMeta.traitName, delta)
            : delta;
        Object.keys(applied).forEach((k) => {
            if (!Number.isFinite(applied[k])) return;
            if (!Number.isFinite(t[k])) t[k] = 0;
            t[k] += applied[k];
        });
    };

    const addBonus = (team, delta) => {
        const t = bonus[team];
        Object.keys(delta || {}).forEach((k) => {
            if (!Number.isFinite(delta[k])) return;
            if (!Number.isFinite(t[k])) t[k] = 0;
            let v = delta[k];
            if (activeTraitMeta) {
                if (k === "win") {
                    v = scaleTraitWinDelta(activeTraitMeta.champName, activeTraitMeta.traitName, delta[k]);
                } else if (["early", "mid", "late", "lateBias"].includes(k)) {
                    const scaled = scaleTraitStatDelta(activeTraitMeta.champName, activeTraitMeta.traitName, { [k]: delta[k] });
                    v = Number(scaled[k] || 0);
                }
            }
            t[k] += v;
        });
    };

    const addTrait = (team, champName, traitName, effectText, fn) => {
        if (!teamHasChampionName(team, picksState, champName)) return;
        const enemy = team === 'blue' ? 'red' : 'blue';
        activeTraitMeta = { champName, traitName };
        const ok = fn(team, enemy);
        activeTraitMeta = null;
        if (!ok) return;
        traits[team].push({ champName, traitName, effectText });
    };

    const applyTeamTraits = (team) => {
        const enemy = team === 'blue' ? 'red' : 'blue';
        const getMid = (t) => getTeamChampByPos(t, picksState, 'MID');
        const getTop = (t) => getTeamChampByPos(t, picksState, 'TOP');
        const getJng = (t) => getTeamChampByPos(t, picksState, 'JNG');
        const getAdc = (t) => getTeamChampByPos(t, picksState, 'ADC');
        const getSpt = (t) => getTeamChampByPos(t, picksState, 'SPT');

        addTrait(team, '리신', '솔랭 박살', '초반 +5', () => {
            const mid = getMid(team); if (!mid) return false;
            if (!['Leblanc', 'Ahri'].includes(mid)) return false;
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

        addTrait(team, '바이', '기동타격 연계', '상대 원딜 딜링 -12%', () => {
            if (!teamHasAnyChampionName(team, picksState, ['아리', '리산드라'])) return false;
            const enemyAdc = getAdc(enemy); if (!enemyAdc) return false;
            addStats(enemy, { dmg: -(CHAMP_DB[enemyAdc].dmg * 0.12) }); return true;
        });

        addTrait(team, '마오카이', '대자연의 마력', '팀 탱킹 +7', () => {
            const jng = getJng(team), spt = getSpt(team);
            if (!jng || !spt) return false;
            if (getCombatRoleByKey(jng) !== 'Tanker' || getCombatRoleByKey(spt) !== 'Tanker') return false;
            addStats(team, { tank: 7 }); return true;
        });

        addTrait(team, '아이번', '숲의 친구', '팀 초/중/후 +2', () => {
            if (!teamHasChampionName(team, picksState, '렝가')) return false;
            addStats(team, { early: 2, mid: 2, late: 2 }); return true;
        });

        addTrait(team, '녹턴', '일단 불꺼', '승률 +8%', () => {
            if (!teamHasAnyChampionName(team, picksState, ['트위스티드 페이트', '쉔'])) return false;
            addBonus(team, { win: 8 }); return true;
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
            addStats(team, { early: 2, dmg: 1, tank: 1 }); addBonus(team, { early: 5 }); return true;
        });

        addTrait(team, '나미', '근본 조합', '초반 +2 / 딜 +5', () => {
            const adc = getAdc(team); if (!adc || CHAMP_DB[adc].name !== '루시안') return false;
            addStats(team, { early: 2, dmg: 5 }); return true;
        });

        addTrait(team, '룰루', '요정의 친구', '후반 +7', () => {
            const adc = getAdc(team); if (!adc) return false;
            if (!['코그모', '징크스', '베인'].includes(CHAMP_DB[adc].name)) return false;
            addStats(team, { late: 7 }); return true;
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
            addStats(team, { late: 3 }); addBonus(team, { late: 3, lateBias: 1 }); return true;
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

        addTrait(team, '갱플랭크', '화약통', '딜링 +7', () => {
            if (Math.abs(stats[team].adRatio - 0.5) > 0.05) return false;
            addStats(team, { dmg: 7 }); return true;
        });

        addTrait(team, '야스오', '탑님 말파 가능?', '딜링 +7', () => {
            if (stats[team].cc < 10) return false;
            addStats(team, { dmg: 7 }); return true;
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
            t[k] = roundToOne(Math.max(0, t[k]));
        });
        roundTeamStatsObject(t);
    });

    return { stats, traits, bonus };
}

function getStrategyFitState(champ, strategyKey) {
    if (!champ) return 0;
    if (strategyKey === "General") return 0;
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

function getWorldsTeamStyleFitState(champ, prefStrategy) {
    if (!champ) return 0;
    if (!prefStrategy || prefStrategy === "General") return 0;
    if (prefStrategy === "Mid") {
        const peak = Math.max(champ.phase.early, champ.phase.mid, champ.phase.late);
        if (champ.phase.mid === peak) return 1;
        if (champ.phase.mid + 2 <= peak) return -1;
        return 0;
    }
    return getStrategyFitState(champ, prefStrategy);
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
    } else if (selectedStrategyKey === "General") {
        effect.fit = 0;
        effect.mismatch = 0;
        effect.neutral = teamKeys.length;
        effect.winBonus = 0;
    }

    ["cc", "dmg", "tank", "dive", "poke", "anti", "early", "mid", "late"].forEach((k) => {
        t[k] = roundToOne(Math.max(0, Number(t[k] || 0)));
    });
    effect.winBonus = roundToOne(effect.winBonus);
    roundTeamStatsObject(t);
    return { stats, effect };
}

function getWorldsTeamIdBySide(teamSide) {
    if (!worldsModeEnabled) return "";
    const enemySide = userTeam === "blue" ? "red" : "blue";
    if (teamSide === userTeam) return worldsConfig.myTeamId || "";
    if (teamSide === enemySide) return worldsConfig.enemyTeamId || "";
    return "";
}

function evaluateWorldsContext(picksState, sourceStats) {
    const stats = {
        blue: { ...sourceStats.blue },
        red: { ...sourceStats.red }
    };
    const bonus = { blue: 0, red: 0 };
    const details = { blue: [], red: [] };
    if (!worldsModeEnabled) return { stats, bonus, details };

    ["blue", "red"].forEach((team) => {
        const teamId = getWorldsTeamIdBySide(team);
        const roster = getWorldsRosterByTeamId(teamId);
        const worldsTeam = getWorldsTeamById(teamId);
        if (!roster || !roster.players || !worldsTeam) return;

        const style = worldsTeam.prefStrategy || "General";
        const styleLabel = worldsTeam.prefLabel || (STRATEGY_CONFIGS[style]?.label || style);
        let fitCount = 0;
        let mismatchCount = 0;

        POSITIONS.forEach((pos) => {
            const champKey = getTeamChampByPos(team, picksState, pos);
            const playerId = roster.players[pos];
            const player = getWorldsPlayerById(playerId);
            if (!champKey || !player) return;
            const champ = CHAMP_DB[champKey];
            if (!champ) return;

            let gained = 0;
            if (hasSignatureChampion(player, champ.name)) {
                const peakPhase = champ.phase.early >= champ.phase.mid && champ.phase.early >= champ.phase.late
                    ? "early"
                    : (champ.phase.mid >= champ.phase.late ? "mid" : "late");
                stats[team][peakPhase] += 1.6;
                stats[team].dmg += 1.1;
                gained += 2.2;
                details[team].push(`${player.nick} 시그니처(${champ.name})`);
            }

            const styleState = getWorldsTeamStyleFitState(champ, style);
            if (styleState > 0) fitCount += 1;
            else if (styleState < 0) mismatchCount += 1;
            bonus[team] += gained;
        });

        if (style !== "General") {
            if (style === "Dive" || style === "Poke" || style === "Anti") {
                const typeKey = style === "Dive" ? "dive" : (style === "Poke" ? "poke" : "anti");
                stats[team][typeKey] += fitCount * 1.2;
                stats[team].dmg += fitCount * 0.5;
                stats[team].tank += fitCount * 0.3;
                stats[team].mid += fitCount * 0.6;
                stats[team].dmg -= mismatchCount * 0.5;
                bonus[team] += fitCount * 1.4 - mismatchCount * 1.4;
            } else if (style === "Early") {
                stats[team].early += fitCount * 2.0 - mismatchCount * 1.6;
                stats[team].mid += fitCount * 0.6 - mismatchCount * 0.6;
                stats[team].dmg += fitCount * 0.6 - mismatchCount * 0.4;
                bonus[team] += fitCount * 1.7 - mismatchCount * 1.5;
            } else if (style === "Late") {
                stats[team].late += fitCount * 2.0 - mismatchCount * 1.6;
                stats[team].tank += fitCount * 0.8 - mismatchCount * 0.4;
                stats[team].dmg += fitCount * 0.4 - mismatchCount * 0.4;
                bonus[team] += fitCount * 1.7 - mismatchCount * 1.5;
            } else if (style === "Mid") {
                stats[team].mid += fitCount * 2.0 - mismatchCount * 1.6;
                stats[team].cc += fitCount * 0.4;
                stats[team].dmg += fitCount * 0.4 - mismatchCount * 0.4;
                bonus[team] += fitCount * 1.7 - mismatchCount * 1.5;
            }
            details[team].push(`팀 선호(${styleLabel}) 적합 ${fitCount} / 부조화 ${mismatchCount}`);
        }

        ["cc", "dmg", "tank", "dive", "poke", "anti", "early", "mid", "late"].forEach((k) => {
            stats[team][k] = roundToOne(Math.max(0, Number(stats[team][k] || 0)));
        });
        bonus[team] = roundToOne(bonus[team]);
        roundTeamStatsObject(stats[team]);
    });
    return { stats, bonus, details };
}

function getCorePenalty(stats) {
    let penalty = 0;

    // 딜링 미달: 25점 기준 (강력한 딜러진 요구)
    if (stats.dmg < 25) penalty -= 16 + (25 - stats.dmg) * 1.5;

    // 탱킹 미달: 20점 기준 (최소한의 앞라인 요구 - 브루저 조합 허용)
    if (stats.tank < 20) penalty -= 16 + (20 - stats.tank) * 1.5;

    // CC 미달: 7점 기준 (하드 CC기 필수)
    if (stats.cc <= 7) penalty -= 14 + (7 - stats.cc) * 2.5;

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
    const corePenaltyBlue = getCorePenalty(b);
    const corePenaltyRed = getCorePenalty(r);
    const corePenaltyEdge = corePenaltyBlue - corePenaltyRed;
    const dmgBalanceEdge = getDamageBalanceBonus(b) - getDamageBalanceBonus(r);
    const bMain = getDominantProfile(b);
    const rMain = getDominantProfile(r);
    const archetypeEdge = getArchetypeCounterBonus(bMain.type, bMain.value, rMain.type, rMain.value);
    const scalingEdge = getScalingEdge(b, r);
    const volatilityEdge = getVolatilityEdge(powerEdge, archetypeEdge, scalingEdge);
    const blueWin = clampPercent(
        calcWinRateFromEdges(powerEdge, dmgBalanceEdge, archetypeEdge)
        + corePenaltyEdge
        + scalingEdge
        + volatilityEdge
    );
    return {
        blueWin,
        powerEdge,
        corePenaltyBlue,
        corePenaltyRed,
        corePenaltyEdge,
        dmgBalanceEdge,
        archetypeEdge,
        scalingEdge,
        volatilityEdge
    };
}

function getPhaseProjection(b, r, overallWin) {
    const bMain = getDominantProfile(b);
    const rMain = getDominantProfile(r);
    const dmgBalanceEdge = getDamageBalanceBonus(b) - getDamageBalanceBonus(r);
    const archetypeEdge = getArchetypeCounterBonus(bMain.type, bMain.value, rMain.type, rMain.value);
    const corePenaltyEdge = getCorePenalty(b) - getCorePenalty(r);

    // Step 2/3/4를 Early/Mid/Late에 각각 적용
    const earlyPowerEdge = (b.early * 2 + b.cc * 3) - (r.early * 2 + r.cc * 3);
    const midPowerEdge = (b.mid * 2 + b.cc * 3) - (r.mid * 2 + r.cc * 3);
    const latePowerEdge = (b.late * 2 + b.cc * 3) - (r.late * 2 + r.cc * 3);

    const phaseCoreEdge = corePenaltyEdge * 0.6;
    const earlyWinRaw = calcWinRateFromEdges(earlyPowerEdge, dmgBalanceEdge, archetypeEdge) + phaseCoreEdge;
    const midWinRaw = calcWinRateFromEdges(midPowerEdge, dmgBalanceEdge, archetypeEdge) + phaseCoreEdge;
    const lateWinRaw = calcWinRateFromEdges(latePowerEdge, dmgBalanceEdge, archetypeEdge) + phaseCoreEdge;

    // 전체 기대승률과 완전히 분리되지 않도록 약하게 섞음
    const earlyWin = clampPercent(earlyWinRaw * 0.75 + overallWin * 0.25);
    const midWin = clampPercent(midWinRaw * 0.75 + overallWin * 0.25);
    const lateWin = clampPercent(lateWinRaw * 0.75 + overallWin * 0.25);
    return { earlyWin, midWin, lateWin };
}

function getWinRateByStats(b, r) {
    return getWinRateDetails(b, r).blueWin;
}

function evaluateDraftState(picksState) {
    const traitCtx = evaluateTraitContext(picksState);
    const strategyCtx = evaluateStrategyContext(picksState, traitCtx.stats);
    const worldsCtx = evaluateWorldsContext(picksState, strategyCtx.stats);
    const b = worldsCtx.stats.blue;
    const r = worldsCtx.stats.red;
    const details = getWinRateDetails(b, r);
    let strategyBlueEdge = 0;
    if (strategyCtx.effect.team === "blue") strategyBlueEdge += strategyCtx.effect.winBonus;
    if (strategyCtx.effect.team === "red") strategyBlueEdge -= strategyCtx.effect.winBonus;
    const worldsBlueEdge = (worldsCtx.bonus.blue - worldsCtx.bonus.red) * 1.15;
    const blueWin = clampPercent(
        details.blueWin
        + (traitCtx.bonus.blue.win - traitCtx.bonus.red.win)
        + strategyBlueEdge
        + worldsBlueEdge
    );
    const phases = getPhaseProjection(b, r, blueWin);
    phases.earlyWin = clampPercent(phases.earlyWin + (traitCtx.bonus.blue.early - traitCtx.bonus.red.early));
    phases.midWin = clampPercent(phases.midWin + (traitCtx.bonus.blue.mid - traitCtx.bonus.red.mid));
    phases.lateWin = clampPercent(
        phases.lateWin
        + (traitCtx.bonus.blue.late - traitCtx.bonus.red.late)
        + (traitCtx.bonus.blue.lateBias - traitCtx.bonus.red.lateBias) * 2
    );
    return { blueWin, b, r, phases, details, traitCtx, strategyCtx, worldsCtx };
}

function renderMobileTeamMini(b, r, phases, traitCtx = null, strategyCtx = null, worldsCtx = null) {
    const wrap = document.getElementById('mobile-team-mini');
    if (!wrap) return;
    const makeType = (stats) => {
        const d = getDominantProfile(stats);
        return `<span class="${getTypeColorClass(d.type)}">${TYPE_LABEL[d.type]} ${d.value}</span>`;
    };
    const makeTypeDetail = (stats) => {
        const d = getDominantProfile(stats);
        return `${makeType(stats)} <span style="color:#8fa3b2;">(돌 ${formatNum(stats.dive)} / 포 ${formatNum(stats.poke)} / 받 ${formatNum(stats.anti)})</span>`;
    };
    const phaseMax = {
        early: Math.max(1, b.early, r.early),
        mid: Math.max(1, b.mid, r.mid),
        late: Math.max(1, b.late, r.late)
    };
    const phaseValues = (stats) => ({
        early: Math.max(0, stats.early),
        mid: Math.max(0, stats.mid),
        late: Math.max(0, stats.late)
    });
    const phaseBarWidth = (value, max) => Math.max(5, Math.min(100, (value / max) * 100));
    const row = (team, stats) => {
        const color = team === 'blue' ? '#3db9ff' : '#ff7b6a';
        const apRatio = Math.max(0, Math.min(100, (1 - stats.adRatio) * 100));
        const adRatio = 100 - apRatio;
        const role = getTeamRoleLabel(team);
        const pv = phaseValues(stats);
        const traitList = ((traitCtx && traitCtx.traits && traitCtx.traits[team]) || []);
        const traitPreview = traitList.slice(0, 2).map((t) => t.champName + '·' + t.traitName).join(', ');
        const stratApplied = strategyCtx && strategyCtx.effect && strategyCtx.effect.team === team;
        const stratLabel = stratApplied ? (STRATEGY_CONFIGS[strategyCtx.effect.strategy]?.label || "전략") : "전략 없음";
        const worldBonus = worldsCtx ? (worldsCtx.bonus[team] || 0) : 0;
        const worldTag = worldsModeEnabled ? `실제팀 +${formatNum(worldBonus)}` : "실제팀 OFF";
        const stratMeta = stratApplied
            ? `${stratLabel} | 적합 ${strategyCtx.effect.fit} / 부조화 ${strategyCtx.effect.mismatch} | ${worldTag}`
            : `${stratLabel} | ${worldTag}`;
        return `<div class="mini-team-card ${team}">
            <div class="mini-team-head"><span class="mini-team-name">${role}</span><span class="mini-team-type">${team.toUpperCase()}</span></div>
            <div class="mini-team-line"><span>코어 스탯</span><span>CC ${formatNum(stats.cc)} | 딜 ${formatNum(stats.dmg)} | 탱 ${formatNum(stats.tank)}</span></div>
            <div class="mini-team-line"><span>팀 유형</span><span>${makeTypeDetail(stats)}</span></div>
            <div class="mini-team-phase-bars">
                <div class="mini-phase-row"><span>초</span><div class="mini-phase-track"><span class="mini-phase-fill" style="width:${phaseBarWidth(pv.early, phaseMax.early).toFixed(1)}%; background:${color};"></span></div><em>${formatNum(pv.early)}</em></div>
                <div class="mini-phase-row"><span>중</span><div class="mini-phase-track"><span class="mini-phase-fill" style="width:${phaseBarWidth(pv.mid, phaseMax.mid).toFixed(1)}%; background:${color};"></span></div><em>${formatNum(pv.mid)}</em></div>
                <div class="mini-phase-row"><span>후</span><div class="mini-phase-track"><span class="mini-phase-fill" style="width:${phaseBarWidth(pv.late, phaseMax.late).toFixed(1)}%; background:${color};"></span></div><em>${formatNum(pv.late)}</em></div>
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
    const evaluated = evaluateDraftState(picks);
    const { blueWin: bWin, b, r, phases, details, traitCtx, strategyCtx, worldsCtx } = evaluated;
    const blueRole = getTeamRoleLabel('blue');
    const redRole = getTeamRoleLabel('red');
    document.getElementById('blue-info').innerText = `${blueRole} (BLUE)`;
    document.getElementById('red-info').innerText = `${redRole} (RED)`;
    updateTeamPanels(b, r, traitCtx, strategyCtx, worldsCtx);
    renderMobileTeamMini(b, r, phases, traitCtx, strategyCtx, worldsCtx);
    if (currentStep >= DRAFT_ORDER.length) {
        document.getElementById('blue-win-bar').style.width = bWin + "%";
        document.getElementById('b-wr-txt').innerText = bWin.toFixed(1) + "%";
        document.getElementById('r-wr-txt').innerText = (100-bWin).toFixed(1) + "%";
    }

    return { bWin, b, r, phases, details, traitCtx, strategyCtx, worldsCtx };
}

function getPerspectiveWinForTeam(team, blueWin) {
    return team === "blue" ? blueWin : (100 - blueWin);
}

function getTakenSetFromState(picksState, bansState) {
    const taken = new Set([...fearlessLocked]);
    ["blue", "red"].forEach((team) => {
        (picksState[team] || []).forEach((k) => { if (k) taken.add(k); });
        (bansState[team] || []).forEach((k) => { if (k) taken.add(k); });
    });
    return taken;
}

function getCandidatesForStep(step, picksState, bansState) {
    const taken = getTakenSetFromState(picksState, bansState);
    let candidates = CHAMP_KEYS.filter((key) => !taken.has(key));
    if (step.type === "pick") {
        candidates = candidates.filter((key) => canPickForTeamState(step.t, key, picksState));
        if (candidates.length === 0) {
            candidates = CHAMP_KEYS.filter((key) => !taken.has(key));
        }
    }
    return candidates.sort((a, b) => a.localeCompare(b, "en"));
}

function applyStepActionTemp(step, key, picksState, bansState) {
    if (step.type === "pick") {
        const prev = picksState[step.t][step.id];
        picksState[step.t][step.id] = key;
        return () => { picksState[step.t][step.id] = prev; };
    }
    const prev = bansState[step.t][step.id];
    bansState[step.t][step.id] = key;
    return () => { bansState[step.t][step.id] = prev; };
}

function getRealTeamSignatureBonusForSide(teamSide, key) {
    if (!worldsModeEnabled) return 0;
    const teamId = getWorldsTeamIdBySide(teamSide);
    const champ = CHAMP_DB[key];
    const roster = getWorldsRosterByTeamId(teamId);
    if (!teamId || !champ || !roster || !roster.players) return 0;
    let any = false;
    let pos = 0;
    POSITIONS.forEach((p) => {
        const player = getWorldsPlayerById(roster.players[p]);
        if (!player) return;
        if (!hasSignatureChampion(player, champ.name)) return;
        any = true;
        if ((champ.pos || []).includes(p)) pos += 1;
    });
    if (pos > 0) return 3.6 + pos * 0.6;
    return any ? 1.4 : 0;
}

function getQuickPickScore(aiSide, key, picksState) {
    const champ = CHAMP_DB[key];
    if (!champ) return -Infinity;
    let score = champ.dmg * 1.35 + champ.tank * 0.95 + champ.cc * 1.5 + champ.profile.scale * 1.2 + champ.phase.mid * 0.35;
    const strategyTargetTeam = userTeam || "blue";
    if (aiSide === strategyTargetTeam) {
        score += getStrategyFitState(champ, selectedStrategyKey) * 1.8;
    }
    score += getRealTeamSignatureBonusForSide(aiSide, key);
    const enemySide = aiSide === "blue" ? "red" : "blue";
    const enemyDominant = getDominantProfile(getTeamStats(enemySide, picksState));
    const beats = { Dive: "Poke", Poke: "Anti", Anti: "Dive" };
    if (beats[champ.profile.type] === enemyDominant.type) {
        score += 2 + enemyDominant.value * 0.3;
    } else if (beats[enemyDominant.type] === champ.profile.type) {
        score -= 1.4 + enemyDominant.value * 0.2;
    }
    return score;
}

function getQuickBanThreatScore(aiSide, key, picksState) {
    const enemySide = aiSide === "blue" ? "red" : "blue";
    if (!canPickForTeamState(enemySide, key, picksState)) return -Infinity;
    const champ = CHAMP_DB[key];
    if (!champ) return -Infinity;
    const traitCount = getTraitsByChampionName(champ.name).length;
    const sigThreat = getRealTeamSignatureBonusForSide(enemySide, key);
    return champ.dmg * 1.25 + champ.tank * 0.65 + champ.cc * 1.6 + champ.profile.scale * 1.1 + champ.phase.mid * 0.3 + traitCount * 0.8 + sigThreat * 1.2;
}

function simulateBestResponseAiPerspective(aiSide, responseStep, picksState, bansState) {
    const candidates = getCandidatesForStep(responseStep, picksState, bansState);
    if (candidates.length === 0) {
        const baseline = evaluateDraftState(picksState);
        return getPerspectiveWinForTeam(aiSide, baseline.blueWin);
    }
    let bestEnemyPerspective = -Infinity;
    let worstAiPerspective = -Infinity;
    let bestKey = null;
    candidates.forEach((key) => {
        const undo = applyStepActionTemp(responseStep, key, picksState, bansState);
        const res = evaluateDraftState(picksState);
        const enemyPerspective = getPerspectiveWinForTeam(responseStep.t, res.blueWin);
        const aiPerspective = getPerspectiveWinForTeam(aiSide, res.blueWin);
        undo();
        const isBetter = enemyPerspective > bestEnemyPerspective + 1e-9
            || (Math.abs(enemyPerspective - bestEnemyPerspective) < 1e-9 && (bestKey === null || key.localeCompare(bestKey, "en") < 0));
        if (isBetter) {
            bestEnemyPerspective = enemyPerspective;
            worstAiPerspective = aiPerspective;
            bestKey = key;
        }
    });
    return worstAiPerspective;
}

function getThreatIfEnemyGetsKey(aiSide, key, picksState) {
    const enemySide = aiSide === "blue" ? "red" : "blue";
    if (!canPickForTeamState(enemySide, key, picksState)) return 0;
    const slotIdx = picksState[enemySide].findIndex((v) => !v);
    if (slotIdx < 0) return 0;
    const prev = picksState[enemySide][slotIdx];
    picksState[enemySide][slotIdx] = key;
    const res = evaluateDraftState(picksState);
    picksState[enemySide][slotIdx] = prev;
    return 100 - getPerspectiveWinForTeam(aiSide, res.blueWin);
}

function aiTakeTurn() {
    if (!userTeam || currentStep >= DRAFT_ORDER.length) return;
    const step = DRAFT_ORDER[currentStep];
    if (step.t !== aiTeam) return;

    const picksState = { blue: [...picks.blue], red: [...picks.red] };
    const bansState = { blue: [...bans.blue], red: [...bans.red] };
    const candidates = getCandidatesForStep(step, picksState, bansState);
    if (candidates.length === 0) {
        aiThinking = false;
        return;
    }
    const shortlistSize = step.type === "pick" ? AI_SHORTLIST_PICK : AI_SHORTLIST_BAN;
    const quickRanked = candidates.map((key) => {
        const quick = step.type === "pick"
            ? getQuickPickScore(aiTeam, key, picksState)
            : getQuickBanThreatScore(aiTeam, key, picksState);
        return { key, quick };
    }).sort((a, b) => {
        if (b.quick !== a.quick) return b.quick - a.quick;
        return a.key.localeCompare(b.key, "en");
    });
    const shortlist = quickRanked.slice(0, shortlistSize).map((row) => row.key);
    const nextStep = DRAFT_ORDER[currentStep + 1];
    const hasEnemyResponse = !!(nextStep && nextStep.t !== aiTeam);

    let bestKey = shortlist[0];
    let bestScore = -Infinity;
    shortlist.forEach((key) => {
        let immediate = 0;
        let worstAfterEnemyResponse = 0;
        if (step.type === "pick") {
            const undo = applyStepActionTemp(step, key, picksState, bansState);
            const res = evaluateDraftState(picksState);
            immediate = getPerspectiveWinForTeam(aiTeam, res.blueWin);
            worstAfterEnemyResponse = hasEnemyResponse
                ? simulateBestResponseAiPerspective(aiTeam, nextStep, picksState, bansState)
                : immediate;
            undo();
        } else {
            const threat = getThreatIfEnemyGetsKey(aiTeam, key, picksState);
            const undo = applyStepActionTemp(step, key, picksState, bansState);
            immediate = threat;
            worstAfterEnemyResponse = hasEnemyResponse
                ? (100 - simulateBestResponseAiPerspective(aiTeam, nextStep, picksState, bansState))
                : immediate;
            undo();
        }
        const finalScore = immediate * AI_IMMEDIATE_WEIGHT + worstAfterEnemyResponse * AI_RESPONSE_WEIGHT;
        const isBetter = finalScore > bestScore + 1e-9
            || (Math.abs(finalScore - bestScore) < 1e-9 && key.localeCompare(bestKey, "en") < 0);
        if (isBetter) {
            bestScore = finalScore;
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
        const img = slot.querySelector('.champ-img');
        img.style.backgroundImage = "";
        img.dataset.champKey = "";
        img.classList.remove("has-info");
        slot.dataset.champKey = "";
        slot.classList.remove("has-info");
            slot.querySelector('.name').innerText = "-";
    });

    const assigned = getTeamAssignedMap(team, picks);
    picks[team].forEach((key) => {
        if (!key) return;
        const pos = assigned.byKey[key] || CHAMP_DB[key]?.pos?.[0];
        const slotIdx = POSITIONS.indexOf(pos);
        if (slotIdx < 0) return;
        const slot = document.getElementById(`${team[0]}-slot-${slotIdx}`);
        const img = slot.querySelector('.champ-img');
        img.style.backgroundImage = `url(${getChampionImageUrl(key)})`;
        img.dataset.champKey = key;
        img.classList.add("has-info");
        slot.dataset.champKey = key;
        slot.classList.add("has-info");
        slot.querySelector('.name').innerText = CHAMP_DB[key].name;
    });
    renderWorldsSlotHints();
}

function teamDisplayName(team) {
    if (!userTeam) return team.toUpperCase();
    return team === userTeam ? teamProfile.myTeamName : teamProfile.aiTeamName;
}

function resolveChampionKeyFromElement(el) {
    if (!el) return null;
    const direct = el.dataset ? el.dataset.champKey : null;
    if (direct && CHAMP_DB[direct]) return direct;

    const slot = el.closest ? el.closest(".slot") : null;
    if (slot) {
        const nameEl = slot.querySelector(".name");
        const champName = nameEl ? String(nameEl.innerText || "").trim() : "";
        if (champName && champName !== "-") {
            const key = CHAMP_KEY_BY_KO_NAME[normalizeNameToken(champName)];
            if (key && CHAMP_DB[key]) return key;
        }
    }
    return null;
}

function openChampionInfoByKey(key, anchorEl = null) {
    const resolvedKey = key && CHAMP_DB[key] ? key : resolveChampionKeyFromElement(anchorEl);
    if (!resolvedKey || !CHAMP_DB[resolvedKey]) return;
    const isFearlessLocked = fearlessLocked.has(resolvedKey);
    const infoHtml = buildChampionInfoHtml(CHAMP_DB[resolvedKey], isFearlessLocked);
    // 클릭 시에는 환경과 무관하게 모달을 우선 띄워 상세정보 접근성을 보장
    openMobileChampionInfo(resolvedKey, isFearlessLocked);
    if (anchorEl) {
        showTooltipByElement(anchorEl, infoHtml);
    }
}

function randomPick(arr) {
    if (!arr || arr.length === 0) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

function getPhaseImpactChampion(team, phaseKey) {
    const keys = (picks[team] || []).filter(Boolean);
    if (keys.length === 0) return "팀";
    let bestKey = keys[0];
    let bestScore = -Infinity;
    keys.forEach((key) => {
        const c = CHAMP_DB[key];
        if (!c) return;
        const phaseStat = (c.phase && Number(c.phase[phaseKey])) || 0;
        const score = phaseStat * 1.8 + c.dmg * 1.2 + c.cc * 0.8 + c.profile.scale * 0.6;
        if (score > bestScore) {
            bestScore = score;
            bestKey = key;
        }
    });
    return CHAMP_DB[bestKey]?.name || "팀";
}

function getTeamPlaymaker(team) {
    const keys = (picks[team] || []).filter(Boolean);
    if (keys.length === 0) return "선수";
    const sorted = [...keys].sort((a, b) => {
        const ca = CHAMP_DB[a], cb = CHAMP_DB[b];
        const sa = (ca?.cc || 0) * 3 + (ca?.profile?.scale || 0) * 1.2 + (ca?.tank || 0) * 0.4;
        const sb = (cb?.cc || 0) * 3 + (cb?.profile?.scale || 0) * 1.2 + (cb?.tank || 0) * 0.4;
        return sb - sa;
    });
    return CHAMP_DB[sorted[0]]?.name || "선수";
}

function buildPhaseCommentary(res, finalWinner, projection) {
    const blueName = teamDisplayName("blue");
    const redName = teamDisplayName("red");
    const earlyFav = res.phases.earlyWin >= 50 ? "blue" : "red";
    const midFav = res.phases.midWin >= 50 ? "blue" : "red";
    const lateFav = res.phases.lateWin >= 50 ? "blue" : "red";
    const winner = finalWinner || (res.bWin >= 50 ? "blue" : "red");
    const loser = winner === "blue" ? "red" : "blue";
    const winnerName = winner === "blue" ? blueName : redName;
    const loserName = loser === "blue" ? blueName : redName;

    const earlyCarryKey = earlyFav === "blue" ? getPhaseImpactChampion("blue", "early") : getPhaseImpactChampion("red", "early");
    const midCarryKey = midFav === "blue" ? getPhaseImpactChampion("blue", "mid") : getPhaseImpactChampion("red", "mid");
    const lateCarryKey = lateFav === "blue" ? getPhaseImpactChampion("blue", "late") : getPhaseImpactChampion("red", "late");

    const earlyCarryChamp = CHAMP_DB[earlyCarryKey]?.name || earlyCarryKey;
    const midCarryChamp = CHAMP_DB[midCarryKey]?.name || midCarryKey;
    const lateCarryChamp = CHAMP_DB[lateCarryKey]?.name || lateCarryKey;

    const earlyJngKey = getTeamChampByPos(earlyFav, picks, "JNG");
    const earlyJngPlayer = earlyJngKey ? getWorldsPlayerForChampion(earlyFav, earlyJngKey, picks) : null;
    const earlyJngLabel = earlyJngPlayer ? `${earlyJngPlayer.nick}(${CHAMP_DB[earlyJngKey]?.name || earlyJngKey})` : `${getTeamPlaymaker(earlyFav)}`;

    const sim = projection || buildGoldKillProjection(res);
    const lines = [];

    lines.push(`전용준: ${earlyJngLabel}가 바텀 각을 찢어버렸어요! 말이 안 되는 피지컬입니다!`);
    lines.push(`이현우: ${earlyFav === "blue" ? blueName : redName}의 전매특허, 초반 스노우볼링이 굴러갑니다! ${earlyCarryChamp}가 전장을 휘젓고 있어요!`);

    sim.points.forEach((p) => {
        if (p.objectLine) lines.push(`전용준: ${p.objectLine}`);
        lines.push(`이현우: ${p.minute}분 킬 스코어 ${sim.myTeamName} ${p.myKills} : ${p.enemyKills} ${sim.enemyTeamName}, 한타가 계속 열립니다!`);
    });

    lines.push(`전용준: 중반에는 ${midCarryChamp} 중심의 구도가 열리면서 교전 템포가 확 올라갑니다!`);
    lines.push(`이현우: ${lateCarryChamp}가 후반 핵심 전장을 장악합니다. ${winnerName} 쪽으로 힘이 급격히 기웁니다!`);

    const sigLine = (() => {
        const assigned = getTeamAssignedMap(winner, picks);
        for (const pos of POSITIONS) {
            const key = assigned.byPos[pos];
            if (!key) continue;
            const player = getWorldsPlayerForChampion(winner, key, picks);
            if (player && hasSignatureChampion(player, CHAMP_DB[key]?.name || key)) {
                return `${player.nick} 선수의 시그니처 카드 ${CHAMP_DB[key]?.name || key}, 협곡을 지배합니다!`;
            }
        }
        return "";
    })();
    if (sigLine) lines.push(`전용준: ${sigLine}`);

    lines.push(`전용준: 넥서스가 파괴됩니다! ${winnerName}이(가) 세트를 가져갑니다!`);
    lines.push(`이현우: ${loserName}은(는) 다음 밴픽에서 반드시 반격 플랜을 만들어야 합니다.`);

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

function updateObjectiveBrief(myDragons, myBarons, enemyDragons, enemyBarons, myName, enemyName) {
    const el = document.getElementById("objective-brief");
    if (!el) return;
    const my = myName || teamProfile.myTeamName || "MY TEAM";
    const enemy = enemyName || teamProfile.aiTeamName || "AI TEAM";
    el.innerHTML = `
        <span class="obj-team-badges"><b class="obj-team-name">${escapeHtml(my)}</b><span class="obj-badge dragon">용 ${formatNum(myDragons)}</span><span class="obj-badge baron">바론 ${formatNum(myBarons)}</span></span>
        <span class="obj-team-badges"><b class="obj-team-name">${escapeHtml(enemy)}</b><span class="obj-badge dragon">용 ${formatNum(enemyDragons)}</span><span class="obj-badge baron">바론 ${formatNum(enemyBarons)}</span></span>
    `;
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
    let myDragons = 0;
    let enemyDragons = 0;
    let myBarons = 0;
    let enemyBarons = 0;

    const points = phaseWins.map((p) => {
        const edge = p.win - 50;
        const swing = Math.round(edge * 140 + Math.sign(edge || 1) * Math.pow(Math.abs(edge), 1.35) * 18);
        const snowball = Math.round(cumulativeGold * (edge >= 0 ? 0.08 : -0.08));
        cumulativeGold = Math.round(Math.max(-14000, Math.min(14000, cumulativeGold + swing + snowball)));

        const myPhasePower = (myStats[p.key] || 0) * 1.75 + myStats.cc * 1.8 + myStats.dmg * 0.7 + myStats.tank * 0.45;
        const enemyPhasePower = (enemyStats[p.key] || 0) * 1.75 + enemyStats.cc * 1.8 + enemyStats.dmg * 0.7 + enemyStats.tank * 0.45;
        const combatDiff = Math.round(myPhasePower - enemyPhasePower);

        const phaseFightBase = Math.max(1, Math.round(1 + Math.abs(myPhasePower - enemyPhasePower) / 20 + Math.abs(edge) / 24));
        const killEdge = Math.max(0, Math.round(Math.abs(edge) / 26));
        const myGainRaw = edge >= 0 ? (phaseFightBase + killEdge) : Math.max(0, phaseFightBase - killEdge);
        const enemyGainRaw = edge >= 0 ? Math.max(0, phaseFightBase - killEdge) : (phaseFightBase + killEdge);
        const myGain = Math.max(0, Math.min(7, myGainRaw));
        const enemyGain = Math.max(0, Math.min(7, enemyGainRaw));
        myKills += myGain;
        enemyKills += enemyGain;

        const dominantTeam = edge >= 0 ? myTeam : enemyTeam;
        const dominantName = teamDisplayName(dominantTeam);
        let objectLine = "";
        const absEdge = Math.abs(edge);
        if (p.key === "early" && absEdge >= 5) {
            if (dominantTeam === myTeam) myDragons += 1;
            else enemyDragons += 1;
            objectLine = `${p.minute}분, ${dominantName}이(가) 첫 드래곤을 가져갑니다.`;
        } else if (p.key === "mid" && absEdge >= 6) {
            if (dominantTeam === myTeam) myDragons += 1;
            else enemyDragons += 1;
            objectLine = `${p.minute}분, ${dominantName}이(가) 두 번째 드래곤까지 챙깁니다.`;
        } else if (p.key === "late" && absEdge >= 7) {
            if (dominantTeam === myTeam) myBarons += 1;
            else enemyBarons += 1;
            objectLine = `${p.minute}분, ${dominantName}이(가) 바론을 확보합니다!`;
        }
        return {
            ...p,
            edge,
            combatDiff,
            goldDiff: cumulativeGold,
            myKills,
            enemyKills,
            myDragons,
            enemyDragons,
            myBarons,
            enemyBarons,
            objectLine,
            line: `${p.minute}분 킬 스코어 ${myKills}:${enemyKills}, ${dominantName}이(가) 주도권을 쥡니다.`
        };
    });

    return {
        myTeam,
        enemyTeam,
        myTeamName: teamDisplayName(myTeam),
        enemyTeamName: teamDisplayName(enemyTeam),
        points,
        finalGoldDiff: cumulativeGold,
        finalCombatDiff: points.length > 0 ? points[points.length - 1].combatDiff : 0,
        finalMyKills: myKills,
        finalEnemyKills: enemyKills,
        finalMyDragons: myDragons,
        finalEnemyDragons: enemyDragons,
        finalMyBarons: myBarons,
        finalEnemyBarons: enemyBarons
    };
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function getLiveProjectionState(projection, progress) {
    const p = Math.max(0, Math.min(1, progress));
    const timeline = [{
        goldDiff: 0, combatDiff: 0, myKills: 0, enemyKills: 0,
        myDragons: 0, enemyDragons: 0, myBarons: 0, enemyBarons: 0
    }, ...(projection?.points || [])];
    if (timeline.length <= 1) {
        return {
            goldDiff: 0, combatDiff: 0, myKills: 0, enemyKills: 0,
            myDragons: 0, enemyDragons: 0, myBarons: 0, enemyBarons: 0
        };
    }
    const scaled = p * (timeline.length - 1);
    const idx = Math.floor(scaled);
    const nextIdx = Math.min(idx + 1, timeline.length - 1);
    const t = scaled - idx;
    const a = timeline[idx];
    const b = timeline[nextIdx];
    return {
        goldDiff: Math.round(lerp(a.goldDiff, b.goldDiff, t)),
        combatDiff: Math.round(lerp(a.combatDiff, b.combatDiff, t)),
        myKills: Math.round(lerp(a.myKills, b.myKills, t)),
        enemyKills: Math.round(lerp(a.enemyKills, b.enemyKills, t)),
        myDragons: a.myDragons || 0,
        enemyDragons: a.enemyDragons || 0,
        myBarons: a.myBarons || 0,
        enemyBarons: a.enemyBarons || 0
    };
}

function toCenteredPercent(value, maxAbs) {
    const v = Math.max(-maxAbs, Math.min(maxAbs, value));
    return 50 + (v / maxAbs) * 50;
}

function renderLiveBattleHeader(projection) {
    const myName = projection?.myTeamName || "MY TEAM";
    const enemyName = projection?.enemyTeamName || "AI TEAM";
    return `<div class="live-battle-wrap">
        <div class="live-battle-title">실시간 전황 (시뮬레이션 중 변동)</div>
        <div id="live-battle-stage" class="live-battle-stage">초반 준비중</div>
        <div id="live-kill-value" class="live-kill-hero">${myName} 0 : 0 ${enemyName}</div>
        <div class="live-battle-grid compact">
            <div class="live-metric-card compact">
                <span class="live-metric-label">자금 격차</span>
                <b id="live-gold-value" class="live-metric-value">0G</b>
                <div class="live-metric-track"><span id="live-gold-fill" class="live-metric-fill"></span></div>
            </div>
            <div class="live-metric-card compact">
                <span class="live-metric-label">전투력 격차</span>
                <b id="live-combat-value" class="live-metric-value">0</b>
                <div class="live-metric-track"><span id="live-combat-fill" class="live-metric-fill"></span></div>
            </div>
        </div>
        <div class="live-objective-badges">
            <div class="live-team-badges"><span class="live-team-name">${myName}</span><span id="live-my-dragon" class="obj-badge dragon">용 0</span><span id="live-my-baron" class="obj-badge baron">바론 0</span></div>
            <div class="live-team-badges"><span class="live-team-name">${enemyName}</span><span id="live-enemy-dragon" class="obj-badge dragon">용 0</span><span id="live-enemy-baron" class="obj-badge baron">바론 0</span></div>
        </div>
    </div>`;
}

function updateLiveBattlePanel(projection, progress) {
    const goldEl = document.getElementById("live-gold-value");
    const combatEl = document.getElementById("live-combat-value");
    const killEl = document.getElementById("live-kill-value");
    const goldFill = document.getElementById("live-gold-fill");
    const combatFill = document.getElementById("live-combat-fill");
    const myDragonEl = document.getElementById("live-my-dragon");
    const myBaronEl = document.getElementById("live-my-baron");
    const enemyDragonEl = document.getElementById("live-enemy-dragon");
    const enemyBaronEl = document.getElementById("live-enemy-baron");
    const stageEl = document.getElementById("live-battle-stage");
    if (!goldEl || !combatEl || !killEl || !goldFill || !combatFill || !myDragonEl || !myBaronEl || !enemyDragonEl || !enemyBaronEl || !stageEl) return;

    const state = getLiveProjectionState(projection, progress);
    const stage = progress < 0.34 ? "초반 교전" : (progress < 0.74 ? "중반 한타" : "후반 결정타");
    const myName = projection?.myTeamName || "MY TEAM";
    const enemyName = projection?.enemyTeamName || "AI TEAM";
    const combatSign = state.combatDiff > 0 ? "+" : "";

    goldEl.innerText = formatGoldDiff(state.goldDiff);
    combatEl.innerText = `${combatSign}${formatNum(state.combatDiff)}`;
    killEl.innerText = `${myName} ${formatNum(state.myKills)} : ${formatNum(state.enemyKills)} ${enemyName}`;
    myDragonEl.innerText = `용 ${formatNum(state.myDragons || 0)}`;
    myBaronEl.innerText = `바론 ${formatNum(state.myBarons || 0)}`;
    enemyDragonEl.innerText = `용 ${formatNum(state.enemyDragons || 0)}`;
    enemyBaronEl.innerText = `바론 ${formatNum(state.enemyBarons || 0)}`;
    stageEl.innerText = stage;

    goldFill.style.width = `${toCenteredPercent(state.goldDiff, 12000).toFixed(1)}%`;
    combatFill.style.width = `${toCenteredPercent(state.combatDiff, 40).toFixed(1)}%`;
    updateObjectiveBrief(
        state.myDragons || 0,
        state.myBarons || 0,
        state.enemyDragons || 0,
        state.enemyBarons || 0,
        myName,
        enemyName
    );
}

function renderGoldGraphSvg(points) {
    const maxAbs = Math.max(4000, ...points.map((p) => Math.abs(p.goldDiff)));
    return `<div class="econ-gold-bars">${points.map((p) => {
        const ratio = (p.goldDiff / maxAbs) * 50;
        const width = Math.abs(ratio);
        const left = ratio >= 0 ? 50 : (50 - width);
        return `<div class="econ-gold-row"><span class="econ-gold-min">${p.minute}분</span><div class="econ-gold-track"><span class="econ-gold-mid"></span><span class="econ-gold-fill" style="left:${left.toFixed(1)}%; width:${Math.max(2, width).toFixed(1)}%;"></span></div><span class="econ-gold-val">${formatGoldDiff(p.goldDiff)}</span></div>`;
    }).join("")}</div>`;
}

function buildCurrentMatchKdaRows(sim) {
    const makeRows = (team, teamKills, enemyKills) => {
        const assigned = getTeamAssignedMap(team, picks);
        const keys = POSITIONS.map((pos) => assigned.byPos[pos] || null);
        const champs = keys.map((k) => (k ? CHAMP_DB[k] : null));
        const kills = challengeDistribute(teamKills, champs.map((c) => c ? (c.dmg + c.profile.scale + c.phase.mid * 0.35) : 1));
        const deaths = challengeDistribute(enemyKills, champs.map((c) => c ? Math.max(1, 12 - c.tank - c.cc * 0.5) : 1));
        const assists = challengeDistribute(Math.max(teamKills + 2, Math.round(teamKills * 1.6)), champs.map((c) => c ? (c.cc * 1.7 + c.tank + c.profile.scale + 1) : 1));
        return POSITIONS.map((pos, idx) => {
            const key = keys[idx];
            const player = key ? getWorldsPlayerForChampion(team, key, picks) : null;
            return {
                pos,
                player: player?.nick || "-",
                champ: key ? (CHAMP_DB[key]?.name || key) : "-",
                k: kills[idx] || 0,
                d: deaths[idx] || 0,
                a: assists[idx] || 0
            };
        });
    };
    return {
        my: makeRows(sim.myTeam, sim.finalMyKills, sim.finalEnemyKills),
        enemy: makeRows(sim.enemyTeam, sim.finalEnemyKills, sim.finalMyKills)
    };
}

function renderCurrentKdaTable(rows, teamName) {
    return `<table class="challenge-kda-table"><thead><tr><th colspan="4">${escapeHtml(teamName)} KDA</th></tr><tr><th>포지션</th><th>선수/챔피언</th><th>K/D/A</th><th>KDA</th></tr></thead><tbody>${rows.map((r) => {
        const ratio = ((r.k + r.a) / Math.max(1, r.d)).toFixed(2);
        return `<tr><td>${r.pos}</td><td>${escapeHtml(r.player)} · ${escapeHtml(r.champ)}</td><td>${r.k}/${r.d}/${r.a}</td><td>${ratio}</td></tr>`;
    }).join("")}</tbody></table>`;
}

function renderGoldKillSection(res) {
    const sim = buildGoldKillProjection(res);
    const kda = buildCurrentMatchKdaRows(sim);
    return `<div class="econ-wrap">
        <div class="econ-title">자금력 / 전투 결과</div>
        <div class="econ-grid">
            <div class="econ-card">
                <div class="econ-sub">골드 유불리 (가로 막대)</div>
                ${renderGoldGraphSvg(sim.points)}
                <div class="econ-meta">최종 골드 격차: <b>${formatGoldDiff(sim.finalGoldDiff)}</b></div>
            </div>
            <div class="econ-card">
                <div class="econ-sub">킬 스코어 추이</div>
                <div class="econ-kill-list">
                    ${sim.points.map((p) => `<div class="econ-kill-item"><span>${p.minute}분</span><b>${sim.myTeamName} ${p.myKills} : ${p.enemyKills} ${sim.enemyTeamName}</b></div>`).join("")}
                </div>
                <div class="econ-meta" style="margin-top:6px;">오브젝트: ${sim.myTeamName} 용 ${sim.finalMyDragons} / 바론 ${sim.finalMyBarons} · ${sim.enemyTeamName} 용 ${sim.finalEnemyDragons} / 바론 ${sim.finalEnemyBarons}</div>
            </div>
        </div>
        <div class="econ-grid" style="margin-top:8px;">
            <div class="econ-card">${renderCurrentKdaTable(kda.my, sim.myTeamName)}</div>
            <div class="econ-card">${renderCurrentKdaTable(kda.enemy, sim.enemyTeamName)}</div>
        </div>
    </div>`;
}

function buildNarrationOnlyBody(res, projection) {
    return `
        <div class="sim-wrap result-glass-block">
            <div class="sim-title">10초 경기 시뮬레이션</div>
            <div class="sim-subtitle">중계진 해설 로그가 실시간으로 갱신됩니다.</div>
            ${renderLiveBattleHeader(projection)}
            ${renderPhaseRowsForPerspective(res)}
            <div id="narrator-feed" class="narrator-feed"><div class="narrator-line show">해설 준비중...</div></div>
        </div>
    `;
}

function buildSimulationLobbyBody(res, projection) {
    return '<div class="sim-wrap result-glass-block">' +
            '<div class="sim-title">시뮬레이션 준비 완료</div>' +
            '<p class="sim-subtitle">밴픽 결과를 기반으로 10초 경기 시뮬레이션을 시작합니다.</p>' +
            renderLiveBattleHeader(projection) +
            renderPhaseRowsForPerspective(res) +
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

function getWorldsPlayerForChampion(team, champKey, picksState = picks) {
    if (!worldsModeEnabled || !champKey) return null;
    const teamId = getWorldsTeamIdByTeam(team);
    const roster = getWorldsRosterByTeamId(teamId);
    if (!roster || !roster.players) return null;
    const assigned = getTeamAssignedMap(team, picksState);
    const pos = assigned?.byKey?.[champKey];
    if (!pos) return null;
    const playerId = roster.players[pos];
    return getWorldsPlayerById(playerId) || null;
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
    const player = getWorldsPlayerForChampion(team, key, picks);
    return {
        key,
        name: champ.name,
        title: meta.title,
        reason: meta.reason,
        playerNick: player?.nick || "",
        playerPhoto: player?.photo || ""
    };
}

function renderTraitResultSection(list) {
    if (!list || list.length === 0) return "<div class=\"trait-empty\">발동된 특성이 없습니다.</div>";
    return list.map((t) => renderTraitUnifiedItem(t)).join("");
}

function getFinishPhaseSummary(res, winner) {
    const blueWin = winner === "blue";
    const early = blueWin ? res.phases.earlyWin : (100 - res.phases.earlyWin);
    const mid = blueWin ? res.phases.midWin : (100 - res.phases.midWin);
    const late = blueWin ? res.phases.lateWin : (100 - res.phases.lateWin);

    if (early >= 60 && early >= mid + 3 && early >= late + 4) {
        return { phase: "초반", reason: "초반 우위 " + early.toFixed(1) + "%로 스노우볼을 굴려 빠르게 끝냈습니다." };
    }
    if (mid >= 57 && mid >= late + 2) {
        return { phase: "중반", reason: "중반 한타 우위 " + mid.toFixed(1) + "%를 바탕으로 오브젝트를 연달아 가져가며 마무리했습니다." };
    }
    return { phase: "후반", reason: "후반 운영/한타 우위(후반 " + late.toFixed(1) + "%)로 최종 승부를 결정했습니다." };
}
function getResultBarPercent(value, max) {
    const n = Number(value) || 0;
    const m = Math.max(1, Number(max) || 1);
    return Math.max(0, Math.min(100, (n / m) * 100));
}

function renderResultMetricRow(label, value, max, toneClass, icon) {
    const pct = getResultBarPercent(value, max);
    return `<div class="result-metric-row">
        <span class="result-metric-label">${icon ? icon + " " : ""}${label}</span>
        <div class="result-metric-track"><span class="result-metric-fill ${toneClass}" style="width:${pct.toFixed(1)}%;"></span></div>
        <b class="result-metric-value">${formatNum(value)}</b>
    </div>`;
}

function renderResultTypeMeter(label, value, cls) {
    const pct = getResultBarPercent(value, 15);
    return `<div class="result-type-meter">
        <span class="result-type-label ${cls}">${label}</span>
        <div class="result-type-track"><span class="result-type-fill ${cls}" style="width:${pct.toFixed(1)}%;"></span></div>
        <b>${formatNum(value)}</b>
    </div>`;
}

function renderResultTeamCard(team, stats, compLabel) {
    const teamName = teamDisplayName(team);
    const tone = team === "blue" ? "blue" : "red";
    return `<section class="result-team-card ${tone}">
        <div class="result-team-head">
            <div class="result-team-title-wrap">
                <h3 class="result-team-name">${escapeHtml(teamName)}</h3>
                <span class="result-comp-badge">${escapeHtml(compLabel)}</span>
            </div>
            <span class="result-side-chip ${tone}">${team.toUpperCase()}</span>
        </div>
        <div class="result-metrics">
            ${renderResultMetricRow("CC", stats.cc, 15, "tone-cc", "🧩")}
            ${renderResultMetricRow("딜링", stats.dmg, 50, "tone-dmg", "⚔")}
            ${renderResultMetricRow("탱킹", stats.tank, 50, "tone-tank", "🛡")}
        </div>
        <div class="result-sub-block">
            <div class="result-sub-title">팀 유형</div>
            ${renderResultTypeMeter("돌진", stats.dive, "type-dive")}
            ${renderResultTypeMeter("포킹", stats.poke, "type-poke")}
            ${renderResultTypeMeter("받아치기", stats.anti, "type-anti")}
        </div>
        <div class="result-sub-block">
            <div class="result-sub-title">파워커브</div>
            <div class="result-phase-mini">
                <span>초 ${formatNum(stats.early)}</span>
                <span>중 ${formatNum(stats.mid)}</span>
                <span>후 ${formatNum(stats.late)}</span>
            </div>
        </div>
    </section>`;
}

function buildResultBody(res, winner, loser, seriesEnded) {
    const bComp = getCompLabel(res.b);
    const rComp = getCompLabel(res.r);
    const winnerMvp = buildTeamMvp(winner, res);
    const winnerTeamLabel = winner === "blue" ? teamDisplayName("blue") : teamDisplayName("red");
    const finish = getFinishPhaseSummary(res, winner);
    const strategyEffect = res.strategyCtx && res.strategyCtx.effect ? res.strategyCtx.effect : null;
    const strategyTeamLabel = strategyEffect ? teamDisplayName(strategyEffect.team) : "-";
    const strategyName = strategyEffect ? (STRATEGY_CONFIGS[strategyEffect.strategy]?.label || "전략") : "-";
    const strategyText = strategyEffect
        ? `${strategyTeamLabel} ${strategyName} · 적합 ${formatNum(strategyEffect.fit)} / 부조화 ${formatNum(strategyEffect.mismatch)} / 보정 ${strategyEffect.winBonus >= 0 ? "+" : ""}${formatNum(strategyEffect.winBonus)}`
        : "전략 보정 없음";
    const worldsText = worldsModeEnabled && res.worldsCtx
        ? `${teamDisplayName("blue")} +${formatNum(res.worldsCtx.bonus.blue || 0)} · ${teamDisplayName("red")} +${formatNum(res.worldsCtx.bonus.red || 0)}`
        : "OFF";

    const winnerRole = winner === userTeam ? "user" : "ai";
    const loserRole = winnerRole === "user" ? "ai" : "user";
    const blueWr = roundToOne(res.bWin);
    const redWr = roundToOne(100 - res.bWin);

    return `
        <div class="result-overview-strip">
            <div class="result-overview-main">
                <span class="result-overview-label">종료 시점</span>
                <b class="result-overview-value">${finish.phase}</b>
                <span class="result-overview-reason">${finish.reason}</span>
            </div>
            <div class="result-overview-kpis">
                <span class="result-overview-chip blue">BLUE ${formatNum(blueWr)}%</span>
                <span class="result-overview-chip red">RED ${formatNum(redWr)}%</span>
            </div>
        </div>

        <div class="result-info-line">
            <span>세트 스코어</span>
            <b>${teamProfile.myTeamName} ${seriesRoleWins.user} : ${seriesRoleWins.ai} ${teamProfile.aiTeamName}</b>
        </div>
        <div class="result-info-line slim"><span>전략 적용</span><b>${strategyText}</b></div>
        <div class="result-info-line slim"><span>실제 팀 보정</span><b>${worldsText}</b></div>

        <div class="result-dashboard-grid">
            ${renderResultTeamCard("blue", res.b, bComp)}
            ${renderResultTeamCard("red", res.r, rComp)}
        </div>

        <div class="mvp-wrap single result-glass-block">
            <div class="mvp-card ${winner}">
                <div class="mvp-title">POG · ${escapeHtml(winnerTeamLabel)}</div>
                ${
                    winnerMvp
                        ? `<div class="mvp-head"><img class="mvp-portrait mvp-player-photo" src="${winnerMvp.playerPhoto || getPlayerPhotoFallbackByNick(winnerMvp.playerNick || 'POG', 72)}" alt="${winnerMvp.playerNick || 'PLAYER'}" onerror="this.onerror=null;this.src='${getPlayerPhotoFallbackByNick('POG', 72)}';"><div class="mvp-head-meta"><div class="mvp-player-name">${winnerMvp.playerNick || '선수 미지정'}</div><div class="mvp-name">${winnerMvp.name} (${winnerMvp.title})</div></div><img class="mvp-portrait" src="${getChampionImageUrl(winnerMvp.key)}" alt="${winnerMvp.name}" onerror="this.onerror=null;this.src='https://placehold.co/72x72/121c23/c8aa6e?text=${encodeURIComponent(winnerMvp.name)}';"></div><div class="mvp-reason">${winnerMvp.reason}</div>`
                        : `<div class="mvp-name">-</div><div class="mvp-reason">POG 데이터가 없습니다.</div>`
                }
            </div>
        </div>

        <div class="mvp-wrap result-glass-block">
            <div class="mvp-card blue"><div class="mvp-title">블루팀 특성</div>${renderTraitResultSection(res.traitCtx && res.traitCtx.traits && res.traitCtx.traits.blue)}</div>
            <div class="mvp-card red"><div class="mvp-title">레드팀 특성</div>${renderTraitResultSection(res.traitCtx && res.traitCtx.traits && res.traitCtx.traits.red)}</div>
        </div>

        <div class="sim-wrap result-glass-block">
            <div class="sim-title">경기 리플레이 대시보드</div>
            ${renderPhaseRowsForPerspective(res)}
            ${renderGoldKillSection(res)}
            <div class="narrator-feed"><div class="narrator-line show">해설 종료. 결과가 확정되었습니다.</div></div>
        </div>

        <p class="result-next-hint">${seriesEnded ? `시리즈 종료: ${winnerRole === "user" ? teamProfile.myTeamName : teamProfile.aiTeamName} 승리 (${seriesRoleWins[winnerRole]}-${seriesRoleWins[loserRole]})` : (hardFearless ? `다음 SET ${currentGame + 1}에서도 하드 피어리스 잠금이 유지됩니다.` : `다음 SET ${currentGame + 1}은 잠금 없이 진행됩니다.`)}</p>
    `;
}

function appendNarratorLine(feed, text) {
    if (!feed) return;
    const line = document.createElement("div");
    line.className = "narrator-line";
    line.textContent = text;
    feed.appendChild(line);
    requestAnimationFrame(() => line.classList.add("show"));
    const limit = 7;
    while (feed.children.length > limit) {
        feed.removeChild(feed.firstElementChild);
    }
}

function startResultNarration(res, finalWinner, projection, onComplete) {
    const nextBtn = document.getElementById('result-next-btn');
    const feed = document.getElementById('narrator-feed');
    const lines = buildPhaseCommentary(res, finalWinner, projection);
    let idx = 0;

    nextBtn.disabled = true;
    nextBtn.style.opacity = "0.6";
    nextBtn.innerText = "경기 진행중... 10";
    if (feed) {
        feed.innerHTML = "";
        appendNarratorLine(feed, "🎙 해설: 밴픽 결과를 바탕으로 시뮬레이션을 시작합니다.");
    }
    resultFlowState = "simulating";
    updateLiveBattlePanel(projection, 0);

    if (matchNarrationTimer) clearInterval(matchNarrationTimer);
    matchNarrationTimer = setInterval(() => {
        idx += 1;
        const remain = Math.max(10 - idx, 0);
        updateLiveBattlePanel(projection, Math.min(idx / 10, 1));
        const maxNarrationLines = Math.min(lines.length, 9);
        if (idx <= maxNarrationLines && feed) {
            appendNarratorLine(feed, `🎙 ${lines[idx - 1]}`);
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
    const projection = buildGoldKillProjection(res);
    document.getElementById('final-stats').innerHTML = buildSimulationLobbyBody(res, projection);
    updateLiveBattlePanel(projection, 0);
}

function startSimulationMatch() {
    if (resultFlowState !== "ready" || !pendingSimulationResult) return;
    const res = pendingSimulationResult;
    const projection = buildGoldKillProjection(res);
    const simulatedWinner = rollWinnerFromWinRate(res.bWin);
    const nextBtn = document.getElementById('result-next-btn');
    document.getElementById('winner-text').innerText = "경기 시뮬레이션 진행중";
    document.getElementById('winner-text').style.color = "var(--gold)";
    document.getElementById('final-stats').innerHTML = buildNarrationOnlyBody(res, projection);
    nextBtn.disabled = true;
    nextBtn.style.opacity = "0.6";
    nextBtn.innerText = "경기 진행중... 10";

    startResultNarration(res, simulatedWinner, projection, () => {
        const winner = simulatedWinner;
        const loser = winner === "blue" ? "red" : "blue";
        const winnerRole = winner === userTeam ? "user" : "ai";
        const loserRole = winnerRole === "user" ? "ai" : "user";

        seriesWins[winner] += 1;
        seriesRoleWins[winnerRole] += 1;
        recordTraitAnalyticsSample(picks, res.traitCtx, winner, res.bWin, false);
        saveTraitAnalytics();
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
                strategyLabel: STRATEGY_CONFIGS[selectedStrategyKey]?.label || "-",
                winnerSide: winner,
                loserSide: loser,
                pickKeys: [...seriesDraftStats.picks],
                banKeys: [...seriesDraftStats.bans],
                bluePickKeys: [...(picks.blue || []).filter(Boolean)],
                redPickKeys: [...(picks.red || []).filter(Boolean)]
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
    applyWorldsTeamColors();
    currentGame += 1;
    shouldResetOnStrategyConfirm = false;
    renderStrategyModal();
    setDisplayById("strategy-modal", "flex");
}

function showTooltip(e, txt) {
    showTooltipAtPoint(e.clientX, e.clientY, txt);
}

function showTooltipAtPoint(clientX, clientY, txt) {
    const tip = document.getElementById('tooltip');
    tip.innerHTML = `<button type="button" class="tip-close" onclick="hideTooltip()">닫기</button>${txt}`;
    tip.style.display = 'block';
    positionTooltip(clientX, clientY);
}

function showTooltipByElement(el, txt) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    showTooltipAtPoint(cx, cy, txt);
}

function positionTooltip(clientX, clientY) {
    const tip = document.getElementById('tooltip');
    const pad = 14;
    const tipRect = tip.getBoundingClientRect();
    let left = clientX + pad;
    let top = clientY + pad;
    if (left + tipRect.width > window.innerWidth - pad) left = clientX - tipRect.width - pad;
    if (top + tipRect.height > window.innerHeight - pad) top = clientY - tipRect.height - pad;
    if (left < pad) left = pad;
    if (top < pad) top = pad;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
}

function moveTooltip(e) {
    const tip = document.getElementById('tooltip');
    if (tip.style.display !== 'block') return;
    positionTooltip(e.clientX, e.clientY);
}
function hideTooltip() { document.getElementById('tooltip').style.display = 'none'; }

function closeTutorial() {
    document.getElementById('tutorial-modal').style.display = 'none';
}

init();
