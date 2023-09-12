import MagicNumber from "./magic-number.js";
import { toList, toData, ascending, descending, addToArray } from "./functions.js";

export default class MagicArray extends Array {
	sortBy(key, order = "ascending") {
		return order === "ascending" ? this.ascending(key) : this.descending(key);
	}
	filterBy(key, val) {
		return new MagicArray(...this.filter(d => d[key] === val));
	}
	toList (key, separator = [", ", " and "]) {
		return toList(this, key, separator);
	}
	toData (props, mode = null) {
		return toData(this, props, mode);
	}
	getRank(item, key, order = "descending") {
		const sorted = this.sortBy(key, order);
		return new MagicNumber(sorted.map(d => d[key]).indexOf(item[key]) + 1);
	}
	ascending(key) {
		return new MagicArray(...[...this].sort((a, b) => ascending(a[key], b[key])));
	}
	descending(key) {
		return new MagicArray(...[...this].sort((a, b) => descending(a[key], b[key])));
	}
	top(key, n = 1, add = null) {
		const sorted = this.descending(key);
		const sliced = sorted.slice(0, n);
		if (add) {
			addToArray(sliced, add);
		}
		return sliced.length === 1 ? sliced[0] :
			sliced.length === n ? sliced :
			sliced.descending(key);
	}
	bottom(key, n = 1, add = null) {
		const sorted = this.descending(key);
		const sliced = sorted.slice(-n);
		if (add) {
			addToArray(sliced, add);
		}
		return sliced.length === 1 ? sliced[0] :
			sliced.length === n ? sliced :
			sliced.descending(key);
	}
	trim(n) {
		return n >= 0 ?
			this.slice(0, Math.floor(n)) :
			this.slice(Math.floor(n));
	}
	flip() {
		return new MagicArray(...[...this].reverse());
	}
}