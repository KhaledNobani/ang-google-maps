(function(ang, g) {

    'use strict';
    ang.module('angular-google-maps', [])
        .config(['$provide', function($provide) {}])
        .factory('GetPosition', function() { return GetPosition; })
        .factory('GetMarker', function() { return GetMarker; })
        .directive('mapTemp', ['$window', '$document', '$http', mapTempFactory])
        .directive('autoCompleteTemp', ['$window', '$http', autoCompleteTempFactory]);
    
    /**
      * Factory of google map's marker
      */
    function GetMarker(options) {
      
        return new g.maps.Marker({
            map: options['map'] || null,
            draggable: false,
            animation: google.maps.Animation.DROP || '',
            position: { lat: options['lat'], lng: options['lng'] }
        });
        
    };
    
    /**
      * Factory of google map's position
      *
      * @param {Float} lat
      * @param {Float} lng
      */
    function GetPosition(lat, lng) {
        return new g.maps.LatLng(lat || 0, lng || 0);
    }
    
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
            template: '<div class="filter" ng-transclude></div>',
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
            require: ['^mapTemp'],
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
    function mapTempCtrl($scope, GetPosition) {
        
        $scope.mapOptions = {
            center: {
                lat: parseFloat($scope.options.lat),
                lng: parseFloat($scope.options.lng),
            },
            zoom: $scope.options.zoom || 18
        };
        
        $scope.createMapContainer = createMapContainer;
        
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

        // Append map's container into element element
        $scope.mapContainer = $scope.createMapContainer();
        
        element[0].appendChild($scope.mapContainer);             
        
        initMap.call($scope, element);

    }
    
    /**
      * Creates map's container
      *
      * @return {Object} div
      */
    function createMapContainer() {
        
        var div = document.createElement('div');
        
        // Set the class
        div.className = "container";
        div.setAttribute('id', this.options.id);

        return div;
        
    }
    
    /**
      * Initializes Google map into map's content.
      *
      */
    function initMap(element) {
        this.map = new g.maps.Map(this.mapContainer, this.mapOptions);
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
        
        // Create autocomplete object
        $scope.autocomplete = new g.maps.places.Autocomplete(
            // Dom element
            element[0].getElementsByTagName('input')[0] || null,
            // Type
            { type: 'geocode' }
        );
        
        // Attach an event into autocomplete
        g.maps.event.addListener($scope.autocomplete, 'place_changed', function() {
            
            $scope.fillInAdress($scope);
            
        });

    }
    
    function fillInAdress($scope) {
        
        var place = this.autocomplete.getPlace(),
            $mapTempCtrl = $scope.$parent.$parent,
            lat = place.geometry.location.G,
            lng = place.geometry.location.K;
        
        console.log(lat + ' : ', lng);
        
        $mapTempCtrl.map.setCenter(GetPosition(lat, lng));
        
        // Drop pin
        $mapTempCtrl.currentMarker = GetMarker({
            map: $mapTempCtrl.map,
            lat: lat,
            lng: lng
        });
        
        

    }

}(angular, google));
