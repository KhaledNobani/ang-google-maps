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
            $scope.setLocation();
            
        };
        
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

            $scope.waypoints = $scope.getWaypoints();            
            $scope.setLocation();
            
        };

        $scope.getWaypoints = function() {
            
            var $List = [];
            
            console.log($scope.dropOffs);
            
            ang.forEach($scope.dropOffs, function(value, key) {
                
                var isNameMatched = ( $scope.dropOffs[key]['name'] == $scope.currentDestination );
                
                if (!isNameMatched) {
                    var $Data = ang.copy($scope.dropOffs[key]);
                    delete $Data['name'];
                    $List.push($Data);
                }

            });
                
            return $List;
            
        };
                
        $scope.setCurrentDestination = function(name) {
        
            if (!name) return;
            
            // Update the modele
            $scope.currentDestination = name;
            $scope.waypoints = $scope.getWaypoints();
            
            console.log($scope.waypoints);
            
            // Start setting the location.
            $scope.setLocation();
            
        };
        
        $scope.setLocation = function($Position, $Model, $CoreModel) {
            
            console.log($scope.location[$scope.currentDestination]);
            
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
        
        $scope.updateDropOffs = function() {
            
            ang.forEach($scope.dropOffs, function(value, key) {
                
                var isNameMatched = $scope.dropOffs[key]['name'] == $scope.currentDestination;
                                
                if (isNameMatched) $scope.dropOffs[key]['location'] = $scope.location[$scope.currentDestination];
                
            });
            
        };
        
        $scope.handleDirectionChange = function($Leg, $parentScope, $Directions) {

            console.log('Handle on change');
            
            console.log($Leg);
            
            $parentScope['pickUp'] = $scope['pickUp'] = $Leg.current.name;
            $parentScope[$scope.currentDestination] = $scope[$scope.currentDestination] = $Leg.destination.name;
            $scope.location['pickUp'] = $Leg.current.coords;
            $scope.location[$scope.currentDestination] = $Leg.destination.coords;
            
            console.log("Before Updating dropoffs");
            console.log(JSON.stringify($scope.dropOffs));
            
            $scope.updateWaypoints($parentScope, $Leg, $Leg.waypoints);

        };
        
        $scope.updateWaypoints = function($parentScope, $Leg, $WayPoints) {
            
            if (!$scope.waypoints.length) return;
            
            for (var key = 0, length = $scope.dropOffs.length; key < length; key++) {
                
                var isNameEqual = $scope.dropOffs[key]['name'] == $scope.currentDestination;
                
                if (isNameEqual) { 
                    
                    $scope.dropOffs[key]['location'] = $Leg.destination.coords;
                    console.log($scope.dropOffs[key]['location']);
                    console.log('Skipping');
                    continue;
                    
                }
                
                (function(index) {
                 
                    var waypointIndex = ($WayPoints[index-1]) ? index-1 : index;

                    console.log("waypointIndex " + waypointIndex);
                    console.log("dropOffIndex " + index);

                    console.log("Before change : ");
                    console.log($scope.dropOffs[index]['location']);
                  
                    // Set the end_location into the dropOff
                    $scope.dropOffs[index]['location'] = ang.copy($WayPoints[waypointIndex]['end_location']);
                    // Set the name
                    $parentScope[$scope.dropOffs[index]['name']] = $WayPoints[waypointIndex]['end_address'];

                    console.log("After change : " + $scope.dropOffs[index]['location'].toString());

                }(key));

            }

            console.log(JSON.stringify($scope.dropOffs));

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


}(angular));