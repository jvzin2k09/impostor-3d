// Sala de aula em 3D: quadro, janelas, cartazes, carteiras, personagens e câmera
const rd = new THREE.WebGLRenderer({ canvas: $("#c"), antialias: true });
rd.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe3ff);
const cam = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0xcaa27a, 0.95));
const dl = new THREE.DirectionalLight(0xfff3d6, 0.6);
dl.position.set(5, 10, 6);
scene.add(dl);
const lam = (c) =>
  new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide });
const rainbowChairCanvas = document.createElement("canvas");
rainbowChairCanvas.width = 512;
rainbowChairCanvas.height = 64;
const rainbowChairContext = rainbowChairCanvas.getContext("2d");
const rainbowGradient = rainbowChairContext.createLinearGradient(0, 0, 512, 0);
[
  [0, "#ff405d"],
  [0.18, "#ff9f32"],
  [0.36, "#ffe14a"],
  [0.54, "#4dc878"],
  [0.72, "#378de0"],
  [0.88, "#7656dc"],
  [1, "#ef55b5"],
].forEach(([offset, color]) => rainbowGradient.addColorStop(offset, color));
rainbowChairContext.fillStyle = rainbowGradient;
rainbowChairContext.fillRect(0, 0, 512, 64);
const rainbowChairTexture = new THREE.CanvasTexture(rainbowChairCanvas);
rainbowChairTexture.encoding = THREE.sRGBEncoding;
const rainbowChairMaterial = new THREE.MeshLambertMaterial({
  map: rainbowChairTexture,
  side: THREE.DoubleSide,
});
const styledChairMaterials = {
  ocean: lam(0x168ac2),
  gold: lam(0xd9a928),
};
function box(w, h, d, c, x, y, z, par = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(c));
  m.position.set(x, y, z);
  par.add(m);
  return m;
}
function cyl(a, b, h, c, x, y, z, par = scene) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(a, b, h, 32), lam(c));
  m.position.set(x, y, z);
  par.add(m);
  return m;
}
function parquetTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d");
  const woods = ["#98653f", "#ad7749", "#875838", "#bd8955", "#a16b40"];
  x.fillStyle = "#795033";
  x.fillRect(0, 0, 1024, 1024);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const ox = col * 128, oy = row * 128, vertical = (row + col) % 2 === 0;
      for (let plank = 0; plank < 4; plank++) {
        const color = woods[(row * 3 + col + plank) % woods.length];
        x.fillStyle = color;
        if (vertical) x.fillRect(ox + plank * 32 + 2, oy + 2, 29, 124);
        else x.fillRect(ox + 2, oy + plank * 32 + 2, 124, 29);
        x.strokeStyle = "rgba(55,34,22,.2)";
        x.lineWidth = 2;
        x.strokeRect(ox + 2, oy + 2, 124, 124);
      }
      x.strokeStyle = "rgba(45,29,20,.45)";
      x.lineWidth = 3;
      x.strokeRect(ox, oy, 128, 128);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 1);
  t.encoding = THREE.sRGBEncoding;
  return t;
}
const fl = new THREE.Mesh(
  new THREE.PlaneGeometry(24, 24),
  new THREE.MeshLambertMaterial({ map: parquetTexture() }),
);
fl.rotation.x = -Math.PI / 2;
scene.add(fl);
box(24, 0.28, 0.16, 0xfaf7f0, 0, 0.14, -11.82);
box(0.16, 0.28, 24, 0xfaf7f0, -11.82, 0.14, 0);
box(0.16, 0.28, 24, 0xfaf7f0, 11.82, 0.14, 0);
[
  [0, 4, -12, 0, 24],
  [0, 4, 12, 0, 24],
  [-12, 4, 0, Math.PI / 2, 24],
  [12, 4, 0, Math.PI / 2, 24],
].forEach(([x, y, z, r, w]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 8), lam(0xe9e6e2));
  m.position.set(x, y, z);
  m.rotation.y = r;
  scene.add(m);
});
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), lam(0xf8f7f3));
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = 8.05;
scene.add(ceiling);
[-5, 2, 8].forEach((z) => {
  box(3.4, 0.1, 0.72, 0xfafafa, 0, 7.88, z);
  box(3.05, 0.035, 0.48, 0xfff6d8, 0, 7.81, z);
});
// Three tall classroom windows, all kept along the left wall like the reference.
[-7, -1, 5].forEach((z) => {
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(3.7, 2.9),
    new THREE.MeshBasicMaterial({ color: 0xc5e9ff, side: THREE.DoubleSide }),
  );
  glass.position.set(-11.78, 4.35, z);
  glass.rotation.y = Math.PI / 2;
  scene.add(glass);
  [-1.95, 1.95].forEach((dz) => box(0.2, 3.1, 0.18, 0xf5f0e7, -11.72, 4.35, z + dz));
  [-1.5, 0, 1.5].forEach((dy) => box(0.2, 0.1, 3.9, 0xf5f0e7, -11.72, 4.35 + dy, z));
  [-0.95, 0.95].forEach((dz) => box(0.16, 2.9, 0.1, 0xf5f0e7, -11.68, 4.35, z + dz));
  for (let n = 0; n < 9; n++) {
    box(0.1, 0.045, 3.55, 0xfffdf5, -11.61, 3.45 + n * 0.22, z);
  }
  box(0.4, 0.18, 4.1, 0xffffff, -11.65, 2.78, z);
});
// Wall-mounted air conditioner above the windows, as in the reference room.
box(0.62, 0.62, 2.8, 0xfafafa, -11.55, 7.15, -9.7);
box(0.055, 0.09, 2.3, 0x9ca8ad, -11.2, 6.88, -9.7);

