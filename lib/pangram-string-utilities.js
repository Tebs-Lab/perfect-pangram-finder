/*
   Throughout this module, a common assumption about a strings will be
   that the string sorted and already contains at most 1 copy of any letter...
   These assumptions allow specific performance optimizations and are called out
   in the documentation for functions that have that assumption. For clarity the
   name letterSet will be used to refer to such strings, and the term word will
   be used for strings that may not follow those rules
*/

function loadDict(path, callback) {
  var results = [];
  var rl = require('readline').createInterface({
    input: require('fs').createReadStream(path)
  });

  rl.on('line', function (line) {
    results.push(line.toUpperCase());
  });

  rl.on('close', function(){
    callback(results);
  });
}

/*
   Create a compact version of the dictionary, such that
   each key is an ordered set of letters which makeup that word
   and the values are a list of all the words which can be
   constructed from those letters, for example:

   ABD: ['BAD', 'DAB']

    wordList {Array[string]}: a list of words (note lettersets)
    alphabet {string}: a letterSet representing the full valid alphabet for the wordList

    returns {Map[string => Array[string]]}

    TODO: conjunctions don't work due to the alphabet restriction -- we may wish to
    allow such words, meaning punctuation would have to be handled specially.
 */
function createCompactDictionary(wordList, alphabet) {
  let compactDictionary = new Map();
  let alphaSet = new Set(alphabet);
  for(let i in wordList) {
    let word = wordList[i];

    // Remove words that repeat characters, or have characters outside the alphabet
    let characterCounts = countCharacters(word);
    let skipWord = false;
    for(let [character, count] of characterCounts){
      if(count !== 1 || !alphaSet.has(character)){
        skipWord = true;
        break;
      }
    }

    if(skipWord) {
      continue;
    }

    // Associate each sorted letter-set with all words that contain the same letters.
    let sorted = word.split('').sort().join('');
    if(compactDictionary.get(sorted) === undefined) {
      compactDictionary.set(sorted, []);
    }

    compactDictionary.get(sorted).push(word);
  }

  return compactDictionary;
}

/**
   Given a letterSet and a Map which maps a letterSet to it's counts
   return true only if the word contains letters that are also in the
   provided Set of letters: letterSetCount.

    letterSetCheck {string}: a letterSet being checked
    letterSetAvailable {Set[string]}: a set containing the remaining valid letters

 */
function allLettersIn(letterSetCheck, letterSetAvailable) {
  for(let i = 0; i < letterSetCheck.length; i++) {
    if(!letterSetAvailable.has(letterSetCheck[i])) {
      return false;
    }
  }

  return true;
}

/* *
   Return a dictionary with the number of times a given character
   appears in the string. For Example:
   ABCC yields {A:1, B:1, C:2}

    inputString {string}: a string to be mapped to it's character counts
 */
function countCharacters(inputString){
  var characterCounts = new Map();

  for(let character of inputString){

    let val = characterCounts.get(character)
    if(val === undefined) {
      val = 0;
    }

    val = val + 1;
    characterCounts.set(character, val);
  }

  return characterCounts;
}

/*
  Provided 2 letterSets, remove all the letters in removeLetters from baseLetters and
  return the resulting sorted letterSet.

  Warning:
  Relying on the fact that both word and letters are sorted, and contain exactly one
  copy of each letter, we can remove every letter that exists in both word and letters
  from letters, and return the result. This is MUCH faster than the naive regex solution
  I was using before.

    baseLetters {string}: A sorted letterSet
    removeLetters {string}: A sorted letterSet
*/
function removeLetters(baseLetters, removeLetters) {
  let matchedIdx = 0;
  let nodeLetters = '';

  for(let i = 0; i < baseLetters.length; i++) {
    let curChar = baseLetters[i];
    if(curChar === removeLetters[matchedIdx]) {
      matchedIdx++;
    }
    else {
      nodeLetters += curChar;
    }
  }

  return nodeLetters;
}


/*
  Given a set of letters and a list of words, return the valid list of letterSets that
  can still be made from the provided letters.

    remainingLetters {string}: the letters that can still be used to make a word
    initialWordList {Array[string]}: the list of words to be filtered
*/
function prunedWordList(remainingLetters, initialWordList) {
  let newList = [];
  if(remainingLetters.length === 0) {
    return newList;
  }

  // PERFORMANCE -- Create a formatted letter count obj once
  let letterSetRemaining = new Set(remainingLetters);
  for(let word of initialWordList) {
    // PERFORMANCE -- since moving letterCount to this scope, we avoid using Object.keys(...).length this way
    if(remainingLetters.length < word.length) {
      continue;
    }

    if(allLettersIn(word, letterSetRemaining)){
      newList.push(word);
    }
  }

  return newList;
}

/* *
 * Construct a normalized histogram. The values sum to 1
 * and the value associated with each letter is a measure of how
 * frequently it is used. Higher values mean more frequent use.
 *
 * TODO: Write tests for this.
 */
function constructSingleLetterHistogram(validWords, alphabet){
  var letterHistogram = new Map();
  var totalLetterCount = 0;

  // Faster than branching? TODO: prove this is actually an optimization
  for(let char of alphabet){
    letterHistogram.set(char, 0);
  }

  // Count ALL the possible remaining letters
  for(let curWord of validWords) {

    for(let char of curWord){
      let oldV = letterHistogram.get(char);
      letterHistogram.set(char, oldV + 1);
      totalLetterCount += 1;
    }
  }

  // Each letter to be given it's percent commonness
  for(let letter in letterHistogram) {
    letterHistogram.set(letter, letterHistogram.get(letter) / totalLetterCount);
  }

  return letterHistogram;
}

/* *
 * Construct a histogram where the keys are 3 letter combos. This returns
 * a noramlized histogram representing frequency of 3 letters used together.
 * Values sum to one and high values are associated with more common combos.
 */
function constructThreeLetterHistogram(validWords, alphabet) {
  var letterShareHist = new Map();
  var totalSum = 0;

  // Faster than branching in the main loop?
  for(let i = 0; i < alphabet.length; i++){
    for(let j = i+1; j < alphabet.length; j++){
      for(let k = j+1; k < alphabet.length; k++){
        let joined = alphabet[i] + alphabet[j] + alphabet[k];
        letterShareHist.set(joined, 0);
      }
    }
  }

  // Construct the instances of 3 letters being shared
  for(let wordIdx = 0; wordIdx < validWords.length; wordIdx++) {
    let word = validWords[wordIdx];
    for(let i = 0; i < word.length; i++) {
      for(let j = i+1; j < word.length; j++){
        for(let k = j+1; k < word.length; k++){
          let joined = word[i] + word[j] + word[k];
          let curVal = letterShareHist.get(joined);
          letterShareHist.set(joined, curVal + 1);
          totalSum += 1;
        }
      }
    }
  }

  // Each letter is given it's percent share of common-ness.
  for(let [letter, value] of letterShareHist.entries()){
    letterShareHist.set(letter, value / totalSum);
  }

  return letterShareHist;
}

module.exports = {
  loadDict,
  createCompactDictionary,
  allLettersIn,
  countCharacters,
  removeLetters,
  prunedWordList,
  constructSingleLetterHistogram,
  constructThreeLetterHistogram
}
