export const getWeatherInfo = async (lat, lng, datetime) => {
    let weatherToken = import.meta.env.VITE_APP_WEATHER_API_TOKEN;

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