import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
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
    faCircleQuestion,
} from '@fortawesome/free-solid-svg-icons'

import { ReactComponent as SunriseIcon } from '../styles/images/sunrise_icon.svg';
import { ReactComponent as SunsetIcon } from '../styles/images/sunset_icon.svg';
import { ReactComponent as SunnyIcon } from '../styles/images/sunny.svg';
import { ReactComponent as ClockIcon } from '../styles/images/clock.svg';
import { ReactComponent as PollingIcon } from '../styles/images/polling_center.svg';
import { ReactComponent as ClockForwardIcon } from '../styles/images/clock_forward.svg';
import { ReactComponent as QuestionMarkIcon } from '../styles/images/question_mark.svg';

import {ReactComponent as FullMoonIcon} from '../styles/images/full_moon.svg';
import {ReactComponent as WaningGibbousIcon} from '../styles/images/waning_gibbous.svg';
import {ReactComponent as LastQuarterIcon} from '../styles/images/last_quarter.svg';
import {ReactComponent as WaningCrescentIcon} from '../styles/images/waning_crescent.svg';
import {ReactComponent as NewMoonIcon} from '../styles/images/new_moon.svg';
import {ReactComponent as WaxingCrescentIcon} from '../styles/images/waxing_crescent.svg';
import {ReactComponent as FirstQuarterIcon} from '../styles/images/first_quarter.svg';
import {ReactComponent as WaxingGibbousIcon} from '../styles/images/waxing_gibbous.svg';
import {ReactComponent as MoonriseIcon} from '../styles/images/moonrise.svg';
import {ReactComponent as MoonsetIcon} from '../styles/images/moonset.svg';
import {ReactComponent as MoonNoonIcon} from '../styles/images/moon_noon.svg';

import moment from 'moment';
import SentinelCalendar from './SentinelCalendar';

