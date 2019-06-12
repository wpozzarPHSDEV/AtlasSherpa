
/**** INIT  *****/
function initServerSettingsTabs() {
    // init server tabs
    ServerSettingsTabs = new obj_SettingsServerTabs('#server_tabs');
    // Set up add server button
    $('#add_server_button').click(function (event) { ServerSettingsTabs.addTab(null); });

}


/**** EVENTS ******/
function divClick_newtab(url) {
    chrome.tabs.create({
        selected: true,
        url: url
    });
    window.close();
    return false;
}

function divClick_sametab(url) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tab) {
        chrome.tabs.update(tab.id, { url: url });
    });
    window.close();
    return false;
}



/**** UTIL *****/
function b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
}



/******* DOM  ******/
/* HISTORY LINKS */
function buildHistoryItems(historyItems, current_url) {
    var thisserverdb = null;
    var currentServer = "";
    var currentInstance = "";
    var currentDB = "";
    var currentSiteKey = "";

    var recent_by_site = {};

    // Parse and Sort the items
    // They are already filtered by matching "webui/webshellpage.aspx?databasename"
    for (var i in historyItems) {
        var item = historyItems[i];

        // Get title
        var title = item.title.replace(" - Blackbaud CRM", "");
        // Parse URL
        var parsedUrl = new URL(item.url);
        // need to do this seperately because URL stops at #
        var searchParams = new URLSearchParams(parsedUrl.hash.substr(1));
        // Set page properties
        var page = {
            title: title,
            url: item.url,
            //id: searchParams.get("recordId"),
            database: parsedUrl.searchParams.has("databasename") ? parsedUrl.searchParams.get("databasename") : parsedUrl.searchParams.get("databaseName"),
            runas: parsedUrl.searchParams.get("runas"),
            server: parsedUrl.host.indexOf('.') > 0 ? parsedUrl.hostname.substr(0, parsedUrl.host.indexOf('.')) : parsedUrl.hostname,
            server_hostname: parsedUrl.hostname,
            instance: parsedUrl.pathname.split('/')[1],
            pageid: searchParams.get("pageId"),
            last_visit_date: new Date(item.lastVisitTime),
            last_visit_timestamp: item.lastVisitTime,
            parsedUrl: parsedUrl,
            //current_url: current_url.href
        };
        // fix page id if it's not a page
        switch (searchParams.get("pageType")){
            case "p":
                page.pageid = searchParams.get("pageId");
                break;
            case "fa":
                page.pageid = searchParams.get("faId");
                break;
            case "fs":
                page.pageid = "search";
                break;
            default:
                page.pageid = ""
                break;
        }
        // add key
        page.site_key = page.server + page.instance + page.database
        // Create entry
        if (!(page.site_key in recent_by_site)) {
            recent_by_site[page.site_key] = {};
        }
        // dedupe
        if (!(page.url in recent_by_site[page.site_key])) {
            recent_by_site[page.site_key][page.url] = page;
        }        
    }
    // Sort by date last visited
//    pages.sort(function (a, b) {
 //       return b.last_visit_timestamp - a.last_visit_timestamp;
  //  });


    // Now that we have the lists we can create the entries
    var history_links = $("#history_links2");
    for (var sitekey in recent_by_site) {
        var site = recent_by_site[sitekey];
        var first = true;
        if (site.length == 0) { continue }

        // Populate the History tab for this site
        for (var pagekey in site) {
            var page = site[pagekey];
            if (first) {
                // set up site
                var currentServer = Settings.servers.find(o => o.url.toUpperCase() == page.parsedUrl.hostname.toUpperCase());
                var currentInstance = null;
                if (currentServer) {
                    currentInstance = currentServer.instances.find(o => o.path.toUpperCase() == page.instance.toUpperCase());
                }
                var site_list = $(genHistorySite(page, currentServer, currentInstance)).appendTo(history_links);

                // set instance color
                if (currentInstance) {
                    if (currentInstance.color != "") {
                        //site_list.find('.site_header').css('box-shadow', `inset 2px 0px ${currentInstance.color}`);
                        site_list.find('.site_header').css('border-left', `5px solid ${currentInstance.color}`);
                        //site_list.find('.site_history_links').css('border-left', `3px solid ${currentInstance.color}`);
                        //site_list.find('.site_instance_name').css('background-color', currentInstance.color);
                    }
                }
                first = false;
            }
            // Create the page listing
            site_list.find('.site_history_links').append(genHistorySiteItem(page));
        }
    }

    // Add the events
    $('.site_history .site_header').click(function () {
        var showme = true;
        if ($(this).hasClass('active')) {
            showme = false;
        }
        $('.site_history_links').hide();
        $('.site_history .site_header').removeClass('active');
        if (showme) {
            $(this).addClass('active');
            $(this).nextAll('ul').show();
        }
    });

    // Open the first one by default
    $('.site_history .site_header').first().click();

}




function genHistorySite(site, linkedServer, linkedInstance) {
    
    var site_name = linkedServer ? linkedServer.name : site.server;
    var instance_name = linkedInstance ? linkedInstance.name : site.instance;

    return `
        <div class="site_history">
            <div class="site_header d-flex">
                <div class="d-inline-flex flex-grow-1 header-title">
                    <div>${site.database}</div>
                    <div class ="site_info flex-grow-1">
                        
                    </div>
                    <div class="site_instance_name">${instance_name}</div>
                </div>
                <div class ="clickableDiv db-link" data-href="https://${site.server_hostname}/${site.instance}/webui/webshellpage.aspx?databasename=${site.database}" title="Go to Home">
                    <i class ="fas fa-home"></i>
                </div>
            </div>
            <ul class ="site_history_links list-group"></ul>
        </div>
        `;
}


function genHistorySiteItem(item) {
    var pageinfo = KnownPages.find(page => page.id.toUpperCase() == item.pageid.toUpperCase());
    //var favicon = `<i class="fas fa-atlas"></i>`;
    var defaultimg = 'img/Blackbaud/AppFx/browser/imagelibrary/__small/goto_round.png';
    
    return `
        <li class ="list-group-item">
            <div data-href="${item.url}" title="${item.last_visit_date.toLocaleString("en-US")}&#xA;${item.title}&#xA;${item.url}}" class ="clickableDiv flex-grow-1 d-inline-flex">
                <div class ="history-icons">
                    <img src="${pageinfo ? pageinfo.img: defaultimg}" />
                    
                    ${item.runas ? '<i title="' + item.runas + '" class="fas fa-user-friends"></i>': ''}
                </div>
                <div class ="history-title">${item.title}</div>
            </div>
        </li>
       `;
}
