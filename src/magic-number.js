import { format, toWords } from "./functions";

export default class MagicNumber extends Number {
	format(str = ",", si = "long") {
		return format(this, str, si);
	}
	toWords(type = "cardinal", dropFirst = true, threshold = 9) {
		return toWords(this, type, dropFirst, threshold);
	}
}