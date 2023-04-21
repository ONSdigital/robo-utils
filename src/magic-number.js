import { format, toWords, round, abs } from "./functions.js";

export default class MagicNumber extends Number {
	format(str = ",", si = "long") {
		return format(this, str, si);
	}
	toWords(type = "cardinal") {
		return toWords(this, type);
	}
	abs() {
		return abs(this);
	}
	round(dp) {
		return round(this, dp);
	}
}