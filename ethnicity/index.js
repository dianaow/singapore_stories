var screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * (screen.width <= 420 ? 0.9 : 0.85)
var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 10
var canvasDim = { width: screenWidth, height: screenHeight}

var bySubzone, bySubzone_list
var axisPad = 6

var margin = {top: 0, right: screen.width <= 420 ? 20 : 40, bottom: 20, left: screen.width <= 420 ? 20 : 150}
var width = canvasDim.width - margin.left - margin.right
var height = canvasDim.height - margin.top - margin.bottom

var svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .style('overflow', 'auto')

var tooltip = d3.select("#chart").append("div")
  .attr("id", "tooltip")
  .style('position', 'absolute')
  .style("background-color", "#D3D3D3")
  .style('padding', 6)
  .style('display', 'none')

var x_axis = d3.select("#xaxis")
  .append("svg")           
    .attr("width", canvasDim.width)
    .attr("height", 30)
  .append("g")
    .attr("class", "x_axis")
    .attr("transform", "translate(" + margin.left + "," + 25 + ")")

var y_axis = svg.append("g")
  .attr("class", "y_axis")

var lines = svg.append('g')
  .attr('class', 'lines')

var nodes = svg.append('g')
  .attr('class', 'nodes')

var groups = ['Chinese', 'Malays', 'Indians', 'Others']
var color = d3.scaleOrdinal()
  .domain(groups)
  .range(["mediumblue", "gold", "teal", "hotpink"])

var svgLegend = d3.selectAll('.gLegend')

svgLegend.selectAll('.legend-pill')
  .data(groups)
  .enter().append('div')
    .attr("class", "legend-pill")
    .style("background-color", d=>color(d))
    .style("color", "white")
    .text(d=>d)

init()

function createForm(data) {

  var byParam = d3.nest()
    .key(function(d) { return d.race})
    .key(function(d) { return d.subzone})
    .sortValues(function(a,b) { return +b.value - +a.value }) 
    .entries(data)

  // Run update function when text area changes
  // $(".dropdown-menu button").click(function(){
  //   var value = $(this).text().trim()
  //   $('.dropdown-toggle').text(value)
  //   if(value=='All ethnic groups'){
  //     update(data, bySubzone_list)
  //   } else {
  //     var sort_list_new = byParam.filter(d=>d.key == value)[0].values.sort(function(a,b) { return a.values[0].value - b.values[0].value }).map(d=>d.key)
  //     let bySubzone_list_copy = bySubzone.map(d=>d.key)
  //     bySubzone_list_copy.sort(function(a,b) { return sort_list_new.indexOf(a) - sort_list_new.indexOf(b) })
  //     update(data, bySubzone_list_copy)
  //   }
  // })

  $(".legend-pill").click(function(){
    var value = $(this).text().trim()
    if(value=='All ethnic groups'){
      update(data, bySubzone_list)
    } else {
      var sort_list_new = byParam.filter(d=>d.key == value)[0].values.sort(function(a,b) { return a.values[0].value - b.values[0].value }).map(d=>d.key)
      let bySubzone_list_copy = bySubzone.map(d=>d.key)
      bySubzone_list_copy.sort(function(a,b) { return sort_list_new.indexOf(a) - sort_list_new.indexOf(b) })
      update(data, bySubzone_list_copy)
    }
  })
    
}

function createDropdown(data) {

  var PA_list = data.map(d=>d.planning_area).filter(onlyUnique)

  var byParam = d3.nest()
    .key(function(d) { return d.planning_area})
    .key(function(d) { return d.subzone})
    .sortValues(function(a,b) { return +b.value - +a.value }) 
    .entries(data)

  d3.select('.dropdown-menu').selectAll('.dropdown-item')
    .data(PA_list)
    .enter().append('div')
      .attr("class", "dropdown-item")
      .text(d=>d)

  $(".dropdown-item").click(function(){
    var value = $(this).text().trim()

    $('.dropdown-toggle').text(value)
    if(value=='All planning areas'){
      update(data, bySubzone_list)
    } else {
      var sort_list_new = byParam.filter(d=>d.key == value)[0].values.sort(function(a,b) { return a.values[0].value - b.values[0].value }).map(d=>d.key)
      let bySubzone_list_copy = bySubzone.map(d=>d.key)
      bySubzone_list_copy.sort(function(a,b) { return sort_list_new.indexOf(a) - sort_list_new.indexOf(b) })
      update(data, bySubzone_list_copy)
    }
  })

}

function init() {

  d3.queue()   
    .defer(d3.csv, './resident-population-by-subzone-ethnic-group-and-sex.csv') 
    .defer(d3.json, "../homeless/sgp_subzone.geojson")
    .await(initializeData);  

}

