import React, { useState } from "react";
import '../styles/components/sidebar.css';

const Sidebar = ({ expanded, setDisplaySidebar }) => {
    const [selectedPart, setSelectedPart] = useState("weather");

    return expanded ? (
        <div id="sidebar">
            <div id="sidebar-header">
                <div class="sidebar-link">
                    <button class="sidebar-link-button weather" onClick={e => setSelectedPart('weather')}></button>
                </div>
                <div class="sidebar-link">
                    <button class="sidebar-link-button maps" onClick={e => setSelectedPart('layers')}></button>
                </div>
                <div class="sidebar-link">
                    <button class="sidebar-link-button clock" onClick={e => setSelectedPart('time')}></button>
                </div>
                <div class="sidebar-link">
                    <button class="sidebar-link-button settings" onClick={e => setSelectedPart('settings')}></button>
                </div>
                <div class="sidebar-link">
                    <button class="sidebar-link-button expand" onClick={e => setDisplaySidebar(false)}></button>
                </div>
            </div>

            <div id="sidebar-content">
                {(() => {
                    switch(selectedPart) {
                        case 'weather':
                            return <h1>WEATHER</h1>
                        case 'layers':
                            return <h1>LAYERS</h1>
                        case 'time':
                            return <h1>TIME</h1>
                        case 'settings':
                            return <h1>SETTINGS</h1>
                        default:
                            return ""
                    } 
                })()}

                {/* {homeIsSet ? getHomeMetrics() : ""}

                <h4>Map date time selector</h4>
                <DateTimePicker
                    onChange={setMapDatetime}
                    value={mapDatetime}
                /> */}
            </div>
        </div>
    ) : <button class="sidebar-link-button expand sidebar-hidden" onClick={e => setDisplaySidebar(true)}></button>;
};
export default Sidebar;