function classroomPoster(title, colors, z) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 400;
  const x = c.getContext("2d");
  x.fillStyle = "#fff8e9";
  x.fillRect(0, 0, 320, 400);
  x.fillStyle = colors[0];
  x.fillRect(0, 0, 320, 72);
  x.fillStyle = "#fff";
  x.font = "bold 27px system-ui";
  x.textAlign = "center";
  x.fillText(title, 160, 46);
  for (let n = 0; n < 5; n++) {
    x.fillStyle = colors[n % colors.length];
    x.fillRect(42, 105 + n * 52, 236, 30);
    x.fillStyle = "rgba(255,255,255,.9)";
    x.fillRect(54, 113 + n * 52, 130 + (n % 3) * 24, 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  const poster = new THREE.Mesh(
    new THREE.PlaneGeometry(2.15, 2.7),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
  );
  poster.position.set(11.78, 4.25, z);
  poster.rotation.y = -Math.PI / 2;
  scene.add(poster);
  box(0.08, 2.84, 2.28, 0x8a5a2b, 11.84, 4.25, z);
  poster.position.x = 11.78;
}
classroomPoster("ALFABETO", ["#e15b4a", "#3b8ec2", "#f1b63c"], -6.7);
classroomPoster("NÚMEROS", ["#447d59", "#e87945", "#4c79bb"], -1.5);
classroomPoster("CIÊNCIAS", ["#4b8d71", "#8656a6", "#e2a943"], 3.7);
const bc = document.createElement("canvas");
bc.width = 1024;
bc.height = 410;
const bt = new THREE.CanvasTexture(bc);
box(16.4, 4.3, 0.12, 0x275e43, 0, 4.65, -11.86);
box(16.65, 0.16, 0.18, 0x9a683d, 0, 6.89, -11.7);
box(16.65, 0.16, 0.18, 0x9a683d, 0, 2.41, -11.7);
box(0.16, 4.55, 0.18, 0x9a683d, -8.32, 4.65, -11.7);
box(0.16, 4.55, 0.18, 0x9a683d, 8.32, 4.65, -11.7);
box(9.2, 0.12, 0.34, 0x9a683d, 0, 2.47, -11.55);
box(8.85, 0.08, 0.24, 0xf0e2c6, 0, 2.57, -11.45);
[-3.8, -2.6, -1.4, 1.4, 2.6, 3.8].forEach((x, n) => {
  box(0.45, 0.045, 0.06, [0xf2d34f, 0xe7e7df, 0x6ba9d0][n % 3], x, 2.65, -11.43);
});
const bm = new THREE.Mesh(
  new THREE.PlaneGeometry(9, 3.5),
  new THREE.MeshBasicMaterial({ map: bt }),
);
bm.position.set(0, 4.55, -11.58);
scene.add(bm);
box(9.28, 3.76, 0.12, 0xf4f1e8, 0, 4.55, -11.65);
// Projection surface sits just in front of the green chalkboard.
bm.position.z = -11.52;
function chalkNote(x, title, lines) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 270;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(255,255,255,.9)";
  g.font = "bold 34px system-ui";
  g.fillText(title, 20, 50);
  g.font = "26px system-ui";
  lines.forEach((line, i) => g.fillText(line, 20, 105 + i * 48));
  const note = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 2.35),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, side: THREE.DoubleSide }),
  );
  note.position.set(x, 4.55, -11.61);
  scene.add(note);
}
chalkNote(-6.35, "LEMBRETE", ["Ouvir · pensar", "e participar!"]);
chalkNote(6.35, "DESAFIO", ["Observe as dicas", "e descubra!"]);
function drawBoard(t) {
  const x = bc.getContext("2d");
  x.fillStyle = "#f8f5ec";
  x.fillRect(0, 0, 1024, 410);
  x.fillStyle = "#24583f";
  x.font = 'bold 96px "Comic Sans MS",cursive,sans-serif';
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(t, 512, 205);
  bt.needsUpdate = true;
}
drawBoard("🕵️ Impostor");
// Alphabet cards above the board are arranged as a classroom banner.
"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((letter, n) => {
  const card = document.createElement("canvas");
  card.width = card.height = 96;
  const cx = card.getContext("2d");
  const colors = ["#e15b4a", "#438bc0", "#e4ae3f", "#4e9867"];
  cx.fillStyle = colors[n % colors.length];
  cx.fillRect(0, 0, 96, 96);
  cx.fillStyle = "#fff";
  cx.font = "bold 68px system-ui";
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  cx.fillText(letter, 48, 51);
  const tile = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.42),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(card), side: THREE.DoubleSide }),
  );
  tile.position.set(-5.4 + n * 0.43, 7.46, -11.72);
  scene.add(tile);
});

