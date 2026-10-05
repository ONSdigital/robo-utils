import {
	getName,
	getCode,
	getParent,
	getCountry,
	toData,
	highestFromArray,
	lowestFromArray
} from "./functions.js";

export default class MagicObject {
	constructor(obj) {
		Object.assign(this, obj);
	}
	getName(context = null, mode = "default") {
		return getName(this, context, mode);
	}
	getCode() {
		return getCode(this);
	}
	getCountry() {
		return getCountry(this);
	}
	getParent() {
		return getParent(this);
	}
	toData(props, mode = null) {
		return toData([this], props, mode);
	}
	highest(keys) {
		return highestFromArray(this, keys);
	}
	lowest(keys) {
		return lowestFromArray(this, keys);
	}
}
