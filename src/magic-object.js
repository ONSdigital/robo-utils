import { getName, getCode } from "./functions.js";

export default class MagicObject {
	constructor(obj) {
    Object.assign(this, obj);
  }
	getName(context = null) {
		return getName(this, context);
	}
	getCode() {
		return getCode(this);
	}
}