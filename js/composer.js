let audioContext = null;

let masterGain = null;

let bpm = 120;

const STEPS = 16;

let totalSteps = STEPS;

const ROWS = 88;

const DEFAULT_NOTE_DURATION = 1;

const composerPianoKeys =
    [...pianoKeys].reverse();

const noteList =
    composerPianoKeys.map(
        key => key.name
    );

const keyboardMap = {

    "a": "C4",
    "w": "C#4",
    "s": "D4",
    "e": "D#4",
    "d": "E4",
    "f": "F4",
    "t": "F#4",
    "g": "G4",
    "y": "G#4",
    "h": "A4",
    "u": "A#4",
    "j": "B4",
    "k": "C5"

};

const pianoRoll =
    document.getElementById(
        "pianoRoll"
    );

const pianoLabels =
    document.getElementById(
        "pianoLabels"
    );

const beatLabels =
    document.getElementById(
        "beatLabels"
    );

const songTitle =
    document.getElementById(
        "songTitle"
    );

const bpmInput =
    document.getElementById(
        "bpm"
    );

const playButton =
    document.getElementById(
        "playButton"
    );

const stopButton =
    document.getElementById(
        "stopButton"
    );

const saveButton =
    document.getElementById(
        "saveButton"
    );

const clearButton =
    document.getElementById(
        "clearButton"
    );

const importButton =
    document.getElementById(
        "importButton"
    );

const statusText =
    document.getElementById(
        "statusText"
    );

const restModeButton =
    document.getElementById(
        "restModeButton"
    );

let restMode = false;

if (restModeButton) {

    restModeButton.addEventListener(
        "click",
        () => {

            restMode =
                !restMode;

            restModeButton.classList.toggle(
                "active",
                restMode
            );

            const durationTitle =
                document.querySelector(
                    ".note-duration-title"
                );

            if (restMode) {

                restModeButton.textContent =
                    "음표";

                if (durationTitle) {

                    durationTitle.textContent =
                        "쉼표 길이";

                }

                if (
                    selectedDuration !== null
                ) {

                    selectedDurationText.textContent =
                        getRestDurationDisplayName(
                            selectedDuration
                        );

                }

                statusText.textContent =
                    "쉼표 입력 모드";

            }
            else {

                restModeButton.textContent =
                    "쉼표";

                if (durationTitle) {

                    durationTitle.textContent =
                        "음표 길이";

                }

                if (
                    selectedDuration !== null
                ) {

                    selectedDurationText.textContent =
                        getDurationDisplayName(
                            selectedDuration
                        );

                }

                statusText.textContent =
                    "음표 입력 모드";

            }

            updateDurationButtonSymbols();

        }
    );

}

const selectedNote =
    document.getElementById(
        "selectedNote"
    );

let selectedDuration = null;

let tripletMode = false;

const durationButtons =
    document.querySelectorAll(
        ".duration-button"
    );

const selectedDurationText =
    document.getElementById(
        "selectedDuration"
    );

function getDurationDisplayName(duration) {
    switch (duration) {
        case 0.25:
            return "16분음표";

        case 0.5:
            return "8분음표";

        case 0.75:
            return "점8분음표";

        case 1:
            return "4분음표";

        case 2:
            return "2분음표";

        case 3:
            return "점2분음표";

        case 4:
            return "온음표";

        default:
            return `${duration}박 음표`;
    }
}

function getRestDurationDisplayName(
    duration
) {

    switch (duration) {

        case 0.25:
            return "16분쉼표";

        case 0.5:
            return "8분쉼표";

        case 0.75:
            return "점8분쉼표";

        case 1:
            return "4분쉼표";

        case 2:
            return "2분쉼표";

        case 3:
            return "점2분쉼표";

        case 4:
            return "온쉼표";

        default:
            return `${duration}박 쉼표`;

    }

}

durationButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            durationButtons.forEach(
                btn => {

                    btn.classList.remove(
                        "active"
                    );

                }
            );

            button.classList.add(
                "active"
            );

            selectedDuration =
                Number(
                    button.dataset.duration
                );

            if (restMode) {

                selectedDurationText.textContent =
                    getRestDurationDisplayName(
                        selectedDuration
                    );

            }
            else {

                selectedDurationText.textContent =
                    getDurationDisplayName(
                        selectedDuration
                    );

            }

        }
    );

});

const tripletButton =
    document.getElementById("tripletButton");

if (tripletButton) {
    tripletButton.addEventListener(
        "click",
        () => {

            if (restMode) {
                statusText.textContent =
                    "셋잇단음표 입력 모드는 음표 입력 모드 내에서만 사용 가능합니다.";
                return;
            }

            tripletMode = !tripletMode;

            tripletButton.classList.toggle(
                "active",
                tripletMode
            );

            if (tripletMode) {
                selectedDurationText.textContent =
                    "셋잇단음표 (1박 ÷ 3)";
            }

            else {

                if (selectedDuration === null) {

                    selectedDurationText.textContent =
                        "-";

                }

                else {

                    selectedDurationText.textContent =
                        getDurationDisplayName(
                            selectedDuration
                        );
                }

            }

        }
    );

}

let composition = [];

let selectedNotes = [];

const composerCellMap = new Map;

const activeComposerCells = new Set();

const composerNoteBlockMap = new Map();

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Delete" &&
            event.key !== "Backspace"
        ) {
            return;
        }

        if (
            selectedNotes.length === 0
        ) {
            return;
        }

        event.preventDefault();

        saveUndoState();

        const deleteCount =
            selectedNotes.length;

        composition =
            composition.filter(
                note =>
                    !selectedNotes.includes(
                        note
                    )
            );

        selectedNotes = [];

        renderComposition();

        statusText.textContent =
            `${deleteCount}개의 음표가 삭제되었습니다.`;

    }
);

let undoStack = [];

let redoStack = [];

let currentStep = 0;

let wasResizing = false;

let wasDragging = false;

let isPlaying = false;

let playbackTimers = [];

function saveUndoState() {

    const currentState =
        JSON.stringify(
            composition
        );

    if (
        undoStack.length > 0 &&
        undoStack[
        undoStack.length - 1
        ] === currentState
    ) {
        return;
    }

    undoStack.push(
        currentState
    );

    if (
        undoStack.length > 50
    ) {
        undoStack.shift();
    }

    redoStack = [];

}

function undoComposition() {

    if (
        undoStack.length === 0
    ) {

        statusText.textContent =
            "되돌릴 작업이 없습니다.";

        return;

    }

    redoStack.push(
        JSON.stringify(
            composition
        )
    );

    composition =
        JSON.parse(
            undoStack.pop()
        );

    selectedNotes = [];

    renderComposition();

    statusText.textContent =
        "↩ 실행 취소";

}

function redoComposition() {

    if (
        redoStack.length === 0
    ) {

        statusText.textContent =
            "다시 실행할 작업이 없습니다.";

        return;

    }

    undoStack.push(
        JSON.stringify(
            composition
        )
    );

    composition =
        JSON.parse(
            redoStack.pop()
        );

    selectedNotes = [];

    renderComposition();

    statusText.textContent =
        "↪ 다시 실행";

}

function initializeAudio() {

    if (audioContext) {
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
        0.5;

    masterGain.connect(
        audioContext.destination
    );

}

function getFrequency(noteName) {

    const match =
        noteName.match(
            /^([A-G]#?)(\d)$/
        );

    if (!match) {
        return 440;
    }

    const noteNameOnly =
        match[1];

    const octave =
        Number(match[2]);

    const noteValues = {

        "C": 0,
        "C#": 1,
        "D": 2,
        "D#": 3,
        "E": 4,
        "F": 5,
        "F#": 6,
        "G": 7,
        "G#": 8,
        "A": 9,
        "A#": 10,
        "B": 11

    };

    const midi =
        (octave + 1) * 12 +
        noteValues[noteNameOnly];

    return (
        440 *
        Math.pow(
            2,
            (midi - 69) / 12
        )
    );

}

function playNote(
    noteName,
    durationBeats = DEFAULT_NOTE_DURATION
) {

    initializeAudio();

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "triangle";

    oscillator.frequency.value =
        getFrequency(noteName);

    gain.gain.setValueAtTime(
        0,
        audioContext.currentTime
    );

    gain.gain.linearRampToValueAtTime(
        0.5,
        audioContext.currentTime + 0.02
    );

    const duration =
        (60000 / bpm / 1000) *
        durationBeats;

    gain.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + duration
    );

    oscillator.connect(gain);

    gain.connect(masterGain);

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + duration
    );

}

