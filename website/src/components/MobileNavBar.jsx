import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { LoginButton } from "./buttons/LoginButton";
import { LogoutButton } from "./buttons/LogoutButton";
import { SignupButton } from "./buttons/SignupButton";

const MobileMenuState = {
  CLOSED: "closed",
  OPEN: "open",
};

const MobileMenuIcon = {
  CLOSE: "close",
  MENU: "menu",
};

export const MobileNavBar = () => {
  const { isAuthenticated } = useAuth0();

  const [mobileMenuState, setMobileMenuState] = React.useState(
    MobileMenuState.CLOSED
  );
  const [mobileMenuIcon, setMobileMenuIcon] = React.useState(
    MobileMenuIcon.MENU
  );

  const isMobileMenuOpen = () => {
    return mobileMenuState === MobileMenuState.OPEN;
  };

  const closeMobileMenu = () => {
    document.body.classList.remove("mobile-scroll-lock");
    setMobileMenuState(MobileMenuState.CLOSED);
    setMobileMenuIcon(MobileMenuIcon.MENU);
  };

  const openMobileMenu = () => {
    document.body.classList.add("mobile-scroll-lock");
    setMobileMenuState(MobileMenuState.OPEN);
    setMobileMenuIcon(MobileMenuIcon.CLOSE);
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen()) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  };

  return (
    <div className="mobile-nav-bar__container">
      <nav className="mobile-nav-bar">
        <div onClick={closeMobileMenu} className="mobile-nav-bar__brand">
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
        <span
          className="mobile-nav-bar__toggle material-icons"
          id="mobile-menu-toggle-button"
          onClick={toggleMobileMenu}
        >
          {mobileMenuIcon}
        </span>
        );

        {isMobileMenuOpen() && (
          <div className="mobile-nav-bar__menu">
            <div className="mobile-nav-bar__tabs">
              {isAuthenticated && (
                <>
                  <NavLink
                    onClick={closeMobileMenu}
                    to={"/map"}
                    end
                    className={({ isActive }) =>
                      "mobile-nav-bar__tab " + (isActive ? "mobile-nav-bar__tab--active" : "")
                    }
                  >
                    Map
                  </NavLink>
                  <NavLink
                    onClick={closeMobileMenu}
                    to={"https://discord.gg/zvvRuDebSK"}
                    end
                    className={({ isActive }) =>
                      "mobile-nav-bar__tab " + (isActive ? "mobile-nav-bar__tab--active" : "")
                    }
                  >
                    Our Discord
                  </NavLink>
                </>
              )}
            </div>
            <div className="mobile-nav-bar__buttons">
              {!isAuthenticated && (
                <>
                  <SignupButton />
                  <LoginButton />
                </>
              )}
              {isAuthenticated && (
                <>
                  <LogoutButton />
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};
