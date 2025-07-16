import MagicNumber from "./magic-number.js";
import { toList, toData, ascending, descending, addToArray, removeFromArray } from "./functions.js";

export default class MagicArray extends Array {
	sortBy(key, order = "ascending") {
		return order === "ascending" ? this.ascending(key) : this.descending(key);
	}
	filterBy(key, val) {
		return this.filter(d => d[key] === val);
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
		return addToArray(MagicArray.from(this), items);
	}
	remove(items) {
		return removeFromArray(this, items);
	}
	ascending(key) {
		return MagicArray.from(this).sort((a, b) => ascending(a[key], b[key]));
	}
	descending(key) {
		return MagicArray.from(this).sort((a, b) => descending(a[key], b[key]));
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
	between(key, start, end, mode = "rank", order = "descending", add = null) {
		let result;
		
		if (mode === "rank") {
			// Get items between specific ranks
			const sorted = this.sortBy(key, order);
			const startIndex = Math.max(0, start - 1); // Convert to 0-based index
			const endIndex = Math.min(sorted.length, end); // Inclusive end
			result = MagicArray.from(sorted.slice(startIndex, endIndex));
		} else if (mode === "value") {
			// Get items between specific values
			const minVal = Math.min(start, end);
			const maxVal = Math.max(start, end);
			result = MagicArray.from(this.filter(d => d[key] >= minVal && d[key] <= maxVal));
			result = result.sortBy(key, order);
		} else if (mode === "around") {
			// Get items around a specific item's rank
			const targetItem = start; // start is the target item
			const range = end; // end is the range (+/- positions)
			const targetRank = this.getRank(targetItem, key, order);
			const startRank = Math.max(1, targetRank - range);
			const endRank = Math.min(this.length, targetRank + range);
			
			const sorted = this.sortBy(key, order);
			const startIndex = startRank - 1;
			const endIndex = endRank;
			result = MagicArray.from(sorted.slice(startIndex, endIndex));
		} else {
			throw new Error(`Invalid mode: ${mode}. Use 'rank', 'value', or 'around'.`);
		}
		
		if (add) {
			result = result.add(add);
		}
		
		return result.length === 1 ? result[0] : result.sortBy(key,order);
	}
	trim(n) {
		return n >= 0 ?
			this.slice(0, Math.floor(n)) :
			this.slice(Math.floor(n));
	}
	flip() {
		return MagicArray.from(this).reverse();
	}
}