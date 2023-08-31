import React, { useState, useEffect, useRef } from "react";
import { putPoint, putMapInfo, postNewMap, putMapUser, postPoint, deletePoint, deleteMap, putMapUserPermissions } from "../services/message.service";
import '../styles/components/modal.css';
import { accessToken } from "mapbox-gl";

const Modal = ({ getAccessToken, modalOpen, modalType, map, point, setOpenModal }) => {
    const [pointName, setPointName] = useState("");
    const [pointDesc, setPointDesc] = useState("");
    const [pointLat, setPointLat] = useState("");
    const [pointLong, setPointLong] = useState("");
    const [pointCat, setPointCat] = useState("");
    const [pointIcon, setPointIcon] = useState("");
    const [pointColor, setPointColor] = useState("");
    const [mapName, setMapName] = useState("");
    const [mapDesc, setMapDesc] = useState("");
    const [mapLegend, setMapLegend] = useState("");
    const [mapCategories, setMapCategories] = useState([]);
    const [mapIcons, setMapIcons] = useState([]);
    const [mapColors, setMapColors] = useState([]);
    const [mapUsers, setMapUsers] = useState({});

    useEffect(() => {
        if (modalOpen == false) resetState();
    }, [modalOpen])

    const renderModalInfo = () => {
        console.log("modalinfo");
        console.log(map);
        console.log(point);
        switch (modalType) {
            case "editPoint":
                if(map && point) {
                    return renderPointEditModal();
                } else return "";
                break;
            case "editMap":
                if(map) {
                    return renderMapEditModal();
                } else return "";
                break;
            case "addMap":
                return renderMapAddModal();
                break;
            case "addPoint":
                if (map) {
                    return renderPointAddModal();
                } else return "";
                break;
            default:
                return "";
                break;
        }
    }

    const resetState = () => {
        console.log("resetting state");
        setPointName("");
        setPointDesc("");
        setPointLat("");
        setPointLong("");
        setPointCat("");
        setPointIcon("");
        setPointColor("");
        setMapName("");
        setMapDesc("");
        setMapLegend("");
        setMapCategories([]);
        setMapIcons({});
        setMapColors({});
        setMapUsers({});
    }

    const renderPointAddModal = () => {
        return (
            <div id="modal-form-content">
                <span id="modal-title">Adding point for map {map.name}</span><br />
                <label className="modal-form-content-label">Name: </label>
                <input type="text" value={pointName} onChange={e => setPointName(e.target.value)}></input><br/>
                <label className="modal-form-content-label">Description: </label>
                <textarea value={pointDesc} onChange={e => setPointDesc(e.target.value)}></textarea><br/>
                <label className="modal-form-content-label">Latitude: </label>
                <input type="text" value={pointLat} onChange={e => setPointLat(e.target.value)}></input><br/>
                <label className="modal-form-content-label">Longitude: </label>
                <input type="text" value={pointLong} onChange={e => setPointLong(e.target.value)}></input><br/>
                <label className="modal-form-content-label">Category: </label>
                <select value={pointCat} onChange={e => setPointCat(e.target.value)}>
                    {map.categories.map(cat => (<option value={cat}>{cat}</option>))}
                </select><br/>
                <label className="modal-form-content-label">Color: </label>
                <select value={pointColor} onChange={e => setPointColor(e.target.value)}>
                    {Object.entries(map.colors).map(([colorName, colorHex]) => (<option value={colorHex}>{colorName}</option>))}
                </select><br/>
                <label className="modal-form-content-label">Icon: </label>
                <select value={pointIcon} onChange={e => setPointIcon(e.target.value)}>
                    {Object.entries(map.icons).map(([iconName, iconUrl]) => (<option value={iconUrl}>{iconName}</option>))}
                </select><br/>
                <button id="modal-form-submit-button" onClick={() => submitPointEdit(true)}>Submit</button>
            </div>
        );
    }

    const renderPointEditModal = () => {
        return (
            <div id="modal-form-content">
                <span id="modal-title">Editing point {point.name} for map {map.name}</span><br />
                <label className="modal-form-content-label">Name: </label>
                <input type="text" value={pointName == "" ? point.name : pointName} onChange={e => setPointName(e.target.value)}></input><br/>
                <label className="modal-form-content-label">Description: </label>
                <textarea value={pointDesc == "" ? point.description : pointDesc} onChange={e => setPointDesc(e.target.value)}></textarea><br/>
                <label className="modal-form-content-label">Latitude: </label>
                <input type="text" value={pointLat == "" ? point.lat : pointLat} onChange={e => setPointLat(e.target.value)}></input><br/>
                <label className="modal-form-content-label">Longitude: </label>
                <input type="text" value={pointLong == "" ? point.lng : pointLong} onChange={e => setPointLong(e.target.value)}></input><br/>
                <label className="modal-form-content-label">Category: </label>
                <select value={pointCat == "" ? point.category : pointCat} onChange={e => setPointCat(e.target.value)}>
                    {map.categories.map(cat => (<option value={cat}>{cat}</option>))}
                </select><br/>
                <label className="modal-form-content-label">Color: </label>
                <select value={pointColor == "" ? point.color : pointColor} onChange={e => setPointColor(e.target.value)}>
                    {Object.entries(map.colors).map(([colorName, colorHex]) => (<option value={colorHex}>{colorName}</option>))}
                </select><br/>
                <label className="modal-form-content-label">Icon: </label>
                <select value={pointIcon == "" ? point.icon : pointIcon} onChange={e => setPointIcon(e.target.value)}>
                    {Object.entries(map.icons).map(([iconName, iconUrl]) => (<option value={iconUrl}>{iconName}</option>))}
                </select><br/>
                <div className="modal-form-control-buttons">
                    <button id="modal-form-submit-button" onClick={() => submitPointEdit(false)}>Submit</button>
                    <button id="modal-form-delete-button" onClick={() => deletePointFunc()}>Delete</button>
                </div>
            </div>
        );
    }

    const submitPointEdit = async (isNew = false) => {
        let token = await getAccessToken();
        let pointData = {};
        if (pointName != "") pointData.name = pointName;
        if (pointDesc != "") pointData.description = pointDesc;
        if (pointLat != "") pointData.lat = pointLat;
        if (pointLong != "") pointData.lng = pointLong;
        if (pointCat != "") pointData.category = pointCat;
        if (pointIcon != "") pointData.icon = pointIcon;
        if (pointColor != "") pointData.color = pointColor;

        if(isNew) {
            await postPoint(token, map.id, pointData).then((data) => {
                console.log("point added");
                console.log(data);
                // need some sort of point resetting code here
            }).catch((error) => {
                console.log("Error saving point: " + error);
                // need some sort of point resetting code here
            });
        } else {
            await putPoint(token, map.id, point.id, pointData).then((data) => {
                console.log("point saved");
                console.log(data);
                // need some sort of point resetting code here
            }).catch((error) => {
                console.log("Error saving point: " + error);
                // need some sort of point resetting code here
            });
        }
        setOpenModal(false);
    }

    const deletePointFunc = async () => {
        let token = await getAccessToken();
        await deletePoint(token, map.id, point.id).then((data) => {
            console.log("point deleted");
        }).catch((error) => {
            console.log("Error deleting point: " + error);
            // need some sort of point resetting code here
        });
        setOpenModal(false);
    }

    const renderMapEditModal = () => {
        if(mapCategories.length == 0 && map.categories.length > 0) setMapCategories(map.categories);
        if(Object.keys(mapIcons).length == 0 && Object.keys(map.icons).length > 0) setMapIcons(map.icons);
        if (Object.keys(mapColors).length == 0 && Object.keys(map.colors).length > 0) setMapColors(map.colors);
        if (Object.keys(mapUsers).length == 0 && Object.keys(map.users).length > 0) {
            let mappedUserPerms = map.users;
            Object.keys(map.users).forEach(user => {
                if(map.users[user].permissions)
                    mappedUserPerms[user] = map.users[user].permissions.join(",");
            })
            setMapUsers(mappedUserPerms);
        }
        return (
            <div id="modal-form-content">
                <span id="modal-title">Editing map {map.name}</span><br />
                <label className="modal-form-content-label">Name: </label>
                <input type="text" value={mapName == "" ? map.name : mapName} onChange={e => setMapName(e.target.value)}></input><br/>
                <label className="modal-form-content-label">Description: </label>
                <textarea value={mapDesc == "" ? map.description : mapDesc} onChange={e => setMapDesc(e.target.value)}></textarea><br/>
                <label className="modal-form-content-label">Legend: </label>
                <textarea value={mapLegend == "" ? map.legend : mapLegend} onChange={e => setMapLegend(e.target.value)}></textarea><br/>
                <div>
                    <label className="modal-form-content-label">Categories</label>
                    <button className="modal-form-list-button" onClick={() => addNewMapCategory()}>+</button><br />
                </div>
                {mapCategories.map((cat, i) => (
                    <div>
                        <input type="text" value={cat} onChange={e => updateMapCategories(e.target.value, i)} />
                        <button className="modal-form-list-button" onClick={() => removeMapCategory(i)}>-</button>
                        <br/>
                    </div>
                ))}
                <br/>
                <div>
                    <label className="modal-form-content-label">Icons</label>
                    <button className="modal-form-list-button" onClick={() => addNewMapIcon()}>+</button><br />
                </div>
                {Object.entries(mapIcons).map(([iconName, iconUrl]) => (
                    <div>
                        <input type="text" value={iconName} onChange={e => updateMapIconName(e.target.value, iconName)}/>
                        <input type="text" value={iconUrl} onChange={e => updateMapIconUrl(e.target.value, iconName)}/>
                        <button className="modal-form-list-button" onClick={() => removeMapIcon(iconName)}>-</button>
                        <br/>
                    </div>
                ))}
                <br/>
                <div>
                    <label className="modal-form-content-label">Colors</label>
                    <button className="modal-form-list-button" onClick={() => addNewMapColor()}>+</button><br />
                </div>
                {Object.entries(mapColors).map(([colorName, colorHex]) => (
                    <div>
                        <input type="text" value={colorName} onChange={e => updateMapColorName(e.target.value, colorName)}/>
                        <input type="text" value={colorHex} onChange={e => updateMapColorHex(e.target.value, colorName)}/>
                        <button className="modal-form-list-button" onClick={() => removeMapColor(colorName)}>-</button>
                        <br/>
                    </div>
                ))}
                <br/>
                {(map.my_permissions.includes("owner") || map.my_permissions.includes("admin")) ?
                    <>
                        <div>
                            <label className="modal-form-content-label">User Permissions</label>
                            <button className="modal-form-list-button" onClick={() => addNewUser()}>+</button><br />
                        </div>
                        {Object.entries(mapUsers).map(([userId, userPermissions]) => (
                            <div>
                                <input type="text" value={userId} onChange={e => updateMapUserId(e.target.value, userId)} />
                                <input type="text" value={userPermissions} onChange={e => updateMapUserPermissionString(e.target.value, userId)} />
                                <button className="modal-form-list-button" onClick={() => removeMapUser(userId)}>-</button>
                                <br />
                            </div>
                        ))}
                        <br />
                    </>
                    : ""
                }
                <div className="modal-form-control-buttons">
                    <button id="modal-form-submit-button" onClick={() => submitMapInfo(false)}>Submit</button>
                    <button id="modal-form-delete-button" onClick={() => deleteMapFunc()}>Delete</button>
                </div>
            </div>
        );
    }

    const deleteMapFunc = async () => {
        let token = await getAccessToken();
        await deleteMap(token, map.id).then((data) => {
            console.log("point deleted");
        }).catch((error) => {
            console.log("Error deleting point: " + error);
            // need some sort of point resetting code here
        });
        setOpenModal(false);
    }

    const renderMapAddModal = () => {
        return (
            <div id="modal-form-content">
                <span id="modal-title">Adding new map</span><br />
                <label className="modal-form-content-label">Name: </label>
                <input type="text" value={mapName} onChange={e => setMapName(e.target.value)}></input><br />
                <label className="modal-form-content-label">Description: </label>
                <textarea value={mapDesc} onChange={e => setMapDesc(e.target.value)} ></textarea><br />
                <label className="modal-form-content-label">Legend: </label>
                <textarea value={mapLegend} onChange={e => setMapLegend(e.target.value)}></textarea><br />
                <div>
                    <label className="modal-form-content-label">Categories</label>
                    <button className="modal-form-list-button" onClick={() => addNewMapCategory()}>+</button><br />
                </div>
                {mapCategories.map((cat, i) => (
                    <div>
                        <input type="text" placeholder="new-category-name" value={cat} onChange={e => updateMapCategories(e.target.value, i)} />
                        <button className="modal-form-list-button" onClick={() => removeMapCategory(i)}>-</button>
                        <br />
                    </div>
                ))}
                <br/>
                <div>
                    <label className="modal-form-content-label">Icons</label>
                    <button className="modal-form-list-button" onClick={() => addNewMapIcon()}>+</button><br />
                </div>
                {mapIcons.map((icon, i) => (
                    <div>
                        <input type="text" placeholder="new-icon-name" value={icon.name} onChange={e => updateMapIconName(e.target.value, i)} />
                        <input type="text" placeholder="new-icon-url" value={icon.url} onChange={e => updateMapIconUrl(e.target.value, i)} />
                        <button className="modal-form-list-button" onClick={() => removeMapIcon(i)}>-</button>
                        <br />
                    </div>
                ))}
                <br/>
                <div>
                    <label className="modal-form-content-label">Colors</label>
                    <button className="modal-form-list-button" onClick={() => addNewMapColor()}>+</button><br />
                </div>
                {mapColors.map((color, i) => (
                    <div>
                        <input type="text" placeholder="new-color-name" value={color.name} onChange={e => updateMapColorName(e.target.value, i)} />
                        <input type="text" placeholder="new-color-hex" value={color.color} onChange={e => updateMapColorHex(e.target.value, i)} />
                        <button className="modal-form-list-button" onClick={() => removeMapColor(i)}>-</button>
                        <br />
                    </div>
                ))}
                <br />
                <button id="modal-form-submit-button" onClick={() => submitMapInfo(true)}>Submit</button>
            </div>
        );
    }

    const updateMapCategories = (newValue, idx) => {
        mapCategories[idx] = newValue;
        setMapCategories([ ...mapCategories ]);
    }

    const addNewMapCategory = () => {
        mapCategories.push("");
        setMapCategories([...mapCategories]);
    }

    const removeMapCategory = (idx) => {
        mapCategories.splice(idx, 1);
        setMapCategories([...mapCategories]);
    }

    const updateMapIconName = (newValue, i) => {
        mapIcons[i].name = newValue;
        setMapIcons({ ...mapIcons });
    }

    const updateMapIconUrl = (newValue, i) => {
        mapIcons[i].icon = newValue;
        setMapIcons({ ...mapIcons });
    }

    const addNewMapIcon = () => {
        mapIcons.push({"name": "map-icon-name", "icon": ""});
        setMapIcons({...mapIcons});
    }

    const removeMapIcon = (i) => {
        let newIcons = mapIcons.filter(icon => icon != mapIcons[i])
        setMapIcons({ ...newIcons });
    }

    const updateMapColorName = (newValue, i) => {
        mapColors[i].name = newValue;
        setMapColors({ ...mapColors });
    }

    const updateMapColorHex = (newValue, i) => {
        mapColors[i].color = newValue;
        setMapColors({ ...mapColors });
    }

    const addNewMapColor = () => {
        mapColors.push({ "name": "map-color-name", "color": "" });
        setMapColors({...mapColors});
    }

    const removeMapColor = (i) => {
        let newColors = mapColors.filter(color => color != mapColors[i])
        setMapColors({ ...newColors });
    }

    const updateMapUserId = (newValue, name) => {
        let url = mapUsers[name];
        delete mapUsers[name];
        mapUsers[newValue] = url;
        setMapUsers({ ...mapUsers });
    }

    const updateMapUserPermissionString = (newValue, name) => {
        mapUsers[name] = newValue;
        setMapUsers({ ...mapUsers });
    }

    const addNewUser = () => {
        mapUsers["new-user-id"] = "";
        setMapUsers({ ...mapUsers });
    }

    const removeMapUser = (name) => {
        delete mapUsers[name];
        setMapUsers({ ...mapUsers });
    }


    const submitMapInfo = async (isNew = false) => {
        let token = await getAccessToken();
        let mapData = {};
        if (mapName != "") mapData.name = mapName;
        if (mapDesc != "") mapData.description = mapDesc;
        if (mapLegend != "") mapData.legend = mapLegend;
        if (mapCategories.length > 0) mapData.categories = mapCategories;
        if (Object.keys(mapIcons).length > 0) mapData.icons = mapIcons;
        if (Object.keys(mapColors).length > 0) mapData.colors = mapColors;
        console.log(mapData);

        if (!isNew && (map.my_permissions.includes("owner") || map.my_permissions.includes("admin"))) {

            console.log(mapUsers);

            Object.keys(mapUsers).forEach(async (userId) => {
                if(mapUsers[userId] != '') {
                    let permissionsObj = { "edit": false, "add": false, "admin": false};
                    mapUsers[userId].split(",").forEach(val => {
                        permissionsObj[val] = true;
                    });

                    await putMapUserPermissions(token, map.id, userId, permissionsObj).then((data) => {
                        if (data) {
                            console.log("user permissions updated for user: " + userId);
                        }
                        // need some sort of point resetting code here
                    }).catch((error) => {
                        console.log("Error updating user permissions: " + error);
                        // need some sort of point resetting code here
                    });
                }
            })
        }

        if(isNew) {
            await postNewMap(token, mapData).then((data) => {
                if(data) {
                    console.log("map added");
                    console.log(data.data.map);
                }
                // need some sort of point resetting code here
            }).catch((error) => {
                console.log("Error saving point: " + error);
                // need some sort of point resetting code here
            });
        } else {
            await putMapInfo(token, map.id, mapData).then((data) => {
                console.log("map saved");
                console.log(data);
                // need some sort of point resetting code here
            }).catch((error) => {
                console.log("Error saving point: " + error);
                // need some sort of point resetting code here
            });
        }
        setOpenModal(false);
    }

    return modalOpen ? (
        <div id="modal">
            <div id="modal-background"></div>
            <div id="modal-content">
                {renderModalInfo()}
                <button id="modal-close-button" onClick={() => setOpenModal(false)}>Close Window</button>
            </div>
        </div>
    ) : "";
};
export default Modal;