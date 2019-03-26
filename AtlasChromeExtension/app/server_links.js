/* INIT */
function initServerLinks() {
    var link_parent = "#server_links";
    // clear old list if there is one
    $(link_parent).empty();
  //Populate
    Settings.servers.forEach(server => {
        server.instances.forEach(instance => {
            genServerInstanceLink(server, instance, link_parent);
            getDatabaseInfoBackground(server, instance, link_parent);
        })
    });


        
}

function initServerLinkEvents(server_link) {
    // Event Hook
    //$('.server_link-header .header-title')
    $(server_link).find('.header-title').click(function () {
        var this_server = $(this).parents('.server_link');
        console.log("this server_link");
        console.log(this_server);
        // If it's currently active then go back to server list
        if (this_server.hasClass('active')) {
            this_server.removeClass('active');
            $('.server_link-dblist').hide()
            $('.server_link').show();
        } else {
            // Not active so this is the server list view and we should open this one and hide the others
            this_server.addClass('active');
            // Hide all server_link sections
            $('.server_link').hide();
            // Show just this one + db list
            this_server.show();
            this_server.find('.server_link-dblist').show();
        }

    });
}

/* DOM GENERATION */
function genServerInstanceLink(server, instance, link_parent) {
    
    var instance_link_url = 'https://' + server.url + '/' + instance.path + '/browser/brandingpages/bbec/default.aspx';
    
    var server_link_html = `
        <div class ="server_link" data-serverurl="${server.url}" data-instancepath="${instance.path}">
            <div class ="server_link-back">
                <div class ="d-flex justify-content-center"><i class ="fas fa-chevron-up"></i></div>
            </div>
            <div class ="server_link-header d-flex" style="box-shadow:inset 0 -2px ${instance.color}">
                <div class ="d-inline-flex flex-grow-1 header-title">
                    <div class ="server-icon"><i class ="fas fa-sync fa-spin"></i></div>
                    <div>${instance.name} (${server.name})</div>
                </div>
                <div class ="clickableDiv instance-link" data-href="${instance_link_url}" title="DB List">
                    <i class ="fas fa-external-link-square-alt"></i>
                </div>
            </div>
            <ul class="server_link-dblist list-group">
            </ul>
        </div>
        `
    // Add server_instance to list
    //$(link_parent).append(server_link);
    var server_link = $(server_link_html).appendTo(link_parent);
    initServerLinkEvents(server_link);

    // Get databases async
    //getDatabaseInfoBackground(server, instance);
}

