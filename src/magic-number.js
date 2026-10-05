import {
	format,
	toWords,
	round,
	abs,
	approx,
	toFraction,
	compareTo,
	describeChange
} from "./functions.js";

export default class MagicNumber extends Number {
	format(str = ",", si = "long") {
		return format(this, str, si);
	}
	toWords(type = "cardinal", options = null) {
		return options ? toWords(this, type, options) : toWords(this, type);
	}
	abs() {
		return abs(this);
	}
	round(dp) {
		return new MagicNumber(round(this, dp));
	}
	approx(sf = 2, options = {}) {
		return approx(this, sf, options);
	}
	toFraction(mode = "in", denominators) {
		return toFraction(this, mode, denominators);
	}
	compareTo(ref, options = {}) {
		return compareTo(this, ref, options);
	}
	describeChange(to, options = {}) {
		return describeChange(this, to, options);
	}
}
