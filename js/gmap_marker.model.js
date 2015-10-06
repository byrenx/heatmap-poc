/**
Marker model for Google Map
@author: Jofel Bayron
*/

(function(){
    function Marker(map){
        this.Map = map;
    }

    Marker.prototype = {
        markers: [],
        init: function(){
            this.markers = [];
        },
        add: function(feature){
            var coord = feature.geometry.coordinates;
            var marker = new google.maps.Marker({
                map: this.Map,
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
    
    return Marker;
})();
