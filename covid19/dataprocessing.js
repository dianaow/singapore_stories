const awsConfig = require('aws-config');
const AWS = require('aws-sdk');
const fs = require('fs');
const csv = require('csvtojson');
const d3 = require('d3')
const d3Array = require('d3-array');

const file = 'sg_covid19.csv';

const s3 = new AWS.S3({});

const options = {
    Bucket: 'singapore-stories',
    Key: file,
};

async function csvToJSON() {
  // get csv file and create stream
  const stream = s3.getObject(options).createReadStream();
  // convert csv file (stream) to JSON format data
  const json = await csv().fromStream(stream);

  fs.writeFile("./data/groupDateType.json", JSON.stringify(groupDateType(json)), 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("groupDateType JSON file has been saved.");
  });

  fs.writeFile("./data/groupDateCluster.json", JSON.stringify(groupDateCluster(json)), 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("groupDateCluster JSON file has been saved.");
  });

  fs.writeFile("./data/groupDailyCount.json", JSON.stringify(groupDailyCount(json)), 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("groupDailyCount JSON file has been saved.");
  });

  fs.writeFile("./data/groupNationality.json", JSON.stringify(groupNationality(json)), 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("groupNationality JSON file has been saved.");
  });

  fs.writeFile("./data/groupDateNationality.json", JSON.stringify(groupDateNationality(json)), 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("groupDateNationality JSON file has been saved.");
  });

};

csvToJSON();


function groupDateType(csv) {

  const data = d3Array.rollups(csv, v => d3Array.count(v, d => d['case no']), d => d['date announced'], d => d['transmission type'])

  let output = []
  data.map(d=>{
    d[1].map(el=>{
      output.push({
        date: d[0],
        cases: +el[1],
        type: el[0]
      })
    })
  })

  return output;

}

function groupDateNationality(csv) {

  const parse = d3.timeParse("%Y-%m-%d")

  csv.forEach(d=>{
    d.keep = parse(d['date announced']).getTime() >= parse("2020-03-28").getTime() ? true : false
  })

  const csvFiltered = csv.filter(d=>d.keep === true)

  csvFiltered.forEach(d=>{
    //if(['India, Bangladesh'].indexOf(d['citizenship']) !== -1 & ['long term visit pass', 'work pass holder'].indexOf(d['pass holder']) !== -1){
    if(d['citizenship'] === 'India' | d['citizenship'] === 'Bangladesh'){
      d.type = 'Dormitory residents'
    } else if (d['transmission type'] === 'Local unlinked' | d['transmission type'] === 'Local Unlinked'){
      d.type = 'Community unlinked'
    } else if (d['transmission type'] === 'Local linked' | d['transmission type'] === 'Local Linked'){
      d.type = 'Community linked'
    } else if (d['transmission type'] === 'Imported' | d['transmission type'] === 'imported'){
      d.type = 'Imported'
    } else {
      console.log(d)
      d.type = null
    }
  })

  const data = d3Array.rollups(csvFiltered, v => d3Array.count(v, d => d['case no']), d => d['date announced'], d => d['type'])

  let output = []
  data.map(d=>{
    d[1].map(el=>{
      output.push({
        date: d[0],
        cases: +el[1],
        type: el[0]
      })
    })
  })

  return output;

}

function groupDateCluster(csv) {
  
  const data = d3Array.rollups(csv, v => d3Array.count(v, d => d['case no']), d => d['date announced'], d => d['cluster'])
  
  let output = []
  data.map(d=>{
    d[1].map(el=>{
      output.push({
        date: d[0],
        cases: +el[1],
        cluster: el[0]
      })
    })
  })

  return output;

}


function groupDailyCount(csv) {

  const data = d3Array.rollups(csv, v => d3Array.count(v, d => d['case no']), d => d['date announced'])

  let output = []
  data.map(d=>{
    output.push({
      date: d[0],
      cases: +d[1]
    })
  })

  return output;

}

function groupNationality(csv) {
  
  const data = d3Array.rollups(csv, v => d3Array.count(v, d => d['case no']), d => d['citizenship'])
  
  let output = []
  data.map(d=>{
    output.push({
      citizenship: d[0],
      cases: +d[1]
    })
  })

  return output;

}