import { describe, expect, test } from "vitest";
import * as robo from "../src/functions.js";
import MagicNumber from "../src/magic-number.js";
import MagicObject from "../src/magic-object.js";

describe("toWords()", () => {
	test('toWords(1, "ordinal", {dropFirst: true}) should be ""', () => {
		expect(robo.toWords(1, "ordinal", { dropFirst: true })).toBe("");
	});

	test('toWords(10, "ordinal") should be "10th"', () => {
		expect(robo.toWords(10, "ordinal")).toBe("10th");
	});
});

describe("breaksToWords()", () => {
	test("-1 is less than 0", () => {
		expect(robo.breaksToWords(-1)).toEqual("less");
	});

	test('5 is "about the same" as 4 to 6', () => {
		expect(robo.breaksToWords(5, [4, 6], ["less", "about the same", "more"])).toEqual(
			"about the same"
		);
	});

	test.each([4, 6])('%i is "roughly about the same" as 4 to 6', (value) => {
		expect(
			robo.breaksToWords(value, [4, 6], ["less", "about the same", "more"], "roughly")
		).toEqual("roughly about the same");
	});
});

describe("formatName()", () => {
	test("formatName('name', 'its') for name ending in an s should return s', not s's", () => {
		expect(robo.formatName("Derbyshire Dales", "its")).toBe("the Derbyshire Dales'");
	});
});

describe("round()", () => {
	test("round(123.4567, 2) should return 123.46", () => {
		expect(robo.round(123.4567, 2)).toBe(123.46);
	});

	test("round(123.4567, -2) should return 100", () => {
		expect(robo.round(123.4567, -2)).toBe(100);
	});
});

describe("format()", () => {
	test("format(1234.567, ',.2f') should return 1,234.57", () => {
		expect(robo.format(1234.567, ",.2f")).toBe("1,234.57");
	});

	test("format(1234.567, ',.-2f') should return 1,200", () => {
		expect(robo.format(1234.567, ",.-2f")).toBe("1,200");
	});
});

describe("toData()", () => {
	const rows = [
		{ areacd: "E1", areanm: "Foo", v: 1 },
		{ areacd: "E2", areanm: "Bar", v: 2 }
	];

	test("returns an array that converts to a JSON string", () => {
		const data = robo.toData(rows, { x: "v", y: "areanm" });
		expect(data).toEqual([
			{ x: 1, y: "Foo" },
			{ x: 2, y: "Bar" }
		]);
		expect(String(data)).toBe(JSON.stringify(data));
		expect(Object.keys(data)).toEqual(["0", "1"]); // toString is not enumerable
	});

	test("stringify and protect modes return strings", () => {
		const json = '[{"y":"Foo"},{"y":"Bar"}]';
		expect(robo.toData(rows, { y: "areanm" }, "stringify")).toBe(json);
		expect(robo.toData(rows, { y: "areanm" }, "protect")).toBe(`§${json}§`);
	});
});

describe("autoType()", () => {
	const parse = (value, key = "v") => robo.autoType({ [key]: value })[key];

	test("returns a MagicObject", () => {
		expect(robo.autoType({ v: "1" })).toBeInstanceOf(MagicObject);
	});

	test.each([
		["42", 42],
		["-3.5", -3.5],
		["0", 0],
		["1e3", 1000],
		[" 7 ", 7],
		["Infinity", Infinity],
		["NaN", NaN],
		["2019", 2019] // a bare year is a number, not a date
	])("%j becomes MagicNumber(%s)", (cell, expected) => {
		const value = parse(cell);
		expect(value).toBeInstanceOf(MagicNumber);
		expect(value.valueOf()).toBe(expected);
	});

	test("numbers can use MagicNumber methods", () => {
		expect(parse("1234567").format(",")).toBe("1,234,567");
		expect(parse("NaN").format(",")).toBe("NaN");
	});

	test.each([
		["true", true],
		["false", false],
		["", null],
		["   ", null],
		["TRUE", "TRUE"], // only lowercase booleans are converted
		["1,234", "1,234"],
		["E06000001", "E06000001"],
		["Hartlepool", "Hartlepool"]
	])("%j becomes %j", (cell, expected) => {
		expect(parse(cell)).toBe(expected);
	});

	test.each([
		["a|b", ["a", "b"]],
		["a|b|", ["a", "b"]], // trailing separator is dropped
		["1|2", ["1", "2"]] // array items are not type-converted
	])("%j becomes an array", (cell, expected) => {
		expect(parse(cell)).toEqual(expected);
	});

	test.each([
		["a|b", ["a", "b"]],
		["a", ["a"]],
		["2020", ["2020"]],
		["true", ["true"]],
		["", []]
	])("%j in an _array column becomes %j", (cell, expected) => {
		expect(parse(cell, "years_array")).toEqual(expected);
	});

	describe("dates", () => {
		test("date-only values are UTC midnight", () => {
			const value = parse("2019-03-04");
			expect(value).toBeInstanceOf(Date);
			expect(value.toISOString()).toBe("2019-03-04T00:00:00.000Z");
			expect(parse("2019-03").toISOString()).toBe("2019-03-01T00:00:00.000Z");
		});

		test("date-times without a timezone are local time", () => {
			const value = parse("2019-07-04T12:30");
			expect([value.getFullYear(), value.getMonth(), value.getDate()]).toEqual([2019, 6, 4]);
			expect([value.getHours(), value.getMinutes()]).toEqual([12, 30]);
		});

		test("date-times with a timezone are respected", () => {
			expect(parse("2019-07-04T12:30Z").toISOString()).toBe("2019-07-04T12:30:00.000Z");
			expect(parse("2019-07-04T12:30+01:00").toISOString()).toBe("2019-07-04T11:30:00.000Z");
		});
	});
});

describe("csvParse()", () => {
	const csv = 'areacd,areanm,value,tags\nE1,"Hull, City of",5,a|b\nE2,Leeds\n';

	test("parses rows into MagicObjects with typed values", () => {
		const rows = robo.csvParse(csv);
		expect(rows.length).toBe(2);
		expect(rows.columns).toEqual(["areacd", "areanm", "value", "tags"]);
		expect(rows[0]).toBeInstanceOf(MagicObject);
		expect(rows[0].areanm).toBe("Hull, City of");
		expect(rows[0].value).toBeInstanceOf(MagicNumber);
		expect(rows[0].tags).toEqual(["a", "b"]);
	});

	test("missing trailing cells become null", () => {
		const row = robo.csvParse(csv)[1];
		expect(row.value).toBeNull();
		expect(row.tags).toBeNull();
	});

	test("strips a leading byte-order mark from the first column name", () => {
		expect(robo.csvParse("﻿" + csv).columns[0]).toBe("areacd");
	});

	test("accepts a custom row function in place of autoType", () => {
		expect(robo.csvParse(csv, (d) => d)[0].value).toBe("5");
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

describe("pluralise() / singularise()", () => {
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
});
