import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';

const rootElement = document.getElementById('popup-root');

if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
    <React.StrictMode>
      <Options />
    </React.StrictMode>
  );
}

export default function Options() {
    const handleClick = () => {
        console.log('reached onclick');

        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: false, video: { width: 1280, height: 720 } })
                .then((stream: { id: string; }) => {
                    console.log('success with streamid being ' + stream.id);
                })
                .catch((err: any) => {
                    console.error(`The following error occurred: ${err.name}`);
                });
        } else {
            console.log("getUserMedia not supported");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-6">Options</h1>
          <button 
            className="inline-block px-6 py-3 text-lg font-medium text-blue-700 bg-blue-100 border border-blue-700 rounded-lg hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleClick}
          >
            Start Webcam
          </button>
        </div>
      );      
}