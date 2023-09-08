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
    const [mapCategories, setMapCategories] = useState([]);
    const [mapIcons, setMapIcons] = useState([]);
    const [mapColors, setMapColors] = useState([]);
    const [mapUsers, setMapUsers] = useState([]);

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
            let newMapCats = [];
            let newMapIcons = [];
            let newMapColors = [];
            let newMapUsers = [];
            if(map) {
                newMapName = map.name;
                newMapDesc = map.description;
                newMapLegend = map.legend;
                newMapCats = JSON.parse(JSON.stringify(map.categories));
                newMapIcons = JSON.parse(JSON.stringify(map.icons));
                newMapColors = JSON.parse(JSON.stringify(map.colors));
                map.users.forEach(user => {
                    if (user.permissions)
                        newMapUsers.push({ usersub: user.usersub, permissions: Object.keys(user.permissions).join(",") });
                });

                newPointCat = newMapCats[0].id;
                newPointIcon = newMapIcons[0].id;
                newPointColor = newMapColors[0].id;
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
        setMapIcons([]);
        setMapColors([]);
        setMapUsers([]);
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
                    {map.categories.sort(cat => cat.id).map(cat => (<option value={cat.id}>{cat.name}</option>))}
                </select><br/>
                <label className="modal-form-content-label">Color: </label>
                <select value={pointColor} onChange={e => setPointColor(e.target.value)}>
                    {map.colors.sort(color => color.id).map(color => (<option value={color.id}>{color.name}</option>))}
                </select><br/>
                <label className="modal-form-content-label">Icon: </label>
                <select value={pointIcon} onChange={e => setPointIcon(e.target.value)}>
                    {map.icons.sort(icon => icon.id).map(icon => (<option value={icon.id}>{icon.name}</option>))}
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
                    {map.categories.sort(cat => cat.id).map(cat => (<option value={cat.id}>{cat.name}</option>))}
                </select><br/>
                <label className="modal-form-content-label">Color: </label>
                <select value={pointColor} onChange={e => setPointColor(e.target.value)}>
                    {map.colors.sort(color => color.id).map(color => (<option value={color.id}>{color.name}</option>))}
                </select><br/>
                <label className="modal-form-content-label">Icon: </label>
                <select value={pointIcon} onChange={e => setPointIcon(e.target.value)}>
                    {map.icons.sort(icon => icon.id).map(icon => (<option value={icon.id}>{icon.name}</option>))}
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
                        mapCategories.push({ id: `temp-id-${Math.random() * 10000}`, name: "" })
                        setMapCategories([ ...mapCategories ]); 
                    }}>+</button><br />
                </div>
                {mapCategories.sort(val => val.id).map((val, idx) => (
                    <div>
                        <input type="text" placeholder="new-category-name" value={val.name} onChange={e => {
                            mapCategories[idx].name = e.target.value;
                            setMapCategories([ ...mapCategories ]);
                        }}/>
                        <button className="modal-form-list-button" onClick={() => {
                            setMapCategories([ ...mapCategories.toSpliced(idx, 1) ]);
                        }}>-</button>
                        <br />
                    </div>
                ))}
                <br/>
                <div>
                    <label className="modal-form-content-label">Colors</label>
                    <button className="modal-form-list-button" onClick={() => {
                        mapColors.push({ id: `temp-id-${Math.random() * 10000}`, name: "", color: "" })
                        setMapColors([...mapColors]); 
                    }}>+</button><br />
                </div>
                {mapColors.sort(val => val.id).map((val, idx) => (
                    <div>
                        <input type="text" placeholder="new-color-name" value={val.name} onChange={e => { 
                            mapColors[idx].name = e.target.value;
                            setMapColors([ ...mapColors ]); 
                        }}/>
                        <input type="text" placeholder="new-color-hex" value={val.hex} onChange={e => {
                            mapColors[idx].hex = e.target.value;
                            setMapColors([ ...mapColors ]);
                        }}/>
                        <button className="modal-form-list-button" onClick={() => {
                            setMapColors([ ...mapColors.toSpliced(idx, 1) ]);
                        }}>-</button>
                        <br />
                    </div>
                ))}
                <br />
                <div>
                    <label className="modal-form-content-label">Icons</label>
                    <button className="modal-form-list-button" onClick={() => {
                        mapIcons.push({ id: `temp-id-${Math.random() * 10000}`, name: "", icon: "" })
                        setMapIcons([...mapIcons]); 
                    }}>+</button><br />
                </div>
                {mapIcons.sort(val => val.id).map((val, idx) => (
                    <div>
                        <input type="text" placeholder="new-icon-name" value={val.name} onChange={e => {
                            mapIcons[idx].name = e.target.value;
                            setMapIcons([ ...mapIcons ]);
                        }}/>
                        <input type="text" placeholder="new-icon-url" value={val.url} onChange={e => {
                            mapIcons[idx].url = e.target.value;
                            setMapIcons([ ...mapIcons ]);
                        }}/>
                        <button className="modal-form-list-button" onClick={() => {
                            setMapIcons([ ...mapIcons.toSpliced(idx, 1)] );
                        }}>-</button>
                        <br />
                    </div>
                ))}
                <br />
                <div>
                    <label className="modal-form-content-label">User Permissions</label>
                    <button className="modal-form-list-button" onClick={() => {
                        mapUsers.push({ usersub: "", permissions: "" })
                        setMapUsers([...mapUsers]);
                    }}>+</button><br />
                </div>
                {mapUsers.sort(user => user.usersub).map((val, idx) => (
                    <div>
                        <input type="text" value={val.usersub} onChange={e => {
                            mapUsers[idx].usersub = e.target.value;
                            setMapUsers([ ...mapUsers ]);
                        }} />
                        <input type="text" value={val.permissions} onChange={e => {
                            mapUsers[idx].permissions = e.target.value;
                            setMapUsers([ ...mapUsers ]);
                        }} />
                        <button className="modal-form-list-button" onClick={() => {
                            setMapUsers([ ...mapUsers.toSpliced(idx, 1) ]);
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
                        mapCategories.push({ id: `temp-id-${Math.random() * 10000}`, name: "" })
                        setMapCategories([ ...mapCategories ]);
                    }}>+</button><br />
                </div>
                {mapCategories.sort(val => val.id).map((val, idx) => (
                    <div>
                        <input type="text" placeholder="new-category-name" value={val.name} onChange={e => {
                            mapCategories[idx].name = e.target.value;
                            setMapCategories([...mapCategories]);
                        }} />
                        <button className="modal-form-list-button" onClick={() => {
                            setMapCategories([...mapCategories.toSpliced(idx, 1)]);
                        }}>-</button>
                        <br />
                    </div>
                ))}
                <br />
                <div>
                    <label className="modal-form-content-label">Colors</label>
                    <button className="modal-form-list-button" onClick={() => {
                        mapColors.push({ id: `temp-id-${Math.random() * 10000}`, name: "", color: "" })
                        setMapColors([...mapColors]);
                    }}>+</button><br />
                </div>
                {mapColors.sort(val => val.id).map((val, idx) => (
                    <div>
                        <input type="text" placeholder="new-color-name" value={val.name} onChange={e => {
                            mapColors[idx].name = e.target.value;
                            setMapColors([...mapColors]);
                        }} />
                        <input type="text" placeholder="new-color-hex" value={val.hex} onChange={e => {
                            mapColors[idx].hex = e.target.value;
                            setMapColors([...mapColors]);
                        }} />
                        <button className="modal-form-list-button" onClick={() => {
                            setMapColors([...mapColors.toSpliced(idx, 1)]);
                        }}>-</button>
                        <br />
                    </div>
                ))}
                <br />
                <div>
                    <label className="modal-form-content-label">Icons</label>
                    <button className="modal-form-list-button" onClick={() => {
                        mapIcons.push({ id: `temp-id-${Math.random() * 10000}`, name: "", icon: "" })
                        setMapIcons([...mapIcons]);
                    }}>+</button><br />
                </div>
                {mapIcons.sort(val => val.id).map((val, idx) => (
                    <div>
                        <input type="text" placeholder="new-icon-name" value={val.name} onChange={e => {
                            mapIcons[idx].name = e.target.value;
                            setMapIcons([...mapIcons]);
                        }} />
                        <input type="text" placeholder="new-icon-url" value={val.url} onChange={e => {
                            mapIcons[idx].url = e.target.value;
                            setMapIcons([...mapIcons]);
                        }} />
                        <button className="modal-form-list-button" onClick={() => {
                            setMapIcons([...mapIcons.toSpliced(idx, 1)]);
                        }}>-</button>
                        <br />
                    </div>
                ))}
                <br />
                {(map.my_permissions.includes("owner") || map.my_permissions.includes("admin")) ?
                    <>
                        <div>
                            <label className="modal-form-content-label">User Permissions</label>
                            <button className="modal-form-list-button" onClick={() => {
                                mapUsers.push({ usersub: "", permissions: "" })
                                setMapUsers([ ...mapUsers ]);
                            }}>+</button><br />
                        </div>
                        {mapUsers.sort(user => user.usersub).map((val, idx) => (
                            <div>
                                <input type="text" value={val.usersub} onChange={e => {
                                    mapUsers[idx].usersub = e.target.value;
                                    setMapUsers([ ...mapUsers ]);
                                }} />
                                <input type="text" value={val.permissions} onChange={e => {
                                    mapUsers[idx].permissions = e.target.value;
                                    setMapUsers([ ...mapUsers ]);
                                }} />
                                <button className="modal-form-list-button" onClick={() => {
                                    setMapUsers([ ...mapUsers.toSpliced(idx, 1) ]);
                                }}>-</button>
                                <br />
                            </div>
                        ))}
                        <br />
                    </>
                    : ""
                }
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
            mapData.categories = mapCategories.map(cat => cat.name);
            mapData.icons = mapIcons.map(icon => { return {"name": icon.name, "icon": icon.icon} });
            mapData.colors = mapColors.map(color => { return { "name": color.name, "color": color.hex } });
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
            let categories = mapCategories;
            if (categories.length > 0) {
                let newCategories = categories.filter(cat => cat.id.startsWith("temp-id")).map(cat => cat.name);
                if (newCategories.length > 0)
                    await editMapInfo(token, "POST", map.id, "categories", {categories: newCategories}).then((data) => {
                        if (data) {
                            console.log("added categories");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error adding categories: " + error);
                    });
                let changedCategories = categories.filter(cat => !cat.id.startsWith("temp-id") && JSON.stringify(map.categories.filter(oldCat => oldCat.id == cat.id)[0]) != JSON.stringify(cat));
                if (changedCategories.length > 0)
                    await editMapInfo(token, "PUT", map.id, "categories", {categories: changedCategories}).then((data) => {
                        if (data) {
                            console.log("editing categories");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error editing categories: " + error);
                    });
                let deletedCategories = map.categories.filter(oldCat => !categories.some(cat => cat.id == oldCat.id)).map(cat => cat.id);
                if (deletedCategories.length > 0)
                    await editMapInfo(token, "DELETE", map.id, "categories", {categories: deletedCategories}).then((data) => {
                        if (data) {
                            console.log("deleted categories");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error deleting categories: " + error);
                    });
            }
            let colors = mapColors;
            if (colors.length > 0) {
                let newColors = colors.filter(color => color.id.startsWith("temp-id")).map(color => { return { name: color.name, hex: color.hex } });
                if (newColors.length > 0)
                    await editMapInfo(token, "POST", map.id, "colors", {colors: newColors}).then((data) => {
                        if (data) {
                            console.log("added colors");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error adding colors: " + error);
                    });
                let changedColors = colors.filter(color => !color.id.startsWith("temp-id") && JSON.stringify(map.colors.filter(oldColor => oldColor.id == color.id)[0]) != JSON.stringify(color));
                if (changedColors.length > 0)
                    await editMapInfo(token, "PUT", map.id, "colors", {colors: changedColors}).then((data) => {
                        if (data) {
                            console.log("editing colors");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error editing colors: " + error);
                    });
                let deletedColors = map.colors.filter(oldColor => !colors.some(color => color.id == oldColor.id)).map(color => color.id);
                if (deletedColors.length > 0)
                    await editMapInfo(token, "DELETE", map.id, "colors", {colors: deletedColors}).then((data) => {
                        if (data) {
                            console.log("deleted colors");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error deleting colors: " + error);
                    });
            }
            let icons = mapIcons;
            if (icons.length > 0) {
                let newIcons = icons.filter(icon => icon.id.startsWith("temp-id")).map(icon => { return { name: icon.name, url: icon.url } });
                if (newIcons.length > 0)
                    await editMapInfo(token, "POST", map.id, "icons", {icons: newIcons}).then((data) => {
                        if (data) {
                            console.log("added icons");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error adding icons: " + error);
                    });
                let changedIcons = icons.filter(icon => !icon.id.startsWith("temp-id") && JSON.stringify(map.icons.filter(oldIcon => oldIcon.id == icon.id)[0]) != JSON.stringify(icon));
                if (changedIcons.length > 0)
                    await editMapInfo(token, "PUT", map.id, "icons", {icons: changedIcons}).then((data) => {
                        if (data) {
                            console.log("editing icons");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error editing icons: " + error);
                    });
                let deletedIcons = map.icons.filter(oldIcon => !icons.some(icon => icon.id == oldIcon.id)).map(icon => icon.id);
                if (deletedIcons.length > 0)
                    await editMapInfo(token, "DELETE", map.id, "icons", {icons: deletedIcons}).then((data) => {
                        if (data) {
                            console.log("deleted icons");
                            console.log(data);
                        }
                    }).catch((error) => {
                        console.log("Error deleting icons: " + error);
                    });
            }

            const getPermissionObj = perms => {
                let defaultPerms = {
                    "add": false,
                    "edit": false,
                    "admin": false,
                }
                perms.split(",").forEach(perm => {
                    if(perm in defaultPerms) defaultPerms[perm] = true;
                });
                return defaultPerms;
            }

            if(map.my_permissions.includes("owner") || map.my_permissions.includes("admin")) {
                let users = mapUsers;
                let oldUsers = [];
                map.users.forEach(user => {
                    if (user.permissions)
                        oldUsers.push({ usersub: user.usersub, permissions: Object.keys(user.permissions).join(",") });
                });
                if (users.length > 0) {
                    let newUsers = users.filter(user => !oldUsers.some(oldUser => user.usersub == oldUser.usersub)).map(user => { return { usersub: user.usersub, permissions: getPermissionObj(user.permissions) } });
                    if (newUsers.length > 0)
                        await editMapInfo(token, "POST", map.id, "users", { users: newUsers }).then((data) => {
                            if (data) {
                                console.log("added users");
                                console.log(data);
                            }
                        }).catch((error) => {
                            console.log("Error adding users: " + error);
                        });
                    let changedUsers = users.filter(user => !newUsers.some(newUser => newUser.usersub == user.usersub) && JSON.stringify(oldUsers.filter(oldUser => oldUser.usersub == user.usersub)[0]) != JSON.stringify(user)).map(user => { return { usersub: user.usersub, permissions: getPermissionObj(user.permissions) } });
                    if (changedUsers.length > 0)
                        await editMapInfo(token, "PUT", map.id, "users", { users: changedUsers }).then((data) => {
                            if (data) {
                                console.log("editing users");
                                console.log(data);
                            }
                        }).catch((error) => {
                            console.log("Error editing users: " + error);
                        });
                    let deletedUsers = oldUsers.filter(oldUser => !users.some(user => user.usersub == oldUser.usersub)).map(user => user.usersub);
                    if (deletedUsers.length > 0)
                        await editMapInfo(token, "DELETE", map.id, "users", { users: deletedUsers }).then((data) => {
                            if (data) {
                                console.log("deleted users");
                                console.log(data);
                            }
                        }).catch((error) => {
                            console.log("Error deleting users: " + error);
                        });
                }
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