import React, { useState } from "react";
import { PageLayout } from "../components/page-layout";
import Map  from "../components/map";
import 'mapbox-gl/dist/mapbox-gl.css';

import { useAuth0 } from "@auth0/auth0-react";
import {Navigate} from "react-router-dom";

export const MapPage = () => {
    const { getAccessTokenSilently } = useAuth0();
    // redirect to root if not authenticated
    const { isAuthenticated } = useAuth0();
    if (!isAuthenticated) {
        return <Navigate to="/" />;
    }
    return (
        <PageLayout>
            <Map accessToken={getAccessTokenSilently} />
        </PageLayout>
    );
};