import { describe, expect, test } from "vitest";
import MagicArray from "../src/magic-array.js";
import { places, names } from "./setup.js";

describe("MagicArray.top() / bottom() / remove()", () => {
	test("top two places by population plus Rutland", () => {
		expect([...places.top("population_2011", 2, places.get("Rutland"))]).toEqual([
			places.get("Birmingham"),
			places.get("Leeds"),
			places.get("Rutland")
		]);
	});

	test("bottom two places by population plus Rutland", () => {
		expect([...places.bottom("population_2011", 2, places.get("Rutland"))]).toEqual([
			places.get("Rutland"),
			places.get("City of London"),
			places.get("Isles of Scilly")
		]);
	});

	test("bottom three places by population minus Isles of Scilly", () => {
		expect([
			...places.bottom("population_2011", 3).remove(places.get("Isles of Scilly"))
		]).toEqual([places.get("West Somerset"), places.get("City of London")]);
	});
});

describe("MagicArray.getRank()", () => {
	test('ordinal rank for Birmingham population should be "first"', () => {
		expect(places.getRank(places.get("Birmingham"), "population_2011").toWords("ordinal")).toBe(
			"first"
		);
	});
});

describe("MagicArray.toData()", () => {
	test("top 3 places by population to data", () => {
		expect(
			places.top("population_2011", 3).toData({ x: "population_2011", y: "areanm" })
		).toEqual(
			["Birmingham", "Leeds", "Sheffield"].map((nm) => ({
				x: places.get(nm).population_2011,
				y: nm
			}))
		);
	});
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
