(function(ang) {

    'use strict';

    ang.module('main', ['angular-google-maps'])
        .controller('mainCtrl', ['$scope', mainCtrl]);

    function mainCtrl($scope) {

        $scope.appName = "Google Maps API";

    }

}(angular));
