---
layout: post
categories:
  - articles
title: Rectangles Inside Rectangles
script: rectangles.js
---

A product designer I worked on had different bounding borders that all user-generated text and shapes had to fit inside. The designer would warn the user if their design had strayed outside of this border. I wanted to go through how we can use functions to pipeline the calculations for this check.

Here's what we are after - the outline is our bounding box - it'll be blue if the objects are all inside and red if not. The objects can be dragged around to show the effect of the calculation. Double whatever to add more objects...
<div id="clear-svg" class="centre-content clickable">CLEAR OBJECTS</div>
<div id="container" class="centre-content"><svg style="width:100%" id="container-svg"></svg></div>

## Start Simple
Let's start simple with the code breakdown and not worry about rotated rectangles for now.

We'll use an object to specify a rectangle's position and dimensions and create a function _getVertices_ that produces a list of the (x,y) co-ordinates of each vertex. Each vertex point is represented by an object with x and y properties. Without rectangles at an angles to worry about the maths is fairly simple.

```js
var getVertices = (rect) => [{
      x: rect.x,
      y: rect.y
    },
    {   
      x: rect.x + rect.width,
      y: rect.y
    },
    {   
      x: rect.x + rect.width,
      y: rect.y + rect.height
    },
    {
      x: rect.x,
      y: rect.y + rect.height
    }
  ];

getVertices({x: 3, y: 5, width: 10, height: 2}); // [{x:3, y:5}, {x:13, y:5}, {x:13, y:7}, {x:3, y:7}];
```

We'll create a function called _getBounds_ which finds the bounding x and y co-ordinates for any set of vertices.

```js
var getBounds = reduce((acc, vertex) => ({
    minX: min(acc.minX, vertex.x),
    maxX: max(acc.maxX, vertex.x),
    minY: min(acc.minY, vertex.y),
    maxY: max(acc.maxY, vertex.y)
  }), {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity
  });
```

This is a _reduce_ or _left fold_. You can see here that we take an object that holds the starting point for the bounds (_second paramater_) and feed it, along with the first vertex value into the accumulating function (_first parameter_). This function compares the values and returns a new bounds object.  This comparison continues for every vertex until a final set of bounds is output.  Like all Ramda's functions it's curried allowing us the create a reduce function of arity 1,  that's ready to find the bounds of any list of vertices we care to give it.

The next function simply compares two sets of bounds to see if one completely lies within the other. I've left the return statements in to make them a little more readable.

```js
var boundContains = curry((outer, inner) => {
  return (outer.minX <= inner.minX && outer.maxX >= inner.maxX && outer.minY <= inner.minY && outer.maxY >= inner.maxY);
});
```

You can see the check being carried out by the boolean expression but what's this curry function doing.  Well it's giving us the opportunity to partially apply the function; allowing the data for the outline bounds to be given upfront and hence turn a function that checks general bounds into one that only checks that specific set of bounds. We'll see this being used in the next function.

```js
const containsRects = curry((containerbounds, objectrects) => {
  return compose(boundContains(containerbounds), getBounds, flatten, map(getVertices))(objectrects);
});
```

Woah! Slow down there...

I know - this is the real heart of the check and there's a lot going on.  Let's first look at how this function is going to be used and then we'll take it a step at a time.

```js
const outlineBounds = compose(bounds, getVertices)(outline); // outline is a rectangle object

const areObjectsValid = containsRects(outlineBounds); //partially apply for a more specific function

var valid = areObjectsValid(objects); // objects is a list of rectangle objects
```

So we use a couple of our functions to find the outline's bounds first.  We use that value to partially apply the checking function to give the _areObjectsValid_ function.  We can use this function to check any list of rectangle objects to see if they are within the outline.

## A closer look at the pipeline

Let's take a closer look at the pipeline of the checking function. It's _composed_ together out of the smaller functions.

```js
compose(boundContains(containerbounds), getBounds, flatten, map(getVertices))
```

Remember _compose_ works from right to left - I like to think of the raw materials going in the right-hand side and begin passed up the pipe to give a value to the variable on the left-hand side.

Ramda has a function called _tap_ which can be used to siphon off values as they pass by in the pipe.  It passes the value to a function before returning the same value.  I'm passing to console.log here and getting a simple little log function (interestingly you need to rebind log to the console object or you get an Illegal Invocation exception - at least in Chrome). Let's use this to see how the data structure is changing as we progress.

```js
const log = tap(console.log.bind(console));

compose(log, boundContains(containerbounds), log, getBounds, log, flatten, log, map(getVertices), log)
```

The right-most log will reflect our input data - the list of rectangle objects that are being tested:

```js
[
  {x:3.5, y:1.5, width:1.5, height:1, angle:45},
  {x:6, y:3, width:1, height:1, angle:100},
  {x:3, y:4, width:2, height:2, angle:30}
]
```

