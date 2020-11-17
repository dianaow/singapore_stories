var chart = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var points
  var canvasDim = { width: screen.width, height: window.innerHeight }
  var margin = {top: 0, right: 0, bottom: 0, left: 30}
  var width = canvasDim.width - margin.left - margin.right 
  var height = canvasDim.height - margin.top - margin.bottom 

  var parl_ids = d3.range(1, 15)

  //////////////////// Set up and initiate containers ///////////////////////
  var canvas = d3.select('#dotplot-canvas').append("canvas")
  var ctx = canvas.node().getContext("2d")
  var sf = Math.min(2, getPixelRatio(ctx)) //no more than 2
  if(screen.width < 500) sf = 1 //for small devices, 1 is enough

  canvas
    .attr('width', sf * width)
    .attr('height', sf * height)
    .style('width', width + "px")
    .style('height', height + "px")

  ctx.scale(sf,sf);
  ctx.translate(margin.left, margin.top);

  var chart = d3.select("#dotplot-svg")
  var svg = chart.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Initialize //////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  return { 
    run : function () {

      loadData()

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////// Generate data //////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      function loadData() {

        d3.queue()
          .defer(d3.csv, './data/data.csv')
          .await(processData);   

      }

      function processData(error, csv) {
        
        if (error) throw error;

        let data = []
        let cols = parl_ids.map(d=>'Parliament_' + d.toString())
        for (var i in cols) {    // for each parliament number
          for (var j in csv) {  // for each row in the CSV
            if (csv[j][cols[i]] !== "") {   // if they match
              data.push({
                id: csv[j]['Name'] ? csv[j]['Name'].replace(/\s+/g, '_').toLowerCase() : "",
                Name: csv[j]['Name'],
                Ethnicity: csv[j]['Ethnicity'],
                Gender: csv[j]['Gender'],
                Party: categorize(csv[j]['Party']),
                Type: csv[j][cols[i]],
                Parliament: +i + 1
              })
            } 
          }
        }

        console.log(data)

        init(svg, width, height, data)

      }

      function categorize(d){
        if( d === 'NMP'){
          return 'NMP'
        } else if(d !== "People's Action Party" & d !== "Barisan Sosialis" & d !== "Worker's Party") {
          return "Others"
        } else {
          return d
        }
      }

    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Control Center /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function init(svg, width, height, data) {

    data = data.sort(function(x, y){ return parl_ids.indexOf(x.Parliament) - parl_ids.indexOf(y.Parliament) })

    // 1: Party
    var parties = data.map(d => d['Party']).filter(onlyUnique).filter(e=>e != undefined)
    var partyColors = [{r: 211, g: 211, b: 211}, {r: 0, g: 0, b: 0}, {r: 0, g: 0, b: 128}, {r: 255, g: 105, b: 180}]
    var partyColorScale = d3.scaleOrdinal()
      .domain(parties)
      .range(partyColors)

    var parties_groupby = groupby('Party')

    renderBarLegend(parties_groupby, partyColorScale, parties, 'party')

    var tab = 'party'
    var dots = update(data, tab)
    points = dots.dots
    interactiveLegend(d3.selectAll('rect.barLegend'), points)
    
    setTimeout(function(){
       animateCircles(points, data, tab, 'tiledbar')
    })

    // 2: Gender
    var gender = ['Female', 'Male']
    var genderColors = ["pink", "blue"]
    var genderColorScale = d3.scaleOrdinal()
      .domain(gender)
      .range(genderColors)

    var gender_groupby = groupby('Gender')

    //d3.select(".btn-gender")
      //.on("click", function(d) {
        // setTimeout(function(){
        //   tab = 'gender'
        //   animateCircles(points, data, tab)
        //   points = points.sort(function(a,b) { return gender.indexOf(a["Gender"]) - gender.indexOf(b["Gender"]); })
        //   d3.select('.gLegend').remove()
        //   renderBarLegend(gender_groupby, genderColorScale, gender, 'gender')
        //   interactiveLegend(d3.selectAll('rect.barLegend'), points)
        // }, 1000)
      //})

    // 3: Ethnicity
    var ethnicities = data.map(d => d['Ethnicity']).filter(onlyUnique).filter(e=>e != undefined)
    var ethnicitiesColors = ['darkslateblue', 'red', 'orange', 'teal']
    var ethnicitiesColorScale = d3.scaleOrdinal()
      .domain(ethnicities)
      .range(ethnicitiesColors)

    var eth_groupby = groupby('Ethnicity')

    //d3.select(".btn-ethnicity")
      //.on("click", function(d) {
        // setTimeout(function(){
        //   tab = 'ethnicity'
        //   points = animateCircles(points, data, tab)
        //   points = points.sort(function(a,b) { return ethnicities.indexOf(a["Ethnicity"]) - ethnicities.indexOf(b["Ethnicity"]); })
        //   d3.select('.gLegend').remove()
        //   renderLegend(eth_groupby, ethnicitiesColorScale, ethnicities, 'ethnicities')
        //   interactiveLegend(d3.selectAll('rect.barLegend'), points)
        // }, 4000)
      //})

    // 4 Type
    var types = ['MP', 'NMP', 'NCMP']
    var typeColors = ['lightgray', 'black', 'aquamarine']
    var typeColorScale = d3.scaleOrdinal()
      .domain(types)
      .range(typeColors)

    var type_groupby = groupby('Type')

    //d3.select(".btn-type")
      //.on("click", function(d) {
        // setTimeout(function(){
        //   tab = 'type'
        //   points = animateCircles(points, data, tab)
        //   points = points.sort(function(a,b) { return types.indexOf(a["Type"]) - types.indexOf(b["Type"]); })
        //   d3.select('.gLegend').remove()
        //   renderBarLegend(type_groupby, typeColorScale, types, 'type')
        //   interactiveLegend(d3.selectAll('rect.barLegend'), points)
        // }, 8000)
      //})

    function update(data, tab) {
      var options = {
        radius: window.innerWidth >= 1920 ? 10 : 8,
        tilesPerRow: 5,
        width: width,
        height: height-40,
        leftBuffer: 0,
        bottomBuffer: 0
      }

      if(tab=='ethnicity'){
        options.category = {'color': ethnicitiesColorScale, 'sort_list': ethnicities, 'sort_category': 'Ethnicity'}
      } else if(tab=='gender'){
        options.category = {'color': genderColorScale, 'sort_list': gender, 'sort_category': 'Gender'}
      } else if(tab=='party'){
        options.category = {'color': partyColorScale, 'sort_list': parties, 'sort_category': 'Party'}
      } else if(tab=='type'){
        options.category = {'color': typeColorScale, 'sort_list': types, 'sort_category': 'Type'}
      } 

      var dots = createDots(data, 'bar', 'Parliament', "", parl_ids, "", options)
      updateCircles(ctx, dots.dots)
      updateLabels(svg, dots.labels)

      return dots
    }

    function update1(data, tab) {
      var options = {
        radius: window.innerWidth >= 1920 ? 5 : 4,
        tilesPerRow: 6,
        width: width,
        height: height-40,
        leftBuffer: 0,
        bottomBuffer: 0
      }

      if(tab=='ethnicity'){
        options.category = {'color': ethnicitiesColorScale, 'sort_list': ethnicities, 'sort_category': 'Ethnicity'}
      } else if(tab=='gender'){
        options.category = {'color': genderColorScale, 'sort_list': gender, 'sort_category': 'Gender'}
      } else if(tab=='party'){
        options.category = {'color': partyColorScale, 'sort_list': parties, 'sort_category': 'Party'}
      } else if(tab=='type'){
        options.category = {'color': typeColorScale, 'sort_list': types, 'sort_category': 'Type'}
      } 

      var dots = createDots(data, 'tiledbar', 'Parliament', "Party", parl_ids, parties, options) 
      updateCircles(ctx, dots.dots)
      updateLabels(svg, dots.labels)

      return dots
    }

    function animateCircles(points, data, tab, type) {

      const duration = 1000;
      const ease = d3.easeCubic;

      // store the source position
      points.forEach(point => {
        point.sx = point.x;
        point.sy = point.y;
        point.previous_color = point.color
      });

      if(type === 'bar'){
        var dots = update(data, tab)
      } else if(type === 'tiledbar'){
        var dots = update1(data, tab)
      }
      
      pointsNEW = dots.dots
      // store the destination position
      points.forEach(point => {
        var p = pointsNEW.find(b=>b.index == point.index)
        point.tx = p.x;
        point.ty = p.y;
        point.color = {r: 0, g: 0, b: 0};
        point.category = p.category;
        point.index = p.index;
      });

      timer = d3.timer((elapsed) => {
        // compute how far through the animation we are (0 to 1)
        const t = Math.min(1, ease(elapsed / duration));

        // update point positions (interpolate between source and target)
        points.forEach(point => {
          point.x = point.sx * (1 - t) + point.tx * t;
          point.y = point.sy * (1 - t) + point.ty * t;
          point.fill = interpolateLinear(t, point.previous_color, point.color)
        });

        // update what is drawn on screen
        updateCircles(ctx, points);

        // if this animation is over
        if (t === 1) {
          // stop this timer since we are done animating.
          timer.stop();
        }
      });

      return points
    }

    function interpolateLinear(t,c1,c2){ // pos 0-1, c1,c2 are objects {r,g,b}
        return {
           r : c1.r * (1 - t) + c2.r * t,
           g : c1.g * (1 - t) + c2.g * t,
           b : c1.b * (1 - t) + c2.b * t,
        };
    }

    function groupby(X) {
      const groupby = data.map(d => d[X]).reduce((total, value) => {
        total[value] = (total[value] || 0) + 1;
        return total;
      }, {});
      return groupby
    }


  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Interactivity ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  // When each bar on legend is hovered, dots in respective category is highlight
  function interactiveLegend(bar, points) {
    bar.on("mousemove", function(d) {
      draw(d, 0.05, points)
    }).on("mouseout", function(d) {
      draw(d, 1, points)
    })

    function draw(d, opacity, points) {

      // erase what is on the canvas currently
      ctx.clearRect(0, 0, width, height);

      // draw each point as a rectangle
      for (let i = 0; i < points.length; ++i) {
        const point = points[i];
        ctx.fillStyle = point.color;
        ctx.beginPath();
        ctx.moveTo(point.x + point.r, point.y);
        ctx.arc(point.x, point.y, point.r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = point.category == d[0] ? 1 : opacity
      }

      ctx.restore();
    }

  }

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Update dot plot ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function updateCircles(ctx, points) {

    ctx.save();

    // erase what is on the canvas currently
    ctx.clearRect(0, 0, width, height);

    // draw each point as a rectangle
    for (let i = 0; i < points.length; ++i) {
      const point = points[i];
      ctx.fillStyle = `rgb(${point.fill["r"]},${point.fill["g"]},${point.fill["b"]})`
      ctx.beginPath();
      ctx.moveTo(point.x + point.r, point.y);
      ctx.arc(point.x, point.y, point.r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1
    }

    ctx.restore();

  }

  ///////////////////////////////////////////////////////////////////////////
  ////////////////// Update labels (x-axis of dot plot) /////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function updateLabels(svg, data) {

    var texts = svg.selectAll("text").data(data)

    texts.exit().remove() 

    var entered_texts = texts
        .enter().append("text")
        .merge(texts)
        .attr("fill", d => 'black')
        .attr('dy', '0.35em')
        .attr('font-size', '0.8em')
        .attr("transform", d=> d.key=='xaxis_label' ? "translate(" + d.x + "," + d.y + ")rotate(45)" : "translate(" + d.x + "," + d.y + ")") 
        .attr('text-anchor', d=> d.key=='xaxis_label' ? 'start' : 'middle')
        .text(d=>d.value)

    //texts = texts.merge(entered_texts)

    //texts
      //.transition().duration(2000)
      //.attr("transform", d=> d.key=='xaxis_label' ? "translate(" + d.x + "," + d.y + ")rotate(45)" : "translate(" + d.x + "," + d.y + ")") 
      //.text(d=>d.value)

  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Render bar chart ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  
  function renderBarLegend(obj, scale, categories, cat_string) {

    var pad = 20
    var result = Object.keys(obj).map(function(key) {
      return [`${key}`, obj[key]];
    });

    var xScale = d3.scaleLinear()
      .domain([0, Math.ceil(d3.max(result, d=>d[1])/500) * 500])
      .range([0, 400 - (cat_string=='ethnicities' ? 50 : 0) ])
      
    var yScale = d3.scaleBand()
      .domain(categories)
      .range([0, 200-pad])
      .padding(0.1)

    var legend = d3.select('#legend').append('g')
      .attr('transform', d => 'translate(' + (cat_string=='ethnicities' ? 120 : 50) + ',0)')
      .attr('class', 'gLegend')

    d3.select('#legend').append('text')
      .attr('class', 'annotation')
      .attr('transform', d => 'translate(' + 20 + ',' + 215 + ')')
      .text('Hover over any of the bars to highlight a category')

    let rects = legend.selectAll("rect").data(result)

    rects.exit().remove()

    var entered_rects = rects.enter().append("rect")
        .attr('class', 'barLegend')
        .attr("width", (d,i) => xScale(d[1]))
        .attr("height", yScale.bandwidth())
        .attr("fill", (d,i) => scale(d[0]))
        .attr('stroke', 'black')
        .attr('stroke-width', '0px')
        .attr('id', d=>d.key)
        .attr("x", 0)
        .attr("y", (d,i) => yScale(d[0]))

    rects = rects.merge(entered_rects)

    legend.append("g")
      .attr("transform", "translate(0," + (200-pad).toString() + ")")
      .call(d3.axisBottom(xScale).ticks(10, cat_string=='party' ? 'f' : 's'))

    legend.append("g").call(d3.axisLeft(yScale))
      .call(legend => legend.select(".domain").remove())

  }

}()

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

//Find the device pixel ratio
function getPixelRatio(ctx) {
    //From https://www.html5rocks.com/en/tutorials/canvas/hidpi/
    let devicePixelRatio = window.devicePixelRatio || 1
    let backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1
    let ratio = devicePixelRatio / backingStoreRatio
    return ratio
}//function getPixelRatio