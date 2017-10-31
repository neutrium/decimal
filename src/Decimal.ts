
// Based on decimal.js https://github.com/MikeMcl/decimal.js

export class Decimal
{
    // The maximum exponent magnitude.
    // The limit on the value of `toExpNeg`, `toExpPos`, `minE` and `maxE`.
    private static get EXP_LIMIT() { return 9e15 };                      // 0 to 9e15

    // The limit on the value of `precision`, and on the value of the first argument to
    // `toDecimalPlaces`, `toExponential`, `toFixed`, `toPrecision` and `toSignificantDigits`.
    private static get MAX_DIGITS() { return 1e9 };                        // 0 to 1e9

    // Base conversion alphabet.
    private static get NUMERALS() { return '0123456789abcdef'; }

    // The natural logarithm of 10 (1025 digits).
    private static get LN10_STR() { return '2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058'; }

    // Pi (1025 digits).
    private static get PI_STR() { return  '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789'; }

    // Create the internal constants from their string values.
    public static get LN10() { return new Decimal(Decimal.LN10_STR) };
    public static get PI() { return new Decimal(Decimal.PI_STR) };

    private static get LN10_PRECISION() { return Decimal.LN10_STR.length - 1 };
    private static get PI_PRECISION() { return Decimal.PI_STR.length - 1 };

    // Configuration variables
    // The maximum number of significant digits of the result of a calculation or base conversion.
    // E.g. `Decimal.config({ precision: 20 });`
    public static precision = 20;                         // 1 to MAX_DIGITS

    // The rounding mode used when rounding to `precision`.
    //
    public static get ROUND_UP()        { return 0 };   // Away from zero.
    public static get ROUND_DOWN()      { return 1 };   // Towards zero.
    public static get ROUND_CEIL()      { return 2 };   // Towards +Infinity.
    public static get ROUND_FLOOR()     { return 3 };   // Towards -Infinity.
    public static get ROUND_HALF_UP()   { return 4 };   // Towards nearest neighbour. If equidistant, up.
    public static get ROUND_HALF_DOWN() { return 5 };   // Towards nearest neighbour. If equidistant, down.
    public static get ROUND_HALF_EVEN() { return 6 };   // Towards nearest neighbour. If equidistant, towards even neighbour.
    public static get ROUND_HALF_CEIL() { return 7 };   // Towards nearest neighbour. If equidistant, towards +Infinity.
    public static get ROUND_HALF_FLOOR(){ return 8 };   // Towards nearest neighbour. If equidistant, towards -Infinity.
    public static get EUCLID()          { return 9 };
    //
    // E.g.
    // `Decimal.rounding = 4;`
    // `Decimal.rounding = Decimal.ROUND_HALF_UP;`
    public static rounding = 4;                           // 0 to 8

    // The modulo mode used when calculating the modulus: a mod n.
    // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
    // The remainder (r) is calculated as: r = a - n * q.
    //
    // UP         0 The remainder is positive if the dividend is negative, else is negative.
    // DOWN       1 The remainder has the same sign as the dividend (JavaScript %).
    // FLOOR      3 The remainder has the same sign as the divisor (Python %).
    // HALF_EVEN  6 The IEEE 754 remainder function.
    // EUCLID     9 Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
    //
    // Truncated division (1), floored division (3), the IEEE 754 remainder (6), and Euclidian
    // division (9) are commonly used for the modulus operation. The other rounding modes can also
    // be used, but they may not give useful results.
    static modulo = 1;                              // 0 to 9

    // The exponent value at and beneath which `toString` returns exponential notation.
    // JavaScript numbers: -7
    static toExpNeg = -7;                           // 0 to -EXP_LIMIT

    // The exponent value at and above which `toString` returns exponential notation.
    // JavaScript numbers: 21
    static toExpPos =  21;                           // 0 to EXP_LIMIT

    // The minimum exponent value, beneath which underflow to zero occurs.
    // JavaScript numbers: -324  (5e-324)
    static minE = -Decimal.EXP_LIMIT;                       // -1 to -EXP_LIMIT

    // The maximum exponent value, above which overflow to Infinity occurs.
    // JavaScript numbers: 308  (1.7976931348623157e+308)
    static maxE = Decimal.EXP_LIMIT;                // 1 to EXP_LIMIT

    //private inexact;  // THink this is only used for binary conversion
    static external = true;
    static quadrant;

    // Basic error messages
    private static decimalError = '[DecimalError] ';
    private static invalidArgument = Decimal.decimalError + 'Invalid argument: ';
    private static precisionLimitExceeded = Decimal.decimalError + 'Precision limit exceeded';

    private static get isDecimal() { return /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i; }
    //readonly isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;  // Supported in typescript 2

    private static get BASE() { return 1e7 };
    private static get LOG_BASE() { return 7 };
    private static get MAX_SAFE_INTEGER() { return 9007199254740991 };

    // THe actual representation of the decimal
    public d : number[];    // The digits (Array of integers, each 0 - 1e7, or null)
    public e : number;      // The exponent (Integer, -9e15 to 9e15 inclusive, or NaN)
    public s : number;      // The sign (-1, 1 or NaN)

    constructor(v : string | number | Decimal)
    {
        let e, i, t,
            x = this;

        // Duplicate.
        if (v instanceof Decimal)
        {
            let vv : number[];

            x.s = v.s;
            x.e = v.e;
            x.d = (vv = v.d) ? vv.slice() : vv;

            return;
        }
        else if (typeof v === 'number')
        {
            let vv : number;

            if (v === 0)
            {
                x.s = (1 / v < 0) ? -1 : 1;
                x.e = 0;
                x.d = [0];

                return;
            }

            if (v < 0)
            {
                vv = -v;
                x.s = -1;
            }
            else
            {
                vv = v;
                x.s = 1;
            }

            // Fast path for small integers.
            if (vv === ~~vv && vv < 1e7)
            {
                for (e = 0, i = vv; i >= 10; i /= 10) e++;
                x.e = e;
                x.d = [vv];
                return;
            }
            else if (vv * 0 !== 0) // Infinity, NaN.
            {
                if (!vv) x.s = NaN;
                x.e = NaN;
                x.d = null;
                return;
            }

            return this.parseDecimal(x, vv.toString());

        }
        else if(typeof v === 'string')
        {
            let vv : string;

            // Minus sign?
            if (v.charCodeAt(0) === 45)
            {
                vv = v.slice(1);
                x.s = -1;
            }
            else
            {
                vv = v;
                x.s = 1;
            }

            return Decimal.isDecimal.test(vv) ? this.parseDecimal(x, vv) : this.parseOther(x, vv);
        }
        else
        {
            throw Error(Decimal.invalidArgument + v);
        }
    }

    //
    // Return a new Decimal whose value is the absolute value of this Decimal.
    //
    abs() : Decimal
    {
        let x = new Decimal(this);
        if (x.s < 0) x.s = 1;

        return Decimal.finalise(x);
    }

    //
    // Return a new Decimal whose value is the cube root of the value of this Decimal, rounded to
    // `precision` significant digits using rounding mode `rounding`.
    //
    //  cbrt(0)  =  0
    //  cbrt(-0) = -0
    //  cbrt(1)  =  1
    //  cbrt(-1) = -1
    //  cbrt(N)  =  N
    //  cbrt(-I) = -I
    //  cbrt(I)  =  I
    //
    // Math.cbrt(x) = (x < 0 ? -Math.pow(-x, 1/3) : Math.pow(x, 1/3))
    //
    cbrt() : Decimal
    {
        var e, m, n, r, rep, s, sd, t, t3, t3plusx,
            x : Decimal = this;

        if (!x.isFinite() || x.isZero()) return new Decimal(x);
        Decimal.external = false;

        // Initial estimate.
        s = x.s * Math.pow(x.s * Number(x.valueOf()), 1 / 3);

        // Math.cbrt underflow/overflow?
        // Pass x to Math.pow as integer, then adjust the exponent of the result.
        if (!s || Math.abs(s) == 1 / 0)
        {
            n = Decimal.digitsToString(x.d);
            e = x.e;

            // Adjust n exponent so it is a multiple of 3 away from x exponent.
            if (s = (e - n.length + 1) % 3) n += (s == 1 || s == -2 ? '0' : '00');
            s = Math.pow(n, 1 / 3);

            // Rarely, e may be one less than the result exponent value.
            e = Math.floor((e + 1) / 3) - <number><any>((e % 3) == (e < 0 ? -1 : 2));

            if (s == 1 / 0)
            {
                n = '5e' + e;
            }
            else
            {
                n = s.toExponential();
                n = n.slice(0, n.indexOf('e') + 1) + e;
            }

            r = new Decimal(n);
            r.s = x.s;
        }
        else
        {
            r = new Decimal(s.toString());
        }

        sd = (e = Decimal.precision) + 3;

        // Halley's method.
        // TODO? Compare Newton's method.
        for (;;)
        {
            t = r;
            t3 = t.mul(t).mul(t);
            t3plusx = t3.add(x);
            r = Decimal.divide(t3plusx.add(x).mul(t), t3plusx.add(t3), sd + 2, 1);

            // TODO? Replace with for-loop and checkRoundingDigits.
            if (Decimal.digitsToString(t.d).slice(0, sd) === (n = Decimal.digitsToString(r.d)).slice(0, sd))
            {
                n = n.slice(sd - 3, sd + 1);

                // The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or 4999
                // , i.e. approaching a rounding boundary, continue the iteration.
                if (n == '9999' || !rep && n == '4999')
                {
                    // On the first iteration only, check to see if rounding up gives the exact result as the
                    // nines may infinitely repeat.
                    if (!rep)
                    {
                        Decimal.finalise(t, e + 1, 0);

                        if (t.mul(t).mul(t).eq(x))
                        {
                            r = t;
                            break;
                        }
                    }

                    sd += 4;
                    rep = 1;
                }
                else
                {
                    // If the rounding digits are null, 0{0,4} or 50{0,3}, check for an exact result.
                    // If not, then there are further digits and m will be truthy.
                    if (!+n || !+n.slice(1) && n.charAt(0) == '5')
                    {
                        // Truncate to the first rounding digit.
                        Decimal.finalise(r, e + 1, 1);
                        m = !r.mul(r).mul(r).eq(x);
                    }

                    break;
                }
            }
        }
        Decimal.external = true;

        return Decimal.finalise(r, e, Decimal.rounding, m);
    }

    //
    // Return a new Decimal whose value is the value of this Decimal rounded to a whole number in the
    // direction of positive Infinity.
    //
    ceil() : Decimal
    {
        return Decimal.finalise(new Decimal(this), this.e + 1, 2);
    }

    //
    // Return
    //   1    if the value of this Decimal is greater than the value of `y`,
    //  -1    if the value of this Decimal is less than the value of `y`,
    //   0    if they have the same value,
    //   NaN  if the value of either Decimal is NaN.
    //
    cmp(w : string | number | Decimal) : number
    {
        let xdL, ydL,
            x = this,
            xd = x.d,
            y = new Decimal(w),
            yd = y.d,
            xs = x.s,
            ys = y.s;

        // Either NaN or ±Infinity?
        if (!xd || !yd)
        {
            return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd !== xs < 0 ? 1 : -1;
        }

        // Either zero?
        if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0;

        // Signs differ?
        if (xs !== ys) return xs;

        // Compare exponents.
        if (x.e !== y.e)
        {
            // Toto - remove ref return x.e > y.e ^ xs < 0 ? 1 : -1;
            return x.e > y.e !== xs < 0 ? 1 : -1;
        }

        xdL = xd.length;
        ydL = yd.length;

        // Compare digit by digit.
        for (let i = 0, j = xdL < ydL ? xdL : ydL; i < j; ++i)
        {
            if (xd[i] !== yd[i]) return xd[i] > yd[i] !== xs < 0 ? 1 : -1;
        }

        // Compare lengths.
        return xdL === ydL ? 0 : xdL > ydL !== xs < 0 ? 1 : -1;
    }

    //
    // Return the number of decimal places of the value of this Decimal.
    //
    dp() : number
    {
        let w,
            d = this.d,
            n = NaN;

        if (d)
        {
            w = d.length - 1;
            n = (w - Math.floor(this.e / Decimal.LOG_BASE)) * Decimal.LOG_BASE;

            // Subtract the number of trailing zeros of the last word.
            w = d[w];
            if (w) for (; w % 10 == 0; w /= 10) n--;
            if (n < 0) n = 0;
        }

        return n;
    }

    //
    // Return a new Decimal whose value is the value of this Decimal divided by `y`, rounded to
    // `precision` significant digits using rounding mode `rounding`.
    //
    div(y : string | number | Decimal) : Decimal
    {
        return Decimal.divide(this, new Decimal(y));
    }

    //
    // Return a new Decimal whose value is the integer part of dividing the value of this Decimal
    // by the value of `y`, rounded to `precision` significant digits using rounding mode `rounding`.
    //
    divToInt(y : string | number | Decimal) : Decimal
    {
        return Decimal.finalise(Decimal.divide(this, new Decimal(y), 0, 1, 1), Decimal.precision, Decimal.rounding);
    }

    //
    // Return true if the value of this Decimal is equal to the value of `y`, otherwise return false.
    //
    eq(y : string | number | Decimal) : boolean
    {
        return this.cmp(y) === 0;
    }

    //
    // Return a new Decimal whose value is the natural exponential of the value of this Decimal,
    // i.e. the base e raised to the power the value of this Decimal, rounded to `precision`
    // significant digits using rounding mode `rounding`.
    //
    exp() : Decimal
    {
        return Decimal.naturalExponential(this);
    }

    //
    // Return a new Decimal whose value is the value of this Decimal rounded to a whole number in the
    // direction of negative Infinity.
    //
    floor() : Decimal
    {
        return Decimal.finalise(new Decimal(this), this.e + 1, 3);
    }

    //
    // Return true if the value of this Decimal is greater than the value of `y`, otherwise return false.
    //
    gt(y : string | number | Decimal) : boolean
    {
        return this.cmp(y) > 0;
    }

    //
    // Return true if the value of this Decimal is greater than or equal to the value of `y`,
    // otherwise return false.
    //
    gte(y : string | number | Decimal) : boolean
    {
        let k = this.cmp(y);
        return k == 1 || k === 0;
    }

    //
    // Return true if the value of this Decimal is a finite number, otherwise return false.
    //
    isFinite() : boolean
    {
        return !!this.d;
    }

    //
    // Return true if the value of this Decimal is an integer, otherwise return false.
    //
    isInt() : boolean
    {
        return !!this.d && Math.floor(this.e / Decimal.LOG_BASE) > this.d.length - 2;
    }

