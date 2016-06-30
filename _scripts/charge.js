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
//const error = tap(console.error.bind(console));

const error = (error) => {
  console.log('Error', error);
};

var currentMapMaker;
var currentLocation;

var apiOptions = {
  maxResults: 10,
  distance: 10
};

var geoOptions = {
  enableHighAccuracy: true,
  timeout: 10 * 1000 * 1000,
  maximumAge: 0,
  default:
  {
    coords: {
      latitude: 56.134059,
      longitude: -3.955293
    }
  }
};

//TASKS
const getChargerData = (query) => new Task((rej, res) => {
  const req = new XMLHttpRequest();
  req.onreadystatechange = (e) => {
    var xhttp = e.currentTarget;
    if (xhttp.readyState === 4) {
      (xhttp.status === 200) ? res(JSON.parse(xhttp.responseText)) : rej([]);
    }
  };
  req.open("GET", "http://api.openchargemap.io/v2/poi/?output=json&opendata=true" + query);
  req.send();
});

const getLocationFromGeo = (geooptions) => new Task((rej, res) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(res, () => res(geooptions.default), geooptions);
  } else {
    res(geooptions.default);
  }
});

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
    center: new google.maps.LatLng(location.latitude, location.longitude),
    zoom: 13
  });

  var mapCentreMarker = new google.maps.Marker({
    position: {
      lat: location.latitude,
      lng: location.longitude
    },
    map: chargerMap,
    title: 'You are here'
  });

  map(setMarker(chargerMap))(markers);

  return chargerMap;
});

const createClosestMap = curry((mapelem, location, directions) => {
  var closestMap = new google.maps.Map(mapelem, {
    center: new google.maps.LatLng(location.latitude, location.longitude),
    zoom: 13
  });

  var directionsDisplay = new google.maps.DirectionsRenderer();

  directionsDisplay.setMap(closestMap);
  directionsDisplay.setDirections(directions);

  return closestMap;
});

const buildQueryOption = (items, item) => items + '&' + item[0] + '=' + item[1];
const buildApiQueryString = compose(reduce(buildQueryOption, ''), toPairs);
const getLatLngFromGeo = compose(pick(['latitude', 'longitude']), prop('coords'));
const getLatLngFromApi = compose(pick(['Title', 'Distance', 'Latitude', 'Longitude']), prop(['AddressInfo']));
const latOrLongMissing = or(propEq('Latitude', null), propEq('Longitude', null));
const projectCoordinates = compose(map(createMarker), reject(latOrLongMissing), map(getLatLngFromApi));

const buildDirectionsQuery = curry((location, nearest) => ({
  origin: new google.maps.LatLng(location.latitude, location.longitude),
  destination: new google.maps.LatLng(nearest.Latitude, nearest.Longitude),
  travelMode: google.maps.TravelMode.DRIVING
}));

const getNearestCharger = compose(head, sortBy(prop('Distance')), reject(latOrLongMissing), map(getLatLngFromApi));

const getLocation = compose(fmap(getLatLngFromGeo), getLocationFromGeo);

const mapMaker = (location) => compose(fmap(projectCoordinates), getChargerData, buildApiQueryString, merge(location));
const closestCharger = (location) => compose(chain(getDirections), fmap(buildDirectionsQuery(location)), fmap(getNearestCharger), getChargerData, buildApiQueryString, merge(location));

//PROGRAM START
const startButton = document.getElementById('start-button');
const loadingMessage = document.getElementById('loading-message');
const distanceSlider = document.getElementById('distance-slider');
const resultCountSlider = document.getElementById('result-count-slider');
const distanceDisplay = document.getElementById('distance-display');
const resultCountDisplay = document.getElementById('result-count-display');
const mapContainer = document.getElementById('map-container');
const chargerMap = document.getElementById('charger-map');
const closestMap = document.getElementById('closest-map');

const distanceChanged = (e) => {
  apiOptions = merge(apiOptions, {
    distance: e.currentTarget.value
  });

  distanceDisplay.innerText = e.currentTarget.value;

  currentMapMaker(apiOptions).fork(error, (markers) => {
    createChargerMap(chargerMap, currentLocation, markers);
  });
};

const resultsChanged = (e) => {
  apiOptions = merge(apiOptions, {
    maxResults: e.currentTarget.value
  });

  resultCountDisplay.innerText = e.currentTarget.value;

  currentMapMaker(apiOptions).fork(error, (markers) => {
    createChargerMap(chargerMap, currentLocation, markers);
  });
};

const runExample = () => {
  loadingMessage.style.display = 'block';

  getLocation(geoOptions).fork(error, (location) => {

    currentLocation = location;

    loadingMessage.style.display = 'none';
    mapContainer.style.display = 'block';

    currentMapMaker = mapMaker(location);

    currentMapMaker(apiOptions).fork(error, (markers) => {
      createChargerMap(chargerMap, currentLocation, markers);
    });

    closestCharger(location)(apiOptions).fork(error, (directions) => {
      createClosestMap(closestMap, currentLocation, directions);
    });

  });
};

distanceSlider.addEventListener('change', distanceChanged);
resultCountSlider.addEventListener('change', resultsChanged);
startButton.addEventListener('click', runExample);

mapContainer.style.display = 'none';
loadingMessage.style.display = 'none';