


loadDict(runTests);

function runTests(wordList){
	var trie = require('resig-trie');
	dictTrie = trie.create(wordList);
	console.log("created trie");

	var tests = {
		'A': true,
		'AC': true,
		'ACT': true,
		'ACTO': true,
		'ACTOR': true
	}

	for(word in tests) {
		console.log(word, trie.maybe(word, dictTrie) === tests[word]);
	}
}
