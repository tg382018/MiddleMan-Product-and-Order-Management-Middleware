"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArg = getArg;
exports.getArgNumber = getArgNumber;
exports.randInt = randInt;
exports.pickOne = pickOne;
exports.sleep = sleep;
function getArg(name, defaultValue) {
    const prefix = `--${name}=`;
    const hit = process.argv.find((a) => a.startsWith(prefix));
    if (!hit)
        return defaultValue;
    return hit.slice(prefix.length);
}
function getArgNumber(name, defaultValue) {
    const raw = getArg(name);
    if (raw === undefined)
        return defaultValue;
    const n = Number(raw);
    return Number.isFinite(n) ? n : defaultValue;
}
function randInt(min, max) {
    const a = Math.ceil(min);
    const b = Math.floor(max);
    return Math.floor(Math.random() * (b - a + 1)) + a;
}
function pickOne(arr) {
    return arr[randInt(0, arr.length - 1)];
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
//# sourceMappingURL=seed-utils.js.map