(function(Style){
    var Map = null;

    var Config = {
	    account: 'byrenx',
        KEY: 'b5d8421cb6b5e43f2eedb00de552f7e639b2a5dd',
        INTERVAL: 2000,
        ORDERS_TABLE: 'orders',
        COLORS:{
            green: '#00FF00',
            yellow: '#FFFF00',
            orange: '#FFA500',
            red: '#FF0000'
        }
    }


    var defaultLayer = {
	    user_name: Config.account,
	    type: 'cartodb',
	    sublayers: [
            {
                sql: "SELECT * FROM stores",
                cartocss: '#stores {marker-fill: #FF0000; marker-opacity: 0.5; marker-width: 50; marker-height: 50}'},
		    {
            	sql: "SELECT * FROM "+Config.ORDERS_TABLE,
            	cartocss: Style.by_age_style
  		    }
  	    ]
    };


    var Util = {
        queryString: function() {
            var query_string = {};
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (typeof query_string[pair[0]] === "undefined") {
                    query_string[pair[0]] = decodeURIComponent(pair[1]);
                } else if (typeof query_string[pair[0]] === "string") {
                    var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
                    query_string[pair[0]] = arr;
                } else {
                    query_string[pair[0]].push(decodeURIComponent(pair[1]));
                }
            }
            return query_string;
        }(),
        format: function(template, data) {
            return template.replace(/{(\w*)}/g, function(m, key) {
                return data.hasOwnProperty(key) ? data[key] : "";
            }).replace(/{/g, "").replace(/}/g, "");
        },
        executeSQL: function(sql, params) {
            console.log('Query ==> ', sql);
            var sqlObj = new cartodb.SQL({
                user: Config.account,
                api_key: Config.KEY
            });
            return sqlObj.execute(sql, params);
        },
        permalink: function() {
            var z = map.getZoom();
            var lat = map.getCenter().lat();
            var lng = map.getCenter().lng();
            return window.location.pathname.split('/').pop() + this.format("?z={{z}}&lat={{lat}}&lng={{lng}}", {z:z, lat: lat, lng: lng});
        }
    };


    var UtilSQL ={
        pointDataToSQL: function(data) {
            /**
               data are list of point markers
            */
            var lines = "";
            for (var i = 0; i < data.features.length; i++) {
                var feature = data.features[i];
                var coord = feature.geometry.coordinates;

                lines = lines + "SELECT ST_TRANSFORM(ST_GEOMFROMTEXT('POINT(" + coord[0] + " " + coord[1] + ")', 4326), 3857) as the_geom_webmercator " +
                    (i === (data.features.length - 1) ? "" : " UNION ALL ");
            }

            var sql = "SELECT * FROM (" + lines + ") as FOO";

            return sql;

        },
        queryPointsCount: function(points_data, club) {
            var points_sql = this.pointDataToSQL(points_data);
            var sql = " SELECT * FROM (                                                    " +
                " SELECT a.gridcode,                                                 " +
                "        (                                                           " +
                "            SELECT COUNT(*) FROM ( " + points_sql + " ) as b WHERE   " +
                "            ST_INTERSECTS(a.the_geom_webmercator,                   " +
                "                          b.the_geom_webmercator)                   " +
                "        ) AS points_count                                            " +
                " FROM " + club + " AS a                                             " +
                " ) AS T WHERE NOT (points_count = 0) ";

            
            return Util.executeSQL(sql);
        }
    }

    var Marker = {
        markers: [],
        init: function(){
            this.markers = [];
        },
        add: function(feature){
            var coord = feature.geometry.coordinates;
            var marker = new google.maps.Marker({
                map: Map,
                icon: feature.icon,
            });

            marker.setPosition({
                lat: parseFloat(coord[1]),
                lng: parseFloat(coord[0])
            });
            //this.addInfoWindow(marker, feature.message);
            this.markers.push(marker);
        },
        addInfoWindow: function(marker, message){
            var infoWindow = new google.maps.InfoWindow({
                content: message
            });

            google.maps.event.addListener(marker, 'click', function() {
                infoWindow.open(map, marker);
            });
        },
        list: function(){
            return markers;
        },
        clear: function(){
            for (var i=0; i<this.markers.length; i++){
                this.markers[i].setMap(null);
            }
            this.markers = [];
        }
    };

    var Polygon = {
        polygons: {},
        add: function(key, coordinates){
            var points = [];
            for (var i = 0; i < coordinates.length; i++) {
                var coord = coordinates[i];
                points.push({
                    lat: coord[1],
                    lng: coord[0]
                });
            }

            this.polygons[key] = new google.maps.Polygon({
                paths: points,
                strokeColor: Config.COLORS.red,
                strokeOpacity: 0.8,
                strokeWeight: 1
            });
            this.polygons[key].setMap(Map);
        },
        get: function(key){
            return this.polygons[key];
        },
        all: function(){
            return this.polygons;
        }
    };

    var POC = {
	    layers: [],
        points_data: [],
	    init : function(){
            Map = new google.maps.Map(document.getElementById('map'),{
                zoom: 13,
        	    center: {lat:39.738841359645896,
        		         lng:-104.99093055725098
        		        }
            });
            this.initLayers();
            this.initializePolygons();
            this.initializePoints();
            //this.updatePolygon();
	    },
	    initializePolygons: function() {
	        var query = "SELECT * FROM colorado_1";
            var url = 'https://'+Config.account+'.cartodb.com/api/v2/sql?format=GeoJSON&q='+query+'&api_key='+Config.KEY;
	        
            $.getJSON(url)
                .done(function(data) {
                    console.log(data);
                    $.each(data.features, function(key, feature) {
                        Polygon.add(feature.properties.gridcode, feature.geometry.coordinates[0][0]);
                    });
                });
        },

        updatePolygon: function(){
            UtilSQL.queryPointsCount(this.points_data, 'colorado_1')
                .done(function(data){
                    console.log("Points Count ==> ", data);
                    POC.colorizePolygons(data);
                });
        },

        colorizePolygons: function(data){
            var active_gridcodes = [];
            for(var i=0; i<data.rows.length; i++){
                var row = data.rows[i];
                var poly = Polygon.get(row.gridcode);

                if(row.points_count <= 10){
                    poly.setOptions({
                        fillColor: Config.COLORS.green
                    });
                }else if(row.points_count > 10 && row.points_count<=20 ){
                    poly.setOptions({
                        fillColor: Config.COLORS.yellow
                    });
                }else if(row.points_count > 20 && row.points_count<=30 ){
                    poly.setOptions({
                        fillColor: Config.COLORS.orange
                    });
                }else{
                    poly.setOptions({
                        fillColor: Config.COLORS.red
                    });
                }
                active_gridcodes.push(row.gridcode);
            }
            this.resetInactivePolygonColor(active_gridcodes);
        },
        resetInactivePolygonColor: function(active_gridcodes) {
            $.each(Polygon.all(), function(key, val) {
                var index = active_gridcodes.indexOf(key);
                if (index < 0) { //reset color
                    val.setOptions({
                        fillColor: '#E7E7F6'
                    });
                }
            });
        },
        initializePoints: function(){
            var offset = {start: 0, end: 500};
            var length = 5;
            var gap = 25;

            function simulate(){
                POC.getPoints(offset);
                offset.start = offset.end;
                offset.end += gap;
                if(length < 1){
                    length = 5;
                    offset.start = 0;
                    offset.end = 100;
                }
                length -= 1;
                console.log("Offset==>", offset);
            }

            simulate();
            //setInterval(simulate, Config.INTERVAL);
        },
        getPoints: function(offset){
            var query = "SELECT * FROM "+Config.ORDERS_TABLE+" LIMIT "+offset.end+" OFFSET "+offset.start;
            var url = 'https://'+Config.account+'.cartodb.com/api/v2/sql?format=GeoJSON&q='+query+'&api_key='+Config.KEY;

            
            $.getJSON(url)
                .done(function(data) {
                    POC.points_data = data;
                    console.log("Points==>", POC.points_data);
                    // $.each(data.features, function(key, feature) {
                    //     //Marker.add(feature);
                    
                    // });
                    POC.updatePolygon();
                    POC.updateSubLayer(query, POC.layers[1]);
                });
        },
	    initLayers: function(){
            cartodb.createLayer(Map, defaultLayer)
		        .addTo(Map)
		        .on('done', function(layer) {
                    console.log("Layer==>", layer);
                    for(var i=0; i<layer.layers.length; i++){
                        POC.layers.push(layer.getSubLayer(i));
                        console.log("SubLayer==>", POC.layers[i]);
                    }
		            //POC.createSelector(layer.getSubLayer(1));
		        })
		        .on('error', function(err) {
		            alert("some error occurred: " + err);
		        });
	    },
	    createSelector: function(layer) {
            var cartocss = "";
            var $options = $(".layer_selector").find("li");

            $options.click(function(e) {
		        var $li = $(e.target);
		        var type = $li.data('type');
		        var selected = $li.attr('data');

		        console.log(type);

		        $options.removeClass('cartocss_selected');
		        $li.addClass('cartocss_selected');

		        if (type=="cartocss"){
		            cartocss = Style[selected];
		            layer.setCartoCSS(cartocss);
		        }else{
		            layer.setSQL("SELECT * FROM "+ORDERS_TABLE+" WHERE " + selected);
		        }
            });
	    },
        updateSubLayer: function(query, layer){
            layer.setSQL(query);
        }
    }//end of POC

    POC.init();
})(Style);
