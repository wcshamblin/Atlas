import React from "react";
import { PageLayout } from "../components/page-layout";
import Map  from "../components/map";
import 'mapbox-gl/dist/mapbox-gl.css';

import { useAuth0 } from "@auth0/auth0-react";

export const MapPage = () => {
    const { getAccessTokenSilently } = useAuth0();
    // only give access to the map if the user is authenticated
    const { isAuthenticated } = useAuth0();
    return (
        <PageLayout>
            {isAuthenticated && <Map getAccessTokenSilently={getAccessTokenSilently} />}
        </PageLayout>
    );
};