# Generating Perfect Pangrams
A pangram is a series of words which use all the letters in a given alphabet. A popular English pangram - which you may have seen when selecting a font in various programs - is "The quick brown fox jumps over the lazy dog". Each letter appears at least once, but some letters, such as U and O appear multiple times. 

A perfect pangram is a pangram in which no letters are repeated.

This program uses a stochastic+heuristic search method to generate perfect pangrams. 

## Run The Code

Clone, then:

```
npm install
node findPangrams.js [0-26] [v]
```

The program will simply output text to your console each time the algorithm encouters a new perfect pangram. 

### Options
__Match length__ 0-26 defines the match length. 0 means "only perfect pangrams", 1 means perfect pangrams as well as near-perfect near-pangrams that do not use 1 of the 26 letters; 26 will print on every explored node.

__Verbose__ v the program to verbose mode. 

Standard output is compatible with CSV:

```
SH, PLY, TD, FRIZ, JACK, QUNG, WOMB, VEX;
```

Verbose output gives the number of nodes explored, and the path from root that was explored to find a solution. At each node of exploration you see the letter set which was chosen, and the real English words associated with that set. Finally, on the right you see the heuristic value associated with those choices:

```
SOLUTION:
At: 1219
---------------
PLY, TD, FRIZ, JACK, QUNG, WOMB, VEX;
remaining letters:
  2, SH

LPY: PLY, 1.00000
DT: TD, 1.00000
FIRZ: FRIZ, 0.00217
ACJK: JACK,JACK, 0.00210
GNQU: QUNG, 0.00201
BMOW: WOMB, 0.00199
EVX: VEX, 0.00197
```

Issues: Currently the program uses a hardcoded path to it's dictionary. This path is located in utilities.js, in the loadDict function. Specifically it uses `/usr/share/dict/words` and expects a uniqe word per line. 

# Points of Interest

This is an NP hard problem, so getting to a solution involved more than just brute force. These are the things that helped the most:

## Compressing the State Space

I took a dictionary and transformed all the words into their sorted letter set. For example, this way "BAD" and "DAB" are both stored as "ABD". The compressed dictionary I used took ~250,000 words down to ~31,000 unique letter combos which is a massive win. 

Use the same fact to understand that each node in the graph will be uniquely identified by the ordered remaining letters, which helps me to not explore previously seen nodes. 

## Heuristics

### Vowel Ratio

When I examine the letters remaining after picking a word, I compute #vowels / #unusedLetters. The motivation for this is pretty simple - having more vowels remaining makes it more likely that I'll be able select words using those letters.

### Letter Commonality

When I read in the initial word set, I create a dictionary for each letter in the alphabet and count the number of times each letter appears across all the words. I used this dictionary to prefer nodes where the remaining letters had more common letters.

### Shared 3-Letter Combos

This is similar to the letter commonality heuristic. Again, when processing the initial word set, I created a dictionary which contains all 3-letter combinations which can be made with that word. So for example the letter-set ABC has only one valid combo, but ABCD has [ABC, ABD, BCD]. Remember, I only care about sorted letter-sets after having compressed the initial wordset. 

So in the end, must like the letter commonality measure, I have a dictionary mapping all 26 choose 3 possible letter sets mapped to the number of times those combos appear across my wordset. Then I use this to prefer searching nodes where the remaining letters have more valid 3-letter combos. 

## Motivation

I played a game called "Shh" (which I highly recommend) recently (at the time of this writing). Shh is a collaborative game wherein players act as a team to create perfect pangrams one letter at a time. 

After playing Shh and losing terribly several times in a row, I (naively) figured I could write a program which could generate all of the winning combinations. I started with a simple recursive program to generate all possible letter combinations and check each one for being a pangram. Unfortunately for me there are 26! ~= 4.0329146e26 uniqe ways to order 26 letters. 

Eventually I landed on a method roughly based on A* search. I added some very simplistic randomness in order to generate pangrams that didn't exactly fit my heursitic, as well as to avoid the local maximum problem (since my heuristic is very similar to hill climbing).

Generating a list of all perfect pangrams is NP-Hard, so surely this solution could be improved. It also makes it that much more fun. At the time of this writing, my MacBook Pro can generate ~700 perfect pangrams in about 35 minutes.

