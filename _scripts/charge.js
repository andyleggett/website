import Task from 'data.task';
import {
  compose,
  reduce,
  toPairs,
  map,
  chain,
  prop,
  pick,
  propEq,
  reject,
  or,
  tap,
  curry,
  merge,
  identity,
  sortBy,
  head,
  __
} from 'ramda';

const log = tap(console.log.bind(console));
const error = tap(console.error.bind(console));

var currentMapMaker;

var apiOptions = {
  maxResults: 10,
  distance: 10
};

//TASKS
const getChargerData = (query) => new Task((rej, res) => {
  const req = new XMLHttpRequest();
  req.onreadystatechange = (e) => {
    var xhttp = e.currentTarget;
    if (xhttp.readyState === 4) {
      (xhttp.status === 200) ? res(JSON.parse(xhttp.responseText)): rej(e.currentTarget.statusText);
    }
  };
  req.open("GET", "http://api.openchargemap.io/v2/poi/?output=json&countrycode=GB&opendata=true" + query);
  req.send();
});

const getLocation = () => new Task((rej, res) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      res,
      rej, {
        enableHighAccuracy: true,
        timeout: 10 * 1000 * 1000,
        maximumAge: 0
      }
    );
  } else {
    res({
      coords: {
        latitude: 56.134059,
        longitude: -3.955293
      }
    });
  }
});

const getDirections = (query) => new Task((rej, res) => {
  const directionsService = new google.maps.DirectionsService();

  directionsService.route(query, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      res(result);
    } else {
      rej(status);
    }
  });
});

//FUNCTIONS
const fmap = map;

const createMarker = (coord) => new google.maps.Marker({
  position: {
    lat: coord.Latitude,
    lng: coord.Longitude
  },
  title: coord.Title,
  icon: '/images/charger.png'
});

const setMarker = curry((map, marker) => marker.setMap(map));

const createChargerMap = curry((mapelem, location, markers) => {
  var chargerMap = new google.maps.Map(mapelem, {
    center: new google.maps.LatLng(location.coords.latitude, location.coords.longitude),
    zoom: 13
  });

  var mapCentreMarker = new google.maps.Marker({
    position: {
      lat: location.coords.latitude,
      lng: location.coords.longitude
    },
    map: chargerMap,
    title: 'You are here'
  });

  map(setMarker(chargerMap))(markers);

  return chargerMap;
});

const createClosestMap = curry((mapelem, location, directions) => {
  var closestMap = new google.maps.Map(mapelem, {
    center: new google.maps.LatLng(location.coords.latitude, location.coords.longitude),
    zoom: 13
  });

  var directionsDisplay = new google.maps.DirectionsRenderer();

  directionsDisplay.setMap(closestMap);
  directionsDisplay.setDirections(directions);

  return closestMap;
});

const buildQueryOption = (items, item) => items + '&' + item[0] + '=' + item[1];
const buildApiQueryString = compose(reduce(buildQueryOption, ''), toPairs);
const mergeOptions = (location) => merge(__, compose(pick(['latitude', 'longitude']), prop('coords'))(location));

const getLatLong = compose(pick(['Title', 'Distance', 'Latitude', 'Longitude']), prop(['AddressInfo']));
const latOrLongMissing = or(propEq('Latitude', null), propEq('Longitude', null));
const projectCoordinates = compose(map(createMarker), reject(latOrLongMissing), map(getLatLong));

const buildDirectionsQuery = curry((location, nearest) => ({
  origin: new google.maps.LatLng(location.coords.latitude, location.coords.longitude),
  destination: new google.maps.LatLng(nearest.Latitude, nearest.Longitude),
  travelMode: google.maps.TravelMode.DRIVING
}));

const getNearestCharger = compose(head, sortBy(prop('Distance')), reject(latOrLongMissing), map(getLatLong));

const mapMaker = (mapelem, location) => compose(fmap(createChargerMap(mapelem, location)), fmap(projectCoordinates), getChargerData, buildApiQueryString, mergeOptions(location));
const closestCharger = (mapelem, location) => compose(fmap(createClosestMap(mapelem, location)), chain(getDirections), fmap(buildDirectionsQuery(location)), fmap(getNearestCharger), getChargerData, buildApiQueryString, mergeOptions(location));

//PROGRAM START
const distanceSlider = document.getElementById('distance-slider');
const resultCountSlider = document.getElementById('result-count-slider');
const distanceDisplay = document.getElementById('distance-display');
const resultCountDisplay = document.getElementById('result-count-display');

const distanceChanged = (e) => {
  apiOptions = merge(apiOptions, {
    distance: e.currentTarget.value
  });

  distanceDisplay.innerText = e.currentTarget.value;

  currentMapMaker(apiOptions).fork(error, log);
};

const resultsChanged = (e) => {
  apiOptions = merge(apiOptions, {
    maxResults: e.currentTarget.value
  });

  resultCountDisplay.innerText = e.currentTarget.value;

  currentMapMaker(apiOptions).fork(error, log);
};

distanceSlider.addEventListener('change', distanceChanged);
resultCountSlider.addEventListener('change', resultsChanged);

getLocation().fork(error, (location) => {

  currentMapMaker = mapMaker(document.getElementById('charger-map'), location);

  currentMapMaker(apiOptions).fork(error, identity);

  closestCharger(document.getElementById('closest-map'), location)(apiOptions).fork(error, log);
});
