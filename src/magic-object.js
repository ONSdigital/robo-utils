import { getName, getCode, getParent, toData } from "./functions.js";

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
		const countries = {"E": "E92000001", "N": "N92000002", "S": "S92000003", "W": "W92000004"};
		return countries[this.getCode()[0]];
	}
	getParent() {
		return getParent(this);
	}
	toData (props, mode = null) {
		return toData([this], props, mode);
	}
}