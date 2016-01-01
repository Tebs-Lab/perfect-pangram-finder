# Generating Perfect Pangrams
A pangram is a series of words which use all the letters in a given alphabet. A popular English pangram - which you may have seen when selecting a font in various programs - is "The quick brown fox jumps over the lazy dog". Each letter appears at least once, but some letters, such as U and O appear multiple times. 

A perfect pangram is a pangram in which no letters are repeated.

This program uses a stochastic+heuristic search method to generate perfect pangrams. 

## Run The Code

Clone, then:

```
npm install
node findPangrams.js
```

The program will simply output text to your console each time the algorithm encouters a new perfect pangram. Sample output:

```
=================WINNER=====================
MUV [ 'VUM' ] Infinity
DEZ [ 'ZED' ] 1.00000
AGLRSW [ 'GRAWLS' ] 0.00193
HOPQ [ 'QOPH' ] 0.00204
CKT [ 'TCK' ] 0.00195
BFI [ 'FIB' ] 0.00192
JNXY [ 'JYNX', 'JYNX' ] 0.00194
```

The words on the left are sorted letter combinations, the words in each list are the valid words (according to the input dictionary) which can be spelled using those letters. The number values are the heuristic values associated with the node at which a particular word was selected (roudned to 5 decimals).

Issues: Currently the program uses a hardcoded path to it's dictionary. This path is located in utilities.js, in the loadDict function. Specifically it uses `/usr/share/dict/words` and expects a uniqe word per line. 

## Motivation

I played a game called "Shh" (which I highly recommend) recently (at the time of this writing). Shh is a collaborative game wherein players act as a team to create perfect pangrams one letter at a time. 

After playing Shh and losing terribly several times in a row, I (naively) figured I could write a program which could generate all of the winning combinations. I started with a simple recursive program to generate all possible letter combinations and check each one for being a pangram. Unfortunately for me there are 26! ~= 4.0329146e26 uniqe ways to order 26 letters. 

Eventually I landed on a method roughly based on A* search. I added some very simplistic randomness in order to generate pangrams that didn't exactly fit my heursitic, as well as to avoid the local maximum problem (since my heuristic is very similar to hill climbing).

Generating a list of all perfect pangrams is NP-Hard, so surely this solution could be improved. It also makes it that much more fun. At the time of this writing, my MacBook Pro can generate ~700 perfect pangrams in about 35 minutes.

