---
layout: post
categories:
  - articles
title: Task Monad
script: charge.js
externalScript: https://maps.googleapis.com/maps/api/js?key=AIzaSyB8wX_VvQSrXQS_QesilCfBu2hPf4wOt6M
---

## Look out - Monad!

I've been using a functional style for a while now to great advantage in my day-to-day projects.  What I haven't really gotten to grips with is the use of Monads other than lists in my composition pipelines.  Watching videos and reading articles got me some of the way but I wanted to build some examples to get the hang of running my normal functions in these _contexts_ which is essentially what we are talking about with Monads.

I'm always using ajax requests to the server to get data and then process it.  Promises have been my go to for quite a while now and so I thought I'd look at the Future or Task monad as a starter.

The Task monad is a context or wrapper for a possible future value from a computation.  The future value can be transformed with normal functions by _lifting_ them into the Task context.

## Electric vehicle charging points

Looking around for some data to play around with I found the data.gov.uk site where the UK government has made lots of different datasets available.  One that caught my eye was a complete registry of electrical car-charging points.  There's some data that needs to go on a map I thought. Unfortunately there wasn't a cross-domain header on the data so I turned to a site called Open Charge Map which already does what I'm intending but it's ok I'm not starting a business here. 

Anyway, click or tap the button to run the examples.  The first shows a map of chargers near your location and the second gives a route to the nearest one. If you don't want to give your location just deny and it'll use mine. It takes a few seconds to get you location:

<button id="start-button" class="button centre">Run the examples</button>
<div id="loading-message" class="loading">Finding your location</div>
<div id="map-container">
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
<div id="charger-map" class="margin-24 map"></div>
<div id="closest-map" class="margin-24 map"></div>
</div>

## Example 1 - The charger map

I'll be using the Task from Folktale at <a href="https://github.com/folktale/data.task" class="article-link" target="_blank">https://github.com/folktale/data.task</a>. 
Let's look at the two times the Task is used in the first example. Firstly it's used to wrap a call to the Geolocation API to get your location hence the warning popup when you run it.  Here is the function that does that:

```js
const getLocationFromGeo = (geooptions) => new Task((rej, res) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(res, () => res(geooptions.default), geooptions);
  } else {
    res(geooptions.default);
  }
});
```

The second use is for an XMLHttpRequest to the Open Charge data endpoint. 

```js
const getChargerData = (query) => new Task((rej, res) => {
  const req = new XMLHttpRequest();
  req.onreadystatechange = (e) => {
    var xhttp = e.currentTarget;
    if (xhttp.readyState === 4) {
      (xhttp.status === 200) ? res(JSON.parse(xhttp.responseText)): rej([]);
    }
  };
  req.open("GET", "http://api.openchargemap.io/v2/poi/?output=json&opendata=true" + query);
  req.send();
});
```

The two functions above are used to construct the Task objects. The Task object constructor takes a function that can either be rejected or resolved. There is no call to the geolocation api or the data endpoint until the _fork_ method of the Tasks is called.

Ok cool.  I have my context and possible future value.  What next?  Well what I want to do is transform the data that will evetually be returned.  In the case of the geolocation call the latitude and longitude data is needed.
I've created a function called _fmap_ which is just an alias for _map_ from Ramda because I want to get us out of the mindset that map is just for lists. I think calling it fmap gives your brain the room to think it's something bigger than just a list function. This function is what's going to do the _lifting_ of normal functions into the Task context.

```js
const fmap = map;

const getLatLngFromGeo = compose(pick(['latitude', 'longitude']), prop('coords'));

const getLocation = compose(fmap(getLatLngFromGeo), getLocationFromGeo);
```

The composition _getLocation_ first creates the Task Object and then _getLatLngFromGeo_, which takes a normal object with a _coords_ property, is lifted into the Task object where it operates on the future value which has the coords property.  As already stated the _fmap_ function does the lifting.

In the code we use this pipeline first to get the location before using it in each of the examples.  The computation is run when the fork method is invoked with a function to handle rejection and one to handle resolution.

```js
getLocation(geoOptions).fork(error, (location) => { ... });
```

The pipeline that actually build the charger location map is as follows.  _mapMaker_ is a factory which produces the actual pipeline with the location and DOM element baked in.

