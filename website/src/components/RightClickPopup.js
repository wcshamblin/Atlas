import React from 'react';
import ReactDOM from 'react-dom/client';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {
    faArrowLeft, faExternalLinkAlt,
    faFloppyDisk,
    faHome,
    faMapMarkerAlt,
    faRoute
} from '@fortawesome/free-solid-svg-icons'

export const renderCoordinatesSegment = (coordinates) => {
    console.log("rendering coordinates segment with coordinates: ", coordinates);
    let lat = coordinates[1].toFixed(6);
    let lng = coordinates[0].toFixed(6);

    return <button id="coordinatesbutton" onClick={() => {
        navigator.clipboard.writeText(lat + ", " + lng);
    }}><text id="popupcoords">{lat}, {lng}</text></button>
}

export const renderRightClickPopup = (
    state,
    rightClickPopupPosition,
    setRightClickPopupState,
    setHomePosition,
    setShowRightClickPopup,
    homeIsSet,
    setRoutingLineEnd,
    customMaps,
    newPointMap,
    setNewPointMap,
    saveNewPoint,
    routingDuration,
    routingDistance,
    setRoutingLine,
    rightClickPopup
) => {
    const placeholder = document.createElement('div');

    if (state === "default") {
        ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
            <div id="rightclickpopupbuttons">
                <button id="rightclickpopupbutton" onClick={() => {
                    setRightClickPopupState("external");
                }}><FontAwesomeIcon icon={faExternalLinkAlt} />
                </button>
                <button id="rightclickpopupbutton" onClick={() => {
                    console.log("setting home position to ", rightClickPopupPosition);
                    setHomePosition(rightClickPopupPosition[1], rightClickPopupPosition[0]);
                    setShowRightClickPopup(false);
                }}><FontAwesomeIcon icon={faHome} />
                </button>
                {homeIsSet && <button id="rightclickpopupbutton" onClick={() => {
                    setRoutingLineEnd(rightClickPopupPosition);
                    setRightClickPopupState("routing");
                }}><FontAwesomeIcon icon={faRoute} />
                </button>
                }
                {customMaps && customMaps.maps.length > 0 && <button id="rightclickpopupbutton" onClick={() => {
                    setRightClickPopupState("new-point");
                }}><FontAwesomeIcon icon={faMapMarkerAlt} />
                </button>}
            </div>
            {renderCoordinatesSegment([rightClickPopupPosition][0])}
        </div>);


    } if (state === "new-point") {
        ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
            <select id='newpointmapselect' 
                onChange={async (e) => {
                    console.log("changing map to ", e.target.value);
                    setRightClickPopupState("new-point");
                    setNewPointMap(e.target.value);
                }}
                defaultValue={newPointMap}
            >
                <option value={""}>Select a map</option>
                {customMaps.maps.map((map) => {
                    return <option value={map.id}>{map.name}</option>
                })}
            </select><br />

            {newPointMap !== "" && customMaps.maps.map((map) => {
                if (map.id === newPointMap) {
                    return <div>
                        <input type="text" id='custompopupname' placeholder="Name" /><br />
                        <textarea id='custompopupdescription' placeholder="Description" /><br />

                        <div id='custompopupselects'>
                            <select id='custompopupcategory'>
                                <option value={""}>Select a category</option>
                                {map.categories.map(category => {
                                    return <option value={category.id}>{category.name}</option>
                                })
                                }
                            </select><br />

                            <select id='custompopupcolor'>
                                <option value={""}>Select a color</option>
                                {map.colors.map(color => {
                                    return <option value={color.id}>{color.name}</option>
                                })
                                }
                            </select><br />

                            <select id='custompopupicon'>
                                <option value={""}>Select an icon</option>
                                {map.icons.map(icon => {
                                    return <option value={icon.id}>{icon.name}</option>
                                })
                                }
                            </select><br />
                        </div>
                    </div>
                }
            })
            }
            <div id="rightclickpopupbuttons">
                <button id="rightclickpopupbutton" onClick={() => {
                    saveNewPoint(document.getElementById("newpointmapselect").value, {
                        name: document.getElementById("custompopupname").value,
                        description: document.getElementById("custompopupdescription").value,
                        category: document.getElementById("custompopupcategory").value,
                        color: document.getElementById("custompopupcolor").value,
                        icon: document.getElementById("custompopupicon").value,
                        lat: rightClickPopupPosition[1],
                        lng: rightClickPopupPosition[0]
                    });

                }}><FontAwesomeIcon icon={faFloppyDisk} />
                </button>
                <button id="rightclickpopupbutton" onClick={() => {
                    setRightClickPopupState("default");
                }}><FontAwesomeIcon icon={faArrowLeft} />
                </button>

            </div>
            {renderCoordinatesSegment([rightClickPopupPosition][0])}
        </div>);

    } if (state === "routing") {
        ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
            <text id="rightclickpopup-routing-state">Calculating...</text>
            <div id="rightclickpopupbuttons">
                <button id="rightclickpopupbutton" onClick={() => {
                    setRightClickPopupState("default");
                }}><FontAwesomeIcon icon={faArrowLeft} />
                </button>
            </div>
            {renderCoordinatesSegment([rightClickPopupPosition][0])}
        </div>);
    } if (state === "routing-complete") {
        ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
            <text id="rightclickpopup-routing-state">Routing Info:</text><br />
            <text id="routing-information">{Math.floor(routingDuration / 60)} hours, {routingDuration % 60} minutes<br />
                {routingDistance} miles</text><br />
            <div id="rightclickpopupbuttons">
                <button id="rightclickpopupbutton" onClick={() => {
                    setRightClickPopupState("default");
                    setRoutingLine(null);
                }}><FontAwesomeIcon icon={faArrowLeft} />
                </button>
            </div>
                {renderCoordinatesSegment([rightClickPopupPosition][0])}
        </div>
        );
    } if (state === "external") {
        ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
            <text id="rightclickpopup-routing-state">External Maps</text><br />
            <div id="rightclickpopupexternallinks">
            {/* links */}
                <a href={"http://maps.google.com/maps?t=k&q=loc:" + rightClickPopupPosition[1] + "+" + rightClickPopupPosition[0]} target="_blank" rel="noreferrer">
                    <FontAwesomeIcon icon={faExternalLinkAlt} /> Google Maps
                </a><br/>
                <a href={"https://www.bing.com/maps?cp=" + rightClickPopupPosition[1] + "~" + rightClickPopupPosition[0] + "&lvl=17.5&style=h"} target="_blank" rel="noreferrer">
                    <FontAwesomeIcon icon={faExternalLinkAlt} /> Bing Maps
                </a><br />
                <a href={"https://livingatlas.arcgis.com/wayback/#mapCenter=" + rightClickPopupPosition[0] + "%2C" + rightClickPopupPosition[1] + "%2C17"} target="_blank" rel="noreferrer">
                    <FontAwesomeIcon icon={faExternalLinkAlt} /> ArcGIS Wayback
                </a><br />
                <a href={"https://earth.google.com/web/@" + rightClickPopupPosition[1] + "," + rightClickPopupPosition[0] + ",356.91683106a,21152.84581396d,1y,0h,0t,0r/"} target="_blank" rel="noreferrer">
                <FontAwesomeIcon icon={faExternalLinkAlt} /> Google Earth
                </a>
            </div>
                <div id="rightclickpopupbuttons">
                    <button id="rightclickpopupbutton" onClick={() => {
                        setRightClickPopupState("default");
                        setRoutingLine(null);
                    }}><FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                </div>
                {renderCoordinatesSegment([rightClickPopupPosition][0])}
        </div>
        );
    }

    rightClickPopup.setDOMContent(placeholder);
}

