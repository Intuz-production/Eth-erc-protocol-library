class Enumeration {
    constructor(obj) {
        for (const key in obj) {
            this[key] = obj[key]
        }
        return Object.freeze(this)
    }
    has(key) {
        return this.hasOwnProperty(key)
    }
}

const GAS_PRICE = 0.00042;


module.exports = {
    GAS_PRICE
}