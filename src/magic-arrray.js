import { getCodeKey } from "./functions.js";
import MagicNumber from "./magic-number.js";

export default class MagicArray extends Array {
	sortBy(key, order = "ascending") {
		return new MagicArray(...this)
			.sort((a, b) => order === "ascending" ?
						a[key] == null || b[key] == null ? NaN : a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : a[key] >= b[key] ? 0 : NaN :
						a[key] == null || b[key] == null ? NaN : b[key] < a[key] ? -1 : b[key] > a[key] ? 1 : b[key] >= a[key] ? 0 : NaN);
	}
	getRank(item, key, order = "descending") {
		const codeKey = getCodeKey(item);
		if (!codeKey) codeKey = Object.keys(item)[0];
		const sorted = this.sortBy(key, order);
		return new MagicNumber(sorted.map(d => d[codeKey]).indexOf(item[codeKey]) + 1);
	}
	filterBy(key, val) {
		return this.filter(d => d[key] === val);
	}
	ascending(key) {
		return this.sortBy(key, "ascending");
	}
	descending(key) {
		return this.sortBy(key, "descending");
	}
	top(key, n = 1) {
		const sorted = this.sortBy(key, "descending");
		return n === 1 ? sorted[0] : sorted.slice(0, n);
	}
	bottom(key, n = 1) {
		const sorted = this.sortBy(key, "ascending");
		return n === 1 ? sorted[0] : sorted.slice(0, n);
	}
	trim(n) {
		return n >= 0 ?
			this.slice(0, Math.floor(n)) :
			this.slice(Math.floor(n));
	}
	flip() {
		return new MagicArray(...this).reverse();
	}
}