function createGrid() {

    pianoRoll.innerHTML = "";

    composerCellMap.clear();

    pianoRoll.style.setProperty(
        "--composer-steps",
        totalSteps
    );

    for (
        let row = 0;
        row < ROWS;
        row++
    ) {

        for (
            let step = 0;
            step < totalSteps;
            step++
        ) {

            const cell =
                document.createElement(
                    "div"
                );

            cell.classList.add(
                "composer-cell"
            );

            const note =
                noteList[row];

            cell.dataset.note =
                note;

            cell.dataset.step =
                step;

            composerCellMap.set(
                `${note}|${step}`,
                cell
            );

            cell.style.gridColumn =
                `${step + 1}`;

            cell.style.gridRow =
                `${row + 1}`;

            if (
                note.includes("#")
            ) {

                cell.classList.add(
                    "black-row"
                );

            }

            cell.addEventListener(
                "click",
                () => {

                    if (wasResizing) {
                        wasResizing = false;
                        return;
                    }

                    if (wasDragging) {
                        wasDragging = false;
                        return;
                    }

                    toggleNote(
                        cell
                    );

                }
            );

            pianoRoll.appendChild(
                cell
            );

        }

    }

}

let isExpandingGrid = false;

function expandComposerGrid() {

    if (isExpandingGrid) {
        return;
    }

    isExpandingGrid = true;

    const oldTotalSteps =
        totalSteps;

    const newTotalSteps =
        totalSteps + 16;

    totalSteps =
        newTotalSteps;

    pianoRoll.style.setProperty(
        "--composer-steps",
        totalSteps
    );

    createBeatLabels();

    syncBeatLabelsWidth();

    for (
        let row = 0;
        row < ROWS;
        row++
    ) {

        for (
            let step = oldTotalSteps;
            step < newTotalSteps;
            step++
        ) {

            const cell =
                document.createElement(
                    "div"
                );

            cell.classList.add(
                "composer-cell"
            );

            const note =
                noteList[row];

            cell.dataset.note =
                note;

            cell.dataset.step =
                step;

            composerCellMap.set(
                `${note}|${step}`,
                cell
            );

            cell.style.gridColumn =
                `${step + 1}`;

            cell.style.gridRow =
                `${row + 1}`;

            if (
                note.includes("#")
            ) {

                cell.classList.add(
                    "black-row"
                );

            }

            cell.addEventListener(
                "click",
                () => {

                    if (wasResizing) {

                        wasResizing = false;

                        return;

                    }

                    if (wasDragging) {

                        wasDragging = false;

                        return;

                    }

                    toggleNote(
                        cell
                    );

                }
            );

            pianoRoll.appendChild(
                cell
            );

        }

    }

    createOctaveSeparators();

    console.log(
        `🎼 작곡 영역 확장 : ${oldTotalSteps} → ${newTotalSteps}박`
    );

    isExpandingGrid = false;

}

function createLabels() {

    pianoLabels.innerHTML = "";

    noteList.forEach(
        note => {

            const label =
                document.createElement(
                    "div"
                );

            label.textContent =
                note;

            pianoLabels.appendChild(
                label
            );

        }
    );

}

function createOctaveSeparators() {
    const pianoLabels =
        document.querySelector(".piano-labels");

    const pianoRoll =
        document.querySelector(".piano-roll");

    if (!pianoLabels || !pianoRoll) {
        return;
    }

    pianoLabels
        .querySelectorAll(".octave-label")
        .forEach(element => element.remove());

    pianoRoll
        .querySelectorAll(".octave-separator")
        .forEach(element => element.remove());

    const rowHeight = 42;

    composerPianoKeys.forEach((key, index) => {

        const noteName = key.name;

        if (!noteName.startsWith("C")) {
            return;
        }

        const octaveMatch =
            noteName.match(/C(\d)$/);

        if (!octaveMatch) {
            return;
        }

        const octave =
            Number(octaveMatch[1]);

        const top =
            index * rowHeight;

        const separator =
            document.createElement("div");

        separator.className =
            "octave-separator";

        separator.style.color = "#888";

        separator.style.top =
            `${top}px`;

        pianoRoll.appendChild(separator);

        const label =
            document.createElement("div");

        label.className =
            "octave-label";

        label.textContent =
            `${octave}옥타브`;

        label.style.top =
            `${top}px`;

        if (octave === 8) {
            label.style.transform =
                "translateY(0)";
        }

        pianoLabels.appendChild(label);
    });
}

function createBeatLabels() {

    beatLabels.innerHTML = "";

    const totalMeasures =
        Math.ceil(
            totalSteps / 4
        );

    beatLabels.style.width =
        `${totalSteps * 120}px`;

    beatLabels.style.display =
        "grid";

    beatLabels.style.gridTemplateColumns =
        `repeat(${totalMeasures}, 480px)`;

    for (
        let measure = 1;
        measure <= totalMeasures;
        measure++
    ) {

        const label =
            document.createElement("div");

        label.classList.add(
            "beat-label"
        );

        label.textContent =
            measure;

        beatLabels.appendChild(
            label
        );

    }

}

function syncBeatLabelsWidth() {

    if (!beatLabels) {
        return;
    }

    beatLabels.style.width =
        `${totalSteps * 120}px`;

    beatLabels.style.flex =
        "none";

}

function syncPianoLabelsHeight() {

    if (!pianoLabels || !pianoRoll) {
        return;
    }

    pianoLabels.style.height =
        `${pianoRoll.clientHeight}px`;

}

function toggleNote(cell) {

    const note =
        cell.dataset.note;

    const step =
        Number(
            cell.dataset.step
        );

    if (selectedDuration === null) {
        statusText.textContent =
            "입력할 음표나 쉼표를 먼저 선택해주세요.";
        return;
    }

    if (restMode) {

        const restData =
            createRestData(
                step,
                selectedDuration
            );

        saveUndoState();

        composition.push({
            ...restData,

            note:
                note,

            step:
                step,

            offsetBeats:
                0
        });

        renderComposition();

        statusText.textContent =
            `${selectedDuration}박 쉼표가 입력되었습니다.`;

        return;

    }

    let actualDuration;
    let offset;

    if (tripletMode) {

        actualDuration =
            1 / 3;

        offset =
            getNextTripletOffset(
                note,
                step
            );

    }

    else {

        const maxDuration =
            getMaxDurationForStep(step);

        actualDuration =
            Math.min(
                selectedDuration,
                maxDuration
            );

        offset =
            getNextAvailableOffset(
                note,
                step,
                actualDuration
            );

    }

    if (offset === null) {

        statusText.textContent =
            tripletMode
                ? "이 박에는 셋잇단음표를 더 넣을 공간이 없습니다."
                : "이 박에 더이상 음표를 넣을 공간이 없습니다.";

        return;

    }

    saveUndoState();

    composition.push({

        note:
            note,

        step:
            step,

        offsetBeats:
            offset,

        durationBeats:
            actualDuration,

        isTriplet:
            tripletMode

    });

    selectedNote.textContent =
        note;

    statusText.textContent =
        tripletMode
            ? `셋잇단음표 입력 : ${offset === 0 ? "1번째" : offset < 0.5 ? "2번째" : "3번째"}`
            : `${actualDuration}박 음표가 입력되었습니다.`;

    renderSingleNote(
        composition[
        composition.length - 1
        ]
    );

}

