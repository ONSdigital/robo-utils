import { csvParse } from "d3-dsv";
import { formatLocale } from "d3-format";
import { roundTo } from "round-to";
import * as articles from "articles";
import converter from './number-to-words.js';
import MagicNumber from "./magic-number.js";
import MagicObject from "./magic-object.js";
import MagicArray from "./magic-array.js";

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
		else if (key.slice(-6) === "_array" || value.includes("|")) {
			value = typeof value === "string" ? value.split("|") : [];
			if (!value[value.length - 1]) value.pop();
		}
    else continue;
    object[key] = value;
  }
  return new MagicObject(object);
}

export const isNumeric = (val) => isFinite(val) && val !== null;

export const round = roundTo;

export const abs = (val) => new MagicNumber(Math.abs(val));

export function format(val, str = ",", si = "long") {
	let dp = str.match(/-\d+(?=f)/)?.[0];
	let output;
	if (isNumeric(dp)) output = f(str.replace(`${dp}`, "0"))(round(val, +dp));
	else output = f(str)(val);
	if (si === "long") output = output.replace("k", " thousand").replace("M", " million").replace("G", " billion").replace("T", " trillion");
	else output = output.replace("M", "mn").replace("G", "bn").replace("T", "tn");
	return output;
}

export function toWords(val, type = "cardinal", options = {threshold: 9, dropFirst: false}) {
	const threshold = options.threshold || 9;
	const dropFirst = options.dropFirst && type === "ordinal";
	const isWords = val <= threshold || threshold === -1;
	return +val === 1 && dropFirst ? "" :
		isWords && type === "ordinal" ? converter.toWordsOrdinal(val) :
		type === "ordinal" ? converter.toOrdinal(val) :
		isWords ? converter.toWords(val) :
		format(Math.floor(val));
}

export function toList (array, key, separator = [", ", " and "]) {
	const map = typeof key === "function" ? key : (d) => d[key];
	const words = array.map(map);
	return words.length < 2 ? words.join() :
		Array.isArray(separator) ?
		[
			...[words.slice(0, -1).join(separator[0])],
			...words.slice(-1)
		].join(separator[1 % separator.length]) :
		words.join(separator);
}

// If mode !== "default", function only returns prefix
export function formatName(name, context = null, mode = "default") {
	if (name === "East") name = "East of England";
  name = name.replace("&", "and").replace(", City of", "").replace(", County of", "");
	let prefix = "";
	let lc = name.toLowerCase();
  let island = lc.startsWith("isle");
  let the = [
    "united kingdom", "north east", "north west", "east midlands", "west midlands",
		"east of england", "south east", "south west", "derbyshire dales"
  ].includes(lc) || 
    lc.startsWith("city of") || 
    lc.startsWith("vale of");
  if (["in", "the", "its"].includes(context)) {
    if (island || the) prefix = "the ";
  }
  if (context === "in") {
    if (island) prefix = "on " + prefix;
    else prefix = "in " + prefix;
  } else if (context === "its") {
		name = name + (name.slice(-1) === "s" ? "'" : "'s");
	}
  return mode === "default" ? prefix + name : prefix.slice(0, -1);
}

export function getCodeKey(obj) {
	const keys = Object.keys(obj);
	const lc = keys.map(key => key.toLowerCase());
	for (let key of ["areacd", "code", "id"]) {
		let i = lc.indexOf(key);
		if (i > -1) return keys[i];
	}
	let key = lc.find(key => key.toLowerCase().slice(-2) === "cd");
	return key ? key : keys[0];
}

export function getNameKey(obj) {
	const keys = Object.keys(obj);
	const lc = keys.map(key => key.toLowerCase());
	for (let key of ["hclnm", "areanm", "name", "label", "areacd"]) {
		let i = lc.indexOf(key);
		if (i > -1) return keys[i];
	}
	let key = lc.find(key => key.toLowerCase().slice(-2) === "nm");
	return key ? key : keys[0];
}

export function getParentKey(obj) {
	const keys = Object.keys(obj);
	const lc = keys.map(key => key.toLowerCase());
	for (let key of ["parentcd", "parent", "regioncd", "region"]) {
		let i = lc.indexOf(key);
		if (i > -1) return keys[i];
	};
	return null;
}

export function getName(place, context = null, mode = "default") {
	const nameKey = getNameKey(place);
	return formatName(place[nameKey], context, mode);
}

export function getCode(place) {
	const codeKey = getCodeKey(place);
	return place[codeKey];
}

export function getParent(place) {
	const parentKey = getParentKey(place);
	return place[parentKey];
}

export function moreLess(diff, texts = ["more", "less", "same"]) {
	return diff > 0 ? texts[0] : diff < 0 ? texts[1] : texts[2];
}

export function breaksToWords(value, breaks = [0], texts = ["less", "more"], quantifier = null) {
	if (quantifier && value === breaks[breaks.length - 1]) return `${quantifier} ${texts[texts.length - 2]}`;
	for (let i = 0; i < breaks.length; i ++) {
		if (quantifier && value === breaks[i]) return `${quantifier} ${texts[i + 1]}`;
		if (value <= breaks[i]) return texts[i];
	}
	return texts[texts.length - 1];
}

export function capitalise(str) {
  return str[0] ? str[0].toUpperCase() + str.slice(1) : str;
}

export function toData(arr, props, mode = null) {
	let _props = [];
	Object.keys(props).forEach(prop => {
		if (props[prop]) _props.push({
			key: prop,
			value: props[prop],
			type: Array.isArray(props[prop]) && !props[prop].every(val => arr[0][val]) ? "label": "key"
		});
	});
	const propsUni = _props.filter(p => typeof p.value === "string")
	const propsMulti = _props.filter(p => Array.isArray(p.value));
	let data = [];
	arr.forEach(d => {
		let row = {};
		let rows = [];
		propsUni.forEach(p => row[p.key] = d[p.value]);
		if (propsMulti[0]) {
			for (let i = 0; i < propsMulti[0].value.length; i++) {
				let rowNew = {...row};
				propsMulti.forEach(p => rowNew[p.key] = p.type === "label" ? p.value[i] : d[p.value[i]]);
				rows.push(rowNew);
			}
		}
		if (rows[0]) data = [...data, ...rows];
		else data.push(row);
	});
	return mode === "protect" ? `§${JSON.stringify(data)}§` :
    mode === "stringify" ? JSON.stringify(data) :
    data;
}

export async function getData(url) {
	const data = csvParse(await (await fetch(url)).text(), autoType);
	return new MagicArray(...data);
}

export function ascending(a, b) {
	return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

export function descending(a, b) {
	return a == null || b == null ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
}

export function addToArray(arr, items) {
	const arr_new = [...arr];
	const _items = Array.isArray(items) ? items : [items];
	const codeKey = getCodeKey(_items[0]);
	for (const item of _items) {
		if (!arr_new.map(d => d[codeKey]).includes(item[codeKey])) arr_new.push(item);
	}
	return arr_new;
}

export function removeFromArray(arr, items) {
	const _items = Array.isArray(items) ? items : [items];
	const codeKey = getCodeKey(_items[0]);
	const codes = _items.map(d => d[codeKey]);
	return arr.filter(d => !codes.includes(d[codeKey]));
}

// If mode !== "default", function only returns article
export const aAn = (str, mode = "default") => mode === "default" ?
	`${articles.find(str)} ${str}` :
	articles.find(str);