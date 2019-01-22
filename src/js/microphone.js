import { Observable } from "rxjs";
var recordClick$ = Observable.create(function (observer) {
    var recordButton = document.querySelector("button#record-btn");
    var onRecordClick = function (e) {
        var recordButtonState = recordButton.innerHTML;
        recordButton.innerHTML = recordButtonState === "RECORD" ? "STOP" : "RECORD";
        observer.next(recordButtonState);
    };
    recordButton.addEventListener("click", onRecordClick);
});
recordClick$.subscribe(function (state) { return console.log("event", state); });
var onAudioDataAvailable = function (e) {
    console.log("onAudioDataAvailable", e);
    var blob = new Blob([e.data], { type: "audio/ogg; codecs=opus" });
    var audioURL = URL.createObjectURL(blob);
    var audio = document.getElementById("audio");
    audio.controls = true;
    audio.src = audioURL;
    return new Promise(function () { return blob; });
};
var onAudioBlobOld = function (value) {
    var blob = value;
    console.log("blob", blob);
};
var audioRecorder = null;
var onRecordClickOld = function (e) {
    if (audioRecorder && audioRecorder.state === "recording") {
        audioRecorder.stop();
    }
    else {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(function (stream) {
            audioRecorder = new MediaRecorder(stream);
            audioRecorder.start();
            console.log("audioRecorder", audioRecorder);
            return new Promise(function (resolve) { return audioRecorder.addEventListener("dataavailable", resolve); });
        })
            .catch(function (err) { return console.log("err", JSON.stringify(err)); });
    }
};
var onRecordClick = function (event) {
    console.log("event", event);
};
//# sourceMappingURL=microphone.js.map