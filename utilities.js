var ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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

/* *
 * Construct an inverted normalized histogram. The values sum to 1
 * and the value associated with each letter is a measure of how 
 * infrequently it is used. Higher values mean less use.
 */ 
function constructFreqHistogram(validWords){
	var letterHistogram = {};
	var totalSum = 0;
	// Faster than branching?
	for(var i = 0; i < ALL_LETTERS.length; i++){
		letterHistogram[ALL_LETTERS[i]] = 0;
	}

	// Count ALL the possible remaining letters
	for(i = 0; i < validWords.length; i++) {
		var curWord = validWords[i];
		for(var j = 0; j < curWord.length; j++){
			letterHistogram[curWord[j]] += 1;
			totalSum += 1;
		}
	}

	// Each letter has its percent commonness
	for(var key in letterHistogram) {
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
	for(var i = 0; i < ALL_LETTERS.length; i++){
		for(var j = 0; j < ALL_LETTERS.length; j++){
			for(var k = 0; k < ALL_LETTERS.length; k++){
				if(i === j || j === k || i === k) continue;
				var joined = ALL_LETTERS[i] + ALL_LETTERS[j] + ALL_LETTERS[k];
				letterShareHist[joined] = 0;
			}
		}	
	}

	// Construct the instances of 3 letters being shared
	// I am choosing 3 because 
	for(var wordIdx = 0; wordIdx < validWords.length; wordIdx++) {
		var word = validWords[wordIdx];
		for(i = 0; i < word.length; i++) {
			for(j = 0; j < word.length; j++){
				for(k = 0; k < word.length; k++){
					if(i === j || j === k || i === k) continue;
					joined = word[i] + word[j] + word[k];
					letterShareHist[joined] += 1;
					totalSum += 1;
				}
			}
		}
	}

	// Each key has it's percent common-ness now.
	for(key in letterShareHist){
		letterShareHist[key] = letterShareHist[key] / totalSum;
	}
	
	return letterShareHist;
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
		if(counter[word[i]] !== 1) {
			return false;
		}
	}

	return true;
}

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

function getVowels(str) {
  var m = str.match(/[aeiouy]/gi);
  return m === null ? 0 : m.length;
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

function printClarifiedSolution(node, compactDictionary){
	console.log("======================================");
	console.log("WINNER", node.letters.length, node.letters);
	_traverseNode(node, compactDictionary);
}

function _traverseNode(node, compactDictionary) {
	if(node.parent === undefined) return;
	var realWords = compactDictionary[node.word];
	console.log(node.word, realWords);
	_traverseNode(node.parent, compactDictionary);
}

var exporter = {
	createWinnableSets: createWinnableSets,
	constructFreqHistogram: constructFreqHistogram,
	constructLetterShareHist: constructLetterShareHist,
	checkWord: checkWord,
	loadDict: loadDict,
	getVowels: getVowels,
	countCharacters: countCharacters,
	allUnique: allUnique,
	printClarifiedSolution: printClarifiedSolution
};

module.exports = exporter;
