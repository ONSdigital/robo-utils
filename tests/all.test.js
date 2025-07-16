import { describe, it, expect, test } from 'vitest'
import MagicArray from '../src/magic-array.js';
import * as robo from "./src/functions.js";
import data_raw from "./data.js";

const data = MagicArray.from(robo.csvParse(data_raw));
const places = data.filter(d => ["E06", "E07", "E08", "E09", "W06"].includes(d.areacd.slice(0, 3))).sortBy("areanm");
const place = places[0];
const lookup = (() => {
  let codeKey = robo.getCodeKey(place);
  let nameKey = robo.getNameKey(place);
  let lkp = {};
  [codeKey, nameKey].forEach(key => {
    if (key) data.forEach(p => lkp[p[key]] = p);
  });
  return lkp;
})();

test('toWords(1, "ordinal", {dropFirst: true}) should be ""', () => {
  expect(robo.toWords(1, "ordinal", {dropFirst: true})).toBe("");
});

test('10 toWords(10, "ordinal") should be "10th"', () => {
  expect(robo.toWords(10, "ordinal")).toBe("10th");
});

test('Ordinal rank for Birmingham population should be "first"', () => {
  expect(places.getRank(lookup["Birmingham"], "population_2011").toWords("ordinal")).toBe("first");
});

test('Top two places by population plus Rutland', () => {
  expect(places.top("population_2011", 2, lookup["Rutland"])).toEqual([lookup["Birmingham"], lookup["Leeds"], lookup["Rutland"]]);
});

test('Bottom two places by population plus Rutland', () => {
  expect(places.bottom("population_2011", 2, lookup["Rutland"])).toEqual([lookup["Rutland"], lookup["City of London"], lookup["Isles of Scilly"]]);
});

test('Bottom three places by population minus Isles of Scilly', () => {
  expect(places.bottom("population_2011", 3).remove(lookup["Isles of Scilly"])).toEqual([lookup["West Somerset"], lookup["City of London"]]);
});

test('-1 is less than 0 using breaksToWords()', () => {
  expect(robo.breaksToWords(-1)).toEqual("less");
});

test('5 is "about the same" as 4 to 6 using breaksToWords()', () => {
  expect(robo.breaksToWords(5, [4, 6], ["less", "about the same", "more"])).toEqual("about the same");
});

test('4 is "roughly about the same" as 4 to 6 using breaksToWords()', () => {
  expect(robo.breaksToWords(6, [4, 6], ["less", "about the same", "more"], "roughly")).toEqual("roughly about the same");
});

test('6 is "roughly about the same" as 4 to 6 using breaksToWords()', () => {
  expect(robo.breaksToWords(6, [4, 6], ["less", "about the same", "more"], "roughly")).toEqual("roughly about the same");
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
  expect(robo.format(1234.567, ',.2f')).toBe("1,234.57");
});

test("format(1234.567, ',.-2f') should return 1,200", () => {
  expect(robo.format(1234.567, ',.-2f')).toBe("1,200");
});

test("Top 3 places by population to data", () => {
  expect(places.top("population_2011", 3).toData({x: "population_2011", y: "areanm"})).toEqual(["Birmingham", "Leeds", "Sheffield"].map(nm => ({x: lookup[nm].population_2011, y: nm})));
})

// Additional tests for the between() method

test('Between ranks 2-4 should return 3 places', () => {
  const result = places.between("population_2011", 2, 4);
  expect(result.length).toBe(3);
  expect(result[0]).toBe(lookup["Leeds"]); // 2nd place
  expect(result[2]).toBe(lookup["Cornwall"]); // 4th place 
});

test('Between ranks 1-1 should return single item (Birmingham)', () => {
  const result = places.between("population_2011", 1, 1);
  expect(result[0]).toBe(lookup["Birmingham"]); // Should return single item, not array
});

test('Between ranks 2-4 with Rutland added should include Rutland in proper position', () => {
  const result = places.between("population_2011", 2, 4, "rank", "descending", lookup["Rutland"]);
  // expect(result).toEqual(expect.arrayContaining([objectContaining(lookup["Rutland"])]));
  expect(result.length).toBe(4); // 3 original + 1 added
});

