const STORAGE_PREFIX = "caixing-mvp-state";
const AUTH_USERS_KEY = "caixing-auth-users";
const AUTH_SESSION_KEY = "caixing-auth-session";
const DEMO_USER_ID = "demo";
const PLATFORM_AI_DECISION_ENDPOINT = "";

const tabs = [
  { id: "dashboard", label: "首页", icon: "home" },
  { id: "ledger", label: "记账", icon: "receipt" },
  { id: "goals", label: "目标", icon: "target" },
  { id: "learning", label: "社区", icon: "community" },
  { id: "profile", label: "我的", icon: "user" },
];

const categoryTypes = [
  "必要支出",
  "工作支出",
  "享受支出",
  "浪费支出",
  "资产支出",
  "负债支出",
];

const defaultState = {
  activeTab: "dashboard",
  profile: {
    income: 12000,
    fixedExpense: 5800,
    savings: 4000,
    debt: 12000,
    monthlyNeeds: 6000,
    emergencyMonths: 3,
    goal: "先存下钱",
    risk: "稳健",
    hasInvestment: false,
    hasEmergencyFund: false,
  },
  emergency: {
    current: 4000,
    monthlyDeposit: 2000,
  },
  budgets: {
    "必要支出": 6000,
    "储蓄 / 应急金": 2400,
    "投资": 1200,
    "自我提升": 1200,
    "娱乐消费": 1200,
  },
  decision: {
    itemName: "新手机",
    amount: 2999,
    budgetName: "娱乐消费",
    purchaseType: "享受型消费",
    useInstallment: false,
    localResult: null,
    aiAdvice: "",
    coolingList: [],
  },
  transactions: [
    {
      id: createId(),
      type: "income",
      amount: 12000,
      category: "工资",
      quality: "收入",
      account: "银行卡",
      date: currentMonthDate(2),
      note: "本月工资",
      necessary: "必要",
    },
    {
      id: createId(),
      type: "expense",
      amount: 2800,
      category: "房租",
      quality: "必要支出",
      account: "银行卡",
      date: currentMonthDate(3),
      note: "房租",
      necessary: "必要",
    },
    {
      id: createId(),
      type: "expense",
      amount: 680,
      category: "餐饮",
      quality: "享受支出",
      account: "微信",
      date: currentMonthDate(7),
      note: "外卖和聚餐",
      necessary: "可选",
    },
    {
      id: createId(),
      type: "expense",
      amount: 399,
      category: "订阅",
      quality: "浪费支出",
      account: "支付宝",
      date: currentMonthDate(11),
      note: "闲置会员续费",
      necessary: "浪费",
    },
    {
      id: createId(),
      type: "expense",
      amount: 1200,
      category: "课程",
      quality: "资产支出",
      account: "银行卡",
      date: currentMonthDate(14),
      note: "职业技能课",
      necessary: "可选",
    },
    {
      id: createId(),
      type: "expense",
      amount: 1000,
      category: "信用卡",
      quality: "负债支出",
      account: "银行卡",
      date: currentMonthDate(18),
      note: "最低还款",
      necessary: "必要",
    },
  ],
  communityPosts: [
    {
      id: createId(),
      author: "小林",
      topic: "省钱打卡",
      content: "今天把外卖换成自己带饭，省下 38 元。金额不大，但这种可控感很上头。",
      likes: 12,
      createdAt: "今天 09:20",
      comments: ["我也从一周少点两次外卖开始，月底真的能多出几百。"],
    },
    {
      id: createId(),
      author: "阿南",
      topic: "应急金",
      content: "刚把第一个 1000 元应急金存起来。以前总觉得太少没意义，现在觉得这是财务安全感的起点。",
      likes: 18,
      createdAt: "昨天 21:05",
      comments: ["很棒，先有 1000，再有 3000，再到 1 个月生活费。"],
    },
    {
      id: createId(),
      author: "Mia",
      topic: "消费决策",
      content: "想买平板，消费决策助手算出来要工作 5.2 天。我决定先放进 24 小时冷静清单。",
      likes: 9,
      createdAt: "昨天 18:40",
      comments: [],
    },
  ],
};

let currentUser = getSessionUser();
let state = loadState();

document.addEventListener("DOMContentLoaded", () => {
  const previewMode = new URLSearchParams(window.location.search).has("preview");
  if (!currentUser && previewMode) {
    currentUser = createDemoUser();
    setSessionUser(currentUser.id);
    state = loadState();
  }
  bindAuth();
  bindShell();
  fillDiagnosisForm();
  updateAuthView();
  if (!currentUser) {
    return;
  }
  const requestedTab = new URLSearchParams(window.location.search).get("tab");
  if (tabs.some((tab) => tab.id === requestedTab)) {
    state.activeTab = requestedTab;
  }
  render();
  if (!hasSavedState() && !previewMode && !state.diagnosisCompleted) {
    openDiagnosis();
  }
});

function currentMonthDate(day) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), day);
  return date.toISOString().slice(0, 10);
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeAccount(account) {
  return String(account || "").trim().toLowerCase();
}

function getUsers() {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users) {
  try {
    window.localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  } catch {
    // Local auth is best-effort for the MVP prototype.
  }
}

function getSessionUser() {
  const userId = readKey(AUTH_SESSION_KEY);
  if (!userId) return null;
  if (userId === DEMO_USER_ID) return { id: DEMO_USER_ID, name: "游客", account: "demo" };
  return getUsers().find((user) => user.id === userId) || null;
}

function setSessionUser(userId) {
  writeKey(AUTH_SESSION_KEY, userId);
}

function clearSessionUser() {
  removeKey(AUTH_SESSION_KEY);
}

function createDemoUser() {
  return { id: DEMO_USER_ID, name: "游客", account: "demo" };
}

function userStateKey() {
  return `${STORAGE_PREFIX}:${currentUser ? currentUser.id : "guest"}`;
}

