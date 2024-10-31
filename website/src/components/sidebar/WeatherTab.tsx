import React, { useState, useEffect } from "react";
import { useMap } from "react-map-gl";

import SunriseIcon from 'styles/images/sunrise_icon.svg?react';
import SunsetIcon from 'styles/images/sunset_icon.svg?react';
import SunnyIcon from 'styles/images/sunny.svg?react';
import ClockIcon from 'styles/images/clock.svg?react';
import PollingIcon from 'styles/images/polling_center.svg?react';
import ClockForwardIcon from 'styles/images/clock_forward.svg?react';

import FullMoonIcon from 'styles/images/full_moon.svg?react';
import WaningGibbousIcon from 'styles/images/waning_gibbous.svg?react';
import LastQuarterIcon from 'styles/images/last_quarter.svg?react';
import WaningCrescentIcon from 'styles/images/waning_crescent.svg?react';
import NewMoonIcon from 'styles/images/new_moon.svg?react';
import WaxingCrescentIcon from 'styles/images/waxing_crescent.svg?react';
import FirstQuarterIcon from 'styles/images/first_quarter.svg?react';
import WaxingGibbousIcon from 'styles/images/waxing_gibbous.svg?react';
import MoonriseIcon from 'styles/images/moonrise.svg?react';
import MoonsetIcon from 'styles/images/moonset.svg?react';
import MoonNoonIcon from 'styles/images/moon_noon.svg?react';

import { retrieveAstronomyData } from "services/message.service";
import { getSunburstData } from 'helpers/sunburst-helper';
import 'styles/components/sidebar.css';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

