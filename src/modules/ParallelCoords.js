import fillWithDefault from "./defaultOptions.js";

const defaultOptions = {
    progRendering: false,
    canvasRendering: false,
    filterAxis: true,
    swapAxis: false,
    opacity: 0.5,
    colorAxis: "oat",
    width: 1000,
    height: 300,
    lineWidth: 1.5
};


class ParallelCoords {
    constructor(id, data, options = {}) {
        this.id = id;
        this.div = d3.select("#" + id);
        this.data = data;
        this.selected = data;
        // this.dimensions = dimensions;
        let opts = fillWithDefault(options, defaultOptions, true);
        this.progRendering = opts.progRendering;
        this.canvasRendering = opts.canvasRendering;
        this.filterAxis = opts.filterAxis;
        this.swapAxis = opts.swapAxis;
        this.opacity = opts.opacity;
        this.colorAxis = opts.colorAxis;
        this.margin = {top: 50, right: 100, bottom: 20, left: 100};
        this.width = opts.width - this.margin.left - this.margin.right;
        this.height = opts.height - this.margin.top - this.margin.bottom;
        this.innerHeight = this.height - 2;
        this.actives = [];
        this.lineWidth = opts.lineWidth;
        this.instantiateSupport();
    }

    get neighboorSc() {
        return this._neighboorSc;
    }

    set neighboorSc(value) {
        this._neighboorSc = value;
    }

