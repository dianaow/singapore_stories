var DEFAULT_OPTIONS = {
    radius: 20
};

function getOptionOrDefault(key, options, defaultOptions) {
    defaultOptions = defaultOptions || DEFAULT_OPTIONS;
    if (options && key in options) {
        return options[key];
    }
    return defaultOptions[key];
}

function drawPieChart(nodeElement, percentages, options) {
    var radius = getOptionOrDefault('radius', options);
    var halfRadius = radius / 2;
    var halfCircumference = 2 * Math.PI * halfRadius;

    var percentToDraw = 100;
    for (var p in percentages) {
        nodeElement.insert('circle')
            .attr("r", halfRadius)
            .attr("fill", 'transparent')
            .style('stroke', percentages[p].group)
            .style('stroke-width', radius)
            .style('stroke-dasharray',
                    halfCircumference * percentToDraw / 100
                    + ' '
                    + halfCircumference);
        percentToDraw -= percentages[p].percent;
    }
}

 NodePieBuilder = {
    drawNodePie: function (nodeElement, percentages, options) {

        if (!percentages) return;
        drawPieChart(nodeElement, percentages, options);

    }
};