function loadState() {
  const stored = readStorage();
  if (!stored) return cloneData(defaultState);
  try {
    return mergeState(cloneData(defaultState), JSON.parse(stored));
  } catch {
    return cloneData(defaultState);
  }
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeState(base, stored) {
  return {
    ...base,
    ...stored,
    profile: { ...base.profile, ...(stored.profile || {}) },
    emergency: { ...base.emergency, ...(stored.emergency || {}) },
    budgets: { ...base.budgets, ...(stored.budgets || {}) },
    decision: { ...base.decision, ...(stored.decision || {}) },
    transactions: Array.isArray(stored.transactions) ? stored.transactions : base.transactions,
    communityPosts: Array.isArray(stored.communityPosts) ? stored.communityPosts : base.communityPosts,
  };
}

function saveState() {
  writeStorage(JSON.stringify(state));
}

function readStorage() {
  return readKey(userStateKey());
}

function writeStorage(value) {
  writeKey(userStateKey(), value);
}

function readKey(key) {
  try {
    return window.localStorage ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeKey(key, value) {
  try {
    if (window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // The app still works for the current session if file:// storage is blocked.
  }
}

function removeKey(key) {
  try {
    if (window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage restrictions in local file mode.
  }
}

function hasSavedState() {
  return readStorage() !== null;
}

function money(value) {
  return `¥${Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;
}

function percent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function monthTransactions() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return state.transactions.filter((item) => item.date.startsWith(month));
}

function totals() {
  const items = monthTransactions();
  const income = items.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const surplus = income - expense;
  const savingRate = income > 0 ? (surplus / income) * 100 : 0;
  const emergencyTarget = Number(state.profile.monthlyNeeds) * Number(state.profile.emergencyMonths);
  const emergencyProgress = emergencyTarget > 0 ? (Number(state.emergency.current) / emergencyTarget) * 100 : 0;
  const debtPressure = income > 0 ? (Number(state.profile.debt) / income) * 100 : 0;
  const netWorth = Number(state.profile.savings) + Number(state.emergency.current) - Number(state.profile.debt);
  return { income, expense, surplus, savingRate, emergencyTarget, emergencyProgress, debtPressure, netWorth };
}

function diagnose() {
  const data = totals();
  const profile = state.profile;
  let stage = "蓄水期";
  if (data.surplus <= 0 || profile.debt > profile.income || data.emergencyProgress < 34) stage = "止血期";
  if (data.emergencyProgress >= 100 && data.debtPressure < 80) stage = "稳定期";
  if (data.emergencyProgress >= 100 && profile.hasInvestment && data.savingRate >= 20) stage = "增长期";
  if (data.netWorth > profile.income * 60 && data.savingRate >= 35) stage = "自由期";

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        35 +
          Math.max(-20, Math.min(25, data.savingRate)) +
          Math.min(20, data.emergencyProgress / 5) -
          Math.min(25, data.debtPressure / 8)
      )
    )
  );

  const issues = [];
  if (data.savingRate < 20) issues.push("储蓄率偏低，需要先让现金流转正");
  if (data.emergencyProgress < 100) issues.push("应急金不足，抗风险能力还不稳");
  if (data.debtPressure > 100) issues.push("负债压力偏高，优先做还款计划");
  if (!issues.length) issues.push("现金流基础不错，可以进入资产配置学习");

  const task =
    stage === "止血期"
      ? "本周找出 3 笔浪费支出，并把下周可选消费降 10%"
      : stage === "蓄水期"
        ? "本月优先完成 1 个月生活费应急金"
        : stage === "稳定期"
          ? "开始记录净资产，并学习低风险资产配置"
          : "保持复盘节奏，优化资产结构和收入来源";

  return { stage, score, issues, task };
}

function bindAuth() {
  const loginTabBtn = document.querySelector("#loginTabBtn");
  const registerTabBtn = document.querySelector("#registerTabBtn");
  const loginForm = document.querySelector("#loginForm");
  const registerForm = document.querySelector("#registerForm");
  const demoLoginBtn = document.querySelector("#demoLoginBtn");
  const logoutBtn = document.querySelector("#logoutBtn");
  const avatarBtn = document.querySelector("#avatarBtn");

  loginTabBtn.addEventListener("click", () => switchAuthMode("login"));
  registerTabBtn.addEventListener("click", () => switchAuthMode("register"));
  loginForm.addEventListener("submit", handleLogin);
  registerForm.addEventListener("submit", handleRegister);
  demoLoginBtn.addEventListener("click", () => enterApp(createDemoUser()));
  avatarBtn.addEventListener("click", () => {
    state.activeTab = "profile";
    saveState();
    render();
  });
  logoutBtn.addEventListener("click", () => {
    saveState();
    clearSessionUser();
    currentUser = null;
    state = loadState();
    updateAuthView();
  });
}

function switchAuthMode(mode) {
  const isLogin = mode === "login";
  document.querySelector("#loginTabBtn").classList.toggle("active", isLogin);
  document.querySelector("#registerTabBtn").classList.toggle("active", !isLogin);
  document.querySelector("#loginForm").hidden = !isLogin;
  document.querySelector("#registerForm").hidden = isLogin;
  setAuthMessage("login", "");
  setAuthMessage("register", "");
}

function handleLogin(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const account = normalizeAccount(data.get("account"));
  const password = String(data.get("password") || "");
  const user = getUsers().find((item) => item.account === account && item.password === password);
  if (!user) {
    setAuthMessage("login", "账号或密码不正确。");
    return;
  }
  enterApp(user);
}

function handleRegister(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const name = String(data.get("name") || "").trim();
  const account = normalizeAccount(data.get("account"));
  const password = String(data.get("password") || "");
  const users = getUsers();

  if (password.length < 6) {
    setAuthMessage("register", "密码至少需要 6 位。");
    return;
  }
  if (users.some((user) => user.account === account)) {
    setAuthMessage("register", "这个账号已经注册过了。");
    return;
  }

  const user = {
    id: createId(),
    name: name || "新用户",
    account,
    password,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  enterApp(user);
}

function enterApp(user) {
  currentUser = user;
  setSessionUser(user.id);
  state = loadState();
  updateAuthView();
  fillDiagnosisForm();
  render();
  if (!hasSavedState() && user.id !== DEMO_USER_ID) {
    openDiagnosis();
  }
}

function setAuthMessage(mode, message) {
  const target = document.querySelector(mode === "login" ? "#loginMessage" : "#registerMessage");
  target.textContent = message;
}

function avatarInitial(name) {
  const value = String(name || "财").trim();
  return value ? value.slice(0, 1).toUpperCase() : "财";
}

function updateAuthView() {
  const isAuthed = Boolean(currentUser);
  document.querySelector("#authScreen").hidden = isAuthed;
  document.querySelector(".app-shell").hidden = !isAuthed;
  document.querySelector("#currentUserLabel").textContent = isAuthed ? currentUser.name : "";
  document.querySelector("#avatarBtn").textContent = isAuthed ? avatarInitial(currentUser.name) : "";
}

function bindShell() {
  const navList = document.querySelector("#navList");
  const mobileNav = document.querySelector("#mobileNav");
  navList.innerHTML = tabs.map(navButtonTemplate).join("");
  mobileNav.innerHTML = tabs.map(mobileNavButtonTemplate).join("");
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      saveState();
      render();
    });
  });

  document.querySelector("#openDiagnosisBtn").addEventListener("click", openDiagnosis);
  document.querySelector("#closeDiagnosisBtn").addEventListener("click", closeDiagnosis);
  document.querySelector("#fillSampleBtn").addEventListener("click", () => {
    state.profile = cloneData(defaultState.profile);
    state.emergency = cloneData(defaultState.emergency);
    fillDiagnosisForm();
  });
  document.querySelector("#resetDemoBtn").addEventListener("click", () => {
    state = cloneData(defaultState);
    saveState();
    fillDiagnosisForm();
    render();
  });
  document.querySelector("#diagnosisForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    state.profile = {
      income: Number(data.get("income")),
      fixedExpense: Number(data.get("fixedExpense")),
      savings: Number(data.get("savings")),
      debt: Number(data.get("debt")),
      monthlyNeeds: Number(data.get("monthlyNeeds")),
      emergencyMonths: Number(data.get("emergencyMonths")),
      goal: data.get("goal"),
      risk: data.get("risk"),
      hasInvestment: data.has("hasInvestment"),
      hasEmergencyFund: data.has("hasEmergencyFund"),
    };
    state.diagnosisCompleted = true;
    state.emergency.current = Math.min(Number(state.emergency.current || 0), Number(state.profile.monthlyNeeds) * Number(state.profile.emergencyMonths));
    saveState();
    closeDiagnosis();
    render();
  });
}

function navButtonTemplate(tab) {
  return `<button class="nav-button" data-tab="${tab.id}" type="button"><span class="nav-icon">${iconSvg(tab.icon)}</span>${tab.label}</button>`;
}

function mobileNavButtonTemplate(tab) {
  return `<button data-tab="${tab.id}" type="button"><span class="nav-icon">${iconSvg(tab.icon)}</span><span>${tab.label}</span></button>`;
}

function iconSvg(name) {
  const icons = {
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>`,
    receipt: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3Z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>`,
    target: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3"/><path d="M22 12h-3"/><path d="M12 22v-3"/><path d="M2 12h3"/></svg>`,
    community: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v5A3.5 3.5 0 0 1 16.5 15H12l-5 4v-4A3.5 3.5 0 0 1 4 11.5v-5Z"/><path d="M8 8h8"/><path d="M8 11h5"/></svg>`,
    user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>`,
  };
  return icons[name] || icons.home;
}

function openDiagnosis() {
  fillDiagnosisForm();
  document.querySelector("#diagnosisDialog").showModal();
}

function closeDiagnosis() {
  document.querySelector("#diagnosisDialog").close();
}

function fillDiagnosisForm() {
  const form = document.querySelector("#diagnosisForm");
  if (!form) return;
  Object.entries(state.profile).forEach(([key, value]) => {
    const field = form.elements[key];
    if (!field) return;
    if (field.type === "checkbox") field.checked = Boolean(value);
    else field.value = value;
  });
}

function render() {
  tabs.forEach((tab) => {
    document.querySelector(`#view-${tab.id}`).hidden = state.activeTab !== tab.id;
  });
  document.querySelector("#pageTitle").textContent = tabs.find((tab) => tab.id === state.activeTab).label;
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === state.activeTab);
  });
  renderDashboard();
  renderLedger();
  renderGoals();
  renderLearning();
  renderProfile();
}

