//= require underscore
//= require d3/d3.v3
//= require experiment/force_extension
//= require experiment/segmented_control
//= require experiment/tooltip
//= require experiment/circles
//= require experiment/table
//= require experiment/layers
//= require experiment/legend
//= require foundation

$(function(){

    $(document).foundation();

    var formatCHF = d3.format(',.2f');

    function formatMioCHF(n) {
        return formatCHF(n / Math.pow(10, 6));
    }

    // ToDo: move to meta or auto detect
    var types = {
            'budgets': {
                format: formatMioCHF,
                suffix: 'Mio. CHF'
            },
            'positions': {
                format: d3.format(',.1f'),
                suffix: 'Vollzeitstellen'
            }
        },
        legendData = {
            'budgets': [
                {value: 50000000, name: '50 Mio.', color:'gray'},
                {value: 10000000, name: '10 Mio.', color:'gray'},
                {value: 1000000, name: '1 Mio.', color:'gray'}
            ],
            'positions': [
                {value: 100, name: '100 Stellen', color:'gray'},
                {value: 10, name: '10 Stellen', color:'gray'},
                {value: 1, name: '1 Stellen', color:'gray'}
            ]
        };

    $('.segmented-control').segmentedControl();

    var layers = OpenBudget.layers(),
        nodes = [],
        levels = [];

    var width,
        height;

    var radius = d3.scale.sqrt(),
        color = d3.scale.category10().domain(d3.range(10));

    var force = d3.layout.force()
        .gravity(0)
        .charge(0)
        .on("tick", function(e) {
            var cluster = forceExt.cluster(10 * e.alpha * e.alpha),
                collide = forceExt.collide(0.5);

            cutsCircles.tick(cluster, collide);
        });

    var forceExt = d3.layout.forceExtension()
        .radius(radius);

    var cutsCircles = OpenBudget.circles({
            forceLayout: force,
            detailCallback: showDetail
        })
        .colorScale(color);

    var table = OpenBudget.table({
            detailCallback: showDetail
        })
        .types(types)
        .colorScale(color);

    var tooltip = OpenBudget.tooltip()
        .types(types);

    var legend = OpenBudget.legend();

    var svg = d3.select("svg.main");

    var legendG = svg.append("g");

    var mainG = svg.append("g")
        .classed('main', 1);

    // controls for level, year and data
    var $levelControl = $('.segmented-control.levels'),
        activeDepth = parseInt($levelControl.segmentedControl('val'), 10);
    $levelControl.change(function() {
        activeDepth = parseInt($levelControl.segmentedControl('val'), 10);
        updateVis();
    });

    var $yearControl = $('.segmented-control.year'),
        activeYear = $yearControl.segmentedControl('val');
    $yearControl.change(function() {
        activeYear = $yearControl.segmentedControl('val');
        updateVis();
    });

    var $typeControl = $('.segmented-control.type'),
        activeType = $typeControl.segmentedControl('val');
    $typeControl.change(function() {
        activeType = $typeControl.segmentedControl('val');
        updateVis();
    });

    var $dataControl = $('.segmented-control.data');
    $dataControl.find('a:first').addClass('active');
    $dataControl.change(function() {
        d3.json($(this).segmentedControl('val'), function(data) {
            setup({"children": data});

            updateVis();
        });
    }).change();

    function showDetail(d) {
        if(d.detail) {
            $('#detail-modal').foundation('reveal', 'open', {
                url: '/be-asp/d/'+d.id
            });
        }
        else if(d.depth !== 1) {
            $('#no-detail-modal').foundation('reveal', 'open');
        }
    }

    function resize() {
        width = $(window).width();
        height = Math.max($(window).height() / 100 * 75, 520);

        svg.style('width', Math.round(width) + 'px');
        svg.style('height', Math.round(height) + 'px');

        var radiusHeight = height;
        if(width < 768) {
            radiusHeight -= 200;
        }

        radius.range([0, radiusHeight/8]);

        force
            .size([width, height]);
        forceExt
            .size([width, height]);

        legend
            .height(height);

        // will lead to fatal error otherwise
        if(nodes.length) {
            force.start();

            updateRadius();
        }
    }
    $(window).resize(_.debounce(resize, 166)); // 166 = 5 * 33.3 = every 5th frame

    // called after new data is loaded
    function setup(data) {
        var all = layers(data);
        levels = [
            all.filter(function(d) { return d.depth === 1; }),
            all.filter(function(d) { return d.depth === 2; })
        ];

        // cluster legend
        d3.select('.legend').selectAll('li').remove();
        var lis = d3.select('.legend').selectAll('li')
            .data(levels[0]);

        lis.enter().append('li');

        lis.html(function(d) { return '<span class="circle"></span>' + d.name; });
        lis.select('span')
            .style('border-color', function(d) {
                return color(d.id);
            })
            .style('background-color', function(d) {
                var rgb = d3.rgb(color(d.id));
                return 'rgba('+rgb.r+','+rgb.g+','+rgb.b+',0.1)';
            });

        // var maxCluster = levels[0].length;
        // only needed if maxCluster > 10
        // color.domain(d3.range(maxCluster));
    }

    // called when level or year changes
    function updateVis() {
        tooltip.activeType(activeType);
        tooltip.activeYear(activeYear);

        table.activeType(activeType);
        table.activeDepth(activeDepth);

        cutsCircles
            .valueAccessor(function(d) {
                return d.cuts[activeType][activeYear];
            })
            .value2Accessor(function(d) {
                return ((d.gross_cost || {})[activeType] || {})["2012"];
            });

        var level = levels[activeDepth - 1];
        level.forEach(function(d) {
            d.cluster = d.parent.id || d.id;
        });

        mainG
            .datum(level)
            .call(cutsCircles);

        nodes = cutsCircles.nodes();

        var maxValue = d3.max(nodes, function(d) {
            return d.value;
        });

        radius.domain([0, maxValue]);

        legendG
            .datum(legendData[activeType])
            .call(legend);

        d3.select('table.main')
            .datum(level)
            .call(table);

        force
            .nodes(nodes);
        forceExt
            .nodes(nodes);

        // calls force.start and updateRadius
        resize();
    }

    var updateRadius = _.debounce(function() {
        cutsCircles.updateRadius(radius);
        legend.updateRadius(radius);
    }, 300, true);

});
