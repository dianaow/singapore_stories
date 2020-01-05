#! /usr/bin/env node
const fs        = require('fs');
const path = require('path');
const turf      = require('@turf/turf');
const parseCSV  = require('csv-parse/lib/sync');
const D3Node    = require('d3-node');
const D3Annot   = require('d3-svg-annotation');
const Consts    = require('./constants.js');

const d3n   = new D3Node();
const d3    = d3n.d3;
const makeAnnotations = D3Annot.annotation()

const topojson = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/sgp_subzone.geojson'), 'utf8'));
const csv = parseCSV(fs.readFileSync(path.join(__dirname, 'data/resident-population-by-subzone-ethnic-group-and-sex.csv'), 'utf8'), { columns: true });
const csv1 = parseCSV(fs.readFileSync(path.join(__dirname, "data/subzone_perc.csv"), 'utf8'), { columns: true });

const groups = ['Chinese', 'Malays', 'Indians', 'Others']
const color = d3.scaleOrdinal()
  .domain(groups)
  .range(["mediumblue", "orange", "teal", "hotpink"])

const attribute = 'perc_wn_race'

///////////////////////// DATA PROCESSING /////////////////////////
const data = csv.map((d,i) => {
  return {
    id: i,
    race: d.level_1,
    gender: d.level_2,
    planning_area: d.level_3.split('-',2)[0],
    PLANNING_AREA: d.level_3.split('-',2)[0].trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase(),
    subzone: d.level_4,
    SUBZONE: d.level_4.trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase(),
    value: +d.value
  } 
})

const subzone_perc = csv1.map((d,i) => {
  return {
    id: i,
    race: d.level_1,
    subzone: d.level_4,
    SUBZONE: d.level_4.trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase(),
    perc_wn_subzone: +d.diff
  } 
})

var race_by_subzone = data.filter(d=>(d.race!='Total') & (d.gender=='Total'))

bySubzone = d3.nest()
  .key(function(d) { return d.subzone })
  .rollup(function(leaves) { return d3.sum(leaves, function(d) {return +d.value}) })
  .entries(race_by_subzone)

bySubzone.sort(function(a,b) { return +a.value - +b.value })
var bySubzone_list = bySubzone.map(d=>d.key)

byRace = d3.nest()
  .key(function(d) { return d.race})
  .rollup(function(leaves) { return d3.sum(leaves, function(d) {return +d.value}) })
  .entries(race_by_subzone)

byRace.sort(function(a,b) { return +a.value - +b.value })

race_by_subzone.forEach(d=>{
  let subzone_total = bySubzone.find(el=>el.key==d.subzone).value
  d.perc_wn_subzone = (d.value/subzone_total)*100
  let race_total = byRace.find(el=>el.key==d.race).value
  d.perc_wn_race = (d.value/race_total)*100
})

// store an array of each subzone's centroid
var projection = d3.geoMercator().fitSize([960, 600],topojson)
var geopath = d3.geoPath(projection)

var centroids = []
topojson.features.map(d=> {
  centroids.push({
    name: d.properties['SUBZONE_N'].trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase(),
    x: geopath.centroid(d)[0],
    y: geopath.centroid(d)[1]
  })
})

///////////////////////// CREATE ANNOTATIONS /////////////////////////
// store an array of annotations and their respective locations on the map
var annotationsAll = []

function createAnnotations(data) {

  let annotations = []
  groups.map(race=>{
    var race_by_subzone_top = data.filter(d=>d.race == race)
    for(var n = 0; n < 3; n++){
      A = generateAnnotation(race_by_subzone_top[n], Consts.annotationsLoc, 'large')
      annotations.push(A)
    }
  })

  fs.writeFile(path.join(__dirname, 'data/annotations/annotations.json'), JSON.stringify(annotations), function(err) {
      if(err) {
          return console.log(err);
      }
      return console.log("annotations.json was created");
  }); 

}

function createAnnotationsMini(data, index, attribute) {

  let annotations = []
  for(var n = 0; n < 5; n++){
    A = generateAnnotation(data[n], Consts.annotationsLocMini, 'mini')
    annotations.push(A)
  }

  return {file: index + '-' + attribute, annotations: annotations}

  // fs.writeFile(path.join(__dirname, 'data/annotations/annotations-' + index + '-' + attribute + '.json'), JSON.stringify(annotations), function(err) {
  //     if(err) {
  //         return console.log(err);
  //     }
  //     return console.log("annotations.json was created");
  // }); 

}

// const { width, height } = require('minimist')(process.argv.slice(2), { // parse the -w and -h flags using minimist
//     default: {
//         w: 960,
//         h: 600
//     },
//     alias: {
//         w: 'width',
//         h: 'height',
//     }
// });

// const svg = d3n.createSVG(width, height);

// svg.append("g")
//   .attr('class', 'annotations-group-large')
//   .attr("transform", "translate(" + 0 + "," + 40 + ")");

//d3.select(d3n.document.querySelector('.annotations-group-large')).call(makeAnnotations)

// fs.writeFile('./annotation.svg', removeOpeningTag(d3n.svgString()), function(err) {
//     if(err) {
//         return console.log(err);
//     }
//     return console.log("annotation.svg was created");
// }); 

