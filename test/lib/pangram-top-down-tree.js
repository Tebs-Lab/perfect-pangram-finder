const PangramTopDownDag = require('../../lib/pangram-top-down-tree');
const { expect } = require('chai');

describe("PangramTopDownDag", () => {
  it("returns perfect pangrams in small search spaces...", () => {
    let alphabet = 'abdgir'; // bad, rig is a perfect pangram
    let words = ['a', 'i', 'big', 'bad', 'ad', 'rig'];
    let graph = new PangramTopDownDag(alphabet, words);
    graph.generateTreeToDepth(); // default depth should go to max depth...
    let pangrams = graph.getKnownPangrams();

    expect(pangrams.size).to.equal(1);
    for(let onlyPangram of pangrams) {
      expect(onlyPangram.split(';')).to.have.all.members(['abd', 'gir']);
    }
  });
});
