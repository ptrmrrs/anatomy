import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";
import * as A from "../../kit/audit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { ROUTES, serviceMs, requestPlan, criticalOf } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const W = 600;
const H = 400;
const AZIMUTH = 58;
const ELEVATION = 34;

const PLATE = { x: -128, y: -74, w: 256, d: 130, r: 7 };
const PLATE_H = 9;
const TRAY_H = 2;
const TUBE_Z = 7;
const TUBE_R = 1.4;
const SOCK_T = 1.4;
const SOCK = 6;
const FER = 1.2;
const FER_R = 2.2;
const BOSS_R = 2.6;
const UNIT = 6;
const SPAN = 35;
const T0 = -110;
const STRIP = { x: T0 - 6, y: 44, w: SPAN * UNIT + 12, d: 10, r: 1.4 };
const STRIP_H = 0.8;
const LANES = { 0: [44.6, 4.6], 1: [44.6, 2.1], 2: [47.1, 2.1] };
const BAR_H = 2;

const heightOf = (node) => 8 + 2 * serviceMs(node);

const NODES = {
  client: { kind: "client", at: [-105, 10], size: 24, z: 0, h: 9 },
  gateway: { kind: "box", at: [-55, 10], size: 30, z: TRAY_H, h: heightOf("gateway") },
  auth: { kind: "box", at: [-55, -45], size: 30, z: TRAY_H, h: heightOf("auth"), labelAt: 5 },
  orders: { kind: "box", at: [5, 10], size: 34, z: 0, h: heightOf("orders") },
  cache: { kind: "store", at: [5, -45], r: 13, z: TRAY_H, h: heightOf("cache") },
  db: { kind: "store", at: [50, -45], r: 13, z: TRAY_H, h: heightOf("db") },
  inventory: { kind: "box", at: [100, -45], size: 28, z: 0, h: heightOf("inventory") },
  pricing: { kind: "box", at: [100, 10], size: 28, z: 0, h: heightOf("pricing") },
};

const TRAYS = [
  { name: "edge", plan: { x: -75, y: -65, w: 40, d: 99, r: 4 } },
  { name: "data", plan: { x: -31, y: -63, w: 99, d: 36, r: 4 } },
];

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H, 0), [NODES.db.at[0], NODES.db.at[1] - NODES.db.r, TRAY_H + NODES.db.h]],
  W,
  H,
  { pad: 28, azimuth: AZIMUTH, elevation: ELEVATION },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const f2 = (v) => Math.round(v * 100) / 100;

const firstCritical = criticalOf(requestPlan({ hit: true, parallel: true }));

const R = A.recorder(P);
const record = R.solid;
const put = (name, ref, svg, shapes = [], { bias = 0, ...rest } = {}) => R.put({ name, at: ref, bias, svg, shapes, piece: "fig", ...rest });

const planOf = (node) => {
  const n = NODES[node];
  if (n.kind === "store") return { x: n.at[0] - n.r, y: n.at[1] - n.r, w: n.r * 2, d: n.r * 2, r: n.r };
  return { x: n.at[0] - n.size / 2, y: n.at[1] - n.size / 2, w: n.size, d: n.size, r: n.kind === "client" ? 3.5 : 3 };
};
const topOf = (node) => NODES[node].z + NODES[node].h;

