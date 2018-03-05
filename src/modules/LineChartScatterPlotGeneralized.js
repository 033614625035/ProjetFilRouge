import fillWithDefault from "./defaultOptions.js";

const defaultOptions = {
    opacity: 0.5,
    colorScatter: "orange",
    width: 800,
    height: 400
};

class LineChartScatterPlotGeneralized {
    constructor(id, data, cols, options = {}) {
        this.divHTML = document.querySelector("#" + id);
        this.div = d3.select("#" + id);
        this.data = data;
        let opts = fillWithDefault(options, defaultOptions, false);
        console.log(opts);
        this.opacity = opts.opacity;
        this.colorScatter = opts.colorScatter;
        this.margin = {top: 20, right: 50, bottom: 50, left: 50};
        this.width = opts.width - this.margin.left - this.margin.right;
        this.height = opts.height - this.margin.top - this.margin.bottom;

        this.step = 5;

        this.traits = cols;
        this.instanciateSupport();
        this.fillLCSP(this.data);
    }

    instanciateSupport() {
        console.log(this);

        this.container = this.div.append("div")
            .attr("class", "lcsp")
            .style("width", this.width + this.margin.left + this.margin.right + "px")
            .style("height", this.height + this.margin.top + this.margin.bottom + "px");


    }

    fillLCSP(data) {
        let width = this.width;
        let height = this.height;
        let margin = this.margin;
        let traits = this.traits;

        let zoom = d3.zoom()
            .scaleExtent([1, 64])
            .translateExtent([[0, 0], [width, height]])
            .extent([[0, 0], [width, height]])
            .on("zoom", zoomed);

        // parse the date / time
        let parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
        let formatTime = d3.timeFormat("%H:%M:%S");

        for (let d of data) {
            d["date_time"] = parseTime(d["date_time"]);
        }

        // set the ranges
        let x = d3.scaleLinear().range([0, width]);
        let yLeft = d3.scaleLinear().range([height, 0]);
        let yRight = d3.scaleLinear().range([height, 0]);

        this.x = x;

        // GRIDS
        // gridlines in x axis function
        function make_x_gridlines(x0) {
            return d3.axisBottom(x0)
                .ticks(5)
        }

        // gridlines in y axis function
        function make_y_gridlines(y0) {
            return d3.axisLeft(y0)
                .ticks(5)
        }

        // LINE CHART
        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin

        let svg = this.container.append("svg")
            .attr("class", "svgTemp")
            .attr("id", "svgG")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        svg.append("defs").append("clipPath")
            .attr("id", "clipG")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        let contextBack = svg.append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        let context = svg.append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        svg.call(zoom).transition()
            .duration(1500);

        // format the data
        data.forEach(function (dd) {
            dd.data.forEach(function (d) {
                d[traits[0]] = +d[traits[0]];
                d[traits[1]] = +d[traits[1]];
            });
        });


        // LINE CHART
        // Scale the range of the data

        x.domain([
            d3.min(data, function (f) {
                return d3.min(f.data, function (d) {
                    return d.flight_time;
                });
            }),
            d3.max(data, function (f) {
                return d3.max(f.data, function (d) {
                    return d.flight_time;
                });
            })
        ]);

        yLeft.domain([
            d3.min(data, function (f) {
                return d3.min(f.data, function (d) {
                    return d[traits[0]];
                });
            }),
            d3.max(data, function (f) {
                return d3.max(f.data, function (d) {
                    return d[traits[0]];
                });
            })
        ]);

        yRight.domain([
            d3.min(data, function (f) {
                return d3.min(f.data, function (d) {
                    return d[traits[1]];
                });
            }),
            d3.max(data, function (f) {
                return d3.max(f.data, function (d) {
                    return d[traits[1]];
                });
            })
        ]);


        // define the 1st line
        let valueline = d3.line()
            .x(function (d) {
                return x(d["flight_time"]);
            })
            .y(function (d) {
                return yLeft(d[traits[0]]);
            });

        // define the 2nd line
        let valueline2 = d3.line()
            .x(function (d) {
                return x(d["flight_time"]);
            })
            .y(function (d) {
                return yRight(d[traits[1]]);
            });


        let line1 = context.append("g")
            .attr("class", "flightsLeft")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d", function (d) {
                d.line1 = this;
                return valueline(d.data);
            })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        let line2 = context.append("g")
            .attr("class", "flightsRight")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d", function (d) {
                d.line2 = this;
                return valueline2(d.data);
            })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);


        function mouseover(d) {
            d3.select(d.line1).classed("overFlight", true);
            d3.select(d.line2).classed("overFlight", true);
            d3.select(d.legend).classed("overLegend", true);
            d.line1.parentNode.appendChild(d.line1);
            d.line2.parentNode.appendChild(d.line2);
        }

        function mouseout(d) {
            d3.select(d.line1).classed("overFlight", false);
            d3.select(d.line2).classed("overFlight", false);
            d3.select(d.legend).classed("overLegend", false);
        }
        
        context.selectAll("text")
            .data(data)
            .enter().append("text")
            .attr("class", "textLegend")
            .attr("x", 10)
            .attr("y", function (d, i) {
                return height + 50 + i * 15;
            })
            .text(function (d) {
                d.legend = this;
                return d.data[0].idxFile;
            })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        // let xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%H:%M:%S"))
        let xAxis = d3.axisBottom(x).ticks(5);

        // Add the X Axis
        let svgXAxis = context.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // text label for the x axis
        context.append("text")
            .attr("transform",
                "translate(" + (width / 2) + " ," +
                (height + margin.top + 20) + ")")
            .style("text-anchor", "middle")
            .text("flight_time");

        // Add the Y Axis
        context.append("g")
            .attr("class", "firstAxis")
            .call(d3.axisLeft(yLeft));

        // Add the Y Axis to the right
        context.append("g")
            .attr("transform", "translate( " + width + ", 0 )")
            .attr("class", "secondAxis")
            .call(d3.axisRight(yRight));


        // text label for the y axis
        context.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("class", "firstLabel")
            .text(traits[0]);

        context.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", width + margin.right / 2 + 5)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("class", "secondLabel")
            .text(traits[1]);

        let xt = x;

        function zoomed() {
            let t = d3.event.transform;
            xt = t.rescaleX(x);

            valueline.x(function (d) {
                return xt(d["flight_time"]);
            });

            line1.attr("d", function (d) {
                d.line = this;
                return valueline(d.data);
            });

            valueline2.x(function (d) {
                return xt(d["flight_time"]);
            });

            line2.attr("d", function (d) {
                d.line = this;
                return valueline2(d.data);
            });
            svgXAxis.call(xAxis.scale(xt));
        }

    }

}

export default LineChartScatterPlotGeneralized;