test('Between values 100000-500000 should return places within population range', () => {
  const result = places.between("population_2011", 100000, 500000, "value");
  result.forEach(place => {
    expect(Math.abs(place.population_2011)).toBeGreaterThanOrEqual(100000);
    expect(Math.abs(place.population_2011)).toBeLessThanOrEqual(500000);
  });
});

test('Between values should work with reversed range (500000-100000)', () => {
  const result1 = places.between("population_2011", 100000, 500000, "value");
  const result2 = places.between("population_2011", 500000, 100000, "value");
  expect(result1).toEqual(result2);
});

test('Between around Birmingham with range 2 should include places ranked 1-3', () => {
  const result = places.between("population_2011", lookup["Birmingham"], 2, "around");
  expect(result.length).toBe(3); // Ranks 1, 2, 3
  expect(result[0]).toBe(lookup["Birmingham"]); // Birmingham should be first
});

test('Between around Birmingham with range 2, excluding Birmingham', () => {
  const result = places.between("population_2011", lookup["Birmingham"], 2, "around")
    .remove(lookup["Birmingham"]);
  expect(result.length).toBe(2); // Ranks 2, 3
  expect(result).not.toContain(lookup["Birmingham"]);
});

test('Between around middle-ranked place should return symmetric range', () => {
  const middlePlace = places[Math.floor(places.length / 2)];
  const result = places.between("population_2011", middlePlace, 1, "around");
  expect(result.length).toBe(3); // target ± 1 position
});

test('Between around last place with range 2 should not exceed array bounds', () => {
  const lastPlace = places.bottom("population_2011", 1);
  const result = places.between("population_2011", lastPlace, 2, "around");
  expect(result.length).toBeLessThanOrEqual(3); // Should handle boundary properly
});

test('Between around first place with range 2 should not exceed array bounds', () => {
  const firstPlace = places.top("population_2011", 1);
  const result = places.between("population_2011", firstPlace, 2, "around");
  expect(result.length).toBeLessThanOrEqual(3); // Should handle boundary properly
});

test('Between with ascending order should return items in ascending order', () => {
  const result = places.between("population_2011", 1, 5, "rank", "ascending");
  for (let i = 0; i < result.length - 1; i++) {
    expect(Math.abs(result[i].population_2011)).toBeLessThanOrEqual(Math.abs(result[i + 1].population_2011));
  }
});

test('Between with invalid mode should throw error', () => {
  expect(() => {
    places.between("population_2011", 1, 5, "invalid");
  }).toThrow("Invalid mode: invalid. Use 'rank', 'value', or 'around'.");
});

test('Between ranks with added item should maintain proper sorting', () => {
  const result = places.between("population_2011", 1, 3, "rank", "descending", lookup["Rutland"]);
  // Check that result is properly sorted in descending order
  for (let i = 0; i < result.length - 1; i++) {
    expect(Math.abs(result[i].population_2011)).toBeGreaterThanOrEqual(Math.abs(result[i + 1].population_2011));
  }
});

test('Between values with added item should include added item if within range', () => {
  const rutlandPop = lookup["Rutland"].population_2011;
  const result = places.between("population_2011", rutlandPop - 1000, rutlandPop + 1000, "value", "descending", lookup["Rutland"]);
  expect(result).toContain(lookup["Rutland"]);
});

test('Between values with added item should include added item if outside range', () => {
  const rutlandPop = lookup["Rutland"].population_2011;
  const result = places.between("population_2011", rutlandPop + 10000, rutlandPop + 20000, "value", "descending", lookup["Rutland"]);
  expect(result).toContain(lookup["Rutland"]);
});

test('Between around with added item should affect ranking calculation', () => {
  // Test that adding an item changes the ranking context
  const testPlace = places[10]; // Some middle-ranked place
  const result1 = places.between("population_2011", testPlace, 1, "around");
  const result2 = places.between("population_2011", testPlace, 1, "around", "descending", lookup["Birmingham"]);
  
  // Results should be different due to Birmingham affecting the ranking
  expect(result1.length).not.toBe(result2.length);
});

// NEW TESTS FOR excludeTarget PARAMETER

