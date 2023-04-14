import React, {useState, useEffect, createRef, useRef} from 'react';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from "@mapbox/mapbox-gl-draw";

// css
import '../styles/components/map.css';
import '../styles/components/sidebar.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

// api imports
import {fetchPoints} from "../services/message.service";

import {useAuth0} from "@auth0/auth0-react";


mapboxgl.accessToken = "pk.eyJ1Ijoid2NzaGFtYmxpbiIsImEiOiJjbGZ6bHhjdWIxMmNnM2RwNmZidGx3bmF6In0.Lj_dbKJfWQ6v9RxSC-twHw";

function Map() {
    const mapRef = useRef(null);
    const mapbox = useRef(null);
    const [displaySidebar, setDisplaySidebar] = useState(false);
    const [selectedBaseLayer, setSelectedBaseLayer] = useState("Google Hybrid");
    const [selectedLayers, setSelectedLayers] = useState([]);

    const baseLayers = {
        "Google Hybrid": {"visible": true},
        "Bing Hybrid": {"visible": false},
        "ESRI": {"visible": false},
        "OpenStreetMap": {"visible": false},
    }

    const layers = {
        "Decommissioned Towers": {"visible": false},
        "Safe Towers": {"visible": false},
    }



    const [points, setPoints] = useState([]);

    const { getAccessTokenSilently } = useAuth0();

    // menu toggle
    const [menuOpen, setMenuOpen] = useState(true);

    // menu initialized to false
    const [menuInitialized, setMenuInitialized] = useState(false);

    // toggle menu
    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };


    // determine if the user's local time is between 6pm and 6am
    const isNight = new Date().getHours() > 18 || new Date().getHours() < 6;
    // this will be used to adjust fog color later.
    console.log("isNight");
    console.log(isNight, new Date().getHours());

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
            // 'PlacesToExplore'
        );

        mapbox.current.addLayer(
            {
                'id': 'Bing Hybrid',
                'type': 'raster',
                'source': '01',
                'paint': {}
            },
            // 'PlacesToExplore'
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
            }
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
    }, [points])

    useEffect(() => {
        if (mapbox.current) return; // initialize map only once
        // initialize map
        mapbox.current = new mapboxgl.Map({
                container: mapRef.current,
                style: 'mapbox://styles/mapbox/streets-v11',
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
            addSources()
        });


            mapbox.current.on('click', 'Safe Towers', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const name = e.features[0].properties.name;
                const description = e.features[0].properties.description;
                console.log("description: ", description);


                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML("<text id='towerpopuptitle'>Safe tower: " + name + "</text><text id='towerpopup'>" + description + "</text>" + "<text id='towerpopupcoords'>" + coordinates + "</text>")
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
                        "<text id='towerpopuptext'>" + height + "</text>" +
                        "<text id='towerpopupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
                    .addTo(mapbox.current);
            });

            mapbox.current.on('mouseenter', 'Decommissioned Towers', () => {
                mapbox.current.getCanvas().style.cursor = 'pointer';
            });

            mapbox.current.on('mouseleave', 'Decommissioned Towers', () => {
                mapbox.current.getCanvas().style.cursor = '';
            });


        // controls
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


    const getSidebar = () => {  
        if (!mapbox.current) return; // wait for map to initialize
        if (menuInitialized) return; // initialize menu only once

        return (
            <div id="menu">
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
            mapbox.current.setLayoutProperty(clickedLayerId, 'visibility', 'none');
            setSelectedLayers(selectedLayers.filter(layerId => layerId != clickedLayerId));
        }
        else {
            mapbox.current.setLayoutProperty(clickedLayerId, 'visibility', 'visible');
            setSelectedLayers([...selectedLayers, clickedLayerId]);
        }
    }

    const extrudeTowers = () => {
    }



    return (
        // <ReactMapGL
        //     mapboxAccessToken="pk.eyJ1Ijoid2NzaGFtYmxpbiIsImEiOiJjbGZ6bHhjdWIxMmNnM2RwNmZidGx3bmF6In0.Lj_dbKJfWQ6v9RxSC-twHw"
        //     mapStyle="mapbox://styles/mapbox/satellite-v9"
        //     {...viewport}
        //     onMove={evt => setViewport(evt.viewport)}
        // />

        // layer control
        <>
            <div id="map" ref={mapRef}>
                <button onClick={() => setDisplaySidebar(!displaySidebar)} style={{"color": "black", "position": "absolute", "zIndex": "999"}}>Sidebar</button>
            </div>
            {displaySidebar ? getSidebar() : ""}
        </>
    );
}

export default Map;