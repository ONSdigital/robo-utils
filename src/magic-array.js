import MagicNumber from "./magic-number.js";

export default class MagicArray extends Array {
	sortBy(key, order = "ascending") {
		return new MagicArray(...this)
			.sort((a, b) => order === "ascending" ?
						a[key] == null || b[key] == null ? NaN : a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : a[key] >= b[key] ? 0 : NaN :
						a[key] == null || b[key] == null ? NaN : b[key] < a[key] ? -1 : b[key] > a[key] ? 1 : b[key] >= a[key] ? 0 : NaN);
	}
	filterBy(key, val) {
		return this.filter(d => d[key] === val);
	}
	toList (key, separator = [", ", " and "]) {
		const words = this.map(d => d[key]);
		return words.length < 2 ? words.join() :
			Array.isArray(separator) ?
			[
				...[words.slice(0, -1).join(separator[0])],
				...words.slice(-1)
			].join(separator[1 % separator.length]) :
			words.join(separator);
	}
	getRank(item, key, order = "descending") {
		const sorted = this.sortBy(key, order);
		return new MagicNumber(sorted.map(d => d[key]).indexOf(item[key]) + 1);
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