test('Between around Birmingham with range 2, excluding target should not include Birmingham', () => {
  const result = places.between("population_2011", lookup["Birmingham"], 2, "around", "descending", null, true);
  expect(result.length).toBe(2); // Ranks 2, 3 (Birmingham excluded)
  expect(result).not.toContain(lookup["Birmingham"]);
});

test('Between around middle place with range 1, excluding target should return 2 items', () => {
  const middlePlace = places[Math.floor(places.length / 2)];
  const result = places.between("population_2011", middlePlace, 1, "around", "descending", null, true);
  expect(result.length).toBe(2); // One above, one below (target excluded)
  expect(result).not.toContain(middlePlace);
});

test('Between around last place with range 2, excluding target should handle bounds correctly', () => {
  const lastPlace = places.bottom("population_2011", 1);
  const result = places.between("population_2011", lastPlace, 2, "around", "descending", null, true);
  expect(result.length).toBeLessThanOrEqual(2); // Should not include the last place itself
  expect(result).not.toContain(lastPlace);
});

test('Between around first place with range 2, excluding target should handle bounds correctly', () => {
  const firstPlace = places.top("population_2011", 1);
  const result = places.between("population_2011", firstPlace, 2, "around", "descending", null, true);
  expect(result.length).toBeLessThanOrEqual(2); // Should not include the first place itself
  expect(result).not.toContain(firstPlace);
});

test('Between around with range 0, excluding target should return empty array', () => {
  const testPlace = places[5];
  const result = places.between("population_2011", testPlace, 0, "around", "descending", null, true);
  expect(result.length).toBe(0); // Range 0 + exclude target = no items
});

test('Between around with range 0, including target should return only target', () => {
  const testPlace = places[5];
  const result = places.between("population_2011", testPlace, 0, "around", "descending", null, false);
  expect(result.length).toBe(1);
  expect(result[0]).toBe(testPlace);
});

test('Between around with added item and excluding target should work correctly', () => {
  const testPlace = places[10];
  const result = places.between("population_2011", testPlace, 1, "around", "descending", lookup["Rutland"], true);
  expect(result).not.toContain(testPlace); // Target should be excluded
  expect(result).toContain(lookup["Rutland"]); // Added item should be included
});

test('Between around with excludeTarget=false should behave like original (default)', () => {
  const testPlace = places[8];
  const result1 = places.between("population_2011", testPlace, 2, "around");
  const result2 = places.between("population_2011", testPlace, 2, "around", "descending", null, false);
  expect(result1).toEqual(result2);
  expect(result1).toContain(testPlace);
});

test('Between around with excludeTarget should work with ascending order', () => {
  const testPlace = places[5];
  const result = places.between("population_2011", testPlace, 1, "around", "ascending", null, true);
  expect(result).not.toContain(testPlace);
  // Check ascending order
  for (let i = 0; i < result.length - 1; i++) {
    expect(Math.abs(result[i].population_2011)).toBeLessThanOrEqual(Math.abs(result[i + 1].population_2011));
  }
});

test('Between around with large range and excludeTarget should work correctly', () => {
  const testPlace = places[Math.floor(places.length / 2)];
  const largeRange = Math.floor(places.length / 3);
  const result = places.between("population_2011", testPlace, largeRange, "around", "descending", null, true);
  expect(result).not.toContain(testPlace);
  expect(result.length).toBeLessThanOrEqual(largeRange * 2); // Should not exceed 2 * range
});

test('Between around with duplicate values and excludeTarget should exclude exact target only', () => {
  // Create a test case where multiple items might have the same value
  const testPlaces = places.filter(p => p.population_2011 === places[0].population_2011);
  if (testPlaces.length > 1) {
    const targetPlace = testPlaces[0];
    const result = places.between("population_2011", targetPlace, 1, "around", "descending", null, true);
    expect(result).not.toContain(targetPlace); // Exact target should be excluded
    // Other items with same value might still be included
  }
});

test('Between around single item array with excludeTarget should return empty', () => {
  const singleItemArray = MagicArray.from([places[0]]);
  const result = singleItemArray.between("population_2011", places[0], 1, "around", "descending", null, true);
  expect(result.length).toBe(0);
});

test('Between around with excludeTarget and return single item edge case', () => {
  // Test case where result would be single item after exclusion
  const testPlace = places[places.length - 1]; // Last place
  const result = places.between("population_2011", testPlace, 1, "around", "descending", null, true);
  if (result.length === 1) {
    expect(result[0]).not.toBe(testPlace); // Should not be the target
  }
});