```js
const buildQueryOption = (items, item) => items + '&' + item[0] + '=' + item[1];

const buildApiQueryString = compose(reduce(buildQueryOption, ''), toPairs);

const getLatLngFromApi = compose(pick(['Title', 'Distance', 'Latitude', 'Longitude']), prop(['AddressInfo']));

const latOrLongMissing = or(propEq('Latitude', null), propEq('Longitude', null));

const projectCoordinates = compose(map(createMarker), reject(latOrLongMissing), map(getLatLngFromApi));

const mapMaker = (location) => compose(
                                fmap(projectCoordinates),
                                getChargerData,
                                buildApiQueryString,
                                merge(location)
                              );

```

You can see the first part of the pipeline in _mapMaker_ is creating the query for the API call. It partially applies Ramda's _merge_ function to merge the location with the options that are eventually passed in, then it builds the query in _buildApiQueryString_ used for the API call.

This is passed into _getChargerData_ to create the Task and from then on we lift functions into the context using fmap. The function _projectCoordinates_ is itself a smaller pipeline. We could have written the mapMaker as below but it would have been ineffcient to keep lifting each function into the Task context.  The functor laws which Task adheres to allow us to compose the functions and lift them in one go. The map in this case is the one we are used to dealing with lists but I could have easily used fmap instead.

```js
const mapMaker = (location) => compose(
                                fmap(map(createMarker)),
                                fmap(reject(latOrLongMissing)),
                                fmap(map(getLatLngFromApi)),
                                getChargerData,
                                buildApiQueryString,
                                merge(location)
                              );
```

You call mapMaker with some options and that returns a Task ready to be forked.

```js
var apiOptions = {
  maxResults: 10,
  distance: 10
};

mapMaker(apiOptions).fork(error, (markers) => {
  //create map
});
```


## Example 2 - The closest charger map

This example brings in another aspect.  This time we call the OpenCharger api and then make a call using the results to the Google directions API. We use two Tasks in the pipeline.  

Hold onto your hats as we deal with a Task inside a Task!

```js
const getDirections = (query) => new Task((rej, res) => {
  const directionsService = new google.maps.DirectionsService();

  directionsService.route(query, function (result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      res(result);
    } else {
      rej({});
    }
  });
});

const buildDirectionsQuery = curry((location, nearest) => ({
  origin: new google.maps.LatLng(location.latitude, location.longitude),
  destination: new google.maps.LatLng(nearest.Latitude, nearest.Longitude),
  travelMode: google.maps.TravelMode.DRIVING
}));

const getNearestCharger = compose(head, sortBy(prop('Distance')), reject(latOrLongMissing), map(getLatLngFromApi));

const closestCharger = (location) => compose(
                                      chain(getDirections), 
                                      fmap(buildDirectionsQuery(location)), 
                                      fmap(getNearestCharger), 
                                      getChargerData, 
                                      buildApiQueryString, 
                                      merge(location)
                                      );

```

The first function _getDirections_ is the third factory for a Task, this time to wrap the directions service of Google maps.  The pipeline in _closestCharger_ starts the same way as the previous example getting the
charger data.  Then functions to get the nearest charger and build a query for the direction service are lifted into the context, thus transforming the future value as we go.  All good so far. 

Coming to _getDirections_ which returns another future value wrapped inside a Task, things become difficult.  So it's are already inside a Task context and then this function puts it into a second context - at this point it starts to feel a bit like Russian dolls.  The resulting _closestCharger_ function would have to be forked giving the inner context and then forked again to run the computation.  The double Task can be _flattened_ with a function called _chain_ (this is known as _bind_ or _flatMap_ in different libraries and languages).  This lifts the function _getDirections_ into the first Task context and transforms the future value, it then breaks out of this context and returns the second future value inside a new context. Wow!

We can only bind monads of the same type but it gives a good way to keep the conplexity down.  If we continued with nested Task objects then you would need top fmap twice to get to the inner future value.  What if there were three! 

## In conclusion

Using monads allows the contexts to do some heavy lifting and preserves the ability to compose simpler functions into powerful pipelines.  There are all sorts of monads - Maybe, Either, List, EventStream.  It's all about keeping your head and understanding where your functions are operwting at any particular time.  Have a look at all the code using the dev tools or at <a href="https://github.com/andyleggett/website/blob/master/_scripts/charge.js" class="article-link" target="_blank">https://github.com/andyleggett/website/blob/master/_scripts/charge.js</a>