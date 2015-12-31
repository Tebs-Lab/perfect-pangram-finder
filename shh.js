var util = require('./utilities');

var LRU = require("lru-cache");
var PriorityQueue = require('priorityqueuejs');

// GLOBAL CONSTANTS
var ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';;
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
	console.log(COMPACT_KEYS.length, " Total initial dictionary entries");

	LETTER_FREQUENCY = util.constructFreqHistogram(COMPACT_KEYS);
	console.log("constructed letter frequency:");

	// LETTER_SHARE = util.constructLetterShareHist(COMPACT_KEYS);
	// console.log("constructed letter share");

	while(COMPACT_KEYS.length > 3) {
		var solution = solveShh(COMPACT_KEYS, ALL_LETTERS);
		var rootNode = findRoot(solution);
		var sIndex = COMPACT_KEYS.indexOf(rootNode.word);
		console.log("SPLICED OUT", sIndex, COMPACT_KEYS.splice(sIndex, 1));
	}
	
}

function findRoot(node) {
	if(node.parent.parent === undefined) return node;
	return findRoot(node.parent);
}

function solveShh(allLetters) {
	// Bootstrap A*
	var openSet   = new PriorityQueue(nodeComparator);
	var closedSet = new Set();
	var BEST = 8;
	
	// Starting node
	openSet.enq(constructNode(undefined, ''));

	// Because it's possible to search too hard!
	var nodesSearched = 0;
	var foundSolutionWithRoot = false;

	while(!openSet.isEmpty()) {
		// get the next node, and mark it visited
		var currentNode = openSet.deq();
		closedSet.add(currentNode.letters);
		//console.log("Explored: ", currentNode.utility.toFixed(3), currentNode.letters, currentNode.word);

		// More fun!
		if(currentNode && currentNode.parent && !currentNode.parent.parent) {
			console.log("changed root after", nodesSearched, findRoot(currentNode).word);
			nodesSearched = 0;
			foundSolutionWithRoot = false;
		}

		if(currentNode.letters.length === 0 || currentNode.letters.length < BEST) {
			BEST = currentNode.letters.length;
			util.printClarifiedSolution(currentNode, COMPACT_DICT);
			console.log("Found after searching nodes ", nodesSearched);
			foundSolutionWithRoot = true;
		}
		nodesSearched++;
		if(nodesSearched % 2000 === 0) console.log((nodesSearched));

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

		// if it's not a winner, but it's got fewer than 3 letters, it's a loser
		if(3 >= nodeLetters.length && nodeLetters.length > 0) continue;

		// no vowels, but more than 4 letters, ignore (those aren't real words anyway)
		if(util.getVowels(nodeLetters) === 0 && nodeLetters.length > 3) {
			continue;
		}

		// If we've been there, don't go again
		if(closedSet.has(nodeLetters)) continue;
		openSet.enq(constructNode(parent, word, nodeLetters));
	}
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
			letters: ALL_LETTERS,
			cost: 0,
			heuristic: Infinity, // Defining edge weight as letters unused
			utility: Infinity
		}
	}

	var parentCost = parent.cost;
	var costOfSelection = chosenWord.length;
	var cost = parentCost + costOfSelection;

	// Heuristic is an UNDERESTIMATE of the true cost
	// This means, heuristic must never exceed 
	// parent.letters.length - chosenWord.length 
	var heuristic = H(lettersPostChoice, chosenWord);

	// Utility of a node is it's known cost + it's estimated cost
	// until the goal.
	var utility = cost + heuristic;

	// The node!
	var node = {
		parent: parent,
		word: chosenWord,
		letters: lettersPostChoice,
		cost: cost,
		heuristic: heuristic,
		utility: utility
	}

	return node;
}

// Used by our priority queue to properly value the next node
function nodeComparator(a, b) {
	return  b.utility - a.utility;
}

/* *
 * Return a heuristic value which underestimates the cost of 
 * finding a solution after choosing chosenWord. 
 */
function H(remainingLetters, chosenWord) {
	// If you can win, then win.
	if(remainingLetters.length === 0) {
		return 0;
	}

	var uncommonRating = getUncommonRate(remainingLetters); 
	var vowelRatio = getVowelRatio(remainingLetters);
	//var shareRate = getSharedLetterRate(remainingLetters);
	
	var h = (1 - ((vowelRatio + (uncommonRating*10)) / 2)) * remainingLetters.length;

	return Math.max(0, h); // negative edge weight breaks things.
}

/**
 *  Given a word, return the percent of the letters which are
 *  vowels.
 */
function getVowelRatio(word) {
	var vowelCount = util.getVowels(word);
	return vowelCount / word.length;
}

/**
 *  Given a word, give it an uncommonnness rating per letter.
 */
function getUncommonRate(word) {
	// For letters in remaining letters, get the sum
	var sum = 0;
	for(i = 0; i < word.length; i++) {
		sum += LETTER_FREQUENCY[word[i]];
	}
	
	return sum / word.length;
}

/* *
 * Returns a measure of how many 3 letter combos appear
 * in the valid word list per letter. Values are all less than 1
 * and the closer to 0 we get the more 3 letter combos are shared
 * with word and all the words in COMPLETE_DICT. 
 *
 * We scale this to a per combo basis so that we don't simply
 * prefer words with fewer letters.
 */
function getSharedLetterRate(word) {
	var sharedSum = 0;
	var combosTried = 0
	for(i = 0; i < word.length; i++) {
		for(j = 0; j < word.length; j++){
			for(k = 0; k < word.length; k++){
				if(i === j || j === k || i === k) continue;
				var joined = word[i] + word[j] + word[k];
				var share = LETTER_SHARE[joined]
				sharedSum += share;
				combosTried += 1;
			}
		}
	}

	return sharedSum / combosTried;
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
 * Potential optimization function - remove all nodes which share
 * the first choice of the current node. 
 */ 
function pruneActiveNodes(currentNode, openSet){
	var rootToBan = findRoot(currentNode);
	var tmpQueue = new PriorityQueue(nodeComparator);
	var nodesRemoved = 0;
	openSet.forEach(function(node) {
		var cRoot = findRoot(node);
		
		// careful, compare by reference IS what I want.
		if(cRoot === rootToBan) {
			nodesRemoved++;
			return;
		}

		tmpQueue.enq(node);
	});
	openSet = tmpQueue;

	// Then, splice out the root word
	var sIndex = COMPACT_KEYS.indexOf(rootToBan.word);
	console.log("REMOVED NODES", nodesRemoved);
	console.log("SPLICED OUT", rootToBan.word, sIndex, COMPACT_KEYS.splice(sIndex, 1));
}