document.addEventListener(
    "keydown",
    event => {

        if (
            !event.ctrlKey &&
            !event.metaKey
        ) {
            return;
        }

        if (
            event.key.toLowerCase() === "z"
        ) {

            event.preventDefault();

            undoComposition();

            return;

        }

        if (
            event.key.toLowerCase() === "y"
        ) {

            event.preventDefault();

            redoComposition();

            return;

        }

    }
);

function addKeyboardNote(note) {

    if (selectedDuration === null) {

        statusText.textContent =
            "음표를 먼저 선택해주세요.";

        return;

    }

    let targetStep =
        currentStep;

    let actualDuration;
    let offset;

    if (tripletMode) {

        actualDuration =
            1 / 3;

        offset =
            getNextTripletOffset(
                note,
                targetStep
            );

    }

    else {

        const maxDuration =
            getMaxDurationForStep(
                targetStep
            );

        actualDuration =
            Math.min(
                selectedDuration,
                maxDuration
            );

        offset =
            getNextAvailableOffset(
                note,
                targetStep,
                actualDuration
            );

    }

    if (offset === null) {

        targetStep++;

        if (
            targetStep >= totalSteps
        ) {

            while (targetStep >= totalSteps) {
                expandComposerGrid();
            }

        }

        if (tripletMode) {

            actualDuration =
                1 / 3;

            offset =
                getNextTripletOffset(
                    note,
                    targetStep
                );

        }

        else {

            const nextMaxDuration =
                getMaxDurationForStep(
                    targetStep
                );

            actualDuration =
                Math.min(
                    selectedDuration,
                    nextMaxDuration
                );

            offset =
                getNextAvailableOffset(
                    note,
                    targetStep,
                    actualDuration
                );

        }

    }

    if (offset === null) {

        statusText.textContent =
            tripletMode
                ? "셋잇단음표를 입력할 공간이 없습니다."
                : "이 박에 더 이상 음표를 넣을 공간이 없습니다.";

        return;

    }

    saveUndoState();

    composition.push({

        note:
            note,

        step:
            targetStep,

        offsetBeats:
            offset,

        durationBeats:
            actualDuration,

        isTriplet:
            tripletMode

    });

    selectedNote.textContent =
        note;

    statusText.textContent =
        tripletMode
            ? `셋잇단음표 입력 : ${offset === 0 ? "1번째" : offset < 0.5 ? "2번째" : "3번째"}`
            : `${actualDuration}박 음표가 입력되었습니다.`;

    playNote(
        note,
        actualDuration
    );

    renderComposition();

    const nextPosition =
        offset +
        actualDuration;

    if (
        nextPosition >= 1
    ) {

        currentStep =
            targetStep + 1;

        if (
            currentStep >= totalSteps
        ) {

            currentStep = 0;

        }

    }

    else {

        currentStep =
            targetStep;

    }

    updateCurrentStep();

}

document.addEventListener(
    "keydown",
    event => {

        if (event.repeat) {
            return;
        }

        if (
            event.ctrlKey ||
            event.metaKey
        ) {
            return;
        }

        const note =
            keyboardMap[
            event.key.toLowerCase()
            ];

        if (!note) {
            return;
        }

        addKeyboardNote(
            note
        );

    }
);

function getNextTripletOffset(
    note,
    step
) {

    const tripletDuration =
        1 / 3;

    const tripletSlots = [
        0,
        1,
        2
    ];

    const beatStart =
        step;

    const measureStart =
        Math.floor(step / 4) * 4;

    const measureEnd =
        measureStart + 4;

    for (
        const slot of tripletSlots
    ) {

        const offset =
            slot * tripletDuration;

        const newStart =
            beatStart +
            offset;

        const newEnd =
            newStart +
            tripletDuration;

        if (
            newEnd >
            measureEnd + 0.000001
        ) {
            continue;
        }

        const collision =
            composition.some(
                item => {

                    if (
                        item.note !== note
                    ) {
                        return false;
                    }

                    const existingOffset =
                        typeof item.offsetBeats === 'number'
                            ? item.offsetBeats
                            : 0;

                    const existingDuration =
                        typeof item.durationBeats === "number"
                            ? item.durationBeats
                            : DEFAULT_NOTE_DURATION;

                    const existingStart =
                        item.step +
                        existingOffset;

                    const existingEnd =
                        existingStart +
                        existingDuration;

                    const epsilon =
                        0.000001;

                    return (
                        newStart <
                        existingEnd - epsilon &&
                        newEnd >
                        existingStart + epsilon
                    );

                }
            );

        if (!collision) {

            return offset;

        }

    }

    return null;

}

function getNextAvailableOffset(
    note,
    step,
    duration
) {

    const subdivisions = 4;

    const measureStart =
        Math.floor(step / 4) * 4;

    const measureEnd =
        measureStart + 4;

    for (
        let i = 0;
        i < subdivisions;
        i++
    ) {

        const offset =
            i / subdivisions;

        const newStart =
            step +
            offset;

        const newEnd =
            newStart +
            duration;

        if (
            newEnd >
            measureEnd
        ) {
            continue;
        }

        const collision =
            composition.some(
                item => {

                    if (
                        item.note !== note
                    ) {
                        return false;
                    }

                    const existingOffset =
                        item.offsetBeats || 0;

                    const existingDuration =
                        item.durationBeats ||
                        DEFAULT_NOTE_DURATION;

                    const existingStart =
                        item.step +
                        existingOffset;

                    const existingEnd =
                        existingStart +
                        existingDuration;

                    return (
                        newStart <
                        existingEnd &&
                        newEnd >
                        existingStart
                    );

                }
            );

        if (!collision) {

            return offset;

        }

    }

    return null;

}

function getMaxDurationForStep(step) {

    const positionInMeasure =
        step % 4;

    const remainingBeats =
        4 - positionInMeasure;

    return remainingBeats;

}

function hasNoteCollision(
    note,
    step,
    durationBeats,
    offsetBeats = 0,
    ignoredNotes = []
) {

    const newStart =
        step +
        offsetBeats;

    const newEnd =
        newStart +
        durationBeats;

    return composition.some(
        item => {

            if (
                ignoredNotes.includes(
                    item
                )
            ) {
                return false;
            }

            if (
                item.note !== note
            ) {
                return false;
            }

            const existingOffset =
                item.offsetBeats || 0;

            const existingDuration =
                item.durationBeats ||
                DEFAULT_NOTE_DURATION;

            const existingStart =
                item.step +
                existingOffset;

            const existingEnd =
                existingStart +
                existingDuration;

            return (
                newStart < existingEnd &&
                newEnd > existingStart
            );

        }
    );

}

function snapStep(step) {

    return Math.round(
        step * 4
    ) / 4;

}

function moveToNextStep() {

    currentStep++;

    if (
        currentStep >= STEPS
    ) {

        currentStep = 0;

    }

    updateCurrentStep();

}

let previousCurrentStepCells = [];

function updateCurrentStep() {

    previousCurrentStepCells.forEach(cell => {

        cell.classList.remove(
            "current-step"
        );

    });

    previousCurrentStepCells = [];

    for (let row = 0; row < ROWS; row++) {

        const note =
            noteList[row];

        const cell =
            composerCellMap.get(
                `${note}|${currentStep}`
            );

        if (!cell) {
            continue;
        }

        cell.classList.add(
            "current-step"
        );

        previousCurrentStepCells.push(
            cell
        );

    }

}

bpmInput.addEventListener(
    "change",
    () => {

        bpm =
            Math.max(
                40,
                Math.min(
                    240,
                    Number(
                        bpmInput.value
                    )
                )
            );

        bpmInput.value =
            bpm;

    }
);

playButton.addEventListener(
    "click",
    () => {

        if (
            composition.length === 0
        ) {

            statusText.textContent =
                "먼저 음표를 추가해주세요.";

            return;

        }

        startPlayback();

    }
);

