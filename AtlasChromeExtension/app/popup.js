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
    switch (response.type) {
        case "serviceInfo":
            processServiceInfoResponse(response);
            break;
    }
});



/* DOC READY */
$(function () {

    chrome.permissions.contains({
        origins: ['https://*/*']
    }, function (result) {
        if (result) {
            console.log("HAS PERM");
        } else {
            console.log("DOES NOT HAS PERM");
        }
    });

    $("#permission_click").click(function () {
        console.log("Clicked Permissions");
        chrome.permissions.request({
            origins: ['https://*/*']
        }, function (granted) {
            // The callback argument will be true if the user granted the permissions.
            if (granted) {
                console.log("GRANTED!");
            } else {
                console.log("DENIED!");
            }
        });
    });



    // TEST
    $("#ajax_test").click(function () {
        chrome.runtime.sendMessage({type:"printQueue"});
    });
    
    // Refresh Background Data Button
    $("#refresh_data").click(function () {
        refreshServerData();
    });

    // History Search
    $("#history_search_input").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        // reset if search it blank
        if (value == "") {
            console.log("empty search");
            $('.site_history_links').hide();
            //$('.site_history .site_header.active').nextAll('ul').show();
        }

        // Process search
        $(".site_history_links li").each(function () {
            if ($(this).find(".history-title").html().toLowerCase().indexOf(value) == -1) {
                $(this).addClass("nomatch");
            } else {
                $(this).removeClass("nomatch");
            }
            //$(this).toggle($(this).find(".history-title").html().toLowerCase().indexOf(value) > -1)
        });
        // Hide sites with no results and open sites with results
        $(".site_history").each(function () {
            if ($(this).find(".site_history_links li:not(.nomatch)").length > 0) {
                //$(this).addClass("nomatch");
                $(this).show();
                $(this).find(".site_history_links").show();
            } else {
                //$(this).removeClass("nomatch");
                $(this).hide();
            }
            console.log("numvisible: " + $(this).find(".site_history_links li:not(.nomatch)").length);
        });
    });

    // Load settings
    chrome.storage.sync.get(['AtlasSherpaSettings'], function (result) {
        Settings = result.AtlasSherpaSettings;
        if (!Settings) {
            Settings = new obj_Settings();
        }

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





