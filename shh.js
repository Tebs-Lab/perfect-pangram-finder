var util = require('./utilities');
var PriorityQueue = require('priorityqueuejs');

// GLOBAL CONSTANTS
var ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';;
var COMPACT_DICT;
var COMPACT_KEYS;
var LETTER_FREQUENCY;

// GLOBAL NON CONSTANTS
var VOWEL_W;
var UC_W;
var WEIGHT_SUM;
var BANNED_WORDSET = []; // list of lists

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

	LETTER_SHARE = util.constructLetterShareHist(COMPACT_KEYS);
	console.log("constructed letter share", LETTER_SHARE);

	while(true) {
		var solution = solveShh(COMPACT_KEYS, ALL_LETTERS);
		
		if(solution !== undefined) {
			//banSolution(solution);
			var solutionRoot = findRoot(solution);
			var i = COMPACT_KEYS.indexOf(solutionRoot.word);
			
			// until I think of something more clever, banning
			// the word we most wanted to choose first
				// seems like a way to find unique solutions.
			var bannedWord = COMPACT_KEYS.splice(i,1);
			console.log("BANNED WORD: ", bannedWord);

		}
	}
}

function solveShh(allLetters) {
	// Bootstrap A*
	var openSet   = new PriorityQueue(nodeComparator);
	var closedSet = new Set();
	var BEST = 8;

	// Stochastic Params
	// VOWEL_W = Math.random() * 3;
	// UC_W = (Math.random() * 5) + 2;
	// WEIGHT_SUM = VOWEL_W + UC_W;
	// console.log("STARTING ROUND", "V: " + VOWEL_W, "UC: " + UC_W);
	
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
		closedSet.add(currentNode.letters);

		//console.log("Explored: ", currentNode.utility.toFixed(3), currentNode.heuristic.toFixed(3), currentNode.letters, currentNode.word);
		//console.log("Explored: ", (currentNode.utility - .999) * 1000, currentNode.letters);

		if(currentNode.letters.length === 0 && !solutionIsBanned(currentNode)) {
			util.printClarifiedSolution(currentNode, COMPACT_DICT);
			console.log("Found after searching nodes ", nodesSearched);
			//return currentNode;
		}
		else if(currentNode.letters.length <= BEST) {
			BEST = currentNode.letters.length;
			util.printNearWinner(currentNode, COMPACT_DICT);
		}

		nodesSearched++;
		if(nodesSearched % 1000 === 0) console.log((nodesSearched));

		// Give up on these parameters, try something different.
		//if(nodesSearched % 12000 === 0) return undefined;

		// Construct the next visitable nodes
		constructAdjacentNodes(currentNode, openSet, closedSet);
		//dumpOpenSet(openSet);
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
	//var utility = cost + heuristic;
	var utility = heuristic;

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
	return a.utility - b.utility;
}

/* *
 * Return a heuristic value which underestimates the cost of 
 * finding a solution after choosing chosenWord. 
 */
function H(remainingLetters, chosenWord) {
	// If you can win, then win.
	if(remainingLetters.length === 0) {
		return Infinity;
	}

	var shareRate = getSharedLetterRate(remainingLetters);
	var uncommonRating = getUncommonRate(remainingLetters);
	var vowelRatio = getVowelRatio(remainingLetters);

	// shareRate is high when letters are common.
	var h = (shareRate + (uncommonRating / 100) + (vowelRatio / 1000));

	// Use a little randomness. Typical decent h is .001, so spice it
	// up by adding something between .001 and 0.
	var epsilon = Math.random() / 1000;


	return h + epsilon;
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
 *  Given a word, give it an uncommonnness rating.
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
 * Returns a measure of how many 3 letter combos of word appear
 * in the valid word list per letter. Values are all between 1 and 0.
 *
 * Bigger values mean word has a greater share of valid 3-letter-perms
 */
function getSharedLetterRate(word) {
	var sharedSum = 0;
	var combosTried = 0;

	// Only one ordered permutation of such words.
	if(word.length === 3) {
		return LETTER_SHARE[word];
	}
	else if(word.length < 3) {
		return 0;
	}

	for(i = 0; i < word.length; i++) {
		for(j = i+1; j < word.length; j++){
			for(k = j+1; k < word.length; k++){
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

function banSolution(node) {
	var wList = [];
	var cur = node;
	while(cur.parent) {
		wList.push(cur.word);
		cur = cur.parent;
	}
	BANNED_WORDSET.push(wList);
	console.log("banned solution: ", wList);
	return;
}

function solutionIsBanned(node) {
	for(var i = 0; i < BANNED_WORDSET.length; i++) {
		var curBanList = BANNED_WORDSET[i];
		var cur = node;

		// Check each word in the solution, if we find one
		// word that is different, it's not banned
		var banned = true;
		while(cur.parent) {
			if(curBanList.indexOf(cur.word) !== -1){
				banned = false;
				break;
			}
			cur = cur.parent;
		}
	}

	return false;
}

function findRoot(node) {
	if(node.parent.parent === undefined) return node;
	return findRoot(node.parent);
}

function dumpOpenSet(openSet) {
	while(!openSet.isEmpty()) {
			var tmp = openSet.deq();
			console.log(tmp.letters, tmp.word, tmp.utility, tmp.heuristic);
		}
}