const back = [];
back.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H, PLATE_H, P)}"/>`);
back.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "lo" }));
record(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate" }));
back.push(Ln(k.planOutline(k.insetPlan(PLATE, 4), 0, P), { tone: "faint" }));
{
  const dots = [];
  for (let x = PLATE.x + 18; x < PLATE.x + PLATE.w - 8; x += 20)
    for (let y = PLATE.y + 14; y < STRIP.y - 4; y += 20) dots.push(at([x, y, 0]));
  back.push(Dots(dots, { size: 0.45, tone: "faint" }));
}
back.push(S(k.slabOf(STRIP, 0, STRIP_H, P, 3), { tone: "lo", crease: "none" }));
record(A.slab(STRIP, 0, STRIP_H, { name: "stand.ruler" }));
{
  const minor = [];
  const major = [];
  for (let ms = 0; ms <= SPAN; ms++) {
    const x = T0 + ms * UNIT;
    const edge = STRIP.y + STRIP.d;
    (ms % 5 ? minor : major).push(k.lineOnTop([x, edge], [x, edge - (ms % 5 ? 2.4 : 4)], STRIP_H, P));
  }
  back.push(Ln(minor.join(""), { tone: "lo" }), Ln(major.join(""), { tone: "mid" }));
  const front = PLATE.y + PLATE.d;
  for (let ms = 0; ms <= SPAN; ms += 5)
    back.push(k.faceTextSvg(k.sideMatrix([T0 + ms * UNIT, front], -5.6, P, "left"), String(ms), { size: 4.2, tone: "mid", anchor: "middle" }));
  back.push(k.faceTextSvg(k.sideMatrix([T0 + SPAN * UNIT + 8, front], -5.6, P, "left"), "ms", { size: 4.2, tone: "lo", anchor: "start" }));
}
for (const tray of TRAYS) {
  back.push(S(k.slabOf(tray.plan, 0, TRAY_H, P, 6, 0.6), { tone: "mid" }));
  record(A.slab(tray.plan, 0, TRAY_H, { name: `stand.tray.${tray.name}` }));
  back.push(Ln(k.planOutline(k.insetPlan(tray.plan, 2.6), TRAY_H, P, 6), { tone: "faint" }));
  back.push(k.faceTextSvg(k.topMatrix([tray.plan.x + 5, tray.plan.y + tray.plan.d - 3.4], TRAY_H, P, "x"), tray.name, { size: 4, tone: "lo" }));
}
for (const node of Object.keys(NODES)) {
  const n = NODES[node];
  back.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(planOf(node), 1), n.z, 0.1, P)}" style="filter:blur(4px)"/>`);
}

const fitText = (text, width, size) => f2(Math.min(size, width / (text.length * 0.62)));

function boxNode(node) {
  const n = NODES[node];
  const plan = planOf(node);
  const top = topOf(node);
  const label = k.faceTextSvg(k.sideMatrix([n.at[0] + (n.labelAt ?? 0), plan.y + plan.d], n.z + n.h / 2 - 1.5, P, "left"), node, { size: fitText(node, plan.w - 6, 4.4), tone: "mid", anchor: "middle" });
  const groove = Ln(k.planOutline(k.insetPlan(plan, 3.2), top, P, 6), { tone: "faint" });
  let svg = S(k.slabOf(plan, n.z, n.h, P, 6, 0.8), { tone: "mid" }) + groove + label;
  if (n.kind === "client") svg += Ln(k.planOutline({ x: plan.x + 5, y: plan.y + 4, w: plan.w - 10, d: 8, r: 1.2 }, top, P, 3), { tone: "lo" });
  put(node, [n.at[0], n.at[1], n.z + n.h / 2], svg, [record(A.slab(plan, n.z, n.h, { name: node }, 6))], { attrs: ` data-node="${node}"${firstCritical.has(node) ? " data-crit" : ""}` });
}

function storeNode(node) {
  const n = NODES[node];
  const top = topOf(node);
  const [cx, cy] = n.at;
  const seams = node === "db" ? [1, 2].map((i) => k.sideArc(cx, cy, n.r, n.z + (n.h * i) / 3, P, 48)).join("") : k.sideArc(cx, cy, n.r, n.z + n.h / 2, P, 48);
  let svg = S(k.cylinder(cx, cy, n.r, n.z, n.h, P, 64, 0.8), { tone: "mid", inner: Ln(seams, { tone: "faint" }) });
  svg += Ln(k.ring(cx, cy, n.r - 2.6, top, P, 64), { tone: "faint" });
  svg += k.faceTextSvg(k.topMatrix([cx, cy + 5.4], top, P, "x"), node, { size: 4.6, tone: "mid", anchor: "middle" });
  if (node === "cache") {
    const cells = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) cells.push(at([cx - 5.1 + i * 3.4, cy - 5.6 + j * 3.4, top]));
    svg += `<g data-cells>${Dots(cells, { size: 0.7, tone: "hi" })}</g>`;
  }
  put(node, [cx, cy, n.z + n.h / 2], svg, [record(A.cylinder(cx, cy, n.r, n.z, n.h, { name: node }))], { attrs: ` data-node="${node}"${firstCritical.has(node) ? " data-crit" : ""}` });
}