const Sidebar = ({ 
    mapStatus,
    expanded, 
    setDisplaySidebar, 
    setLayoutProperty, 
    getLayoutProperty, 
    showShadeMap,
    setShowShadeMap, 
    showIsochrone, 
    setShowIsochrone, 
    customMapsData,
    sunburstInfo,
    flyTo,
    map,
    pollingPosition,
    setPollingPosition,
    mapDatetime,
    setMapDatetime,
    astronomyInfo,
    currentSelectedCustomMapPoint, 
    setCurrentSelectedCustomMapPoint, 
    processCustomMapPointClick, 
    setOpenModal, 
    setModalType, 
    setModalSelectedCustomMapId, 
    setModalSelectedCustomMapPointId, 
    displayLabels, 
    settings, 
    updateSettings,
    pointFilters,
    updatePointFilters,
    towerHeightFilter,
    setTowerHeightFilter,
}) => {
    const [selectedPart, setSelectedPart] = useState("layers");
    const [isoMinutesLive, setIsoMinutesLive] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState("");
    const [parcelSearchQuery, setParcelSearchQuery] = useState("");
    
    // Tower height filter unit state (only store unit locally)
    const [towerHeightUnit, setTowerHeightUnit] = useState("feet");
    
    // Local state for slider values (updates immediately for visual feedback)
    const [localTowerHeightMin, setLocalTowerHeightMin] = useState(towerHeightFilter.min);
    const [localTowerHeightMax, setLocalTowerHeightMax] = useState(towerHeightFilter.max);
    
    // Ref to store scroll position
    const sidebarContentRef = useRef(null);
    const savedScrollPosition = useRef(0);

    // Sync local tower height state with parent when parent changes
    useEffect(() => {
        setLocalTowerHeightMin(towerHeightFilter.min);
        setLocalTowerHeightMax(towerHeightFilter.max);
    }, [towerHeightFilter]);

    useEffect(() => {
        if (isoMinutesLive == null) {
            setIsoMinutesLive(settings["isoMinutes"]);
        } else {
            const timer = setTimeout(() => {
                updateSettings("isoMinutes", isoMinutesLive)
            }, 500)

            return () => clearTimeout(timer)
        }
    }, [isoMinutesLive]);

    // Save scroll position continuously as user scrolls
    useEffect(() => {
        const handleScroll = () => {
            if (sidebarContentRef.current) {
                savedScrollPosition.current = sidebarContentRef.current.scrollTop;
            }
        };

        const currentRef = sidebarContentRef.current;
        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (currentRef) {
                currentRef.removeEventListener('scroll', handleScroll);
            }
        };
    }, [expanded]);

    // Restore scroll position when sidebar expands (useLayoutEffect runs before paint)
    useLayoutEffect(() => {
        if (expanded && sidebarContentRef.current) {
            sidebarContentRef.current.scrollTop = savedScrollPosition.current;
        }
    }, [expanded]);

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

    const [combineLayersMode, setCombineLayersMode] = useState(false);
    const [baseLayerOpacity, setBaseLayerOpacity] = useState({
        "Google Hybrid": 1.0,
        "Bing Hybrid": 1.0,
        "ESRI": 1.0,
        "ESRI (2014)": 1.0,
        "NAIP": 1.0,
        "MAXAR": 1.0,
        "Mapbox": 1.0,
        "Sentinel 2-L2A": 1.0,
        "VFR": 1.0,
        "Lantmäteriet": 1.0,
        "Skoterleder": 1.0,
        "USGS Topo": 1.0,
        "OpenStreetMap": 1.0,
    });

    const layerCategories = {
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
    }

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

    const [customMapsLayers, setCustomMapsLayers] = useState({});
    const [customMapsLayersLoaded, setCustomMapsLayersLoaded] = useState(false);
    const [sentinelDate, setSentinelDate] = useState(new Date())
    const [sentinelCloudCoverData, setSentinelCloudCoverData] = useState({});
    const [currentEffectiveSentinelDate, setCurrentEffectiveSentinelDate] = useState(null);

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

    useEffect(() => {
        if (mapStatus) {
            console.log("Using base layer: " + localStorage.getItem('base-layer'))
            
            if (combineLayersMode) {
                // Load combined layers
                if (localStorage.getItem('base-layers-combined')) {
                    const combinedLayers = JSON.parse(localStorage.getItem('base-layers-combined'));
                    // First hide all layers
                    Object.keys(baseLayers).forEach(layer => {
                        setLayoutProperty(layer, 'visibility', 'none');
                        baseLayers[layer].visible = false;
                    });
                    // Then show the selected ones with their opacity
                    combinedLayers.forEach(layerName => {
                        setLayoutProperty(layerName, 'visibility', 'visible');
                        baseLayers[layerName].visible = true;
                        if (map && map.getLayer(layerName)) {
                            try {
                                map.setPaintProperty(layerName, 'raster-opacity', baseLayerOpacity[layerName]);
                                console.log(`Initial load: Set opacity for ${layerName} to ${baseLayerOpacity[layerName]}`);
                            } catch (e) {
                                console.error(`Initial load: Failed to set opacity for ${layerName}:`, e);
                            }
                        }
                    });
                    setBaseLayers({ ...baseLayers });
                }
            } else {
                // Single layer mode (original behavior)
                if (!localStorage.getItem('base-layer'))
                    localStorage.setItem('base-layer', Object.entries(baseLayers).filter(([key, val]) => val.visible === true).map(([key, val]) => key)[0]);
                
                updateBaseLayers(localStorage.getItem('base-layer'));
            }

            if (!localStorage.getItem('selected-layers'))
                localStorage.setItem('selected-layers', JSON.stringify(Object.entries(layers).filter(([key, val]) => val.visible === true).map(([key, val]) => key)));

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
        localStorage.setItem('combine-layers-mode', combineLayersMode);
        
        // When switching modes, update layer visibility appropriately
        if (mapStatus && map) {
            if (combineLayersMode) {
                // Switching to combine mode - load combined layers if available
                if (localStorage.getItem('base-layers-combined')) {
                    const combinedLayers = JSON.parse(localStorage.getItem('base-layers-combined'));
                    Object.keys(baseLayers).forEach(layer => {
                        const shouldBeVisible = combinedLayers.includes(layer);
                        setLayoutProperty(layer, 'visibility', shouldBeVisible ? 'visible' : 'none');
                        baseLayers[layer].visible = shouldBeVisible;
                        if (shouldBeVisible && map.getLayer(layer)) {
                            try {
                                map.setPaintProperty(layer, 'raster-opacity', baseLayerOpacity[layer]);
                                console.log(`Restored opacity for ${layer} to ${baseLayerOpacity[layer]}`);
                            } catch (e) {
                                console.error(`Failed to restore opacity for ${layer}:`, e);
                            }
                        }
                    });
                    setBaseLayers({ ...baseLayers });
                }
            } else {
                // Switching to single layer mode - use the saved single layer
                const singleLayer = localStorage.getItem('base-layer');
                if (singleLayer) {
                    Object.keys(baseLayers).forEach(layer => {
                        const shouldBeVisible = layer === singleLayer;
                        setLayoutProperty(layer, 'visibility', shouldBeVisible ? 'visible' : 'none');
                        baseLayers[layer].visible = shouldBeVisible;
                        // Reset opacity to 1.0 for single layer mode
                        if (shouldBeVisible && map.getLayer(layer)) {
                            try {
                                map.setPaintProperty(layer, 'raster-opacity', 1.0);
                            } catch (e) {
                                console.error(`Failed to reset opacity for ${layer}:`, e);
                            }
                        }
                    });
                    setBaseLayers({ ...baseLayers });
                }
            }
        }
    }, [combineLayersMode]);

    useEffect(() => {
        localStorage.setItem('base-layer-opacity', JSON.stringify(baseLayerOpacity));
    }, [baseLayerOpacity]);

    useEffect(() => {
        if (localStorage.getItem('selected-country-filter'))
            setSelectedCountry(localStorage.getItem('selected-country-filter'));
        else setSelectedCountry("all");
        
        // Load combine layers mode
        if (localStorage.getItem('combine-layers-mode'))
            setCombineLayersMode(localStorage.getItem('combine-layers-mode') === 'true');
        
        // Load base layer opacity
        if (localStorage.getItem('base-layer-opacity'))
            setBaseLayerOpacity(JSON.parse(localStorage.getItem('base-layer-opacity')));
    }, [])

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

    // Update parcel layer styling when search query changes
    useEffect(() => {
        if (!map) return;
        if (!map.getLayer('Parcel ownership')) return;

        // If parcel layer is not visible, reset search query
        if (!layers["Parcel ownership"].visible) {
            if (parcelSearchQuery !== "") {
                setParcelSearchQuery("");
            }
            return;
        }

        if (parcelSearchQuery.trim() === "") {
            // Reset to default color and width when search is empty
            map.setPaintProperty('Parcel ownership', 'line-color', '#00a97d');
            map.setPaintProperty('Parcel ownership', 'line-width', 1);
            // Reset fill to transparent
            if (map.getLayer('Parcel ownership fill')) {
                console.log('Resetting parcel fill to transparent');
                map.setPaintProperty('Parcel ownership fill', 'fill-color', 'rgba(0, 0, 0, 0)');
            } else {
                console.log('Parcel ownership fill layer not found');
            }
            // Reset label color if labels layer exists
            if (map.getLayer('Parcel ownership labels')) {
                map.setPaintProperty('Parcel ownership labels', 'text-color', '#8affe0');
            }
        } else {
            // Highlight matching parcels in red
            const searchLower = parcelSearchQuery.toLowerCase();
            const matchCondition = [
                'all',
                ['has', 'owner'],
                ['!=', ['get', 'owner'], ''],
                ['in', searchLower, ['downcase', ['coalesce', ['get', 'owner'], '']]],
            ];
            
            map.setPaintProperty('Parcel ownership', 'line-color', [
                'case',
                matchCondition,
                '#ff0000',  // Red for matches
                '#00a97d'   // Default color for non-matches
            ]);
            
            // Keep all borders at normal width
            map.setPaintProperty('Parcel ownership', 'line-width', 1);
            
            // Fill matching parcels with transparent light red
            if (map.getLayer('Parcel ownership fill')) {
                console.log('Setting parcel fill to red for matches');
                map.setPaintProperty('Parcel ownership fill', 'fill-color', [
                    'case',
                    matchCondition,
                    'rgba(255, 0, 0, 0.2)',  // Light transparent red for matches
                    'rgba(0, 0, 0, 0)'       // Transparent for non-matches
                ]);
            } else {
                console.log('Parcel ownership fill layer not found when trying to set fill');
            }
            
            // Highlight matching labels in red
            if (map.getLayer('Parcel ownership labels')) {
                map.setPaintProperty('Parcel ownership labels', 'text-color', [
                    'case',
                    matchCondition,
                    '#ff0000',  // Red for matches
                    '#8affe0'   // Default color for non-matches
                ]);
            }
        }
    }, [parcelSearchQuery, map, layers]);

    const SunburstQualityInfoButton = () => {
        const [hover, setHover] = useState(false);

        return (
            <div>
                <span id="sunburst-quality-info-button" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <QuestionMarkIcon className="sunburst-quality-info-button-icon" style={{ color: hover ? "black" : "grey" }} />
                </span>
                {hover ? (
                    <div id="sunburst-quality-info-button-hover">
                        <span><text style={{ color: "red", marginLeft: "0px"}}>Poor (0-25%)</text>  Little to no color, with precipitation or a thick cloud layer often blocking a direct view of the sun.</span>
                        <br/>
                        <span><text style={{ color: "#da9f00", marginLeft: "0px"}}>Fair (25-50%)</text>  Some color for a short time, with conditions ranging from mostly cloudy, or hazy, to clear, with little to no clouds at all levels.</span>
                        <br/>
                        <span><text style={{ color: "green", marginLeft: "0px"}}>Good (50-75%)</text>  A fair amount of color, often multi-colored, lasting a considerable amount of time. Often caused by scattered clouds at multiple levels.</span>
                        <br/>
                        <span><text style={{ color: "blue", marginLeft: "0px"}}>Great (75-100%)</text>  Extremely vibrant color lasting 30 minutes or more. Often caused by multiple arrangements of clouds at multiple levels, transitioning through multiple stages of vivid color.</span>
                    </div>
            ) : ""}
        </div>
    )
    }
    const sentinelDatetimeElement = () => {
        return (
            <div id="change-datetime-element-sentinel">
                <span id="sentinel-datetime-label">Sentinel 2 image acquisition date</span>
                <SentinelCalendar
                    value={sentinelDate}
                    onChange={(date) => {
                        console.log("Sentinel date changed: " + date);
                        changeSentinelDate(date);
                    }}
                    map={map}
                    onCloudCoverDataChange={(data) => {
                        setSentinelCloudCoverData(data);
                    }}
                />
            </div>
        )
    }

    const parcelSearchElement = () => {
        return (
            <div id="parcel-search-element">
                <span id="parcel-search-label">Parcel owner search</span>
                <input
                    type="text"
                    id="parcel-search-input"
                    name="parcel-search-input"
                    placeholder="Search owner names..."
                    value={parcelSearchQuery}
                    onChange={e => {
                        setParcelSearchQuery(e.target.value);
                    }}
                />
            </div>
        )
    }

    const towerHeightFilterElement = () => {
        const maxFeet = 2067;
        const maxMeters = 630;
        
        const convertToDisplay = (value) => {
            if (towerHeightUnit === "meters") {
                return Math.round(value * 0.3048);
            }
            return value;
        };
        
        const convertToFeet = (value) => {
            if (towerHeightUnit === "meters") {
                return Math.round(value / 0.3048);
            }
            return value;
        };
        
        // Use local state for display (updates immediately)
        const displayMin = convertToDisplay(localTowerHeightMin);
        const displayMax = convertToDisplay(localTowerHeightMax);
        const displayMaxPossible = towerHeightUnit === "meters" ? maxMeters : maxFeet;
        
        // Calculate the blue range position as percentages
        const minPercent = (displayMin / displayMaxPossible) * 100;
        const maxPercent = (displayMax / displayMaxPossible) * 100;
        
        // Handler to commit local values to parent (triggers API call)
        // Also swaps values if min > max
        const commitHeightFilter = () => {
            let finalMin = localTowerHeightMin;
            let finalMax = localTowerHeightMax;
            
            // Swap if min is greater than max
            if (finalMin > finalMax) {
                [finalMin, finalMax] = [finalMax, finalMin];
                setLocalTowerHeightMin(finalMin);
                setLocalTowerHeightMax(finalMax);
            }
            
            console.log("Committing tower height filter:", {
                min: finalMin,
                max: finalMax,
                unit: towerHeightUnit
            });
            setTowerHeightFilter({ min: finalMin, max: finalMax });
        };
        
        return (
            <div id="tower-height-filter-element">
                <span id="tower-height-filter-label">Tower height filter</span>
                <div id="tower-height-unit-toggle">
                    <button 
                        className={towerHeightUnit === "feet" ? "unit-btn-active" : "unit-btn"}
                        onClick={() => setTowerHeightUnit("feet")}
                    >
                        Feet
                    </button>
                    <button 
                        className={towerHeightUnit === "meters" ? "unit-btn-active" : "unit-btn"}
                        onClick={() => setTowerHeightUnit("meters")}
                    >
                        Meters
                    </button>
                </div>
                <div id="tower-height-slider-container">
                    <div id="tower-height-slider-track"></div>
                    <div 
                        id="tower-height-slider-range" 
                        style={{
                            left: `${minPercent}%`,
                            width: `${maxPercent - minPercent}%`
                        }}
                    ></div>
                    <input
                        type="range"
                        min="0"
                        max={displayMaxPossible}
                        value={displayMin}
                        className="tower-height-slider tower-height-slider-min"
                        onChange={(e) => {
                            const sliderValue = parseInt(e.target.value);
                            const newMin = convertToFeet(sliderValue);
                            console.log("Min slider onChange:", {
                                sliderValue,
                                newMinFeet: newMin,
                                unit: towerHeightUnit,
                                willUpdate: newMin <= localTowerHeightMax
                            });
                            if (newMin <= localTowerHeightMax) {
                                setLocalTowerHeightMin(newMin);
                            }
                        }}
                        onMouseUp={commitHeightFilter}
                        onTouchEnd={commitHeightFilter}
                    />
                    <input
                        type="range"
                        min="0"
                        max={displayMaxPossible}
                        value={displayMax}
                        className="tower-height-slider tower-height-slider-max"
                        onChange={(e) => {
                            const sliderValue = parseInt(e.target.value);
                            const newMax = convertToFeet(sliderValue);
                            console.log("Max slider onChange:", {
                                sliderValue,
                                newMaxFeet: newMax,
                                unit: towerHeightUnit,
                                willUpdate: newMax >= localTowerHeightMin
                            });
                            if (newMax >= localTowerHeightMin) {
                                setLocalTowerHeightMax(newMax);
                            }
                        }}
                        onMouseUp={commitHeightFilter}
                        onTouchEnd={commitHeightFilter}
                    />
                </div>
                <div id="tower-height-values">
                    <input 
                        type="number" 
                        className="tower-height-input"
                        value={displayMin}
                        min="0"
                        max={displayMaxPossible}
                        onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                                const clampedValue = Math.max(0, Math.min(value, displayMaxPossible));
                                const newMinFeet = convertToFeet(clampedValue);
                                setLocalTowerHeightMin(newMinFeet);
                            }
                        }}
                        onBlur={commitHeightFilter}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                commitHeightFilter();
                                e.target.blur();
                            }
                        }}
                    />
                    <input 
                        type="number" 
                        className="tower-height-input"
                        value={displayMax}
                        min="0"
                        max={displayMaxPossible}
                        onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                                const clampedValue = Math.max(0, Math.min(value, displayMaxPossible));
                                const newMaxFeet = convertToFeet(clampedValue);
                                setLocalTowerHeightMax(newMaxFeet);
                            }
                        }}
                        onBlur={commitHeightFilter}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                commitHeightFilter();
                                e.target.blur();
                            }
                        }}
                    />
                </div>
            </div>
        )
    }

    const changeDatetimeElement = () => {
        return (
            <div id="change-datetime-element">
                <input
                    type="datetime-local"
                    id="datetime-input"
                    name="datetime-input"
                    required
                    value={moment(mapDatetime).format("YYYY-MM-DDTHH:mm:ss")}
                    onChange={e => {
                        // if it was cleared, or if the date is invalid, then don't update the map datetime
                        if (e.target.value === "") return;
                        setMapDatetime(new Date(e.target.value));
                    }
                    }
                />
            </div>
        )
    }

    const setDateTimeToNow = () => {
        // if within 60 seconds, don't set to now
        if (Math.abs((new Date()).getTime() - mapDatetime.getTime()) / 1000 < 60) {
            return;
        }
        setMapDatetime(new Date());
    }

    const setDatetimeToNowButton = () => {
        return (
            <div id="set-datetime-to-now-button">
                <ClockForwardIcon className="clock-forward-icon" onClick={() => setDateTimeToNow()} />
                <span>Set to now</span>
            </div>
        )
    }

    const changePollingPositionButton = () => {
        return (
            <div id="change-polling-position-button">
                <PollingIcon className="polling-icon" onClick={() => setPollingPositionAsCenter()} />
                <span>Set polling position</span>
            </div>
        )
    }

    const setPollingPositionAsCenter = () => {
        console.log("Current polling position: " + pollingPosition + " - setting to map center: " + map.getCenter());
        // if the polling position is ALREADY SET, check to see if the new polling position even warrants re polling data
        // if it is, then update the polling position
        if (pollingPosition[0] != null && pollingPosition[1] != null) {
            if (Math.abs(map.getCenter().lng - pollingPosition[0]) > .05 || Math.abs(map.getCenter().lat - pollingPosition[1]) > .05) {
                setPollingPosition([map.getCenter().lng, map.getCenter().lat]);
            }
        } else {
            setPollingPosition([map.getCenter().lng, map.getCenter().lat]);
        }
        // If the map is zoomed out too far to make sense to poll data, then zoom in
        if (map.getZoom() < 8.8) {
            map.flyTo({ center: map.getCenter(), zoom: 8.8 });
        }
    }

    const renderAstronomyInfo = () => {
        try {
            // sun info
            let sun_phenomena = astronomyInfo["properties"]["data"]["sundata"];
            let sunrise_utc = sun_phenomena.find(phen => phen["phen"] === "Rise");
            let sunset_utc = sun_phenomena.find(phen => phen["phen"] === "Set");
            let solar_noon_utc = sun_phenomena.find(phen => phen["phen"] === "Upper Transit");

            let sunrise_local;
            let sunset_local;
            let solar_noon_local;

            if (!sunrise_utc) {
                sunrise_local = "N/A"
            } else {
                sunrise_local = sunrise_utc["time"];
            }

            if (!sunset_utc) {
                sunset_local = "N/A"
            } else {
                sunset_local = sunset_utc["time"];
            }

            if (!solar_noon_utc) {
                solar_noon_local = "N/A"
            } else {
                solar_noon_local = solar_noon_utc["time"];
            }


            // moon info
            let current_phase = astronomyInfo["properties"]["data"]["curphase"];

            // ["properties"]["data"]["closestphase"] = {'day': 28, 'month': 10, 'phase': 'Full Moon', 'time': '20:24', 'year': 2023}
            // if closestphase is on the same date as map datetime, then use the current phase
            if (mapDatetime.getDate() === astronomyInfo["properties"]["data"]["closestphase"]["day"] && mapDatetime.getMonth()+1 === astronomyInfo["properties"]["data"]["closestphase"]["month"] && mapDatetime.getFullYear() === astronomyInfo["properties"]["data"]["closestphase"]["year"]) {
                current_phase = astronomyInfo["properties"]["data"]["closestphase"]["phase"];
            }

            let illumination = astronomyInfo["properties"]["data"]["fracillum"];

            let moon_phenomena = astronomyInfo["properties"]["data"]["moondata"];

            // any of the following may not exit within data
            let moonset = moon_phenomena.find(phen => phen["phen"] === "Set");
            let moonrise = moon_phenomena.find(phen => phen["phen"] === "Rise");
            let moonnoon = moon_phenomena.find(phen => phen["phen"] === "Upper Transit");

            let moonset_local;
            let moonrise_local;
            let moonnoon_local;

            if (!moonset) {
                moonset_local = "N/A"
            }
            else {
                moonset_local = moonset["time"];
            }

            if (!moonrise) {
                moonrise_local = "N/A"
            }
            else {
                moonrise_local = moonrise["time"];
            }

            if (!moonnoon) {
                moonnoon_local = "N/A"
            }
            else {
                moonnoon_local = moonnoon["time"];
            }

            let current_phase_icon;

            switch (current_phase) {
                case "New Moon":
                    current_phase_icon = <NewMoonIcon className="moon-phase-icon" />
                    break;
                case "Waxing Crescent":
                    current_phase_icon = <WaxingCrescentIcon className="moon-phase-icon" />
                    break;
                case "First Quarter":
                    current_phase_icon = <FirstQuarterIcon className="moon-phase-icon" />
                    break;
                case "Waxing Gibbous":
                    current_phase_icon = <WaxingGibbousIcon className="moon-phase-icon" />
                    break;
                case "Full Moon":
                    current_phase_icon = <FullMoonIcon className="moon-phase-icon" />
                    break;
                case "Waning Gibbous":
                    current_phase_icon = <WaningGibbousIcon className="moon-phase-icon" />
                    break;
                case "Last Quarter":
                    current_phase_icon = <LastQuarterIcon className="moon-phase-icon" />
                    break;
                case "Waning Crescent":
                    current_phase_icon = <WaningCrescentIcon className="moon-phase-icon" />
                    break;
                default:
                    current_phase_icon = <text id="moon-phase-error">Error retrieving moon phase data - check console for details.</text>
            }

            return (
                <div id="astronomy-segment">
                    <div id="sunrise-sunset-metrics">
                        <span>Sunrise/Sunset</span><br />
                        {renderSunsetSunriseInfo(sunrise_local, sunset_local, solar_noon_local)}
                    </div>

                    <div id="moon-phase-metrics">
                        <span>Moon Phase</span><br />
                        {current_phase_icon}<text id="moon-phase">{current_phase} ({illumination})</text><br />
                        <MoonriseIcon className="sunburst-sunrise-sunset-icon" /><text>Moonrise: {moonrise_local}</text><br />
                        <MoonNoonIcon className="sunburst-sunrise-sunset-icon" /><text>Moon Noon: {moonnoon_local}</text><br />
                        <MoonsetIcon className="sunburst-sunrise-sunset-icon" /><text>Moonset: {moonset_local}</text><br />
                    </div>
                </div>
            )
        } catch (e) {
            console.log("Error rendering moon info: " + e);
            return (
                <div id="moon-segment">
                    <div id="moon-phase-metrics">
                        <text id="moon-phase-error">Error retrieving moon phase data - check console for details.</text>
                    </div>
                </div>
            )
        }
    }

    const renderSunsetSunriseInfo = (sunrise_local, sunset_local, solar_noon_local) => {
        try {
            // if sunburst info is for sunset
            if (sunburstInfo["features"][0]["properties"]["type"] === "Sunset") {
                return (
                    <div id="sunrise-sunset-metrics">
                        <SunriseIcon className="sunburst-sunrise-sunset-icon"/>
                        <text>Sunrise: {sunrise_local}</text>
                        <br/>
                        <SunnyIcon className="sunburst-sunrise-sunset-icon"/>
                        <text>Solar Noon: {solar_noon_local}</text>
                        <br/>
                        <SunsetIcon className="sunburst-sunrise-sunset-icon"/>
                        <text>Sunset: {sunset_local}</text>
                        {renderSunburstInfo()}
                        <br/>
                    </div>
                )
            } else {
                return (
                    <div id="sunrise-sunset-metrics">
                        <SunriseIcon className="sunburst-sunrise-sunset-icon"/>
                        <text>Sunrise: {sunrise_local}</text>
                        <br/>
                        {renderSunburstInfo()}
                        <SunnyIcon className="sunburst-sunrise-sunset-icon"/>
                        <text>Solar Noon: {solar_noon_local}</text>
                        <br/>
                        <SunsetIcon className="sunburst-sunrise-sunset-icon"/>
                        <text>Sunset: {sunset_local}</text>
                        <br/>
                    </div>
                )
            }
        } catch (e) {
            console.log("Error rendering sunburst info: " + e);
            return (
                <div id="sunburst-segment">
                    <span>Sunrise/Sunset</span><br/>
                    <SunriseIcon className="sunburst-sunrise-sunset-icon"/>
                    <text>Sunrise: {sunrise_local}</text>
                    <br/>
                    <SunnyIcon className="sunburst-sunrise-sunset-icon"/>
                    <text>Solar Noon: {solar_noon_local}</text>
                    <br/>
                    <SunsetIcon className="sunburst-sunrise-sunset-icon"/>
                    <text>Sunset: {sunset_local}</text>
                    <br/>
                    <text id="sunburst-sunrise-sunset-error">No sunburst data available - check console for details.</text>
                </div>
            )
        }
    }

    const renderSunburstInfo = () => {
        console.log("Sunburst info: " + JSON.stringify(sunburstInfo));

        // if the map datetime is more than 4 days in the future, or more than 1 day in the past, then don't render sunburst info
        if (mapDatetime > new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) || mapDatetime < new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)) {
            return (
                <div id="astronomy-segment">
                    <div id="sunburst-metrics">
                        <text id="sunburst-sunrise-sunset-error">Sunburst data not available for this datetime.</text>
                    </div>
                </div>
            )
        }

        try {
            let type = sunburstInfo["features"][0]["properties"]["type"];
            let twilight;
            if (type === "Sunrise") {
                twilight = "dawn";
            } else {
                twilight = "dusk";
            }
            let quality = sunburstInfo["features"][0]["properties"]["quality"];
            let quality_percent = sunburstInfo["features"][0]["properties"]["quality_percent"];

            let astro_time = new Date(Date.parse(sunburstInfo["features"][0]["properties"][twilight]["astronomical"])).toLocaleTimeString();
            let nautical_time = new Date(Date.parse(sunburstInfo["features"][0]["properties"][twilight]["nautical"])).toLocaleTimeString();
            let civil_time = new Date(Date.parse(sunburstInfo["features"][0]["properties"][twilight]["civil"])).toLocaleTimeString();

            let quality_color;
            if (quality_percent >= 75) {
                quality_color = "blue";
            }
            else if (quality_percent >= 50) {
                quality_color = "green";
            }
            else if (quality_percent >= 25) {
                quality_color = "#da9f00";
            }
            else {
                quality_color = "red";
            }

            let SunriseSunsetIcon;
            if (type === "Sunrise") {
                SunriseSunsetIcon = <SunriseIcon className="sunburst-sunrise-sunset-icon"/>
            }
            else {
                SunriseSunsetIcon = <SunsetIcon className="sunburst-sunrise-sunset-icon"/>
            }

            return (
                    <div id="sunburst-metrics">
                        {/*<text id="regular">Quality: </text><span style={{ color: quality_color }}>{quality} ({quality_percent}%)</span>*/}
                        <text id="sunburstquality">Quality:</text><text style={{ color: quality_color }}>{quality} ({quality_percent}%)</text>
                        <br/>
                        <ClockIcon className="sunburst-clock-icon"/><text>{twilight.charAt(0).toUpperCase() + twilight.slice(1)}: </text><br/>
                        <div style={{ marginLeft: "20px" }}>
                            <text>Civil: {civil_time}</text><br/>
                            <text>Astronomical: {astro_time}</text><br/>
                            <text>Nautical: {nautical_time}</text><br/>
                        </div>
                    </div>
            )
        } catch (e) {
            console.log("Error rendering sunburst info: " + e);
            return (
                <div id="sunburst-segment">
                    <div id="sunburst-metrics">
                        <text id="sunburst-sunrise-sunset-error">No sunburst data available - check console for details.</text>
                    </div>
                </div>
            )
        }
    }


    const updateBaseLayers = name => {
        if (combineLayersMode) {
            // Toggle mode - allow multiple layers
            const newVisibility = !baseLayers[name].visible;
            setLayoutProperty(name, 'visibility', newVisibility ? 'visible' : 'none');
            baseLayers[name].visible = newVisibility;
            
            // Update opacity for the layer when making it visible
            if (newVisibility && map && map.getLayer(name)) {
                try {
                    map.setPaintProperty(name, 'raster-opacity', baseLayerOpacity[name]);
                    console.log(`Set initial opacity for ${name} to ${baseLayerOpacity[name]}`);
                } catch (e) {
                    console.error(`Failed to set initial opacity for ${name}:`, e);
                }
            }
            
            // Check if any layer that hides labels is visible
            const hideLabels = Object.keys(baseLayers).some(layer => 
                baseLayers[layer].visible && (layer === "OpenStreetMap" || layer === "Google Hybrid")
            );
            displayLabels(!hideLabels);
            
            localStorage.setItem('base-layers-combined', JSON.stringify(
                Object.entries(baseLayers)
                    .filter(([key, val]) => val.visible)
                    .map(([key, val]) => key)
            ));
        } else {
            // Single selection mode (original behavior)
            Object.keys(baseLayers).forEach(layer => {
                setLayoutProperty(layer, 'visibility', layer === name ? 'visible' : 'none');
                baseLayers[layer].visible = layer === name ? true : false;
                // Reset opacity to full in single layer mode
                if (layer === name && map && map.getLayer(layer)) {
                    try {
                        map.setPaintProperty(layer, 'raster-opacity', 1.0);
                    } catch (e) {
                        console.error(`Failed to reset opacity for ${layer}:`, e);
                    }
                }
            });

            displayLabels(!(name == "OpenStreetMap" || name == "Google Hybrid"));

            localStorage.setItem('base-layer', name);
        }

        setBaseLayers({ ...baseLayers });
    }

    const updateBaseLayerOpacity = (name, opacity) => {
        const newOpacity = { ...baseLayerOpacity, [name]: opacity };
        setBaseLayerOpacity(newOpacity);
        
        // Update the map layer opacity if it's currently visible and is a raster layer
        if (baseLayers[name].visible && map && map.getLayer(name)) {
            try {
                map.setPaintProperty(name, 'raster-opacity', opacity);
                console.log(`Set opacity for ${name} to ${opacity}`);
            } catch (e) {
                console.error(`Failed to set opacity for ${name}:`, e);
            }
        }
    }

    const resetLayers = () => {
        Object.keys(layers).forEach(layer => {
            if (layer != 'Shade Map') {
                setLayoutProperty(layer, 'visibility', 'none');
                // Also reset the fill layer for Parcel ownership
                if (layer == "Parcel ownership") {
                    setLayoutProperty('Parcel ownership fill', 'visibility', 'none');
                }
            }
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
            
            // Also control the fill layer for Parcel ownership
            if (name == "Parcel ownership") {
                setLayoutProperty('Parcel ownership fill', 'visibility', visible ? 'visible' : 'none');
            }
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

    const renderBaseLayers = () => {
        return (
            <div>
                <div id="base-layer-container">
                    {
                        Object.entries(baseLayers).filter(([, val]) => filterCountry(val)).map(([layerName, val]) => (
                            <div key={layerName}>
                                <div className={!val.visible ? "base-layer-item" : "base-layer-selected base-layer-item"} onClick={() => updateBaseLayers(layerName)}>
                                    <div className={"base-layer-" + layerName.toLowerCase().replaceAll(" ", "") + " base-layer-img"}></div>
                                    <span>{layerName}</span>
                                </div>
                                {combineLayersMode && val.visible && (
                                    <div className="base-layer-opacity-control">
                                        <input 
                                            type="range" 
                                            min="0.15" 
                                            max="1" 
                                            step="0.05" 
                                            value={baseLayerOpacity[layerName]} 
                                            onChange={(e) => updateBaseLayerOpacity(layerName, parseFloat(e.target.value))}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                )}
                            </div>
                        ))
                    }
                </div>
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

    // Helper function to convert Date to YYYY-MM-DD in local timezone
    function dateToLocalDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Helper function to find the most recent date with Sentinel data <= the target date
    function findEffectiveSentinelDate(targetDate, cloudCoverData) {
        if (!cloudCoverData || Object.keys(cloudCoverData).length === 0) {
            // No cloud cover data available, use the target date
            return dateToLocalDateString(targetDate);
        }

        const targetDateStr = dateToLocalDateString(targetDate);
        const availableDates = Object.keys(cloudCoverData).sort().reverse(); // Sort descending
        
        // Find the most recent date that is <= target date
        for (const dateStr of availableDates) {
            if (dateStr <= targetDateStr) {
                return dateStr;
            }
        }
        
        // If no date found (all dates are after target), use the target date
        return targetDateStr;
    }

    function changeSentinelDate(date) {
        // Create a new date object set to 23:59:59 of the selected date
        // This ensures that timezone conversions don't shift us to the previous day
        const adjustedDate = new Date(date);
        adjustedDate.setHours(23, 59, 59, 999);
        
        // if the adjusted date is in the future, use current date/time instead
        const now = new Date();
        const dateToUse = adjustedDate > now ? now : adjustedDate;
        
        // Find the effective date (most recent date with actual data)
        const effectiveDateStr = findEffectiveSentinelDate(dateToUse, sentinelCloudCoverData);
        
        // Check if the effective date is the same as what we're currently displaying
        if (currentEffectiveSentinelDate === effectiveDateStr) {
            console.log(`Sentinel image already showing data for ${effectiveDateStr}, no reload needed`);
            // Still update the selected date for UI purposes
            setSentinelDate(dateToUse);
            return;
        }
        
        console.log(`Updating Sentinel image to ${effectiveDateStr} (selected: ${dateToLocalDateString(dateToUse)})`);
        
        // set state
        setSentinelDate(dateToUse);
        setCurrentEffectiveSentinelDate(effectiveDateStr);

        // remove source, then add it back
        map.removeLayer('Sentinel 2-L2A');
        map.removeSource('Sentinel 2-L2A');

        map.addSource('Sentinel 2-L2A', {
            'type': 'raster',
            'tiles': [
                'https://atlas2.org/api/sentinel/{bbox-epsg-3857}.png?date=' + effectiveDateStr
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

    return expanded ? (
        <div id="sidebar">
            <div id="sidebar-header">
                <div class="sidebar-link">
                    <FontAwesomeIcon icon={faCloudSun} class="sidebar-link-button" onClick={e => setSelectedPart('weather')} />
                </div>
                <div class="sidebar-link">
                    <FontAwesomeIcon icon={faLayerGroup} class="sidebar-link-button" onClick={e => setSelectedPart('layers')} />
                </div>
                <div class="sidebar-link">
                    <FontAwesomeIcon icon={faMap} class="sidebar-link-button" onClick={e => setSelectedPart('customMaps')} />
                </div>
                <div class="sidebar-link">
                    <FontAwesomeIcon icon={faGear} class="sidebar-link-button" onClick={e => setSelectedPart('settings')} />
                </div>
                <div class="sidebar-link">
                    <FontAwesomeIcon icon={faBars} class="sidebar-link-button" onClick={e => setDisplaySidebar(false)} />
                </div>
            </div>

            <div id="sidebar-content" ref={sidebarContentRef}>
                {(() => {
                    switch (selectedPart) {
                        case 'weather':
                            return (
                                <div className="weather-container">
                                    <h1>WEATHER</h1>

                                    <div id="weather-controls">
                                        {changeDatetimeElement()}
                                        {setDatetimeToNowButton()}
                                        {changePollingPositionButton()}
                                    </div>

                                    {pollingPosition ? (
                                        <>
                                            {astronomyInfo ? renderAstronomyInfo() : ""}
                                        </>
                                    ) : ""}
                                </div>
                            )
                        case 'layers':
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
                                    <div id="base-layers-header-container">
                                        <h3 style={{ "marginTop": "15px" }}>Base Layers</h3>
                                        <div id="combine-layers-checkbox-header">
                                            <label htmlFor="combine-layers-toggle">Combine</label>
                                            <input 
                                                type="checkbox" 
                                                id="combine-layers-toggle"
                                                checked={combineLayersMode} 
                                                onChange={(e) => setCombineLayersMode(e.target.checked)}
                                            />
                                        </div>
                                    </div>
                                    {renderBaseLayers()}
                                    {/*only render sentinel datetime element if layer is visible*/}
                                    {baseLayers["Sentinel 2-L2A"].visible ? sentinelDatetimeElement() : ""}
                                    {/*only render tower height filter if towers layer is visible*/}
                                    {(layers["All Towers"].visible || layers["All Tower Extrusions"].visible) ? towerHeightFilterElement() : ""}
                                    {/*only render parcel search element if layer is visible*/}
                                    {layers["Parcel ownership"].visible ? parcelSearchElement() : ""}
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
                            return (
                                <div className="settings-container">
                                    <h1>SETTINGS</h1>
                                    <span>Show cell antennas (information may not be accurate): </span>
                                    <input type="checkbox" checked={settings["showUls"]} onChange={e => updateSettings("showUls", e.target.checked)} />
                                    <br /><br />
                                    <span>Isochrone minutes (how far to show the isochrone): </span>
                                    <input type="range" value={isoMinutesLive} min="5" max="240" onChange={e => setIsoMinutesLive(e.target.value)} />
                                    <span> {isoMinutesLive} minutes</span>
                                    <br /><br />
                                    <span>Isochrone commute type: </span>
                                    <select value={settings["isoProfile"]} onChange={(e) => updateSettings("isoProfile", e.target.value)}>
                                        <option value="driving">Driving</option>
                                        <option value="walking">Walking</option>
                                        <option value="transit">Transit</option>
                                        <option value="truck">Semitruck</option>
                                    </select>
                                    <br /><br />
                                    <span>Dark mode (requires reload!): </span>
                                    <input type="checkbox" checked={settings["darkMode"]} onChange={e => updateSettings("darkMode", e.target.checked)} />
                                </div>
                            )
                        default:
                            return ""
                    }
                })()}
            </div>
        </div>
    ) : <FontAwesomeIcon icon={faBars} class="sidebar-link-button sidebar-hidden" onClick={e => setDisplaySidebar(true)} />
};
export default Sidebar;