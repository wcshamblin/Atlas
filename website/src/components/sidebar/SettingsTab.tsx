import React, { useState, useEffect } from "react";
import 'styles/components/sidebar.css';

const SettingsTab = ({ 
    settings,
    updateSettings,
}) => {
    const [isoMinutesLive, setIsoMinutesLive] = useState(null);

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

    return (
        <div className="settings-container">
            <h1>SETTINGS</h1>
            <span>Show cell antennas (information may not be accurate): </span>
            <input type="checkbox" checked={settings["showUls"]} onChange={e => updateSettings("showUls", e.target.checked)} />
            <br /><br />
            {/* <span>FAA/FCC Tower Height Filter</span>
            <input type="range" value={towerHeightFilter} min="5" max="240" onChange={e => setIsoMinutesLive(e.target.value)} />
            <br /><br /> */}
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
};
export default SettingsTab;