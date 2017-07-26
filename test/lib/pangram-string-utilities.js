const { expect } = require('chai');
const utils = require('../../lib/pangram-string-utilities');

describe('createCompactDictionary', () => {

  // If the tests become slow this function could be optimized...
  function isSorted(str) {
    return str.split('').sort().join('') === str;
  }

  it('Returns a Map whose keys are always sorted', () => {
    let ccd = utils.createCompactDictionary;
    let words = ['bed', 'bad', 'yxz', 'gcba', 'gace'];
    let m = ccd(words, 'abcdefg');

    for(let [key, val] of m) {
      expect(isSorted(key)).to.equal(true);
    }
  });

  it('Removes words which are impossible given the provided alphabet, keeps all others', () => {
    let ccd = utils.createCompactDictionary;
    let alphabet = 'abcdefg';
    let legalWords = ['a', 'ab', 'abc', 'ac', 'def', 'fg', 'g']; // ALL SORTED, WHICH MATTERS
    let illegalWords = ['abcdep', 'az', 'xyz', 'acew']; // ALL SORTED, WHICH MATTERS
    let allWords = legalWords.concat(illegalWords);
    let m = ccd(allWords, 'abcdefg');

    expect(m).to.not.have.any.keys(illegalWords);
    expect(m).to.have.all.keys(legalWords);
  });

  it('Removes words which have duplicate letters, regardless of alphabet', () => {
    let ccd = utils.createCompactDictionary;
    let alphabet = 'abcdefg';
    let illegalWords = ['aa', 'abb', 'acbdee', 'abbcde', 'abcdeffg', 'ffabc', 'ffabcca'];
    let m = ccd(illegalWords, 'abcdefg');

    expect(m.size).to.equal(0);
  });

  it('Saves copies of all permutations of words with the same letterSet', () => {
    let ccd = utils.createCompactDictionary;
    let alphabet = 'abcdefg';
    let legalWords = ['ab', 'ba', 'abc', 'bca', 'acb', 'abcd', 'dcba', 'dcab'];
     m = ccd(legalWords, 'abcdefg');

    expect(m.size).to.equal(3);
    expect(m.get('ab')).to.have.all.members(['ab', 'ba']);
    expect(m.get('abc')).to.have.all.members(['abc', 'bca', 'acb']);
    expect(m.get('abcd')).to.have.all.members(['abcd', 'dcba', 'dcab']);
  });
});

describe('allLettersIn', () => {
  it('Returns true if all the letters are contained in the input set', () => {
    let allin = utils.allLettersIn;
    let s = new Set('abcdefg');

    expect(allin('a', s)).to.equal(true);
    expect(allin('ab', s)).to.equal(true);
    expect(allin('abc', s)).to.equal(true);
    expect(allin('cde', s)).to.equal(true);
    expect(allin('abcdef', s)).to.equal(true);
  });

  it('Returns false if all of the letters are not contained in the input set', () => {
    let allin = utils.allLettersIn;
    let s = new Set('xyzhp');

    expect(allin('a', s)).to.equal(false);
    expect(allin('ab', s)).to.equal(false);
    expect(allin('abc', s)).to.equal(false);
    expect(allin('cde', s)).to.equal(false);
    expect(allin('abcdef', s)).to.equal(false);
  });
});

describe('countCharacters', () => {
  it('Returns a Map which maps single characters to the number of times they appear in the string', ()=>{
    let cc = utils.countCharacters;
    let s = 'Hello good sirs';
    let m = cc(s)

    expect(m.get('H')).to.equal(1);
    expect(m.get('e')).to.equal(1);
    expect(m.get('l')).to.equal(2);
    expect(m.get('o')).to.equal(3);
    expect(m.get('g')).to.equal(1);
    expect(m.get('d')).to.equal(1);
    expect(m.get('s')).to.equal(2);
    expect(m.get('i')).to.equal(1);
    expect(m.get('r')).to.equal(1);

    // anything else shouldn't appear
    let nonExist = 'axyzpt';
    for(let c of nonExist) {
      expect(m.get(c)).to.equal(undefined);
    }
  });
});

describe('removeLetters', () => {
  // This function's contract requires that input be sorted, test input is not sorted frivolously
  it(`Returns a string with the specified letters removed from the base string while
      preserving the initial order of the characters.`, () =>{
    let rl = utils.removeLetters;

    // Simple behavior
    expect(rl('ABC', 'A')).to.equal('BC');
    expect(rl('ABC', 'B')).to.equal('AC');
    expect(rl('ABC', 'C')).to.equal('AB');

    // More complex behavior
    expect(rl('abcdefghijklmnopqrstuvqxyz', 'az')).to.equal('bcdefghijklmnopqrstuvqxy');
    expect(rl('abcdefghijklmnopqrstuvqxyz', 'bky')).to.equal('acdefghijlmnopqrstuvqxz');
    expect(rl('abcdefghijklmnopqrstuvqxyz', 'lmnoq')).to.equal('abcdefghijkprstuvqxyz');
    expect(rl('abcdefghijklmnopqrstuvqxyz', 'acegij')).to.equal('bdfhklmnopqrstuvqxyz');

    // Doesn't change anthing for non-existant characters
    // (and is case sensitive)
    expect(rl('abcdefghijklmnopqrstuvqxyz', 'ABCDEFG')).to.equal('abcdefghijklmnopqrstuvqxyz');
  });
});

describe('prunedWordList', () => {
  it('Returns an array without the words that cannot be made with the provided letters', () => {
    let pwl = utils.prunedWordList;
    let initialWords = ['abcd', 'abc', 'cde', 'abcdef'];
    let lettersRemaining = 'abcd';
    let expectation = ['abcd', 'abc'];
    let remaining = pwl(lettersRemaining, initialWords);

    expect(remaining.length).to.equal(expectation.length);
    expect(remaining).to.include.all.members(expectation);
  });
});
