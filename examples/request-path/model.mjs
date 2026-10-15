export const HOP = 0.4;
export const CLIENT_LEG = 1.2;

export const WORK = {
  gateway: [1.0, 0.5],
  auth: [2.5],
  orders: [1.5, 1.0],
  cache: [0.3],
  db: [8],
  inventory: [7],
  pricing: [4],
};

export const serviceMs = (node) => (WORK[node] ?? []).reduce((sum, ms) => sum + ms, 0);

export const ROUTES = {
  "client-gateway": ["client", "gateway"],
  "gateway-auth": ["gateway", "auth"],
  "gateway-orders": ["gateway", "orders"],
  "orders-cache": ["orders", "cache"],
  "orders-db": ["orders", "db"],
  "orders-inventory": ["orders", "inventory"],
  "orders-pricing": ["orders", "pricing"],
};

export function requestPlan({ hit, parallel }) {
  const work = [];
  const moves = [];
  const doWork = (node, ms, at, lane = 0, crit = true) => {
    work.push({ node, from: at, to: at + ms, lane, crit });
    return at + ms;
  };
  const hop = (route, dir, at) => {
    moves.push({ route, dir, from: at, to: at + HOP });
    return at + HOP;
  };
  const call = (route, node, ms, at, lane = 0, crit = true) => hop(route, -1, doWork(node, ms, hop(route, 1, at), lane, crit));

  moves.push({ route: "client-gateway", dir: 1, from: -CLIENT_LEG, to: 0, offClock: true });
  let t = doWork("gateway", WORK.gateway[0], 0);
  t = call("gateway-auth", "auth", WORK.auth[0], t);
  t = hop("gateway-orders", 1, t);
  t = doWork("orders", WORK.orders[0], t);
  t = call("orders-cache", "cache", WORK.cache[0], t);
  if (!hit) {
    t = call("orders-db", "db", WORK.db[0], t);
    doWork("cache", WORK.cache[0], hop("orders-cache", 1, t), null, false);
  }
  if (parallel) {
    const slow = WORK.inventory[0] >= WORK.pricing[0];
    const a = call("orders-inventory", "inventory", WORK.inventory[0], t, 1, slow);
    const b = call("orders-pricing", "pricing", WORK.pricing[0], t, 2, !slow);
    t = Math.max(a, b);
  } else {
    t = call("orders-inventory", "inventory", WORK.inventory[0], t);
    t = call("orders-pricing", "pricing", WORK.pricing[0], t);
  }
  t = doWork("orders", WORK.orders[1], t);
  t = hop("gateway-orders", -1, t);
  t = doWork("gateway", WORK.gateway[1], t);
  moves.push({ route: "client-gateway", dir: -1, from: t, to: t + CLIENT_LEG, offClock: true });
  return { hit, parallel, total: t, work, moves };
}

export function stateAt(plan, t) {
  const working = [...new Set(plan.work.filter((w) => t >= w.from && t < w.to).map((w) => w.node))];
  const moving = plan.moves.filter((m) => t >= m.from && t < m.to).map((m) => ({ ...m, share: (t - m.from) / (m.to - m.from) }));
  return { working, moving };
}

export const criticalOf = (plan) => new Set(plan.work.filter((w) => w.crit).map((w) => w.node));

export const configLabel = ({ hit, parallel }) => `${hit ? "cache hit" : "cache miss"} · ${parallel ? "parallel" : "in turn"}`;

export function readoutAt(plan, t) {
  if (t < 0) return "request in · client";
  if (t >= plan.total) return `${configLabel(plan)} · ${plan.total.toFixed(1)} ms`;
  const { working } = stateAt(plan, t);
  return `${working.length ? working.join(" + ") : "network"} · ${t.toFixed(1)} ms`;
}