for (const node of Object.keys(NODES)) (NODES[node].kind === "store" ? storeNode : boxNode)(node);

const FACES = { "+x": [1, 0], "-x": [-1, 0], "+y": [0, 1], "-y": [0, -1] };
function port(node, face, offset = 0) {
  const n = NODES[node];
  const [nx, ny] = FACES[face];
  const name = `${node}.port${face}${offset ? offset : ""}`;
  if (n.kind === "store") {
    const F = G.frameAlong([n.at[0], n.at[1], TUBE_Z], [nx, ny, 0]);
    const s0 = Math.sqrt(n.r * n.r - BOSS_R * BOSS_R);
    const s1 = n.r + SOCK_T;
    const tip = G.add3(F.o, G.mul3(F.a, s1));
    put(name, G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), S(G.disc(s0, s1, BOSS_R, F, P, { steps: 28, bevel: 0.25 }), { tone: "mid" }), [record(A.disc(F, s0, s1, BOSS_R, { name }))], { bias: 0.05 });
    return tip;
  }
  const half = n.size / 2;
  const along = nx ? [n.at[0] + nx * half, n.at[1] + offset] : [n.at[0] + offset, n.at[1] + ny * half];
  const plan = nx
    ? { x: nx > 0 ? along[0] : along[0] - SOCK_T, y: along[1] - SOCK / 2, w: SOCK_T, d: SOCK, r: 0.7 }
    : { x: along[0] - SOCK / 2, y: ny > 0 ? along[1] : along[1] - SOCK_T, w: SOCK, d: SOCK_T, r: 0.7 };
  const z0 = TUBE_Z - SOCK / 2;
  put(name, [plan.x + plan.w / 2, plan.y + plan.d / 2, TUBE_Z], S(k.slabOf(plan, z0, SOCK, P, 3, 0.3), { tone: "mid" }), [record(A.slab(plan, z0, SOCK, { name }, 3))], { bias: 0.05 });
  return [along[0] + nx * SOCK_T, along[1] + ny * SOCK_T, TUBE_Z];
}

const LINKS = [
  ["client-gateway", port("client", "+x"), [], port("gateway", "-x")],
  ["gateway-auth", port("gateway", "-y", -9), [], port("auth", "+y", -9)],
  ["gateway-orders", port("gateway", "+x"), [], port("orders", "-x")],
  ["orders-cache", port("orders", "-y"), [], port("cache", "+y")],
  ["orders-db", port("orders", "-y", 10), [[15, -20], [50, -20]], port("db", "+y")],
  ["orders-inventory", port("orders", "+x", -6), [[74, 4], [74, -45]], port("inventory", "-x")],
  ["orders-pricing", port("orders", "+x", 5), [], port("pricing", "-x", 5)],
];

const ROUTE_DATA = {};
for (const [name, from, via, to] of LINKS) {
  if (!ROUTES[name]) throw new Error(`no route ${name} in the model`);
  const points = [from, ...via.map(([x, y]) => [x, y, TUBE_Z]), to];
  const route = G.fillet(points, Math.max(3, TUBE_R * 2.6), 10, { P, tube: TUBE_R });
  const total = G.pathLength(route);
  const gaps = [[0, FER], [total - FER, total]];
  R.route(name, route, TUBE_R, { gaps, rims: [FER_R, FER_R], piece: "fig" });
  const chunks = [];
  tubePieces(route, TUBE_R, P, { maxLength: 8, spacing: 1.4, gaps }).forEach((piece, index) => {
    const length = G.pathLength(piece.points);
    const line = k.pathOf(piece.points.map(at));
    const [hx, hy] = at(piece.mid);
    const svg = tubeSvg(piece, { tone: "mid" }) + `<path class="rp-trail" pathLength="${f2(length)}" d="${line}"/><circle class="rp-head" r="1.5" cx="${f2(hx)}" cy="${f2(hy)}"/>`;
    put(`${name}:${index}`, piece.mid, svg, [A.tube(piece.points, piece.radii)], { bias: 0.02, attrs: ` data-route="${name}" data-chunk="${index}" data-from="${f2(piece.from)}" data-to="${f2(piece.to)}"` });
    chunks.push([f2(piece.from), f2(piece.to)]);
  });
  [0, 1].forEach((end) => {
    const tip = end ? route[route.length - 1] : route[0];
    const inward = G.tangentAlong(route, end ? total : 0);
    const F = G.frameAlong(tip, end ? G.mul3(inward, -1) : inward);
    const ferrule = `${name}.ferrule${end}`;
    put(ferrule, G.add3(tip, G.mul3(F.a, FER / 2)), S(G.disc(0, FER, FER_R, F, P, { steps: 24, bevel: 0.2 }), { tone: "mid" }), [record(A.disc(F, 0, FER, FER_R, { name: ferrule, owner: name }))], { bias: 0.08 });
  });
  ROUTE_DATA[name] = { total: f2(total), points: route.map((p) => p.map(f2)) };
}

