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
 * to yield a solution
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
	var h = (shareRate + (uncommonRating / 100) + (vowelRatio / 1000));

	// Use a little randomness. Typical decent h is .001, so spice it
	// up by adding something between .001 and 0.
	var epsilon = Math.random() / 1000;


	return h + epsilon;
}

/**
 *  Given a word, return the percent of the letters which are
 *  vowels.
 */
function getVowelRatio(word) {
	var vowelCount = getVowels(word);
	return vowelCount / word.length;
}

/**
 *  Given a word, give it an uncommonnness rating.
 */
function getUncommonRate(word) {
	// For letters in remaining letters, get the sum
	var sum = 0;
	for(i = 0; i < word.length; i++) {
		sum += LETTER_FREQUENCY[word[i]];
	}

	return sum / word.length;
}

/* *
 * Returns a measure of how many 3 letter combos of word appear
 * in the valid word list per letter. Values are all between 1 and 0.
 *
 * Bigger values mean word has a greater share of valid 3-letter-perms
 */
function getSharedLetterRate(word) {
	var sharedSum = 0;
	var combosTried = 0;

	// Only one ordered permutation of such words.
	if(word.length === 3) {
		return LETTER_SHARE[word];
	}
	else if(word.length < 3) {
		return 0;
	}

	for(i = 0; i < word.length; i++) {
		for(j = i+1; j < word.length; j++){
			for(k = j+1; k < word.length; k++){
				var joined = word[i] + word[j] + word[k];
				var share = LETTER_SHARE[joined]
				sharedSum += share;
				combosTried += 1;
			}
		}
	}

	return sharedSum / combosTried;
}

// Return the number of vowels in the given string
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
