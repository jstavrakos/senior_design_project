import React, { useState, useRef } from 'react';
import './App.css';
import Webcam from "react-webcam";

const videoConstraints = {
  width: 600,
  height: 600,
  facingMode: "user"
};

export default function MyApp() {
  const [webCamState, setButtonState] = useState(false);
  const [frameCapture, setFrameCapture] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const webcamRef = useRef(null);


  const handleOnCapture = () => {
    const capturedImageSrc = webcamRef.current.getScreenshot();
    setImageSrc(capturedImageSrc);
  }

  return (
    <div>
      <h1>Welcome to my app</h1>
      <MyButton class="webcam" onClick={() => {setButtonState(!webCamState)}} />
      <br />
      <MyButton class="frame" onClick={() => {
        if(webCamState === true){
          setFrameCapture(!frameCapture); 
          handleOnCapture();
        }
        else{
          setFrameCapture(false);
        }}} />
      {webCamState && <RenderWebcam webcamRef={webcamRef} />}
      <br />
      {frameCapture && <p>Frame </p>}
      <br />
      {frameCapture && <img src={imageSrc} alt="Captured" />}
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

function RenderWebcam(props) {

  return (
    <div>
      <Webcam
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        ref={props.webcamRef}
      />
    </div>
  );
}
