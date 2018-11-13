// const imageInput = document.querySelector('#image-input');
const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=OSIE_VISION_API_KEY`;

const displayImage = (e) => {
    const imageDisplay = document.querySelector('#image-display');
    const imageLoadPromise = new Promise((resolve) => imageDisplay.addEventListener('load', resolve));

    const image = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;

    const URL = window.URL || window.webkitURL;

    const imageSrc = URL.createObjectURL(image);
    imageDisplay.src = imageSrc;

    return imageLoadPromise.then((e) => URL.revokeObjectURL(imageSrc));
}

const imgToBase64 = (img) => {
    // there is a better way to convert the image to base64, but for expedience
    const getExt = (fileName) => fileName.slice(fileName.lastIndexOf('.')).replace('.', '');
    const getType = (ext) => {
        switch (ext) {
            case "jpg":
                return "image/jpeg";
            default:
                return `image/${ext}`;
        }
    }
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    const fileName = document.querySelector('#image-input').value;

    const imageType = getType(getExt(fileName));
    const dataURL = canvas.toDataURL(imageType);
    const base64 = dataURL.slice(dataURL.indexOf('base64,') + 7);

    return base64;
}


const onImageLoad = (e, img = document.querySelector('#image-display')) => imgToBase64(img);
const requestVision = (e) => {
    const imageEncode = imgToBase64(document.querySelector('#image-display'));
    const requestObject = {
        requests: [
            {
                image: {
                    content: imageEncode
                },
                features: [
                    {
                        type: "LABEL_DETECTION",
                        maxResults: 9
                    }
                ]
            }
        ]
    }
    const fetchObject = {
        method: "POST",
        mode: "cors", // no-cors, cors, *same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
        redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(requestObject)
    }

    return fetch(VISION_API_URL, fetchObject);
}

const inputPhotoStream = new Promise((resolve, reject) => document.querySelector('#image-input').addEventListener("change", resolve));
const receiveVision = (response) => response.status === 200? response.json(): new Error(`${response.status} ${response.statusMessage}`);
const parseDescriptions = (r) => r.responses.reduce((acc, r) => acc.concat(r.labelAnnotations), []).map( a => a.description).join(', ');
inputPhotoStream.then(displayImage).then(requestVision).then(receiveVision).then(parseDescriptions).then(descriptions => document.querySelector('#descriptions').innerHTML = descriptions );


// document load


//  input change
//  image load
//  visual recognition load