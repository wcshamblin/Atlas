import { layer } from '@fortawesome/fontawesome-svg-core';
import React, { Fragment, type ReactElement } from 'react';
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
    `https://${import.meta.env.VITE_APP_API_SERVER_URL}/api/vfr/{z}/{x}/{y}.png`
];

export const maxarTiles = [
    'https://maps.hereapi.com/v3/background/mc/{z}/{x}/{y}/png?size=512&style=explore.satellite.day&apiKey=' + import.meta.env.VITE_APP_HERE_API_KEY
];

export const usgsTopoTiles = [
    'https://caltopo.s3.amazonaws.com/topo/{z}/{x}/{y}.png'
];

export const sentinel2Tiles = [
    `https://${import.meta.env.VITE_APP_API_SERVER_URL}/api/sentinel/{bbox-epsg-3857}.png`
];

export const skoterlederTiles = [
    `https://${import.meta.env.VITE_APP_API_SERVER_URL}/api/skoterleder/{z}/{x}/{y}.png`
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

// normal layers
const openRailwayMapSource: SourceProps = {
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

const openRailwayMapLayer: LayerProps = {
    'id': 'OpenRailwayMap',
    'type': 'raster',
    'source': 'OpenRailwayMap',
    'paint': {}
};

const googleStreetviewSource: SourceProps = {
    'type': 'raster',
    'tiles': [
        'https://mts2.google.com/mapslt?lyrs=svv&x={x}&y={y}&z={z}&w=256&h=256&hl=en&style=40,18'
    ],
    'tileSize': 256,
    'minzoom': 15
}

const googleStreetviewLayer: LayerProps = {
    'id': 'Google StreetView',
    'type': 'raster',
    'source': 'Google StreetView',
    'paint': {}
};

const parcelOwnershipSource: SourceProps = {
    'type': 'vector',
    'tiles': [
        `https://${import.meta.env.VITE_APP_API_SERVER_URL}/api/parcel/{z}/{x}/{y}`
    ],
    'minzoom': 12,
    'maxzoom': 18,
};

const parcelOwnershipLayer: LayerProps = {
    'id': 'Parcel Ownership',
    'type': 'line',
    'source': 'Parcel Ownership',
    'source-layer': 'parcels',
    'paint': {
        'line-color': '#00a97d',
        'line-width': 1,
    }
}

const parcelOwnershipLabelLayer: LayerProps = {
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

const threeDBuildingSource: SourceProps = {
    url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
    type: 'vector',
}

const threeDBuildingLayer: LayerProps = {
    'id': '3D Buildings',
    'source': 'openmaptiles',
    'source-layer': 'building',
    'type': 'fill-extrusion',
    'minzoom': 15,
    'filter': ['!=', ['get', 'hide_3d'], true],
    'paint': {
        'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', 'render_height'], 0, 'lightgray', 200, 'royalblue', 400, 'lightblue'
        ],
        'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            16,
            ['get', 'render_height']
        ],
        'fill-extrusion-base': ['case',
            ['>=', ['get', 'zoom'], 16],
            ['get', 'render_min_height'], 0
        ]
    }
}

const lightPollutionSource: SourceProps = {
    'type': 'raster',
    'maxzoom': 6,
    'tileSize': 1024,
    'tiles': [
        'https://djlorenz.github.io/astronomy/lp2022/overlay/tiles/tile_{z}_{x}_{y}.png'
    ]
};

const lightPollutionLayer: LayerProps = {
    'id': 'Light Pollution',
    'type': 'raster',
    'source': 'Light Pollution',
    'paint': {
        'raster-opacity': 0.4
    }
}

export const towerSearchRadius = 150000;

const towerRenderZoomLevel = 10.5;
const towerExtrusionRenderZoomLevel = 11.5;

const faaObstaclesSource: SourceProps = (obstaclePoints?: any) => ({
    'type': 'geojson',
    'data': !obstaclePoints ? {} : obstaclePoints
});

const faaObstaclesLayer: LayerProps = {
    'id': 'FAA Obstacles',
    'type': 'symbol',
    'layout': {
        'icon-image': 'obstacle-icon',
        'icon-size': 1,
    },
    'source': 'FAA Obstacles',
    'minzoom': towerRenderZoomLevel,
    'paint': {
        'icon-color': '#000000',
    }
}

const allTowersSource: SourceProps = (allTowerPoints?: any) => ({
    'type': 'geojson',
    'data': !allTowerPoints ? {} : allTowerPoints
});

const allTowersLayer: LayerProps = {
    'id': 'All Towers',
    'type': 'symbol',
    'layout': {
        'icon-image': 'tower-icon',
        'icon-size': 1,
    },
    'source': 'All Towers',
    'minzoom': towerRenderZoomLevel,
    'paint': {
        'icon-color': ['get', 'color'],
    }
}

const allTowersExtrusionsSource: SourceProps = (allTowerPolygons?: any) => ({
    'type': 'geojson',
    'data': !allTowerPolygons ? {} : allTowerPolygons
});

