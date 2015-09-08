(function(ang) {

    'use strict';

    ang.module('main', ['ang-google-maps'])
        .controller('mainCtrl', ['$scope', 'Direction', mainCtrl]);

    function mainCtrl($scope, Direction) {
        
        console.log(Direction)
        
        var $Self = this;
        
        setModel.call($scope);
        
        $scope.test = function($Obj) {
            console.log($Obj);
        };
        
        $scope.setLocation = function($Position, $Model) {
            
            console.log("SetLocation");
            console.log(arguments);

            $scope.location[$Model.name] = $Position;
            
            console.log($scope.location);
            
            var current = $scope.location['pick-up'],
                destination = $scope.location['drop-off-1'];

            if ($Model['name'] != 'drop-off-1' && $Model['name'] != 'pick-up') return;

            // Show the route
            if (current && destination) Direction.setRoute({
                map: $scope.map,
                current: current,
                destination: destination
            });

        };

        window.$scope = $scope;

    }
    
    function setModel() {
        
        this.appName = "Google Maps API";
        
        // Set the model
        this.location = {};
    }

}(angular));