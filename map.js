// Build list of points
class Point {
  constructor(lat, long, id) {
    this.lat = lat;
    this.long = long;
    this.id = id;
    this.neighbors = [];
  }
}

// Load points in geojson file and markers
const fileInput = document.getElementById('fileInput');

const Direction = {
    BASE: 'base',
    REVERSE: 'reverse',
    DOUBLE: 'double',
    NONE: 'none'
};

const arrowSettings = {
  size: '15px',
  //frequency: '100px',
  fill: true,
  yawn: 30
};

let dict = {};
let streets = L.featureGroup();
let streets_rr = L.featureGroup();

// Create the map
var map = L.map('map').setView([48.89, 2.345], 15);

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(map);

function addMarker(feature) {
    // Check that the feature is a point
    if (feature.geometry.type === 'Point') {
        L.marker([feature.geometry.coordinates[1],feature.geometry.coordinates[0]]).addTo(map);
        console.log();
    }
}

function parsePoints(points) {
    //console.log("parsing points:", points.length)
    let pointsDictionary = {};
    for (let point of points) {
        let newPoint = new Point(point.geometry.coordinates[1], point.geometry.coordinates[0], point.properties.id);
        newPoint.neighbors = Array.from(point.properties.local_street.split(","), Number);
        pointsDictionary[point.properties.id] = newPoint;
    }
    return pointsDictionary;
}

function reverseArrow(ev) {
    var polyline = ev.target;

    // Change the color of the polyline
    var arrowColor;
    if (polyline._direction === Direction.REVERSE) {
        arrowColor = "blue";
        polyline._direction = Direction.BASE;
    } else {
        arrowColor = "red";
        polyline._direction = Direction.REVERSE;
    }

    polyline.setStyle({color : arrowColor});
    polyline.setLatLngs(polyline.getLatLngs().reverse()); // also applies the style changes to the arrowhead
}

function buildGraph(polylineLayerGroup) {
    let graph = [];
    polylineLayerGroup.eachLayer(function(polyline){

        let direction = polyline['_direction'];
        let start = polyline['_point_start'];
        let end = polyline['_point_end'];

        if (direction === Direction.BASE) {
            graph.push([start, end]);
        } else if (direction === Direction.REVERSE) {
            graph.push([end, start]);
        } else if (direction === Direction.DOUBLE) {
            graph.push([start, end]);
            graph.push([end, start]);
        }
    });
    return graph;
}

function markRatRuns(streets, ratRuns) {
    let ratRunPairs = new Set();
    for (let rr of ratRuns) {
        for (var i = 0; i < rr.length - 1; i++) {
            ratRunPairs.add(JSON.stringify([rr[i], rr[i+1]]));
        }
    }
    streets.eachLayer(function(polyline) {
        let start = polyline['_point_start'];
        let end = polyline['_point_end'];
        polyline._rat_run = ratRunPairs.has(JSON.stringify([start,end])) || ratRunPairs.has(JSON.stringify([end,start]));
    });
}

function drawStreets(pointDictionary) {
    // add segments for all local streets
    console.log("drawing streets...");
    console.log("found dict with nb points:", Object.keys(pointDictionary).length);
    for (let key in pointDictionary) {
        p = pointDictionary[key];
        way_start = L.latLng(p.lat, p.long);
        if (p.neighbors.length > 0) {
            for (let n of p.neighbors) {
                if (n>0) {
                    p_end = pointDictionary[n];
                    way_end = L.latLng(p_end.lat, p_end.long);
                    var polyline = L.polyline([way_start, way_end], {color: 'blue'}).arrowheads(arrowSettings).on('click', reverseArrow);
                    polyline['_rat_run'] = p.neighbors_rr && p.neighbors_rr.length > 0 && p.neighbors_rr.includes(n);
                    polyline['_direction'] = Direction.BASE;
                    polyline['_point_start'] = key;
                    polyline['_point_end'] = n;
                    streets.addLayer(polyline);
                }
            }
        }
    }

    graph = buildGraph(streets);
    ratRuns = getRatRuns(graph, transitStreet);
    console.log(`Found ${ratRuns.length} rat runs!!!`);
    console.log(ratRuns);
    markRatRuns(streets, ratRuns);

    streets.eachLayer(function(layer) {
        if (layer['_rat_run']) {
            streets_rr.addLayer(L.polyline(layer.getLatLngs(), {color: 'red', weight: 10}));
        }
    });
    streets_rr.addTo(map);
    streets.addTo(map);
}

fileInput.addEventListener('change', function() {
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.addEventListener('load', function() {
    const geoJSON = JSON.parse(reader.result);
    //geoJSON.features.forEach(addMarker);
    dict = parsePoints(geoJSON.features);
    drawStreets(dict);
    bounds = L.geoJSON(geoJSON).getBounds();
    map.fitBounds(bounds);
  });

  reader.readAsText(file);
});


// Mock dict
let point1 = new Point(40.748817, -73.985428, 1);
point1.neighbors.push(2);
let point2 = new Point(41.748817, -74.985428, 2);
point2.neighbors.push(1);
let a = { 1: point1, 2: point2};
//console.log(a);
//drawStreets(a);


layers = {};