function startPlayback() {

    stopPlayback();

    initializeAudio();

    isPlaying = true;

    statusText.textContent =
        "▶ 작곡한 곡을 재생 중입니다.";

    const beatDuration =
        60000 / bpm;

    let longestEndBeat = 0;

    composition.forEach(
        item => {

            const offset =
                item.offsetBeats || 0;

            const duration =
                item.durationBeats ||
                DEFAULT_NOTE_DURATION;

            const absoluteBeat =
                item.step +
                offset;

            const delay =
                absoluteBeat *
                beatDuration;

            const timer =
                setTimeout(
                    () => {

                        if (item.type === "rest") {
                            return;
                        }

                        playNote(
                            item.note,
                            duration
                        );

                    },
                    delay
                );

            playbackTimers.push(
                timer
            );

            const endBeat =
                absoluteBeat +
                duration;

            longestEndBeat =
                Math.max(
                    longestEndBeat,
                    endBeat
                );

        }
    );

    for (
        let step = 0;
        step < STEPS;
        step++
    ) {

        const timer =
            setTimeout(
                () => {

                    highlightStep(
                        step
                    );

                },
                step * beatDuration
            );

        playbackTimers.push(
            timer
        );

    }

    const finishTimer =
        setTimeout(
            () => {

                isPlaying = false;

                statusText.textContent =
                    "재생 완료";

                clearStepHighlight();

            },
            longestEndBeat *
            beatDuration
        );

    playbackTimers.push(
        finishTimer
    );

}

function highlightStep(step) {

    clearStepHighlight();

    document
        .querySelectorAll(
            `.composer-cell[data-step="${step}"]`
        )
        .forEach(cell => {

            cell.classList.add(
                "current-step"
            );

        });

}

function clearStepHighlight() {

    previousCurrentStepCells.forEach(
        cell => {

            cell.classList.remove(
                "current-step"
            );

        }
    );

    previousCurrentStepCells = [];

}

stopButton.addEventListener(
    "click",
    () => {

        stopPlayback();

        statusText.textContent =
            "재생 정지";

    }
);

function stopPlayback() {

    playbackTimers.forEach(
        timer => {

            clearTimeout(timer);

        }
    );

    playbackTimers = [];

    isPlaying = false;

    clearStepHighlight();

}

saveButton.addEventListener(
    "click",
    () => {

        const data = {

            title:
                songTitle.value,

            bpm:
                bpm,

            notes:
                composition,

            saveAt:
                new Date().toISOString()

        };

        localStorage.setItem(
            "louisKarielComposition",
            JSON.stringify(data)
        );

        statusText.textContent =
            "💾 곡이 저장되었습니다.";

    }
);

function loadComposition() {

    const saved =
        localStorage.getItem(
            "louisKarielComposition"
        );

    if (!saved) {
        return;
    }

    try {

        const data =
            JSON.parse(saved);

        songTitle.value =
            data.title ||
            "나의 첫 번째 곡";

        bpm =
            data.bpm ||
            120;

        bpmInput.value =
            bpm;

        composition =
            data.notes ||
            [];

        composition =
            composition.map(note => ({
                ...note,

                offsetBeats:
                    typeof note.offsetBeats === "number"
                        ? note.offsetBeats
                        : 0,

                durationBeats:
                    note.durationBeats ||
                    DEFAULT_NOTE_DURATION
            }));

        restoreGrid();

        renderComposition();

        statusText.textContent =
            "💾 저장된 곡을 불러왔습니다.";

    }

    catch (error) {

        console.error(
            "곡 불러오기 실패 : ",
            error
        );

    }

}

function restoreGrid() {

    activeComposerCells.forEach(
        cell => {

            cell.classList.remove(
                "active"
            );

        }
    );

    activeComposerCells.clear();

    composition.forEach(noteData => {

        const cell =
            composerCellMap.get(
                `${noteData.note}|${noteData.step}`
            );

        if (!cell) {
            return;
        }

        cell.classList.add(
            "active"
        );

        activeComposerCells.add(
            cell
        );

    });

}

function updateNoteSymbol(
    block,
    noteData
) {

    const noteSymbol =
        block.querySelector(
            ".note-symbol"
        );

    if (!noteSymbol) {
        return;
    }

    noteSymbol.classList.remove(
        "short-note-symbol",
        "half-note-symbol"
    );

    const duration =
        noteData.durationBeats ||
        DEFAULT_NOTE_DURATION;

    if (duration <= 0.25) {

        noteSymbol.textContent =
            "𝅘𝅥𝅯";

        noteSymbol.classList.add(
            "short-note-symbol"
        );

    }
    else if (duration <= 0.5) {

        noteSymbol.textContent =
            "♪";

        noteSymbol.classList.add(
            "half-note-symbol"
        );

    }
    else if (duration <= 0.75) {

        noteSymbol.textContent =
            "♪.";

    }
    else if (duration <= 1) {

        noteSymbol.textContent =
            "♩";

    }
    else if (duration <= 2) {

        noteSymbol.textContent =
            "𝅗𝅥";

    }
    else if (duration <= 3) {

        noteSymbol.textContent =
            "𝅗𝅥.";

    }
    else {

        noteSymbol.textContent =
            "𝅝";

    }

    const tripletMark =
        block.querySelector(
            ".triplet-mark"
        );

    if (tripletMark) {

        tripletMark.style.display =
            noteData.isTriplet
                ? ""
                : "none";

    }

}

function createRestData(
    startStep,
    durationBeats = DEFAULT_NOTE_DURATION
) {

    return {
        type: "rest",

        startStep: startStep,

        durationBeats: durationBeats,

        isTriplet: false
    };

}

function createRestBlock(restData, cell) {

    const block =
        document.createElement("div");

    block.className =
        "note-block rest-block";

    block.dataset.type =
        "rest";

    block.dataset.startStep =
        restData.startStep;

    block.dataset.durationBeats =
        restData.durationBeats;

    block.noteData =
        restData;

    const symbol =
        document.createElement("span");

    symbol.className =
        "rest-symbol";

    symbol.textContent =
        getRestSymbol(
            restData.durationBeats
        );

    block.appendChild(symbol);

    const resizeHandle =
        document.createElement("div");

    resizeHandle.className =
        "rest-resize-handle";

    block.appendChild(
        resizeHandle
    );

    cell.appendChild(block);

    updateRestBlockWidth(
        block,
        restData
    );

    block.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            saveUndoState();

            const index =
                composition.indexOf(
                    restData
                );

            if (index === -1) {
                return;
            }

            composition.splice(
                index,
                1
            );

            selectedNotes =
                selectedNotes.filter(
                    note =>
                        note !== restData
                );

            renderComposition();

            statusText.textContent =
                "쉼표가 삭제되었습니다.";

        }
    );

    setupRestDrag(
        block,
        restData
    );

    setupRestResize(
        block,
        restData,
        resizeHandle
    );

    return block;

}

function setupRestResize(
    block,
    restData,
    handle
) {

    let isResizing = false;

    let startX = 0;

    let originalDuration = 0;

    handle.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();
            event.stopPropagation();

            isResizing = true;

            startX =
                event.clientX;

            originalDuration =
                restData.durationBeats;

            saveUndoState();

            handle.setPointerCapture(
                event.pointerId
            );

        }
    );

    handle.addEventListener(
        "pointermove",
        event => {

            if (!isResizing) {
                return;
            }

            const deltaX =
                event.clientX -
                startX;

            const deltaBeats =
                deltaX / 120;

            let newDuration =
                originalDuration +
                deltaBeats;

            newDuration =
                Math.round(
                    newDuration * 4
                ) / 4;

            newDuration =
                Math.max(
                    0.25,
                    newDuration
                );

            newDuration =
                Math.min(
                    4,
                    newDuration
                );

            const maxDuration =
                totalSteps -
                restData.startStep;

            newDuration =
                Math.min(
                    newDuration,
                    maxDuration
                );

            restData.durationBeats =
                newDuration;

            block.dataset.durationBeats =
                newDuration;

            updateRestBlockWidth(
                block,
                restData
            );

            const symbol =
                block.querySelector(
                    ".rest-symbol"
                );

            if (symbol) {

                symbol.textContent =
                    getRestSymbol(
                        restData.durationBeats
                    );

            }

        }
    );

    handle.addEventListener(
        "pointerup",
        event => {

            if (!isResizing) {
                return;
            }

            isResizing = false;

            handle.releasePointerCapture(
                event.pointerId
            );

            renderComposition();

            statusText.textContent =
                `${restData.durationBeats}박 쉼표로 변경되었습니다.`;

        }
    );

}

