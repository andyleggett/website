---
layout: post
categories:
- articles
title: Function Composition with Ramda
---

In the run up to the General Election 2015, I worked with a client to take live data and process it for
use as television output.  During the project I changed the way I had been programming with Javascript. I went more functional than ever before.

On several previous projects I used Backbone to structure the application.  Backbone has a dependency on Underscore (or Lodash if you'd prefer) which I had used to try and be functional in style. These libraries both have many higher-order functions 
that make traversal and manipulation of data easy and I'd enjoyed the fact that I hadn't written a for loop in a while.

I hadn't really thought about the way I was working until I found <a class="article-link" href="http://www.youtube.com/watch?v=m3svKOdZijA" target="_blank">Hey Underscore, You're Doing It Wrong</a> and this changed everything. I was doing it wrong (in my little world). I looked around for an alternative and found <a class="article-link" href="http://ramdajs.com" target="_blank">Ramda</a>.  This library allowed me to start bringing some of the ideas in Brian Lonsdorf's video into my work.

##Partial Application

The problem is that Underscore and Lodash have their data first and iteratee second meaning that partial application of functions isn't really possible. *Note: There is a version of Lodash called lodash-fp which aims to remedy this.* 

Let's look at an example of this. This is the map function in Lodash, it takes a collection of items and produces a new collection based on a transformation function. This example will give us a list of squad numbers for a football team.

```js
var getSquadNumber = function(player){
	return player.squadNumber;	
};

var squadNumbers = _.map(squadPlayers, getSquadNumber);
```

The same function in Ramda is as follows.

```js
var squadNumbers = R.map(getSquadNumber, squadPlayers);
```

You can see the order of parameters is swapped.  All of the functions in Ramda allow for partial application or *currying*. This is the process of giving a function some, but not all, of its parameters.  Calling the function in this way returns a function that expects the remaining parameters.

In the players example we could partially apply the *map* function to return a function that maps the getSquadNumber function over a collection of squad players.

```js
var squadNumberMap = R.map(getSquadNumber);

var squadNumbers = squadNumberMap(squadPlayers);
```

The function squadNumberMap is ready to accept one parameter - the squad player collection that we will map over.

##Composition

Composition is the act of combining two or more functions together.  These functions can be thought of as a pipeline of computation from a starting input to an eventual output.  The aim is to eliminate a lot of the redundent *glue* code that would be generated from calling one function after another and storing the intermediate state in local variables.

Let's consider a computation on our players example again.  We'll write some functions that will take a squad of players, filter out the team members and then return their names sorted by surname.

First we'll look at the composition function offered by Ramda in use for this example.

```js
var teamNames = R.compose(sortBySurname, projectNames, filterTeam)(squadPlayers);
```

I like to look at this statement going from right to left.  We put in the squadPlayers collection at the right-hand end and it flows through each function - *filterTeam*, then *projectNames*, then *sortBySurname*, each function taking the output of the last as its input, until it returns the result into the *teamNames* variable. 

If your brain doesn't work that way round you can use the *pipe* function which is basically compose in reverse. I come from a Maths background so I like compose.

```js
var teamNames = R.pipe(filterTeam, projectNames, sortBySurname)(squadPlayers);
```

In either case you can see how readable the code is without the noise of variables making the place look untidy.  We can provide the functions for each stage as pure functions than are easy to reason about and can be built up from Ramda's other utilities. Let's do that now.

```js
//filterTeam definition
var isInTeam = function(player){
	return player.inTeam;
}

var filterTeam = R.filter(isInTeam);

//projectNames definition
var projectName = function(player){
	return {
		firstName: player.firstName,
		surname: player.surname
	};
}

var projectNames = R.map(projectName);

//sortBySurname definition
var getSurname = function(names){
	return names.surname;
}

var sortBySurname = R.sortBy(getSurname);
```

You can see straight away that we are building up functionality using small pure functions. The important thing is that each of the functions we are going to compose has *one* input parameter even though the Ramda functions we are using take *two* input parameters.  Each one is partially applied with predicate, transformation and lookup functions respectively. (*Note: Of course the first function could have more than one input parameter as long as each subsequent function has one, but we'll keep it simple here*)

Each of our handwritten functions have a Ramda equivalent we can use instead.

```js
//filterTeam definition
var filterTeam = R.filter(R.propEq('inTeam', true));

//projectNames definition
var projectNames = R.map(R.project('firstName', 'surname'));

//sortBySurname definition
var sortBySurname = R.sortBy(R.prop('surname'));
```

You could drop the intermediate functions as well but I find it easier to maintain code like this. One thing to note here is that these functions are now written in a completely *point-free* way.  This means that the data for these functions is not mentioned in their construction.

We could write the composition in this way too. This gives us a portable function for getting sorted team player names, easily reusable.

```js
var getTeamNames = R.compose(sortBySurname, projectNames, filterTeam);
```

Let's look at an example from the General Election project. Data is sent through about each constituency and declared areas are shown on the TV output on a UK map graphic.  A small part of the data transformation is filtering the declared constituencies.

```js
var projectMapItem = R.project('gssID', 'fullName', 'partyCodeLast', 'partyCodeNow', 'gainHoldWin');

var sortByDeclarationTime = R.sortBy(R.prop('declarationTime'));

var isDeclared = R.propEq('status', 'D');

var declared = R.compose(R.map(projectMapItem), sortByDeclarationTime, R.filter(isDeclared))(constituencies);
```

As you can see I'm using lots of Ramda's functions to build the intent of each sub-section of the compose pipeline.  This time I'm also using them in the composition.  The level you use them at depends on the readability of the final statements.  Reading from right to left: the first function *filter* uses the isDeclared predicate to provide a new array with only the constituencies with a status of D (for Declared).  This is then applied as the input of a sort by declaration time, and finally only parts of the constituency object that are required for the display are projected into the resulting array.

These are just a couple of examples of where a toolbox functions saves you time and effort.

##Conclusion

The use of *higher-order* functions and a framework of pre-built functions isn't new to many javascript programmers but the use of composition to create pipelines and break down each step into managable and pure functions, that are easy to reason about and easy to maintain, has made my work more enjoyable.  Messing around with tons of glue code is not fun and should be avoided at all costs in my opinion.  Remember you only have a finite number of keystrokes - use them wisely!  Oh and if you're going to do anything, make sure you're doing it *right* ;)
