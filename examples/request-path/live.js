const D = __DATA__;
const stage = document.querySelector(".rp-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const announcer = stage.querySelector(".rp-live");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const MS = 0.22;
const TRAIL = 9;
const REST = 1.6;
const TOUR = [
  { hit: true, parallel: true },
  { hit: false, parallel: true },
  { hit: false, parallel: false },
  { hit: true, parallel: false },
];

const solids = {};
const items = {};
for (const g of svg.querySelectorAll("[data-node]")) {
  solids[g.dataset.node] = g.querySelector(".iso-solid");
  items[g.dataset.node] = g;
}
const cacheItem = svg.querySelector('[data-node="cache"]');
const chunks = {};
for (const g of svg.querySelectorAll("[data-route]")) {
  const trail = g.querySelector(".rp-trail");
  (chunks[g.dataset.route] ??= []).push({ from: +g.dataset.from, to: +g.dataset.to, trail, head: g.querySelector(".rp-head"), length: +trail.getAttribute("pathLength"), on: false, headOn: false });
}
for (const list of Object.values(chunks)) list.sort((a, b) => a.from - b.from);
const marks = { trail: new Set(), head: new Set() };
const barGroup = svg.querySelector('[data-part="bar"]');
const rider = svg.querySelector('[data-part="rider"]');

const walks = {};
for (const [name, route] of Object.entries(D.routes)) {
  const at = [0];
  for (let i = 1; i < route.points.length; i++) {
    const [a, b] = [route.points[i - 1], route.points[i]];
    at.push(at[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  walks[name] = at;
}
function pointAt(name, s) {
  const { points } = D.routes[name];
  const at = walks[name];
  let i = 1;
  while (i < at.length - 1 && at[i] < s) i++;
  const span = at[i] - at[i - 1] || 1;
  const u = Math.min(1, Math.max(0, (s - at[i - 1]) / span));
  const [a, b] = [points[i - 1], points[i]];
  return iso([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u], D.P);
}

let cfg = { ...TOUR[0] };
let plan = requestPlan(cfg);
let critical = criticalOf(plan);
let t = plan.total + CLIENT_LEG;
let endT = t;
let running = false;
let touring = !still.matches;
let tourIndex = -1;
let rest = REST - 1.4;
let segs = [];
let frame = 0;
let last = 0;
let visible = false;
let idleTimer = 0;
let lastText = "";

function resetBar() {
  barGroup.replaceChildren();
  segs = plan.work
    .filter((w) => w.lane !== null)
    .map((w) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      barGroup.append(g);
      return { ...w, g, width: -1, lit: null };
    });
}

function drawBar() {
  for (const seg of segs) {
    const width = Math.max(0, Math.min(t, seg.to) - seg.from) * D.unit;
    const lit = t >= seg.from && t < seg.to;
    if (Math.abs(width - seg.width) < 0.02 && lit === seg.lit) continue;
    seg.width = width;
    seg.lit = lit;
    if (width < 0.05) {
      seg.g.replaceChildren();
      continue;
    }
    const [y, d] = D.lanes[seg.lane];
    const plan2 = { x: D.t0 + seg.from * D.unit, y, w: width, d, r: Math.min(0.5, width / 2) };
    seg.g.innerHTML = solidSvg(slabOf(plan2, D.stripTop, D.barH, D.P, 2, 0), { tone: lit ? "hi" : "mid", crease: "faint", lit });
  }
  const now = Math.max(0, Math.min(D.span, t, plan.total));
  rider.setAttribute("transform", translateAlong(D.P, [now * D.unit, 0, 0]));
}

function drawPackets(moving) {
  const trails = new Set();
  const heads = new Set();
  for (const m of moving) {
    const total = D.routes[m.route].total;
    const s = (m.dir > 0 ? m.share : 1 - m.share) * total;
    const [a, b] = m.dir > 0 ? [s - TRAIL, s] : [s, s + TRAIL];
    let placed = false;
    for (const c of chunks[m.route]) {
      const lo = Math.max(a, c.from);
      const hi = Math.min(b, c.to);
      if (hi > lo) {
        c.trail.setAttribute("stroke-dasharray", `${(hi - lo).toFixed(2)} ${(c.length * 2 + TRAIL).toFixed(2)}`);
        c.trail.setAttribute("stroke-dashoffset", (-(lo - c.from)).toFixed(2));
        trails.add(c.trail);
      }
      if (!placed && s >= c.from && s <= c.to) {
        const [x, y] = pointAt(m.route, s);
        c.head.setAttribute("cx", x.toFixed(2));
        c.head.setAttribute("cy", y.toFixed(2));
        heads.add(c.head);
        placed = true;
      }
    }
  }
  for (const el of marks.trail) if (!trails.has(el)) el.removeAttribute("data-on");
  for (const el of marks.head) if (!heads.has(el)) el.removeAttribute("data-on");
  for (const el of trails) el.setAttribute("data-on", "");
  for (const el of heads) el.setAttribute("data-on", "");
  marks.trail = trails;
  marks.head = heads;
}

function draw() {
  const { working, moving } = stateAt(plan, t);
  const done = t >= plan.total;
  for (const [node, solid] of Object.entries(solids)) {
    solid.toggleAttribute("data-lit", working.includes(node));
    items[node].toggleAttribute("data-crit", done && critical.has(node));
  }
  const write = plan.work.find((w) => w.lane === null);
  cacheItem.toggleAttribute("data-cold", !plan.hit && !(write && t >= write.to));
  drawPackets(running ? moving : []);
  drawBar();
  const text = readoutAt(plan, t);
  if (text !== lastText) {
    readout.textContent = text;
    lastText = text;
  }
}

function send(next) {
  cfg = { ...next };
  plan = requestPlan(cfg);
  critical = criticalOf(plan);
  endT = plan.total + CLIENT_LEG;
  t = still.matches ? endT : -CLIENT_LEG;
  running = !still.matches;
  rest = 0;
  resetBar();
  draw();
  if (still.matches) announce();
  run();
}

function announce() {
  announcer.textContent = `${configLabel(plan)}: ${plan.total.toFixed(1)} milliseconds of server time`;
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (running) {
    t = Math.min(endT, t + dt / MS);
    if (t >= endT) {
      running = false;
      rest = 0;
      if (!touring) announce();
    }
  } else if (touring) {
    rest += dt;
    if (rest >= REST) {
      tourIndex = (tourIndex + 1) % TOUR.length;
      send(TOUR[tourIndex]);
    }
  }
  draw();
  frame = visible && (running || touring) ? requestAnimationFrame(tick) : 0;
}
const run = () => {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
};

function takeOver(next) {
  touring = false;
  clearTimeout(idleTimer);
  send(next);
  if (!still.matches) {
    idleTimer = setTimeout(() => {
      touring = true;
      rest = 0;
      run();
    }, (endT - t) * MS * 1000 + 3600);
  }
}

stage.addEventListener("click", (event) => {
  const node = event.target.closest("[data-node]")?.dataset.node;
  if (node === "cache" || node === "db") takeOver({ ...cfg, hit: !cfg.hit });
  else if (node === "inventory" || node === "pricing") takeOver({ ...cfg, parallel: !cfg.parallel });
  else takeOver(cfg);
});
stage.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === " " || key === "enter") takeOver(cfg);
  else if (key === "c") takeOver({ ...cfg, hit: !cfg.hit });
  else if (key === "p") takeOver({ ...cfg, parallel: !cfg.parallel });
  else if (key === "escape") {
    touring = false;
    clearTimeout(idleTimer);
  } else return;
  event.preventDefault();
});
stage.addEventListener("focus", () => {
  if (!announcer.textContent) announce();
});
new IntersectionObserver(
  (entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) run();
  },
  { rootMargin: "120px 0px" },
).observe(stage);

resetBar();
draw();
