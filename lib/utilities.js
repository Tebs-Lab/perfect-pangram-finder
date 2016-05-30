"use strict"
const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/* *
 * Read the dictionary file (hard coded to the OSX spell check list
 * at /usr/share/dict/words) and return an array with an entry for
 * each line in that file.
 *
 * TODO: Allow dictonary path to be specified.
 */
function loadDict(callback) {
  var results = [];
  var rl = require('readline').createInterface({
    input: require('fs').createReadStream('/usr/share/dict/words')
  });

  rl.on('line', function (line) {
    results.push(line.toUpperCase());
  });

  rl.on('close', function(){
  	callback(results);
  });
}

/* *
 * Create a compact version of the dictionary, such that
 * each key is an ordered set of letters which makeup that word
 * and the values are a list of all the words which can be
 * constructed from those letters, for example:
 *
 * ABD: ['BAD', 'DAB']
 */
function createCompactDictionary(wordList) {
	var compactDictionary = {};
	for(let i in wordList) {
		let word = wordList[i];

    // Remove words that can't be perfect pangrams, (such as boot, two o's)
    // TODO: allow other configurable rules.

		if(!allUnique(word) || word.length === 1){
        continue;
    }

    // Associate each sorted letter-set with all words that contain the same letters.
		let sorted = word.split('').sort().join('');
		if(compactDictionary[sorted] === undefined) {
			compactDictionary[sorted] = [word];
		}
		else {
			compactDictionary[sorted].push(word);
		}
	}

	return compactDictionary;
}

/* *
 * Construct a normalized histogram. The values sum to 1
 * and the value associated with each letter is a measure of how
 * frequently it is used. Higher values mean more frequent use.
 *
 * TODO: Write tests for this.
 */
function constructFreqHistogram(validWords){
	var letterHistogram = {};
	var totalLetterCount = 0;

  // Faster than branching? TODO: prove this is actually an optimization
	for(let i = 0; i < ALL_LETTERS.length; i++){
		letterHistogram[ALL_LETTERS[i]] = 0;
	}

	// Count ALL the possible remaining letters
	for(let i = 0; i < validWords.length; i++) {
		let curWord = validWords[i];

    for(let j = 0; j < curWord.length; j++){
			letterHistogram[curWord[j]] += 1;
			totalLetterCount += 1;
		}
	}

	// Each letter to be given it's percent commonness
	for(let letter in letterHistogram) {
		letterHistogram[letter] = letterHistogram[letter] / totalLetterCount;
	}

  // TODO: maybe instead of a test an assert library would be good
  // assert the sum of letterHistogram values === 1 here (within some margin of precision);

	return letterHistogram;
}

/* *
 * Construct a histogram where the keys are 3 letter combos. This returns
 * a noramlized histogram representing frequency of 3 letters used together.
 * Values sum to one and high values are associated with more common combos.
 */
function constructLetterShareHist(validWords) {
	var letterShareHist = {};
	var totalSum = 0;

  // Faster than branching in the main loop?
	for(let i = 0; i < ALL_LETTERS.length; i++){
		for(let j = i+1; j < ALL_LETTERS.length; j++){
			for(let k = j+1; k < ALL_LETTERS.length; k++){
				let joined = ALL_LETTERS[i] + ALL_LETTERS[j] + ALL_LETTERS[k];
				letterShareHist[joined] = 0;
			}
		}
	}

	// Construct the instances of 3 letters being shared
	for(let wordIdx = 0; wordIdx < validWords.length; wordIdx++) {
		let word = validWords[wordIdx];
		for(let i = 0; i < word.length; i++) {
			for(let j = i+1; j < word.length; j++){
				for(let k = j+1; k < word.length; k++){
					let joined = word[i] + word[j] + word[k];
					letterShareHist[joined] += 1;
					totalSum += 1;
				}
			}
		}
	}

	// Each letter is given it's percent share of common-ness.
	for(let letter in letterShareHist){
		letterShareHist[letter] = letterShareHist[letter] / totalSum;
	}

	return letterShareHist;
}

/* *
 * Return a dictionary with the number of times a given character
 * appears in the string. For Example:
 * ABCC yields {A:1, B:1, C:2}
 */