function initializeData(error, csv, topojson){

  let data = csv.map((d,i) => {
    return {
      race: d.level_1,
      gender: d.level_2,
      planning_area: d.level_3.split('-',2)[0],
      subzone: d.level_4,
      value: +d.value
    } 
  })

  var race_by_subzone = data.filter(d=>(groups.indexOf(d.race)!=-1) & (d.gender=='Total'))

  // find sort list
  bySubzone = d3.nest()
    .key(function(d) { return d.subzone })
    .rollup(function(leaves) { return d3.sum(leaves, function(d) {return +d.value}) })
    .entries(data)

  bySubzone.sort(function(a,b) { return +a.value - +b.value })
  bySubzone_list = bySubzone.map(d=>d.key)

  update(race_by_subzone, bySubzone_list)
  createForm(race_by_subzone)
  createDropdown(race_by_subzone)
  updateMap(topojson)
}

function update(data, sort_list) {

  var height = sort_list.length*20+100

  d3.select('#chart svg').attr('height', height)

  var xScale = d3.scaleLinear()
    //.domain(d3.extent(data, d=>d.value))
    .domain([0, 60000])
    .rangeRound([0, width])

  var yScale = d3.scaleBand()
    .domain(sort_list)
    .range([height, 0])
    .padding(10)

  // sort by count
  data.sort(function(a,b) { return sort_list.indexOf(a.subzone) - sort_list.indexOf(b.subzone) })

  data.forEach((d,i) => {
    data[i].id = d.subzone.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.race
    data[i].x = xScale(d.value),
    data[i].y = yScale(d.subzone)
  })

  // CREATE NODES (each representing an entity)
  // JOIN new data with old elements.
  var gnodes = nodes.selectAll('.node-group').data(data, d=>d.id) 

  var entered_nodes = gnodes.enter().append('g')
    .attr("class", "node-group")
    .attr("transform", function(d,i) { 
      return "translate(" + d.x + "," + d.y + ")" 
    })

  entered_nodes
    .merge(gnodes)
    .transition().duration(500)
    .attr("transform", function(d,i) { 
      return "translate(" + d.x + "," + d.y + ")" 
    })

  gnodes.exit().remove()

  entered_nodes
    .append("circle")
    .merge(gnodes.select('circle'))
      .attr('id', (d,i)=> 'circle-' + d.id)
      .attr('r', 3.5)
      .attr('stroke', 'grey')
      .attr('stroke-width', '0.5px')
      .attr('fill', d=> color(d.race) || '#fff')
      .attr('fill-opacity', 0.7)

  // CREATE CONNECTOR LINES
  var byEntity = d3.nest().key(function(d) { return d.race }).entries(data)

  line = d3.line()
    .x(d => xScale(d.value))
    .y(d => yScale(d.subzone))
    .curve(d3.curveCatmullRom.alpha(0.5));

  glines = lines.selectAll('.line-group').data(byEntity, d=>d.key)

  var entered_lines = glines.enter().append('g')
    .attr('class', 'line-group')
    
  glines.exit().remove()

  entered_lines
    .append('path')
      .attr('class', 'connector')
    .merge(glines.select('path'))
      .attr('id', (d,i)=> 'line-' + d.key) 
      .attr('d', d => line(d.values))
      .style('stroke', 'grey')
      .style('fill', 'none')
      .style('opacity', 1)
      .style('stroke-width', 1.5)
      .style("visibility", "hidden")

  // CREATE INTERACTIVITY
  // can't use gnodes.on() because no nodes have been created yet. 
  entered_nodes.on('mouseover', function (d,i) {
    d3.select(this).style("cursor", "pointer"); 
    d3.select('#circle-' + d.id)
      .attr('r', 5)
    d3.select('#line-' + d.race)
      .style("visibility","visible")
    d3.selectAll("#tooltip")
      .style('display', 'block')
    d3.select('.sgp-path-' + d.subzone.trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase())
      .style('stroke-width', 1.5)
    d3.select('.plot-subzone-text')
      .text(d.subzone)
    d3.selectAll('#district-path-' + d.planning_area.trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase())
      .style('fill', '#D3D3D3')
    d3.select('.plot-pa-text')
      .text(d.planning_area)
  })
  .on('mousemove', function(d) {
    updateTooltipContent(d)
  })
  .on('mouseout', function (d,i) {
    d3.select(this).style("cursor", "default"); 
    d3.select('#circle-' + d.id)
      .attr('r', screen.width <= 420 ? 3 : 3.5)
    d3.select('#line-' + d.race)
      .style("visibility","hidden")
    d3.selectAll("#tooltip")
      .style('display', 'none')
    d3.select('.sgp-path-' + d.subzone.trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase())
      .style('stroke-width', 0.3)
    d3.select('.plot-subzone-text')
      .text("")
    d3.selectAll('#district-path-' + d.planning_area.trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase())
      .style('fill', 'transparent')
    d3.select('.plot-pa-text')
      .text("")
  })

  // CREATE AXES // 
  var xAxis = d3.axisTop(xScale).ticks(screen.width <= 1024 ? 3 : 10).tickSizeOuter(0).tickSizeInner(10)
  var yAxis = screen.width <= 420 ? d3.axisRight(yScale).tickSize(width) : d3.axisLeft(yScale).tickSize(-width)

  d3.select(".x_axis")
    .call(xAxis)
    .call(g => {
      g.selectAll("text")
        .attr("y", -15)
        .attr('fill', '#635f5d')
        .style('font-size', screen.width <= 420 ? 11 : 13)

      g.selectAll("line")
        .attr('stroke', '#635f5d')

      g.select(".domain").remove()

    })

  d3.select(".y_axis")
    .transition().duration(500)
    .call(yAxis)
    .call(g => {
      g.selectAll("text")
      .attr("x", -axisPad*2)
      .style("font-weight", "normal")
      .style('font-size', screen.width <= 420 ? '7px' : '10px')
      .attr("y" , screen.width <= 420 ? "-0.9em" : 0)
      .attr('fill', '#635f5d')
      .style("cursor", "pointer")

      g.selectAll("line")
        .attr('stroke', '#635f5d')
        .attr('stroke-width', 0.7) // make horizontal tick thinner and lighter so that line paths can stand out
        .attr('opacity', 0.3)

     })

}

