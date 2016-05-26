import snapsvg from 'snapsvg';

import {
  compose,
  curry,
  merge,
  min,
  max,
  map,
  reduce,
  pick,
  tap,
  flatten,
  findIndex,
  update,
  propEq,
  append
} from 'ramda';

const degToRad = (deg) => (Math.PI / 180) * deg;

const rotatePoint = curry((angle, centre, point) => {
  return ({
    x: centre.x + ((point.x - centre.x) * Math.cos(angle) - (point.y - centre.y) * Math.sin(angle)),
    y: centre.y + ((point.x - centre.x) * Math.sin(angle) + (point.y - centre.y) * Math.cos(angle))
  })
});

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

const updateObjects = (rect, objects) => {
  const updateObjectIndex = findIndex(propEq('id', rect.attr('id')))(objects);
  const updateObject = objects[updateObjectIndex];
  const transform = rect.data('transform');

  if (transform === undefined){
    return objects;
  }

  const transformedObject = merge(updateObject, {
    x: updateObject.x + (transform.dx / canvas.scale),
    y: updateObject.y + (transform.dy / canvas.scale)
  });

  return update(updateObjectIndex, transformedObject, objects);
};

//const log = tap(console.log.bind(console));
const log = tap(console.log.bind(console));

const getBounds = reduce((acc, vertex) => ({
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

const boundContains = curry((outer, inner) => (outer.minX <= inner.minX && outer.maxX >= inner.maxX && outer.minY <= inner.minY && outer.maxY >= inner.maxY));

const containsRects = curry((containerbounds, objectrects) => {
  return compose(boundContains(containerbounds), log, getBounds, log, flatten, log, map(getVertices), log)(objectrects);
});

const objectsValid = compose(containsRects, compose(getBounds, getVertices));

var createOutline = curry((svg, rect) => {
  var newOutline = svg.rect(rect.x * rect.scale, rect.y * rect.scale, rect.width * rect.scale, rect.height * rect.scale);

  newOutline.attr({
    id: rect.id,
    fill: 'none',
    stroke: '#444',
    strokeDasharray: '10',
    strokeWidth: 2
  });

  return newOutline;
});

var createRect = curry((svg, rect) => {
  var newRect = svg.rect(rect.x * rect.scale, rect.y * rect.scale, rect.width * rect.scale, rect.height * rect.scale);

  newRect.attr({
    id: rect.id,
    fill: rect.fill,
    opacity: 0.95,
    strokeWidth: 0
  });

  newRect.transform('r' + (rect.angle || 0) + ',' + (rect.x * rect.scale) + ',' + (rect.y * rect.scale));

  if (rect.isMovable === true) {
    newRect.drag(move(newRect), start(newRect), stop(newRect));
  }

  return newRect;
});

const checkObjects = () => {
  containerRect.attr({
    stroke: objectsValid(container)(objects) ? '#00F' : '#F00'
  });
};

//PROGRAM START

//get DOM references
var containerElem = document.getElementById('container');
var svgElem = document.getElementById('container-svg');
var clearElem = document.getElementById('clear-svg');
var addElem = document.getElementById('add-svg');
var containerWidth = containerElem.offsetWidth;

const canvas = {
  width: containerWidth,
  height: containerWidth,
  scale: containerWidth / 8
};

containerElem.style.height = canvas.height;
svgElem.style.height = canvas.height;

//set data
const container = {
  id: 'container',
  x: 1,
  y: 1,
  width: 6,
  height: 6,
  angle: 0,
  scale: canvas.scale,
  fill: 'rgb(0, 200, 255)',
  isMovable: false
};

var objects = [{
  id: 'object1',
  x: 3.5,
  y: 1.5,
  width: 1.5,
  height: 1,
  angle: 45,
  scale: canvas.scale,
  fill: '#6E94AB',
  isMovable: true
}, {
  id: 'object2',
  x: 6,
  y: 3,
  width: 1,
  height: 1,
  angle: 100,
  scale: canvas.scale,
  fill: '#BDC9EB',
  isMovable: true
}, {
  id: 'object3',
  x: 3,
  y: 4,
  width: 2,
  height: 2,
  angle: 30,
  scale: canvas.scale,
  fill: '#F3A542',
  isMovable: true
}];

const colours = ['#6E94AB', '#BDC9EB', '#F3A542', '#00598D', '#F17847', '#CC8B1D', '#364356', '#7A8185', '#18222C', 'B4B4B3'];

//event handlers
const move = (rect) => (dx, dy) => {
  rect.attr({
    transform: rect.data('origTransform') + (rect.data('origTransform') ? "T" : "t") + [dx, dy]
  });

  rect.data('transform', {
    dx,
    dy
  });
};

const start = (rect) => () => {
  rect.data('origTransform', rect.transform().local);
};

const stop = (rect) => () => {
  objects = updateObjects(rect, objects);

  checkObjects();
};

const createNewObject = (e) => {
  const newObject = {
    id: 'object' + (objects.length + 1),
    x: e.offsetX / canvas.scale,
    y: e.offsetY / canvas.scale,
    width: Math.ceil(Math.random() * 3),
    height: Math.ceil(Math.random() * 3),
    isMovable: true,
    scale: canvas.scale,
    fill: colours[Math.floor(Math.random() * colours.length)],
    angle: Math.ceil(Math.random() * 90)
  };

  objects = append(newObject, objects);
  createRect(svg, newObject);

  checkObjects();
};

const clearObjects = () => {
  objects = [];
  svg.clear();
  containerRect = createOutline(svg, container);
};

clearElem.addEventListener('click', clearObjects);
addElem.addEventListener('click', createNewObject);

//create SVG
const svg = snapsvg(svgElem);

var containerRect = createOutline(svg, container);
var objectRects = map(createRect(svg))(objects);

checkObjects();