function countCharacters(input){
	var characterCounts = {};

	for(let i = 0; i < input.length; i++){
		let character = input[i];

		if(characterCounts[character] === undefined) {
			characterCounts[character] = 1;
		}
		else {
			characterCounts[character] += 1;
		}
	}

	return characterCounts;
}

/* *
 * Return true if input (a string) contains at most one
 * copy of a given letter. False otherwise.
 */
function allUnique(input) {
	var characterCounts = countCharacters(input);

	for(let character in characterCounts){
		if(characterCounts[character] !== 1){
			return false;
		}
	}

	return true;
}

/*
  Create an object mapping letters to the number of times it occurs in the string
  letters. However, we assume each letter appears exactly once to avoid an if/else
  as an optimization (since we're looking for perfect pangrams.)
*/
function letterCountObj(letters) {
  var counter = {};

  // Because our subset of letters is assumed to only have uniqe letters
  // we can just set counter to 1
  for(let i = 0; i < letters.length; i++){
    var character = letters[i];
    counter[character] = 1;
  }

  return counter;
}

/* *
 * Given a word and some letters, return true if word contains
 * only characters which appear in letters.
 *
 * WARNING, as a performance optimization, this function
 * assumes that words and letters only contain 1 copy of any
 * character. IE allUniqe(word) && allUnique(letters) === true
 *
 * TODO: tests for this
 */
function checkWord(word, letterCount) {
	// If word has a letter that letters didn't have.
	for(let i = 0; i < word.length; i++) {
		if(letterCount[word[i]] !== 1) {
			return false;
		}
	}

	return true;
}

function printClarifiedSolution(node, CONFIG) {
	if(CONFIG.VERBOSE) {
    _printClarifiedSolutionVerbose(node, CONFIG.COMPACT_DICT);
  }
	else {
    _printClarifiedSolution(node, CONFIG.COMPACT_DICT);
   }
}

// Print the node's path as a CSV of sorted lettersets.
function _printClarifiedSolution(solutionWordSet, compactDictionary) {
	var firstWords = [];

	for(let word of solutionWordSet) {
		let realWords = compactDictionary[word];
		firstWords.push(realWords[0]);
	}

	console.log(firstWords.join(", ") + ';');
}
/* *
 * Print a chatty message with nodes in the order they are chosen,
 * as well as heuristic values for each node.
 */
function _printClarifiedSolutionVerbose(solutionWordSet, compactDictionary){
	console.log("\nSOLUTION: ");
	console.log("---------------");
	_printClarifiedSolution(solutionWordSet, compactDictionary);
	console.log(`remaining letters:\n  ${node.letters.length}, ${node.letters}\n`);

	for(let word of solutionWordSet) {
		let realWords = compactDictionary[word];
		console.log(`${word}: ${realWords}, ${nodeItr.utility.toFixed(5)}`);
	}
}

/*
	Relying on the fact that both word and letters are sorted, and contain exactly one
	copy of each letter, we can remove every letter that exists in both word and letters
	from letters, and return the result. This is MUCH faster than the naive regex solution
	I was using before.
*/
function removeLettersEfficent(word, letters) {
	let matchedIdx = 0;
	let nodeLetters = '';

	for(let i = 0; i < letters.length; i++) {
		let curChar = letters[i];
		if(curChar === word[matchedIdx]) {
			matchedIdx++;
		}
		else {
			nodeLetters += curChar;
		}
	}

	return nodeLetters;
}

// Is there a better way to do this in Node if some of these
// functions must be used inside this file as well as exported?
var exporter = {
	ALL_LETTERS: ALL_LETTERS,
	createCompactDictionary: createCompactDictionary,
	constructFreqHistogram: constructFreqHistogram,
	constructLetterShareHist: constructLetterShareHist,
  letterCountObj: letterCountObj,
	checkWord: checkWord,
	loadDict: loadDict,
	countCharacters: countCharacters,
	allUnique: allUnique,
	printClarifiedSolution: printClarifiedSolution,
  removeLettersEfficent: removeLettersEfficent
};

module.exports = exporter;
