export function getSign(x) {
    return x.d ? (x.d[0] ? x.s : 0 * x.s) : x.s || NaN;
}
