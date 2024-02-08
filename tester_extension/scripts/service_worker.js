// service worker code

function do_something() {
  // turn background color green
  document.body.style.backgroundColor = 'green';
}; 
 
chrome.action.onClicked.addListener((tab) => {
  /*if (!tab.url.includes('chrome://')) {
    // execute random script
    chrome.scripting.executeScript({
      target: { tabId: tab.id }, 
      func: do_something
    });
  } */
    // not moving tabs but the arrow keys
    // go forward
    //chrome.tabs.goForward(tab.tabId); 
    // go backward
    //chrome.tabs.goBack(tab.tabId); 

  // change tabs forward
  /*chrome.windows.getLastFocused(
    {populate: true}, 
    function(window) {
      var n = window.tabs.length; 

      for (var i = 0; i < n; i++) {
        if (window.tabs[i].active) {
          if (i == n - 1) {
            chrome.tabs.update(window.tabs[0].id, { active: true }); 
          } else {
            chrome.tabs.update(window.tabs[i + 1].id, { active: true }); 
          }

          return; 
        } 
      }
    }
  );*/

  // change tabs backward
  chrome.windows.getLastFocused(
    {populate: true}, 
    function(window) {
      var n = window.tabs.length; 

      for (var i = 0; i < n; i++) {
        if (window.tabs[i].active) {
          if (i == 0) {
            chrome.tabs.update(window.tabs[n - 1].id, { active: true }); 
          } else {
            chrome.tabs.update(window.tabs[i - 1].id, { active: true }); 
          }

          return; 
        }
      }
    }
  );
}); 