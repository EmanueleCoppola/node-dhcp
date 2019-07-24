"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Copyright (c) 2019, Uriel Chemouni (uchemouni@gmail.com)
 */
/* tslint:disable no-bitwise */
const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const ceil = Math.ceil;
const sqrt = Math.sqrt;
exports.isPrime = (p) => {
    // check if number is composite
    const qx = ceil(sqrt(p));
    let i = 3;
    // skip trivial numbers (1 is a false positive)
    if (!p)
        return 0;
    if (p < 4)
        return -1;
    if (p === p + 1)
        throw new RangeError("the number is out of range, max value is ~2^53");
    if (p % 2 === 0)
        return 2;
    // search for divisors
    for (; i <= qx; i += 2)
        if (p % i === 0)
            return i;
    return -1;
};
exports.nextPrime = (n, strict) => {
    let k = strict ? n + 1 : n;
    if (k + 1 & 1)
        ++k; // parity drop
    return ~exports.isPrime(k) ? exports.nextPrime(k + 2) : k;
};
exports.prevPrime = (n, strict) => {
    let k = strict ? n - 1 : n;
    if (k === 2)
        return 2;
    if (k - 1 & 1)
        --k; // parity drop
    return ~exports.isPrime(k) ? exports.prevPrime(k - 2) : k;
};
exports.random = (min, max) => exports.nextPrime(rand(min, max));
//# sourceMappingURL=prime.js.map