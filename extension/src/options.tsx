  import React, { createRef, useRef, useState } from 'react';
  import ReactDOM from 'react-dom/client';
  import './index.css';

  const rootElement = document.getElementById('options-root');

  if (rootElement) {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
      <React.StrictMode>
        <Options />
      </React.StrictMode>
    );
  }

  export default function Options() {
    const [vidState, setVidState] = useState(false);
    const [vidStream, setVidStream] = useState<MediaStream | null>(null);

    const handleClick = () => {
        if (navigator.mediaDevices.getUserMedia) {
            if (!vidState && !vidStream) {
                navigator.mediaDevices.getUserMedia({ audio: false, video: { width: 150, height: 150 } })
                .then((stream) => {
                    setVidStream(stream);
                    console.log('success with streamid being ' + stream.id);
                })
                .catch((err) => {
                    console.error(`The following error occurred: ${err}`);
                });
                setVidState(true);
            } else {
                setVidState(false);
                console.log('stopping stream');
                vidStream?.getTracks().forEach((track) => {
                    track.stop();
                });
                setVidStream(null);
            }
        } else {
            console.error("getUserMedia not supported");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-6">Options</h1>
            <button 
                className="inline-block px-6 py-3 text-lg font-medium text-blue-700 bg-blue-100 border border-blue-700 rounded-lg hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleClick}
            >
            {vidState ? 'Stop' : 'Start'} Webcam
            </button>
        </div>
    );      
}