import { expect, test } from 'vitest'
import { csvParse } from 'd3-dsv';
import MagicArray from '../src/magic-array.js';
import * as robo from "./src/functions.js";
import data_raw from "./data.js";

const data = new MagicArray(...csvParse(data_raw, robo.autoType));
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
