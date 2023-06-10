import {WebMidi} from "webmidi";
import ViGEmClient from "vigemclient";

let controlStates = {};
let noteStates = {};

let client = new ViGEmClient();
client.connect();
let controller = client.createDS4Controller();

let inputName = "DJ Control Air";
let outputName = "Katamari Midi";

let statusButton = 19;
let exitButton = 41;

let leftXAxisDecayInterval = 10;
let leftXAxisDecayWeight = 0.04;
let leftYAxisDecayInterval = 10;
let leftYAxisDecayWeight = 0.04;
let rightXAxisDecayInterval = 10;
let rightXAxisDecayWeight = 0.04;
let rightYAxisDecayInterval = 10;
let rightYAxisDecayWeight = 0.04;

let rollWeight = 0.05;
let rollForwardMessages = [
    [176,49,1],
    [176,51,1]
]
let rollBackwardMessages = [
    [176,49,127],
    [176,51,127]
]

let rotateWeight = 0.1;
let rotateLeftMessages = [[176,48,127]];
let rotateRightMessages = [[176,48,1]];


let strafeWeight = 0.05;
let strafeLeftMessages = [[176,50,127]];
let strafeRightMessages = [[176,50,1]];

let buttonBytes = {
    OPTIONS: [40],
    CROSS: [39],
    CIRCLE: [60],
    SQUARE: [59],
    TRIANGLE: [57],
    SHOULDER_LEFT: [20,46],
    SHOULDER_RIGHT: [42,46],
    TRIGGER_LEFT: [17],
    TRIGGER_RIGHT: [18],
    THUMB_LEFT: [45],
    THUMB_RIGHT: [45],
//    dpadUp: [51],
//    dpadDown: [52],
//    dpadRight: [53],
//    dpadLeft: [54],
}

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
    setInterval(() => {decayAxis('leftX', leftXAxisDecayWeight)}, leftXAxisDecayInterval);
    setInterval(() => {decayAxis('leftY', leftYAxisDecayWeight)}, leftYAxisDecayInterval);
    setInterval(() => {decayAxis('rightX', rightXAxisDecayWeight)}, rightXAxisDecayInterval);
    setInterval(() => {decayAxis('rightY', rightYAxisDecayWeight)}, rightYAxisDecayInterval);
    console.log(controller.axis);

}

function handleMidiMessage(midiMessage) {
    let data = midiMessage.data;
    let type = data[0];
    if(type === 144) {
        noteStates[data[1]] = data[2];
        let matched = matchButtons(data[1]);
        let pressed = data[2] === 127;
        //handle system-level triggers
        if(pressed) {
            if(data[1] === statusButton) handleStatusButton();
            if(data[1] === exitButton) handleExitButton();
        }
        matched.forEach((buttonName) => {
            controller.button[buttonName].setValue(pressed);
        });
        console.log(matched);
    }
    if(type === 176) {
        controlStates[data[1]] = data[2];
        if(messageMatches(rollForwardMessages, data)) handleRollForward(rollWeight);
        if(messageMatches(rollBackwardMessages, data)) handleRollBackward(rollWeight);

        if(messageMatches(rotateLeftMessages, data)) handleRotateLeft(rotateWeight);
        if(messageMatches(rotateRightMessages, data)) handleRotateRight(rotateWeight);

        if(messageMatches(strafeLeftMessages, data)) handleStrafeLeft(strafeWeight);
        if(messageMatches(strafeRightMessages, data)) handleStrafeRight(strafeWeight);

        console.log('Control set: ' + data[1]);
    }
    console.log(midiMessage.data);
    console.log('------------');
}

function matchButtons(value) {
    let result = [];
    for (let key in buttonBytes) {
        if (buttonBytes[key].includes(value)) {
            result.push(key);
        }
    }
    return result;
}

function messageMatches(messages, incoming) {
    for (let i = 0; i < messages.length; i++) {
        if (incoming[0] === messages[i][0] &&
            incoming[1] === messages[i][1] &&
            incoming[2] === messages[i][2]) {
            return true;
        }
    }
    return false;
}

function findInRollForwardMessages(arr) {
    for (let i = 0; i < rollForwardMessages.length; i++) {
        if (arr[0] === rollForwardMessages[i][0] &&
            arr[1] === rollForwardMessages[i][1] &&
            arr[2] === rollForwardMessages[i][2]) {
            return true;
        }
    }
    return false;
}

function handleStatusButton() {
    console.log('********************');
    console.log('Control Status:');
    console.log(controlStates);
    console.log('----------');
    console.log('Note Status:');
    console.log(noteStates);
    console.log('********************');
}

function handleExitButton() {
    console.log('Goodbye!');
    process.exit();
}

function handleRollForward(value) {
    accelerateAxis('leftY', value);
    accelerateAxis('rightY', value);
}
function handleRollBackward(value) {
    accelerateAxis('leftY', value * -1);
    accelerateAxis('rightY', value * -1);
}
function handleRotateLeft(value) {
    accelerateAxis('leftY', value * - 1);
    accelerateAxis('rightY', value);
}
function handleRotateRight(value) {
    accelerateAxis('leftY', value);
    accelerateAxis('rightY', value * -1);
}
function handleStrafeLeft(value) {
    accelerateAxis('leftX', value * -1);
    accelerateAxis('rightX', value * -1);
}
function handleStrafeRight(value) {
    accelerateAxis('leftX', value);
    accelerateAxis('rightX', value);
}
function accelerateAxis(axis, value) {
    console.log('setting axis ' + axis + ' by ' + value);
    let cVal = controller.axis[axis].value;
    controller.axis[axis].setValue(cVal + value);
}

function decayAxis(axis, value) {
    let cVal = controller.axis[axis].value;

    if(cVal == 0) return;
    if(cVal < 0) {
        value = value * -1;
        if(cVal - value > 0) {
            controller.axis[axis].setValue(0);
            return;
        }
        controller.axis[axis].setValue(cVal - value);
        return;
    }
    if(cVal - value < 0) {
        controller.axis[axis].setValue(0);
        return;
    }
    controller.axis[axis].setValue(cVal - value);
    return;
}