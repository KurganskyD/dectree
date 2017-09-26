function launch(treeData, targetElement, parWidth, parHeight) {
  console.log("launching dectree with parent dims", parWidth, parHeight);
  console.log(treeData);
  // COMPUTE TREE PROPERTIES: find max depth and compute counts and sars
  var compMaxDepth = function(node, parentDepth) {
    var myDepth = parentDepth + 1;
    var largestDepth = myDepth;
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        largestDepth = Math.max(largestDepth, compMaxDepth(node.children[i], myDepth));
      }
    }
    return largestDepth;
  }

  var maxDepth = compMaxDepth(treeData, 0);

  var addPropsUp = function(node, prop) {
    if (node.children) {
      node[prop] = 0;
      for (var i = 0; i < node.children.length; i++) {
        node[prop] += addPropsUp(node.children[i], prop);
      }
    }
    return node[prop];
  }

  addPropsUp(treeData, 'count');
  addPropsUp(treeData, 'sar');

  var compHomo = function(node) { // calculate if node homogeneous with respect to parameter in children branches
    if (node.children) {
      var firstPar = node.children[0].par;
      node.homo = true;
      for (var i = 0; i < node.children.length; i++) {
        if (node.children[i].par != firstPar) {
          node.homo = false;
        }
        compHomo(node.children[i]);
      }
    }
  };

  compHomo(treeData);

  var totalCount = treeData.count;

  // ************** Generate the tree diagram	 *****************
  var margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = parWidth - margin.right - margin.left,
    height = Math.min(parHeight, 800) - margin.top - margin.bottom;
    
  console.log("dimensions computed as", width, height);
    
  var i = 0,
    duration = 750,
    root;

  var tree = d3.layout.tree()
    .size([height, width]);

  // var diagonal = d3.svg.diagonal()
  //	.projection(function(d) { return [d.x, d.y]; });

   
  var yFx = d3.scale.linear()
    .domain([0, maxDepth])
    .rangeRound([0, height]);
    
  var radius = d3.scale.pow()
    .exponent(2 / 3.0)
    .domain([0, maxDepth])
    .rangeRound([30, 15]);
    
  var linewidth = d3.scale.linear() //pow()
      // .exponent(0.5)
      .domain([0, totalCount])
      .range([1, 75]);

  var linkColor = d3.scale.linear()
    .domain([0,0.5])
    .interpolate(d3.interpolateLab)
    .range([d3.lab('rgb(234,232,226)'), d3.lab('rgb(150,140,109)')]);
    
  var activeLinkColor = d3.scale.linear()
    .domain([0,0.5])
    .interpolate(d3.interpolateLab)
    .range([d3.lab('rgb(255,225,197)'), d3.lab('rgb(163,32,32)')]);
    
  var nodeFlagColor = d3.scale.linear()
    .domain([0,1])
    .interpolate(d3.interpolateLab)
    .range([d3.lab('#f39c12'), d3.lab('#e0301e')]);

  var formatPercent = d3.format(".2p");

  
  var diagonal = function(d) {
    var x0 = d.source.x, y0 = yFx(d.source.depth),
        x1 = d.target.x, y1 = yFx(d.target.depth);
    if (x0 < x1) x0 += (linewidth(d.source.count) - linewidth(d.target.count)) / 2;
    else if (x0 > x1) x0 -= (linewidth(d.source.count) - linewidth(d.target.count)) / 2;
    return "M" + x0 + "," + y0
        + "C" + x0 + "," + (y0 + y1) / 2
        + "," + x1 + "," + (y0 + y1) / 2
        + "," + x1 + "," + y1;
  }
  
  d3.select("svg.decistree").remove();
  d3.select("div.tooltip-decistree").remove();
      
  // Define the div for the tooltip
  // var tip = d3.select(targetElement).append("div")
  var tip = d3.select(targetElement).append("div")
      .attr("class", "tooltip-decistree")
      .attr("right", margin.right)
      .attr("top", margin.top)
      .style("opacity", 0);
   
  // var svg = d3.select(targetElement).append("svg")
  var svg = d3.select(targetElement).append("svg")
    .classed("decistree", true)
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      
  var node, link;
    
  root = treeData;
  root.x0 = height / 2;
  root.y0 = 0;
    
  update(root);

  d3.select(self.frameElement).style("height", "500px");
  
  function addTextOver(nodeEnter) {
    return nodeEnter.append("text")
      .classed("textover", true)
      .attr("y", "-15px")//function(d) { return -(radius(d.depth) + 3); })
      .attr("dy", ".35em")
      .text(function(d) { return d.parent ? (d.parent.homo ? d.value : d.par + ": " + d.value) : ""; });
  }

  function addTextBelow(nodeEnter) {
    return nodeEnter.filter(function(d) {return d.homo;})
      .append("text")
      .classed("textbelow", true)
      .attr("y", "15px") //function(d) { return (radius(d.depth) + 3); })
      .attr("dy", ".35em")
      .text(function(d) {return d.children[0].par;});// + "?";});
  }

  function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);
    
    var minX = d3.min(nodes, function (d) {return d.x;}),
        maxX = d3.max(nodes, function (d) {return d.x;});
        
    var realWidth = maxX + minX; // leave the same amount of space right as left
    var addToX = Math.max(parseInt((tree.size()[1] - realWidth) / 2.0), 0);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
      d.x += addToX;
      d.y = yFx(d.depth);
    });

    // Update the nodes…
    node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
      .on("click", nodeClicked)
      .on('mouseover', mouseOverNode)
      .on('mouseout', mouseOutOfNode);
    
    nodeEnter.filter(function (d) {return d.children || d._children ? true : false;})
      .append("rect")
      .attr("width", function(d) {return linewidth(d.count);})
      .attr("height", 10)
      .classed("nonleaf", true)
      .attr("transform", function(d) {return "translate(-" + linewidth(d.count) / 2 + ", -5)"});

    // terminal nodes (leaves)
    nodeEnter.filter(function (d) {return d.children || d._children ? false : true;})
      .append("rect")
      .attr("height", 16)
      .attr("width", function(d) {return Math.max(linewidth(d.count), 8);})
      .attr("transform", function(d) {return "translate(-" + Math.max(linewidth(d.count), 8) / 2 + ",-8)";})
      .attr("fill", function(d) {return d.flag ? nodeFlagColor(d.sar / d.count) : "#40a102";});

      
      
    // label above: parameter value
    addTextOver(nodeEnter).classed('halo', true);
    addTextOver(nodeEnter);

    // label below: parameter name if homogeneous among children
    addTextBelow(nodeEnter).classed('halo', true);
    addTextBelow(nodeEnter);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      
    var nodeStart = node.filter(function (d) {return d.children ? true : false;})
      .selectAll("text.textbelow")
      .transition().duration(duration)
      .style("fill-opacity", 1).style("stroke-opacity", 1);

    var nodeEnd = node.filter(function (d) {return d._children ? true : false;})
      .selectAll("text.textbelow")
      .transition().duration(duration)
      .style("fill-opacity", 0).style("stroke-opacity", 0);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

    nodeExit.select("text")
      .style("fill-opacity", 1e-6);

    // Update the links…
    link = svg.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
      .attr("class", "link")
      .style("stroke", function(l) {return linkColor(l.target.sar / l.target.count);})
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      })
      .on('mouseover', mouseOverLink)
      .on('mouseout', mouseOutOfLink)
      .on('click', linkClicked);

    // Transition links to their new position.
    link.transition()
      .duration(duration)
      .attr("d", diagonal)
      .style("stroke-width", function(d) { return linewidth(d.target.count) + "px"; });

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
      var o = {x: source.x, y: source.y};
      return diagonal({source: o, target: o});
      })
      .remove();
    
    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Toggle node's children on click.
  function nodeClicked(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }
  
  function mouseOverNode(onnode) {
    var curNode = onnode;
    var activateNodes = [];
    var paramDecs = [];
    while (curNode != null) {
      activateNodes.push(curNode.id);
      if (curNode.par != null)
        paramDecs.push(curNode.par + ': ' + curNode.value);
      curNode = curNode.parent;
    }
    link.filter(function (l) {return activateNodes.indexOf(l.target.id) != -1;})
      .classed('active', true)
      .style('stroke', function(l) {return activeLinkColor(l.target.sar / l.target.count);});
    node.filter(function (n) {return activateNodes.indexOf(n.id) != -1;}).classed('active', true);
    tip.transition().duration(300).style("opacity", .9);
    var t = onnode;
    
    tip.html('<p class="popup-head">' + paramDecs.reverse().join('<br>') + '</p><p class="popup-body">' + t.count + ' transactions<br>' + t.sar + ' SAR (' + formatPercent(t.sar / t.count) + ')</p>');
  }

  function mouseOutOfNode(ofnode) {
    svg.selectAll('.link.active').style("stroke", function(l) {return linkColor(l.target.sar / l.target.count);});
    svg.selectAll('.active').classed('active', false);
    tip.transition().duration(300).style("opacity", 0);
  }

  function mouseOverLink(onlink) {
    mouseOverNode(onlink.target);
  }

  function mouseOutOfLink(onlink) {
    mouseOutOfNode(onlink.target);
  }

  function linkClicked(onlink) {
    
  }
}

HTMLWidgets.widget({

  name: 'DecTree',

  type: 'output',

  factory: function(el, width, height) {

    var treeData;

    return {

      renderValue: function(input) {
        treeData = JSON.parse(input.tree);
        launch(treeData, el, width, height);
      },

      resize: function(width, height) {
        launch(treeData, el, width, height);
      }
      
    };
  }
});