function genDatabaseLinks(databases, server, instance, link_parent) {

    var instance_div = $(`.server_link[data-serverurl="${server.url}"][data-instancepath="${instance.path}"]`);
    var instance_icon = instance_div.find('.server-icon');
    
    // Turn off the spinner
    instance_icon.html('<i class="fas fa-server"></i>');
    // Check for error
    if (databases == null) {
        // No database info = error
        // Set the icon to error
        instance_icon.addClass('text-danger');
        return;
    };

    // At this point we have databases so we are good to go

    var instance_node = instance_div.find('.server_link-dblist');

    var jump_links = [
    {
        name: "Administration",
        link: "pageType=fa&faId=64bbf407-7062-4f63-bc7c-e947f3eef6aa",
        sub_links: [
            {
                name: "Application Users",
                link: "pageType=p&pageId=ae1deedd-6b2d-4c03-b4d4-f74e583a6ad7"
            }
        ]
    },
    {
        name: "Analysis",
        link: "pageType=fa&faId=60d6fd25-1110-430e-a739-4c4062325758",
        sub_links: [
            {
                name: "Information Library",
                link: "pageType=p&pageId=a5b552bc-d387-47a3-8c35-e36cc2f1af4e"
            }
        ]
    }
    ]

    databases.each(function () {
        /*
        <AvailableDatabase>
            <DatabaseKey>BBInfinity</DatabaseKey>
            <DBInfo>
                <SQLVersion>
                Microsoft SQL Server 2016 (SP2-CU4) (KB4464106) - 13.0.5233.0 (X64) Nov 3 2018 00:01:54 Copyright (c) Microsoft Corporation Developer Edition (64-bit) on Windows Server 2016 Standard 10.0 <X64> (Build 14393: ) (Hypervisor)
                </SQLVersion>
                <SQLProductVersion>13.0.5233.0</SQLProductVersion>
                <SQLServerName>PHSSQLD2232</SQLServerName>
                <SQLDatabaseName>CRM_QA</SQLDatabaseName>
                <SQLMachineName>PHSSQLD2232</SQLMachineName>
                <SQLEdition>Developer Edition (64-bit)</SQLEdition>
                <ConnectionDataSource>phssqld2232</ConnectionDataSource>
                <ConnectionInitialCatalog>CRM_QA</ConnectionInitialCatalog>
                <AppInstallationName>Partners Healthcare System, Inc.</AppInstallationName>
                <AppSerialNumber>C6-44-5F-C3-55-C1</AppSerialNumber>
                <DatabaseDBRevisionKey>1650.410</DatabaseDBRevisionKey>
                <SiteID>21953</SiteID>
            </DBInfo>
        </AvailableDatabase>
        */
        var db_key = $(this).find('DatabaseKey').text();
        var db_info_raw = $(this).find('DBInfo').html();
        var db_info = {};
        $(this).find('DBInfo').children().each(function (index, element) {
            db_info[element.tagName] = $(this).text();
        });

        var href = 'https://' + server.url + '/' + instance.path + '/webui/webshellpage.aspx?databasename=' + db_key;

        var link = "";
        var links = "";

        // Build dropdown
        jump_links.forEach(function (header) {
            // build header
            links += `<div class ="jump_header dropdown-item clickableDiv" data-href="${href + '#' + header.link}">${header.name}</div>`;
            header.sub_links.forEach(function (sublink) {
                // build sub link
                links += `<div class ="jump_item dropdown-item clickableDiv" data-href="${href + '#' + sublink.link}">${sublink.name}</div>`;
            });
        });

        var item_html = `
            <li class ="list-group-item d-flex">
                <div data-href="${href}" class ="clickableDiv flex-grow-1 d-inline-flex">
                    <div class ="server-icon ${((db_info_raw == null ? ' text-danger ' : ''))}" title="${db_info_raw}"><i class ="fas fa-hdd"></i></div>
                    <div>${db_key}</div>
                </div>
                <div class ="dropdown">
                    <a class ="btn dropdown-toggle jump_button" href="#" data-toggle="dropdown"></a>
                    <div class ="dropdown-menu">
                        ${links}
                    </div>
                </div>

            </li>
            `;

        // Add node to instance list
        //instance_node.append(item_html);
        var item = $(item_html).appendTo(instance_node);
        /*
        item.find('[data-toggle="tooltip"]').tooltip({
            title: "NO DATA",
            container:"body",
            placement: "bottom"
        });
        */
    });
    
}

// Request Service Info from Background.js
function getDatabaseInfoBackground(server, instance, link_parent) {
    var url = "https://" + server.url + "/" + instance.path + "/util/ServiceInfo.ashx";

    var request = {
        type: "getServiceInfo",
        process_id: url
    };

    chrome.runtime.sendMessage(request, function (response) {
        var dbs = null;

        if (response) {
            // Check if it's done
            if (response.done) {
                // Check for an error
                if (response.error) {
                    // Error :(
                    console.log("getServiceInfo - ERROR: " + url);
                    console.log(response.error_message);
                } else {
                    // Success
                    console.log("Success! " + url);
                    dbs = $(response.response.data).find('DatabaseInfo>AvailableDatabase');
                    
                }
                genDatabaseLinks(dbs, server, instance, link_parent);
            } else {
                //Still Working
                console.log("STILL WORKING: " + url);
            }
        } else {
            // Weird Error
            console.log("Blank Response: " + url);
        }

        //genDatabaseLinks(dbs, server, instance, link_parent);
    });
}