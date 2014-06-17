/**
 * @author: biangang
 * @date: 2014/6/16
 */
'use strict';
require.config({
    baseUrl: "../",
    paths: {
        "angular": "bower_components/angular/angular.min",
        "socket": "lib/socket.io-1.0.4"
    },
    shim: {
        "angular": {
            exports: "angular"
        }
    }
});
require(["script/draw"]);