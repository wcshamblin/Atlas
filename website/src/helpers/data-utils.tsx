import { layer } from '@fortawesome/fontawesome-svg-core';
import React, { type ReactElement } from 'react';
import { Source, Layer, type SourceProps, type LayerProps } from 'react-map-gl';

// geojson assets
import long_lines from '@assets/long-lines/long-lines.geojson?url';
import flyghinder from '@assets/flyghinder/flyghinder.geojson?url';
import flyghinder_polygons from '@assets/flyghinder/flyghinder_polygons.geojson?url';
import germany_tall_structures from '@assets/germany_tall_structures/germany_tall_structures.geojson?url';
import germany_tall_structures_polygons from '@assets/germany_tall_structures/germany_tall_structures_polygons.geojson?url';
import nrhp from '@assets/nrhp/nrhp.geojson?url';

import cartoLabelsStyle from "@assets/carto-dark-matter-gl-style.json?raw";

// base style shit
export const stylesWithLabels = ['Google Hybrid', 'OpenStreetMap', 'Mapbox', 'VFR', 'USGS Topo', 'Skoterleder'];
export const defaultMapStyle = "Google Hybrid";

export const getDefaultMapStyle = () => {
    let storedBaseStyle: string = localStorage.getItem('base-style');
    // if there is no setting or the style is not a valid id then set to the default
    if (!storedBaseStyle || !(storedBaseStyle in baseStyleDictionary)) {
        storedBaseStyle = defaultMapStyle;
        localStorage.setItem('base-style', defaultMapStyle);
    }

    return storedBaseStyle;
}

