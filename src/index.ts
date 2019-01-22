import { Observable, Observer, Subscriber } from "rxjs";
declare const process:any;
const SPEECH_TO_TEXT_API_URL = `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.OSIE_SPEECH_TO_TEXT_API_KEY}`;

enum MediaRecorderState {
    "inactive",
    "recording",
    "paused",
}

declare class MediaRecorderOptions {
    public mimeType?:string;
    public audioBitsPerSecond?:number;
    public videoBitsPerSecond?:number;
    public bitsPerSecond?:number;
}

declare class MediaRecorder {
    public audioBitsPerSecond: number;
    public mimeType: string;
    public ondataavailable?: EventHandlerNonNull;
    public onerror?: EventHandlerNonNull;
    public onpause?: EventHandlerNonNull;
    public onresume?: EventHandlerNonNull;
    public onstart?: EventHandlerNonNull;
    public onstop?: EventHandlerNonNull;
    public state: MediaRecorderState;
    public stream: MediaStream;
    public videoBitsPerSecond: number;

    public start: () => void;
    public stop: () => void;

    public addEventListener: (
        type: string,
        listener: ((evt: BlobEvent) => void) | null,
        options?: boolean | AddEventListenerOptions | undefined,
    ) => void;
    public removeEventListener: (
        type: string,
        listener?: ((evt: BlobEvent) => void) | null | undefined,
        options?: boolean | EventListenerOptions | undefined,
    ) => void;

    constructor(stream: MediaStream, options?:MediaRecorderOptions);
}

declare class BlobEvent {
    public data: Blob;
}

class BlobToBase64 extends Subscriber<any> {
    constructor(subscriber: Subscriber<any>){
        super(subscriber);
    }

    onLoadEnd = (e:Event) => {
        const reader = e.target as FileReader;
        const stripHeader = (s:string) => s.slice(s.indexOf(',') + 1);
        const base64data = stripHeader( reader.result as string );
        
        this.destination.next!(base64data);
    }

    _next(blob: Blob) {
        var reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.addEventListener("loadend", this.onLoadEnd);
    }
}

class SpeechToText extends Subscriber<any> {
  constructor(subscriber: Subscriber<string>) {
    super(subscriber);
  }

  private requestText = (data: string) => {
    const requestObject = (data: string) => ({
      audio: {
        content: data
      },
      config: {
        encoding: "OGG_OPUS", //LINEAR16, FLAC, MULAW, AMR, AMR_WB, OGG_OPUS, SPEEX_WITH_HEADER_BYTE
        languageCode: "en-US",
        sampleRateHertz: 12000 // supported rates 8000, 12000, 16000, 24000, 48000
      }
    });

    const fetchObject: RequestInit = {
      method: "POST",
      mode: "cors", // no-cors, cors, *same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      redirect: "follow", // manual, *follow, error
      referrer: "no-referrer", // no-referrer, *client
      body: JSON.stringify(requestObject(data))
    };

    return fetch(SPEECH_TO_TEXT_API_URL, fetchObject);
  };

  private receiveText = (e: any) => console.log("receiveText", e);
  // _next must be defined without => or typescript flags an error
  _next(base64: string) {
    console.log("Inside SpeechToText ", base64);

    this.requestText(base64).then(this.receiveText);
  };
};

class AudioPlayer extends Subscriber<any> {

    constructor(subscriber:Subscriber<string>) {
        super(subscriber);
    }

    // _next must be defined without => or typescript flags an error
    _next(blob: Blob) {
        const audioURL = URL.createObjectURL(blob);
        const audio = document.getElementById("audio") as HTMLAudioElement;
        audio.controls = true;
        audio.src = audioURL;
        audio.play();
        this.destination.next!(blob);
    }

}

class Recorder extends Subscriber<any> {
    private _stream:MediaStream = new MediaStream();
    private _recorder:MediaRecorder = new MediaRecorder(new MediaStream());

    private onDataAvailable = (event:BlobEvent) => {
        const blob = new Blob([event.data], { 'type' : 'audio/ogg;codecs=opus' });
        this.destination.next!(blob)
    }

    constructor(subscriber:Subscriber<string>) {
        super(subscriber);
    }

    // _next must be defined without => or typescript flags an error
    _next(buttonState:string) {
        switch (buttonState) {
            case "RECORD": this.start(); break;
            case "STOP": this.stop(); break;
        }
        // do not pass any values from here
    }

    public start = () => {
        navigator.mediaDevices.getUserMedia({audio:true})
            .then((stream) => this._stream = stream)
            .then(() => this._recorder = new MediaRecorder(this._stream, {audioBitsPerSecond:12000}))
            .then(() => this._recorder.addEventListener('dataavailable', this.onDataAvailable))
            .then(() => console.log("mime:", this._recorder.mimeType, this._recorder.audioBitsPerSecond))
            .then(() => this._recorder.start());
    }
    public stop = () => this._recorder.stop();
}

const recordClick$:Observable<string> = Observable.create((observer:Observer<any>) => {
    const recordButton = document.querySelector("button#record_btn")!;
    const onRecordClick = (e: Event) => {
        const recordButtonState = recordButton.innerHTML;
        recordButton.innerHTML = recordButtonState === "RECORD" ? "STOP" : "RECORD";
        observer.next(recordButtonState);
    };
    recordButton.addEventListener("click", onRecordClick);
});

const makeRxJSOperator = (Type: any) => (source: Observable<any>) => source.lift({ call(sub, source) { source.subscribe(new Type(sub)) } });
const audioPlayerHandler = makeRxJSOperator(AudioPlayer);
const recorderHandler = makeRxJSOperator(Recorder);
const blobToBase64 = makeRxJSOperator(BlobToBase64);
const speechToTextHander = makeRxJSOperator(SpeechToText);

//recordClick$.pipe(recorderHandler, audioPlayerHandler, blobToBase64 ).subscribe(x => console.log("dataresult:", x));
recordClick$.pipe(recorderHandler, audioPlayerHandler, blobToBase64, speechToTextHander).subscribe(x => console.log("dataresult:", x));