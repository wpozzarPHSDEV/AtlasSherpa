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

/* Global */
var current_page;
var atlas_left;
var atlas_middle;
var atlas_right;

function afterPageLoad() {
    // Load settings
    chrome.storage.sync.get(['AtlasSherpaSettings'], function (result) {
        var Settings = result.AtlasSherpaSettings;

        var showOverlay = true;

        if (showOverlay) {

            // Get the settings for this page
            initPageData(Settings);


            // Generate the scaffolding
            genScaffolding();


            // Database Title
            genDBDisplay();


            // Object Lookup
            genLookup();


            //ID Dropdown
            genIDCopy();

            // Stop Runas
            if (current_page.runas) {
                genStopRunAs();
            }
        }

    });
}

function genLookup() {
    //Object Lookup
    var html = `
<button type="button" class ="btn btn-primary btn-sm header-button" data-toggle="modal" data-target="#lookupModal">
  Lookup Object
</button>
<div class ="modal fade" id="lookupModal" tabindex="-1" role="dialog" aria-labelledby="lookupModalLabel" aria-hidden="true">
  <div class ="modal-dialog" role="document">
    <div class ="modal-content">
      <div class ="modal-header">
        <h5 class ="modal-title" id="lookupModalLabel">Lookup Object</h5>
        <button type="button" class ="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times; </span>
        </button>
      </div>
      <div class ="modal-body">
        <form id="lookupForm">
          <div class ="form-group form-row">
            <label class ="col-sm-3 col-form-label">Data Form: </label>
            <input type="text" class ="form-control col-sm-8 form-control-sm" placeholder="Enter Data Form Instance GUID" data-hash="#pageType=p&pageId=72b7e66e-16e9-4eb1-a501-9a80459f6c35&recordId=">
            <button type="button" class ="btn btn-primary btn-sm lookupGo col-sm-1">Go</button>
          </div>
          <div class ="form-group form-row">
            <label class ="col-sm-3 col-form-label">Data List: </label>
            <input type="text" class ="form-control col-sm-8 form-control-sm" placeholder="Enter Data List GUID" data-hash="#pageType=p&pageId=a414218c-ce24-44c7-95a9-fcd0a2aa5034&recordId=">
            <button type="button" class ="btn btn-primary btn-sm lookupGo col-sm-1">Go</button>
          </div>
          <div class ="form-group form-row">
            <label class ="col-sm-3 col-form-label">Page Lookup: </label>
            <input type="text" class ="form-control col-sm-8 form-control-sm" placeholder="Enter Page GUID" data-hash="#pageType=p&pageId=cced6699-16a1-4c28-84bb-8cb59f9c2d6d&recordId=">
            <button type="button" class ="btn btn-primary btn-sm lookupGo col-sm-1">Go</button>
          </div>
          <div class ="form-group form-row">
            <label class ="col-sm-3 col-form-label">Smpl Data List: </label>
            <input type="text" class ="form-control col-sm-8 form-control-sm" placeholder="Enter Simple Data List GUID" data-hash="#pageType=p&pageId=7fc93169-c4bf-406f-818e-62681c036f1b&recordId=">
            <button type="button" class ="btn btn-primary btn-sm lookupGo col-sm-1">Go</button>
          </div>
          <div class ="form-group form-row">
            <label class ="col-sm-3 col-form-label">Code Table: </label>
            <input type="text" class ="form-control col-sm-8 form-control-sm" placeholder="Enter Code Table GUID" data-hash="#pageType=p&pageId=207b7e8d-b522-4d7c-b39a-bbbe00a4a663&recordId=">
            <button type="button" class ="btn btn-primary btn-sm lookupGo col-sm-1">Go</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
            `;

    atlas_right.prepend(html);
    $('.lookupGo').click(function () {
        var input = $(this).siblings("input");
        console.log(input);
        var objid = input.val();
        // clear inputs
        $('#lookupForm input').val('');
        var url = location.href.replace(location.hash, "");
        url += input.data("hash") + objid;
        console.log(url);
        $('#lookupModal').modal('toggle');
        window.open(url, '_blank');
    });
}

