(function(ang, g) {
    
    var indexOfPacContainer = 0,
        Characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        labelIndex = 0;
    
    'use strict';
    ang.module('ang-google-maps', [])
        .factory('Map', function() { return MapFactory; })
        .factory('GetPosition', function() { return GetPosition; })
        .factory('GetMarker', function() { return GetMarker; })
        .factory('Geocode', function() { return Geocode(); })
        .factory('Direction', ['$q', '$rootScope', function($q, $rootScope) {
            var $DirectionService = new g.maps.DirectionsService,
                $DirectionDisplay = new g.maps.DirectionsRenderer({
                    draggable: true,
                    hideRouteList: true,
                    suppressMarkers: true
                    //infoWindow: new google.maps.InfoWindow
            });
 
            $DirectionDisplay.addListener('directions_changed', function(res) { 
                
                var $Directions = this.directions,
                    $Map = this.map,
                    $Leg = $Directions.routes[0].legs[0],
                    $ProcessedLeg = processLegs($Directions, $Map);

                if (typeof $Map.ondirectionchange == 'function') $Map.ondirectionchange({$Leg: $ProcessedLeg, $parentScope: $rootScope, $Directions: $Directions});

                $rootScope.$digest();

            });

            return Direction({
                $DirectionService: $DirectionService,
                $DirectionDisplay: $DirectionDisplay
            },$q);
        }])
        .directive('mapTemp', ['$window', '$document', '$http', mapTempFactory])
        .directive('autoCompleteTemp', ['$window', '$http', '$rootScope', autoCompleteTempFactory]);
    
    /**
      * Gets the overall paths from $Legs.
      */
    function getOverallPaths($Legs, $Options) {
        var $Legs = $Legs || [],
            $Options = $Options || {},
            $Paths = [];
        
        // First iteration on legs
        for ( var index = 0, length = $Legs.length; index < length; index++) {
        
            var $Steps = ('steps' in $Legs[index]) ? $Legs[index]['steps'] : [];
            
            
            // Second iteration on steps
            (function($S) {
                for (var index2 = 0, length2 = $S.length; index2 < length2; index2++) {

                    var $Path = ('path' in $S[index2]) ? $S[index2]['path'] : [];

                    // Third iteration on path
                    (function($P) {
                        
                        for (var index3 = 0, length3 = $P.length; index3 < length3; index3++) {
                            var $Data = $P[index3];
                            $Paths.push({
                                lat: (typeof $Data['lat'] == 'function') ? $Data['lat']() : $Data['lat'],
                                lng: (typeof $Data['lng'] == 'function') ? $Data['lng']() : $Data['lng']
                            });
                        }
                        
                    }($Path));

                }
            }($Steps));
            
            if ($Options['isSkipLast'] && index + 1 == length - 1) return $Paths;
            
            if (index + 1 == length) return $Paths;
        }
        
    }
    
    function processLegs($Directions, $Map) {
        
        var $Routes = $Directions.routes[0],
            $Legs = $Routes.legs,
            $Result = {waypoints: [], totalDuration: 0, totalDistance: 0};
        
        if (!$Legs.length) return $Results;
        
        $Result['current'] = {
            coords: $Legs[0]['start_location'],
            name: $Legs[0]['start_address'],
            next_coords: $Legs[0]['end_location'],
            next_name: $Legs[0]['end_address']
        };
        
        if ($Legs.length == 1) {
            $Result['destination'] = {
                coords: $Legs[0]['end_location'],
                name: $Legs[0]['end_address'],
                prev_coords: $Legs[0]['start_location'],
                prev_name: $Legs[0]['start_address']
            }
        } else {
            for (var index = 0, length = $Legs.length; index < length; index++) {

                if (index + 1 == length) { 
                    $Result['destination'] = {
                        coords: $Legs[index]['end_location'],
                        name: $Legs[index]['end_address'],
                        prev_coords: $Legs[index]['start_location'],
                        prev_name: $Legs[index]['start_address']
                    };
                } else {
                    $Result['waypoints'].push($Legs[index]);
                }

            }

            $Result['waypoints'] = $Result['waypoints'].reverse();
        }
        
        for (var index = 0, length = $Legs.length; index < length; index++) {
            if ($Map.isCurrentSameDestination && index + 1 == length) break;

            $Result['totalDistance'] += $Legs[index]['distance']['value'];
            $Result['totalDuration'] += $Legs[index]['duration']['value'];
        }

        return $Result;
        
    }

    /**
      * Factory of google map's marker
      */
    function MapFactory(options) {

        var $Map = new g.maps.Map(
            document.getElementById('main-map'),
            options
        );
        
        return $Map;

    }
    
    /**
      * Factory of google map's marker
      */
    function GetMarker(options) {

        return new g.maps.Marker({
            animation: google.maps.Animation.DROP,
            map: options['map'] || null,
            draggable: true,
            animation: google.maps.Animation.DROP || '',
            title: options['title'] || '',
            label: options['label'] || '',
            position: { lat: options['lat'], lng: options['lng'] },
            fillColor: '#cc1'
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
                configs: "=",
                ondirectionchange: "&ondirectionchange",
                onmapclick: "&onmapclick",
            },
            template: '<div class="filter" ng-transclude=""></div>',
            transclude: true,

        };

    }
    
    mapTempFactory.$inject = ['$window', '$document', '$http'];

    /**
      * Creates the factory of autoCompleteTemp.
      *
      * @param {Object} $window
      * @param {Object} $http
      */
    function autoCompleteTempFactory($window, $http, $rootScope) {

        return {

            controller: autoCompleteTempCtrl,
            link: function($scope, element, $atts, $ctrls) {
                
                autoCompleteTempLink.call(this, $scope, element, $atts, $ctrls, $rootScope);
                
            },
            scope: {
                map: '=map',
                nameofinput: '@',
                onfill: '&onfill',
                ondrop: '&ondrop',
                ondragstart: '&ondragstart',
                onmarkerclick: '&onmarkerclick',
                markerlabel: '@'
            }

        };

    }
    
    autoCompleteTempFactory.$inject = ['$window', '$http', '$rootScope'];

    /**
      * Handles map-temp directive's controller
      *
      * @param {Object} $scope
      */
    function mapTempCtrl($scope, GetPosition) {

        $scope.mapOptions = {
            center: {
                lat: parseFloat($scope.configs.lat),
                lng: parseFloat($scope.configs.lng),
            },
            zoom: $scope.configs.zoom || 18,
            scrollwheel: $scope.configs.scrollwheel || false,
            
        };

        $scope.createMapContainer = createMapContainer;

    }
    
    mapTempCtrl.$inject = ['$scope', 'GetPosition'];

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
        
        // Define Methods
        $scope.renderWithGeolocation = renderWithGeolocation;
        $scope.renderWithDefault = renderWithDefault;

        initMap.call($scope, element);

    }
    
    mapTempLink.$inject = ['$scope', 'element', 'attrs', 'ctrls'];

    /**
      * Creates map's container
      *
      * @return {Object} div
      */
    function createMapContainer() {

        var div = document.createElement('div');

        // Set the class
        div.className = "container";
        div.setAttribute('id', this.configs.id || '');

        return div;

    }
    
    function deletingMarker(name) {
        var markerName = name || '',
            indexOfMarker = (markerName) ? findByName(this.markers, markerName) : -1;
        
        if (indexOfMarker == -1) return;
        
        // Set marker into map null
        this.markers[indexOfMarker]['marker'].setMap(null);
        if(this['O'+name]) {
            this['O'+name].remove()
            delete this['O'+name];        
        }
    }
    
    /**
      * Extends maps's object.
      *
      * @param Object $Maps.
      */
    function ExtendsMaps($Maps) {
        
        var $Maps = $Maps || {},
            $RefMaps = { $Maps: $Maps };
        
        $RefMaps.searchMarkers = function(name) {
            
            var $Data = { code: -1 };
            
            for (var index = 0, length = this.$Maps.markers.length; index < length; index++) {
             
                if (this.$Maps.markers[index]['name'] == name) {
                    $Data = { code: index, $E: this.$Maps.markers[index], index: index };
                    break;
                }
                
            }
            
            return $Data;
            
        };
        
        // Attaches getOverallPaths into $Maps.
        $Maps.getOverallPaths = getOverallPaths;
        
        /**
          * Assign _$Marker service into map's object.
          */
        $Maps._$Marker = {
            get: function(name) {
                var $Query = $RefMaps.searchMarkers(name);
                
                if ($Query.code < 0) return -1;
                
                return $Query.$E;
            },
            delete: function(name) {
                try {
                    var $Query = $RefMaps.searchMarkers(name);
                    
                    if ($Query.code < 0) return false;
                    
                    if(typeof $Query.$E.marker == 'object') if(typeof $Query.$E.marker.setMap == 'function') $Query.$E.marker.setMap(null);
                    
                    setTimeout(function() {
                        if($RefMaps.$Maps.markers[$Query.index]['marker']) delete $RefMaps.$Maps.markers[$Query.index]['marker'];
                        $RefMaps.$Maps.markers.splice($Query.index, 1);
                    }, 1);
                
                    return true;
                } catch (error) {
                    return false;
                }
                
            },
            updateAll: function(callback) {
                
                var callback = callback || function() {};
                
                for (var index = 0, length = $RefMaps.$Maps.markers.length; index < length; index++) {
                 (function(i, $O) {
                     
                     callback($O);
                     
                 }(index, $RefMaps.$Maps.markers[index]))
                    
                }
                
            }
        };
        
        $Maps._$Polyline = {
            
            /**
              * Draws the polyline into the map.
              */
            draw: function() {
                
            },
            
            /**
              * Processes steps object.
              *
              * @param Array $Steps [{}, {}]
              *
              * @return Array $Paths [{lat: , lng: }, {lat: , lng: }]
              */
            processingSteps: function($Steps) {
                
                var $Steps = $Steps || undefined,
                    $Paths = [];
                
                if (!$Steps.length) throw new Error("$Steps can't be empty / undefined");
                
                for (var index = 0, length = $Steps.length; index < length; index++) {
                 
                    var $Path = (typeof $Steps[index] == 'object') ? $Steps[index]['path'] : undefined;
                    if (!$Path) throw new Error("$Path must be object");
                    
                    for (var index2 = 0, length2 = $Path.length; index2 < length2; index2++) {
                     
                        $Paths.push({
                            lat: (typeof $Path[index2]['lat'] == 'function') ? $Path[index2]['lat']() : $Path[index2]['lat'] || 0,
                            lng: (typeof $Path[index2]['lng'] == 'function') ? $Path[index2]['lng']() : $Path[index2]['lng'] || 0,
                        });
                        
                    }
                    
                }
                
                return $Paths;
                
            },
            
            /**
              * Gets the paths from the $Directions.
              *
              * @param Object $Directions
              * @param String latlng {32.49129291,8.23124124}
              *
              * @return Array $Paths.
              */
            getPaths: function($Directions, latlng) {
                
                var $Routes = $Directions.routes;
                
                if (!$Routes.length) throw new Error("Routes can't be empty / undefined @ getPaths method");
                
                var $Legs = ($Routes[0]) ? $Routes[0].legs : undefined;
                
                if (!$Legs.length) throw new Error("Legs can't be empty / undefined @ getPaths method");
                
                for (var index = 0 , length = $Legs.length; index < length; index++) {
                    
                    var $StartLocation = $Legs[index]['start_location'] || {};
                    
                    if ('start_location' in $Legs[index]) {
                     
                        var lat = (typeof $StartLocation.lat == 'function') ? $StartLocation.lat() : $StartLocation.lat || 0,
                            lng = (typeof $StartLocation.lng == 'function') ? $StartLocation.lng() : $StartLocation.lng || 0,
                            LatLng = lat + ',' + lng;
                        
                        if (latlng == LatLng) {
                            //console.log("Matched");
                            //console.log("Do Something");
                            return this.processingSteps($Legs[index]['steps']);
                        }
                        
                    }
                    
                }
                
            },
            
            /**
              * Gets the polyline's object.
              */
            getPolyline: function(name) {
                
                var $Data = { code: -1 };
                
                if ($Maps.O$polyline) {
                    if ($Maps.O$polyline[name]) $Data = { code: 1, $E: $Maps.O$polyline[name] };
                }
                    
                return $Data;
                
            },
            
            /**
              * Clears the polyline from the map.
              *
              * @param Object $Polyline.
              */
            clearPolyline: function($Polyline) {
                
                var $Polyline = $Polyline || {};
                
                if ('setMap' in $Polyline && typeof $Polyline.setMap == 'function' ) $Polyline.setMap(null);

            },
            
            /**
              * Draws the polyline into the map.
              *
              */
            addPolyline: function($Configs) {
                
                if ($Maps['O$polyline'][$Configs['name']]) {
                    $Maps['O$polyline'][$Configs['name']].setMap(null);
                    delete $Maps['O$polyline'][$Configs['name']];
                }
                
                var $Configs = $Configs || [],
                    $PathPolyline = new google.maps.Polyline({
                        path: $Configs['paths'] || [],
                        geodesic: $Configs['geodesic'] || true,
                        strokeColor: $Configs['strokeColor'] || '#19CA93',
                        strokeOpacity: $Configs['strokeOpacity'] || 1,
                        strokeWeight: $Configs['strokeWeight'] || 4,
                        map: $Maps,
                        zIndex: $Configs['zIndex'] || 1,
                    });
                
                if ($Configs['name']) $Maps['O$polyline'][$Configs['name']] = $PathPolyline;
 
                return $PathPolyline; 
            }

        };
        
    }
    
    function initMapModel() {
        window.map = this.$parent.map = this.map = new g.maps.Map(this.mapContainer, this.mapOptions);
               
        this.mapOptions['disableDefaultUI'] = true;
        
        this.map.markers = [];
        this.map.id = this.configs.id;
        this.map.location = {};
        this.map.O$polyline = {};
        this.map.addingMarker = addingMarker;
        this.map.ondirectionchange = this.ondirectionchange || undefined;
        //this.map.location = 
        // Attach deleting marker method into the map's object.
        this.map.deletingMarker = deletingMarker;

        attachMapEvents.call(this);
        ExtendsMaps(this.map);
    }
    
    // For incoming features
    function attachMapEvents() {
        
        var $Self = this;
        
        $Self.map.addListener('click', function($Event) {
            $Self.onmapclick({
                $Coords: $Event.latLng,
                $Pixel: $Event.pixel,
                $Za: $Event.za,
                $Event: $Event
            });
        });
        
        /*
        $Self.map.addListener('dblclick', function($Event) {
            // $Event.stopPropagation();
            console.log($Event);
            console.log("Double click");
        });
        */
    }
    
    function renderWithGeolocation($Position) {
        this.map.setCenter({
            lat: $Position.coords.latitude,
            lng: $Position.coords.longitude
        });
    }
    
    function renderWithDefault($Error) {
        this.map.setCenter({
            lat: 13.736717 ,
            lng: 100.523186
        });
    }
    
    /**
      * Initializes Google map into map's content.
      *
      */
    function initMap(element) {
        
        var $Obj = this;
    
        if ('geolocation' in navigator) {
            
            navigator.geolocation.getCurrentPosition(function($Position) {
                $Obj.renderWithGeolocation($Position); 
            }, function($Error) {
                $Obj.renderWithDefault($Error);
            });
            
        }

        initMapModel.call($Obj);

    }

    /**
      * Handles auto-complete-temp directive's controller
      *
      * @param {Object} $scope
      */
    function autoCompleteTempCtrl($scope) {
        $scope.model = { label: '', name: $scope.nameofinput, show: 0 };
        $scope.fillInAddress = fillInAddress; 
    }
    
    autoCompleteTempCtrl.$inject = ['$scope'];
    
    /**
      * Handles auto-complete-temp directive's link
      *
      * @param {Object} $scope
      * @param {Object} element
      * @param {Object} attrs
      * @param {Array} ctlrs
      */
    function autoCompleteTempLink($scope, element, attrs, ctrls, $rootScope) {

        // Create autocomplete object
        $scope.autocomplete = new g.maps.places.Autocomplete(
            // Dom element
            element[0] || null,
            // Type
            { type: 'geocode' }
        );
        
        $scope.element = element[0];     
        if($scope.element) $scope.element.setAttribute('pac-element-index', indexOfPacContainer);
        $rootScope[$scope['nameofinput']] = '';
        $rootScope.$watch($scope['nameofinput'], function(newValue, oldValue) {
            //console.log("Something is being changed");
            //console.log(arguments);
            if(newValue) $scope.element.value = newValue;
            return newValue;
        });
        
        setTimeout(function() {
            $scope.map["O" + $scope['nameofinput']] = $scope.element;
        }, 1);

        // Attach an event into autocomplete
        g.maps.event.addListener($scope.autocomplete, 'place_changed', function() {
            $scope.fillInAddress();
        });
        
        indexOfPacContainer += 1;
        
    }
    
    autoCompleteTempLink.$inject = ['$scope', 'element', 'attrs', 'ctrls'];
    
    function findInList(List, $Obj) {
        
        var List = List || [],
            $Obj = $Obj || {key: null, value: null};
        
        for (var index = 0, length = List.length; index < length; index++) {

            if ( List[index][$Obj['key']] == $Obj['value'] ) return index;
            
        }
        
        return -1;
        
    }
    
    function extendObj($Obj, $NewObj) {
        
        var $FormedObj = {};

        for (var item in $NewObj) {

            $FormedObj[item] = $NewObj[item];
            
        }
        
        for (var item in $Obj) {
            $FormedObj[item] = $Obj[item];
        }
        
        return $FormedObj;
        
    }
    
    function appendMarker(List, model) {
        
        var position = findInList(List || [], {key: 'name', value: model['name']}),
            index = position;

        if (position >= 0) {
            List[position] = extendObj(List[position], model);
        } else { List.push(model); index = List.length - 1;}
        
        return index;

    }

    function fillInAddress() {

        var place = this.autocomplete.getPlace(),
            lat = place.geometry.location.lat() || 0,
            lng = place.geometry.location.lng() || 0,
            $CtrlScope = this.$parent,
            $Self = this,
            $Position = { lat: parseFloat(lat), lng: parseFloat(lng) },
            indexOfMarker = findByName($Self.map.markers, $Self['model']['name']);
        
        if (indexOfMarker < 0) indexOfMarker = appendMarker($Self.map.markers, $Self['model']);

        try {
            $Self.map.panTo($Position);
            
            // Drop pin
            if(!$Self.map.markers[indexOfMarker]['marker']) {
                $Self.map.markers[indexOfMarker]['marker'] = GetMarker({
                    animation: google.maps.Animation.DROP,
                    map: $Self.map,
                    lat: lat,
                    lng: lng,
                    label: $Self['markerlabel'] || Characters[indexOfMarker],
                });
            } else {
                $Self.map.markers[indexOfMarker]['marker'].setMap($Self.map);
                $Self.map.markers[indexOfMarker]['marker'].setPosition({
                    lat: lat,
                    lng: lng
                });   
            }

            var $Marker = $Self.map.markers[indexOfMarker]['marker'];

            $Marker.addListener('dragend', function($Event) {
                if(typeof $Self.ondrop == 'function') $Self.ondrop({$Event: $Event, $Model: $Self.model, $AutoCompScope: $Self, $Marker: $Marker});
            });

            $Marker.addListener('dragstart', function($Event) {
                if(typeof $Self.ondragstart == 'function') $Self.ondragstart({$Event: $Event, $Model: $Self.model, $AutoCompScope: $Self, $Marker: $Marker});
            });

            $Marker.addListener('click', function($Event) {
                if (typeof $Self.onmarkerclick == 'function') $Self.onmarkerclick({$Event: $Event, $Model: $Self.model, $AutoCompScope: $Self, $Marker: $Marker});
            });

            // Push a new marker into markers list
            appendMarker($Self.map.markers, $Self.model);
            
        } catch (error) {
            console.log(error.message);
        }

        if(typeof $Self.onfill == 'function') $Self.onfill({$Position: $Position, $Model: $Self.model, $CoreModel: place, $Element: $Self.element, $Marker: $Marker});

    }

    function clearAllMarkers($map) {

        var $Markers = $map.markers || [];
        
        
        for (var index = 0, length = $Markers.length; index < length; index++) {
            if('marker' in $Markers[index]) $Markers[index]['marker'].setMap(null);
        }

    }
    
    function handleMakerClick($Event) {

        this.$InfoWindow = new g.maps.InfoWindow({
            content: this.model.name || ''
        });
        
        this.$InfoWindow.open(this.map, this.model.marker);
        
    }
    
    function findByName(list, name) {
        
        var list = list || [];
        
        for (var index = 0, length = list.length; index < length; index++) {
            
            if (list[index]['name'] == name) return index;
            
        }
        
        return -1;
        
    }

    function Direction(configs, $q) {

        var $DirectionService = configs['$DirectionService'],
            $DirectionDisplay = configs['$DirectionDisplay'];
        
        window.resetRoute = function() {
            $DirectionDisplay.setMap(null);
        };
        
        return {

            setRoute: function(options) {
                
                var $Defered = $q.defer();
                
                if (!g) return;
                
                if (options['map']) {

                    //clearAllMarkers(options['map']);

                    if (!$DirectionDisplay.getMap()) $DirectionDisplay.setMap(options['map']);

                    $DirectionService.route({

                        destination: (options['destination']) ? options['destination'] : { location: {lat: 0, lng: 0 }},
                        origin: (options['current']) ? options['current'] : { location: {lat: 0, lng: 0 }},
                        provideRouteAlternatives : (options['provideRouteAlternatives']) ? (options['provideRouteAlternatives']) : false,
                        optimizeWaypoints : (options['optimized']) ? options['optimized'] : false,
                        waypoints: (options['dropOffs']) ? options['dropOffs'] : [],
                        avoidHighways: (options['avoidHighways']) ? options['avoidHighways'] : false,
                        avoidTolls: (options['avoidTolls']) ? (options['avoidTolls']) : false,
                        travelMode: g.maps.TravelMode.DRIVING,
                        unitSystem: g.maps.UnitSystem.IMPERIAL

                    }, function(response, status) {

                        if (status == g.maps.DirectionsStatus.OK) {
                            // console.log(response);
                            $DirectionDisplay.setDirections(response);
                            $Defered.resolve(response);
                        } else {
                            $Defered.reject({
                                message: "There something wrong @ setRoute, please check if you pass appropriate parameters into this function",
                                code: 0
                            });
                        }

                    });

                }
                
                return $Defered.promise;

            },
            
            resetRoute: function(options) {
                $DirectionDisplay.setMap(null);
            }

        };

    }
        
    /**
      * Adds marker into map
      *
      * @param {Options}
      */
    function addingMarker(options) {

        var indexOfCurrentMarker = findInList(this.markers || [], {key: 'name', value: options['name'] || ''}),
            options = options || {},
            isOnDragStart = (typeof options['ondragstart'] == 'function'),
            isOnDragEndFunc = (typeof options['ondragend'] == 'function'),
            isOnInitFunc = (typeof options['oninit'] == 'function'),
            isOnClickFunc = (typeof options['onclick'] == 'function');
        
        if (indexOfCurrentMarker >= 0 && this.markers[indexOfCurrentMarker]['marker']) {
            
            var $Marker = this.markers[indexOfCurrentMarker]['marker'],
                isOnInitFunc = typeof options['oninit'] == 'function';
            
            $Marker.setPosition(options['position'] || {lat: 0, lng: 0});
            $Marker.setMap(this);
            if (isOnInitFunc) options['oninit']({latLng: options['position']}, $Marker);

            return;
        }
        
        var $Marker = new g.maps.Marker({
                path: 0,
                position: options['position'],
                draggable: true,
                animation: google.maps.Animation.DROP
            }),
            model = { name: options['name'], marker: $Marker };
        
        if (!$Marker.position) throw new Error("Ops, the position is not being passed")
        
        if (!model['name']) throw new Error('Please provide the name for the marker');
        
        if (isOnInitFunc) options['oninit']({latLng: options['position']}, $Marker);
        
        // Attach marker into the map
        $Marker.setMap(this);
        
        var indexOfMarker = appendMarker(this.markers, model);
        this.markers[indexOfMarker]['marker'].setLabel(options['markerlabel'] || Characters[indexOfMarker]);
        
        if (isOnDragEndFunc) $Marker.addListener('dragend', function($Event) {
            options['ondragend']($Event, $Marker);
        });
        
        if (isOnClickFunc) $Marker.addListener('click', function($Event) {
             //console.log('Clicking on the marker');
            options['onclick']($Event, $Marker);
        });
        
        if (isOnDragStart) $Marker.addListener('dragstart', function($Event) {
           options['ondragstart']($Event, $Marker); 
        });
        
    }

}(angular, google));
