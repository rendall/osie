var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { Observable, Subscriber } from "rxjs";
var SPEECH_TO_TEXT_API_URL = "https://speech.googleapis.com/v1/speech:recognize?key=" + process.env.OSIE_SPEECH_TO_TEXT_API_KEY;
var MediaRecorderState;
(function (MediaRecorderState) {
    MediaRecorderState[MediaRecorderState["inactive"] = 0] = "inactive";
    MediaRecorderState[MediaRecorderState["recording"] = 1] = "recording";
    MediaRecorderState[MediaRecorderState["paused"] = 2] = "paused";
})(MediaRecorderState || (MediaRecorderState = {}));
var BlobToBase64 = (function (_super) {
    __extends(BlobToBase64, _super);
    function BlobToBase64(subscriber) {
        var _this = _super.call(this, subscriber) || this;
        _this.onLoadEnd = function (e) {
            var reader = e.target;
            var stripHeader = function (s) { return s.slice(s.indexOf(',') + 1); };
            var base64data = stripHeader(reader.result);
            _this.destination.next(base64data);
        };
        return _this;
    }
    BlobToBase64.prototype._next = function (blob) {
        var reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.addEventListener("loadend", this.onLoadEnd);
    };
    return BlobToBase64;
}(Subscriber));
var SpeechToText = (function (_super) {
    __extends(SpeechToText, _super);
    function SpeechToText(subscriber) {
        var _this = _super.call(this, subscriber) || this;
        _this.requestText = function (data) {
            var requestObject = function (data) { return ({
                audio: {
                    content: data
                },
                config: {
                    encoding: "OGG_OPUS",
                    languageCode: "en-US",
                    sampleRateHertz: 12000
                }
            }); };
            var fetchObject = {
                method: "POST",
                mode: "cors",
                cache: "no-cache",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                },
                redirect: "follow",
                referrer: "no-referrer",
                body: JSON.stringify(requestObject(data))
            };
            return fetch(SPEECH_TO_TEXT_API_URL, fetchObject);
        };
        _this.receiveText = function (e) { return console.log("receiveText", e); };
        return _this;
    }
    SpeechToText.prototype._next = function (base64) {
        console.log("Inside SpeechToText ", base64);
        this.requestText(base64).then(this.receiveText);
    };
    ;
    return SpeechToText;
}(Subscriber));
;
var AudioPlayer = (function (_super) {
    __extends(AudioPlayer, _super);
    function AudioPlayer(subscriber) {
        return _super.call(this, subscriber) || this;
    }
    AudioPlayer.prototype._next = function (blob) {
        var audioURL = URL.createObjectURL(blob);
        var audio = document.getElementById("audio");
        audio.controls = true;
        audio.src = audioURL;
        audio.play();
        this.destination.next(blob);
    };
    return AudioPlayer;
}(Subscriber));
var Recorder = (function (_super) {
    __extends(Recorder, _super);
    function Recorder(subscriber) {
        var _this = _super.call(this, subscriber) || this;
        _this._stream = new MediaStream();
        _this._recorder = new MediaRecorder(new MediaStream());
        _this.onDataAvailable = function (event) {
            var blob = new Blob([event.data], { 'type': 'audio/ogg;codecs=opus' });
            _this.destination.next(blob);
        };
        _this.start = function () {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function (stream) { return _this._stream = stream; })
                .then(function () { return _this._recorder = new MediaRecorder(_this._stream, { audioBitsPerSecond: 12000 }); })
                .then(function () { return _this._recorder.addEventListener('dataavailable', _this.onDataAvailable); })
                .then(function () { return console.log("mime:", _this._recorder.mimeType, _this._recorder.audioBitsPerSecond); })
                .then(function () { return _this._recorder.start(); });
        };
        _this.stop = function () { return _this._recorder.stop(); };
        return _this;
    }
    Recorder.prototype._next = function (buttonState) {
        switch (buttonState) {
            case "RECORD":
                this.start();
                break;
            case "STOP":
                this.stop();
                break;
        }
    };
    return Recorder;
}(Subscriber));
var recordClick$ = Observable.create(function (observer) {
    var recordButton = document.querySelector("button#record_btn");
    var onRecordClick = function (e) {
        var recordButtonState = recordButton.innerHTML;
        recordButton.innerHTML = recordButtonState === "RECORD" ? "STOP" : "RECORD";
        observer.next(recordButtonState);
    };
    recordButton.addEventListener("click", onRecordClick);
});
var makeRxJSOperator = function (Type) { return function (source) { return source.lift({ call: function (sub, source) { source.subscribe(new Type(sub)); } }); }; };
var audioPlayerHandler = makeRxJSOperator(AudioPlayer);
var recorderHandler = makeRxJSOperator(Recorder);
var blobToBase64 = makeRxJSOperator(BlobToBase64);
var speechToTextHander = makeRxJSOperator(SpeechToText);
recordClick$.pipe(recorderHandler, audioPlayerHandler, blobToBase64, speechToTextHander).subscribe(function (x) { return console.log("dataresult:", x); });
//# sourceMappingURL=index.js.map