(function(ang, g) {

    'use strict';
    ang.module('angular-google-maps', [])
        .directive('mapTemp', ['$window', '$document', '$http', mapTempFactory])
        .directive('autoCompleteTemp', ['$window', '$http', autoCompleteTempFactory]);

    /**
      * Creates the factory of mapTemp.
      *
      * @param {Object} $window
      * @param {Object} $http
      */
    function mapTempFactory($window, $document, $http) {

        return {

            controller: mapTempCtrl,
            link: mapTempLink,
            scope: {
                id: "=id",
                options: "=options"
            },
            template: '<div class="container" id="map-{{options.id||id}}" ng-transclude></div>',
            transclude: true,

        };

    }

    /**
      * Creates the factory of autoCompleteTemp.
      *
      * @param {Object} $window
      * @param {Object} $http
      */
    function autoCompleteTempFactory($window, $http) {

        return {

            controller: autoCompleteTempCtrl,
            link: autoCompleteTempLink,
            scope: {

            },
            templateUrl: '../templates/auto-complete.html'

        };

    }

    /**
      * Handles map-temp directive's controller
      *
      * @param {Object} $scope
      */
    function mapTempCtrl($scope) {

        $scope.mapOptions = {
            center: {
                lat: parseFloat($scope.options.lat),
                lng: parseFloat($scope.options.lng),
            },
            zoom: $scope.options.zoom || 18
        };

    }

    /**
      * Handles map-temp directive's link
      *
      * @param {Object} $scope
      * @param {Object} element
      * @param {Object} attrs
      * @param {Array} ctlrs
      */
    function mapTempLink($scope, element, attrs, ctrls) {

        initMap.call($scope, element);

    }

    /**
      * Initializes Google map into map's content.
      *
      */
    function initMap(element) {

        var self = this;

        this.map = new g.maps.Map(element[0].children[0] || null, self.mapOptions);

    }

    /**
      * Handles auto-complete-temp directive's controller
      *
      * @param {Object} $scope
      */
    function autoCompleteTempCtrl($scope) {
        $scope.fillInAdress = fillInAdress;
    }

    /**
      * Handles auto-complete-temp directive's link
      *
      * @param {Object} $scope
      * @param {Object} element
      * @param {Object} attrs
      * @param {Array} ctlrs
      */
    function autoCompleteTempLink($scope, element, attrs, ctrls) {
        
        console.log(element);
        
        // Create autocomplete object
        $scope.autocomplete = new g.maps.places.Autocomplete(
            // Dom element
            element[0].getElementsByTagName('input')[0] || null,
            // Type
            { type: 'geocode' }
        );
        
        // Attach an event into autocomplete
        g.maps.event.addListener($scope.autocomplete, 'place_changed', function() {
            
            $scope.fillInAdress();
            
        });

    }
    
    function fillInAdress() {

    }

}(angular, google));
