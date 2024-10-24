import React, { useState, useEffect, useContext } from "react";
import 'styles/components/sidebar.css';
import { SettingsContext, IsoProfileTypes } from "providers/SettingsProvider";

const SettingsTab = () => {
    const settings = useContext(SettingsContext);
    const [isoMinutesLive, setIsoMinutesLive] = useState(0);

    useEffect(() => {
        if (isoMinutesLive == 0) {
            setIsoMinutesLive(settings.isoMinutes);
        } else {
            const timer = setTimeout(() => {
                settings.setIsoMinutes(isoMinutesLive)
            }, 500)

            return () => clearTimeout(timer)
        }
    }, [isoMinutesLive]);

    return (
        <div className="settings-container">
            <h1>SETTINGS</h1>
            <span>Show cell antennas (information may not be accurate): </span>
            <input type="checkbox" checked={settings.showUls} onChange={e => settings.setShowUls(e.target.checked)} />
            <br /><br />
            {/* <span>FAA/FCC Tower Height Filter</span>
            <input type="range" value={towerHeightFilter} min="5" max="240" onChange={e => setIsoMinutesLive(e.target.value)} />
            <br /><br /> */}
            <span>Isochrone minutes (how far to show the isochrone): </span>
            <input type="range" value={isoMinutesLive} min="5" max="240" onChange={e => setIsoMinutesLive(Number(e.target.value))} />
            <span> {isoMinutesLive} minutes</span>
            <br /><br />
            <span>Isochrone commute type: </span>
            <select value={settings.isoProfile} onChange={(e) => settings.setIsoProfile(e.target.value as IsoProfileTypes)}>
                <option value={IsoProfileTypes.Driving}>Driving</option>
                <option value={IsoProfileTypes.Walking}>Walking</option>
                <option value={IsoProfileTypes.Transit}>Transit</option>
                <option value={IsoProfileTypes.Semitruck}>Semitruck</option>
            </select>
            <br /><br />
            <span>Dark mode (requires reload!): </span>
            <input type="checkbox" checked={settings.darkMode} onChange={e => settings.setDarkMode(e.target.checked)} />
        </div>
    )
};
export default SettingsTab;