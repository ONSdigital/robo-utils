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

test('toWords(1, "ordinal") should be ""', () => {
  expect(robo.toWords(1, "ordinal")).toBe("");
});

test('10 toWords(10, "ordinal") should be "10th"', () => {
  expect(robo.toWords(10, "ordinal")).toBe("10th");
});

test('Ordinal rank for Birmingham population should be ""', () => {
  expect(places.getRank(lookup["Birmingham"], "population_2011").toWords("ordinal")).toBe("");
});

test('Top two places by population plus Rutland', () => {
  expect(places.top("population_2011", 2, lookup["Rutland"])).toEqual([lookup["Birmingham"], lookup["Leeds"], lookup["Rutland"]]);
});

test('Bottom two places by population plus Rutland', () => {
  expect(places.bottom("population_2011", 2, lookup["Rutland"])).toEqual([lookup["Rutland"], lookup["City of London"], lookup["Isles of Scilly"]]);
});
