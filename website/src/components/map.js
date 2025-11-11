import React, {useEffect, useRef, useState} from 'react';

import Sidebar from '../components/sidebar';
import Modal from './modal';
import { GetStreetView, DisplayStreetViewDiv } from './StreetViewComponent';
import { renderRightClickPopup } from './RightClickPopup';
import { renderCustomMapPopup } from './CustomMapPopup';
import { coordinatesGeocoder, mobileAndTabletCheck, displayLabelsUtil } from './map-utils';
import { addMapSources } from './map-sources';
import { setRoute, getIso, retrieveSunburstToken, getSunburstData } from './map-hooks';
import { setupAllEventHandlers } from './map-event-handlers';

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
import 'mapbox-gl/dist/mapbox-gl.css';
import 'react-datetime-picker/dist/DateTimePicker.css';

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

/* eslint-disable import/first */
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_API_KEY;

const shadeMap = new ShadeMap({
    date: new Date(),    // display shadows for current date
    color: '#0f1624',    // shade color
    opacity: 0.93,        // opacity of shade colors
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

// detect mobile browsers - use imported function
window.mobileAndTabletCheck = mobileAndTabletCheck;

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

    const towerRenderZoomLevel = 10.5;
    const towerExtrusionRenderZoomLevel = 11.5;
    const antennaRenderZoomLevel = 13.5;
    const antennaSearchRadius = 8000;
    const towerSearchRadius = 150000;


    const addSources = () => {
        addMapSources(
            mapbox.current,
            allTowersPoints,
            allTowerPolygons,
            antennaPoints,
            obstaclePoints,
            routingLine,
            towerRenderZoomLevel,
            towerExtrusionRenderZoomLevel,
            antennaRenderZoomLevel
        );
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

    // const getMap = async (mapName) => {
    //     const accessToken = await getAccessTokenSilently();
    //     const { data, error } = await fetchMap(accessToken, mapName);
    //     if (data) {
    //         // ok here we need to look at customMaps and get the map from the dict and then modify it
    //     }
    //     if (error) {
    //         console.log(error);
    //     }
    // }

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

        // Setup all event handlers using extracted module
        setupAllEventHandlers(
            mapbox.current,
            window.mobileAndTabletCheck,
            setDisplaySidebar,
            setStreetViewPosition,
            setDisplayStreetView,
            setRightClickPopupPosition,
            setShowRightClickPopup,
            setRightClickPopupState
        );

        mapbox.current.on('moveend', () => {
            let zoomlevel = mapbox.current.getZoom();
            if (zoomlevel >= (towerRenderZoomLevel - .1)) {
                if (mapbox.current.getLayoutProperty('All Towers', 'visibility') === 'visible') {
                    // update all towers from the center of the map
                    updateAllTowers(mapbox.current.getCenter().lat, mapbox.current.getCenter().lng);
                }
                if (mapbox.current.getLayoutProperty('FAA Obstacles', 'visibility') === 'visible') {
                    updateObstacles(mapbox.current.getCenter().lat, mapbox.current.getCenter().lng);
                }

                if (zoomlevel >= (antennaRenderZoomLevel - .1)) {
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

    // Use imported popup render function
    const renderRightClickPopupWrapper = (state) => {
        renderRightClickPopup(
            state,
            rightClickPopupPosition,
            setRightClickPopupState,
            setHomePosition,
            setShowRightClickPopup,
            homeIsSet,
            setRoutingLineEnd,
            customMaps,
            newPointMap,
            setNewPointMap,
            saveNewPoint,
            routingDuration,
            routingDistance,
            setRoutingLine,
            rightClickPopup
        );
    }

    useEffect(() => {
        if (rightClickPopupState === "new-point") {
            renderRightClickPopupWrapper("new-point");
        }
    }, [newPointMap]);

    // Use imported custom map popup render function
    const renderCustomMapPopupWrapper = (state, properties, coordinates) => {
        renderCustomMapPopup(
            state,
            properties,
            coordinates,
            customMapPopup,
            setCustomMapPopupState,
            homeIsSet,
            setRoutingLineEnd,
            savePoint,
            setShowCustomMapPopup,
            removePoint,
            routingDuration,
            routingDistance,
            setRoutingLine
        );
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
            // dispatch(showSuccessSnackbar("Success!"));
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



    const updateAllTowers = async (lat, lng) => {
        const accessToken = await getAccessTokenSilently();
        console.log("updateAllTowers");
        await retrieveTowers(accessToken, lat, lng, towerSearchRadius).then(
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
        await retrieveAntennas(accessToken, lat, lng, antennaSearchRadius, settingsRef.current["showUls"]).then(
            (response) => {
                if (response.data)
                    setAntennaPoints(response.data.antennas);
            }
        )
    }

    const updateObstacles = async (lat, lng) => {
        const accessToken = await getAccessTokenSilently();
        await retrieveObstacles(accessToken, lat, lng, towerSearchRadius).then(
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
        renderRightClickPopupWrapper(rightClickPopupState);
    }, [rightClickPopupPosition]);

    // right click state useeffect
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!showRightClickPopup) return; // if we don't want to show the popup, then don't do anything

        renderRightClickPopupWrapper(rightClickPopupState);
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

        renderCustomMapPopupWrapper(customMapPopupState, customMapPopupProperties, customMapPopupPosition);

    }, [customMapPopupState]);

    // custom map popup properties useeffect
    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (!showCustomMapPopup) return; // if we don't want to show the popup, then don't do anything

        console.log("Custom map popup properties changed to ", customMapPopupProperties);

        renderCustomMapPopupWrapper(customMapPopupState, customMapPopupProperties, customMapPopupPosition);
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

        getIso(homeMarkerPosition, settings).then((data) => {
            console.log(data)
            // set the layer to be visible
            mapbox.current.setLayoutProperty('Isochrone', 'visibility', 'visible');
            mapbox.current.getSource('Isochrone').setData(data);
        });
    }, [homeMarkerPosition, settings["isoMinutes"], settings["isoProfile"], showIso]);




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
        setRoute(homeMarkerPosition, routingLineEnd, isoProfile, setRoutingDuration, setRoutingDistance, setRoutingLine).then(r => {
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
            retrieveSunburstTokenWrapper().then(() => {
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
        displayLabelsUtil(mapbox.current, display);
    }

    // Use imported retrieveSunburstToken and getSunburstData from map-hooks
    const retrieveSunburstTokenWrapper = async () => {
        const token = await retrieveSunburstToken();
        setSunburstToken(token);
    }

    const getCustomMapPoints = async (mapID) => {
        // get access token
        const accessToken = await getAccessTokenSilently();

        return await retrieveCustomMapPoints(accessToken, mapID);
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

            {displayStreetView ? <GetStreetView streetViewPosition={streetViewPosition} setStreetViewPresent={setStreetViewPresent} setDisplayStreetView={setDisplayStreetView} /> : ""}
            {streetViewPresent ? <DisplayStreetViewDiv streetViewPosition={streetViewPosition} displayStreetView={displayStreetView} setDisplayStreetView={setDisplayStreetView} setStreetViewPosition={setStreetViewPosition} setStreetViewPresent={setStreetViewPresent} /> : ""}
        </>
    );
}

export default Map;