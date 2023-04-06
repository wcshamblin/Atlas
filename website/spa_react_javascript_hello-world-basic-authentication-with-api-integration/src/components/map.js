import React, { useState, useEffect, createRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapboxStyleSwitcherControl } from "mapbox-gl-style-switcher";

// api imports
import { getPoints } from "../services/message.service";
import {useAuth0} from "@auth0/auth0-react";

mapboxgl.accessToken = "pk.eyJ1Ijoid2NzaGFtYmxpbiIsImEiOiJjbGZ6bHhjdWIxMmNnM2RwNmZidGx3bmF6In0.Lj_dbKJfWQ6v9RxSC-twHw";

function Map() {
    const mapRef = createRef();
    const [points, setPoints] = useState([]);
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const GetPoints = async () => {
            const accessToken = await getAccessTokenSilently();
            const { data, error } = await getPoints(accessToken);
            if (error) {
                console.log(error);
            } else {
                setPoints(data);
            }
        };

        if (mapRef.current) {
            const mapbox = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [-74.5, 40],
                zoom: 9
            });

            mapbox.on('load', () => {
                mapbox.addSource('00', {
                    'type': 'raster',
                    'tiles': [
                        'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                        'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                        'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                        'https://mt4.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
                    ],
                    'tileSize': 256
                });
                mapbox.addSource('01', {
                    'type': 'raster',
                    'tiles': [
                        'https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
                        'https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
                        'https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
                        'https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z'
                    ],
                    'tileSize': 256
                });

                // load points from api and add to the map

                mapbox.addLayer(
                    {
                        'id': 'Google Hybrid',
                        'type': 'raster',
                        'source': '00',
                        'paint': {}
                    },
                    // 'building' // Place layer under labels, roads and buildings.
                );

                mapbox.addLayer(
                    {
                        'id': 'Bing Hybrid',
                        'type': 'raster',
                        'source': '01',
                        'paint': {}
                    },
                );
            });

            mapbox.addControl(new mapboxgl.NavigationControl());
            mapbox.addControl(new mapboxgl.FullscreenControl());

            // layer control


            // Load Places to Explore from API
            GetPoints();

            // Add markers to map
            points.forEach((point) => {
                const marker = new mapboxgl.Marker()
                    .setLngLat([point.longitude, point.latitude])
                    .setPopup(
                        new mapboxgl.Popup({ offset: 25 }) // add popups
                            .setHTML(
                                `<h3>${point.title}</h3><p>${point.description}</p>`
                            )
                    )
                    .addTo(mapbox);
            });

        }
    }, [mapRef, points, getAccessTokenSilently]);

    return (
        // <ReactMapGL
        //     mapboxAccessToken="pk.eyJ1Ijoid2NzaGFtYmxpbiIsImEiOiJjbGZ6bHhjdWIxMmNnM2RwNmZidGx3bmF6In0.Lj_dbKJfWQ6v9RxSC-twHw"
        //     mapStyle="mapbox://styles/mapbox/satellite-v9"
        //     {...viewport}
        //     onMove={evt => setViewport(evt.viewport)}
        // />

        <div id="map" ref={mapRef} style={{ width: '100vw', height: '80vh' }}></div>
    );
}

export default Map;