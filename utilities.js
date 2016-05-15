"use strict"
var ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/* *
 * Read the dictionary file (hard coded to the OSX spell check list
 * at /usr/share/dict/words) and return an array with an entry for
 * each line in that file.
 */
function loadDict(callback) {
  var results = [];
  var rl = require('readline').createInterface({
    input: require('fs').createReadStream('/usr/share/dict/words')
  });


  // for every new line, if it matches the regex, add it to an array
  // this is ugly regex :)
  rl.on('line', function (line) {
    results.push(line.toUpperCase());
  });


  // readline emits a close event when the file is read.
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
function createWinnableSets(wordList) {
	var winners = {};
	for(let i in wordList) {
		let word = wordList[i];

		if(!allUnique(word)) continue;

		let sorted = word.split('').sort().join('');
		if(sorted.length === 1) continue;

		if(winners[sorted] === undefined) {
			winners[sorted] = [word];
		}
		else {
			winners[sorted].push(word);
		}

	}
	return winners;
}

/* *
 * Construct an inverted normalized histogram. The values sum to 1
 * and the value associated with each letter is a measure of how
 * infrequently it is used. Higher values mean less use.
 */
function constructFreqHistogram(validWords){
	var letterHistogram = {};
	var totalSum = 0;
	// Faster than branching?
	for(let i = 0; i < ALL_LETTERS.length; i++){
		letterHistogram[ALL_LETTERS[i]] = 0;
	}

	// Count ALL the possible remaining letters
	for(let i = 0; i < validWords.length; i++) {
		let curWord = validWords[i];
		for(let j = 0; j < curWord.length; j++){
			letterHistogram[curWord[j]] += 1;
			totalSum += 1;
		}
	}

	// Each letter has its percent commonness
	for(let key in letterHistogram) {
		letterHistogram[key] = letterHistogram[key] / totalSum;
	}

	return letterHistogram;
}

/* *
 * Construct a histogram where the keys are 3 letter combos. Like
 * regular construct histogram, this is inverted and normalized. The
 * values sum to one and high values are associated with infrequent
 * combos.
 */
function constructLetterShareHist(validWords) {
	var letterShareHist = {};
	var totalSum = 0;
	// Faster than branching?
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

	// Each key has it's percent common-ness now.
	for(let key in letterShareHist){
		letterShareHist[key] = letterShareHist[key] / totalSum;
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
		var c = input[i];

		if(characterCounts[c] === undefined) {
			characterCounts[c] = 1;
		}
		else {
			characterCounts[c] += 1;
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

/* *
 * Given a word and some letters, return true if word contains
 * only characters which appear in letters. This function does
 * assume that words and letters only contain 1 copy of any
 * character. IE allUniqe(word) && allUnique(letters) === true
 */
function checkWord(word, letters) {
	if(letters.length < word.length) {
		return false;
	}

	var counter = {};

	// Because our subset of letters is sure to only have uniqe letters
	// we can just set counter to 1
	for(let i = 0; i < letters.length; i++){
		var c = letters[i];
		counter[c] = 1;
	}

	// If word has a letter that letters didn't have.
	for(let i = 0; i < word.length; i++) {
		if(counter[word[i]] !== 1) {
			return false;
		}
	}

	return true;
}

function printClarifiedSolution(node, nodesSearched, CONFIG) {
	if(CONFIG.VERBOSE) _printClarifiedSolutionVerbose(node, nodesSearched, CONFIG.COMPACT_DICT);
	else _printClarifiedSolution(node, CONFIG.COMPACT_DICT);
}

function _printClarifiedSolution(node, compactDictionary) {
	var firstWords = [];
	var nodeItr = node;

	while(nodeItr.parent) {
		var realWords = compactDictionary[nodeItr.word];
		firstWords.push(realWords[0]);
		nodeItr = nodeItr.parent;
	}

	console.log(firstWords.join(", ") + ';');

}
/* *
 * Print a chatty message with nodes in the order they are chosen,
 * as well as heuristic values for each node.
 */
function _printClarifiedSolutionVerbose(node, nodesSearched, compactDictionary){
	console.log("\nSOLUTION: ");
	console.log(`At: ${nodesSearched}`);
	console.log("---------------");
	_printClarifiedSolution(node, compactDictionary);
	console.log(`remaining letters:\n  ${node.letters.length}, ${node.letters}\n`);

	var nodeItr = node;
	while(nodeItr.parent) {
		var realWords = compactDictionary[nodeItr.word];
		console.log(`${nodeItr.word}: ${realWords}, ${nodeItr.utility.toFixed(5)}`);
		nodeItr = nodeItr.parent;
	}
}

// Is there a better way to do this in Node if some of these
// functions must be used inside this file as well as exported?
var exporter = {
	ALL_LETTERS: ALL_LETTERS,
	createWinnableSets: createWinnableSets,
	constructFreqHistogram: constructFreqHistogram,
	constructLetterShareHist: constructLetterShareHist,
	checkWord: checkWord,
	loadDict: loadDict,
	countCharacters: countCharacters,
	allUnique: allUnique,
	printClarifiedSolution: printClarifiedSolution
};

module.exports = exporter;
