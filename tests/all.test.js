import { describe, expect, test } from "vitest";
import MagicArray from "../src/magic-array.js";
import * as robo from "../src/functions.js";
import data_raw from "./data.js";

const data = MagicArray.from(robo.csvParse(data_raw));
const places = data
	.filter((d) => ["E06", "E07", "E08", "E09", "W06"].includes(d.areacd.slice(0, 3)))
	.sortBy("areanm");

const names = (arr) => [...arr].map((d) => d.areanm);

test('toWords(1, "ordinal", {dropFirst: true}) should be ""', () => {
	expect(robo.toWords(1, "ordinal", { dropFirst: true })).toBe("");
});

test('10 toWords(10, "ordinal") should be "10th"', () => {
	expect(robo.toWords(10, "ordinal")).toBe("10th");
});

test('Ordinal rank for Birmingham population should be "first"', () => {
	expect(places.getRank(places.get("Birmingham"), "population_2011").toWords("ordinal")).toBe(
		"first"
	);
});

test("Top two places by population plus Rutland", () => {
	expect([...places.top("population_2011", 2, places.get("Rutland"))]).toEqual([
		places.get("Birmingham"),
		places.get("Leeds"),
		places.get("Rutland")
	]);
});

test("Bottom two places by population plus Rutland", () => {
	expect([...places.bottom("population_2011", 2, places.get("Rutland"))]).toEqual([
		places.get("Rutland"),
		places.get("City of London"),
		places.get("Isles of Scilly")
	]);
});

test("Bottom three places by population minus Isles of Scilly", () => {
	expect([...places.bottom("population_2011", 3).remove(places.get("Isles of Scilly"))]).toEqual([
		places.get("West Somerset"),
		places.get("City of London")
	]);
});

test("-1 is less than 0 using breaksToWords()", () => {
	expect(robo.breaksToWords(-1)).toEqual("less");
});

test('5 is "about the same" as 4 to 6 using breaksToWords()', () => {
	expect(robo.breaksToWords(5, [4, 6], ["less", "about the same", "more"])).toEqual(
		"about the same"
	);
});

test.each([4, 6])('%i is "roughly about the same" as 4 to 6 using breaksToWords()', (value) => {
	expect(
		robo.breaksToWords(value, [4, 6], ["less", "about the same", "more"], "roughly")
	).toEqual("roughly about the same");
});

test("formatName('name', 'its') for name ending in an s should return s', not s's", () => {
	expect(robo.formatName("Derbyshire Dales", "its")).toBe("the Derbyshire Dales'");
});

test("round(123.4567, 2) should return 123.46", () => {
	expect(robo.round(123.4567, 2)).toBe(123.46);
});

test("round(123.4567, -2) should return 100", () => {
	expect(robo.round(123.4567, -2)).toBe(100);
});

test("format(1234.567, ',.2f') should return 1,234.57", () => {
	expect(robo.format(1234.567, ",.2f")).toBe("1,234.57");
});

test("format(1234.567, ',.-2f') should return 1,200", () => {
	expect(robo.format(1234.567, ",.-2f")).toBe("1,200");
});

test("Top 3 places by population to data", () => {
	expect(places.top("population_2011", 3).toData({ x: "population_2011", y: "areanm" })).toEqual(
		["Birmingham", "Leeds", "Sheffield"].map((nm) => ({
			x: places.get(nm).population_2011,
			y: nm
		}))
	);
});

