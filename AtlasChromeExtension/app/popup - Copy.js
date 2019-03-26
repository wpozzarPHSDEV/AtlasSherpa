var Settings = {}

/*
phsqaatlas02.partners.org:bbappfx
w0086316.partners.org:CRM_wsptest
crmdev.partners.org:CRM_DesVal,CRM_DesignSandbox,CRM_ConvVal
*/
/**** EVENTS ******/
function divClick_newtab(url) {
    console.log("middle clicked" + url);
    chrome.tabs.create({
        selected: true,
        url: url
    });
    return false;
}

function divClick_sametab(url) {
    console.log("clicked" + url);
    chrome.tabs.query({ currentWindow: true, active: true }, function (tab) {
        chrome.tabs.update(tab.id, { url: url });
    }); return false;
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

function buildLinks(divName) {
    // load server/instance list
    var links = parseServerString(Settings.servers);

    var main_div = document.getElementById(divName);
    // clear old list if there is one
    main_div.innerHTML = "";
    var main_node = document.createElement('ul');
    main_node.className = "link_list";
    links.forEach(server => {
        var server_li = document.createElement('li');
        var server_name = document.createElement('div');
        server_name.className = "server_name_header"
        server_name.innerHTML = server.name;
        server_li.appendChild(server_name);
        var server_node = document.createElement('ul');
        server_node.className = "server_links";
        server.instances.forEach(instance => {
            var instance_li = document.createElement('li');
            var instance_link = document.createElement('div');
            instance_link.innerHTML = '<i class="fas fa-table"></i> ' + instance;
            instance_link.className = "clickableDiv";
            instance_link.dataset.href = 'https://' + server.url + '/' + instance + '/browser/brandingpages/bbec/default.aspx';
            instance_li.appendChild(instance_link);
            var instance_node = document.createElement('ul');
            instance_node.id = instance + '_instance';
            // Add everything to the DOM
            instance_li.appendChild(instance_node);
            server_node.appendChild(instance_li);
            server_li.appendChild(server_node);
            main_node.appendChild(server_li);
            main_div.appendChild(main_node);
        });
    });
    // Get databases async
    links.forEach(server => {
        server.instances.forEach(instance => {
            getDBs(server.url, instance);
        })
    });
    // Set up link list click
    $('.server_name_header').click(function () {
        $(this).next().toggle();
    });

}

function buildDatabaseLinks(server_url, instance_name, databases) {
    var instance_node = document.getElementById(instance_name + '_instance');
    databases.forEach(database => {
        var database_li = document.createElement('li');
        var database_link = document.createElement('div');
        database_link.innerHTML = '<i class="fas fa-database"></i> ' + database;
        database_link.className = "clickableDiv";
        database_link.dataset.href = 'https://' + server_url + '/' + instance_name + '/webui/webshellpage.aspx?databasename=' + database;
        database_li.appendChild(database_link);
        instance_node.appendChild(database_li);
    });
}

function getDBs(server_url, instance) {
    var url = "https://" + server_url + "/" + instance + "/util/GetAvailableDatabases.ashx";
    $.ajax
      ({
          type: "POST",
          url: url,
          dataType: 'xml',
          async: true,
          beforeSend: function (xhr) {
              xhr.setRequestHeader("Authorization", "Basic " + Settings.auth);
          },
          success: function (data) {
              // add the databases to the instance
              var databases = [];
              $(data).find('db').each(function (index) {
                  databases.push($(this).text());
              });
              buildDatabaseLinks(server_url, instance, databases);
          },
          error: function (xhr, ajaxOptions, thrownError) {
              console.log(thrownError);
              console.log(xhr);
          }
      });
}


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
        // Fill in current tab location
        if (!thisserverdb) {
            thisserverdb = new URL(item.current_url);
            // Check if we are currently on a CRM page
            currentServer = thisserverdb.hostname.substr(0, thisserverdb.host.indexOf('.'))
            currentInstance = thisserverdb.pathname.split('/')[1]
            currentDB = thisserverdb.searchParams.get("databasename")
            currentSiteKey = currentServer + currentInstance + currentDB;
        }
        // Recent Sites
        var site_key = item.server + item.instance + item.database;
        if(!(site_key in recent_by_site)){
            recent_by_site[site_key] = [];
        }
        recent_by_site[site_key].push(item);





        if (!(site_key in recent_sites) && Object.keys(recent_sites).length <= 2) {
            recent_sites[site_key] = item;
        }
        // Same Site
        if (site_key == currentSiteKey) {
            recent_thissite.push(item);
        } else {
            recent_othersites.push(item);
        }
    }
    // Fill in the "here"
    //document.getElementById('this_server').innerHTML = currentServer + ' / ' + currentInstance + ' / ' + currentDB;

    // Now that we have the lists we can create the entries
    for (i in recent_by_site) {
        recent_by_site[i].forEach(site => {
            buildHistoryItemBySite(site);
        });
    }

    for (i in recent_sites) {
        buildHistoryItem('recent_sites', recent_sites[i]);
    }
    

}

