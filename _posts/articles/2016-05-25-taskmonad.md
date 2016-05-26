---
layout: post
categories:
  - articles
title: Task Monad
script: charge.js
externalScript: https://maps.googleapis.com/maps/api/js?key=AIzaSyB8wX_VvQSrXQS_QesilCfBu2hPf4wOt6M
---

## Look out - Monad!

I remember using a Promises for the first time a couple of years ago and being happy that callback hell was a little further abstracted from me.  Since starting down the path of using functional pipelines to write my programs I've looked at the Task (or Future) monad as a wrapper for these possible future values.  The Task doesn't start it's work straight away like a Promise but waits until its fork method is called.  Just like any other monad we can compose them together and lift normal functions into their context to work on the future value contained within.

The Task's setup is pretty straightforward.  You give it two functions one for a resolution of the eventual value and one for a rejection which can yield some sort of error or default value.  As I mentioned you can lift normal functions into the Task context to transform the value along the pipe and even combine other Tasks. Any errors, say an http call failure, will be passed all the way along the pipe to the rejection function.

## Electric vehicle charging points

Looking around for some data to play around with I found the data.gov.uk site where the UK government has made lots of different datasets available.  One that caught my eye was a complete registry of electrical car-charging points.  There's some data that needs to go on a map I thought. Unfortunately there wasn't a cross-domain header on the data so I turned to a site called Open Charge Map which already does what I'm intending but it's ok I'm not starting a business here.

<div class="group margin-24">
  <div class="col-left centre-content">
  <label for="distance-slider">Distance From your location (miles)</label>
  <input type="range" min="0" max="100" value="10" step="5" id="distance-slider">
  <span id="distance-display">10</span>
  </div>
  <div class="col-right centre-content">
  <label for="result-count-slider">Number of results returned</label>
  <input type="range" min="0" max="100" value="20" step="5" id="result-count-slider">
  <span id="result-count-display">10</span>
  </div>
</div>
<div id="charger-map" class="margin-24 map"><div class="loading">Loading Map</div></div>


Let's look at getting the data as a first step to see how the Task works.  An XMLHttpRequest call to the data endpoint wrapped in a Task.  I'll use the Task from Folktale at <a href="https://github.com/folktale/data.task" class="article-link" target="_blank">https://github.com/folktale/data.task</a> .

```js
var Task = require('data.task');




```

<div id="closest-map" class="margin-24 map"><div class="loading">Loading Map</div></div>


## In conclusion

