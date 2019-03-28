var Settings = {};
var ServerSettingsTabs = {};


/*
phsqaatlas02.partners.org:bbappfx
w0086316.partners.org:CRM_wsptest
crmdev.partners.org:CRM_DesVal,CRM_DesignSandbox,CRM_ConvVal
*/

// Background.js Listener
// Not used
chrome.runtime.onMessage.addListener(function (response, sender, sendResponse) {
    console.log("request caught");
    console.log(response);
    switch (response.type) {
        case "serviceInfo":
            console.log("serviceInfo");
            console.log(response);
            processServiceInfoResponse(response);
            break;
    }
});



/* DOC READY */
$(function () {
    // TEST
    $("#ajax_test").click(function () {
        chrome.runtime.sendMessage({type:"printQueue"});
    });
    
    // Refresh Background Data Button
    $("#refresh_data").click(function () {
        refreshServerData();
    });

    // Load settings
    chrome.storage.sync.get(['AtlasSherpaSettings'], function (result) {
        Settings = result.AtlasSherpaSettings;
        if (!Settings) {
            Settings = new obj_Settings();
        }

        console.log("settings");
        console.log(Settings);

        // Populate Settings Form
        initSettingsForm();
        initSettingsEvents();

        // Init Server Links
        initServerLinks();

        // Build Links
        //buildLinks("server_links");
        // Set up settings save button
        $('#settings_form_save').click(function (event) {
            saveSettings($('#settings_form'));
        });

        // Get current tab
        chrome.tabs.query({ 'active': true, 'currentWindow': true }, function (tabs) {
            var current_url = new URL(tabs[0].url);
            
            // Add Current Server Button
            // Only show if this is a CRM page and it's not in the settings
            if (current_url.href.indexOf("webshellpage.aspx") >= 0) {
                var currentServer = Settings.servers.find(o => o.url.toUpperCase() == current_url.hostname.toUpperCase());
                // TODO : Add Current Instance
                //var currentInstance = null;
                //if (currentServer) {
                //    currentInstance = currentServer.instances.find(o => o.path.toUpperCase() == current_url.pathname.split('/')[1].toUpperCase());
                //}
                if (!currentServer) {
                    $('#add_current_server').show();
                }                
            }
            // Click event to add current server (assumes that this is a valid server to add)
            $('#add_current_server').click(function () {
                console.log("add current server");
                console.log(current_url);
                var currentServer = current_url.hostname;
                var currentServerName = currentServer.substr(0, currentServer.indexOf('.'))
                var currentInstance = current_url.pathname.split('/')[1];

                addServer(currentServerName, currentServer, currentInstance);

            });


            // Get browser history for CRM pages
            chrome.history.search({
                'text': 'webui/webshellpage.aspx?databasename', // Load CRM pages
                'startTime': 31500000000, // one year in milliseconds (ish)
                //'startTime': 2592000000, // one month in milliseconds (ish)
                'maxResults': 200
            },
              function (historyItems) {
                  // Create the history list
                  buildHistoryItems(historyItems, current_url);
                  // add all of the click handlers
                  $('.clickableDiv').on('mouseup', function (ev) {
                      //ev.which == 1 == left
                      //ev.which == 2 == middle
                      if (ev.which === 2) {
                          return divClick_newtab(this.dataset.href)
                      } else {
                          return divClick_sametab(this.dataset.href)
                      }
                  });

              });
        });
    });

});





