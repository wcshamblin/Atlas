import React from "react";
import { PageLayout } from "../components/page-layout";
import Map  from "../components/map";
import 'mapbox-gl/dist/mapbox-gl.css';

export const MapPage = () => {
    return (
        <PageLayout>
            <Map />
        </PageLayout>
    );
};