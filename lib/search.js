"use strict"
const util = require('./utilities');
const heuristics = require('./heuristics');
const PriorityQueue = require('priorityqueuejs');

// GLOBALS
var CONFIG;

/* *
 * Search for pangrams.
 */
function search(allLetters, _CONFIG) {
	// Bootstrap A*
	CONFIG = _CONFIG;
	var nodesSearched = 0;
	var frontier = new PriorityQueue(nodeComparator);
	var explored = new Set();
	var root = constructNode(undefined, '');
	frontier.enq(root);

	// Set heuristic statistics from input
	heuristics.setCompactDict(CONFIG.COMPACT_DICT);
	heuristics.setLetterFrequency(CONFIG.LETTER_FREQUENCY);
	heuristics.setLetterShare(CONFIG.LETTER_SHARE);

	while(!frontier.isEmpty()) {
		let currentNode = frontier.deq();

		// Prune nodes from the frontier which match currentNode's letterShareHist
		// TODO: Decide if this is what we want, we might be leaving some pangrams on the table
		// in order to get deeper in the search.  For example: ab+god === go+bad
		// Even though these both result in the same remaining letterset
		// they don't result in identical pangram solutions.
		while(explored.has(currentNode.letters)){
			currentNode = frontier.deq();
		}

		// Avoid adding the victory state to 'explored'
		if(currentNode.letters !== '') {
			explored.add(currentNode.letters);
		}

		// Check for a match
		if(currentNode.letters.length <= CONFIG.MATCH_LENGTH && !solutionIsKnown(currentNode)) {
			util.printClarifiedSolution(currentNode, nodesSearched, CONFIG);
			markSolutionKnown(currentNode);
		}

		expandFrontier(currentNode, frontier, explored);

		if(CONFIG.VERBOSE && nodesSearched % 1000 === 0) {
			console.log(`--Explored nodes: ${nodesSearched}!`);
    }

    nodesSearched += 1;
	}
}

/* *
 * =====SIDE AFFECTING FOR PERFORMANCE, frontier and explored are modified======
 *
 * Given a set of letters (which uniquely identifies a node)
 * construct the set of open adjacent nodes. Using the parameters
 * (which are references)
 */
function expandFrontier(parent, frontier, explored) {
	// Get the list of available words
	var validWords = pruneList(parent.letters);
	for(let i = 0; i < validWords.length; i++){
		let word = validWords[i];

		// Compute the new remaining letters for this node
		let pattern = "[" + word + "]";
		let re = new RegExp(pattern, "g");
		let nodeLetters = parent.letters.replace(re, '');

		// If we've been there, don't go again.
		// Unless it's another perfect pangram of course
		if(explored.has(nodeLetters)) {
			continue;
		}

		frontier.enq(constructNode(parent, word, nodeLetters));
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
 * the list of known solutions. This is nessesary because the same set
 * of words can be found in different orders.
 */
function markSolutionKnown(node) {
	var solution_words = new Set();
	var cur = node;
	while(cur.parent) {
		solution_words.add(cur.word);
		cur = cur.parent;
	}
	CONFIG.KNOWN_SOLUTIONS.push(solution_words);
	return;
}

/* *
 * Given a node, determine if the list of known or prviously found solutions
 * matches the words represented by this node's parent chain.
 */
function solutionIsKnown(node) {
	for(let i = 0; i < CONFIG.KNOWN_SOLUTIONS.length; i++) {
		let curSolutionSet = CONFIG.KNOWN_SOLUTIONS[i];
		let cur = node;

		// Check each word in the solution, if we find one
		// word that is different, it's not banned
		let allWordsMatch = true;
		while(cur.parent) {
			if(curSolutionSet.has(cur.word)){
				allWordsMatch = false;
				break;
			}
			cur = cur.parent;
		}

		// If node matched a solution set, we can return
		if(allWordsMatch){
			return true;
		}
	}

	return false;
}

module.exports = {
	search: search
}
