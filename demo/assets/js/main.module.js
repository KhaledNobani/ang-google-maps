(function(ang) {

    'use strict';

    ang.module('main', ['ang-google-maps', 'ang-google-services'])
        .controller('mainCtrl', ['$scope', 'Direction', '$Geocode', mainCtrl]);

    function mainCtrl($scope, Direction, $Geocode) {
        
        var $Self = this;
                
        $scope.currentDestination = 'dropOff1';

        setModel.call($scope);
                
        $scope.handleMarkerDrop = function($Event, $Model, $AutoCompScope) {
            
            $scope.location[$Model.name] = $Event.latLng;

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

        $scope.setDropoff1 = function($Position, $Model, $CoreModel) {

            $scope.location[$scope.currentDestination] = $Position;
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
                    destination: destination
                });
            }

        };

        $scope.handleDirectionChange = function($Leg, done) {

            console.log('Handle on change');
            //$tempScope['pickUp'] = Math.random(1000);

            $scope['pickUp'] = $Leg.start_address;
            $scope[$scope.currentDestination] = $Leg.end_address;
            $scope.location['pickUp'] = $Leg.start_location;
            $scope.location[$scope.currentDestination] = $Leg.end_location;
            
            // To update input fields
            done($scope);

        };
        
    }
    
    function setModel() {
        
        this.appName = "Google Maps API";
        
        // Set the model
        this.location = {};
    }

}(angular));