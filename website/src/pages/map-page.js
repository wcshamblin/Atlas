import React, {useEffect, useState} from "react";
import { PageLayout } from "../components/page-layout";
import Map  from "../components/map";
import {Eula} from "../components/eula";
import 'mapbox-gl/dist/mapbox-gl.css';

import { useAuth0 } from "@auth0/auth0-react";
import {Navigate} from "react-router-dom";

import { retrieveEulaAcceptance } from "../services/message.service";
import { PageLoader } from "../components/page-loader";

export const MapPage = () => {
    const { getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
    // const [eulaAccepted, setEulaAccepted] = useState(null);
    const [eulaAccepted, setEulaAccepted] = useState(true); // Set to true to bypass EULA check

    // const checkEulaAcceptance = async () => {
    //     const accessToken = await getAccessTokenSilently();
    //     const eulaAccepted = await retrieveEulaAcceptance(accessToken);
    //     if(eulaAccepted.data)
    //         setEulaAccepted(eulaAccepted.data.accepted);
    // }

    // useEffect(() => {
    //     checkEulaAcceptance().then(r => console.log(r));
    // }, [])

    // Show loader while checking authentication
    if (isLoading) {
        return (
            <PageLayout>
                <PageLoader />
            </PageLayout>
        );
    }

    // Trigger login if not authenticated
    if (!isAuthenticated) {
        loginWithRedirect({
            appState: {
                returnTo: "/map"
            }
        });
        return (
            <PageLayout>
                <PageLoader />
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            {/* {eulaAccepted === null && (
                <PageLoader />
            )}
            {eulaAccepted === false && (
                <Eula />
            )} */}
            {eulaAccepted && (
                <Map accessToken={getAccessTokenSilently} />
            )}
        </PageLayout>
    );
};