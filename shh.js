var trie = require('resig-trie');

// GLOBALS
var outcomes = {};
var remainingEncountered = {};
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

	// START IT UP BRO
	solveShh('', [], START, '');

}

function printWinners() {
	for(play in outcomes) {
		var cur = outcomes[play];

		if(cur.win || (cur.inPlay + cur.unplayed).length < 4) {
			console.log(cur);
			console.log("======");
		}
	}
}

function solveShh(activeWord, verifiedWords, remainingLetters, letterOrder){
	// DEBUG
	var outcomesCount = Object.keys(outcomes).length;
	if(outcomesCount % 10000 === 0){
		printWinners();
		console.log(outcomesCount);
	}

	var remainingSorted = remainingLetters.split('').sort().join('');
	var outcomeOfRemaining = remainingEncountered[remainingSorted];
	if(outcomeOfRemaining !== undefined) {
		outcomes[letterOrder] = {
			win: outcomeOfRemaining.win,
			words: verifiedWords,
			unplayed: remainingSorted,
			fastForward: true
		}
		return outcomes[letterOrder];
	}

	// If we've used all the letters
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

	// If there aren't words that can be created 
	// with this prefix, return
	if(trie.maybe(activeWord, dictTrie) === false) {
		outcomes[letterOrder] = {
			win: false,
			words: verifiedWords, 
			inPlay: activeWord, 
			unplayed: remainingLetters
		}
		return outcomes[letterOrder];
	}

	// Try each next letter brute force
	for(i in remainingLetters) {
		// track the new word
		var currentLetter = remainingLetters[i];
		var newWord = activeWord + currentLetter;
		
		// Track the played letters
		var curLetterOrder = letterOrder + currentLetter
		
		// Remove from remainingLetters
		var newLetters = remainingLetters.slice();
		newLetters.splice(i, 1);

		// If the newWord is a word, then there are two
		// paths, accept word and reject word.
		if(DICT[newWord] !== undefined && newWord.length > 2) {
			var newWordList = verifiedWords.slice();
			newWordList.push(newWord);

			// Solve the rest accepting the word
			// add a + to letterOrder param to indicate alternate path
			var newLetterOrder = curLetterOrder + '+';
			var acceptOutcome = solveShh('', newWordList, newLetters, newLetterOrder);
		}

		// if it's a word or not, try adding a letter
		var continueOutcome = solveShh(newWord, verifiedWords, newLetters, curLetterOrder);
	}

	return {
		win: false
	}
}

function eqSet(as, bs) {
    if (as.size !== bs.size) return false;
    for (var a of as) if (!bs.has(a)) return false;
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

