import React, { useState, useRef, useEffect, RefObject, createRef } from 'react';
import Webcam from "react-webcam";

// Interface for video constraints with type safety
interface VideoConstraints {
  width: number;
  height: number;
  facingMode: FacingMode;
}

// Enum for facingMode property, ensuring correct values
enum FacingMode {
  USER = 'user',
  ENVIRONMENT = 'environment',
}

const videoConstraints: VideoConstraints = {
  width: 600,
  height: 600,
  facingMode: FacingMode.USER,
};

export default function App() {
  const [webCamState, setWebCamState] = useState(false);
  const [frameCapture, setFrameCapture] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const webcamRef = createRef<Webcam>();

  useEffect(() => {
    // Handle potential errors when accessing the webcam
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .catch((error) => {
        console.error('Error accessing webcam:', error);
        // Add appropriate error handling or user feedback here
      });
  }, []); // Empty dependency array to run effect only once

  const handleOnCapture = () => {
    if (webcamRef.current) {
      const capturedImageSrc = webcamRef.current.getScreenshot();
      setImageSrc(capturedImageSrc);
    } else {
      console.error('Webcam reference not available');
      // Add appropriate error handling or user feedback here
    }
  };

  return (
    <div>
      <h1>Welcome to my app</h1>
      <MyButton class="webcam" onClick={() => setWebCamState(!webCamState)} />
      <br />
      <MyButton
        class="frame"
        onClick={() => {
          if (webCamState) {
            setFrameCapture(!frameCapture);
            handleOnCapture();
          } else {
            setFrameCapture(false);
          }
        }}
      />
      {webCamState && <RenderWebcam webcamRef={webcamRef} />}
      <br />
      {frameCapture && <p>Frame </p>}
      <br />
      {frameCapture && imageSrc && <img src={imageSrc} alt="Captured" />}
    </div>
  );
};

function MyButton(props: { class: string; onClick: () => void }) {
  return (
    <>
      <button onClick={props.onClick}>{props.class}</button>
    </>
  );
}

function RenderWebcam(props: { webcamRef: RefObject<Webcam> }) {
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
