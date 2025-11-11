// Map event handlers for various layer clicks
import mapboxgl from 'mapbox-gl';

export const setupFlyghinder2023Handler = (mapbox) => {
    mapbox.on('click', 'FLYGHINDER 2023', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        coordinates[0] = coordinates[0].toFixed(6);
        coordinates[1] = coordinates[1].toFixed(6);
        const name = e.features[0].properties.designation;
        const number = e.features[0].properties.number;
        const height_feet = e.features[0].properties.height_feet;
        const height_meters = e.features[0].properties.height_meters;
        const elevation_feet = e.features[0].properties.elevation_feet;
        const elevation_meters = e.features[0].properties.elevation_meters;
        const types_of_obstacles = e.features[0].properties.types_of_obstacles;
        

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML("<text id='towerpopuptitle'>" + name + " n:" + number + "</text>" +
                "<text id='towerpopuptext'>Height: " + height_meters + "m (" + height_feet + "ft)<br>" +
                "Elevation: " + elevation_meters + "m (" + elevation_feet + "ft)<br>" +
                "Types of obstacles: " + types_of_obstacles + "</text>" +
                "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
            .addTo(mapbox);
    });
    
    mapbox.on('mouseenter', 'FLYGHINDER 2023', () => {
        mapbox.getCanvas().style.cursor = 'pointer';
    });
    mapbox.on('mouseleave', 'FLYGHINDER 2023', () => {
        mapbox.getCanvas().style.cursor = '';
    });
};

export const setupGermanyTallStructuresHandler = (mapbox) => {
    mapbox.on('click', 'Germany Tall Structures', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        coordinates[0] = coordinates[0].toFixed(6);
        coordinates[1] = coordinates[1].toFixed(6);
        const name = e.features[0].properties.name;
        const height_feet = e.features[0].properties.height_feet;
        const height_meters = e.features[0].properties.height_meters;
        const year = e.features[0].properties.year;
        const type = e.features[0].properties.type;
        const regards = e.features[0].properties.regards;


        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML("<text id='towerpopuptitle'>" + name + "</text>" +
                "<text id='towerpopuptext'>Height: " + height_meters + "m (" + height_feet + "ft)<br>" +
                "Type: " + type + "<br>" +
                (year ? "Constructed in " + year + "<br>" : "") +
                regards + "</text>" +
                "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
            .addTo(mapbox);
    });

    mapbox.on('mouseenter', 'Germany Tall Structures', () => {
        mapbox.getCanvas().style.cursor = 'pointer';
    });
    mapbox.on('mouseleave', 'Germany Tall Structures', () => {
        mapbox.getCanvas().style.cursor = '';
    });
};

export const setupLongLinesHandler = (mapbox) => {
    mapbox.on('click', 'Long Lines', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        coordinates[0] = coordinates[0].toFixed(6);
        coordinates[1] = coordinates[1].toFixed(6);
        const name = e.features[0].properties.Name;
        const description = e.features[0].properties.description;
        const type = e.features[0].properties.type;

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(
                "<text id='towerpopuptitle'>Long Lines: " + name + "</text>" +
                "<text id='towerpopuptext'>" + description + "</text>" +
                "<text id='towerpopupstat'>Type: " + type + "</text>" +
                "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
            .addTo(mapbox);
    });

    mapbox.on('mouseenter', 'Long Lines', () => {
        mapbox.getCanvas().style.cursor = 'pointer';
    });
    mapbox.on('mouseleave', 'Long Lines', () => {
        mapbox.getCanvas().style.cursor = '';
    });
};

export const setupNRHPHandler = (mapbox) => {
    mapbox.on('click', 'National Register of Historic Places', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        coordinates[0] = coordinates[0].toFixed(6);
        coordinates[1] = coordinates[1].toFixed(6);
        const name = e.features[0].properties.name;
        const type = e.features[0].properties.type;
        const src_date = e.features[0].properties.src_date;

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(
                "<text id='towerpopuptitle'>" + name + "</text>" +
                "<text id='towerpopuptext'>Type: " + type + "</text>" +
                "<text id='towerpopupstat'>Source date: " + src_date + "</text>" +
                "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
            .addTo(mapbox);
    });

    mapbox.on('mouseenter', 'National Register of Historic Places', () => {
        mapbox.getCanvas().style.cursor = 'pointer';
    });

    mapbox.on('mouseleave', 'National Register of Historic Places', () => {
        mapbox.getCanvas().style.cursor = '';
    });
};

