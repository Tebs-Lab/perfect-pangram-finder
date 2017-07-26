const utils = require('./pangram-string-utilities');
const heuristics = require('./heuristics');
const PriorityQueue = require('priorityqueuejs');

class Node {
  constructor(parent, remainingLetters, utility) {
    this.parents = new Map();
    if(parent !== null) {
      this.parents.set(parent.remainingLetters, parent);
    }
    this.remainingLetters = remainingLetters;
    this.utility = utility;
    this.subPangrams = [];
  }
}

function nodeComparator(a, b) {
  return a.utility - b.utility;
}


class PangramHeuristicGraphSearch {
  constructor(alphabet, dictionary, explorationRate = 0) {
    this._alphabet = alphabet.split('').sort().join('');
    this._alphabetCounts = utils.countCharacters(this._alphabet);
    this._dictionary = utils.createCompactDictionary(dictionary, this._alphabet);

    this._rootNode = new Node(null, this._alphabet, '');
    this._frontier = new PriorityQueue(nodeComparator);
    this._explored = new Map();
    this._frontier.enq(this._rootNode);
    this._knownLetterSets = new Map();

    this._knownPerfectPangrams = new Set();

    heuristics.setCompactDict(this._dictionary);
    heuristics.setLetterFrequency(utils.constructFreqHistogram(this._dictionary, this._alphabet));
    heuristics.setLetterShare(utils.constructLetterShareHist(this._dictionary, this._alphabet));
  }

  search() {
    while(!this._frontier.isEmpty()) {
      let currentNode = this._selectNode();
      this._explored.set(currentNode.remainingLetters, currentNode);

      if(currentNode.remainingLetters.length === 0) {
        this._handleSolutionCandidate(currentNode)
      }

      this._expandFrontier(currentNode);
    }
  }

  getKnownPangrams() {
    return this._knownPerfectPangrams;
  }

  /*
    Given a single node, expand the frontier by adding all the neighbors of
    the provided node to the frontier
  */
  _expandFrontier(expansionNode) {
    let allWords = this._dictionary.keys(); // TODO: room for a micro-optimization to compare fewer words
    let validWords = utils.prunedWordList(expansionNode.remainingLetters, allWords);

    for(let word of validWords) {
      let newLetters = utils.removeLetters(expansionNode.remainingLetters, word);
      let newNode = this._explored.get(newLetters);

      // If we've found a new way to a known node, it's possible
      // weve found a new perfect pangram
      if(newNode !== undefined && newNode.subPangrams.length > 0) {
        this._handleSubPangrams(expansionNode, newNode, word);
      }

      // If nodeLetters is already on the frontier give it this new parent
      let frontierNode = this._knownLetterSets.get(newLetters);
      if(frontierNode !== undefined) {
        frontierNode.parents.set(currentNode.letters) = currentNode;
        continue;
      }

      let utility = heuristics.getHeuristic(newLetters);
      let node = new Node(expansionNode, newLetters, utility);

      this._frontier.enq(node);
      this._knownLetterSets.set(node.letters, node);
    }
  }

  _handleSubPangrams(nodeBeingExplored, rediscoveredNode, word) {
    for(let subWords of rediscoveredNode.subPangrams) {
      let testPangram = new Set(subWords);
      testPangram.add(word);
      this._handleSolutionCandidate(nodeBeingExplored, testPangram);
    }
  }

  /* *
   * Given a node representing a solution, add that list of words to
   * the list of known solutions. This is nessesary because the same set
   * of words can be found in different orders.
   *
   * It returns all the new solutions which can be found from this node!
   */
  _handleSolutionCandidate(node, solutionWords) {
    // First (non-recursive) call
    if(solutionWords === undefined) {
      solutionWords = new Set();
    }

    node.subPangrams.push(solutionWords);
    if(node === this._rootNode) {
      let cannonizedPangram = Array.from(solutionWords).sort().join(';');
      if(!this._knownPerfectPangrams.has(cannonizedPangram)) {
        this._knownPerfectPangrams.add(cannonizedPangram);
        console.log(cannonizedPangram);
      }
    }

    // Now recurse to mark all the nodes known to this node as members of a solution
    for(let [letters, parent] of node.parents.entries()) {
      let solutionBuilder = new Set(solutionWords);
      let word = utils.removeLetters(letters, node.remainingLetters);
      solutionBuilder.add(word);

      this._handleSolutionCandidate(parent, solutionBuilder);
    }
  }

  /*
    Depending on the exploration rate, fetch the top priority node or a random one.
  */
  _selectNode() {
    let currentNode;

    // Select the best utility, or explore randomly.
    if(Math.random() < this._explorationRate) {
      let rIdx = Math.floor(Math.random() * (this._frontier._elements.length - 1));
      currentNode = this._frontier._elements[rIdx];
    }
    else {
      currentNode = this._frontier.deq();
    }

    return currentNode;
  }

  _propogateSolution(node) {

  }
}

module.exports = PangramHeuristicGraphSearch;
