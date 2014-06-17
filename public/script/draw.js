/**
 * @author: biangang
 * @date: 2014/6/16
 */
define(['angular', 'socket'], function(angular, io){
    "use strict";

    console.clear();

    var app = angular.module("app", []);

    app.controller("DrawCtrl", function($scope, socket, drawComponent){
        /**
         * context stroke color
         * @type {string}
         */
        $scope.strokeColor = "#000";
        /**
         * draw mode
         * @type {string}
         */
        $scope.drawMode = "line";
        /**
         * draw modes
         * @type {{type: string, name: string}[]}
         */
        $scope.modes = [
            {
                type: "line",
                name: "line"
            },
            {
                type: "straight",
                name: "straight line"
            }
        ];
        /**
         * draw colors
         * @type {{value: string}[]}
         */
        $scope.colors = [
            {
                value: "#000"
            },
            {
                value: "#f00"
            },
            {
                value: "#0f0"
            },
            {
                value: "#00f"
            }
        ];
        /**
         * set stroke color
         * @return {null}
         */
        $scope.setColor = function(){
            $scope.strokeColor = this.color.value;
            var data = {
                key: "strokeColor",
                value: $scope.strokeColor
            };
            drawComponent.refresh(data);
            syncStatus(data);
        };
        /**
         * set draw mode
         * @return {null}
         */
        $scope.setMode = function(){
            $scope.drawMode = this.mode.type;
            var data = {
                key: "drawMode",
                value: $scope.drawMode
            };
            drawComponent.refresh(data);
            syncStatus(data);
        };

        /**
         * get status form socket
         */
        socket.on("syncStatus", function(data){
            $scope[data.key] = data.value;
            drawComponent.refresh(data);
        });

        /**
         * sync data by socket
         * @param data
         */
        function syncStatus(data){
            socket.emit("onSyncStatus", data);
        }
    });

    app.factory("socket", ["$rootScope", "$location", function($rootScope, $location){
        var socket = io.connect($location.$$host + '/draw');
        return {
            /**
             * listen on event
             * @param {string} eventName
             * @param {function} callback
             */
            on: function(eventName, callback){
                socket.on(eventName, function(){
                    var args = arguments;
                    $rootScope.$apply(function(){
                        callback.apply(socket, args);
                    })
                });
            },
            /**
             * emit data on socket
             * @param {string} eventName
             * @param {obj|string} data
             * @param {function} callback
             */
            emit: function(eventName, data, callback){
                socket.emit(eventName, data, function(){
                    var args = arguments;
                    $rootScope.$apply(function(){
                        callback.apply(socket, args);
                    })
                });
            }
        }
    }]);

    /**
     * provider all kinds of draw methord
     */
    app.factory("drawComponent", ["$rootScope", "$window", "$document", "socket", function($rootScope, $window, $document, socket){
        var _DC = {};

        var width = $window.innerWidth - 2;
        var height = $window.innerHeight - 2;
        var ghost = $document.find("canvas").eq(1);
        var ctx = ghost[0].getContext("2d");
        var isDrawing = false;
        var pos = {};
        var origin = {};

        /**
         * start to draw
         * @param e
         */
        function drawStart(e){
            origin.x = e.x || e.clientX;
            origin.y = e.y || e.clientY;
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            isDrawing = true;

            sendPathData({
                type: "begin",
                origin: origin,
                position: pos
            });
        }

        /**
         * drawing
         * @param e
         */
        function drawing(e){
            if (!isDrawing) return;
            pos.x = e.x || e.clientX;
            pos.y = e.y || e.clientY;

            dispatch();

            sendPathData({
                type: _DC.drawMode,
                origin: origin,
                position: pos
            });
        }

        /**
         * finish drawing
         * @param e
         */
        function drawEnd(e){
            pos.x = e.x || e.clientX;
            pos.y = e.y || e.clientY;
            isDrawing = false;
            merge();

            sendPathData({
                type: "end"
            });
        }

        /**
         * dispatch by drawMode
         * @param {string} type
         * @param {object} position
         * @param {object} origin originPosition
         */
        function dispatch(type, position, originPosition){
            type = type || _DC.drawMode;
            position = position || pos;
            originPosition = originPosition || origin;
            switch (type) {
                case "line":
                    _DC.drawLine(position);
                    break;
                case "straight":
                    _DC.drawStraight(position, originPosition);
                    break;
                case "begin":
                    ctx.beginPath();
                    ctx.moveTo(originPosition.x, originPosition.y);
                    break;
                case "end":
                    merge();
                    break;
                default:
                    break;
            }
        }

        /**
         * ready for drawing
         */
        ghost.bind("mousedown", drawStart);
        /**
         * drawing
         */
        ghost.bind("mousemove", drawing);
        /**
         * finish drawing
         */
        ghost.bind("mouseup", drawEnd);

        /**
         * listen to socket drawing data
         */
        socket.on("getDrawData", drawByData);

        /**
         * send draw path data by websocket
         * @param {object} data
         * @return {null}
         */
        function sendPathData(data){
            socket.emit('sendDrawData', data);
        }

        /**
         * draw with data getting from socket
         * @param {object} data
         * todo: this method only draw on ghost, without merge to real canvas
         */
        function drawByData(data){
            if (!data) return;
            dispatch(data.type, data.position, data.origin)
        }

        /**
         * draw ghost canvas to real canvas
         */
        function merge(){
            _DC.ctx.drawImage(ghost[0], 0, 0);
            ctx.clearRect(0, 0, width, height);
        }

        /**
         * init method
         * @param {object} obj
         */
        _DC.init = function(obj){
            angular.extend(this, obj);
        };

        /**
         * clean ghost canvas, prepare for next draw
         * @param {object} obj
         */
        _DC.refresh = function(obj){
            _DC[obj.key] = obj.value;
            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = _DC.strokeColor;
            ctx.beginPath();
        };

        /**
         * draw line
         * @param {object} position
         */
        _DC.drawLine = function(position){
            ctx.lineTo(position.x, position.y);
            ctx.stroke();
        };

        /**
         * draw straight line
         * @param {object} position
         * @param {object} originPosition
         */
        _DC.drawStraight = function(position, originPosition){
            ctx.clearRect(0, 0, width, height);
            ctx.beginPath();
            ctx.moveTo(originPosition.x, originPosition.y);
            ctx.lineTo(position.x, position.y);
            ctx.stroke();
        };

        return _DC;
    }]);

    app.directive("draw", function($window, socket, drawComponent){
        return {
            restrict: 'A',
            link: function($scope, element){
                var ctx = element[0].getContext("2d");

                /**
                 * get canvas width from window width
                 * @type {number}
                 */
                $scope.width = $window.innerWidth - 2;
                /**
                 * get canvas height from window height
                 * @type {number}
                 */
                $scope.height = $window.innerHeight - 2;

                drawComponent.init({
                    ctx: ctx,
                    strokeColor: $scope.strokeColor,
                    drawMode: $scope.drawMode
                });
            }
        }
    });

});