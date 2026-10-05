import MagicArray from "../src/magic-array.js";
import { csvParse } from "../src/functions.js";
import data_raw from "./data.js";

// Local authorities from the 2011 census test data, sorted by name
export const places = MagicArray.from(csvParse(data_raw))
	.filter((d) => ["E06", "E07", "E08", "E09", "W06"].includes(d.areacd.slice(0, 3)))
	.sortBy("areanm");

export const names = (arr) => [...arr].map((d) => d.areanm);
