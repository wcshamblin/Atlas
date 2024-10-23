import dayjs from "dayjs";

const retrieveSunburstToken = async () => {
    const query = await fetch(
        `https://sunburst.sunsetwx.com/v1/login`,
        {
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${btoa(`${import.meta.env.VITE_SUNBURST_API_EMAIL}:${import.meta.env.VITE_APP_SUNBURST_API_PASSWORD}`)}`
            },
            body: "grant_type=password&type=access"
        });

    const data = await query.json();
    return data.access_token;
    //setSunburstToken(data.access_token);
}

export const getSunburstData = async (lat, lng, after, token?: string) => {
    console.log(dayjs(Date.now()).toISOString)
    let bearerToken = token;
    if(!bearerToken) {
        bearerToken = await retrieveSunburstToken();
    }

    const query = await fetch(
        `https://sunburst.sunsetwx.com/v1/quality?geo=${lat},${lng}&after=${after}`,
        {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    //console.log("Sunburst retrieved data: ", data);
    return {
        data: await query.json(),
        token: bearerToken,
    };
}