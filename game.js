// Interface (menu/lobby) e lógica do jogo: dicas, discussão, votação e bots
let P = [],
  me,
  W,
  theme,
  code = "",
  nb = 5,
  gameTextInput = null,
  lastHumanVote = null;

const PROFILE_KEY = "impostor3d.profile.v1";
const CHAIR_CATALOG = [
  { id: "classic", name: "Clássica", price: 0, color: "#4f46e5", description: "Sua cadeira original." },
  { id: "ocean", name: "Azul oceano", price: 45, color: "#168ac2", description: "Uma cadeira azul para sua próxima partida." },
  { id: "gold", name: "Dourada", price: 90, color: "#d9a928", description: "Um assento digno de um campeão." },
  { id: "rainbow", name: "Arco-íris", price: 150, color: "rainbow", description: "Cadeira especial com cores vibrantes." },
];
const TITLE_CATALOG = [
  { id: "first_win", name: "Primeira Vitória", description: "Vença sua primeira partida.", unlock: (p) => p.wins >= 1 },
  { id: "experienced", name: "Experiente", description: "Vença 5 partidas.", unlock: (p) => p.wins >= 5 },
  { id: "room_legend", name: "Lenda da Sala", description: "Vença 10 partidas.", unlock: (p) => p.wins >= 10 },
  { id: "bluff_master", name: "Mestre do Blefe", description: "Vença 3 partidas como impostor.", unlock: (p) => p.impostorWins >= 3 },
  { id: "detective", name: "Detetive", description: "Esteja na equipe que elimina o impostor 3 vezes.", unlock: (p) => p.caughtImpostors >= 3 },
  { id: "survivor", name: "Sobrevivente", description: "Vença 3 partidas como inocente sem ser eliminado.", unlock: (p) => p.survivorWins >= 3 },
];
const EMPTY_PROFILE = {
  coins: 0,
  wins: 0,
  games: 0,
  impostorWins: 0,
  caughtImpostors: 0,
  survivorWins: 0,
  totalRounds: 0,
  selectedChair: "classic",
  ownedChairs: ["classic"],
  selectedTitle: "",
  unlockedTitles: [],
};
function readProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    const p = { ...EMPTY_PROFILE, ...saved };
    p.coins = Math.max(0, Number(p.coins) || 0);
    ["wins", "games", "impostorWins", "caughtImpostors", "survivorWins", "totalRounds"].forEach((k) => {
      p[k] = Math.max(0, Number(p[k]) || 0);
    });
    p.ownedChairs = Array.isArray(p.ownedChairs)
      ? [...new Set(["classic", ...p.ownedChairs.filter((id) => CHAIR_CATALOG.some((c) => c.id === id))])]
      : ["classic"];
    p.unlockedTitles = Array.isArray(p.unlockedTitles)
      ? [...new Set(p.unlockedTitles.filter((id) => TITLE_CATALOG.some((t) => t.id === id)))]
      : [];
    if (!p.ownedChairs.includes(p.selectedChair)) p.selectedChair = "classic";
    if (!p.unlockedTitles.includes(p.selectedTitle)) p.selectedTitle = "";
    return p;
  } catch {
    return { ...EMPTY_PROFILE, ownedChairs: ["classic"], unlockedTitles: [] };
  }
}
let profile = readProfile();
function saveProfile() {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // The game remains playable if browser storage is unavailable.
  }
  refreshProfileUI();
}
function refreshProfileUI() {
  const coins = $("#menu-coins");
  if (coins) coins.textContent = profile.coins;
  const wins = $("#menu-wins");
  if (wins) wins.textContent = profile.wins;
  const storeCoins = $("#store-coins");
  if (storeCoins) storeCoins.textContent = profile.coins;
  const title = $("#menu-title");
  if (title) title.textContent = TITLE_CATALOG.find((t) => t.id === profile.selectedTitle)?.name || "Sem título equipado";
}
function unlockTitles() {
  const newlyUnlocked = [];
  TITLE_CATALOG.forEach((t) => {
    if (t.unlock(profile) && !profile.unlockedTitles.includes(t.id)) {
      profile.unlockedTitles.push(t.id);
      newlyUnlocked.push(t.name);
    }
  });
  return newlyUnlocked;
}
unlockTitles();

