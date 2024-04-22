import { useState, useEffect, RefObject, createRef } from 'react';
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

// Constants for model input
const IMG_HEIGHT = 150;
const IMG_WIDTH = 150;

const videoConstraints: VideoConstraints = {
  height: IMG_HEIGHT,
  width: IMG_WIDTH,
  facingMode: FacingMode.USER,
}

export default function App() {
  const [webCamState, setWebCamState] = useState(false);
  const [mappings, setMappings] = useState({1 : '', 2: '', 3: '', 4: '', 5: ''});
  const [outputArray, setOutputArray] = useState< number[]| null>(null);
  const webcamRef = createRef<Webcam>();
  const APIactions = ['switchTabLeft', 'switchTabRight', 'goBack', 'goForward', 'refreshTab', 'toggleMute', 'createNewTab', 'removeCurrentTab', 'openGmail', 'openLink'];

  // Update the webcam state and frame capture state from the background script
  useEffect(() => {
    setupOffscreenDocument('off_screen.html');
    chrome.runtime.sendMessage({ message: 'useEffect'}, function(response) {
      console.log('Response from off_screen.js:', response);
      if (response && response.webCamState !== undefined) {
        setWebCamState(response.webCamState);
      }
      if (response && response.mappings !== undefined) {
        console.log('Mappings:', response.mappings);
        setMappings(response.mappings);
      }
    });
  }, []);

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.message !== undefined) {
      if (message.message === 'frameCaptureState') {
        setOutputArray(message.results);
      }
    }
  });

  const toggleWebCam = () => {
    const newWebCamState = !webCamState;
    setWebCamState(newWebCamState);
    chrome.runtime.sendMessage({ message: 'webCamState', webCamState: newWebCamState });
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">Gesture Recognition</h1>
      <button 
        className={`w-full p-2.5 text-lg font-medium text-center rounded-md transition-colors ${
          webCamState ? 'bg-red-500 hover:bg-red-700 text-white' : 'bg-blue-500 hover:bg-blue-700 text-white'
        } focus:outline-none focus:ring-4 focus:ring-blue-300`}
        onClick={toggleWebCam}>
        {webCamState ? 'Stop' : 'Start'} Webcam
      </button>
      <div className="my-4">
        {webCamState && 
        <div className="flex justify-center">
          <Webcam ref={webcamRef} audio={false} videoConstraints={videoConstraints} className="rounded-lg" />
        </div>}
      </div>
      <ActionAPIMapper
        initMapping={mappings}
        APIactions={APIactions}
      />
  </div>  
  );
};

const ActionAPIMapper = ({ initMapping, APIactions }: any) => {
  const [mapping, setMapping] = useState(initMapping);
  var currentLink = ""; 

  useEffect(() => {
    chrome.runtime.sendMessage({ message: 'useEffect'}, function(response) {
      if (response && response.mappings !== undefined) {
        console.log('Mappings:', response.mappings);
        setMapping(response.mappings);
      }
    });
  }, []);

  const handleMappingChange = (action: any, api: any) => {
    chrome.runtime.sendMessage({ message: 'updateMapping', action, api });
    setMapping((prevMapping: any) => ({
      ...prevMapping,
      [action]: api,
    }));
  };

  const handleCustomLink = (link: string) => {
    chrome.runtime.sendMessage({ message: "updateCustomLink", link });
  }

  const handleFormSubmit = (e: any) => {
    e.preventDefault(); 
    currentLink = e.target.customLink.value; 
    handleCustomLink(currentLink); 
  }
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-inner mt-4">
      <h2 className="text-xl font-semibold mb-3">Actions to APIs Mapper</h2>
      <div>
        {Object.entries(mapping).map(([action, api]) => (
          <div key={action} className="mb-2">
          <label htmlFor={action} className="block text-sm font-medium text-gray-700">{action}</label>
            <select
              id={action}
              value={String(api)}
              onChange={(e) => handleMappingChange(action, e.target.value)}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select action</option>
              {APIactions.map((apiAction: any) => (
                <option key={apiAction} value={apiAction}>{apiAction}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <form onSubmit={handleFormSubmit}>
        <label htmlFor='customLink' className='block text-sm font-medium text-gray-700'>
          openLink custom link: 
          <input type="text" name='customLink' defaultValue={currentLink} />
        </label>
      </form>
    </div>
  );
};

let creating: (Promise<void>) | null; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path: string) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
      justification: 'get user media for gesture recognition',
    });
    await creating;
    creating = null;
  }
}

