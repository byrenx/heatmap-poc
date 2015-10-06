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
            	cartocss: Style.simple
  		    }
  	    ]
    };


    var POC = {
	    layers: [],
        //points_data: [],
        Marker: null,
        Polygon: null,
        Util: new Util(Config),
	    init : function(){
            Map = new google.maps.Map(document.getElementById('map'),{
                zoom: 13,
        	    center: {lat:39.738841359645896,
        		         lng:-104.99093055725098
        		        }
            });
            this.Polygon = new Polygon(Map);
            
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
                        POC.Polygon.add(feature.properties.gridcode, feature.geometry.coordinates[0][0]);
                    });
                });
        },

        updatePolygon: function(){
            this.Util.queryPointsCount(this.points_data, 'colorado_1')
                .done(function(data){
                    console.log("Points Count ==> ", data);
                    POC.colorizePolygons(data);
                });
        },

        colorizePolygons: function(data){
            var active_gridcodes = [];
            for(var i=0; i<data.rows.length; i++){
                var row = data.rows[i];
                var poly = this.Polygon.get(row.gridcode);
                console.log(poly);

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
            $.each(this.Polygon.all(), function(key, val) {
                var index = active_gridcodes.indexOf(key);
                if (index < 0) { //reset color
                    val.setOptions({
                        fillColor: '#E7E7F6'
                    });
                }
            });
        },
        initializePoints: function(){
            var offset = {start: 0, end: 100};
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
            setInterval(simulate, Config.INTERVAL);
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
		            POC.createSelector(layer.getSubLayer(1));
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