// Some embedded/mobile browsers keep keyboard focus on the canvas even when
// the visible clue field has focus. Route ordinary typing to the active clue.
document.addEventListener(
  "keydown",
  (e) => {
    const i = gameTextInput;
    if (!i || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter") {
      e.preventDefault();
      i.onkeydown?.({ key: "Enter", preventDefault() {} });
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      const start = i.selectionStart ?? i.value.length;
      const end = i.selectionEnd ?? start;
      i.value = start === end
        ? i.value.slice(0, Math.max(0, start - 1)) + i.value.slice(end)
        : i.value.slice(0, start) + i.value.slice(end);
      const pos = start === end ? Math.max(0, start - 1) : start;
      i.setSelectionRange(pos, pos);
      i.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    if (e.key.length === 1) {
      e.preventDefault();
      const start = i.selectionStart ?? i.value.length;
      const end = i.selectionEnd ?? start;
      const next = i.value.slice(0, start) + e.key + i.value.slice(end);
      if (next.length > i.maxLength) return;
      i.value = next;
      i.setSelectionRange(start + 1, start + 1);
      i.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
  true,
);
const show = (id) =>
  ["menu", "inventory", "store", "lobby", "hud", "end"].forEach((i) => {
    $("#" + i).hidden = i !== id;
    if (i === "hud") {
      // The canvas remains interactive through empty HUD areas for camera control.
      $("#c").style.pointerEvents = "auto";
      focusCamera(id === "hud" ? me : null);
    }
  });
const status = (t) => ($("#st").textContent = t),
  timer = (t) => ($("#tm").textContent = t);
function log(who, txt, cls) {
  const d = document.createElement("div");
  if (cls) d.className = cls;
  if (who) {
    const b = document.createElement("b");
    b.textContent = who + ": ";
    d.append(b);
  }
  d.append(document.createTextNode(txt));
  $("#log").append(d);
  $("#log").scrollTop = 1e9;
}
function itemCard({ icon, name, description, action, actionText, disabled, color }) {
  const card = document.createElement("div");
  card.className = "item-card";
  const badge = document.createElement("div");
  badge.className = "item-icon";
  badge.textContent = icon;
  badge.style.setProperty(
    "--swatch",
    color === "rainbow"
      ? "linear-gradient(135deg, #fa4c74, #ffb82e, #50bd73, #438fe5, #9d62cf)"
      : color || "var(--ac)",
  );
  const copy = document.createElement("div");
  copy.className = "item-copy";
  const label = document.createElement("strong");
  label.textContent = name;
  const detail = document.createElement("small");
  detail.textContent = description;
  copy.append(label, detail);
  const button = document.createElement("button");
  button.textContent = actionText;
  button.disabled = !!disabled;
  if (action) button.onclick = action;
  card.append(badge, copy, button);
  return card;
}
function refreshEquippedPlayer() {
  if (!P.length) return;
  P[0].chairStyle = profile.selectedChair;
  P[0].title = TITLE_CATALOG.find((t) => t.id === profile.selectedTitle)?.name || "";
  build(P);
}
function renderInventory() {
  const chairs = $("#owned-chairs");
  const titles = $("#owned-titles");
  chairs.innerHTML = "";
  titles.innerHTML = "";
  CHAIR_CATALOG.filter((c) => profile.ownedChairs.includes(c.id)).forEach((chair) => {
    const selected = profile.selectedChair === chair.id;
    chairs.append(itemCard({
      icon: "🪑",
      name: chair.name,
      description: chair.description,
      color: chair.color,
      actionText: selected ? "Equipado" : "Usar",
      disabled: selected,
      action: () => {
        profile.selectedChair = chair.id;
        saveProfile();
        refreshEquippedPlayer();
        renderInventory();
      },
    }));
  });
  titles.append(itemCard({
    icon: "🏷️",
    name: "Sem título",
    description: "Não exibe um título junto ao seu nome.",
    actionText: profile.selectedTitle ? "Usar" : "Equipado",
    disabled: !profile.selectedTitle,
    action: () => {
      profile.selectedTitle = "";
      saveProfile();
      refreshEquippedPlayer();
      renderInventory();
    },
  }));
  TITLE_CATALOG.forEach((title) => {
    const unlocked = profile.unlockedTitles.includes(title.id);
    const selected = profile.selectedTitle === title.id;
    titles.append(itemCard({
      icon: unlocked ? "🏅" : "🔒",
      name: title.name,
      description: unlocked ? title.description : `${title.description} · ${titleProgress(title.id)}`,
      actionText: !unlocked ? "Bloqueado" : selected ? "Equipado" : "Usar",
      disabled: !unlocked || selected,
      action: () => {
        profile.selectedTitle = title.id;
        saveProfile();
        refreshEquippedPlayer();
        renderInventory();
      },
    }));
  });
}
function titleProgress(id) {
  const progress = {
    first_win: `${profile.wins}/1 vitórias`,
    experienced: `${Math.min(profile.wins, 5)}/5 vitórias`,
    room_legend: `${Math.min(profile.wins, 10)}/10 vitórias`,
    bluff_master: `${Math.min(profile.impostorWins, 3)}/3 vitórias como impostor`,
    detective: `${Math.min(profile.caughtImpostors, 3)}/3 impostores eliminados`,
    survivor: `${Math.min(profile.survivorWins, 3)}/3 vitórias sobrevivendo`,
  };
  return progress[id] || "Ainda bloqueado";
}
function renderStore() {
  const list = $("#store-items");
  list.innerHTML = "";
  $("#store-coins").textContent = profile.coins;
  CHAIR_CATALOG.filter((c) => c.id !== "classic").forEach((chair) => {
    const owned = profile.ownedChairs.includes(chair.id);
    const selected = profile.selectedChair === chair.id;
    const actionText = selected ? "Equipado" : owned ? "Usar" : `🪙 ${chair.price}`;
    list.append(itemCard({
      icon: "🪑",
      name: chair.name,
      description: chair.description,
      color: chair.color,
      actionText,
      disabled: selected || (!owned && profile.coins < chair.price),
      action: () => {
        if (!owned) {
          profile.coins -= chair.price;
          profile.ownedChairs.push(chair.id);
        }
        profile.selectedChair = chair.id;
        saveProfile();
        refreshEquippedPlayer();
        renderStore();
      },
    }));
  });
}
function openInventory() {
  renderInventory();
  show("inventory");
}
function openStore() {
  renderStore();
  show("store");
}
function mkPlayers(n) {
  const nm = ($("#nm").value.trim() || "Você").slice(0, 12),
    cs = [...COLS].sort(() => Math.random() - 0.5);
  P = [
    {
      name: nm,
      human: true,
      color: cs[0],
      chairStyle: profile.selectedChair,
      title: TITLE_CATALOG.find((t) => t.id === profile.selectedTitle)?.name || "",
    },
    ...NAMES.sort(() => Math.random() - 0.5)
      .slice(0, n)
      .map((x, i) => ({ name: x, human: false, color: cs[i + 1] })),
  ];
  P.forEach((p) => {
    p.alive = true;
    p.clues = [];
    p.sus = [];
  });
  me = P[0];
  build(P);
}
function lobby() {
  $("#rc").textContent = code;
  $("#bn").textContent = nb;
  $("#pl").innerHTML = "";
  mkPlayers(nb);
  P.forEach((p) => {
    const s = document.createElement("span");
    s.textContent = p.name;
    $("#pl").append(s);
  });
  show("lobby");
}
const rc = () =>
  Array.from({ length: 4 }, () =>
    pick([..."ABCDEFGHJKLMNPQRSTUVWXYZ23456789"]),
  ).join("");
$("#mk").onclick = () => {
  code = rc();
  lobby();
};
$("#jn").onclick = () => {
  const v = $("#cd").value.trim().toUpperCase();
  if (v.length !== 4) {
    $("#cd").focus();
    return;
  }
  code = v;
  lobby();
};
$("#bs").oninput = (e) => {
  nb = +e.target.value;
  lobby();
};
$("#open-inventory").onclick = openInventory;
$("#open-store").onclick = openStore;
$("#inventory-back").onclick = () => show("menu");
$("#store-back").onclick = () => show("menu");
$("#cam-reset").onclick = () => focusCamera(me);
$("#bk").onclick = () => {
  show("menu");
};
$("#mn").onclick = () => {
  playing = false;
  drawBoard("🕵️ Impostor");
  show("menu");
};
$("#go").onclick = play;
$("#ag").onclick = () => {
  mkPlayers(nb);
  play();
};
refreshProfileUI();
function ask(ph, btn, max = 24) {
  return new Promise((res) => {
    const a = $("#act");
    a.innerHTML = "";
    const i = document.createElement("input");
    i.type = "text";
    i.readOnly = false;
    i.autocomplete = "off";
    i.inputMode = "text";
    i.spellcheck = false;
    i.placeholder = ph;
    i.maxLength = max;
    gameTextInput = i;
    const b = document.createElement("button");
    b.textContent = btn;
    const go = () => {
      const v = i.value.trim();
      if (!v) return;
      gameTextInput = null;
      a.innerHTML = "";
      res(v);
    };
    b.onclick = go;
    i.onkeydown = (e) => e.key === "Enter" && go();
    i.addEventListener("pointerdown", (e) => e.stopPropagation());
    a.append(i, b);
    requestAnimationFrame(() => i.focus({ preventScroll: true }));
  });
}
function btns(list) {
  return new Promise((res) => {
    const a = $("#act");
    a.innerHTML = "";
    list.forEach(([l, v, alt]) => {
      const b = document.createElement("button");
      b.textContent = l;
      if (alt) b.className = "alt";
      b.onclick = () => {
        a.innerHTML = "";
        res(v);
      };
      a.append(b);
    });
  });
}

// ---------- Jogo ----------
const susOf = (p, v) =>
  p.human
    ? W.c.some((c) => norm(c) === norm(v))
      ? 0.1
      : 0.25 + Math.random() * 0.35
    : p.imp
      ? 0.35 + Math.random() * 0.45
      : 0.15 + Math.random() * 0.25;
async function clue(p, r) {
  status(`Rodada ${r} · dica de ${p.name}`);
  cur = p;
  let v;
  if (p.human) {
    do {
      v = await ask(
        p.imp ? "Sua dica (finja que sabe!)" : "Sua dica sobre a palavra",
        "Enviar",
      );
      if (!p.imp && norm(v).includes(norm(W.w))) {
        status("Não vale dizer a palavra!");
        v = null;
      }
    } while (!v);
  } else {
    await sleep(1200);
    const pool = p.imp ? pick(TH[theme].filter((x) => x !== W)).c : W.c,
      used = P.flatMap((q) => q.clues),
      f = pool.filter((c) => !used.includes(c));
    v = pick(f.length ? f : pool);
  }
  p.clues.push(v);
  p.sus.push(susOf(p, v));
  say(p, v, 6000);
  log(p.name, v);
  await sleep(p.human ? 600 : 1000);
  cur = null;
}
const avg = (p) => p.sus.reduce((a, b) => a + b, 0) / p.sus.length;
function suspect(b, al) {
  return al
    .filter((p) => p !== b)
    .map((p) => ({ p, s: avg(p) + Math.random() * 0.3 }))
    .sort((x, y) => y.s - x.s)[0].p;
}
async function discuss() {
  const al = P.filter((p) => p.alive),
    bots = al.filter((p) => !p.human);
  let skip = false,
    t = 25,
    live = true;
  status("Discussão: conversem e desconfiem!");
  log("", "— Hora de conversar! —", "s");
  const a = $("#act");
  a.innerHTML = "";
  if (me.alive) {
    const i = document.createElement("input");
    i.type = "text";
    i.readOnly = false;
    i.autocomplete = "off";
    i.inputMode = "text";
    i.spellcheck = false;
    i.placeholder = "Converse com a mesa…";
    i.maxLength = 60;
    gameTextInput = i;
    const s = document.createElement("button");
    s.textContent = "Enviar";
    const v = document.createElement("button");
    v.textContent = "Ir para votação";
    v.className = "alt";
    const send = () => {
      if (i.value.trim()) {
        log(me.name, i.value.trim());
        say(me, i.value.trim(), 4000);
        i.value = "";
      }
    };
    s.onclick = send;
    i.onkeydown = (e) => e.key === "Enter" && send();
    i.addEventListener("pointerdown", (e) => e.stopPropagation());
    v.onclick = () => (skip = true);
    a.append(i, s, v);
    requestAnimationFrame(() => i.focus({ preventScroll: true }));
  }
  (async () => {
    while (live) {
      await sleep(2000 + Math.random() * 2500);
      if (!live) break;
      const b = pick(bots),
        s = b.imp ? pick(al.filter((p) => p !== b && !p.imp)) : suspect(b, al);
      const m = pick([
        `${s.name} foi meio vago…`,
        `Não confio em ${s.name}.`,
        `Acho que ${s.name} é o impostor!`,
        `A dica de ${s.name} não encaixou.`,
        `Concordo, ${s.name} está estranho.`,
      ]);
      log(b.name, m);
      say(b, m, 3500);
    }
  })();
  while (t > 0 && !skip) {
    timer("⏱ " + t);
    await sleep(1000);
    t--;
  }
  live = false;
  gameTextInput = null;
  timer("");
  a.innerHTML = "";
}
async function vote() {
  const al = P.filter((p) => p.alive);
  status("Votação! Escolha alguém ou pule.");
  let pv = null;
  const hv = me.alive
    ? Promise.race([
        btns([
          ...al.filter((p) => p !== me).map((p) => ["Votar em " + p.name, p]),
          ["Pular", null, 1],
        ]),
        sleep(20000).then(() => null),
      ])
    : sleep(2500).then(() => null);
  timer("");
  pv = await hv;
  lastHumanVote = pv;
  $("#act").innerHTML = "";
  const vs = new Map();
  al.forEach((b) => {
    let c;
    if (b.human) c = pv;
    else if (b.imp)
      c = Math.random() < 0.1 ? null : pick(al.filter((p) => p !== b));
    else {
      const s = suspect(b, al);
      c = avg(s) > 0.45 || Math.random() < 0.7 ? s : null;
    }
    vs.set(b, c);
  });
  const cnt = new Map();
  let sk = 0;
  vs.forEach((c, b) => {
    log(b.name, c ? "vota em " + c.name : "pula");
    c ? cnt.set(c, (cnt.get(c) || 0) + 1) : sk++;
  });
  const top = [...cnt.entries()].sort((a, b) => b[1] - a[1]);
  if (top.length && top[0][1] > sk && (top.length < 2 || top[0][1] > top[1][1]))
    return top[0][0];
  return null;
}
async function revealRole() {
  const overlay = $("#reveal");
  const icon = $("#reveal-icon");
  const title = $("#reveal-title");
  const detail = $("#reveal-detail");
  const button = $("#reveal-ok");
  overlay.hidden = false;
  button.hidden = true;

  for (const face of ["🎴", "🔎", "🎴"]) {
    icon.textContent = face;
    icon.style.animation = "none";
    void icon.offsetWidth;
    icon.style.animation = "";
    title.textContent = "Sorteando seu papel…";
    detail.textContent = "Os papéis estão sendo distribuídos.";
    await sleep(550);
  }

  icon.textContent = me.imp ? "🕵️" : "🟢";
  icon.className = "reveal-icon " + (me.imp ? "is-impostor" : "is-innocent");
  icon.style.animation = "none";
  void icon.offsetWidth;
  icon.style.animation = "";
  title.textContent = me.imp ? "Você é o IMPOSTOR!" : "Você é INOCENTE!";
  detail.textContent = me.imp
    ? `Descubra a palavra sem ser descoberto. Tema: ${theme}.`
    : `Sua palavra é ${W.w.toUpperCase()} · Tema: ${theme}.`;
  button.hidden = false;

  await new Promise((resolve) => {
    button.onclick = () => {
      overlay.hidden = true;
      button.onclick = null;
      resolve();
    };
  });
}
async function play() {
  let roundsPlayed = 0;
  let correctReads = 0;
  const th0 = pick(Object.keys(TH));
  theme = th0;
  W = pick(TH[theme]);
  P.forEach((p) => {
    p.alive = true;
    p.imp = false;
    p.clues = [];
    p.sus = [];
    paintName(p);
  });
  pick(P).imp = true;
  playing = true;
  show("hud");
  $("#log").innerHTML = "";
  drawBoard("Tema: " + theme);
  $("#word").textContent = me.imp
    ? `🕵️ Você é o IMPOSTOR · Tema: ${theme}`
    : `Tema: ${theme} · Palavra: ${W.w.toUpperCase()}`;
  status("Sala " + code);
  await revealRole();
  for (let r = 1; ; r++) {
    const al = P.filter((p) => p.alive),
      st = Math.floor(Math.random() * al.length);
    for (let k = 0; k < al.length; k++) await clue(al[(st + k) % al.length], r);
    await discuss();
    const out = await vote();
    roundsPlayed++;
    if (!me.imp && lastHumanVote?.imp) correctReads++;
    if (!out) {
      log("", "Ninguém foi eliminado. Nova rodada!", "s");
      say(me, "…", 0);
      await sleep(1500);
      continue;
    }
    out.alive = false;
    paintName(out);
    log(
      "",
      `${out.name} foi eliminado — ${out.imp ? "era o IMPOSTOR!" : "era inocente."}`,
      "s",
    );
    await sleep(2200);
    const left = P.filter((p) => p.alive).length;
    if (out.imp || left <= 2) {
      const innWin = out.imp;
      playing = false;
      const won = innWin !== me.imp;
      profile.games++;
      profile.totalRounds += roundsPlayed;
      if (won) profile.wins++;
      if (won && me.imp) profile.impostorWins++;
      if (won && !me.imp && me.alive) profile.survivorWins++;
      if (out.imp && !me.imp) profile.caughtImpostors++;
      const reward = 10 + roundsPlayed * 3 + correctReads * 6 + (won ? 25 : 0) + (me.alive ? 5 : 0);
      profile.coins += reward;
      const newTitles = unlockTitles();
      saveProfile();
      $("#et").textContent = won ? "🎉 Você venceu!" : "😵 Você perdeu";
      $("#ed").textContent =
        `${innWin ? "Os inocentes descobriram" : "O impostor enganou todos:"} ${P.find((p) => p.imp).name}. Palavra: ${W.w} (${theme}). Recompensa da partida: 🪙 ${reward} moedas${newTitles.length ? ` · Novo título: ${newTitles.join(", ")}` : ""}.`;
      show("end");
      return;
    }
  }
}
