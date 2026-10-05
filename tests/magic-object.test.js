import { describe, expect, test } from "vitest";
import MagicObject from "../src/magic-object.js";
import { places } from "./setup.js";

const place = places.get("Hartlepool");

describe("MagicObject", () => {
	test("copies the row's values", () => {
		const row = new MagicObject({ areacd: "E1", areanm: "Foo" });
		expect({ ...row }).toEqual({ areacd: "E1", areanm: "Foo" });
	});

	test("getName()", () => {
		expect(place.getName()).toBe("Hartlepool");
		expect(place.getName("in")).toBe("in Hartlepool");
		expect(places.get("Isle of Wight").getName("in")).toBe("on the Isle of Wight");
	});

	test("getCode() and getParent()", () => {
		expect(place.getCode()).toBe("E06000001");
		expect(place.getParent()).toBe("E12000001");
	});

	test.each([
		["E06000001", "E92000001"],
		["W06000001", "W92000004"],
		["S12000033", "S92000003"],
		["N09000001", "N92000002"],
		["K02000001", undefined]
	])("getCountry() for %s is %s", (areacd, expected) => {
		expect(new MagicObject({ areacd, areanm: "Foo" }).getCountry()).toBe(expected);
	});

	test("highest() and lowest() return the key with the highest or lowest value", () => {
		const keys = ["long_term_illness_2011_pc", "unpaid_care_20_49_2011_pc"];
		expect(place.highest(keys)).toBe("long_term_illness_2011_pc");
		expect(place.lowest(keys)).toBe("unpaid_care_20_49_2011_pc");
	});

	test("toData() returns one row of data", () => {
		expect(place.toData({ x: "population_2011", y: "areanm" })).toEqual([
			{ x: place.population_2011, y: "Hartlepool" }
		]);
	});
});