function setupRestDrag(
    block,
    restData
) {

    let isDragging = false;

    let hasMoved = false;

    let startX = 0;

    let originalStep = 0;

    block.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();
            event.stopPropagation();

            isDragging = true;

            hasMoved = false;

            startX =
                event.clientX;

            originalStep =
                restData.startStep;

            block.setPointerCapture(
                event.pointerId
            );

        }
    );

    block.addEventListener(
        "pointermove",
        event => {

            if (!isDragging) {
                return;
            }

            if (
                Math.abs(
                    event.clientX -
                    startX
                ) < 5
            ) {
                return;
            }

            hasMoved = true;

            const deltaX =
                event.clientX -
                startX;

            const deltaStep =
                Math.round(
                    deltaX / 120
                );

            let newStep =
                originalStep +
                deltaStep;

            newStep =
                Math.max(
                    0,
                    newStep
                );

            newStep =
                Math.min(
                    newStep,
                    totalSteps -
                    restData.durationBeats
                );

            restData.startStep =
                newStep;

            restData.step =
                newStep;

            block.dataset.startStep =
                newStep;

            block.dataset.step =
                newStep;

            block.style.left =
                "0px";

        }
    );

    block.addEventListener(
        "pointerup",
        event => {

            if (!isDragging) {
                return;
            }

            isDragging = false;

            block.releasePointerCapture(
                event.pointerId
            );

            if (!hasMoved) {
                return;
            }

            renderComposition();

            statusText.textContent =
                "쉼표가 이동되었습니다.";

        }
    );

}

function updateRestBlockWidth(
    block,
    restData
) {

    const width =
        restData.durationBeats * 120;

    block.style.width =
        `${width}px`;

}

function createNoteBlock(
    noteData,
    cell
) {

    const block =
        document.createElement(
            "div"
        );

    block.classList.add(
        "note-block"
    );

    block.noteData =
        noteData;

    const noteSymbol =
        document.createElement(
            "span"
        );

    noteSymbol.classList.add(
        "note-symbol"
    );

    if (
        noteData.durationBeats <= 0.25
    ) {

        noteSymbol.classList.add(
            "short-note-symbol"
        );

    }
    else if (
        noteData.durationBeats <= 0.5
    ) {

        noteSymbol.classList.add(
            "half-note-symbol"
        );

    }

    const duration =
        noteData.durationBeats ||
        DEFAULT_NOTE_DURATION;

    if (duration <= 0.25) {

        noteSymbol.textContent =
            "𝅘𝅥𝅯";

    }
    else if (duration <= 0.5) {

        noteSymbol.textContent =
            "♪";

    }
    else if (duration <= 0.75) {

        noteSymbol.textContent =
            "♪.";

    }
    else if (duration <= 1) {

        noteSymbol.textContent =
            "♩";

    }
    else if (duration <= 2) {

        noteSymbol.textContent =
            "𝅗𝅥";

    }
    else if (duration <= 3) {

        noteSymbol.textContent =
            "𝅗𝅥.";

    }
    else {

        noteSymbol.textContent =
            "𝅝";

    }

    if (noteData.isTriplet) {

        const tripletMark =
            document.createElement(
                "Span"
            );

        tripletMark.className =
            "triplet-mark";

        tripletMark.textContent =
            "3";

        block.appendChild(
            tripletMark
        );

    }

    block.appendChild(
        noteSymbol
    );

    if (
        selectedNotes.includes(
            noteData
        )
    ) {

        block.classList.add(
            "selected"
        );

    }

    const handle =
        document.createElement(
            "div"
        );

    handle.classList.add(
        "note-resize-handle"
    );

    block.appendChild(
        handle
    );

    cell.appendChild(
        block
    );

    composerNoteBlockMap.set(
        noteData,
        block
    );

    updateNoteBlockWidth(
        block,
        noteData
    );

    const offsetBeats =
        noteData.offsetBeats || 0;

    const cellWidth =
        cell.offsetWidth;

    block.style.left =
        `${cellWidth * offsetBeats}px`;

    setupNoteDrag(
        block,
        noteData
    );

    setupNoteResize(
        block,
        handle,
        noteData
    );

    return block;

}

function renderSingleNote(noteData) {

    const cell =
        composerCellMap.get(
            `${noteData.note}|${noteData.step}`
        );

    if (!cell) {
        return;
    }

    cell.classList.add(
        "active"
    );

    activeComposerCells.add(
        cell
    );

    const block =
        createNoteBlock(
            noteData,
            cell
        );

    block.addEventListener(
        "click",
        event => {

            if (wasDragging) {

                wasDragging = false;

                event.preventDefault();
                event.stopPropagation();

                return;

            }

            if (
                event.target.closest(
                    ".note-resize-handle"
                )
            ) {
                return;
            }

            if (
                event.shiftKey ||
                event.ctrlKey ||
                event.metaKey
            ) {
                return;
            }

            event.stopPropagation();

            saveUndoState();

            const index =
                composition.indexOf(
                    noteData
                );

            if (index !== -1) {

                composition.splice(
                    index,
                    1
                );

                const block =
                    composerNoteBlockMap.get(
                        noteData
                    );

                if (block) {

                    block.remove();

                    composerNoteBlockMap.delete(
                        noteData
                    );

                }

                if (!cell.querySelector(".note-block")) {

                    cell.classList.remove(
                        "active"
                    );

                    activeComposerCells.delete(
                        cell
                    );

                }

                selectedNotes =
                    selectedNotes.filter(
                        note =>
                            note !== noteData
                    );

                statusText.textContent =
                    "음표가 삭제되었습니다.";

            }

        }
    );

}

function renderComposition() {

    composerNoteBlockMap.forEach(
        block => {

            block.remove();

        }
    );

    composerNoteBlockMap.clear();

    document
        .querySelectorAll(".rest-block")
        .forEach(block => {
            block.remove();
        });

    activeComposerCells.forEach(
        cell => {

            cell.classList.remove(
                "active"
            );

        }
    );

    activeComposerCells.clear();

    composition.forEach(noteData => {

        const cell =
            composerCellMap.get(
                `${noteData.note}|${noteData.step}`
            );

        if (!cell) {
            return;
        }

        cell.classList.add(
            "active"
        );

        activeComposerCells.add(
            cell
        );

        if (
            noteData.type === "rest"
        ) {

            createRestBlock(
                noteData,
                cell
            );

            return;

        }

        const block =
            document.createElement("div");

        block.classList.add(
            "note-block"
        );

        block.noteData =
            noteData;

        block.addEventListener(
            "click",
            event => {

                if (wasDragging) {

                    wasDragging = false;

                    event.preventDefault();
                    event.stopPropagation();

                    return;

                }

                if (
                    event.target.closest(
                        ".note-resize-handle"
                    )
                ) {
                    return;
                }

                if (
                    event.shiftKey ||
                    event.ctrlKey ||
                    event.metaKey
                ) {
                    return;
                }

                event.stopPropagation();

                saveUndoState();

                const index =
                    composition.indexOf(
                        noteData
                    );

                if (index !== -1) {

                    composition.splice(
                        index,
                        1
                    );

                    selectedNotes =
                        selectedNotes.filter(
                            note =>
                                note !== noteData
                        );

                    renderComposition();

                    statusText.textContent =
                        "음표가 삭제되었습니다.";

                }

            }
        );

        const noteSymbol =
            document.createElement("span");

        noteSymbol.classList.add(
            "note-symbol"
        );

        if (noteData.durationBeats <= 0.25) {

            noteSymbol.classList.add(
                "short-note-symbol"
            );

        } else if (
            noteData.durationBeats <= 0.5
        ) {

            noteSymbol.classList.add(
                "half-note-symbol"
            );

        }

        const duration =
            noteData.durationBeats ||
            DEFAULT_NOTE_DURATION;

        if (duration <= 0.25) {

            noteSymbol.textContent = "𝅘𝅥𝅯";

        }
        else if (duration <= 0.5) {

            noteSymbol.textContent = "♪";

        }
        else if (duration <= 0.75) {

            noteSymbol.textContent = "♪.";

        }
        else if (duration <= 1) {

            noteSymbol.textContent = "♩";

        }
        else if (duration <= 2) {

            noteSymbol.textContent = "𝅗𝅥";

        }
        else if (duration <= 3) {

            noteSymbol.textContent = "𝅗𝅥."

        }
        else {

            noteSymbol.textContent = "𝅝";

        }

        if (noteData.isTriplet) {

            const tripletMark =
                document.createElement("span");

            tripletMark.className =
                "triplet-mark";

            tripletMark.textContent = "3";

            block.appendChild(tripletMark);

        }

        block.appendChild(
            noteSymbol
        );

        if (
            selectedNotes.includes(
                noteData
            )
        ) {

            block.classList.add(
                "selected"
            );

        }

        const handle =
            document.createElement("div");

        handle.classList.add(
            "note-resize-handle"
        );

        block.appendChild(
            handle
        );

        cell.appendChild(
            block
        );

        composerNoteBlockMap.set(
            noteData,
            block
        );

        updateNoteBlockWidth(
            block,
            noteData
        );

        const offsetBeats =
            noteData.offsetBeats || 0;

        const cellWidth =
            cell.offsetWidth;

        block.style.left =
            `${cellWidth * offsetBeats}px`;

        setupNoteDrag(
            block,
            noteData
        );

        setupNoteResize(
            block,
            handle,
            noteData
        );

    });

}

