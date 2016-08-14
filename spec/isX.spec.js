var Decimal = require('../dist/Decimal').Decimal;


function test(test)
{
    it('should  ' + test + ' be true', function() {
        expect(test).toEqual(true);
    });
    return true;
}


describe("Neutrium Decimal is X Tests", function() {
    Decimal.config({
        precision: 20,
        rounding: 4,
        toExpNeg: -7,
        toExpPos: 21,
        minE: -9e15,
        maxE: 9e15
    });

    describe("n = 1", function() {
        var n = new Decimal(1);

        test(n.isFinite());
        test(!n.isNaN());
        test(!n.isNeg());
        test(!n.isZero());
        test(n.isInt());
        test(n.eq(n));
        test(n.eq(1));
        test(n.eq('1.0'));
        test(n.eq('1.00'));
        test(n.eq('1.000'));
        test(n.eq('1.0000'));
        test(n.eq('1.00000'));
        test(n.eq('1.000000'));
        test(n.eq(new Decimal(1)));
        /*test(n.eq('0x1'));
        test(n.eq('0o1'));
        test(n.eq('0b1'));*/        // Hex not currently supported
        test(n.gt(0.99999));
        test(!n.gte(1.1));
        test(n.lt(1.001));
        test(n.lte(2));
        test(n.toString() === n.valueOf());
    });

    describe("n = -0.1", function() {
        n = new Decimal('-0.1');

        test(n.isFinite());
        test(!n.isNaN());
        test(n.isNeg());
        test(!n.isZero());
        test(!n.isInt());
        test(!n.eq(0.1));
        test(!n.gt(-0.1));
        test(n.gte(-1));
        test(n.lt(-0.01));
        test(!n.lte(-1));
        test(n.toString() === n.valueOf());
    });

    describe("n = Infinity", function() {
        n = new Decimal(Infinity);

        test(!n.isFinite());
        test(!n.isNaN());
        test(!n.isNeg());
        test(!n.isZero());
        test(!n.isInt());
        test(n.eq('Infinity'));
        test(n.eq(1/0));
        test(n.gt('9e999'));
        test(n.gte(Infinity));
        test(n.gte(-Infinity));
        test(!n.lt(Infinity));
        test(!n.lt(-Infinity));
        test(n.lte(Infinity));
        test(n.toString() === n.valueOf());
        test(!n.eq(0));
    });

    describe("n = -Infinity", function() {
        n = new Decimal('-Infinity');

        test(!n.isFinite());
        test(!n.isNaN());
        test(n.isNeg());
        test(!n.isZero());
        test(!n.isInt());
        test(!n.eq(Infinity));
        test(n.eq(-1/0));
        test(!n.gt(-Infinity));
        test(n.gte('-Infinity', 8));
        test(n.gte(-Infinity));
        test(n.lt(0));
        test(n.lte(Infinity));
        test(n.toString() === n.valueOf());
    });

    describe("n = 0.0000000", function() {
        n = new Decimal('0.0000000');

        test(n.isFinite());
        test(!n.isNaN());
        test(!n.isNeg());
        test(n.isZero());
        test(n.isInt());
        test(n.eq(-0));
        test(n.gt(-0.000001));
        test(!n.gte(0.1));
        test(n.lt(0.0001));
        test(n.lte(-0));
        test(n.toString() === n.valueOf());
    });

    describe("n = 0", function() {
        n = new Decimal(0);

        test(!n.lte('NaN'));
        test(!n.gte(NaN));
        test(!n.lte(-Infinity));
        test(n.gte(-Infinity));
        test(n.lte('Infinity'));
    });

    describe("n = -0", function() {
        n = new Decimal(-0);

        test(n.isFinite());
        test(!n.isNaN());
        test(n.isNeg());
        test(n.isZero());
        test(n.isInt());
        test(n.eq('0.000'));
        test(n.gt(-1));
        test(!n.gte(0.1));
        test(!n.lt(0));
        test(!n.lt(0, 36));
        test(n.lt(0.1));
        test(n.lte(0));
        test(n.valueOf() === '-0' && n.toString() === '0');
    });

    describe("n = NaN", function() {
        n = new Decimal('NaN');

        test(!n.isFinite());
        test(n.isNaN());
        test(!n.isNeg());
        test(!n.isZero());
        test(!n.isInt());
        test(!n.eq(NaN));
        test(!n.eq(Infinity));
        test(!n.gt(0));
        test(!n.gte(0));
        test(!n.lt(1));
        test(!n.lte(-0));
        test(!n.lte(-1));
        test(n.toString() === n.valueOf());

        test(!n.eq(0));
        test(!n.eq(NaN));
        test(!n.eq('NaN'));
        test(!n.lte(NaN));
        test(!n.gte(NaN));
        test(!n.gte(-Infinity));

        test(!n.gt(NaN));
        test(!n.lt(NaN));

        test(!n.lte('NaN'));
    });

    describe("n = -1.234e+2", function() {
        n = new Decimal('-1.234e+2');

        test(n.isFinite());
        test(!n.isNaN());
        test(n.isNeg());
        test(!n.isZero());
        test(!n.isInt());
        test(n.eq(-123.4));
        //test(n.gt('-0xff'));
        test(n.gte('-1.234e+3'));
        test(n.lt(-123.39999));
        test(n.lte('-123.4e+0'));
        test(n.toString() === n.valueOf());
    });

    describe("n = 5e-200", function() {
        n = new Decimal('5e-200');

        test(n.isFinite());
        test(!n.isNaN());
        test(!n.isNeg());
        test(!n.isZero());
        test(!n.isInt());
        test(n.eq(5e-200));
        test(n.gt(5e-201));
        test(!n.gte(1));
        test(n.lt(6e-200));
        test(n.lte(5.1e-200));
        test(n.toString() === n.valueOf());
    });

    describe("n = 1", function() {
        n = new Decimal('1');

        test(n.eq(n));
        test(n.eq(n.toString()));
        test(n.eq(n.toString()));
        test(n.eq(n.valueOf()));
        test(n.eq(n.toFixed()));
        test(n.eq(1));
        test(n.eq('1e+0'));
        test(!n.eq(-1));
        test(!n.eq(0.1));
    });

    describe("n = various", function() {
        //t(new Decimal('0xa').lessThanOrEqualTo('0xff'));
        //t(new Decimal('0xb').greaterThanOrEqualTo('0x9'));
        // t(new Decimal('0xa').greaterThanOrEqualTo('0x9'));
        //test(new Decimal(255).lte('0xff'));

        test(!new Decimal(0.1).eq(0));
        test(!new Decimal(1e9 + 1).eq(1e9));
        test(!new Decimal(1e9 - 1).eq(1e9));
        test(new Decimal(1e9 + 1).eq(1e9 + 1));

        test(!new Decimal(10).gt(10));
        test(!new Decimal(10).lt(10));
        test(!new Decimal(10).lt(2));
        test(!new Decimal(0).gte('Infinity'));
        test(new Decimal(10).lte(20));
        test(!new Decimal(10).gte(20));

        test(!new Decimal(2).gt(10));

        test(!new Decimal(1.23001e-2).lt(1.23e-2));
        test(new Decimal(1.23e-2).lt(1.23001e-2));
        test(!new Decimal(1e-2).lt(9.999999e-3));
        test(new Decimal(9.999999e-3).lt(1e-2));

        test(!new Decimal(1.23001e+2).lt(1.23e+2));
        test(new Decimal(1.23e+2).lt(1.23001e+2));
        test(new Decimal(9.999999e+2).lt(1e+3));
        test(!new Decimal(1e+3).lt(9.9999999e+2));

        test(!new Decimal(1.23001e-2).lte(1.23e-2));
        test(new Decimal(1.23e-2).lte(1.23001e-2));
        test(!new Decimal(1e-2).lte(9.999999e-3));
        test(new Decimal(9.999999e-3).lte(1e-2));

        test(!new Decimal(1.23001e+2).lte(1.23e+2));
        test(new Decimal(1.23e+2).lte(1.23001e+2));
        test(new Decimal(9.999999e+2).lte(1e+3));
        test(!new Decimal(1e+3).lte(9.9999999e+2));

        test(new Decimal(1.23001e-2).gt(1.23e-2));
        test(!new Decimal(1.23e-2).gt(1.23001e-2));
        test(new Decimal(1e-2).gt(9.999999e-3));
        test(!new Decimal(9.999999e-3).gt(1e-2));

        test(new Decimal(1.23001e+2).gt(1.23e+2));
        test(!new Decimal(1.23e+2).gt(1.23001e+2));
        test(!new Decimal(9.999999e+2).gt(1e+3));
        test(new Decimal(1e+3).gt(9.9999999e+2));

        test(new Decimal(1.23001e-2).gte(1.23e-2));
        test(!new Decimal(1.23e-2).gte(1.23001e-2));
        test(new Decimal(1e-2).gte(9.999999e-3));
        test(!new Decimal(9.999999e-3).gte(1e-2));

        test(new Decimal(1.23001e+2).gte(1.23e+2));
        test(!new Decimal(1.23e+2).gte(1.23001e+2));
        test(!new Decimal(9.999999e+2).gte(1e+3));
        test(new Decimal(1e+3).gte(9.9999999e+2));

        test(!new Decimal('1.0000000000000000000001').isInt());
        test(!new Decimal('0.999999999999999999999').isInt());
        test(new Decimal('4e4').isInt());
        test(new Decimal('-4e4').isInt());
    });
});