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
	if(process.argv.indexOf('--benchmark') !== -1) {
		CONFIG.reporter = benchReporter;
	}

	absoluteStart = Date.now();
	search.search(COMPACT_KEYS, CONFIG);
}

var absoluteStart;
var snapshotEnd;
var prevExploredCount;
function benchReporter(explored, frontier, CONFIG) {
	// Report every some odd nodes
	let exploredThisTime = explored.size - prevExploredCount;
	if(exploredThisTime < 1000) {
		return;
	}
	prevExploredCount = explored.size;

	snapshotEnd = Date.now();
	let secondsElappsed = (snapshotEnd - absoluteStart) / 1000;

	console.log("============");
	console.log(`Seconds Elappsed:            ${secondsElappsed}`);
	console.log(`Nodes explored per solution: ${explored.size / CONFIG.KNOWN_SOLUTIONS.length}`);
	console.log(`Explored per second:         ${explored.size / secondsElappsed}`);
	console.log(`Explored total:              ${explored.size}`);
	console.log(`Solutions total:             ${CONFIG.KNOWN_SOLUTIONS.length}`);
	console.log(`Current frontier size:       ${frontier.size()}`);
}
