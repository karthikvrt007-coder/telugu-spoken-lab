const state = {
  tab: "learn",
  category: "verbs",
  sub: "",
  catalog: null,
  data: null,
  daily: null,
  rewards: null,
  progress: loadProgress()
};

function weekKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem("tsl-progress")) || defaultProgress();
  } catch {
    return defaultProgress();
  }
}

function defaultProgress() {
  return { week: weekKey(), points: 0, done: [], unlocked: [], lastSay: "" };
}

function save() {
  if (state.progress.week !== weekKey()) {
    state.progress = { ...defaultProgress(), unlocked: state.progress.unlocked };
  }
  localStorage.setItem("tsl-progress", JSON.stringify(state.progress));
  renderScore();
}

async function boot() {
  state.catalog = await (await fetch("/api/catalog")).json();
  state.daily = await (await fetch("/api/daily")).json();
  state.rewards = await (await fetch("/api/rewards")).json();
  bindNav();
  renderScore();
  await loadCategory("verbs");
}

function bindNav() {
  document.querySelectorAll("nav [data-tab]").forEach((b) => {
    b.onclick = () => {
      state.tab = b.dataset.tab;
      document.querySelectorAll("nav [data-tab]").forEach((x) => x.classList.toggle("active", x === b));
      route();
    };
  });
}

function renderScore() {
  const el = document.getElementById("score");
  const need = (state.daily && state.daily.weekThreshold) || 40;
  el.innerHTML = `<span>This week <b>${state.progress.points}</b> / ${need}</span>
    <span>Vault packs <b>${state.progress.unlocked.length}</b></span>`;
}

async function loadCategory(id, sub = "") {
  state.category = id;
  state.sub = sub;
  const q = sub ? `?sub=${encodeURIComponent(sub)}` : "";
  state.data = await (await fetch(`/api/category/${id}${q}`)).json();
  renderLearn();
}

function route() {
  if (state.tab === "learn") renderLearn();
  if (state.tab === "practice") renderPractice();
  if (state.tab === "game") renderGame();
  if (state.tab === "heat") renderHeat();
}

function renderLearn() {
  const main = document.getElementById("main");
  const cats = state.catalog.categories;
  const subs = (cats.find((c) => c.id === state.category) || {}).subs || [];
  const items = (state.data && state.data.items) || [];
  main.innerHTML = `
    <div class="row" style="margin-bottom:12px">
      ${cats.map((c) => `<button class="btn ${c.id === state.category ? "primary" : ""}" data-cat="${c.id}">${c.label}</button>`).join("")}
    </div>
    <div class="row" style="margin-bottom:16px">
      <button class="btn ${!state.sub ? "gold" : ""}" data-sub="">all</button>
      ${subs.map((s) => `<button class="btn ${state.sub === s ? "gold" : ""}" data-sub="${s}">${s}</button>`).join("")}
    </div>
    <p class="meta">${state.data ? state.data.note : ""}</p>
    <div class="grid">
      ${items.map(card).join("")}
    </div>
    <div class="sayback card">
      <div>Say it back — type the Telugu line in Roman</div>
      <input id="say" type="text" placeholder="ex: nēnu tinēsa" value="${state.progress.lastSay || ""}" />
      <div class="row"><button class="btn primary" id="check">check + 2 pts</button></div>
      <div class="meta" id="feedback"></div>
    </div>
  `;
  main.querySelectorAll("[data-cat]").forEach((b) => b.onclick = () => loadCategory(b.dataset.cat));
  main.querySelectorAll("[data-sub]").forEach((b) => b.onclick = () => loadCategory(state.category, b.dataset.sub));
  main.querySelector("#check").onclick = () => {
    const val = main.querySelector("#say").value.trim();
    state.progress.lastSay = val;
    const hit = items.some((i) => (i.natural || i.te || i.line || "").includes(val) || val.length >= 8);
    const fb = main.querySelector("#feedback");
    if (hit && val) {
      addPoints(2);
      fb.textContent = "Good. Now say it out loud once more. Don't add Telugu script.";
    } else {
      fb.textContent = "Try a full spoken line from a card. Roman only.";
    }
    save();
  };
}

