export function getArg(name: string, defaultValue?: string) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  if (!hit) return defaultValue;
  return hit.slice(prefix.length);
}

export function getArgNumber(name: string, defaultValue: number) {
  const raw = getArg(name);
  if (raw === undefined) return defaultValue;
  const n = Number(raw);
  return Number.isFinite(n) ? n : defaultValue;
}

export function randInt(min: number, max: number) {
  const a = Math.ceil(min);
  const b = Math.floor(max);
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

export function pickOne<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
