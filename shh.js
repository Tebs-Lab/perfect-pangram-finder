// GLOBALS
var KNOWN_FAILURES = {};
var COMPLETE_DICT;

// Main entry
loadDict(run);
// console.log(checkWord('knife', 'knife'));
// console.log(checkWord('knife', 'knifes'));
// console.log(checkWord('knife', 'knif'));

function run(wordObj) {
	var START = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

	// create the set of winnable single word sets
	COMPLETE_DICT = createWinnableSets(Object.keys(wordObj));
	console.log("created winnable sets");

	var validWords = Object.keys(COMPLETE_DICT);
	console.log(validWords.length, " Total initial dictionary entries");

	var solutions = solveShh([], START, validWords);
	printClarifiedSolutions(solutions);
}

var counter = 0;
function solveShh(verifiedWords, remainingLetters, validWords) {
	var validSolutions = {};

	if(remainingLetters.length === 0) {
		var returnObj = {};
		returnObj[verifiedWords.join('+')] = verifiedWords;
		console.log(verifiedWords);
		return returnObj;
	}

	// For every sorted letter combo, see if we can make it
	// using the remaining letters
	for(var i = 0; i < validWords.length; i++) {
		var word = validWords[i];

		// change the remaining letters
		var pattern = "[" + word + "]";
		var re = new RegExp(pattern, "g");
		var newLetters = remainingLetters.replace(re, '');

		// Not allowed to use 2 letter words
		if(KNOWN_FAILURES[newLetters] || newLetters.length < 3) {
			continue;
		}

		// The letters might be valid, create the pruned list
		var newValidWords = pruneList(validWords, newLetters);

		// Don't bother recursing if we're not gonna find a word
		if(newValidWords.length === 0) continue;

		// create new chosen words
		var newWords = verifiedWords.slice();
		newWords.push(word);

		var solution = solveShh(newWords, newLetters, newValidWords);
		
		// Join the inner solutions with our own
		if(solution) {
			for(key in solution){
				validSolutions[key] = solution[key];
			}
		}
	}

        // DEBUG
	if(counter % 10000 === 0){
		var listsLen = Object.keys(MEMOIZED_PRUNE_LIST).length;
		var failuresLen = Object.keys(KNOWN_FAILURES).length;
		var knownSets = (listsLen + failuresLen);
		console.log(counter, " Trees terminated");
		console.log(listsLen, " memoized lists");
		console.log(failuresLen, " Known failing cases");
		console.log(knownSets, " of ", 77508760);
		console.log(knownSets/77508760, "%");
	}
	counter++;
        // END DEBUG

	if(Object.keys(validSolutions).length === 0) {
		// This implies that 'remainigLetters' is a failure case
		// for any future passes
		KNOWN_FAILURES[remainingLetters] = true;
		return false;
	}


	return validSolutions;
}

// Given an array and a letter list, prune all the 
// impossible words and return that array
var MEMOIZED_PRUNE_LIST = {};
function pruneList(validWords, remainingLetters) {
	if(MEMOIZED_PRUNE_LIST[remainingLetters]) {
		return MEMOIZED_PRUNE_LIST[remainingLetters]
	}

	var newList = [];
	for(var i = 0; i < validWords.length; i++) {
		var word = validWords[i];

		if(checkWord(word, remainingLetters)){
			newList.push(word);
		}
	}

	MEMOIZED_PRUNE_LIST[remainingLetters] = newList;
	return newList;
}

// Test that letters has enough letters to 
function checkWord(word, letters) {
	if(letters.length < word.length) {
		return false;
	}

	var counter = {};

	// Because our subset of letters is sure to only have uniqe letters
	// we can just set counter to 1
	for(var i = 0; i < letters.length; i++){
		var c = letters[i];
		counter[c] = 1;
	}

	// If word has a letter that letters didn't have.
	for(i = 0; i < word.length; i++) {
		if(counter[word[i]] !== 1) return false;
	}

	return true;
}


function loadDict(callback) {
  var results = {};
  var rl = require('readline').createInterface({
    input: require('fs').createReadStream('/usr/share/dict/words')
  });


  // for every new line, if it matches the regex, add it to an array
  // this is ugly regex :)
  rl.on('line', function (line) {
    results[line.toUpperCase()] = true;
  });


  // readline emits a close event when the file is read.
  rl.on('close', function(){
  	callback(results);
  });
}

function countCharacters(input){
	var characterCounts = {};

	for(var i = 0; i < input.length; i++){
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

function allUnique(input) {
	var characterCounts = countCharacters(input);
 
	for(character in characterCounts){
		if(characterCounts[character] !== 1){
			return false;
		}
	}

	return true;
}

function createWinnableSets(wordList) {
	var winners = {};
	for(i in wordList) {
		var word = wordList[i];
		
		if(!allUnique(word)) continue;
		
		var sorted = word.split('').sort().join('');
		if(sorted.length < 3) continue;

		if(winners[sorted] === undefined) {
			winners[sorted] = [word];
		}
		else {
			winners[sorted].push(word);	
		}
		
	}
	return winners;
}

function printClarifiedSolutions(solutions){
	var clarifiedSolutions = {};
	for(var key in solutions) {
		var clarifiedSolution = {};
		var sWordList = solution[key];
		for(var i in sWordList) {
			var curSortedWord = sWordList[i];
			var realWords = COMPLETE_DICT[curSortedWord];
			clarifiedSolution[curSortedWord] = realWords;
		}
		clarifiedSolutions[key] = clarifiedSolution;
	}
	console.log(clarifiedSolutions);
}
