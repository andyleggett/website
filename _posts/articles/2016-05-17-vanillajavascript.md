---
layout: post
categories:
  - articles
title: Vanilla Javascript
---

## Happiness in simple things

I've been buried in a two big projects for the whole first part of the year and now they're over it's nice to be doing some smaller things.

I've just been overhauling a simple e-learning project and it's standard fair with a quiz at the end where the user is given 20 random questions out of a bank of 30. The project was originally based partly in PHP with this question selection being done server-side but the client wants to remove the back-end completely and make it 100% client-side.

Anyway I added a small function to do the random selection of questions, was happy with the solution, and remembered how nice it is just creating a simple little thing. Here it is:

```js
var pickRandom = function(n, list){
  var index = Math.floor(Math.random() * (list.length - 1));

  if (n === 0){
    return [];
  } else {
    var remainder = list.slice(0, index - 1).concat(list.slice(index + 1));
    return [list[index]].concat(pickRandom(n - 1, remainder));
  }
};

var randomQuestionSet = pickRandom(20, questions);
```

Of course you'd need to add some input checking - you can't pick 8 from a list of 5, what if n is negative or list is empty or undefined, etc. Let's assume that all the inputs make sense for now.

Essentially it's a recursive definition.

It first calculates an index based on the list it's passed.  It next checks for the end case which is that there are no more items to select.  It that's the case it returns an empty list.  Why? Well it becomes apparent when we look at the recursive case.

The else part of the condition says what to do if the end case isn't met.  If that's true then we create a single item list with the random item we've selected and concatenate the result of calling the function again but this time with a list that has had the selected item removed - the remainder - and picking n - 1 items from that.  You can see now that the function must always return a list - it needs to be concatenated at each stage of the recursion.

I was looking at this and thinking that it was also not mutating state anywhere which is always good.  It couldn't be considered a pure function as it's result is different every time but it doesn't have any side-effects. It has it's arguments in a data last order so we can curry it if needed and I suppose we are also dealing with items in the context of the List monad but I'm no expert on that. It goes without saying that this can be replace with a reduce as is the case for most recursion but the users don't know how clever you're being, right? They're too busy answering the 20 questions...

## In conclusion

This isn't going to set the world on fire but it is nice to remind yourself from time to time that you don't need a framework or library for everything and that functions are powerful entities themselves. Disclaimer: don't listen to me, I may not know what I'm talking about.
