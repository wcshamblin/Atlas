import React, { createContext, useState, useRef, useEffect } from 'react';

export enum IsoProfileTypes {
    Driving = "driving",
    Walking = "walking",
    Transit = "transit",
    Semitruck = "truck",
};

export interface SettingsContextType {
    darkMode: boolean;
    setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
    showUls: boolean;
    setShowUls: React.Dispatch<React.SetStateAction<boolean>>;
    hideLabels: boolean;
    setHideLabels: React.Dispatch<React.SetStateAction<boolean>>;
    isoProfile: IsoProfileTypes;
    setIsoProfile: React.Dispatch<React.SetStateAction<IsoProfileTypes>>;
    isoMinutes: number;
    setIsoMinutes: React.Dispatch<React.SetStateAction<Number>>;
}

export const SettingsContext = createContext<SettingsContextType>(null!);

const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [showUls, setShowUls] = useState<boolean>(false);
    const [hideLabels, setHideLabels] = useState<boolean>(false);
    const [isoProfile, setIsoProfile] = useState<IsoProfileTypes>(IsoProfileTypes.Driving);
    const [isoMinutes, setIsoMinutes] = useState<number>(60);

    useEffect(() => {
        let newSettingsObj = {
            darkMode,
            showUls,
            isoProfile,
            isoMinutes
        }
        localStorage.setItem('settings', JSON.stringify(newSettingsObj));
        
    }, [darkMode, showUls, isoProfile, isoMinutes]);

    useEffect(() => {
        const storageSettings = localStorage.getItem('settings')
        if (storageSettings) {
            const settingsObj = JSON.parse(storageSettings);
            setDarkMode(settingsObj.darkMode ?? false);
            setShowUls(settingsObj.showUls ?? false);
            setIsoProfile(settingsObj.isoProfile ?? IsoProfileTypes.Driving);
            setIsoMinutes(settingsObj.isoMinutes ?? 60);
        }
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