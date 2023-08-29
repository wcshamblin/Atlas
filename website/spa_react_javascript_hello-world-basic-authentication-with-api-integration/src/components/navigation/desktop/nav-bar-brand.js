import React from "react";
import { NavLink } from "react-router-dom";

export const NavBarBrand = () => {
  return (
    <div className="nav-bar__brand">
      <NavLink to="/">
        <img
          className="nav-bar__logo"
          src="https://i.imgur.com/IJiZS4x.png"
          alt="Atlas"
          width="70"
          height="36"
        />
      </NavLink>
    </div>
  );
};
