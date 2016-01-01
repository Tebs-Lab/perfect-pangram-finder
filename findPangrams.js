var util = require('./utilities');
var heuristics = require('./heuristics');
var PriorityQueue = require('priorityqueuejs');

// GLOBAL CONSTANTS
var COMPACT_DICT;
var COMPACT_KEYS;
var LETTER_FREQUENCY;

// Main entry
util.loadDict(bootstrapSearch);

function bootstrapSearch(wordList) {
	// create the set of winnable single word sets
	COMPACT_DICT = util.createWinnableSets(wordList);
	console.log("created winnable sets");

	COMPACT_KEYS = Object.keys(COMPACT_DICT);
	heuristics.setCompactDict(COMPACT_DICT);
	console.log(COMPACT_KEYS.length, " Total initial dictionary entries");

	LETTER_FREQUENCY = util.constructFreqHistogram(COMPACT_KEYS);
	heuristics.setLetterFrequency(LETTER_FREQUENCY);
	console.log("constructed letter frequency");

	LETTER_SHARE = util.constructLetterShareHist(COMPACT_KEYS);
	heuristics.setLetterShare(LETTER_SHARE);
	console.log("constructed letter share");

	var solution = findPangrams(COMPACT_KEYS, util.ALL_LETTERS);
}

function findPangrams(allLetters) {
	// Bootstrap A*
	var openSet   = new PriorityQueue(nodeComparator);
	var closedSet = new Set();
	
	// Starting node
	openSet.enq(constructNode(undefined, ''));

	// Because it's possible to search too hard!
	var nodesSearched = 0;

	while(!openSet.isEmpty()) {
		// get the next node, and mark it visited
		var currentNode = openSet.deq();
		
		// Because there are many was to reach one node, but
		// we only care about what happens AFTER that node
		while(closedSet.has(currentNode.letters)){
			currentNode = openSet.deq();
		}

		if(currentNode.letters !== '') closedSet.add(currentNode.letters);

		// Check for victory && near victories
		if(currentNode.letters.length === 0) {
			util.printClarifiedSolution(currentNode, COMPACT_DICT);
			console.log("Found after searching nodes ", nodesSearched);
		}
		nodesSearched++;

		// Construct the next visitable nodes
		constructAdjacentNodes(currentNode, openSet, closedSet);
	}
}

/* *
 * =====SIDE AFFECTING FOR PERFORMANCE======
 *
 * Given a set of letters (which uniquely identifies a node)
 * construct the set of open adjacent nodes. Using the parameters
 * (which are references) 
 */
function constructAdjacentNodes(parent, openSet, closedSet) {
	// Get the list of available words
	var validWords = pruneList(parent.letters);
	for(var i = 0; i < validWords.length; i++){
		var word = validWords[i];

		// Compute the new remaining letters for this node
		var pattern = "[" + word + "]";
		var re = new RegExp(pattern, "g");
		var nodeLetters = parent.letters.replace(re, '');

		// If we've been there, don't go again.
		// Unless it's another perfect pangram of course
		if(closedSet.has(nodeLetters)) continue;
		openSet.enq(constructNode(parent, word, nodeLetters));
	}
}

/* *
 * Given a set of letters remaining, return a list of 
 * words from COMPACT_KEYS that can still be made.
 */
function pruneList(remainingLetters) {
	var newList = [];
	for(var i = 0; i < COMPACT_KEYS.length; i++) {
		var word = COMPACT_KEYS[i];

		if(util.checkWord(word, remainingLetters)){
			newList.push(word);
		}
	}

	return newList;
}

/* *
 * given a parent node; a word to choose; and the letters
 * remaining after choosing the word; return a node object
 */
function constructNode(parent, chosenWord, lettersPostChoice) {
	// Special case for constructing the root node
	if(parent === undefined) {
		return {
			parent: undefined,
			word: '',
			letters: util.ALL_LETTERS,
			utility: 0
		}
	}

	var utility = heuristics.getHeuristic(lettersPostChoice);

	// The node!
	var node = {
		parent: parent,
		word: chosenWord,
		letters: lettersPostChoice,
		utility: utility
	}

	return node;
}

// Used by our priority queue to properly value the next node
function nodeComparator(a, b) {
	return a.utility - b.utility;
}