var should = require('should');
var trie = require('..');

// https://en.wikipedia.org/wiki/List_of_harry_potter_spells
// Dictionary large enough to be worthwhile, but small enough to be manageable
var words = ['accio', 'aguamenti', 'alohomora', 'anapneo', 'aparecium', 'avadakedavra', 'avis',
	'caveinimicum', 'colloportus', 'confringo', 'confundo', 'crucio', 'defodio', 'deletrius',
	'densaugeo', 'deprimo', 'descendo', 'diffindo', 'duro', 'engorgio', 'episkey', 'erecto',
	'evanesco', 'expectopatronum', 'expelliarmus', 'expulso', 'ferula', 'finiteincantatem',
	'falgrate', 'furnunculus', 'geminio', 'glisseo', 'homenumrevelio', 'impedimenta', 'imperio',
	'impervius', 'incarcerous', 'incendio', 'langlock', 'legilimens', 'levicorpus', 'liberacorpus',
	'locomotor', 'locomotormortis', 'lumos', 'meteolojinxrecanto', 'mobiliarbus', 'mobilicorpus',
	'morsmordre', 'muffliato', 'nox', 'obliviate', 'obscuro', 'oppugno', 'orchideous', 'pack',
	'peskipiksipesternomi', 'petrificustotalus', 'piertotumlocomotor', 'pointme', 'priorincantato',
	'protego', 'protegohorribilis', 'protegototalum', 'quietus', 'reducio', 'reducto', 'relashio',
	'rennervate', 'reparo', 'repellomuggletum', 'rictusempra', 'riddikulus', 'salviohexia',
	'scourgify', 'sectumsempra', 'serpensortia', 'silencio', 'sonorus', 'specialisrevelio', 'stupefy',
	'tarantallegra', 'tergeo', 'waddiwasi', 'wingardiumleviosa']; // Dang, there's a lot of those

describe('trie', function() {
	it('should create a trie correctly', function() {
		trie.create.should.be.a.Function;
		should(trie.create()).be.null;
		should(trie.create([])).be.null;
		trie.create(words).should.be.an.Object;
	});

	it('should be able to find words', function() {
		trie.find('muffliato', trie.create(words)).should.be.true;
		trie.find('wingardiumleviosa', trie.create(words)).should.be.true;
	});

	it('should not be able to find nonexistant words', function() {
		trie.find('undetectableextensioncharm', trie.create(words)).should.be.false;
	});

	it('should serialize as JSON correctly', function() {
		var trieObj = trie.create(words);
		var serialized = trie.serialize(trieObj, true);
		var parsed = JSON.parse(serialized);
		parsed.should.not.be.null;
		parsed.should.eql(trieObj);

		parsed = trie.unserialize(serialized);
		parsed.should.not.be.null;
		parsed.should.eql(trieObj);

		trie.find('avadakedavra', parsed).should.be.true;
		trie.find('abracadabra', parsed).should.be.false;
	});

	it('should serialize compactly correctly', function() {
		var trieObj = trie.create(words);
		var serialized = trie.serialize(trieObj, false);
		parsed = trie.unserialize(serialized);
		parsed.should.not.be.null;
		parsed.should.eql(trieObj);

		trie.find('avadakedavra', parsed).should.be.true;
		trie.find('abracadabra', parsed).should.be.false;
	});
});
