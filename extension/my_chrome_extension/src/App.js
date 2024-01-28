import React, { useState, useRef } from 'react';
import './App.css';
import Webcam from "react-webcam";
import getScreenshot from "react-webcam";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user"
};

export default function MyApp() {
  const [webCamState, setButtonState] = useState(false);
  const [frameCapture, setFrameCapture] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const handleOnCapture = (capturedImageSrc) => {
    setImageSrc(capturedImageSrc);
  }

  return (
    <div>
      <h1>Welcome to my app</h1>
      <MyButton class="webcam" onClick={() => {setButtonState(!webCamState)}} />
      <br />
      <MyButton class="frame" onClick={() => {setFrameCapture(!frameCapture)}} />
      {webCamState && <RenderWebcam onCapture={handleOnCapture}/>}
      <br />
      {frameCapture && <p>Frame </p>}
      <br />
      {webCamState && frameCapture && <img src={imageSrc} alt="Captured" />}
    </div>
    );
  };

function MyButton(props) {
  let buttonContent = props.class
  return (
    <button onClick={props.onClick}>
      {buttonContent}
    </button>
  );
}

function RenderWebcam({ onCapture }) {
  const webcamRef = useRef(null);

  const handleOnCapture = () => {
    const capturedImageSrc = webcamRef.current.getScreenshot();
    onCapture(capturedImageSrc);
  };

  return (
    <div>
      <Webcam
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        ref={webcamRef}
      />
      <button onClick={handleOnCapture}>Capture</button>
    </div>
  );
}