function renderDashboard() {
  const data = totals();
  const result = diagnose();
  const view = document.querySelector("#view-dashboard");
  view.innerHTML = `
    <article class="panel hero-panel">
      <div class="hero-copy">
        <span class="stage-badge">${result.stage}</span>
        <h2>财务健康分 ${result.score} / 100</h2>
        <p class="muted">核心问题：${result.issues.join("；")}。</p>
        <ul class="action-list">
          <li><strong>本月任务：</strong>${result.task}</li>
          <li><strong>产品路径：</strong>止血 → 蓄水 → 增收 → 配置资产 → 形成系统</li>
        </ul>
      </div>
      <div class="score-ring" style="--score:${result.score}%">
        <div class="score-inner">
          <div>
            <strong>${result.score}</strong>
            <span class="muted">健康分</span>
          </div>
        </div>
      </div>
    </article>

    <section class="grid-4">
      ${metricTemplate("本月收入", money(data.income), "看钱从哪里来")}
      ${metricTemplate("本月支出", money(data.expense), "看钱流到哪里去")}
      ${metricTemplate("本月结余", money(data.surplus), "是否保持正现金流")}
      ${metricTemplate("储蓄率", percent(data.savingRate), "财务质量指标")}
    </section>

    ${decisionAssistantTemplate()}

    <section class="grid-2">
      <article class="panel">
        <div class="row-between">
          <h2>应急金进度</h2>
          <span class="tag">${emergencyLevel(data.emergencyProgress)}</span>
        </div>
        ${progressTemplate(Math.min(100, data.emergencyProgress), data.emergencyProgress < 34 ? "danger" : data.emergencyProgress < 100 ? "warning" : "")}
        <p class="muted">当前 ${money(state.emergency.current)} / 目标 ${money(data.emergencyTarget)}</p>
      </article>
      <article class="panel">
        <h2>消费质量</h2>
        ${spendingQualityChart()}
      </article>
    </section>
  `;
  bindDecisionAssistant();
}

function metricTemplate(label, value, hint) {
  return `<article class="metric"><span>${label}</span><strong>${value}</strong><span>${hint}</span></article>`;
}

function progressTemplate(value, tone = "") {
  return `<div class="progress-track"><div class="progress-fill ${tone}" style="--value:${Math.max(0, Math.min(100, value))}%"></div></div>`;
}

function emergencyLevel(progress) {
  if (progress < 34) return "无保护";
  if (progress < 100) return "基础保护";
  if (progress < 200) return "中等保护";
  return "高保护";
}

function spendingQualityChart() {
  const expenses = monthTransactions().filter((item) => item.type === "expense");
  const grouped = categoryTypes.map((type) => ({
    type,
    amount: expenses.filter((item) => item.quality === type).reduce((sum, item) => sum + Number(item.amount), 0),
  }));
  const max = Math.max(1, ...grouped.map((item) => item.amount));
  return `<div class="chart">${grouped
    .map(
      (item) => `
        <div class="bar-row">
          <span>${item.type}</span>
          <div class="bar"><span style="--value:${(item.amount / max) * 100}%"></span></div>
          <strong>${money(item.amount)}</strong>
        </div>`
    )
    .join("")}</div>`;
}

