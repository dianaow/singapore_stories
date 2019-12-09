var screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * (screen.width <= 420 ? 0.9 : 0.85)
var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 10
var canvasDim = { width: screenWidth, height: screenHeight}

var bySubzone, byRace, sort_list_PA

var paValue = 'All planning areas'
var selectedRace = undefined
var view_type = 'Population count'
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

var svgLegend = d3.selectAll('.ethnic-groups-pills')

svgLegend.selectAll('.legend-pill')
  .data(groups)
  .enter().append('div')
    .attr("class", "legend-pill")
    .style("background-color", d=>color(d))
    .style('border', '1px solid black')
    .style("color", d=>(['transparent', 'gold'].indexOf(color(d)) != -1) ? "black" : "white")
    .text(d=>d)

var xScaleCount = d3.scaleLinear()
  //.domain(d3.extent(data, d=>d.value))
  .domain([0, 60000])
  .rangeRound([0, width])

var xScalePerc = d3.scaleLinear()
  .domain([0, 100])
  .rangeRound([0, width])

var xScalePercTrunc = d3.scaleLinear()
  .domain([0, 8])
  .rangeRound([0, width])

const annotations = [
  {
    note: {
      label: "There are 89310 Chinese living in Tampines East",
      align: "left",  // try right or left
      wrap: 130,  // try something smaller to see text split in several lines
      padding: 5   // More = text lower
    },
    type: d3.annotationCalloutCircle,
    subject: {
      radius: 10,         // circle radius
      radiusPadding: 10   
    },
    color: ["black"],
    x: 0,
    y: 0,
    dy: 0,
    dx: -120
  },
]

const makeAnnotations = d3.annotation()
  .annotations(annotations)

d3.select('#chart svg')
  .append("g")
  .attr('class', 'annotations-group')
  //.attr('transform', 'translate(' + (xScaleCount.range()[1]+margin.left).toString() + ',' + 20  + ')')
  .attr('transform', 'translate(' + (xScaleCount.range()[1]+margin.left+xScaleCount(1000)).toString() + ',' + 20  + ')')

init()

