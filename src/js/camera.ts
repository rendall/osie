// const imageInput = document.querySelector('#image-input');
declare const process:any;
const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${ process.env.OSIE_VISION_API_KEY }`;

const cachedElements: {[selector: string]: HTMLElement} = {};
const docQuerySelector = (selector: string) => {
    if (cachedElements.hasOwnProperty(selector)) { return cachedElements[selector]; } else {
        const elem = document.querySelector(selector) as HTMLElement;
        cachedElements[selector] = elem;
        return elem;
    }
};

const displayImage = (value: {}) => {
    const imageDisplay: HTMLImageElement = docQuerySelector("img#image-display") as HTMLImageElement;

    if (!imageDisplay) {
        console.error("DOM must contain an image element with id 'image-display': <img id='image-display>");
        return;
    }

    const imageLoadPromise = new Promise((resolve) => imageDisplay.addEventListener("load", resolve));

    const e: Event = value as Event;
    const imageInput = (e.target as HTMLInputElement)!;
    const image = imageInput.files && imageInput.files.length > 0 ? imageInput.files[0] : null;
    const URL = window.URL || (window as any).webkitURL;

    const imageSrc = URL.createObjectURL(image);
    imageDisplay.src = imageSrc;

    return imageLoadPromise.then((e) => URL.revokeObjectURL(imageSrc));
};

const imgToBase64 = (img: HTMLImageElement) => {
    // there is a better way to convert the image to base64, but for expedience
    const getExt = (fileName: string) => fileName.slice(fileName.lastIndexOf(".")).replace(".", "");
    const getType = (ext: string) => {
        switch (ext) {
            case "jpg":
                return "image/jpeg";
            default:
                return `image/${ext}`;
        }
    };
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const fileName = (docQuerySelector("#image-input")! as HTMLInputElement).value;

    const imageType = getType(getExt(fileName));
    const dataURL = canvas.toDataURL(imageType);
    const base64 = dataURL.slice(dataURL.indexOf("base64,") + 7);

    return base64;
};

const onImageLoad = (e: any, img = docQuerySelector("img#image-display")! as HTMLImageElement) => imgToBase64(img);
const requestVision = (e: any) => {
    const imageEncode = imgToBase64(docQuerySelector("img#image-display")! as HTMLImageElement);
    const requestObject = {
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
    const fetchObject: RequestInit = {
        method: "POST",
        mode: "cors", // no-cors, cors, *same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
        redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(requestObject),
    };

    return fetch(VISION_API_URL, fetchObject);
};

interface Annotations {
    mid: string;
    description: string;
    score: number;
    topicality: number;
}

const inputPhotoStream = new Promise((resolve) => docQuerySelector("#image-input").addEventListener("change", resolve));
const receiveVision = (response: Response) => response.status === 200 ? response.json() : new Error(`${response.status} ${response.statusText}`);
const parseDescriptions = (r: {responses: [{labelAnnotations: Annotations[]}]}) => r.responses.reduce((acc: Annotations[], res) => acc.concat(res.labelAnnotations), []).map( (a) => a.description).join(", ");

inputPhotoStream.then(displayImage).then(requestVision).then(receiveVision).then(parseDescriptions).then((descriptions) => (docQuerySelector("#descriptions") as HTMLParagraphElement).innerHTML = descriptions );

// document load

//  input change
//  image load
//  visual recognition load