// Wall clock and the teacher's desk stay at the front of the classroom.
const clockGroup = new THREE.Group();
clockGroup.position.set(11.68, 6.55, -9.1);
clockGroup.rotation.y = -Math.PI / 2;
scene.add(clockGroup);
const clockFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.13, 32), lam(0x8a5a2b));
clockFrame.rotation.x = Math.PI / 2;
clockGroup.add(clockFrame);
const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.14, 32), lam(0xfff6dc));
clockFace.rotation.x = Math.PI / 2;
clockFace.position.z = 0.025;
clockGroup.add(clockFace);
const hand = box(0.035, 0.28, 0.025, 0x4d5160, 0, 0.12, 0.1, clockGroup);
hand.rotation.z = -0.35;
const hand2 = box(0.24, 0.035, 0.025, 0x4d5160, 0.08, -0.04, 0.11, clockGroup);
hand2.rotation.z = 0.5;

function teacherDesk() {
  const x = -8.3, z = -10.3;
  box(3.3, 0.16, 1.35, 0x85552f, x, 1.12, z);
  box(3.1, 0.08, 1.2, 0xb57b47, x, 1.22, z);
  [-1.35, 1.35].forEach((dx) => [-0.48, 0.48].forEach((dz) => {
    box(0.12, 1.08, 0.12, 0x4c5660, x + dx, 0.54, z + dz);
  }));
  box(0.78, 0.08, 0.58, 0x364553, x + 0.55, 1.38, z - 0.12);
  box(0.7, 0.04, 0.5, 0x8cc8d7, x + 0.55, 1.44, z - 0.12);
  box(0.52, 0.11, 0.38, 0x3f6d9b, x - 0.78, 1.34, z + 0.08);
  box(0.52, 0.11, 0.38, 0xe0ad45, x - 0.78, 1.46, z + 0.08);
  cyl(0.13, 0.16, 0.28, 0xe4d6b7, x - 1.2, 1.42, z - 0.32);
  box(1.1, 0.12, 0.65, 0x8a5a2b, x, 0.65, z + 0.95);
  box(1.1, 0.8, 0.12, 0x8a5a2b, x, 1.0, z + 1.25);
}
teacherDesk();

