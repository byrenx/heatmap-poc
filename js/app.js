(function(Style){
    var Map = null;

    var Config = {
	    account: 'byrenx',
        KEY: 'b5d8421cb6b5e43f2eedb00de552f7e639b2a5dd'
    }


    var defaultLayer = {
	    user_name: Config.account,
	    type: 'cartodb',
	    sublayers: [
            {
                sql: "SELECT * FROM stores",
                cartocss: '#stores {marker-fill: #FF0000; marker-opacity: 0.5; marker-width: 50; marker-height: 50}'},
		    {
            	sql: "SELECT * FROM new_orders",
            	cartocss: Style.by_age_style
  		    }
  	    ]
    };

    // var Marker = {
    //     markers: [],
    //     init: function(){
    //         this.markers = [];
    //     },
    //     add: function(feature){
    //         var coord = feature.geometry.coordinates;
    //         var marker = new google.maps.Marker({
    //             map: map,
    //             icon: feature.icon,
    //         });

    //         marker.setPosition({
    //             lat: parseFloat(coord[1]),
    //             lng: parseFloat(coord[0])
    //         });
    //         this.addInfoWindow(marker, feature.message);
    //         this.markers.push(marker);
    //     },
    //     addInfoWindow: function(marker, message){
    //         var infoWindow = new google.maps.InfoWindow({
    //             content: message
    //         });

    //         google.maps.event.addListener(marker, 'click', function() {
    //             infoWindow.open(map, marker);
    //         });
    //     },
    //     list: function(){
    //         return markers;
    //     },
    //     clear: function(){
    //         for (var i=0; i<this.markers.length; i++){
    //             this.markers[i].setMap(null);
    //         }
    //         this.markers = [];
    //     }
    // };

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
                strokeColor: '#FFFF00',
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
	    init : function(){
            Map = new google.maps.Map(document.getElementById('map'),{
                zoom: 13,
        	    center: {lat:39.738841359645896,
        		         lng:-104.99093055725098
        		        }
            });
            //this.initializePolygons();
            this.initLayers();
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
	    initLayers: function(){
            cartodb.createLayer(Map, defaultLayer)
		        .addTo(Map)
		        .on('done', function(layer) {
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
		            layer.setSQL("SELECT * FROM new_orders WHERE " + selected);
		        }
            });
	    }
    }//end of POC

    POC.init();
})(Style);