function decisionAssistantTemplate() {
  const decision = state.decision || cloneData(defaultState.decision);
  const result = decision.localResult;
  const coolingItems = Array.isArray(decision.coolingList) ? decision.coolingList : [];
  return `
    <section class="panel decision-panel">
      <div class="row-between">
        <div>
          <p class="eyebrow">消费决策助手</p>
          <h2>把冲动消费变成一次财商训练</h2>
        </div>
        <span class="tag">上线接入 AI</span>
      </div>
      <div class="decision-layout">
        <form id="decisionForm" class="decision-form">
          <label>
            想买什么
            <input name="itemName" value="${escapeHtml(decision.itemName || "")}" placeholder="例如：新手机、游戏机、课程" required />
          </label>
          <label>
            金额
            <input name="amount" type="number" min="1" step="1" value="${Number(decision.amount || 2999)}" required />
          </label>
          <label>
            影响哪个预算
            <select name="budgetName">
              ${Object.keys(state.budgets)
                .map((name) => `<option value="${name}" ${decision.budgetName === name ? "selected" : ""}>${name}</option>`)
                .join("")}
            </select>
          </label>
          <label>
            这笔钱更像
            <select name="purchaseType">
              ${["必要支出", "享受型消费", "资产支出", "消费型负债"]
                .map((name) => `<option value="${name}" ${decision.purchaseType === name ? "selected" : ""}>${name}</option>`)
                .join("")}
            </select>
          </label>
          <label class="check-row">
            <input name="useInstallment" type="checkbox" ${decision.useInstallment ? "checked" : ""} />
            准备用分期或借贷购买
          </label>
          <div class="form-actions">
            <button class="primary-button" type="submit">开始判断</button>
            <button class="secondary-button" type="button" id="localDecisionBtn">只用本地规则</button>
          </div>
        </form>
        <div class="decision-result">
          ${result ? decisionResultTemplate(result, decision.aiAdvice) : emptyDecisionTemplate()}
        </div>
      </div>
      ${
        coolingItems.length
          ? `<div class="cooling-list"><h3>24 小时冷静清单</h3>${coolingItems.map((item) => `<span class="tag">${escapeHtml(item.name)} · ${money(item.amount)}</span>`).join("")}</div>`
          : ""
      }
    </section>
  `;
}

function emptyDecisionTemplate() {
  return `
    <div class="empty-decision">
      <strong>输入金额后，我会帮你判断这笔消费值不值得现在买。</strong>
      <span>会分析收入占比、工作天数、预算超支、应急金延后、资产/负债属性和冷静期建议。</span>
    </div>
  `;
}

function decisionResultTemplate(result, aiAdvice) {
  return `
    <div class="risk-card ${result.riskClass}">
      <span class="tag">${result.riskLabel}</span>
      <h3>${escapeHtml(result.summary)}</h3>
      <div class="decision-stats">
        <div><strong>${percent(result.incomeRatio)}</strong><span>月收入占比</span></div>
        <div><strong>${result.workDays.toFixed(1)} 天</strong><span>工作时间</span></div>
        <div><strong>${result.goalDelayText}</strong><span>应急金影响</span></div>
      </div>
      <ol class="reason-list">
        ${result.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
      </ol>
      <p><strong>建议：</strong>${escapeHtml(result.recommendation)}</p>
      <div class="form-actions">
        <button class="secondary-button" type="button" id="coolingBtn">加入 24 小时冷静清单</button>
      </div>
    </div>
    ${
      aiAdvice
        ? `<div class="ai-advice"><h3>AI 教练建议</h3><p>${escapeHtml(aiAdvice)}</p></div>`
        : `<div class="ai-advice muted">当前为本地规则判断。正式上线后，平台会在这里接入 AI 财务教练建议。</div>`
    }
  `;
}

function bindDecisionAssistant() {
  const form = document.querySelector("#decisionForm");
  if (!form) return;
  form.addEventListener("submit", handleDecisionSubmit);
  document.querySelector("#localDecisionBtn").addEventListener("click", () => analyzeDecision(false));
  const coolingBtn = document.querySelector("#coolingBtn");
  if (coolingBtn) {
    coolingBtn.addEventListener("click", addToCoolingList);
  }
}

function readDecisionForm() {
  const form = document.querySelector("#decisionForm");
  const data = new FormData(form);
  return {
    itemName: String(data.get("itemName") || "").trim(),
    amount: Number(data.get("amount")),
    budgetName: data.get("budgetName"),
    purchaseType: data.get("purchaseType"),
    useInstallment: data.has("useInstallment"),
  };
}

async function handleDecisionSubmit(event) {
  event.preventDefault();
  await analyzeDecision(true);
}

async function analyzeDecision(allowAi) {
  const input = readDecisionForm();
  const localResult = buildDecisionAnalysis(input);
  state.decision = {
    ...state.decision,
    ...input,
    localResult,
    aiAdvice: "",
  };
  saveState();
  render();

  if (!allowAi || !PLATFORM_AI_DECISION_ENDPOINT) return;

  try {
    const response = await fetch(PLATFORM_AI_DECISION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "purchase_decision",
        purchase: input,
        financialContext: {
          monthlyIncome: state.profile.income,
          monthlyExpense: totals().expense,
          savingRate: totals().savingRate,
          emergencyFund: state.emergency,
          budgets: state.budgets,
          currentStage: diagnose().stage,
        },
        localAnalysis: localResult,
      }),
    });
    if (!response.ok) throw new Error(`AI 接口返回 ${response.status}`);
    const responseText = await response.text();
    let payload = null;
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { advice: responseText };
    }
    state.decision.aiAdvice = payload.advice || payload.text || payload.result || JSON.stringify(payload);
  } catch (error) {
    state.decision.aiAdvice = `AI 接口暂时不可用：${error.message}。已先给出本地规则判断。`;
  }
  saveState();
  render();
}

