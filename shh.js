var trie = require('resig-trie');

// GLOBALS
var outcomes = {};
var attemptedSets;
var dictTrie;
var DICT;

// Main entry
loadDict(run);

function run(wordObj) {
	var START = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
	DICT = wordObj;

	// construct a trie from the dictionary
	dictTrie = trie.create(Object.keys(wordObj));
	console.log("created trie");

	// create the set of winnable single word sets
	attemptedSets = createWinnableSets(Object.keys(wordObj));
	console.log("created winnable sets");

	// START IT UP BRO
	solveShh('', [], START, '');
	printWinners();

}

function printWinners() {
	console.log(outcomes);
}

function solveShh(activeWord, verifiedWords, remainingLetters, letterOrder){
	// DEBUG
	var outcomesCount = Object.keys(outcomes).length;
	if(outcomesCount % 10000 === 0){
		printWinners();
	}

	// If we've used all the letters, we need to finish
	if(remainingLetters.length === 0){
		if(activeWord === '') {
			outcomes[letterOrder] = {
				win: true, 
				words: verifiedWords
			};
		}
		else {
			outcomes[letterOrder] = {
				win: false, 
				words: verifiedWords, 
				inPlay: activeWord
			};
		}

		return outcomes[letterOrder];
	}

	// Create the remaining sorted letters
	var remainingSorted = remainingLetters.sort().join('');

	// We build up this list of impossible situations
	// as we run through the solver
	if(attemptedSets[remainingSorted] === false) {
		outcomes[letterOrder] = {
				win: false, 
				words: verifiedWords, 
				inPlay: activeWord,
				fastFail: true
			};

		return outcomes[letterOrder];
	}

	// Try each next letter brute force
	var remainingIsUnwinnable = true;
	for(i in remainingLetters) {
		// track the new word
		var currentLetter = remainingLetters[i];
		var newWord = activeWord + currentLetter;
		
		// Track the played letters
		var curLetterOrder = letterOrder + currentLetter
		
		// Remove from remainingLetters
		var newLetters = remainingLetters.slice();
		newLetters.splice(i, 1);

		var sortedNew = newLetters.sort().join('');

		// No words that can be created with newWord as the prefix
		var failLookahead = trie.maybe(newWord, dictTrie) === false;
		if(failLookahead) {
			continue;
		}

		// if it's a word or not, try adding a letter
		var continueOutcome = solveShh(newWord, verifiedWords, newLetters, curLetterOrder);
		if(continueOutcome.win === true) {
			remainingIsUnwinnable = false;
			attemptedSets[sortedNew] = true;
		}

		// If the newWord is a word, then there are two
		// paths, accept word and reject word.
		if(DICT[newWord] !== undefined && newWord.length > 2) {
			var newWordList = verifiedWords.slice();
			newWordList.push(newWord);

			// Solve the rest accepting the word
			// add a + to letterOrder param to indicate alternate path
			var newLetterOrder = curLetterOrder + '+';
			var acceptOutcome = solveShh('', newWordList, newLetters, newLetterOrder);
			
			// If this results in a win, then this letter set is winnable!
			if(acceptOutcome.win === true) {
				remainingIsUnwinnable = false;
				attemptedSets[sortedNew] = true;
			}
		}
	}
	// If, after trying all of the remaining letters, there has
	// not been any win, then the sorted remaining letters must 
	// be an unwinnable set
	if(remainingIsUnwinnable && attemptedSets[remainingSorted] === undefined) {
		attemptedSets[remainingSorted] = false;	
	}

	 outcomes[letterOrder] = {
		win: false,
		words: verifiedWords,
		unplayed: remainingSorted,
		inPlay: activeWord
	};
	return outcomes[letterOrder];
}

function createWinnableSets(wordList) {
	var winners = {};
	for(i in wordList) {
		var word = wordList[i];
		var sorted = word.split('').sort().join('');
		winners[sorted] = true;
	}
	return winners;
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

