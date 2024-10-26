import { createContext } from "react";

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