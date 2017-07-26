const utils = require('./pangram-string-utilities');

class Node {
  constructor(remainingLetters, usedLetters){
    this.remainingLetters = remainingLetters;
    this.usedLetters = usedLetters;
    this.parents = [];
    this.children = [];
  }
}

class PangramTopDownDag {
  /*
    Given an alphabet (string), and a dictionary (array of words), create an empty graph
    which has utilities and features to find perfect-pangrams using a top-down approach.

    The PangramTopDownDag significantly reduces the state-space of the provided alphabet
    and dictionary in multiple ways:

    1. By turning words into "letterSets" -- bad and dab both become "abd" and a mapping is stored
    to the original words "abd" => ["bad", "dab"]. Any pangram that contains bad could just as easily
    contain dab.

    2. By removing all words that contain the same letter more than once. No perfect-pangrams can
    be made using such words.

    3. To aid in the comparing of letterSets all letterSets are sorted throughout the use of this implementation.

    alphabet {string} -- the valid set of characters for your alphabet (case sensitive)
    dictionary {Array[string]} -- the valid set of words that will be used to make pangrams (case sensitive)
  **/
  constructor(alphabet, dictionary) {
    this._alphabet = alphabet.split('').sort().join('');
    this._alphabetCounts = utils.countCharacters(this._alphabet);
    this._dictionary = utils.createCompactDictionary(dictionary, this._alphabet);

    // init all possible lenghts even if there are not matching words
    this._dictionaryByLength = new Map();
    for(let i = 0; i <= alphabet.length; i++){
      this._dictionaryByLength.set(i, []);
    }

    // add all words to their proper length location
    for(let [letterSet, allWords] of this._dictionary) {
      this._dictionaryByLength.get(letterSet.length).push(letterSet)
    }

    this._nodesAtDepth = new Map(); // int -> Array[node]
    this._rootNode = new Node(this._alphabet, '');
    this._nodesAtDepth.set(0, new Set([this._rootNode]));
    this._validLetterSetsAtDepth = new Map();

    this._knownLetterSets = new Map(); // Map string=>Array[node] (SHOULD BE MEMBER OF OF NODES AT DEPTH)
    this._knownPerfectPangrams = new Set();
  }

  /*
    Generate the tree down to a specified height. It's possible to find pangrams as early as depth = alphabet.length / 2
  */
  generateTreeToDepth(depth = this._alphabet.length){
    for(let d = 1; d <= this._alphabet.length; d++){
      this._deepenTo(d);
    }
  }

  /*
    To get the known pangrams, we look at the nodes at each depth and their "mirror" depth.
    If depth is the length of the alphabet, those nodes are already pangrams and all traversals that
    takes us from that node to the top represent a pangram. If the tree has been expanded to max-depth
    then we only need to consider the leaf nodes, as they will encode all possible p.pangrams

    For non-max depth we look for nodes at depth d and depth (alphabet.length - d). If nodes at those
    two depths can be combined, then they can create a perfect pangram between them.
  */
  getKnownPangrams() {
    let pangramNodes = this._nodesAtDepth.get(this._alphabet.length);
    let pangrams = [];
    for(let baseNode of pangramNodes) {
      this._collectTowardsTop(baseNode);
    }

    return this._knownPerfectPangrams;
  }

  /*
    Traverse the tree upwards while collecting letters used at each edge
  */
  _collectTowardsTop(baseNode, wordsBelow = []) {
    if(baseNode.remainingLetters === this._alphabet) {
      let cannonizedPangram = wordsBelow.sort().join(';')
      if(!this._knownPerfectPangrams.has(cannonizedPangram)) {
        this._knownPerfectPangrams.add(cannonizedPangram);
      }
    }

    let chains = [];
    for(let parent of baseNode.parents) {
      let newWordsBelow = wordsBelow.slice();
      let wordUsed = utils.removeLetters(parent.remainingLetters, baseNode.remainingLetters);
      newWordsBelow.push(wordUsed);
      this._collectTowardsTop(parent, newWordsBelow);
    }
  }

  /*
    We will deepen iteratively -- each time we expand to a new depth we are ensuring
    that only letterSets which can be used to create a solution are expanded. We can
    only do this because we know all the nodes closer to the solution have already
    been created.
  */
  _deepenTo(depth){
    let newLayer = new Set();

    // First handle the new length -- words of that length are unknown and cannot rely on the "mirroring" effect
    for(let d = 0; d < depth; d++){
      let currentLayerAbove = this._nodesAtDepth.get(d);
      let wordLength = depth - d;

      // The only time we consider NEW words are words that connect directly to the root.
      let correctLengthWords = this._dictionaryByLength.get(wordLength);
      if(d !== 0) {
        correctLengthWords = this._validLetterSetsAtDepth.get(wordLength);
      }

      // All nodes in currentLayerAbove will have letters length d -- for d==0 it will be the root node only
      for(let node of currentLayerAbove) {
        let filteredWords = utils.prunedWordList(node.remainingLetters, correctLengthWords);

        for(let word of filteredWords) {
          let newLettersRemaining = utils.removeLetters(node.remainingLetters, word);

          let newNode = this._knownLetterSets.get(newLettersRemaining);
          if(newNode === undefined) {
            newNode = new Node(newLettersRemaining, utils.removeLetters(this._alphabet, newLettersRemaining));
            this._knownLetterSets.set(newLettersRemaining, newNode);
          }

          newNode.parents.push(node);
          node.children.push(newNode);
          newLayer.add(newNode);
        }
      }
    }

    this._nodesAtDepth.set(depth, newLayer);
    this._validLetterSetsAtDepth.set(depth, Array.from(newLayer).map((n) => { return n.usedLetters }))
  }
}


module.exports = PangramTopDownDag;
