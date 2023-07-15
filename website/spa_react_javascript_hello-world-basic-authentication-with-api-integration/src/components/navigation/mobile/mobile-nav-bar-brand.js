import React from "react";
import { NavLink } from "react-router-dom";

export const MobileNavBarBrand = ({ handleClick }) => {
  return (
    <div onClick={handleClick} className="mobile-nav-bar__brand">
      <NavLink to="/">
        <img
          className="mobile-nav-bar__logo"
          src="https://i.imgur.com/IJiZS4x.png"
          alt="Atlas"
          width="53"
          height="24"
        />
      </NavLink>
    </div>
  );
};
