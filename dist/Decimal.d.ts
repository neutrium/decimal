export declare class Decimal {
    static params: {
        BASE: number;
        LOG_BASE: number;
        MAX_SAFE_INTEGER: number;
        MAX_DIGITS: number;
        EXP_LIMIT: number;
        PI_PRECISION: number;
        LN10_PRECISION: number;
    };
    private static _config;
    static get config(): any;
    static set config(params: any);
    static get precision(): number;
    static set precision(val: number);
    static get rounding(): number;
    static set rounding(val: number);
    static get LN10(): Decimal;
    static get PI(): Decimal;
    static external: boolean;
    static quadrant: any;
    private static get isDecimal();
    d: number[] | null;
    e: number;
    s: number;
    constructor(v: string | number | Decimal);
    dp: () => number;
    precision: (z?: boolean | number) => number;
    add: (y: number | string | Decimal) => Decimal;
    sub: (y: number | string | Decimal) => Decimal;
    mul: (y: number | string | Decimal) => Decimal;
    div: (y: number | string | Decimal) => Decimal;
    divToInt: (y: string | number | Decimal) => Decimal;
    mod: (yy: number | string | Decimal) => Decimal;
    neg: () => Decimal;
    sign: () => number;
    abs: () => Decimal;
    pow: (yy: number | string | Decimal) => Decimal;
    sqrt: () => Decimal;
    cbrt: () => Decimal;
    min: (...values: any[]) => Decimal;
    max: (...values: any[]) => Decimal;
    cmp: (w: string | number | Decimal) => number;
    eq: (y: string | number | Decimal) => boolean;
    gt: (y: string | number | Decimal) => boolean;
    gte: (y: string | number | Decimal) => boolean;
    lt: (y: string | number | Decimal) => boolean;
    lte: (y: string | number | Decimal) => boolean;
    isFinite: () => this is Decimal & {
        d: string[];
    };
    isInt: () => boolean;
    isNaN: () => boolean;
    isNeg: () => boolean;
    isPos: () => boolean;
    isZero: () => boolean;
    isOdd: () => boolean;
    isEven: () => boolean;
    ceil: () => Decimal;
    floor: () => Decimal;
    round: () => Decimal;
    trunc: () => Decimal;
    toNearest: (yy: number | string | Decimal, rm?: number) => Decimal;
    log: (baseN: number | string | Decimal) => Decimal;
    ln: () => Decimal;
    exp: () => Decimal;
    sin: () => Decimal;
    asin: () => Decimal;
    sinh: () => Decimal;
    asinh: () => Decimal;
    cos: () => Decimal;
    acos: () => Decimal;
    cosh: () => Decimal;
    acosh: () => Decimal;
    tan: () => Decimal;
    atan: () => Decimal;
    static atan2: (y: number | string | Decimal, x: number | string | Decimal) => Decimal;
    tanh: () => Decimal;
    atanh: () => Decimal;
    toString: () => string;
    toValue: () => string;
    toFixed: (dp?: number, rm?: number) => string;
    toNumber: () => number;
    toDP: (dp?: number, rm?: number) => Decimal;
    toSD: (sd?: number, rm?: number) => Decimal;
    toExponential: (dp?: number, rm?: number) => string;
    toPrecision: (sd?: number, rm?: number) => string;
    toFraction: (denominator: number | string | Decimal) => Decimal[];
    private static setConfig;
}
