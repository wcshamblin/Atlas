import React from 'react';
import {GoogleMap, LoadScript, StreetViewPanorama, StreetViewService} from '@react-google-maps/api';

export const GetStreetView = ({ streetViewPosition, setStreetViewPresent, setDisplayStreetView }) => {
    if (!streetViewPosition.length) {
        if (setDisplayStreetView) setDisplayStreetView(false);
        if (setStreetViewPresent) setStreetViewPresent(false);
        return null;
    }

    let lat = streetViewPosition[0];
    let lng = streetViewPosition[1];

    const onLoad = (streetViewService) => {
        streetViewService.getPanorama({
            location: { lat: lat, lng: lng },
            radius: 10,
        }, (data, status) => {
            if (status === "OK") {
                console.log("streetview available");
                setStreetViewPresent(true);
            } else {
                console.log("streetview not available");
                setStreetViewPresent(false);
                setDisplayStreetView(false);
            }
        });
    }

    return (
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
            <StreetViewService onLoad={onLoad} />
        </LoadScript>
    )
}

export const DisplayStreetViewDiv = ({ streetViewPosition, displayStreetView, setDisplayStreetView, setStreetViewPosition, setStreetViewPresent }) => {
    let lat = streetViewPosition[0];
    let lng = streetViewPosition[1];

    return (
        <>
            <div id="modal-background"></div>
            <div id="streetview" style={{ display: "block" }}>
                <GoogleMap
                    mapContainerStyle={{ height: "100%", width: "100%" }}
                    center={{ lat: lat, lng: lng }}
                    zoom={14}
                >
                    <StreetViewPanorama
                        position={{ lat: lat, lng: lng }}
                        visible={displayStreetView}
                        options={{
                            addressControl: true,
                            fullscreenControl: false,
                            linksControl: false,
                            motionTracking: false,
                            motionTrackingControl: false,
                            motionTrackingControlOptions: false,
                            panControl: true,
                            zoomControl: false,
                            enableCloseButton: false,
                            imageDateControl: true
                        }}
                        pov={{
                            heading: 0,
                            pitch: 0
                        }}
                    />
                </GoogleMap>
                <button id="closestreetview" onClick={() => {
                    setDisplayStreetView(false)
                    setStreetViewPosition([])
                    setStreetViewPresent(false)
                }}>X</button>
            </div>
        </>
    )
}

