import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export const HeroBanner = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    const backgroundImages = [
      "https://i.imgur.com/A8Phxfc.jpeg",
      "https://i.imgur.com/jJDFVxR.jpeg",
      "https://i.imgur.com/neGnzfK.jpeg",
      "https://i.imgur.com/7wOsNp3.jpeg",
      "https://i.imgur.com/mZNWXFG.jpeg",
      "https://i.imgur.com/ElnJneJ.jpeg",
      "https://i.imgur.com/6hdf0gC.jpeg",
      "https://i.imgur.com/Q2nfYNJ.jpeg",
      "https://i.imgur.com/hMv2K6i.jpg",
      "https://i.imgur.com/IzqqYe6.jpg",
      "https://i.imgur.com/6KT153J.jpg",
      "https://i.imgur.com/z4C3Rs3.jpg",
      "https://i.imgur.com/eXBtbs2.jpeg",
      "https://i.imgur.com/2hmNQqR.jpg",
      "https://i.imgur.com/VGSxCxd.jpg",
      "https://i.imgur.com/D6JFFO1.jpg",
      "https://i.imgur.com/Y6yAgOi.jpg",
      "https://i.imgur.com/McthapQ.jpg",
      "https://i.imgur.com/pe3GX1X.jpg",
      "https://i.imgur.com/2PPSZUf.jpg",
      "https://i.imgur.com/Ahtn25W.jpg",
      "https://i.imgur.com/CpwTfBv.jpg",
      "https://i.imgur.com/mYsVovH.jpg",
      "https://i.imgur.com/SpTE6pv.jpg",
      "https://i.imgur.com/JO8nDsJ.jpg",
      "https://i.imgur.com/pOMlubf.jpg",
      "https://i.imgur.com/Fbhs6Ze.jpg"
    ]

    setSelectedImage(backgroundImages[Math.floor(Math.random() * backgroundImages.length)]);
  }, [])
  
  const handleStartMapping = async () => {
    if(isAuthenticated) {
      navigate("/map");
    } else {
      await loginWithRedirect({
        appState: {
          returnTo: "/map",
        },
        authorizationParams: {
          prompt: "login",
        },
      });
    }
  }


  return (
    <div className="hero-banner hero-banner--pink-yellow" style={{ backgroundImage: `url(${selectedImage})`, backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}>
      <div className="hero-banner__logo">
        <img className="hero-banner__image" src="https://i.imgur.com/wBrJw7j.png" alt="React logo" />
      </div>
      <h1 className="hero-banner__headline">Welcome to Atlas V2</h1>
      <div className="hero-banner__buttons">
        <button className="button__map" onClick={handleStartMapping}>Start mapping</button>
      </div>
    </div>
  );
};