// Paired bookcases flank the chalkboard, anchored to the back wall.
function bookshelf(centerX) {
  const backZ = -11.62;
  const frontZ = -11.28;
  box(2.85, 4.45, 0.16, 0x8b5b35, centerX, 3.78, backZ);
  [-1.37, 1.37].forEach((dx) => {
    box(0.14, 4.5, 0.48, 0x9a683d, centerX + dx, 3.78, frontZ);
  });
  const shelfTops = [1.62, 2.7, 3.78, 4.86];
  shelfTops.forEach((topY) =>
    box(2.82, 0.12, 0.5, 0xa67445, centerX, topY - 0.06, frontZ),
  );
  const bookColors = [0x3c7895, 0xc95745, 0xe0b345, 0x4c8860, 0x765b91, 0xd47a3e];
  shelfTops.forEach((shelfY, row) => {
    for (let n = 0; n < 12; n++) {
      const width = n % 3 === 0 ? 0.2 : 0.16;
      const height = 0.5 + ((n + row) % 4) * 0.09;
      const x = centerX - 1.12 + n * 0.2;
      box(width, height, 0.25, bookColors[(n + row * 2) % bookColors.length], x, shelfY + height / 2, -11.04);
    }
  });
  // A small, labeled storage box fills the lower shelf neatly.
  box(0.9, 0.58, 0.34, 0xd8c9a7, centerX, 1.91, -11.02);
  box(0.38, 0.08, 0.03, 0xf4ead3, centerX, 1.94, -10.83);
}
bookshelf(-9.85);
bookshelf(9.85);

