import React, {useState, useEffect, createRef, useRef} from 'react';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// css
import '../styles/components/map.css';

// api imports
import {fetchPoints} from "../services/message.service";

import {useAuth0} from "@auth0/auth0-react";

mapboxgl.accessToken = "pk.eyJ1Ijoid2NzaGFtYmxpbiIsImEiOiJjbGZ6bHhjdWIxMmNnM2RwNmZidGx3bmF6In0.Lj_dbKJfWQ6v9RxSC-twHw";

function Map() {
    const mapRef = useRef(null);
    const mapbox = useRef(null);

    const baseLayers = {
        "Google Hybrid": {"visible": true},
        "Bing Hybrid": {"visible": false},
    }

    const [points, setPoints] = useState([]);

    const { getAccessTokenSilently } = useAuth0();

    // menu toggle
    const [menuOpen, setMenuOpen] = useState(false);

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



        // load points from api and add to the map
        console.log("points");
        console.log(points);
        mapbox.current.addSource('PlacesToExplore', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': points
            }
        });

        mapbox.current.addLayer({
            'id': 'PlacesToExplore',
            'type': 'circle',
            'source': 'PlacesToExplore',
            'paint': {
                // if the icon is special, make it bigger
                // I'll change this later to be prettier
                'circle-radius': ['case', ['==', ['get', 'special'], true], 10, 6],
                'circle-color': ['get', 'color'],
            }
        });

        mapbox.current.addLayer(
            {
                'id': 'Google Hybrid',
                'type': 'raster',
                'source': '00',
                'paint': {}
            },
            'PlacesToExplore'
        );

        mapbox.current.addLayer(
            {
                'id': 'Bing Hybrid',
                'type': 'raster',
                'source': '01',
                'paint': {}
            },
            'PlacesToExplore'
        );
        // set the default layer to google hybrid
        mapbox.current.setLayoutProperty('Google Hybrid', 'visibility', 'visible');
        mapbox.current.setLayoutProperty('Bing Hybrid', 'visibility', 'none');
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
        getPoints();
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

        // controls
        mapbox.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        mapbox.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        mapbox.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
        mapbox.current.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true,
                timeout: 6000
            },
            trackUserLocation: true,
            showUserHeading: true
        }), 'top-right');

    }, [mapRef]);

    useEffect(() => {
        if (!mapbox.current) return; // wait for map to initialize
        if (menuInitialized) return; // initialize menu only once

        // iterate through baselayers
        var toggleableLayerIds = Object.keys(baseLayers);

        for (var i = 0; i < toggleableLayerIds.length; i++) {
            var id = toggleableLayerIds[i];
            var link = document.createElement('a');
            link.href = '#';
            link.id = id;
            link.className = '';

            if (baseLayers[id]["visible"]) {
                link.className = 'active';
            }
            link.textContent = id;


            link.onclick = function (e) {
                var clickedLayer = this.textContent;
                e.preventDefault();
                e.stopPropagation();

                var visibility = mapbox.current.getLayoutProperty(clickedLayer, 'visibility');

                if (visibility === 'visible') {
                    mapbox.current.setLayoutProperty(clickedLayer, 'visibility', 'none');
                    this.className = '';
                } else {
                    // turn off all other layers
                    for (var i = 0; i < toggleableLayerIds.length; i++) {
                        if (toggleableLayerIds[i] === clickedLayer) {
                            continue;
                        }
                        mapbox.current.setLayoutProperty(toggleableLayerIds[i], 'visibility', 'none');
                        var button = document.getElementById(toggleableLayerIds[i]);
                        button.className = '';
                    }

                    this.className = 'active';
                    mapbox.current.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                }


            };

            var layers = document.getElementById('menu');
            layers.appendChild(link);
        }

        return () => {
            setMenuInitialized(true);
        }
        } , [menuInitialized]);



    return (
        // <ReactMapGL
        //     mapboxAccessToken="pk.eyJ1Ijoid2NzaGFtYmxpbiIsImEiOiJjbGZ6bHhjdWIxMmNnM2RwNmZidGx3bmF6In0.Lj_dbKJfWQ6v9RxSC-twHw"
        //     mapStyle="mapbox://styles/mapbox/satellite-v9"
        //     {...viewport}
        //     onMove={evt => setViewport(evt.viewport)}
        // />

        // layer control
        <div id="map" ref={mapRef}>
            <div id="menu"/>
        </div>
    );
}

export default Map;