const allTowersExtrusionsLayer: LayerProps = {
    'id': 'All Towers Extrusions',
    'type': 'fill-extrusion',
    'source': 'All Towers Extrusions',
    'minzoom': towerExtrusionRenderZoomLevel,
    'paint': {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['get', 'overall_height'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
    }
}

const antennaRenderZoomLevel = 13.5;
export const antennaSearchRadius = 8000;

const antennasSource: SourceProps = (antennaPoints?: any) => ({
    'type': 'geojson',
    'data': !antennaPoints ? {} : antennaPoints
});

const antennasLayer: LayerProps = {
    'id': 'Antennas',
    'type': 'symbol',
    'layout': {
        'icon-image': 'transmitter-icon',
        'icon-size': 1,
    },
    'source': 'Antennas',
    'minzoom': antennaRenderZoomLevel,
    'paint': {
        'icon-color': ['get', 'color'],
    }
}

const longLinesSource: SourceProps = {
    'type': 'geojson',
    'data': long_lines
};

const longLinesLayer: LayerProps = {
    'id': 'Long Lines',
    'type': 'circle',
    'source': 'Long Lines',
    'paint': {
        'circle-radius': 6,
        'circle-color': ['get', 'color'],
    }
}

export const getIsoUrl = (latitude: number, longitude: number, isoMinutes: number, isoProfile: string) => `https://dev.virtualearth.net/REST/v1/Routes/Isochrones?waypoint=${latitude},${longitude}&maxTime=${isoMinutes * 60}&travelMode=${isoProfile}&key=${import.meta.env.VITE_APP_BING_MAPS_API_KEY}`;

export const getIso = async (isochroneUrl: string) => {
    // need error logging here
    const query = await fetch(
        isochroneUrl,
        {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        }
    );
    const data = await query.json();
    if (data && data.resourceSets.length > 0 && data.resourceSets[0] && data.resourceSets[0].resources.length > 0 && data.resourceSets[0].resources[0].polygons && data.resourceSets[0].resources[0].polygons.length > 0 && data.resourceSets[0].resources[0].polygons[0].coordinates) {
        let coordinates = data.resourceSets[0].resources[0].polygons[0].coordinates;
        // for coordinate in coordinates, reverse the order of the coordinates
        coordinates = coordinates.map((coordinate) => {
            return coordinate.map((point) => {
                return [point[1], point[0]];
            })
        })
        
        return [
            {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Polygon",
                    // test sample of coordinates
                    "coordinates": coordinates
                }
            }
        ]
    }
    return [];
}

const isochroneSource: SourceProps = (isochroneFeatures?: any) => ({
    'type': 'geojson',
    'data': {
        'type': 'FeatureCollection',
        'features': !isochroneFeatures ? [] : isochroneFeatures
    }
})

const isochroneLayer: LayerProps = {
    'id': 'Isochrone',
    'type': 'fill',
    'source': 'Isochrone',
    'paint': {
        'fill-color': '#5a3fc0',
        'fill-opacity': 0.3
    }
}

const flyghinderSource: SourceProps = {
    'type': 'geojson',
    'data': flyghinder
};

const flyghinderExtrusionsSource: SourceProps = {
    'type': 'geojson',
    'data': flyghinder_polygons
};

const flyghinderLayer: LayerProps = {
    'id': 'FLYGHINDER 2023',
    'type': 'circle',
    'source': 'FLYGHINDER 2023',
    'paint': {
        'circle-radius': 6,
        'circle-color': '#62b031',
    }
}