// One chair per participant, evenly spaced around the central table.
const TABLE_RADIUS = 2.5;
const CENTER_CHAIR_RADIUS = 3.42;
cyl(TABLE_RADIUS, TABLE_RADIUS, 0.15, 0xb07a45, 0, 1.1, 0);
cyl(0.4, 0.55, 1.05, 0x8a5a2b, 0, 0.55, 0);
function rr(x, a, b, w, h, r) {
  x.beginPath();
  x.moveTo(a + r, b);
  x.arcTo(a + w, b, a + w, b + h, r);
  x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r);
  x.arcTo(a, b, a + w, b, r);
  x.closePath();
}
function spr(w, h, sx, sy) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const t = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }),
  );
  s.scale.set(sx, sy, 1);
  s.renderOrder = 9;
  s.userData = { c, t };
  return s;
}
let seats = [];
function build(list) {
  seats.forEach((s) => scene.remove(s.g));
  seats = [];
  list.forEach((p, i) => {
    const angle = (i / list.length) * Math.PI * 2;
    const g = new THREE.Group();
    g.position.set(
      Math.cos(angle) * CENTER_CHAIR_RADIUS,
      0,
      Math.sin(angle) * CENTER_CHAIR_RADIUS,
    );
    scene.add(g);
    const chairMaterial = p.human
      ? p.chairStyle === "rainbow"
        ? rainbowChairMaterial
        : styledChairMaterials[p.chairStyle] || lam(p.color)
      : lam(p.color);
    box(0.78, 0.12, 0.78, p.color, 0, 0.57, -0.18, g).material = chairMaterial;
    box(0.78, 0.78, 0.1, p.color, 0, 1.04, -0.56, g).material = chairMaterial;
    [
      [-0.33, 0.12],
      [0.33, 0.12],
      [-0.33, -0.48],
      [0.33, -0.48],
    ].forEach(([x, z]) => box(0.065, 0.52, 0.065, 0x384653, x, 0.26, z, g));
    const body = cyl(0.32, 0.38, 0.9, p.color, 0, 1.05, 0, g),
      head = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 24, 16),
        lam(0xf1c9a5),
      );
    head.position.y = 1.78;
    g.add(head);
    [-0.1, 0.1].forEach((x) => {
      const e = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        lam(0x222222),
      );
      e.position.set(x, 0.04, 0.25);
      head.add(e);
    });
    g.lookAt(0, 0, 0);
    const name = spr(400, 88, 2.2, 0.5),
      bub = spr(512, 160, 2.9, 0.9);
    name.position.y = 2.35;
    bub.position.y = 3.1;
    bub.visible = false;
    g.add(name, bub);
    const s = { g, body, head, name, bub, p };
    p.seat = s;
    seats.push(s);
    paintName(p);
  });
}
function paintName(p) {
  const { c, t } = p.seat.name.userData,
    x = c.getContext("2d");
  x.clearRect(0, 0, 400, 88);
  x.fillStyle = p.alive ? "rgba(20,30,50,.82)" : "rgba(110,110,110,.8)";
  rr(x, 4, 4, 392, 80, 30);
  x.fill();
  x.fillStyle = "#fff";
  x.font = p.human && p.title ? "bold 25px system-ui,sans-serif" : "bold 29px system-ui,sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(
    (p.alive ? "" : "✖ ") + p.name + (p.human ? " (você)" : ""),
    200,
    p.human && p.title ? 29 : 44,
  );
  if (p.human && p.title) {
    x.fillStyle = "#ffdf76";
    x.font = "bold 17px system-ui,sans-serif";
    x.fillText(p.title, 200, 63);
  }
  t.needsUpdate = true;
}
let bto = 0;
function say(p, txt, ms = 5000) {
  const b = p.seat.bub,
    { c, t } = b.userData,
    x = c.getContext("2d");
  x.clearRect(0, 0, 512, 160);
  x.fillStyle = "#fff";
  x.strokeStyle = "#4f46e5";
  x.lineWidth = 6;
  rr(x, 6, 6, 500, 120, 30);
  x.fill();
  x.stroke();
  x.fillStyle = "#1d2433";
  let f = 60;
  do {
    x.font = "bold " + f + "px system-ui,sans-serif";
    f -= 4;
  } while (x.measureText(txt).width > 450 && f > 20);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(txt, 256, 66);
  t.needsUpdate = true;
  b.visible = true;
  b.userData.popAt = performance.now();
  const id = (p.bt = (p.bt || 0) + 1);
  setTimeout(() => {
    if (p.bt === id) b.visible = false;
  }, ms);
}
let th = 0,
  ph = 0.6,
  rad = 9,
  drag = 0,
  dragMode = "orbit",
  cur = null,
  playing = false;
const cv = $("#c");
const cameraOffset = new THREE.Vector3();
const activePointers = new Map();
let cameraFollow = null;
let lastPointer = { x: 0, y: 0 };
let pinchDistance = 0;

function focusCamera(player) {
  cameraFollow = player?.seat?.g || null;
  cameraOffset.set(0, 0, 0);
  if (cameraFollow) {
    const position = cameraFollow.position;
    th = Math.atan2(position.x, position.z);
    ph = 0.3;
    rad = 5.4;
  } else {
    ph = 0.6;
    rad = 9;
  }
}

