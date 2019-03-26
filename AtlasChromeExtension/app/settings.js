var KnownPages = [
    {
        id: '88159265-2b7e-4c7b-82a2-119d01ecd40f',
        type: 'Constituent',
        icon: '<i class="far fa-address-card"></i>'
    }
];

function obj_Settings() {
    this.username = "";
    this.auth = "";
    this.servers = new Array();
}

function obj_Server(name, url) {
    this.name = name;
    this.url = url;
    this.instances = new Array();
}

function obj_Instance(name, path, color) {
    this.name = name;
    this.path = path;
    this.color = color;
}


/* DOM GENERATION */
function genServerSettings(server, serverid) {
    console.log(`genServerSettings: ${serverid}`);
    var formid = `set_${serverid}`;

    var link_parent = "#set_server_list";
    var form_parent = "#set_server_forms";

    var link = `<a href="#${formid}" data-serverid="${serverid}" class="list-group-item list-group-item-action">${server.name}</a>`;

    var form = `
        <div id="${formid}" data-serverid="${serverid}">
            <div class ="set_form_header">
                <span class ="set_server_header"><i class ="fas fa-server"></i> ${server.name}</span>
                <div class ="dropdown float-right server_actions">
                    <a class ="btn dropdown-toggle set_header_button" href="#" id="dropdownMenuLink" data-toggle="dropdown"></a>
                    <div class ="dropdown-menu" aria-labelledby="dropdownMenuLink">
                        <a class ="dropdown-item add_instance" href="#" data-serverid="${serverid}">Add Instance</a>
                        <a class ="dropdown-item delete_server" href="#" data-serverid="${serverid}">Delete Server</a>
                    </div>
                </div>
            </div>
            <div class ="set_form_body">
                <label class ="form-label-sm">Name</label>
                <input type="text" class ="server_name_input form-control" value="${server.name}" />
                <label class ="form-label-sm">URL</label>
                <div class ="input-group help-text-input-group">
                  <div class ="input-group-prepend">
                    <span class ="input-group-text">https://</span>
                  </div>
                  <input type="text" class ="server_url_input form-control" value="${server.url}" />
                </div>
            </div>
        </div>
        `;

    //$(link_parent).append(link);
    //$(form_parent).append(form);

    var newLink = $(link).appendTo(link_parent);
    var newForm = $(form).appendTo(form_parent);
    // Set up events
    updateServerHooks(newLink, newForm);
    
    // Add Instances
    server.instances.forEach(function (instance, index) {
        var instanceid = "i" + index;
        genInstanceSettings(instance, server, serverid, instanceid);
    });

}

function genInstanceSettings(instance, server, serverid, instanceid) {
    var formid = `set_${serverid + instanceid}`;

    var link_parent = "#set_instance_list";
    var form_parent = "#set_instance_forms";

    var link = `<a href="#${formid}" data-serverid="${serverid}" data-instanceid="${instanceid}" class="list-group-item list-group-item-action">${instance.name} <div class="instance_color"> </div></a>`;

    var form = `
        <div id="${formid}" data-serverid="${serverid}" data-instanceid="${instanceid}">
            <div class ="set_form_header">
                <span class="set_instance_header"><i class ="fas fa-hdd"></i> ${instance.name}</span>
                <div class ="dropdown float-right instance_actions">
                    <a class ="btn dropdown-toggle set_header_button" href="#" id="dropdownMenuLink" data-toggle="dropdown"></a>
                    <div class ="dropdown-menu" aria-labelledby="dropdownMenuLink">
                        <a class ="dropdown-item delete_instance" href="#" data-serverid="${serverid}" data-instanceid="${instanceid}">Delete Instance</a>
                    </div>
                </div>
            </div>
            <div class ="set_form_body">
                <label class ="form-label-sm">Name</label>
                <input type="text" class ="instance_name_input form-control" value="${instance.name}" />
                <label class ="form-label-sm">Path</label>
                
                <div class ="input-group help-text-input-group">
                  <div class ="input-group-prepend">
                    <span class ="input-group-text">${server.url}/</span>
                  </div>
                  <input type="text" class ="instance_path_input form-control" value="${instance.path}" />
                </div>

                <label class ="form-label-sm">Inject Border Color</label>
                ${genColorPicker(instance.color)}
            </div>
        </div>
        `;

    //$(link_parent).append(link);
    //$(form_parent).append(form);

    var newLink = $(link).appendTo(link_parent);
    // add color to link if exists
    newLink.find(".instance_color").css('background-color', instance.color);
    var newForm = $(form).appendTo(form_parent);
    // Set up events
    updateInstanceHooks(newLink, newForm);

}