function buildDecisionAnalysis(input) {
  const data = totals();
  const amount = Math.max(0, Number(input.amount || 0));
  const monthlyIncome = Number(state.profile.income || data.income || 0);
  const incomeRatio = monthlyIncome > 0 ? (amount / monthlyIncome) * 100 : 0;
  const dailyIncome = monthlyIncome > 0 ? monthlyIncome / 22 : 0;
  const workDays = dailyIncome > 0 ? amount / dailyIncome : 0;
  const budgetLimit = Number(state.budgets[input.budgetName] || 0);
  const spent = budgetSpent(input.budgetName);
  const willOverBudget = budgetLimit > 0 && spent + amount > budgetLimit;
  const emergencyGap = Math.max(0, data.emergencyTarget - Number(state.emergency.current || 0));
  const monthlyDeposit = Number(state.emergency.monthlyDeposit || 0);
  const goalDelay = emergencyGap > 0 && monthlyDeposit > 0 ? Math.ceil(amount / monthlyDeposit) : 0;
  const goalDelayText = goalDelay > 0 ? `${goalDelay} 个月` : "无明显延后";
  const reasons = [];
  let riskScore = 0;

  reasons.push(`这笔消费占你月收入的 ${percent(incomeRatio)}，大约需要工作 ${workDays.toFixed(1)} 天。`);
  if (incomeRatio >= 25) {
    riskScore += 3;
    reasons.push("占月收入比例偏高，容易挤压本月结余。");
  } else if (incomeRatio >= 10) {
    riskScore += 1;
    reasons.push("金额不算小，建议确认它是否真的比储蓄目标更重要。");
  }

  if (willOverBudget) {
    riskScore += 3;
    reasons.push(`会导致「${input.budgetName}」预算超支，当前已用 ${money(spent)} / ${money(budgetLimit)}。`);
  } else {
    reasons.push(`不会立刻让「${input.budgetName}」预算超支，当前预算仍可控。`);
  }

  if (goalDelay > 0) {
    riskScore += 2;
    reasons.push(`如果把这笔钱转去应急金，目标可能少延后约 ${goalDelay} 个月。`);
  }

  if (input.purchaseType === "消费型负债" || input.useInstallment) {
    riskScore += 3;
    reasons.push("它更像消费型负债，分期会把今天的冲动变成未来的固定压力。");
  } else if (input.purchaseType === "资产支出") {
    riskScore -= 1;
    reasons.push("它带有资产支出属性，但仍要看是否能带来真实收入或能力增长。");
  }

  if (data.savingRate < 20) {
    riskScore += 1;
    reasons.push("当前储蓄率还没到 20%，优先保住正现金流更重要。");
  }

  const riskLabel = riskScore >= 6 ? "风险偏高" : riskScore >= 3 ? "需要谨慎" : "相对可控";
  const riskClass = riskScore >= 6 ? "high" : riskScore >= 3 ? "medium" : "low";
  const recommendation =
    riskScore >= 6
      ? "建议加入 24 小时冷静清单。明天再看，如果仍然必要，再考虑降低规格或分阶段储蓄后购买。"
      : riskScore >= 3
        ? "建议至少冷静 24 小时，并确认不会影响预算和应急金计划。"
        : "可以考虑购买，但仍建议先保留记录，月底复盘它是否真的提升了生活或收入能力。";

  return {
    riskLabel,
    riskClass,
    summary: `这笔「${input.itemName || "消费"}」${riskLabel}。`,
    incomeRatio,
    workDays,
    goalDelay,
    goalDelayText,
    reasons,
    recommendation,
  };
}

