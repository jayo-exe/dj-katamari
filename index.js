import {WebMidi} from "webmidi";
import ViGEmClient from "vigemclient";

let client = new ViGEmClient();
client.connect();
let controller = client.createDS4Controller();

let inputName = "DJ Control Air";
let outputName = "Katamari Midi";

WebMidi
    .enable({sysex: true})
    .then(onEnabled)
    .catch(err => console.error(err));

function onEnabled() {
    startMidi();
    startController();
}



function startMidi() {
    const myInput = WebMidi.getInputByName(inputName);
    const myOutput = WebMidi.getOutputByName(outputName);
    myInput.addForwarder(myOutput);
    myInput.addListener("midimessage", handleMidiMessage);
}

function startController() {
    controller.connect();
    console.log('Simulated DS4 Active');
    console.log(controller.axis);
}

function handleMidiMessage(midiMessage) {
    console.log(midiMessage);
}