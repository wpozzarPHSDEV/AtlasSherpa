console.log("In Inject.js");


document.addEventListener("content_request", function () {
    console.log(window.BBUI);
    document.dispatchEvent(new CustomEvent('WSP_connectExtension', {
        detail: window.BBUI
    }));
});
