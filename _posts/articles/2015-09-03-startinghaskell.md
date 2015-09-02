---
layout: post
categories:
- articles
title: Starting out with Haskell
---
I was away in North Uist a few weeks back and due to the wonderful lack of connectivity I decided to get on with learning all about Haskell.  Having been using a functional style for a while now I wanted to get right into the guts and have a poke around.  I saw Monoids and Monads lurking on the horizon but starting out easy is always the best bet.  

What I want to talk about in this article is some of the problems from the 99 haskell problems ().  I want to show you some of my solutions and how they would look in Javascript too especially ES2015 syntax. As always I'll be using the awesome Ramda to do my dirty work.

##Length of a list

```hs
lengthOfList :: [a] -> Int
lengthOfList [] = 0
lengthOfList (x:xs) = 1 + lengthOfList xs
```

```hs
lengthOfList' :: [a] -> Int
lengthOfList' = foldl (\acc x -> acc + 1) 0
```

##Reversing a list

```hs
reverse :: [a] -> [a]
reverse [] = []
reverse (x:xs) = (reverse xs) ++ [x]
```

```js
//reverse :: [a] -> [a]
var reverse = function(list){
	return R.isEmpty(list) ? [] : R.append(reverse(R.tail(list)), R.head(list));
};
```

```hs
reverse' :: [a] -> [a]
reverse' list = reverseSub list []
	where	
		reverseSub [] 		a = a
		reverseSub (x:xs) 	a = reverseSub xs (x:a)
```

```js
var reverse = function(list){
	var reverseSub = function(list, start){
		return R.isEmpty(list) ? start : reverseSub(R.tail(list), R.prepend(R.head(list), start));
	};

	return reverseSub(list, []);
};
```

```hs
reverse'' :: [a] -> [a]
reverse'' = foldl (\acc x -> x : acc) []
```

```js
var reverse = R.reduce((acc, x) => R.prepend(x, acc), []);
```

```hs
reverse''' :: [a] -> [a]
reverse''' = foldl (flip (:)) []
```

```js
var reverse = R.reduce(R.flip(R.prepend), []);
```


##Remove an entry at a certain index

```hs
removeAt :: [a] -> Int -> [a]
removeAt l p = [x | (x, i) <- zip l [1..], i /= p]
```

```hs
removeAt' :: [a] -> Int -> [a]
removeAt' l p = take (p-1) l ++ drop (p+1) l
```
