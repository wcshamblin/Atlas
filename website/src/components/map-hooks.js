// Custom hooks for map data fetching and API calls
import mapboxgl from 'mapbox-gl';

// Routing API
export async function setRoute(homeMarkerPosition, end, isoProfile, setRoutingDuration, setRoutingDistance, setRoutingLine) {
    const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${isoProfile}/${homeMarkerPosition[0]},${homeMarkerPosition[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
    );
    const json = await query.json();
    const data = json.routes[0];
    const route = data.geometry.coordinates;
    let duration = data.duration;

    setRoutingDuration(Math.round(duration / 60));
    setRoutingDistance((data.distance / 1609.344).toFixed(1));
    setRoutingLine(route);
}

// Isochrone API
export async function getIso(homeMarkerPosition, settings) {
    const query = await fetch(
        `https://dev.virtualearth.net/REST/v1/Routes/Isochrones?waypoint=${homeMarkerPosition[1]},${homeMarkerPosition[0]}&maxTime=${settings["isoMinutes"] * 60}&travelMode=${settings["isoProfile"]}&key=${process.env.REACT_APP_BING_MAPS_API_KEY}`,
        {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        }
    );
    let data = await query.json();
    let coordinates = data.resourceSets[0].resources[0].polygons[0].coordinates;
    coordinates = coordinates.map((coordinate) => {
        return coordinate.map((point) => {
            return [point[1], point[0]];
        })
    })

    data = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": coordinates
                }
            }
        ]
    }
    return data;
}

// Sunburst API
export async function retrieveSunburstToken() {
    const query = await fetch(
        `https://sunburst.sunsetwx.com/v1/login`,
        {
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${btoa(`${process.env.REACT_APP_SUNBURST_API_EMAIL}:${process.env.REACT_APP_SUNBURST_API_PASSWORD}`)}`
            },
            body: "grant_type=password&type=access"
        });

    const data = await query.json();
    return data.access_token;
}

export async function getSunburstData(lat, lng, after, token) {
    const query = await fetch(
        `https://sunburst.sunsetwx.com/v1/quality?geo=${lat},${lng}&after=${after}`,
        {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    const data = await query.json();
    console.log("Sunburst retrieved data: ", data);
    return data;
}

// Weather API
export async function getWeatherInfo(lat, lng, datetime) {
    let weatherToken = process.env.REACT_APP_WEATHER_API_TOKEN;

    let query = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&dt=${datetime}&appid=${weatherToken}`,
        {
            method: 'GET',
        }
    );

    let data = await query.json();
    console.log("Weather retrieved data: ", data);
    return data;
}

