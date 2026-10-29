// Interface (menu/lobby) e lógica do jogo: dicas, discussão, votação e bots
let P = [],
  me,
  W,
  theme,
  code = "",
  nb = 5,
  gameTextInput = null;

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
  ["menu", "lobby", "hud", "end"].forEach((i) => {
    $("#" + i).hidden = i !== id;
    // During a round, the full-screen canvas must not capture taps intended
    // for the dynamically-created text fields and buttons in the HUD.
    if (i === "hud") $("#c").style.pointerEvents = id === "hud" ? "none" : "auto";
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
function mkPlayers(n) {
  const nm = ($("#nm").value.trim() || "Você").slice(0, 12),
    cs = [...COLS].sort(() => Math.random() - 0.5);
  P = [
    { name: nm, human: true, color: cs[0] },
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
async function play() {
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
  await btns([["Entendi, começar!", 1]]);
  for (let r = 1; ; r++) {
    const al = P.filter((p) => p.alive),
      st = Math.floor(Math.random() * al.length);
    for (let k = 0; k < al.length; k++) await clue(al[(st + k) % al.length], r);
    await discuss();
    const out = await vote();
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
      $("#et").textContent = won ? "🎉 Você venceu!" : "😵 Você perdeu";
      $("#ed").textContent =
        `${innWin ? "Os inocentes descobriram" : "O impostor enganou todos:"} ${P.find((p) => p.imp).name}. Palavra: ${W.w} (${theme}).`;
      show("end");
      return;
    }
  }
}