export const setupAllTowersHandler = (mapbox) => {
    mapbox.on('click', 'All Towers', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        coordinates[0] = coordinates[0].toFixed(6);
        coordinates[1] = coordinates[1].toFixed(6);
        const name = e.features[0].properties.name;
        const overall_height = (e.features[0].properties.overall_height * 3.28084).toFixed(2);
        const support_height = (e.features[0].properties.height_support * 3.28084).toFixed(2);
        const structure_type = e.features[0].properties.structure_type;
        const description = "Overall height: " + overall_height + " ft" + "<br>" + "Support height: " + support_height + " ft";


        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(
                "<text id='towerpopuptitle'>Tower: " + name + "</text>" +
                "<text id='towerpopuptext'>" + description + "<br>" +
                "Structure type: " + structure_type + "</text>" +
                "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
            .addTo(mapbox);
    });
};

export const setupAntennasHandler = (mapbox) => {
    mapbox.on('click', 'Antennas', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        coordinates[0] = coordinates[0].toFixed(6);
        coordinates[1] = coordinates[1].toFixed(6);
        const name = e.features[0].properties.name;
        const transmitter_type = e.features[0].properties.transmitter_type;
        const facility_id = e.features[0].properties.facility_id;
        const erp = e.features[0].properties.erp;
        const status = e.features[0].properties.status;
        const last_update = e.features[0].properties.last_update;
        let description = "";

        if (transmitter_type === "TV") {
            description = "Transmitter type: " + transmitter_type + "<br>" +
                "Facility ID: " + facility_id + "<br>" +
                "Status: " + status + "<br>" +
                "Channel: " + e.features[0].properties.channel + "<br>" +
                "ERP: " + erp + " kW" + "<br>" +
                "Polarization: " + e.features[0].properties.polarization + "<br>" +
                "Height AGL: " + e.features[0].properties.height_agl + " ft" + "<br>" +
                "Safe zone controlled: " + e.features[0].properties.safe_distance_controlled_feet + " ft" + "<br>" +
                "Safe zone uncontrolled: " + e.features[0].properties.safe_distance_uncontrolled_feet + " ft" + "<br>" +
                "RabbitEars: " + "<a id='rabbitearslink' target=_blank href='" + e.features[0].properties.RabbitEars + "'>" + facility_id + "</a>" + "<br>" +
                "Last updated: " + last_update;
        } else if (transmitter_type === "FM") {
            description = "Transmitter type: " + transmitter_type + "<br>" +
                "Facility ID: " + facility_id + "<br>" +
                "Status: " + status + "<br>" +
                "Channel: " + e.features[0].properties.channel + "<br>" +
                "ERP: " + erp + " kW" + "<br>" +
                "Polarization: " + e.features[0].properties.polarization + "<br>" +
                "Height AGL: " + e.features[0].properties.height_agl + " ft" + "<br>" +
                "Safe zone controlled: " + e.features[0].properties.safe_distance_controlled_feet + " ft" + "<br>" +
                "Safe zone uncontrolled: " + e.features[0].properties.safe_distance_uncontrolled_feet + " ft" + "<br>" +
                "Last updated: " + last_update;
        } else if (transmitter_type === "AM") {
            description = "Transmitter type: " + transmitter_type + "<br>" +
                "Application ID: " + facility_id + "<br>" +
                "Status: " + status + "<br>" +
                "Nominal power: " + erp + " kW" + "<br>" +
                "Hours of operation: " + e.features[0].properties.hours_operation + "<br>" +
                "Towers in array: " + e.features[0].properties.towers_in_array + "<br>" +
                "Safe zone controlled: 🕱" + "<br>" +
                "Safe zone uncontrolled: 🕱" + "<br>" +
                "Last updated: " + last_update;
        } else if (e.features[0].properties.data_type === "ULS") {
            description = "Transmitter type: " + transmitter_type + "<br>" +
                "Call Sign: " + facility_id;
        }


        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(
                "<text id='towerpopuptitle'>Antenna: " + name + "</text>" +
                "<text id='towerpopuptext'>" + description + "</text>" +
                "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
            .addTo(mapbox);
    });
};

