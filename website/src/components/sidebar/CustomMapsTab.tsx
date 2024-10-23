import React, { useState, useEffect } from "react";
import 'styles/components/sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faPenToSquare,
    faEye,
    faEyeSlash,
} from '@fortawesome/free-solid-svg-icons'

const CustomMapsTab = ({ 
    mapStatus,
    setLayoutProperty, 
    customMapsData,
    flyTo,
    currentSelectedCustomMapPoint, 
    setCurrentSelectedCustomMapPoint, 
    setOpenModal, 
    setModalType, 
    setModalSelectedCustomMapId, 
    setModalSelectedCustomMapPointId, 
    pointFilters,
    updatePointFilters,
}) => {
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
                let visible = false;
                let oldRecord = customMapsLayers[mapData.id];
                if (oldRecord) collapsed = oldRecord.collapsed;
                if (oldRecord) visible = oldRecord.visible;
                setCustomMapsLayers(prevState => ({
                    ...prevState,
                    [mapData.id]: { "visible": visible, "collapsed": collapsed, ...mapData }
                }))
            })
        }

        setCustomMapsLayersLoaded(true);
    }, [customMapsData]);

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
            if (element) element.scrollIntoView();
        }
    }, [currentSelectedCustomMapPoint]);

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
                                <FontAwesomeIcon className="custom-map-display-toggle" icon={val.visible ? faEye : faEyeSlash} onClick={() => updateCustomMapsLayers(mapId, !val.visible)} />
                                <span className="custom-map-container-title">{val.name}</span>
                            </div>
                            <FontAwesomeIcon icon={faPenToSquare} className="custom-map-edit-button" onClick={() => openMapEditModal(val.id)} />
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
                                <label style={{ fontSize: "13px" }}>Points Search:</label>
                                <input type="text" value={pointFilters[mapId].name} style={{ fontSize: "13px" }} placeholder="Point Name" onChange={e => updatePointFilters(mapId, "name", e.target.value)}></input>
                                <select value={pointFilters[mapId].category} onChange={e => updatePointFilters(mapId, "category", e.target.value)}>
                                    <option value="">(No Category Filter)</option>
                                    {val.categories.sort(cat => cat.id).map(cat => (<option value={cat.id}>{cat.name}</option>))}
                                </select>
                                <select value={pointFilters[mapId].color} onChange={e => updatePointFilters(mapId, "color", e.target.value)}>
                                    <option value="">(No Color Filter)</option>
                                    {val.colors.sort(color => color.id).map(color => (<option value={color.hex}>{color.name}</option>))}
                                </select>
                                <select value={pointFilters[mapId].icon} onChange={e => updatePointFilters(mapId, "icon", e.target.value)}>
                                    <option value="">(No Icon Filter)</option>
                                    {val.icons.sort(icon => icon.id).map(icon => (<option value={icon.id}>{icon.name}</option>))}
                                </select><br />
                                {val.points.filter(point =>
                                    // filter by name and description if description is not null
                                    (point.name.toLowerCase().includes(pointFilters[mapId].name.toLowerCase())
                                        || (point.description && point.description.toLowerCase().includes(pointFilters[mapId].name.toLowerCase())))
                                    && (pointFilters[mapId].category != "" ? point.category == pointFilters[mapId].category : true)
                                    && (pointFilters[mapId].color != "" ? point.color == pointFilters[mapId].color : true)
                                    && (pointFilters[mapId].icon != "" ? point.icon == pointFilters[mapId].icon : true)).sort((point1, point2) => new Date(point2.creation_date) - new Date(point1.creation_date)).map(point =>
                                    <div className={point.id == currentSelectedCustomMapPoint.pointId ? "custom-map-point custom-map-point-selected" : "custom-map-point"} onClick={() => { flyTo(point.lat, point.lng); setCurrentSelectedCustomMapPoint({ "pointId": point.id, "layerId": mapId }) }} id={point.id}>
                                        <div className="custom-map-point-container">
                                            <img className="custom-map-point-icon" src={val.icons.filter(icon => icon.id == point.icon)[0]?.url} />
                                            <div className="custom-map-point-text-container">
                                                <span className="custom-map-point-text" style={{ color: point.color }}>{point.name}</span>
                                                <span className="custom-map-point-text-desc">{point.description}</span>
                                                <span>{point.lat},{point.lng}</span>
                                            </div>
                                        </div>
                                        <FontAwesomeIcon icon={faPenToSquare} className="custom-map-point-edit-button" onClick={() => openPointEditModal(val.id, point.id)} />
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

    return (
        <div>
            <h1>CUSTOM MAPS</h1>
            {renderCustomMaps()}
        </div>
    )
};
export default CustomMapsTab;