import React, { useMemo, useState, useEffect, useRef, createContext, type ReactElement, type Ref, type RefObject, useContext } from 'react';
// css
import 'styles/components/map.css';
import 'styles/components/sidebar.css';
import 'styles/components/layerswitcher.css'
import 'styles/components/rightclickpopup.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import 'react-datetime-picker/dist/DateTimePicker.css';

import Map, { useMap, type ViewState } from 'react-map-gl/maplibre';
import Sidebar from 'components/sidebar/NewSidebar';
import { AtlasContext } from 'providers/AtlasContext';
import type { StyleSpecification } from 'maplibre-gl';

import * as utils from 'helpers/data-utils';
import { SettingsContext } from 'providers/SettingsContext';

const Atlas = () => {
    const { atlas } = useMap();
    const { hideLabels } = useContext(SettingsContext);
    const [displaySidebar, setDisplaySidebar] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    // const [selectedBaseLayer, setSelectedBaseLayer] = useState<string>(null);
    // const memoizedBaseLayer: ReactElement | undefined = useMemo(() => {
    //     let layerr = utils.getBaseLayerWithId(selectedBaseLayer);
    //     // console.log(layerr);
    //     return layerr;
    // }, [selectedBaseLayer]);

    const [baseStyle, setBaseStyle] = useState<string>(utils.getDefaultMapStyle());
    const memoizedBaseStyle: StyleSpecification = useMemo(() => {
        // whenever baseStyle or hideLabels updates, regenerate the stylespecification
        localStorage.setItem('base-style', baseStyle);
        return utils.getUpdatedMapStyle(baseStyle, hideLabels);
    }, [baseStyle, hideLabels]);

    const [selectedRegularLayers, setSelectedRegularLayers] = useState<string[]>([]);
    const [selectedRegularCategories, setSelectedRegularCategories] = useState<[string, string[]][]>([]);
    const memoizedRegularLayers: ReactElement[] = useMemo(() => selectedRegularLayers.map(layer => utils.getRegularLayerCategoryWithId(layer)), [selectedRegularLayers]);

    useEffect(() => {
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
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
    }, [displaySidebar]);

    // const updateBaseStyle = (styleId: string) => {
    //     setting to show labels or not (hide labels for maps without them)
    //     if(hideLabels)
    //     setBaseStyle(styleId);
    //     localStorage.setItem('base-style', styleId);
    //     setBaseStyle(utils.getUpdatedMapStyle(styleId, hideLabels));
    //     setBaseStyle(utils.defaultMapStyle2());
    //     setSelectedBaseLayer(layerId);

    //     google and osm have labels by default so they need to be hidden on the main mapbox layer
    //     use this if we switch to the new mapbox standard to fix most issues: https://docs.mapbox.com/mapbox-gl-js/guides/styles/#mapbox-standard-1\
    //     if we dont switch be aware that 3d buildings are currently hidden for google and osm
    //     if (['Google Hybrid', 'OpenStreetMap'].includes(layerId)) {
    //         if (atlasRef.current.getStyle().name !== "Mapbox Satellite") {
    //             atlasRef.current.getMap().setStyle(sourceUtils.noLabelsMapStyle);
    //         }
    //     } else {
    //         if (atlasRef.current.getStyle().name !== "Mapbox Dark") {
    //             atlasRef.current.getMap().setStyle(sourceUtils.defaultMapStyle);
    //         }
    //     }
    // }

    const toggleRegularLayers = (layerIds: string[], partlySelected?: boolean) => {
        let newLayers = [...selectedRegularLayers];
        layerIds.forEach(layerId => {
            if (selectedRegularLayers.includes(layerId) || partlySelected) {
                newLayers = [...newLayers.filter(srl => srl != layerId)];
            } else {
                newLayers = [...newLayers, layerId];
            }
        })
        // flyghinder polygons source is not setup
        setSelectedRegularLayers(newLayers);
        localStorage.setItem('selected-layers', JSON.stringify(newLayers));
    }

    const toggleRegularLayerCategories = (categoryId: string, partlySelected?: boolean) => {
        // by default have all of the categorysublayers in the array when created
        // if the category is clicked and it already exists, it should be removed
        // 

        // let newLayers = [...selectedRegularLayers];
        // layerIds.forEach(layerId => {
        //     if (selectedRegularLayers.includes(layerId) || partlySelected) {
        //         newLayers = [...newLayers.filter(srl => srl != layerId)];
        //     } else {
        //         newLayers = [...newLayers, layerId];
        //     }
        // })
        // setSelectedRegularLayers(newLayers);
        // localStorage.setItem('selected-layers', JSON.stringify(newLayers));
    }

    const toggleCategorySubLayer = () => {
        // add or remove from array in categoryselected list

    }

    const loadStoredLayers = () => {
        // console.log("is loaded: ", atlas.isStyleLoaded());
        // const storageBaseLayer = localStorage.getItem('base-layer');
        // // atlas.setConfigProperty('basemap', 'showPlaceLabels', true)
        // if (selectedBaseLayer === null && storageBaseLayer) {
        //     // updateBaseLayer(storageBaseLayer);
        // }

        const storageRegularLayers: string[] = JSON.parse(localStorage.getItem('selected-layers'));
        if (selectedRegularLayers.length === 0 && storageRegularLayers.length > 0) {
            setSelectedRegularLayers(storageRegularLayers);
        }

        setIsLoading(false);
    } 

    const testLoadFunc = () => {
        // atlas.setConfigProperty('basemap', 'showPlaceLabels', true)
        // setIsLoading(false);
    }

    return (
        <AtlasContext.Provider
            value={{
                baseStyleSpecification: memoizedBaseStyle,
                setBaseStyle,
                selectedRegularLayers,
                toggleRegularLayers,
            }}
        >
            <Map
                id='atlas'
                // needs to have a transition for the opacity
                style={{ width: '100%', height: '90vh', opacity: '100%' }}
                mapStyle={memoizedBaseStyle}
                reuseMaps
                onRender={loadStoredLayers}
                // onData={loadStoredLayers}
                onClick={testLoadFunc}
            >
                {/* {memoizedBaseLayer !== undefined && memoizedBaseLayer} */}
                {/* {memoizedRegularLayers} */}
            </Map>
            <Sidebar
                expanded={displaySidebar}
                setDisplaySidebar={setDisplaySidebar}
            />
        </AtlasContext.Provider>
    );
}

export default Atlas;