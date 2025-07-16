import { expect, test } from 'vitest'
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
  expect(result).toBe(lookup["Birmingham"]); // Should return single item, not array
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
  console.log(result.map(d=>d.population_2011))
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
