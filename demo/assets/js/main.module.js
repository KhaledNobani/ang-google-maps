(function(ang) {

    'use strict';

    ang.module('main', ['ang-google-maps', 'ang-google-services'])
        .controller('mainCtrl', ['$scope', 'Direction', '$Geocode', '$rootScope', '$filter', mainCtrl])
        .filter('getByName', function() {

            return function(input, name) {

                for (var index = 0, length = ('length' in input) ? input.length : 0; index < length; index++) {

                    if (input[index]['name'] == name) {
                        return index;  
                    }

                }

                return -1;

            }

        });
    
    function mainCtrl($scope, Direction, $Geocode, $rootScope, $filter) {

        var $Self = this;
        
        // Models
        $scope.appName = 'Maps API';
        $scope.currentDestination = 'dropOff1';
        $scope.dropOffs = [];
        $scope.waypoints = [];
        $scope.location = {};
        
        // Methods
        $scope.manageDropOffs = function() {
            manageDropOffs.call($scope, $filter);   
        };

        $scope.handleMarkerDrop = function($Event, $Model, $AutoCompScope) {

            $Geocode.getNames({
                coords: $Event.latLng
            }).then(function(results) {
                $AutoCompScope.element.value = results[0].formatted_address || '';
            }, function(error) {
                console.error(error);
            });

        };

        $scope.setPickup = function($Position, $Model, $CoreModel) {
            
            $scope.location['pickUp'] = $Position;
            $scope.manageDropOffs();
            $scope.setLocation();
            
        };
        
        $scope.setLocation = function($Position, $Model, $CoreModel) {

            var current = $scope.location['pickUp'],
                destination = $scope.location[$scope.currentDestination];

            // Show the route
            if (current && destination) {
                Direction.setRoute({
                    map: $scope.map,
                    current: current,
                    destination: destination,
                    dropOffs: $scope['waypoints']
                });
            }

        };
        
        $scope.handleDirectionChange = function($Leg, $parentScope, $Directions) {

            console.log('Handle on change');
            console.log(arguments);

            $parentScope['pickUp'] = $scope['pickUp'] = $Leg.current.name;
            $parentScope[$scope.currentDestination] = $scope[$scope.currentDestination] = $Leg.destination.name;
            $scope.location['pickUp'] = $Leg.current.coords;
            $scope.location[$scope.currentDestination] = $Leg.destination.coords;
            
            $scope.updateWaypoints($parentScope, $Leg.waypoints);

        };
        
        $scope.updateWaypoints = function($parentScope, $WayPoints) {
            
            var reversedWaypoints = $WayPoints.reverse();
            
            ang.forEach($scope.dropOffs, function(value, key) {
                
                var isNameEqual = $scope.dropOffs[key]['name'] == $scope.currentDestination,
                    isLastIndex = key + 1 == $scope.dropOffs.length,
                    name = undefined,
                    addressName = undefined;
                
                if (!isLastIndex) {
                    
                    if (isNameEqual) {
                        console.log("Yes, Gotcha");
                        $scope.dropOffs[key+1]['location'] = reversedWaypoints[key]['end_location'];
                        name = $scope.dropOffs[key+1]['name'];
                        //console.log($WayPoints[key]);
                    } else {
                        console.log("Not Yet");
                        console.log($scope.dropOffs[key]);
                        $scope.dropOffs[key]['location'] = reversedWaypoints[key]['end_location'];
                        name = $scope.dropOffs[key]['name'];
                        
                        //console.log($WayPoints[key]);
                    }
                    
                    addressName = $WayPoints[key]['end_address'];

                }
                
                if(name && addressName) $parentScope[name] = $scope[name] = addressName;

            });
            
            console.log($scope.dropOffs);
            console.log($WayPoints);
            
        };

    }

    function reShapeWaypoints($list) {
        
        var $List = $list || [],
            $NewList = [];
        
        for (var index = 0, length = $List.length; index < length; index++) {
            
            $NewList.push(ang.copy($List[index]));
            delete $NewList[index]['name'];
            
        }
        
        return $NewList;
        
    }

    function manageDropOffs($filter) {

        var $scope = this;
                
        $scope.setDropoff = function($Position, $Model, $CoreModel, name) {

            $scope.location[name] = $Position;

            var index = $filter('getByName')($scope.dropOffs, name),
                $WayPoint = {
                    name: name,
                    location: $Position
            },
                $PointInfo = ang.copy($WayPoint),
                $InsertedEle = 0;
                        
            if(index == -1) { 
                $InsertedEle = $scope.dropOffs.push($PointInfo);
            } else {
                $scope.dropOffs[index] = $PointInfo;
            }

            $scope.waypoints = reShapeWaypoints($scope.dropOffs);
            
            var currentIndex = (index != -1) ? index : ($InsertedEle == 0) ? 0 : ($InsertedEle - 1); 
            
            console.log("currentIndex = " + currentIndex);
            console.log($scope);
            
            if ($scope.dropOffs[currentIndex]['name'] == $scope.currentDestination) {
                $scope.waypoints.splice(currentIndex, 1);
            }
            
            $scope.setLocation();
            
        };
        
    }

}(angular));