import React, { useState, useEffect, createRef, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import Sidebar from '../components/sidebar';

import mapboxgl from 'mapbox-gl';

/* eslint-disable import/first */
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;


import MapboxDraw from "@mapbox/mapbox-gl-draw";

// search control @mapbox/search-js-react
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import ShadeMap from 'mapbox-gl-shadow-simulator';


import DateTimePicker from 'react-datetime-picker'

// css
import '../styles/components/map.css';
import '../styles/components/sidebar.css';
import '../styles/components/layerswitcher.css'
import '../styles/components/rightclickpopup.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import 'react-datetime-picker/dist/DateTimePicker.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faCoffee, faFloppyDisk,
    faHome,
    faInfo,
    faMapMarkerAlt,
    faPenToSquare,
    faRoute,
    faTrash
} from '@fortawesome/free-solid-svg-icons'


import { v4 as uuid } from 'uuid';

// api imports
import {
    setHome,
    retrieveHome,
    retrieveTowers,
    retrieveAntennas,
    fetchMaps, retrieveCustomMapPoints, putPoint, postPoint, deletePoint
} from "../services/message.service";

import { useAuth0 } from "@auth0/auth0-react";

import { GoogleMap, LoadScript, StreetViewPanorama, StreetViewService } from '@react-google-maps/api';
import Modal from './modal';
// import ScriptLoaded from "@react-google-maps/api/src/docs/ScriptLoaded";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_API_KEY;

