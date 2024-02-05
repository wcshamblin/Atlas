import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom/client';

import Sidebar from '../components/sidebar';

import mapboxgl from 'mapbox-gl';

// search control @mapbox/search-js-react
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import ShadeMap from 'mapbox-gl-shadow-simulator';

// css
import '../styles/components/map.css';
import '../styles/components/sidebar.css';
import '../styles/components/layerswitcher.css'
import '../styles/components/rightclickpopup.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import 'react-datetime-picker/dist/DateTimePicker.css';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {
    faArrowLeft, faExternalLinkAlt,
    faFloppyDisk,
    faHome,
    faInfo,
    faMapMarkerAlt,
    faPenToSquare,
    faRoute,
    faTrash
} from '@fortawesome/free-solid-svg-icons'

// api imports
import {
    deletePoint,
    fetchMaps,
    postPoint,
    putPoint,
    retrieveAntennas, retrieveAstronomyData,
    retrieveCustomMapPoints,
    retrieveHome,
    retrieveTowers,
    retrieveObstacles,
    setHome
} from "../services/message.service";

import {useAuth0} from "@auth0/auth0-react";

import {GoogleMap, LoadScript, StreetViewPanorama, StreetViewService} from '@react-google-maps/api';
import Modal from './modal';

/* eslint-disable import/first */
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;


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

