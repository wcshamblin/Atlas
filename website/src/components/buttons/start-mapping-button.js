import { useAuth0 } from "@auth0/auth0-react";
import React from "react";

export const StartMappingButton = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  const handleLogin = async () => {
    await loginWithRedirect({
      appState: {
        returnTo: "/map",
      },
      authorizationParams: {
        prompt: "login",
      },
    });
  };

  const redirectToMap = () => {
    window.location.href = "/map";
  };

  // if authenticated, link directly to map
  if (isAuthenticated) {
    return (
      <button className="button__map" onClick={redirectToMap}>
      Start mapping
      </button>
    );
  }

  else {
    return (
      <button className="button__map" onClick={handleLogin}>
      Start mapping
      </button>
    );
  }

};
