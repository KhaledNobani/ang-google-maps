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
        $scope.orderedWaypoints = [];
        $scope.location = {};
        $scope.currentMarker = 'pickUp';
        $scope.$MarkerList = ['pickUp', 'dropOff1', 'dropOff2', 'dropOff3', 'dropOff4'];
        
        $scope.setInputFieldForMarker = function($Event, currentMarkerName) {
            
            // Get the name of current location
            $Geocode.getNames({coords: $Event.latLng})
                .then(function(res) {
                    
                    var $Data = res[0];
                    
                    console.log(res);
                    if ($scope.map["O" + currentMarkerName]) $scope.map["O" + currentMarkerName].value = res[0].formatted_address;
					if (currentMarkerName.indexOf('pickUp') != -1) $scope.updatePickup($Data, $Data.geometry.location);
					if (currentMarkerName.indexOf('dropOff') != -1) $scope.setDropoff($Data.geometry.location, {}, $Data, currentMarkerName);
                    

                }, function(err) {

                    console.error(err);

            });
            
        };
        
        $scope.updatePickup = function($CoreModel, $Position) {

			console.log("Updating Pickup");
			$scope.location['pickUp'] = $Position;
			$scope.setLocation();

		};

        $scope.handleMapClick = function($Coords, $Pixel, $Za) {

            if ($scope.$MarkerList[0] != $scope.currentMarker) return new Error("Can't create a marker.");

            var currentMarkerName = $scope.currentMarker,
                numPatt = /\d+/,
                markerlabel = (currentMarkerName.indexOf('dropOff') >= 0) ? currentMarkerName.match(numPatt)[0] : 'P';
            
            $scope.map.addingMarker({
                name: currentMarkerName || '',
                ondragend: function($Event) {
                    $scope.setInputFieldForMarker($Event, currentMarkerName);
                },
                oninit: function($Event) {
                    $scope.setInputFieldForMarker($Event, currentMarkerName);
                },
                onclick: function($Event) {
                    console.log("Clicking on the marker");
                },
                $inputEle: $scope.map["O" + $scope.currentMarker],
                position: $Coords,
                markerlabel: markerlabel
            });
            
            $scope.$MarkerList.splice(0, 1);
            
        };
            
        $scope.handleMarkerDrop = function($Event, $Model, $AutoCompScope) {

            $Geocode.getNames({
                coords: $Event.latLng
            }).then(function(results) {
                $AutoCompScope.element.value = results[0].formatted_address || '';
                setTimeout(function() { $scope.setLocation(); }, 100);
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

            $Position['title'] = name;
            
            var index = $filter('getByName')($scope.dropOffs, name),
                $WayPoint = {
                    name: name,
                    location: $Position,
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
            $scope.currentMarker = name;
            $scope.waypoints = $scope.getWaypoints();
            
            console.log($scope.waypoints);
            
            // Start setting the location.
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
                    dropOffs: $scope['waypoints'],
                    avoidHighways: true,
                    avoidTolls: true
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
            
            $scope.orderedWaypoints = $Directions.routes[0].waypoint_order;
            console.log("$scope.orderedWaypoints");
            console.log($scope.orderedWaypoints);
            return;
            
            console.log('Handle on change');
            
            console.log(arguments);
            
            
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
                    break;
                    
                }

            }

            console.log(JSON.stringify($scope.dropOffs));

        };
        
        $scope.optimize = function() {
            
            var $OrderWaypoints = [];
            
            angular.forEach($scope.orderedWaypoints, function(value, key) {
               $OrderWaypoints.push($scope['waypoints'][value]);             
            });

            $scope['waypoints'] = $OrderWaypoints;
            setTimeout(function() { $scope.setLocation({
                avoidHighways: true,
                avoidTolls: true
            }); }, 100);

        }
        
        $scope.handleMarkerClick = function ($Event, $Model, $AutoCompScope) {
        
            console.log("The marker has been clicked from the controller");
        
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