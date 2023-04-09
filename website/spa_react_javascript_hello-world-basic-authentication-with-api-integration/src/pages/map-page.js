import React, { useState } from "react";
import { PageLayout } from "../components/page-layout";
import Map  from "../components/map";
import Sidebar from "../components/sidebar";
import 'mapbox-gl/dist/mapbox-gl.css';

import { useAuth0 } from "@auth0/auth0-react";

export const MapPage = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [displaySidebar, setDisplaySidebar] = useState(true);
    // only give access to the map if the user is authenticated
    const { isAuthenticated } = useAuth0();
    return (
        isAuthenticated && <PageLayout>
            <Map displaySidebar={displaySidebar} setDisplaySidebar={setDisplaySidebar} getAccessTokenSilently={getAccessTokenSilently} />
            {displaySidebar ? <Sidebar/> : ""}
        </PageLayout>
    );
};