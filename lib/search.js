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
  var frontier = new PriorityQueue(nodeComparator);
  var explored = {}; // Maps "remaining letters" to actual node object
  var root = constructNode(undefined, '');
  frontier.enq(root);

  // Set heuristic statistics from input
  heuristics.setCompactDict(CONFIG.COMPACT_DICT);
  heuristics.setLetterFrequency(CONFIG.LETTER_FREQUENCY);
  heuristics.setLetterShare(CONFIG.LETTER_SHARE);

  while(!frontier.isEmpty()) {

    if(CONFIG.reporter) {
      CONFIG.reporter(explored, frontier, root, CONFIG);
    }

    let currentNode = selectNode(frontier, explored, CONFIG);
    explored[currentNode.letters] = currentNode;

    // Check for a match
    if(currentNode.letters.length <= 0) {
      markSolutionKnown(currentNode);
    }

    expandFrontier(currentNode, frontier, explored);
  }
}

/*
  given the frontier, explored list, and current config, return the next
  selected node.
*/
function selectNode(frontier, explored, CONFIG) {
  let currentNode;

  // Select the best utility, or explore randomly.
  if(Math.random() < CONFIG.EXPLORATION_RATE) {
    let rIdx = Math.floor(Math.random() * (frontier._elements.length - 1));
    currentNode = frontier._elements[rIdx];
  }
  else {
    currentNode = frontier.deq();
  }

  return currentNode;
}

/* *
 * =====SIDE AFFECTING FOR PERFORMANCE, frontier and explored are modified======
 *
 * Given a set of letters (which uniquely identifies a node)
 * construct the set of open adjacent nodes. Using the parameters
 * (which are references)
 */
const frontierLookup = {};
function expandFrontier(currentNode, frontier, explored) {
  // Get the list of available words
  var validWords = pruneList(currentNode.letters);
  for(let i = 0; i < validWords.length; i++){
    let word = validWords[i];
    let nodeLetters = util.removeLettersEfficent(word, currentNode.letters);

    // If we've explored the node, check if we already found solutions from it
    let prevExploredNode = explored[nodeLetters];
    if(prevExploredNode) {
      prevExploredNode.parents[currentNode.letters] = currentNode;
      checkForPangrams(currentNode, prevExploredNode, word);
      continue;
    }

    // If nodeLetters is already on the frontier give it this new parent
    let frontierNode = frontierLookup[nodeLetters];
    if(frontierNode) {
      frontierNode.parents[currentNode.letters] = currentNode;
      continue;
    }

    let node = constructNode(currentNode, nodeLetters);

    frontier.enq(node);
    frontierLookup[node.letters] = node;
  }
}

/* *
 * Given a set of letters remaining, return a list of
 * words from COMPACT_KEYS that can still be made.
 */
function pruneList(remainingLetters) {
  var newList = [];

  if(remainingLetters.length === 0) {
    return newList;
  }

  // PERFORMANCE -- Create a formatted letter count obj once, instead of in checkWord
  var letterCounts = util.letterCountObj(remainingLetters);

  for(let i = 0; i < CONFIG.COMPACT_KEYS.length; i++) {
    let word = CONFIG.COMPACT_KEYS[i];

    // PERFORMANCE -- since moving letterCount to this scope, we avoid using Object.keys(...).length this way
    if(remainingLetters.length < word.length) {
      continue;
    }

    if(util.checkWord(word, letterCounts)){
      newList.push(word);
    }
  }

  return newList;
}

/* *
 * given a parent node; a word to choose; and the letters
 * remaining after choosing the word; return a node object
 */
function constructNode(parent, lettersPostChoice) {
  // Special case for constructing the root node
  if(parent === undefined) {
    return {
      parents: {},
      letters: util.ALL_LETTERS,
      utility: 0,
      subPangrams: []
    }
  }

  var utility = heuristics.getHeuristic(lettersPostChoice);

  // The node!
  let initialParents = {};
  initialParents[parent.letters] = parent;
  var node = {
    parents: initialParents,
    letters: lettersPostChoice,
    utility: utility,
    subPangrams: []
  }

  return node;
}

// Used by our priority queue to properly value the next node
function nodeComparator(a, b) {
  return a.utility - b.utility;
}

/*
  When we expand the frontier and find a node already in explored, and with known subPangrams
  then we may have found brand new perfect pangrams. To that end we call the solution marker
  for every new entry into a node with known subPangrams
*/
function checkForPangrams(newParent, exploredNode, chosenWord) {
  if(exploredNode.subPangrams.length === 0) {
    return;
  }

  for(let i = 0; i < exploredNode.subPangrams.length; i++) {
    let testPangram = new Set(exploredNode.subPangrams[i]);
    testPangram.add(chosenWord);
    markSolutionKnown(newParent, testPangram);
  }
}

/* *
 * Given a node representing a solution, add that list of words to
 * the list of known solutions. This is nessesary because the same set
 * of words can be found in different orders.
 *
 * It returns all the new solutions which can be found from this node!
 */
function markSolutionKnown(node, solutionWords) {
  // First (non-recursive) call
  if(solutionWords === undefined) {
    solutionWords = new Set();
  }

  if(pangramIsUnique(solutionWords, node.subPangrams)) {
    node.subPangrams.push(solutionWords);

    // In this case it's a new sub-pangram on the root node! A SOLUTION!
    if(Object.keys(node.parents).length === 0) {

      // TODO: create a more consistent reporter situation...
      if (!CONFIG.reporter) {
        util.printClarifiedSolution(solutionWords, CONFIG);
      }
    }
  }

  for(let key in node.parents) {
    let parent = node.parents[key];

    // Recurse to mark the rest
    let solutionBuilder = new Set(solutionWords);
    let word = util.removeLettersEfficent(node.letters, key);
    solutionBuilder.add(word);

    markSolutionKnown(parent, solutionBuilder);
  }
}

/* *
 * Given a set of words, determine if the list of known or prviously found solutions
 * matches these words.
 */
function pangramIsUnique(newWordSet, knownSets) {
  for(let i = 0; i < knownSets.length; i++) {
    let curSolutionSet = knownSets[i];
    let allWordsMatch = true;

    for(let word of newWordSet) {
      if(!curSolutionSet.has(word)){
        allWordsMatch = false;
        break;
      }
    }

    // If node matched a solution set, we can return
    if(allWordsMatch){
      return false;
    }
  }

  return true;
}

module.exports = {
  search: search
}
