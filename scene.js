// Cenário 3D (Three.js): sala, mesa, cadeiras, personagens e câmera
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
const fl = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), lam(0xc99a68));
fl.rotation.x = -Math.PI / 2;
scene.add(fl);
const rug = new THREE.Mesh(new THREE.CircleGeometry(5, 48), lam(0x7fb069));
rug.rotation.x = -Math.PI / 2;
rug.position.y = 0.01;
scene.add(rug);
[
  [0, 4, -12, 0, 24],
  [0, 4, 12, 0, 24],
  [-12, 4, 0, Math.PI / 2, 24],
  [12, 4, 0, Math.PI / 2, 24],
].forEach(([x, y, z, r, w]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 8), lam(0xf3e9d2));
  m.position.set(x, y, z);
  m.rotation.y = r;
  scene.add(m);
});
[-1, 1].forEach((s) =>
  [-6, 0, 6].forEach((z) => {
    box(0.1, 2.8, 3.4, 0x8a5a2b, s * 11.93, 3.6, z);
    box(0.1, 2.4, 3, 0x9fd8ff, s * 11.88, 3.6, z).material =
      new THREE.MeshBasicMaterial({ color: 0x9fd8ff });
  }),
);
[-5, 5].forEach((x) => {
  box(3.4, 2.6, 0.8, 0x8a5a2b, x, 1.3, 11.5);
  for (let i = 0; i < 8; i++)
    box(0.3, 0.5, 0.3, pick(COLS), x - 1.3 + i * 0.37, 2.9, 11.5);
});
const bc = document.createElement("canvas");
bc.width = 1024;
bc.height = 410;
const bt = new THREE.CanvasTexture(bc);
box(9.4, 3.9, 0.1, 0x8a5a2b, 0, 3.6, -11.9);
const bm = new THREE.Mesh(
  new THREE.PlaneGeometry(9, 3.5),
  new THREE.MeshBasicMaterial({ map: bt }),
);
bm.position.set(0, 3.6, -11.82);
scene.add(bm);
function drawBoard(t) {
  const x = bc.getContext("2d");
  x.fillStyle = "#2f5d46";
  x.fillRect(0, 0, 1024, 410);
  x.fillStyle = "#fff";
  x.font = 'bold 96px "Comic Sans MS",cursive,sans-serif';
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(t, 512, 205);
  bt.needsUpdate = true;
}
drawBoard("🕵️ Impostor");
cyl(2.5, 2.5, 0.15, 0xb07a45, 0, 1.1, 0);
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
    const a = (i / list.length) * Math.PI * 2,
      g = new THREE.Group();
    g.position.set(Math.sin(a) * 3.4, 0, Math.cos(a) * 3.4);
    scene.add(g);
    box(0.9, 0.12, 0.9, 0x8a5a2b, 0, 0.55, -0.1, g);
    box(0.9, 0.9, 0.1, 0x8a5a2b, 0, 1.05, -0.6, g);
    [
      [-0.4, -0.5],
      [0.4, -0.5],
      [-0.4, 0.3],
      [0.4, 0.3],
    ].forEach(([x, z]) => box(0.07, 0.55, 0.07, 0x6b4423, x, 0.27, z, g));
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
    const name = spr(320, 64, 2, 0.4),
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
  x.clearRect(0, 0, 320, 64);
  x.fillStyle = p.alive ? "rgba(20,30,50,.82)" : "rgba(110,110,110,.8)";
  rr(x, 4, 6, 312, 52, 26);
  x.fill();
  x.fillStyle = "#fff";
  x.font = "bold 30px system-ui,sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(
    (p.alive ? "" : "✖ ") + p.name + (p.human ? " (você)" : ""),
    160,
    33,
  );
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
  const id = (p.bt = (p.bt || 0) + 1);
  setTimeout(() => {
    if (p.bt === id) b.visible = false;
  }, ms);
}
let th = 0,
  ph = 0.6,
  rad = 9,
  drag = 0,
  cur = null,
  playing = false;
const cv = $("#c");
cv.onpointerdown = (e) => {
  drag = 1;
  cv.setPointerCapture(e.pointerId);
};
cv.onpointerup = () => (drag = 0);
cv.onpointermove = (e) => {
  if (drag) {
    th -= e.movementX * 0.006;
    ph = Math.max(0.2, Math.min(1.2, ph + e.movementY * 0.006));
  }
};
cv.onwheel = (e) => {
  rad = Math.max(6, Math.min(10.5, rad + e.deltaY * 0.01));
};
function frame(t) {
  requestAnimationFrame(frame);
  const w = innerWidth,
    h = innerHeight;
  if (cv.width !== w * rd.getPixelRatio()) {
    rd.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  if (!playing && !drag) th += 0.002;
  cam.position.set(
    rad * Math.sin(th) * Math.cos(ph),
    1.2 + rad * Math.sin(ph),
    rad * Math.cos(th) * Math.cos(ph),
  );
  cam.lookAt(0, 1.2, 0);
  seats.forEach((s) => {
    const a = s.p.alive;
    s.head.position.y =
      (a ? 1.78 : 1.45) +
      (s.p === cur
        ? Math.abs(Math.sin(t * 0.008)) * 0.1
        : Math.sin(t * 0.002 + s.g.id) * 0.015);
    s.body.material.color.setHex(a ? s.p.color : 0x888888);
  });
  rd.render(scene, cam);
}
requestAnimationFrame(frame);
