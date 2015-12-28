var trie = require('resig-trie');

// GLOBALS
var knownFailures = {};

// Main entry
loadDict(run);
// console.log(checkWord('knife', 'knife'));

function run(wordObj) {
	var START = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

	// create the set of winnable single word sets
	var validWords = createWinnableSets(Object.keys(wordObj));
	console.log("created winnable sets");
	console.log(Object.keys(validWords).length, " Total initial dictionary");

	var solutions = solveShh([], START, validWords);
	var clarifiedSolutions = {};
	for(var key in solutions) {
		var clarifiedSolution = {};
		var sWordList = solution[key];
		for(var i in sWordList) {
			var curSortedWord = sWordList[i];
			var realWords = validWords[curSortedWord];
			clarifiedSolution[curSortedWord] = realWords;
		}
		clarifiedSolutions[key] = clarifiedSolution;
	}
	console.log(clarifiedSolutions);
}

var counter = 0;
function solveShh(verifiedWords, remainingLetters, validWords) {
	if(counter % 10000 === 0){
		var listsLen = Object.keys(MEMOIZED_PRUNE_LIST).length;
		var failuresLen = Object.keys(knownFailures).length;
		var knownSets = (listsLen + failuresLen);
		console.log(counter, " Iterations Attempted");
		console.log(listsLen, " memoized lists");
		console.log(failuresLen, " Known failing cases");
		console.log(knownSets, " of ", 77508760);
		console.log(knownSets/77508760, "%");
	}
	counter++;

	var validSolutions = {};

	if(remainingLetters.length === 0) {
		var returnObj = {};
		returnObj[verifiedWords.join('+')] = verifiedWords;
		console.log(verifiedWords);
		return returnObj;
	}

	// For every sorted letter combo, see if we can make it
	// using the remaining letters
	for(word in validWords) {
		// create new words
		var newWords = verifiedWords.slice();
		newWords.push(word);
		
		// change the remaining letters
		var pattern = "[" + word + "]";
		var re = new RegExp(pattern, "g");
		var newLetters = remainingLetters.replace(re, '');

		if(knownFailures[newLetters]) {
			continue;
		}
		var newValidWords = pruneList(validWords, newLetters);

		var solution = solveShh(newWords, newLetters, newValidWords);
		
		// Join the inner solutions with our own
		if(solution) {
			for(key in solution){
				validSolutions[key] = solution[key];
			}
		}
	}

	if(Object.keys(validSolutions).length === 0) {
		// This implies that 'remainigLetters' is a failure case
		// for any future passes
		knownFailures[remainingLetters] = true;
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

	var newList = {};
	for(word in validWords) {
		if(checkWord(word, remainingLetters)){
			newList[word] = validWords[word];
		}
	}

	MEMOIZED_PRUNE_LIST[remainingLetters] = newList;
	return newList;
}

// Test that letters has enough letters to 
function checkWord(word, letters) {
	//console.log(word, letters);
	var cCount = countCharacters(word);
	//console.log(cCount);
	for(var i in letters) {
		var c = letters[i];
		cCount[c] -= 1;
	}

	for(key in cCount) {
		// Negative numbers mean we have more than enough letters
		if(cCount[key] > 0) {
			return false;
		}
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