    //
    // Return true if the value of this Decimal is NaN, otherwise return false.
    //
    isNaN() : boolean
    {
        return !this.s;
    }

    //
    // Return true if the value of this Decimal is negative, otherwise return false.
    //
    isNeg() : boolean
    {
        return this.s < 0;
    }

    //
    // Return true if the value of this Decimal is positive, otherwise return false.
    //
    isPos() : boolean
    {
        return this.s > 0;
    }

    //
    // Return true if the value of this Decimal is 0 or -0, otherwise return false.
    //
    isZero() : boolean
    {
        return !!this.d && this.d[0] === 0;
    }

    //
    // Return true if the value of this Decimal is less than `y`, otherwise return false.
    //
    lt(y : string | number | Decimal) : boolean
    {
        return this.cmp(y) < 0;
    }

    //
    // Return true if the value of this Decimal is less than or equal to `y`, otherwise return false.
    //
    lte(y : string | number | Decimal) : boolean
    {
        return this.cmp(y) < 1;
    }

    //
    // Return a new Decimal whose value is the natural logarithm of the value of this Decimal,
    // rounded to `precision` significant digits using rounding mode `rounding`.
    //
    ln() : Decimal
    {
        return this.naturalLogarithm(this);
    }

    //
    // Return the logarithm of the value of this Decimal to the specified base, rounded to `precision`
    // significant digits using rounding mode `rounding`.
    //
    // If no base is specified, return log[10](arg).
    //
    // log[base](arg) = ln(arg) / ln(base)
    //
    // The result will always be correctly rounded if the base of the log is 10, and 'almost always' otherwise:
    //
    // Depending on the rounding mode, the result may be incorrectly rounded if the first fifteen
    // rounding digits are [49]99999999999999 or [50]00000000000000. In that case, the maximum error
    // between the result and the correctly rounded result will be one ulp (unit in the last place).
    //
    // log[-b](a)       = NaN
    // log[0](a)        = NaN
    // log[1](a)        = NaN
    // log[NaN](a)      = NaN
    // log[Infinity](a) = NaN
    // log[b](0)        = -Infinity
    // log[b](-0)       = -Infinity
    // log[b](-a)       = NaN
    // log[b](1)        = 0
    // log[b](Infinity) = Infinity
    // log[b](NaN)      = NaN
    //
    log(baseN : number | string | Decimal) : Decimal
    {
        let isBase10, d, denominator, k, inf, num, sd, r,
            base : Decimal,
            arg = this,
            pr = Decimal.precision,
            rm = Decimal.rounding,
            guard = 5;

        // Default base is 10.
        if (baseN == null)
        {
            base = new Decimal(10);
            isBase10 = true;
        }
        else
        {
            base = new Decimal(baseN);
            d = base.d;

            // Return NaN if base is negative, or non-finite, or is 0 or 1.
            if (base.s < 0 || !d || !d[0] || base.eq(1))
            {
                return new Decimal(NaN);
            }

            isBase10 = base.eq(10);
        }

        d = arg.d;

        // Is arg negative, non-finite, 0 or 1?
        if (arg.s < 0 || !d || !d[0] || arg.eq(1))
        {
            return new Decimal(d && !d[0] ? -1 / 0 : arg.s != 1 ? NaN : d ? 0 : 1 / 0);
        }

        // The result will have a non-terminating decimal expansion if base is 10 and arg is not an
        // integer power of 10.
        if (isBase10)
        {
            if (d.length > 1)
            {
                inf = true;
            }
            else
            {
                for (k = d[0]; k % 10 === 0;) k /= 10;
                inf = k !== 1;
            }
        }

        Decimal.external = false;
        sd = pr + guard;
        num = this.naturalLogarithm(arg, sd);
        denominator = isBase10 ? this.getLn10(sd + 10) : this.naturalLogarithm(base, sd);

        // The result will have 5 rounding digits.
        r = Decimal.divide(num, denominator, sd, 1);

        // If at a rounding boundary, i.e. the result's rounding digits are [49]9999 or [50]0000,
        // calculate 10 further digits.
        //
        // If the result is known to have an infinite decimal expansion, repeat this until it is clear
        // that the result is above or below the boundary. Otherwise, if after calculating the 10
        // further digits, the last 14 are nines, round up and assume the result is exact.
        // Also assume the result is exact if the last 14 are zero.
        //
        // Example of a result that will be incorrectly rounded:
        // log[1048576](4503599627370502) = 2.60000000000000009610279511444746...
        // The above result correctly rounded using ROUND_CEIL to 1 decimal place should be 2.7, but it
        // will be given as 2.6 as there are 15 zeros immediately after the requested decimal place, so
        // the exact result would be assumed to be 2.6, which rounded using ROUND_CEIL to 1 decimal
        // place is still 2.6.
        if (Decimal.checkRoundingDigits(r.d, k = pr, rm))
        {
            do
            {
                sd += 10;
                num = this.naturalLogarithm(arg, sd);
                denominator = isBase10 ? this.getLn10(sd + 10) : this.naturalLogarithm(base, sd);
                r = Decimal.divide(num, denominator, sd, 1);

                if (!inf)
                {
                    // Check for 14 nines from the 2nd rounding digit, as the first may be 4.
                    if (+Decimal.digitsToString(r.d).slice(k + 1, k + 15) + 1 == 1e14)
                    {
                        r = Decimal.finalise(r, pr + 1, 0);
                    }

                    break;
                }

            } while (Decimal.checkRoundingDigits(r.d, k += 10, rm));
        }

        Decimal.external = true;

        return Decimal.finalise(r, pr, rm);
    }

    log10() : Decimal
    {
        return this.log(10);
    }

    log2() : Decimal
    {
        return this.log(2);
    }

    //
    // Return a new Decimal whose value is the maximum of the arguments and the value of this Decimal.
    // arguments {number|string|Decimal}
    //
    max(values) : Decimal
    {
        values.unshift(this)
        //Array.prototype.push.call(arguments, this);
        return this.maxOrMin(values, 'lt');
    }

    //
    // Return a new Decimal whose value is the minimum of the arguments and the value of this Decimal.
    // arguments {number|string|Decimal}
    //
    min(values) : Decimal
    {
        values.unshift(this)
        //Array.prototype.push.call(arguments, this);
        return this.maxOrMin(values, 'gt');
    }

    //
    // Return a new Decimal whose value is the value of this Decimal minus `y`, rounded to `precision`
    // significant digits using rounding mode `rounding`.
    //  n - 0 = n
    //  n - N = N
    //  n - I = -I
    //  0 - n = -n
    //  0 - 0 = 0
    //  0 - N = N
    //  0 - I = -I
    //  N - n = N
    //  N - 0 = N
    //  N - N = N
    //  N - I = N
    //  I - n = I
    //  I - 0 = I
    //  I - N = N
    //  I - I = N
    //
    sub(yy : number | string | Decimal) : Decimal
    {
        let d, e, i, j, k, len, pr, rm, xd, xe, xLTy, yd,
            x = this,
            y = new Decimal(yy),
            LOG_BASE = Decimal.LOG_BASE,
            BASE = Decimal.BASE;

        // If either is not finite...
        if (!x.d || !y.d)
        {
            // Return NaN if either is NaN.
            if (!x.s || !y.s) y = new Decimal(NaN);

            // Return y negated if x is finite and y is ±Infinity.
            else if (x.d) y.s = -y.s;

            // Return x if y is finite and x is ±Infinity.
            // Return x if both are ±Infinity with different signs.
            // Return NaN if both are ±Infinity with the same sign.
            else y = new Decimal(y.d || x.s !== y.s ? x : NaN);

            return y;
        }

        // If signs differ...
        if (x.s != y.s)
        {
            y.s = -y.s;
            return x.add(y);
        }

        xd = x.d;
        yd = y.d;
        pr = Decimal.precision;
        rm = Decimal.rounding;

        // If either is zero...
        if (!xd[0] || !yd[0])
        {
            if (yd[0])
            {
                // Return y negated if x is zero and y is non-zero.
                y.s = -y.s;
            }
            else if (xd[0])
            {
                // Return x if y is zero and x is non-zero.
                y = new Decimal(x);
            }
            else
            {
                // Return zero if both are zero.
                // From IEEE 754 (2008) 6.3: 0 - 0 = -0 - -0 = -0 when rounding to -Infinity.
                return new Decimal(rm === 3 ? -0 : 0);
            }

            return Decimal.external ? Decimal.finalise(y, pr, rm) : y;
        }

        // x and y are finite, non-zero numbers with the same sign.

        // Calculate base 1e7 exponents.
        e = Math.floor(y.e / LOG_BASE);
        xe = Math.floor(x.e / LOG_BASE);

        xd = xd.slice();
        k = xe - e;

        // If base 1e7 exponents differ...
        if (k)
        {
            xLTy = k < 0;

            if (xLTy) {
                d = xd;
                k = -k;
                len = yd.length;
            }
            else
            {
                d = yd;
                e = xe;
                len = xd.length;
            }

            // Numbers with massively different exponents would result in a very high number of
            // zeros needing to be prepended, but this can be avoided while still ensuring correct
            // rounding by limiting the number of zeros to `Math.ceil(pr / LOG_BASE) + 2`.
            i = Math.max(Math.ceil(pr / LOG_BASE), len) + 2;

            if (k > i)
            {
                k = i;
                d.length = 1;
            }

            // Prepend zeros to equalise exponents.
            d.reverse();
            for (i = k; i--;) d.push(0);
            d.reverse();

        // Base 1e7 exponents equal.
        }
        else
        {
            // Check digits to determine which is the bigger number.
            i = xd.length;
            len = yd.length;
            xLTy = i < len;
            if (xLTy) len = i;

            for (i = 0; i < len; i++)
            {
                if (xd[i] != yd[i])
                {
                    xLTy = xd[i] < yd[i];
                    break;
                }
            }

            k = 0;
        }

        if (xLTy)
        {
            d = xd;
            xd = yd;
            yd = d;
            y.s = -y.s;
        }

        len = xd.length;

        // Append zeros to `xd` if shorter.
        // Don't add zeros to `yd` if shorter as subtraction only needs to start at `yd` length.
        for (i = yd.length - len; i > 0; --i) xd[len++] = 0;

        // Subtract yd from xd.
        for (i = yd.length; i > k;)
        {

            if (xd[--i] < yd[i])
            {
                for (j = i; j && xd[--j] === 0;) xd[j] = BASE - 1;
                --xd[j];
                xd[i] += BASE;
            }

            xd[i] -= yd[i];
        }

        // Remove trailing zeros.
        for (; xd[--len] === 0;) xd.pop();

        // Remove leading zeros and adjust exponent accordingly.
        for (; xd[0] === 0; xd.shift()) --e;

        // Zero?
        if (!xd[0]) return new Decimal(rm === 3 ? -0 : 0);

        y.d = xd;
        y.e = this.getBase10Exponent(xd, e);

        return Decimal.external ? Decimal.finalise(y, pr, rm) : y;
    }

    //
    // Return a new Decimal whose value is the value of this Decimal modulo `y`, rounded to
    // `precision` significant digits using rounding mode `rounding`.
    //
    // The result depends on the modulo mode.
    //   n % 0 =  N
    //   n % N =  N
    //   n % I =  n
    //   0 % n =  0
    //  -0 % n = -0
    //   0 % 0 =  N
    //   0 % N =  N
    //   0 % I =  0
    //   N % n =  N
    //   N % 0 =  N
    //   N % N =  N
    //   N % I =  N
    //   I % n =  N
    //   I % 0 =  N
    //   I % N =  N
    //   I % I =  N
    //
    mod(yy : number | string | Decimal) : Decimal
    {
        let q,
            x = this,
            y = new Decimal(yy);

        // Return NaN if x is ±Infinity or NaN, or y is NaN or ±0.
        if (!x.d || !y.s || y.d && !y.d[0])
        {
            return new Decimal(NaN);
        }

        // Return x if y is ±Infinity or x is ±0.
        if (!y.d || x.d && !x.d[0])
        {
            return Decimal.finalise(new Decimal(x), Decimal.precision, Decimal.rounding);
        }

        // Prevent rounding of intermediate calculations.
        Decimal.external = false;

        if (Decimal.modulo == 9)
        {
            // Euclidian division: q = sign(y) * floor(x / abs(y))
            // result = x - q * y    where  0 <= result < abs(y)
            q = Decimal.divide(x, y.abs(), 0, 3, 1);
            q.s *= y.s;
        }
        else
        {
            q = Decimal.divide(x, y, 0, Decimal.modulo, 1);
        }

        q = q.mul(y);

        Decimal.external = true;

        return x.sub(q);
    }

    //
    // Return a new Decimal whose value is the value of this Decimal negated, i.e. as if multiplied by -1
    //
    neg() : Decimal
    {
        let x = new Decimal(this);
        x.s = -x.s;
        return Decimal.finalise(x);
    }

