import { expect } from 'chai';
import { counter } from "../assessment-counter";

describe('Test:Counter', () => {
    it('should be able to set and get value from counter', () => {
        const [getA, nextA] = counter(1);
        expect(getA()).to.equal(1);
        nextA()
        expect(getA()).to.equal(2);
    });

    it('should be able to set initial value as zero', () => {
        const [getA] = counter();
        expect(getA()).to.equal(0);
    });

    it('isolated independent instances of counter', () => {
        const [getA, nextA] = counter();
        const [getB, nextB] = counter(50);
        expect(getA()).to.equal(0);
        expect(getB()).to.equal(50);
        nextB()
        expect(getB()).to.equal(51);
        nextA()
        expect(getA()).to.equal(1);
    });

});