describe("MagicArray.between()", () => {
	const key = "population_2011";
	const rutland = places.get("Rutland");
	const birmingham = places.get("Birmingham");
	const smallest = places.get("Isles of Scilly");
	// Ranked 100th by population, between Hammersmith and Fulham (99th) and New Forest (101st)
	const caerphilly = places.get("Caerphilly");

	describe("rank mode", () => {
		test.each([
			{ start: 2, end: 4, expected: ["Leeds", "Sheffield", "Cornwall"] },
			{ start: 1, end: 1, expected: ["Birmingham"] }
		])("ranks $start to $end", ({ start, end, expected }) => {
			const result = places.between(key, start, end);
			expect(result).toBeInstanceOf(MagicArray); // A single result is still an array
			expect(names(result)).toEqual(expected);
		});

		test("added item is merged in sorted position", () => {
			expect(names(places.between(key, 1, 3, "rank", "descending", rutland))).toEqual([
				"Birmingham",
				"Leeds",
				"Sheffield",
				"Rutland"
			]);
		});

		test("ascending order ranks from the smallest", () => {
			expect(names(places.between(key, 1, 5, "rank", "ascending"))).toEqual([
				"Isles of Scilly",
				"City of London",
				"West Somerset",
				"Rutland",
				"Purbeck"
			]);
		});
	});

	describe("value mode", () => {
		test("returns every place within the range, in either argument order", () => {
			const result = places.between(key, 100000, 500000, "value");
			const expected = places.filter((d) => d[key] >= 100000 && d[key] <= 500000);
			expect(result.length).toBe(expected.length);
			expect(names(result)).toEqual(names(expected.sortBy(key, "descending")));
			expect(places.between(key, 500000, 100000, "value")).toEqual(result);
		});

		test("added item is not duplicated when already in range", () => {
			const pop = rutland.population_2011;
			expect(
				names(places.between(key, pop - 1000, pop + 1000, "value", "descending", rutland))
			).toEqual(["Rutland"]);
		});

		test("added item is included when outside range", () => {
			const pop = rutland.population_2011;
			const result = places.between(
				key,
				pop + 10000,
				pop + 20000,
				"value",
				"descending",
				rutland
			);
			expect(result.length).toBe(10);
			expect(result.at(-1)).toBe(rutland);
		});
	});

	describe("around mode", () => {
		test.each([
			{
				label: "largest place",
				target: birmingham,
				range: 2,
				included: ["Birmingham", "Leeds", "Sheffield"]
			},
			{
				label: "smallest place",
				target: smallest,
				range: 2,
				included: ["West Somerset", "City of London", "Isles of Scilly"]
			},
			{
				label: "middle place",
				target: caerphilly,
				range: 1,
				included: ["Hammersmith and Fulham", "Caerphilly", "New Forest"]
			},
			{ label: "range 0", target: caerphilly, range: 0, included: ["Caerphilly"] }
		])("$label, range $range, with and without target", ({ target, range, included }) => {
			const withTarget = places.between(key, target, range, "around");
			const withoutTarget = places.between(
				key,
				target,
				range,
				"around",
				"descending",
				null,
				true
			);
			expect(names(withTarget)).toEqual(included);
			expect(names(withoutTarget)).toEqual(included.filter((nm) => nm !== target.areanm));
		});

		test("excludeTarget matches removing the target afterwards", () => {
			expect(
				names(places.between(key, birmingham, 2, "around", "descending", null, true))
			).toEqual(names(places.between(key, birmingham, 2, "around").remove(birmingham)));
		});

		test("excludeTarget defaults to false", () => {
			expect(places.between(key, caerphilly, 2, "around")).toEqual(
				places.between(key, caerphilly, 2, "around", "descending", null, false)
			);
		});

		test("added item is merged in and target excluded", () => {
			expect(
				names(places.between(key, caerphilly, 1, "around", "descending", rutland, true))
			).toEqual(["Hammersmith and Fulham", "New Forest", "Rutland"]);
		});

		test("ascending order with excludeTarget", () => {
			expect(
				names(places.between(key, caerphilly, 1, "around", "ascending", null, true))
			).toEqual(["New Forest", "Hammersmith and Fulham"]);
		});

		test("single-item array with excludeTarget returns empty", () => {
			const single = MagicArray.from([places[0]]);
			expect(
				single.between(key, places[0], 1, "around", "descending", null, true).length
			).toBe(0);
		});
	});

	test("excludeTarget has no effect in rank and value modes", () => {
		expect(places.between(key, 1, 3, "rank", "descending", null, true)).toEqual(
			places.between(key, 1, 3, "rank", "descending", null, false)
		);
		expect(places.between(key, 100000, 500000, "value", "descending", null, true)).toEqual(
			places.between(key, 100000, 500000, "value", "descending", null, false)
		);
	});

	test("invalid mode throws", () => {
		expect(() => places.between(key, 1, 5, "invalid")).toThrow(
			"Invalid mode: invalid. Use 'rank', 'value', or 'around'."
		);
	});
});

