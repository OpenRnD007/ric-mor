/**
 * `get`: getCounter | `set`: increment counter
 * @param initial: number [default: 0]
 * @returns [get, set]
 */
export function counter(initial: number = 0) {
    const get = () => {
        return initial;
    };

    const set = () => {
        initial += 1
    };
    return [get, set];
}

/*
const [getA, nextA] = counter(1);
console.log(getA());//1
nextA()
console.log(getA());//2
*/