function interactiveLogic(data, bySubzone_list) {

  var CURRENT_SORT_LIST = bySubzone_list

  var byParam = d3.nest()
    .key(function(d) { return d.planning_area})
    .key(function(d) { return d.subzone})
    .sortValues(function(a,b) { return +b.value - +a.value }) 
    .entries(data)

  var byParam_WnSubzonePerc = d3.nest()
    .key(function(d) { return d.planning_area})
    .key(function(d) { return d.subzone})
    .sortValues(function(a,b) { return +b.perc_wn_subzone - +a.perc_wn_subzone}) 
    .entries(data)

  var byParam_WnRacePerc = d3.nest()
    .key(function(d) { return d.planning_area})
    .key(function(d) { return d.subzone})
    .sortValues(function(a,b) { return +b.perc_wn_race - +a.perc_wn_race})
    .entries(data)

  var byRaceSubzone = d3.nest()
    .key(function(d) { return d.race})
    .key(function(d) { return d.subzone})
    .sortValues(function(a,b) { return +b.value - +a.value }) 
    .entries(data)

  var byRaceSubzone_WnSubzonePerc = d3.nest()
    .key(function(d) { return d.race})
    .key(function(d) { return d.subzone})
    .sortValues(function(a,b) { return +b.perc_wn_subzone - +a.perc_wn_subzone}) 
    .entries(data)

  var byRaceSubzone_WnRacePerc = d3.nest()
    .key(function(d) { return d.race})
    .key(function(d) { return d.subzone})
    .sortValues(function(a,b) { return +b.perc_wn_race - +a.perc_wn_race}) 
    .entries(data)

  // Ethnicity buttons
  $(".legend-pill").click(function(){

    d3.selectAll('.legend-pill').style('border', '1px solid black')
    d3.select(this).style('border', '4px solid black')

    var value = $(this).text().trim()
    selectedRace = value
    var new_sort_order = CURRENT_SORT_LIST 

    if(view_type=='Population count'){
      new_sort_order = byRaceSubzone.filter(d=>d.key == selectedRace)[0].values.sort(function(a,b) { return a.values[0].value - b.values[0].value }).map(d=>d.key)
    } else if(view_type=='Within subzone %'){
      new_sort_order = byRaceSubzone_WnSubzonePerc.filter(d=>d.key == selectedRace)[0].values.sort(function(a,b) { return a.values[0].perc_wn_subzone - b.values[0].perc_wn_subzone }).map(d=>d.key)
    } else if(view_type=='Within race %'){
      new_sort_order = byRaceSubzone_WnRacePerc.filter(d=>d.key == selectedRace)[0].values.sort(function(a,b) { return a.values[0].perc_wn_race - b.values[0].perc_wn_race }).map(d=>d.key)
    }

    if(paValue == 'All planning areas') {

      CURRENT_SORT_LIST.sort(function(a,b) { return new_sort_order.indexOf(a) - new_sort_order.indexOf(b) })
      
    } else {

      if(view_type=='Population count'){
        sort_list_PA = byParam.filter(d=>d.key == paValue)[0].values.sort(function(a,b) { return a.values[0].value - b.values[0].value }).map(d=>d.key)
      } else if(view_type=='Within subzone %'){
        sort_list_PA = byParam_WnSubzonePerc.filter(d=>d.key == paValue)[0].values.sort(function(a,b) { return a.values[0].perc_wn_subzone - b.values[0].perc_wn_subzone }).map(d=>d.key)
      } else if(view_type=='Within race %'){
        sort_list_PA = byParam_WnRacePerc.filter(d=>d.key == paValue)[0].values.sort(function(a,b) { return a.values[0].perc_wn_race - b.values[0].perc_wn_race }).map(d=>d.key)
      }

      sort_list_PA.sort(function(a,b) { return new_sort_order.indexOf(a) - new_sort_order.indexOf(b) })
      CURRENT_SORT_LIST.sort(function(a,b) { return sort_list_PA.indexOf(a) - sort_list_PA.indexOf(b) })
    }

    update(data, CURRENT_SORT_LIST, view_type)

  })

  $(".dropdown-2 .dropdown-item").click(function(){
    var value = $(this).text().trim()
    $('.dd-2 .dropdown-toggle').text(value)
    view_type = value
    var new_sort_order = CURRENT_SORT_LIST 

    if(paValue=='All planning areas'){
      if(selectedRace == undefined){

        d3.select('.annotations-group').attr('display', 'block')
        CURRENT_SORT_LIST = bySubzone.map(d=>d.key)

      } else {

        if(view_type=='Population count'){
          new_sort_order = byRaceSubzone.filter(d=>d.key == selectedRace)[0].values.sort(function(a,b) { return a.values[0].value - b.values[0].value }).map(d=>d.key)
        } else if(view_type=='Within subzone %'){
          new_sort_order = byRaceSubzone_WnSubzonePerc.filter(d=>d.key == selectedRace)[0].values.sort(function(a,b) { return a.values[0].perc_wn_subzone - b.values[0].perc_wn_subzone }).map(d=>d.key)
        } else if(view_type=='Within race %'){
          new_sort_order = byRaceSubzone_WnRacePerc.filter(d=>d.key == selectedRace)[0].values.sort(function(a,b) { return a.values[0].perc_wn_race - b.values[0].perc_wn_race }).map(d=>d.key)
        }
        CURRENT_SORT_LIST.sort(function(a,b) { return new_sort_order.indexOf(a) - new_sort_order.indexOf(b) })

      }

    } else {

      CURRENT_SORT_LIST.sort(function(a,b) { return sort_list_PA.indexOf(a) - sort_list_PA.indexOf(b) })
      
    }
    update(data, CURRENT_SORT_LIST, view_type)

  })

  $(".dropdown-1 .dropdown-item").click(function(){
    
    var value = $(this).text().trim()
    paValue = value

    $('.dd-1 .dropdown-toggle').text(value)
    if(value=='All planning areas'){

      CURRENT_SORT_LIST = bySubzone.map(d=>d.key)

      d3.select('.annotations-group').attr('display', 'block')
      d3.selectAll("circle").style('fill-opacity', 1)
      d3.selectAll('.y_axis text').style('opacity', 1)
      d3.selectAll('.y_axis line').style('stroke-opacity', 1)

      plot.selectAll("path")
        .style('fill', 'transparent')
      plot_desc.select('.plot-pa-text')
        .text("")

    } else {

      if(view_type=='Population count'){
        sort_list_PA = byParam.filter(d=>d.key == value)[0].values.sort(function(a,b) { return a.values[0].value - b.values[0].value }).map(d=>d.key)
      } else if(view_type=='Within subzone %'){
        sort_list_PA = byParam_WnSubzonePerc.filter(d=>d.key == value)[0].values.sort(function(a,b) { return a.values[0].perc_wn_subzone - b.values[0].perc_wn_subzone }).map(d=>d.key)
      } else if(view_type=='Within race %'){
        sort_list_PA = byParam_WnRacePerc.filter(d=>d.key == value)[0].values.sort(function(a,b) { return a.values[0].perc_wn_race - b.values[0].perc_wn_race }).map(d=>d.key)
      }

      CURRENT_SORT_LIST.sort(function(a,b) { return sort_list_PA.indexOf(a) - sort_list_PA.indexOf(b) })
      
      d3.select('.annotations-group').attr('display', 'none')
      d3.selectAll("circle").style('fill-opacity', 0.4)
      d3.selectAll('.y_axis text').style('opacity', 0.4)
      d3.selectAll('.y_axis line').style('stroke-opacity', 0.4)

      plot.selectAll("path")
        .style('fill', 'transparent')

      sort_list_PA.map(d=>{
        var id = d.trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase()
        var PLANNING_AREA = value.trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase()
        d3.selectAll("circle[id*='" + id + "']").style('fill-opacity', 1)
        d3.select('.axis-tick-'+id).style('opacity', 1)
        d3.select('.axis-line-'+id).style('stroke-opacity', 1)

        d3.selectAll('#district-path-' + PLANNING_AREA)
          .style('fill', '#D3D3D3')
        plot_desc.select('.plot-pa-text')
          .text(PLANNING_AREA) 
      })

    }
    update(data, CURRENT_SORT_LIST, view_type)

  })

}

