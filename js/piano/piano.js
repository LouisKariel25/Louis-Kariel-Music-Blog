let audioContext = null;

let masterGain = null;

let volume = 0.5;

const activeOscillators = new Map();

let octave = 4;

let recordingTimer = null;

let recordedNotes = [];

let recordingNotes = new Map();

let recordingStartTime = 0;

let isRecording = false;

let recordingDuration = 0;

let bpm = 120;

let beatsPerMeasure = 4;

let beatUnit = 4;

const keyboardMap = {

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

const pressedKeyboardNotes = new Map();

const activeNotes = new Map();

const currentNote =
    document.getElementById("currentNote");

const octaveDisplay =
    document.getElementById("octaveDisplay");

const volumeControl =
    document.getElementById("volume");

const octaveDown =
    document.getElementById("octaveDown");

const octaveUp =
    document.getElementById("octaveUp");

const stopAll =
    document.getElementById("stopAll");

const recordButton =
    document.getElementById("recordButton");

const playButton =
    document.getElementById("playButton");

const clearButton =
    document.getElementById("clearButton");

const sendToComposerButton =
    document.getElementById("sendToComposerButton");

const recordStatus =
    document.getElementById("recordStatus");

const recordTime =
    document.getElementById("recordTime");

function getPianoKey(midi) {
    return pianoKeys.find(key => key.midi === midi);
}

function getPianoKeyByName(name) {
    return pianoKeys.find(key => key.name === name);
}

function getPianoButtons() {
    return document.querySelectorAll(".piano .key");
}

function getBeatDuration() {

    return 60000 / bpm;

}

function millisecondsToBeats(milliseconds) {

    const beatDuration =
        getBeatDuration();

    return milliseconds / beatDuration;

}

function beatsToMilliseconds(beats) {

    return beats * getBeatDuration();

}

function createPianoKeyboard() {

    const piano = document.querySelector(".piano");

    if (!piano) {
        console.error("❌ .piano element not found.");
        return;
    }

    piano.innerHTML = "";

    const whiteKeys = pianoKeys.filter(
        key => key.type === "white"
    );

    const whiteKeyCount = whiteKeys.length;

    pianoKeys.forEach(key => {

        const button =
            document.createElement("button");

        button.classList.add("key");

        button.classList.add(
            key.type === "white"
                ? "white-key"
                : "black-key"
        );

        button.dataset.note =
            key.note;

        button.dataset.octave =
            key.octave;

        button.dataset.name =
            key.name;

        button.dataset.midi =
            key.midi;

        button.dataset.frequency =
            key.frequency;

        button.dataset.number =
            key.number;

        button.setAttribute(
            "aria-label",
            key.name
        );

        if (key.type === "white") {

            const noteName =
                document.createElement("span");

            noteName.classList.add(
                "note-name"
            );

            noteName.textContent =
                key.name;

            button.appendChild(
                noteName
            );

            const whiteIndex =
                whiteKeys.findIndex(
                    whiteKey =>
                        whiteKey.midi === key.midi
                );

            const whiteWidth =
                100 / whiteKeyCount;

            button.style.left =
                `${whiteIndex * whiteWidth}%`;

            button.style.width =
                `${whiteWidth}%`;

        }

        else {

            const previousWhiteKeys =
                whiteKeys.filter(
                    whiteKey =>
                        whiteKey.midi < key.midi
                );

            const previousWhiteCount =
                previousWhiteKeys.length;

            const whiteWidth =
                100 / whiteKeyCount;

            const blackCenter =
                previousWhiteCount *
                whiteWidth;

            button.style.left =
                `${blackCenter}%`;

            button.style.width =
                `${whiteWidth * 0.72}%`;

            button.style.transform =
                "translateX(-50%)";

            const noteName =
                document.createElement("span");

            noteName.textContent =
                key.name;

            button.appendChild(
                noteName
            );

        }

        piano.appendChild(
            button
        );

    });

    attachPianoEvents();

    console.log(
        "🎹 88 Piano Keys Created : ",
        piano.children.length
    );

    console.log(
        "⚪ White Keys : ",
        whiteKeys.length
    );

    console.log(
        "⚫ Black Keys : ",
        pianoKeys.length -
        whiteKeys.length
    );

}

function attachPianoEvents() {

    const keys =
        getPianoButtons();

    keys.forEach(key => {

        key.addEventListener(
            "mousedown",
            event => {

                event.preventDefault();

                const midi =
                    Number(
                        key.dataset.midi
                    );

                playMidiNote(
                    midi,
                    key
                );

            }
        );

        key.addEventListener(
            "mouseup",
            event => {

                event.preventDefault();

                stopNote(key);

            }
        );

        key.addEventListener(
            "mouseleave",
            () => {

                stopNote(key);

            }
        );

        key.addEventListener(
            "touchstart",
            event => {

                event.preventDefault();

                const midi =
                    Number(
                        key.dataset.midi
                    );

                playMidiNote(
                    midi,
                    key
                );

            },
            {
                passive: false
            }
        );

        key.addEventListener(
            "touchend",
            event => {

                event.preventDefault();

                stopNote(key);

            },
            {
                passive: false
            }
        );

    });

}

function initializeAudio() {

    if (audioContext) {

        if (
            audioContext.state === "suspended"
        ) {

            audioContext.resume();

        }

        return;

    }

    audioContext =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

    masterGain =
        audioContext.createGain();

    masterGain.gain.value =
        volume;

    masterGain.connect(
        audioContext.destination
    );

}

function midiToFrequency(midi) {

    return 440 *
        Math.pow(
            2,
            (midi - 69) / 12
        );

}

function playMidiNote(
    midi,
    keyElement
) {

    initializeAudio();

    if (
        audioContext.state === "suspended"
    ) {

        audioContext.resume();

    }

    const pianoKey =
        pianoKeys.find(
            key => key.midi === midi
        );

    if (!pianoKey) {

        console.error(
            "❌ Piano Key not found. MIDI : ",
            midi
        );

        return;

    }

    if (
        activeOscillators.has(keyElement)
    ) {

        return;

    }

    const frequency =
        pianoKey.frequency;

    const oscillator =
        audioContext.createOscillator();

    const gainNode =
        audioContext.createGain();

    oscillator.type =
        "triangle"

    oscillator.frequency.value =
        frequency;

    gainNode.gain.setValueAtTime(
        0,
        audioContext.currentTime
    );

    gainNode.gain.linearRampToValueAtTime(
        0.6,
        audioContext.currentTime + 0.02
    );

    oscillator.connect(
        gainNode
    );

    gainNode.connect(
        masterGain
    );

    oscillator.start();

    activeOscillators.set(
        midi,
        {

            oscillator:
                oscillator,

            gainNode:
                gainNode,

            midi:
                pianoKey.midi,

            note:
                pianoKey.note,

            octave:
                pianoKey.octave,

            name:
                pianoKey.name,

            frequency:
                pianoKey.frequency,

            startTime:
                performance.now()

        }
    );

    activeNotes.set(midi, {
        midi: midi,
        keyElement: keyElement
    });

    keyElement.classList.add(
        "active"
    );

    if (currentNote) {

        currentNote.textContent =
            pianoKey.name;

    }

    if (isRecording) {

        const start =
            performance.now() -
            recordingStartTime;

        recordingNotes.set(midi, {
            midi: pianoKey.midi,
            note: pianoKey.note,
            octave: pianoKey.octave,
            name: pianoKey.name,
            start: start
        });

    }

    console.log(
        "🎹 PLAY : ",
        pianoKey.name,
        "| MIDI : ",
        pianoKey.midi,
        "| Frequency : ",
        pianoKey.frequency
    );

}

function stopNote(keyElement) {

    if (!keyElement) {
        return;
    }

    const midi =
        Number(keyElement.dataset.midi);

    if (Number.isNaN(midi)) {
        console.error(
            "❌ MIDI 번호를 찾을 수 없습니다.",
            keyElement
        );
        return;
    }

    const active =
        activeOscillators.get(midi);

    if (active) {

        const now =
            audioContext.currentTime;

        active.gainNode.gain.cancelScheduledValues(now);

        active.gainNode.gain.setValueAtTime(
            active.gainNode.gain.value,
            now
        );

        active.gainNode.gain.linearRampToValueAtTime(
            0,
            now + 0.05
        );

        try {
            active.oscillator.stop(
                now + 0.05
            );
        } catch (error) {
            console.warn(
                "Oscillator stop warning : ",
                error
            );
        }

        activeOscillators.delete(midi);

    }

    keyElement.classList.remove(
        "active"
    );

    if (isRecording) {

        const noteData =
            recordingNotes.get(midi);

        if (noteData) {

            const end =
                performance.now() -
                recordingStartTime;

            const duration =
                end - noteData.start;

            const startBeat =
                millisecondsToBeats(
                    noteData.start
                );

            const durationBeats =
                millisecondsToBeats(
                    duration
                );

            recordedNotes.push({
                midi: noteData.midi,
                note: noteData.note,
                octave: noteData.octave,
                name: noteData.name,
                start: noteData.start,
                end: end,
                duration: duration,
                startBeat: startBeat,
                durationBeats: durationBeats
            });

            recordingNotes.delete(midi);

        }
    }
}

document.addEventListener("keydown", (event) => {

    if (event.repeat) {
        return;
    }

    const pressedKey =
        event.key.toLowerCase();

    if (event.key === "[") {

        event.preventDefault();

        if (octave > 1) {

            octave--;

            if (octaveDisplay) {

                octaveDisplay.textContent =
                    octave;

            }

            console.log(
                "🎹 Octave Down : ",
                octave
            );

        }

        return;

    }

    if (event.key === "]") {

        event.preventDefault();

        if (octave < 7) {

            octave++;

            if (octaveDisplay) {

                octaveDisplay.textContent =
                    octave;

            }

            console.log(
                "🎹 Octave Up : ",
                octave
            );

        }

        return;

    }

    const semitone =
        keyboardMap[pressedKey];

    if (
        semitone === undefined
    ) {

        return;

    }

    event.preventDefault();

    const midi =
        12 *
        (octave + 1) +
        semitone;

    if (
        midi < PIANO_START_MIDI ||
        midi > PIANO_END_MIDI
    ) {

        return;

    }

    if (
        pressedKeyboardNotes.has(
            pressedKey
        )
    ) {
        return;
    }

    const keyElement =
        document.querySelector(
            `.piano .key[data-midi="${midi}"]`
        );

    if (!keyElement) {

        console.warn(
            "❌ Piano key not found : ",
            midi
        );

        return;

    }

    pressedKeyboardNotes.set(
        pressedKey,
        {
            midi: midi,
            keyElement: keyElement
        }
    );

    playMidiNote(
        midi,
        keyElement
    );

    console.log(
        "🎹 KEY DOWN : ",
        pressedKey,
        "| MIDI : ",
        midi
    );

});

document.addEventListener(
    "keyup",
    event => {

        const pressedKey =
            event.key.toLowerCase();

        const pressedNote =
            pressedKeyboardNotes.get(
                pressedKey
            );

        if (!pressedNote) {
            return;
        }

        stopNote(
            pressedNote.keyElement
        );

        pressedKeyboardNotes.delete(
            pressedKey
        );

        console.log(
            "🎹 KEY UP : ",
            pressedKey,
            "| MIDI : ",
            pressedNote.midi
        );

    }
);

if (volumeControl) {

    volumeControl.addEventListener(
        "input",
        () => {

            volume =
                Number(volumeControl.value);

            if (masterGain) {

                masterGain.gain.value =
                    volume;

            }

        }
    );

}

if (octaveDown) {

    octaveDown.addEventListener(
        "click",
        () => {

            if (octave <= 1) {
                return;
            }

            octave--;

            if (octaveDisplay) {

                octaveDisplay.textContent =
                    octave;

            }

        }
    );

}

if (octaveUp) {

    octaveUp.addEventListener(
        "click",
        () => {

            if (octave >= 7) {
                return;
            }

            octave++;

            if (octaveDisplay) {

                octaveDisplay.textContent =
                    octave;

            }

        }
    );

}

if (stopAll) {

    stopAll.addEventListener(
        "click",
        () => {

            const keys =
                getPianoButtons();

            keys.forEach(
                key => {

                    stopNote(key);

                }
            );

            pressedKeyboardNotes.clear();

        }
    );

}

function startRecording() {

    initializeAudio();

    recordedNotes = [];

    recordingNotes.clear();

    recordingStartTime =
        performance.now();

    isRecording = true;

    recordButton.textContent =
        "⏹ 녹음 중지";

    recordButton.classList.add(
        "recording"
    );

    if (recordStatus) {

        recordStatus.textContent =
            "● 녹음 중";

        recordStatus.classList.add(
            "recording"
        );

    }

    if (playButton) {

        playButton.disabled = true;

    }

    if (clearButton) {

        clearButton.disabled = true;

    }

    updateRecordingTime();

    recordingTimer =
        setInterval(
            updateRecordingTime,
            100
        );

}

function stopRecording() {

    if (!isRecording) {
        return;
    }

    recordingDuration =
        performance.now()
        - recordingStartTime;

    isRecording = false;

    recordingNotes.clear();

    clearInterval(
        recordingTimer
    );

    recordButton.textContent =
        "🔴 녹음";

    recordButton.classList.remove(
        "recording"
    );

    if (recordStatus) {

        recordStatus.textContent =
            "녹음 완료";

        recordStatus.classList.remove(
            "recording"
        );

    }

    if (
        recordedNotes.length > 0
    ) {

        if (playButton) {

            playButton.disabled =
                false;

        }

        if (clearButton) {

            clearButton.disabled =
                false;

        }

        if (sendToComposerButton) {

            sendToComposerButton.disabled =
                false;

        }

    }

}

if (recordButton) {

    recordButton.addEventListener(
        "click",
        () => {

            if (isRecording) {

                stopRecording();

            } else {

                startRecording();

            }

        }
    );

}

function updateRecordingTime() {

    if (!isRecording) {
        return;
    }

    const elapsed =
        performance.now()
        - recordingStartTime;

    const seconds =
        Math.floor(
            elapsed / 1000
        );

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remainingSeconds =
        seconds % 60;

    if (recordTime) {

        recordTime.textContent =
            `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;

    }

}

if (playButton) {

    playButton.addEventListener(
        "click",
        () => {

            if (
                recordedNotes.length === 0
            ) {
                return;
            }

            playRecording();

        }
    );

}

function playRecording() {

    initializeAudio();

    if (playButton) {

        playButton.disabled = true;

    }

    if (recordStatus) {

        recordStatus.textContent =
            "▶ 연주 재생 중";

    }

    recordedNotes.forEach(
        recordedNote => {

            setTimeout(
                () => {

                    playPlaybackNote(
                        recordedNote
                    );

                },
                recordedNote.start
            );

        }
    );

    const lastNote =
        recordedNotes[
        recordedNotes.length - 1
        ];

    const duration =
        lastNote.start +
        (
            lastNote.duration ||
            500
        ) +
        200;

    setTimeout(
        () => {

            if (recordStatus) {

                recordStatus.textContent =
                    "재생 완료";

            }

            if (playButton) {

                playButton.disabled =
                    false;

            }

        },
        duration
    );

}

function playPlaybackNote(
    recordedNote
) {

    initializeAudio();

    const midi =
        recordedNote.midi ??
        (
            12 *
            (recordedNote.octave + 1) +
            pianoKeys.findIndex(
                key =>
                    key.note ===
                    recordedNote.note
            )
        );

    const pianoKey =
        getPianoKey(midi);

    if (!pianoKey) {

        return;

    }

    const frequency =
        pianoKey.frequency;

    const oscillator =
        audioContext.createOscillator();

    const gainNode =
        audioContext.createGain();

    oscillator.type =
        "triangle";

    oscillator.frequency.value =
        frequency;

    gainNode.gain.setValueAtTime(
        0,
        audioContext.currentTime
    );

    gainNode.gain.linearRampToValueAtTime(
        0.6,
        audioContext.currentTime + 0.02
    );

    const duration =
        Math.max(
            0.1,
            (
                recordedNote.duration ||
                500
            ) / 1000
        );

    gainNode.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime +
        duration
    );

    oscillator.connect(
        gainNode
    );

    gainNode.connect(
        masterGain
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime +
        duration
    );

    const keyElement =
        document.querySelector(
            `.piano .key[data-midi="${midi}"]`
        );

    if (keyElement) {

        keyElement.classList.add(
            "active"
        );

        setTimeout(
            () => {

                keyElement.classList.remove(
                    "active"
                );

            },
            duration * 1000
        );

    }

    if (currentNote) {

        currentNote.textContent =
            pianoKey.name;

    }

}

if (clearButton) {

    clearButton.addEventListener(
        "click",
        () => {

            recordedNotes = [];

            playButton.disabled =
                true;

            clearButton.disabled =
                true;

            if (sendToComposerButton) {

                sendToComposerButton.disabled =
                    true;

            }

            if (recordStatus) {

                recordStatus.textContent =
                    "녹음 대기 중";

            }

            if (recordTime) {

                recordTime.textContent =
                    "00:00";

            }

        }
    );

}

if (sendToComposerButton) {

    sendToComposerButton.addEventListener(
        "click",
        () => {

            if (
                recordedNotes.length === 0
            ) {

                return;

            }

            const transferData = {

                notes:
                    recordedNotes,

                duration:
                    recordingDuration,

                createdAt:
                    new Date().toISOString()

            };

            localStorage.setItem(
                "louisKarielPianoRecording",
                JSON.stringify(
                    transferData
                )
            );

            window.location.href =
                "composer.html?import=piano";

        }
    );

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createPianoKeyboard();

        if (octaveDisplay) {

            octaveDisplay.textContent =
                octave;

        }

        console.log(
            "🎹 Virtual Piano Ready!"
        );

    }
);

function quantizeBeat(
    beat,
    subdivision = 4
) {

    return Math.round(
        beat * subdivision
    ) / subdivision;

}