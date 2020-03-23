//chrome.runtime.onMessage.addListener(
//   function (request, sender, sendResponse) {
//       alert("BACK: I am called");
//        chrome.tabs.query({ currentWindow: true }, function (tabs) {
//            sendResponse({ url: tabs[0].url });
//        });
//        return true; //so i can use sendResponse later
//   }
//);

// Inject the content script
/*
chrome.webNavigation.onCompleted.addListener(function (details) {
    console.log("FROM BACKGROUND");
    chrome.tabs.insertCSS(details.tabId, { file: './plugins/bootstrap-4.2.1-dist/css/bootstrap.min.atlas_nav.css' });
    chrome.tabs.insertCSS(details.tabId, { file: 'content.css' });
    chrome.tabs.executeScript(details.tabId, { file: './plugins/jquery/jquery-3.3.1.min.js' });
    chrome.tabs.executeScript(details.tabId, { file: './plugins/bootstrap-4.2.1-dist/js/bootstrap.bundle.min.js' });
    chrome.tabs.executeScript(details.tabId, { file: 'content.js' });
}, {
    url: [{
        pathContains: "webshellpage.aspx"
    }],
});

chrome.webNavigation.onCompleted.addListener(function (details) {
    console.log("FROM BACKGROUND");
    chrome.tabs.executeScript(details.tabId, { code: 'console.log("Calling from Background.....");' });
}, {
    url: [{
        pathContains: "webshellpage.aspx"
    }],
});
*/
var Settings = null;
var ProcessQueue = [];

function _AJAXProcess(request) {
    this.request = request;
    this.response = null
    this.done = false;
    this.error = false;
    this.error_message = null;
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.type) {
        case "getServiceInfo":
            // request.process_id = url
            sendResponse(ProcessQueue[request.process_id]);
            break;
        case "startProcessing":
            console.log("Processing");
            console.log(request);
            doAJAX(request.item);  //   is passed in the message
            // Send Back Message?
            break;
        case "printQueue":
            console.log("ProcessQueue");
            console.log(ProcessQueue);
            break;
        case "refreshServerData":
            console.log("Refreshing Server Data");
            refreshServerData();
            break;
    }
});

function doAJAX(item) {
    // Add process to queue
    ProcessQueue[item.url] = new _AJAXProcess(item);

    var auth = item.auth;
    var url = item.url;

    $.ajax
    ({
        type: "POST",
        url: url,
        dataType: 'text',
        async: true,
        _request_item : item,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + auth);
            xhr.url = url;
        }
    }).done(onAJAXSuccess).fail(onAJAXFailure);
}

function doSOAPAJAX(item, request_id) {
    // TESTING
    // Add process to queue
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
        async: true,
        _request_id: request_id,
        _request_item: item,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + auth);
        }
    }).done(function (data) {
        var item = this._request_item;
        var request_id = this._request_id;

        var response = {
            type: item.responseType,
            id: request_id,
            data: data,
            request: item
        };
        console.log("SOAP Success");
        console.log(response);
    }).fail(onAJAXFailure);
}

function onAJAXSuccess(data) {
    var item = this._request_item;

    var response = {
        type: item.responseType,
        data: data,
        request: item
    };

    //Update Process Queue
    ProcessQueue[item.url].done = true;
    ProcessQueue[item.url].response = response;

    //chrome.runtime.sendMessage(response);
}


function onAJAXFailure(xhr, ajaxOptions, thrownError) {
    console.log("AJAXFail");
    console.log(ProcessQueue);
    console.log(thrownError);
    console.log(xhr);
    console.log(xhr.url);
    console.log(ajaxOptions);
    console.log(xhr.status);
    console.log(xhr.statusCode);

    //Update Process Queue
    ProcessQueue[xhr.url].done = true;
    ProcessQueue[xhr.url].error = true;
    ProcessQueue[xhr.url].error_message = (thrownError != "") ? thrownError : "Network Error (Unreachable)";

}

function getServiceInfoBackground(server_url, instance) {
    var url = "https://" + server_url + "/" + instance + "/util/ServiceInfo.ashx";

    var item = {
        url: url,
        auth: Settings.auth,
        responseType: "serviceInfo"
    };
    doAJAX(item);
}

function testingSOAP() {
    // TESTING SOAP
    var url = "https://phsqaatlas02.partners.org/bbAppFx/appfxwebservice.asmx";

    var clientheader = `<ClientAppInfo REDatabaseToUse="SRH_CnvVal" ClientAppName="Test App" TimeOutSeconds="100" RunAsUserID="00000000-0000-0000-0000-000000000000" xmlns="Blackbaud.AppFx.WebService.API.1" />`;

    var criteria = `constituent`;

    var soapbody = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <ShellFeatureSearchRequest xmlns="Blackbaud.AppFx.WebService.API.1">
      ${clientheader}
      <Criteria>${criteria}</Criteria>
    </ShellFeatureSearchRequest>
  </soap12:Body>
</soap12:Envelope>
                `;

    var item = {
        url: url,
        auth: Settings.auth,
        responseType: "SOAP",
        soap: soapbody
    };
    doSOAPAJAX(item, 3);
}

function refreshServerData() {
    // Load settings
    chrome.storage.sync.get(['AtlasSherpaSettings'], function (result) {
        Settings = result.AtlasSherpaSettings;

        if (Settings) {
            // load up ajax data based on initial settings
            Settings.servers.forEach(server => {
                server.instances.forEach(instance => {
                    getServiceInfoBackground(server.url, instance.path);
                });
            });

            //TESTING
            //testingSOAP();
        }
    });
}

/*** RUNTIME ***/
setTimeout(function () { refreshServerData() }, 1000);