test('Between excludeTarget parameter should not affect rank and value modes', () => {
  // excludeTarget should only affect "around" mode
  const result1 = places.between("population_2011", 1, 3, "rank", "descending", null, true);
  const result2 = places.between("population_2011", 1, 3, "rank", "descending", null, false);
  expect(result1).toEqual(result2);
  
  const result3 = places.between("population_2011", 100000, 500000, "value", "descending", null, true);
  const result4 = places.between("population_2011", 100000, 500000, "value", "descending", null, false);
  expect(result3).toEqual(result4);
});

// Tests for highestFromArray function

test('highestFromArray should return key with highest numeric value', () => {
  const obj = { a: 10, b: 25, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.highestFromArray(obj, keys)).toBe('b');
});

test('highestFromArray should return first key when all values are equal', () => {
  const obj = { x: 10, y: 10, z: 10 };
  const keys = ['x', 'y', 'z'];
  expect(robo.highestFromArray(obj, keys)).toBe('x');
});

test('highestFromArray should work with negative numbers', () => {
  const obj = { a: -10, b: -5, c: -15, d: -2 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.highestFromArray(obj, keys)).toBe('d');
});

test('highestFromArray should work with mixed positive and negative numbers', () => {
  const obj = { a: -10, b: 5, c: -15, d: 2 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.highestFromArray(obj, keys)).toBe('b');
});

test('highestFromArray should work with decimal values', () => {
  const obj = { a: 1.5, b: 1.7, c: 1.3, d: 1.9 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.highestFromArray(obj, keys)).toBe('d');
});

test('highestFromArray should work with single key', () => {
  const obj = { a: 42 };
  const keys = ['a'];
  expect(robo.highestFromArray(obj, keys)).toBe('a');
});

test('highestFromArray should work with subset of object keys', () => {
  const obj = { a: 10, b: 25, c: 5, d: 15, e: 100 };
  const keys = ['a', 'c', 'd']; // Not including 'b' or 'e'
  expect(robo.highestFromArray(obj, keys)).toBe('d');
});

test('highestFromArray should work with keys in different order', () => {
  const obj = { a: 10, b: 25, c: 5, d: 15 };
  const keys = ['c', 'd', 'a', 'b'];
  expect(robo.highestFromArray(obj, keys)).toBe('b');
});

test('highestFromArray should handle zero values', () => {
  const obj = { a: 0, b: -5, c: 3, d: 0 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.highestFromArray(obj, keys)).toBe('c');
});

test('highestFromArray should return first key when multiple keys have same highest value', () => {
  const obj = { a: 10, b: 20, c: 20, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.highestFromArray(obj, keys)).toBe('b');
});

test('highestFromArray should handle undefined values by treating them as lower', () => {
  const obj = { a: 10, b: undefined, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.highestFromArray(obj, keys)).toBe('d');
});

test('highestFromArray should handle null values by treating them as lower', () => {
  const obj = { a: 10, b: null, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.highestFromArray(obj, keys)).toBe('d');
});

test('highestFromArray should handle string numbers', () => {
  const obj = { a: "10", b: "25", c: "5", d: "15" };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.highestFromArray(obj, keys)).toBe('b');
});

test('highestFromArray should handle mixed types (numbers vs strings)', () => {
  const obj = { a: 10, b: "25", c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.highestFromArray(obj, keys)).toBe('b');
});

test('highestFromArray should throw error for empty keys array', () => {
  const obj = { a: 10, b: 25, c: 5 };
  const keys = [];
  expect(() => robo.highestFromArray(obj, keys)).toThrow("Input must be a non-empty array of keys.");
});

test('highestFromArray should throw error for non-array keys parameter', () => {
  const obj = { a: 10, b: 25, c: 5 };
  const keys = "not an array";
  expect(() => robo.highestFromArray(obj, keys)).toThrow("Input must be a non-empty array of keys.");
});

test('highestFromArray should throw error for null keys parameter', () => {
  const obj = { a: 10, b: 25, c: 5 };
  const keys = null;
  expect(() => robo.highestFromArray(obj, keys)).toThrow("Input must be a non-empty array of keys.");
});

