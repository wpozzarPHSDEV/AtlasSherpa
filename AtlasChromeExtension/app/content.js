/* testing injection
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
*/

// Wait until the page is actually loaded
var waitCounter = 0;
var checkExist = setInterval(function () {
    waitCounter++;
    // Check if header has populated yet
    if ($('.bbui-pages-header').children().length > 0) {
        // Stop checking
        clearInterval(checkExist);
        // Load content
        afterPageLoad();
    }
    // If it take more than 20 cycles (2 seconds) then bail
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

        var showOverlay = true;

        if (showOverlay) {

            // Get the settings for this page
            // Parse URL
            var parsedUrl = new URL(window.location.href);
            // need to do this seperately because URL stops at #
            var searchParams = new URLSearchParams(parsedUrl.hash.substr(1));
            console.log("url");
            console.log(parsedUrl);
            // Get item properties
            var current_page = {
                database: parsedUrl.searchParams.has("databasename") ? parsedUrl.searchParams.get("databasename") : parsedUrl.searchParams.get("databaseName"),
                runas: parsedUrl.searchParams.get("runas"),
                server: parsedUrl.hostname,
                server_name: parsedUrl.hostname.substr(0, parsedUrl.host.indexOf('.')),
                instance: parsedUrl.pathname.split('/')[1],
                parsedUrl: parsedUrl
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


            // Set up text
            var site_name = currentServer ? currentServer.name : current_page.server_name;
            var instance_name = currentInstance ? currentInstance.name : current_page.instance;


            // Positioning
            console.log("ATLAS POSITIONING");
            console.log($('.bbui-pages-header-left').position());
            console.log($('.bbui-pages-header-right').position());

            // Get the left and right header elements
            var bbui_left = $('.bbui-pages-header-left');
            var bbui_right = $('.bbui-pages-header-right');

            // Set the height and width of space between the elements
            var nav_left = bbui_left.position().left + bbui_left.outerWidth();
            var nav_height = bbui_left.outerHeight();
            var nav_width = bbui_right.position().left - nav_left - 40;

            // Create a scaffolding for the space
            var atlas_nav = `
                <div id="atlas_nav">
                    <div id="atlas_left"></div>
                    <div id="atlas_middle"></div>
                    <div id="atlas_right"></div>
                </div>
                `;
            // Insert the scaffolding
            atlas_nav = $(atlas_nav).appendTo("body");
            // Set the calculated height & width
            atlas_nav.css("left", nav_left);
            atlas_nav.css("width", nav_width);
            atlas_nav.css("height", nav_height);

            var atlas_left = $('#atlas_left');
            var atlas_middle = $('#atlas_middle');
            var atlas_right = $('#atlas_right');

            // Database Title
            var site_instance_name = site_name;
            if (site_name != instance_name) {
                site_instance_name += "/" + instance_name;
            }
            var html = `
                <div id="db_title">
                    <div id="first_row">${site_instance_name}</div>
                    <div id="second_row">${current_page.database}</div>
                </div>
            `;
            atlas_right.append(html);
            if (border_color.length) {
                //atlas_nav.css("box-shadow", "inset 0 -2px " + border_color);
                $('#db_title').css("background", border_color);
            }


            //ID Dropdown
            var html = `
<div class ="dropdown">
  <button class ="dropbtn">IDs</button>
  <table id="idlist" class ="dropdown-content">
  </table>
</div>
            `;
            atlas_right.prepend(html);
            // populate the list the first time
            updateIdDropdown();
            // make sure it is updated as the hash changes
            window.onhashchange = function () { updateIdDropdown(); };

            // Stop Runas
            console.log(current_page.runas);
            if (current_page.runas) {
                var html = `
                <div id="stop_runas_div">
                    <button id="stop_runas">
                        Stop running as: ${current_page.runas}
                    </button>
                </div>
            `;
                atlas_middle.append(html);

                $('#stop_runas').click(function () {
                    // Reload the page without the runas parameter
                    var parsedUrl = new URL(window.location.href);
                    parsedUrl.searchParams.delete("runas");
                    window.location.href = parsedUrl.href;
                });
            }
        }

    });
}

function updateIdDropdown() {
    console.log("hash changed!");
    var tmpURL = new URL(window.location.href);
    var hashParams = new URLSearchParams(tmpURL.hash.substr(1));
    // clear old links
    $("#idlist").empty();
    // add new links
    hashParams.forEach(function (value, key) {
        console.log(value, key);
        //$("#idlist").append(`<a href="#">${key}: ${value}</a>`)
        $("#idlist").append(`<tr class="idrow">
                                <td class ="idkey">${key}: </td>
                                <td><input class ="idvalue" value="${value}" readonly/><td>
                                </tr>`)
    });

    $(".idrow").click(function () {
        var elem = $(this).find(".idvalue");
        var id = elem.val();
        console.log("clicked");
        console.log(elem);
        console.log("clicked id: " + id);
        elem.select();
        document.execCommand("copy");

        /* Alert the copied text */
        alert("Copied the text: " + id);
    });
}
