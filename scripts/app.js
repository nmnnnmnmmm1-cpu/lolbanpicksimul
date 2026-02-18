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
let userTeam = null;
let aiTeam = null;
let currentGame = 1;
let seriesWins = { blue: 0, red: 0 };
let fearlessLocked = new Set();
let aiThinking = false;
let lastSeriesEnded = false;
let maxGames = 5;
let winTarget = 3;
let hardFearless = true;
let selectedModeKey = "bo5";
let pendingPickKey = null;
let matchNarrationTimer = null;
const MODE_RECORDS_KEY = "lol_draft_mode_records_v1";
const MODE_CONFIGS = {
    single: { label: "단판", maxGames: 1, winTarget: 1, hardFearless: false },
    bo3: { label: "3전제 (하드피어리스)", maxGames: 3, winTarget: 2, hardFearless: true },
    bo5: { label: "5전제 (하드피어리스)", maxGames: 5, winTarget: 3, hardFearless: true }
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

function getChampionImageUrl(key) {
    const imageKey = CHAMP_IMG_KEY_MAP[key] || key;
    return `https://ddragon.leagueoflegends.com/cdn/${CDN_VERSION}/img/champion/${imageKey}.png`;
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
    document.getElementById("record-single").innerText = getModeRecordLine("single");
    document.getElementById("record-bo3").innerText = getModeRecordLine("bo3");
    document.getElementById("record-bo5").innerText = getModeRecordLine("bo5");
}

function openHome() {
    renderHomeStats();
    document.getElementById("home-modal").style.display = "flex";
    document.getElementById("side-select-modal").style.display = "none";
    document.getElementById("tutorial-modal").style.display = "none";
}

function selectMode(modeKey) {
    applyModeConfig(modeKey);
    document.getElementById("home-modal").style.display = "none";
    document.getElementById("side-title").innerText = MODE_CONFIGS[modeKey].label;
    document.getElementById("side-desc").innerText = "진영을 선택하세요. 선택하지 않은 팀은 컴퓨터가 자동 밴픽합니다.";
    document.getElementById("side-select-modal").style.display = "flex";
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
        iframe.src = "https://www.youtube.com/embed/eMCkLrF8C2s?autoplay=1&loop=1&playlist=eMCkLrF8C2s&controls=1&modestbranding=1&rel=0";
        if (status) status.innerText = "유튜브 BGM 자동 재생중 (브라우저 정책으로 차단될 수 있음)";
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
    const sideTxt = userTeam ? `MY TEAM: ${userTeam.toUpperCase()} / AI TEAM: ${aiTeam.toUpperCase()}` : "MY TEAM: 선택 전";
    const lockTxt = hardFearless ? `누적 잠금 ${fearlessLocked.size}` : "잠금 없음";
    document.getElementById('series-info').innerText = `${mode.label} | SET ${currentGame}/${maxGames} | SCORE B ${seriesWins.blue} : ${seriesWins.red} R | ${sideTxt} | ${lockTxt}`;
}

function getTeamRoleLabel(team) {
    if (!userTeam) return team.toUpperCase();
    return team === userTeam ? "MY TEAM" : "AI TEAM";
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
    pendingPickKey = null;
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
    fearlessLocked = new Set();
    lastSeriesEnded = false;
    startGameDraft();
}

function chooseSide(side) {
    userTeam = side;
    aiTeam = side === "blue" ? "red" : "blue";
    document.getElementById('side-select-modal').style.display = 'none';
    resetSeries();
}

function init() {
    const bBans = document.getElementById('b-bans');
    const rBans = document.getElementById('r-bans');
    const bPicks = document.getElementById('b-picks');
    const rPicks = document.getElementById('r-picks');

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
    });
    renderPool();
    updateUI();
    calculateStats();
    openHome();
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
        const isPickValid = !pickingTeam || canPickForTeam(pickingTeam, key);

        if (matchesSearch && matchesPosFilter && matchesTypeFilter) {
            const div = document.createElement('div');
            div.className = `card ${key === pendingPickKey ? 'selected' : ''} ${isSelected || isFearlessLocked ? 'disabled' : ''} ${!isPickValid ? 'pos-mismatch' : ''}`;
            div.innerHTML = `
                <img src="${getChampionImageUrl(key)}" onerror="this.onerror=null;this.src='https://placehold.co/120x120/121c23/c8aa6e?text=${encodeURIComponent(c.name)}';">
                <p>${c.name}</p>
            `;
            
            div.onmouseover = (e) => showTooltip(e, `
                <b>${c.name}</b><br>유형: ${TYPE_LABEL[c.profile.type]} ${c.profile.scale}<br>
                <div style="margin-top:4px; color:#ffe082;">피해 타입: ${c.dmgType}</div>
                ${renderStatRow("딜링", "⚔", c.dmg, 10, "#ef5350")}
                ${renderStatRow("탱킹", "🛡", c.tank, 10, "#42a5f5")}
                ${renderStatRow("CC", "🌀", c.cc, 3, "#ffca28")}
                ${renderStatRow("초반", "⏱", c.phase.early, 10, "#26c6da")}
                ${renderStatRow("중반", "📈", c.phase.mid, 10, "#66bb6a")}
                ${renderStatRow("후반", "🏁", c.phase.late, 10, "#ffa726")}
                ${renderStatRow(TYPE_LABEL[c.profile.type], "◆", c.profile.scale, 3, "#ab47bc")}
                <div style="margin-top:5px; color:#cfd8dc;">주 포지션: ${c.pos.join(', ')}</div>${isFearlessLocked ? '<div style="margin-top:5px;color:#ef9a9a;">피어리스 잠금됨 (이전 세트 픽)</div>' : ''}
            `);
            div.onmousemove = (e) => moveTooltip(e);
            div.onmouseout = hideTooltip;
            
            if (!isSelected && !isFearlessLocked && isPickValid) {
                div.onclick = () => {
                    if (step && step.type === 'pick' && step.t === userTeam) {
                        pendingPickKey = key;
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
    if (!panel || !nameEl) return;
    if (currentStep >= DRAFT_ORDER.length) {
        panel.classList.add("hidden");
        return;
    }
    const step = DRAFT_ORDER[currentStep];
    const canShow = step.type === "pick" && step.t === userTeam && !!pendingPickKey;
    if (!canShow) {
        panel.classList.add("hidden");
        return;
    }
    nameEl.innerText = CHAMP_DB[pendingPickKey]?.name || pendingPickKey;
    panel.classList.remove("hidden");
}

function confirmPendingPick() {
    if (!pendingPickKey) return;
    const key = pendingPickKey;
    pendingPickKey = null;
    updatePickConfirmUI();
    selectChamp(key);
}

function cancelPendingPick() {
    pendingPickKey = null;
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

    pendingPickKey = null;
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
        document.getElementById('pos-guide').innerText = step.type === 'pick'
            ? "💡 챔피언을 선택한 뒤 '픽 확정' 버튼을 눌러야 반영됩니다."
            : "💡 상대의 핵심 챔피언을 밴하세요.";
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

function updateTeamPanels(b, r) {
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
        <div class="row"><span>AD/AP</span><span>AD ${Math.round(b.adRatio * 100)}% / AP ${Math.round((1 - b.adRatio) * 100)}%</span></div>
        <div class="row"><span>성향</span><span>돌진 ${b.dive} / 포킹 ${b.poke} / 받아치기 ${b.anti}</span></div>
        <div class="row"><span>조합</span><span>${getCompLabel(b)}</span></div>
        ${makeBars(b, { dive: "#29b6f6", poke: "#66bb6a", anti: "#ab47bc" })}
    `;
    redSummary.innerHTML = `
        <div class="title">레드팀 요약 (${redRole})</div>
        <div class="row"><span>기본</span><span>CC ${r.cc} | 딜 ${r.dmg} | 탱 ${r.tank}</span></div>
        <div class="row"><span>시간대</span><span>초 ${r.early} / 중 ${r.mid} / 후 ${r.late}</span></div>
        <div class="row"><span>AD/AP</span><span>AD ${Math.round(r.adRatio * 100)}% / AP ${Math.round((1 - r.adRatio) * 100)}%</span></div>
        <div class="row"><span>성향</span><span>돌진 ${r.dive} / 포킹 ${r.poke} / 받아치기 ${r.anti}</span></div>
        <div class="row"><span>조합</span><span>${getCompLabel(r)}</span></div>
        ${makeBars(r, { dive: "#ef5350", poke: "#ffa726", anti: "#7e57c2" })}
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
    res.adPressure = res.adCount * res.adDmg;
    res.apPressure = res.apCount * res.apDmg;
    const totalPressure = res.adPressure + res.apPressure;
    res.adRatio = totalPressure > 0 ? (res.adPressure / totalPressure) : 0.5;
    return res;
}

function getCorePenalty(stats) {
    let penalty = 0;
    if (stats.dmg < 20) penalty -= 16 + (20 - stats.dmg) * 1.3;
    if (stats.tank < 20) penalty -= 16 + (20 - stats.tank) * 1.2;
    if (stats.cc <= 5) penalty -= 14 + (5 - stats.cc) * 2.0;
    return penalty;
}

function getDamageBalanceBonus(stats) {
    const total = stats.adPressure + stats.apPressure;
    if (total <= 0) return 0;
    const adShare = stats.adPressure / total;
    const dominantShare = Math.max(adShare, 1 - adShare);
    const symmetry = 1 - Math.abs(0.5 - adShare) * 2; // 0~1
    let bonus = symmetry * 4.5;
    if (dominantShare >= 0.8) {
        // AD/AP 한쪽이 80% 이상이면 큰 페널티
        bonus -= 16 + (dominantShare - 0.8) * 35;
    }
    return bonus;
}

function clampPercent(v) {
    return Math.min(Math.max(v, 3), 97);
}

function getPhaseProjection(b, r, overallWin) {
    const balanceEdge = getDamageBalanceBonus(b) - getDamageBalanceBonus(r);
    const earlyRaw = (b.early - r.early) * 2.1 + (b.dive - r.dive) * 0.8 + (b.cc - r.cc) * 0.45;
    const midRaw = (b.mid - r.mid) * 2.2 + (b.dmg - r.dmg) * 0.35 + (b.tank - r.tank) * 0.35 + balanceEdge * 0.25;
    const lateRaw = (b.late - r.late) * 2.3 + (b.poke - r.poke) * 0.8 + (b.dmg - r.dmg) * 0.4 + balanceEdge * 0.3;

    const earlyWin = clampPercent(overallWin * 0.45 + (50 + Math.tanh(earlyRaw / 18) * 45) * 0.55);
    const midWin = clampPercent(overallWin * 0.45 + (50 + Math.tanh(midRaw / 18) * 45) * 0.55);
    const lateWin = clampPercent(overallWin * 0.45 + (50 + Math.tanh(lateRaw / 18) * 45) * 0.55);
    return { earlyWin, midWin, lateWin };
}

function getWinRateByStats(b, r) {
    let statEdge = (b.cc - r.cc) * 0.9 + (b.dmg - r.dmg) * 0.8 + (b.tank - r.tank) * 0.8;
    const phaseEdge = (b.early - r.early) * 0.55 + (b.mid - r.mid) * 0.85 + (b.late - r.late) * 1.1;
    const bMain = getDominantProfile(b);
    const rMain = getDominantProfile(r);
    const beats = { Poke: "Anti", Anti: "Dive", Dive: "Poke" };
    let matchupEdge = 0;
    if (bMain.type === rMain.type) {
        // 같은 조합이면 조합 점수 우위만 약하게 반영
        matchupEdge = (bMain.value - rMain.value) * 0.9;
    } else {
        const bVal = Math.max(bMain.value, 1);
        const rVal = Math.max(rMain.value, 1);
        if (beats[bMain.type] === rMain.type) {
            // 우상성: 내 주유형이 높을수록 더 강하게 누름
            matchupEdge = Math.pow(bVal, 1.35) * Math.pow(rVal, 0.95);
        } else {
            // 역상성: 내 주유형이 높을수록 카운터 당할 때 페널티도 더 큼
            matchupEdge = -Math.pow(rVal, 1.35) * Math.pow(bVal, 1.15);
        }
    }

    // 성향합 동점(혼합 성향) 팀이 있으면 상성 영향 자체를 완화
    if (hasProfileTie(b) || hasProfileTie(r)) {
        matchupEdge *= (matchupEdge < 0 ? 0.42 : 0.65);
    }

    const bCorePenalty = getCorePenalty(b);
    const rCorePenalty = getCorePenalty(r);
    const bBalanceBonus = getDamageBalanceBonus(b);
    const rBalanceBonus = getDamageBalanceBonus(r);

    // 딜/탱 20 이상 팀이 많을수록 조합 상성 영향도를 더 키움
    const bStable = b.dmg > 20 && b.tank > 20;
    const rStable = r.dmg > 20 && r.tank > 20;
    const stableCount = (bStable ? 1 : 0) + (rStable ? 1 : 0);
    if (stableCount === 2) statEdge *= 0.55;
    else if (stableCount === 1) statEdge *= 0.75;
    const compMultiplier = stableCount === 2 ? 0.9 : (stableCount === 1 ? 0.78 : 0.65);

    const rawScore =
        statEdge +
        phaseEdge +
        matchupEdge * compMultiplier +
        (bCorePenalty - rCorePenalty) +
        (bBalanceBonus - rBalanceBonus);

    let bWin = 50 + Math.tanh(rawScore / 20) * 46;
    return clampPercent(bWin);
}

function calculateStats() {
    const b = getTeamStats('blue', picks);
    const r = getTeamStats('red', picks);
    const blueRole = getTeamRoleLabel('blue');
    const redRole = getTeamRoleLabel('red');
    document.getElementById('blue-info').innerText = `${blueRole} (BLUE) CC: ${b.cc} | 딜: ${b.dmg} | 탱: ${b.tank}`;
    document.getElementById('red-info').innerText = `${redRole} (RED) CC: ${r.cc} | 딜: ${r.dmg} | 탱: ${r.tank}`;
    updateTeamPanels(b, r);

    const bWin = getWinRateByStats(b, r);
    const phases = getPhaseProjection(b, r, bWin);
    if (currentStep >= DRAFT_ORDER.length) {
        document.getElementById('blue-win-bar').style.width = bWin + "%";
        document.getElementById('b-wr-txt').innerText = bWin.toFixed(1) + "%";
        document.getElementById('r-wr-txt').innerText = (100-bWin).toFixed(1) + "%";
    }

    return { bWin, b, r, phases };
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
    return team === userTeam ? "MY team" : "AI team";
}

function randomPick(arr) {
    if (!arr || arr.length === 0) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

function buildPhaseCommentary(res) {
    const blueName = teamDisplayName("blue");
    const redName = teamDisplayName("red");
    const blueCarry = randomPick(picks.blue.filter(Boolean).map((k) => CHAMP_DB[k].name)) || "블루팀";
    const redCarry = randomPick(picks.red.filter(Boolean).map((k) => CHAMP_DB[k].name)) || "레드팀";
    const earlyFav = res.phases.earlyWin >= 50 ? "blue" : "red";
    const midFav = res.phases.midWin >= 50 ? "blue" : "red";
    const lateFav = res.phases.lateWin >= 50 ? "blue" : "red";

    const earlyLines = [
        `${earlyFav === "blue" ? blueName : redName}이 초반 주도권을 잡고 라인 압박을 넣습니다!`,
        `${earlyFav === "blue" ? blueName : redName} 정글이 첫 오브젝트를 챙깁니다.`,
        `${earlyFav === "blue" ? blueCarry : redCarry}가 강하게 딜교를 밀어붙입니다.`
    ];
    const midLines = [
        `${midFav === "blue" ? blueName : redName}이 용 교전에서 이득을 봅니다!`,
        `${midFav === "blue" ? blueCarry : redCarry}가 한타 각을 제대로 열어냅니다.`,
        `${midFav === "blue" ? redName : blueName} 비상! 한 번 빼야 합니다!`
    ];
    const lateLines = [
        `${lateFav === "blue" ? blueName : redName}이 바론 앞 시야를 완전히 장악합니다.`,
        `${lateFav === "blue" ? blueCarry : redCarry}가 결정적인 킬을 만들어냅니다!`,
        `${res.bWin >= 50 ? blueName : redName} 쪽으로 승기가 크게 기웁니다.`
    ];
    return [...earlyLines, ...midLines, ...lateLines];
}

function buildResultBody(res, winner, loser, seriesEnded) {
    const bComp = getCompLabel(res.b);
    const rComp = getCompLabel(res.r);
    return `
        <p style="color:var(--gold);font-weight:bold;">세트 스코어: BLUE ${seriesWins.blue} : ${seriesWins.red} RED</p>
        <p>🔵 블루팀: ${bComp} (CC ${res.b.cc} / 딜 ${res.b.dmg} / 탱 ${res.b.tank})</p>
        <p style="font-size:13px; color:#cfd8dc;">성향합: 돌진 ${res.b.dive} / 포킹 ${res.b.poke} / 받아치기 ${res.b.anti} | 시간대: 초 ${res.b.early} / 중 ${res.b.mid} / 후 ${res.b.late}</p>
        <p>🔴 레드팀: ${rComp} (CC ${res.r.cc} / 딜 ${res.r.dmg} / 탱 ${res.r.tank})</p>
        <p style="font-size:13px; color:#cfd8dc;">성향합: 돌진 ${res.r.dive} / 포킹 ${res.r.poke} / 받아치기 ${res.r.anti} | 시간대: 초 ${res.r.early} / 중 ${res.r.mid} / 후 ${res.r.late}</p>
        <div class="sim-wrap">
            <div class="sim-title">10초 경기 시뮬레이션</div>
            <div class="phase-row"><span>초반</span><div class="phase-track"><div class="phase-fill" style="width:${res.phases.earlyWin.toFixed(1)}%"></div></div><span>${res.phases.earlyWin.toFixed(1)}%</span></div>
            <div class="phase-row"><span>중반</span><div class="phase-track"><div class="phase-fill" style="width:${res.phases.midWin.toFixed(1)}%"></div></div><span>${res.phases.midWin.toFixed(1)}%</span></div>
            <div class="phase-row"><span>후반</span><div class="phase-track"><div class="phase-fill" style="width:${res.phases.lateWin.toFixed(1)}%"></div></div><span>${res.phases.lateWin.toFixed(1)}%</span></div>
            <div id="narrator-feed" class="narrator-feed"><div class="narrator-line">해설 준비중...</div></div>
        </div>
        <hr style="border-color:#333">
        <h2 style="color:var(--gold)">최종 승리 확률: ${winner === "blue" ? res.bWin.toFixed(1) : (100-res.bWin).toFixed(1)}%</h2>
        <p style="font-size:12px;color:${seriesEnded ? '#ffd180' : '#9fb3c2'};">${seriesEnded ? `시리즈 종료: ${winner.toUpperCase()} 승리 (${seriesWins[winner]}-${seriesWins[loser]})` : (hardFearless ? `다음 SET ${currentGame + 1}에서 하드 피어리스 잠금이 유지됩니다.` : `다음 SET ${currentGame + 1}은 잠금 없이 진행됩니다.`)}</p>
    `;
}

function startResultNarration(res, seriesEnded) {
    const nextBtn = document.getElementById('result-next-btn');
    const feed = document.getElementById('narrator-feed');
    const lines = buildPhaseCommentary(res);
    let idx = 0;

    nextBtn.disabled = true;
    nextBtn.style.opacity = "0.6";
    nextBtn.innerText = "경기 진행중... 10";
    feed.innerHTML = `<div class="narrator-line">🎙 해설: 밴픽 결과를 바탕으로 시뮬레이션을 시작합니다.</div>`;

    if (matchNarrationTimer) clearInterval(matchNarrationTimer);
    matchNarrationTimer = setInterval(() => {
        idx += 1;
        const remain = Math.max(10 - idx, 0);
        if (idx <= 5) {
            const line = lines[(idx - 1) % lines.length];
            feed.innerHTML += `<div class="narrator-line">🎙 ${line}</div>`;
            feed.scrollTop = feed.scrollHeight;
        }
        nextBtn.innerText = remain > 0 ? `경기 진행중... ${remain}` : (seriesEnded ? "새 시리즈 시작" : "다음 세트 시작");
        if (idx >= 10) {
            clearInterval(matchNarrationTimer);
            matchNarrationTimer = null;
            nextBtn.disabled = false;
            nextBtn.style.opacity = "1";
            nextBtn.innerText = seriesEnded ? "새 시리즈 시작" : "다음 세트 시작";
        }
    }, 1000);
}

function showFinalResult() {
    const res = calculateStats();
    const modal = document.getElementById('result-modal');
    modal.style.display = 'flex';
    const winner = res.bWin >= 50 ? "blue" : "red";
    const loser = winner === "blue" ? "red" : "blue";
    seriesWins[winner] += 1;
    if (hardFearless) {
        [...picks.blue, ...picks.red].forEach((key) => { if (key) fearlessLocked.add(key); });
    }
    updateSeriesInfo();
    renderLockedChamps();

    document.getElementById('winner-text').innerText = winner.toUpperCase() + " SET WIN";
    document.getElementById('winner-text').style.color = winner === "blue" ? "var(--blue)" : "var(--red)";
    
    const seriesEnded = seriesWins[winner] >= winTarget || currentGame >= maxGames;
    lastSeriesEnded = seriesEnded;
    if (seriesEnded) {
        const userWonSeries = (userTeam === winner);
        updateModeRecord(userWonSeries);
    }
    const nextBtn = document.getElementById('result-next-btn');
    nextBtn.innerText = seriesEnded ? "새 시리즈 시작" : "다음 세트 시작";
    document.getElementById('final-stats').innerHTML = buildResultBody(res, winner, loser, seriesEnded);
    startResultNarration(res, seriesEnded);
}

function handleNextAction() {
    if (matchNarrationTimer) {
        clearInterval(matchNarrationTimer);
        matchNarrationTimer = null;
    }
    document.getElementById('result-modal').style.display = 'none';
    if (lastSeriesEnded) {
        userTeam = null;
        aiTeam = null;
        openHome();
        return;
    }
    // 다전제 모드에서는 세트마다 진영 자동 교대
    userTeam = userTeam === "blue" ? "red" : "blue";
    aiTeam = userTeam === "blue" ? "red" : "blue";
    currentGame += 1;
    startGameDraft();
}

function showTooltip(e, txt) {
    const tip = document.getElementById('tooltip');
    tip.innerHTML = txt;
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