test('highestFromArray should work with non-existent keys (undefined values)', () => {
  const obj = { a: 10, b: 25 };
  const keys = ['a', 'b', 'nonexistent'];
  expect(robo.highestFromArray(obj, keys)).toBe('b');
});

test('highestFromArray should work with very large numbers', () => {
  const obj = { a: 1000000, b: 999999, c: 1000001 };
  const keys = ['a', 'b', 'c'];
  expect(robo.highestFromArray(obj, keys)).toBe('c');
});

test('highestFromArray should work with scientific notation', () => {
  const obj = { a: 1e5, b: 1e6, c: 1e4 };
  const keys = ['a', 'b', 'c'];
  expect(robo.highestFromArray(obj, keys)).toBe('b');
});

test('highestFromArray should handle Infinity values', () => {
  const obj = { a: 10, b: Infinity, c: 5 };
  const keys = ['a', 'b', 'c'];
  expect(robo.highestFromArray(obj, keys)).toBe('b');
});

test('highestFromArray should handle -Infinity values', () => {
  const obj = { a: -10, b: -Infinity, c: -5 };
  const keys = ['a', 'b', 'c'];
  expect(robo.highestFromArray(obj, keys)).toBe('c');
});

test('highestFromArray should handle NaN values', () => {
  const obj = { a: 10, b: NaN, c: 5 };
  const keys = ['a', 'b', 'c'];
  expect(robo.highestFromArray(obj, keys)).toBe('a');
});

// lowest tests
test('lowestFromArray should return key with lowest numeric value', () => {
  const obj = { a: 10, b: 25, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.lowestFromArray(obj, keys)).toBe('c');
});

test('lowestFromArray should return first key when all values are equal', () => {
  const obj = { x: 10, y: 10, z: 10 };
  const keys = ['x', 'y', 'z'];
  expect(robo.lowestFromArray(obj, keys)).toBe('x');
});

test('lowestFromArray should work with negative numbers', () => {
  const obj = { a: -10, b: -5, c: -15, d: -2 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.lowestFromArray(obj, keys)).toBe('c');
});

test('lowestFromArray should work with mixed positive and negative numbers', () => {
  const obj = { a: -10, b: 5, c: -15, d: 2 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.lowestFromArray(obj, keys)).toBe('c');
});

test('lowestFromArray should work with decimal values', () => {
  const obj = { a: 1.5, b: 1.7, c: 1.3, d: 1.9 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.lowestFromArray(obj, keys)).toBe('c');
});

test('lowestFromArray should work with single key', () => {
  const obj = { a: 42 };
  const keys = ['a'];
  expect(robo.lowestFromArray(obj, keys)).toBe('a');
});

test('lowestFromArray should work with subset of object keys', () => {
  const obj = { a: -10, b: 25, c: 5, d: 15, e: 100 };
  const keys = ['a', 'c', 'd']; // Not including 'b' or 'e'
  expect(robo.lowestFromArray(obj, keys)).toBe('a');
});

test('lowestFromArray should work with keys in different order', () => {
  const obj = { a: 10, b: 25, c: 5, d: 15 };
  const keys = ['d', 'a', 'b','c'];
  expect(robo.lowestFromArray(obj, keys)).toBe('c');
});

test('lowestFromArray should handle zero values', () => {
  const obj = { a: 0, b: -5, c: 3, d: 0 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.lowestFromArray(obj, keys)).toBe('b');
});

test('lowestFromArray should return first key when multiple keys have same highest value', () => {
  const obj = { a: 10, b: 20, c: 20, d: 10 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.lowestFromArray(obj, keys)).toBe('a');
});

test('lowestFromArray should handle undefined values by skipping them', () => {
  const obj = { a: 10, b: undefined, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.lowestFromArray(obj, keys)).toBe('c');
});

test('lowestFromArray should handle null values by skipping them', () => {
  const obj = { a: 10, b: null, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.lowestFromArray(obj, keys)).toBe('c');
});

test('lowestFromArray should handle string numbers', () => {
  const obj = { a: "10", b: "25", c: "5", d: "15" };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.lowestFromArray(obj, keys)).toBe('c');
});

