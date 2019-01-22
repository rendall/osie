"use strict";
var VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate?key=" + process.env.OSIE_VISION_API_KEY;
var cachedElements = {};
var docQuerySelector = function (selector) {
    if (cachedElements.hasOwnProperty(selector)) {
        return cachedElements[selector];
    }
    else {
        var elem = document.querySelector(selector);
        cachedElements[selector] = elem;
        return elem;
    }
};
var displayImage = function (value) {
    var imageDisplay = docQuerySelector("img#image-display");
    if (!imageDisplay) {
        console.error("DOM must contain an image element with id 'image-display': <img id='image-display>");
        return;
    }
    var imageLoadPromise = new Promise(function (resolve) { return imageDisplay.addEventListener("load", resolve); });
    var e = value;
    var imageInput = e.target;
    var image = imageInput.files && imageInput.files.length > 0 ? imageInput.files[0] : null;
    var URL = window.URL || window.webkitURL;
    var imageSrc = URL.createObjectURL(image);
    imageDisplay.src = imageSrc;
    return imageLoadPromise.then(function (e) { return URL.revokeObjectURL(imageSrc); });
};
var imgToBase64 = function (img) {
    var getExt = function (fileName) { return fileName.slice(fileName.lastIndexOf(".")).replace(".", ""); };
    var getType = function (ext) {
        switch (ext) {
            case "jpg":
                return "image/jpeg";
            default:
                return "image/" + ext;
        }
    };
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    var fileName = docQuerySelector("#image-input").value;
    var imageType = getType(getExt(fileName));
    var dataURL = canvas.toDataURL(imageType);
    var base64 = dataURL.slice(dataURL.indexOf("base64,") + 7);
    return base64;
};
var onImageLoad = function (e, img) {
    if (img === void 0) { img = docQuerySelector("img#image-display"); }
    return imgToBase64(img);
};
var requestVision = function (e) {
    var imageEncode = imgToBase64(docQuerySelector("img#image-display"));
    var requestObject = {
        requests: [
            {
                image: {
                    content: imageEncode,
                },
                features: [
                    {
                        type: "LABEL_DETECTION",
                        maxResults: 9,
                    },
                ],
            },
        ],
    };
    var fetchObject = {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
        redirect: "follow",
        referrer: "no-referrer",
        body: JSON.stringify(requestObject),
    };
    return fetch(VISION_API_URL, fetchObject);
};
var inputPhotoStream = new Promise(function (resolve) { return docQuerySelector("#image-input").addEventListener("change", resolve); });
var receiveVision = function (response) { return response.status === 200 ? response.json() : new Error(response.status + " " + response.statusText); };
var parseDescriptions = function (r) { return r.responses.reduce(function (acc, res) { return acc.concat(res.labelAnnotations); }, []).map(function (a) { return a.description; }).join(", "); };
inputPhotoStream.then(displayImage).then(requestVision).then(receiveVision).then(parseDescriptions).then(function (descriptions) { return docQuerySelector("#descriptions").innerHTML = descriptions; });
//# sourceMappingURL=camera.js.map