---
layout: post
categories:
- articles
title: Rectangles Inside Rectangles
script: rectanglesinsiderectangles.js
---

A product designer I worked on had different bounding shapes that all user-generated text had to fit into. The designer would warn the user if their design had strayed outside of the bounds that were set. In this article I wanted to explore ways to check if a rectangle is bounded by another.

We'll use some Ramda functions to iterate over our data structures. I want to continue to show that using functions helps us break down difficult problems into more manageable ones.

##Start Simple

Let's start simple and not worry about rotated rectangles for now.

To start with we'll use an object to specify the rectangle's dimensions and position and create a function *verticies* that produces a list of the (x,y) co-ordinates of each vertex. Each vertex point is represented by an object with x and y properties.

```js
var rectangle = {centre: {x: 3, y: 5}, width: 10, height: 2};

 var verticies = function(rect) {
        var halfWidth = rect.width / 2;
        var halfHeight = rect.height / 2;

        return [{
            x: rect.centre.x - halfWidth,
            y: rect.centre.y - halfHeight
        }, {
            x: rect.centre.x + halfWidth,
            y: rect.centre.y - halfHeight
        }, {
            x: rect.centre.x - halfWidth,
            y: rect.centre.y + halfHeight
        }, {
            x: rect.centre.x + halfWidth,
            y: rect.centre.y + halfHeight
        }];
    }

//calling verticies(rectangle) gives [{x:-2, y:4}, {x:8, y:6}, {x:-2, y:4}, {x:8, y:6}];
```
 
We'll first try to check if this rectangle is within a rectangular bounding shape by calculating those bounds. Let's look at a way of starting with a set of bounds and progressively updating them as we check each vertex. 

```js
var bounds = function(verticies){
	return R.reduce(
			function(acc, vertex){
				return {
					minX: R.min(acc.minX, vertex.x),
					maxX: R.max(acc.maxX, vertex.x),
					minY: R.min(acc.minY, vertex.y),
					maxY: R.max(acc.maxY, vertex.y)
				};
			},
			{
				minX: Infinity,
				maxX: -Infinity,
				minY: Infinity,
				maxY: -Infinity
			}, 
			verticies
		);
}
```

This is a *reduce* or *left fold*. You can see here that we take an object that holds the starting point for the bounds (*second paramater*) and feed it, along with the first vertex value into the accumulating function (*first parameter*). This function compares the values and returns a new bounds object.  This continue for every vertex until a final set of bounds is output.  

We can now write a function to check if any point is within these bounds and use it to map over each vertex of a rectangle, checking for validity.

```js
var pointInBounds = R.curry(function(bounds, point){
	return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
});
```

You can see the check being carried out by the boolean expression but what's this curry function doing.  Well it's giving us the opportunity to partially apply the function; it's allowing the data for the bounds to be given upfront and hence turn a function that checks general bounds into one that only checks that specific set of bounds.  We'll see this is action next when we use it as a predicate function for Ramda's *all* function.

```js
var containsRect = R.curry(function(containrect, checkrect) {
	var vertexChecker = pointInBounds(R.compose(bounds, verticies)(containrect));

	return R.all(vertexChecker, verticies(checkrect));
});
```

So we first calculate the specfic set of bounds and use partial application to create a function that, as we said, checks points only in those bounds.

Why did we use the curry function again here? Well it lets us specify data for the containing rectangle without having to say what the rectangle we are checking is.  We can produce a function to check any rectangle inside the container. You can see the code in action below. Click the purple rectangle and move it around to run a check.

<div class="centre-content title">Blue contains purple? <span id="output1"></span></div>
<div id="animation1" class="centre-content"><div id="twocontainer1"></div></div>

##Life gets a little harder

So does this work for check rectangles that are rotated.  Let's check...

Start by refining the rectangle object a little to include the angle of rotation.

```js
var rectangle = {centre: {x: 3, y: 5}, width: 10, height: 2, angle: Math.PI/4};
```

We need to work out how to calculate the rectangle verticies to include this rotation.  Well we can rotate a point about the origin with a matrix multiplication (see <a class="article-link" target="_blank" href="https://en.wikipedia.org/wiki/Rotation_matrix">https://en.wikipedia.org/wiki/Rotation_matrix</a>). So let's do a translation from the centre point of the rectangle to the origin, rotate it and translate back. We do each vertex separately.

```js
var rotatePoint = R.curry(function(angle, about, point){
	return {
		x: about.x + ((point.x - about.x) * Math.cos(angle) - (point.y - about.y) * Math.sin(angle)),
		y: about.y + ((point.x - about.x) * Math.sin(angle) + (point.y - about.y)  * Math.cos(angle))
	};
});


 var verticies = function(rect) {
        var halfWidth = rect.width / 2;
        var halfHeight = rect.height / 2;
        var rotator = rotatePoint(rect.angle, rect.centre);

        return [
            rotator({
                x: rect.centre.x - halfWidth,
                y: rect.centre.y - halfHeight
            }),
            rotator({
                x: rect.centre.x + halfWidth,
                y: rect.centre.y - halfHeight
            }),
            rotator({
                x: rect.centre.x - halfWidth,
                y: rect.centre.y + halfHeight
            }),
            rotator({
                x: rect.centre.x + halfWidth,
                y: rect.centre.y + halfHeight
            }),
        ];
    }
```

Now we have the correct vertex co-ordinates we can use the same process to check each one is inside the container.  Check it out.  Hold down the mouse (or tap and hold) to change the angle of the purple rectangle.

<div class="centre-content title">Blue contains purple? <span id="output2"></span></div>
<div id="animation2" class="centre-content"><div id="twocontainer2"></div></div>

##I know where you're going with this

Yeh that's right! Stuck it up because we're rotating the container now.  Feel the burn!

The same process of rotating points could work for us here too.  If the container is rotated then all we need to do is rotate all the points of both rectangles back by the same angle and then again repeat the process of bound checking.

```js
var containsRect = R.curry(function(containrect, checkrect) {
    var rotator = rotatePoint(-containrect.angle, containrect.centre);
    var vertexChecker = pointInBounds(R.compose(bounds, R.map(rotator), verticies)(containrect));

    return R.all(vertexChecker, R.compose(R.map(rotator),verticies)(checkrect));
});
```

<div class="centre-content title">Blue contains purple? <span id="output3"></span></div>
<div id="animation3" class="centre-content"><div id="twocontainer3"></div></div>

##Conclusion

There's a bit of maths in this solution which can make finding a solution challenging.  Breaking the problem down into component functions allows you to keep your attention focussed on individual parts and using the ideas of functional programming such as currying allows us to build powerful tools quickly and easily.

There are different solutions to those component parts as well and each one's implementation is abstracted inside the function making it easy to swap with something else in the future.

Working code at <a href="http://codepen.io/andyleg/pen/XbvEKW/" class="article-link" target="_blank">http://codepen.io/andyleg/pen/XbvEKW/</a> and as a gist at <a href="https://gist.github.com/andyleggett/64cee4936635e6b89481" class="article-link" target="_blank">https://gist.github.com/andyleggett/64cee4936635e6b89481</a>