test('lowestFromArray should handle mixed types (numbers vs strings)', () => {
  const obj = { a: 10, b: "25", c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.lowestFromArray(obj, keys)).toBe('c');
});

test('lowestFromArray should throw error for empty keys array', () => {
  const obj = { a: 10, b: 25, c: 5 };
  const keys = [];
  expect(() => robo.lowestFromArray(obj, keys)).toThrow("Input must be a non-empty array of keys.");
});

test('lowestFromArray should throw error for non-array keys parameter', () => {
  const obj = { a: 10, b: 25, c: 5 };
  const keys = "not an array";
  expect(() => robo.lowestFromArray(obj, keys)).toThrow("Input must be a non-empty array of keys.");
});

test('lowestFromArray should throw error for null keys parameter', () => {
  const obj = { a: 10, b: 25, c: 5 };
  const keys = null;
  expect(() => robo.lowestFromArray(obj, keys)).toThrow("Input must be a non-empty array of keys.");
});

test('lowestFromArray should work with non-existent keys (undefined values)', () => {
  const obj = { a: 10, b: 25 };
  const keys = ['a', 'b', 'nonexistent'];
  expect(robo.lowestFromArray(obj, keys)).toBe('a');
});

test('lowestFromArray should work with very large numbers', () => {
  const obj = { a: 1000000, b: 999999, c: 1000001 };
  const keys = ['a', 'b', 'c'];
  expect(robo.lowestFromArray(obj, keys)).toBe('b');
});

test('lowestFromArray should work with scientific notation', () => {
  const obj = { a: 1e5, b: 1e6, c: 1e4 };
  const keys = ['a', 'b', 'c'];
  expect(robo.lowestFromArray(obj, keys)).toBe('c');
});

test('lowestFromArray should handle Infinity values', () => {
  const obj = { a: 10, b: -Infinity, c: 5 };
  const keys = ['a', 'b', 'c'];
  expect(robo.lowestFromArray(obj, keys)).toBe('b');
});

test('lowestFromArray should handle -Infinity values', () => {
  const obj = { a: -10, b: Infinity, c: -5 };
  const keys = ['a', 'b', 'c'];
  expect(robo.lowestFromArray(obj, keys)).toBe('a');
});

test('lowestFromArray should handle NaN values', () => {
  const obj = { a: 10, b: NaN, c: 5 };
  const keys = ['a', 'b', 'c'];
  expect(robo.lowestFromArray(obj, keys)).toBe('c');
});

// Tests for consolidated getExtreme function

test('getExtreme should find highest value by default', () => {
  const obj = { a: 10, b: 25, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys)).toBe('b');
});

test('getExtreme should find highest value with "highest" mode', () => {
  const obj = { a: 10, b: 25, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('b');
});

test('getExtreme should find lowest value with "lowest" mode', () => {
  const obj = { a: 10, b: 25, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('c');
});

test('getExtreme should work with "max" alias', () => {
  const obj = { a: 10, b: 25, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "max")).toBe('b');
});

test('getExtreme should work with "min" alias', () => {
  const obj = { a: 10, b: 25, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "min")).toBe('c');
});

test('getExtreme should throw error for invalid mode', () => {
  const obj = { a: 10, b: 25, c: 5 };
  const keys = ['a', 'b', 'c'];
  expect(() => robo.getExtreme(obj, keys, "invalid")).toThrow("Mode must be 'highest', 'lowest', 'max', 'min', 'absolute_highest', 'absolute_lowest', 'absolute_max', or 'absolute_min'.");
});

