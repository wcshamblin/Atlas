import React, { useState, useEffect } from "react";
import '../styles/components/sidebar.css';

const Sidebar = ({ mapStatus, expanded, setDisplaySidebar, setLayoutProperty, getLayoutProperty, showShadeMap, setShowShadeMap, showIsochrone, setShowIsochrone}) => {
    const [selectedPart, setSelectedPart] = useState("weather");

    const [baseLayers, setBaseLayers] = useState({
        "Google Hybrid": { "visible": true },
        "Bing Hybrid": { "visible": false },
        "ESRI": { "visible": false },
        "OpenStreetMap": { "visible": false },
    });

    const layerCategories = {
        "Towers": ["All Towers", "All Tower Extrusions"],
        "Decommissioned Towers": ["Decommissioned Towers", "Decommissioned Tower Extrusions"],
        "Safe Towers": ["Safe Towers", "Safe Tower Extrusions"],
        "Google Streetview": ["Google StreetView"],
        "3D Buildings": ["3D Buildings"],
        "Shade Map": ["Shade Map"],
        "Antennas": ["Antennas"],
        "Isochrone": ["Isochrone"]
    }

    const [layers, setLayers] = useState({
        "All Towers": { "visible": false },
        "All Tower Extrusions": { "visible": false },
        "Decommissioned Towers": { "visible": false },
        "Decommissioned Tower Extrusions": { "visible": false },
        "Safe Towers": { "visible": false },
        "Safe Tower Extrusions": { "visible": false },
        "Google StreetView": { "visible": false },
        "3D Buildings": { "visible": false },
        "Shade Map": { "visible": false },
        "Antennas": { "visible": false },
        "Isochrone": { "visible": false },
    })

    useEffect(() => {
        if (mapStatus) {
            console.log("base layer " + localStorage.getItem('base-layer'))
            if (!localStorage.getItem('base-layer'))
                localStorage.setItem('base-layer', Object.entries(baseLayers).filter(([key, val]) => val.visible === true).map(([key, val]) => key)[0]);
            if (!localStorage.getItem('selected-layers'))
                localStorage.setItem('selected-layers', JSON.stringify(Object.entries(layers).filter(([key, val]) => val.visible === true).map(([key, val]) => key)));

            updateBaseLayers(localStorage.getItem('base-layer'));

            resetLayers();

            JSON.parse(localStorage.getItem('selected-layers')).forEach(layer => {
                updateLayers(layer, true);
            });
        }
    }, [mapStatus]);

    const updateBaseLayers = name => {
        Object.keys(baseLayers).forEach(layer => {
            setLayoutProperty(layer, 'visibility', layer === name ? 'visible' : 'none');
            baseLayers[layer].visible = layer === name ? true : false;
        });

        localStorage.setItem('base-layer', name);

        setBaseLayers({ ...baseLayers });
    }

    const resetLayers = () => {
        Object.keys(layers).forEach(layer => {
            if (layer != 'Shade Map')
                setLayoutProperty(layer, 'visibility', 'none');
        });
    }

    const updateLayers = (name, visible) => {
        if (name == "Shade Map") {
            setShowShadeMap(visible);
            layers[name].visible = visible;
        } else if (name == "Isochrone") {
            setShowIsochrone(visible);
            layers[name].visible = visible;
        } else {
            setLayoutProperty(name, 'visibility', visible ? 'visible' : 'none');
            layers[name].visible = visible;
        }

        localStorage.setItem('selected-layers', JSON.stringify(Object.entries(layers).filter(([key, val]) => val.visible === true).map(([key, val]) => key)));

        setLayers({ ...layers });
    }

    const updateCategory = (name, visible) => {
        layerCategories[name].forEach(layerName => {
            updateLayers(layerName, visible);
        })
    }

    const renderBaseLayers = () => {
        return (
            <div id="base-layer-container">
                {
                    Object.entries(baseLayers).map(([layerName, val]) => (
                        <div className={!val.visible ? "base-layer-item" : "base-layer-selected base-layer-item"} onClick={() => updateBaseLayers(layerName)}>
                            <div className={"base-layer-" + layerName.toLowerCase().replaceAll(" ", "") + " base-layer-img"}></div>
                            <span>{layerName}</span>
                        </div>
                    ))
                }
                {/*
                    Object.entries(baseLayers).map(([layerName, val]) => <p className={!val.visible ? "black" : "selected black"} onClick={() => updateBaseLayers(layerName)}>{layerName}</p>)
                */}
            </div>
        )
    }

    return expanded ? (
        <div id="sidebar">
            <div id="sidebar-header">
                <div class="sidebar-link">
                    <button class="sidebar-link-button weather" onClick={e => setSelectedPart('weather')}></button>
                </div>
                <div class="sidebar-link">
                    <button class="sidebar-link-button maps" onClick={e => setSelectedPart('layers')}></button>
                </div>
                <div class="sidebar-link">
                    <button class="sidebar-link-button clock" onClick={e => setSelectedPart('time')}></button>
                </div>
                <div class="sidebar-link">
                    <button class="sidebar-link-button settings" onClick={e => setSelectedPart('settings')}></button>
                </div>
                <div class="sidebar-link">
                    <button class="sidebar-link-button expand" onClick={e => setDisplaySidebar(false)}></button>
                </div>
            </div>

            <div id="sidebar-content">
                {(() => {
                    switch (selectedPart) {
                        case 'weather':
                            return <h1>WEATHER</h1>
                        case 'layers':
                            return (
                                <div>
                                    <h1>LAYERS</h1>
                                    {renderBaseLayers()}
                                    <h3>Regular Layers</h3>
                                    {
                                        Object.entries(layerCategories).map(([catName, subLayers]) => {
                                            if (subLayers.length > 1)
                                                return (
                                                    <div>
                                                        <p className={subLayers.some(layerName => !layers[layerName].visible) ? "black" : "selected black"} onClick={() => updateCategory(catName, subLayers.some(layerName => !layers[layerName].visible))}>{catName}</p>
                                                        {subLayers.map(layerName =>
                                                            <p className={!layers[layerName].visible ? "black2" : "selected black2"} onClick={() => updateLayers(layerName, !layers[layerName].visible)}>{layerName} </p>
                                                        )}
                                                    </div>
                                                )
                                            else
                                                return <p className={!layers[subLayers[0]].visible ? "black" : "selected black"} onClick={() => updateLayers(subLayers[0], !layers[subLayers[0]].visible)}>{catName}</p>
                                        })
                                    }
                                </div>
                            )
                        case 'time':
                            return <h1>TIME</h1>
                        case 'settings':
                            return <h1>SETTINGS</h1>
                        default:
                            return ""
                    }
                })()}

                {/* {homeIsSet ? getHomeMetrics() : ""}

                <h4>Map date time selector</h4>
                <DateTimePicker
                    onChange={setMapDatetime}
                    value={mapDatetime}
                /> */}
            </div>
        </div>
    ) : <button class="sidebar-link-button expand sidebar-hidden" onClick={e => setDisplaySidebar(true)}></button>;
};
export default Sidebar;