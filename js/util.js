/**
   Util Object which implements querying to cartodb
   this file is requires to cartodb.js
   @author: Angelo Arboleda
*/

var Util = (function(){
    
    function Util(config){
        /**
           @param: config -> contains config for cartodb 
           e.g account, accesskey, tablename and etc.
        */
        this.Config = config;
    }
    
    Util.prototype = {
        format: function(template, data) {
            return template.replace(/{(\w*)}/g, function(m, key) {
                return data.hasOwnProperty(key) ? data[key] : "";
            }).replace(/{/g, "").replace(/}/g, "");
        },
        executeSQL: function(sql, params) {
            console.log('Query ==> ', sql);
            var sqlObj = new cartodb.SQL({
                user: this.Config.account,
                api_key: this.Config.KEY
            });
            return sqlObj.execute(sql, params);
        },
        pointDataToSQL: function(data) {
            /**
               data are list of point markers
               in geojson format
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
        queryPointsCount: function(points_data, table) {
            /**
               returns a json form object which has is the result of the query
            */
            var points_sql = this.pointDataToSQL(points_data);
            //query the number of points that intersects a polygon in a dataset
            var sql = " SELECT * FROM (                                                    " +
                " SELECT a.gridcode,                                                 " +
                "        (                                                           " +
                "            SELECT COUNT(*) FROM ( " + points_sql + " ) as b WHERE   " +
                "            ST_INTERSECTS(a.the_geom_webmercator,                   " +
                "                          b.the_geom_webmercator)                   " +
                "        ) AS points_count                                            " +
                " FROM " + table + " AS a                                             " +
                " ) AS T WHERE NOT (points_count = 0) ";

            
            return this.executeSQL(sql);
        }
        // queryString: function() {
        //     var query_string = {};
        //     var query = window.location.search.substring(1);
        //     var vars = query.split("&");
        //     for (var i = 0; i < vars.length; i++) {
        //         var pair = vars[i].split("=");
        //         if (typeof query_string[pair[0]] === "undefined") {
        //             query_string[pair[0]] = decodeURIComponent(pair[1]);
        //         } else if (typeof query_string[pair[0]] === "string") {
        //             var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
        //             query_string[pair[0]] = arr;
        //         } else {
        //             query_string[pair[0]].push(decodeURIComponent(pair[1]));
        //         }
        //     }
        //     return query_string;
        // }(),
        // permalink: function() {
        //     var z = map.getZoom();
        //     var lat = map.getCenter().lat();
        //     var lng = map.getCenter().lng();
        //     return window.location.pathname.split('/').pop() + this.format("?z={{z}}&lat={{lat}}&lng={{lng}}", {z:z, lat: lat, lng: lng});
        // },


    };
    return Util
})();
