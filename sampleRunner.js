const PangramTopDownDag = require('./lib/pangram-top-down-tree');
const PangramHeuristicSearch = require('./lib/pangram-heuristic-search');
const utils = require('./lib/pangram-string-utilities');
/*
  Entry function into finding pangrams by using a Dynamic Programming tactic, building
  pangrams from the provded PangramGraph by building a tree.

  First, find all the words that contain exactly 1 letter. The nodes built are the
  nodes "1 letter away" from the solution node. Then build all the nodes "2 letters away",
  meaning you build nodes using every 2 letter word, then each available 1 letter word to
  join with all the nodes from the previous step... Then continue until you have built the
  tree layer by layer where each layer are all the nodes "n letters away" from being a perfect
  pangram. Using this tactic [should be] significantly faster than the heuristics based approach,
  especially if the heuristics are complex to compute.

   Supppose:
    alhbet: BADRIG
    words: [A, I, BIG, BAD, AD, RIG]
    layers built:
      ''
      A I;
      AD, I->A, A->I
      BIG, BAD, RIG, I->AD
      A->BIG
      AD->BIG, AD->RIG
      BAD->RIG (ONLY SOLUTION)

*/
function findAllPangrams(words) {
  // const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const alphabet = 'ABCDEFGHILMNO';

  let graph = new PangramTopDownDag(alphabet, words);
  graph.generateTreeToDepth();
  console.log(graph.getKnownPangrams().size);
  //
  let graph2 = new PangramHeuristicSearch(alphabet, words);
  graph2.search();
  graph.getKnownPangrams();
}

utils.loadDict(process.cwd() + '/scrabble-dictionary.csv', findAllPangrams);
// findAllPangrams().catch((e) => { throw e; });
