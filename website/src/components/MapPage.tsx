import React, { useMemo, useState, type ReactElement } from 'react';
// css
import '../styles/components/map.css';
import '../styles/components/sidebar.css';
import '../styles/components/layerswitcher.css'
import '../styles/components/rightclickpopup.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import 'react-datetime-picker/dist/DateTimePicker.css';

import Map, { useMap, Source, Layer } from 'react-map-gl';
import Sidebar from 'components/sidebar/NewSidebar';

import * as sourceUtils from 'helpers/source-utils';

// mapboxgl.workerClass = MapboxGLWorker;

// import ScriptLoaded from "@react-google-maps/api/src/docs/ScriptLoaded";

function MapPage() {
    const { atlas } = useMap();

    const [viewState, setViewState] = useState({
        longitude: -100,
        latitude: 40,
        zoom: 3.5
    });
    const [selectedBaseLayer, setSelectedBaseLayer] = useState<string>('Google Hybrid');
    const memoizedBaseLayer: ReactElement = useMemo(() => sourceUtils.getBaseLayerWithId(selectedBaseLayer), [selectedBaseLayer]);
    const [selectedRegularLayers, setSelectedRegularLayers] = useState<string[]>([]);
    const memoizedRegularLayers: ReactElement[] = useMemo(() => selectedRegularLayers.map(layer => sourceUtils.getRegularLayerWithId(layer)), [selectedRegularLayers])

    // setBaseLayer(tileSources.getBaseLayerWithId(name));

    // const addSelectedRegularLayer = (name) => {
    //     setSelectedRegularLayers([tileSources.getRegularLayerWithId(name)]);
    // };

    return (
        <div>
            <Map
                id='atlas'
                // @ts-expect-error
                projection='globe'
                accessToken={import.meta.env.VITE_APP_MAPBOX_API_KEY}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{width: 600, height: 400}}
                mapStyle={sourceUtils.defaultMapStyle}
                reuseMaps
            >
                {memoizedBaseLayer}
                {memoizedRegularLayers}
            </Map>
            <Sidebar
                selectedBaseLayer={selectedBaseLayer}
                setSelectedBaseLayer={setSelectedBaseLayer}
                selectedRegularLayers={selectedRegularLayers}
                setSelectedRegularLayers={setSelectedRegularLayers}
                expanded
                setDisplaySidebar={() => {}}
            />
        </div>
       
    );
}

export default MapPage;