const flyghinderExtrusionsLayer: LayerProps = {
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

const germanyTallStructuresSource: SourceProps = {
    'type': 'geojson',
    'data': germany_tall_structures
};

const germanyTallStructuresExtrusionsSource: SourceProps = {
    'type': 'geojson',
    'data': germany_tall_structures_polygons
};

const germanyTallStructuresLayer: LayerProps = {
    'id': 'Germany Tall Structures',
    'type': 'circle',
    'source': 'Germany Tall Structures',
    'paint': {
        'circle-radius': 6,
        'circle-color': '#62b031',
    }
}

const germanyTallStructuresExtrusionsLayer: LayerProps = {
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

const nrhpSource: SourceProps = {
    'type': 'geojson',
    'data': nrhp
};

const nrhpLayer: LayerProps = {
    'id': 'National Register of Historic Places',
    'type': 'circle',
    'source': 'National Register of Historic Places',
    'paint': {
        'circle-radius': 6,
        'circle-color': ['get', 'color'],
    }
}

export const regularLayerCategoriesWithCountries: [string, string[], string][] = [
    ["OpenRailwayMap", ["OpenRailwayMap"], "usa"],
    ["Google StreetView", ["Google StreetView"], "all"],
    ["Parcel Ownership", ["Parcel Ownership", "Parcel Ownership Labels"], "usa"],
    ["3D Buildings", ["3D Buildings"], "all"],
    ["Light Pollution", ["Light Pollution"], "all"],
    ["All Towers", ["All Towers", "All Towers Extrusions"], "usa"],
    ["FAA Obstacles", ["FAA Obstacles"], "usa"],
    ["Antennas", ["Antennas"], "usa"],
    ["Long Lines", ["Long Lines"], "usa"],
    ["Isochrone", ["Isochrone"], "all"],
    ["FLYGHINDER 2023", ["FLYGHINDER 2023", "FLYGHINDER 2023 Extrusions"], "eu"],
    ["Germany Tall Structures", ["Germany Tall Structures", "Germany Tall Structures Extrusions"], "eu"],
    ["National Register of Historic Places", ["National Register of Historic Places"], "usa"],
];

export const categoryElements: Record<string, ReactElement> = {
    "OpenRailwayMap": <Source key={"OpenRailwayMap"} {...openRailwayMapSource}>
        <Layer key={"OpenRailwayMap"} {...openRailwayMapLayer} />
    </Source>,
    "Google StreetView": <Source key={"Google StreetView"} {...googleStreetviewSource}>
        <Layer key={"Google StreetView"} {...googleStreetviewLayer} />
    </Source>,
    "3D Buildings": <Source key={"3D Buildings"} {...threeDBuildingSource}>
        <Layer key={"3D Buildings"} {...threeDBuildingLayer} />
    </Source>,
    "Light Pollution": <Source key={"Light Pollution"} {...lightPollutionSource}>
        <Layer key={"Light Pollution"} {...lightPollutionLayer} />
    </Source>,
    "Long Lines": <Source key={"Long Lines"} {...longLinesSource}>
        <Layer key={"Long Lines"} {...longLinesLayer} />
    </Source>,
    "National Register of Historic Places": <Source key={"National Register of Historic Places"} {...nrhpSource}>
        <Layer key={"National Register of Historic Places"} {...nrhpLayer} />
    </Source>,
};

export const customCategoryElements = (catId: string, catSubLayers?: string[], customParameter?: any) => {
    switch (catId) {
        case "Parcel Ownership":
            return <Source key={"Parcel Ownership"} {...parcelOwnershipSource}>
                {catSubLayers.includes("Parcel Ownership") && <Layer key={"Parcel Ownership"} {...parcelOwnershipLayer} />}
                {catSubLayers.includes("Parcel Ownership Labels") && <Layer key={"Parcel Ownership Labels"} {...parcelOwnershipLabelLayer} />}
            </Source>
        case "FAA Obstacles":
            return <Source key={"FAA Obstacles"} {...faaObstaclesSource(customParameter)}>
                <Layer key={"FAA Obstacles"} {...faaObstaclesLayer} />
            </Source>
        case "All Towers":
            return <Fragment key={catId}>
                {catSubLayers.includes("All Towers") &&
                    // need to fix issue when customparameter is undefined it leads to errors in the console with bad formatted geojson
                    <Source key={"All Towers"} {...allTowersSource(customParameter?.allTowersPoints)}>
                        <Layer key={"All Towers"} {...allTowersLayer} />
                    </Source>
                }
                {catSubLayers.includes("All Towers Extrusions") &&
                    <Source key={"All Towers Extrusions"} {...allTowersExtrusionsSource(customParameter?.allTowersPolygons)}>
                        <Layer key={"All Towers Extrusions"} {...allTowersExtrusionsLayer} />
                    </Source>
                }
            </Fragment>
        case "Isochrone":
            return <Source key={"Isochrone"} {...isochroneSource(customParameter)}>
                <Layer key={"Isochrone"} {...isochroneLayer} />
            </Source>
        case "FLYGHINDER 2023":
            return <Fragment key={catId}>
                {catSubLayers.includes("FLYGHINDER 2023") && 
                    <Source key={"FLYGHINDER 2023"} {...flyghinderSource}>
                        <Layer key={"FLYGHINDER 2023"} {...flyghinderLayer} />
                    </Source>
                }
                {catSubLayers.includes("FLYGHINDER 2023 Extrusions") && 
                    <Source key={"FLYGHINDER 2023 Extrusions"} {...flyghinderExtrusionsSource}>
                        <Layer key={"FLYGHINDER 2023 Extrusions"} {...flyghinderExtrusionsLayer} />
                    </Source>
                }
            </Fragment>
        case "Germany Tall Structures":
            return <Fragment key={catId}>
                {catSubLayers.includes("Germany Tall Structures") && 
                    <Source key={"Germany Tall Structures"} {...germanyTallStructuresSource}>
                        <Layer key={"Germany Tall Structures"} {...germanyTallStructuresLayer} />
                    </Source>
                }
                {catSubLayers.includes("Germany Tall Structures Extrusions") && 
                    <Source key={"Germany Tall Structures Extrusions"} {...germanyTallStructuresExtrusionsSource}>
                        <Layer key={"Germany Tall Structures Extrusions"} {...germanyTallStructuresExtrusionsLayer} />
                    </Source>
                }
            </Fragment>
        default:
            break;
    }
}

export const getStoredRegularLayers = () => {
    const storedLayers = localStorage.getItem('selected-cats');
    if(storedLayers && storedLayers != 'undefined') {
        const newLayers: [string, string[]?][] = JSON.parse(storedLayers);
        // need to make a better dictionary or something for this because its not accurate right now
        return newLayers.filter(sl => (regularLayerCategoriesWithCountries.map(rl => rl[0]).includes(sl[0])));
    } else {
        return [];
    }
}