// detect mobile browsers
window.mobileAndTabletCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

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

    const [astronomyInfo, setAstronomyInfo] = useState(null);
    const [sunburstInfo, setSunburstInfo] = useState(null);
    const [sunburstToken, setSunburstToken] = useState(null);
    const [showShadeMap, setShowShadeMap] = useState(false);

    const [allTowersPoints, setAllTowersPoints] = useState(null);
    const [allTowerPolygons, setAllTowerPolygons] = useState(null);

    const [antennaPoints, setAntennaPoints] = useState(null);

    const [obstaclePoints, setObstaclePoints] = useState(null);

    const [mapDatetime, setMapDatetime] = useState(new Date());

    const [pollingPosition, setPollingPosition] = useState([]);

    const [shadeMapObject, setShadeMapObject] = useState(shadeMap);

    const [customMaps, setCustomMaps] = useState(null);
    const [customMapPoints, setCustomMapPoints] = useState({});
    const [currentSelectedCustomMapPoint, setCurrentSelectedCustomMapPoint] = useState({});
    const [modalSelectedCustomMapId, setModalSelectedCustomMapId] = useState("");
    const [modalSelectedCustomMapPointId, setModalSelectedCustomMapPointId] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [modalType, setModalType] = useState("mapAdd");

    const [pointFilters, setPointFilters] = useState({});
    const [newPointMap, setNewPointMap] = useState(null);

    const settingsRef = useRef({});
    const [settings, setSettings] = useState({});

    // dealing with mobile right clicks


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
            'tileSize': 256,
            'maxzoom': 20
        });

        // https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/2168/20/411560/294463?blankTile=false
        mapbox.current.addSource('ESRI', {
            'type': 'raster',
            'tiles': [
                'https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/{z}/{y}/{x}?blankTile=false',
                'https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/{z}/{y}/{x}?blankTile=false',
                'https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/{z}/{y}/{x}?blankTile=false'
            ],
            'tileSize': 256,
            'maxzoom': 20
        });
        
        mapbox.current.addSource('ESRI Clarity', {
            'type': 'raster',
            'tiles': [
                'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false',
                'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false',
                'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false'
            ],
            'tileSize': 256,
            'maxzoom': 20
        });

        mapbox.current.addSource('Mapbox', {
            'type': 'raster',
            'tiles': [
                'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=' + process.env.REACT_APP_MAPBOX_API_KEY
            ],
            'tileSize': 256,
            'maxzoom': 20
        });

        mapbox.current.addSource('Lantmäteriet', {
            'type': 'raster',
            'tiles': [
                'https://minkarta.lantmateriet.se/map/ortofoto?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=Ortofoto_0.5%2COrtofoto_0.4%2COrtofoto_0.25%2COrtofoto_0.16&TILED=true&STYLES=&WIDTH=256&HEIGHT=256&SRS=EPSG%3A3857&BBOX={bbox-epsg-3857}'
            ],
            'tileSize': 256,
            'maxzoom': 20
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
                'https://maps.iflightplanner.com/Maps/Tiles/Sectional/Z{z}/{y}/{x}.png'
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

        mapbox.current.addSource('USGS Topo', {
            'type': 'raster',
            'tiles': [
                'https://caltopo.s3.amazonaws.com/topo/{z}/{x}/{y}.png'
            ],
            'tileSize': 256
        });

        mapbox.current.addSource('Sentinel 2-L2A', {
            'type': 'raster',
            'tiles': [
                'https://atlas2.org/api/sentinel/{bbox-epsg-3857}'
            ],
            'tileSize': 256,
            'maxzoom': 18
        });



        // all towers source
        mapbox.current.addSource('All Towers', {
            'type': 'geojson',
            'data': allTowersPoints
        });

        mapbox.current.on('mouseenter', 'All Towers', () => {
            mapbox.current.getCanvas().style.cursor = 'pointer';
        });
        mapbox.current.on('mouseleave', 'All Towers', () => {
            mapbox.current.getCanvas().style.cursor = '';
        });

        mapbox.current.loadImage('https://i.imgur.com/qfS0mnq.png', (error, image) => {
            if (error) throw error;
            mapbox.current.addImage('tower-icon', image, { sdf: true });
        });

        // all towers layer
        mapbox.current.addLayer({
            'id': 'All Towers',
            'type': 'symbol',
            'layout': {
                'icon-image': 'tower-icon',
                'icon-size': 1,
            },
            'source': 'All Towers',
            'minzoom': 11.5,
            'paint': {
                'icon-color': ['get', 'color'],
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
            'minzoom': 11.5,
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
            'minzoom': 15,
            'paint': {
                'icon-color': ['get', 'color'],
            }
        });

        // obstacles source
        mapbox.current.addSource('FAA Obstacles', {
            'type': 'geojson',
            'data': obstaclePoints
        });

        // obstacles layer
        mapbox.current.on('mouseenter', 'FAA Obstacles', () => {
            mapbox.current.getCanvas().style.cursor = 'pointer';
        });

        mapbox.current.on('mouseleave', 'FAA Obstacles', () => {
            mapbox.current.getCanvas().style.cursor = '';
        });

        mapbox.current.loadImage('https://i.imgur.com/kFZOjAw.png', (error, image) => {
            if (error) throw error;
            mapbox.current.addImage('obstacle-icon', image, { sdf: true });
        });

        mapbox.current.addLayer({
            'id': 'FAA Obstacles',
            'type': 'symbol',
            'layout': {
                'icon-image': 'obstacle-icon',
                'icon-size': 1,
            },
            'source': 'FAA Obstacles',
            'minzoom': 11.5,
            'paint': {
                'icon-color': '#000000',
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

        // add germany tallest objects
        let germany_tallest = require('./germany_tall_structures.geojson');
        mapbox.current.addSource('Germany Tall Structures', {
            'type': 'geojson',
            'data': germany_tallest
        });

        mapbox.current.addLayer({
            'id': 'Germany Tall Structures',
            'type': 'circle',
            'source': 'Germany Tall Structures',
            'paint': {
                'circle-radius': 6,
                'circle-color': '#62b031',
            }
        });

        // add germany tallest objects extrusions
        let germany_tallest_extrusions = require('./germany_tall_structures_polygons.geojson');
        mapbox.current.addSource('Germany Tall Structures Extrusions', {
            'type': 'geojson',
            'data': germany_tallest_extrusions
        });

        mapbox.current.addLayer({
            'id': 'Germany Tall Structures Extrusions',
            'type': 'fill-extrusion',
            'source': 'Germany Tall Structures Extrusions',
            'minzoom': 12,
            'paint': {
                'fill-extrusion-color': "#62b031",
                'fill-extrusion-height': ['get', 'height_meters'],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.8
            }
        });

        // add National Register Of Historic Places (NRHP)
        let nrhp = require('./nrhp.geojson');
        mapbox.current.addSource('National Register of Historic Places', {
            'type': 'geojson',
            'data': nrhp
        });

        mapbox.current.addLayer({
            'id': 'National Register of Historic Places',
            'type': 'circle',
            'source': 'National Register of Historic Places',
            'paint': {
                'circle-radius': 6,
                'circle-color': ['get', 'color'],
            }
        });

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
                'id': 'ESRI Clarity',
                'type': 'raster',
                'source': 'ESRI Clarity',
                'paint': {}
            },
        );

        mapbox.current.addLayer(
            {
                'id': 'Mapbox',
                'type': 'raster',
                'source': 'Mapbox',
                'paint': {}
            },
        );

        mapbox.current.addLayer(
            {
                'id': 'Lantmäteriet',
                'type': 'raster',
                'source': 'Lantmäteriet',
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
                'id': 'USGS Topo',
                'type': 'raster',
                'source': 'USGS Topo',
                'paint': {}
            },
        );

        mapbox.current.addLayer(
            {
                'id': 'Sentinel 2-L2A',
                'type': 'raster',
                'source': 'Sentinel 2-L2A',
                'paint': {}
            }
        )

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
            setCustomMaps(data);
        }
        if (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (mapbox.current) return; // initialize map only once

        // initialize map
        let style = 'mapbox://styles/mapbox/dark-v10';
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

        mapbox.current.on('click', 'Germany Tall Structures', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            // round to 6 decimal places
            coordinates[0] = coordinates[0].toFixed(6);
            coordinates[1] = coordinates[1].toFixed(6);
            const name = e.features[0].properties.name;
            const height_feet = e.features[0].properties.height_feet;
            const height_meters = e.features[0].properties.height_meters;
            const year = e.features[0].properties.year;
            const type = e.features[0].properties.type;
            const regards = e.features[0].properties.regards;


            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML("<text id='towerpopuptitle'>" + name + "</text>" +
                    "<text id='towerpopuptext'>Height: " + height_meters + "m (" + height_feet + "ft)<br>" +
                    "Type: " + type + "<br>" +
                    (year ? "Constructed in " + year + "<br>" : "") +
                    regards + "</text>" +
                    "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
                .addTo(mapbox.current);
        });

        mapbox.current.on('mouseenter', 'Germany Tall Structures', () => {
            mapbox.current.getCanvas().style.cursor = 'pointer';
        });
        mapbox.current.on('mouseleave', 'Germany Tall Structures', () => {
            mapbox.current.getCanvas().style.cursor = '';
        });
        

        mapbox.current.on('click', 'Long Lines', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
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

        mapbox.current.on('click', 'National Register of Historic Places', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            coordinates[0] = coordinates[0].toFixed(6);
            coordinates[1] = coordinates[1].toFixed(6);
            const name = e.features[0].properties.name;
            const type = e.features[0].properties.type;
            const src_date = e.features[0].properties.src_date;

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(
                    "<text id='towerpopuptitle'>" + name + "</text>" +
                    "<text id='towerpopuptext'>Type: " + type + "</text>" +
                    "<text id='towerpopupstat'>Source date: " + src_date + "</text>" +
                    "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
                .addTo(mapbox.current);
        });

        mapbox.current.on('mouseenter', 'National Register of Historic Places', () => {
            mapbox.current.getCanvas().style.cursor = 'pointer';
        });

        mapbox.current.on('mouseleave', 'National Register of Historic Places', () => {
            mapbox.current.getCanvas().style.cursor = '';
        });

        mapbox.current.on('click', 'All Towers', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            coordinates[0] = coordinates[0].toFixed(6);
            coordinates[1] = coordinates[1].toFixed(6);
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
            coordinates[0] = coordinates[0].toFixed(6);
            coordinates[1] = coordinates[1].toFixed(6);
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
                    "RabbitEars: " + "<a id='rabbitearslink' target=_blank href='" + e.features[0].properties.RabbitEars + "'>" + facility_id + "</a>" + "<br>" +
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

        // oas_number, type_code, agl, amsl, lighting, marking, study, date
        mapbox.current.on('click', 'FAA Obstacles', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            coordinates[0] = coordinates[0].toFixed(6);
            coordinates[1] = coordinates[1].toFixed(6);
            const oas_number = e.features[0].properties.oas_number;
            const type_code = e.features[0].properties.type_code;
            const agl = e.features[0].properties.agl;
            const amsl = e.features[0].properties.amsl;
            const lighting = e.features[0].properties.lighting;
            const marking = e.features[0].properties.marking;
            const study = e.features[0].properties.study;
            const date = e.features[0].properties.date;

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(
                    "<text id='towerpopuptitle'>FAA Obstacle: " + oas_number + "</text>" +
                    "<text id='towerpopuptext'>Type: " + type_code + "<br>" +
                    "AGL: " + agl + " ft" + "<br>" +
                    "AMSL: " + amsl + " ft" + "<br>" +
                    "Lighting: " + lighting + "<br>" +
                    "Marking: " + marking + "<br>" +
                    "Study: " + study + "<br>" +
                    "Date: " + date + "</text>" +
                    "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
                .addTo(mapbox.current);
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
        if (window.mobileAndTabletCheck()) {
            init_mobile_contextmenu();
        } else {
            mapbox.current.on('contextmenu', (e) => {
                setRightClickPopupPosition([e.lngLat.lng, e.lngLat.lat])
                setShowRightClickPopup(true);
                setRightClickPopupState("default");
            });
        }

        function init_mobile_contextmenu() {
            let iosTimeout = null;
            let clearIosTimeout = () => { clearTimeout(iosTimeout); };

            mapbox.current.on('touchstart', (e) => {
                if (e.originalEvent.touches.length > 1) {
                    return;
                }
                iosTimeout = setTimeout(() => {
                    setRightClickPopupPosition([e.lngLat.lng, e.lngLat.lat])
                    setShowRightClickPopup(true);
                    setRightClickPopupState("default");
                }, 250);
            });
            mapbox.current.on('touchend', clearIosTimeout);
            mapbox.current.on('touchcancel', clearIosTimeout);
            mapbox.current.on('touchmove', clearIosTimeout);
            mapbox.current.on('pointerdrag', clearIosTimeout);
            mapbox.current.on('pointermove', clearIosTimeout);
            mapbox.current.on('moveend', clearIosTimeout);
            mapbox.current.on('gesturestart', clearIosTimeout);
            mapbox.current.on('gesturechange', clearIosTimeout);
            mapbox.current.on('gestureend', clearIosTimeout);
        }

        // on move, if zoom is above 14, try to update towers and / or antennas
        mapbox.current.on('moveend', () => {
            let zoomlevel = mapbox.current.getZoom();
            if (zoomlevel >= 11.4) {
                if (mapbox.current.getLayoutProperty('All Towers', 'visibility') === 'visible') {
                    // update all towers from the center of the map
                    updateAllTowers(mapbox.current.getCenter().lat, mapbox.current.getCenter().lng);
                }
                if (mapbox.current.getLayoutProperty('FAA Obstacles', 'visibility') === 'visible') {
                    updateObstacles(mapbox.current.getCenter().lat, mapbox.current.getCenter().lng);
                }

                if (zoomlevel >= 15) {
                    if (mapbox.current.getLayoutProperty('Antennas', 'visibility') === 'visible') {
                        updateAntennas(mapbox.current.getCenter().lat, mapbox.current.getCenter().lng);
                    }
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

    const renderCoordinatesSegment = (coordinates) => {
        console.log("rendering coordinates segment with coordinates: ", coordinates);
        let lat = coordinates[1].toFixed(6);
        let lng = coordinates[0].toFixed(6);

        return <button id="coordinatesbutton" onClick={() => {
            navigator.clipboard.writeText(lat + ", " + lng);
        }}><text id="popupcoords">{lat}, {lng}</text></button>
    }

    // const renderButtons = () => {

    const renderRightClickPopup = (state) => {
        const placeholder = document.createElement('div');

        if (state === "default") {
            ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
                <div id="rightclickpopupbuttons">
                    <button id="rightclickpopupbutton" onClick={() => {
                        setRightClickPopupState("external");
                    }}><FontAwesomeIcon icon={faExternalLinkAlt} />
                    </button>
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
                {renderCoordinatesSegment([rightClickPopupPosition][0])}
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

                    }}><FontAwesomeIcon icon={faFloppyDisk} />
                    </button>
                    <button id="rightclickpopupbutton" onClick={() => {
                        setRightClickPopupState("default");
                    }}><FontAwesomeIcon icon={faArrowLeft} />
                    </button>

                </div>
                {renderCoordinatesSegment([rightClickPopupPosition][0])}
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
                {renderCoordinatesSegment([rightClickPopupPosition][0])}
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
                    {renderCoordinatesSegment([rightClickPopupPosition][0])}
            </div>
            );
        } if (state === "external") {
            // window.open("http://maps.google.com/maps?t=k&q=loc:" + rightClickPopupPosition[1] + "+" + rightClickPopupPosition[0]);
            ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
                <text id="rightclickpopup-routing-state">External Maps</text><br />
                <div id="rightclickpopupexternallinks">
                {/* links */}
                    <a href={"http://maps.google.com/maps?t=k&q=loc:" + rightClickPopupPosition[1] + "+" + rightClickPopupPosition[0]} target="_blank" rel="noreferrer">
                        <FontAwesomeIcon icon={faExternalLinkAlt} /> Google Maps
                    </a><br/>
                    <a href={"https://www.bing.com/maps?cp=" + rightClickPopupPosition[1] + "~" + rightClickPopupPosition[0] + "&lvl=15.9&style=h"} target="_blank" rel="noreferrer">
                        <FontAwesomeIcon icon={faExternalLinkAlt} /> Bing Maps
                    </a><br />
                    <a href={"https://livingatlas.arcgis.com/wayback/#mapCenter=" + rightClickPopupPosition[0] + "%2C" + rightClickPopupPosition[1] + "%2C17"} target="_blank" rel="noreferrer">
                        <FontAwesomeIcon icon={faExternalLinkAlt} /> ArcGIS Wayback
                    </a><br />
                </div>
                    <div id="rightclickpopupbuttons">
                        <button id="rightclickpopupbutton" onClick={() => {
                            setRightClickPopupState("default");
                            setRoutingLine(null);
                        }}><FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                    </div>
                    {renderCoordinatesSegment([rightClickPopupPosition][0])}
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
                {renderCoordinatesSegment(coordinates)}
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
                {renderCoordinatesSegment(coordinates)}
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
                {renderCoordinatesSegment(coordinates)}
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
                {renderCoordinatesSegment(coordinates)}
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
                {renderCoordinatesSegment(coordinates)}
            </div>);
        }

        customMapPopup.setDOMContent(placeholder);
    }

    function ConvertDMSToDD(degrees, minutes, seconds, direction) {
        let dd = degrees + minutes/60 + seconds/(60*60);

        if (direction.toUpperCase() === "S" || direction.toUpperCase() === "W") {
            dd = dd * -1;
        } // Don't do anything for N or E
        return dd;
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


    const coordinatesGeocoder = function (query) {
        const matches = query.match(
            /(?:((?:[-+]?\d{1,2}[.]\d+),\s*(?:[-+]?\d{1,3}[.]\d+))|(\d{1,3}°\d{1,3}'\d{1,3}\.\d\"[N|S]\s\d{1,3}°\d{1,3}'\d{1,3}\.\d\"[E|W]))/
        );

        if (!matches) {
            return null;
        }

        let lat;
        let lng;

        // if match 0 has a , in it, it's lat, lng
        try {
            if (matches[0].includes(",")) {
                lat = parseFloat(matches[0].split(",")[0]);
                lng = parseFloat(matches[0].split(",")[1]);
            } else {
                // it's a dms
                let parts =  matches[0].split(/(\d+)°(\d+)'(\d+\.\d+)\"([NSns]) (\d+)°(\d+)'(\d+\.\d+)\"([EWew])/);
                lat = ConvertDMSToDD(parseInt(parts[1]), parseInt(parts[2]), parseFloat(parts[3]), parts[4]);
                lng = ConvertDMSToDD(parseInt(parts[5]), parseInt(parts[6]), parseFloat(parts[7]), parts[8]);
            }
        } catch (e) {
            console.log("error parsing coordinates: " + e);
            return null;
        }

        // round to 6 decimal places
        lat = lat.toFixed(6);
        lng = lng.toFixed(6);

        return [coordinateFeature(lng, lat)];

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

        // close popup
        setRightClickPopupState("default");
        setShowRightClickPopup(false);

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
                radius: 10,
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
                                addressControl: true,
                                fullscreenControl: false,
                                linksControl: false,
                                motionTrackingControl: false,
                                motionTrackingControlOptions: false,
                                panControl: true,
                                zoomControl: false,
                                enableCloseButton: false,
                                imageDateControl: true
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
        await retrieveTowers(accessToken, lat, lng, 60000).then(
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

    const updateObstacles = async (lat, lng) => {
        const accessToken = await getAccessTokenSilently();
        await retrieveObstacles(accessToken, lat, lng, 60000).then(
            (response) => {
                if (response.data)
                    setObstaclePoints(response.data.obstacles);
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
            console.log("Home marker set, setting homeIsSet to true, and centering map");
            setPollingPosition([homeMarkerPosition[0], homeMarkerPosition[1]]);

            // fly to the home marker
            mapbox.current.flyTo({
                center: [homeMarkerPosition[0], homeMarkerPosition[1]],
                zoom: 11.6
            });

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

    // obstacles useEffect
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!obstaclePoints) return; // wait for obstacles data to be set

        mapbox.current.getSource('FAA Obstacles').setData(obstaclePoints);

    }, [obstaclePoints]);


    // custom maps useeffect, update when custom maps change
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!customMaps) return; // wait for custom maps to be set

        // iterate through the custom maps, add the source and layer, and if the layer is enabled (localstorage), get the data and set it
        console.log("Setting custom maps: ", customMaps);
        customMaps.maps.forEach((customMap) => {
            setPointFilters((customFilters) => {
                return {
                    ...customFilters,
                    [customMap.id]: {"name": "", "category": "", "color": "", "icon": ""}
                }
            });
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
                        'icon-halo-blur': .1,
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
            let newMapPoints = JSON.parse(JSON.stringify(customMapPoints[mapId]));

            newMapPoints.features = newMapPoints.features.filter(feature => (feature.properties.name.toLowerCase().includes(pointFilters[mapId].name.toLowerCase())
                    || (feature.properties.description && feature.properties.description.toLowerCase().includes(pointFilters[mapId].name.toLowerCase())))
                && (pointFilters[mapId].category !== "" ? feature.properties.category === pointFilters[mapId].category : true)
                && (pointFilters[mapId].color !== "" ? feature.properties.color === pointFilters[mapId].color : true)
                && (pointFilters[mapId].icon !== "" ? feature.properties.icon === pointFilters[mapId].icon : true))

            console.log("Setting custom map points for ", mapId, ": ", customMapPoints[mapId]);
            mapbox.current.getSource(mapId).setData(newMapPoints);
        });
    }, [customMapPoints, pointFilters]);

    const updatePointFilters = (mapId, filterType, value) => {
        setPointFilters((pointFilters) => {
            return {
                ...pointFilters,
                [mapId]: { ...pointFilters[mapId], [filterType]: value }
            }
        });
    }

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

                if (rightClickPopup.isOpen()) {
                    rightClickPopup.remove();
                    return;
                }

                // then try to close custom map popup, if we can then return
                if (customMapPopup.isOpen()) {
                    customMapPopup.remove();
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
    }, [displaySidebar, displayStreetView, openModal]);

    // sunburst home info - update on polling position change or map datetime change
    useEffect(() => {
        console.log("useEffect for sunburst home info: ", pollingPosition, mapDatetime, sunburstToken);
        if (!mapbox.current) return; // wait for map to initialize

        if (!sunburstToken) {
            retrieveSunburstToken().then(() => {
                console.log("Sunburst token retrieved: ", sunburstToken);
            });
            return;
        }

        if (!pollingPosition.length) return;

        getSunburstData(pollingPosition[1], pollingPosition[0], mapDatetime.toISOString(), sunburstToken).then((data) => {
            setSunburstInfo(data);
        });
    }, [pollingPosition, mapDatetime, sunburstToken]);

    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize

        // make sure polling position is set
        if (!pollingPosition.length) return;

        let date = mapDatetime.toISOString().split("T")[0]

        let utcdifference = -(mapDatetime.getTimezoneOffset() / 60)


        retrieveAstronomyData(utcdifference, date, pollingPosition[1], pollingPosition[0]).then((data) => {
            setAstronomyInfo(data.data);
        });
    }, [pollingPosition, mapDatetime]);

    const displayLabels = display => {
        if (!mapbox.current) return;
        mapbox.current.style.stylesheet.layers.forEach(function (layer) {
            if (layer.type === 'symbol' && layer["layout"] && layer["layout"]["text-field"])
                mapbox.current.setLayoutProperty(layer.id, "visibility", display ? "visible" : "none");
        });
    }

    async function retrieveSunburstToken() {
        const query = await fetch(
            `https://sunburst.sunsetwx.com/v1/login`,
            {
                method: 'POST',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Basic ${btoa(`${process.env.REACT_APP_SUNBURST_API_EMAIL}:${process.env.REACT_APP_SUNBURST_API_PASSWORD}`)}`
                },
                body: "grant_type=password&type=access"
            });

        const data = await query.json();
        setSunburstToken(data.access_token);
    }

    // sunburst API fetch
    const getSunburstData = async (lat, lng, after, token) => {
        const query = await fetch(
            `https://sunburst.sunsetwx.com/v1/quality?geo=${lat},${lng}&after=${after}`,
            {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await query.json();
        console.log("Sunburst retrieved data: ", data);
        return data;
    }

    const getCustomMapPoints = async (mapID) => {
        // get access token
        const accessToken = await getAccessTokenSilently();

        return await retrieveCustomMapPoints(accessToken, mapID);
    }


    const getWeatherInfo = async (lat, lng, datetime) => {
        let weatherToken = process.env.REACT_APP_WEATHER_API_TOKEN;

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
            <Sidebar 
                mapStatus={!loading} 
                expanded={displaySidebar && mapbox.current} 
                setDisplaySidebar={setDisplaySidebar} 
                setLayoutProperty={setLayoutProperty} 
                getLayoutProperty={getLayoutProperty}
                showShadeMap={showShadeMap} 
                setShowShadeMap={setShowShadeMap} 
                showIsochrone={showIso} 
                setShowIsochrone={setShowIso} 
                customMapsData={customMaps}
                sunburstInfo={sunburstInfo}
                flyTo={flyTo}
                map={mapbox.current}
                pollingPosition={pollingPosition}
                setPollingPosition={setPollingPosition}
                mapDatetime={mapDatetime}
                setMapDatetime={setMapDatetime}
                astronomyInfo={astronomyInfo}
                currentSelectedCustomMapPoint={currentSelectedCustomMapPoint} 
                setCurrentSelectedCustomMapPoint={setCurrentSelectedCustomMapPoint} 
                setOpenModal={setOpenModal} 
                setModalType={setModalType} 
                setModalSelectedCustomMapId={setModalSelectedCustomMapId} 
                setModalSelectedCustomMapPointId={setModalSelectedCustomMapPointId} 
                displayLabels={displayLabels} 
                settings={settings} 
                updateSettings={updateSettings}
                pointFilters={pointFilters}
                updatePointFilters={updatePointFilters}
            />
            <Modal getAccessToken={getAccessTokenSilently} modalOpen={openModal} modalType={modalType} map={customMaps ? customMaps.maps.filter(map => map.id == modalSelectedCustomMapId)[0] : null} point={customMaps && modalSelectedCustomMapId != "" ? customMaps.maps.filter(map => map.id == modalSelectedCustomMapId)[0]?.points?.filter(point => point.id == modalSelectedCustomMapPointId)[0] : null} setOpenModal={setOpenModal} getMaps={getMaps} />

            {displayStreetView ? getStreetView() : ""}
            {streetViewPresent ? displayStreetViewDiv() : ""}
        </>
    );
}

export default Map;