export const setupFAAObstaclesHandler = (mapbox) => {
    mapbox.on('click', 'FAA Obstacles', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        coordinates[0] = coordinates[0].toFixed(6);
        coordinates[1] = coordinates[1].toFixed(6);
        const oas_number = e.features[0].properties.oas_number;
        const type_code = e.features[0].properties.type_code;
        const agl = e.features[0].properties.agl;
        const amsl = e.features[0].properties.amsl;
        const lighting = e.features[0].properties.lighting;
        const marking = e.features[0].properties.marking;
        const study = e.features[0].properties.study;
        const date = e.features[0].properties.date;

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(
                "<text id='towerpopuptitle'>FAA Obstacle: " + oas_number + "</text>" +
                "<text id='towerpopuptext'>Type: " + type_code + "<br>" +
                "AGL: " + agl + " ft" + "<br>" +
                "AMSL: " + amsl + " ft" + "<br>" +
                "Lighting: " + lighting + "<br>" +
                "Marking: " + marking + "<br>" +
                "Study: " + study + "<br>" +
                "Date: " + date + "</text>" +
                "<text id='popupcoords'>" + coordinates[1] + ", " + coordinates[0] + "</text>")
            .addTo(mapbox);
    });
};

export const setupMapClickHandler = (mapbox, mobileAndTabletCheck, setDisplaySidebar, setStreetViewPosition, setDisplayStreetView) => {
    mapbox.on('click', (e) => {
        let lat = e.lngLat.lat;
        let lng = e.lngLat.lng;
        console.log("Left click at: " + lat + ", " + lng);

        if (mobileAndTabletCheck()) {
            setDisplaySidebar(false);
        }

        if (mapbox.getLayoutProperty('Google StreetView', 'visibility') === 'visible' && mapbox.getZoom() >= 14) {
            setStreetViewPosition([lat, lng]);
            setDisplayStreetView(true);
        }
    });
};

export const setupMobileContextMenu = (mapbox, setRightClickPopupPosition, setShowRightClickPopup, setRightClickPopupState) => {
    let iosTimeout = null;
    let clearIosTimeout = () => { clearTimeout(iosTimeout); };

    mapbox.on('touchstart', (e) => {
        if (e.originalEvent.touches.length > 1) {
            return;
        }
        iosTimeout = setTimeout(() => {
            setRightClickPopupPosition([e.lngLat.lng, e.lngLat.lat])
            setShowRightClickPopup(true);
            setRightClickPopupState("default");
        }, 250);
    });
    mapbox.on('touchend', clearIosTimeout);
    mapbox.on('touchcancel', clearIosTimeout);
    mapbox.on('touchmove', clearIosTimeout);
    mapbox.on('pointerdrag', clearIosTimeout);
    mapbox.on('pointermove', clearIosTimeout);
    mapbox.on('moveend', clearIosTimeout);
    mapbox.on('gesturestart', clearIosTimeout);
    mapbox.on('gesturechange', clearIosTimeout);
    mapbox.on('gestureend', clearIosTimeout);
};

export const setupAllEventHandlers = (
    mapbox,
    mobileAndTabletCheck,
    setDisplaySidebar,
    setStreetViewPosition,
    setDisplayStreetView,
    setRightClickPopupPosition,
    setShowRightClickPopup,
    setRightClickPopupState
) => {
    setupFlyghinder2023Handler(mapbox);
    setupGermanyTallStructuresHandler(mapbox);
    setupLongLinesHandler(mapbox);
    setupNRHPHandler(mapbox);
    setupAllTowersHandler(mapbox);
    setupAntennasHandler(mapbox);
    setupFAAObstaclesHandler(mapbox);
    setupMapClickHandler(mapbox, mobileAndTabletCheck, setDisplaySidebar, setStreetViewPosition, setDisplayStreetView);
    
    if (mobileAndTabletCheck()) {
        setupMobileContextMenu(mapbox, setRightClickPopupPosition, setShowRightClickPopup, setRightClickPopupState);
    } else {
        mapbox.on('contextmenu', (e) => {
            setRightClickPopupPosition([e.lngLat.lng, e.lngLat.lat])
            setShowRightClickPopup(true);
            setRightClickPopupState("default");
        });
    }
};

