import type { StyleSpecification } from "maplibre-gl";
import { createContext } from "react";

export interface AtlasContextType {
    baseStyle: StyleSpecification;
    updateBaseStyle: (layerId: string) => void;
    selectedRegularLayers: string[];
    toggleRegularLayers: (layerIds: string[], partlySelected?: boolean) => void;
}

export const AtlasContext = createContext<AtlasContextType>(null!);