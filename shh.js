var LRU = require("lru-cache");

// GLOBALS
var START = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';;
var KNOWN_FAILURES = LRU(2048);
var MEMOIZED_PRUNE_LIST = LRU(4096);
var COMPLETE_DICT;

// STAT KEEPING
var finishedTrees = 0;
var actualIterationCount = 0;
var startTime;

// Main entry
loadDict(run);
// console.log(checkWord('knife', 'knife'));
// console.log(checkWord('knife', 'knifes'));
// console.log(checkWord('knife', 'knif'));

function run(wordObj) {
	// create the set of winnable single word sets
	COMPLETE_DICT = createWinnableSets(Object.keys(wordObj));
	console.log("created winnable sets");

	var validWords = Object.keys(COMPLETE_DICT);
	console.log(validWords.length, " Total initial dictionary entries");

	startTime = new Date().getTime();
	solveShh(validWords, START, []);
	console.log(FOUND_SOLUTIONS);
}


function solveShh(masterValidWords, allLetters, winningWords) {
	if(KNOWN_FAILURES.get(allLetters)) return;
	
	// State Holders
	var validWords = masterValidWords.slice();
	var remainingLetters = allLetters + '';

	while(validWords.length > 0) {
		// get the next word
		var nextWordObj = selectWord(validWords, remainingLetters);

		// We were unable to select a word.
		// Removing words from the list won't 
		// create a new word that could be selected
		if(nextWordObj.word === '') {
			break;
		}

		// Add to our list
		var cpyWords = winningWords.slice();
		cpyWords.push(nextWordObj.word);

		// Remove the word from our list
		validWords.splice(nextWordObj.idx, 1);

		// Close enough...
		if(nextWordObj.remainingLetters.length <= BEST_WIN_SO_FAR) {
			printClarifiedSolution(cpyWords, nextWordObj.remainingLetters);
		}

		// No words coming up after selection
		// we may be able to select a new word in THIS state
		// but we can't recurse.
		if(nextWordObj.validWords.length === 0) {
			continue;
		}

		solveShh(nextWordObj.validWords, nextWordObj.remainingLetters, cpyWords);
	}
	KNOWN_FAILURES.set(allLetters, true);
}

// Given an array and a letter list, prune all the 
// impossible words and return that array
function pruneList(validWords, remainingLetters) {
	var memo = MEMOIZED_PRUNE_LIST.get(remainingLetters);
	if(memo) {
		return memo;
	}

	var newList = [];
	for(var i = 0; i < validWords.length; i++) {
		var word = validWords[i];

		if(checkWord(word, remainingLetters)){
			newList.push(word);
		}
	}

	MEMOIZED_PRUNE_LIST.set(remainingLetters, newList);
	return newList;
}

function selectWord(validWords, remainingLetters) {
	var bestOverlap = Infinity;
	var bestWord = '';
	var bestWordIdx = 0;
	var bestNewLetters = remainingLetters;
	var letterHistogram = constructHistogram(validWords);

	for(var i = 0; i < validWords.length; i++){
		var word = validWords[i];

		// change the remaining letters
		var pattern = "[" + word + "]";
		var re = new RegExp(pattern, "g");
		var newLetters = remainingLetters.replace(re, '');

		// Not allowed to use 2 letter words
		if(newLetters.length < 3) {
			continue;
		}

		// check overlap heuristic
		var overlapH = overlapHeuristic(letterHistogram, newLetters);
		if(overlapH < bestOverlap) {
			bestOverlap = overlapH;
			bestWord = word;
			bestWordIdx = i;
			bestNewLetters = newLetters;
		}
	}

	// No selection no pruning
	if(bestWord === '') return {word: ''};

	var bestNewValidWords = pruneList(validWords, bestNewLetters);

	//console.log("SELECTED A WORD", bestOverlapWord);
	var returnObj = {
		word: bestWord,
		idx: bestWordIdx,
		remainingLetters: bestNewLetters,
		validWords: bestNewValidWords
	};

	return returnObj;
}

/**
 *  Given a list of valid words, and the remaining letters
 *  return a value representing the degree to which the
 *  words in validWords share the same letters as remainingLetters
 */
function overlapHeuristic(letterHistogram, remainingLetters) {
	// For letters in remaining letters, get the sum
	var sum = 0;
	for(i = 0; i < remainingLetters.length; i++) {
		sum += letterHistogram[remainingLetters[i]];
	}

	return sum;
}

function constructHistogram(validWords){
	var letterHistogram = {};

	// Faster than branching?
	for(var i = 0; i < START.length; i++){
		letterHistogram[START[i]] = 0;
	}

	// Count ALL the possible remaining letters
	for(i = 0; i < validWords.length; i++) {
		var curWord = validWords[i];
		for(var j = 0; j < curWord.length; j++){
			letterHistogram[curWord[j]] += 1;
		}
	}

	return letterHistogram;
}

function getVowels(str) {
  var m = str.match(/[aeiouy]/gi);
  return m === null ? 0 : m.length;
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

var FOUND_SOLUTIONS = {};
var BEST_WIN_SO_FAR = 26;
function printClarifiedSolution(winningWords, remainingLetters){
	// don't print known solutions, we do this
	// because we continue to search over the same space 
	// even when we are within n
	if(FOUND_SOLUTIONS[remainingLetters]){
		return;
	}

	if(remainingLetters.length < BEST_WIN_SO_FAR) {
		BEST_WIN_SO_FAR = remainingLetters.length;
	}

	var clarifiedSolution = {};

	for(var i in winningWords) {
		var curSortedWord = winningWords[i];
		var realWords = COMPLETE_DICT[curSortedWord];
		clarifiedSolution[curSortedWord] = realWords;
	}

	FOUND_SOLUTIONS[remainingLetters] = clarifiedSolution;
	console.log("WINNER", remainingLetters.length, remainingLetters);
	console.log("FOUND AT", (new Date().getTime()) - startTime, "ms");
	console.log(clarifiedSolution);
}