function updateNoteBlockWidth(
    block,
    noteData
) {

    const duration =
        noteData.durationBeats ||
        DEFAULT_NOTE_DURATION;

    const cellWidth =
        block.parentElement
            .getBoundingClientRect()
            .width;

    const width =
        cellWidth * duration;

    block.style.width =
        `${Math.max(width - 4, 4)}px`;

}

function toggleNoteSelection(noteData) {

    const index =
        selectedNotes.indexOf(
            noteData
        );

    if (index !== -1) {

        selectedNotes.splice(
            index,
            1
        );

        return false;

    }

    selectedNotes.push(
        noteData
    );

    return true;

}

function setupNoteDrag(
    block,
    noteData
) {

    let isDragging = false;
    let hasMoved = false;
    let isCopying = false;

    let startX = 0;
    let startY = 0;

    let startStep = 0;
    let startRow = 0;
    let startOffset = 0;

    let cellWidth = 0;
    let cellHeight = 0;

    let selectedNotePositions = [];

    block.addEventListener(
        "pointerdown",
        event => {

            if (
                event.shiftKey &&
                !event.ctrlKey &&
                !event.metaKey
            ) {

                toggleNoteSelection(
                    noteData
                );

                renderComposition();

                statusText.textContent =
                    selectedNotes.length > 0
                        ? `${selectedNotes.length}개의 음표가 선택되었습니다.`
                        : "선택이 해제되었습니다.";

                return;

            }

            if (
                event.target.classList.contains(
                    "note-resize-handle"
                )
            ) {

                return;

            }

            event.preventDefault();
            event.stopPropagation();

            isDragging = true;
            hasMoved = false;

            isCopying =
                event.ctrlKey ||
                event.metaKey;

            startX =
                event.clientX;

            startY =
                event.clientY;

            if (
                !selectedNotes.includes(
                    noteData
                )
            ) {

                selectedNotes = [
                    noteData
                ];

            }

            startStep =
                noteData.step;

            startRow =
                noteList.indexOf(
                    noteData.note
                );

            startOffset =
                noteData.offsetBeats || 0;

            selectedNotePositions =
                selectedNotes.map(
                    note => ({

                        noteData:
                            note,

                        step:
                            note.step,

                        offset:
                            note.offsetBeats || 0,

                        row:
                            noteList.indexOf(
                                note.note
                            )
                    })
                );

            const rect =
                block.parentElement
                    .getBoundingClientRect();

            cellWidth =
                rect.width;

            cellHeight =
                rect.height;

            block.setPointerCapture(
                event.pointerId
            );

            block.classList.add(
                "dragging"
            );

            statusText.textContent =
                `음표 이동 중 : ${noteData.note}`;

        }
    );

    block.addEventListener(
        "pointermove",
        event => {

            if (!isDragging) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const deltaX =
                event.clientX -
                startX;

            const deltaY =
                event.clientY -
                startY;

            const dragDistance =
                Math.sqrt(
                    deltaX * deltaX +
                    deltaY * deltaY
                );

            if (
                dragDistance >= 5
            ) {

                hasMoved = true;

                wasDragging = true;

            }

            if (!hasMoved) {
                return;
            }

            const deltaBeats =
                deltaX /
                cellWidth;

            let snappedDelta;

            if (noteData.isTriplet) {

                snappedDelta =
                    Math.round(
                        deltaBeats * 3
                    ) / 3;

            }
            else {

                snappedDelta =
                    Math.round(
                        deltaBeats * 4
                    ) / 4;

            }

            const deltaRows =
                Math.round(
                    deltaY /
                    cellHeight
                );

            selectedNotePositions.forEach(
                position => {

                    const targetBlock =
                        [
                            ...document.querySelectorAll(
                                ".note-block"
                            )
                        ].find(
                            item =>
                                item.noteData ===
                                position.noteData
                        );

                    if (!targetBlock) {
                        return;
                    }

                    const originalOffset =
                        position.offset;

                    const previewOffset =
                        originalOffset +
                        snappedDelta;

                    let totalPosition =
                        position.step +
                        previewOffset;

                    if (noteData.isTriplet) {

                        totalPosition =
                            Math.round(
                                totalPosition * 3
                            ) / 3;

                    }
                    else {

                        totalPosition =
                            Math.round(
                                totalPosition * 4
                            ) / 4;

                    }

                    let previewStep =
                        Math.floor(
                            totalPosition
                        );

                    let previewSubBeat =
                        totalPosition -
                        previewStep;

                    previewStep =
                        Math.max(
                            0,
                            Math.min(
                                totalSteps - 1,
                                previewStep
                            )
                        );

                    previewSubBeat =
                        Math.max(
                            0,
                            Math.min(
                                0.75,
                                previewSubBeat
                            )
                        );

                    if (noteData.isTriplet) {

                        previewSubBeat =
                            Math.round(
                                previewSubBeat * 3
                            ) / 3;

                    }

                    const visualDeltaX =
                        (
                            previewStep -
                            position.step +
                            previewSubBeat -
                            position.offset
                        ) *
                        cellWidth;

                    targetBlock.style.transform =
                        `translate(${visualDeltaX}px, ${deltaRows * cellHeight}px) scale(1.04)`;

                    targetBlock.style.opacity =
                        "0.82";

                    targetBlock.style.cursor =
                        "grabbing";

                    targetBlock.style.transition =
                        "none";

                }
            );

            let previewTotal =
                startStep +
                startOffset +
                snappedDelta;

            previewTotal =
                Math.round(
                    previewTotal * 4
                ) / 4;

            let previewStep =
                Math.floor(
                    previewTotal
                );

            let previewOffset =
                previewTotal -
                previewStep;

            previewStep =
                Math.max(
                    0,
                    Math.min(
                        totalSteps - 1,
                        previewStep
                    )
                );

            previewOffset =
                Math.max(
                    0,
                    Math.min(
                        0.75,
                        previewOffset
                    )
                );

            const previewRow =
                Math.max(
                    0,
                    Math.min(
                        ROWS - 1,
                        startRow +
                        deltaRows
                    )
                );

            const previewNote =
                noteList[
                previewRow
                ];

            const subBeatText =
                previewOffset === 0
                    ? "정박"
                    : `${previewOffset}박 위치`;

            statusText.textContent =
                `이동 위치 : ${previewNote}, ${previewStep + 1}번째 박 (${subBeatText})`;

        }
    );

    block.addEventListener(
        "pointerup",
        event => {

            if (!isDragging) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            isDragging = false;

            if (
                block.hasPointerCapture(
                    event.pointerId
                )
            ) {

                block.releasePointerCapture(
                    event.pointerId
                );

            }

            document
                .querySelectorAll(
                    ".note-block"
                )
                .forEach(
                    targetBlock => {

                        targetBlock.style.transform =
                            "";

                        targetBlock.style.opacity =
                            "";

                        targetBlock.style.cursor =
                            "";

                        targetBlock.style.transition =
                            "";

                    }
                );

            block.classList.remove(
                "dragging"
            );

            if (!hasMoved) {
                return;
            }

            const deltaX =
                event.clientX -
                startX;

            const deltaY =
                event.clientY -
                startY;

            const deltaBeats =
                deltaX /
                cellWidth;

            const snappedDelta =
                Math.round(
                    deltaBeats * 4
                ) / 4;

            const deltaRows =
                Math.round(
                    deltaY /
                    cellHeight
                );

            const movedPositions =
                selectedNotePositions.map(
                    position => {

                        let totalPosition =
                            position.step +
                            position.offset +
                            snappedDelta;

                        if (position.noteData.isTriplet) {

                            totalPosition =
                                Math.round(
                                    totalPosition * 3
                                ) / 3;

                        }
                        else {

                            totalPosition =
                                Math.round(
                                    totalPosition * 4
                                ) / 4;

                        }

                        let targetStep =
                            Math.floor(
                                totalPosition
                            );

                        let targetOffset =
                            totalPosition -
                            targetStep;

                        if (
                            targetStep >=
                            STEPS
                        ) {

                            targetStep =
                                totalSteps - 1;

                            targetOffset =
                                0.75;

                        }

                        targetStep =
                            Math.max(
                                0,
                                Math.min(
                                    totalSteps - 1,
                                    targetStep
                                )
                            );

                        targetOffset =
                            Math.max(
                                0,
                                Math.min(
                                    0.75,
                                    targetOffset
                                )
                            );

                        if (position.noteData.isTriplet) {

                            targetOffset =
                                Math.round(
                                    targetOffset * 3
                                ) / 3;

                        }

                        let targetRow =
                            position.row +
                            deltaRows;

                        targetRow =
                            Math.max(
                                0,
                                Math.min(
                                    ROWS - 1,
                                    targetRow
                                )
                            );

                        return {

                            noteData:
                                position.noteData,

                            step:
                                targetStep,

                            offsetBeats:
                                targetOffset,

                            row:
                                targetRow,

                            note:
                                noteList[
                                targetRow
                                ]

                        };

                    }
                );

            if (isCopying) {

                const notesToCopy =
                    selectedNotePositions;

                const copiedNotes = [];

                for (
                    const position
                    of notesToCopy
                ) {

                    const moved =
                        movedPositions.find(
                            item =>
                                item.noteData ===
                                position.noteData
                        );

                    if (!moved) {
                        continue;
                    }

                    const collision =
                        composition.some(
                            item =>
                                item.note ===
                                moved.note &&
                                item.step ===
                                moved.step &&
                                Math.abs(
                                    (
                                        item.offsetBeats ||
                                        0
                                    ) -
                                    moved.offsetBeats
                                ) < 0.001
                        );

                    if (collision) {

                        statusText.textContent =
                            "이미 음표가 있는 위치입니다.";

                        return;

                    }

                    copiedNotes.push({

                        note:
                            moved.note,

                        step:
                            moved.step,

                        offsetBeats:
                            moved.offsetBeats,

                        durationBeats:
                            Math.min(
                                moved.noteData.durationBeats ||
                                DEFAULT_NOTE_DURATION,

                                getMaxDurationForStep(
                                    moved.step
                                ) -
                                moved.offsetBeats
                            )

                    });

                }

                if (
                    copiedNotes.length === 0
                ) {

                    return;

                }

                saveUndoState();

                composition.push(
                    ...copiedNotes
                );

                selectedNotes = [
                    ...copiedNotes
                ];

                renderComposition();

                statusText.textContent =
                    `${copiedNotes.length}개의 음표가 복제되었습니다.`;

                return;

            }

            const movedNotes =
                movedPositions.map(
                    position => {

                        return {

                            note:
                                position.note,

                            step:
                                position.step,

                            offsetBeats:
                                position.offsetBeats,

                            durationBeats:
                                position.noteData.durationBeats ||
                                DEFAULT_NOTE_DURATION

                        };

                    }
                );

            const collision =
                movedNotes.some(
                    moved => {

                        const ignoredNotes =
                            selectedNotePositions.map(
                                position =>
                                    position.noteData
                            );

                        return hasNoteCollision(
                            moved.note,
                            moved.step,
                            moved.durationBeats,
                            moved.offsetBeats,
                            ignoredNotes
                        );

                    }
                );

            if (collision) {

                statusText.textContent =
                    "이 위치에는 이미 음표가 있습니다.";

                renderComposition();

                return;

            }

            saveUndoState();

            movedPositions.forEach(
                position => {

                    position.noteData.step =
                        position.step;

                    position.noteData.offsetBeats =
                        position.offsetBeats;

                    position.noteData.note =
                        position.note;

                }
            );

            selectedNotes =
                movedPositions.map(
                    position =>
                        position.noteData
                );

            renderComposition();

            const first =
                movedPositions[0];

            statusText.textContent =
                `음표 이동 완료 : ${first.note}, ${first.step + 1}번째 박 ${first.offsetBeats}박 위치`;

        }

    );

    block.addEventListener(
        "pointercancel",
        event => {

            if (!isDragging) {
                return;
            }

            isDragging = false;

            document
                .querySelectorAll(
                    ".note-block"
                )
                .forEach(
                    targetBlock => {

                        targetBlock.style.transform =
                            "";

                        targetBlock.style.opacity =
                            "";

                        targetBlock.style.cursor =
                            "";

                        targetBlock.style.transition =
                            "";

                        targetBlock.classList.remove(
                            "dragging"
                        );

                    }
                );

        }
    );

}

