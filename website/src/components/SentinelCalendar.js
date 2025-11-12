import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/components/sentinel-calendar.css';

/**
 * SentinelCalendar component
 * Displays a calendar with cloud cover information for Sentinel-2 imagery
 * Each date with available imagery is colored on a gradient from sky blue (0% clouds) to white (100% clouds)
 */
const SentinelCalendar = ({ value, onChange, map, onCloudCoverDataChange }) => {
    const [cloudCoverData, setCloudCoverData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [currentViewMonth, setCurrentViewMonth] = useState(null);
    const [currentViewYear, setCurrentViewYear] = useState(null);

    // Fetch cloud cover data when the calendar month changes or map moves significantly
    useEffect(() => {
        if (!map || !value) return;

        const viewDate = value;
        const month = viewDate.getMonth() + 1; // JavaScript months are 0-indexed
        const year = viewDate.getFullYear();

        // Only fetch if we haven't loaded this month yet
        if (currentViewMonth === month && currentViewYear === year) {
            return;
        }

        setCurrentViewMonth(month);
        setCurrentViewYear(year);
        fetchCloudCoverData(year, month);
    }, [value, map]);

    const fetchCloudCoverData = async (year, month) => {
        if (!map) return;

        setIsLoading(true);
        try {
            // Get the current map bounds
            const bounds = map.getBounds();
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            
            // Convert to Web Mercator (EPSG:3857) - approximate conversion
            const bbox = convertBoundsTo3857(sw.lng, sw.lat, ne.lng, ne.lat);
            const bboxStr = bbox.join(',');

            // Fetch metadata from API
            const response = await fetch(
                `https://atlas2.org/api/sentinel-metadata/${year}/${month}?bbox=${bboxStr}`
            );

            if (response.ok) {
                const data = await response.json();
                const dates = data.dates || {};
                setCloudCoverData(dates);
                // Notify parent of cloud cover data change
                if (onCloudCoverDataChange) {
                    onCloudCoverDataChange(dates);
                }
            } else {
                console.error('Failed to fetch Sentinel metadata:', response.statusText);
                setCloudCoverData({});
                if (onCloudCoverDataChange) {
                    onCloudCoverDataChange({});
                }
            }
        } catch (error) {
            console.error('Error fetching cloud cover data:', error);
            setCloudCoverData({});
            if (onCloudCoverDataChange) {
                onCloudCoverDataChange({});
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Approximate conversion from WGS84 to Web Mercator (EPSG:3857)
    const convertBoundsTo3857 = (minLng, minLat, maxLng, maxLat) => {
        const toWebMercator = (lng, lat) => {
            const x = lng * 20037508.34 / 180;
            let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
            y = y * 20037508.34 / 180;
            return [x, y];
        };

        const [minX, minY] = toWebMercator(minLng, minLat);
        const [maxX, maxY] = toWebMercator(maxLng, maxLat);

        return [minX, minY, maxX, maxY];
    };

    // Calculate background color based on cloud cover percentage
    // 0% cloud = sky blue (#87CEEB)
    // 100% cloud = light gray (#F0F0F0) - not pure white to remain visible
    const getCloudCoverColor = (cloudCover) => {
        if (cloudCover === undefined || cloudCover === null) {
            return null; // No data available
        }

        // Sky blue (0% clouds) to light gray (100% clouds)
        const skyBlue = { r: 135, g: 206, b: 235 }; // #87CEEB
        const lightGray = { r: 240, g: 240, b: 240 }; // #F0F0F0

        const ratio = cloudCover / 100;

        const r = Math.round(skyBlue.r + (lightGray.r - skyBlue.r) * ratio);
        const g = Math.round(skyBlue.g + (lightGray.g - skyBlue.g) * ratio);
        const b = Math.round(skyBlue.b + (lightGray.b - skyBlue.b) * ratio);

        return `rgb(${r}, ${g}, ${b})`;
    };

    // Custom tile rendering - apply cloud cover styling
    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return null;

        const dateStr = date.toISOString().split('T')[0];
        const cloudCover = cloudCoverData[dateStr];

        if (cloudCover !== undefined) {
            return 'has-sentinel-data';
        }

        return null;
    };

    // Custom tile content - show cloud cover color indicator
    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;

        const dateStr = date.toISOString().split('T')[0];
        const cloudCover = cloudCoverData[dateStr];

        if (cloudCover !== undefined) {
            const bgColor = getCloudCoverColor(cloudCover);
            return (
                <div 
                    className="sentinel-tile-indicator"
                    style={{ backgroundColor: bgColor }}
                    title={`${cloudCover.toFixed(1)}% cloud cover`}
                >
                </div>
            );
        }

        return null;
    };

    // Handle month navigation
    const onActiveStartDateChange = ({ activeStartDate, view }) => {
        if (view === 'month' && activeStartDate) {
            const month = activeStartDate.getMonth() + 1;
            const year = activeStartDate.getFullYear();
            
            if (currentViewMonth !== month || currentViewYear !== year) {
                setCurrentViewMonth(month);
                setCurrentViewYear(year);
                fetchCloudCoverData(year, month);
            }
        }
    };

    return (
        <div className="sentinel-calendar-container">
            <Calendar
                value={value}
                onChange={onChange}
                tileClassName={tileClassName}
                tileContent={tileContent}
                onActiveStartDateChange={onActiveStartDateChange}
                maxDate={new Date()} // Can't select future dates
                minDate={new Date(2015, 5, 23)} // Sentinel-2A launch date
                minDetail="decade" // Limit zoom out to decade view (removes century view)
            />
            {isLoading && (
                <div className="sentinel-calendar-loading">
                    Loading cloud cover data...
                </div>
            )}
            <div className="sentinel-calendar-legend">
                <span className="legend-title">Cloud Cover:</span>
                <div className="legend-gradient">
                    <span className="legend-label">0% (Clear)</span>
                    <div className="legend-bar"></div>
                    <span className="legend-label">100% (Cloudy)</span>
                </div>
            </div>
        </div>
    );
};

export default SentinelCalendar;

