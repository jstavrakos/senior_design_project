// service worker code
 
chrome.alarms.onAlarm.addListener(a => {
  chrome.windows.getLastFocused(
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
  );

  // not moving tabs but the arrow keys
  // go forward
  //chrome.tabs.goForward(tab.tabId); 
  // go backward
  //chrome.tabs.goBack(tab.tabId); 
}); 

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.get('alarm', a => {
    if (!a) {
      chrome.alarms.create('alarm', { periodInMinutes: 1 })
    }
  })
})