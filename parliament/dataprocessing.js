const tj = require('@mapbox/togeojson'),
    fs = require('fs'),
    // node doesn't have xml parsing or a dom. use xmldom
    DOMParser = require('xmldom').DOMParser;


function convertToGeoJson(filename) {

  const kml = new DOMParser().parseFromString(fs.readFileSync(`./data/${filename}.kml`, 'utf8'));

  const converted = tj.kml(kml);

  const convertedWithStyles = tj.kml(kml, { styles: true })

  fs.writeFile(`./data/${filename}.geojson`, JSON.stringify(convertedWithStyles), 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("geojson file has been saved.");
  });

}

convertToGeoJson("electoral-boundary-2020")