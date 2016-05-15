"use strict"
var util = require('./utilities');
var heuristics = require('./heuristics');
var PriorityQueue = require('priorityqueuejs');

module.exports = {
	search: search
}

// GLOBALS
var CONFIG;

/* *
 * Search for pangrams.
 */
function search(allLetters, _CONFIG) {
	// Bootstrap A*
	CONFIG = _CONFIG;
	var nodesSearched = 0;
	var openSet   = new PriorityQueue(nodeComparator);
	var closedSet = new Set();
	var root      = constructNode(undefined, '');
	openSet.enq(root);

	// Set heuristic statistics from input
	heuristics.setCompactDict(CONFIG.COMPACT_DICT);
	heuristics.setLetterFrequency(CONFIG.LETTER_FREQUENCY);
	heuristics.setLetterShare(CONFIG.LETTER_SHARE);

	while(!openSet.isEmpty()) {
		var currentNode = openSet.deq();

		// Because there are many ways to reach one node, but
		// we only care about what happens AFTER that node
		while(closedSet.has(currentNode.letters)){
			currentNode = openSet.deq();
		}

		// We're searching for many winning nodes, so never close it
		if(currentNode.letters !== '') closedSet.add(currentNode.letters);

		// Check for a match
		if(currentNode.letters.length <= CONFIG.MATCH_LENGTH && !solutionIsBanned(currentNode)) {
			util.printClarifiedSolution(currentNode, nodesSearched, CONFIG);
			banSolution(currentNode);
		}

		constructAdjacentNodes(currentNode, openSet, closedSet);

		if(CONFIG.VERBOSE && nodesSearched % 1000 === 0) {
			console.log(`--Explored nodes: ${nodesSearched}!`);
    }
    nodesSearched += 1;
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
	for(var i = 0; i < CONFIG.COMPACT_KEYS.length; i++) {
		var word = CONFIG.COMPACT_KEYS[i];

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
function constructNode(parent, chosenWord, lettersPostChoice, nodesSearched) {
	// Special case for constructing the root node
	if(parent === undefined) {
		return {
			parent: undefined,
			word: '',
			letters: util.ALL_LETTERS,
			utility: 0,
			nodesSearched: 0
		}
	}

	var utility = heuristics.getHeuristic(lettersPostChoice);

	// The node!
	var node = {
		parent: parent,
		word: chosenWord,
		letters: lettersPostChoice,
		utility: utility,
		nodesSearched: nodesSearched
	}

	return node;
}

// Used by our priority queue to properly value the next node
function nodeComparator(a, b) {
	return a.utility - b.utility;
}

/* *
 * Given a node representing a solution, add that list of words to
 * the list of known solutions.
 */
function banSolution(node) {
	var wList = [];
	var cur = node;
	while(cur.parent) {
		wList.push(cur.word);
		cur = cur.parent;
	}
	CONFIG.BANNED_WORDSET.push(wList);
	return;
}

/* *
 * Given a node, determine if the list of known solutions contains
 * the words that following node's parent chain yields.
 */
function solutionIsBanned(node) {
	for(var i = 0; i < CONFIG.BANNED_WORDSET.length; i++) {
		var curBanList = CONFIG.BANNED_WORDSET[i];
		var cur = node;

		// Check each word in the solution, if we find one
		// word that is different, it's not banned
		var allWordsMatch = true;
		while(cur.parent) {
			if(curBanList.indexOf(cur.word) === -1){
				allWordsMatch = false;
				break;
			}
			cur = cur.parent;
		}
		// After each word chain, we'll know a word might be banned
		if(allWordsMatch){
			return allWordsMatch;
		}
	}

	return false;
}
