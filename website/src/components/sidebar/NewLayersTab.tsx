import React, { useState, useEffect } from "react";
import 'styles/components/sidebar.css';
import dayjs from 'dayjs';
import * as sourceUtils from 'helpers/source-utils'; 
import { useMap } from "react-map-gl";

const LayersTab = ({
    selectedBaseLayer,
    setSelectedBaseLayer,
    selectedRegularLayers,
    setSelectedRegularLayers,
}) => {
    const { atlas } = useMap();

    const [selectedCountry, setSelectedCountry] = useState("all");
    const [sentinelDate, setSentinelDate] = useState(new Date())

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

    const renderBaseLayers = () => {
        return (
            <div id="base-layer-container">
                {
                    sourceUtils.baseLayerCountries
                        .filter(([,country]) => filterCountry(country))
                        .map(([layerId,]) => (
                        <div
                            key={layerId} 
                            className={layerId !== selectedBaseLayer ? "base-layer-item" : "base-layer-selected base-layer-item"} 
                            onClick={() => updateBaseLayer(layerId)}
                        >
                            <div className={"base-layer-" + layerId.toLowerCase().replaceAll(" ", "") + " base-layer-img"}></div>
                            <span>{layerId}</span>
                        </div>
                    ))
                }
            </div>
        )
    }

    const renderRegularLayers = () => {
        return (
            <div id="regular-layer-container">
                {sourceUtils.regularLayerCategoriesWithCountries.filter(([, , country]) => filterCountry(country)).map(([catName, subLayers]: [ catName: string, subLayers: string[] ]) => {
                    if (subLayers.length > 1) {
                        const categoryPartlySelected: boolean = subLayers.some(layerId => selectedRegularLayers.includes(layerId));
                        return (
                            <React.Fragment key={catName}>
                                <div
                                    className={!categoryPartlySelected ? "regular-layer-normal" : "regular-layer-normal regular-layer-normal-selected"}
                                    onClick={() => toggleCategory(catName, categoryPartlySelected)}
                                >
                                    <input type="radio" checked={categoryPartlySelected} readOnly />
                                    <span>{catName}</span>
                                </div>
                                {categoryPartlySelected && subLayers.map(layerId => {
                                    const isSelected = selectedRegularLayers.includes(layerId);
                                    return <div
                                        key={layerId}
                                        className={!isSelected ? "regular-layer-many" : "regular-layer-normal-selected regular-layer-many"}
                                        onClick={() => toggleRegularLayer(layerId, !isSelected)}>
                                        <input type="radio" checked={isSelected} readOnly ></input>
                                        <span>{layerId}</span>
                                    </div>
                                })}
                            </React.Fragment>
                        )
                    } else {
                        const isSelected = selectedRegularLayers.includes(subLayers[0]);
                        return (
                            <div
                                key={catName}
                                className={!isSelected ? "regular-layer-normal" : "regular-layer-normal regular-layer-normal-selected"}
                                onClick = {() => toggleRegularLayer(subLayers[0], !isSelected)}
                            >
                                <input type="radio" checked={isSelected} readOnly ></input>
                                <span>{catName}</span>
                            </div>
                        )
                    }
                })}
            </div>
        )
    }

    const toggleCategory = (catName: string, partlySelected: boolean) => {
        // @ts-expect-error
        const categorySubLayers: string[] = sourceUtils.regularLayerCategoriesWithCountries.find(([name]) => name === catName)[1];
        if(!partlySelected) {
            setSelectedRegularLayers([...selectedRegularLayers, ...categorySubLayers]);
        } else {
            setSelectedRegularLayers([...selectedRegularLayers.filter(srl => !categorySubLayers.includes(srl))]);
        }
    }

    const filterCountry = (country) => {
        switch (selectedCountry) {
            case "all":
                return true;
            case "none":
                return country == "all";
            default:
                return country == selectedCountry || country == "all";
        }
    }

    const updateBaseLayer = (layerId) => {
        setSelectedBaseLayer(layerId);

        // google and osm have labels by default so they need to be hidden on the main mapbox layer
        if (['Google Hybrid', 'OpenStreetMap'].includes(layerId)) {
            if (atlas.getStyle().name !== "Mapbox Satellite") {
                atlas.getMap().setStyle(sourceUtils.noLabelsMapStyle);
            }
        } else {
            if (atlas.getStyle().name !== "Mapbox Dark")  {
                atlas.getMap().setStyle(sourceUtils.defaultMapStyle);
            }
        }
    }

    const toggleRegularLayer = (layerId: string, isVisible: boolean = null) => {
        if(selectedRegularLayers.includes(layerId)) {
            setSelectedRegularLayers([...selectedRegularLayers.filter(srl => srl != layerId)]);
        } else {
            setSelectedRegularLayers([...selectedRegularLayers, layerId]);
        }

        // localStorage.setItem('selected-layers', JSON.stringify(Object.entries(layers).filter(([key, val]) => val.visible === true).map(([key, val]) => key)));
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
            <h3>Regular Layers</h3>
            {renderRegularLayers()}
        </div>
    )
};
export default LayersTab;