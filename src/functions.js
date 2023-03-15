import { formatLocale } from "d3-format";
import converter from "number-to-words";
import MagicNumber from "./magic-number.js";
import MagicObject from "./magic-object.js";

const f = formatLocale({
	"decimal": ".",
  "thousands": ",",
  "grouping": [3],
  "currency": ["£", ""]
}).format;

// Adapted from d3.autoType
export function autoType(object) {
	const fixtz = new Date("2019-01-01T00:00").getHours() || new Date("2019-07-01T00:00").getHours();
  for (var key in object) {
    var value = object[key].trim(), number, m;
    if (!value) value = null;
    else if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (value === "NaN") value = NaN;
    else if (!isNaN(number = +value)) value = new MagicNumber(number);
    else if (m = value.match(/^([-+]\d{2})?\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[-+]\d{2}:\d{2})?)?$/)) {
      if (fixtz && !!m[4] && !m[7]) value = value.replace(/-/g, "/").replace(/T/, " ");
      value = new Date(value);
    }
    else continue;
    object[key] = value;
  }
  return new MagicObject(object);
}

export function round(val, dp) {
	let divisor = Math.pow(10, dp);
	return Math.round(val * divisor) / divisor;
}

export function format(val, str = ",", si = "long") {
	let dp = str.match(/-\d+(?=f)/);
	let output;
	if (dp) output = f(str.replace(`${dp}`, "0"))(round(val, dp));
	else output = f(str)(val);
	if (si === "long") output = output.replace("k", " thousand").replace("M", " million").replace("G", " billion").replace("T", " trillion");
	else output = output.replace("M", "mn").replace("G", "bn").replace("T", "tn");
	return output;
}

export function toWords(val, type = "cardinal", dropFirst = true, threshold = 9) {
	return dropFirst && val === 1 && type === "ordinal" ? "" :
		val <= threshold && type === "ordinal" ? converter.toWordsOrdinal(val) :
		type === "ordinal" ? converter.toOrdinal(val) :
		val <= threshold ? converter.toWords(val) :
		format(Math.floor(val));
}

export function formatName(name, context = null) {
  name = name.replace("&", "and").replace(", City of", "").replace(", County of", "");
	let lc = name.toLowerCase();
  let island = lc.startsWith("isle");
  let the = [
    "north east", "north west", "east midlands", "west midlands", "east of england", "south east",
		"south west", "derbyshire dales"
  ].includes(lc) || 
    lc.startsWith("city of") || 
    lc.startsWith("vale of");
  if (["in", "the"].includes(context)) {
    if (island || the) name = "the " + name;
  }
  if (context === "in") {
    if (island) name = "on " + name;
    else name = "in " + name;
  }
  return name;
}

export function getCodeKey(obj) {
	return Object.keys(obj)
		.find(key => key.toLowerCase() === "areacd" || key.toLowerCase() === "code" || key.toLowerCase().slice(-2) === "cd");
}

export function getNameKey(obj) {
	return Object.keys(obj)
		.find(key => key.toLowerCase() === "hclnm" || key.toLowerCase() === "areanm" || key.toLowerCase() === "name" || key.toLowerCase().slice(-2) === "nm");
}

export function getName(place, context = null) {
	let nameKey = getNameKey(place);
	return formatName(place[nameKey], context);
}

export function getCode(place) {
	let codeKey = getCodeKey(place);
	return place[codeKey];
}

export function moreLess(diff, texts = ["more", "less", "the same"]) {
	return diff > 0 ? texts[0] : diff < 0 ? texts[1] : texts[2];
}

export function capitalise(str) {
  return str[0].toUpperCase() + str.slice(1);
}