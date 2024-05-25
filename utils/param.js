/* eslint-disable no-useless-escape */
const _ = require("lodash");

class Param {
  static numberType = ["number", "int", "uint", "float", "ufloat"];

  static get(req, ...keys) {
    const query = _.get(req, "query", {});
    const params = _.get(req, "params", {});
    const array = { ...params, ...query };
    return this.parse(array, keys);
  }

  static post(req, ...keys) {
    const body = _.get(req, "body", {});
    return this.parse(body, keys);
  }

  static request(req, ...keys) {
    const query = _.get(req, "query", {});
    const params = _.get(req, "params", {});
    const body = _.get(req, "body", {});
    const array = { ...body, ...params, ...query };
    return this.parse(array, keys);
  }

  static p(array, ...keys) {
    return this.parse(array, keys);
  }

  static parse(array, keys) {
    let arrKey = false;
    if (keys.length === 1 && _.isArray(keys[0])) {
      arrKey = true;
      keys = keys[0];
    }

    const count = keys.length;
    if (count <= 0) {
      return null;
    }

    if (count === 1 && !arrKey) {
      const result = this.keyParse(array, keys[0]);
      return result.value;
    }

    const results = {};
    _.forEach(keys, (key) => {
      const result = this.keyParse(array, key);
      if (!_.isUndefined(result.value)) {
        _.set(results, result.key, result.value);
      }
    });

    return results;
  }

  static keyParse(array, key) {
    if (_.isArray(key)) {
      const arrSize = _.size(key);
      if (arrSize >= 1) {
        let arrKey = key[0];
        if (arrSize >= 2) {
          if (_.isArray(key[1]) && _.size(key[1]) > 0) {
            arrKey = `${arrKey}:enum(${_.join(key[1], ",")})`;
          } else {
            arrKey = `${arrKey}:${key[1]}`;
          }
        }
        if (arrSize >= 3) {
          arrKey = `${arrKey}:${key[2]}`;
        }
        key = arrKey;
      }
    }

    const exKey = _.split(_.trim(key), ":");
    key = _.trim(exKey[0]);
    let keyName = key;
    const exKeyName = _.split(key, "->");
    if (exKeyName.length === 2) {
      key = exKeyName[0];
      keyName = exKeyName[1];
    }

    const types = _.isUndefined(exKey[1])
      ? ["any"]
      : _.split(_.trim(exKey[1]), "|");
    let defaultVal = null;
    if (exKey.length >= 2) {
      defaultVal = _.join(_.slice(exKey, 2), ":");
    }

    let value = _.get(array, key);

    // extended: false 예외처리
    if (!value) {
      let chkArray = false;
      let chkAny = false;
      _.forEach(types, (_type) => {
        if (_.endsWith(_type, "[]")) {
          chkArray = true;
          return false;
        }
        if (_.startsWith(_type, "any")) {
          chkAny = true;
          return false;
        }
      });
      if (chkArray || chkAny) {
        const array2 = {};
        _.forEach(array, (_val, _key) => {
          if (_.startsWith(_key, `${key}[`) && _.endsWith(_key, "]")) {
            _.set(array2, _key, _val);
          }
        });
        value = _.get(array2, key);
      }
    }

    if (!_.isUndefined(value)) {
      let chk = false;
      _.forEach(types, (_type) => {
        if (_.endsWith(_type, "[]")) {
          if (!_.isArray(value)) {
            return;
          }
          let arrType = _type.substring(0, _type.length - 2);
          const isTrim = _.endsWith(arrType, ".trim");
          if (isTrim) {
            arrType = arrType.substring(0, arrType.length - 5);
          }

          const value2 = [];
          _.forEach(value, (val) => {
            if (!this.typeCheck(arrType, val)) {
              return;
            }

            if (_.includes(this.numberType, arrType)) {
              val = _.toNumber(val);
            }

            value2.push(isTrim ? _.trim(val) : val);
          });

          if (value2.length > 0) {
            value = value2;
            chk = true;
            return false;
          }
        } else {
          if (_.isArray(value) && _type !== "any") {
            return;
          }

          if (_.endsWith(_type, ".trim")) {
            _type = _type.substring(0, _type.length - 5);
            value = _.trim(value);
          }

          if (this.typeCheck(_type, value)) {
            if (_.includes(this.numberType, _type)) {
              value = _.toNumber(value);
            }

            chk = true;
            return false;
          }
        }
      });

      if (!chk) {
        value = false;
      }
    } else {
      value = null;
    }

    if (_.isNull(value) || value === false) {
      if (!_.isNull(defaultVal) && defaultVal.length > 0) {
        if (defaultVal === "[]") {
          value = [];
        } else if (defaultVal === "{}") {
          value = {};
        } else if (defaultVal === '""' || defaultVal === "''") {
          value = "";
        } else if (
          (_.startsWith(defaultVal, "[") && _.endsWith(defaultVal, "]")) ||
          (_.startsWith(defaultVal, "{") && _.endsWith(defaultVal, "}"))
        ) {
          const decode = JSON.parse(defaultVal);
          if (decode) {
            value = decode;
          }
        } else if (defaultVal === "?") {
          value = undefined;
        } else if (
          !_.isNaN(_.toNumber(defaultVal)) &&
          _.size(_.intersection(types, this.numberType)) > 0
        ) {
          value = _.toNumber(defaultVal);
        } else {
          value = defaultVal;
        }
      }
    }

    return {
      key: keyName,
      value,
    };
  }

