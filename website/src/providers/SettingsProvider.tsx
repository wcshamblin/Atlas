import React, { createContext, useState, useRef, useEffect } from 'react';
import { IsoProfileTypes, SettingsContext } from './SettingsContext';

const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [showUls, setShowUls] = useState<boolean>(false);
    const [hideLabels, setHideLabels] = useState<boolean>(false);
    const [isoProfile, setIsoProfile] = useState<IsoProfileTypes>(IsoProfileTypes.Driving);
    const [isoMinutes, setIsoMinutes] = useState<number>(60);

    useEffect(() => {
        if(settingsLoaded) {
            const newSettingsObj = {
                darkMode,
                showUls,
                hideLabels,
                isoProfile,
                isoMinutes
            }
            localStorage.setItem('settings', JSON.stringify(newSettingsObj));
        }        
    }, [darkMode, showUls, hideLabels, isoProfile, isoMinutes]);

    useEffect(() => {
        const storageSettings = localStorage.getItem('settings')
        if (storageSettings) {
            const settingsObj = JSON.parse(storageSettings);
            setDarkMode(settingsObj.darkMode ?? false);
            setShowUls(settingsObj.showUls ?? false);
            setHideLabels(settingsObj.hideLabels ?? false);
            setIsoProfile(settingsObj.isoProfile ?? IsoProfileTypes.Driving);
            setIsoMinutes(settingsObj.isoMinutes ?? 60);
        }
        setSettingsLoaded(true);
    }, []);

    return (
        <SettingsContext.Provider 
            value={{ 
                darkMode,
                setDarkMode,
                showUls,
                setShowUls,
                hideLabels,
                setHideLabels,
                isoProfile,
                setIsoProfile,
                isoMinutes,
                setIsoMinutes,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export default SettingsProvider;