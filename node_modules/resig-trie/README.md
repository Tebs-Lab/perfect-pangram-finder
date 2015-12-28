# [A Simple JavaScript Trie](http://ejohn.org/blog/javascript-trie-performance-analysis/), by John Resig

## Install

	npm install --save resig-trie

## Usage

```js
var trie = require('trie');

trie.create(['a', 'an', 'banana', 'bananas', 'byte', 'boolean', 'chocolate', 'code', ...]);
//=> <trie object>

trie.serialize(<trie object>, true); // true to create valid JSON
//=> '<trie object as JSON>'

trie.serialize(<trie object>, false); // false to create valid JavaScript (not JSON) - more efficient, but must be `eval`'ed
//=> '<trie object as long string>'

// Warning: this uses eval(), so don't pass user input. When the trie is
// serialized as JSON, you can just JSON.parse() it.
trie.unserialize(<trie string>);
//=> <trie object>

trie.find(<trie object>, 'banana');
//=> true, because 'banana' is in the trie

trie.find(<trie object>, 'microsoft');
//=> false, because 'microsoft' is not in the trie
```

## License
Copyright 2011 John Resig. Josh Oldenburg packaged this as a simple npm module in 2014.

Released under the MIT license.
