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
  identity
} from 'ramda';

const log = tap(console.log.bind(console));
const error = tap(console.error.bind(console));

const apiOptions = {
  maxResults: 50,
  distance: 20
};

const buildQueryOption = (items, item) => items + '&' + item[0] + '=' + item[1];
const buildApiQuery = compose(reduce(buildQueryOption, ''), toPairs);
const createApiOptions = (options) => compose(merge(options), pick(['latitude', 'longitude']), prop('coords'));

const getLatLong = compose(pick(['Title', 'Distance', 'Latitude', 'Longitude']), prop(['AddressInfo']));
const latOrLongMissing = or(propEq('Latitude', null), propEq('Longitude', null));
const projectCoordinates = compose(reject(latOrLongMissing), map(getLatLong));

//Tasks
const apiCall = (query) => new Task((rej, res) => {
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

const geolocationCall = () => new Task((rej, res) => {
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

const createCoordinates = compose(map(projectCoordinates), apiCall, buildApiQuery);

const createMarker = curry((googlemaps, map, coord) => new googlemaps.Marker({
  position: {
    lat: coord.Latitude,
    lng: coord.Longitude
  },
  title: coord.Title
}));

const updateMap = identity;

const mapMaker = (googlemaps, mapobj, options) => compose(map(updateMap), map(map(createMarker(googlemaps, mapobj))), chain(createCoordinates), map(createApiOptions(options)), geolocationCall);

const start = () => {

    var chargerMap = new window.google.maps.Map(document.getElementById('map'), {
      zoom: 13
    });

    mapMaker(window.google.maps, chargerMap, apiOptions).fork(error, log);
};

start();

