import React, {useState, useEffect, createRef, useRef} from 'react';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from "@mapbox/mapbox-gl-draw";
// search control @mapbox/search-js-react
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

// css
import '../styles/components/map.css';
import '../styles/components/sidebar.css';
import '../styles/components/layerswitcher.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";


// api imports
import {fetchPoints, setHome, getHome} from "../services/message.service";

import {useAuth0} from "@auth0/auth0-react";

import { GoogleMap, LoadScript, StreetViewPanorama, StreetViewService } from '@react-google-maps/api';
// import ScriptLoaded from "@react-google-maps/api/src/docs/ScriptLoaded";

mapboxgl.accessToken = "pk.eyJ1Ijoid2NzaGFtYmxpbiIsImEiOiJjbGZ6bHhjdWIxMmNnM2RwNmZidGx3bmF6In0.Lj_dbKJfWQ6v9RxSC-twHw";

function Map() {
    const mapRef = useRef(null);
    const mapbox = useRef(null);
    const [displaySidebar, setDisplaySidebar] = useState(false);
    const [displayLayers, setDisplayLayers] = useState(false);
    const [selectedBaseLayer, setSelectedBaseLayer] = useState("Google Hybrid");
    const [selectedLayers, setSelectedLayers] = useState([]);
    const [streetViewActive, setStreetViewActive] = useState(false);
    const [displayStreetView, setDisplayStreetView] = useState(false);
    const [streetViewPosition, setStreetViewPosition] = useState([]);
    const [homeDraggable, setHomeDraggable] = useState(false);
    const [homeExists, setHomeExists] = useState(false);

    // determine if the user's local time is between 6pm and 6am
    const isNight = new Date().getHours() > 18 || new Date().getHours() < 6;
    // this will be used to adjust fog color later.
    console.log("isNight");
    console.log(isNight, new Date().getHours());

    const el = document.createElement('div');
    el.className = 'marker';

    el.style.backgroundImage = 'url(https://i.imgur.com/JCuIAqJ.png)';
    el.style.width = '25px';
    el.style.height = '25px';
    el.style.backgroundSize = '100%';

    const homeMarker = new mapboxgl.Marker(el, {
        draggable: true
    })
        .setLngLat([0, 0])

    homeMarker.on('dragend', homeDragEnd);

    homeMarker.setLngLat([-88, 35]);


    const baseLayers = {
        "Google Hybrid": {"visible": true},
        "Bing Hybrid": {"visible": false},
        "ESRI": {"visible": false},
        "OpenStreetMap": {"visible": false},
    }

    const layers = {
        "Decommissioned Towers": {"visible": false},
        "Safe Towers": {"visible": false},
        "Google StreetView": {"visible": false},
    }

    const [points, setPoints] = useState([]);

    const { getAccessTokenSilently } = useAuth0();

    const addSources = () => {
        mapbox.current.addSource('00', {
                'type': 'raster',
                'tiles': [
                    'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                    'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                    'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
                ],
                'tileSize': 256
            });
        mapbox.current.addSource('01', {
            'type': 'raster',
            'tiles': [
                'https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
                'https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
                'https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
                'https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z'
            ],
            'tileSize': 256
        });

        mapbox.current.addSource('02', {
            'type': 'raster',
            'tiles': [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            'tileSize': 256
        });

        mapbox.current.addSource('03', {
            'type': 'raster',
            'tiles': [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            'tileSize': 256
        });


        // add decom towers from file assets/geojson/decoms.geojson
        let decoms = require('./decoms.geojson');
        mapbox.current.addSource('Decommissioned Towers', {
            'type': 'geojson',
            'data': decoms
        });

        mapbox.current.addLayer({
            'id': 'Decommissioned Towers',
            'type': 'circle',
            'source': 'Decommissioned Towers',
            'paint': {
                'circle-radius': 6,
                'circle-color': ['get' , 'color'],
            }
        });


        // add safe towers from assets/decom-towers/safe_towers.geojson
        let safe_towers = require('./safe_towers.geojson');
        mapbox.current.addSource('Safe Towers', {
            'type': 'geojson',
            'data': safe_towers
        });

        mapbox.current.addLayer({
            'id': 'Safe Towers',
            'type': 'circle',
            'source': 'Safe Towers',
            'paint': {
                'circle-radius': 6,
                'circle-color': ['get', 'color'],
            }
        });

        // 3d towers, visibility should be false by default
        let decom_tower_extrusions = require('./decom_polygons.geojson');
        // extrude based on height
        mapbox.current.addSource('Decommissioned Tower Extrusions', {
            'type': 'geojson',
            'data': decom_tower_extrusions,
        });

        mapbox.current.addLayer({
            'id': 'Decommissioned Tower Extrusions',
            'type': 'fill-extrusion',
            'source': 'Decommissioned Tower Extrusions',
            'paint': {
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.8
            }
        });

        let safe_tower_extrusions = require('./safe_towers_polygons.geojson');
        // extrude based on height
        mapbox.current.addSource('Safe Tower Extrusions', {
            'type': 'geojson',
            'data': safe_tower_extrusions,
        });

        mapbox.current.addLayer({
            'id': 'Safe Tower Extrusions',
            'type': 'fill-extrusion',
            'source': 'Safe Tower Extrusions',
            'paint': {
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.8
            }
        });

        // make not visible by default
        mapbox.current.setLayoutProperty('Decommissioned Tower Extrusions', 'visibility', 'none');
        mapbox.current.setLayoutProperty('Safe Tower Extrusions', 'visibility', 'none');


        // google street view overlay should only be visible when zoom level is above 12
        mapbox.current.addSource('Google StreetView', {
            'type': 'raster',
            'tiles': [
                'https://mts2.google.com/mapslt?lyrs=svv&x={x}&y={y}&z={z}&w=256&h=256&hl=en&style=40,18'
            ],
            'tileSize': 256,
            'minzoom': 12
        });

        mapbox.current.addLayer({
            'id': 'Google StreetView',
            'type': 'raster',
            'source': 'Google StreetView',
            'paint': {}
        });


        // set not visible based on layers dict
        for (const [key, value] of Object.entries(layers)) {
            if (!value.visible) {
                mapbox.current.setLayoutProperty(key, 'visibility', 'none');
            }
        }

        // load points from api and add to the map
        // console.log("points");
        // console.log(points);
        // mapbox.current.addSource('PlacesToExplore', {
        //     'type': 'geojson',
        //     'data': {
        //         'type': 'FeatureCollection',
        //         'features': points
        //     }
        // });
        //
        // mapbox.current.addLayer({
        //     'id': 'PlacesToExplore',
        //     'type': 'circle',
        //     'source': 'PlacesToExplore',
        //     'paint': {
        //         // if the icon is special, make it bigger
        //         // I'll change this later to be prettier
        //         'circle-radius': ['case', ['==', ['get', 'special'], true], 10, 6],
        //         'circle-color': ['get', 'color'],
        //     }
        // });

        mapbox.current.addLayer(
            {
                'id': 'Google Hybrid',
                'type': 'raster',
                'source': '00',
                'paint': {}
            },
            'Google StreetView'
        );

        mapbox.current.addLayer(
            {
                'id': 'Bing Hybrid',
                'type': 'raster',
                'source': '01',
                'paint': {}
            },
            'Google StreetView'
        );

        mapbox.current.addLayer(
            {
                'id': 'ESRI',
                'type': 'raster',
                'source': '02',
                'paint': {}
            }
        );

        mapbox.current.addLayer(
            {
                'id': 'OpenStreetMap',
                'type': 'raster',
                'source': '03',
                'paint': {}
            },
            'Google StreetView'
        );


        // set the default layer to google hybrid
        mapbox.current.setLayoutProperty('Google Hybrid', 'visibility', 'visible');
        mapbox.current.setLayoutProperty('Bing Hybrid', 'visibility', 'none');
        mapbox.current.setLayoutProperty('ESRI', 'visibility', 'none');
        mapbox.current.setLayoutProperty('OpenStreetMap', 'visibility', 'none');
    }

    // api query
    useEffect(() => {
        const getPoints = async () => {
            const accessToken = await getAccessTokenSilently();
            const { data, error } = await fetchPoints(accessToken);
            if (data) {
                // need to extract the points array from the http Object
                setPoints(JSON.parse(data.points));
                console.log("data.points: ", data.points);
            }
            if (error) {
                console.log(error);
            }
        };
        // getPoints();
    }, []);

    useEffect(() => {
        if (points.length > 0) {
            addSources()
        }
    }, [points]);

    useEffect(() => {
        if (mapbox.current) return; // initialize map only once
        // initialize map
        let style = 'mapbox://styles/mapbox/streets-v11';
        if (isNight) {
            style = 'mapbox://styles/mapbox/dark-v10';
        }
        mapbox.current = new mapboxgl.Map({
                container: mapRef.current,
                style: style,
                projection: 'globe',
                center: [-74.5, 40],
                zoom: 4
            });

        mapbox.current.on('style.load', () => {
            if (isNight) {
                mapbox.current.setFog(
                    {
                        'range': [1, 2],
                        'horizon-blend': 0.3,
                        'color': '#242B4B',
                        'high-color': '#161B36',
                        'space-color': '#0B1026',
                        'star-intensity': .95
                    }
                )
            } else {
                mapbox.current.setFog(
                    {
                        'range': [1, 2],
                        'horizon-blend': 0.3,
                        'color': 'white',
                        'high-color': '#add8e6',
                        'space-color': '#d8f2ff',
                        'star-intensity': 0.0
                    }
                )
            }
            mapbox.current.addSource('mapbox-dem' , {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });
            mapbox.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5});
        });

        mapbox.current.on('load', () => {
            homeMarker.addTo(mapbox.current);
            addSources()
        });


            mapbox.current.on('click', 'Safe Towers', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const name = e.features[0].properties.name;
                const description = e.features[0].properties.description;
                console.log("description: ", description);


                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML("<text id='towerpopuptitle'>Safe tower: " + name + "</text><text id='towerpopuptext'>" + description + "</text>" + "<text id='popupcoords'>" + coordinates + "</text>")
                    .addTo(mapbox.current);
            });

            mapbox.current.on('mouseenter', 'Safe Towers', () => {
                mapbox.current.getCanvas().style.cursor = 'pointer';
            });

            mapbox.current.on('mouseleave', 'Safe Tower', () => {
                mapbox.current.getCanvas().style.cursor = '';
            });

            mapbox.current.on('click', 'Decommissioned Towers', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const name = e.features[0].properties.name;
                const description = e.features[0].properties.description;
                // convert to feet with 2 decimal places
                const height = (e.features[0].properties.height * 3.28084).toFixed(2);
                console.log("description: ", description);


                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(
                        "<text id='towerpopuptitle'>Decommisioned tower: " + name + "</text>" +
                        // "<text id='towerpopupstat'>height:</text>" +
                        "<text id='towerpopuptext'>" + description + "</text>" +
                        // "<text id='towerpopuptext'>ASR: " + "<a href='https://wireless2.fcc.gov/UlsApp/AsrSearch/asrRegistration.jsp?regKey='>" + e.features[0].name + "</a>" + "</text>" +
                        "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
                    .addTo(mapbox.current);
            });

            mapbox.current.on('mouseenter', 'Decommissioned Towers', () => {
                mapbox.current.getCanvas().style.cursor = 'pointer';
            });

            mapbox.current.on('mouseleave', 'Decommissioned Towers', () => {
                mapbox.current.getCanvas().style.cursor = '';
            });

            // on right click
            mapbox.current.on('contextmenu', (e) => {
                // make new popup with coordinates of right click
                let lat = e.lngLat.lat;
                let lng = e.lngLat.lng;
                let popup = new mapboxgl.Popup()
                    .setLngLat([lng, lat])
                    .setHTML("<text id='popupcoords'>" + lat + ", " + lng + "</text>")
                    .addTo(mapbox.current);
            });


        // on left click, if the Google StreetView layer is enabled, see if we can get a streetview image
        mapbox.current.on('click', (e) => {
            // zoom level must be above 12 to get a streetview image
            if (mapbox.current.getZoom() < 12) {
                console.log("zoom level too low");
                return;
            }
            console.log("click");

            // get the coordinates of the click
            let lat = e.lngLat.lat;
            let lng = e.lngLat.lng;
            console.log("lat: ", lat);
            console.log("lng: ", lng);


            setDisplayStreetView(true);
            setStreetViewPosition([lat, lng]);
        });




        // controls
        // geocoder
        mapbox.current.addControl(new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            marker: false,
            placeholder: 'Search for a location',
            countries: 'us',
            bbox: [-124.848974, 24.396308, -66.885444, 49.384358],
            proximity: {
                longitude: -95.712891,
                latitude: 37.090240
            },
            localGeocoder: coordinatesGeocoder,

        }), 'top-left');


        mapbox.current.addControl(new mapboxgl.NavigationControl(), 'top-left');
        mapbox.current.addControl(new mapboxgl.FullscreenControl(), 'top-left');
        mapbox.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
        mapbox.current.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true,
                timeout: 6000
            },
            trackUserLocation: true,
            showUserHeading: true
        }), 'top-left');

        // draw control
        mapbox.current.addControl(new MapboxDraw({
            displayControlsDefault: true,
            controls: {
                polygon: true,
                trash: true
            }
        }), 'top-left');

    }, [mapRef]);


    const coordinatesGeocoder = function (query) {
        // Match anything which looks like
        // decimal degrees coordinate pair.
        const matches = query.match(
            /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
        );
        if (!matches) {
            return null;
        }

        function coordinateFeature(lng, lat) {
            return {
                center: [lat, lng],
                geometry: {
                    type: 'Point',
                    coordinates: [lat, lng]
                },
                place_name: 'Lat: ' + lat + ' Lng: ' + lng,
                place_type: ['coordinate'],
                properties: {},
                type: 'Feature'
            };
        }

        const coord1 = Number(matches[1]);
        const coord2 = Number(matches[2]);
        const geocodes = [];

        if (coord1 < -90 || coord1 > 90) {
            // must be lng, lat
            geocodes.push(coordinateFeature(coord1, coord2));
        }

        if (coord2 < -90 || coord2 > 90) {
            // must be lat, lng
            geocodes.push(coordinateFeature(coord2, coord1));
        }

        if (geocodes.length === 0) {
            // else could be either lng, lat or lat, lng
            geocodes.push(coordinateFeature(coord1, coord2));
            geocodes.push(coordinateFeature(coord2, coord1));
        }

        return geocodes;
    };


    const getSidebar = () => {  
        if (!mapbox.current) return; // wait for map to initialize

        return (
            <div id="sidebar">
                <div id="sidebar-content">
                    <text id="sidebar-content-header">Home controls:</text>
                    <button id="set-home-button" onClick={() => {
                        //center
                        homeMarker.setLngLat([0, 0]);
                    }}>Set home</button>
                </div>
            </div>
        )
    }

    const getStreetView = () => {
        let lat = streetViewPosition[0];
        let lng = streetViewPosition[1];

        if (!mapbox.current) {
            setDisplayStreetView(false);
            return;
        }
        if (!streetViewPosition.length) {
            setDisplayStreetView(false);
            return;
        }
        if (mapbox.current.getLayoutProperty('Google StreetView', 'visibility') !== 'visible') {
            setDisplayStreetView(false);
            return;
        }

        // // check if streetview is available within 50 feet of the click
        const onLoad = (streetViewService) => {
            streetViewService.getPanorama({
                location: { lat: lat, lng: lng },
                radius: 50,
            } , (data, status) => {
                if (status === "OK") {
                    console.log("streetview available");
                    setDisplayStreetView(true);
                    setStreetViewActive(true);
                } else {
                    console.log("streetview not available");
                    setDisplayStreetView(false);
                    setStreetViewActive(false);
                }
            });
        }

            return (
            <div id="streetview" style={{ display: streetViewActive ? "block" : "none" }}>
                <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                        mapContainerStyle={{ height: "100%", width: "100%" }}
                        center={{ lat: lat, lng: lng }}
                        zoom={14}
                    >
                        <StreetViewService onLoad={onLoad} />
                        <StreetViewPanorama
                            position={{ lat: lat, lng: lng }}
                            visible={displayStreetView}
                            // turn off all controls
                            options={{
                                addressControl: false,
                                fullscreenControl: false,
                                linksControl: false,
                                motionTrackingControl: false,
                                motionTrackingControlOptions: false,
                                panControl: false,
                                zoomControl: false,
                                enableCloseButton: false
                            }}
                            // heading and pitch
                            pov={{
                                heading: 0,
                                pitch: 0
                            }}
                        />
                    </GoogleMap>
                </LoadScript>
                <button id="closestreetview" onClick={() => { setDisplayStreetView(false)
                    setStreetViewActive(false);
                    setStreetViewPosition([]) }}>X</button>
            </div>
        )
    }


    const getLayers = () => {
        if (!mapbox.current) return; // wait for map to initialize

        return (
            <div id="layerswitchermenu">
                <h4 id="layerstitle">Baselayers</h4>
                <div id="baselayers">
                    {Object.keys(baseLayers).map(layerId => (
                        <>
                            <a href="#" id={layerId} className={selectedBaseLayer == layerId ? "active" : ""} onClick={e => handleBaseLayerClick(e, layerId)}>{layerId}</a>
                        </>
                    ))}
                </div>
                <h4 id="layerstitle">Layers</h4>
                <div id="layers">
                    {Object.keys(layers).map(layerId => (
                        <>
                            <a href="#" id={layerId} className={selectedLayers.includes(layerId) ? "active" : ""} onClick={e => handleLayerClick(e, layerId)}>{layerId}</a>
                        </>
                    ))}
                </div>
            </div>
        );
    }


    const handleBaseLayerClick = (e, clickedLayerId) => {
        e.preventDefault();
        e.stopPropagation();

        var visibility = mapbox.current.getLayoutProperty(clickedLayerId, 'visibility');

        if (visibility === 'visible') {
            mapbox.current.setLayoutProperty(clickedLayerId, 'visibility', 'none');
            setSelectedBaseLayer("");
        } else {
            // turn off all other layers
            setSelectedBaseLayer(clickedLayerId);
            mapbox.current.setLayoutProperty(clickedLayerId, 'visibility', 'visible');
            Object.keys(baseLayers).forEach(layerId => {
                if (layerId == clickedLayerId) return;
                mapbox.current.setLayoutProperty(layerId, 'visibility', 'none');
            })
        }
    }

    const handleLayerClick = (e, clickedLayerId) => {
        e.preventDefault();
        e.stopPropagation();

        var visibility = mapbox.current.getLayoutProperty(clickedLayerId, 'visibility');

        if (visibility === 'visible') {
            // if click on Decom towers, then turn on Decom tower extrusions as well
            if (clickedLayerId == "Decommissioned Towers") {
                mapbox.current.setLayoutProperty("Decommissioned Tower Extrusions", 'visibility', 'none');
            }

            // same thing for safe towers
            if (clickedLayerId == "Safe Towers") {
                mapbox.current.setLayoutProperty("Safe Tower Extrusions", 'visibility', 'none');
            }

            mapbox.current.setLayoutProperty(clickedLayerId, 'visibility', 'none');
            setSelectedLayers(selectedLayers.filter(layerId => layerId != clickedLayerId));
        }
        else {
            // if click on Decom towers, then turn on Decom tower extrusions as well
            if (clickedLayerId == "Decommissioned Towers") {
                mapbox.current.setLayoutProperty("Decommissioned Tower Extrusions", 'visibility', 'visible');
            }

            // same thing for safe towers
            if (clickedLayerId == "Safe Towers") {
                mapbox.current.setLayoutProperty("Safe Tower Extrusions", 'visibility', 'visible');
            }

            mapbox.current.setLayoutProperty(clickedLayerId, 'visibility', 'visible');
            setSelectedLayers([...selectedLayers, clickedLayerId]);
        }
    }

    function homeDragEnd() {
        // set home location in database
        setHome(homeMarker.getLngLat().lng, homeMarker.getLngLat().lat).then(() => {
            console.log("home location set");
        });
    }


        const makeHome = async (homeMarker) => {
            const accessToken = await getAccessTokenSilently();
            console.log("calling gethome with lat: ", homeMarker.getLngLat().lat, " and lng: ", homeMarker.getLngLat().lng);
            const {data, error} = await getHome(accessToken, homeMarker.getLngLat().lat, homeMarker.getLngLat().lng);
            if (data) {
                console.log("Home data retrieved: ", data);

                homeMarker.setLngLat([data.lng, data.lat]);
            } else {
                console.log("Error retrieving home data: ", error);
                console.log("Setting home to map center.")
                // add new marker at map center
                console.log("Home marker: ", homeMarker);
                homeMarker.setLngLat(mapbox.current.getCenter());
                homeMarker.remove();
            }
            homeMarker.remove();
        };

    // escape key handling
    useEffect(() => {
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                // first try to close streetview, if we can then return
                if (displayStreetView) {
                    setDisplayStreetView(false);
                    setStreetViewActive(false);
                    setStreetViewPosition([]);
                    return;
                }

                // then try to close sidebar, if we can then return
                if (displaySidebar) {
                    setDisplaySidebar(false);
                    return;
                }
            }
        }
        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener('keydown', handleKeydown);
        }
    }, [displaySidebar, displayStreetView]);

    return (
        // <ReactMapGL
        //     mapboxAccessToken="pk.eyJ1Ijoid2NzaGFtYmxpbiIsImEiOiJjbGZ6bHhjdWIxMmNnM2RwNmZidGx3bmF6In0.Lj_dbKJfWQ6v9RxSC-twHw"
        //     mapStyle="mapbox://styles/mapbox/satellite-v9"
        //     {...viewport}
        //     onMove={evt => setViewport(evt.viewport)}
        // />

        // sidebar control
        <>
            <div id="map" ref={mapRef}>
                <button id="layerswitcherbutton">LayerSwitcher</button>
                <button id="sidebarbutton"  onClick={() => setDisplaySidebar(!displaySidebar)}>Sidebar</button>
            </div>
            {displaySidebar ? getSidebar() : ""}
            {displayLayers ? getLayers() : ""}
            {displayStreetView ? getStreetView() : ""}
        </>
    );
}

export default Map;