const WeatherTab = () => {
    const { atlas } = useMap();
    const [sunburstInfo, setSunburstInfo] = useState(null);
    const [sunburstToken, setSunburstToken] = useState(null);
    const [astronomyInfo, setAstronomyInfo] = useState(null);

    const [mapDatetime, setMapDatetime] = useState<dayjs.Dayjs>(dayjs());

    const [pollingPosition, setPollingPosition] = useState<number[]>([]);

    useEffect(() => {
        if (!(pollingPosition.length > 1)) return;

        retrieveAstronomyData(-(mapDatetime.utcOffset() / 60), mapDatetime.toISOString().split("T")[0], pollingPosition[1], pollingPosition[0]).then((data) => {
            setAstronomyInfo(data.data);
        });

        getSunburstData(pollingPosition[1], pollingPosition[0], mapDatetime.toISOString(), sunburstToken).then(({ data, token }) => {
            setSunburstToken(token);
            setSunburstInfo(data);
        });
    }, [pollingPosition, mapDatetime]);

    // need to update polling position when home is set
    // const { homePosition } = useContext(AtlasContext);
    // useEffect(() => {
    //     setPollingPosition(homePosition);
    // }, [homePosition])

    const setDateTimeToNow = () => {
        // if within 60 seconds, don't set to now
        if (Math.abs(mapDatetime.diff()) < 60000) return;
        setMapDatetime(dayjs());
    }

    const setPollingPositionAsCenter = () => {
        // if the polling position is ALREADY SET, check to see if the new polling position even warrants re polling data
        // if it is, then update the polling position
        if (pollingPosition[0] != null && pollingPosition[1] != null) {
            if (Math.abs(atlas.getCenter().lng - pollingPosition[0]) > .05 || Math.abs(atlas.getCenter().lat - pollingPosition[1]) > .05) {
                setPollingPosition([atlas.getCenter().lng, atlas.getCenter().lat]);
            }
        } else {
            setPollingPosition([atlas.getCenter().lng, atlas.getCenter().lat]);
        }
        // If the map is zoomed out too far to make sense to poll data, then zoom in
        if (atlas.getZoom() < 8.8) {
            atlas.flyTo({ center: atlas.getCenter(), zoom: 8.8 });
        }
    }

    const renderAstronomyInfo = () => {
        try {
            // sun info
            const sun_phenomena = astronomyInfo["properties"]["data"]["sundata"];
            const sunrise_utc = sun_phenomena.find(phen => phen["phen"] === "Rise");
            const sunset_utc = sun_phenomena.find(phen => phen["phen"] === "Set");
            const solar_noon_utc = sun_phenomena.find(phen => phen["phen"] === "Upper Transit");

            let sunrise_local;
            let sunset_local;
            let solar_noon_local;

            if (!sunrise_utc) {
                sunrise_local = "N/A"
            } else {
                sunrise_local = sunrise_utc["time"];
            }

            if (!sunset_utc) {
                sunset_local = "N/A"
            } else {
                sunset_local = sunset_utc["time"];
            }

            if (!solar_noon_utc) {
                solar_noon_local = "N/A"
            } else {
                solar_noon_local = solar_noon_utc["time"];
            }


            // moon info
            let current_phase = astronomyInfo["properties"]["data"]["curphase"];

            // ["properties"]["data"]["closestphase"] = {'day': 28, 'month': 10, 'phase': 'Full Moon', 'time': '20:24', 'year': 2023}
            // if closestphase is on the same date as map datetime, then use the current phase
            if (mapDatetime.date() === astronomyInfo["properties"]["data"]["closestphase"]["day"] && mapDatetime.month() + 1 === astronomyInfo["properties"]["data"]["closestphase"]["month"] && mapDatetime.year() === astronomyInfo["properties"]["data"]["closestphase"]["year"]) {
                current_phase = astronomyInfo["properties"]["data"]["closestphase"]["phase"];
            }

            const illumination = astronomyInfo["properties"]["data"]["fracillum"];

            const moon_phenomena = astronomyInfo["properties"]["data"]["moondata"];

            // any of the following may not exist within data
            const moonset = moon_phenomena.find(phen => phen["phen"] === "Set");
            const moonrise = moon_phenomena.find(phen => phen["phen"] === "Rise");
            const moonnoon = moon_phenomena.find(phen => phen["phen"] === "Upper Transit");

            let moonset_local;
            let moonrise_local;
            let moonnoon_local;

            if (!moonset) {
                moonset_local = "N/A"
            }
            else {
                moonset_local = moonset["time"];
            }

            if (!moonrise) {
                moonrise_local = "N/A"
            }
            else {
                moonrise_local = moonrise["time"];
            }

            if (!moonnoon) {
                moonnoon_local = "N/A"
            }
            else {
                moonnoon_local = moonnoon["time"];
            }

            let current_phase_icon;

            switch (current_phase) {
                case "New Moon":
                    current_phase_icon = <NewMoonIcon className="moon-phase-icon" />
                    break;
                case "Waxing Crescent":
                    current_phase_icon = <WaxingCrescentIcon className="moon-phase-icon" />
                    break;
                case "First Quarter":
                    current_phase_icon = <FirstQuarterIcon className="moon-phase-icon" />
                    break;
                case "Waxing Gibbous":
                    current_phase_icon = <WaxingGibbousIcon className="moon-phase-icon" />
                    break;
                case "Full Moon":
                    current_phase_icon = <FullMoonIcon className="moon-phase-icon" />
                    break;
                case "Waning Gibbous":
                    current_phase_icon = <WaningGibbousIcon className="moon-phase-icon" />
                    break;
                case "Last Quarter":
                    current_phase_icon = <LastQuarterIcon className="moon-phase-icon" />
                    break;
                case "Waning Crescent":
                    current_phase_icon = <WaningCrescentIcon className="moon-phase-icon" />
                    break;
                default:
                    current_phase_icon = <text id="moon-phase-error">Error retrieving moon phase data - check console for details.</text>
            }

            return (
                <div id="astronomy-segment">
                    <div id="sunrise-sunset-metrics">
                        <span>Sunrise/Sunset</span><br />
                        {renderSunsetSunriseInfo(sunrise_local, sunset_local, solar_noon_local)}
                    </div>

                    <div id="moon-phase-metrics">
                        <span>Moon Phase</span><br />
                        {current_phase_icon}<text id="moon-phase">{current_phase} ({illumination})</text><br />
                        <MoonriseIcon className="sunburst-sunrise-sunset-icon" /><text>Moonrise: {moonrise_local}</text><br />
                        <MoonNoonIcon className="sunburst-sunrise-sunset-icon" /><text>Moon Noon: {moonnoon_local}</text><br />
                        <MoonsetIcon className="sunburst-sunrise-sunset-icon" /><text>Moonset: {moonset_local}</text><br />
                    </div>
                </div>
            )
        } catch (e) {
            console.log("Error rendering moon info: " + e);
            return (
                <div id="moon-segment">
                    <div id="moon-phase-metrics">
                        <text id="moon-phase-error">Error retrieving moon phase data - check console for details.</text>
                    </div>
                </div>
            )
        }
    }

    const renderSunsetSunriseInfo = (sunrise_local, sunset_local, solar_noon_local) => {
        try {
            // if sunburst info is for sunset
            if (sunburstInfo["features"][0]["properties"]["type"] === "Sunset") {
                return (
                    <div id="sunrise-sunset-metrics">
                        <SunriseIcon className="sunburst-sunrise-sunset-icon" />
                        <text>Sunrise: {sunrise_local}</text>
                        <br />
                        <SunnyIcon className="sunburst-sunrise-sunset-icon" />
                        <text>Solar Noon: {solar_noon_local}</text>
                        <br />
                        <SunsetIcon className="sunburst-sunrise-sunset-icon" />
                        <text>Sunset: {sunset_local}</text>
                        {renderSunburstInfo()}
                        <br />
                    </div>
                )
            } else {
                return (
                    <div id="sunrise-sunset-metrics">
                        <SunriseIcon className="sunburst-sunrise-sunset-icon" />
                        <text>Sunrise: {sunrise_local}</text>
                        <br />
                        {renderSunburstInfo()}
                        <SunnyIcon className="sunburst-sunrise-sunset-icon" />
                        <text>Solar Noon: {solar_noon_local}</text>
                        <br />
                        <SunsetIcon className="sunburst-sunrise-sunset-icon" />
                        <text>Sunset: {sunset_local}</text>
                        <br />
                    </div>
                )
            }
        } catch (e) {
            console.log("Error rendering sunburst info: " + e);
            return (
                <div id="sunburst-segment">
                    <span>Sunrise/Sunset</span><br />
                    <SunriseIcon className="sunburst-sunrise-sunset-icon" />
                    <text>Sunrise: {sunrise_local}</text>
                    <br />
                    <SunnyIcon className="sunburst-sunrise-sunset-icon" />
                    <text>Solar Noon: {solar_noon_local}</text>
                    <br />
                    <SunsetIcon className="sunburst-sunrise-sunset-icon" />
                    <text>Sunset: {sunset_local}</text>
                    <br />
                    <text id="sunburst-sunrise-sunset-error">No sunburst data available - check console for details.</text>
                </div>
            )
        }
    }

    const renderSunburstInfo = () => {
        console.log("Sunburst info: " + JSON.stringify(sunburstInfo));

        // if the map datetime is more than 4 days in the future, or more than 1 day in the past, then don't render sunburst info
        if (mapDatetime > dayjs().add(4, "days") || mapDatetime < dayjs().subtract(1, "days")) {
            return (
                <div id="astronomy-segment">
                    <div id="sunburst-metrics">
                        <text id="sunburst-sunrise-sunset-error">Sunburst data not available for this datetime.</text>
                    </div>
                </div>
            )
        }

        try {
            const type = sunburstInfo["features"][0]["properties"]["type"];
            let twilight;
            if (type === "Sunrise") {
                twilight = "dawn";
            } else {
                twilight = "dusk";
            }
            const quality = sunburstInfo["features"][0]["properties"]["quality"];
            const quality_percent = sunburstInfo["features"][0]["properties"]["quality_percent"];

            const astro_time = new Date(Date.parse(sunburstInfo["features"][0]["properties"][twilight]["astronomical"])).toLocaleTimeString();
            const nautical_time = new Date(Date.parse(sunburstInfo["features"][0]["properties"][twilight]["nautical"])).toLocaleTimeString();
            const civil_time = new Date(Date.parse(sunburstInfo["features"][0]["properties"][twilight]["civil"])).toLocaleTimeString();

            let quality_color;
            if (quality_percent >= 75) {
                quality_color = "blue";
            }
            else if (quality_percent >= 50) {
                quality_color = "green";
            }
            else if (quality_percent >= 25) {
                quality_color = "#da9f00";
            }
            else {
                quality_color = "red";
            }

            // let SunriseSunsetIcon;
            // if (type === "Sunrise") {
            //     SunriseSunsetIcon = <SunriseIcon className="sunburst-sunrise-sunset-icon" />
            // }
            // else {
            //     SunriseSunsetIcon = <SunsetIcon className="sunburst-sunrise-sunset-icon" />
            // }

            return (
                <div id="sunburst-metrics">
                    {/*<text id="regular">Quality: </text><span style={{ color: quality_color }}>{quality} ({quality_percent}%)</span>*/}
                    <text id="sunburstquality">Quality:</text><text style={{ color: quality_color }}>{quality} ({quality_percent}%)</text>
                    <br />
                    <ClockIcon className="sunburst-clock-icon" /><text>{twilight.charAt(0).toUpperCase() + twilight.slice(1)}: </text><br />
                    <div style={{ marginLeft: "20px" }}>
                        <text>Civil: {civil_time}</text><br />
                        <text>Astronomical: {astro_time}</text><br />
                        <text>Nautical: {nautical_time}</text><br />
                    </div>
                </div>
            )
        } catch (e) {
            console.log("Error rendering sunburst info: " + e);
            return (
                <div id="sunburst-segment">
                    <div id="sunburst-metrics">
                        <text id="sunburst-sunrise-sunset-error">No sunburst data available - check console for details.</text>
                    </div>
                </div>
            )
        }
    }

    return (
        <div className="weather-container">
            <h1>WEATHER</h1>

            <div id="weather-controls">
                <div id="change-datetime-element">
                    <input
                        type="datetime-local"
                        id="datetime-input"
                        name="datetime-input"
                        required
                        value={dayjs(mapDatetime).format("YYYY-MM-DDTHH:mm:ss")}
                        onChange={e => {
                            // if it was cleared, or if the date is invalid, then don't update the map datetime
                            if (e.target.value === "") return;
                            setMapDatetime(dayjs(e.target.value));
                        }}
                    />
                </div>
                <div id="set-datetime-to-now-button">
                    <ClockForwardIcon className="clock-forward-icon" onClick={() => setDateTimeToNow()} />
                    <span>Set to now</span>
                </div>
                <div id="change-polling-position-button">
                    <PollingIcon className="polling-icon" onClick={() => setPollingPositionAsCenter()} />
                    <span>Set polling position</span>
                </div>
            </div>

            {pollingPosition && astronomyInfo && renderAstronomyInfo()}
        </div>
    )
};
export default WeatherTab;