    //
    // Return a new Decimal whose value is the value of this Decimal plus `y`, rounded to `precision`
    // significant digits using rounding mode `rounding`.
    //
    //  n + 0 = n
    //  n + N = N
    //  n + I = I
    //  0 + n = n
    //  0 + 0 = 0
    //  0 + N = N
    //  0 + I = I
    //  N + n = N
    //  N + 0 = N
    //  N + N = N
    //  N + I = N
    //  I + n = I
    //  I + 0 = I
    //  I + N = N
    //  I + I = I
    //
    add(yy : number | string | Decimal) : Decimal
    {
        let carry, d, e, i, k, len, pr, rm, xd, yd,
            x = this,
            y = new Decimal(yy);

        // If either is not finite...
        if (!x.d || !y.d)
        {
            // Return NaN if either is NaN.
            if (!x.s || !y.s) y = new Decimal(NaN);

            // Return x if y is finite and x is ±Infinity.
            // Return x if both are ±Infinity with the same sign.
            // Return NaN if both are ±Infinity with different signs.
            // Return y if x is finite and y is ±Infinity.
            else if (!x.d) y = new Decimal(y.d || x.s === y.s ? x : NaN);

            return y;
        }

        // If signs differ...
        if (x.s != y.s)
        {
            y.s = -y.s;
            return x.sub(y);
        }

        xd = x.d;
        yd = y.d;
        pr = Decimal.precision;
        rm = Decimal.rounding;

        // If either is zero...
        if (!xd[0] || !yd[0])
        {
            // Return x if y is zero.
            // Return y if y is non-zero.
            if (!yd[0]) y = new Decimal(x);

            return Decimal.external ? Decimal.finalise(y, pr, rm) : y;
        }

        // x and y are finite, non-zero numbers with the same sign.

        // Calculate base 1e7 exponents.
        k = Math.floor(x.e / Decimal.LOG_BASE);
        e = Math.floor(y.e / Decimal.LOG_BASE);

        xd = xd.slice();
        i = k - e;

        // If base 1e7 exponents differ...
        if (i)
        {

            if (i < 0)
            {
                d = xd;
                i = -i;
                len = yd.length;
            }
            else
            {
                d = yd;
                e = k;
                len = xd.length;
            }

            // Limit number of zeros prepended to max(ceil(pr / LOG_BASE), len) + 1.
            k = Math.ceil(pr / Decimal.LOG_BASE);
            len = k > len ? k + 1 : len + 1;

            if (i > len)
            {
                i = len;
                d.length = 1;
            }

            // Prepend zeros to equalise exponents. Note: Faster to use reverse then do unshifts.
            d.reverse();
            for (; i--;) d.push(0);
            d.reverse();
        }

        len = xd.length;
        i = yd.length;

        // If yd is longer than xd, swap xd and yd so xd points to the longer array.
        if (len - i < 0)
        {
            i = len;
            d = yd;
            yd = xd;
            xd = d;
        }

        // Only start adding at yd.length - 1 as the further digits of xd can be left as they are.
        for (carry = 0; i;)
        {
            carry = (xd[--i] = xd[i] + yd[i] + carry) / Decimal.BASE | 0;
            xd[i] %= Decimal.BASE;
        }

        if (carry)
        {
            xd.unshift(carry);
            ++e;
        }

        // Remove trailing zeros.
        // No need to check for zero, as +x + +y != 0 && -x + -y != 0
        for (len = xd.length; xd[--len] == 0;) xd.pop();

        y.d = xd;
        y.e = this.getBase10Exponent(xd, e);

        return Decimal.external ? Decimal.finalise(y, pr, rm) : y;
    }

    //
    // Return the number of significant digits of the value of this Decimal.
    // [z] {boolean|number} Whether to count integer-part trailing zeros: true, false, 1 or 0.
    //
    precision(z ?: boolean | number) : number
    {
        let k,
            x = this;

        if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) throw Error(Decimal.invalidArgument + z);

        if (x.d)
        {
            k = this.getPrecision(x.d);
            if (z && x.e + 1 > k) k = x.e + 1;
        }
        else
        {
            k = NaN;
        }

