
/* Global */
var current_page;


console.log("FIRST THING IN CONTENT");

/* Main Functions */
function afterPageLoad() {
    console.log("AFTER LOAD IN CONTENT");
    // Load settings
    chrome.storage.sync.get(['AtlasSherpaSettings'], function (result) {
        console.log("AFTER SETTINGS IN CONTENT");
        var Settings = result.AtlasSherpaSettings;

        var showOverlay = true;

        if (showOverlay) {

            // Get the settings for this page
            initPageData(Settings);

            // Generate the scaffolding
            genScaffolding();

            // Database Title & main button
            genDBDisplay($('#sherpa_nav'));

            // Stop Runas
            if (current_page.runas) {
                genStopRunAs($('#sherpa_nav'));
            }

        }

    });
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
        instance_name: "",
        settings: Settings
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
function genScaffolding() {
    // Positioning
    // Get the left and right header elements
    var bbui_left = $('.bbui-pages-header-left');
    var bbui_right = $('.bbui-pages-header-right');

    // Set the height and width of space between the elements
    //var nav_left = bbui_left.position().left + bbui_left.outerWidth();
    var nav_left = 660;
    var nav_height = bbui_left.outerHeight();
    var nav_width = bbui_right.position().left - nav_left - 40;

    // Create the navbar
    var atlas_nav = `
<div id="atlas_nav">
    <nav id="sherpa_nav" class ="navbar navbar-expand-lg fixed-top justify-content-between">
        <ul  id="sherpa_nav_items" class ="navbar-nav">
        </ul>
    </nav>
</div>`;

    // Insert the scaffolding
    $(atlas_nav).appendTo("body");
    // Set the calculated height & width
    $("#sherpa_nav").css("left", nav_left);
    $("#sherpa_nav").css("width", nav_width);
    $("#sherpa_nav").css("height", nav_height);

}

/* Main Menu */
function genDBDisplay(parent) {
    var site_instance_name = current_page.site_name;
    if (site_instance_name != current_page.instance_name) {
        site_instance_name += "/" + current_page.instance_name;
    }
    var html = `<div class="hover-dropdown">
                    <div id="db_title">
                        <div>${site_instance_name}</div>
                        <div>${current_page.database}</div>
                    </div>
                    <div id="sherpa_dropdown_content" class ="hover-dropdown-content">
                    </div>
                </div>
            `;
    parent.append(html);

    // Set color
    if (current_page.border_color.length) {
        //atlas_nav.css("box-shadow", "inset 0 -2px " + border_color);
        $('#db_title').css("background", current_page.border_color);
    }

    // Click events
    // Show menu
    $('#db_title').click(function () {
        $('#sherpa_dropdown_content').toggle();
    });
    // hide menu on click outside
    $(document).mouseup(function (e) {
        var container = $("#sherpa_dropdown_content");

        // if the target of the click isn't the container nor a descendant of the container
        if (!container.is(e.target) && container.has(e.target).length === 0) {
            container.hide();
        }
    });

    // add submenus
    genActionMenu($('#sherpa_dropdown_content'));
    genQuickLinks($('#sherpa_dropdown_content'));

    // close when submenu item is clicked
    $('#sherpa_dropdown_content .dropdown-item').click(function () {
        console.log("clicked dropdown-item");
        $('#sherpa_dropdown_content').toggle();
    });
}

/* Action Menu */
function genActionMenu(parent) {
    var html = `
<div class ="dropdown dropleft">
  <button class ="btn dropdown-toggle" type="button" data-toggle="dropdown">
    Actions
  </button>

  <div id="actionMenuItems" class ="dropdown-menu">
  </div>
</div>
            `;
    parent.append(html);
    // Add Actions
    var parent = $('#actionMenuItems');
    var modalParent = $("#atlas_nav");
    // Object Lookup
    genLookup(parent, modalParent);

    //ID Dropdown
    genIDCopy(parent, modalParent);

    // Run As
    genRunAs(parent, modalParent);
}
/* Action: Lookup Object */
function genLookup(parent, modalParent) {
    //Object Lookup
    var html = `
<button type="button" class ="dropdown-item btn btn-primary btn-sm" data-toggle="modal" data-target="#lookupModal">
  Lookup Object by ID
</button>
`;
    parent.prepend(html);
var html = `
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

modalParent.append(html);

    // set up click event
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
/* Action: Copy ID */
function genIDCopy(parent, modalParent) {
    var html = `
<button type="button" class ="dropdown-item btn btn-primary btn-sm" data-toggle="modal" data-target="#idModal">
  Copy URL IDs
</button>
`;
    parent.prepend(html);
var html = `
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
    modalParent.append(html);
    // populate the list the first time
    updateIdDropdown();
    // make sure it is updated as the hash changes
    window.onhashchange = function () { updateIdDropdown(); };
}
function updateIdDropdown() {
    var tmpURL = new URL(window.location.href);
    var hashParams = new URLSearchParams(tmpURL.hash.substr(1));
    // clear old links
    $("#idForm").empty();
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
/* Action: RunAs */
function genRunAs(parent, modalParent) {
    var html = `
<button type="button" id="runasModalButton" class="dropdown-item btn btn-primary btn-sm" data-toggle="modal" data-target="#runasModal">
  Show Page As...
</button>
`;
    parent.prepend(html);

    var html = `
<div class ="modal fade" id="runasModal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class ="modal-dialog" role="document">
    <div class ="modal-content">
      <div class ="modal-header">
        <h5 class ="modal-title" id="idModalLabel">Show Page As...</h5>
        <button type="button" class ="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times; </span>
        </button>
      </div>
      <div class ="modal-body">
        <form id="runasForm">
          <div class ="form-group form-row">
            <label class="col-sm-3 col-form-label">Run As: </label>
            <select required id="appuser_select" class="form-control col-sm-8 form-control-sm">
              <option value="" disabled selected>Select something...</option>
            </select>
            <button type="button" id="runasButton" class ="btn btn-primary btn-sm lookupGo col-sm-1">Go</button>
          </div>
        </form>
  </table>
      </div>
    </div>
  </div>
</div>
            `;
    modalParent.append(html);

    // set up click events
    $('#runasModalButton').click(function () {
        // populate user list
        getAppUsers();
    });

    $('#runasButton').click(function () {
        var userid = $("#appuser_select").val();
        // clear input
        $('#appuser_select').prop('selectedIndex', 0);
        // set up url
        var hash = location.hash;
        var url = location.href.replace(location.hash, "");
        url += "&runas=" + userid + hash;
        $('#runasModal').modal('toggle');
        window.open(url, '_blank');
    });


}
function getAppUsers() {
    var action = "SearchListLoadRequest";
    var args = "<SearchListID>f51b8ec1-54d4-45e3-86cd-562034137304</SearchListID>";

    doSOAP(action, args, populateAppUsers, window.location.hostname, current_page.instance, current_page.database);
}
function populateAppUsers(response) {
    console.log("SOAP Success");
    console.log(response);
    var users = $(response.data).find("Values");
    users.each(function () {
        var guid = $(this).children().eq(0).text()
        var username = $(this).children().eq(1).text();
        var displayname = $(this).children().eq(2).text();
        var html = `<option value="${username}">${username} - ${displayname}</option>`;
        // add the user (but not the BB system user)
        if (guid != '42a219c2-0c85-448b-ba65-06c68a224c1c') {
            $("#appuser_select").append(html);
        }
    });

}

/* Quick Links Menu */
function genQuickLinks(parent) {
    var html = `
<div class ="dropdown dropleft">
  <button class ="btn dropdown-toggle" type="button" data-toggle="dropdown">
    QuickLinks
  </button>

  <div id="quicklinkMenuItems" class ="dropdown-menu">
  </div>
</div>
            `;
    parent.append(html);

    // Add links
    var quicklinks = [
    { name: "Catalog Browser", url: "pageType=p&pageId=43f97de3-d5aa-440c-a54b-14f71b2920e5" }
    , { name: "Features", url: "folder=Application%5CFeatures&pageType=fa&faId=64bbf407-7062-4f63-bc7c-e947f3eef6aa" }
    , { name: "Shell Design", url: "pageType=p&pageId=23b242f5-ec55-408f-a9e2-286971eba0e6" }
    , { name: "Application Users", url: "pageType=p&pageId=ae1deedd-6b2d-4c03-b4d4-f74e583a6ad7" }
    , { name: "System Roles", url: "pageType=p&pageId=a51e42f2-5478-441c-8735-310c0f7a0be7" }
    , { name: "Business Processes", url: "pageType=p&pageId=09140005-ad50-4259-b45c-376f7d0d8cbe" }
    , { name: "Data Warehouses", url: "pageType=p&pageId=f7f36235-a044-4006-8953-268f82a0863a" }
    ];

    quicklinks.forEach(function (link) {
        html = `<a class="dropdown-item" href="/${current_page.instance}/webui/webshellpage.aspx?databasename=${current_page.database}#${link.url}">${link.name}</a>`
        $('#quicklinkMenuItems').append(html);
    });

}

/* Stop RunAs Button */
function genStopRunAs(parent) {
    var html = `
    <div id="stop_runas_div">
        <button id="stop_runas" class="btn btn-danger">
            Stop running as: ${current_page.runas}
        </button>
    </div>
            `;
    parent.prepend(html);

    $('#stop_runas').click(function () {
        // Reload the page without the runas parameter
        var parsedUrl = new URL(window.location.href);
        parsedUrl.searchParams.delete("runas");
        window.location.href = parsedUrl.href;
    });
}

/*

SOAP

*/
function doSOAP(action, body, successCallback, server, instance, database) {
    var url = `https://${server}/${instance}/appfxwebservice.asmx`;
    var clientheader = `<ClientAppInfo REDatabaseToUse="${database}" ClientAppName="SHERPA" TimeOutSeconds="100" RunAsUserID="00000000-0000-0000-0000-000000000000" xmlns="Blackbaud.AppFx.WebService.API.1" />`;

    var soapbody = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <${action} xmlns="Blackbaud.AppFx.WebService.API.1">
    ${clientheader}
    ${body}
    </${action}>
  </soap12:Body>
</soap12:Envelope>
`;

    var item = {
        url: url,
        auth: current_page.settings.auth,
        responseType: "SOAP",
        soap: soapbody
    };
    doSOAPAJAX(item, successCallback);
}

function doSOAPAJAX(item, successCallback) {
    var auth = item.auth;
    var url = item.url;

    console.log("SOAP AJAX");
    console.log(item);

    $.ajax
    ({
        type: "POST",
        url: url,
        dataType: 'text',
        data: item.soap,
        contentType: "text/xml; charset=\"utf-8\"",
        async: false,
        _request_item: item,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + auth);
        }
    }).done(function (data) {
        var response = {
            type: item.responseType,
            data: data,
            request: item
        };
        successCallback(response)
    }).fail(onAJAXFailure);
}

function onAJAXFailure(xhr, ajaxOptions, thrownError) {
    console.log("AJAXFail");
    console.log(thrownError);
    console.log(xhr);
    console.log(xhr.url);
    console.log(ajaxOptions);
    console.log(xhr.status);
    console.log(xhr.statusCode);
}

/////////**************************///////////////
// SCRIPT
// Wait until the page is actually loaded
var waitCounter = 0;
var checkExist = setInterval(function () {
    waitCounter++;
    // Check if header has populated yet
    if ($('.bbui-pages-banner').children().length > 0) {
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
