
/**** INIT  *****/
function initServerSettingsTabs() {
    // init server tabs
    ServerSettingsTabs = new obj_SettingsServerTabs('#server_tabs');
    // Set up add server button
    $('#add_server_button').click(function (event) { ServerSettingsTabs.addTab(null); });

}


/**** EVENTS ******/
function divClick_newtab(url) {
    console.log("middle clicked" + url);
    chrome.tabs.create({
        selected: true,
        url: url
    });
    window.close();
    return false;
}

function divClick_sametab(url) {
    console.log("clicked" + url);
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
function buildHistoryItems(divName, historyItems) {
    var thisserverdb = null;
    var currentServer = "";
    var currentInstance = "";
    var currentDB = "";
    var currentSiteKey = "";

    var recent_thissite = [];
    var recent_othersites = [];
    var recent_sites = [];
    var recent_by_site = {};

    for (var i in historyItems) {
        item = historyItems[i];
        // Recent Sites
        if (!(item.site_key in recent_by_site)) {
            recent_by_site[item.site_key] = [];
        }
        recent_by_site[item.site_key].push(item);
    }

    // Now that we have the lists we can create the entries
    var history_links = $("#history_links2");
    for (i in recent_by_site) {
        if (recent_by_site[i].length == 0) { continue }
        var site = recent_by_site[i][0];
        var currentServer = Settings.servers.find(o => o.url.toUpperCase() == site.parsedUrl.hostname.toUpperCase());
        var currentInstance = null;
        if (currentServer) {
            currentInstance = currentServer.instances.find(o => o.path.toUpperCase() == site.instance.toUpperCase());
        }
        var site_list = $(genHistorySite(site, currentServer, currentInstance)).appendTo(history_links);

        // set instance color
        if (currentInstance) {
            if (currentInstance.color != "") {
                //site_list.find('.site_header').css('box-shadow', `inset 0 -2px ${currentInstance.color}`);
                site_list.find('.site_instance_name').css('background-color', currentInstance.color);
            }
        }
        

        recent_by_site[i].forEach(item => {
            site_list.find('.site_history_links').append(genHistorySiteItem(item));
        });
    }

    // Add the events
    $('.site_history .site_header').click(function () {
        $('.site_history_links').hide();
        $('.site_history .site_header').removeClass('active');
        $(this).addClass('active');
        $(this).nextAll('ul').show();
    });

    // Open the first one by default
    $('.site_history .site_header').first().click();

}




function genHistorySite(site, linkedServer, linkedInstance) {
    
    var site_name = linkedServer ? linkedServer.name : site.server;
    var instance_name = linkedInstance ? linkedInstance.name : site.instance;

    console.log("Gen History " + site.server);
    console.log(site);


    return `
        <div class="site_history">
            <div class="site_header d-flex">
                <div class="d-inline-flex flex-grow-1 header-title">
                    <div class ="flex-grow-1">${site.database}</div>
                    <!--<div class ="site_instance_name">${instance_name}</div>-->
                    <span class ="site_instance_name badge ">${instance_name}</span>
                </div>
                <div class ="clickableDiv db-link" data-href="https://${site.server_hostname}/${site.instance}/webui/webshellpage.aspx?databasename=${site.database}" title="DB Home">
                    <i class ="fas fa-external-link-square-alt"></i>
                </div>
            </div>
            <ul class ="site_history_links list-group"></ul>
        </div>
        `;
}


function genHistorySiteItem(item) {
    var pageinfo = KnownPages.find(page => page.id == item.pageid);
    var favicon = `<i class="fas fa-atlas"></i>`;
    
    return `
        <li class ="list-group-item d-flex">
            <div data-href="${item.url}" title="${item.title}" class ="clickableDiv flex-grow-1 d-inline-flex">
                <div class ="history-icon">${pageinfo ? pageinfo.icon: favicon}</div>
                <div>${item.title}</div>
            </div>
        </li>
       `;
}
