import React, {useState, useEffect, createRef, useRef} from 'react';
import ReactDOM from 'react-dom/client';


import mapboxgl from 'mapbox-gl';
import MapboxDraw from "@mapbox/mapbox-gl-draw";
// search control @mapbox/search-js-react
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import ShadeMap from 'mapbox-gl-shadow-simulator';

import DateTimePicker from 'react-datetime-picker'

// css
import '../styles/components/map.css';
import '../styles/components/sidebar.css';
import '../styles/components/layerswitcher.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import 'react-datetime-picker/dist/DateTimePicker.css';


// api imports
import {fetchPoints, setHome, retrieveHome, retrieveTowers, retrieveAntennas} from "../services/message.service";

import {useAuth0} from "@auth0/auth0-react";

import { GoogleMap, LoadScript, StreetViewPanorama, StreetViewService } from '@react-google-maps/api';
// import ScriptLoaded from "@react-google-maps/api/src/docs/ScriptLoaded";

mapboxgl.accessToken = "pk.eyJ1Ijoid2NzaGFtYmxpbiIsImEiOiJjbGZ6bHhjdWIxMmNnM2RwNmZidGx3bmF6In0.Lj_dbKJfWQ6v9RxSC-twHw";

function Map() {
    const { getAccessTokenSilently } = useAuth0();

    const mapRef = useRef(null);
    const mapbox = useRef(null);

    const [displaySidebar, setDisplaySidebar] = useState(false);

    const [displayLayers, setDisplayLayers] = useState(false);
    const [selectedBaseLayer, setSelectedBaseLayer] = useState("Google Hybrid");
    const [selectedLayers, setSelectedLayers] = useState([]);

    const [streetViewActive, setStreetViewActive] = useState(false);
    const [displayStreetView, setDisplayStreetView] = useState(false);
    const [streetViewPosition, setStreetViewPosition] = useState([]);

    const [homeIsSet, setHomeIsSet] = useState(false);
    const [homeMarker, setHomeMarker] = useState(null);
    const [homeMarkerPosition, setHomeMarkerPosition] = useState([]);

    const [isoProfile, setIsoProfile] = useState("driving");
    const [isoMinutes, setIsoMinutes] = useState("45");
    const [showIso, setShowIso] = useState(false);

    const [sunburstHomeInfo, setSunburstHomeInfo] = useState(null);
    const [showShadeMap, setShowShadeMap] = useState(false);

    const [allTowersPoints, setAllTowersPoints] = useState(null);
    const [allTowerPolygons, setAllTowerPolygons] = useState(null);

    const [antennaPoints, setAntennaPoints] = useState(null);

    const [mapDatetime, setMapDatetime] = useState(new Date());

    const shadeMap = new ShadeMap({
        date: new Date(),    // display shadows for current date
        color: '#0f1624',    // shade color
        opacity: 0.7,        // opacity of shade color
        apiKey: process.env.REACT_APP_SHADE_MAP_API_KEY,
        terrainSource: {
            tileSize: 256,       // DEM tile size
            maxZoom: 15,         // Maximum zoom of DEM tile set
            getSourceUrl: ({ x, y, z }) => {
                // return DEM tile url for given x,y,z coordinates
                return `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`
            },
            getElevation: ({ r, g, b, a }) => {
                // return elevation in meters for a given DEM tile pixel
                return (r * 256 + g + b / 256) - 32768
            }
        },
        debug: (msg) => { console.log(new Date().toISOString(), msg) },
    })

    const [shadeMapObject, setShadeMapObject] = useState(shadeMap);



    // determine if the user's local time is between 6pm and 6am
    const isNight = new Date().getHours() > 18 || new Date().getHours() < 6;
    // this will be used to adjust fog color later.
    console.log("isNight");
    console.log(isNight, new Date().getHours());


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
        "3D Buildings": {"visible": false},
        "Shade Map": {"visible": false},
        "All Towers": {"visible": false},
        "All Tower Extrusions": {"visible": false},
        "Antennas": {"visible": false},
    }

    const [points, setPoints] = useState([]);

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

        // all towers source
        mapbox.current.addSource('All Towers', {
            'type': 'geojson',
            'data': allTowersPoints
        });

        // all towers layer
        mapbox.current.addLayer({
            'id': 'All Towers',
            'type': 'circle',
            'source': 'All Towers',
            'minzoom': 14,
            'paint': {
                'circle-radius': 6,
                'circle-color': ['get' , 'color'],
            }
        });

        // all towers extrusion source
        mapbox.current.addSource('All Tower Extrusions', {
            'type': 'geojson',
            'data': allTowerPolygons
        });

        // all towers extrusion layer
        mapbox.current.addLayer({
            'id': 'All Tower Extrusions',
            'type': 'fill-extrusion',
            'source': 'All Tower Extrusions',
            'minzoom': 14,
            'paint': {
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-height': ['get', 'overall_height'],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.8
            }
        });

        // antennas source
        mapbox.current.addSource('Antennas', {
            'type': 'geojson',
            'data': antennaPoints
        });

        mapbox.current.loadImage('https://i.imgur.com/s2Wgdgx.png', (error, image) => {
            if (error) throw error;
            mapbox.current.addImage('transmitter-icon', image, { sdf: true });
        });


        // antennas layer
        mapbox.current.addLayer({
            'id': 'Antennas',
            'type': 'symbol',
            'layout': {
                'icon-image': 'transmitter-icon',
                'icon-size': 1,
            },
            'source': 'Antennas',
            'minzoom': 14,
            'paint': {
                'icon-color': ['get', 'color'],
            }
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
            'minzoom': 14,
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
            'minzoom': 14,
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

        // 3d buildings layer
        mapbox.current.addLayer(
            {
                'id': '3D Buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 15,
                'paint': {
                    'fill-extrusion-color': '#404040',
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.87
                }
            },
        );


        // isochrone source
        mapbox.current.addSource('Isochrone', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
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
        );

        mapbox.current.addLayer(
            {
                'id': 'Bing Hybrid',
                'type': 'raster',
                'source': '01',
                'paint': {}
            },
        );

        mapbox.current.addLayer(
            {
                'id': 'ESRI',
                'type': 'raster',
                'source': '02',
                'paint': {}
            },
        );

        mapbox.current.addLayer(
            {
                'id': 'OpenStreetMap',
                'type': 'raster',
                'source': '03',
                'paint': {}
            },
        );

        mapbox.current.addLayer(
            {
                'id': 'Isochrone',
                'type': 'fill',
                'source': 'Isochrone',
                'paint': {
                    'fill-color': '#5a3fc0',
                    'fill-opacity': 0.4
                }
            },
        );


        // set the default layer to google hybrid
        mapbox.current.setLayoutProperty('Google Hybrid', 'visibility', 'visible');
        mapbox.current.setLayoutProperty('Bing Hybrid', 'visibility', 'none');
        mapbox.current.setLayoutProperty('ESRI', 'visibility', 'none');
        mapbox.current.setLayoutProperty('OpenStreetMap', 'visibility', 'none');

        // layer hierarchies... streetview and isochrone should be on top.
        mapbox.current.moveLayer('Isochrone');
        mapbox.current.moveLayer('Google StreetView');
        mapbox.current.moveLayer('PlacesToExplore');
        mapbox.current.moveLayer('All Towers');
        mapbox.current.moveLayer('Antennas');
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
                        'range': [3, 4],
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
                        'range': [3, 4],
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
            if (homeIsSet) {
                homeMarker.addTo(mapbox.current);
            }
            addSources();
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

            // mapbox.current.on('mouseenter', 'Safe Towers', () => {
            //     mapbox.current.getCanvas().style.cursor = 'pointer';
            // });
            //
            // mapbox.current.on('mouseleave', 'Safe Tower', () => {
            //     mapbox.current.getCanvas().style.cursor = '';
            // });

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

            mapbox.current.on('click', 'All Towers', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const name = e.features[0].properties.name;
                // convert to feet with 2 decimal places
                const overall_height = (e.features[0].properties.overall_height * 3.28084).toFixed(2);
                const support_height = (e.features[0].properties.height_support * 3.28084).toFixed(2);
                const structure_type = e.features[0].properties.structure_type;
                const description = "Overall height: " + overall_height + " ft" + "<br>" + "Support height: " + support_height + " ft";


                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(
                        "<text id='towerpopuptitle'>Tower: " + name + "</text>" +
                        // "<text id='towerpopupstat'>height:</text>" +
                        "<text id='towerpopuptext'>" + description + "<br>" +
                        "Structure type: " + structure_type + "</text>" +
                        "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
                    .addTo(mapbox.current);
            });

            mapbox.current.on('click', 'Antennas', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const name = e.features[0].properties.name;
                const transmitter_type = e.features[0].properties.transmitter_type;
                const facility_id = e.features[0].properties.facility_id;
                const erp = e.features[0].properties.erp;
                const status = e.features[0].properties.status;
                const last_update = e.features[0].properties.last_update;
                let description = "";

                if (transmitter_type === "TV") {
                    // display safe zone
                    description = "Transmitter type: " + transmitter_type + "<br>" +
                        "Facility ID: " + facility_id + "<br>" +
                        "Status: " + status + "<br>" +
                        "Channel: " + e.features[0].properties.channel + "<br>" +
                        "ERP: " + erp + " kW" + "<br>" +
                        "Polarization: " + e.features[0].properties.polarization + "<br>" +
                        "Height AGL: " + e.features[0].properties.height_agl + " ft" + "<br>" +
                        "Safe zone controlled: " + e.features[0].properties.safe_distance_controlled_feet + " ft" + "<br>" +
                        "Safe zone uncontrolled: " + e.features[0].properties.safe_distance_uncontrolled_feet + " ft" + "<br>" +
                        "RabbitEars: " + "<a href='" + e.features[0].properties.RabbitEars + "'>" + facility_id + "</a>" + "<br>" +
                        "Last updated: " + last_update;
                } else if (transmitter_type === "FM") {
                    description = "Transmitter type: " + transmitter_type + "<br>" +
                        "Facility ID: " + facility_id + "<br>" +
                        "Status: " + status + "<br>" +
                        "Channel: " + e.features[0].properties.channel + "<br>" +
                        "ERP: " + erp + " kW" + "<br>" +
                        "Polarization: " + e.features[0].properties.polarization + "<br>" +
                        "Height AGL: " + e.features[0].properties.height_agl + " ft" + "<br>" +
                        "Safe zone controlled: " + e.features[0].properties.safe_distance_controlled_feet + " ft" + "<br>" +
                        "Safe zone uncontrolled: " + e.features[0].properties.safe_distance_uncontrolled_feet + " ft" + "<br>" +
                        "Last updated: " + last_update;
                } else if (transmitter_type === "AM") {
                    description = "Transmitter type: " + transmitter_type + "<br>" +
                        "Application ID: " + facility_id + "<br>" +
                        "Status: " + status + "<br>" +
                        "Nominal power: " + erp + " kW" + "<br>" +
                        "Hours of operation: " + e.features[0].properties.hours_operation + "<br>" +
                        "Towers in array: " + e.features[0].properties.towers_in_array + "<br>" +
                        "Safe zone controlled: 🕱" + "<br>" +
                        "Safe zone uncontrolled: 🕱" + "<br>" +
                        "Last updated: " + last_update;
                }


                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(
                        "<text id='towerpopuptitle'>Antenna: " + name + "</text>" +
                        // "<text id='towerpopupstat'>height:</text>" +
                        "<text id='towerpopuptext'>" + description + "</text>" +
                        // "<text id='towerpopuptext'>ASR: " + "<a href='https://wireless2.fcc.gov/UlsApp/AsrSearch/asrRegistration.jsp?regKey='>" + e.features[0].name + "</a>" + "</text>" +
                        "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
                    .addTo(mapbox.current);
            });


            // on left click
            mapbox.current.on('click', (e) => {
                let lat = e.lngLat.lat;
                let lng = e.lngLat.lng;

                if (mapbox.current.getLayoutProperty('Google StreetView', 'visibility') !== 'visible') {
                    console.log("street view not visible");
                    return;
                }

                // zoom level must be above 12 to get a streetview image
                if (mapbox.current.getZoom() < 12) {
                    console.log("zoom level too low");
                    return;
                }

                setDisplayStreetView(true);
                setStreetViewPosition([lat, lng]);

            });

            // on right click
            mapbox.current.on('contextmenu', (e) => {
                // make new popup with coordinates of right click
                let lat = e.lngLat.lat;
                let lng = e.lngLat.lng;

                console.log("right click at: ", lat, lng);
                // make popup
                const placeholder = document.createElement('div');
                ReactDOM.createRoot(placeholder).render(<button onClick={() => {
                    setHomePosition(lat, lng);
                    // close popup
                    popup.remove();
                }}>Set Home</button>);

                const popup = new mapboxgl.Popup({closeButton: true, closeOnClick: true})
                    .setLngLat([lng, lat])
                    .setDOMContent(placeholder)
                    .addTo(mapbox.current);
            });

            // on move, if zoom is above 14, try to update towers and / or antennas
            mapbox.current.on('moveend', () => {
                if (mapbox.current.getZoom() >= 14) {
                    if (mapbox.current.getLayoutProperty('All Towers', 'visibility') === 'visible') {
                        // update all towers from the center of the map
                        updateAllTowers(mapbox.current.getCenter().lat, mapbox.current.getCenter().lng);
                    }

                    if (mapbox.current.getLayoutProperty('Antennas', 'visibility') === 'visible') {
                        // update decommissioned towers from the center of the map
                        updateAntennas(mapbox.current.getCenter().lat, mapbox.current.getCenter().lng);
                    }
                }
            });

            mapbox.current.on('zoomout')

        // controls
        // geocoder
        mapbox.current.addControl(new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            marker: {
                color: 'orange'
            },
            placeholder: 'Search for a location',
            // countries: 'us',
            bbox: [-180.0, -90.0, 180.0, 90],
            // use the center of the map as the proximity
            proximity: {
                longitude: mapbox.current.getCenter().longitude,
                latitude: mapbox.current.getCenter().latitude
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
                center: [lng, lat],
                geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                place_name: lat + ', ' + lng,
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
                    {homeIsSet ? getHomeMetrics() : ""}

                    <h4>Map date time selector</h4>
                    <DateTimePicker
                        onChange={setMapDatetime}
                        value={mapDatetime}
                    />

                    <h4>Show towers</h4>
                    <button onClick={() => {
                        if (mapbox.current.getLayoutProperty('All Towers', 'visibility') === 'visible') {
                            mapbox.current.setLayoutProperty('All Towers', 'visibility', 'none');
                            mapbox.current.setLayoutProperty('Antennas', 'visibility', 'none');
                            mapbox.current.setLayoutProperty('All Tower Extrusions', 'visibility', 'none');        // set visibility of 3d buildings to true by default
                            mapbox.current.setLayoutProperty('3D Buildings', 'visibility', 'none');
                        } else {
                            mapbox.current.setLayoutProperty('All Towers', 'visibility', 'visible');
                            mapbox.current.setLayoutProperty('Antennas', 'visibility', 'visible');
                            mapbox.current.setLayoutProperty('All Tower Extrusions', 'visibility', 'visible');
                            mapbox.current.setLayoutProperty('3D Buildings', 'visibility', 'visible');
                        }
                    }}>Show All Towers</button>


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
                radius: 20,
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

    const updateAllTowers = async (lat, lng) => {
        const accessToken = await getAccessTokenSilently();
        console.log("updateAllTowers");
        await retrieveTowers(accessToken, lat, lng, 5000).then(
            (response) => {
                setAllTowerPolygons(response.data.towers_polygons);
                setAllTowersPoints(response.data.towers_points);
            }
        )
    }

    const updateAntennas = async(lat, lng) => {
        const accessToken = await getAccessTokenSilently();
        await retrieveAntennas(accessToken, lat, lng, 5000).then(
            (response) => {
                setAntennaPoints(response.data.antennas);
            }
        )
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
            // if All Towers then turn off
            if (clickedLayerId === "All Towers") {
                // turn off all tower extrusions
                mapbox.current.setLayoutProperty("All Tower Extrusions", 'visibility', 'none');
            }

            // if click on Decom towers, then turn on Decom tower extrusions as well
            if (clickedLayerId === "Decommissioned Towers") {
                mapbox.current.setLayoutProperty("Decommissioned Tower Extrusions", 'visibility', 'none');

                // also turn off All Towers
                mapbox.current.setLayoutProperty("All Towers", 'visibility', 'none');
            }

            // same thing for safe towers
            if (clickedLayerId === "Safe Towers") {
                mapbox.current.setLayoutProperty("Safe Tower Extrusions", 'visibility', 'none');
            }

            if (clickedLayerId === "Shade Map") {
                setShowShadeMap(false);
                return;
            }

            mapbox.current.setLayoutProperty(clickedLayerId, 'visibility', 'none');
            setSelectedLayers(selectedLayers.filter(layerId => layerId !== clickedLayerId));
        }
        else {
            // if click on All Towers, then turn on All tower extrusions as well as disabling all other towers so we don't have overlapping extrusions
            if (clickedLayerId === "All Towers") {
                // turn on all tower extrusions
                mapbox.current.setLayoutProperty("All Tower Extrusions", 'visibility', 'visible');

                // turn off all other towers
                mapbox.current.setLayoutProperty("Decommissioned Towers", 'visibility', 'none');
                mapbox.current.setLayoutProperty("Safe Towers", 'visibility', 'none');

                // along with their extrusions
                mapbox.current.setLayoutProperty("Decommissioned Tower Extrusions", 'visibility', 'none');
                mapbox.current.setLayoutProperty("Safe Tower Extrusions", 'visibility', 'none');
            }

            // if click on Decom towers, then turn on Decom tower extrusions as well
            if (clickedLayerId === "Decommissioned Towers") {
                mapbox.current.setLayoutProperty("Decommissioned Tower Extrusions", 'visibility', 'visible');
            }

            // same thing for safe towers
            if (clickedLayerId === "Safe Towers") {
                mapbox.current.setLayoutProperty("Safe Tower Extrusions", 'visibility', 'visible');
            }

            if (clickedLayerId === "Shade Map") {
                setShowShadeMap(true);
                return;
            }

            mapbox.current.setLayoutProperty(clickedLayerId, 'visibility', 'visible');
            setSelectedLayers([...selectedLayers, clickedLayerId]);
        }
    }

    // isochrone API fetch
    useEffect(() => {
        console.log("useEffect for isochrone");
        if (!mapbox.current) return; // wait for map to initialize
        // if homemarker position is not set (length is less than 2), then don't do anything
        if (homeMarkerPosition.length < 2) {
            console.log("homeMarkerPosition not set");
            return;
        }
        // if we aren't showing the isochrone, then remove it's data from the map
        if (!showIso) {
            // if the source doesn't exist, then don't do anything
            if (!mapbox.current.getSource('Isochrone')) return;
            mapbox.current.getSource('Isochrone').setData({
                "type": "FeatureCollection",
                "features": []
            });

            return;
        }

        getIso().then((data) => {
            console.log(data)
            mapbox.current.getSource('Isochrone').setData(data);
        });
    }, [homeMarkerPosition, isoMinutes, isoProfile, showIso]);



    // curl https://dev.virtualearth.net/REST/v1/Routes/Isochrones\?waypoint\=47.65431,-122.1291891\&maxTime\=\7200\&key\=AsFnJ6P5VNWfmjEsdjkH2SJjeIwplOKzfdiewwZCX7jBUX7ixSp64VfDjw6mMzBz
    async function getIso() {

        const query = await fetch(
            `https://dev.virtualearth.net/REST/v1/Routes/Isochrones?waypoint=${homeMarkerPosition[1]},${homeMarkerPosition[0]}&maxTime=${isoMinutes * 60}&travelMode=${isoProfile}&key=${process.env.REACT_APP_BING_MAPS_API_KEY}`,
            {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                }
            }
        );
        let data = await query.json();
        let coordinates = data.resourceSets[0].resources[0].polygons[0].coordinates;
        // for coordinate in coordinates, reverse the order of the coordinates
        coordinates = coordinates.map((coordinate) => {
            return coordinate.map((point) => {
                return [point[1], point[0]];
            })
        })

        data = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "Polygon",
                        // test sample of coordinates
                        "coordinates": coordinates
                    }
                }
            ]
        }
        return data;
    }

    // shade map useEffect for adding and removing the shade map
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!showShadeMap) {
            console.log("removing shade map");
            shadeMapObject.remove();
        }
        else {
            shadeMapObject.addTo(mapbox.current);
        }

    }, [showShadeMap]);

    // shade map useEffect that updates when the general map time is updated
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!showShadeMap) return;
        shadeMapObject.setDate(mapDatetime);
    }, [mapDatetime]);

    // retrieve home and put it on the map if it exists
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize

        const getHome = async () => {
            // get access token
            const accessToken = await getAccessTokenSilently();

            return await retrieveHome(accessToken);
        }

        // if we got a home, set it on the map
        getHome().then((home) => {
            if (homeIsSet) return; // don't do anything if we already have a home set

            try {
                home = home.data.home;
            } catch (e) {
                console.log("No home retrieved");
                return;
            }
            console.log("Home retrieved: lat: ", home["lat"], " lng: ", home["lng"]);

            const el = document.createElement('div');
            el.className = 'marker';

            el.style.backgroundImage = 'url(https://i.imgur.com/JCuIAqJ.png)';
            el.style.width = '25px';
            el.style.height = '25px';
            el.style.backgroundSize = '100%';


            setHomeMarker(new mapboxgl.Marker(el)
                .setLngLat([home.lng, home.lat])
                .addTo(mapbox.current));

            setHomeMarkerPosition([home["lng"], home["lat"]]);
            setHomeIsSet(true);

        });
    }, [mapbox.current, homeMarker]);

    // set home position
    useEffect(
        () => {
            if (!mapbox.current) return; // wait for map to initialize

            // if we have a home marker, set it to the new position
            if (homeMarker) {
                console.log("Setting home marker to ", homeMarkerPosition);
                homeMarker.setLngLat(homeMarkerPosition);
            }
        }
    , [homeMarkerPosition]);

    const setHomePosition = async (lat, lng) => {
        console.log("Trying to set home at ", lat, lng, "...");

        // get access token
        const accessToken = await getAccessTokenSilently();

        setHomeIsSet(true);

        // set home location in database
        setHomeMarkerPosition([lng, lat]);
        await setHome(accessToken, lat, lng);
    }

    const getHomeMetrics = () => {
        return (
            <div id="home-metrics">
                <h4>At home:</h4>
                <text id="sidebar-content-header">Home:</text>
                <input id="iso-show" type="checkbox" checked={showIso} onChange={(e) => {
                    setShowIso(e.target.checked);
                }}/>
                <select id="iso-profile" onChange={(e) => {
                    setIsoProfile(e.target.value);
                }}>
                    <option value="driving">Driving</option>
                    <option value="walking">Walking</option>
                    <option value="transit">Transit</option>
                </select>


                <input id="iso-minutes" type="number" min="1" max="240" value={isoMinutes} onChange={(e) => {
                    setIsoMinutes(e.target.value);
                }}/>

                {sunburstHomeInfo ? getSunburstSegment() : ""}
            </div>
        );
    }

    // all towers useEffect
    useEffect(() => {
        // if the all towers data changes then update the all towers and the all tower extrusions
        if (!mapbox.current) return; // wait for map to initialize
        if (!allTowersPoints) return; // wait for all towers data to be set
        if (!allTowerPolygons) return; // wait for all tower extrusions data to be set

        console.log("Setting tower points: ", allTowersPoints);
        console.log("Setting tower polygons: ", allTowerPolygons);
        // set layer data
        mapbox.current.getSource('All Towers').setData(allTowersPoints);

        // set extrusion data
        mapbox.current.getSource('All Tower Extrusions').setData(allTowerPolygons);

    }, [allTowersPoints, allTowerPolygons]);

    // antennas useEffect
    useEffect(() => {
        // if the antennas data changes then update the antennas points
        if (!mapbox.current) return; // wait for map to initialize
        if (!antennaPoints) return; // wait for antennas data to be set

        console.log("Setting antennas points: ", antennaPoints);
        // set layer data
        mapbox.current.getSource('Antennas').setData(antennaPoints);

    }, [antennaPoints]);

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


    // sunburst home info - update on home change or map datetime change
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize

        // if we don't have a home, then don't do anything
        if (!homeIsSet) return;

        // if we don't have a home marker position, then don't do anything
        if (homeMarkerPosition.length < 2) return;

        // if map datetime is more than 4 days in the future, we don't have sunburst data, so unset it
        if (mapDatetime > new Date().getTime() + 4 * 24 * 60 * 60 * 1000) {
            setSunburstHomeInfo(null);
            return;
        }

        // get sunburst data
        getSunburstData(homeMarkerPosition[1], homeMarkerPosition[0], mapDatetime.toISOString()).then((data) => {
            setSunburstHomeInfo(data);
        });
    }, [homeMarkerPosition, mapDatetime]);


    // sunburst API fetch
    const getSunburstData = async (lat, lng, after) => {
        let sunburstToken = process.env.REACT_APP_SUNBURST_API_TOKEN;
        console.log("Using Sunburst token: ", sunburstToken);

        const query = await fetch(
            `https://sunburst.sunsetwx.com/v1/quality?geo=${lat},${lng}&after=${after}`,
            {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${sunburstToken}`
                }
            }
        );

        const data = await query.json();
        console.log("Sunburst retrieved data: ", data);
        return data;
    }

    const getSunburstSegment = () => {
        // this will break if rendered before the API call is finished, so this should only be called after sunburstHomeInfo is set
        let type = sunburstHomeInfo["features"][0]["properties"]["type"];
        let twilight;
        if (type === "Sunrise") {
            twilight = "dawn";
        } else {
            twilight = "dusk";
        }
        let quality = sunburstHomeInfo["features"][0]["properties"]["quality"];
        let quality_percent = sunburstHomeInfo["features"][0]["properties"]["quality_percent"];

        let astro_time = new Date(Date.parse(sunburstHomeInfo["features"][0]["properties"][twilight]["astronomical"])).toLocaleTimeString();
        let nautical_time = new Date(Date.parse(sunburstHomeInfo["features"][0]["properties"][twilight]["nautical"])).toLocaleTimeString();
        let civil_time = new Date(Date.parse(sunburstHomeInfo["features"][0]["properties"][twilight]["civil"])).toLocaleTimeString();

        return (
            <div id="sunburst-segment">
                <div id="sunrise-sunset-metrics">
                    <text id="sunburst-sunrise-sunset">Type: {type}
                        Quality: {quality} ({quality_percent}%)
                        Times:
                        Astronomical: {astro_time}
                        Nautical: {nautical_time}
                        Civil: {civil_time}
                    </text>
                </div>
            </div>
    )
    }


    const getWeatherInfo = async (lat, lng, datetime) => {
        let weatherToken = process.env.REACT_APP_WEATHER_API_TOKEN;
        console.log("Using Weather token: ", weatherToken);

        let query = await fetch(
            `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&dt=${datetime}&appid=${weatherToken}`,
            {
                method: 'GET',
            }
        );

        let data = await query.json();
        console.log("Weather retrieved data: ", data);
        return data;
    }

    return (
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