function generateAnnotation(el, annotations, mapType){

  let centroid = centroids.find(d=>d.name == el['SUBZONE'])
  let dLoc = annotations.find(d=>d.name == el['subzone'])

  if(mapType=='mini'){
    var perc = el['perc_wn_race'] > 4 ? " (" + Math.round( el['perc_wn_race'] * 10 ) / 10 + ')%' : ""
  } else if(mapType=='large'){
    var perc = ""
  }
  
  return {
    note: {
      title: el['subzone'] + perc,
      align: dLoc ? dLoc.direction : 'left'  
    },
    connector: {
      end: "dot"
    },
    color: ['black'],
    x: centroid.x,
    y: centroid.y,
    dx: dLoc ? dLoc.dx : 0,
    dy: dLoc ? dLoc.dy : 0
  }

}

///////////////////////// CREATE LARGE MAP /////////////////////////
const res = {
    "type": "FeatureCollection",
    "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::4269" } },
    "features": createMap(race_by_subzone, topojson, 'perc_wn_race') 
};

fs.writeFile(path.join(__dirname, 'data/geojson/MAP-perc_wn_race.json'), JSON.stringify(res), function(err) {
    if(err) {
        return console.log(err);
    }

    return console.log("test.geojson was created");
}); 

function createMap(data, topojson, attribute) {

  var opacity = d3.scaleLinear()
    .domain([0, attribute=='perc_wn_race' ? 3.5 : 50])
    .range([0,1])

  race_by_subzone.sort(function(a,b) { return +b[attribute] - +a[attribute] })

  var race_by_subzone_uniq = data.filter((thing, index, self) =>
    index === self.findIndex((t) => (
      t.subzone === thing.subzone
    ))
  )

  //Merge the stats and GeoJSON data
  race_by_subzone_uniq.forEach((d,i)=>{
    
    var dataState = d['SUBZONE'];

    for(var n = 0; n < topojson.features.length; n++){

      //find the corresponding subzone inside the GeoJSON
      var jsonState = topojson.features[n].properties['SUBZONE_N'].trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase();

      // if statment to merge by name of subzone
      if(dataState == jsonState){
        topojson.features[n].properties.fill = color(d.race);
        topojson.features[n].properties.fillOpacity = opacity(d[attribute]);
        topojson.features[n].properties.strokeOpacity = 1
        topojson.features[n].properties.strokeWidth = '0.5px'
        topojson.features[n].properties.stroke = 'black'
        break;
      } 

    }
  })

  createAnnotations(race_by_subzone_uniq)

  return topojson.features
}

///////////////////////// CREATE SMALL MAPS /////////////////////////
groups.map(function(d,i){
  let oneRace = subzone_perc.filter(el=>el.race == d)
  let res = {
      "type": "FeatureCollection",
      "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::4269" } },
      "features": createMapMini(oneRace, topojson, d, 'perc_wn_subzone') 
  };

  fs.writeFile(path.join(__dirname, 'data/geojson/MAP-perc_wn_subzone-' + d + '.json'), JSON.stringify(res), function(err) {
      if(err) {
          return console.log(err);
      }

      return console.log("geojsons of each ethnic group for perc_wn_subzone was created");
  }); 
})

groups.map(function(d,i){
  let oneRace = race_by_subzone.filter(el=>el.race == d)
  let res = {
      "type": "FeatureCollection",
      "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::4269" } },
      "features": createMapMini(oneRace, topojson, d, 'perc_wn_race') 
  };

  fs.writeFile(path.join(__dirname, 'data/geojson/MAP-perc_wn_race-' + d + '.json'), JSON.stringify(res), function(err) {
      if(err) {
          return console.log(err);
      }

      return console.log("geojsons of each ethnic group for perc_wn_race  was created");
  }); 
})

fs.writeFile(path.join(__dirname, 'data/annotations/annotationsMini.json'), JSON.stringify(annotationsAll), function(err) {
    if(err) {
        return console.log(err);
    }
    return console.log("annotationsMini.json was created");
}); 


function createMapMini(data, topojson, race, attribute) {

  data.sort(function(a,b) { return +b[attribute] - +a[attribute] })

  var opacity = d3.scaleLinear()
    .domain([0, attribute=='perc_wn_race' ? 4 : 35])
    .range([0,1])

  var opacityNeg = d3.scaleLinear()
    .domain([0, attribute=='perc_wn_race' ? 4 : -35])
    .range([0,1])

  //Merge the stats and GeoJSON data
  for(var n = 0; n < topojson.features.length; n++){

    //find the corresponding subzone inside the GeoJSON
    var jsonState = topojson.features[n].properties['SUBZONE_N'].trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase();
    var row = data.find(d=>d['SUBZONE']==jsonState)
    var dataState = race
    var dataValue = row ? row[attribute] : ''
    topojson.features[n].properties.fill = dataValue>0 ? color(dataState) : 'black'
    topojson.features[n].properties.fillOpacity = dataValue>0 ? opacity(dataValue)  : opacityNeg(dataValue)
    topojson.features[n].properties.strokeWidth = '0.3px'
    topojson.features[n].properties.stroke = color(dataState)

  }

  let annotations = createAnnotationsMini(data, attribute, race)
  annotationsAll.push(annotations)

  return topojson.features
}

///////////////////////// helper functions /////////////////////////
const removeOpeningTag = svgStr => { // used to merge topo.svg with legend.svg
    const tagEnd = `height="${height}">`;
    return svgStr.slice(svgStr.indexOf(tagEnd) + tagEnd.length);
}