The first step is to _map_ the getVertices function over each of the rectangle objects in this array. Map gives us a resultant array of sets of vertices:

```js
[
  [
    {x: 3.5, y: 1.5},
    {x: 4.560660171779821, y: 2.560660171779821},
    {x: 3.853553390593274, y: 3.267766952966369},
    {x: 2.7928932188134525, y: 2.2071067811865475}
  ],
  [
    {x: 6, y: 3},
    {x: 5.82635182233307, y: 3.984807753012208},
    {x: 4.841544069320862, y: 3.8111595753452776},
    {x: 5.015192246987792, y: 2.82635182233307}
  ],
  [
    {x: 3, y: 4},
    {x: 4.732050807568878, y: 5},
    {x: 3.7320508075688776, y: 6.732050807568877},
    {x: 2, y: 5.732050807568878}
  ]
]
```

This is not a particularly useful way to represent the data as we don't really care which rectangle the points belong to anymore.  So next step is to flatten the entire structure.  This gives:

```js
[
    {x: 3.5, y: 1.5},
    {x: 4.560660171779821, y: 2.560660171779821},
    {x: 3.853553390593274, y: 3.267766952966369},
    {x: 2.7928932188134525, y: 2.2071067811865475}
    {x: 6, y: 3},
    {x: 5.82635182233307, y: 3.984807753012208},
    {x: 4.841544069320862, y: 3.8111595753452776},
    {x: 5.015192246987792, y: 2.82635182233307}
    {x: 3, y: 4},
    {x: 4.732050807568878, y: 5},
    {x: 3.7320508075688776, y: 6.732050807568877},
    {x: 2, y: 5.732050807568878}
]
```

Side note: we have basically taken a nested list monad and flattened it out.  These two steps, map and flatten, can be combined into a function called _flatMap_ or _chain_ in Ramda.  It's a way to combine nested monads.

Onward to the reduce inside getBounds.  The accumulated bounding values we end up with for all the points in our list:

```js
{
  minX: 2,
  maxX: 6,
  minY: 1.5,
  maxY: 6.732050807568877
}
```

Our boundContains function has been pre-loaded with the bounds for the container via partial application.  This means it's waiting for our bounds. What does this give us as a dramatic end result.  Drum roll please ....

```js
true
```

Maybe not.  What is important here is that we have ended up with is a portable function _areObjectsValid_ that works on our model data structure.   Our program can change the data structure to the nth degree and we can just call the function to find out if there's a problem with our object placement.  We'll see below how we can add to these small functions or the pipeline for new functionality.  We could even make this pipeline part of a large one that deals with all types of shapes.

## Life gets a little harder
How can we include rectangles that are rotated.  We know that the pipeline simply checks vertices so we just need to give it the correct ones once the rectangles are rotated.

Start by refining the rectangle objects a little to include the angle of rotation.

```js
{x: 3, y: 5, width: 10, height: 2, angle: 45};
```

We need to work out how to calculate the rectangle vertices to include this rotation.  Well we can rotate a point about the origin with a matrix multiplication (see <a class="article-link" target="_blank" href="https://en.wikipedia.org/wiki/Rotation_matrix">https://en.wikipedia.org/wiki/Rotation_matrix</a>). So let's do a translation from the centre point of the rectangle to the origin, rotate it and translate back. We do each vertex separately.

```js
var rotatePoint = R.curry(function(angle, centre, point){
    return {
        x: centre.x + ((point.x - centre.x) * Math.cos(angle) - (point.y - centre.y) * Math.sin(angle)),
        y: centre.y + ((point.x - centre.x) * Math.sin(angle) + (point.y - centre.y)  * Math.cos(angle))
    };
});
```

Partially applying the rotatePoint function we get a _rotator_ function that rotates any point by the rectangle's angle and it's top-left corner. We change _getVertices_ to map this rotator over each of the return values from before. So we are augmenting a simple vertex function with another general function to get the expected result.

```js
const degToRad = (deg) => (Math.PI / 180) * deg;

const getVertices = (rect) => {
  const rotator = rotatePoint(degToRad(rect.angle), rect);

  return map(rotator)([{
    x: rect.x,
    y: rect.y
  }, {
    x: rect.x + rect.width,
    y: rect.y
  }, {
    x: rect.x + rect.width,
    y: rect.y + rect.height
  }, {
    x: rect.x,
    y: rect.y + rect.height
  }]);
};
```

That's it - the vertices are rotated and the rest of the checking pipeline works as before but with these new values.

# Conclusion
There's a bit of maths in this which can make finding a solution challenging.  Breaking the problem down into component functions allows you to keep your attention focussed on individual parts and using the ideas of functional programming such as currying allows us to build powerful functions quickly and easily.

There are different solutions to those component parts as well and each one's implementation is abstracted inside the function making it easy to swap with something else in the future.
