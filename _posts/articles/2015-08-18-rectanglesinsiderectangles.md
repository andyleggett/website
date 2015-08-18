---
layout: post
categories:
- articles
title: Rectangles Inside Rectangles
script: rectanglesinsiderectangles.js
---

<div id="animation"><div class="two-container"></div></div>

A product designer I worked on had different bounding shapes that all user-generated text had to fit into. The designer would warn the user if their design had strayed outside of the bounds that were set. In this article I wanted to explore some different shapes and develop functions to check if they fit into certain bounds.

We'll use some Ramda functions to iterate over our data structures. I want to continue to show that using functions helps us break down difficult problems into more manageable ones.

##Start Simple

To start with we'll use an object to specify the rectangle and create a function that calculates the (x,y) co-ordinates of each vertex. Each vertex point is represented by an object with x and y properties.

```js
var rectangle = {	centreX: 3,
					centreY: 5,
					width: 10,
					height: 2
				};

var verticies = function(rect){
	var halfWidth = rect.width / 2;
	var halfHeight = rect.height / 2;
	return [
			{x:rect.centreX - halfWidth, y:rect.centreY - halfHeight},
			{x:rect.centreX + halfWidth, y:rect.centreY - halfHeight},
			{x:rect.centreX - halfWidth, y:rect.centreY + halfHeight},
			{x:rect.centreX + halfWidth, y:rect.centreY + halfHeight},
	];
}

//gives [{x:2, y:3}, {x:7, y:3}, {x:2, y:5}, {x:7, y:5}];
```
 
We'll first try to check if this rectangle is within a rectangular bounding shape by calculating those bounds. Let's look at a way of starting with a set of bounds and progressively updating them as we check each vertex on the rectangle. 

```js
var bounds = function(rect){
	return R.reduce(
			function(acc, point){
				return {
					minX: R.min(acc.minX, point.x),
					maxX: R.max(acc.maxX, point.x),
					minY: R.min(acc.minY, point.y),
					maxY: R.max(acc.maxY, point.y)
				};
			},
			{
				minX: Infinity,
				maxX: -Infinity,
				minY: Infinity,
				maxY: -Infinity
			}, 
			rect
		);
}

```

The function is a *reduce* or *left fold* that takes an accumulating function, a starting value and a collection.  This progressively takes an accumulator value and the next value in the collection and returns a new accumulator value.  You can see here that we start with an object that holds the starting minimum and maximum x and y bounds.  We use Infinity as a starting value that is large enough that any point value will be smaller than (or larger in the negative case).


We can now write a function to check if any point is within the bounds and use it to map over each point in a rectangle we want to check for validity.

```js
var pointInBounds = R.curry(function(bounds, point){
	return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
});

```

You can see the check being carried out by the boolean expression but what's this curry function doing.  Well it's giving us the opportunity to partially apply the function if we need to; it's allowing the data for the bounds to be given upfront and hence turn a function that checks general bounds into one that only check that specific set of bounds.  We'll see this is action next when we use it as a predicate function to check each of the points in a rectangle.

```js
var containsRect = function(checkrect, containrect){
	return R.all(pointInBounds(bounds(containrect)), checkrect);
};
```

So we first calculate the specfic set of bounds and use currying to create a function that, as we said, checks points only in those bounds. The *all* function just makes sure that every point in the *checkrect* collection is inside the bounds.

This works well if the containing rectangle has not been rotated in any way. If is has then this solution doesn't work. We can rotate it back with a transformation before we calculate the bounds to make the solution work again.

To do this we choose the first two points and use their co-ordinate values to work out the angle of rotation.

```js
var rotationAngle = function(point1, point2){
		return Math.atan((point1.y - point2.y) / (point1.x - point2.x));
}

var rotatePoint = R.curry(function(angle, point){
	return {
		x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
		y: point.x * Math.sin(angle) + point.y * Math.cos(angle)
	};
});
```

Incorporating this into the current solution gives the following:

```js
var angle = rotationAngle(containrect[0], containrect[1]);
	
var rotator = R.map(rotatePoint(angle));

var containsRect = function(checkrect, containrect){
	return R.all(pointInBounds(bounds(rotator(containrect))), rotator(checkrect));
};
```


