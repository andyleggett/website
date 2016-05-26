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
  __
} from 'ramda';

const log = tap(console.log.bind(console));
const error = tap(console.error.bind(console));

var currentMapMaker;

var apiOptions = {
  maxResults: 10,
  distance: 10
};

const buildQueryOption = (items, item) => items + '&' + item[0] + '=' + item[1];
const buildApiQueryString = compose(reduce(buildQueryOption, ''), toPairs);
const mergeOptions = (location) => merge(__, compose(pick(['latitude', 'longitude']), prop('coords'))(location));

const getLatLong = compose(pick(['Title', 'Distance', 'Latitude', 'Longitude']), prop(['AddressInfo']));
const latOrLongMissing = or(propEq('Latitude', null), propEq('Longitude', null));
const projectCoordinates = compose(map(createMarker), reject(latOrLongMissing), map(getLatLong));

//Tasks
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

const fmap = map;

const createMarker = (coord) => new googlemaps.Marker({
  position: {
    lat: coord.Latitude,
    lng: coord.Longitude
  },
  title: coord.Title,
  icon: '/images/charger.png'
});

const createMap = curry((mapelem, location, markers) => {
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

  return chargerMap;
});

const mapMaker = (mapelem, location) => compose(fmap(createMap(mapelem, location)), fmap(projectCoordinates), getChargerData, buildApiQueryString, mergeOptions(location));

const closestCharger = (googlemaps, mapobj, location) => {};

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

  /*var closestMap = new google.maps.Map(document.getElementById('closest-map'), {
    center: new google.maps.LatLng(location.coords.latitude, location.coords.longitude),
    zoom: 13
  });

  var closestCentreMarker = new google.maps.Marker({
    position: {
      lat: location.coords.latitude,
      lng: location.coords.longitude
    },
    map: closestMap,
    title: 'You are here'
  });*/

  currentMapMaker = mapMaker(document.getElementById('charger-map'), location);

  currentMapMaker(apiOptions).fork(error, log);

  //closestCharger(google.maps, closestMap, location).fork(error, log);
});

