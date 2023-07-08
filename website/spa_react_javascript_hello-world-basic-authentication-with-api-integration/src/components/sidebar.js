import React, { useState, useEffect } from "react";
import '../styles/components/sidebar.css';

const Sidebar = ({ mapStatus, expanded, setDisplaySidebar, setLayoutProperty, getLayoutProperty, showShadeMap, setShowShadeMap, showIsochrone, setShowIsochrone, customMapsData, flyTo, currentSelectedCustomMapPoint, processCustomMapPointClick }) => {
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

    const [customMapsLayers, setCustomMapsLayers] = useState({});
    const [customMapsLayersLoaded, setCustomMapsLayersLoaded] = useState(false);

    useEffect(() => {
        if (!customMapsData) return;
        if (!customMapsData.maps) return;
        console.log("custom maps data loaded: " + JSON.stringify(customMapsData));

        {
            Object.entries(customMapsData.maps).map(([mapId, mapData]) => (
                setCustomMapsLayers({ ...customMapsLayers, [mapData.name]: { "visible": false, "collapsed": true, ...mapData } })
            ))
        }

        setCustomMapsLayersLoaded(true);
    }, [customMapsData]);

    useEffect(() => {
        if (mapStatus) {
            console.log("Using base layer: " + localStorage.getItem('base-layer'))
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

    // update custom map layers with local storage visibility when we know they're loaded
    useEffect(() => {
        if (mapStatus && customMapsLayersLoaded) {
            if (!localStorage.getItem('selected-custom-maps-layers'))
                localStorage.setItem('selected-custom-maps-layers', JSON.stringify(Object.entries(customMapsLayers).filter(([key, val]) => val.visible === true).map(([key, val]) => key)));

            JSON.parse(localStorage.getItem('selected-custom-maps-layers')).forEach(layer => {
                updateCustomMapsLayers(layer, true);
            });
        }
    }, [customMapsLayersLoaded]);

    useEffect(() => {
        console.log(currentSelectedCustomMapPoint);

        if (customMapsLayers[currentSelectedCustomMapPoint.layerId] && !customMapsLayers[currentSelectedCustomMapPoint.layerId].collapsed) {
            let element = document.getElementById(currentSelectedCustomMapPoint.pointId)
            element.scrollIntoView();
        }
    }, [currentSelectedCustomMapPoint])

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

    const updateCustomMapsLayers = (name, visible) => {
        console.log("Trying to update custom maps layer: " + name + " to " + visible)
        setLayoutProperty(name, 'visibility', visible ? 'visible' : 'none');
        customMapsLayers[name].visible = visible;

        localStorage.setItem('selected-custom-maps-layers', JSON.stringify(Object.entries(customMapsLayers).filter(([key, val]) => val.visible === true).map(([key, val]) => key)));

        setCustomMapsLayers({ ...customMapsLayers });
    }

    const updateCustomMapsLayersPointsCollapsed = (name, collapsed) => {
        customMapsLayers[name].collapsed = collapsed;

        localStorage.setItem('selected-custom-maps-layers', JSON.stringify(Object.entries(customMapsLayers).filter(([key, val]) => val.visible === true).map(([key, val]) => key)));

        setCustomMapsLayers({ ...customMapsLayers });
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

    const renderRegularLayers = () => {
        return (
            <div id="regular-layer-container">
                {Object.entries(layerCategories).map(([catName, subLayers]) => {
                    if (subLayers.length > 1)
                        return (
                            <>
                                <div className={!subLayers.some(layerName => layers[layerName].visible) ? "regular-layer-normal" : "regular-layer-normal regular-layer-normal-selected"} onClick={() => updateCategory(catName, subLayers.some(layerName => !layers[layerName].visible))}>
                                    <input type="radio" checked={subLayers.some(layerName => layers[layerName].visible)}></input>
                                    <span>{catName}</span>

                                    {/*<p className={subLayers.some(layerName => !layers[layerName].visible) ? "black" : "selected black"} onClick={() => updateCategory(catName, subLayers.some(layerName => !layers[layerName].visible))}>{catName}</p>
                                {subLayers.map(layerName =>
                                    <p className={!layers[layerName].visible ? "black2" : "selected black2"} onClick={() => updateLayers(layerName, !layers[layerName].visible)}>{layerName} </p>
                                )}*/}
                                </div>
                                {subLayers.some(layerName => layers[layerName].visible) ? subLayers.map(layerName =>
                                    <div className={!layers[layerName].visible ? "regular-layer-many" : "regular-layer-normal-selected regular-layer-many"} onClick={() => updateLayers(layerName, !layers[layerName].visible)}>
                                        <input type="radio" checked={layers[layerName].visible}></input>
                                        <span>{layerName}</span>
                                    </div>
                                ) : ""}
                            </>
                        )
                    else
                        return (
                            <div className={!layers[subLayers[0]].visible ? "regular-layer-normal" : "regular-layer-normal regular-layer-normal-selected"} onClick={() => updateLayers(subLayers[0], !layers[subLayers[0]].visible)}>
                                <input type="radio" checked={layers[subLayers[0]].visible}></input>
                                <span>{catName}</span>
                                {/*<p className={!layers[subLayers[0]].visible ? "black" : "selected black"} onClick={() => updateLayers(subLayers[0], !layers[subLayers[0]].visible)}>{catName}</p>*/}
                            </div>
                        )
                })}
            </div>
        )
    }

    const renderCustomMaps = () => {
        // if customMapsData.maps doesn't exist or is empty, then return nothing
        // if it doesn't exist
        console.log("Trying to render custom map layers: ", customMapsLayers)

        if (!customMapsData) {
            return (
                <div id="custom-layer-container">
                    <div className="no-custom-maps">
                        <h5>Loading custom maps...</h5>
                    </div>
                </div>
            )
        }
        if (Object.keys(customMapsLayers).length === 0) {
            return (
                <div id="custom-layer-container">
                    <div className="no-custom-maps">
                        <h5>You don't have any custom maps yet. Create one or ask a friend to share one with you!</h5>
                    </div>
                </div>
            )
        }

        return (
            <div id="custom-layer-container">

                {Object.entries(customMapsLayers).map(([mapName, val]) => (
                    <div className="custom-map-container">
                        <div className="custom-map-container-header" onClick={() => updateCustomMapsLayers(mapName, !val.visible)}>
                            <input type="radio" checked={val.visible}></input>
                            <span>{mapName}</span>
                        </div>
                        <div className="custom-map-container-main">
                            <span>Description</span>
                            <span>{val.description}</span>
                            <span>Legend</span>
                            <span>{val.legend}</span>
                        </div>
                        <button onClick={() => updateCustomMapsLayersPointsCollapsed(mapName, !val.collapsed)}>Show Points</button>
                        {val.collapsed ? "" :
                            <div className="custom-map-container-points">
                                {val.points.map(point =>
                                    <div className={point.id == currentSelectedCustomMapPoint.pointId ? "custom-map-point custom-map-point-selected" : "custom-map-point"} style={{ color: point.color }} onClick={() => flyTo(point.lat, point.lng)} id={point.id}>
                                        <img className="custom-map-point-icon" src={point.icon} />
                                        <div className="custom-map-point-text-container">
                                            <span className="custom-map-point-text">{point.name}</span>
                                            <span className="custom-map-point-text-desc">{point.description}</span>
                                            <span>{point.lat},{point.lng}</span>
                                        </div>
                                    </div>
                                )}
                            </div>}
                    </div>
                ))}
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
                    <button class="sidebar-link-button clock" onClick={e => setSelectedPart('customMaps')}></button>
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
                                    <h1 style={{ "margin": "5px 0px" }}>LAYERS</h1>
                                    <h3 style={{ "marginTop": "15px" }}>Base Layers</h3>
                                    {renderBaseLayers()}
                                    <h3>Regular Layers</h3>
                                    {renderRegularLayers()}
                                </div>
                            )
                        case 'customMaps':
                            return (
                                <div>
                                    <h1>CUSTOM MAPS</h1>
                                    {renderCustomMaps()}
                                </div>
                            )
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