function addToCoolingList() {
  const decision = state.decision || {};
  const item = {
    id: createId(),
    name: decision.itemName || "待决定消费",
    amount: Number(decision.amount || 0),
    createdAt: new Date().toISOString(),
  };
  const list = Array.isArray(decision.coolingList) ? decision.coolingList : [];
  state.decision.coolingList = [item, ...list].slice(0, 6);
  saveState();
  render();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderLedger() {
  const view = document.querySelector("#view-ledger");
  const rows = state.transactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(transactionTemplate)
    .join("");
  view.innerHTML = `
    <section class="panel import-panel">
      <div class="row-between">
        <div>
          <p class="eyebrow">快速导入</p>
          <h2>支付宝 / 微信账单导入</h2>
          <p class="muted">第一版支持用户从支付宝或微信导出的 CSV/TXT 账单。导入前会自动识别金额、时间、收支类型、商户/备注和账户。</p>
        </div>
        <span class="tag">本地解析</span>
      </div>
      <form id="billImportForm" class="import-form">
        <label>
          来源平台
          <select name="platform">
            <option value="支付宝">支付宝</option>
            <option value="微信">微信</option>
          </select>
        </label>
        <label>
          上传账单文件
          <input name="billFile" type="file" accept=".csv,.txt,text/csv,text/plain" />
        </label>
        <label class="import-textarea">
          或粘贴账单文本
          <textarea name="billText" rows="5" placeholder="可粘贴 CSV 表头和明细，例如：交易时间,交易类型,交易对方,商品说明,收/支,金额"></textarea>
        </label>
        <div class="form-actions">
          <button class="primary-button" type="submit">导入账单</button>
          <button class="secondary-button" type="button" id="fillImportSampleBtn">填入示例</button>
        </div>
      </form>
      <p id="importMessage" class="import-message muted">${escapeHtml(state.importMessage || "")}</p>
    </section>
    <section class="grid-2">
      <article class="panel">
        <h2>新增记录</h2>
        <form id="transactionForm" class="form-grid">
          <label>
            类型
            <select name="type">
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </label>
          <label>
            金额
            <input name="amount" type="number" min="0" step="1" required />
          </label>
          <label>
            类目
            <input name="category" placeholder="餐饮、工资、房租" required />
          </label>
          <label>
            钱的质量
            <select name="quality">
              ${categoryTypes.map((item) => `<option value="${item}">${item}</option>`).join("")}
              <option value="收入">收入</option>
            </select>
          </label>
          <label>
            账户
            <input name="account" placeholder="微信、支付宝、银行卡" required />
          </label>
          <label>
            时间
            <input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}" required />
          </label>
          <label>
            是否必要
            <select name="necessary">
              <option value="必要">必要</option>
              <option value="可选">可选</option>
              <option value="浪费">浪费</option>
            </select>
          </label>
          <label>
            备注
            <input name="note" placeholder="午餐、课程、订阅" />
          </label>
          <div class="form-actions">
            <button class="primary-button" type="submit">保存记录</button>
          </div>
        </form>
      </article>
      <article class="panel">
        <h2>分类分析</h2>
        ${spendingQualityChart()}
      </article>
    </section>
    <section class="panel">
      <div class="row-between">
        <h2>流水记录</h2>
        <span class="muted">${state.transactions.length} 条</span>
      </div>
      <div class="list">${rows || "<p class='muted'>还没有记录。</p>"}</div>
    </section>
  `;
  document.querySelector("#billImportForm").addEventListener("submit", importBillRecords);
  document.querySelector("#fillImportSampleBtn").addEventListener("click", fillImportSample);
  document.querySelector("#transactionForm").addEventListener("submit", addTransaction);
  document.querySelectorAll("[data-delete-transaction]").forEach((button) => {
    button.addEventListener("click", () => {
      state.transactions = state.transactions.filter((item) => item.id !== button.dataset.deleteTransaction);
      saveState();
      render();
    });
  });
}

function transactionTemplate(item) {
  const sign = item.type === "income" ? "+" : "-";
  const className = item.type === "income" ? "amount-income" : "amount-expense";
  return `
    <div class="transaction-row">
      <div>
        <div class="row-between">
          <strong>${item.category}</strong>
          <strong class="${className}">${sign}${money(item.amount)}</strong>
        </div>
        <div class="transaction-meta">
          <span>${item.date}</span>
          <span>${item.account}</span>
          <span class="tag">${item.quality}</span>
          <span>${item.note || "无备注"}</span>
        </div>
      </div>
      <button class="danger-button" type="button" data-delete-transaction="${item.id}">删除</button>
    </div>
  `;
}

function addTransaction(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const type = data.get("type");
  const record = {
    id: createId(),
    type,
    amount: Number(data.get("amount")),
    category: data.get("category").trim(),
    quality: type === "income" ? "收入" : data.get("quality"),
    account: data.get("account").trim(),
    date: data.get("date"),
    necessary: data.get("necessary"),
    note: data.get("note").trim(),
  };
  state.transactions.push(record);
  saveState();
  render();
}

function fillImportSample() {
  const form = document.querySelector("#billImportForm");
  form.elements.platform.value = "支付宝";
  form.elements.billText.value = [
    "交易时间,交易类型,交易对方,商品说明,收/支,金额,交易状态",
    "2026-05-20 12:30:00,即时到账交易,幸福小馆,午餐,支出,35.00,交易成功",
    "2026-05-21 09:10:00,转账,公司财务,工资,收入,12000.00,交易成功",
    "2026-05-22 20:15:00,商户消费,会员中心,视频会员,支出,39.00,交易成功",
  ].join("\n");
}

async function importBillRecords(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const platform = form.elements.platform.value;
  const file = form.elements.billFile.files[0];
  const pastedText = form.elements.billText.value.trim();
  const message = document.querySelector("#importMessage");

  let rawText = pastedText;
  if (file) {
    rawText = await file.text();
  }
  if (!rawText.trim()) {
    message.textContent = "请先上传账单文件，或粘贴账单文本。";
    return;
  }

  const imported = parseBillText(rawText, platform);
  const existingKeys = new Set(state.transactions.map(transactionKey));
  const uniqueRecords = imported.filter((record) => !existingKeys.has(transactionKey(record)));

  if (!uniqueRecords.length) {
    message.textContent = imported.length ? "账单已导入过，没有发现新的流水。" : "没有识别到账单明细，请检查文件是否包含表头和金额。";
    return;
  }

  state.transactions = [...state.transactions, ...uniqueRecords];
  state.importMessage = `已导入 ${uniqueRecords.length} 条${platform}账单，自动跳过 ${imported.length - uniqueRecords.length} 条重复记录。`;
  saveState();
  form.reset();
  render();
}

function parseBillText(rawText, platform) {
  const normalized = rawText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const tableStart = lines.findIndex((line) => {
    const text = line.replace(/\s/g, "");
    return text.includes("时间") && (text.includes("金额") || text.includes("收/支") || text.includes("收支"));
  });
  const tableLines = tableStart >= 0 ? lines.slice(tableStart) : lines;
  if (tableLines.length < 2) return [];

  const delimiter = detectDelimiter(tableLines[0]);
  const headers = splitRow(tableLines[0], delimiter).map(cleanCell);
  return tableLines
    .slice(1)
    .map((line) => splitRow(line, delimiter).map(cleanCell))
    .filter((cells) => cells.length >= 3)
    .map((cells) => rowToTransaction(headers, cells, platform))
    .filter(Boolean);
}

function detectDelimiter(line) {
  if (line.includes("\t")) return "\t";
  if (line.includes(",")) return ",";
  return /\s{2,}/;
}

function splitRow(line, delimiter) {
  if (delimiter instanceof RegExp) return line.split(delimiter);
  if (delimiter === "\t") return line.split("\t");
  const cells = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function cleanCell(value) {
  return String(value || "").replace(/^"|"$/g, "").trim();
}

function rowToTransaction(headers, cells, platform) {
  const get = (...names) => {
    for (const name of names) {
      const index = headers.findIndex((header) => header.includes(name));
      if (index >= 0 && cells[index]) return cells[index];
    }
    return "";
  };
  const rawAmount = get("金额", "收款金额", "付款金额", "交易金额");
  const amount = parseAmount(rawAmount || cells.find((cell) => /[+-]?\d+(\.\d{1,2})?/.test(cell)));
  if (!amount) return null;

  const directionText = `${get("收/支", "收支", "交易类型", "类型")} ${rawAmount}`;
  const type = /收入|收款|转入|\+/.test(directionText) && !/支出|付款|消费|转出|-/.test(directionText) ? "income" : "expense";
  const timeText = get("交易时间", "时间", "支付时间", "创建时间") || cells.find((cell) => /\d{4}[-/年]\d{1,2}/.test(cell)) || new Date().toISOString();
  const note = get("商品说明", "商品", "交易对方", "对方", "备注", "说明") || `${platform}账单`;
  const category = inferImportCategory(note, type);
  const quality = type === "income" ? "收入" : inferImportQuality(category, note);

  return {
    id: createId(),
    type,
    amount,
    category,
    quality,
    account: platform,
    date: normalizeImportDate(timeText),
    note,
    necessary: quality === "必要支出" || quality === "负债支出" ? "必要" : quality === "浪费支出" ? "浪费" : "可选",
  };
}

function parseAmount(value) {
  const match = String(value || "").replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Math.abs(Number(match[0])) : 0;
}

function normalizeImportDate(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/);
  if (!match) return new Date().toISOString().slice(0, 10);
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function inferImportCategory(note, type) {
  if (type === "income") return /工资|薪资|奖金|报销|转入/.test(note) ? "工资" : "收入";
  if (/餐|饭|咖啡|奶茶|外卖|美团|饿了么/.test(note)) return "餐饮";
  if (/地铁|公交|打车|滴滴|交通|加油/.test(note)) return "交通";
  if (/房租|物业|水费|电费|燃气/.test(note)) return "房租";
  if (/课程|书|学习|培训|会员课/.test(note)) return "学习";
  if (/信用卡|花呗|借呗|还款|贷款|分期/.test(note)) return "还款";
  if (/会员|订阅|游戏|直播|娱乐/.test(note)) return "订阅";
  return "购物";
}

function inferImportQuality(category, note) {
  if (["餐饮", "交通", "房租"].includes(category)) return "必要支出";
  if (category === "学习") return "资产支出";
  if (category === "还款") return "负债支出";
  if (/会员|订阅|闲置|冲动/.test(note)) return "浪费支出";
  return "享受支出";
}

function transactionKey(item) {
  return `${item.type}|${item.amount}|${item.date}|${item.account}|${item.note}`;
}

function renderGoals() {
  const data = totals();
  const target = data.emergencyTarget;
  const gap = Math.max(0, target - Number(state.emergency.current));
  const months = Number(state.emergency.monthlyDeposit) > 0 ? Math.ceil(gap / Number(state.emergency.monthlyDeposit)) : 0;
  const view = document.querySelector("#view-goals");
  view.innerHTML = `
    <section class="grid-2">
      <article class="panel">
        <h2>应急金目标</h2>
        <div class="goal-row">
          <div class="row-between"><span>目标安全垫</span><strong>${state.profile.emergencyMonths} 个月</strong></div>
          <div class="row-between"><span>目标金额</span><strong>${money(target)}</strong></div>
          <div class="row-between"><span>当前已有</span><strong>${money(state.emergency.current)}</strong></div>
          <div class="row-between"><span>还差</span><strong>${money(gap)}</strong></div>
          <div class="row-between"><span>预计完成</span><strong>${gap === 0 ? "已完成" : `${months} 个月`}</strong></div>
        </div>
        ${progressTemplate(Math.min(100, data.emergencyProgress), data.emergencyProgress < 34 ? "danger" : data.emergencyProgress < 100 ? "warning" : "")}
      </article>
      <article class="panel">
        <h2>更新目标</h2>
        <form id="goalForm" class="form-grid">
          <label>
            每月必要生活费
            <input name="monthlyNeeds" type="number" min="0" step="100" value="${state.profile.monthlyNeeds}" required />
          </label>
          <label>
            目标月份
            <input name="emergencyMonths" type="number" min="1" max="12" step="1" value="${state.profile.emergencyMonths}" required />
          </label>
          <label>
            当前应急金
            <input name="current" type="number" min="0" step="100" value="${state.emergency.current}" required />
          </label>
          <label>
            每月存入
            <input name="monthlyDeposit" type="number" min="0" step="100" value="${state.emergency.monthlyDeposit}" required />
          </label>
          <div class="form-actions">
            <button class="primary-button" type="submit">保存目标</button>
          </div>
        </form>
      </article>
    </section>
    <section class="panel">
      <h2>预算管理</h2>
      <form id="budgetForm">
        ${Object.entries(state.budgets)
          .map(([name, amount]) => budgetInputTemplate(name, amount))
          .join("")}
        <div class="form-actions">
          <button class="primary-button" type="submit">保存预算</button>
        </div>
      </form>
    </section>
  `;
  document.querySelector("#goalForm").addEventListener("submit", saveGoal);
  document.querySelector("#budgetForm").addEventListener("submit", saveBudgets);
}

function budgetInputTemplate(name, amount) {
  const spent = budgetSpent(name);
  const used = amount > 0 ? (spent / amount) * 100 : 0;
  const tone = used > 100 ? "danger" : used > 80 ? "warning" : "";
  return `
    <div class="budget-row">
      <div class="row-between">
        <label>
          ${name}
          <input name="${name}" type="number" min="0" step="100" value="${amount}" />
        </label>
        <strong>${money(spent)} / ${money(amount)}</strong>
      </div>
      ${progressTemplate(Math.min(100, used), tone)}
    </div>
  `;
}

function budgetSpent(name) {
  const expenses = monthTransactions().filter((item) => item.type === "expense");
  if (name === "储蓄 / 应急金") return Number(state.emergency.monthlyDeposit);
  if (name === "投资") return expenses.filter((item) => item.quality === "资产支出").reduce((sum, item) => sum + Number(item.amount), 0);
  if (name === "自我提升") return expenses.filter((item) => item.category.includes("课") || item.quality === "工作支出").reduce((sum, item) => sum + Number(item.amount), 0);
  if (name === "娱乐消费") return expenses.filter((item) => ["享受支出", "浪费支出"].includes(item.quality)).reduce((sum, item) => sum + Number(item.amount), 0);
  return expenses.filter((item) => item.quality === "必要支出").reduce((sum, item) => sum + Number(item.amount), 0);
}

function saveGoal(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.profile.monthlyNeeds = Number(data.get("monthlyNeeds"));
  state.profile.emergencyMonths = Number(data.get("emergencyMonths"));
  state.emergency.current = Number(data.get("current"));
  state.emergency.monthlyDeposit = Number(data.get("monthlyDeposit"));
  saveState();
  render();
}

function saveBudgets(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  Object.keys(state.budgets).forEach((key) => {
    state.budgets[key] = Number(data.get(key));
  });
  saveState();
  render();
}

function renderLearning() {
  const view = document.querySelector("#view-learning");
  const posts = Array.isArray(state.communityPosts) ? state.communityPosts : [];
  view.innerHTML = `
    <section class="panel community-hero">
      <div>
        <p class="eyebrow">财醒社区</p>
        <h2>和同路人一起积累财富秩序</h2>
        <p class="muted">分享省钱打卡、应急金进度、消费决策和还债经验。社区的目标不是炫富，而是互相提醒：每天让现金流更清醒一点。</p>
      </div>
      <div class="community-stats">
        <div><strong>${posts.length}</strong><span>动态</span></div>
        <div><strong>${posts.reduce((sum, post) => sum + Number(post.likes || 0), 0)}</strong><span>鼓励</span></div>
      </div>
    </section>
    <section class="community-layout">
      <article class="panel composer-panel">
        <h2>发布交流</h2>
        <form id="communityForm" class="community-form">
          <label>
            话题
            <select name="topic">
              <option value="省钱打卡">省钱打卡</option>
              <option value="应急金">应急金</option>
              <option value="消费决策">消费决策</option>
              <option value="还债经验">还债经验</option>
              <option value="增收计划">增收计划</option>
            </select>
          </label>
          <label>
            想说什么
            <textarea name="content" rows="5" maxlength="180" placeholder="例如：今天少买一杯奶茶，把 18 元转进应急金。" required></textarea>
          </label>
          <button class="primary-button" type="submit">发布动态</button>
        </form>
        <div class="topic-cloud">
          <span class="tag">#省钱打卡</span>
          <span class="tag">#应急金</span>
          <span class="tag">#消费决策</span>
          <span class="tag">#还债经验</span>
        </div>
      </article>
      <div class="community-feed">
        ${posts.map(communityPostTemplate).join("")}
      </div>
    </section>
  `;
  bindCommunity();
}

function communityPostTemplate(post) {
  const comments = Array.isArray(post.comments) ? post.comments : [];
  return `
    <article class="community-post">
      <div class="post-head">
        <div class="post-avatar">${avatarInitial(post.author)}</div>
        <div>
          <strong>${escapeHtml(post.author)}</strong>
          <span class="muted">${escapeHtml(post.createdAt || "刚刚")} · ${escapeHtml(post.topic)}</span>
        </div>
      </div>
      <p>${escapeHtml(post.content)}</p>
      <div class="post-actions">
        <button class="secondary-button" type="button" data-like-post="${post.id}">鼓励 ${Number(post.likes || 0)}</button>
      </div>
      ${
        comments.length
          ? `<div class="comment-list">${comments.map((comment) => `<div>${escapeHtml(comment)}</div>`).join("")}</div>`
          : ""
      }
      <form class="comment-form" data-comment-form="${post.id}">
        <input name="comment" maxlength="80" placeholder="写一句鼓励或经验..." required />
        <button class="secondary-button" type="submit">回复</button>
      </form>
    </article>
  `;
}

function bindCommunity() {
  document.querySelector("#communityForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const content = String(data.get("content") || "").trim();
    if (!content) return;
    state.communityPosts = [
      {
        id: createId(),
        author: currentUser ? currentUser.name : "用户",
        topic: data.get("topic"),
        content,
        likes: 0,
        createdAt: "刚刚",
        comments: [],
      },
      ...(state.communityPosts || []),
    ];
    saveState();
    render();
  });

  document.querySelectorAll("[data-like-post]").forEach((button) => {
    button.addEventListener("click", () => {
      const post = state.communityPosts.find((item) => item.id === button.dataset.likePost);
      if (!post) return;
      post.likes = Number(post.likes || 0) + 1;
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-comment-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const post = state.communityPosts.find((item) => item.id === form.dataset.commentForm);
      const input = form.elements.comment;
      const comment = String(input.value || "").trim();
      if (!post || !comment) return;
      post.comments = [...(post.comments || []), comment].slice(-4);
      saveState();
      render();
    });
  });
}

function renderProfile() {
  const data = totals();
  const result = diagnose();
  const report = monthlyAdvice(data);
  const view = document.querySelector("#view-profile");
  view.innerHTML = `
    <section class="grid-3">
      ${metricTemplate("当前阶段", result.stage, state.profile.goal)}
      ${metricTemplate("净资产", money(data.netWorth), "总资产 - 总负债")}
      ${metricTemplate("负债压力", percent(data.debtPressure), "负债 / 月收入")}
    </section>
    <section class="panel quote-panel">
      <div class="row-between">
        <h2>财富积累语录</h2>
        <span class="tag">长期主义</span>
      </div>
      <div class="quote-grid">
        ${wealthQuotes(data).map(quoteTemplate).join("")}
      </div>
    </section>
    <section class="grid-2">
      <article class="panel">
        <h2>资产负债简表</h2>
        <div class="report-row"><div class="row-between"><span>存款</span><strong>${money(state.profile.savings)}</strong></div></div>
        <div class="report-row"><div class="row-between"><span>应急金</span><strong>${money(state.emergency.current)}</strong></div></div>
        <div class="report-row"><div class="row-between"><span>负债</span><strong>${money(state.profile.debt)}</strong></div></div>
      </article>
      <article class="panel">
        <h2>月度财务复盘</h2>
        ${report.map((item) => `<div class="report-row"><strong>${item.title}</strong><span class="muted">${item.text}</span></div>`).join("")}
      </article>
    </section>
  `;
}

function wealthQuotes(data) {
  return [
    {
      title: "真正的底气，不是今天赚了多少，而是每个月都能留下多少。",
      text: `你本月储蓄率是 ${percent(data.savingRate)}。让这个数字稳定变好，财富系统就开始启动。`,
    },
    {
      title: "净资产的每一次增加，都是你替未来的自己争取选择权。",
      text: `当前净资产 ${money(data.netWorth)}。先看清它，再一点点把它推高。`,
    },
    {
      title: "复利最偏爱长期行动的人。今天少一次冲动消费，明天多一份安全感。",
      text: "把钱从浪费支出转向应急金、学习和资产，你会越来越自由。",
    },
  ];
}

function quoteTemplate(item) {
  return `
    <article class="quote-card">
      <strong>${item.title}</strong>
      <span>${item.text}</span>
    </article>
  `;
}

function monthlyAdvice(data) {
  const advice = [
    { title: "收入总结", text: `本月收入 ${money(data.income)}，支出 ${money(data.expense)}，结余 ${money(data.surplus)}。` },
    { title: "储蓄情况", text: `储蓄率为 ${percent(data.savingRate)}，${data.savingRate >= 20 ? "已经进入较健康区间" : "建议先把目标放在 20% 以上"}。` },
    { title: "预算执行", text: budgetWarning() },
    { title: "应急金进度", text: `已完成 ${percent(data.emergencyProgress)}，当前等级为 ${emergencyLevel(data.emergencyProgress)}。` },
    { title: "下月建议", text: diagnose().task },
  ];
  return advice;
}

function budgetWarning() {
  const warnings = Object.entries(state.budgets)
    .map(([name, amount]) => {
      const spent = budgetSpent(name);
      return { name, used: amount > 0 ? (spent / amount) * 100 : 0 };
    })
    .filter((item) => item.used >= 80);
  if (!warnings.length) return "主要预算都在可控范围内，可以保持当前节奏。";
  return `${warnings.map((item) => item.name).join("、")} 已使用超过 80%，下周需要主动收紧。`;
}
