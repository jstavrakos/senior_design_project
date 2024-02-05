// service worker code

function do_something() {
  // turn background color green
  document.body.style.backgroundColor = 'green';
}; 

// 
chrome.action.onClicked.addListener((tab) => {
  if (!tab.url.includes('chrome://')) {
    // execute random script
    /*chrome.scripting.executeScript({
      target: { tabId: tab.id }, 
      func: do_something
    });*/
    // not moving tabs but the arrow keys
    // go forward
    //chrome.tabs.goForward(tab.tabId); 
    // go backward
    //chrome.tabs.goBack(tab.tabId); 
    
    // change tabs
    chrome.tabs.move(tab.tabId, { index: -1 }); 
  } 
}); 