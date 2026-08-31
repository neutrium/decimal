import { Decimal } from '../../../Decimal.ts';

describe("Neutrium Decimal is X Tests", () => {

	Decimal.config = {
		precision: 20,
		rounding: 'half-up',
		toExpNeg: -7,
		toExpPos: 21,
		minE: -9e15,
		maxE: 9e15
	};

	describe("n = 1", () => {
		let n = new Decimal(1);

		it.each([
			n.isFinite(),
			!n.isNaN(),
			!n.isNeg(),
			!n.isZero(),
			n.isInt(),
			n.eq(n),
			n.eq(1),
			n.eq('1.0'),
			n.eq('1.00'),
			n.eq('1.000'),
			n.eq('1.0000'),
			n.eq('1.00000'),
			n.eq('1.000000'),
			n.eq(new Decimal(1))
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		/*test(n.eq('0x1'));
		test(n.eq('0o1'));
		test(n.eq('0b1'));*/        // Hex not currently supported

		it.each([
			n.gt(0.99999),
			!n.gte(1.1),
			n.lt(1.001),
			n.lte(2),
			n.toString() === n.toValue()
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
	});

	describe("n = -0.1", () => {
		let n = new Decimal('-0.1');

		it.each([
			n.isFinite(),
			!n.isNaN(),
			n.isNeg(),
			!n.isZero(),
			!n.isInt(),
			!n.eq(0.1),
			!n.gt(-0.1),
			n.gte(-1),
			n.lt(-0.01),
			!n.lte(-1),
			n.toString() === n.toValue()
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
	});

	describe("n = Infinity", () => {
		let n = new Decimal(Infinity);

		it.each([
			!n.isFinite(),
			!n.isNaN(),
			!n.isNeg(),
			!n.isZero(),
			!n.isInt(),
			n.eq('Infinity'),
			n.eq(1/0),
			n.gt('9e999'),
			n.gte(Infinity),
			n.gte(-Infinity),
			!n.lt(Infinity),
			!n.lt(-Infinity),
			n.lte(Infinity),
			n.toString() === n.toValue(),
			!n.eq(0)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
	});

	describe("n = -Infinity", () => {
		let n = new Decimal('-Infinity');

		it.each([
			!n.isFinite(),
			!n.isNaN(),
			n.isNeg(),
			!n.isZero(),
			!n.isInt(),
			!n.eq(Infinity),
			n.eq(-1/0),
			!n.gt(-Infinity),
			n.gte('-Infinity', 8),
			n.gte(-Infinity),
			n.lt(0),
			n.lte(Infinity),
			n.toString() === n.toValue()
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
	});

	describe("n = 0.0000000", () => {
		let n = new Decimal('0.0000000');

		it.each([
			n.isFinite(),
			!n.isNaN(),
			!n.isNeg(),
			n.isZero(),
			n.isInt(),
			n.eq(-0),
			n.gt(-0.000001),
			!n.gte(0.1),
			n.lt(0.0001),
			n.lte(-0),
			n.toString() === n.toValue()
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
	});

	describe("n = 0", () => {
		let n = new Decimal(0);

		it.each([
			!n.lte('NaN'),
			!n.gte(NaN),
			!n.lte(-Infinity),
			n.gte(-Infinity),
			n.lte('Infinity')
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
	});

	describe("n = -0", () => {
		let n = new Decimal(-0);

		it.each([
			n.isFinite(),
			!n.isNaN(),
			n.isNeg(),
			n.isZero(),
			n.isInt(),
			n.eq('0.000'),
			n.gt(-1),
			!n.gte(0.1),
			!n.lt(0),
			!n.lt(0, 36),
			n.lt(0.1),
			n.lte(0),
			n.toValue() === '-0' && n.toString() === '0'
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
	});

	describe("n = NaN", () => {
		let n = new Decimal('NaN');

		it.each([
			!n.isFinite(),
			n.isNaN(),
			!n.isNeg(),
			!n.isZero(),
			!n.isInt(),
			!n.eq(NaN),
			!n.eq(Infinity),
			!n.gt(0),
			!n.gte(0),
			!n.lt(1),
			!n.lte(-0),
			!n.lte(-1),
			n.toString() === n.toValue()
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			!n.eq(0),
			!n.eq(NaN),
			!n.eq('NaN'),
			!n.lte(NaN),
			!n.gte(NaN),
			!n.gte(-Infinity)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			!n.gt(NaN),
			!n.lt(NaN)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			!n.lte('NaN')
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
	});

	describe("n = -1.234e+2", () => {
		let n = new Decimal('-1.234e+2');

		it.each([
			n.isFinite(),
			!n.isNaN(),
			n.isNeg(),
			!n.isZero(),
			!n.isInt(),
			n.eq(-123.4)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
		//test(n.gt('-0xff'));
		it.each([
			n.gte('-1.234e+3'),
			n.lt(-123.39999),
			n.lte('-123.4e+0'),
			n.toString() === n.toValue()
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
	});

	describe("n = 5e-200", () => {
		let n = new Decimal('5e-200');

		it.each([
			n.isFinite(),
			!n.isNaN(),
			!n.isNeg(),
			!n.isZero(),
			!n.isInt(),
			n.eq(5e-200),
			n.gt(5e-201),
			!n.gte(1),
			n.lt(6e-200),
			n.lte(5.1e-200),
			n.toString() === n.toValue()
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
	});

	describe("n = 1", () => {
		let n = new Decimal('1');

		it.each([
			n.eq(n),
			n.eq(n.toString()),
			n.eq(n.toString()),
			n.eq(n.toValue()),
			n.eq(n.toFixed()),
			n.eq(1),
			n.eq('1e+0'),
			!n.eq(-1),
			!n.eq(0.1)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
	});

	describe("n = various", () => {
		//t(new Decimal('0xa').lessThanOrEqualTo('0xff'));
		//t(new Decimal('0xb').greaterThanOrEqualTo('0x9'));
		// t(new Decimal('0xa').greaterThanOrEqualTo('0x9'));
		//test(new Decimal(255).lte('0xff'));

		it.each([
			!new Decimal(0.1).eq(0),
			!new Decimal(1e9 + 1).eq(1e9),
			!new Decimal(1e9 - 1).eq(1e9),
			new Decimal(1e9 + 1).eq(1e9 + 1)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			!new Decimal(10).gt(10),
			!new Decimal(10).lt(10),
			!new Decimal(10).lt(2),
			!new Decimal(0).gte('Infinity'),
			new Decimal(10).lte(20),
			!new Decimal(10).gte(20)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			!new Decimal(2).gt(10)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			!new Decimal(1.23001e-2).lt(1.23e-2),
			new Decimal(1.23e-2).lt(1.23001e-2),
			!new Decimal(1e-2).lt(9.999999e-3),
			new Decimal(9.999999e-3).lt(1e-2)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			!new Decimal(1.23001e+2).lt(1.23e+2),
			new Decimal(1.23e+2).lt(1.23001e+2),
			new Decimal(9.999999e+2).lt(1e+3),
			!new Decimal(1e+3).lt(9.9999999e+2)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			!new Decimal(1.23001e-2).lte(1.23e-2),
			new Decimal(1.23e-2).lte(1.23001e-2),
			!new Decimal(1e-2).lte(9.999999e-3),
			new Decimal(9.999999e-3).lte(1e-2)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			!new Decimal(1.23001e+2).lte(1.23e+2),
			new Decimal(1.23e+2).lte(1.23001e+2),
			new Decimal(9.999999e+2).lte(1e+3),
			!new Decimal(1e+3).lte(9.9999999e+2)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			new Decimal(1.23001e-2).gt(1.23e-2),
			!new Decimal(1.23e-2).gt(1.23001e-2),
			new Decimal(1e-2).gt(9.999999e-3),
			!new Decimal(9.999999e-3).gt(1e-2)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			new Decimal(1.23001e+2).gt(1.23e+2),
			!new Decimal(1.23e+2).gt(1.23001e+2),
			!new Decimal(9.999999e+2).gt(1e+3),
			new Decimal(1e+3).gt(9.9999999e+2)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			new Decimal(1.23001e-2).gte(1.23e-2),
			!new Decimal(1.23e-2).gte(1.23001e-2),
			new Decimal(1e-2).gte(9.999999e-3),
			!new Decimal(9.999999e-3).gte(1e-2)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			new Decimal(1.23001e+2).gte(1.23e+2),
			!new Decimal(1.23e+2).gte(1.23001e+2),
			!new Decimal(9.999999e+2).gte(1e+3),
			new Decimal(1e+3).gte(9.9999999e+2)
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});

		it.each([
			!new Decimal('1.0000000000000000000001').isInt(),
			!new Decimal('0.999999999999999999999').isInt(),
			new Decimal('4e4').isInt(),
			new Decimal('-4e4').isInt()
		])('case %# should be true', result => {
			expect(result).toEqual(true);
		});
	});

	describe("parity", () => {
		it("identifies parity only for finite integers", () => {
			expect(new Decimal(0).isEven()).toBe(true);
			expect(new Decimal(2).isEven()).toBe(true);
			expect(new Decimal('1e7').isEven()).toBe(true);
			expect(new Decimal(3).isOdd()).toBe(true);
			expect(new Decimal('10000001').isOdd()).toBe(true);

			for (const value of ['1.5', '1.0000001', 'NaN', 'Infinity', '-Infinity'])
			{
				const n = new Decimal(value);

				expect(n.isOdd()).toBe(false);
				expect(n.isEven()).toBe(false);
			}
		});
	});
});