export const getUpdatedMapStyle = (baseStyleId: string, hideLabels?: boolean) => {
    // can definitely update this to have more custom source and layer settings if needed
    if (stylesWithLabels.includes(baseStyleId) || hideLabels) {
        return {
            "version": 8,
            "name": baseStyleId,
            "id": baseStyleId,
            // "projection": { "type": "globe" }, for when we update to maplibre v5
            "glyphs": "https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf",
            "sources": {
                [baseStyleId]: {
                    "type": "raster",
                    "maxzoom": 20,
                    "tileSize": 256,
                    "tiles": baseStyleDictionary[baseStyleId]
                },
                maptilerTerrain: {
                    type: 'raster-dem',
                    url: `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
                    tileSize: 256
                },
            },
            "layers": [{
                "id": baseStyleId,
                "type": "raster",
                "source": baseStyleId
            }],
            terrain: {
                source: 'maptilerTerrain',
                exaggeration: 1
            },
        }
    } else {
        // uses a base style from cargo with the labels for the base layers that do not have labels
        // https://medium.com/@go2garret/free-basemap-tiles-for-maplibre-18374fab60cb
        const labelStyles = JSON.parse(cartoLabelsStyle);
        labelStyles.name = baseStyleId;
        labelStyles.id = baseStyleId;
        labelStyles.sources[baseStyleId] = {
            "type": "raster",
            "maxzoom": 20,
            "tileSize": 256,
            "tiles": baseStyleDictionary[baseStyleId]
        };
        labelStyles.sources["maptilerTerrain"] = {
            type: 'raster-dem',
            url: `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
            tileSize: 256
        };
        labelStyles.layers.unshift({
            "id": baseStyleId,
            "type": "raster",
            "source": baseStyleId
        });
        labelStyles.terrain = {
            source: 'maptilerTerrain',
            exaggeration: 1
        }
        return labelStyles;
    }
}

export const googleHybridTiles = [
    'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
];

export const bingHybridTiles = [
    'https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
    'https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
    'https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
    'https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z'
];

export const esriTiles = [
    'https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/{z}/{y}/{x}?blankTile=false',
    'https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/{z}/{y}/{x}?blankTile=false',
    'https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/{z}/{y}/{x}?blankTile=false'
];

export const esri2014Tiles = [
    'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false',
    'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false',
    'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false'
];

export const mapboxTiles = [
    'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=' + import.meta.env.VITE_APP_MAPBOX_API_KEY
];

export const openStreetMapTiles = [
    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
];

export const naipTiles = [
    'https://gis.apfo.usda.gov/arcgis/rest/services/NAIP/USDA_CONUS_PRIME/ImageServer/tile/{z}/{y}/{x}'
];

export const lantmaterietTiles = [
    'https://minkarta.lantmateriet.se/map/ortofoto?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=Ortofoto_0.5%2COrtofoto_0.4%2COrtofoto_0.25%2COrtofoto_0.16&TILED=true&STYLES=&WIDTH=256&HEIGHT=256&SRS=EPSG%3A3857&BBOX={bbox-epsg-3857}'
];

export const vfrTiles = [
    'https://atlas2.org/api/vfr/{z}/{x}/{y}.png'
];

export const maxarTiles = [
    'https://maps.hereapi.com/v3/background/mc/{z}/{x}/{y}/png?size=512&style=explore.satellite.day&apiKey=' + import.meta.env.VITE_APP_HERE_API_KEY
];

export const usgsTopoTiles = [
    'https://caltopo.s3.amazonaws.com/topo/{z}/{x}/{y}.png'
];

export const sentinel2Tiles = [
    'https://atlas2.org/api/sentinel/{bbox-epsg-3857}.png'
];

export const skoterlederTiles = [
    'https://atlas2.org/api/skoterleder/{z}/{x}/{y}.png'
];

export const baseStyleDictionary: Record<string, string[]> = {
    'Google Hybrid': googleHybridTiles,
    'Bing Hybrid': bingHybridTiles,
    'ESRI': esriTiles,
    'ESRI (2014)': esri2014Tiles,
    'NAIP': naipTiles,
    'MAXAR': maxarTiles,
    'Mapbox': mapboxTiles,
    'Sentinel 2-L2A': sentinel2Tiles,
    'VFR': vfrTiles,
    'Lantmäteriet': lantmaterietTiles,
    'Skoterleder': skoterlederTiles,
    'USGS Topo': usgsTopoTiles,
    'OpenStreetMap': openStreetMapTiles,
}

// format of styleid, country
export const baseStyleCountries: [string, string][] = [
    ["Google Hybrid", "all"],
    ["Bing Hybrid", "all"],
    ["ESRI", "all"],
    ["ESRI (2014)", "all"],
    ["NAIP", "usa"],
    ["MAXAR", "all"],
    ["Mapbox", "all"],
    ["Sentinel 2-L2A", "all"],
    ["VFR", "usa"],
    ["Lantmäteriet", "eu"],
    ["Skoterleder", "eu"],
    ["USGS Topo", "usa"],
    ["OpenStreetMap", "all"]
];

// // ex: setBaseLayer(getBaseLayerWithId('Google Hybrid'));
// export const getBaseLayerWithId = (id: string) => {
//     if(!id) return undefined;
//     return <Source type='raster' maxzoom={20} tileSize={256} tiles={baseLayerDictionary[id]}>
//         <Layer id='base-layer' type='raster' source={id} />
//     </Source>
// }

// // ex: setBaseLayer(getBaseLayerWithTiles('Google Hybrid', googleHybridTiles));
// export const getBaseLayerWithTiles = (id: string, tiles: string[]) => 
//     <Source type='raster' maxzoom={20} tileSize={256} tiles={tiles}>
//         <Layer id='base-layer' type='raster' source={id} />
//     </Source>

// export const defaultMapStyle = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
// export const defaultMapStyle = "mapbox://styles/mapbox/standard-satellite";
// export const defaultMapStyle = "mapbox://styles/mapbox/dark-v11";
// export const noLabelsMapStyle = "mapbox://styles/mapbox/satellite-v9";


// normal layers
export const openRailwayMapSource: SourceProps = {
    'type': 'raster',
    'tiles': [
        'https://a.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
        'https://b.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
        'https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png'
    ],
    //server returns 512px img for 256 tiles
    'tileSize': 512,
    // 'tilePixelRatio': 2
    // 'tileSize': 256,
    'minzoom': 2,
    'maxzoom': 19
}

export const openRailwayMapLayer: LayerProps = {
    'id': 'OpenRailwayMap',
    'type': 'raster',
    'source': 'OpenRailwayMap',
    'paint': {}
};

export const googleStreetviewSource: SourceProps = {
    'type': 'raster',
    'tiles': [
        'https://mts2.google.com/mapslt?lyrs=svv&x={x}&y={y}&z={z}&w=256&h=256&hl=en&style=40,18'
    ],
    'tileSize': 256,
    'minzoom': 15
}

export const googleStreetviewLayer: LayerProps = {
    'id': 'Google StreetView',
    'type': 'raster',
    'source': 'Google StreetView',
    'paint': {}
};

export const parcelOwnershipSource: SourceProps = {
    'type': 'vector',
    'tiles': [
        'https://atlas2.org/api/parcel/{z}/{x}/{y}'
    ],
    'minzoom': 12,
    'maxzoom': 18,
};

export const parcelOwnershipLayer: LayerProps = {
    'id': 'Parcel Ownership',
    'type': 'line',
    'source': 'Parcel Ownership',
    'source-layer': 'parcels',
    'paint': {
        'line-color': '#00a97d',
        'line-width': 1,
    }
}

export const parcelOwnershipLabelLayer: LayerProps = {
    'id': 'Parcel Ownership Labels',
    'type': 'symbol',
    'source': 'Parcel Ownership',
    'source-layer': 'parcels',
    'layout': {
        'text-field': '{owner}',
        "text-font": ["Open Sans Regular"],
        'text-size': 15,
        'visibility': 'visible'
    },
    'paint': {
        'text-color': '#8affe0',
    },
    // set minzoom to 16 to avoid cluttering the map
    'minzoom': 14
}

export const threeDBuildingLayer: LayerProps = {
    'id': '3D Buildings',
    'source': 'composite',
    'source-layer': 'building',
    'filter': ['==', 'extrude', 'true'],
    'type': 'fill-extrusion',
    'minzoom': 15,
    'paint': {
        'fill-extrusion-color': '#404040',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.87
    }
}

export const lightPollutionSource: SourceProps = {
    'type': 'raster',
    'maxzoom': 6,
    'tileSize': 1024,
    'tiles': [
        'https://djlorenz.github.io/astronomy/lp2022/overlay/tiles/tile_{z}_{x}_{y}.png'
    ]
};

export const lightPollutionLayer: LayerProps = {
    'id': 'Light Pollution',
    'type': 'raster',
    'source': 'Light Pollution',
    'paint': {
        'raster-opacity': 0.4
    }
}

export const longLinesSource: SourceProps = {
    'type': 'geojson',
    'data': long_lines
};

export const longLinesLayer: LayerProps = {
    'id': 'Long Lines',
    'type': 'circle',
    'source': 'Long Lines',
    'paint': {
        'circle-radius': 6,
        'circle-color': ['get', 'color'],
    }
}

export const flyghinderSource: SourceProps = {
    'type': 'geojson',
    'data': flyghinder
};

export const flyghinderLayer: LayerProps = {
    'id': 'FLYGHINDER 2023',
    'type': 'circle',
    'source': 'FLYGHINDER 2023',
    'paint': {
        'circle-radius': 6,
        'circle-color': '#62b031',
    }
}

export const flyghinderExtrusionsLayer: LayerProps = {
    'id': 'FLYGHINDER 2023 Extrusions',
    'type': 'fill-extrusion',
    'source': 'FLYGHINDER 2023 Extrusions',
    'minzoom': 12,
    'paint': {
        'fill-extrusion-color': "#62b031",
        'fill-extrusion-height': ['get', 'height_meters'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
    }
}

export const germanyTallStructuresSource: SourceProps = {
    'type': 'geojson',
    'data': germany_tall_structures
};

export const germanyTallStructuresLayer: LayerProps = {
    'id': 'Germany Tall Structures',
    'type': 'circle',
    'source': 'Germany Tall Structures',
    'paint': {
        'circle-radius': 6,
        'circle-color': '#62b031',
    }
}

export const germanyTallStructuresExtrusionsLayer: LayerProps = {
    'id': 'Germany Tall Structures Extrusions',
    'type': 'fill-extrusion',
    'source': 'Germany Tall Structures Extrusions',
    'minzoom': 12,
    'paint': {
        'fill-extrusion-color': "#62b031",
        'fill-extrusion-height': ['get', 'height_meters'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
    }
}

export const nrhpSource: SourceProps = {
    'type': 'geojson',
    'data': nrhp
};

export const nrhpLayer: LayerProps = {
    'id': 'National Register of Historic Places',
    'type': 'circle',
    'source': 'National Register of Historic Places',
    'paint': {
        'circle-radius': 6,
        'circle-color': ['get', 'color'],
    }
}

export const regularLayerCategories: Record<string, { source?: SourceProps, layers: LayerProps[] }> = {
    'OpenRailwayMap': {
        source: openRailwayMapSource,
        layers: [openRailwayMapLayer],
    },
    'Google StreetView': {
        source: googleStreetviewSource,
        layers: [googleStreetviewLayer],
    },
    'Parcel Ownership': {
        source: parcelOwnershipSource,
        layers: [parcelOwnershipLayer, parcelOwnershipLabelLayer],
    },
    '3D Buildings': {
        layers: [threeDBuildingLayer],
    },
    'Light Pollution': {
        source: lightPollutionSource,
        layers: [lightPollutionLayer],
    },
    //'Towers': {}, // custom
    //'FAA Obstacles': {}, // custom
    //'Antennas': {}, // custom
    'Long Lines': {
        source: longLinesSource,
        layers: [longLinesLayer],
    },
    //'Shade Map': {}, // custom
    //'Isochrone': {}, // custom
    'FLYGHINDER 2023': {
        source: flyghinderSource,
        layers: [flyghinderLayer, flyghinderExtrusionsLayer],
    },
    'Germany Tall Structures': {
        source: germanyTallStructuresSource,
        layers: [germanyTallStructuresLayer, germanyTallStructuresExtrusionsLayer],
    },
    'National Register of Historic Places': {
        source: nrhpSource,
        layers: [nrhpLayer],
    },
}

export const regularLayers: Record<string, LayerProps> = {
    'OpenRailwayMap': openRailwayMapLayer,
    'Google StreetView': googleStreetviewLayer,
    'Parcel Ownership': parcelOwnershipLayer,
    'Parcel Ownership Labels': parcelOwnershipLabelLayer,
    '3D Buildings': threeDBuildingLayer,
    'Light Pollution': lightPollutionLayer,
    'Long Lines': longLinesLayer,
    'FLYGHINDER 2023': flyghinderLayer,
    'FLYGHINDER Extrusions': flyghinderExtrusionsLayer,
    'Germany Tall Structures': germanyTallStructuresLayer,
    'Germany Tall Structures Extrusions': germanyTallStructuresExtrusionsLayer,
    'National Register of Historic Places': nrhpLayer,
}

export const getRegularLayerCategoryWithId = (id: string, selectedLayers?: string[]) => {
    let { source, layers } = regularLayerCategories[id];
    
    if (selectedLayers) {
        layers = layers.filter(layer => selectedLayers.includes(layer.id))
    }
    const mappedLayers = layers.map(layer => <Layer key={layer.id} {...layer} />);

    if (!source) {
        return (
            <React.Fragment key={id}>
                {mappedLayers}
            </React.Fragment>
        );
    }

    return (
        <Source key={id} {...source}>
            {mappedLayers}
        </Source>
    )
}

export const regularLayerCategoriesWithCountries: [string, string[], string][] = [
    ["OpenRailwayMap", ["OpenRailwayMap"], "usa"],
    ["Google StreetView", ["Google StreetView"], "all"],
    ["Parcel Ownership", ["Parcel Ownership", "Parcel Ownership Labels"], "usa"],
    ["3D Buildings", ["3D Buildings"], "all"],
    ["Light Pollution", ["Light Pollution"], "all"],
    ["Towers", ["All Towers", "All Tower Extrusions"], "usa"],
    ["FAA Obstacles", ["FAA Obstacles"], "usa"],
    ["Antennas", ["Antennas"], "usa"],
    ["Long Lines", ["Long Lines"], "usa"],
    ["Shade Map", ["Shade Map"], "all"],
    ["Isochrone", ["Isochrone"], "all"],
    ["FLYGHINDER 2023", ["FLYGHINDER 2023", "FLYGHINDER 2023 Extrusions"], "eu"],
    ["Germany Tall Structures", ["Germany Tall Structures", "Germany Tall Structures Extrusions"], "eu"],
    ["National Register of Historic Places", ["National Register of Historic Places"], "usa"],
];

export const regularLayerCountries: [string, string][] = [
    ["All Towers", "usa"],
    ["All Tower Extrusions", "usa"],
    ["Google StreetView", "all"],
    ["3D Buildings", "all"],
    ["Shade Map", "all"],
    ["Antennas", "usa"],
    ["Isochrone", "all"],
    ["OpenRailwayMap", "all"],
    ["Long Lines", "usa"],
    ["FLYGHINDER 2023", "eu"],
    ["FLYGHINDER 2023 Extrusions", "eu"],
    ["FAA Obstacles", "usa"],
    ["Germany Tall Structures", "eu"],
    ["Germany Tall Structures Extrusions", "eu"],
    ["National Register of Historic Places", "usa"],
    ["Parcel Ownership", "usa"],
    ["Parcel Ownership Labels", "usa"],
    ["Light Pollution", "all"]
]