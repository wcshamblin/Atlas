import React, { useState, useEffect, useContext } from "react";
import 'styles/components/sidebar.css';
import dayjs from 'dayjs';
import * as utils from 'helpers/data-utils'; 
import { AtlasContext } from "providers/AtlasContext";

type LayersTabProps = unknown;

const LayersTab = (props: LayersTabProps) => {
    // const { atlas } = useMap();
    const { baseStyleSpecification, setBaseStyle, selectedRegularLayers, toggleRegularLayers } = useContext(AtlasContext);
    const [selectedCountry, setSelectedCountry] = useState("all");

    // can use some code like this to generate the pictures for all of the different base styles
    // const dataUrl = atlas.getMap().getCanvas().toDataURL();
    // if(imgRef.current) {
    //     imgRef.current.src = dataUrl;
    // }
    //  <img ref={imgRef} width={'500px'} height={'500px'}/>
    // requires preserveDrawingBuffer on main map which will decrease performance  

    const renderBaseStyle = () => {
        return (
            <div id="base-style-container">
                {
                    utils.baseStyleCountries
                        .filter(([,country]) => filterCountry(country))
                        .map(([styleId,]) => (
                        <div
                            key={styleId} 
                            className={styleId !== baseStyleSpecification.name ? "base-style-item" : "base-style-selected base-style-item"} 
                            onClick={() => setBaseStyle(styleId)}
                        >
                                <div className={"base-style-" + styleId.toLowerCase().replaceAll(" ", "") + " base-style-img"}></div>
                            <span>{styleId}</span>
                        </div>
                    ))
                }
            </div>
        )
    }

    const renderRegularLayers = () => {
        return (
            <div id="regular-layer-container">
                {utils.regularLayerCategoriesWithCountries.filter(([, , country]) => filterCountry(country)).map(([catName, subLayers]) => {
                    if (subLayers.length > 1) {
                        const categoryPartlySelected: boolean = subLayers.some(layerId => selectedRegularLayers.includes(layerId));
                        return (
                            <React.Fragment key={catName}>
                                <div
                                    className={!categoryPartlySelected ? "regular-layer-normal" : "regular-layer-normal regular-layer-normal-selected"}
                                    onClick={() => toggleRegularLayers(utils.regularLayerCategoriesWithCountries.find(([name]) => name === catName)[1], categoryPartlySelected)}
                                >
                                    <input type="radio" checked={categoryPartlySelected} readOnly />
                                    <span>{catName}</span>
                                </div>
                                {categoryPartlySelected && subLayers.map(layerId => {
                                    const isSelected = selectedRegularLayers.includes(layerId);
                                    return <div
                                        key={layerId}
                                        className={!isSelected ? "regular-layer-many" : "regular-layer-normal-selected regular-layer-many"}
                                        onClick={() => toggleRegularLayers([layerId])}>
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
                                onClick = {() => toggleRegularLayers(subLayers)}
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

    const filterCountry = (country: string) => {
        switch (selectedCountry) {
            case "all":
                return true;
            case "none":
                return country == "all";
            default:
                return country == selectedCountry || country == "all";
        }
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
            <h3 style={{ "marginTop": "15px" }}>Base Style</h3>
            {renderBaseStyle()}
            <h3>Regular Layers</h3>
            {renderRegularLayers()}
        </div>
    )
};
export default LayersTab;