const shadeMap = new ShadeMap({
    date: new Date(),    // display shadows for current date
    color: '#0f1624',    // shade color
    opacity: 0.7,        // opacity of shade colors
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


function Map() {
    const { getAccessTokenSilently } = useAuth0();

    const mapRef = useRef(null);
    const mapbox = useRef(null);

    const [displaySidebar, setDisplaySidebar] = useState(false);
    const [loading, setLoading] = useState(true);

    const [streetViewPresent, setStreetViewPresent] = useState(false);
    const [displayStreetView, setDisplayStreetView] = useState(false);
    const [streetViewPosition, setStreetViewPosition] = useState([]);

    const [homeIsSet, setHomeIsSet] = useState(false);
    const [homeMarker, setHomeMarker] = useState(null);
    const [homeMarkerPosition, setHomeMarkerPosition] = useState([]);

    const [isoProfile, setIsoProfile] = useState("driving");
    const [isoMinutes, setIsoMinutes] = useState("45");
    const [showIso, setShowIso] = useState(false);

    const [routingLine, setRoutingLine] = useState(null);
    const [routingLineEnd, setRoutingLineEnd] = useState([]);
    const [routingDuration, setRoutingDuration] = useState(null);
    const [routingDistance, setRoutingDistance] = useState(null);

    const [rightClickPopup, setRightClickPopup] = useState(new mapboxgl.Popup({ className: "rightclick-popup", closeButton: true, closeOnClick: true }).setHTML("Test!"));
    const [rightClickPopupPosition, setRightClickPopupPosition] = useState([]);
    const [showRightClickPopup, setShowRightClickPopup] = useState(false);
    const [rightClickPopupState, setRightClickPopupState] = useState(null);

    const [customMapPopup, setCustomMapPopup] = useState(new mapboxgl.Popup({ className: "rightclick-popup", closeButton: true, closeOnClick: true }).setHTML("Test!"));
    const [customMapPopupPosition, setCustomMapPopupPosition] = useState([]);
    const [showCustomMapPopup, setShowCustomMapPopup] = useState(false);
    const [customMapPopupState, setCustomMapPopupState] = useState(null);
    const [customMapPopupProperties, setCustomMapPopupProperties] = useState(null);

    const [sunburstHomeInfo, setSunburstHomeInfo] = useState(null);
    const [showShadeMap, setShowShadeMap] = useState(false);

    const [allTowersPoints, setAllTowersPoints] = useState(null);
    const [allTowerPolygons, setAllTowerPolygons] = useState(null);

    const [antennaPoints, setAntennaPoints] = useState(null);

    const [mapDatetime, setMapDatetime] = useState(new Date());

    const [shadeMapObject, setShadeMapObject] = useState(shadeMap);

    const [customMaps, setCustomMaps] = useState(null);
    const [customMapPoints, setCustomMapPoints] = useState({});
    const [currentSelectedCustomMapPoint, setCurrentSelectedCustomMapPoint] = useState({});
    const [modalSelectedCustomMapId, setModalSelectedCustomMapId] = useState("");
    const [modalSelectedCustomMapPointId, setModalSelectedCustomMapPointId] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [modalType, setModalType] = useState("mapAdd");

    const [newPointMap, setNewPointMap] = useState(null);

    const settingsRef = useRef({});
    const [settings, setSettings] = useState({});

    const addSources = () => {
        mapbox.current.addSource('Google Hybrid', {
            'type': 'raster',
            'tiles': [
                'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            ],
            'tileSize': 256
        });
        mapbox.current.addSource('Bing Hybrid', {
            'type': 'raster',
            'tiles': [
                'https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
                'https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
                'https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
                'https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z'
            ],
            'tileSize': 256
        });

        mapbox.current.addSource('ESRI', {
            'type': 'raster',
            'tiles': [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            'tileSize': 256
        });

        mapbox.current.addSource('OpenStreetMap', {
            'type': 'raster',
            'tiles': [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            'tileSize': 256
        });

        mapbox.current.addSource('NAIP', {
            'type': 'raster',
            'tiles': [
                'https://gis.apfo.usda.gov/arcgis/rest/services/NAIP/USDA_CONUS_PRIME/ImageServer/tile/{z}/{y}/{x}'
            ],
            'tileSize': 256
        });

        mapbox.current.addSource('VFR', {
            'type': 'raster',
            'tiles': [
                'https://wms.chartbundle.com/tms/1.0.0/sec/{z}/{x}/{y}.png?origin=nw'
            ],
            'tileSize': 256
        });

        mapbox.current.addSource('MAXAR', {
            'type': 'raster',
            'tiles': [
                'https://maps.hereapi.com/v3/background/mc/{z}/{x}/{y}/png?size=512&style=explore.satellite.day&apiKey=' + process.env.REACT_APP_HERE_API_KEY
            ],
            'tileSize': 512
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
                'circle-color': ['get', 'color'],
            }
        });

        mapbox.current.on('mouseenter', 'All Towers', () => {
            mapbox.current.getCanvas().style.cursor = 'pointer';
        });
        mapbox.current.on('mouseleave', 'All Towers', () => {
            mapbox.current.getCanvas().style.cursor = '';
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

        mapbox.current.on('mouseenter', 'Antennas', () => {
            mapbox.current.getCanvas().style.cursor = 'pointer';
        });
        mapbox.current.on('mouseleave', 'Antennas', () => {
            mapbox.current.getCanvas().style.cursor = '';
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

        // routing source
        mapbox.current.addSource('Routing', {
            'type': 'geojson',
            'data': routingLine
        });

        // routing layer
        mapbox.current.addLayer({
            id: 'Routing',
            type: 'line',
            source: 'Routing',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#33ac3d',
                'line-width': 10,
                'line-opacity': 0.75
            }
        });

        // add long lines 
        let long_lines = require('./long-lines.geojson');
        mapbox.current.addSource('Long Lines', {
            'type': 'geojson',
            'data': long_lines
        });

        mapbox.current.addLayer({
            'id': 'Long Lines',
            'type': 'circle',
            'source': 'Long Lines',
            'paint': {
                'circle-radius': 6,
                'circle-color': ['get', 'color'],
            }
        });

        // add FLYGHINDER
        let flyghinder = require('./flyghinder.geojson');
        mapbox.current.addSource('FLYGHINDER 2023', {
            'type': 'geojson',
            'data': flyghinder
        });

        mapbox.current.addLayer({
            'id': 'FLYGHINDER 2023',
            'type': 'circle',
            'source': 'FLYGHINDER 2023',
            'paint': {
                'circle-radius': 6,
                'circle-color': '#62b031',
            }
        });
        
        // add FLYGHINDER extrusions
        let flyghinder_extrusions = require('./flyghinder_polygons.geojson');
        mapbox.current.addSource('FLYGHINDER 2023 Extrusions', {
            'type': 'geojson',
            'data': flyghinder_extrusions
        });

        mapbox.current.addLayer({
            'id': 'FLYGHINDER 2023 Extrusions',
            'type': 'fill-extrusion',
            'source': 'FLYGHINDER 2023 Extrusions',
            'minzoom': 12,
            'paint': {
                'fill-extrusion-color': "#62b031",
                'fill-extrusion-height': ['get', 'height_meters'],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.8
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
                'circle-color': ['get', 'color'],
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
            'minzoom': 12,
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
            'minzoom': 12,
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
            'minzoom': 15
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

        // openRailwayMap source
        mapbox.current.addSource('OpenRailwayMap', {
            'type': 'raster',
            'tiles': [
                'https://a.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
                'https://b.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
                'https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png'
            ],
            //server returns 512px img for 256 tiles
            'tileSize': 512,
            'tilePixelRatio': 2
        });


        // openRailwayMap layer
        mapbox.current.addLayer(
            {
                'id': 'OpenRailwayMap',
                'type': 'raster',
                'source': 'OpenRailwayMap',
                'paint': {}
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


        mapbox.current.addLayer(
            {
                'id': 'Google Hybrid',
                'type': 'raster',
                'source': 'Google Hybrid',
                'paint': {}
            },
        );

        mapbox.current.addLayer(
            {
                'id': 'Bing Hybrid',
                'type': 'raster',
                'source': 'Bing Hybrid',
                'paint': {}
            },
        );

        mapbox.current.addLayer(
            {
                'id': 'ESRI',
                'type': 'raster',
                'source': 'ESRI',
                'paint': {}
            },
        );

        mapbox.current.addLayer(
            {
                'id': 'OpenStreetMap',
                'type': 'raster',
                'source': 'OpenStreetMap',
                'paint': {}
            },
        );

        mapbox.current.addLayer(
            {
                'id': 'NAIP',
                'type': 'raster',
                'source': 'NAIP',
                'paint': {}
            },
        );

        mapbox.current.addLayer(
            {
                'id': 'VFR',
                'type': 'raster',
                'source': 'VFR',
                'paint': {}
            },
        );

        mapbox.current.addLayer(
            {
                'id': 'MAXAR',
                'type': 'raster',
                'source': 'MAXAR',
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

        // layer hierarchies... streetview and isochrone should be on top.
        mapbox.current.moveLayer('Isochrone');
        mapbox.current.moveLayer('Google StreetView');
        mapbox.current.moveLayer('All Towers');
        mapbox.current.moveLayer('Antennas');
        mapbox.current.moveLayer('Routing');
        mapbox.current.moveLayer('OpenRailwayMap');
    }

    // get maps from api
    const getMaps = async () => {
        const accessToken = await getAccessTokenSilently();
        const { data, error } = await fetchMaps(accessToken);
        if (data) {
            data.maps = data.maps.filter(map => map.description != 'test3t' && map.description != '111' && map.description != 'test3awet' && map.name != '33333' && map.name != "66666" && map.name != "777777");
            setCustomMaps(data);
        }
        if (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (mapbox.current) return; // initialize map only once

        // initialize map
        let style = 'mapbox://styles/mapbox/streets-v11';
        if (new Date().getHours() > 18 || new Date().getHours() < 6) {
            style = 'mapbox://styles/mapbox/dark-v10';
        }
        mapbox.current = new mapboxgl.Map({
            container: mapRef.current,
            style: style,
            projection: 'globe',
            center: [-74.5, 40],
            zoom: 2
        });

        mapbox.current.on('style.load', () => {
            let darkMode = false;
            if (localStorage.getItem('settings')) {
                const settings = JSON.parse(localStorage.getItem('settings'));
                if (settings.darkMode) {
                    darkMode = true;
                }
            } else {
                // no settings so just used time based dark mode
                if (new Date().getHours() > 18 || new Date().getHours() < 6) {
                    darkMode = true;
                }
            }

            if (darkMode) {
                mapbox.current.setFog(
                    {
                        'range': [5, 6],
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
                        'range': [5, 6],
                        'horizon-blend': 0.3,
                        'color': 'white',
                        'high-color': '#add8e6',
                        'space-color': '#d8f2ff',
                        'star-intensity': 0.0
                    }
                )
            }
            mapbox.current.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });
            mapbox.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        });


        // on map load, add sources
        mapbox.current.on('load', () => {
            if (homeIsSet) {
                homeMarker.addTo(mapbox.current);
            }
            addSources();
            getMaps();

            setLoading(false);
        });

        // on click on hovers
        mapbox.current.on('click', 'Safe Towers', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const name = e.features[0].properties.name;
            const description = e.features[0].properties.description;


            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML("<text id='towerpopuptitle'>Safe tower: " + name + "</text><text id='towerpopuptext'>" + description + "</text>" + "<text id='popupcoords'>" + coordinates + "</text>")
                .addTo(mapbox.current);
        });

        // if the right click popup is closed, set our popup usestate to reflect that
        rightClickPopup.on('close', () => {
            setShowRightClickPopup(false);
            setRightClickPopupState(null);
            // on close we also want to clear any routing lines that may have been generated while it was open
            // but only if the popup is in the routing state
            console.log("right click popup closed, state: ", rightClickPopupState);
            setRoutingLine(null);
        });

        // custom map popup on close
        customMapPopup.on('close', () => {
            console.log("custom map popup closed");
            // setShowCustomMapPopup(false);
            setCustomMapPopupState("default");
            setRoutingLine(null);
        });

        // make the route thicker on hover
        mapbox.current.on('mouseenter', 'Routing', (e) => {
            mapbox.current.setPaintProperty('Routing', 'line-width', 20);

        });
        mapbox.current.on('mouseleave', 'Routing', () => {
            mapbox.current.setPaintProperty('Routing', 'line-width', 10);
        });

        mapbox.current.on('click', 'FLYGHINDER 2023', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            // round to 6 decimal places
            coordinates[0] = coordinates[0].toFixed(6);
            coordinates[1] = coordinates[1].toFixed(6);
            const name = e.features[0].properties.designation;
            const number = e.features[0].properties.number;
            const height_feet = e.features[0].properties.height_feet;
            const height_meters = e.features[0].properties.height_meters;
            const elevation_feet = e.features[0].properties.elevation_feet;
            const elevation_meters = e.features[0].properties.elevation_meters;
            const types_of_obstacles = e.features[0].properties.types_of_obstacles;
            

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML("<text id='towerpopuptitle'>" + name + " n:" + number + "</text>" +
                    "<text id='towerpopuptext'>Height: " + height_meters + "m (" + height_feet + "ft)<br>" +
                    "Elevation: " + elevation_meters + "m (" + elevation_feet + "ft)<br>" +
                    "Types of obstacles: " + types_of_obstacles + "</text>" +
                    "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
                .addTo(mapbox.current);
        });
        mapbox.current.on('mouseenter', 'FLYGHINDER 2023', () => {
            mapbox.current.getCanvas().style.cursor = 'pointer';
        });
        mapbox.current.on('mouseleave', 'FLYGHINDER 2023', () => {
            mapbox.current.getCanvas().style.cursor = '';
        });
        

        mapbox.current.on('click', 'Long Lines', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            // round to 6 decimal places
            coordinates[0] = coordinates[0].toFixed(6);
            coordinates[1] = coordinates[1].toFixed(6);
            const name = e.features[0].properties.Name;
            const description = e.features[0].properties.description;
            const type = e.features[0].properties.type;

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(
                    "<text id='towerpopuptitle'>Long Lines: " + name + "</text>" +
                    // "<text id='towerpopupstat'>height:</text>" +
                    "<text id='towerpopuptext'>" + description + "</text>" +
                    "<text id='towerpopupstat'>Type: " + type + "</text>" +
                    // "<text id='towerpopuptext'>ASR: " + "<a href='https://wireless2.fcc.gov/UlsApp/AsrSearch/asrRegistration.jsp?regKey='>" + e.features[0].name + "</a>" + "</text>" +
                    "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
                .addTo(mapbox.current);
        });

        mapbox.current.on('mouseenter', 'Long Lines', () => {
            mapbox.current.getCanvas().style.cursor = 'pointer';
        });
        mapbox.current.on('mouseleave', 'Long Lines', () => {
            mapbox.current.getCanvas().style.cursor = '';
        });


        mapbox.current.on('click', 'Decommissioned Towers', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const name = e.features[0].properties.name;
            const description = e.features[0].properties.description;
            // convert to feet with 2 decimal places
            const height = (e.features[0].properties.height * 3.28084).toFixed(2);

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
        mapbox.current.on('mouseenter', 'All Towers', () => {
            mapbox.current.getCanvas().style.cursor = 'pointer';
        });
        mapbox.current.on('mouseleave', 'All Towers', () => {
            mapbox.current.getCanvas().style.cursor = '';
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
            } else if (e.features[0].properties.data_type === "ULS") {
                description = "Transmitter type: " + transmitter_type + "<br>" +
                    "Call Sign: " + facility_id;
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
        mapbox.current.on('mouseenter', 'Antennas', () => {
            mapbox.current.getCanvas().style.cursor = 'pointer';
        });
        mapbox.current.on('mouseleave', 'Antennas', () => {
            mapbox.current.getCanvas().style.cursor = '';
        });

        // on left click
        mapbox.current.on('click', (e) => {
            let lat = e.lngLat.lat;
            let lng = e.lngLat.lng;
            console.log("Left click at: " + lat + ", " + lng);

            if (mapbox.current.getLayoutProperty('Google StreetView', 'visibility') === 'visible' && mapbox.current.getZoom() >= 14) {
                setStreetViewPosition([lat, lng]);
                setDisplayStreetView(true);
            }
        });

        // on right click
        mapbox.current.on('contextmenu', (e) => {
            console.log("Right click at: " + e.lngLat.lng + ", " + e.lngLat.lat);
            // make new popup with coordinates of right click
            setRightClickPopupPosition([e.lngLat.lng, e.lngLat.lat])
            setShowRightClickPopup(true);
            setRightClickPopupState("default");
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
        // mapbox.current.addControl(new MapboxDraw({
        //     displayControlsDefault: true,
        //     controls: {
        //         polygon: true,
        //         trash: true
        //     }
        // }), 'top-left');

    }, [mapRef]);

    useEffect(() => {
        settingsRef.current = settings;
        if (Object.keys(settings).length > 0) {
            localStorage.setItem('settings', JSON.stringify(settings));
        }
    }, [settings]);

    useEffect(() => {
        if (localStorage.getItem('settings'))
            setSettings(JSON.parse(localStorage.getItem('settings')));
        else setSettings({ "showUls": false, "isoMinutes": 60, "isoProfile": "driving", "darkMode": false});
    }, []);

    const renderRightClickPopup = (state) => {
        const placeholder = document.createElement('div');

        if (state === "default") {
            ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
                <div id="rightclickpopupbuttons">
                    <button id="rightclickpopupbutton" onClick={() => {
                        console.log("setting home position to ", rightClickPopupPosition);
                        setHomePosition(rightClickPopupPosition[1], rightClickPopupPosition[0]);
                        setShowRightClickPopup(false);
                    }}><FontAwesomeIcon icon={faHome} />
                    </button>
                    {homeIsSet && <button id="rightclickpopupbutton" onClick={() => {
                        setRoutingLineEnd(rightClickPopupPosition);
                        setRightClickPopupState("routing");
                    }}><FontAwesomeIcon icon={faRoute} />
                    </button>
                    }
                    {customMaps && customMaps.maps.length > 0 && <button id="rightclickpopupbutton" onClick={() => {
                        setRightClickPopupState("new-point");
                    }}><FontAwesomeIcon icon={faMapMarkerAlt} />
                    </button>}
                </div>
                <text id='popupcoords'> {rightClickPopupPosition[1].toFixed(5)}, {rightClickPopupPosition[0].toFixed(5)} </text>
            </div>);


        } if (state === "new-point") {
            ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
                <select id='newpointmapselect' 
                    onChange={async (e) => {
                        console.log("changing map to ", e.target.value);
                        // set the popup to have inputs for the selected map
                        setRightClickPopupState("new-point");
                        setNewPointMap(e.target.value);
                    }}
                    // if newPointMap is not empty, set the default value to the map that was selected
                    defaultValue={newPointMap}
                >
                    <option value={""}>Select a map</option>
                    {customMaps.maps.map((map) => {
                        return <option value={map.id}>{map.name}</option>
                    })}
                </select><br />

                {newPointMap !== "" && customMaps.maps.map((map) => {
                    if (map.id === newPointMap) {
                        return <div>
                            <input type="text" id='custompopupname' placeholder="Name" /><br />
                            <textarea id='custompopupdescription' placeholder="Description" /><br />

                            <div id='custompopupselects'>
                                <select id='custompopupcategory'>
                                    <option value={""}>Select a category</option>
                                    {map.categories.map(category => {
                                        return <option value={category.id}>{category.name}</option>
                                    })
                                    }
                                </select><br />

                                <select id='custompopupcolor'>
                                    <option value={""}>Select a color</option>
                                    {map.colors.map(color => {
                                        return <option value={color.id}>{color.name}</option>
                                    })
                                    }
                                </select><br />

                                <select id='custompopupicon'>
                                    <option value={""}>Select an icon</option>
                                    {map.icons.map(icon => {
                                        return <option value={icon.id}>{icon.name}</option>
                                    })
                                    }
                                </select><br />
                            </div>
                        </div>
                    }
                })
                }
                <div id="rightclickpopupbuttons">
                    <button id="rightclickpopupbutton" onClick={() => {
                        // save new point
                        saveNewPoint(document.getElementById("newpointmapselect").value, {
                            name: document.getElementById("custompopupname").value,
                            description: document.getElementById("custompopupdescription").value,
                            category: document.getElementById("custompopupcategory").value,
                            color: document.getElementById("custompopupcolor").value,
                            icon: document.getElementById("custompopupicon").value,
                            lat: rightClickPopupPosition[1],
                            lng: rightClickPopupPosition[0]
                        });

                        // close popup
                        setRightClickPopupState("default");
                        setShowRightClickPopup(false);

                    }}><FontAwesomeIcon icon={faFloppyDisk} />
                    </button>
                    <button id="rightclickpopupbutton" onClick={() => {
                        setRightClickPopupState("default");
                    }}><FontAwesomeIcon icon={faArrowLeft} />
                    </button>

                </div>
                <text id='popupcoords'> {rightClickPopupPosition[1].toFixed(5)}, {rightClickPopupPosition[0].toFixed(5)} </text>
            </div>);
        } if (state === "routing") {
            ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
                <text id="rightclickpopup-routing-state">Calculating...</text>
                <div id="rightclickpopupbuttons">
                    <button id="rightclickpopupbutton" onClick={() => {
                        setRightClickPopupState("default");
                    }}><FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                </div>
                <text id='popupcoords'> {rightClickPopupPosition[1].toFixed(5)}, {rightClickPopupPosition[0].toFixed(5)} </text>
            </div>);
        } if (state === "routing-complete") {
            ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
                <text id="rightclickpopup-routing-state">Routing Info:</text><br />
                <text id="routing-information">{Math.floor(routingDuration / 60)} hours, {routingDuration % 60} minutes<br />
                    {routingDistance} miles</text><br />
                <div id="rightclickpopupbuttons">
                    <button id="rightclickpopupbutton" onClick={() => {
                        setRightClickPopupState("default");
                        setRoutingLine(null);
                    }}><FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                </div>
                <text id='popupcoords'> {rightClickPopupPosition[1].toFixed(5)}, {rightClickPopupPosition[0].toFixed(5)} </text>
            </div>
            );
        }

        rightClickPopup.setDOMContent(placeholder);
    }

    useEffect(() => {
        if (rightClickPopupState === "new-point") {
            renderRightClickPopup("new-point");
        }
    }, [newPointMap]);

    const renderCustomMapPopup = (state, properties, coordinates) => {
        console.log("rendering custom map popup with state ", state, " and properties ", properties, " and coordinates ", coordinates);
        const placeholder = document.createElement('div');

        if (state === "default") {
            console.log("rendering default custom map popup, home is set: ", homeIsSet);
            ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
                <text id='custompopupname'>{properties.name}</text><br />
                <text id='custompopupdescription'>{properties.description}</text><br />
                <div id='custompopupdetail'>
                    Category: {properties.categories.filter(cat => cat.id == properties.category)[0]?.name}<br />
                    Icon: {properties.icons.filter(icon => icon.id == properties.icon)[0]?.name}<br />
                    Map: {properties.mapName}</div>

                <div id="rightclickpopupbuttons">
                    <button id="rightclickpopupbutton" onClick={() => {
                        setCustomMapPopupState("info");
                    }}><FontAwesomeIcon icon={faInfo} />
                    </button>
                    {properties.editable && <button id="rightclickpopupbutton" onClick={() => {
                        setCustomMapPopupState("edit");
                    }}><FontAwesomeIcon icon={faPenToSquare} />
                    </button>}
                    {homeIsSet && <button id="rightclickpopupbutton" onClick={() => {
                        setRoutingLineEnd(coordinates);
                        setCustomMapPopupState("routing");
                    }}><FontAwesomeIcon icon={faRoute} />
                    </button>
                    }
                </div>
                <text id='popupcoords'> {coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)} </text>
            </div>);
        }

        if (state === "edit") {
            ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
                <input type="text" id='custompopupname' defaultValue={properties.name} /><br />
                <textarea id='custompopupdescription' defaultValue={properties.description}></textarea><br />

                <div id='custompopupselects'>

                    <select id='custompopupcategory' defaultValue={properties.categories.filter(cat => cat.id == properties.category)[0]?.id}>
                        {properties.categories.map(category => {
                            return <option value={category.id}>{category.name}</option>
                        })}
                    </select><br />

                    <select id='custompopupcolor' defaultValue={properties.colors.filter(color => color.hex == properties.color)[0]?.id}>
                        {properties.colors.map(color => {
                            return <option value={color.id}>{color.name}</option>
                        })
                        }
                    </select><br />

                    <select id='custompopupicon' defaultValue={properties.icons.filter(icon => icon.id == properties.icon)[0]?.id}>
                        {properties.icons.map(icon => {
                            return <option value={icon.id}>{icon.name}</option>
                        })
                        }
                    </select><br />
                </div>

                <div id="rightclickpopupbuttons">

                    <button id="rightclickpopupbutton" onClick={() => {
                        // save
                        console.log("saving");
                        console.log("name: ", document.getElementById("custompopupname").value);
                        console.log("description: ", document.getElementById("custompopupdescription").value);

                        // call save function // should query API and then edit our local data if successful
                        savePoint(properties.mapId, properties.id, {
                            name: document.getElementById("custompopupname").value,
                            description: document.getElementById("custompopupdescription").value,
                            category: document.getElementById("custompopupcategory").value,
                            color: document.getElementById("custompopupcolor").value,
                            icon: document.getElementById("custompopupicon").value
                        });

                        // close the popup
                        setShowCustomMapPopup(false);
                    }}><FontAwesomeIcon icon={faFloppyDisk} />
                    </button>
                    
                    <button id="rightclickpopupbutton" onClick={() => {
                        // close the popup
                        setShowCustomMapPopup(false);

                        // now delete
                        removePoint(properties.mapId, properties.id);
                    }}><FontAwesomeIcon icon={faTrash} />
                    </button>

                    <button id="rightclickpopupbutton" onClick={() => {
                        setCustomMapPopupState("default");
                    }}><FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                </div>
                <text id='popupcoords'> {coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)} </text>
            </div>);
        }

        if (state === "info") {
            ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
                <table id="custompopupinfotable">
                    <tr>
                        <td>Creator</td>
                        <td>{properties.creator}</td>
                    </tr>
                    <tr>
                        <td>Creation Date</td>
                        <td>{properties.creation_date}</td>
                    </tr>
                    <tr>
                        <td>Editor</td>
                        <td>{properties.editor}</td>
                    </tr>
                    <tr>
                        <td>Edit Date</td>
                        <td>{properties.edit_date}</td>
                    </tr>
                    <tr>
                        <td>ID</td>
                        <td>{properties.id}</td>
                    </tr>
                    <tr>

                        <td>Map</td>
                        <td>{properties.mapName}</td>
                    </tr>
                    <tr>
                        <td>Map ID</td>
                        <td>{properties.mapId}</td>
                    </tr>
                </table>

                <div id="rightclickpopupbuttons">
                    <button id="rightclickpopupbutton" onClick={() => {
                        setCustomMapPopupState("default");
                    }}><FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                </div>
                <text id='popupcoords'> {coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)} </text>
            </div>);
        }

        if (state === "routing") {
            ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
                <text id="rightclickpopup-routing-state">Calculating...</text>
                <div id="rightclickpopupbuttons">
                    <button id="rightclickpopupbutton" onClick={() => {
                        setCustomMapPopupState("default");
                    }}><FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                </div>
                <text id='popupcoords'> {coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)} </text>
            </div>);
        }

        if (state === "routing-complete") {
            ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
                <text id="rightclickpopup-routing-state">Routing Info:</text><br />
                <text id="routing-information">{Math.floor(routingDuration / 60)} hours, {routingDuration % 60} minutes<br />
                    {routingDistance} miles</text><br />
                <div id="rightclickpopupbuttons">
                    <button id="rightclickpopupbutton" onClick={() => {
                        setCustomMapPopupState("default");
                        setRoutingLine(null);
                    }}><FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                </div>
                <text id='popupcoords'> {coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)} </text>
            </div>);
        }

        customMapPopup.setDOMContent(placeholder);
    }

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
            geocodes.push(coordinateFeature(coord2, coord1));
            geocodes.push(coordinateFeature(coord1, coord2));
        }

        return geocodes;
    };

    // create a function to make a directions request
    async function setRoute(end) {
        const query = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/${isoProfile}/${homeMarkerPosition[0]},${homeMarkerPosition[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
            { method: 'GET' }
        );
        const json = await query.json();
        const data = json.routes[0];
        const route = data.geometry.coordinates;
        let duration = data.duration;

        setRoutingDuration(Math.round(duration / 60));
        // one decimal place, in miles (input is in meters)
        setRoutingDistance((data.distance / 1609.344).toFixed(1));
        setRoutingLine(route);
    }

    async function savePoint(mapId, pointId, pointData) {
        console.log("saving point");
        console.log(pointData);

        const accessToken = await getAccessTokenSilently();

        await putPoint(accessToken, mapId, pointId, pointData).then((data) => {
            console.log("point saved");
            console.log(data);
            getMaps();
        }
        ).catch((error) => {
            console.log("Error saving point: " + error);
            getMaps();
        }
        );
    }
    

    async function saveNewPoint(mapId, pointData) {
        // if category or icon or color or mapId is null, return
        if (!pointData.category || !pointData.icon || !pointData.color || !mapId) {
            return;
        }

        const accessToken = await getAccessTokenSilently();

        console.log("Saving with point data", pointData);

        console.log(mapId);
        console.log(customMapPoints);


        await postPoint(accessToken, mapId, pointData).then((data) => {
            console.log("point added");
            console.log(data);
            getMaps();
        }).catch((error) => {
            console.log("Error saving point: " + error);
            getMaps();
        });
    }

    async function removePoint(mapId, pointId) {
        const accessToken = await getAccessTokenSilently();
        
        // catch data and error from the api call
        await deletePoint(accessToken, mapId, pointId).then((data) => {
            console.log("point deleted");
            console.log(data);
            getMaps();
        }).catch((error) => {
            console.log("Error deleting point: " + error);
            getMaps();
        });
    }


    const getStreetView = () => {
        console.log("getting streetview");

        let lat = streetViewPosition[0];
        let lng = streetViewPosition[1];

        if (!streetViewPosition.length) {
            setDisplayStreetView(false);
            setStreetViewPresent(false);
            return;
        }
        if (mapbox.current.getLayoutProperty('Google StreetView', 'visibility') !== 'visible') {
            setDisplayStreetView(false);
            setStreetViewPresent(false);
            return;
        }

        // // check if streetview is available within 50 feet of the click
        const onLoad = (streetViewService) => {
            streetViewService.getPanorama({
                location: { lat: lat, lng: lng },
                radius: 20,
            }, (data, status) => {
                if (status === "OK") {
                    console.log("streetview available");
                    setStreetViewPresent(true);
                } else {
                    console.log("streetview not available");
                    setStreetViewPresent(false);
                    setDisplayStreetView(false);
                }
            });
        }

        return (
            <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                <StreetViewService onLoad={onLoad} />
            </LoadScript>
        )
    }

    const displayStreetViewDiv = () => {
        let lat = streetViewPosition[0];
        let lng = streetViewPosition[1];

        return (
            <>
                <div id="modal-background"></div>
                <div id="streetview" style={{ display: "block" }}>
                    <GoogleMap
                        mapContainerStyle={{ height: "100%", width: "100%" }}
                        center={{ lat: lat, lng: lng }}
                        zoom={14}
                    >
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
                                panControl: true,
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
                    <button id="closestreetview" onClick={() => {
                        setDisplayStreetView(false)
                        setStreetViewPosition([])
                        setStreetViewPresent(false)
                    }}>X</button>
                </div>
            </>
            
        )
    }

    const updateAllTowers = async (lat, lng) => {
        const accessToken = await getAccessTokenSilently();
        console.log("updateAllTowers");
        await retrieveTowers(accessToken, lat, lng, 5000).then(
            (response) => {
                if (response.data) {
                    setAllTowerPolygons(response.data.towers_polygons);
                    setAllTowersPoints(response.data.towers_points);
                }
            }
        )
    }

    const updateAntennas = async (lat, lng) => {
        const accessToken = await getAccessTokenSilently();
        await retrieveAntennas(accessToken, lat, lng, 5000, settingsRef.current["showUls"]).then(
            (response) => {
                if (response.data)
                    setAntennaPoints(response.data.antennas);
            }
        )
    }

    const updateSettings = (settingName, settingValue) => {
        settings[settingName] = settingValue;
        setSettings({ ...settings });
    }

    // show right click popup useeffect
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!showRightClickPopup) { // remove the popup if we don't want to show it
            rightClickPopup.remove();
        }
        else {
            // add the popup to the map
            console.log("adding right click popup");
            rightClickPopup.addTo(mapbox.current);
        }
    }, [showRightClickPopup]);

    // right click popup position useeffect
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!showRightClickPopup) return; // if we don't want to show the popup, then don't do anything

        // set the position of the popup
        console.log("changing right click popup position to ", rightClickPopupPosition);
        rightClickPopup.setLngLat(rightClickPopupPosition);
        renderRightClickPopup(rightClickPopupState);
    }, [rightClickPopupPosition]);

    // right click state useeffect
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!showRightClickPopup) return; // if we don't want to show the popup, then don't do anything

        renderRightClickPopup(rightClickPopupState);
    }, [rightClickPopupState]);


    // routing duration and distance useeffect for right click popup
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize

        // if we are in routing state, then show the duration and distance
        if (rightClickPopupState === "routing") {
            setRightClickPopupState("routing-complete");
        }
        if (customMapPopupState === "routing") {
            setCustomMapPopupState("routing-complete");
        }
    }, [routingDuration, routingDistance]);

    // show custom map popup useeffect
    // show right click popup useeffect
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!showCustomMapPopup) { // remove the popup if we don't want to show it
            customMapPopup.remove();
        }
        else {
            // add the popup to the map
            console.log("adding custom map popup");
            customMapPopup.addTo(mapbox.current);
        }
    }, [showCustomMapPopup]);

    // custom map popup position useeffect
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!showCustomMapPopup) return; // if we don't want to show the popup, then don't do anything

        console.log("changing custom map popup position to ", customMapPopupPosition);
        customMapPopup.setLngLat(customMapPopupPosition);

        customMapPopup.addTo(mapbox.current);

    }, [customMapPopupPosition]);

    // custom map popup state useeffect
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!showCustomMapPopup) return; // if we don't want to show the popup, then don't do anything

        console.log("Custom map popup state changed to ", customMapPopupState, " with properties ", customMapPopupProperties);

        renderCustomMapPopup(customMapPopupState, customMapPopupProperties, customMapPopupPosition);

    }, [customMapPopupState]);

    // custom map popup properties useeffect
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!showCustomMapPopup) return; // if we don't want to show the popup, then don't do anything

        console.log("Custom map popup properties changed to ", customMapPopupProperties);

        renderCustomMapPopup(customMapPopupState, customMapPopupProperties, customMapPopupPosition);
    }, [customMapPopupProperties]);

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
            // set the layer not be visible
            mapbox.current.setLayoutProperty('Isochrone', 'visibility', 'none');
            return;
        }

        getIso().then((data) => {
            console.log(data)
            // set the layer to be visible
            mapbox.current.setLayoutProperty('Isochrone', 'visibility', 'visible');
            mapbox.current.getSource('Isochrone').setData(data);
        });
    }, [homeMarkerPosition, settings["isoMinutes"], settings["isoProfile"], showIso]);



    // curl https://dev.virtualearth.net/REST/v1/Routes/Isochrones\?waypoint\=47.65431,-122.1291891\&maxTime\=\7200\&key\=AsFnJ6P5VNWfmjEsdjkH2SJjeIwplOKzfdiewwZCX7jBUX7ixSp64VfDjw6mMzBz
    async function getIso() {

        const query = await fetch(
            `https://dev.virtualearth.net/REST/v1/Routes/Isochrones?waypoint=${homeMarkerPosition[1]},${homeMarkerPosition[0]}&maxTime=${settings["isoMinutes"] * 60}&travelMode=${settings["isoProfile"]}&key=${process.env.REACT_APP_BING_MAPS_API_KEY}`,
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

    // routing API useeffect
    useEffect(() => {
        // if homemarker position is not set (length is less than 2), then don't do anything
        if (homeMarkerPosition.length < 2) {
            console.log("homeMarkerPosition not set");
            return;
        }

        // if routingLineEnd is not set (length is less than 2), then don't do anything
        if (routingLineEnd.length < 2) {
            console.log("routingLineEnd not set");
            return;
        }

        // call the routing function and set data
        setRoute(routingLineEnd).then(r => {
            console.log("setting route data");
        });
    }, [routingLineEnd]);

    // routing line useEffect
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        // if routing line end is not set (length is less than 2), then don't do anything
        if (routingLineEnd.length < 2) {
            console.log("routingLineEnd not set");
            return;
        }
        const geojson = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: routingLine
            }
        };

        // if routing line is null
        if (routingLine === null) {
            geojson.geometry.coordinates = [];
        }

        console.log("updating routing line with", geojson);


        // set the routing layer data
        mapbox.current.getSource("Routing").setData(geojson);
    }, [routingLine]);


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

            setHomeMarkerPosition([home["lng"], home["lat"]]);
        });
    }, [mapbox.current, homeMarker]);

    // set home position
    useEffect(
        () => {
            if (!mapbox.current) return; // wait for map to initialize
            if (homeMarkerPosition.length < 2) return; // wait for home marker position to be set

            // if we have a home marker, set it to the new position
            if (homeMarker) {
                console.log("Setting home marker to ", homeMarkerPosition);
                homeMarker.setLngLat(homeMarkerPosition);
            } else {
                const el = document.createElement('div');
                el.className = 'marker';

                el.style.backgroundImage = 'url(https://i.imgur.com/JCuIAqJ.png)';
                el.style.width = '25px';
                el.style.height = '25px';
                el.style.backgroundSize = '100%';

                setHomeMarker(new mapboxgl.Marker(el)
                    .setLngLat([homeMarkerPosition[0], homeMarkerPosition[1]])
                    .addTo(mapbox.current));
            }
            console.log("Home marker set, setting homeIsSet to true");
            setHomeIsSet(true);
        }
        , [homeMarkerPosition]);

    const setHomePosition = async (lat, lng) => {
        console.log("Trying to set home at ", lat, lng, "...");

        // get access token
        const accessToken = await getAccessTokenSilently();

        // set home location in database
        setHomeMarkerPosition([lng, lat]);
        await setHome(accessToken, lat, lng);
    }

    const getHomeMetrics = () => {
        return (
            <div id="home-metrics">
                <h4>At home:</h4>
                <text id="sidebar-content-header">Home:</text>

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

    // custom maps useeffect, update when custom maps change
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!customMaps) return; // wait for custom maps to be set

        // iterate through the custom maps, add the source and layer, and if the layer is enabled (localstorage), get the data and set it
        console.log("Setting custom maps: ", customMaps);
        customMaps.maps.forEach((customMap) => {
            console.log("Setting custom map: ", customMap);
            // get data
            getCustomMapPoints(customMap.id).then((data) => {
                let currentMap = customMaps.maps.filter(map => map.id == customMap.id)[0];
                console.log("Setting data for ", customMap.id, ": ", data);
                let pointsData = data.data.points;
                pointsData.features = pointsData.features.map(feature => {
                    let newFeature = feature;
                    newFeature.properties.color = currentMap?.colors.filter(color => color.id == feature.properties.color)[0]?.hex;

                    return newFeature;
                })

                setCustomMapPoints((customMapPoints) => {
                    return {
                        ...customMapPoints,
                        [customMap.id]: data.data.points
                    }
                });
            });

            // add the source
            if (!mapbox.current.getSource(customMap.id)) {
                mapbox.current.addSource(customMap.id, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    }
                });

                customMap.icons.forEach(icon => {
                    mapbox.current.loadImage(icon.url, (error, image) => {
                        // catch and log error
                        if (error) {
                            console.log("Error loading image with url:", icon.url, "and error:", error);
                            return;
                        }
                        mapbox.current.addImage(icon.id, image, { sdf: true });
                    });
                });

                // add the layer (geojson)
                mapbox.current.addLayer({
                    'id': customMap.id,
                    'type': 'symbol',
                    'layout': {
                        'icon-image': ['get', 'icon'],
                        'icon-size': 1,
                        'icon-allow-overlap': true,
                    },
                    'source': customMap.id,
                    'paint': {
                        'icon-opacity': 1,
                        'icon-color': ['get', 'color'],
                        'icon-halo-color': '#fff',
                        'icon-halo-width': 5,
                    }
                });

                // on mouseenter and mouseleave, set the cursor to pointer
                mapbox.current.on('mouseenter', customMap.id, () => {
                    mapbox.current.getCanvas().style.cursor = 'pointer';
                });
                mapbox.current.on('mouseleave', customMap.id, () => {
                    mapbox.current.getCanvas().style.cursor = '';
                });

                // custom map layer on click
                mapbox.current.on('click', customMap.id, (e) => {
                    const coordinates = e.features[0].geometry.coordinates.slice();
                    const name = e.features[0].properties.name;
                    const description = e.features[0].properties.description;

                    setCurrentSelectedCustomMapPoint({ "pointId": e.features[0].properties.id, "layerId": e.features[0].layer.id });

                    console.log("Clicked on custom map: ", name, description, coordinates);

                    // if the popup is already open, close it
                    // if (!showCustomMapPopup) {
                    //     customMapPopup.addTo(mapbox.current);
                    // }

                    // see if we have edit permissions for this map
                    // this is a slow and inefficient way to do this! We should have a usestate for the permissions and update it when we get the custom maps
                    e.features[0].properties.editable = false;
                    for (let i = 0; i < customMaps.maps.length; i++) {
                        if (customMaps.maps[i].id === customMap.id) {
                            e.features[0].properties.categories = customMaps.maps[i].categories;
                            e.features[0].properties.colors = customMaps.maps[i].colors;
                            e.features[0].properties.icons = customMaps.maps[i].icons;
                            e.features[0].properties.mapName = customMaps.maps[i].name;
                            e.features[0].properties.mapId = customMaps.maps[i].id;
                            if (customMaps.maps[i].my_permissions.includes("edit") || customMaps.maps[i].my_permissions.includes("owner")) {
                                e.features[0].properties.editable = true;
                            }
                        }
                    }

                    setCustomMapPopupPosition(coordinates);
                    setCustomMapPopupProperties(e.features[0].properties);
                    console.log("Custom map point properties: ", e.features[0].properties);
                    setCustomMapPopupState("default");
                    setShowCustomMapPopup(true);
                });

                // let's also move the custom map to the top of the layers
                mapbox.current.moveLayer(customMap.id);

                // the sidebar will deal with visibility, so we don't need to do that here
                // set the visibility
                mapbox.current.setLayoutProperty(customMap.id, 'visibility', 'none');
            }

            // done
            console.log("Custom map set: ", customMap.id);
        });
    }, [customMaps]);


    // custom map points useEffect
    useEffect(() => {
        // if the custom map points data changes then update the custom map points
        if (!mapbox.current) return; // wait for map to initialize
        if (!customMaps) return; // wait for custom maps to be set
        if (!customMapPoints) return; // wait for custom map points data to be set

        // set layer data
        // loop through dict and set the data
        console.log("Custom map points changed: ", customMapPoints)

        Object.keys(customMapPoints).forEach((mapId) => {
            console.log("Setting custom map points for ", mapId, ": ", customMapPoints[mapId]);
            mapbox.current.getSource(mapId).setData(customMapPoints[mapId]);
        });
    }, [customMapPoints]);

    // escape key handling
    useEffect(() => {
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                // first try to close streetview, if we can then return
                if (displayStreetView) {
                    setStreetViewPresent(false);
                    setDisplayStreetView(false);
                    setStreetViewPosition([]);
                    return;
                }

                // then try to close any open modals
                if (openModal) {
                    setOpenModal(false);
                    return;
                }

                // then try to close sidebar, if we can then return
                if (displaySidebar) {
                    setDisplaySidebar(false);
                    return;
                }

                if (rightClickPopup.isOpen()) {
                    rightClickPopup.remove();
                    return;
                }

                // then try to close custom map popup, if we can then return
                if (customMapPopup.isOpen()) {
                    customMapPopup.remove();
                }

            }
        }
        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener('keydown', handleKeydown);
        }
    }, [displaySidebar, displayStreetView, openModal]);

    // // dark mode useEffect
    // useEffect(() => {
    //     if (!mapbox.current) return; // wait for map to initialize
    //
    //     console.log("Dark mode changed: ", settings["darkMode"]);
    //
    //     // if map style is not loaded yet, then don't do anything
    //     // use .isStyleLoaded() to check
    //     if (!mapbox.current.isStyleLoaded()) return;
    //
    //     if (settings["darkMode"]) {
    //         // set style
    //         mapbox.current.setStyle('mapbox://styles/mapbox/dark-v10');
    //
    //         // set fog
    //         // mapbox.current.setFog(
    //         //     {
    //         //         'range': [5, 6],
    //         //         'horizon-blend': 0.3,
    //         //         'color': '#242B4B',
    //         //         'high-color': '#161B36',
    //         //         'space-color': '#0B1026',
    //         //         'star-intensity': .95
    //         //     }
    //         // )
    //
    //     } else {
    //         // set style
    //         mapbox.current.setStyle('mapbox://styles/mapbox/light-v10');
    //
    //         // set fog
    //         // mapbox.current.setFog(
    //         //     {
    //         //         'range': [5, 6],
    //         //         'horizon-blend': 0.3,
    //         //         'color': 'white',
    //         //         'high-color': '#add8e6',
    //         //         'space-color': '#d8f2ff',
    //         //         'star-intensity': 0.0
    //         //     })
    //         }
    //     }, [settings["darkMode"]]);

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

    const displayLabels = display => {
        if (!mapbox.current) return;
        mapbox.current.style.stylesheet.layers.forEach(function (layer) {
            if (layer.type === 'symbol' && layer["layout"] && layer["layout"]["text-field"])
                mapbox.current.setLayoutProperty(layer.id, "visibility", display ? "visible" : "none");
        });
    }

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

    const getCustomMapPoints = async (mapID) => {
        // get access token
        const accessToken = await getAccessTokenSilently();

        return await retrieveCustomMapPoints(accessToken, mapID);
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

    const setLayoutProperty = (layer, name, value) => {
        mapbox.current.setLayoutProperty(layer, name, value)
    }

    const getLayoutProperty = (layer, name) => {
        return mapbox.current.getLayoutProperty(layer, name);
    }

    const flyTo = (lat, long) => {
        mapbox.current.flyTo(
            { center: [long, lat], essential: true, zoom: 16 }
        )
    }

    return (
        <>
            <div id="map" ref={mapRef}></div>
            {<Sidebar mapStatus={!loading} expanded={displaySidebar && mapbox.current} setDisplaySidebar={setDisplaySidebar} setLayoutProperty={setLayoutProperty} getLayoutProperty={getLayoutProperty} showShadeMap={showShadeMap} setShowShadeMap={setShowShadeMap} showIsochrone={showIso} setShowIsochrone={setShowIso} customMapsData={customMaps} flyTo={flyTo} currentSelectedCustomMapPoint={currentSelectedCustomMapPoint} setCurrentSelectedCustomMapPoint={setCurrentSelectedCustomMapPoint} setOpenModal={setOpenModal} setModalType={setModalType} setModalSelectedCustomMapId={setModalSelectedCustomMapId} setModalSelectedCustomMapPointId={setModalSelectedCustomMapPointId} displayLabels={displayLabels} settings={settings} updateSettings={updateSettings} />}
            <Modal getAccessToken={getAccessTokenSilently} modalOpen={openModal} modalType={modalType} map={customMaps ? customMaps.maps.filter(map => map.id == modalSelectedCustomMapId)[0] : null} point={customMaps && modalSelectedCustomMapId != "" ? customMaps.maps.filter(map => map.id == modalSelectedCustomMapId)[0]?.points?.filter(point => point.id == modalSelectedCustomMapPointId)[0] : null} setOpenModal={setOpenModal} getMaps={getMaps} />

            {displayStreetView ? getStreetView() : ""}
            {streetViewPresent ? displayStreetViewDiv() : ""}
        </>
    );
}

export default Map;