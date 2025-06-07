export function checkInt32(i, min, max) {
    if (i !== ~~i || i < min || i > max) {
        throw Error("DecimalError] Invalid integer argument: " + i);
    }
}
