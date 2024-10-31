import React, { useState, useEffect, useContext } from "react";
import 'styles/components/sidebar.css';
import * as utils from 'helpers/data-utils'; 
import { AtlasContext } from "providers/AtlasContext";
import dayjs, { Dayjs } from "dayjs";
import { useMap } from "react-map-gl/maplibre";
import type { RasterTileSource } from "maplibre-gl";

const LayersTab = () => {
    const { atlas } = useMap();
    const { baseStyleSpecification, setBaseStyle, selectedCats, toggleCat, toggleSubLayer } = useContext(AtlasContext);
    const [selectedCountry, setSelectedCountry] = useState<string>("all");
    const [sentinelDate, setSentinelDate] = useState<Dayjs>(dayjs())


    useEffect(() => {
        if (selectedCountry != "")
            localStorage.setItem('selected-country-filter', selectedCountry);
    }, [selectedCountry]);

    useEffect(() => {
        if (localStorage.getItem('selected-country-filter'))
            setSelectedCountry(localStorage.getItem('selected-country-filter'));
        else setSelectedCountry("all");
    }, [])

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
                        let date = dayjs(e.target.value);
                        if (date > dayjs()) {
                            date = dayjs();
                        }

                        setSentinelDate(date);

                        const sentinelSource: RasterTileSource = atlas.getSource('Sentinel 2-L2A');
                        sentinelSource.setTiles(['https://atlas2.org/api/sentinel/{bbox-epsg-3857}.png?date=' + date.toISOString().split('T')[0]]);
                    }
                    }
                />
            </div>
        )
    }

    const renderRegularLayers = () => {
        return (
            <div id="regular-layer-container">
                {utils.regularLayerCategoriesWithCountries.filter(([, , country]) => filterCountry(country)).map(([catName, subLayers]) => {
                    if (subLayers.length > 1) {
                        const categoryPartlySelected: boolean = selectedCats.filter(cat => cat[0] === catName).length > 0;
                        return (
                            <React.Fragment key={catName}>
                                <div
                                    className={!categoryPartlySelected ? "regular-layer-normal" : "regular-layer-normal regular-layer-normal-selected"}
                                    onClick={() => toggleCat(catName, subLayers)}
                                >
                                    <input type="radio" checked={categoryPartlySelected} readOnly />
                                    <span>{catName}</span>
                                </div>
                                {categoryPartlySelected && subLayers.map(subLayerId => {
                                    const isSelected = selectedCats.filter(cat => cat[0] === catName)[0][1]?.includes(subLayerId);
                                    return <div
                                        key={subLayerId}
                                        className={!isSelected ? "regular-layer-many" : "regular-layer-normal-selected regular-layer-many"}
                                        onClick={() => toggleSubLayer(catName, subLayerId)}>
                                        <input type="radio" checked={isSelected} readOnly ></input>
                                        <span>{subLayerId}</span>
                                    </div>
                                })}
                            </React.Fragment>
                        )
                    } else {
                        const isSelected = selectedCats.map(cat => cat[0]).includes(catName);
                        return (
                            <div
                                key={catName}
                                className={!isSelected ? "regular-layer-normal" : "regular-layer-normal regular-layer-normal-selected"}
                                onClick = {() => toggleCat(catName)}
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
            {baseStyleSpecification.name === 'Sentinel 2-L2A' && sentinelDatetimeElement()}
            <h3>Regular Layers</h3>
            {renderRegularLayers()}
        </div>
    )
};
export default LayersTab;