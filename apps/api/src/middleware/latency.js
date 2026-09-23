const LATENCY_MS = parseInt(process.env.LATENCY_MS ?? '400', 10);

export function latency(req, res, next) {
  if (LATENCY_MS <= 0) return next();
  setTimeout(next, LATENCY_MS);
}
