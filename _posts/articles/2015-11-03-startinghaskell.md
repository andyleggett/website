---
layout: post
categories:
  - articles
title: What does Haskell teach me about Javascript?
---

I was away in North Uist during the summer and due to the wonderful lack of connectivity I decided to get on with learning all about Haskell.  Having been using a functional style for a while now I wanted to get right into the guts and have a poke around.  I saw Monoids and Monads lurking on the horizon but starting out easy is always the best bet.  

What I want to talk about in this article is some of the solutions I came up with from the 99 haskell problems (<a href="https://wiki.haskell.org/H-99:_Ninety-Nine_Haskell_Problems" class="article-link" target="_blank">https://wiki.haskell.org/H-99:_Ninety-Nine_Haskell_Problems</a>).  I want to show you some of the Haskell solutions I cam up with and how they would look in Javascript especially using ES2015 syntax. As always I'll be using the amazing Ramda to do my dirty work.

# Length of a list
In Haskell you build your program from pure functions that encapsulate the _intent_ of your program and it's constituent parts.  _Type annotations_ make you think clearly about what each function is trying to achieve and help you implement it to some extent.  It's a good habit to get into even in Javascript where they're only comments.

The _lengthOfList_ function is an example of a recursive function, that is a function that calls itself as part of a calculation.  Finding the length of a list involves breaking the list into it's head and tail.  The head is counted as one element and the process is repeated with the tail of the list.  We need a _base_ case to tell the recursion where to stop.  In this problem when we get to the point where we run out of elements (i.e. we get the empty list as the tail) we add 0 and don't call the function anymore.

```hs
lengthOfList :: [a] -> Int
lengthOfList [] = 0
lengthOfList (x:xs) = 1 + lengthOfList xs
```

Haskell allows you to state your cases using pattern-matching.  Inputs are checked against each case top to bottom with most specific cases at the beginning.  The pattern-matching also gives us the head and tail for free using the _cons_ (:) infix function.

Below in Javascript, Ramda's functions are used to find the tail of the list, with isEmpty used to check for the base case.  ES2015's new arrow functions allow us to remove a lot of the ceremony from function creation and it's easier to compare the two language implemetations.

```js
//lengthOfList :: [a] -> Int
var lengthOfList = (list) => R.isEmpty(list) ? 0 : 1 + lengthOfList(R.tail(list));
```

In most cases a recursion can be removed in favour of a fold.  Folding maps over each item in a list, accumulating a final result.  In the examples below a point-free style is used to return partially-applied fold functions whose accumulator function simply adds one after each item is mapped.  Ramda calls a left-fold, _reduce_.

```hs
lengthOfList' :: [a] -> Int
lengthOfList' = foldl (\acc x -> acc + 1) 0
```

Note below how the new arrow functions allow us to remove the function fluff and see the lambda!

```js
//lengthOfList_ :: [a] -> Int
var lengthOfList_ = R.reduce((acc, x) => acc + 1, 0);
```

# Reversing a list
Let's look at taking a list and reversing it.  Again this can be written as a recursive function.  Each time the function is called it operates on the tail of the list until we run out of elements i.e. the empty list.

```hs
reverse :: [a] -> [a]
reverse [] = []
reverse (x:xs) = (reverse xs) ++ [x]
```

The equivalent javascript is shown below. Again we have no pattern-matching so we need to use the _head_ and _tail_ functions to break the list apart.

```js
//reverse :: [a] -> [a]
var reverse = list => R.isEmpty(list) ? [] : R.append(reverse(R.tail(list)), R.head(list));
```

In Haskell the _concatenation_ (++) operator is slow compared to the _cons_ (:) operator since Haskell uses a linked list structure .  This makes it really easy to add an element to the head of any list.  The implementation below shows the use of a local function for the recursive part of the computation.  This allows us to start of with the empty list and progressively add elements to the head.

```hs
reverse' :: [a] -> [a]
reverse' list = reverseSub list []
    where    
        reverseSub []         a = a
        reverseSub (x:xs)     a = reverseSub xs (x:a)
```

In Javascript we can make use of Ramda's prepend function.  This concatenates the first argument, which is places in a single element list, with the second list argument.

```js
var reverseSub = (list, a) => R.isEmpty(list) ? a : reverseSub(R.tail(list), R.prepend(R.head(list), a));

var reverse_ = list => reverseSub(list, []);
```

As usual we can rewrite a recursive function as a fold and it's presented below in a point-free style.

```hs
reverse'' :: [a] -> [a]
reverse'' = foldl (\acc x -> x : acc) []
```

We see here again how the new arrow functions give us all the readability of the Haskell syntax and more of it's terseness.

```js
var reverse__ = R.reduce((acc, x) => R.prepend(x, acc), []);
```

Note here that the the lambda function is just the : operator with the arguments flipped.  We can therefore use the flip function to reserve them.

```hs
reverse''' :: [a] -> [a]
reverse''' = foldl (flip (:)) []
```

In Javascript we just flip Ramda's prepend function.

```js
var reverse___ = R.reduce(R.flip(R.prepend), []);
```

# Remove an entry at a certain index
So those were two fairly similar examples. They showed the journey that Javascript is making in pushing forward a functional style.  Now it's time to look at a feature of Haskell called _List Comprehensions_ and the great new feature of Javascript that matches it - _Array Comprehensions_.

Reading the Haskell code below we are given a list _l_ and a position _p_ at which to remove the element.  The result is a list of x's.  The code after the pipe defines how the x's will be chosen.  We use the zip function to generate pairs of each element and an index for that element.  The [1..] range utilises Haskell's laziness and we pick as many indicies as required from an 'infinite' list of natural numbers in the zip function. So for a list [2,3,4,2] we would get pairs (2,1), (3,2), (4,3), (2,4) and we didn't need to worry about the length of the list.

As the pairs are generated lazily there is a check to see if the generated index is not the same as our position _p_.  If it is then the pair is not selected.  Even though the pairs are generated we only select the list part for the final output.

```hs
removeAt :: [a] -> Int -> [a]
removeAt l p = [x | (x, i) <- zip l [1..], i /= p]
```

The Javascript implementation uses a very similar syntax but the code that selects the final elements is integrated as a function at the end.

```js
var removeAt = (l, p) => [for ([x, i] of R.zip(l, R.range(0, l.length)))  if (i !== p) x];
```

# Conclusion
Programming in Haskell is a lot of fun. It would be nice to learn enough to use in my day job but that would involve all the teams I work with learning it as well which isn't going to happen any time soon!  Thankfully Javascript has so great libraries and the language is evolving quickly and mostly in the right direction.  Long may it continue...
