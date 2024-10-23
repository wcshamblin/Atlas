import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { LoginButton } from "./buttons/LoginButton";
import { LogoutButton } from "./buttons/LogoutButton";
import { SignupButton } from "./buttons/SignupButton";

export const NavBar = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  return (
    <div className="nav-bar__container">
      <nav className="nav-bar">
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
        <div className="nav-bar__tabs">
        {isLoading ? <img className="navbar-loader" src={"https://cdn.auth0.com/blog/hello-auth0/loader.svg"} alt="Loading..." /> :
          isAuthenticated ? (
            <>
              <NavLink
                to={"/map"}
                end
                className={({ isActive }) =>
                  "nav-bar__tab " + (isActive ? "nav-bar__tab--active" : "")
                }
              >
                Map
              </NavLink>
              <NavLink
                to={"https://discord.gg/zvvRuDebSK"}
                end
                className={({ isActive }) =>
                  "nav-bar__tab " + (isActive ? "nav-bar__tab--active" : "")
                }
              >
                Our Discord
              </NavLink>
              <div className="nav-bar__buttons">
                <LogoutButton />
              </div>
            </>
          ) : (
            <div className="nav-bar__buttons">
              <SignupButton />
              <LoginButton />
            </div>
          )
          }
        </div>
        
      </nav>
    </div>
  );
};
