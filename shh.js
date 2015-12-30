var util = require('./utilities');

var LRU = require("lru-cache");
var PriorityQueue = require('priorityqueuejs');

// GLOBAL CONSTANTS
var ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';;
var COMPACT_DICT;
var COMPACT_KEYS;
var LETTER_FREQUENCY;

// MEMOIZERS
var MEMOIZED_PRUNE_LIST = LRU(4096);

// Main entry
util.loadDict(bootstrapSearch);

function bootstrapSearch(wordList) {
	// create the set of winnable single word sets
	COMPACT_DICT = util.createWinnableSets(wordList);
	console.log("created winnable sets");

	COMPACT_KEYS = Object.keys(COMPACT_DICT);
	console.log(COMPACT_KEYS.length, " Total initial dictionary entries");

	LETTER_FREQUENCY = util.constructHistogram(COMPACT_KEYS);
	console.log("constructed letter frequency:", LETTER_FREQUENCY);

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
	var bannedRoots = new Set();
	
	// Starting node
	openSet.enq(constructNode(undefined, ''));

	// Because it's possible to search too hard!
	var nodesSearched = 0;

	while(!openSet.isEmpty()) {
		// get the next node, and mark it visited
		var currentNode = openSet.deq();
		closedSet.add(currentNode.letters);

		// More fun!
		if(currentNode && currentNode.parent && !currentNode.parent.parent) {
			console.log("changed root after", nodesSearched, findRoot(currentNode).word);
			nodesSearched = 0;
		}

		if(currentNode.letters.length === 0) {
			util.printClarifiedSolution(currentNode, COMPACT_DICT);
			console.log("Found after searching nodes ", nodesSearched);
			// return currentNode;
		}
		nodesSearched++;

		// If it's been awhile since a root change, force one
		// if(nodesSearched > 5500) {
		// 	nodesSearched = 0;

		// 	var rootToBan = findRoot(currentNode);
		// 	var tmpQueue = new PriorityQueue(nodeComparator);
		// 	var nodesRemoved = 0;
		// 	openSet.forEach(function(node) {
		// 		var cRoot = findRoot(node);
				
		// 		// careful, compare by reference IS what I want.
		// 		if(cRoot === rootToBan) {
		// 			nodesRemoved++;
		// 			return;
		// 		}

		// 		tmpQueue.enq(node);
		// 	});
		// 	openSet = tmpQueue;

		// 	// Then, splice out the root word
		// 	var sIndex = COMPACT_KEYS.indexOf(rootToBan.word);
		// 	console.log("REMOVED NODES", nodesRemoved);
		// 	console.log("SPLICED OUT", rootToBan.word, sIndex, COMPACT_KEYS.splice(sIndex, 1));
		// }

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
		if(nodeLetters.length < 3 && nodeLetters.length > 0) continue;

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

	// 0-1, 1 means word has the maximum uncommonness per letter
	var uncommonRating = getUncommonRate(remainingLetters);

	// 0-1, 1 means all consanants 
	var vowelRatio = getVowelRatio(remainingLetters);
	
	// h is from 0 to 1. An underestimate of the number of words
	// before a solution, obviously.
	var h = ((uncommonRating + vowelRatio) / 2) * remainingLetters.length;

	return Math.max(0, h); // negative edge weight breaks things.
}

/**
 *  Given a word, give it a rating of how many
 *  vowels to consannats it has. 
 *  No consanants = 1, all consanats = 0
 */
function getVowelRatio(word) {
	var vowelCount = util.getVowels(word);
	var consCount = word.length - vowelCount;

	if(vowelCount === 0) {
		return 1;
	}
	return consCount / vowelCount;
}

/**
 *  Given a word, give it an uncommonnness rating.
 *  the basis for this rating is the sum of 
 */
function getUncommonRate(word) {
	// For letters in remaining letters, get the sum
	var sum = 0;
	for(i = 0; i < word.length; i++) {
		sum += LETTER_FREQUENCY[word[i]];
	}
	
	return sum;
}

/* *
 * Given a set of letters remaining, return a list of 
 * words from COMPACT_KEYS that can still be made.
 */
function pruneList(remainingLetters) {
	var memo = MEMOIZED_PRUNE_LIST.get(remainingLetters);
	if(memo) {
		return memo;
	}

	var newList = [];
	for(var i = 0; i < COMPACT_KEYS.length; i++) {
		var word = COMPACT_KEYS[i];

		if(util.checkWord(word, remainingLetters)){
			newList.push(word);
		}
	}

	MEMOIZED_PRUNE_LIST.set(remainingLetters, newList);
	return newList;
}