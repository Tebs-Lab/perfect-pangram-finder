


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

function loadDict(callback) {
  var results = [];
  var rl = require('readline').createInterface({
    input: require('fs').createReadStream('/usr/share/dict/words')
  });


  // for every new line, if it matches the regex, add it to an array
  // this is ugly regex :)
  rl.on('line', function (line) {
    results.push(line.toUpperCase());
  });


  // readline emits a close event when the file is read.
  rl.on('close', function(){
  	callback(results);
  });
}