    instantiateSupport() {

        let that = this;
        let id = this.id;
        let devicePixelRatio = window.devicePixelRatio || 1;
        // let dimensions = this.dimensions;
        let width = this.width;
        let height = this.height;
        let margin = this.margin;

        let innerHeight = this.innerHeight;

        let data = this.data;
        data = d3.shuffle(data);
        that.selectedSelf = data.slice(0);
        that.selectedExt = data.slice(0);

        let parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
        let formatTime = d3.timeFormat("%H:%M:%S");

        const types = {
            "Number": {
                key: "Number",
                coerce: function (d) {
                    return +d;
                },
                extent: d3.extent,
                within: function (d, extent, dim) {
                    return extent[0] <= dim.scale(d) && dim.scale(d) <= extent[1];
                },
                defaultScale: d3.scaleLinear().range([innerHeight, 0])
            },
            "String": {
                key: "String",
                coerce: String,
                extent: function (data) {
                    return data.sort();
                },
                within: function (d, extent, dim) {
                    return extent[0] <= dim.scale(d) && dim.scale(d) <= extent[1];
                },
                defaultScale: d3.scalePoint().range([0, innerHeight])
            },
            "Date": {
                key: "Date",
                coerce: function (d) {
                    return parseTime(d);
                    // return new Date(d);
                },
                extent: d3.extent,
                within: function (d, extent, dim) {
                    return extent[0] <= dim.scale(d) && dim.scale(d) <= extent[1];
                },
                defaultScale: d3.scaleTime().range([0, innerHeight])
            }
        };

        const dimensionsAll = [
            {
                key: "flight_time",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "date_time",
                type: types["Date"],
                axis: d3.axisLeft().tickFormat(function (d) {
                    return formatTime(d);
                })
            },
            {
                key: "take_off_switch",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "altitude",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "static_pressure",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "ground_speed",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "ind_air_speed",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "oat",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "n1_1",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "n2_1",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "nr",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "torque_1",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "tot_1",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "oil_pressure_1",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "oil_temp_1",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "fuel_flow",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "fuel_vol",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "power",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "phase_no",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            }
        ];

        let dispKeys = [];
        for (let k in data[0]) {
            if (data[0].hasOwnProperty(k)) {
                dispKeys.push(k);
            }
        }

        let dimensions = [];
        for (let dim of dimensionsAll) {
            if (dispKeys.includes(dim.key)) {
                dimensions.push(dim);
            }
        }

        this.dimensions = dimensions;

        this.container = this.div.append("div")
            .attr("class", "parcoords")
            .style("width", width + margin.left + margin.right + "px")
            .style("height", height + margin.top + margin.bottom + "px");

        this.svg = this.container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        this.canvas = this.container.append("canvas")
            .attr("width", width * devicePixelRatio)
            .attr("height", height * devicePixelRatio)
            .style("width", 2 * width + "px")
            .style("height", 2 * height + "px")
            .style("margin-top", margin.top + "px")
            .style("margin-left", margin.left + "px")
            .style("transform-origin", "0 0")
            .style("transform", "scale(0.5, 0.5)");

        let svg = this.svg;
        let canvas = this.canvas;
        let container = this.container;
        let dragging = {};
        this.dragging = dragging;



        // let ctx = this.canvas.node().getContext("2d");
        // ctx.globalCompositeOperation = 'darken';
        // ctx.globalAlpha = this.opacity;
        // ctx.lineWidth = this.lineWidth;
        // ctx.scale(devicePixelRatio, devicePixelRatio);

        let ctx = canvas.node().getContext("2d");
        // ctx.globalCompositeOperation = 'source-over';
        ctx.globalCompositeOperation = 'darken';
        // ctx.globalAlpha = 1;
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = 1;
        ctx.scale(devicePixelRatio, devicePixelRatio);

        this.ctx = ctx;

        let xscale = d3.scalePoint()
            .domain(d3.range(dimensions.length))
            .range([0, width]);

        this.xscale = xscale;

        let yAxis = d3.axisLeft();

        let axes = svg.selectAll(".axis")
            .data(dimensions)
            .enter().append("g")
            .attr("class", function (d, i) {
                return "axis axis" + i + " " + d.key.replace(/ /g, "_");
            })
            .attr("transform", function (d, i) {
                return "translate(" + xscale(i) + ")";
            });

        data.forEach(function (d) {
            dimensions.forEach(function (p) {
                d[p.key] = d[p.key] === null ? null : p.type.coerce(d[p.key]);
            });

            // truncate long text strings to fit in data table
            for (let key in d) {
                if (d.hasOwnProperty(key)) {
                    if (d[key] && d[key].length > 35) d[key] = d[key].slice(0, 36);
                }
            }
        });

        let dimPos = {};


        this.dimPos = dimPos;

        ParallelCoords.updateDimPos(dimPos, dimensions, xscale);

        dimensions.sort(function (a, b) {
            return ParallelCoords.position(a.key, dragging, dimPos) - ParallelCoords.position(b.key, dragging, dimPos);
        });

        // type/dimension default setting happens here
        dimensions.forEach((dim) => {
            if (!("domain" in dim)) {
                // detect domain using dimension type's extent function
                dim.domain = this.d3_functor(dim.type.extent)(data.map(function (d) {
                    return d[dim.key];
                }));
            }
            if (!("scale" in dim)) {
                // use type's default scale for dimension
                dim.scale = dim.type.defaultScale.copy();
            }
            dim.scale.domain(dim.domain);
        });

        let color = d3.scaleLinear()
            .domain(d3.extent(data, function (d) {
                return d[that.colorAxis];
            }))
            .range(['mediumturquoise', 'hotpink'])
            .interpolate(d3.interpolateHcl);

        this.color = color;


        let render = renderQueue(draw).rate(150);
        ctx.clearRect(0, 0, width, height);
        // ctx.globalAlpha = 1;
        ctx.globalAlpha = d3.min([0.85 / Math.pow(data.length, 0.3), 1]);
        render(data);

        this.render = render;
        this.g = [];

        axes.append("g")
            .each(function (d, i) {
                let renderAxis = "axis" in d
                    ? d.axis.scale(d.scale)  // custom axis
                    : yAxis.scale(d.scale);  // default axis
                d3.select(this).call(renderAxis)
                    .on("click", (d) => {
                        if (that.neighboor) {
                            that.neighboor.colorByAxis(d, that.neighboor);
                        }
                        if (that._neighboorSc) {
                            that._neighboorSc.cAxis = d.key;
                        }
                        that.colorByAxis(d, that);
                    });
                that.g[i] = d3.select(this.parentNode).call(d3.drag()
                    .on("start", (d) => {
                        if (that.neighboor) {
                            that.neighboor.dragByAxisStart(d, that.neighboor);
                        }
                        that.dragByAxisStart(d, that);
                    })
                    .on("drag", (d) => {
                        if (that.neighboor) {
                            that.neighboor.dragByAxis(d, that.neighboor, i);
                        }
                        that.dragByAxis(d, that, i);
                    })
                    .on("end", (d) => {
                        if (that.neighboor) {
                            that.neighboor.dragByAxisEnd(d, that.neighboor);
                        }
                        that.dragByAxisEnd(d, that);
                    }));
            })
            .append("text")
            .attr("class", "title")
            .attr("text-anchor", "start")
            .text(function (d) {
                return "description" in d ? d.description : d.key;
            });


        console.log(d3.select(this));

        // let zoomY = d3.zoom()
            // .scaleExtent([1, 64]);

        let zoomsY = [];
        let brushes = [];

        let zooms_info = [];

        // Add and store a brush for each axis.
        axes.append("g")
            .attr("class", "brush")
            .each(function (d, i) {
                d3.select(this).call(d.brush = d3.brushY()
                    .extent([[-10, 0], [10, height]])
                    .on("start", brushstart)
                    .on("brush", brush)
                    .on("end", brush)
                );
                // d3.select(this).on("click", () => {
                //     d3.select(this).call(zoomsY[i].transform, d3.zoomIdentity);
                // });
                let zoom = d3.zoom()

                    // .scaleExtent([1, 64])
                    // .translateExtent([[0, 0], [width, height]])
                    // .extent([[0, 0], [width, height]])
                    .on("zoom", () => zoomed(d3.event, d, i));
                // let zoom = d3.zoom()
                //     .scaleExtent([1, 64])
                //     // .translateExtent([[0, 0], [width, height]])
                //     // .extent([[0, 0], [width, height]])
                //     .on("zoom", () => zoomed(d3.event, d, i));
                d3.select(this).call(zoom);
                zoomsY[i] = zoom;
                zooms_info[i] = {};
                zooms_info[i].k = 1;
                zooms_info[i].x = 0;
                zooms_info[i].y = 0;

                // zoomsY[i] = zoom;
                // brushes[i] = d3.select(this);
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);

        this.axes = axes;

        d3.selectAll("#" + that.id + " .axis." + that.colorAxis + " .tick text")
            .style("fill", color);

        // output.text(d3.tsvFormat(data.slice(0,24)));

        function project(d) {
            return dimensions.map(function (p, i) {
                // check if data element has property and contains a value
                if (
                    !(p.key in d) ||
                    d[p.key] === null
                ) {
                    return null;
                }

                return [xscale(i), p.scale(d[p.key])];
            });
        }

        function draw(d) {
            ctx.strokeStyle = color(d[that.colorAxis]);
            ctx.beginPath();
            let coords = project(d);
            coords.forEach(function (p, i) {
                // this tricky bit avoids rendering null values as 0
                if (p === null) {
                    // this bit renders horizontal lines on the previous/next
                    // dimensions, so that sandwiched null values are visible
                    if (i > 0) {
                        let prev = coords[i - 1];
                        if (prev !== null) {
                            ctx.moveTo(prev[0], prev[1]);
                            ctx.lineTo(prev[0] + 6, prev[1]);
                        }
                    }
                    if (i < coords.length - 1) {
                        let next = coords[i + 1];
                        if (next !== null) {
                            ctx.moveTo(next[0] - 6, next[1]);
                        }
                    }
                    return;
                }

                if (i === 0) {
                    ctx.moveTo(p[0], p[1]);
                    return;
                }

                ctx.lineTo(p[0], p[1]);
            });
            ctx.stroke();
        }

        function brushstart() {
            d3.event.sourceEvent.stopPropagation();
        }

        function brush() {


            let actives = [];
            svg.selectAll(".axis .brush")
                .filter(function (d) {
                    return d3.brushSelection(this);
                })
                .each(function (d) {
                    actives.push({
                        dimension: d,
                        extent: d3.brushSelection(this)
                    });
                });

            let selection = {};
            for (let sel of actives) {
                selection[sel.dimension.key] = [
                    sel.dimension.scale.invert(sel.extent[0]),
                    sel.dimension.scale.invert(sel.extent[1])
                ];
            }

            that.selection = selection;
            that.actives = actives;
            console.log(selection, actives);
            // that.showSelected(that, data, actives, true);
            that.drawSelected();
            if (that._neighboorSc) {
                that._neighboorSc.selectOnSP(selection);
            }
        }
        this.dimensions = dimensions;

        // function zoomed(e, d, index) {
        //     axes.selectAll("*").remove();
        //     zooms_info[index].k *= e.transform.k;
        //     zooms_info[index].x = e.transform.x;
        //     zooms_info[index].y = e.transform.y;
        //     // let renderAxis = "axis" in d
        //     //     ? d.axis.scale(d.scale)  // custom axis
        //     //     : yAxis.scale(d.scale);
        //     // TODO: update d.scale ?
        //     // axes
        //     //     .filter(function (d, i) { return i === index;})
        //     //     .call(renderAxis.scale(newScale));
        //     // axes.each(function (d, i) {
        //     //     let renderAxis = "axis" in d
        //     //         ? d.axis.scale(d.scale)  // custom axis
        //     //         : yAxis.scale(d.scale);
        //     //     let sc = i === index ? e.transform.rescaleY(d.scale) : d.scale;
        //     //     d3.select(this).call(renderAxis.scale(sc))
        //     // });
        //
        //     axes.selectAll("*").remove();
        //
        //     axes.append("g")
        //         .each(function (d, i) {
        //             let renderAxis = "axis" in d
        //                 ? d.axis.scale(d.scale)  // custom axis
        //                 : yAxis.scale(d.scale);
        //             if (i === index) {
        //                 d.scale = e.transform.rescaleY(d.scale);
        //             }
        //             d3.select(this).call(renderAxis.scale(d.scale))
        //                 .on("click", (d) => {
        //                     if (that.neighboor) {
        //                         that.neighboor.colorByAxis(d, that.neighboor);
        //                     }
        //                     if (that._neighboorSc) {
        //                         that._neighboorSc.cAxis = d.key;
        //                     }
        //                     that.colorByAxis(d, that);
        //                 });
        //             that.g[i] = d3.select(this.parentNode).call(d3.drag()
        //                 .on("start", (d) => {
        //                     if (that.neighboor) {
        //                         that.neighboor.dragByAxisStart(d, that.neighboor);
        //                     }
        //                     that.dragByAxisStart(d, that);
        //                 })
        //                 .on("drag", (d) => {
        //                     if (that.neighboor) {
        //                         that.neighboor.dragByAxis(d, that.neighboor, i);
        //                     }
        //                     that.dragByAxis(d, that, i);
        //                 })
        //                 .on("end", (d) => {
        //                     if (that.neighboor) {
        //                         that.neighboor.dragByAxisEnd(d, that.neighboor);
        //                     }
        //                     that.dragByAxisEnd(d, that);
        //                 }));
        //         })
        //         .append("text")
        //         .attr("class", "title")
        //         .attr("text-anchor", "start")
        //         .text(function (d) {
        //             return "description" in d ? d.description : d.key;
        //         });
        //
        //
        //     // Add and store a brush for each axis.
        //     axes.append("g")
        //         .attr("class", "brush")
        //         .each(function (d, i) {
        //             d3.select(this).call(d.brush = d3.brushY()
        //                 .extent([[-10, 0], [10, height]])
        //                 .on("start", brushstart)
        //                 .on("brush", brush)
        //                 .on("end", brush)
        //             );
        //             // d3.select(this).on("click", () => {
        //             //     d3.select(this).call(zoomsY[i].transform, d3.zoomIdentity);
        //             // });
        //             let zoom = d3.zoom()
        //                 .on("zoom", () => zoomed(d3.event, d, i));
        //             // let zoom = d3.zoom()
        //             //     .scaleExtent([1, 64])
        //             //     // .translateExtent([[0, 0], [width, height]])
        //             //     // .extent([[0, 0], [width, height]])
        //             //     .on("zoom", () => zoomed(d3.event, d, i));
        //             d3.select(this).call(zoom);
        //             // d3.select(this).call(d.brush = d3.brushY()
        //             //     .extent([[-10, 0], [10, height]])
        //             //     .on("start", brushstart)
        //             //     .on("brush", brush)
        //             //     .on("end", brush)
        //             // );
        //             // d3.select(this).call(d3.zoom()
        //             // .scaleExtent([1 / zooms_info[i].k, 64])
        //             // .translateExtent([[Math.min(zooms_info[i].x, 0), Math.min(zooms_info[i].y, 0)], [width, height]])
        //             //     .on("zoom", () => zoomed(d3.event, d, i)))
        //
        //         })
        //         .selectAll("rect")
        //         .attr("x", -8)
        //         .attr("width", 16);
        //
        //     // axes.each(function (d, i) {
        //     //     console.warn(brushes[i])
        //     //     d3.select(this).append(brushes[i]);
        //     // });
        //
        //     that.render.invalidate();
        //
        //
        //     that.ctx.clearRect(0, 0, that.width, that.height);
        //     that.render(that.data);
        //
        //     // this.axes = axes;
        //     // d3.select(".axis"+index).call(renderAxis.scale(newScale));
        //
        // }
    }

    drawSelected() {
        this.render.invalidate();

        let spSelect = !!(this._neighboorSc
            && this._neighboorSc.rectangle.length
            && !(!this._neighboorSc.rectangle[0].extent[0]
                && !this._neighboorSc.rectangle[0].extent[1]
                && !this._neighboorSc.rectangle[1].extent[0]
                && !this._neighboorSc.rectangle[1].extent[1])
        ) ? this.isInRectangleSp : (d, rect) => true;

        let pcSelect = this.actives.length ? this.isInSelectionPc : (d, actives) => true;

        let rect;
        if (this._neighboorSc) {
            rect = this._neighboorSc.rectangle;
        }
        let actives = this.actives;
        let selected = this.data.filter(d => {
            return spSelect(d, rect) && pcSelect(d, actives);
        });

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.globalAlpha = d3.min([0.85 / Math.pow(selected.length, 0.3), 1]);
        this.render(selected);
    }

    d3_functor(v) {
        return typeof v === "function" ? v : function () {
            return v;
        };
    }

    colorByAxis(d, that) {
        console.log(d);
        that.ctx.clearRect(0, 0, that.width, that.height);
        that.colorAxis = d.key;
        that.color.domain(d3.extent(that.data, function (d) {
            return d[that.colorAxis];
        }));
        d3.selectAll("#" + that.id + " .axis .tick text")
            .style("fill", "black");
        d3.selectAll("#" + that.id + " .axis." + that.colorAxis + " .tick text")
            .style("fill", that.color);
        that.render.invalidate();
        that.render(that.selected);
    }

    dragByAxisStart(d, that) {
        that.render.invalidate();
        that.ctx.clearRect(0, 0, that.width, that.height);
        that.dragging[d.key] = ParallelCoords.position(d.key, that.dragging, that.dimPos);
    }

    dragByAxis(d, that, i) {
        let xt = d3.event.x;
        if (xt < 0) {
            xt = -1;
        } else if (xt > that.width) {
            xt = width + 1;
        }
        that.dragging[d.key] = xt;

        that.dimensions.sort(function (a, b) {
            return ParallelCoords.position(a.key, that.dragging, that.dimPos) - ParallelCoords.position(b.key, that.dragging, that.dimPos);
        });
        ParallelCoords.updateDimPos(that.dimPos, that.dimensions, that.xscale);
        that.g[i].attr("transform", function (d) {
            return "translate(" + xt + ")";
        })
    }

    dragByAxisEnd(d, that) {
        delete that.dragging[d.key];
        that.axes.attr("transform", function (d) {
            let displacement = that.dimPos[d.key];
            return "translate(" + displacement + ")";
        });
        that.render(that.selected);
    }

    static position(k, dragging, dimPos) {
        let v = dragging[k];
        return v == null ? dimPos[k] : v;
    }

    static updateDimPos(dimPos, dimensions, xscale) {
        dimensions.forEach(function (d, i) {
            dimPos[d.key] = xscale(i);
        });
    }

    static objectsEquals(obj1, obj2) {
        let val = true;
        for (let prop in obj1) {
            if(obj1.hasOwnProperty(prop)) {
                val = val && obj1[prop] === obj2[prop];
            }
        }
        return val;
    }

    isInRectangleSp(d, rect) {
        let val = true;
        for (let dim of rect) {
            val = val && (d[dim.key] >= dim.extent[0] && d[dim.key] <= dim.extent[1]);
        }
        return val;
    }

    isInSelectionPc(d, actives) {
        if (actives.every(function (active) {
                let dim = active.dimension;
                // test if point is within extents for each active brush
                return dim.type.within(d[dim.key], active.extent, dim);
            })) {
            return true;
        }
    }
}

export default ParallelCoords;