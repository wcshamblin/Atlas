import React from "react";

export const HeroBanner = () => {
  const logo = "https://cdn.auth0.com/blog/developer-hub/react-logo.svg";
  const backgroundImages = [
      "https://i.imgur.com/hMv2K6i.jpg",
      "https://i.imgur.com/IzqqYe6.jpg",
      "https://i.imgur.com/ycXV6uV.jpg",
      "https://i.imgur.com/6KT153J.jpg",
      "https://i.imgur.com/grhtqA2.jpg",
      "https://i.imgur.com/iwa5T7D.jpg",
      "https://i.imgur.com/z4C3Rs3.jpg",
  ]
    const randomBackgroundImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];


  return (
    <div className="hero-banner hero-banner--pink-yellow" style={{backgroundImage: `url(${randomBackgroundImage})`, backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat'}}>
      <div className="hero-banner__logo">
        <img className="hero-banner__image" src={logo} alt="React logo" />
      </div>
        <h1 className="hero-banner__headline">Welcome to Atlas V2</h1>
        <div className="hero-banner__buttons">
      {/* Discord button */}
        <a
            id="discord-button"
            rel="noopener noreferrer"
            href="https://discord.gg/zvvRuDebSK"
            className="button button--discord"
        >
            Join our Discord
        </a>
        <a
            id="donate-button"
            rel="noopener noreferrer"
            href="https://www.paypal.com/donate/?business=88NRLKRHJX5T2&no_recurring=0&currency_code=USD"
            className="button button--donate"
        >
            Donate
        </a>
        </div>
    </div>
  );
};
