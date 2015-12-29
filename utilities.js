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

function constructHistogram(validWords){
	var letterHistogram = {};

	// Faster than branching?
	for(var i = 0; i < ALL_LETTERS.length; i++){
		letterHistogram[ALL_LETTERS[i]] = 0;
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
	constructHistogram: constructHistogram,
	checkWord: checkWord,
	loadDict: loadDict,
	getVowels: getVowels,
	countCharacters: countCharacters,
	allUnique: allUnique,
	printClarifiedSolution: printClarifiedSolution
};

module.exports = exporter;
