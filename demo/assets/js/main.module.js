(function(ang) {

    'use strict';

    ang.module('main', ['ang-google-maps', 'ang-google-services'])
        .controller('mainCtrl', ['$scope', 'Direction', '$Geocode', '$rootScope', mainCtrl]);

    function mainCtrl($scope, Direction, $Geocode, $rootScope) {
        
        var $Self = this;
                
        $scope.currentDestination = 'dropOff1';

        setModel.call($scope);
                
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

        $scope.handleDirectionChange = function($Leg, $parentScope) {

            console.log('Handle on change');
            console.log(arguments);

            $parentScope['pickUp'] = $scope['pickUp'] = $Leg.start_address;
            $parentScope[$scope.currentDestination] = $scope[$scope.currentDestination] = $Leg.end_address;
            $scope.location['pickUp'] = $Leg.start_location;
            $scope.location[$scope.currentDestination] = $Leg.end_location;
            
        };
        
    }
    
    function setModel() {
        this.appName = "Google Maps API";
        
        // Set the model
        this.location = {
            'pickUp': '',
            'dropOff1': ''
        };
    }

}(angular));