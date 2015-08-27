---
layout: post
categories:
- articles
title: Starting out with Haskell
---
I was away in North Uist a few weeks back and due to the wonderful lack of connectivity I decided to get on with learning all about Haskell.  Having been using a functional style for a while now I wanted to get right into the guts and have a poke around.  I saw Monoids and Monads lurking on the horizon but starting out easy is always the best bet.  

What I want to talk about in this article is some of the problems from the 99 haskell problems ().  I want to show you some of my solutions and how they would look in Javascript too especially ES2015 syntax.

##Reversing a list

```hs
reverse :: [a] -> [a]
reverse [] = []
reverse (x:xs) = (reverse xs) ++ [x]
```

```hs
reverse' :: [a] -> [a]
reverse' list = reverseSub list []
	where	
		reverseSub [] 		a = a
		reverseSub (x:xs) 	a = reverseSub xs (x:a)
```

```hs
reverse'' :: [a] -> [a]
reverse'' = foldl (\acc x -> x : acc) []
```

```hs
reverse''' :: [a] -> [a]
reverse''' = foldl (flip (:)) []
```


```hs

```

```hs

```