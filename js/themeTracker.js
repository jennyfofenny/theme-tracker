"use strict";
(function(themeTracker, $) {
	const popularityRankingsKey = "colorRankings",
		  uniqueColorListKey = "colorList";

    function getUniqueThemeString(colorList) {
        var newColorList = [];
        $.each(colorList, function(key, val) {
            newColorList.push(val.toLowerCase());
        });
        return newColorList.join(",");
    }

    function updatePopularityRankingForCombo(colorList, popularityRankingsJson) {
        var uniqueThemeCombo = getUniqueThemeString(colorList);
        var itemFound = false;
        $.each(popularityRankingsJson, function(key, val) {
            if (val.themeName === uniqueThemeCombo) {
                val.timesSelected++;
                itemFound = true;
                return;
            }
        });

        if (!itemFound) {
            popularityRankingsJson.push({
                themeName: uniqueThemeCombo,
                timesSelected: 1
            });
        }
    }

    function getReadableComboList(comboListString) {
        var comboList = comboListString.split(",");
        var readableString = "";
        $.each(comboList, function(key, val) {
            if (key === 0) {
                readableString += val;
            } else if (key + 1 === comboList.length) {
                readableString += " and " + val;
            } else {
                readableString += ", " + val;
            }
        });

        return readableString;
    }

    function calculatePopularityRankings(themeJson) {
        var popularityRankingsJson = [];

        $.each(themeJson, function(key, val) {
            updatePopularityRankingForCombo(val.colors, popularityRankingsJson);
        });

        popularityRankingsJson.sort(function(a, b) {
            return parseInt(b.timesSelected) - parseInt(a.timesSelected);
        });

        return popularityRankingsJson;
    }

    function updatePopularityRankingGraph(top20) {
        var w = 1140;
        var h = 400;
        var listSize = top20.length;
        var barPadding = 2;
        var minHeight = 18;
        var yScale = d3.scale.linear()
            .range([h, 0])
            .domain([0, d3.max(top20, function(d) { return d.timesSelected; })]);

        var svg = d3.select("#popularityGraph")
            .append("svg")
            .attr("width", w)
            .attr("height", h + minHeight*2);

        var tip = d3.tip()
            .attr("class", "d3-tip")
            .offset(function(d) { return [ h - yScale(d.timesSelected) + minHeight*3.5, 0] })
            .html(function(d) {
                return "<strong class=\"color-combo\">" + getReadableComboList(d.themeName) +
					"</strong>";
            });

        svg.call(tip);
        svg.selectAll("rect")
            .data(top20)
            .enter()
            .append("rect")
            .attr("x", function(d, i) {
                return i * (w / listSize);
            })
            .attr("y", function(d) {
                return yScale(d.timesSelected) + minHeight;
            })
            .attr("width", w / listSize - barPadding)
            .attr("height", function(d) {
                return d.timesSelected + minHeight;
            })
            .on("mouseover", tip.show)
            .on("mouseout", tip.hide);

        svg.selectAll("text")
            .data(top20)
            .enter()
            .append("text")
            .text(function(d) {
                return d.timesSelected;
            })
            .attr("text-anchor", "middle")
            .attr("x", function(d, i) {
                return i * (w / listSize) + (w / listSize - barPadding) / 2;
            })
            .attr("y", function(d) {
                return yScale(d.timesSelected) + minHeight - 5;
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
    }

    function updatePopularityInformation(popularityRankings) {
        var top20 = popularityRankings;
        if (popularityRankings.length > 20) {
            top20 = popularityRankings.slice(0, 20);
        }

        updatePopularityRankingGraph(top20);
    }

	function addUniqueColorsToList(colorList, colorListJson) {
		$.each(colorList, function(key, val) {
	        if ($.inArray(val, colorListJson) === -1) {
				colorListJson.push(val);
			}
		});
	}
	
	function getUniqueColors(themeList) {
        var colorListJson = [];

        $.each(themeList, function(key, val) {
			addUniqueColorsToList(val.colors, colorListJson);
        });

        return colorListJson.sort();
	}
	
	function updateUniqueColorList(colorList) {
        var $uniqueColorsTable = $("#uniqueColors");
        for (var i = 0; i < colorList.length; i++) {
            $uniqueColorsTable.append("<div class=\"col-md-4\">" + 
				"<div class=\"color-container\">" + 
				"<span class=\"color-sample\" style=\"background-color:" + 
				colorList[i] + "\"></span>" + colorList[i] + "</div></div>");
        }
	}
	
    function getAndUpdatePopularityRankings() {
        $.getJSON("data/themes.json", function(data) {
            var popularityRankings = calculatePopularityRankings(data);
            if (!popularityRankings)
                return;

            localStorage.setItem(popularityRankingsKey, JSON.stringify(popularityRankings));
            updatePopularityInformation(popularityRankings);

			var colorList = getUniqueColors(data);
            localStorage.setItem(uniqueColorListKey, JSON.stringify(colorList));
			updateUniqueColorList(colorList);
        });
    }

    function loadPopularityRankings() {
        var popularityRankings = localStorage.getItem(popularityRankingsKey);
		var uniqueColorList = localStorage.getItem(uniqueColorListKey);
        if (popularityRankings && uniqueColorList) {
            updatePopularityInformation(JSON.parse(popularityRankings));
			updateUniqueColorList(JSON.parse(uniqueColorList));
        } else {
            getAndUpdatePopularityRankings();
        }
    }

    themeTracker.init = function() {
        loadPopularityRankings();
    };
}(window.themeTracker = window.themeTracker || {}, jQuery));