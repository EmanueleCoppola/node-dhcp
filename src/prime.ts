
function rand(lower: number, upper: number) {
    return lower + Math.floor(Math.random() * (upper - lower + 1))
}

const ceil = Math.ceil;
const sqrt = Math.sqrt;
export const isPrime = function (p: number): number {
    // check if number is composite
    var qx = ceil(sqrt(p))
        , i = 3;
    // skip trivial numbers (1 is a false positive)
    if (!p) return 0;
    if (p < 4) return -1;
    if (p === p + 1)
        throw new RangeError('the number is out of range, max value is ~2^53');
    if (p % 2 === 0) return 2;
    // search for divisors
    for (; i <= qx; i += 2) if (p % i === 0) return i;
    return -1;
};

export const nextPrime = function (n: number, strict?: boolean): number {
    var k = strict ? n + 1 : n
        ;
    if (k + 1 & 1)++k; // parity drop
    return ~isPrime(k) ? nextPrime(k + 2) : k;
};
export const prevPrime = function (n: number, strict?: boolean): number {
    var k = strict ? n - 1 : n
        ;
    if (k === 2) return 2;
    if (k - 1 & 1)--k; // parity drop
    return ~isPrime(k) ? prevPrime(k - 2) : k;
};

export const random = (min: number, max: number) => nextPrime(rand(min, max))