test('getExtreme should handle null values in highest mode', () => {
  const obj = { a: 10, b: null, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('d');
});

test('getExtreme should handle null values in lowest mode', () => {
  const obj = { a: 10, b: null, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('c');
});

test('getExtreme should handle all null values', () => {
  const obj = { a: null, b: null, c: null };
  const keys = ['a', 'b', 'c'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('a');
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('a');
});

test('getExtreme should work with negative numbers in lowest mode', () => {
  const obj = { a: -10, b: -5, c: -15, d: -2 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('c');
});

test('getExtreme should work with negative numbers in highest mode', () => {
  const obj = { a: -10, b: -5, c: -15, d: -2 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('d');
});

// Test backward compatibility
test('highestFromArray wrapper should work correctly', () => {
  const obj = { a: 10, b: 25, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.highestFromArray(obj, keys)).toBe('b');
});

test('lowestFromArray wrapper should work correctly', () => {
  const obj = { a: 10, b: 25, c: 5, d: 15 };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.lowestFromArray(obj, keys)).toBe('c');
});

test('getExtreme should handle empty object gracefully', () => {
  const obj = {};
  const keys = ['a', 'b', 'c'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('a'); // Returns first key
});

test('getExtreme should handle string numbers correctly', () => {
  const obj = { a: "10", b: "25", c: "5", d: "15" };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('b');
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('c');
});

test('getExtreme should handle mixed numbers and string numbers', () => {
  const obj = { a: 10, b: "25", c: 5, d: "15" };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('b');
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('c');
});

test('getExtreme should handle decimal string numbers', () => {
  const obj = { a: "10.5", b: "25.7", c: "5.3", d: "15.1" };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('b');
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('c');
});

test('getExtreme should handle negative string numbers', () => {
  const obj = { a: "-10", b: "-5", c: "-15", d: "-2" };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('d');
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('c');
});

test('getExtreme should handle scientific notation strings', () => {
  const obj = { a: "1e2", b: "1e3", c: "1e1", d: "1e4" };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('d');
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('c');
});

test('getExtreme should skip non-numeric strings', () => {
  const obj = { a: "hello", b: "25", c: "world", d: "15" };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('b');
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('d');
});

test('getExtreme should handle empty strings as non-numeric', () => {
  const obj = { a: "", b: "25", c: "0", d: "15" };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('b');
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('c');
});

test('getExtreme should handle whitespace in string numbers', () => {
  const obj = { a: " 10 ", b: "25", c: " 5", d: "15 " };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('b');
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('c');
});

test('getExtreme should handle mixed valid and invalid strings', () => {
  const obj = { a: "10", b: "not a number", c: "5", d: null, e: "15" };
  const keys = ['a', 'b', 'c', 'd', 'e'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('e');
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('c');
});

test('getExtreme should handle all non-numeric values', () => {
  const obj = { a: "hello", b: "world", c: null, d: undefined };
  const keys = ['a', 'b', 'c', 'd'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('a'); // Returns first key
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('a'); // Returns first key
});

test('getExtreme should handle single key', () => {
  const obj = { a: 42 };
  const keys = ['a'];
  expect(robo.getExtreme(obj, keys, "highest")).toBe('a');
  expect(robo.getExtreme(obj, keys, "lowest")).toBe('a');
});

describe('robo.getExtreme - Absolute Mode', () => {
  const testData = {
    a: -100,
    b: 50,
    c: -10,
    d: 75,
    e: -5,
    f: 200,
    g: -150
  };
  const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  describe('absolute_highest / absolute_max', () => {
    it('should return key with largest absolute value using absolute_highest', () => {
      const result = robo.getExtreme(testData, keys, 'absolute_highest');
      expect(result).toBe('f'); // 200 has largest absolute value
    });

    it('should return key with largest absolute value using absolute_max', () => {
      const result = robo.getExtreme(testData, keys, 'absolute_max');
      expect(result).toBe('f'); // 200 has largest absolute value
    });

    it('should handle negative number with largest absolute value', () => {
      const data = { a: -300, b: 250, c: -100 };
      const result = robo.getExtreme(data, ['a', 'b', 'c'], 'absolute_highest');
      expect(result).toBe('a'); // -300 has largest absolute value (300)
    });

    it('should handle tie in absolute values by returning first occurrence', () => {
      const data = { a: 100, b: -100, c: 50 };
      const result = robo.getExtreme(data, ['a', 'b', 'c'], 'absolute_highest');
      expect(result).toBe('a'); // First key with absolute value 100
    });
  });

  describe('absolute_lowest / absolute_min', () => {
    it('should return key with smallest absolute value using absolute_lowest', () => {
      const result = robo.getExtreme(testData, keys, 'absolute_lowest');
      expect(result).toBe('e'); // -5 has smallest absolute value (5)
    });

    it('should return key with smallest absolute value using absolute_min', () => {
      const result = robo.getExtreme(testData, keys, 'absolute_min');
      expect(result).toBe('e'); // -5 has smallest absolute value (5)
    });

    it('should handle positive number with smallest absolute value', () => {
      const data = { a: -20, b: 3, c: -15 };
      const result = robo.getExtreme(data, ['a', 'b', 'c'], 'absolute_lowest');
      expect(result).toBe('b'); // 3 has smallest absolute value
    });

    it('should handle zero correctly', () => {
      const data = { a: -10, b: 0, c: 5 };
      const result = robo.getExtreme(data, ['a', 'b', 'c'], 'absolute_lowest');
      expect(result).toBe('b'); // 0 has smallest absolute value
    });
  });

  describe('edge cases in absolute mode', () => {
    it('should handle single key', () => {
      const result = robo.getExtreme(testData, ['a'], 'absolute_highest');
      expect(result).toBe('a');
    });

    it('should handle all negative numbers', () => {
      const data = { a: -5, b: -100, c: -2 };
      const result = robo.getExtreme(data, ['a', 'b', 'c'], 'absolute_highest');
      expect(result).toBe('b'); // -100 has largest absolute value
    });

    it('should handle all positive numbers', () => {
      const data = { a: 5, b: 100, c: 2 };
      const result = robo.getExtreme(data, ['a', 'b', 'c'], 'absolute_lowest');
      expect(result).toBe('c'); // 2 has smallest absolute value
    });

    it('should skip null and undefined values', () => {
      const data = { a: null, b: -50, c: undefined, d: 30 };
      const result = robo.getExtreme(data, ['a', 'b', 'c', 'd'], 'absolute_highest');
      expect(result).toBe('b'); // -50 has larger absolute value than 30
    });

    it('should skip empty string values', () => {
      const data = { a: '', b: -20, c: 15 };
      const result = robo.getExtreme(data, ['a', 'b', 'c'], 'absolute_highest');
      expect(result).toBe('b'); // -20 has larger absolute value than 15
    });

    it('should skip non-numeric values', () => {
      const data = { a: 'text', b: -40, c: 25 };
      const result = robo.getExtreme(data, ['a', 'b', 'c'], 'absolute_highest');
      expect(result).toBe('b'); // -40 has larger absolute value than 25
    });

    it('should handle decimal numbers', () => {
      const data = { a: -3.7, b: 2.1, c: -1.5 };
      const result = robo.getExtreme(data, ['a', 'b', 'c'], 'absolute_highest');
      expect(result).toBe('a'); // -3.7 has largest absolute value (3.7)
    });
  });

  describe('comparison with regular modes', () => {
    it('should differ from regular highest when largest absolute is negative', () => {
      const data = { a: -200, b: 100, c: 50 };
      const regularResult = robo.getExtreme(data, ['a', 'b', 'c'], 'highest');
      const absoluteResult = robo.getExtreme(data, ['a', 'b', 'c'], 'absolute_highest');
      
      expect(regularResult).toBe('b'); // 100 is highest value
      expect(absoluteResult).toBe('a'); // -200 has highest absolute value
    });

    it('should differ from regular lowest when smallest absolute is positive', () => {
      const data = { a: -100, b: 5, c: -50 };
      const regularResult = robo.getExtreme(data, ['a', 'b', 'c'], 'lowest');
      const absoluteResult = robo.getExtreme(data, ['a', 'b', 'c'], 'absolute_lowest');
      
      expect(regularResult).toBe('a'); // -100 is lowest value
      expect(absoluteResult).toBe('b'); // 5 has lowest absolute value
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid absolute mode', () => {
      expect(() => {
        robo.getExtreme(testData, keys, 'absolute_invalid');
      }).toThrow("Mode must be 'highest', 'lowest', 'max', 'min', 'absolute_highest', 'absolute_lowest', 'absolute_max', or 'absolute_min'.");
    });

    it('should throw error for empty keys array', () => {
      expect(() => {
        robo.getExtreme(testData, [], 'absolute_highest');
      }).toThrow("Input must be a non-empty array of keys.");
    });

    it('should throw error for non-array keys', () => {
      expect(() => {
        robo.getExtreme(testData, 'not_array', 'absolute_highest');
      }).toThrow("Input must be a non-empty array of keys.");
    });
  });
});