$(function(){
    var Map = null;

    var Marker = {
        markers: [],
        init: function(){
            this.markers = [];
        },
        add: function(feature){
            var coord = feature.geometry.coordinates;
            var marker = new google.maps.Marker({
                map: map,
                icon: feature.icon,
            });

            marker.setPosition({
                lat: parseFloat(coord[1]),
                lng: parseFloat(coord[0])
            });
            this.addInfoWindow(marker, feature.message);
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
    
    var POC = {
	init : function(){
	    Map = new google.maps.Map(document.getElementById('map'),{
		zoom: 8,
		center: {lat:47.29413372501023,
			 lng:-112.32421875
			}
	    });
	    
	    // cartodb.createLayer(Map, 'https://byrenx.cartodb.com/api/v2/viz/6f68d37c-6900-11e5-ad84-0ecd1babdde5/viz.json')
	    // 	.addTo(Map)
	    // 	.on('done', function(layer) {
	    // 	    //do stuff
	    // 	})
	    // 	.on('error', function(err) {
	    // 	    alert("some error occurred: " + err);
	    // 	});
	}

	initializePolygon: function(){
	    
	}
    }
    POC.init();
});