        return k;
    }

    //
    // Return a new Decimal whose value is the value of this Decimal rounded to a whole number using rounding mode `rounding`.
    //
    round() : Decimal
    {
        let x = new Decimal(this);
        return Decimal.finalise(x, x.e + 1, Decimal.rounding);
    }

    sign() : number
    {
        let x = this;
        return x.d ? (x.d[0] ? x.s : 0 * x.s) : x.s || NaN;
    }

    //
    // Return a new Decimal whose value is this Decimal times `y`, rounded to `precision` significant
    // digits using rounding mode `rounding`.
    //
    //  n * 0 = 0
    //  n * N = N
    //  n * I = I
    //  0 * n = 0
    //  0 * 0 = 0
    //  0 * N = N
    //  0 * I = N
    //  N * n = N
    //  N * 0 = N
    //  N * N = N
    //  N * I = N
    //  I * n = I
    //  I * 0 = N
    //  I * N = N
    //  I * I = I
    //
    mul(yy : number | string | Decimal) : Decimal
    {
        let y = new Decimal(yy);

        let carry, e, i, k, r, rL, t, xdL, ydL,
            x = this,
            xd = x.d,
            yd = y.d,
            LOG_BASE = Decimal.LOG_BASE,
            BASE = Decimal.BASE;

        y.s *= x.s;

        // If either is NaN, ±Infinity or ±0...
        if (!xd || !xd[0] || !yd || !yd[0])
        {

            return new Decimal(!y.s || xd && !xd[0] && !yd || yd && !yd[0] && !xd

            // Return NaN if either is NaN.
            // Return NaN if x is ±0 and y is ±Infinity, or y is ±0 and x is ±Infinity.
            ? NaN

            // Return ±Infinity if either is ±Infinity.
            // Return ±0 if either is ±0.
            : !xd || !yd ? y.s / 0 : y.s * 0);
        }

        e = Math.floor(x.e / LOG_BASE) + Math.floor(y.e / LOG_BASE);
        xdL = xd.length;
        ydL = yd.length;

        // Ensure xd points to the longer array.
        if (xdL < ydL)
        {
            r = xd;
            xd = yd;
            yd = r;
            rL = xdL;
            xdL = ydL;
            ydL = rL;
        }

        // Initialise the result array with zeros.
        r = [];
        rL = xdL + ydL;
        for (i = rL; i--;) r.push(0);

        // Multiply!
        for (i = ydL; --i >= 0;)
        {
            carry = 0;
            for (k = xdL + i; k > i;)
            {
                t = r[k] + yd[i] * xd[k - i - 1] + carry;
                r[k--] = t % BASE | 0;
                carry = t / BASE | 0;
            }

            r[k] = (r[k] + carry) % BASE | 0;
        }

        // Remove trailing zeros.
        for (; !r[--rL];) r.pop();

        if (carry) ++e;
        else r.shift();

        // Remove trailing zeros.
        for (i = r.length; !r[--i];) r.pop();

        y.d = r;
        y.e = this.getBase10Exponent(r, e);
        //return y;
        return Decimal.external ? Decimal.finalise(y, Decimal.precision, Decimal.rounding) : y;
    }

    //
    // Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `dp`
    // decimal places using rounding mode `rm` or `rounding` if `rm` is omitted.
    //
    // If `dp` is omitted, return a new Decimal whose value is the value of this Decimal.
    //
    // [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
    // [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
    //
    toDP(dp ?: number, rm ?: number) : Decimal
    {
        let x = new Decimal(this);

        if (dp === void 0) return x;

        this.checkInt32(dp, 0, Decimal.MAX_DIGITS);

        if (rm === void 0)
        {
            rm = Decimal.rounding;
        }
        else
        {
            this.checkInt32(rm, 0, 8);
        }

        return Decimal.finalise(x, dp + x.e + 1, rm);
    }

    //
    // Return a new Decimal whose value is the square root of this Decimal, rounded to `precision`
    // significant digits using rounding mode `rounding`.
    //
    //  sqrt(-n) =  N
    //  sqrt(N)  =  N
    //  sqrt(-I) =  N
    //  sqrt(I)  =  I
    //  sqrt(0)  =  0
    //  sqrt(-0) = -0
    //
    sqrt() : Decimal
    {
        let m, n, sd, r, rep, t,
            x = this,
            d = x.d,
            e = x.e,
            s = x.s;

        // Negative/NaN/Infinity/zero?
        if (s !== 1 || !d || !d[0])
        {
            return new Decimal(!s || s < 0 && (!d || d[0]) ? NaN : d ? x : 1 / 0);
        }

        Decimal.external = false;

        // Initial estimate.
        s = Math.sqrt(+x);

        // Math.sqrt underflow/overflow?
        // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
        if (s == 0 || s == 1 / 0)
        {
            n = Decimal.digitsToString(d);

            if ((n.length + e) % 2 == 0) n += '0';

            s = Math.sqrt(n);
            e = Math.floor((e + 1) / 2) - <number>(e < 0 || e % 2);

            if (s == 1 / 0)
            {
                n = '1e' + e;
            }
            else
            {
                n = s.toExponential();
                n = n.slice(0, n.indexOf('e') + 1) + e;
            }

            r = new Decimal(n);
        }
        else
        {
            r = new Decimal(s.toString());
        }

        sd = (e = Decimal.precision) + 3;

        // Newton-Raphson iteration.
        for (;;)
        {
            t = r;
            r = t.add(Decimal.divide(x, t, sd + 2, 1)).mul(0.5);

            // TODO? Replace with for-loop and checkRoundingDigits.
            if (Decimal.digitsToString(t.d).slice(0, sd) === (n = Decimal.digitsToString(r.d)).slice(0, sd))
            {
                n = n.slice(sd - 3, sd + 1);

                // The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or
                // 4999, i.e. approaching a rounding boundary, continue the iteration.
                if (n == '9999' || !rep && n == '4999')
                {

                    // On the first iteration only, check to see if rounding up gives the exact result as the
                    // nines may infinitely repeat.
                    if (!rep)
                    {
                        Decimal.finalise(t, e + 1, 0);

                        if (t.mul(t).eq(x))
                        {
                            r = t;
                            break;
                        }
                    }

                    sd += 4;
                    rep = 1;
                }
                else
                {
                    // If the rounding digits are null, 0{0,4} or 50{0,3}, check for an exact result.
                    // If not, then there are further digits and m will be truthy.
                    if (!+n || !+n.slice(1) && n.charAt(0) == '5')
                    {
                        // Truncate to the first rounding digit.
                        Decimal.finalise(r, e + 1, 1);
                        m = !r.mul(r).eq(x);
                    }

                    break;
                }
            }
        }

        Decimal.external = true;

        return Decimal.finalise(r, e, Decimal.rounding, m);
    }

    //
    // Return a string representing the value of this Decimal in exponential notation rounded to
    // `dp` fixed decimal places using rounding mode `rounding`.
    //
    // [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
    // [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
    //
    toExponential(dp ?: number, rm ?: number) : Decimal
    {
        var str,
            x : Decimal = this;

        if (dp === void 0)
        {
            str = this.finiteToString(x, true);
        }
        else
        {
            this.checkInt32(dp, 0, Decimal.MAX_DIGITS);

            if (rm === void 0) rm = Decimal.rounding;
            else this.checkInt32(rm, 0, 8);

            x = Decimal.finalise(new Decimal(x), dp + 1, rm);
            str = this.finiteToString(x, true, dp + 1);
        }

        return x.isNeg() && !x.isZero() ? '-' + str : str;
    }

    //
    // Return a string representing the value of this Decimal in normal (fixed-point) notation to
    // `dp` fixed decimal places and rounded using rounding mode `rm` or `rounding` if `rm` is omitted.
    //
    // As with JavaScript numbers, (-0).toFixed(0) is '0', but e.g. (-0.00001).toFixed(0) is '-0'.
    //
    // [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
    // [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
    //
    // (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
    // (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
    // (-0).toFixed(3) is '0.000'.
    // (-0.5).toFixed(0) is '-0'.
    //
    toFixed(dp ?: number, rm ?: number) : Decimal
    {
        var str, y,
            x = this;

        if (dp === void 0)
        {
            str = this.finiteToString(x);
        }
        else
        {
            this.checkInt32(dp, 0, Decimal.MAX_DIGITS);

            if (rm === void 0)
            {
                rm = Decimal.rounding;
            }
            else
            {
                this.checkInt32(rm, 0, 8);
            }

            y = Decimal.finalise(new Decimal(x), dp + x.e + 1, rm);
            str = this.finiteToString(y, false, dp + y.e + 1);
        }

        // To determine whether to add the minus sign look at the value before it was rounded,
        // i.e. look at `x` rather than `y`.
        return x.isNeg() && !x.isZero() ? '-' + str : str;
    }

    //
    // Return an array representing the value of this Decimal as a simple fraction with an integer
    // numerator and an integer denominator.
    //
    // The denominator will be a positive non-zero value less than or equal to the specified maximum
    // denominator. If a maximum denominator is not specified, the denominator will be the lowest
    // value necessary to represent the number exactly.
    //
    // [maxD] {number|string|Decimal} Maximum denominator. Integer >= 1 and < Infinity.
    //
    toFraction(denominator : number | string | Decimal) : Decimal
    {
        let d, d0, d1, d2, e, k, n, n0, n1, pr, q, r,
            x = this,
            xd = x.d,
            maxD = denominator ? new Decimal(denominator) : null;

        if (!xd) return new Decimal(x);

        n1 = d0 = new Decimal(1);
        d1 = n0 = new Decimal(0);

        d = new Decimal(d1);
        e = d.e = this.getPrecision(xd) - x.e - 1;
        k = e % Decimal.LOG_BASE;
        d.d[0] = Math.pow(10, k < 0 ? Decimal.LOG_BASE + k : k);

        if (maxD == null)
        {
            // d is 10**e, the minimum max-denominator needed.
            maxD = e > 0 ? d : n1;
        }
        else
        {
            n = new Decimal(maxD);
            if (!n.isInt() || n.lt(n1)) throw Error(Decimal.invalidArgument + n);
            maxD = n.gt(d) ? (e > 0 ? d : n1) : n;
        }

        Decimal.external = false;
        n = new Decimal(Decimal.digitsToString(xd));
        pr = Decimal.precision;
        Decimal.precision = e = xd.length * Decimal.LOG_BASE * 2;

        for (;;)
        {
            q = Decimal.divide(n, d, 0, 1, 1);
            d2 = d0.add(q.mul(d1));
            if (d2.cmp(maxD) == 1) break;
            d0 = d1;
            d1 = d2;
            d2 = n1;
            n1 = n0.add(q.mul(d2));
            n0 = d2;
            d2 = d;
            d = n.sub(q.mul(d2));
            n = d2;
        }

        d2 = Decimal.divide(maxD.sub(d0), d1, 0, 1, 1);
        n0 = n0.add(d2.mul(n1));
        d0 = d0.add(d2.mul(d1));
        n0.s = n1.s = x.s;

        // Determine which fraction is closer to x, n0/d0 or n1/d1?
        r = Decimal.divide(n1, d1, e, 1).sub(x).abs().cmp(Decimal.divide(n0, d0, e, 1).sub(x).abs()) < 1
        ? [n1, d1] : [n0, d0];

        Decimal.precision = pr;

        Decimal.external = true;

        return r;
    }

    //
    // Returns a new Decimal whose value is the nearest multiple of the magnitude of `y` to the value
    // of this Decimal.
    //
    // If the value of this Decimal is equidistant from two multiples of `y`, the rounding mode `rm`,
    // or `Decimal.rounding` if `rm` is omitted, determines the direction of the nearest multiple.
    //
    // In the context of this method, rounding mode 4 (ROUND_HALF_UP) is the same as rounding mode 0
    // (ROUND_UP), and so on.
    //
    // The return value will always have the same sign as this Decimal, unless either this Decimal
    // or `y` is NaN, in which case the return value will be also be NaN.
    //
    // The return value is not affected by the value of `precision`.
    //
    // y {number|string|Decimal} The magnitude to round to a multiple of.
    // [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
    //
    // 'toNearest() rounding mode not an integer: {rm}'
    // 'toNearest() rounding mode out of range: {rm}'
    //
    toNearest(yy : number | string | Decimal, rm ?: number) : Decimal
    {
        let x = new Decimal(this),
            y : Decimal;

        if (yy == null)
        {
            // If x is not finite, return x.
            if (!x.d) return x;

            y = new Decimal(1);
            rm = Decimal.rounding;
        }
        else
        {
            y = new Decimal(yy);
            if (rm !== void 0) this.checkInt32(rm, 0, 8);

            // If x is not finite, return x if y is not NaN, else NaN.
            if (!x.d) return y.s ? x : y;

            // If y is not finite, return Infinity with the sign of x if y is Infinity, else NaN.
            if (!y.d)
            {
                if (y.s) y.s = x.s;
                return y;
            }
        }

        // If y is not zero, calculate the nearest multiple of y to x.
        if (y.d[0])
        {
            Decimal.external = false;
            if (rm < 4) rm = [4, 5, 7, 8][rm];
            x = Decimal.divide(x, y, 0, rm, 1).mul(y);

            Decimal.external = true;
            Decimal.finalise(x);

            // If y is zero, return zero with the sign of x.
        }
        else
        {
            y.s = x.s;
            x = y;
        }

        return x;
    }

    //
    // Return the value of this Decimal converted to a number primitive.
    // Zero keeps its sign.
    //
    toNumber() : number
    {
        return +this;
    }

    //
    // Return a new Decimal whose value is the value of this Decimal raised to the power `y`, rounded
    // to `precision` significant digits using rounding mode `rounding`.
    //
    // ECMAScript compliant.
    //
    //  pow(x, NaN)                           = NaN
    //   pow(x, ±0)                            = 1
    //   pow(NaN, non-zero)                    = NaN
    //   pow(abs(x) > 1, +Infinity)            = +Infinity
    //   pow(abs(x) > 1, -Infinity)            = +0
    //   pow(abs(x) == 1, ±Infinity)           = NaN
    //   pow(abs(x) < 1, +Infinity)            = +0
    //   pow(abs(x) < 1, -Infinity)            = +Infinity
    //   pow(+Infinity, y > 0)                 = +Infinity
    //   pow(+Infinity, y < 0)                 = +0
    //   pow(-Infinity, odd integer > 0)       = -Infinity
    //   pow(-Infinity, even integer > 0)      = +Infinity
    //   pow(-Infinity, odd integer < 0)       = -0
    //   pow(-Infinity, even integer < 0)      = +0
    //   pow(+0, y > 0)                        = +0
    //   pow(+0, y < 0)                        = +Infinity
    //   pow(-0, odd integer > 0)              = -0
    //   pow(-0, even integer > 0)             = +0
    //   pow(-0, odd integer < 0)              = -Infinity
    //   pow(-0, even integer < 0)             = +Infinity
    //   pow(finite x < 0, finite non-integer) = NaN
    //
    // For non-integer or very large exponents pow(x, y) is calculated using
    //
    //   x^y = exp(y*ln(x))
    //
    // Assuming the first 15 rounding digits are each equally likely to be any digit 0-9, the
    // probability of an incorrectly rounded result
    // P([49]9{14} | [50]0{14}) = 2 * 0.2 * 10^-14 = 4e-15 = 1/2.5e+14
    // i.e. 1 in 250,000,000,000,000
    //
    // If a result is incorrectly rounded the maximum error will be 1 ulp (unit in last place).
    //
    pow(yy : number | string | Decimal) : Decimal
    {
        let e, k, pr, r, rm, sign, yIsInt,
            x : Decimal = this,
            y = new Decimal(yy),
            yn = +y;

        // Either ±Infinity, NaN or ±0?
        if (!x.d || !y.d || !x.d[0] || !y.d[0])
        {
            return  new Decimal(Math.pow(+x, yn));
        }

        x = new Decimal(x);

        if (x.eq(1)) return x;

        pr = Decimal.precision;
        rm = Decimal.rounding;

        if (y.eq(1))
        {
            return Decimal.finalise(x, pr, rm);
        }

        e = Math.floor(y.e / Decimal.LOG_BASE);
        k = y.d.length - 1;
        yIsInt = e >= k;
        sign = x.s;

        if (!yIsInt)
        {
            if (sign < 0) return new Decimal(NaN);

        // If y is a small integer use the 'exponentiation by squaring' algorithm.
        }
        else if ((k = yn < 0 ? -yn : yn) <= Decimal.MAX_SAFE_INTEGER)
        {
            r = this.intPow(x, k, pr);
            return y.s < 0 ? new Decimal(1).div(r) : Decimal.finalise(r, pr, rm);
        }

        // Result is negative if x is negative and the last digit of integer y is odd.
        sign = sign < 0 && y.d[Math.max(e, k)] & 1 ? -1 : 1;

        // Estimate result exponent.
        // x^y = 10^e,  where e = y * log10(x)
        // log10(x) = log10(x_significand) + x_exponent
        // log10(x_significand) = ln(x_significand) / ln(10)
        k = Math.pow(+x, yn);
        e = k == 0 || !isFinite(k)
        ? Math.floor(yn * (Math.log(+('0.' + Decimal.digitsToString(x.d))) / Math.LN10 + x.e + 1))
        : new Decimal(k + '').e;

        // Estimate may be incorrect e.g. x: 0.999999999999999999, y: 2.29, e: 0, r.e: -1.

        // Overflow/underflow?
        if (e > Decimal.maxE + 1 || e < Decimal.minE - 1) return new Decimal(e > 0 ? sign / 0 : 0);

        Decimal.external = false;
        Decimal.rounding = x.s = 1;

        // Estimate the extra guard digits needed to ensure five correct rounding digits from
        // naturalLogarithm(x). Example of failure without these extra digits (precision: 10):
        // new Decimal(2.32456).pow('2087987436534566.46411')
        // should be 1.162377823e+764914905173815, but is 1.162355823e+764914905173815
        k = Math.min(12, (e + '').length);

        // r = x^y = exp(y*ln(x))
        r = Decimal.naturalExponential(y.mul(this.naturalLogarithm(x, pr + k)), pr);

        // Truncate to the required precision plus five rounding digits.
        r = Decimal.finalise(r, pr + 5, 1);

        // If the rounding digits are [49]9999 or [50]0000 increase the precision by 10 and recalculate
        // the result.
        if (Decimal.checkRoundingDigits(r.d, pr, rm))
        {
            e = pr + 10;

            // Truncate to the increased precision plus five rounding digits.
            r = Decimal.finalise(Decimal.naturalExponential(y.mul(this.naturalLogarithm(x, e + k)), e), e + 5, 1);

            // Check for 14 nines from the 2nd rounding digit (the first rounding digit may be 4 or 9).
            if (+Decimal.digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 1e14)
            {
                r = Decimal.finalise(r, pr + 1, 0);
            }
        }

        r.s = sign;

        Decimal.external = true;
        Decimal.rounding = rm;

        return Decimal.finalise(r, pr, rm);
    }

    //
    // Return a string representing the value of this Decimal rounded to `sd` significant digits
    // using rounding mode `rounding`.
    //
    // Return exponential notation if `sd` is less than the number of digits necessary to represent
    // the integer part of the value in normal notation.
    //
    // [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
    // [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
    //
    toPrecision(sd ?: number, rm ?: number) : string
    {
        var str,
            x : Decimal = this;

        if (sd === void 0)
        {
            str = x.finiteToString(x, x.e <= Decimal.toExpNeg || x.e >= Decimal.toExpPos);
        }
        else
        {
            this.checkInt32(sd, 1, Decimal.MAX_DIGITS);

            if (rm === void 0)
            {
                rm = Decimal.rounding;
            }
            else
            {
                this.checkInt32(rm, 0, 8);
            }

            x = Decimal.finalise(new Decimal(x), sd, rm);
            str = x.finiteToString(x, sd <= x.e || x.e <= Decimal.toExpNeg, sd);
        }

        return x.isNeg() && !x.isZero() ? '-' + str : str;
    }

    //
    // Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `sd`
    // significant digits using rounding mode `rm`, or to `precision` and `rounding` respectively if
    // omitted.
    //
    // [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
    // [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
    //
    // 'toSD() digits out of range: {sd}'
    // 'toSD() digits not an integer: {sd}'
    // 'toSD() rounding mode not an integer: {rm}'
    // 'toSD() rounding mode out of range: {rm}'
    //
    toSignificantDigits(sd ?: number, rm ?: number) : Decimal
    {
        var x = this;

        if (sd === void 0)
        {
            sd = Decimal.precision;
            rm = Decimal.rounding;
        }
        else
        {
            x.checkInt32(sd, 1, Decimal.MAX_DIGITS);

            if (rm === void 0) rm = Decimal.rounding;
            else x.checkInt32(rm, 0, 8);
        }

        return Decimal.finalise(new Decimal(x), sd, rm);
    }

    //
    // Return a string representing the value of this Decimal.
    //
    // Return exponential notation if this Decimal has a positive exponent equal to or greater than
    // `toExpPos`, or a negative exponent equal to or less than `toExpNeg`.
    //
    toString() : string
    {
        var x = this,
            str = x.finiteToString(x, x.e <= Decimal.toExpNeg || x.e >= Decimal.toExpPos);

        return x.isNeg() && !x.isZero() ? '-' + str : str;
    }

    //
    // Return a new Decimal whose value is the value of this Decimal truncated to a whole number.
    //
    trunc() : Decimal
    {
        return Decimal.finalise(new Decimal(this), this.e + 1, 1);
    }

    //
    // Return a string representing the value of this Decimal.
    // Unlike `toString`, negative zero will include the minus sign.
    //
    valueOf() : string
    {
        let x = this,
            str = x.finiteToString(x, x.e <= Decimal.toExpNeg || x.e >= Decimal.toExpPos);

        return x.isNeg() ? '-' + str : str;
    }

        // Trig methods

    //
    // Return a new Decimal whose value is the cosine of the value in radians of this Decimal.
    //
    // Domain: [-Infinity, Infinity]
    // Range: [-1, 1]
    //
    // cos(0)         = 1
    // cos(-0)        = 1
    // cos(Infinity)  = NaN
    // cos(-Infinity) = NaN
    // cos(NaN)       = NaN
    //
    cos() : Decimal
    {
        let pr : number,
            rm : number,
            x : Decimal = this;

        if (!x.d) return new Decimal(NaN);

        // cos(0) = cos(-0) = 1
        if (!x.d[0]) return new Decimal(1);

        pr = Decimal.precision;
        rm = Decimal.rounding;
        Decimal.precision = pr + Math.max(x.e, x.precision()) + Decimal.LOG_BASE;
        Decimal.rounding = 1;

        x = this.cosine(this.toLessThanHalfPi(x));

        Decimal.precision = pr;
        Decimal.rounding = rm;

        return Decimal.finalise(Decimal.quadrant == 2 || Decimal.quadrant == 3 ? x.neg() : x, pr, rm, true);
    }

    //
    // Return a new Decimal whose value is the arccosine (inverse cosine) in radians of the value of
    // this Decimal.
    //
    // Domain: [-1, 1]
    // Range: [0, pi]
    //
    // acos(x) = pi/2 - asin(x)
    // acos(0)       = pi/2
    // acos(-0)      = pi/2
    // acos(1)       = 0
    // acos(-1)      = pi
    // acos(1/2)     = pi/3
    // acos(-1/2)    = 2*pi/3
    // acos(|x| > 1) = NaN
    // acos(NaN)     = NaN
    //
    acos() : Decimal
    {
        let halfPi,
            x : Decimal = this,
            k = x.abs().cmp(1),
            pr = Decimal.precision,
            rm = Decimal.rounding;

        if (k !== -1)
        {
            return k === 0
            // |x| is 1
            ? x.isNeg() ? Decimal.getPi(pr, rm) : new Decimal(0)
            // |x| > 1 or x is NaN
            : new Decimal(NaN);
        }

        if (x.isZero()) return Decimal.getPi(pr + 4, rm).mul(0.5);

        // TODO? Special case acos(0.5) = pi/3 and acos(-0.5) = 2*pi/3

        Decimal.precision = pr + 6;
        Decimal.rounding = 1;

        x = x.asin();
        halfPi = Decimal.getPi(pr + 4, rm).mul(0.5);

        Decimal.precision = pr;
        Decimal.rounding = rm;

        return halfPi.sub(x);
    }

    //
    // Return a new Decimal whose value is the hyperbolic cosine of the value in radians of this Decimal.
    //
    // Domain: [-Infinity, Infinity]
    // Range: [1, Infinity]
    //
    // cosh(x) = 1 + x^2/2! + x^4/4! + x^6/6! + ...
    //
    // cosh(0)         = 1
    // cosh(-0)        = 1
    // cosh(Infinity)  = Infinity
    // cosh(-Infinity) = Infinity
    // cosh(NaN)       = NaN
    //
    //  x        time taken (ms)   result
    // 1000      9                 9.8503555700852349694e+433
    // 10000     25                4.4034091128314607936e+4342
    // 100000    171               1.4033316802130615897e+43429
    // 1000000   3817              1.5166076984010437725e+434294
    // 10000000  abandoned after 2 minute wait
    //
    // TODO? Compare performance of cosh(x) = 0.5 * (exp(x) + exp(-x))
    //
    cosh() : Decimal
    {
        let k, n, pr, rm, len,
            x : Decimal = this,
            one = new Decimal(1);

        if (!x.isFinite()) return new Decimal(x.s ? 1 / 0 : NaN);
        if (x.isZero()) return one;

        pr = Decimal.precision;
        rm = Decimal.rounding;
        Decimal.precision = pr + Math.max(x.e, x.precision()) + 4;
        Decimal.rounding = 1;
        len = x.d.length;

        // Argument reduction: cos(4x) = 1 - 8cos^2(x) + 8cos^4(x) + 1
        // i.e. cos(x) = 1 - cos^2(x/4)(8 - 8cos^2(x/4))

        // Estimate the optimum number of times to use the argument reduction.
        // TODO? Estimation reused from cosine() and may not be optimal here.
        if (len < 32)
        {
            k = Math.ceil(len / 3);
            n = Math.pow(4, -k).toString();
        }
        else
        {
            k = 16;
            n = '2.3283064365386962890625e-10';
        }

        x = this.taylorSeries(1, x.mul(n), new Decimal(1), true);

        // Reverse argument reduction
        let cosh2_x,
            i = k,
            d8 = new Decimal(8);

        for (; i--;)
        {
            cosh2_x = x.mul(x);
            x = one.sub(cosh2_x.mul(d8.sub(cosh2_x.mul(d8))));
        }

        return Decimal.finalise(x, Decimal.precision = pr, Decimal.rounding = rm, true);
    }

    //
    // Return a new Decimal whose value is the inverse of the hyperbolic cosine in radians of the value of this Decimal.
    //
    // Domain: [1, Infinity]
    // Range: [0, Infinity]
    //
    // acosh(x) = ln(x + sqrt(x^2 - 1))
    //
    // acosh(x < 1)     = NaN
    // acosh(NaN)       = NaN
    // acosh(Infinity)  = Infinity
    // acosh(-Infinity) = NaN
    // acosh(0)         = NaN
    // acosh(-0)        = NaN
    // acosh(1)         = 0
    // acosh(-1)        = NaN
    //
    acosh() : Decimal
    {
        let pr, rm,
            x : Decimal = this;

        if (x.lte(1)) return new Decimal(x.eq(1) ? 0 : NaN);
        if (!x.isFinite()) return new Decimal(x);

        pr = Decimal.precision;
        rm = Decimal.rounding;
        Decimal.precision = pr + Math.max(Math.abs(x.e), x.precision()) + 4;
        Decimal.rounding = 1;
        Decimal.external = false;

        x = x.mul(x).sub(1).sqrt().add(x);

        Decimal.external = true;
        Decimal.precision = pr;
        Decimal.rounding = rm;

        return x.ln();
    }

    //
    // Return a new Decimal whose value is the sine of the value in radians of this Decimal.
    //
    // Domain: [-Infinity, Infinity]
    // Range: [-1, 1]
    //
    // sin(x) = x - x^3/3! + x^5/5! - ...
    //
    // sin(0)         = 0
    // sin(-0)        = -0
    // sin(Infinity)  = NaN
    // sin(-Infinity) = NaN
    // sin(NaN)       = NaN
    //
    sin() : Decimal
    {
        let pr, rm,
            x : Decimal = this;

        if (!x.isFinite()) return new Decimal(NaN);
        if (x.isZero()) return new Decimal(x);

        pr = Decimal.precision;
        rm = Decimal.rounding;
        Decimal.precision = pr + Math.max(x.e, x.precision()) + Decimal.LOG_BASE;
        Decimal.rounding = 1;

        x = this.sine(this.toLessThanHalfPi(x));

        Decimal.precision = pr;
        Decimal.rounding = rm;

        return Decimal.finalise(Decimal.quadrant > 2 ? x.neg() : x, pr, rm, true);
    }

    //
    // Return a new Decimal whose value is the arcsine (inverse sine) in radians of the value of this Decimal.
    //
    // Domain: [-Infinity, Infinity]
    // Range: [-pi/2, pi/2]
    //
    // asin(x) = 2*atan(x/(1 + sqrt(1 - x^2)))
    //
    // asin(0)       = 0
    // asin(-0)      = -0
    // asin(1/2)     = pi/6
    // asin(-1/2)    = -pi/6
    // asin(1)       = pi/2
    // asin(-1)      = -pi/2
    // asin(|x| > 1) = NaN
    // asin(NaN)     = NaN
    //
    // TODO? Compare performance of Taylor series.
    //
    asin() : Decimal
    {
        let halfPi, k,
            pr, rm,
            x : Decimal = this;

        if (x.isZero()) return new Decimal(x);

        k = x.abs().cmp(1);
        pr = Decimal.precision;
        rm = Decimal.rounding;

        if (k !== -1) {
            // |x| is 1
            if (k === 0)
            {
                halfPi = Decimal.getPi(pr + 4, rm).mul(0.5);
                halfPi.s = x.s;
                return halfPi;
            }

            // |x| > 1 or x is NaN
            return new Decimal(NaN);
        }

        // TODO? Special case asin(1/2) = pi/6 and asin(-1/2) = -pi/6

        Decimal.precision = pr + 6;
        Decimal.rounding = 1;

        x = x.div(new Decimal(1).sub(x.mul(x)).sqrt().add(1)).atan();

        Decimal.precision = pr;
        Decimal.rounding = rm;

        return x.mul(2);
    }

    //
    // Return a new Decimal whose value is the hyperbolic sine of the value in radians of this Decimal.
    //
    // Domain: [-Infinity, Infinity]
    // Range: [-Infinity, Infinity]
    //
    // sinh(x) = x + x^3/3! + x^5/5! + x^7/7! + ...
    //
    // sinh(0)         = 0
    // sinh(-0)        = -0
    // sinh(Infinity)  = Infinity
    // sinh(-Infinity) = -Infinity
    // sinh(NaN)       = NaN
    //
    // x        time taken (ms)
    // 10       2 ms
    // 100      5 ms
    // 1000     14 ms
    // 10000    82 ms
    // 100000   886 ms            1.4033316802130615897e+43429
    // 200000   2613 ms
    // 300000   5407 ms
    // 400000   8824 ms
    // 500000   13026 ms          8.7080643612718084129e+217146
    // 1000000  48543 ms
    //
    // TODO? Compare performance of sinh(x) = 0.5 * (exp(x) - exp(-x))
    //
    sinh() : Decimal
    {
        let k, pr, rm, len,
            x : Decimal = this;

        if (!x.isFinite() || x.isZero()) return new Decimal(x);

        pr = Decimal.precision;
        rm = Decimal.rounding;
        Decimal.precision = pr + Math.max(x.e, x.precision()) + 4;
        Decimal.rounding = 1;
        len = x.d.length;

        if (len < 3)
        {
            x = this.taylorSeries(2, x, x, true);
        }
        else
        {
            // Alternative argument reduction: sinh(3x) = sinh(x)(3 + 4sinh^2(x))
            // i.e. sinh(x) = sinh(x/3)(3 + 4sinh^2(x/3))
            // 3 multiplications and 1 addition

            // Argument reduction: sinh(5x) = sinh(x)(5 + sinh^2(x)(20 + 16sinh^2(x)))
            // i.e. sinh(x) = sinh(x/5)(5 + sinh^2(x/5)(20 + 16sinh^2(x/5)))
            // 4 multiplications and 2 additions

            // Estimate the optimum number of times to use the argument reduction.
            k = 1.4 * Math.sqrt(len);
            k = k > 16 ? 16 : k | 0;

            x = x.mul(Math.pow(5, -k));

            x = this.taylorSeries(2, x, x, true);

            // Reverse argument reduction
            var sinh2_x,
            d5 = new Decimal(5),
            d16 = new Decimal(16),
            d20 = new Decimal(20);

            for (; k--;)
            {
                sinh2_x = x.mul(x);
                x = x.mul(d5.add(sinh2_x.mul(d16.mul(sinh2_x).add(d20))));
            }
        }

        Decimal.precision = pr;
        Decimal.rounding = rm;

        return Decimal.finalise(x, pr, rm, true);
    }

    //
    // Return a new Decimal whose value is the inverse of the hyperbolic sine in radians of the value of this Decimal.
    //
    // Domain: [-Infinity, Infinity]
    // Range: [-Infinity, Infinity]
    //
    // asinh(x) = ln(x + sqrt(x^2 + 1))
    //
    // asinh(NaN)       = NaN
    // asinh(Infinity)  = Infinity
    // asinh(-Infinity) = -Infinity
    // asinh(0)         = 0
    // asinh(-0)        = -0
    //
    asinh() : Decimal
    {
        let pr, rm,
            x : Decimal = this;

        if (!x.isFinite() || x.isZero()) return new Decimal(x);

        pr = Decimal.precision;
        rm = Decimal.rounding;
        Decimal.precision = pr + 2 * Math.max(Math.abs(x.e), x.precision()) + 6;
        Decimal.rounding = 1;
        Decimal.external = false;

        x = x.mul(x).add(1).sqrt().add(x);

        Decimal.external = true;
        Decimal.precision = pr;
        Decimal.rounding = rm;

        return x.ln();
    }

    //
    // Return a new Decimal whose value is the tangent of the value in radians of this Decimal.
    //
    // Domain: [-Infinity, Infinity]
    // Range: [-Infinity, Infinity]
    //
    // tan(0)         = 0
    // tan(-0)        = -0
    // tan(Infinity)  = NaN
    // tan(-Infinity) = NaN
    // tan(NaN)       = NaN
    //
    tan() : Decimal
    {
        let pr, rm,
            x : Decimal = this;

        if (!x.isFinite()) return new Decimal(NaN);
        if (x.isZero()) return new Decimal(x);

        pr = Decimal.precision;
        rm = Decimal.rounding;
        Decimal.precision = pr + 10;
        Decimal.rounding = 1;

        x = x.sin();
        x.s = 1;
        x = Decimal.divide(x, new Decimal(1).sub(x.mul(x)).sqrt(), pr + 10, 0);

        Decimal.precision = pr;
        Decimal.rounding = rm;

        return Decimal.finalise(Decimal.quadrant == 2 || Decimal.quadrant == 4 ? x.neg() : x, pr, rm, true);
    }

    //
    // Return a new Decimal whose value is the arctangent (inverse tangent) in radians of the value of this Decimal.
    //
    // Domain: [-Infinity, Infinity]
    // Range: [-pi/2, pi/2]
    //
    // atan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
    //
    // atan(0)         = 0
    // atan(-0)        = -0
    // atan(1)         = pi/4
    // atan(-1)        = -pi/4
    // atan(Infinity)  = pi/2
    // atan(-Infinity) = -pi/2
    // atan(NaN)       = NaN
    //
    atan() : Decimal
    {
        let i, j, k, n, px, t, r, wpr, x2,
            x : Decimal = this,
            pr = Decimal.precision,
            rm = Decimal.rounding;

        if (!x.isFinite())
        {
            if (!x.s) return new Decimal(NaN);

            if (pr + 4 <= Decimal.PI_PRECISION)
            {
                r = Decimal.getPi(pr + 4, rm).mul(0.5);
                r.s = x.s;
                return r;
            }
        }
        else if (x.isZero())
        {
            return new Decimal(x);
        }
        else if (x.abs().eq(1) && pr + 4 <= Decimal.PI_PRECISION)
        {
            r = Decimal.getPi(pr + 4, rm).mul(0.25);
            r.s = x.s;
            return r;
        }

        Decimal.precision = wpr = pr + 10;
        Decimal.rounding = 1;

        // TODO? if (x >= 1 && pr <= PI_PRECISION) atan(x) = halfPi * x.s - atan(1 / x);

        // Argument reduction
        // Ensure |x| < 0.42
        // atan(x) = 2 * atan(x / (1 + sqrt(1 + x^2)))

        k = Math.min(28, wpr / Decimal.LOG_BASE + 2 | 0);

        for (i = k; i; --i) x = x.div(x.mul(x).add(1).sqrt().add(1));

        Decimal.external = false;

        j = Math.ceil(wpr / Decimal.LOG_BASE);
        n = 1;
        x2 = x.mul(x);
        r = new Decimal(x);
        px = x;

        // atan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
        for (; i !== -1;)
        {
            px = px.mul(x2);
            t = r.sub(px.div(n += 2));

            px = px.mul(x2);
            r = t.add(px.div(n += 2));

            if (r.d[j] !== void 0) for (i = j; r.d[i] === t.d[i] && i--;);
        }

        if (k) r = r.mul(2 << (k - 1));

        Decimal.external = true;

        return Decimal.finalise(r, Decimal.precision = pr, Decimal.rounding = rm, true);
    }

    //
    // Return a new Decimal whose value is the arctangent in radians of `y/x` in the range -pi to pi
    // (inclusive), rounded to `precision` significant digits using rounding mode `rounding`.
    //
    // Domain: [-Infinity, Infinity]
    // Range: [-pi, pi]
    //
    // y {number|string|Decimal} The y-coordinate.
    // x {number|string|Decimal} The x-coordinate.
    //
    // atan2(±0, -0)               = ±pi
    // atan2(±0, +0)               = ±0
    // atan2(±0, -x)               = ±pi for x > 0
    // atan2(±0, x)                = ±0 for x > 0
    // atan2(-y, ±0)               = -pi/2 for y > 0
    // atan2(y, ±0)                = pi/2 for y > 0
    // atan2(±y, -Infinity)        = ±pi for finite y > 0
    // atan2(±y, +Infinity)        = ±0 for finite y > 0
    // atan2(±Infinity, x)         = ±pi/2 for finite x
    // atan2(±Infinity, -Infinity) = ±3*pi/4
    // atan2(±Infinity, +Infinity) = ±pi/4
    // atan2(NaN, x) = NaN
    // atan2(y, NaN) = NaN
    //
    static atan2(yy : number | string | Decimal, xx : number | string | Decimal) :Decimal
    {
        let y = new Decimal(yy),
            x = new Decimal(xx),
            r,
            pr = Decimal.precision,
            rm = Decimal.rounding,
            wpr = pr + 4;

        // Either NaN
        if (!y.s || !x.s)
        {
            r = new Decimal(NaN);
        }
        else if (!y.d && !x.d) // Both ±Infinity
        {
            r = Decimal.getPi(wpr, 1).mul(x.s > 0 ? 0.25 : 0.75);
            r.s = y.s;
        }
        else if (!x.d || y.isZero()) // x is ±Infinity or y is ±0
        {
            r = x.s < 0 ? Decimal.getPi(pr, rm) : new Decimal(0);
            r.s = y.s;
        }
        else if (!y.d || x.isZero()) // y is ±Infinity or x is ±0
        {
            r = Decimal.getPi(wpr, 1).mul(0.5);
            r.s = y.s;
        }
        else if (x.s < 0) // Both non-zero and finite
        {
            Decimal.precision = wpr;
            Decimal.rounding = 1;
            r = new Decimal(Decimal.divide(y, x, wpr, 1)).atan();
            x = Decimal.getPi(wpr, 1);
            Decimal.precision = pr;
            Decimal.rounding = rm;
            r = y.s < 0 ? r.sub(x) : r.add(x);
        }
        else
        {
            r = new Decimal(Decimal.divide(y, x, wpr, 1)).atan();
        }

        return r;
    }

    //
    // Return a new Decimal whose value is the hyperbolic tangent of the value in radians of this Decimal.
    //
    // Domain: [-Infinity, Infinity]
    // Range: [-1, 1]
    //
    // tanh(x) = sinh(x) / cosh(x)
    //
    // tanh(0)         = 0
    // tanh(-0)        = -0
    // tanh(Infinity)  = 1
    // tanh(-Infinity) = -1
    // tanh(NaN)       = NaN
    //
    tanh() : Decimal
    {
        let pr, rm,
            x : Decimal = this;

        if (!x.isFinite()) return new Decimal(x.s);
        if (x.isZero()) return new Decimal(x);

        pr = Decimal.precision;
        rm = Decimal.rounding;
        Decimal.precision = pr + 7;
        Decimal.rounding = 1;

        return Decimal.divide(x.sinh(), x.cosh(), Decimal.precision = pr, Decimal.rounding = rm);
    }

    //
    // Return a new Decimal whose value is the inverse of the hyperbolic tangent in radians of the value of this Decimal.
    //
    // Domain: [-1, 1]
    // Range: [-Infinity, Infinity]
    //
    // atanh(x) = 0.5 * ln((1 + x) / (1 - x))
    //
    // atanh(|x| > 1)   = NaN
    // atanh(NaN)       = NaN
    // atanh(Infinity)  = NaN
    // atanh(-Infinity) = NaN
    // atanh(0)         = 0
    // atanh(-0)        = -0
    // atanh(1)         = Infinity
    // atanh(-1)        = -Infinity
    //
    atanh() : Decimal
    {
        let pr, rm, wpr, xsd,
            x : Decimal = this;

        if (!x.isFinite()) return new Decimal(NaN);
        if (x.e >= 0) return new Decimal(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN);

        pr = Decimal.precision;
        rm = Decimal.rounding;
        xsd = x.precision();

        if (Math.max(xsd, pr) < 2 * -x.e - 1) return Decimal.finalise(new Decimal(x), pr, rm, true);

        Decimal.precision = wpr = xsd - x.e;

        x = Decimal.divide(x.add(1), new Decimal(1).sub(x), wpr + pr, 1);

        Decimal.precision = pr + 4;
        Decimal.rounding = 1;

        x = x.ln();

        Decimal.precision = pr;
        Decimal.rounding = rm;

        return x.mul(0.5);
    }

    //
    // Return the absolute value of `x` reduced to less than or equal to half pi.
    //
    private toLessThanHalfPi(x : Decimal) : Decimal
    {
        let t,
            isNeg = x.s < 0,
            pi = Decimal.getPi(Decimal.precision, 1),
            halfPi = pi.mul(0.5);

        x = x.abs();

        if (x.lte(halfPi))
        {
            Decimal.quadrant = isNeg ? 4 : 1;
            return x;
        }

        t = x.divToInt(pi);

        if (t.isZero())
        {
            Decimal.quadrant = isNeg ? 3 : 2;
        }
        else
        {
            x = x.sub(t.mul(pi));

            // 0 <= x < pi
            if (x.lte(halfPi))
            {
                Decimal.quadrant = this.isOdd(t) ? (isNeg ? 2 : 3) : (isNeg ? 4 : 1);
                return x;
            }

            Decimal.quadrant = this.isOdd(t) ? (isNeg ? 1 : 4) : (isNeg ? 3 : 2);
        }

        return x.mul(pi).abs();
    }

    //
    // sin(x) = x - x^3/3! + x^5/5! - ...
    // |x| < pi/2
    //
    private sine(x : Decimal) : Decimal
    {
        let k,
            len = x.d.length;

        if (len < 3) return this.taylorSeries(2, x, x);

        // Argument reduction: sin(5x) = 16*sin^5(x) - 20*sin^3(x) + 5*sin(x)
        // i.e. sin(x) = 16*sin^5(x/5) - 20*sin^3(x/5) + 5*sin(x/5)
        // and  sin(x) = sin(x/5)(5 + sin^2(x/5)(16sin^2(x/5) - 20))

        // Estimate the optimum number of times to use the argument reduction.
        k = 1.4 * Math.sqrt(len);
        k = k > 16 ? 16 : k | 0;

        // Max k before Math.pow precision loss is 22
        x = x.mul(Math.pow(5, -k));
        x = this.taylorSeries(2, x, x);

        // Reverse argument reduction
        var sin2_x,
        d5 = new Decimal(5),
        d16 = new Decimal(16),
        d20 = new Decimal(20);

        for (; k--;)
        {
            sin2_x = x.mul(x);
            x = x.mul(d5.add(sin2_x.mul(d16.mul(sin2_x).sub(d20))));
        }

        return x;
    }

    //
    // cos(x) = 1 - x^2/2! + x^4/4! - ...
    // |x| < pi/2
    //
    private cosine(x : Decimal) : Decimal
    {
        let k, y,
            len = x.d.length;

        // Argument reduction: cos(4x) = 8*(cos^4(x) - cos^2(x)) + 1
        // i.e. cos(x) = 8*(cos^4(x/4) - cos^2(x/4)) + 1

        // Estimate the optimum number of times to use the argument reduction.
        if (len < 32)
        {
            k = Math.ceil(len / 3);
            y = Math.pow(4, -k).toString();
        }
        else
        {
            k = 16;
            y = '2.3283064365386962890625e-10';
        }

        Decimal.precision += k;

        x = this.taylorSeries(1, x.mul(y), new Decimal(1));

        // Reverse argument reduction
        for (var i = k; i--;)
        {
            var cos2x = x.mul(x);
            x = cos2x.mul(cos2x).sub(cos2x).mul(8).add(1);
        }

        Decimal.precision -= k;

        return x;
    }

    //
    // Calculate Taylor series for `cos`, `cosh`, `sin` and `sinh`.
    //
    private taylorSeries(n : number, x : Decimal, y : Decimal, isHyperbolic? : boolean) : Decimal
    {
        let j, t, u, x2,
            i = 1,
            pr = Decimal.precision,
            k = Math.ceil(pr / Decimal.LOG_BASE);

        Decimal.external = false;
        x2 = x.mul(x);
        u = new Decimal(y);

        for (;;)
        {
            t = Decimal.divide(u.mul(x2), new Decimal(n++ * n++), pr, 1);
            u = isHyperbolic ? y.add(t) : y.sub(t);
            y = Decimal.divide(t.mul(x2), new Decimal(n++ * n++), pr, 1);
            t = u.add(y);

            if (t.d[k] !== void 0)
            {
                for (j = k; t.d[j] === u.d[j] && j--;);
                if (j == -1) break;
            }

            j = u;
            u = y;
            y = t;
            t = j;
            i++;
        }

        Decimal.external = true;
        t.d.length = k + 1;

        return t;
    }

    /*
    *  digitsToString           P.cubeRoot, P.logarithm, P.squareRoot, P.toFraction, P.toPower,
    *                           finiteToString, naturalExponential, naturalLogarithm
    *  checkInt32               P.toDecimalPlaces, P.toExponential, P.toFixed, P.toNearest,
    *                           P.toPrecision, P.toSignificantDigits, toStringBinary, random
    *  checkRoundingDigits      P.logarithm, P.toPower, naturalExponential, naturalLogarithm
    *  convertBase              toStringBinary, parseOther
    *  cos                      P.cos
    *  divide                   P.atanh, P.cubeRoot, P.dividedBy, P.dividedToIntegerBy,
    *                           P.logarithm, P.modulo, P.squareRoot, P.tan, P.tanh, P.toFraction,
    *                           P.toNearest, toStringBinary, naturalExponential, naturalLogarithm,
    *                           taylorSeries, atan2, parseOther
    *  finalise                 P.absoluteValue, P.atan, P.atanh, P.ceil, P.cos, P.cosh,
    *                           P.cubeRoot, P.dividedToIntegerBy, P.floor, P.logarithm, P.minus,
    *                           P.modulo, P.negated, P.plus, P.round, P.sin, P.sinh, P.squareRoot,
    *                           P.tan, P.times, P.toDecimalPlaces, P.toExponential, P.toFixed,
    *                           P.toNearest, P.toPower, P.toPrecision, P.toSignificantDigits,
    *                           P.truncated, divide, getLn10, getPi, naturalExponential,
    *                           naturalLogarithm, ceil, floor, round, trunc
    *  finiteToString           P.toExponential, P.toFixed, P.toPrecision, P.toString, P.valueOf,
    *                           toStringBinary
    *  getBase10Exponent        P.minus, P.plus, P.times, parseOther
    *  getLn10                  P.logarithm, naturalLogarithm
    *  getPi                    P.acos, P.asin, P.atan, toLessThanHalfPi, atan2
    *  getPrecision             P.precision, P.toFraction
    *  getZeroString            digitsToString, finiteToString
    *  intPow                   P.toPower, parseOther
    *  isOdd                    toLessThanHalfPi
    *  maxOrMin                 max, min
    *  naturalExponential       P.naturalExponential, P.toPower
    *  naturalLogarithm         P.acosh, P.asinh, P.atanh, P.logarithm, P.naturalLogarithm,
    *                           P.toPower, naturalExponential
    *  nonFiniteToString        finiteToString, toStringBinary
    *  parseDecimal             Decimal
    *  parseOther               Decimal
    *  sin                      P.sin
    *  taylorSeries             P.cosh, P.sinh, cos, sin
    *  toLessThanHalfPi         P.cos, P.sin
    *  toStringBinary           P.toBinary, P.toHexadecimal, P.toOctal
    *  truncate                 intPow
    *
    *  Throws:                  P.logarithm, P.precision, P.toFraction, checkInt32, getLn10, getPi,
    *                           naturalLogarithm, config, parseOther, random, Decimal
    */
    private static digitsToString(d : number[]) : string
    {
        let i, k, ws,
            indexOfLastWord = d.length - 1,
            str = '',
            w = d[0];

        if (indexOfLastWord > 0)
        {
            str += w;
            for (i = 1; i < indexOfLastWord; i++)
            {
                ws = d[i] + '';
                k = Decimal.LOG_BASE - ws.length;
                if (k) str += Decimal.getZeroString(k);
                str += ws;
            }

            w = d[i];
            ws = w + '';
            k = Decimal.LOG_BASE - ws.length;

            if (k) str += Decimal.getZeroString(k);
        }
        else if (w === 0)
        {
            return '0';
        }

        // Remove trailing zeros of last w.
        for (; w % 10 === 0;) w /= 10;

        return str + w;
    }

    private checkInt32(i : number, min : number, max : number) : void
    {
        if (i !== ~~i || i < min || i > max)
        {
            throw Error(Decimal.invalidArgument + i);
        }
    }

    //
    // Check 5 rounding digits if `repeating` is null, 4 otherwise.
    // `repeating == null` if caller is `log` or `pow`,
    // `repeating != null` if caller is `naturalLogarithm` or `naturalExponential`.
    //
    private static checkRoundingDigits(d : number[], i : number, rm : number, repeating ?: number)
    {
        let di, k, r, rd,
            LOG_BASE = Decimal.LOG_BASE;

        // Get the length of the first word of the array d.
        for (k = d[0]; k >= 10; k /= 10) --i;

        // Is the rounding digit in the first word of d?
        if (--i < 0)
        {
            i += LOG_BASE;
            di = 0;
        }
        else
        {
            di = Math.ceil((i + 1) / LOG_BASE);
            i %= LOG_BASE;
        }

        // i is the index (0 - 6) of the rounding digit.
        // E.g. if within the word 3487563 the first rounding digit is 5,
        // then i = 4, k = 1000, rd = 3487563 % 1000 = 563
        k = Math.pow(10, LOG_BASE - i);
        rd = d[di] % k | 0;

        if (repeating == null)
        {
            if (i < 3)
            {
                if (i == 0) rd = rd / 100 | 0;
                else if (i == 1) rd = rd / 10 | 0;
                r = rm < 4 && rd == 99999 || rm > 3 && rd == 49999 || rd == 50000 || rd == 0;
            }
            else
            {
                r = (rm < 4 && rd + 1 == k || rm > 3 && rd + 1 == k / 2) &&
                (d[di + 1] / k / 100 | 0) == Math.pow(10, i - 2) - 1 ||
                (rd == k / 2 || rd == 0) && (d[di + 1] / k / 100 | 0) == 0;
            }
        }
        else
        {
            if (i < 4)
            {
                if (i == 0) rd = rd / 1000 | 0;
                else if (i == 1) rd = rd / 100 | 0;
                else if (i == 2) rd = rd / 10 | 0;
                r = (repeating || rm < 4) && rd == 9999 || !repeating && rm > 3 && rd == 4999;
            }
            else
            {
                r = ((repeating || rm < 4) && rd + 1 == k ||
                (!repeating && rm > 3) && rd + 1 == k / 2) &&
                (d[di + 1] / k / 1000 | 0) == Math.pow(10, i - 3) - 1;
            }
        }

        return r;
    }

    //
    // Perform division in the specified base.
    //
    private static divide(x : Decimal, y : Decimal, pr? : number, rm? : number, dp? : number, base? : number) : Decimal
    {
        // Assumes non-zero x and k, and hence non-zero result.
        function multiplyInteger(x : number[], k : number, base : number) : number[]
        {
            let temp,
                carry = 0,
                i = x.length;

            for (x = x.slice(); i--;)
            {
                temp = x[i] * k + carry;
                x[i] = temp % base | 0;
                carry = temp / base | 0;
            }

            if (carry) x.unshift(carry);

            return x;
        }

        function compare(a : number[], b : number[], aL : number, bL : number) : number
        {
            let i, r;

            if (aL != bL)
            {
                r = aL > bL ? 1 : -1;
            }
            else
            {
                for (i = r = 0; i < aL; i++)
                {
                    if (a[i] != b[i])
                    {
                        r = a[i] > b[i] ? 1 : -1;
                        break;
                    }
                }
            }

            return r;
        }

        function subtract(a : number[], b : number[], aL : number, base : number) : void
        {
            let i = 0;

            // Subtract b from a.
            for (; aL--;)
            {
                a[aL] -= i;
                i = a[aL] < b[aL] ? 1 : 0;
                a[aL] = i * base + a[aL] - b[aL];
            }

            // Remove leading zeros.
            for (; !a[0] && a.length > 1;) a.shift();
        }

        let cmp, e, i, k, logBase, more, prod, prodL, q, qd, rem, remL, rem0, sd, t, xi, xL, yd0,
            yL, yz,
            sign = x.s == y.s ? 1 : -1,
            xd = x.d,
            yd = y.d;

        // Either NaN, Infinity or 0?
        if (!xd || !xd[0] || !yd || !yd[0])
        {
            return new Decimal(// Return NaN if either NaN, or both Infinity or 0.
            !x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN :

            // Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
            xd && xd[0] == 0 || !yd ? sign * 0 : sign / 0);
        }

        if (base)
        {
            logBase = 1;
            e = x.e - y.e;
        }
        else
        {
            base = Decimal.BASE;
            logBase = Decimal.LOG_BASE;
            e = Math.floor(x.e / logBase) - Math.floor(y.e / logBase);
        }

        yL = yd.length;
        xL = xd.length;
        q = new Decimal(sign);
        qd = q.d = [];

        // Result exponent may be one less than e.
        // The digit array of a Decimal from toStringBinary may have trailing zeros.
        for (i = 0; yd[i] == (xd[i] || 0); i++);

        if (yd[i] > (xd[i] || 0)) e--;

        if (pr == null)
        {
            sd = pr = Decimal.precision;
            rm = Decimal.rounding;
        }
        else if (dp)
        {
            sd = pr + (x.e - y.e) + 1;
        }
        else
        {
            sd = pr;
        }

        if (sd < 0)
        {
            qd.push(1);
            more = true;
        }
        else
        {
            // Convert precision in number of base 10 digits to base 1e7 digits.
            sd = sd / logBase + 2 | 0;
            i = 0;

            // divisor < 1e7
            if (yL == 1)
            {
                let yd0 = yd[0];
                k = 0;
                sd++;

                // k is the carry.
                for (; (i < xL || k) && sd--; i++)
                {
                    t = k * base + (xd[i] || 0);
                    qd[i] = t / yd0 | 0;
                    k = t % yd0 | 0;
                }

                more = k || i < xL;

            // divisor >= 1e7
            }
            else
            {
                // Normalise xd and yd so highest order digit of yd is >= base/2
                k = base / (yd[0] + 1) | 0;

                if (k > 1)
                {
                    yd = multiplyInteger(yd, k, base);
                    xd = multiplyInteger(xd, k, base);
                    yL = yd.length;
                    xL = xd.length;
                }

                xi = yL;
                rem = xd.slice(0, yL);
                remL = rem.length;

                // Add zeros to make remainder as long as divisor.
                for (; remL < yL;) rem[remL++] = 0;

                yz = yd.slice();
                yz.unshift(0);
                yd0 = yd[0];

                if (yd[1] >= base / 2) ++yd0;

                do
                {
                    k = 0;

                    // Compare divisor and remainder.
                    cmp = compare(yd, rem, yL, remL);

                    // If divisor < remainder.
                    if (cmp < 0)
                    {
                        // Calculate trial digit, k.
                        rem0 = rem[0];
                        if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

                        // k will be how many times the divisor goes into the current remainder.
                        k = rem0 / yd0 | 0;

                        //  Algorithm:
                        //  1. product = divisor * trial digit (k)
                        //  2. if product > remainder: product -= divisor, k--
                        //  3. remainder -= product
                        //  4. if product was < remainder at 2:
                        //    5. compare new remainder and divisor
                        //    6. If remainder > divisor: remainder -= divisor, k++

                        if (k > 1)
                        {
                            if (k >= base) k = base - 1;

                            // product = divisor * trial digit.
                            prod = multiplyInteger(yd, k, base);
                            prodL = prod.length;
                            remL = rem.length;

                            // Compare product and remainder.
                            cmp = compare(prod, rem, prodL, remL);

                            // product > remainder.
                            if (cmp == 1)
                            {
                                k--;

                                // Subtract divisor from product.
                                subtract(prod, yL < prodL ? yz : yd, prodL, base);
                            }
                        }
                        else
                        {
                            // cmp is -1.
                            // If k is 0, there is no need to compare yd and rem again below, so change cmp to 1
                            // to avoid it. If k is 1 there is a need to compare yd and rem again below.
                            if (k == 0) cmp = k = 1;
                            prod = yd.slice();
                        }

                        prodL = prod.length;
                        if (prodL < remL) prod.unshift(0);

                        // Subtract product from remainder.
                        subtract(rem, prod, remL, base);

                        // If product was < previous remainder.
                        if (cmp == -1)
                        {
                            remL = rem.length;

                            // Compare divisor and new remainder.
                            cmp = compare(yd, rem, yL, remL);

                            // If divisor < new remainder, subtract divisor from remainder.
                            if (cmp < 1)
                            {
                                k++;

                                // Subtract divisor from remainder.
                                subtract(rem, yL < remL ? yz : yd, remL, base);
                            }
                        }

                        remL = rem.length;
                    }
                    else if (cmp === 0)
                    {
                        k++;
                        rem = [0];
                    }    // if cmp === 1, k will be 0

                    // Add the next digit, k, to the result array.
                    qd[i++] = k;

                    // Update the remainder.
                    if (cmp && rem[0])
                    {
                        rem[remL++] = xd[xi] || 0;
                    }
                    else
                    {
                        rem = [xd[xi]];
                        remL = 1;
                    }

                } while ((xi++ < xL || rem[0] !== void 0) && sd--);

                more = rem[0] !== void 0;
            }

            // Leading zero?
            if (!qd[0]) qd.shift();
        }

        // logBase is 1 when divide is being used for base conversion.
        if (logBase == 1)
        {
            q.e = e;
            //inexact = more;
        }
        else
        {
            // To calculate q.e, first get the number of digits of qd[0].
            for (i = 1, k = qd[0]; k >= 10; k /= 10) i++;
            q.e = i + e * logBase - 1;

            Decimal.finalise(q, dp ? pr + q.e + 1 : pr, rm, more);
        }

        return q;
    }

    //
    // Round `x` to `sd` significant digits using rounding mode `rm`.
    // Check for over/under-flow.
    //
    private static finalise(x : Decimal, sd? : number, rm? : number, isTruncated? : boolean) : Decimal
    {
        let digits, i, j, k, rd, roundUp, w, xd, xdi,
            LOG_BASE = Decimal.LOG_BASE,
            BASE = Decimal.BASE;

        // Don't round if sd is null or undefined.
        out:
        if (sd != null)
        {
            xd = x.d;

            // Infinity/NaN.
            if (!xd)
            {
                return x;
            }

            // rd: the rounding digit, i.e. the digit after the digit that may be rounded up.
            // w: the word of xd containing rd, a base 1e7 number.
            // xdi: the index of w within xd.
            // digits: the number of digits of w.
            // i: what would be the index of rd within w if all the numbers were 7 digits long (i.e. if
            // they had leading zeros)
            // j: if > 0, the actual index of rd within w (if < 0, rd is a leading zero).

            // Get the length of the first word of the digits array xd.
            for (digits = 1, k = xd[0]; k >= 10; k /= 10)
            {
                digits++;
            }

            i = sd - digits;

            // Is the rounding digit in the first word of xd?
            if (i < 0)
            {
                i += LOG_BASE;
                j = sd;
                w = xd[xdi = 0];

                // Get the rounding digit at index j of w.
                rd = w / Math.pow(10, digits - j - 1) % 10 | 0;
            }
            else
            {
                xdi = Math.ceil((i + 1) / LOG_BASE);
                k = xd.length;

                if (xdi >= k)
                {
                    if (isTruncated)
                    {
                        // Needed by `naturalExponential`, `naturalLogarithm` and `squareRoot`.
                        for (; k++ <= xdi;)
                        {
                            xd.push(0);
                        }

                        w = rd = 0;
                        digits = 1;
                        i %= LOG_BASE;
                        j = i - LOG_BASE + 1;
                    }
                    else
                    {
                        break out;
                    }
                }
                else
                {
                    w = k = xd[xdi];

                    // Get the number of digits of w.
                    for (digits = 1; k >= 10; k /= 10)
                    {
                        digits++;
                    }

                    // Get the index of rd within w.
                    i %= LOG_BASE;

                    // Get the index of rd within w, adjusted for leading zeros.
                    // The number of leading zeros of w is given by LOG_BASE - digits.
                    j = i - LOG_BASE + digits;

                    // Get the rounding digit at index j of w.
                    rd = j < 0 ? 0 : w / Math.pow(10, digits - j - 1) % 10 | 0;
                }
            }

            // Are there any non-zero digits after the rounding digit?
            isTruncated = isTruncated || sd < 0 || xd[xdi + 1] !== void 0 || (j < 0 ? w : w % Math.pow(10, digits - j - 1));

            // The expression `w % Math.pow(10, digits - j - 1)` returns all the digits of w to the right
            // of the digit at (left-to-right) index j, e.g. if w is 908714 and j is 2, the expression
            // will give 714.

            roundUp = rm < 4
            ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
            : rd > 5 || rd == 5 && (rm == 4 || isTruncated || rm == 6 &&

            // Check whether the digit to the left of the rounding digit is odd.
            ((i > 0 ? j > 0 ? w / Math.pow(10, digits - j) : 0 : xd[xdi - 1]) % 10) & 1 ||
            rm == (x.s < 0 ? 8 : 7));

            if (sd < 1 || !xd[0])
            {
                xd.length = 0;

                if (roundUp)
                {
                    // Convert sd to decimal places.
                    sd -= x.e + 1;

                    // 1, 0.1, 0.01, 0.001, 0.0001 etc.
                    xd[0] = Math.pow(10, (LOG_BASE - sd % LOG_BASE) % LOG_BASE);
                    x.e = -sd || 0;
                }
                else
                {
                    // Zero.
                    xd[0] = x.e = 0;
                }

                return x;
            }

            // Remove excess digits.
            if (i == 0)
            {
                xd.length = xdi;
                k = 1;
                xdi--;
            }
            else
            {
                xd.length = xdi + 1;
                k = Math.pow(10, LOG_BASE - i);

                // E.g. 56700 becomes 56000 if 7 is the rounding digit.
                // j > 0 means i > number of leading zeros of w.
                xd[xdi] = j > 0 ? (w / Math.pow(10, digits - j) % Math.pow(10, j) | 0) * k : 0;
            }

            if (roundUp)
            {
                for (;;)
                {
                    // Is the digit to be rounded up in the first word of xd?
                    if (xdi == 0)
                    {
                        // i will be the length of xd[0] before k is added.
                        for (i = 1, j = xd[0]; j >= 10; j /= 10) i++;
                        j = xd[0] += k;
                        for (k = 1; j >= 10; j /= 10) k++;

                        // if i != k the length has increased.
                        if (i != k)
                        {
                            x.e++;
                            if (xd[0] == BASE) xd[0] = 1;
                        }

                        break;
                    }
                    else
                    {
                        xd[xdi] += k;
                        if (xd[xdi] != BASE) break;
                        xd[xdi--] = 0;
                        k = 1;
                    }
                }
            }

            // Remove trailing zeros.
            for (i = xd.length; xd[--i] === 0;)
            {
                xd.pop();
            }
        }

        if (Decimal.external)
        {
            // Overflow?
            if (x.e > Decimal.maxE)
            {
                // Infinity.
                x.d = null;
                x.e = NaN;
            }
            else if (x.e < Decimal.minE)    // Underflow?
            {
                // Zero.
                x.e = 0;
                x.d = [0];
            }
        }

        return x;
    }

    private finiteToString(x : Decimal, isExp? : boolean, sd? : number) : string
    {
        if (!x.isFinite()) return this.nonFiniteToString(x);

        let k,
            e = x.e,
            str = Decimal.digitsToString(x.d),
            len = str.length;

        if (isExp)
        {
            if (sd && (k = sd - len) > 0)
            {
                str = str.charAt(0) + '.' + str.slice(1) + Decimal.getZeroString(k);
            }
            else if (len > 1)
            {
                str = str.charAt(0) + '.' + str.slice(1);
            }

            str = str + (x.e < 0 ? 'e' : 'e+') + x.e;
        }
        else if (e < 0)
        {
            str = '0.' + Decimal.getZeroString(-e - 1) + str;
            if (sd && (k = sd - len) > 0) str += Decimal.getZeroString(k);
        }
        else if (e >= len)
        {
            str += Decimal.getZeroString(e + 1 - len);
            if (sd && (k = sd - e - 1) > 0) str = str + '.' + Decimal.getZeroString(k);
        }
        else
        {
            if ((k = e + 1) < len) str = str.slice(0, k) + '.' + str.slice(k);
            if (sd && (k = sd - len) > 0)
            {
                if (e + 1 === len) str += '.';
                str += Decimal.getZeroString(k);
            }
        }

        return str;
    }

    //
    // Calculate the base 10 exponent from the base 1e7 exponent.
    //
    private getBase10Exponent(digits : number[], e : number) : number
    {
        // First get the number of digits of the first word of the digits array.
        for (var i = 1, w = digits[0]; w >= 10; w /= 10) i++;

        return i + e * Decimal.LOG_BASE - 1;
    }

    private getLn10(sd : number, pr? : number) : Decimal
    {
        if (sd > Decimal.LN10_PRECISION)
        {
            // Reset global state in case the exception is caught.
            Decimal.external = true;

            if (pr)
            {
                Decimal.precision = pr;
            }

            throw Error(Decimal.precisionLimitExceeded);
        }

        return Decimal.finalise(Decimal.LN10, sd, 1, true);
    }

    private static getPi(sd : number, rm : number) : Decimal
    {
        if (sd > Decimal.PI_PRECISION) throw Error(Decimal.precisionLimitExceeded);

        return Decimal.finalise(Decimal.PI, sd, rm, true);
    }

    private getPrecision(digits : number[]) : number
    {
        let w = digits.length - 1,
        len = w * Decimal.LOG_BASE + 1;

        w = digits[w];

        // If non-zero...
        if (w)
        {
            // Subtract the number of trailing zeros of the last word.
            for (; w % 10 == 0; w /= 10) len--;

            // Add the number of digits of the first word.
            for (w = digits[0]; w >= 10; w /= 10) len++;
        }

        return len;
    }

    private static getZeroString(k : number) : string
    {
        let zs = '';
        for (; k--;) zs += '0';
        return zs;
    }

    //
    // Return a new Decimal whose value is the value of Decimal `x` to the power `n`, where `n` is an
    // integer of type number.
    //
    // Implements 'exponentiation by squaring'. Called by `pow` and `parseOther`.
    //
    private intPow(x : Decimal, n : number, pr : number) : Decimal
    {
        let isTruncated,
            r = new Decimal(1),
            // Max n of 9007199254740991 takes 53 loop iterations.
            // Maximum digits array length; leaves [28, 34] guard digits.
            k = Math.ceil(pr / Decimal.LOG_BASE + 4);

        Decimal.external = false;

        for (;;)
        {
            if (n % 2)
            {
                r = r.mul(x);
                if (this.truncate(r.d, k)) isTruncated = true;
            }

            n = Math.floor(n / 2);
            if (n === 0)
            {
                // To ensure correct rounding when r.d is truncated, increment the last word if it is zero.
                n = r.d.length - 1;
                if (isTruncated && r.d[n] === 0) ++r.d[n];
                break;
            }

            x = x.mul(x);
            this.truncate(x.d, k);
        }

        Decimal.external = true;

        return r;
    }

    private isOdd(n : Decimal) : boolean
    {
        return (n.d[n.d.length - 1] & 1) === 1;
    }

    //
    // Handle `max` and `min`. `ltgt` is 'lt' or 'gt'.
    //
    private maxOrMin(values : number[], ltgt : string) : Decimal
    {
        let y,
            x = new Decimal(values[0]),
            i = 0;

        for (; ++i < values.length;)
        {
            y = new Decimal(values[i]);

            if (!y.s)
            {
                x = y;
                break;
            }
            else if (x[ltgt](y))
            {
                x = y;
            }
        }

        return x;
    }

    //
    // Return a new Decimal whose value is the natural exponential of `x` rounded to `sd` significant digits.
    //
    // Taylor/Maclaurin series.
    //
    // exp(x) = x^0/0! + x^1/1! + x^2/2! + x^3/3! + ...
    //
    // Argument reduction:
    //   Repeat x = x / 32, k += 5, until |x| < 0.1
    //   exp(x) = exp(x / 2^k)^(2^k)
    //
    // Previously, the argument was initially reduced by
    // exp(x) = exp(r) * 10^k  where r = x - k * ln10, k = floor(x / ln10)
    // to first put r in the range [0, ln10], before dividing by 32 until |x| < 0.1, but this was
    // found to be slower than just dividing repeatedly by 32 as above.
    //
    // Max integer argument: exp('20723265836946413') = 6.3e+9000000000000000
    // Min integer argument: exp('-20723265836946411') = 1.2e-9000000000000000
    // (Math object integer min/max: Math.exp(709) = 8.2e+307, Math.exp(-745) = 5e-324)
    //
    //  exp(Infinity)  = Infinity
    //  exp(-Infinity) = 0
    //  exp(NaN)       = NaN
    //  exp(±0)        = 1
    //
    //  exp(x) is non-terminating for any finite, non-zero x.
    //
    //  The result will always be correctly rounded.
    //
    private static naturalExponential(x : Decimal, sd? : number) : Decimal
    {
        let denominator, guard, j, pow, sum, t, wpr,
            rep = 0,
            i = 0,
            k = 0,
            rm = Decimal.rounding,
            pr = Decimal.precision;

        // 0/NaN/Infinity?
        if (!x.d || !x.d[0] || x.e > 17)
        {
            return new Decimal(x.d ? !x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0 : x.s ? x.s < 0 ? 0 : x : 0 / 0);
        }

        if (sd == null)
        {
            Decimal.external = false;
            wpr = pr;
        }
        else
        {
            wpr = sd;
        }

        t = new Decimal(0.03125);

        // while abs(x) >= 0.1
        while (x.e > -2)
        {
            // x = x / 2^5
            x = x.mul(t);
            k += 5;
        }
        // Use 2 * log10(2^k) + 5 (empirically derived) to estimate the increase in precision
        // necessary to ensure the first 4 rounding digits are correct.
        guard = Math.log(Math.pow(2, k)) / Math.LN10 * 2 + 5 | 0;
        wpr += guard;
        denominator = pow = sum = new Decimal(1);
        Decimal.precision = wpr;

        for(;;)
        {
            pow = Decimal.finalise(pow.mul(x), wpr, 1);
            denominator = denominator.mul(++i);
            t = sum.add(Decimal.divide(pow, denominator, wpr, 1));

            if (Decimal.digitsToString(t.d).slice(0, wpr) === Decimal.digitsToString(sum.d).slice(0, wpr))
            {
                j = k;
                while (j--)
                {
                    sum = Decimal.finalise(sum.mul(sum), wpr, 1);
                }

                // Check to see if the first 4 rounding digits are [49]999.
                // If so, repeat the summation with a higher precision, otherwise
                // e.g. with precision: 18, rounding: 1
                // exp(18.404272462595034083567793919843761) = 98372560.1229999999 (should be 98372560.123)
                // `wpr - guard` is the index of first rounding digit.
                if (sd == null)
                {

                    if (rep < 3 && Decimal.checkRoundingDigits(sum.d, wpr - guard, rm, rep))
                    {
                        Decimal.precision = wpr += 10;
                        denominator = pow = t = new Decimal(1);
                        i = 0;
                        rep++;
                    }
                    else
                    {
                        Decimal.precision = pr;
                        return Decimal.finalise(sum, pr, rm, Decimal.external = true);
                    }
                }
                else
                {
                    Decimal.precision = pr;
                    return sum;
                }
            }

            sum = t;
        }
    }

    //
    // Return a new Decimal whose value is the natural logarithm of `x` rounded to `sd` significant digits.
    //
    //  ln(-n)        = NaN
    //  ln(0)         = -Infinity
    //  ln(-0)        = -Infinity
    //  ln(1)         = 0
    //  ln(Infinity)  = Infinity
    //  ln(-Infinity) = NaN
    //  ln(NaN)       = NaN
    //
    //  ln(n) (n != 1) is non-terminating.
    //
    private naturalLogarithm(y : Decimal, sd? : number) : Decimal
    {
        let c, c0, denominator, e, numerator, rep, sum, t, wpr, x1, x2,
            n = 1,
            guard = 10,
            x = y,
            xd = x.d,
            rm = Decimal.rounding,
            pr = Decimal.precision;

        // Is x negative or Infinity, NaN, 0 or 1?
        if (x.s < 0 || !xd || !xd[0] || !x.e && xd[0] == 1 && xd.length == 1)
        {
            return new Decimal(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x);
        }

        if (sd == null)
        {
            Decimal.external = false;
            wpr = pr;
        }
        else
        {
            wpr = sd;
        }

        Decimal.precision = wpr += guard;
        c = Decimal.digitsToString(xd);
        c0 = c.charAt(0);

        if (Math.abs(e = x.e) < 1.5e15)
        {
            // Argument reduction.
            // The series converges faster the closer the argument is to 1, so using
            // ln(a^b) = b * ln(a),   ln(a) = ln(a^b) / b
            // multiply the argument by itself until the leading digits of the significand are 7, 8, 9,
            // 10, 11, 12 or 13, recording the number of multiplications so the sum of the series can
            // later be divided by this number, then separate out the power of 10 using
            // ln(a*10^b) = ln(a) + b*ln(10).

            // max n is 21 (gives 0.9, 1.0 or 1.1) (9e15 / 21 = 4.2e14).
            //while (c0 < 9 && c0 != 1 || c0 == 1 && c.charAt(1) > 1) {
            // max n is 6 (gives 0.7 - 1.3)
            while (c0 < 7 && c0 != 1 || c0 == 1 && c.charAt(1) > 3)
            {
                x = x.mul(y);
                c = Decimal.digitsToString(x.d);
                c0 = c.charAt(0);
                n++;
            }

            e = x.e;

            if (c0 > 1)
            {
                x = new Decimal('0.' + c);
                e++;
            }
            else
            {
                x = new Decimal(c0 + '.' + c.slice(1));
            }
        }
        else
        {
            // The argument reduction method above may result in overflow if the argument y is a massive
            // number with exponent >= 1500000000000000 (9e15 / 6 = 1.5e15), so instead recall this
            // function using ln(x*10^e) = ln(x) + e*ln(10).
            t = this.getLn10(wpr + 2, pr).mul(e + '');
            x = this.naturalLogarithm(new Decimal(c0 + '.' + c.slice(1)), wpr - guard).add(t);
            Decimal.precision = pr;

            return sd == null ? Decimal.finalise(x, pr, rm, Decimal.external = true) : x;
        }

        // x1 is x reduced to a value near 1.
        x1 = x;

        // Taylor series.
        // ln(y) = ln((1 + x)/(1 - x)) = 2(x + x^3/3 + x^5/5 + x^7/7 + ...)
        // where x = (y - 1)/(y + 1)    (|x| < 1)
        sum = numerator = x = Decimal.divide(x.sub(1), x.add(1), wpr, 1);
        x2 = Decimal.finalise(x.mul(x), wpr, 1);
        denominator = 3;

        // x2 = 4.0088409680155977413049889825712290288933e-4   // Working
        // x2 = 4.0088409680155977413049889825712290288933e-4   // Not working
        // x2 is fine also remains the same through the iterations
        // denominator seems ok adds 2 each iteration
        // numerator is the same through the iterations
        // sum is the same through the iterations
        // t is the same through the iterations
        // Everything is fine until the for loop if statement
        for (;;)
        {
            numerator = Decimal.finalise(numerator.mul(x2), wpr, 1);
            t = sum.add(Decimal.divide(numerator, new Decimal(denominator), wpr, 1));

            if (Decimal.digitsToString(t.d).slice(0, wpr) === Decimal.digitsToString(sum.d).slice(0, wpr))
            {
                sum = sum.mul(2);

                // Reverse the argument reduction. Check that e is not 0 because, besides preventing an
                // unnecessary calculation, -0 + 0 = +0 and to ensure correct rounding -0 needs to stay -0.
                if (e !== 0)
                {
                    sum = sum.add(this.getLn10(wpr + 2, pr).mul(e + ''));
                }
                // sum changes here
                sum = Decimal.divide(sum, new Decimal(n), wpr, 1);


                // Is rm > 3 and the first 4 rounding digits 4999, or rm < 4 (or the summation has
                // been repeated previously) and the first 4 rounding digits 9999?
                // If so, restart the summation with a higher precision, otherwise
                // e.g. with precision: 12, rounding: 1
                // ln(135520028.6126091714265381533) = 18.7246299999 when it should be 18.72463.
                // `wpr - guard` is the index of first rounding digit.
                if (sd == null)
                {
                    if (Decimal.checkRoundingDigits(sum.d, wpr - guard, rm, rep))
                    {
                        Decimal.precision = wpr += guard;
                        t = numerator = x = Decimal.divide(x1.sub(1), x1.add(1), wpr, 1);
                        x2 = Decimal.finalise(x.mul(x), wpr, 1);
                        denominator = rep = 1;
                    }
                    else
                    {
                        return Decimal.finalise(sum, Decimal.precision = pr, rm, Decimal.external = true);
                    }
                }
                else
                {
                    Decimal.precision = pr;
                    return sum;
                }
            }

            sum = t;
            denominator += 2;
        }
    }

    //
    // ±Infinity, NaN.
    //
    private nonFiniteToString(x : Decimal) : string
    {
        // Unsigned.
        return String(x.s * x.s / 0);
    }

    //
    // Parse the value of a new Decimal `x` from string `str`.
    //
    private parseDecimal(x, str)
    {
        let e : number,
            i : number,
            len : number,
            LOG_BASE = Decimal.LOG_BASE;

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

        // Exponential form?
        if ((i = str.search(/e/i)) > 0)
        {
            // Determine exponent.
            if (e < 0) e = i;
            e += +str.slice(i + 1);
            str = str.substring(0, i);
        }
        else if (e < 0)
        {
            // Integer.
            e = str.length;
        }

        // Determine leading zeros.
        for (i = 0; str.charCodeAt(i) === 48; i++);

        // Determine trailing zeros.
        for (len = str.length; str.charCodeAt(len - 1) === 48; --len);
        str = str.slice(i, len);

        if (str)
        {
            len -= i;
            x.e = e = e - i - 1;
            x.d = [];

            // Transform base

            // e is the base 10 exponent.
            // i is where to slice str to get the first word of the digits array.
            i = (e + 1) % LOG_BASE;
            if (e < 0) i += LOG_BASE;

            if (i < len)
            {
                if (i) x.d.push(+str.slice(0, i));
                for (len -= LOG_BASE; i < len;) x.d.push(+str.slice(i, i += LOG_BASE));
                str = str.slice(i);
                i = LOG_BASE - str.length;
            }
            else
            {
                i -= len;
            }

            for (; i--;) str += '0';
            x.d.push(+str);

            if (Decimal.external)
            {
                // Overflow?
                if (x.e > x.maxE)
                {
                // Infinity.
                x.d = null;
                x.e = NaN;

                // Underflow?
                }
                else if (x.e < x.minE)
                {
                    // Zero.
                    x.e = 0;
                    x.d = [0];
                // x.constructor.underflow = true;
                } // else x.constructor.underflow = false;
            }
        }
        else
        {
            // Zero.
            x.e = 0;
            x.d = [0];
        }

        return x;
    }

    //
    // Parse the value of a new Decimal `x` from a string `str`, which is not a decimal value.
    //
    private parseOther(x : Decimal, str : string) : Decimal
    {
        if (str === 'Infinity' || str === 'NaN')
        {
            if (!+str) x.s = NaN;
            x.e = NaN;
            x.d = null;
            return x;
        }
        else
        {
            throw Error(Decimal.invalidArgument + str);
        }
    }

    //
    // Does not strip trailing zeros.
    //
    private truncate(arr : number[], len : number)
    {
        if (arr.length > len)
        {
            arr.length = len;
            return true;
        }
    }

    //
    // Configure global settings for a Decimal constructor.
    //
    // `obj` is an object with one or more of the following properties,
    //
    //   precision  {number}
    //   rounding   {number}
    //   toExpNeg   {number}
    //   toExpPos   {number}
    //   maxE       {number}
    //   minE       {number}
    //   modulo     {number}
    //
    // E.g. Decimal.config({ precision: 20, rounding: 4 })
    //
    // Todo? Make a configuration interface?
    //
    static config(obj)
    {
        if (!obj || typeof obj !== 'object')
        {
            throw Error(Decimal.decimalError + 'Object expected');
        }

        let i, p, v,
            ps = [
                'precision', 1, Decimal.MAX_DIGITS,
                'rounding', 0, 8,
                'toExpNeg', -Decimal.EXP_LIMIT, 0,
                'toExpPos', 0, Decimal.EXP_LIMIT,
                'maxE', 0, Decimal.EXP_LIMIT,
                'minE', -Decimal.EXP_LIMIT, 0,
                'modulo', 0, 9
            ];

        for (i = 0; i < ps.length; i += 3)
        {
            if ((v = obj[p = ps[i]]) !== void 0)
            {
                if (Math.floor(v) === v && v >= ps[i + 1] && v <= ps[i + 2])
                {
                    Decimal[p] = v;
                }
                else
                {
                    throw Error(Decimal.invalidArgument + p + ': ' + v);
                }
            }
        }

        return this;
    }
}