function genColorPicker(current_color) {
    var colors = {
        "None" : "",
        "Green" : "#7bd148",
        "Turquoise" : "#46d6db",
        "Yellow" : "#fbd75b",
        "Bold red" : "#dc2127",
        "Purple" : "#dbadff"
    }

    var colorpicker = `<select class ="form-control colorpicker">`;

    for (var i in colors) {
        if (colors[i] == current_color) {
            colorpicker += `<option selected value="${colors[i]}">${i}</option>`
        } else {
            colorpicker += `<option value="${colors[i]}">${i}</option>`
        }        
    }
    colorpicker += `</select>`

    return colorpicker;
}

/* EVENTS */
function show_general_settings() {
    // General
    // Show General Form
    $('#set_general_forms .set_form_body').show();
    // Show Server List
    $('#set_server_list').show();

    // Servers
    // Hide all servers that are open
    $('#set_server_forms > div').hide();

    // Instances
    // Hide any open instance forms
    $('#set_instance_forms > div').hide();
    // Hide the instance list
    $('#set_instance_list').hide();
}

function show_server_settings(serverid) {
    // Since this can be called from elsewhere we need to make sure the settings tab is visible
    $('#settings_tab_link').tab('show');
    // General
    // Hide General Form
    $('#set_general_forms .set_form_body').hide();
    // Hide Server List
    $('#set_server_list').hide();

    // Servers
    // Hide all servers that are open
    $('#set_server_forms > div').hide();
    // Show the selected server
    $('#set_' + serverid).show();
    // Make sure that the form is visible
    $('#set_' + serverid + ' .set_form_body').show();
    // Make sure the actions button is visible
    $('#set_' + serverid + ' .server_actions').show();

    // Instances
    // Hide any open instance forms
    $('#set_instance_forms > div').hide();
    // Hide all links to start
    $('#set_instance_list > a').hide();
    // Show the related links
    $("#set_instance_list > a[data-serverid='" + serverid + "']").show();
    // Show the whole list
    $('#set_instance_list').show();
}

function show_instance_settings(serverid, instanceid) {
    // Servers
    console.log(`show_instance: ${serverid} : ${instanceid}`);
    // Hide body of server settings
    $('#set_' + serverid + ' .set_form_body').hide();
    // Hide server actions button
    $('#set_' + serverid + ' .server_actions').hide();
    // Hide Instance List
    $('#set_instance_list').hide();

    // Instances
    // Hide any open instance forms
    $('#set_instance_forms > div').hide();
    // Show selected instance
    $('#set_' + serverid + instanceid).show();
}

/* INIT */
function addServer(server_name, server_url, instance){
    console.log("add_server");
    var newServer = new obj_Server(server_name, server_url);
    var instance_name = instance
    if(instance == ""){
        instance = "bbappfx";
        instance_name = "BBAppFx(Default)";
    }
    newServer.instances.push(new obj_Instance(instance_name, instance, ""));
    Settings.servers.push(newServer);
    console.log(Settings);
    var serverid = 's' + (Settings.servers.length - 1).toString();
    console.log(serverid);
    genServerSettings(newServer, serverid);
    // Show new server
    show_server_settings(serverid);
}


function initSettingsForm() {
    //Populate Form
    $('#settings_username').val(Settings.username);
    $('#settings_servers').val(Settings.servers);
    Settings.servers.forEach(function (server, index) {
        var serverid = 's' + index;
        genServerSettings(server, serverid);
    });

    // Add New Server
    $('#add_server').click(function () {
        addServer("New Server", "", "");
    });

    // General Header
    $('#set_general_forms .set_form_header').click(function () {
        show_general_settings();

    });

    // Save Settings
    $('#save_settings').click(saveSettings)
}