function setupNoteResize(
    block,
    handle,
    noteData
) {

    let startX = 0;
    let startDuration = 0;
    let cellWidth = 0;
    let isResizing = false;
    let originalDuration = 0;

    handle.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();
            event.stopPropagation();

            isResizing = true;

            wasResizing = true;

            startX =
                event.clientX;

            startDuration =
                noteData.durationBeats ||
                DEFAULT_NOTE_DURATION;

            originalDuration =
                startDuration;

            cellWidth =
                block.parentElement
                    .getBoundingClientRect()
                    .width;

            saveUndoState();

            handle.setPointerCapture(
                event.pointerId
            );

            block.classList.add(
                "resizing"
            );

            statusText.textContent =
                `길이 조절 중 : ${startDuration}박`;

        }
    );

    handle.addEventListener(
        "pointermove",
        event => {

            if (!isResizing) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const deltaX =
                event.clientX -
                startX;

            const deltaBeats =
                deltaX /
                cellWidth;

            let newDuration =
                startDuration +
                deltaBeats;

            const step =
                noteData.step;

            const offsetBeats =
                noteData.offsetBeats || 0;

            const maxDuration =
                getMaxDurationForStep(step) -
                offsetBeats;

            const minDuration =
                0.25;

            newDuration =
                Math.max(
                    minDuration,
                    Math.min(
                        maxDuration,
                        newDuration
                    )
                );

            if (noteData.isTriplet) {

                noteData.isTriplet = false;

            }

            newDuration =
                Math.round(
                    newDuration * 4
                ) / 4;

            const collision =
                hasNoteCollision(
                    noteData.note,
                    noteData.step,
                    newDuration,
                    offsetBeats,
                    [
                        noteData
                    ]
                );

            if (collision) {

                statusText.textContent =
                    "다른 음표과 겹칠 수 없습니다.";

                return;

            }

            noteData.durationBeats =
                newDuration;

            updateNoteBlockWidth(
                block,
                noteData
            );

            updateNoteSymbol(
                block,
                noteData
            );

            statusText.textContent =
                `길이 조절 중 : ${newDuration}박`;

        }
    );

    function finishResize(
        event
    ) {

        if (!isResizing) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        isResizing = false;

        if (
            handle.hasPointerCapture(
                event.pointerId
            )
        ) {

            handle.releasePointerCapture(
                event.pointerId
            );

        }

        block.classList.remove(
            "resizing"
        );

        const finalDuration =
            noteData.durationBeats ||
            DEFAULT_NOTE_DURATION;

        const offsetBeats =
            noteData.offsetBeats ||
            0;

        const finalCollision =
            hasNoteCollision(
                noteData.note,
                noteData.step,
                finalDuration,
                offsetBeats,
                [
                    noteData
                ]
            );

        if (finalCollision) {

            noteData.durationBeats =
                originalDuration;

            updateNoteBlockWidth(
                block,
                noteData
            );

            updateNoteSymbol(
                block,
                noteData
            );

            statusText.textContent =
                "다른 음표와 겹칠 수 없어 원래 길이로 복구되었습니다.";

            return;

        }

        statusText.textContent =
            `음표 길이 : ${noteData.durationBeats}박`;

    }

    handle.addEventListener(
        "pointerup",
        finishResize
    );

    handle.addEventListener(
        "pointercancel",
        finishResize
    );

}

