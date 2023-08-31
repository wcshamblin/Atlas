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
    const { getAccessTokenSilently } = useAuth0();
    const [eulaAccepted, setEulaAccepted] = useState(null);
    const [pageContent, setPageContent] = useState(null);

    useEffect(() => {
        // if it's null, it's not ready yet
        if (eulaAccepted === null) {
            setPageContent(<PageLoader />);
        }

        if (eulaAccepted === false) {
            setPageContent(<Eula />);
        }

        // if it's true, it's accepted
        if (eulaAccepted) {
            setPageContent(<Map accessToken={getAccessTokenSilently} />);
        }
    }, [eulaAccepted]);


    const checkEulaAcceptance = async () => {
        const accessToken = await getAccessTokenSilently();
        const eulaAccepted = await retrieveEulaAcceptance(accessToken);
        setEulaAccepted(eulaAccepted.data.accepted);
    }

    checkEulaAcceptance().then(r => console.log(r));

    // redirect to root if not authenticated
    const { isAuthenticated } = useAuth0();
    if (!isAuthenticated) {
        return <Navigate to="/" />;
    }

    return (
        <PageLayout>
            {pageContent}
        </PageLayout>
    );
};