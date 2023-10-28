import React from "react";

export const HeroBanner = () => {
  const logo = "https://i.imgur.com/wBrJw7j.png";
  const backgroundImages = [
      "https://i.imgur.com/hMv2K6i.jpg",
      "https://i.imgur.com/IzqqYe6.jpg",
      "https://i.imgur.com/6KT153J.jpg",
      "https://i.imgur.com/grhtqA2.jpg",
      "https://i.imgur.com/z4C3Rs3.jpg",
      "https://i.imgur.com/eXBtbs2.jpeg",
      "https://i.imgur.com/2hmNQqR.jpg",
      "https://i.imgur.com/VGSxCxd.jpg",
      "https://i.imgur.com/D6JFFO1.jpg",
      "https://i.imgur.com/Y6yAgOi.jpg",
      "https://i.imgur.com/McthapQ.jpg",
      "https://i.imgur.com/pe3GX1X.jpg",
      "https://i.imgur.com/ikKC9Qk.jpg",
      "https://i.imgur.com/2PPSZUf.jpg",
      "https://i.imgur.com/mj7Bc6o.jpg",
      "https://i.imgur.com/Ahtn25W.jpg",
      "https://i.imgur.com/CpwTfBv.jpg",
      "https://i.imgur.com/mYsVovH.jpg",
      "https://i.imgur.com/SpTE6pv.jpg",
      "https://i.imgur.com/JO8nDsJ.jpg",
      "https://i.imgur.com/pOMlubf.jpg",
      "https://i.imgur.com/tGWStHm.jpg",
      "https://i.imgur.com/Fbhs6Ze.jpg"
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
        </div>
    </div>
  );
};