clearButton.addEventListener(
    "click",
    () => {

        const confirmed =
            confirm(
                "현재 작곡한 내용을 모두 삭제할까요?"
            );

        if (!confirmed) {
            return;
        }

        if (
            composition.length === 0
        ) {

            statusText.textContent =
                "삭제할 작곡 내용이 없습니다.";

            return;

        }

        saveUndoState();

        composition = [];

        selectedNotes = [];

        currentStep = 0;

        document
            .querySelectorAll(".note-block")
            .forEach(block => {
                block.remove();
            });

        document
            .querySelectorAll(
                ".composer-cell"
            )
            .forEach(cell => {

                cell.classList.remove(
                    "active"
                );

            });

        selectedNote.textContent =
            "-";

        statusText.textContent =
            "작곡 내용이 삭제되었습니다.";

    }
);

importButton.addEventListener(
    "click",
    () => {

        importPianoRecording();

    }
);

function importPianoRecording() {

    const saved =
        localStorage.getItem(
            "louisKarielPianoRecording"
        );

    if (!saved) {

        statusText.textContent =
            "가져올 피아노 연주가 없습니다.";

        return;

    }

    try {

        const data =
            JSON.parse(saved);

        if (
            !data.notes ||
            data.notes.length === 0
        ) {

            statusText.textContent =
                "피아노 연주 데이터가 없습니다.";

            return;

        }

        composition = [];

        document
            .querySelectorAll(
                ".composer-cell"
            )
            .forEach(cell => {

                cell.classList.remove(
                    "active"
                );

            });

        data.notes.forEach(
            recordedNote => {

                let step;

                if (
                    typeof recordedNote.startBeat ===
                    "number"
                ) {

                    step =
                        Math.floor(
                            recordedNote.startBeat
                        );

                }

                else {

                    const duration =
                        Math.max(
                            data.duration || 1,
                            1
                        );

                    const ratio =
                        recordedNote.start /
                        duration;

                    step =
                        Math.floor(
                            ratio * STEPS
                        );

                }

                step =
                    Math.max(
                        0,
                        Math.min(
                            STEPS - 1,
                            step
                        )
                    );

                let note =
                    recordedNote.name ||
                    (
                        recordedNote.note +
                        recordedNote.octave
                    );

                if (
                    !noteList.includes(note)
                ) {

                    note =
                        findClosestNote(
                            recordedNote.note,
                            recordedNote.octave
                        );

                }

                const exists =
                    composition.some(
                        item =>
                            item.step === step &&
                            item.note === note
                    );

                if (!exists) {

                    composition.push({

                        note:
                            note,

                        step:
                            step,

                        durationBeats:
                            recordedNote.durationBeats ||
                            DEFAULT_NOTE_DURATION

                    });

                }

            }
        );

        restoreGrid();

        renderComposition();

        songTitle.value =
            "피아노에서 만든 곡";

        statusText.textContent =
            "🎹 피아노 연주를 가져왔습니다.";

        selectedNote.textContent =
            "-";

    }

    catch (error) {

        console.error(
            "피아노 연주 가져오기 실패 : ",
            error
        );

        statusText.textContent =
            "연주 데이터를 가져오는 중 오류가 발생했습니다.";

    }

}

function findClosestNote(
    note,
    noteOctave
) {

    const noteValues = {

        "C": 0,
        "C#": 1,
        "D": 2,
        "D#": 3,
        "E": 4,
        "F": 5,
        "F#": 6,
        "G": 7,
        "G#": 8,
        "A": 9,
        "A#": 10,
        "B": 11

    };

    const target =
        noteValues[note] +
        noteOctave * 12;

    let closest =
        noteList[0];

    let smallestDifference =
        Infinity;

    noteList.forEach(
        composerNote => {

            const match =
                composerNote.match(
                    /^([A-G]#?)(\d)$/
                );

            if (!match) {
                return;
            }

            const noteName =
                match[1];

            const octaveNumber =
                Number(
                    match[2]
                );

            const value =
                noteValues[noteName] +
                octaveNumber * 12;

            const difference =
                Math.abs(
                    value - target
                );

            if (
                difference <
                smallestDifference
            ) {

                smallestDifference =
                    difference;

                closest =
                    composerNote;

            }

        }
    );

    return closest;

}

function getRestSymbol(
    durationBeats
) {

    if (durationBeats === 0.25) {
        return "𝄿";
    }

    if (durationBeats === 0.5) {
        return "𝄾";
    }

    if (durationBeats === 0.75) {
        return "𝄾·";
    }

    if (durationBeats === 1) {
        return "𝄽";
    }

    if (durationBeats === 2) {
        return "𝄼";
    }

    if (durationBeats === 3) {
        return "𝄼·";
    }

    if (durationBeats === 4) {
        return "𝄻";
    }

    return "?";

}

function getNoteDurationSymbol(
    duration
) {

    switch (duration) {

        case 0.25:
            return "𝅘𝅥𝅯";

        case 0.5:
            return "♪";

        case 0.75:
            return "♪.";

        case 1:
            return "♩";

        case 2:
            return "𝅗𝅥";

        case 3:
            return "𝅗𝅥.";

        case 4:
            return "𝅝";

        default:
            return "?"

    }

}

function updateDurationButtonSymbols() {

    durationButtons.forEach(
        button => {

            const duration =
                Number(
                    button.dataset.duration
                );

            if (restMode) {

                button.textContent =
                    getRestSymbol(
                        duration
                    );

            }
            else {

                button.textContent =
                    getNoteDurationSymbol(
                        duration
                    );

            }

        }
    );

}

pianoRoll.addEventListener(
    "scroll",
    () => {

        pianoLabels.scrollTop =
            pianoRoll.scrollTop;

    }
);

pianoRoll.addEventListener(
    "scroll",
    () => {

        if (beatLabels) {

            beatLabels.style.transform =
                `translateX(-${pianoRoll.scrollLeft}px)`;

        }

    }
);

/*
pianoRoll.addEventListener(
    "scroll",
    () => {

        const distanceFromRight =
            pianoRoll.scrollWidth -
            pianoRoll.scrollLeft -
            pianoRoll.clientWidth;

        if (
            distanceFromRight < 500
        ) {

            expandComposerGrid();

        }

    }
);
*/

createLabels();

createBeatLabels();

createGrid();

updateDurationButtonSymbols();

createOctaveSeparators();

syncBeatLabelsWidth();

syncPianoLabelsHeight();

loadComposition();

updateCurrentStep();

const urlParams =
    new URLSearchParams(
        window.location.search
    );

if (
    urlParams.get("import") === "piano"
) {

    importPianoRecording();

}

window.addEventListener(
    "resize",
    () => {

        syncBeatLabelsWidth();

        syncPianoLabelsHeight();

    }
);

console.log(
    "🎼 Virtual Composer Ready!"
);