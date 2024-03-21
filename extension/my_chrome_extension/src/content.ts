// Listen for messages from the Chrome runtime
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Check if the message is from app.js
    if (sender.id === 'hljhapmlbiiediilmbgekaeobfplpjpc') {
      // Check if the message contains the webcamState property
      if (message.hasOwnProperty('webcamState')) {
        const webcamState = message.webcamState;
  
        if (webcamState) {
          // Start the webcam
          startWebcam();
        } else {
          // Stop the webcam
          stopWebcam();
        }
      }
    }
  });
  
  let videoElement: HTMLVideoElement | null;
  let stream: MediaStream | null;
  
  function startWebcam() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((streamObj) => {
        stream = streamObj;
  
        // Create a video element and set its source
        videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.style.position = 'fixed';
        videoElement.style.top = '0';
        videoElement.style.left = '0';
        videoElement.style.width = '200px'; // Adjust the size as needed
        videoElement.style.height = 'auto';
  
        // Append the video element to the page
        document.body.appendChild(videoElement);
      })
      .catch((error) => {
        console.error('Error accessing webcam:', error);
      });
  }
  
  function stopWebcam() {
    if (stream) {
      // Stop the webcam stream
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  
    // Remove the video element from the page
    if (videoElement) {
      videoElement.remove();
      videoElement = null;
    }
  }
