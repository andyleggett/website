---
layout: post
categories:
- articles
title: Starting out with Haskell
---
I was away in North Uist a few weeks back and due to the wonderful lack of connectivity I decided to get on with learning all about Haskell.  Having been using a functional style for a while now I wanted to get right into the guts and have a poke around.  I saw Monoids and Monads lurking on the horizon but starting out easy is always the best bet.  

What I want to talk about in this article is some of the solutions I came up with from the 99 haskell problems (<a href="" class="article-link" target="_blank"></a>).  I want to show you some of the haskell solutions and how they would look in Javascript too especially ES2015 syntax. As always I'll be using the awesome Ramda to do my dirty work.

##Length of a list

In Haskell you build your program from pure functions that encapsulate the *intent* of your program and it's constituent parts.  *Type annotations* make you think clearly about what each function is trying to achieve and help you implement it to some extent.  It's a good habit to get into even in Javascript where they're only comments.

The *lengthOfList* function is an example of a recursive function, that is a function that calls itself as part of a calculation.  Finding the length of a list involves breaking the list into it's head and tail.  The head is counted as one element and the process is repeated with the tail of the list.  We need a *base* case to tell the recursion where to stop.  In this problem when we get to the point where we run out of elements (i.e. we get the empty list as the tail) we add 0 and don't call the function anymore.

```hs
lengthOfList :: [a] -> Int
lengthOfList [] = 0
lengthOfList (x:xs) = 1 + lengthOfList xs
```

Haskell allows you to state your cases using pattern-matching.  Inputs are checked against each case top to bottom with most specific cases at the beginning.  The pattern-matching also gives us the head and tail for free using the *cons* infix function.

Below in Javascript, Ramda's functions are used to find the tail of the list, with isEmpty used to check for the base case.  ES2015's new arrow functions allow us to remove a lot of the ceremony from function creation and it's easier to compare the two language implemetations.

```js
//lengthOfList :: [a] -> Int
var lengthOfList = (list) => R.isEmpty(list) ? 0 : 1 + lengthOfList(R.tail(list));
```

In most cases a recursion can be removed in favour of a fold.  Folding maps over each item in a list, accumulating a final result.  In the examples below a point-free style is used to return partially-applied fold functions whose accumulator function simply adds one after each item is mapped.  Ramda calls a left-fold, *reduce*.

```hs
lengthOfList' :: [a] -> Int
lengthOfList' = foldl (\acc x -> acc + 1) 0
```

```js
//lengthOfList_ :: [a] -> Int
var lengthOfList_ = R.reduce((acc, x) => acc + 1, 0);
```

Note here how the new arrow functions are actually allowing us to write lambdas.??????

##Reversing a list

```hs
reverse :: [a] -> [a]
reverse [] = []
reverse (x:xs) = (reverse xs) ++ [x]
```

```js
//reverse :: [a] -> [a]
var reverse = (list) => R.isEmpty(list) ? [] : R.append(reverse(R.tail(list)), R.head(list));
```

```hs
reverse' :: [a] -> [a]
reverse' list = reverseSub list []
	where	
		reverseSub [] 		a = a
		reverseSub (x:xs) 	a = reverseSub xs (x:a)
```

```js
var reverseSub = (list, a) => R.isEmpty(list) ? a : reverseSub(R.tail(list), R.prepend(R.head(list), start));

var reverse_ = (list) => reverseSub(list, []);
```

```hs
reverse'' :: [a] -> [a]
reverse'' = foldl (\acc x -> x : acc) []
```

```js
var reverse__ = R.reduce((acc, x) => R.prepend(x, acc), []);
```

```hs
reverse''' :: [a] -> [a]
reverse''' = foldl (flip (:)) []
```

```js
var reverse___ = R.reduce(R.flip(R.prepend), []);
```


##Remove an entry at a certain index

```hs
removeAt :: [a] -> Int -> [a]
removeAt l p = [x | (x, i) <- zip l [1..], i /= p]
```

```js
var removeAt = (l, p) => [for (t of R.zip(l, R.range(0, l.length)))  if (t[1] !== p) t[0]];
```

```hs
removeAt' :: [a] -> Int -> [a]
removeAt' l p = take (p-1) l ++ drop (p+1) l
```

```js
//removeAt_ :: [a] -> Int -> [a]
var removeAt_ = (l, p) => R.concat(R.take(p-1), R.drop(p+1));
```
