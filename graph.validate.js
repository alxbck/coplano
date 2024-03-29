localStreet = [
    [1,3],
    [3,5],
    [5,3],
    [1,4]
];

localStreet = [
    [1,10],
    [3,5],
    [5,3],
    [5,12],
    [5,18],
    [7,15],
    [8,16],
    [9,10],
    [9,17],
    [10,11],
    [11,5],
    [12,13],
    [13,6],
    [14,20],
    [15,16],
    [15,20],
    [16,17],
    [16,19],
    [17,11],
    [18,17],
    [18,19],
    [19,12],
    [20,13],
]

transitStreet = [
    [[1,1]],
    [[6,14], [14,7], [7,8], [8,9]],
    [[3,3]]
];

function getUniqueElementsTransit(transitStreets) {
    let uniqueElements = new Set();
    for (let street of transitStreets) {
        for (let pair of street) {
            uniqueElements.add(pair[0]);
            uniqueElements.add(pair[1]);
        }
    }
    return uniqueElements;
}

// Prepare

function flattenPairs(pairs) {
    let flatList = [];
    for (let pair of pairs) {
        flatList.push(pair[0]);
        flatList.push(pair[1]);
    }
    return flatList;
}

function countElements(lowStreetFlat) {
    let counts = {};
    for (let node of lowStreetFlat) {
        if (!counts[node]) {
            counts[node] = 0;
        }
        counts[node] += 1;
    }
    return counts;
}

function validateLowStreetNodes(pairs) {
    let res = countElements(flattenPairs(localStreet));
    let highStreetNodes = getUniqueElementsTransit(transitStreet);
    for (let key of highStreetNodes) {
        if (res[key]) {
            delete res[key];
        }
    }
    for (let [k,v] of Object.entries(res)) {
        if (v < 3) {
            console.log(`error with node ${k}: ${v}`);
        }
    }
    for (let [k,v] of Object.entries(res)) {
        if (v < 3) {
            throw new Error(`error with node ${k}: ${v}`);
        }
    }
}


let graph = buildGraphfromPairs(localStreet);
console.log(graph);

let labels = new Set([6,14,7,8,9,2,1]);
let result = depthFirstSearch(graph, 3, labels);
console.log(result);

console.log(getUniqueElementsTransit(transitStreet));
console.log(`High street: ${getUniqueElementsTransit(transitStreet).size} nodes, ${transitStreet.length} links`);
console.log(`Low street: ${getUniqueElements(localStreet).size} nodes, ${localStreet.length} links`);

let ratRuns = getRatRuns(graph, transitStreet);
console.log(`Found ${ratRuns.length} rat runs from ${transitStreet}:`);
ratRuns.forEach(r => console.log('- ', r));
console.log();
