import type { StyleSpecification } from "maplibre-gl";
import { createContext } from "react";

export interface AtlasContextType {
    baseStyleSpecification: StyleSpecification;
    setBaseStyle: React.Dispatch<React.SetStateAction<string>>;
    selectedRegularLayers: string[];
    toggleRegularLayers: (layerIds: string[], partlySelected?: boolean) => void;
}

export const AtlasContext = createContext<AtlasContextType>(null!);