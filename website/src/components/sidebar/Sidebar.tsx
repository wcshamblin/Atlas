import React, { useState } from "react";
import 'styles/components/sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faMap,
    faCloudSun,
    faLayerGroup,
    faBars,
    faGear,
} from '@fortawesome/free-solid-svg-icons'

import WeatherTab from "./WeatherTab";
import LayersTab from "./LayersTab";
import SettingsTab from "./SettingsTab";
import CustomMapsTab from "./CustomMapsTab";

enum SidebarTab {
    Weather = "weather",
    Layers = "layers",
    CustomMaps = "customMaps",
    Settings = "settings",
};

const Sidebar = ({ 
    mapStatus,
    expanded, 
    setDisplaySidebar, 
    setLayoutProperty, 
    setShowShadeMap, 
    setShowIsochrone, 
    customMapsData,
    flyTo,
    map,
    pollingPosition,
    setPollingPosition,
    mapDatetime,
    setMapDatetime,
    astronomyInfo,
    currentSelectedCustomMapPoint, 
    setCurrentSelectedCustomMapPoint, 
    setOpenModal, 
    setModalType, 
    setModalSelectedCustomMapId, 
    setModalSelectedCustomMapPointId, 
    displayLabels, 
    settings, 
    updateSettings,
    pointFilters,
    updatePointFilters,
}) => {
    const [selectedTab, setSelectedTab] = useState<SidebarTab>(SidebarTab.Layers);

    return expanded ? (
        <div id="sidebar">
            <div id="sidebar-header">
                <div className="sidebar-link">
                    <FontAwesomeIcon icon={faCloudSun} className="sidebar-link-button" onClick={e => setSelectedTab(SidebarTab.Weather)} />
                </div>
                <div className="sidebar-link">
                    <FontAwesomeIcon icon={faLayerGroup} className="sidebar-link-button" onClick={e => setSelectedTab(SidebarTab.Layers)} />
                </div>
                <div className="sidebar-link">
                    <FontAwesomeIcon icon={faMap} className="sidebar-link-button" onClick={e => setSelectedTab(SidebarTab.CustomMaps)} />
                </div>
                <div className="sidebar-link">
                    <FontAwesomeIcon icon={faGear} className="sidebar-link-button" onClick={e => setSelectedTab(SidebarTab.Settings)} />
                </div>
                <div className="sidebar-link">
                    <FontAwesomeIcon icon={faBars} className="sidebar-link-button" onClick={e => setDisplaySidebar(false)} />
                </div>
            </div>

            <div id="sidebar-content">
                {(() => {
                    switch (selectedTab) {
                        case SidebarTab.Weather:
                            return <WeatherTab 
                                map={map}
                                mapStatus={mapStatus}
                                pollingPosition={pollingPosition}
                                setPollingPosition={setPollingPosition}
                                mapDatetime={mapDatetime}
                                setMapDatetime={setMapDatetime}
                                astronomyInfo={astronomyInfo}
                            />
                        case SidebarTab.Layers:
                            return <LayersTab 
                                map={map}
                                mapStatus={mapStatus}
                                setLayoutProperty={setLayoutProperty}
                                displayLabels={displayLabels}
                                setShowIsochrone={setShowIsochrone}
                                setShowShadeMap={setShowShadeMap}
                            />
                        case SidebarTab.CustomMaps:
                            return <CustomMapsTab
                                mapStatus={mapStatus}
                                setLayoutProperty={setLayoutProperty}
                                customMapsData={customMapsData}
                                flyTo={flyTo}
                                currentSelectedCustomMapPoint={currentSelectedCustomMapPoint}
                                setCurrentSelectedCustomMapPoint={setCurrentSelectedCustomMapPoint}
                                setOpenModal={setOpenModal}
                                setModalType={setModalType}
                                setModalSelectedCustomMapId={setModalSelectedCustomMapId} 
                                setModalSelectedCustomMapPointId={setModalSelectedCustomMapPointId}
                                pointFilters={pointFilters}
                                updatePointFilters={updatePointFilters}
                            />
                        case SidebarTab.Settings:
                            return <SettingsTab
                                settings={settings}
                                updateSettings={updateSettings}
                            />
                        default:
                            return ""
                    }
                })()}
            </div>
        </div>
    ) : <FontAwesomeIcon icon={faBars} className="sidebar-link-button sidebar-hidden" onClick={e => setDisplaySidebar(true)} />
};
export default Sidebar;