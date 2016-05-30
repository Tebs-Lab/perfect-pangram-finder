"use strict"
var LETTER_FREQUENCY;
var LETTER_SHARE;
var COMPACT_DICT;

function setLetterShare(letterShare) {
  LETTER_SHARE = letterShare;
}

function setLetterFrequency(letterFrequency) {
  LETTER_FREQUENCY = letterFrequency;
}

function setCompactDict(compactDict) {
  COMPACT_DICT = compactDict;
}

/* *
 * Return a heuristic value which estimates how likely a node is
 * to yield a solution. A random factor is included, to encourage
 * exploration.
 * TODO: make epsilon and weights configurable
 * TODO: consider moving epsilon to the selection process, rather than
 * being part of the heuristic creation
 * TODO: Consider preferencing lower numbers of remaining letters, to encourage
 * depth and finishing trees
 */
function getHeuristic(remainingLetters) {
  // If you can win, then win.
  if(remainingLetters.length === 0) {
    return Infinity;
  }
  if(COMPACT_DICT[remainingLetters]) {
    return 1;
  }

  var shareRate = getSharedLetterRate(remainingLetters);
  var uncommonRating = getUncommonRate(remainingLetters);
  var vowelRatio = getVowelRatio(remainingLetters);

  // shareRate is high when letters are common.
  var h = (shareRate + (uncommonRating / 100) + (vowelRatio / 200));

  return h;
}

/**
 *  Given a word, return the percent of the letters which are
 *  vowels.
 */
function getVowelRatio(letterSet) {
  var vowelCount = getVowels(letterSet);
  return vowelCount / letterSet.length;
}

/**
 *  Given a letterSet, give it an uncommonnness rating.
 */
function getUncommonRate(letterSet) {
  // For letters in remaining letters, get the sum
  var sum = 0;
  for(let i = 0; i < letterSet.length; i++) {
    sum += LETTER_FREQUENCY[letterSet[i]];
  }

  return sum / letterSet.length;
}

/* *
 * Returns a measure of how many 3 letter combos of letterSet appear
 * in the valid letterSet list per letter. Values are all between 1 and 0.
 *
 * Bigger values mean letterSet has a greater share of valid 3-letter-perms
 */
function getSharedLetterRate(letterSet) {
  var sharedSum = 0;
  var combosTried = 0;

  // Only one ordered permutation of such words.
  if(letterSet.length === 3) {
    return LETTER_SHARE[letterSet];
  }
  else if(letterSet.length < 3) {
    return 0;
  }

  for(let i = 0; i < letterSet.length; i++) {
    for(let j = i+1; j < letterSet.length; j++){
      for(let k = j+1; k < letterSet.length; k++){
        let joined = letterSet[i] + letterSet[j] + letterSet[k];
        let share = LETTER_SHARE[joined]
        sharedSum += share;
        combosTried += 1;
      }
    }
  }

  // console.log(combosTried, (Math.log(combosTried) / log100));
  return sharedSum / combosTried;
}

// Return the number of vowels in the given string.
// TODO: Might be faster to compile the regex prior. Test for this.
function getVowels(str) {
  var m = str.match(/[aeiouy]/gi);
  return m === null ? 0 : m.length;
}

module.exports = {
  getHeuristic: getHeuristic,
  getVowelRatio: getVowelRatio,
  getUncommonRate: getUncommonRate,
  getSharedLetterRate: getSharedLetterRate,
  getVowels: getVowels,
  setLetterFrequency: setLetterFrequency,
  setLetterShare: setLetterShare,
  setCompactDict: setCompactDict
}