A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
const groups = R.items.map((item) => `<g class="it" data-name="${item.name}"${item.attrs ?? ""}>${item.svg}</g>`);

const rider = { x: T0 - 1, y: STRIP.y - 1, w: 2, d: STRIP.d + 2, r: 0.6 };
const riderSvg = S(k.slabOf(rider, STRIP_H, 3.6, P, 2, 0.2), { tone: "hi", lit: true });

const LABEL =
  "An isometric diagram of one HTTP request through a small service mesh on a base plate. A client block sends the request to a gateway, which checks it with an auth service and forwards it to an orders service. Orders reads a cache and, on a miss, a database, then calls inventory and pricing, either in parallel or one after the other. Each block is as tall as the time it spends working. A ruler along the front edge measures server time in milliseconds, and a bar grows on it as the request runs.";

const svg = k.figureSvg({
  width: W,
  height: H,
  label: LABEL,
  body: [...back, `<g class="rp-items">${groups.join("")}</g>`, `<g data-part="bar"></g>`, `<g data-part="rider">${riderSvg}</g>`],
});

const DATA = {
  P,
  unit: UNIT,
  t0: T0,
  span: SPAN,
  lanes: LANES,
  barH: BAR_H,
  stripTop: STRIP_H,
  routes: ROUTE_DATA,
};

const CSS = readFileSync(join(HERE, "request-path.css"), "utf8");
const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));

const first = requestPlan({ hit: true, parallel: true });
const body =
  `<style>${CSS}</style>` +
  k.plateHtml({
    fig: "Fig 9",
    title: "One request, end to end",
    hint: "Space sends · C cache · P fan-out",
    readout: `cache hit · parallel · ${first.total.toFixed(1)} ms`,
    keys: [
      { mark: "lit", label: "Heavy outline: working now · the dot is the request" },
      { mark: "raised", label: "Dark outline: the critical path of the last request" },
      { mark: "flat", label: "Block height: its service time · bar: server time, gaps are network" },
    ],
    caption:
      "A GET /orders/42 through seven services. The gateway spends 1.5 ms, auth 2.5, orders 2.5, a cache read 0.3, a database read 8, inventory 7 and pricing 4; every hop inside the cluster costs 0.4 ms each way. With a cache hit and the two lookups in parallel the server answers in 17.0 ms. Calling them one after the other adds the shorter one, 4.8 ms, and a cache miss adds the database round trip, 8.8 ms: 30.6 ms with both. On a miss, orders writes the row back to the cache without waiting for it.",
    body: `<div class="iso-stage rp-stage" tabindex="0" role="group" aria-label="Request path. Space sends a request, C switches the cache between hit and miss, P switches inventory and pricing between parallel and one after the other.">${svg}<p class="rp-live" aria-live="polite"></p></div>`,
  });

const out = theme === "light" ? "request-path-light.html" : "request-path.html";
writeFileSync(join(HERE, out), k.pageHtml({ title: "Request path", theme, body, script: kitScript() + MODEL + LIVE }));
console.log("wrote", out, `· ${R.items.length} items`);

A.auditOrExit(R, P, {});
