import React from "react";
import { Route, Routes } from "react-router-dom";
import { AuthenticationGuard } from "./components/AuthenticationGuard";
import { CallbackPage } from "./components/CallbackPage";
import { HeroBanner } from "./components/HeroBanner";
import { Profile } from "./components/Profile";
import { NavBar } from "./components/NavBar";
import { MobileNavBar } from "./components/MobileNavBar";
import Map from './components/Map';
import MapPage from './components/MapPage';

export const App = () => {
  return (
    <div className="page-layout">
      <NavBar /> 
      <MobileNavBar />
      <div className="page-layout__content">
        <Routes>
          <Route path="/" element={<HeroBanner />} />
          <Route
            path="/profile"
            element={<AuthenticationGuard Component={Profile} />}
          />
          <Route
            path="/map"
            element={<AuthenticationGuard Component={MapPage} eulaRequired />}
          />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="*" element={
            <div className="content-layout">
              <h1 id="page-title" className="content__title">
                Not Found
              </h1>
            </div>}
          />
        </Routes>
      </div>
    </div>
  );
};
