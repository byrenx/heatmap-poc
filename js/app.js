(function(Style){
    var Map = null;

    var Config = {
	     user_name: 'byrenx',
    }


    var defaultLayer = {
	     user_name: Config.user_name,
	     type: 'cartodb',
	     sublayers: [{
              		  sql: "SELECT * FROM stores",
              		  cartocss: '#stores {marker-fill: #FF0000; marker-opacity: 0.5; marker-width: 50; marker-height: 50}'
          	       },
                   {
            	    	sql: "SELECT * FROM new_orders",
            	    	cartocss: Style.by_age_style
  	               }
  	              ]
    };



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
       layers: [],
       init : function(){
        Map = new google.maps.Map(document.getElementById('map'),{
                zoom: 8,
        		    center: {lat:47.29413372501023,
        			           lng:-112.32421875
        			  }
        });
        this.initLayers();
       },
       initLayers: function(){
         cartodb.createLayer(Map, defaultLayer)
         .addTo(Map)
         .on('done', function(layer) {
           POC.createSelector(layer.getSubLayer(1));
          //  for(var i=0; i<layer.layers.length; i++){
          //    POC.createSelector(layer.getSubLayer(i));
          //  }
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
            var selected = $li.attr('data');
            console.log(selected);

            $options.removeClass('cartocss_selected');
            $li.addClass('cartocss_selected');

            cartocss = Style[selected];

            layer.setCartoCSS(cartocss);
        });
       }
   }//end of POC

    POC.init();
})(Style);
