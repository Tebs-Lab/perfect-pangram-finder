const utils = require('./pangram-string-utilities');

class PangramHeuristic {
  /*
    Given a target alphabet and an iterable of letterSets (keys of a compact dictionary for example),
    construct a heuristic generator. Specifically a threeLettershare, singleLettershare
  */
  constructor(targetAlphabet, targetWords) {
    this._threeLetterShare = utils.constructSingleLetterHistogram(targetWords, targetAlphabet);
    this._singleLetterShare = utils.constructThreeLetterHistogram(targetWords, targetAlphabet);
    this._validLetterSets = new Set(targetWords);
  }

  /*
    Given the letters set for a node, return a heuristic that weights
    the 3 components of 1-letter-share, 3-letter-share and vowel ratio.

      letterSet {string}: a sorted string with at most one copy of each letter
      returns {float}: the heuristic for this node -- low numbers are "better".
  */
  computeWeightedHeuristic(letterSet) {
    // If you can win, then win.
    if(letterSet.length === 0) {
      return Infinity;
    }
    if(this._validLetterSets.has(letterSet)) {
      return 1;
    }

    var shareRate = this.computeThreeLetterShareRate(letterSet);
    var uncommonRating = this.computeOneLetterShareRate(letterSet);
    var vowelRatio = PangramHeuristic.getVowelRatio(letterSet);

    // shareRate is high when letters are common.
    var h = (shareRate + (uncommonRating / 100) + (vowelRatio / 200));

    return h;
  }

  /* *
   * Returns a measure of how many 3 letter combos of letterSet appear
   * in the valid letterSet list per letter. Values are all between 1 and 0.
   *
   * Bigger values mean letterSet has a greater share of valid 3-letter-permutations
   */

  computeThreeLetterShareRate(letterSet) {
    var sharedSum = 0;
    var combosTried = 0;

    // Only one ordered permutation of such words.
    if(letterSet.length === 3) {
      return this._threeLetterShare.get(letterSet);
    }
    else if(letterSet.length < 3) {
      return 0;
    }

    for(let i = 0; i < letterSet.length; i++) {
      for(let j = i+1; j < letterSet.length; j++){
        for(let k = j+1; k < letterSet.length; k++){
          let joined = letterSet[i] + letterSet[j] + letterSet[k];
          let share = this._threeLetterShare.get(joined)
          sharedSum += share;
          combosTried += 1;
        }
      }
    }

    return sharedSum / combosTried;
  }

  /**
   *  Given a letterSet, give it an uncommonnness rating.
   */
  computeOneLetterShareRate(letterSet) {
    var sum = 0;
    for(let char of letterSet) {
      sum += this._threeLetterShare.get(char);
    }

    return sum / letterSet.length;
  }

  /**
   *  Given a word, return the percent of the letters which are
   *  vowels.
   */
  static getVowelRatio(letterSet){
    var vowelCount = PangramHeuristic.getVowelCount(letterSet);
    return vowelCount / letterSet.length;
  }

  /* return the number of ENGLISH VOWELS in the letterSet */
  static getVowelCount(letterSet) {
    var m = letterSet.match(/[aeiouy]/gi);
    return m === null ? 0 : m.length;
  }
}


module.exports = PangramHeuristic ;
