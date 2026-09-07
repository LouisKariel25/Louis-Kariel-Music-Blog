const PIANO_START_MIDI = 21;
const PIANO_END_MIDI = 108;

const NOTE_NAMES = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B"
];

const BLACK_KEYS = [
    "C#",
    "D#",
    "F#",
    "G#",
    "A#"
];

function midiToNote(midi) {
    const noteName = NOTE_NAMES[midi % 12];
    const octave = Math.floor(midi / 12) - 1;

    return {
        name: `${noteName}${octave}`,
        note: noteName,
        octave: octave
    };
}

function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function isBlackKey(note) {
    return BLACK_KEYS.includes(note);
}

function createPianoKeys() {
    const keys = [];

    for (
        let midi = PIANO_START_MIDI;
        midi <= PIANO_END_MIDI;
        midi++
    ) {
        const noteInfo = midiToNote(midi);

        keys.push({
            number: midi - PIANO_START_MIDI + 1,
            midi: midi,
            note: noteInfo.note,
            octave: noteInfo.octave,
            name: noteInfo.name,
            frequency: midiToFrequency(midi),
            type: isBlackKey(noteInfo.note)
                ? "black"
                : "white"
        });
    }

    return keys;
}

const pianoKeys = createPianoKeys();

console.log("88-Key Piano Loaded : ", pianoKeys);