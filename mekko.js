define(['jquery', 'qlik','./mekko-properties', './d3.min', './colorbrewer', 'css!./style.css'], function($, qlik, properties, d3) {
	return {
		type: "visualization",
		definition: properties,
		initialProperties: {
			qHyperCubeDef: {
				qDimensions: [],
				qMeasures: [],
				qInitialDataFetch: [{
					qWidth: 3,
					qHeight: 3000
				}]
			}
		},
		snapshot: {
			canTakeSnapshot: true
		},
		paint: function($element, layout) {

			$element.empty();

			var width = $element.width();
			var height = $element.height();
			var margin = 30;
			var color = d3.scale.ordinal().range(colorbrewer.Set2[8]);
			var n = d3.format(",d");
			var p = d3.format("%");

			var data = [];
			layout.qHyperCube.qDataPages[0].qMatrix.map(function(row) {
				data.push({
					'firstDimension': row[0].qText,
					'secondDimension': row[1].qText,
					'value': row[2].qNum
				})
			})

			var nest = d3.nest()
				.key(function(d) {
					return d.secondDimension;
				})
				.key(function(d) {
					return d.firstDimension;
				});

			var treemap = d3.layout.treemap()
				.mode("slice-dice")
				//.padding(function(d) { return d.depth > 1 ? 2 : 0; })
				.size([width - 3 * margin, height - 2 * margin])
				.children(function(d) { return d.values; })
				.sort(null);

			var svg = d3.select($element[0]).append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(" + 2 * margin + "," + margin + ")")
				.datum({ values: nest.entries(data) })
				.call(chart);

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + treemap.size()[1] + ")")
				.call(d3.svg.axis().scale(d3.scale.linear().range([0, treemap.size()[0]])).tickFormat(d3.format("%")));

			svg.append("g")
				.attr("class", "y axis")
				.call(d3.svg.axis().scale(d3.scale.linear().range([treemap.size()[1], 0])).tickFormat(d3.format("%")).orient("left"));

			function chart(selection) {
				selection.each(function() {
					var cell = d3.select(this).selectAll("g.cell").data(treemap.nodes);
					var cellEnter = cell.enter().append("g").attr("class", "cell");
					var cellUpdate = d3.transition(cell)
						.attr("transform", function(d) {
							return "translate(" + d.x + "," + d.y + ")";
						});
					d3.transition(cell.exit()).remove();

					cellEnter.filter(function(d) {
						return d.depth > 2;
					}).append("rect")
						.style("fill", function(d) {
							return d.children ? null : color(d.secondDimension);
						});
					cellUpdate.select("rect")
						.attr("width", function(d) {
							return d.dx;
						})
						.attr("height", function(d) {
							return d.dy;
						})

					cellEnter.append("title")
						.text(function(d) {
							return d.children ? null : title(d);
						});
				});
			}

			function title(d) {
				return d.secondDimension + ": " + d.parent.key + ": " + n(d.value);
			};

		}
	};
});