function updateServerHooks(newLink, newForm) {
    //Settings Form Events
    // Server Link
    newLink.click(function () {
        // Get server id
        var serverid = $(this).data('serverid');

        show_server_settings(serverid);
    });
    // Server Header
    newForm.find('.set_form_header').click(function () {
        // Get server id
        var serverid = $(this).parent().data('serverid');
        show_server_settings(serverid);

    });

    // Delete Server
    newForm.find('.delete_server').click(function () {
        console.log("delete server");
        // Get current server
        var currentServerID = $(this).data('serverid');
        var currentServerIndex = currentServerID.match(/\d+$/)[0];
        // Remove from settings object
        Settings.servers.splice(currentServerIndex, 1);
        console.log(Settings);

        // Remove server from form
        $(`#set_server_list a[data-serverid='${currentServerID}']`).remove();
        $(`#set_server_forms div[data-serverid='${currentServerID}']`).remove();

        // Remove instances from form
        $(`#set_instance_list a[data-serverid='${currentServerID}']`).remove();
        $(`#set_instance_forms div[data-serverid='${currentServerID}']`).remove();

        // Go back to general settings
        show_general_settings();

    });

    // Add New Instance
    newForm.find('.add_instance').click(function () {

        // Get current server
        var currentServerID = $(this).data('serverid');
        var currentServerIndex = currentServerID.match(/\d+$/)[0];
        console.log("add_instance");
        console.log(`serverid: ${currentServerIndex}`);

        var newInstance = new obj_Instance("New Instance", "", "");
        Settings.servers[currentServerIndex].instances.push(newInstance);
        console.log(Settings);

        var serverid = currentServerID;
        var instanceid = 'i' + (Settings.servers[currentServerIndex].instances.length - 1).toString();
        genInstanceSettings(newInstance, serverid, instanceid);
        // Show new Instance
        console.log(`showing instance: ${instanceid}`);
        show_instance_settings(serverid, instanceid);
    });
}

function updateInstanceHooks(newLink, newForm) {
    //Settings Form Events

    // Instance Link
    newLink.click(function () {
        // Get server id
        var serverid = $(this).data('serverid');
        // Get instance id
        var instanceid = $(this).data('instanceid');

        show_instance_settings(serverid, instanceid);
    });

    // Color Picker
    newForm.find('.colorpicker').simplecolorpicker();

    // Delete Instance
    newForm.find('.delete_instance').click(function () {
        console.log("delete instance");
        // Get current server & instance
        var currentServerID = $(this).data('serverid');
        var currentServerIndex = currentServerID.match(/\d+$/)[0];
        var currentInstanceID = $(this).data('instanceid');
        var currentInstanceIndex = currentInstanceID.match(/\d+$/)[0];
        // Remove from server object
        Settings.servers[currentServerIndex].instances.splice(currentInstanceIndex, 1);
        console.log(Settings);

        // Remove instance from form
        $(`#set_instance_list a[data-instanceid='${currentInstanceID}']`).remove();
        $(`#set_instance_forms div[data-instanceid='${currentInstanceID}']`).remove();

        // go back to server view
        show_server_settings(currentServerID);

    });
}

/******  SETTINGS  ********/

function saveSettings() {
    console.log("saveSettings");
    var newSettings = new obj_Settings();

    // Username & Password
    newSettings.username = $('#settings_username').val();
    newSettings.auth = Settings.auth;
    var password = $('#settings_password').val();
    if (password.length > 0) {
        // Password has changed so recalculate auth
        newSettings.auth = b64EncodeUnicode(newSettings.username + ':' + password);
    } else if (newSettings.username != Settings.username) {
        // new username but no new password
        // ERROR
        alert("Must enter password!");
        return;
    }

    // Servers
    $('#set_server_forms > div').each(function () {
        // TODO validate?
        var server_info = $(this);
        var server = new obj_Server(server_info.find('.server_name_input').val(), server_info.find('.server_url_input').val());
        // Instances
        $(`#set_instance_forms > div[data-serverid='${server_info.data('serverid')}']`).each(function () {
            // TODO validate?
            var instance_info = $(this);
            var instance_name = instance_info.find('.instance_name_input').val();
            var instance_path = instance_info.find('.instance_path_input').val();
            var instance_color = instance_info.find('.colorpicker').val();
            var instance = new obj_Instance(instance_name, instance_path, instance_color);
            server.instances.push(instance);
        });
        newSettings.servers.push(server);
    });

    console.log("new setttings");
    console.log(newSettings);
    Settings = newSettings;
    // Save settings
    chrome.storage.sync.set({ AtlasSherpaSettings: Settings }, function () {
        console.log('Value is set to ' + Settings);
    });

    // Refresh the Server Data
    refreshServerData();

}

function refreshServerData() {
    // Refresh Background Info
    chrome.runtime.sendMessage({ type: "refreshServerData" });
    // Rebuild server links
    initServerLinks();

}