function buildHistoryItemBySite(item) {

    var site_key = item.server + item.instance + item.database;
    // get/create server node
    var server_node = document.getElementById(site_key + '_list');
    if (!server_node) {
        server_node = document.createElement('ul');
        server_node.id = site_key + '_list';
        var site_name = item.server + ' / ' + item.instance + ' / ' + item.database;
        server_node.appendChild(document.createTextNode(site_name));
    }
    // Create link now
    var historyitem_link = document.createElement('div');
    historyitem_link.className = 'clickableDiv';
    historyitem_link.dataset.href = item.url;
    historyitem_link.title = item.title;
    var historyitem_profile = document.createElement('div');
    historyitem_profile.className = 'profile_name';
    historyitem_profile.innerHTML = item.title;
    historyitem_link.appendChild(historyitem_profile);
    // link everything
    server_node.appendChild(document.createElement('li').appendChild(historyitem_link));
    document.getElementById("history_links").appendChild(server_node);
}

function buildHistoryItem(root_name, item) {
    var historyitem_link = document.createElement('div');
    historyitem_link.className = 'clickableDiv';
    historyitem_link.dataset.href = item.url;
    historyitem_link.title = item.title;
    var historyitem_profile = document.createElement('div');
    historyitem_profile.className = 'profile_name';

    historyitem_profile.innerHTML = item.database + ' (' + item.server + '/' + item.instance + ')';
    historyitem_link.appendChild(historyitem_profile);

    // link everything
    var root_node = document.getElementById(root_name);
    var historyitem_li = document.createElement('li');
    historyitem_li.appendChild(historyitem_link);
    root_node.appendChild(historyitem_li);
}

/******  SETTINGS  ********/

function parseServerString(servers) {
    // load new server/instance list
    var server_entries = servers.split('\n')
    var links = [];
    server_entries.forEach(entry => {
        var server_url = entry.substr(0, entry.indexOf(':'));
        //bail if no server
        if (server_url.length == 0) {
            return;
        }
        var instance_list = entry.substr(entry.indexOf(':') + 1).split(',');
        var crmlink = {
            url: server_url,
            name: server_url,
            instances: []
        };
        instance_list.forEach(instance => {
            crmlink.instances.push(instance)
        });
        links.push(crmlink);
    });
    return links;
}
//////////////////////////////////////////////////////////////////////