function genIDCopy() {
    var html = `
<button type="button" class ="btn btn-primary btn-sm header-button" data-toggle="modal" data-target="#idModal">
  IDs
</button>
<div class ="modal fade" id="idModal" tabindex="-1" role="dialog" aria-labelledby="idModalLabel" aria-hidden="true">
  <div class ="modal-dialog" role="document">
    <div class ="modal-content">
      <div class ="modal-header">
        <h5 class ="modal-title" id="idModalLabel">ID Click-to-Copy</h5>
        <button type="button" class ="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times; </span>
        </button>
      </div>
      <div class ="modal-body">
        <form id="idForm">
        </form>
  </table>
      </div>
    </div>
  </div>
</div>
            `;
    atlas_right.prepend(html);
    // populate the list the first time
    updateIdDropdown();
    // make sure it is updated as the hash changes
    window.onhashchange = function () { updateIdDropdown(); };
}

function updateIdDropdown() {
    var tmpURL = new URL(window.location.href);
    var hashParams = new URLSearchParams(tmpURL.hash.substr(1));
    // clear old links
    $("#idlist").empty();
    // add new links
    hashParams.forEach(function (value, key) {
        console.log(value, key);
        //$("#idlist").append(`<a href="#">${key}: ${value}</a>`)
        $("#idForm").append(`          <div class ="form-group form-row">
            <label class ="col-sm-3 col-form-label">${key}: </label>
            <input type="text" class ="form-control col-sm-8 form-control-sm idvalue" value="${value}" readonly>
          </div>
`)
    });


    $("#idForm .idvalue").click(function () {
        var elem = $(this);
        var id = elem.val();
        elem.select();
        document.execCommand("copy");

        /* Alert the copied text */
        //alert("Copied the text: " + id);
    });
}

function genStopRunAs() {
    var html = `
                <div id="stop_runas_div">
                    <button id="stop_runas" class="btn btn-danger">
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

function genDBDisplay() {
    var site_instance_name = current_page.site_name;
    if (site_instance_name != current_page.instance_name) {
        site_instance_name += "/" + current_page.instance_name;
    }
    var html = `
                <div id="db_title">
                    <div id="first_row">${site_instance_name}</div>
                    <div id="second_row">${current_page.database}</div>
                </div>
            `;
    atlas_right.append(html);
    if (current_page.border_color.length) {
        //atlas_nav.css("box-shadow", "inset 0 -2px " + border_color);
        $('#db_title').css("background", current_page.border_color);
    }
}

function genScaffolding() {
    // Positioning
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

    // set globals
    atlas_left = $('#atlas_left');
    atlas_middle = $('#atlas_middle');
    atlas_right = $('#atlas_right');
}

function initPageData(Settings) {
    // Parse URL
    var parsedUrl = new URL(window.location.href);
    // need to do this seperately because URL stops at #
    var searchParams = new URLSearchParams(parsedUrl.hash.substr(1));
    // Get item properties
    current_page = {
        database: parsedUrl.searchParams.has("databasename") ? parsedUrl.searchParams.get("databasename") : parsedUrl.searchParams.get("databaseName"),
        runas: parsedUrl.searchParams.get("runas"),
        server: parsedUrl.hostname,
        server_name: parsedUrl.hostname.substr(0, parsedUrl.host.indexOf('.')),
        instance: parsedUrl.pathname.split('/')[1],
        parsedUrl: parsedUrl,
        border_color: "",
        site_name: "",
        instance_name: ""
    };

    var currentServer = Settings.servers.find(o => o.url.toUpperCase() == current_page.server.toUpperCase());
    var currentInstance = null;
    if (currentServer) {
        currentInstance = currentServer.instances.find(o => o.path.toUpperCase() == current_page.instance.toUpperCase());
    }

    // If there is an instance then use settings
    if (currentInstance) {
        current_page.border_color = currentInstance.color;

    }

    // Set up text
    current_page.site_name = currentServer ? currentServer.name : current_page.server_name;
    current_page.instance_name = currentInstance ? currentInstance.name : current_page.instance;
}