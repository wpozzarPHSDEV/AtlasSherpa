
// Injected Script
var s = document.createElement('script');
s.src = chrome.extension.getURL('inject.js');
(document.head || document.documentElement).appendChild(s);
s.onload = function () {
    s.remove();
};

// Event listener for callback from injected script
document.addEventListener('WSP_connectExtension', function (e) {
    console.log("I heard you!");
    console.log(e.detail);
});

// Wait until the page is actually loaded
var waitCounter = 0;
var checkExist = setInterval(function () {
    waitCounter++;
    if ($('.bbui-pages-header').children().length > 0) {
        clearInterval(checkExist);
        console.log("Page loaded, injecting FUN!");
        afterPageLoad();
    }
    if (waitCounter >= 20) {
        console.log("Timeout waiting for page to load...");
    }
}, 100); // check every 100ms


function afterPageLoad() {
    // Load settings
    chrome.storage.sync.get(['AtlasSherpaSettings'], function (result) {
        var Settings = result.AtlasSherpaSettings;
        console.log("content settings");
        console.log(Settings);

        // Get the settings for this page
        // Parse URL
        var parsedUrl = new URL(window.location.href);
        // need to do this seperately because URL stops at #
        var searchParams = new URLSearchParams(parsedUrl.hash.substr(1));
        // Get item properties
        var current_page = {
            database: parsedUrl.searchParams.get("databasename"),
            server: parsedUrl.hostname,
            server_name: parsedUrl.hostname.substr(0, parsedUrl.host.indexOf('.')),
            instance: parsedUrl.pathname.split('/')[1],
        };

        var currentServer = Settings.servers.find(o => o.url.toUpperCase() == current_page.server.toUpperCase());
        var currentInstance = null;
        if (currentServer) {
            currentInstance = currentServer.instances.find(o => o.path.toUpperCase() == current_page.instance.toUpperCase());
        }
        
        // If there is an instance then use settings
        var border_color = "";
        if (currentInstance) {
            border_color = currentInstance.color;
            //if (border_color.length) {
            //    $(".bbui-pages-header-title").css("box-shadow", "inset 0 -5px " + border_color);
            //}
        }

        // Atlas Header
        // Hide the banner
        $(".bbui-pages-banner").css({ "visibility": "hidden" });
        
        // Set up text
        var site_name = currentServer ? currentServer.name : current_page.server_name;
        var instance_name = currentInstance ? currentInstance.name : current_page.instance;
        // get height for spacing
        var height = $(".bbui-pages-header-left").outerHeight();

        var atlas_header = `
            <div id="sherpa-header">
                <div id="first_row">${instance_name}</div>
                <div id="second_row">${current_page.database}</div>
            </div>
            `;
        atlas_header = $(atlas_header).appendTo("body");
        atlas_header.css("height", height);
        if (border_color.length) {
            //atlas_header.css("box-shadow", "inset 0 -2px " + border_color);
            atlas_header.css("background", border_color);
        }
    });
}

