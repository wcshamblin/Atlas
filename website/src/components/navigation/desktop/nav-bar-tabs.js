import { useAuth0 } from "@auth0/auth0-react";
import React from "react";
import { NavBarTab } from "./nav-bar-tab";

export const NavBarTabs = () => {
  const { isAuthenticated } = useAuth0();

  return (
    <div className="nav-bar__tabs">
      {isAuthenticated && (
        <>
          <NavBarTab path="/map" label="Map" />
          <NavBarTab path="https://discord.gg/zvvRuDebSK" label="Our Discord" />
        </>
      )}
    </div>
  );
};
