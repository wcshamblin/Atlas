import React, { useState, useEffect, useRef } from "react";
import { putPoint, putMapInfo, postNewMap, putMapUser, postPoint, deletePoint, deleteMap, putMapUserPermissions, editMapInfo } from "../services/message.service";
import '../styles/components/modal.css';
import { accessToken } from "mapbox-gl";

const Modal = ({ getAccessToken, modalOpen, modalType, map, point, setOpenModal, getMaps }) => {
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
    const [mapCategories, setMapCategories] = useState({});
    const [mapIcons, setMapIcons] = useState({});
    const [mapColors, setMapColors] = useState({});
    const [mapUsers, setMapUsers] = useState({});

    useEffect(() => {
        if (modalOpen == false) {
            resetState();
        } else {
            let newPointName = "";
            let newPointDesc = "";
            let newPointLat = "";
            let newPointLong = "";
            let newPointCat = "";
            let newPointIcon = "";
            let newPointColor = "";
            let newMapName = "";
            let newMapDesc = "";
            let newMapLegend = "";
            let newMapCats = {};
            let newMapIcons = {};
            let newMapColors = {};
            let newMapUsers = {};
            if(map) {
                newMapName = map.name;
                newMapDesc = map.description;
                newMapLegend = map.legend;
                newMapCats = JSON.parse(JSON.stringify(map.categories));
                newMapIcons = JSON.parse(JSON.stringify(map.icons));
                newMapColors = JSON.parse(JSON.stringify(map.colors));
                Object.keys(map.users).forEach(user => {
                    if (map.users[user].permissions)
                        newMapUsers[user] = map.users[user].permissions.join(",");
                });
            }
            if (point) {
                newPointName = point.name;
                newPointDesc = point.description;
                newPointLat = point.lat;
                newPointLong = point.lng;
                newPointCat = point.category;
                newPointIcon = point.icon;
                newPointColor = point.color;
            }
            setPointName(newPointName);
            setPointDesc(newPointDesc);
            setPointLat(newPointLat);
            setPointLong(newPointLong);
            setPointCat(newPointCat);
            setPointIcon(newPointIcon);
            setPointColor(newPointColor);
            setMapName(newMapName);
            setMapDesc(newMapDesc);
            setMapLegend(newMapLegend);
            setMapCategories(newMapCats);
            setMapIcons(newMapIcons);
            setMapColors(newMapColors);
            setMapUsers(newMapUsers);
        }
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
        setMapCategories({});
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
                    {Object.entries(map.categories).sort(([id, val]) => id).map(([catId, catName]) => (<option value={catId}>{catName}</option>))}
                </select><br/>
                <label className="modal-form-content-label">Color: </label>
                <select value={pointColor} onChange={e => setPointColor(e.target.value)}>
                    {Object.entries(map.colors).sort(([id, val]) => id).map(([colorId, color]) => (<option value={colorId}>{color.name}</option>))}
                </select><br/>
                <label className="modal-form-content-label">Icon: </label>
                <select value={pointIcon} onChange={e => setPointIcon(e.target.value)}>
                    {Object.entries(map.icons).sort(([id, val]) => id).map(([iconId, icon]) => (<option value={iconId}>{icon.name}</option>))}
                </select><br/>
                <button id="modal-form-submit-button" onClick={() => submitPoint(true)}>Submit</button>
            </div>
        );
    }

    const renderPointEditModal = () => {
        return (
            <div id="modal-form-content">
                <span id="modal-title">Editing point {point.name} for map {map.name}</span><br />
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
                    {Object.entries(map.categories).sort(([id, val]) => id).map(([catId, catName]) => (<option value={catId}>{catName}</option>))}
                </select><br/>
                <label className="modal-form-content-label">Color: </label>
                <select value={pointColor} onChange={e => setPointColor(e.target.value)}>
                    {Object.entries(map.colors).sort(([id, val]) => id).map(([colorId, color]) => (<option value={colorId}>{color.name}</option>))}
                </select><br/>
                <label className="modal-form-content-label">Icon: </label>
                <select value={pointIcon} onChange={e => setPointIcon(e.target.value)}>
                    {Object.entries(map.icons).sort(([id, val]) => id).map(([iconId, icon]) => (<option value={iconId}>{icon.name}</option>))}
                </select><br/>
                <div className="modal-form-control-buttons">
                    <button id="modal-form-submit-button" onClick={() => submitPoint(false)}>Submit</button>
                    <button id="modal-form-delete-button" onClick={() => delPoint()}>Delete</button>
                </div>
            </div>
        );
    }

    const submitPoint = async (isNew = false) => {
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
                getMaps();
            }).catch((error) => {
                console.log("Error saving point: " + error);
                getMaps();
            });
        } else {
            await putPoint(token, map.id, point.id, pointData).then((data) => {
                console.log("point saved");
                console.log(data);
                getMaps();
            }).catch((error) => {
                console.log("Error saving point: " + error);
                getMaps();
            });
        }
        setOpenModal(false);
    }

    const delPoint = async () => {
        let token = await getAccessToken();
        await deletePoint(token, map.id, point.id).then((data) => {
            console.log("point deleted");
            getMaps();
        }).catch((error) => {
            console.log("Error deleting point: " + error);
            getMaps();
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
                    <button className="modal-form-list-button" onClick={() => {
                        mapCategories[`temp-id-${Math.random() * 10000}`] = "";
                        setMapCategories({ ...mapCategories }); 
                    }}>+</button><br />
                </div>
                {Object.entries(mapCategories).sort(([id, val]) => id).map(([catId, catName]) => (
                    <div>
                        <input type="text" placeholder="new-category-name" value={catName} onChange={e => {
                            mapCategories[catId] = e.target.value;
                            setMapCategories({ ...mapCategories }); 
                        }}/>
                        <button className="modal-form-list-button" onClick={() => {
                            delete mapCategories[catId];
                            setMapCategories({ ...mapCategories }); 
                        }}>-</button>
                        <br />
                    </div>
                ))}
                <br/>
                <div>
                    <label className="modal-form-content-label">Colors</label>
                    <button className="modal-form-list-button" onClick={() => {
                        mapColors[`temp-id-${Math.random() * 10000}`] = { "name": "", "color": "" };
                        setMapColors({ ...mapColors });
                    }}>+</button><br />
                </div>
                {Object.entries(mapColors).sort(([id, val]) => id).map(([colorId, color]) => (
                    <div>
                        <input type="text" placeholder="new-color-name" value={color.name} onChange={e => { 
                            mapColors[colorId].name = e.target.value;
                            setMapColors({ ...mapColors }); 
                        }}/>
                        <input type="text" placeholder="new-color-hex" value={color.color} onChange={e => {
                            mapColors[colorId].color = e.target.value;
                            setMapColors({ ...mapColors });
                        }}/>
                        <button className="modal-form-list-button" onClick={() => {
                            delete mapColors[colorId];
                            setMapColors({ ...mapColors });
                        }}>-</button>
                        <br />
                    </div>
                ))}
                <br />
                <div>
                    <label className="modal-form-content-label">Icons</label>
                    <button className="modal-form-list-button" onClick={() => {
                        mapIcons[`temp-id-${Math.random() * 10000}`] = { "name": "", "icon": "" };
                        setMapIcons({ ...mapIcons });
                    }}>+</button><br />
                </div>
                {Object.entries(mapIcons).sort(([id, val]) => id).map(([iconId, icon]) => (
                    <div>
                        <input type="text" placeholder="new-icon-name" value={icon.name} onChange={e => {
                            mapIcons[iconId].name = e.target.value;
                            setMapIcons({ ...mapIcons });
                        }}/>
                        <input type="text" placeholder="new-icon-url" value={icon.url} onChange={e => {
                            mapIcons[iconId].icon = e.target.value;
                            setMapIcons({ ...mapIcons });
                        }}/>
                        <button className="modal-form-list-button" onClick={() => {
                            delete mapIcons[iconId];
                            setMapIcons({ ...mapIcons });
                        }}>-</button>
                        <br />
                    </div>
                ))}
                <br />
                <button id="modal-form-submit-button" onClick={() => submitMap(true)}>Submit</button>
            </div>
        );
    }

    const renderMapEditModal = () => {
        return (
            <div id="modal-form-content">
                <span id="modal-title">Editing map {map.name}</span><br />
                <label className="modal-form-content-label">Name: </label>
                <input type="text" value={mapName == "" ? map.name : mapName} onChange={e => setMapName(e.target.value)}></input><br />
                <label className="modal-form-content-label">Description: </label>
                <textarea value={mapDesc == "" ? map.description : mapDesc} onChange={e => setMapDesc(e.target.value)}></textarea><br />
                <label className="modal-form-content-label">Legend: </label>
                <textarea value={mapLegend == "" ? map.legend : mapLegend} onChange={e => setMapLegend(e.target.value)}></textarea><br />
                <div>
                    <label className="modal-form-content-label">Categories</label>
                    <button className="modal-form-list-button" onClick={() => {
                        mapCategories[`temp-id-${Math.random() * 10000}`] = "";
                        setMapCategories({ ...mapCategories });
                    }}>+</button><br />
                </div>
                {Object.entries(mapCategories).sort(([id, val]) => id).map(([catId, catName]) => (
                    <div>
                        <input type="text" placeholder="new-category-name" value={catName} onChange={e => {
                            mapCategories[catId] = e.target.value;
                            setMapCategories({ ...mapCategories });
                        }} />
                        <button className="modal-form-list-button" onClick={() => {
                            delete mapCategories[catId];
                            setMapCategories({ ...mapCategories });
                        }}>-</button>
                        <br />
                    </div>
                ))}
                <br />
                <div>
                    <label className="modal-form-content-label">Colors</label>
                    <button className="modal-form-list-button" onClick={() => {
                        mapColors[`temp-id-${Math.random() * 10000}`] = { "name": "", "color": "" };
                        setMapColors({ ...mapColors });
                    }}>+</button><br />
                </div>
                {Object.entries(mapColors).sort(([id, val]) => id).map(([colorId, color]) => (
                    <div>
                        <input type="text" placeholder="new-color-name" value={color.name} onChange={e => {
                            mapColors[colorId].name = e.target.value;
                            setMapColors({ ...mapColors });
                        }} />
                        <input type="text" placeholder="new-color-hex" value={color.color} onChange={e => {
                            mapColors[colorId].color = e.target.value;
                            setMapColors({ ...mapColors });
                        }} />
                        <button className="modal-form-list-button" onClick={() => {
                            delete mapColors[colorId];
                            setMapColors({ ...mapColors });
                        }}>-</button>
                        <br />
                    </div>
                ))}
                <br />
                <div>
                    <label className="modal-form-content-label">Icons</label>
                    <button className="modal-form-list-button" onClick={() => {
                        mapIcons[`temp-id-${Math.random() * 10000}`] = { "name": "", "icon": "" };
                        setMapIcons({ ...mapIcons });
                    }}>+</button><br />
                </div>
                {Object.entries(mapIcons).sort(([id, val]) => id).map(([iconId, icon]) => (
                    <div>
                        <input type="text" placeholder="new-icon-name" value={icon.name} onChange={e => {
                            mapIcons[iconId].name = e.target.value;
                            setMapIcons({ ...mapIcons });
                        }} />
                        <input type="text" placeholder="new-icon-url" value={icon.icon} onChange={e => {
                            mapIcons[iconId].icon = e.target.value;
                            setMapIcons({ ...mapIcons });
                        }} />
                        <button className="modal-form-list-button" onClick={() => {
                            delete mapIcons[iconId];
                            setMapIcons({ ...mapIcons });
                        }}>-</button>
                        <br />
                    </div>
                ))}
                <br />
                {/*(map.my_permissions.includes("owner") || map.my_permissions.includes("admin")) ?
                    <>
                        <div>
                            <label className="modal-form-content-label">User Permissions</label>
                            <button className="modal-form-list-button" onClick={() => {
                                mapIcons[`temp-id-${Math.random() * 10000}`] = { "name": "", "icon": "" };
                                setMapIcons({ ...mapIcons });
                            }}>+</button><br />
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
                */}
                <div className="modal-form-control-buttons">
                    <button id="modal-form-submit-button" onClick={() => submitMap(false)}>Submit</button>
                    <button id="modal-form-delete-button" onClick={() => delMap()}>Delete</button>
                </div>
            </div>
        );
    }

    const submitMap = async (isNew = false) => {
        let token = await getAccessToken();

        if(isNew) {
            let mapData = {};
            mapData.categories = Object.values(mapCategories);
            mapData.icons = Object.values(mapIcons);
            mapData.colors = Object.values(mapColors);
            mapData.name = mapName;
            mapData.description = mapDesc;
            mapData.legend = mapLegend;
            await postNewMap(token, mapData).then((data) => {
                if (data) {
                    console.log("map added");
                    console.log(data.data.map);
                }
                getMaps();
            }).catch((error) => {
                console.log("Error saving point: " + error);
                getMaps();
            });
        } else {
            if (mapName != map.name) {
                await editMapInfo(token, "PUT", map.id, "name", {"name": mapName}).then((data) => {
                    if (data) {
                        console.log("edited name");
                        console.log(data);
                    }
                }).catch((error) => {
                    console.log("Error editing name: " + error);
                });
            }
            if (mapDesc != map.description) {
                await editMapInfo(token, "PUT", map.id, "description", {"description": mapDesc}).then((data) => {
                    if (data) {
                        console.log("edited desc");
                        console.log(data);
                    }
                }).catch((error) => {
                    console.log("Error editing desc: " + error);
                });
            }
            if (mapLegend != map.legend) {
                await editMapInfo(token, "PUT", map.id, "legend", {"legend": mapLegend}).then((data) => {
                    if (data) {
                        console.log("edited legend");
                        console.log(data);
                    }
                }).catch((error) => {
                    console.log("Error editing legend: " + error);
                });
            }
            let categories = Object.entries(mapCategories);
            if (categories.length > 0) {
                let newCategories = categories.filter(([key]) => key.startsWith("temp-id")).map(([key, val]) => val);
                if (newCategories.length > 0)
                    await editMapInfo(token, "POST", map.id, "categories", newCategories).then((data) => {
                        if (data) {
                            console.log("added categories");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error adding categories: " + error);
                    });
                console.log(categories);
                console.log(map.categories);
                let changedCategories = categories.filter(([key, val]) => !key.startsWith("temp-id") && map.categories[key] != val).map(([key, val]) => { return { "id": key, "name": val } });
                if (changedCategories.length > 0)
                    await editMapInfo(token, "PUT", map.id, "categories", {categories: changedCategories}).then((data) => {
                        if (data) {
                            console.log("editing categories");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error editing categories: " + error);
                    });
                let deletedCategories = Object.keys(map.categories).filter(key => !mapCategories[key]);
                if (deletedCategories.length > 0)
                    await editMapInfo(token, "DELETE", map.id, "categories", deletedCategories).then((data) => {
                        if (data) {
                            console.log("deleted categories");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error deleting categories: " + error);
                    });
            }
            let colors = Object.entries(mapColors);
            if (colors.length > 0) {
                let newColors = colors.filter(([key]) => key.startsWith("temp-id")).map(([key, val]) => val);
                if (newColors.length > 0)
                    await editMapInfo(token, "POST", map.id, "colors", newColors).then((data) => {
                        if (data) {
                            console.log("added colors");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error adding colors: " + error);
                    });
                let changedColors = colors.filter(([key, val]) => !key.startsWith("temp-id") && map.colors[key] != val).map(([key, val]) => { return { "id": key, "color": val.color, "name": val.name } }); 
                if (changedColors.length > 0)
                    await editMapInfo(token, "PUT", map.id, "colors", {colors: changedColors}).then((data) => {
                        if (data) {
                            console.log("editing colors");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error editing colors: " + error);
                    });
                let deletedColors = Object.keys(map.colors).filter(key => !mapColors[key]);
                if (deletedColors.length > 0)
                    await editMapInfo(token, "DELETE", map.id, "colors", deletedColors).then((data) => {
                        if (data) {
                            console.log("deleted colors");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error deleting colors: " + error);
                    });
            }
            let icons = Object.entries(mapIcons);
            if (icons.length > 0) {
                let newIcons = icons.filter(([key]) => key.startsWith("temp-id")).map(([key, val]) => val);
                if (newIcons.length > 0)
                    await editMapInfo(token, "POST", map.id, "icons", newIcons).then((data) => {
                        if (data) {
                            console.log("added icons");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error adding icons: " + error);
                    });
            console.log(map.icons);
            console.log(icons);
            let changedIcons = icons.filter(([key, val]) => !key.startsWith("temp-id") && map.icons[key] != val).map(([key, val]) => { return { "id": key, "icon": val.icon, "name": val.name } });
            if (changedIcons.length > 0)
                await editMapInfo(token, "PUT", map.id, "icons", {icons: changedIcons}).then((data) => {
                        if (data) {
                            console.log("editing icons");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error editing icons: " + error);
                    });
            let deletedIcons = Object.keys(map.icons).filter(key => !mapIcons[key]);
            if (deletedIcons.length > 0)
                await editMapInfo(token, "DELETE", map.id, "icons", deletedIcons).then((data) => {
                        if (data) {
                            console.log("deleted icons");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error deleting icons: " + error);
                    });
            }
            if(false && map.my_permissions.includes("owner") || map.my_permissions.includes("admin")) {
                Object.keys(mapUsers).forEach(async (userId) => {
                    if (mapUsers[userId] != '') {
                        let permissionsObj = { "edit": false, "admin": false, "view": false };
                        mapUsers[userId].split(",").forEach(val => {
                            permissionsObj[val] = true;
                        });
                        await putMapUserPermissions(token, map.id, userId, permissionsObj).then((data) => {
                            if (data) {
                                console.log("user permissions updated for user: " + userId);
                            }
                        }).catch((error) => {
                            console.log("Error updating user permissions: " + error);
                        });
                    }
                })
            }
        }
        getMaps();
        setOpenModal(false);
    }

    const delMap = async () => {
        let token = await getAccessToken();
        await deleteMap(token, map.id).then((data) => {
            console.log("map deleted");
            getMaps();
        }).catch((error) => {
            console.log("Error deleting map: " + error);
            getMaps();
        });
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