function card(i) {
  const te = i.natural || i.te || i.line || "";
  const forms = i.forms
    ? Object.entries(i.forms).map(([k, v]) => `<div class="meta">${k}: ${Object.entries(v).map(([p, f]) => `${p} ${f}`).join(" · ")}</div>`).join("")
    : "";
  return `<article class="card">
    <div class="tag">${i.sub || ""} ${i.root ? "· " + i.root : ""}</div>
    <p class="te">${te}</p>
    <div class="meta">${i.en || i.gloss || ""} · KN: ${i.kannada || i.kn || ""}</div>
    ${i.hint ? `<div class="meta">${i.hint}</div>` : ""}
    ${i.say || i.rule || i.feel ? `<div class="meta">${i.say || i.rule || i.feel}</div>` : ""}
    ${forms}
  </article>`;
}

async function renderPractice() {
  const packs = ["street", "home", "phone"];
  const pack = state.pack || "street";
  const data = await (await fetch(`/api/practice?pack=${pack}`)).json();
  const main = document.getElementById("main");
  main.innerHTML = `
    <div class="row">${packs.map((p) => `<button class="btn ${p === pack ? "primary" : ""}" data-pack="${p}">${p}</button>`).join("")}</div>
    <p class="meta">Cover the English. Say the Telugu. Then uncover.</p>
    <div class="grid">${data.items.map((i, n) => `
      <article class="card" data-i="${n}">
        <p class="te">${i.te}</p>
        <div class="meta">${i.en} · KN ${i.kn}</div>
      </article>`).join("")}</div>
    <div class="row"><button class="btn gold" id="donePack">I said the whole pack out loud · +8</button></div>
  `;
  main.querySelectorAll("[data-pack]").forEach((b) => {
    b.onclick = () => { state.pack = b.dataset.pack; renderPractice(); };
  });
  main.querySelector("#donePack").onclick = () => {
    addPoints(8);
    alert("Pack counted. Weekly heat is closer.");
  };
}

function renderGame() {
  const main = document.getElementById("main");
  const tasks = state.daily.tasks;
  main.innerHTML = `
    <p>Every day you speak, you score. Hit ${state.daily.weekThreshold} this week and the vault opens.</p>
    <div class="grid">${tasks.map((t) => {
      const done = state.progress.done.includes(t.id + weekKey());
      return `<article class="card ${done ? "done" : ""}">
        <p class="te">${t.title}</p>
        <div class="meta">${t.points} pts · ${t.category}</div>
        <div class="row"><button class="btn primary" data-task="${t.id}" ${done ? "disabled" : ""}>${done ? "done" : "collect"}</button></div>
      </article>`;
    }).join("")}</div>
  `;
  main.querySelectorAll("[data-task]").forEach((b) => {
    b.onclick = () => {
      const t = tasks.find((x) => x.id === b.dataset.task);
      const key = t.id + weekKey();
      if (!state.progress.done.includes(key)) {
        state.progress.done.push(key);
        addPoints(t.points);
      }
      renderGame();
    };
  });
}

function renderHeat() {
  const main = document.getElementById("main");
  const open = state.progress.points >= state.rewards.threshold || state.progress.unlocked.length;
  main.innerHTML = `
    <p>${state.rewards.pitch}</p>
    <div class="grid">${state.rewards.packs.map((p) => {
      const unlocked = state.progress.unlocked.includes(p.id) || state.progress.points >= p.cost && open;
      return `<article class="card ${unlocked ? "" : "locked"}">
        <p class="te">${p.title}</p>
        <div class="meta">week ${p.week} · ${p.cost} pts</div>
        ${unlocked ? p.lines.map((l) => `<p class="te">${l.te}</p><div class="meta">${l.en} · KN ${l.kn}</div>`).join("") : "<p class=\"meta\">Speak more. The door stays shut.</p>"}
        <div class="row"><button class="btn gold" data-unlock="${p.id}" ${unlocked ? "disabled" : ""}>unlock</button></div>
      </article>`;
    }).join("")}</div>
  `;
  main.querySelectorAll("[data-unlock]").forEach((b) => {
    b.onclick = () => {
      const pack = state.rewards.packs.find((p) => p.id === b.dataset.unlock);
      if (state.progress.points >= pack.cost) {
        if (!state.progress.unlocked.includes(pack.id)) state.progress.unlocked.push(pack.id);
        save();
        renderHeat();
      } else {
        alert(`Need ${pack.cost}. You have ${state.progress.points}.`);
      }
    };
  });
}

function addPoints(n) {
  if (state.progress.week !== weekKey()) {
    state.progress.week = weekKey();
    state.progress.points = 0;
    state.progress.done = [];
  }
  state.progress.points += n;
  save();
}

boot();
