import React from 'react';
import ReactDOM from 'react-dom/client';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faFloppyDisk,
    faInfo,
    faPenToSquare,
    faRoute,
    faTrash
} from '@fortawesome/free-solid-svg-icons'
import { renderCoordinatesSegment } from './RightClickPopup';

export const renderCustomMapPopup = (
    state,
    properties,
    coordinates,
    customMapPopup,
    setCustomMapPopupState,
    homeIsSet,
    setRoutingLineEnd,
    savePoint,
    setShowCustomMapPopup,
    removePoint,
    routingDuration,
    routingDistance,
    setRoutingLine
) => {
    console.log("rendering custom map popup with state ", state, " and properties ", properties, " and coordinates ", coordinates);
    const placeholder = document.createElement('div');

    if (state === "default") {
        ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
            <text id='custompopupname'>{properties.name}</text><br />
            <text id='custompopupdescription'>{properties.description}</text><br />
            <div id='custompopupdetail'>
                Category: {properties.categories.filter(cat => cat.id == properties.category)[0]?.name}<br />
                Icon: {properties.icons.filter(icon => icon.id == properties.icon)[0]?.name}<br />
                Map: {properties.mapName}</div>

            <div id="rightclickpopupbuttons">
                <button id="rightclickpopupbutton" onClick={() => {
                    setCustomMapPopupState("info");
                }}><FontAwesomeIcon icon={faInfo} />
                </button>
                {properties.editable && <button id="rightclickpopupbutton" onClick={() => {
                    setCustomMapPopupState("edit");
                }}><FontAwesomeIcon icon={faPenToSquare} />
                </button>}
                {homeIsSet && <button id="rightclickpopupbutton" onClick={() => {
                    setRoutingLineEnd(coordinates);
                    setCustomMapPopupState("routing");
                }}><FontAwesomeIcon icon={faRoute} />
                </button>
                }
            </div>
            {renderCoordinatesSegment(coordinates)}
        </div>);
    }

    if (state === "edit") {
        ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
            <input type="text" id='custompopupname' defaultValue={properties.name} /><br />
            <textarea id='custompopupdescription' defaultValue={properties.description}></textarea><br />

            <div id='custompopupselects'>

                <select id='custompopupcategory' defaultValue={properties.categories.filter(cat => cat.id == properties.category)[0]?.id}>
                    {properties.categories.map(category => {
                        return <option value={category.id}>{category.name}</option>
                    })}
                </select><br />

                <select id='custompopupcolor' defaultValue={properties.colors.filter(color => color.hex == properties.color)[0]?.id}>
                    {properties.colors.map(color => {
                        return <option value={color.id}>{color.name}</option>
                    })
                    }
                </select><br />

                <select id='custompopupicon' defaultValue={properties.icons.filter(icon => icon.id == properties.icon)[0]?.id}>
                    {properties.icons.map(icon => {
                        return <option value={icon.id}>{icon.name}</option>
                    })
                    }
                </select><br />
            </div>

            <div id="rightclickpopupbuttons">

                <button id="rightclickpopupbutton" onClick={() => {
                    savePoint(properties.mapId, properties.id, {
                        name: document.getElementById("custompopupname").value,
                        description: document.getElementById("custompopupdescription").value,
                        category: document.getElementById("custompopupcategory").value,
                        color: document.getElementById("custompopupcolor").value,
                        icon: document.getElementById("custompopupicon").value
                    });
                    setShowCustomMapPopup(false);
                }}><FontAwesomeIcon icon={faFloppyDisk} />
                </button>
                
                <button id="rightclickpopupbutton" onClick={() => {
                    setShowCustomMapPopup(false);
                    removePoint(properties.mapId, properties.id);
                }}><FontAwesomeIcon icon={faTrash} />
                </button>

                <button id="rightclickpopupbutton" onClick={() => {
                    setCustomMapPopupState("default");
                }}><FontAwesomeIcon icon={faArrowLeft} />
                </button>
            </div>
            {renderCoordinatesSegment(coordinates)}
        </div>);
    }

    if (state === "info") {
        ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
            <table id="custompopupinfotable">
                <tr>
                    <td>Creator</td>
                    <td>{properties.creator}</td>
                </tr>
                <tr>
                    <td>Creation Date</td>
                    <td>{properties.creation_date}</td>
                </tr>
                <tr>
                    <td>Editor</td>
                    <td>{properties.editor}</td>
                </tr>
                <tr>
                    <td>Edit Date</td>
                    <td>{properties.edit_date}</td>
                </tr>
                <tr>
                    <td>ID</td>
                    <td>{properties.id}</td>
                </tr>
                <tr>

                    <td>Map</td>
                    <td>{properties.mapName}</td>
                </tr>
                <tr>
                    <td>Map ID</td>
                    <td>{properties.mapId}</td>
                </tr>
            </table>

            <div id="rightclickpopupbuttons">
                <button id="rightclickpopupbutton" onClick={() => {
                    setCustomMapPopupState("default");
                }}><FontAwesomeIcon icon={faArrowLeft} />
                </button>
            </div>
            {renderCoordinatesSegment(coordinates)}
        </div>);
    }

    if (state === "routing") {
        ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
            <text id="rightclickpopup-routing-state">Calculating...</text>
            <div id="rightclickpopupbuttons">
                <button id="rightclickpopupbutton" onClick={() => {
                    setCustomMapPopupState("default");
                }}><FontAwesomeIcon icon={faArrowLeft} />
                </button>
            </div>
            {renderCoordinatesSegment(coordinates)}
        </div>);
    }

    if (state === "routing-complete") {
        ReactDOM.createRoot(placeholder).render(<div id="rightclickpopup">
            <text id="rightclickpopup-routing-state">Routing Info:</text><br />
            <text id="routing-information">{Math.floor(routingDuration / 60)} hours, {routingDuration % 60} minutes<br />
                {routingDistance} miles</text><br />
            <div id="rightclickpopupbuttons">
                <button id="rightclickpopupbutton" onClick={() => {
                    setCustomMapPopupState("default");
                    setRoutingLine(null);
                }}><FontAwesomeIcon icon={faArrowLeft} />
                </button>
            </div>
            {renderCoordinatesSegment(coordinates)}
        </div>);
    }

    customMapPopup.setDOMContent(placeholder);
}

