import { format, toWords, round, abs } from "./functions.js";

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
		return round(this, dp);
	}
}