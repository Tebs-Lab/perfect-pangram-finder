"use strict"
const search = require('./lib/search');
const util = require('./lib/utilities');

// Main entry - load the dictonary then bootstrap the search.
util.loadDict(bootstrapSearch);

function bootstrapSearch(wordList) {
	// create the set of winnable single word sets
	const COMPACT_DICT = util.createCompactDictionary(wordList);
	console.log("created winnable sets");

	const COMPACT_KEYS = Object.keys(COMPACT_DICT);
	console.log(COMPACT_KEYS.length, " Total initial dictionary entries");

	const LETTER_FREQUENCY = util.constructFreqHistogram(COMPACT_KEYS);
	console.log("constructed letter frequency");

	const LETTER_SHARE = util.constructLetterShareHist(COMPACT_KEYS);
	console.log("constructed letter share");


	// GLOBAL CONSTANTS
	var MATCH_LENGTH = parseInt(process.argv[2]); // TODO: better argument handling.
	if(!MATCH_LENGTH) MATCH_LENGTH = 0;

	var CONFIG = {
		// Input Dictionary
		COMPACT_DICT: COMPACT_DICT,
		COMPACT_KEYS: COMPACT_KEYS,

		// Dictionary Stats
		LETTER_FREQUENCY: LETTER_FREQUENCY,
		LETTER_SHARE: LETTER_SHARE,

		// Printing
		MATCH_LENGTH: MATCH_LENGTH,
		VERBOSE: process.argv.indexOf('v') !== -1,

		// Word Choice Control
		KNOWN_SOLUTIONS: [],
		PREFERENCED_WORDS: []
	};
	console.log(CONFIG.MATCH_LENGTH, CONFIG.VERBOSE)
	var solution = search.search(COMPACT_KEYS, CONFIG);
}
