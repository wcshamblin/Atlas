import React, { useState, useEffect } from "react";
import 'styles/components/sidebar.css';
import dayjs from 'dayjs';

const LayersTab = ({ 
    map,
    mapStatus,
    setLayoutProperty,
    displayLabels,
    setShowIsochrone,
    setShowShadeMap,
}) => {
    const [selectedCountry, setSelectedCountry] = useState("");
    const [sentinelDate, setSentinelDate] = useState(new Date())
    
    const [baseLayers, setBaseLayers] = useState({
        "Google Hybrid": { "visible": true, "country": "all" },
        "Bing Hybrid": { "visible": false, "country": "all" },
        "ESRI": { "visible": false, "country": "all" },
        "ESRI (2014)": { "visible": false, "country": "all" },
        "NAIP": { "visible": false, "country": "usa" },
        "MAXAR": { "visible": false, "country": "all" },
        "Mapbox": { "visible": false, "country": "all" },
        "Sentinel 2-L2A": { "visible": false, "country": "all" },
        "VFR": { "visible": false, "country": "usa" },
        "Lantmäteriet" : { "visible": false, "country": "eu" },
        "Skoterleder": { "visible": false, "country": "eu" },
        "USGS Topo": { "visible": false, "country": "usa" },
        "OpenStreetMap": { "visible": false, "country": "all" },
    });

    const [layerCategories] = useState({
        "OpenRailwayMap": ["OpenRailwayMap"],
        "Google Streetview": ["Google StreetView"],
        "Parcel ownership": ["Parcel ownership", "Parcel ownership labels"],
        "3D Buildings": ["3D Buildings"],
        "Light Pollution": ["Light Pollution"],
        "Towers": ["All Towers", "All Tower Extrusions"],
        "FAA Obstacles": ["FAA Obstacles"],
        "Antennas": ["Antennas"],
        "Long Lines": ["Long Lines"],
        "Shade Map": ["Shade Map"],
        "Isochrone": ["Isochrone"],
        "FLYGHINDER 2023": ["FLYGHINDER 2023", "FLYGHINDER 2023 Extrusions"],
        "Germany Tall Structures": ["Germany Tall Structures", "Germany Tall Structures Extrusions"],
        "National Register of Historic Places": ["National Register of Historic Places"],
    });

    const [layers, setLayers] = useState({
        "All Towers": { "visible": false, "country": "usa" },
        "All Tower Extrusions": { "visible": false, "country": "usa" },
        "Google StreetView": { "visible": false, "country": "all" },
        "3D Buildings": { "visible": false, "country": "all" },
        "Shade Map": { "visible": false, "country": "all" },
        "Antennas": { "visible": false, "country": "usa" },
        "Isochrone": { "visible": false, "country": "all" },
        "OpenRailwayMap": { "visible": false, "country": "all" },
        "Long Lines": { "visible": false, "country": "usa" },
        "FLYGHINDER 2023": { "visible": false, "country": "eu" },
        "FLYGHINDER 2023 Extrusions": { "visible": false, "country": "eu" },
        "FAA Obstacles": { "visible": false, "country": "usa" },
        "Germany Tall Structures": { "visible": false, "country": "eu" },
        "Germany Tall Structures Extrusions": { "visible": false, "country": "eu" },
        "National Register of Historic Places": { "visible": false, "country": "usa" },
        "Parcel ownership": { "visible": false, "country": "usa" },
        "Parcel ownership labels": { "visible": false, "country": "usa" },
        "Light Pollution": { "visible": false, "country": "all" },
    })

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

    useEffect(() => {
        if(selectedCountry != "")
            localStorage.setItem('selected-country-filter', selectedCountry);
    }, [selectedCountry]);

    useEffect(() => {
        if (localStorage.getItem('selected-country-filter'))
            setSelectedCountry(localStorage.getItem('selected-country-filter'));
        else setSelectedCountry("all");
    }, [])

    const changeSentinelDate = (date) => {
        // if the date is in the future, set it to today
        if (date > new Date()) {
            date = new Date();
        }

        // set state
        setSentinelDate(date);

        // remove source, then add it back
        map.removeLayer('Sentinel 2-L2A');
        map.removeSource('Sentinel 2-L2A');

        map.addSource('Sentinel 2-L2A', {
            'type': 'raster',
            'tiles': [
                'https://atlas2.org/api/sentinel/{bbox-epsg-3857}.png?date=' + date.toISOString().split('T')[0]
            ],
            'tileSize': 256,
            'maxzoom': 18
        });
        map.addLayer(
            {
                'id': 'Sentinel 2-L2A',
                'type': 'raster',
                'source': 'Sentinel 2-L2A',
                'paint': {}
            }
        )
    }

    const renderBaseLayers = () => {
        return (
            <div id="base-layer-container">
                {
                    Object.entries(baseLayers).filter(([, val]) => filterCountry(val)).map(([layerName, val]) => (
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
                {Object.entries(layerCategories).filter(([, subLayers]) => subLayers.every(layerName => filterCountry(layers[layerName]))).map(([catName, subLayers]) => {
                    if (subLayers.length > 1)
                        return (
                            <>
                                <div
                                    className={!subLayers.some(layerName => layers[layerName].visible) ? "regular-layer-normal" : "regular-layer-normal regular-layer-normal-selected"}
                                    onClick={() => updateCategory(catName, subLayers.some(layerName => !layers[layerName].visible))}>
                                    <input type="radio"
                                           checked={subLayers.some(layerName => layers[layerName].visible)}></input>
                                    <span>{catName}</span>

                                    {/*<p className={subLayers.some(layerName => !layers[layerName].visible) ? "black" : "selected black"} onClick={() => updateCategory(catName, subLayers.some(layerName => !layers[layerName].visible))}>{catName}</p>
                                {subLayers.map(layerName =>
                                    <p className={!layers[layerName].visible ? "black2" : "selected black2"} onClick={() => updateLayers(layerName, !layers[layerName].visible)}>{layerName} </p>
                                )}*/}
                                </div>
                                {subLayers.some(layerName => layers[layerName].visible) ? subLayers.map(layerName =>
                                    <div
                                        className={!layers[layerName].visible ? "regular-layer-many" : "regular-layer-normal-selected regular-layer-many"}
                                        onClick={() => updateLayers(layerName, !layers[layerName].visible)}>
                                        <input type="radio" checked={layers[layerName].visible}></input>
                                        <span>{layerName}</span>
                                    </div>
                                ) : ""}
                            </>
                        )
                    else
                        return (
                            <div
                                className={!layers[subLayers[0]].visible ? "regular-layer-normal" : "regular-layer-normal regular-layer-normal-selected"}
                                onClick={() => updateLayers(subLayers[0], !layers[subLayers[0]].visible)}>
                                <input type="radio" checked={layers[subLayers[0]].visible}></input>
                                <span>{catName}</span>
                                {/*<p className={!layers[subLayers[0]].visible ? "black" : "selected black"} onClick={() => updateLayers(subLayers[0], !layers[subLayers[0]].visible)}>{catName}</p>*/}
                            </div>
                        )
                })}
            </div>
        )
    }

    const updateCategory = (name, visible) => {
        layerCategories[name].forEach(layerName => {
            updateLayers(layerName, visible);
        })
    }

    const filterCountry = layer => {
        switch (selectedCountry) {
            case "all":
                return true;
            case "none":
                return layer.country == "all";
            default:
                return layer.country == selectedCountry || layer.country == "all";
        }
    }

    
    const sentinelDatetimeElement = () => {
        return (
            <div id="change-datetime-element-sentinel">
                <span id="sentinel-datetime-label">Sentinel 2 image acquisition date</span>
                <input
                    type="datetime-local"
                    id="datetime-input-sentinel"
                    name="datetime-input"
                    required
                    value={dayjs(sentinelDate).format("YYYY-MM-DDTHH:mm:ss")}
                    onChange={e => {
                        console.log("Sentinel datetime changed: " + e.target.value);
                        // if it was cleared, or if the date is invalid, then use the current time
                        if (e.target.value === "") {
                            changeSentinelDate(new Date());
                            return;
                        }
                        changeSentinelDate(new Date(e.target.value));
                        }
                    }
                />
            </div>
        )
    }

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

    return (
        <div className="layers-container">
            <h1>LAYERS</h1>
            <span style={{"marginLeft": "5px"}}>Country Specific Filter: </span>
            <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
                <option value="all">All Country Layers</option>
                <option value="none">No Country Specific Layers</option>
                <option value="usa">United States Only</option>
                <option value="eu">EU Only</option>
            </select>
            <h3 style={{ "marginTop": "15px" }}>Base Layers</h3>
            {renderBaseLayers()}
            {/*only render sentinel datetime element if layer is visible*/}
            {baseLayers["Sentinel 2-L2A"].visible ? sentinelDatetimeElement() : ""}
            <h3>Regular Layers</h3>
            {renderRegularLayers()}
        </div>
    )
};
export default LayersTab;