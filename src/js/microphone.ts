import {Observable, Observer} from "rxjs";

declare const MediaRecorder: any;

const recordClick$: Observable<string> = Observable.create((observer: Observer<string>) => {
    const recordButton = document.querySelector("button#record-btn")!;
    const onRecordClick = (e: Event) => {

        const recordButtonState = recordButton.innerHTML;
        recordButton.innerHTML = recordButtonState === "RECORD" ? "STOP" : "RECORD";

        observer.next(recordButtonState);
    };

    recordButton.addEventListener("click", onRecordClick);
});

recordClick$.subscribe((state: string) => console.log("event", state));

const onAudioDataAvailable = (e: any) => {
    console.log("onAudioDataAvailable", e);
    const blob = new Blob([e.data], { type : "audio/ogg; codecs=opus" });
    const audioURL = URL.createObjectURL(blob);
    const audio = document.getElementById("audio") as HTMLAudioElement;
    audio.controls = true;
    audio.src = audioURL;
    return new Promise(() => blob);
};

const onAudioBlobOld = (value: any) => {
    const blob: Blob = value as Blob;
    console.log("blob", blob);
};
let audioRecorder: any = null;
const onRecordClickOld = (e: Event) => {
    if (audioRecorder && audioRecorder.state === "recording") {
        audioRecorder.stop();
    } else { navigator.mediaDevices.getUserMedia({audio: true, video: false}) // getUserMedia works only in 'localhost' or 'https://'
        .then((stream) => {

            audioRecorder = new MediaRecorder(stream);
            audioRecorder.start();

            console.log("audioRecorder", audioRecorder);
            return new Promise((resolve) => audioRecorder.addEventListener("dataavailable", resolve));
        })
        // .then(onAudioDataAvailable)
        // .then(onAudioBlob)
        .catch((err) => console.log("err", JSON.stringify(err)));
    }

};
// document.querySelector('button#record_btn')!.addEventListener('click', onRecordClick);

// on record, ask permission for microphone access
const onRecordClick = (event: any) => {
console.log("event", event);

};

// const recordPromise = new Promise((resolve, reject) => document.querySelector('button#record_btn')!.addEventListener('click', resolve));
// receive audio input
// const audioBlobPromise = new Promise(onAudioBlob);
// request api text-to-speech
// const requestTextPromise = new Promise(onRequestText);
// receive api response
// const receiveTextPromise = new Promise(onReceiveText);
// display api response in textarea

// recordPromise.then(onRecordClick);//.then(audioBlobPromise).then(requestTextPromise).then(receiveTextPromise);