  static typeCheck(type, value) {
    if (
      _.includes(this.numberType, type) &&
      (value === "" || value === false || value === null || value === undefined)
    ) {
      return false;
    }

    if (type === "string") {
      if (!_.isString(value)) {
        return false;
      }
    } else if (type === "number") {
      const chkValue = _.toNumber(value);
      if (_.isNaN(chkValue)) {
        return false;
      }
    } else if (_.includes(["int", "uint"], type)) {
      const chkValue = _.toNumber(value);
      if (_.isNaN(chkValue)) {
        return false;
      }
      if (!_.isInteger(chkValue)) {
        return false;
      }
      if (type === "uint" && chkValue < 0) {
        return false;
      }
    } else if (_.includes(["float", "ufloat"], type)) {
      const chkValue = _.toNumber(value);
      if (_.isNaN(chkValue)) {
        return false;
      }
      if (_.isInteger(chkValue)) {
        return false;
      }
      if (type === "ufloat" && chkValue < 0) {
        return false;
      }
    } else if (type === "date") {
      const regexp = /[0-9]{4}-?(0[1-9]|1[0-2])-?(0[1-9]|[1-2][0-9]|3[0-1])/;
      const match = regexp.exec(value);
      if (!match || match.length === 0 || match[0] !== value) {
        return false;
      }
    } else if (type === "datetime") {
      const regexp =
        /[0-9]{4}-?(0[1-9]|1[0-2])-?(0[1-9]|[1-2][0-9]|3[0-1])\s([01][0-9]|2[0-3]):?([0-5][0-9])?:([0-5][0-9])/;
      const match = regexp.exec(value);
      if (!match || match.length === 0 || match[0] !== value) {
        return false;
      }
    } else if (type === "base64") {
      if (value % 4 !== 0) {
        return false;
      }
      const regexp = /[a-z0-9+=\/]+/i;
      const match = regexp.exec(value);
      if (!match || match.length === 0 || match[0] !== value) {
        return false;
      }
    } else if (_.startsWith(type, "enum(") && _.endsWith(type, ")")) {
      const enums = _.split(type.substring(5, type.length - 1), ",");
      _.forEach(enums, (_item, _index) => {
        enums[_index] = _.trim(_item);
      });
      if (!_.includes(enums, value)) {
        return false;
      }
    } else if (type === "ipv4") {
      const regexp =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const match = regexp.exec(value);
      if (!match || match.length === 0 || match[0] !== value) {
        return false;
      }
    } else if (type === "email") {
      if (!_.isString(value)) {
        return false;
      }
      const regexp =
        /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!regexp.test(value)) {
        return false;
      }
      if (value.length > 320) {
        return false;
      }
    } else if (type === "phone") {
      const regexp = /[0-9]{2,4}\-?[0-9]{3,4}\-?[0-9]{3,4}/;
      const match = regexp.exec(value);
      if (!match || match.length === 0 || match[0] !== value) {
        return false;
      }
    } else if (type && type !== "any") {
      return false;
    }

    return true;
  }
}

module.exports = Param;
