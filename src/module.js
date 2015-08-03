(function(ang, g) {

    'use strict';
    ang.module('angular-google-maps', [])
        .directive('mapTemp', ['$window', '$document', '$http', mapTempFactory]);

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
            zoom: 14
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

        console.log(self);

        this.map = new g.maps.Map(element[0].children[0] || null, self.mapOptions);

    }


}(angular, google));
