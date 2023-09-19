import MagicNumber from "./magic-number.js";
import { toList, toData, ascending, descending, addToArray, removeFromArray } from "./functions.js";

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
	add(items) {
		return new MagicArray(...addToArray(this, items));
	}
	remove(items) {
		return new MagicArray(...removeFromArray(this, items));
	}
	ascending(key) {
		return new MagicArray(...[...this].sort((a, b) => ascending(a[key], b[key])));
	}
	descending(key) {
		return new MagicArray(...[...this].sort((a, b) => descending(a[key], b[key])));
	}
	top(key, n = 1, add = null) {
		let sorted = this.descending(key).slice(0, n);
		if (add) {
			sorted = sorted.add(add);
		}
		return sorted.length === 1 ? sorted[0] :
			sorted.length === n ? sorted :
			sorted.descending(key);
	}
	bottom(key, n = 1, add = null) {
		let sorted = this.descending(key).slice(-n);
		if (add) {
			sorted = sorted.add(add);
		}
		return sorted.length === 1 ? sorted[0] :
			sorted.length === n ? sorted :
			sorted.descending(key);
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