/* DOC READY */
$(function () {
    // Set up tabs
    $("#tabs").tabs();
    $('#server_tabs').tabs();
    $('#add_server_button').click(addTab());
    // Load settings
    chrome.storage.sync.get(['AtlasSherpaSettings'], function (result) {
        Settings = result.AtlasSherpaSettings;
        if (!Settings) {
            Settings = {
                username: "",
                auth: "",
                servers: ""
            }
        }
        // Populate Settings Form
        thing2();
        $('#setting_username').val(Settings.username);
        $('#setting_servers').val(Settings.servers);
        // Build Links
        buildLinks("server_links");

        // Get current tab
        chrome.tabs.query({ 'active': true, 'currentWindow': true }, function (tabs) {
            var current_url = tabs[0].url;
            // Get browser history for CRM pages
            chrome.history.search({
                'text': 'webui/webshellpage.aspx?databasename', // Load CRM pages
                'startTime': 31500000000 // one year in milliseconds (ish)
            },
              function (historyItems) {
                  var pages = [];
                  for (var i in historyItems) {
                      // Skip if there is no title
                      if (!historyItems[i].title) {
                          continue;
                      }
                      // Get title & section
                      var title
                      var title_match = /(?:(.*) - )?Blackbaud CRM$/;
                      var match = title_match.exec(historyItems[i].title);
                      // Skip the result if it doesn't match the CRM style
                      if (!match) {
                          continue;
                      } else if (match.length > 1) {
                          title = match[1];
                      } else {
                          title = match[0];
                      }
                      // Parse URL
                      var parsedUrl = new URL(historyItems[i].url);
                      // need to do this seperately because URL stops at #
                      var searchParams = new URLSearchParams(parsedUrl.hash.substr(1));
                      // Skip if it already exists in the list
                      if (searchParams.get("recordId") in pages) {
                          continue;
                      }
                      // Get item properties
                      var page = {
                          title: title,
                          url: parsedUrl.href,
                          id: searchParams.get("recordId"),
                          database: parsedUrl.searchParams.get("databasename"),
                          server: parsedUrl.hostname.substr(0, parsedUrl.host.indexOf('.')),
                          instance: parsedUrl.pathname.split('/')[1],
                          pageid: searchParams.get("pageId"),
                          last_visit_date: new Date(historyItems[i].lastVisitTime).toLocaleString('en-US'),
                          last_visit_timestamp: historyItems[i].lastVisitTime,
                          parsedUrl: parsedUrl,
                          current_url: current_url
                      };

                      // Create entry
                      pages[page.id] = page;
                  }
                  // Sort by date last visited
                  pages.sort(function (a, b) {
                      return b.last_visit_timestamp - a.last_visit_timestamp;
                  });
                  // Create the initial recent list
                  buildHistoryItems("recent_here", pages);
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

    

    // Settings Form
    $('#settings_form').focusout(function () {
        // keep a copy to see what changed
        var settings_changed = false;
        var username = $('#setting_username').val();
        if (username != Settings.username) {
            settings_changed = true;
            Settings.username = $('#setting_username').val();
            // TODO: force password change when username changes
        }
        var password = $('#setting_password').val();
        if (password.length > 0) {
            settings_changed = true;
            // password may have changed
            Settings.auth = b64EncodeUnicode(Settings.username + ':' + password);
        }
        // set up servers
        var servers = $('#setting_servers').val();
        if (servers != Settings.servers) {
            settings_changed = true;
            Settings.servers = servers;
        }
        // Save settings
        if (settings_changed) {
            console.log("Saving Settings");
            // Rebuild server links
            buildLinks("server_links");
            // Save settings
            chrome.storage.sync.set({ AtlasSherpaSettings: Settings }, function () {
                console.log('Value is set to ' + Settings);
            });
        }
    });




});

function thing() {

    var form_schema = {
        "title": "Servers",
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Display Name",
                "minLength": 1
            },
            "url": {
                "type": "string",
                "description": "Host Name",
                "minLength": 1
            },
            "instances": {
                "type": "array",
                "format": "table",
                "title": "Instances",
                "uniqueItems": true,
                "items": {
                    "type": "object",
                    "title": "Instance",
                    "properties": {
                        "name": {
                            "type": "string"
                        },
                        "databases": {
                            "type": "array",
                            "format": "table",
                            "title": "Databases",
                            "uniqueItems": true,
                            "items": {
                                "type": "string",
                                
                            }
                        }
                    }
                }
            }
        }
    };


    // Initialize the editor with a JSON schema
    var editor = new JSONEditor(document.getElementById('json_test'), {
        schema: form_schema,
        theme: 'barebones',
        disable_array_delete_all_rows: true,
        disable_array_delete_last_row: true,
        disable_array_reorder: true,
        disable_edit_json: true,
        disable_properties: true,
        disable_collapse: true

    });

    // Listen for changes
    editor.on("change", function () {
        console.log("form changed!");
        console.log(editor.getValue());
        // Validate
        var errors = editor.validate();
        if (errors.length) {
            console.log("form not valid");
        }

    });

}

var Config = {
    servers: []
};


function Server(name, url) {
    this.name = name;
    this.url = url;
    this.instances = [];
}

function thing2(formDiv) {
    var root_div = document.getElementById(formDiv);

    var server = new Server("server1", "url1");
    server.instances.push("instance1", "instance2");
    Config.servers.push(server);
    var server = new Server("server2", "url2");
    server.instances.push("instance1", "instance2");
    Config.servers.push(server);
    var server = new Server("server3", "url3");
    server.instances.push("instance1", "instance2");
    Config.servers.push(server);

    // build form for each server
    Config.servers.forEach(server => {
        addTab(server);
    });

}

function buildServerElement(server) {

}



function addTab(server) {
    console.log("adding tab");
    var tabs = $("#server_tabs");
    var current_tab_count = tabs.find(".ui-tab").length;
    var tabTemplate = "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>";



    var label = "New Tab";
    var tabContentHtml = "Tab " + current_tab_count + " content.";
    if (server) {
        label = server.name;
        tabContentHtml = server.url;
    }

    var id = "tabs-" + current_tab_count;
    var li = $(tabTemplate.replace(/#\{href\}/g, "#" + id).replace(/#\{label\}/g, label));

    tabs.find(".ui-tabs-nav").append(li);
    tabs.append("<div id='" + id + "'><p>" + tabContentHtml + "</p></div>");
    tabs.tabs("refresh");
}