function createForm(data) {

  var PA_list = data.map(d=>d.planning_area).filter(onlyUnique)
  PA_list.unshift('All planning areas')

  d3.select('.dropdown-1').selectAll('.dropdown-item')
    .data(PA_list)
    .enter().append('div')
      .attr("class", "dropdown-item")
      .text(d=>d)

  d3.select('.dropdown-2').selectAll('.dropdown-item')
    .data(['Population count', 'Within subzone %', 'Within race %'])
    .enter().append('div')
      .attr("class", "dropdown-item")
      .text(d=>d)

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
      PLANNING_AREA: d.level_3.split('-',2)[0].trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase(),
      subzone: d.level_4,
      SUBZONE: d.level_4.trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase(),
      value: +d.value
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

  update(race_by_subzone, bySubzone_list, view_type)
  createForm(race_by_subzone)
  interactiveLogic(race_by_subzone, bySubzone_list)
  updateMap(topojson)

  d3.select('.annotations-group').call(makeAnnotations)
    .attr('font-size', window.innerWidth > 1500 ? '14px' : '10px')
    .attr('opacity', 1)
}

function update(data, sort_list, type) {

  var height = sort_list.length*20+100

  d3.select('#chart svg').attr('height', height)

  var yScale = d3.scaleBand()
    .domain(sort_list)
    .range([height, 0])
    .padding(10)

  // sort by count
  data.sort(function(a,b) { return sort_list.indexOf(a.subzone) - sort_list.indexOf(b.subzone) })

  data.forEach((d,i) => {
    data[i].id = d.SUBZONE + "-" + d.race
    data[i].y = yScale(d.subzone)
  })

  if(type=='Population count'){
    data.forEach((d,i) => {
      if(d.value > 61000) {
        data[i].x = xScaleCount(61000)
      } else {
        data[i].x = xScaleCount(d.value)
      }
    })
    xScale = xScaleCount
  }

  if(type=='Within subzone %'){
    data.forEach((d,i) => {
      data[i].x = xScalePerc(d.perc_wn_subzone)
    })
    xScale = xScalePerc 
    d3.select('.annotations-group').attr('display', 'none')
  }

  if(type=='Within race %'){
    data.forEach((d,i) => {
      data[i].x = xScalePercTrunc(d.perc_wn_race)
    })
    xScale = xScalePercTrunc
    d3.select('.annotations-group').attr('display', 'none')
  }

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

    d3.select('.sgp-path-' + d.SUBZONE)
      .style('stroke-width', 1.5)
    d3.select('.plot-subzone-text')
      .text(d.subzone)
    d3.selectAll('#district-path-' + d.PLANNING_AREA)
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

    d3.select('.sgp-path-' + d.SUBZONE)
      .style('stroke-width', 0.3)
    d3.select('.plot-subzone-text')
      .text("")
    d3.selectAll('#district-path-' + d.PLANNING_AREA)
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
      .attr("y" , screen.width <= 420 ? "-0.9em" : 0)
      .style("font-weight", "normal")
      .style('font-size', screen.width <= 420 ? '7px' : '10px')
      .attr('fill', '#635f5d')
      .style("cursor", "pointer")

      g.selectAll("line")
        .attr('stroke', '#635f5d')
        .attr('stroke-width', 0.7) // make horizontal tick thinner and lighter so that line paths can stand out
        .attr('opacity', 0.3)

     })

  d3.selectAll(".y_axis text").attr('class', function(d) { 
    return 'axis-tick-'+d.trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase() 
  })
  d3.selectAll(".y_axis line").attr('class', function(d) { 
    return 'axis-line-'+d.trim().replace(/[^A-Z0-9]+/ig, "_").toUpperCase() 
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