function updateTooltipContent(d) {

  tooltip
    .attr('class', 'text-' + d.id)
    .style("left", (d3.event.pageX) + "px")
    .style("top", (d3.event.pageY - 70) + "px")
    .style('color', 'black')
    .style('font-size', '10px')
    .style('padding', '9px')
    .html("<div><span><u>" + d.subzone + "</u></span><br><span><b>" + d.value + " " + d.race + "</b></span></div>")
    //.html("<div><span><u>" + d.subzone + "</u></span><br><span>" + d.race + "</span><br><span><b>" + d.value + " people</b></span></div>")

}

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

function mergeArrays(...arrays) {
    let jointArray = []

    arrays.forEach(array => {
        jointArray = [...jointArray, ...array]
    })
    const uniqueArray = jointArray.reduce((newArray, item) =>{
        if (newArray.includes(item)){
            return newArray
        } else {
            return [...newArray, item]
        }
    }, [])
    return uniqueArray
}



var plotWidth = 620
var plotHeight = 300

var viz = d3.select(".svg-container").append("svg")
            .classed("svg-content",true)
            .attr('viewbox', `0 0 ${plotWidth} ${plotHeight}`)
            //.attr("preserveAspectRatio", "xMinYMin meet")
            .attr("width", '100%')
            .attr("height", '100%');

var plot = viz.append("g")
    .attr("class","plot")
    .attr("transform", "translate(" + 80 + "," + 0 + ")");

var plot_desc = viz.append("g")
    .attr("class","plot_desc")
    .attr("transform", "translate(" + 415 + "," + 200 + ")");

plot_desc.append('rect')
  .attr('width', 20)
  .attr('height', 5)
  .attr('x', 0)
  .attr('y', 0)
  .attr('fill', 'black')

plot_desc.append('rect')
  .attr('width', 20)
  .attr('height', 10)
  .attr('x', 0)
  .attr('y', 20)
  .attr('fill', '#d3d3d3')
  .attr('stroke-width', 0.3)

plot_desc.append('text')
  .attr('x', 25)
  .attr('y', 5)
  .attr('font-size', '10px')
  .text('Subzone:')

plot_desc.append('text')
  .attr('x', 25)
  .attr('y', 28)
  .attr('font-size', '10px')
  .text('Planning area')

plot_desc.append('text')
  .attr('class', 'plot-subzone-text')
  .attr('x', 100)
  .attr('y', 5)
  .attr('font-size', '12px')
  .attr('text-decoration', 'underline')

plot_desc.append('text')
  .attr('class', 'plot-pa-text')
  .attr('x', 100)
  .attr('y', 28)
  .attr('font-size', '12px')
  .attr('text-decoration', 'underline')

function updateMap(data) {

  var projection = d3.geoMercator().fitSize([plotWidth,plotHeight],data)
  var path = d3.geoPath(projection)

  var areas = plot.selectAll("path").data(data.features)
  areas.enter().append("path")
    .attr("d",path)
    .attr('id', (d,i)=>'district-path-'+d.properties['PLN_AREA_N'].trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase())
    .attr('class', (d,i)=>'sgp-path-'+d.properties['SUBZONE_N'].trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase())
    .classed("area",true)

}
