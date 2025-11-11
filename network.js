
function simulate(data,svg, tooltip)
{
    const width = parseInt(svg.attr("viewBox").split(' ')[2])
    const height = parseInt(svg.attr("viewBox").split(' ')[3])
    const main_group = svg.append("g")
        .attr("transform", "translate(0, 50)")


    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        //.scaleExtent([1, 8])
        .on("zoom", zoomed));
    function zoomed({transform}) {
        main_group.attr("transform", transform);
    }


    //calculate degree of the nodes:
    let node_degree={}; //initiate an object
    d3.map(data.links, (d)=>{
        if(d.source in node_degree)
        {
            node_degree[d.source]++
        }
        else{
            node_degree[d.source]=0
        }
        if(d.target in node_degree)
        {
            node_degree[d.target]++
        }
        else{
            node_degree[d.target]=0
        }
    })

    const scale_radius = d3.scaleSqrt()
        .domain(d3.extent(Object.values(node_degree)))
        .range([3,12])
    
    const colors = d3.schemeCategory10.slice()
    colors[7] = "#222222"; // replace light gray with dark gray color
    const color = d3.scaleOrdinal(colors);

    // top 10 countries obtained from my data_cleaning.ipynb document
    let top_10_countries = ['United States', 'Germany', 'China', 'United Kingdom', 'South Korea', 'Brazil', 'Japan', 'Canada', 'Russian Federation', 'Spain']

    
    const link_elements = main_group.append("g")
        .attr('transform',`translate(${width/2},${height/2})`)
        .selectAll(".line")
        .data(data.links)
        .enter()
        .append("line")
    

    const node_elements = main_group.append("g")
        .attr('transform', `translate(${width/2},${height/2})`)
        .selectAll(".circle")
        .data(data.nodes)
        .enter()
        .append('g')
        .attr("class", "circle")                 
        .attr("data-country", d => d.Country) // store country string in attribute
    .on("mouseover", function(event, d){
      // mark everything inactive
      node_elements.classed("inactive", true);

      // enable only nodes with the same data-country value
      d3.selectAll(`[data-country="${d.Country}"]`)
        .classed("inactive", false);
    })
    .on("mouseout", function(){
        node_elements.classed("inactive", false); // set all nodes to active
        tooltip.transition()
            .style("display", "none")
    })
    .on("click", function(m, d) {

        // show tooltip with author name along with country
        tooltip.transition()
            .duration(200)
            .style("opacity", .9)
        tooltip.html(
            "<strong>Author: </strong> "+ d.Name + "<br>" +
            "<strong>Country: </strong>"+ d.Country
            )
            .style("left", (m.pageX + 40) + "px")
            .style("top", (m.pageY - 20) + "px");
        tooltip.style("display", "block")
    })
    

    
    node_elements.append("circle")
        .attr("r",  (d)=>{
            return scale_radius(node_degree[d.id])
        })
        .attr("fill",  d=> {
            if(top_10_countries.includes(d.Country)) {
                return color(d.Country)
            }
            else {
                return "#A9A9A9" // default color for non top-10
            }
        })
    

    let ForceSimulation = d3.forceSimulation(data.nodes)
        .force("collide",
            d3.forceCollide().radius((d,i)=>{
                return scale_radius(node_degree[d.id])*4}))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("charge", d3.forceManyBody())
        .force("link",d3.forceLink(data.links)
            .id(d=>d.id)

        )
        .on("tick", ticked);

    function ticked()
    {
        node_elements
            .attr('transform', (d)=>`translate(${d.x},${d.y})`)
        link_elements
            .attr("x1",d=>d.source.x)
            .attr("x2",d=>d.target.x)
            .attr("y1",d=>d.source.y)
            .attr("y2",d=>d.target.y)
    }

    // return necessary variables for updating the sim
    return [ForceSimulation, scale_radius, node_degree]

    
}