describe("getExtreme()", () => {
	// keys defaults to Object.keys(obj)
	const cases = [
		{ name: "distinct values", obj: { a: 10, b: 25, c: 5, d: 15 }, highest: "b", lowest: "c" },
		{
			name: "all equal returns first key",
			obj: { x: 10, y: 10, z: 10 },
			highest: "x",
			lowest: "x"
		},
		{
			name: "ties return first key",
			obj: { a: 10, b: 20, c: 20, d: 10 },
			highest: "b",
			lowest: "a"
		},
		{ name: "single key", obj: { a: 42 }, highest: "a", lowest: "a" },
		{
			name: "negative numbers",
			obj: { a: -10, b: -5, c: -15, d: -2 },
			highest: "d",
			lowest: "c"
		},
		{ name: "mixed signs", obj: { a: -10, b: 5, c: -15, d: 2 }, highest: "b", lowest: "c" },
		{ name: "zeros", obj: { a: 0, b: -5, c: 3, d: 0 }, highest: "c", lowest: "b" },
		{ name: "decimals", obj: { a: 1.5, b: 1.7, c: 1.3, d: 1.9 }, highest: "d", lowest: "c" },
		{
			name: "large numbers",
			obj: { a: 1000000, b: 999999, c: 1000001 },
			highest: "c",
			lowest: "b"
		},
		{ name: "scientific notation", obj: { a: 1e5, b: 1e6, c: 1e4 }, highest: "b", lowest: "c" },
		{
			name: "Infinity and -Infinity",
			obj: { a: 10, b: Infinity, c: -Infinity },
			highest: "b",
			lowest: "c"
		},
		{ name: "NaN is skipped", obj: { a: 10, b: NaN, c: 5 }, highest: "a", lowest: "c" },
		{
			name: "null and undefined are skipped",
			obj: { a: 10, b: null, c: 5, d: 15, e: undefined },
			highest: "d",
			lowest: "c"
		},
		{
			name: "subset of keys",
			obj: { a: -10, b: 25, c: 5, d: 15, e: 100 },
			keys: ["a", "c", "d"],
			highest: "d",
			lowest: "a"
		},
		{
			name: "key order does not matter",
			obj: { a: 10, b: 25, c: 5, d: 15 },
			keys: ["c", "d", "a", "b"],
			highest: "b",
			lowest: "c"
		},
		{
			name: "non-existent key is skipped",
			obj: { a: 10, b: 25 },
			keys: ["a", "b", "nonexistent"],
			highest: "b",
			lowest: "a"
		},
		{
			name: "empty object returns first key",
			obj: {},
			keys: ["a", "b", "c"],
			highest: "a",
			lowest: "a"
		},
		{
			name: "numeric strings",
			obj: { a: "10", b: "25", c: "5", d: "15" },
			highest: "b",
			lowest: "c"
		},
		{
			name: "numbers mixed with strings",
			obj: { a: 10, b: "25", c: 5, d: "15" },
			highest: "b",
			lowest: "c"
		},
		{
			name: "decimal strings",
			obj: { a: "10.5", b: "25.7", c: "5.3", d: "15.1" },
			highest: "b",
			lowest: "c"
		},
		{
			name: "negative strings",
			obj: { a: "-10", b: "-5", c: "-15", d: "-2" },
			highest: "d",
			lowest: "c"
		},
		{
			name: "scientific notation strings",
			obj: { a: "1e2", b: "1e3", c: "1e1", d: "1e4" },
			highest: "d",
			lowest: "c"
		},
		{
			name: "strings with whitespace",
			obj: { a: " 10 ", b: "25", c: " 5", d: "15 " },
			highest: "b",
			lowest: "c"
		},
		{
			name: "non-numeric strings are skipped",
			obj: { a: "hello", b: "25", c: "world", d: "15" },
			highest: "b",
			lowest: "d"
		},
		{
			name: 'empty string is skipped but "0" is not',
			obj: { a: "", b: "25", c: "0", d: "15" },
			highest: "b",
			lowest: "c"
		},
		{
			name: "mixed valid and invalid values",
			obj: { a: "10", b: "not a number", c: "5", d: null, e: "15" },
			highest: "e",
			lowest: "c"
		},
		{
			name: "all non-numeric returns first key",
			obj: { a: "hello", b: "world", c: null, d: undefined },
			highest: "a",
			lowest: "a"
		}
	];

	test.each(cases)("$name", ({ obj, keys = Object.keys(obj), highest, lowest }) => {
		expect(robo.getExtreme(obj, keys)).toBe(highest);
		expect(robo.getExtreme(obj, keys, "highest")).toBe(highest);
		expect(robo.getExtreme(obj, keys, "max")).toBe(highest);
		expect(robo.getExtreme(obj, keys, "lowest")).toBe(lowest);
		expect(robo.getExtreme(obj, keys, "min")).toBe(lowest);
	});

	test("highestFromArray and lowestFromArray wrap getExtreme", () => {
		for (const { obj, keys = Object.keys(obj), highest, lowest } of cases) {
			expect(robo.highestFromArray(obj, keys)).toBe(highest);
			expect(robo.lowestFromArray(obj, keys)).toBe(lowest);
		}
	});

	test.each([
		{
			name: "mixed signs",
			obj: { a: -100, b: 50, c: -10, d: 75, e: -5, f: 200, g: -150 },
			highest: "f",
			lowest: "e"
		},
		{
			name: "negative has largest magnitude",
			obj: { a: -300, b: 250, c: -100 },
			highest: "a",
			lowest: "c"
		},
		{
			name: "positive has smallest magnitude",
			obj: { a: -20, b: 3, c: -15 },
			highest: "a",
			lowest: "b"
		},
		{
			name: "ties return first key",
			obj: { a: 100, b: -100, c: 50 },
			highest: "a",
			lowest: "c"
		},
		{ name: "zero", obj: { a: -10, b: 0, c: 5 }, highest: "a", lowest: "b" },
		{ name: "all negative", obj: { a: -5, b: -100, c: -2 }, highest: "b", lowest: "c" },
		{ name: "all positive", obj: { a: 5, b: 100, c: 2 }, highest: "b", lowest: "c" },
		{ name: "decimals", obj: { a: -3.7, b: 2.1, c: -1.5 }, highest: "a", lowest: "c" },
		{ name: "single key", obj: { a: -100 }, highest: "a", lowest: "a" },
		{
			name: "null, undefined, empty and non-numeric are skipped",
			obj: { a: null, b: -50, c: undefined, d: "", e: "text", f: 30 },
			highest: "b",
			lowest: "f"
		}
	])("absolute: $name", ({ obj, highest, lowest }) => {
		const keys = Object.keys(obj);
		expect(robo.getExtreme(obj, keys, "absolute_highest")).toBe(highest);
		expect(robo.getExtreme(obj, keys, "absolute_max")).toBe(highest);
		expect(robo.getExtreme(obj, keys, "absolute_lowest")).toBe(lowest);
		expect(robo.getExtreme(obj, keys, "absolute_min")).toBe(lowest);
	});

	test.each([[], "not an array", null])("throws for invalid keys: %j", (keys) => {
		const message = "Input must be a non-empty array of keys.";
		expect(() => robo.getExtreme({ a: 10 }, keys)).toThrow(message);
		expect(() => robo.getExtreme({ a: 10 }, keys, "absolute_highest")).toThrow(message);
		expect(() => robo.highestFromArray({ a: 10 }, keys)).toThrow(message);
		expect(() => robo.lowestFromArray({ a: 10 }, keys)).toThrow(message);
	});

	test.each(["invalid", "absolute_invalid"])("throws for invalid mode: %s", (mode) => {
		expect(() => robo.getExtreme({ a: 10 }, ["a"], mode)).toThrow(
			"Mode must be 'highest', 'lowest', 'max', 'min', 'absolute_highest', 'absolute_lowest', 'absolute_max', or 'absolute_min'."
		);
	});
});

test("pluralise('person') should return 'people'", () => {
	expect(robo.pluralise("person")).toBe("people");
});

test("pluralise('person', 1) should return 'person'", () => {
	expect(robo.pluralise("person", 1)).toBe("person");
});

test("pluralise('people', 1) should return 'person'", () => {
	expect(robo.pluralise("people", 1)).toBe("person");
});

test("singularise('people') should return 'person'", () => {
	expect(robo.singularise("people")).toBe("person");
});
