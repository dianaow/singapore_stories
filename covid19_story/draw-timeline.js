async function drawTimeline() {

  // 1. Access data
  // cumulative_confirmed
  // daily_discharged
  // passed_but_not_due_to_covid
  // cumulative_discharged
  // discharged_to_isolation
  // still_hospitalised
  // daily_deaths
  // cumulative_deaths
  // tested_positive_demise
  // daily_imported
  // daily_local_transmission
  // local_cases_residing_in_dorms_moh_report
  // local_cases_not_residing_in_doms_moh_report
  // intensive_care_unit_icu
  // general_wards_moh_report
  // in_isolation_moh_report
  // total_completed_isolation_moh_report
  // total_hospital_discharged_moh_report

  // 
  let dataset = await d3.csv("./covid-19-SG.csv")
  
  const parseDate = d3.timeParse("%Y-%m-%d")
  const formatDate = d3.timeFormat("%Y-%m-%d")
  const columns = ['Daily Imported', 'Daily Local transmission', 'Local cases residing in dorms MOH report', 'Local cases not residing in doms MOH report', 'Daily Discharged']
  const colors = ["#3FF59E", "#FAC979", "#FB9D96", "#ffd300", "#49A3E2"]

  let long_data = [];
  let dates = []
  dataset.map(row=>{
    dates.push(parseDate(row['Date']))
    Object.keys(row).forEach( function(colname) {
      if(columns.indexOf(colname)!== -1){
        //if(colname === 'Daily Local transmission'){
          long_data.push({'group': colname, "value": row[colname], "date": parseDate(row['Date'])})
        //}
      }
    })
  })

  const dataNew = d3.nest()
    .key(d=>d.group)
    .entries(long_data)

  // Find first non-zero value index in an array
  dataNew.forEach((d,i)=>{
    var index = d.values.findIndex(function (row) {
      return +row.value > 0
    })

    if(d.key === 'Daily Local transmission') { 
      // Truncate 'Daily Local transmission' at date cases breakdown by dorms vs community became available
      let dorms = dataNew.find(d=>d.key === 'Local cases residing in dorms MOH report').values
      let splitIndex = dorms.findIndex(function (row) { return row.value !== '' })
      console.log(splitIndex)
      d.values = d.values.filter((d,i) => i > index & i < splitIndex)
    } else {
      d.values = d.values.filter((d,i) => i > index)
    }

  })

  const maCases = movingAvg(dataset.map(d=>+d['Daily Confirmed ']), 7)
  console.log(maCases)

  let xAccessor = d => +d.value
  let yAccessor = d => d.date

  // 2. Create chart dimensions

  const width = d3.min([
    window.innerWidth * 0.9,
    1440
  ])
  let dimensions = {
    width: 1500 * 2.5,
    height: dates.length * 50,
    margin: {
      top: 10,
      right: 10,
      bottom: 50,
      left: 100,
    },
  }
  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left
    - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top
    - dimensions.margin.bottom

  // 3. Draw canvas

  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)

  const bounds = wrapper.append("g")
      .style("transform", `translate(${
        dimensions.margin.left
      }px, ${
        dimensions.margin.top
      }px)`)

  // 4. Create scales

  const xScale = d3.scaleLinear()
    .domain([0, 1500])
    .range([0, dimensions.boundedWidth])
    .nice()

  // assign a space of 30px for each date
  const yScale = d3.scaleTime()
    .domain(d3.extent(dates, d=>d))
    .range([0, dimensions.boundedHeight])

  const colorScale = d3.scaleOrdinal()
    .domain(columns)
    .range(colors)

  const rScale = d3.scaleSqrt()
    .domain([0, 1500])
    .range([0, 80])

  const bgcolorScale = d3.scaleLinear()
    .domain([0, d3.max(maCases, d=>d)])
    .range(['white', 'black'])

  // Define the line
  var singleLine = d3.line() 
      .curve(d3.curveCardinal.tension(0.25))
      .x(function(d){ return xScale(xAccessor(d)) })
      .y(function(d){ return yScale(yAccessor(d)) })

  // 5. Draw data

  dataNew.forEach(function(d,i) { 

    bounds.append("path")
        .attr("class", "line")
        .attr("d", singleLine(d.values))
        .attr('stroke', colorScale(d.key))
        .attr('stroke-width', '2px')
        .attr("mix-blend-mode", "multiply")
        .attr('fill', 'none')

    //Appends a circle for each datapoint 
    bounds.selectAll(".dot-" + d.key)
        .data(d.values)
      .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot-" + d.key) // Assign a class for styling
        .attr('fill', el => colorScale(el.group))
        .attr("cx", function(el, i) { return xScale(xAccessor(el)) })
        .attr("cy", function(el) { return yScale(yAccessor(el)) })
        .attr("mix-blend-mode", "multiply")
        .attr("r", el => rScale(xAccessor(el)))

  });

  let last_known_scroll_position = 0;
  let ticking = false;
  window.addEventListener('scroll', function(e) {
    last_known_scroll_position = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(function() {
        //console.log(last_known_scroll_position)
          let counter = Math.floor(last_known_scroll_position / 50) + 14
          let avg = maCases[counter] || 0
          console.log(last_known_scroll_position, counter, avg)
          d3.select("#wrapper")
            .transition().duration(350)
            .style("background-color", bgcolorScale(avg))

        ticking = false;
      });

      ticking = true;
    }
  });

  // 6. Draw peripherals

  let xAxis = d3.axisTop(xScale)
    //.tickValues([0, 1200, 2400, 3600])
    .tickSize(-dimensions.height)

  bounds.append("g")
    .attr("transform", "translate(0," + 20 + ")")
    .attr("class", "xaxis")
    .call(xAxis) 
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .style("stroke-width", 1)
        .attr("stroke", "#333")
        .attr("stroke-opacity", 0.2)
        .attr("stroke-dasharray", "6,4")
    )

  const xAxisLabel = bounds.append("text")
      .attr("x", dimensions.boundedWidth / 2)
      .attr("y", dimensions.margin.bottom - 10)
      .attr("fill", "black")
      .style("font-size", "1.4em")
      .html("New cases")

  let steps 
  let tick_vals = d3.timeDays(dates[0], dates[dates.length-1], 10)
  const yAxis = d3.axisLeft(yScale)
    .tickValues(tick_vals.slice(1, tick_vals.length)) 
    .tickFormat(function(d) { return formatDate(d) })
    .tickSize(-dimensions.width)

  bounds.append("g")
      .attr("transform", "translate(0," + 0 + ")")
      .attr("class", "yaxis")
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", "#333")
          .style("stroke-width", 1)
          .attr("stroke-opacity", 0.2)
      )

  d3.selectAll(".yaxis").selectAll(".tick")
    .append("text")
    .text(d => "DAY " + tick_vals.indexOf(d)*10)
    .attr("stroke", "#333")
    .style("stroke-width", 1)
    .attr("stroke-opacity", 0.2)
    .attr('dy', '-0.35em')
    .attr('x', screen.width-140)

}

/**
    * returns an array with moving average of the input array
    * @param array - the input array
    * @param count - the number of elements to include in the moving average calculation
    * @param qualifier - an optional function that will be called on each 
    *  value to determine whether it should be used
    */
function movingAvg(array, count, qualifier){

  // calculate average for subarray
  var avg = function(array, qualifier){

    var sum = 0, count = 0, val;
    for (var i in array){
      val = array[i];
      if (!qualifier || qualifier(val)){
        sum += val;
        count++;
      }
    }

    return sum / count;
  };

  var result = [], val;

  // pad beginning of result with null values
  for (var i=0; i < count-1; i++)
    result.push(null);

  // calculate average for each subarray and add to result
  for (var i=0, len=array.length - count; i <= len; i++){

    val = avg(array.slice(i, i + count), qualifier);
    if (isNaN(val))
      result.push(null);
    else
      result.push(val);
  }

  return result;
}

drawTimeline()