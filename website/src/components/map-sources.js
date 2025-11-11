// Map sources and layers configuration

export const addMapSources = (mapbox, allTowersPoints, allTowerPolygons, antennaPoints, obstaclePoints, routingLine, towerRenderZoomLevel, towerExtrusionRenderZoomLevel, antennaRenderZoomLevel) => {
    mapbox.addSource('Google Hybrid', {
        'type': 'raster',
        'tiles': [
            'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        ],
        'tileSize': 256
    });

    mapbox.addSource('Bing Hybrid', {
        'type': 'raster',
        'tiles': [
            'https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
            'https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
            'https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
            'https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z'
        ],
        'tileSize': 256,
        'maxzoom': 20
    });

    mapbox.addSource('ESRI', {
        'type': 'raster',
        'tiles': [
            'https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/{z}/{y}/{x}?blankTile=false',
            'https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/{z}/{y}/{x}?blankTile=false',
            'https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/{z}/{y}/{x}?blankTile=false'
        ],
        'tileSize': 256,
        'maxzoom': 20
    });
    
    mapbox.addSource('ESRI (2014)', {
        'type': 'raster',
        'tiles': [
            'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false',
            'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false',
            'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false'
        ],
        'tileSize': 256,
        'maxzoom': 20
    });

    mapbox.addSource('Mapbox', {
        'type': 'raster',
        'tiles': [
            'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=' + process.env.REACT_APP_MAPBOX_API_KEY
        ],
        'tileSize': 256,
        'maxzoom': 20
    });

    mapbox.addSource('Lantmäteriet', {
        'type': 'raster',
        'tiles': [
            'https://minkarta.lantmateriet.se/map/ortofoto?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=Ortofoto_0.5%2COrtofoto_0.4%2COrtofoto_0.25%2COrtofoto_0.16&TILED=true&STYLES=&WIDTH=256&HEIGHT=256&SRS=EPSG%3A3857&BBOX={bbox-epsg-3857}'
        ],
        'tileSize': 256,
        'maxzoom': 20
    });

    
    mapbox.addSource('OpenStreetMap', {
        'type': 'raster',
        'tiles': [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        'tileSize': 256
    });

    mapbox.addSource('NAIP', {
        'type': 'raster',
        'tiles': [
            'https://gis.apfo.usda.gov/arcgis/rest/services/NAIP/USDA_CONUS_PRIME/ImageServer/tile/{z}/{y}/{x}'
        ],
        'tileSize': 256
    });

    mapbox.addSource('VFR', {
        'type': 'raster',
        'tiles': [
            'https://atlas2.org/api/vfr/{z}/{x}/{y}.png'
        ],
        'tileSize': 256
    });

    mapbox.addSource('MAXAR', {
        'type': 'raster',
        'tiles': [
            'https://maps.hereapi.com/v3/background/mc/{z}/{x}/{y}/png?size=512&style=explore.satellite.day&apiKey=' + process.env.REACT_APP_HERE_API_KEY
        ],
        'tileSize': 512
    });

    mapbox.addSource('USGS Topo', {
        'type': 'raster',
        'tiles': [
            'https://caltopo.s3.amazonaws.com/topo/{z}/{x}/{y}.png'
        ],
        'tileSize': 256
    });

    mapbox.addSource('Sentinel 2-L2A', {
        'type': 'raster',
        'tiles': [
            'https://atlas2.org/api/sentinel/{bbox-epsg-3857}.png'
        ],
        'tileSize': 256,
        'maxzoom': 18
    });

    mapbox.addSource("Skoterleder", {
        'type': 'raster',
        'tiles': [
            'https://atlas2.org/api/skoterleder/{z}/{x}/{y}.png'
        ],
        'tileSize': 256,
        'maxzoom': 14
    });
    mapbox.addLayer({
        'id': 'Skoterleder',
        'type': 'raster',
        'source': 'Skoterleder',
        'paint': {}
    });

    mapbox.addSource("Light Pollution", {
        'type': 'raster',
        'tiles': [
            'https://djlorenz.github.io/astronomy/lp2022/overlay/tiles/tile_{z}_{x}_{y}.png'
        ],
        'tileSize': 1024,
        'maxzoom': 6
    });
    mapbox.addLayer({
        'id': 'Light Pollution',
        'type': 'raster',
        'source': 'Light Pollution',
        'paint': {
            'raster-opacity': 0.4
        }
    });

    mapbox.addSource('Parcel ownership', {
        'type': 'vector',
        'tiles': [
            'https://atlas2.org/api/parcel/{z}/{x}/{y}'
        ],
        'minzoom': 12,
        'maxzoom': 18
    });
    
    mapbox.addLayer({
        'id': 'Parcel ownership',
        'type': 'line',
        'source': 'Parcel ownership',
        'source-layer': 'parcels',
        'paint': {
            'line-color': '#00a97d',
            'line-width': 1,
        }
    });
    
    mapbox.addLayer({
        'id': 'Parcel ownership labels',
        'type': 'symbol',
        'source': 'Parcel ownership',
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
        'minzoom': 14
    });

    // all towers source
    mapbox.addSource('All Towers', {
        'type': 'geojson',
        'data': allTowersPoints
    });

    mapbox.on('mouseenter', 'All Towers', () => {
        mapbox.getCanvas().style.cursor = 'pointer';
    });
    mapbox.on('mouseleave', 'All Towers', () => {
        mapbox.getCanvas().style.cursor = '';
    });

    mapbox.loadImage('https://i.imgur.com/qfS0mnq.png', (error, image) => {
        if (error) throw error;
        mapbox.addImage('tower-icon', image, { sdf: true });
    });

    mapbox.addLayer({
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
    });

    // all towers extrusion source
    mapbox.addSource('All Tower Extrusions', {
        'type': 'geojson',
        'data': allTowerPolygons
    });

    mapbox.addLayer({
        'id': 'All Tower Extrusions',
        'type': 'fill-extrusion',
        'source': 'All Tower Extrusions',
        'minzoom': towerExtrusionRenderZoomLevel,
        'paint': {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'overall_height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.8
        }
    });

    // antennas source
    mapbox.addSource('Antennas', {
        'type': 'geojson',
        'data': antennaPoints
    });

    mapbox.on('mouseenter', 'Antennas', () => {
        mapbox.getCanvas().style.cursor = 'pointer';
    });
    mapbox.on('mouseleave', 'Antennas', () => {
        mapbox.getCanvas().style.cursor = '';
    });

    mapbox.loadImage('https://i.imgur.com/s2Wgdgx.png', (error, image) => {
        if (error) throw error;
        mapbox.addImage('transmitter-icon', image, { sdf: true });
    });

    mapbox.addLayer({
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
    });

    // obstacles source
    mapbox.addSource('FAA Obstacles', {
        'type': 'geojson',
        'data': obstaclePoints
    });

    mapbox.on('mouseenter', 'FAA Obstacles', () => {
        mapbox.getCanvas().style.cursor = 'pointer';
    });

    mapbox.on('mouseleave', 'FAA Obstacles', () => {
        mapbox.getCanvas().style.cursor = '';
    });

    mapbox.loadImage('https://i.imgur.com/kFZOjAw.png', (error, image) => {
        if (error) throw error;
        mapbox.addImage('obstacle-icon', image, { sdf: true });
    });

    mapbox.addLayer({
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
    });

    // routing source
    mapbox.addSource('Routing', {
        'type': 'geojson',
        'data': routingLine
    });

    mapbox.addLayer({
        id: 'Routing',
        type: 'line',
        source: 'Routing',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#33ac3d',
            'line-width': 10,
            'line-opacity': 0.75
        }
    });

    // add long lines 
    let long_lines = require('./long-lines.geojson');
    mapbox.addSource('Long Lines', {
        'type': 'geojson',
        'data': long_lines
    });

    mapbox.addLayer({
        'id': 'Long Lines',
        'type': 'circle',
        'source': 'Long Lines',
        'paint': {
            'circle-radius': 6,
            'circle-color': ['get', 'color'],
        }
    });

    // add FLYGHINDER
    let flyghinder = require('./flyghinder.geojson');
    mapbox.addSource('FLYGHINDER 2023', {
        'type': 'geojson',
        'data': flyghinder
    });

    mapbox.addLayer({
        'id': 'FLYGHINDER 2023',
        'type': 'circle',
        'source': 'FLYGHINDER 2023',
        'paint': {
            'circle-radius': 6,
            'circle-color': '#62b031',
        }
    });
    
    // add FLYGHINDER extrusions
    let flyghinder_extrusions = require('./flyghinder_polygons.geojson');
    mapbox.addSource('FLYGHINDER 2023 Extrusions', {
        'type': 'geojson',
        'data': flyghinder_extrusions
    });

    mapbox.addLayer({
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
    });

    // add germany tallest objects
    let germany_tallest = require('./germany_tall_structures.geojson');
    mapbox.addSource('Germany Tall Structures', {
        'type': 'geojson',
        'data': germany_tallest
    });

    mapbox.addLayer({
        'id': 'Germany Tall Structures',
        'type': 'circle',
        'source': 'Germany Tall Structures',
        'paint': {
            'circle-radius': 6,
            'circle-color': '#62b031',
        }
    });

    // add germany tallest objects extrusions
    let germany_tallest_extrusions = require('./germany_tall_structures_polygons.geojson');
    mapbox.addSource('Germany Tall Structures Extrusions', {
        'type': 'geojson',
        'data': germany_tallest_extrusions
    });

    mapbox.addLayer({
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
    });

    // add National Register Of Historic Places (NRHP)
    let nrhp = require('./nrhp.geojson');
    mapbox.addSource('National Register of Historic Places', {
        'type': 'geojson',
        'data': nrhp
    });

    mapbox.addLayer({
        'id': 'National Register of Historic Places',
        'type': 'circle',
        'source': 'National Register of Historic Places',
        'paint': {
            'circle-radius': 6,
            'circle-color': ['get', 'color'],
        }
    });

    // google street view overlay
    mapbox.addSource('Google StreetView', {
        'type': 'raster',
        'tiles': [
            'https://mts2.google.com/mapslt?lyrs=svv&x={x}&y={y}&z={z}&w=256&h=256&hl=en&style=40,18'
        ],
        'tileSize': 256,
        'minzoom': 15
    });

    // 3d buildings layer
    mapbox.addLayer(
        {
            'id': '3D Buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 12,
            'paint': {
                'fill-extrusion-color': '#404040',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.87
            }
        },
    );

    // openRailwayMap source
    mapbox.addSource('OpenRailwayMap', {
        'type': 'raster',
        'tiles': [
            'https://a.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
            'https://b.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
            'https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png'
        ],
        'tileSize': 512,
        'minzoom': 2,
        'maxzoom': 19
    });

    mapbox.addLayer(
        {
            'id': 'OpenRailwayMap',
            'type': 'raster',
            'source': 'OpenRailwayMap',
            'paint': {}
        },
    );

    // isochrone source
    mapbox.addSource('Isochrone', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': []
        }
    });

    mapbox.addLayer({
        'id': 'Google StreetView',
        'type': 'raster',
        'source': 'Google StreetView',
        'paint': {}
    });

    mapbox.addLayer(
        {
            'id': 'Google Hybrid',
            'type': 'raster',
            'source': 'Google Hybrid',
            'paint': {}
        },
    );

    mapbox.addLayer(
        {
            'id': 'Bing Hybrid',
            'type': 'raster',
            'source': 'Bing Hybrid',
            'paint': {}
        },
    );

    mapbox.addLayer(
        {
            'id': 'ESRI',
            'type': 'raster',
            'source': 'ESRI',
            'paint': {}
        },
    );

    mapbox.addLayer(
        {
            'id': 'ESRI (2014)',
            'type': 'raster',
            'source': 'ESRI (2014)',
            'paint': {}
        },
    );

    mapbox.addLayer(
        {
            'id': 'Mapbox',
            'type': 'raster',
            'source': 'Mapbox',
            'paint': {}
        },
    );

    mapbox.addLayer(
        {
            'id': 'Lantmäteriet',
            'type': 'raster',
            'source': 'Lantmäteriet',
            'paint': {}
        },
    );

    mapbox.addLayer(
        {
            'id': 'OpenStreetMap',
            'type': 'raster',
            'source': 'OpenStreetMap',
            'paint': {}
        },
    );

    mapbox.addLayer(
        {
            'id': 'NAIP',
            'type': 'raster',
            'source': 'NAIP',
            'paint': {}
        },
    );

    mapbox.addLayer(
        {
            'id': 'VFR',
            'type': 'raster',
            'source': 'VFR',
            'paint': {}
        },
    );

    mapbox.addLayer(
        {
            'id': 'MAXAR',
            'type': 'raster',
            'source': 'MAXAR',
            'paint': {}
        },
    );

    mapbox.addLayer(
        {
            'id': 'USGS Topo',
            'type': 'raster',
            'source': 'USGS Topo',
            'paint': {}
        },
    );

    mapbox.addLayer(
        {
            'id': 'Sentinel 2-L2A',
            'type': 'raster',
            'source': 'Sentinel 2-L2A',
            'paint': {}
        }
    )

    mapbox.addLayer(
        {
            'id': 'Isochrone',
            'type': 'fill',
            'source': 'Isochrone',
            'paint': {
                'fill-color': '#5a3fc0',
                'fill-opacity': 0.3
            }
        },
    );

    // layer hierarchies
    mapbox.moveLayer('Isochrone');
    mapbox.moveLayer('Google StreetView');
    mapbox.moveLayer('All Towers');
    mapbox.moveLayer('Light Pollution');
    mapbox.moveLayer('Antennas');
    mapbox.moveLayer('Routing');
    mapbox.moveLayer('OpenRailwayMap');
    mapbox.moveLayer('Parcel ownership');
    mapbox.moveLayer('Parcel ownership labels');
}

