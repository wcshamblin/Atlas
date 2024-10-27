import type { StyleSpecification } from "maplibre-gl";
import { createContext } from "react";

export interface AtlasContextType {
    baseStyleSpecification: StyleSpecification;
    setBaseStyle: React.Dispatch<React.SetStateAction<string>>;
    selectedCats: [string, string[]?, object?][];
    toggleCat: (catId: string, subLayers?: string[]) => void;
    toggleSubLayer: (catId: string, subLayerId: string) => void;

    // selectedRegularLayers: string[];
    // toggleRegularLayers: (layerIds: string[], partlySelected?: boolean) => void;
}

export const AtlasContext = createContext<AtlasContextType>(null!);