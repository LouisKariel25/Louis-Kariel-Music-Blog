let inputOctave = 4;

const pressedKeyboardKeys = new Set();

const KEYBOARD_MAP = {

    "a": 0,
    "w": 1,
    "s": 2,
    "e": 3,
    "d": 4,
    "f": 5,
    "t": 6,
    "g": 7,
    "y": 8,
    "h": 9,
    "u": 10,
    "j": 11

};

function getMidiFromKeyboardKey(key) {

    const normalizedKey =
        key.toLowerCase();

    const semitone =
        KEYBOARD_MAP[normalizedKey];

    if (semitone === undefined) {
        return null;
    }

    return (
        12 * (inputOctave + 1)
        + semitone
    );

}

function getPianoButtonByMidi(midi) {

    return document.querySelector(
        `.piano .key[data-midi="${midi}"]`
    );

}

function playKeyboardNote(key) {

    const normalizedKey =
        key.toLowerCase();

    if (
        pressedKeyboardKeys.has(
            normalizedKey
        )
    ) {
        return;
    }

    const midi =
        getMidiFromKeyboardKey(
            normalizedKey
        );

    if (midi === null) {
        return;
    }

    if (
        midi < PIANO_START_MIDI ||
        midi > PIANO_END_MIDI
    ) {
        return;
    }

    const pianoButton =
        getPianoButtonByMidi(midi);

    if (!pianoButton) {
        console.warn(
            "Piano key not found : ",
            midi
        );

        return

    }

    pressedKeyboardKeys.add(
        normalizedKey
    );

    pianoButton.click();

    console.log(
        "🎹 keyboard Note : ",
        pianoButton.dataset.name,
        "MIDI : ",
        midi
    );

}

function releaseKeyboardNote(key) {

    const normalizedKey =
        key.toLowerCase();

    pressedKeyboardKeys.delete(
        normalizedKey
    );

}

document.addEventListener(
    "keydown",
    event => {

        if (
            event.ctrlKey ||
            event.altKey ||
            event.metaKey
        ) {
            return;
        }

        const key =
            event.key.toLowerCase();

        if (
            KEYBOARD_MAP[key] === undefined
        ) {
            return;
        }

        if (event.repeat) {
            return;
        }

        event.preventDefault();

        playKeyboardNote(key);

    }
);

document.addEventListener(
    "keyup",
    event => {

        const key =
            event.key.toLowerCase();

        releaseKeyboardNote(key);

    }
);

function changeInputOctave(direction) {

    const nextOctave =
        inputOctave + direction;

    if (
        nextOctave < 1 ||
        nextOctave > 7
    ) {
        return;
    }

    inputOctave =
        nextOctave;

    console.log(
        "🎹 Input Octave : ",
        inputOctave
    );

}

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "[") {

            event.preventDefault();

            changeInputOctave(-1);

        }

        if (event.key === "]") {

            event.preventDefault();

            changeInputOctave(1);

        }

    }
);

console.log(
    "🎹 Piano Input Engine Ready"
);

console.log(
    "🎹 Current Octave : ",
    inputOctave
);