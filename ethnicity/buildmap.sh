#!/bin/bash

# USA albers
PROJECTION='d3.geoMercator()'

# Year to pull census geo data from
YEAR=2017

# Display height and width
WIDTH=960
HEIGHT=600

SCRIPTPATH=$(dirname "$0")

node $SCRIPTPATH/dataprocessing.js 

for f in $SCRIPTPATH/data/geojson/*.json ; do

  echo ${f}

  geoproject "${PROJECTION}.fitSize([${WIDTH}, ${HEIGHT}], d)" < ${f}  | # Scale the geojson to needed specs

  ndjson-split 'd.features' | # convert to ndjson 

  geo2svg --newline-delimited -w ${WIDTH} -h ${HEIGHT} > ${f%.json}.svg # convert ndjson to svg


done;

#tail -n +1 < annotation.svg >> topo.svg

# clean up dir
find $SCRIPTPATH/data/geojson -name "*.json" -type f -exec rm -f {} \;
