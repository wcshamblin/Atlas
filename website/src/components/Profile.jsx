import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

export const Profile = () => {
  const { user } = useAuth0();

  if (!user) {
    return null;
  }

  return (
      <div className="content-layout">
        <div className="content__body">
          <div className="profile-grid">
            <div className="profile__header">
              <img
                src={user.picture}
                alt="Profile"
                className="profile__avatar"
              />
              <div className="profile__headline">
                <h2 className="profile__title">{user.name}</h2>
                <span className="profile__description">{user.email}</span>
              </div>
            </div>
            <div className="profile__details">
              <div className="code-snippet">
                <span className="code-snippet__title">Decoded ID Token</span>
                <div className="code-snippet__container">
                  <div className="code-snippet__wrapper">
                    <pre className="code-snippet__body">{JSON.stringify(user, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};
