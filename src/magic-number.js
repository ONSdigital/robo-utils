import { format, toWords, round, abs } from "./functions.js";

export default class MagicNumber extends Number {
	format(str = ",", si = "long") {
		return format(this, str, si);
	}
	toWords(type = "cardinal", dropFirst = true, threshold = 9) {
		return toWords(this, type, dropFirst, threshold);
	}
	abs() {
		return abs(this);
	}
	round(dp) {
		return round(this, dp);
	}
}