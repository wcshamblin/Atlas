import React, { useState, useEffect } from "react";
import '../styles/components/sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faPenToSquare,
    faEye,
    faEyeSlash,
    faMap,
    faCloudSun,
    faLayerGroup,
    faBars,
    faGear,
    faCloud,
} from '@fortawesome/free-solid-svg-icons'

const Sidebar = ({ mapStatus, expanded, setDisplaySidebar, setLayoutProperty, getLayoutProperty, showShadeMap, setShowShadeMap, showIsochrone, setShowIsochrone, customMapsData, flyTo, currentSelectedCustomMapPoint, setCurrentSelectedCustomMapPoint, processCustomMapPointClick, setOpenModal, setModalType, setModalSelectedCustomMapId, setModalSelectedCustomMapPointId, displayLabels, settings, updateSettings }) => {
    const [selectedPart, setSelectedPart] = useState("layers");
    const [pointsSearchValue, setPointsSearchValue] = useState("");
    const [currentModal, setCurrentModal] = useState("");

    const [baseLayers, setBaseLayers] = useState({
        "Google Hybrid": { "visible": true },
        "Bing Hybrid": { "visible": false },
        "ESRI": { "visible": false },
        "OpenStreetMap": { "visible": false },
    });

    const layerCategories = {
        "OpenRailwayMap": ["OpenRailwayMap"],
        "Google Streetview": ["Google StreetView"],
        "3D Buildings": ["3D Buildings"],
        "Shade Map": ["Shade Map"],
        "Long Lines": ["Long Lines"],
        "Towers": ["All Towers", "All Tower Extrusions"],
        "Antennas": ["Antennas"],
        "FLYGHINDER 2023": ["FLYGHINDER 2023", "FLYGHINDER 2023 Extrusions"],
        "Decommissioned Towers": ["Decommissioned Towers", "Decommissioned Tower Extrusions"],
        "Safe Towers": ["Safe Towers", "Safe Tower Extrusions"],
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
        "OpenRailwayMap": { "visible": false },
        "Long Lines": { "visible": false },
        "FLYGHINDER 2023": { "visible": false },
        "FLYGHINDER 2023 Extrusions": { "visible": false },
    })

    const [customMapsLayers, setCustomMapsLayers] = useState({});
    const [customMapsLayersLoaded, setCustomMapsLayersLoaded] = useState(false);

    useEffect(() => {
        if (!customMapsData) return;
        if (!customMapsData.maps) return;
        console.log("custom maps data loaded: " + JSON.stringify(customMapsData));

        {
            setCustomMapsLayers({});
            customMapsData.maps.map(mapData => {
                console.log("Adding custom map layer to sidebar: " + mapData.name);
                // add layer to custom maps layers
                //     setCustomMapsLayers({ ...customMapsLayers, [mapData.name]: { "visible": false, "collapsed": true, ...mapData } })
                let collapsed = true;
                let oldRecord = customMapsLayers[mapData.id];
                if (oldRecord) collapsed = oldRecord.collapsed;
                setCustomMapsLayers(prevState => ({
                    ...prevState,
                    [mapData.id]: { "visible": false, "collapsed": collapsed, ...mapData }
                }))
            })
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
            let element = document.getElementById(currentSelectedCustomMapPoint.pointId);
            if(element) element.scrollIntoView();
        }
    }, [currentSelectedCustomMapPoint]);

    const updateBaseLayers = name => {
        Object.keys(baseLayers).forEach(layer => {
            setLayoutProperty(layer, 'visibility', layer === name ? 'visible' : 'none');
            baseLayers[layer].visible = layer === name ? true : false;
        });

        displayLabels(!(name == "OpenStreetMap" || name == "Google Hybrid"));
        
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

    const updateCustomMapsLayers = (id, visible) => {
        console.log("Trying to update custom maps layer: " + id + " to " + visible)
        // need to make sure that the layer is actually on the map before we try to update it - there could be a layer in local storage that isn't on the map
        if (!customMapsLayers[id]) return;
        setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
        customMapsLayers[id].visible = visible;

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
                                    <input type="radio" defaultChecked={subLayers.some(layerName => layers[layerName].visible)}></input>
                                    <span>{catName}</span>

                                    {/*<p className={subLayers.some(layerName => !layers[layerName].visible) ? "black" : "selected black"} onClick={() => updateCategory(catName, subLayers.some(layerName => !layers[layerName].visible))}>{catName}</p>
                                {subLayers.map(layerName =>
                                    <p className={!layers[layerName].visible ? "black2" : "selected black2"} onClick={() => updateLayers(layerName, !layers[layerName].visible)}>{layerName} </p>
                                )}*/}
                                </div>
                                {subLayers.some(layerName => layers[layerName].visible) ? subLayers.map(layerName =>
                                    <div className={!layers[layerName].visible ? "regular-layer-many" : "regular-layer-normal-selected regular-layer-many"} onClick={() => updateLayers(layerName, !layers[layerName].visible)}>
                                        <input type="radio" defaultChecked={layers[layerName].visible}></input>
                                        <span>{layerName}</span>
                                    </div>
                                ) : ""}
                            </>
                        )
                    else
                        return (
                            <div className={!layers[subLayers[0]].visible ? "regular-layer-normal" : "regular-layer-normal regular-layer-normal-selected"} onClick={() => updateLayers(subLayers[0], !layers[subLayers[0]].visible)}>
                                <input type="radio" defaultChecked={layers[subLayers[0]].visible}></input>
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
                <div id="custom-maps-main-container">
                    <div className="no-custom-maps">
                        <h5>Loading custom maps...</h5>
                    </div>
                </div>
            )
        }
        if (Object.keys(customMapsLayers).length === 0) {
            return (
                <div id="custom-maps-main-container">
                    <div className="no-custom-maps">
                        <h5>You don't have any custom maps yet. Create one or ask a friend to share one with you!</h5>
                        <span className="custom-map-add-button" onClick={() => openMapAddModal()}>Add Map</span>
                    </div>
                </div>
            )
        }

        return (
            <div id="custom-maps-main-container">
                <span className="custom-map-add-button" onClick={() => openMapAddModal()}>Add Map</span>
                {Object.entries(customMapsLayers).map(([mapId, val]) => (
                    <div className="custom-map-container">
                        <div className="custom-map-container-header">
                            <div>
                                <FontAwesomeIcon className="custom-map-display-toggle" icon={val.visible ? faEye : faEyeSlash} onClick={() => updateCustomMapsLayers(mapId, !val.visible)}/>
                                <span className="custom-map-container-title">{val.name}</span>
                            </div>
                            <FontAwesomeIcon icon={faPenToSquare} className="custom-map-edit-button" onClick={() => openMapEditModal(val.id)}/>
                        </div>
                        <div className="custom-map-container-main">
                            <span>Description:</span>
                            <span className="custom-map-description">{val.description}</span>
                            <span>Legend:</span>
                            <span className="custom-map-description">{val.legend}</span>
                        </div>
                        <div className="custom-map-point-control">
                            <button className="custom-map-show-points-button" onClick={() => updateCustomMapsLayersPointsCollapsed(mapId, !val.collapsed)}>Show Points</button>
                            <button className="custom-map-show-points-button" onClick={() => openPointAddModal(val.id)}>Add Point</button>
                        </div>
                        {val.collapsed ? "" :
                            <div className="custom-map-container-points">
                                <label style={{fontSize: "13px"}}>Points Search:</label>
                                <input type="text" value={pointsSearchValue} onChange={e => setPointsSearchValue(e.target.value)}></input>
                                {val.points.filter(point => point.name.toLowerCase().includes(pointsSearchValue.toLowerCase())).sort((point1, point2) => new Date(point2.creation_date) - new Date(point1.creation_date)).map(point =>
                                    <div className={point.id == currentSelectedCustomMapPoint.pointId ? "custom-map-point custom-map-point-selected" : "custom-map-point"} onClick={() => { flyTo(point.lat, point.lng); setCurrentSelectedCustomMapPoint({ "pointId": point.id, "layerId": mapId }) }} id={point.id}>
                                        <div className="custom-map-point-container">
                                            <img className="custom-map-point-icon" src={val.icons.filter(icon => icon.id == point.icon)[0].url} />
                                            <div className="custom-map-point-text-container">
                                                <span className="custom-map-point-text" style={{ color: point.color }}>{point.name}</span>
                                                <span className="custom-map-point-text-desc">{point.description}</span>
                                                <span>{point.lat},{point.lng}</span>
                                            </div>
                                        </div>
                                        <FontAwesomeIcon icon={faPenToSquare} className="custom-map-point-edit-button" onClick={() => openPointEditModal(val.id, point.id)}/>
                                    </div>
                                )}
                            </div>}
                    </div>
                ))}
            </div>
        )
    }

    const openPointEditModal = (mapId, pointId) => {
        setOpenModal(true);
        setModalType("editPoint");
        setModalSelectedCustomMapId(mapId);
        setModalSelectedCustomMapPointId(pointId);
    }

    const openPointAddModal = (mapId) => {
        setOpenModal(true);
        setModalType("addPoint");
        setModalSelectedCustomMapId(mapId);
        setModalSelectedCustomMapPointId("");
    }

    const openMapEditModal = (mapId) => {
        console.log("Opened map edit modal wtih map it: " + mapId)
        setOpenModal(true);
        setModalType("editMap");
        setModalSelectedCustomMapId(mapId);
        setModalSelectedCustomMapPointId("");
    }

    const openMapAddModal = (mapId) => {
        setOpenModal(true);
        setModalType("addMap");
        setModalSelectedCustomMapId("");
        setModalSelectedCustomMapPointId("");
    }

    return expanded ? (
        <div id="sidebar">
            <div id="sidebar-header">
                <div class="sidebar-link">
                    <FontAwesomeIcon icon={faCloudSun} class="sidebar-link-button" onClick={e => setSelectedPart('weather')}/>
                </div>
                <div class="sidebar-link">
                    <FontAwesomeIcon icon={faLayerGroup} class="sidebar-link-button" onClick={e => setSelectedPart('layers')}/>
                </div>
                <div class="sidebar-link">
                    <FontAwesomeIcon icon={faMap} class="sidebar-link-button" onClick={e => setSelectedPart('customMaps')} />
                </div>
                <div class="sidebar-link">
                    <FontAwesomeIcon icon={faGear} class="sidebar-link-button" onClick={e => setSelectedPart('settings')} />
                </div>
                <div class="sidebar-link">
                    <FontAwesomeIcon icon={faBars} class="sidebar-link-button" onClick={e => setDisplaySidebar(false)}/>
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
                                    <h1 style={{ "margin": "5px 0px" }}>CUSTOM MAPS</h1>
                                    {renderCustomMaps()}
                                </div>
                            )
                        case 'settings':
                            return (
                                <div className="settings-container">
                                    <h1 style={{ "margin": "5px 0px" }}>SETTINGS</h1>
                                    <span>Show low power antennas (information may not be accurate): </span>
                                    <input type="checkbox" defaultChecked={settings["showUls"]} onChange={e => updateSettings("showUls", e.target.checked)}/>
                                    <br/><br/>
                                    <span>Isochrone minutes (how far to show the isochrone): </span>
                                    <input type="number" value={settings["isoMinutes"]} min="5" max="120" onChange={e => updateSettings("isoMinutes", e.target.value)} />
                                    <br/><br/>
                                    <span>Isochrone commute type: </span>
                                    <select value={settings["isoProfile"]} onChange={(e) => updateSettings("isoProfile", e.target.value)}>
                                        <option value="driving">Driving</option>
                                        <option value="walking">Walking</option>
                                        <option value="transit">Transit</option>
                                        <option value="truck">Semitruck</option>
                                    </select>
                                    {/*<br/><br/>*/}
                                    {/*<span>Dark mode: </span>*/}
                                    {/*<input type="checkbox" defaultChecked={settings["darkMode"]} onChange={e => updateSettings("darkMode", e.target.checked)}/>*/}
                                </div>
                            )
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
    ) : <FontAwesomeIcon icon={faBars} class="sidebar-link-button sidebar-hidden" onClick={e => setDisplaySidebar(true)} />
};
export default Sidebar;