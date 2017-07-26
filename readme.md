# Generating Perfect Pangrams
A pangram is a series of words which use all the letters in a given alphabet. A popular English pangram - which you may have seen when selecting a font in various programs - is "The quick brown fox jumps over the lazy dog". Each letter appears at least once, but some letters, such as U and O appear multiple times.

A perfect pangram is a pangram in which no letters are repeated.

## Motivation

I played a game called "Shh" (which I highly recommend) recently (at the time of this writing). Shh is a collaborative game wherein players act as a team to create perfect pangrams one letter at a time.

After playing Shh and losing terribly several times in a row, I (naively) figured I could write a program which could generate all of the winning combinations. I started with a simple recursive program to generate all possible letter combinations and check each one for being a pangram.

## Run The Code

Clone, then:

```
npm install
npm test # for the tests (which are not exhaustive ... )

node sampleRunner.js # Examine that code to see how the classes are being used
```

The top down solution should complete, and it will print how many perfect pangrams it found before terminating. The heuristic solution currently is too slow to finish on the same input, so it will print to the screen every time it finds 1000 new pangrams.


# Points of Interest

This is a significant challenge, there are 26! == (4.0329146 * 10^26) ways to order 26 letters. Picking just valid words can help... lets say each perfect pangram uses about 5 words and our dictionary is 250,000 words long. (250,000 choose 5) == 8.137695324 * 20^24. Two orders of magnitude better, but still several orders of magnitude too large.

 Two approaches are currently present in this repo, both with different trade-offs at play. Some tactics apply to both approaches (like reducing the state space) whereas some (like the heuristics) are only relevant to one approach. Here are some interesting things I've learned so far:

# Compressing the State Space

I took a dictionary and transformed all the words into their sorted letter set. For example, this way "BAD" and "DAB" are both stored as "ABD". The compressed dictionary I used took ~250,000 words down to ~31,000 unique letter combos which is a massive win.

I use the same fact to understand that each node in the graph will be uniquely identified by the ordered remaining letters, which helps me to not explore previously seen nodes, and to recognize when I've reached a node that's already been found.

## Heuristic Based Search

When you can't explore the whole space... just explore the best parts! After some initial attempts to brute force things (26! was too powerful) I landed on a heuristic based "best first" search, which got me my first results!

These are the major components of the heuristics:

### Vowel Ratio

When I examine the letters remaining after picking a word, I compute #vowels / #unusedLetters. The motivation for this is pretty simple - having more vowels remaining makes it more likely that I'll be able select words using those letters.

### Letter Commonality

When I read in the initial word set, I create a dictionary for each letter in the alphabet and count the number of times each letter appears across all the words. I used this dictionary to prefer nodes where the remaining letters had more common letters.

### Shared 3-Letter Combos

This is similar to the letter commonality heuristic. Again, when processing the initial word set, I created a dictionary which contains all 3-letter combinations which can be made with that word. So for example the letter-set ABC has only one valid combo, but ABCD has [ABC, ABD, BCD]. Remember, I only care about sorted letter-sets after having compressed the initial wordset.

So in the end, must like the letter commonality measure, I have a dictionary mapping all 26 choose 3 possible letter sets mapped to the number of times those combos appear across my wordset. Then I use this to prefer searching nodes where the remaining letters have more valid 3-letter combos.

## Exploration Rate

The heuristics yield valuable results, but they also tend to get stuck in ruts. After picking a word like 'cwm' it sticks to subgraphs which start with that word. It's vowelRatio and the number of 'uncommon' letters it removes is just too much to overcome. Pyx is a similar word in the dictionary I used.

Letting the agent explore randomly every so often yielded somewhat more varied perfect pangrams instead of getting stuck generating all the perfect pangrams that use 'cwm'.

# Bottom Up Approach

Months after I got the heuristic search working, I was daydreaming about this project and thought to apply a Dynamic Programming approach. Instead of starting my search from "all letters" and removing words one by one, in this approach I start from the "solution node" and build the graph one layer at a time.

Each layer contains all the nodes "n letters away" from the solution. For example, in most dictionaries the 1-depth layer will contain "a" and "I", the two one-letter words in English. The next layer will contain a node for "A,I", and other nodes for "an", "am", "in", "be" and every other valid two-letter word.

Each time I build a layer, I rely on the existence of layers higher up being the complete list of "letter sets that lead to a solution" of a particular length.

## Tradeoffs

The weakness of the top down solution (currently) is that while it explores significantly fewer dead-end nodes (0 of them) it must generate the entire relevant state space before it can find ANY perfect pangrams. This means it cannot find anything in larger spaces (longer alphabet, more words in the dictionary).

Heuristic search, on the other hand, quickly finds the first several hundred perfect pangrams in a complete (26 letter) search space, then slows. So far in the 26 letter space, the top-down solution has not run to completion.

However, the top down approach finds all 26,000 perfect pangrams in a reduced alphabet of 15 letters in about three seconds. The heuristic search takes about 4 minutes to generate about 7000 of those 26,000 perfect pangrams.