function pointerDistance() {
  const points = [...activePointers.values()];
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

cv.onpointerdown = (e) => {
  e.preventDefault();
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  cv.setPointerCapture(e.pointerId);
  cv.classList.add("dragging");
  if (activePointers.size === 1) {
    drag = 1;
    dragMode = e.button === 2 || e.button === 1 || e.shiftKey ? "pan" : "orbit";
    lastPointer = { x: e.clientX, y: e.clientY };
  } else {
    dragMode = "pinch";
    pinchDistance = pointerDistance();
  }
};
function endPointer(e) {
  activePointers.delete(e.pointerId);
  if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId);
  if (activePointers.size === 0) {
    drag = 0;
    pinchDistance = 0;
    cv.classList.remove("dragging");
  } else if (activePointers.size === 1) {
    dragMode = "orbit";
    const point = [...activePointers.values()][0];
    lastPointer = { x: point.x, y: point.y };
  }
}
cv.onpointerup = endPointer;
cv.onpointercancel = endPointer;
cv.onpointermove = (e) => {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (activePointers.size >= 2) {
    const distance = pointerDistance();
    if (pinchDistance && distance) {
      rad = Math.max(3.4, Math.min(12, rad * (pinchDistance / distance)));
    }
    pinchDistance = distance;
    return;
  }
  const dx = e.clientX - lastPointer.x;
  const dy = e.clientY - lastPointer.y;
  lastPointer = { x: e.clientX, y: e.clientY };
  if (dragMode === "pan") {
    const scale = rad * 0.0025;
    cameraOffset.x -= dx * scale * Math.cos(th);
    cameraOffset.z += dx * scale * Math.sin(th);
    cameraOffset.y += dy * scale;
    cameraOffset.x = Math.max(-8, Math.min(8, cameraOffset.x));
    cameraOffset.y = Math.max(-4, Math.min(6, cameraOffset.y));
    cameraOffset.z = Math.max(-8, Math.min(8, cameraOffset.z));
  } else {
    th -= dx * 0.006;
    ph = Math.max(0.08, Math.min(1.25, ph + dy * 0.005));
  }
};
cv.onwheel = (e) => {
  e.preventDefault();
  rad = Math.max(3.4, Math.min(12, rad + e.deltaY * 0.008));
};
cv.oncontextmenu = (e) => e.preventDefault();
function frame(t) {
  requestAnimationFrame(frame);
  const w = innerWidth,
    h = innerHeight;
  if (cv.width !== w * rd.getPixelRatio()) {
    rd.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  if (!playing && !cameraFollow && !drag) th += 0.002;
  const focus = cameraFollow ? cameraFollow.position : null;
  const targetX = (focus ? focus.x : 0) + cameraOffset.x;
  const targetY = (focus ? 1.25 : 1.2) + cameraOffset.y;
  const targetZ = (focus ? focus.z : 0) + cameraOffset.z;
  cam.position.set(
    targetX + rad * Math.sin(th) * Math.cos(ph),
    targetY + rad * Math.sin(ph),
    targetZ + rad * Math.cos(th) * Math.cos(ph),
  );
  cam.lookAt(targetX, targetY, targetZ);
  seats.forEach((s) => {
    const a = s.p.alive;
    s.head.position.y =
      (a ? 1.78 : 1.45) +
      (s.p === cur
        ? Math.abs(Math.sin(t * 0.008)) * 0.1
        : Math.sin(t * 0.002 + s.g.id) * 0.015);
    s.body.material.color.setHex(a ? s.p.color : 0x888888);
    if (s.bub.visible) {
      const age = t - (s.bub.userData.popAt || t);
      const pulse = age < 260 ? Math.sin(Math.min(age / 260, 1) * Math.PI) * 0.22 : 0;
      s.bub.scale.set(2.9 * (1 + pulse), 0.9 * (1 + pulse), 1);
    }
  });
  rd.render(scene, cam);
}
requestAnimationFrame(frame);
