let audioContext = null;

let masterGain = null;

let bpm = 120;

const STEPS = 16;

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

const selectedNote =
    document.getElementById(
        "selectedNote"
    );

let selectedDuration = 1;

const durationButtons =
    document.querySelectorAll(
        ".duration-button"
    );

const selectedDurationText =
    document.getElementById(
        "selectedDuration"
    );

durationButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                selectedDuration =
                    Number(
                        button.dataset.duration
                    );

                durationButtons.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );

                button.classList.add(
                    "active"
                );

                selectedDurationText.textContent =
                    `${selectedDuration}박`;

                statusText.textContent =
                    `음표 길이 선택 : ${selectedDuration}박`;

            }
        );

    }
);

let composition = [];

let selectedNotes = [];

let currentStep = 0;

let wasResizing = false;

let wasDragging = false;

let isPlaying = false;

let playbackTimers = [];

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

    for (
        let row = 0;
        row < ROWS;
        row++
    ) {

        for (
            let step = 0;
            step < STEPS;
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

function createBeatLabels() {

    beatLabels.innerHTML = "";

    for (let measure = 1; measure <= 4; measure++) {

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

    const rollWidth =
        pianoRoll.clientWidth;

    beatLabels.style.width =
        `${rollWidth}px`;

    beatLabels.style.flex =
        "none";

}

function toggleNote(cell) {

    const note =
        cell.dataset.note;

    const step =
        Number(
            cell.dataset.step
        );

    const existingIndex =
        composition.findIndex(
            item =>
                item.step === step &&
                item.note === note
        );

    if (
        existingIndex !== -1
    ) {

        composition.splice(
            existingIndex,
            1
        );

        cell.classList.remove(
            "active"
        );

        selectedNote.textContent =
            note;

        statusText.textContent =
            "음표가 삭제되었습니다.";

        renderComposition();

        return;

    }

    const maxDuration =
        getMaxDurationForStep(step);

    const actualDuration =
        Math.min(
            selectedDuration,
            maxDuration
        );

    composition.push({

        note: note,
        step: step,
        durationBeats: actualDuration

    });

    cell.classList.add(
        "active"
    );

    selectedNote.textContent =
        note;

    if (
        actualDuration <
        selectedDuration
    ) {

        statusText.textContent =
            `마디 끝에 맞춰 ${actualDuration}박으로 조정되었습니다.`;

    } else {

        statusText.textContent =
            `${actualDuration}박 음표가 입력되었습니다.`;

    }

    renderComposition();

}

document.addEventListener(
    "keydown",
    event => {

        if (event.repeat) {
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

function addKeyboardNote(note) {

    const cell =
        [...document.querySelectorAll(
            ".composer-cell"
        )].find(
            item =>
                item.dataset.note === note &&
                Number(item.dataset.step)
                === currentStep
        );

    if (!cell) {
        return;
    }

    const existingIndex =
        composition.findIndex(
            item =>
                item.step === currentStep &&
                item.note === note
        );

    if (
        existingIndex !== -1
    ) {

        composition.splice(
            existingIndex,
            1
        );

        cell.classList.remove(
            "active"
        );

        selectedNote.textContent =
            note;

        statusText.textContent =
            "음표가 삭제되었습니다.";

        renderComposition();

        return;

    }

    const maxDuration =
        getMaxDurationForStep(
            currentStep
        );

    const actualDuration =
        Math.min(
            selectedDuration,
            maxDuration
        );

    composition.push({

        note: note,
        step: currentStep,
        durationBeats: actualDuration

    });

    cell.classList.add(
        "active"
    );

    selectedNote.textContent =
        note;

    if (
        actualDuration <
        selectedDuration
    ) {

        statusText.textContent =
            `마디 끝에 맞춰 ${actualDuration}박으로 조정되었습니다.`;

    } else {

        statusText.textContent =
            `${actualDuration}박 음표가 입력되었습니다.`;

    }

    playNote(
        note,
        actualDuration
    );

    renderComposition();

    moveToNextStep();

}

function getMaxDurationForStep(step) {

    const positionInMeasure =
        step % 4;

    const remainingBeats =
        4 - positionInMeasure;

    return remainingBeats;

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

function updateCurrentStep() {

    document
        .querySelectorAll(
            ".composer-cell"
        )
        .forEach(cell => {

            cell.classList.remove(
                "current-step"
            );

        });

    document
        .querySelectorAll(
            `.composer-cell[data-step="${currentStep}"]`
        )
        .forEach(cell => {

            cell.classList.add(
                "current-step"
            );

        });

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
        "▶ 작곡한 곡을 재생 중입니다."

    const beatDuration =
        60000 / bpm;

    for (
        let step = 0;
        step < STEPS;
        step++
    ) {

        const notesAtStep =
            composition.filter(
                item =>
                    item.step === step
            );

        const timer =
            setTimeout(
                () => {

                    highlightStep(
                        step
                    );

                    notesAtStep.forEach(
                        item => {
                            playNote(
                                item.note,
                                item.durationBeats ||
                                DEFAULT_NOTE_DURATION
                            );
                        }
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
            STEPS * beatDuration
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

    document
        .querySelectorAll(
            ".composer-cell"
        )
        .forEach(cell => {

            cell.classList.remove(
                "current-step"
            );

        });

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

    document
        .querySelectorAll(
            ".composer-cell"
        )
        .forEach(cell => {

            const exists =
                composition.some(
                    item =>
                        item.note ===
                        cell.dataset.note &&
                        item.step ===
                        Number(
                            cell.dataset.step
                        )
                );

            if (exists) {

                cell.classList.add(
                    "active"
                );

            }

        });

}

function renderComposition() {

    document
        .querySelectorAll(".note-block")
        .forEach(block => {
            block.remove();
        });

    document
        .querySelectorAll(".composer-cell")
        .forEach(cell => {
            cell.classList.remove(
                "active"
            );
        });

    composition.forEach(noteData => {

        const cell =
            [...document.querySelectorAll(
                ".composer-cell"
            )].find(
                item =>
                    item.dataset.note ===
                    noteData.note &&
                    Number(
                        item.dataset.step
                    ) === noteData.step
            );

        if (!cell) {
            return;
        }

        cell.classList.add(
            "active"
        );

        const block =
            document.createElement("div");

        block.classList.add(
            "note-block"
        );

        block.noteData =
            noteData;

        const noteSymbol =
            document.createElement("span");

        noteSymbol.classList.add(
            "note-symbol"
        );

        const duration =
            noteData.durationBeats ||
            DEFAULT_NOTE_DURATION;

        if (duration <= 0.25) {

            noteSymbol.textContent = "𝅘𝅥𝅯";

        }
        else if (duration <= 0.5) {

            noteSymbol.textContent = "♪";

        }
        else if (duration <= 1) {

            noteSymbol.textContent = "♩";

        }
        else if (duration <= 2) {

            noteSymbol.textContent = "𝅗𝅥";

        }
        else {

            noteSymbol.textContent = "𝅝";

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

        updateNoteBlockWidth(
            block,
            noteData
        );

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
        cellWidth * duration - 4;

    block.style.width =
        `${Math.max(width, 12)}px`;

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

    let cellWidth = 0;
    let cellHeight = 0;

    let selectedNotePositions = [];

    let originalLeft = 0;
    let originalTop = 0;

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

            selectedNotePositions = 
                selectedNotes.map(
                    note => ({

                        noteData : 
                            note,

                        step : 
                            note.step,

                        row : 
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

            originalLeft = 
                block.offsetLeft;

            originalTop = 
                block.offsetTop;

            block.setPointerCapture(
                event.pointerId
            );

            block.classList.add(
                "dragging"
            );

            statusText.textContent = 
                `음표 잡기 : ${noteData.note}`;

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

            block.style.transform = 
                `translate(${deltaX}px, ${deltaY}px) scale(1.04)`;

            block.style.opacity = 
                "0.82";

            block.style.cursor = 
                "grabbing";

            const deltaSteps = 
                Math.round(
                    deltaX / 
                    cellWidth
                );

            const deltaRows = 
                Math.round(
                    deltaY / 
                    cellHeight
                );

            let previewStep = 
                startStep + 
                deltaSteps;

            let previewRow = 
                startRow + 
                deltaRows;

            previewStep = 
                Math.max(
                    0,
                    Math.min(
                        STEPS - 1,
                        previewStep
                    )
                );

            previewRow = 
                Math.max(
                    0,
                    Math.min(
                        ROWS - 1,
                        previewRow
                    )
                );

            const previewNote = 
                noteList[
                    previewRow
                ];

            statusText.textContent = 
                `이동 위치 : ${previewNote}, ${previewStep + 1}번째 박`;

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

            block.style.transform = 
                "";

            block.style.opacity = 
                "";

            block.style.cursor = 
                "";

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

            const deltaSteps = 
                Math.round(
                    deltaX / 
                    cellWidth
                );

            const deltaRows = 
                Math.round(
                    deltaY / 
                    cellHeight
                );

            if (isCopying) {

                let newStep = 
                    startStep + 
                    deltaSteps;

                let newRow = 
                    startRow + 
                    deltaRows;

                newStep = 
                    Math.max(
                        0,
                        Math.min(
                            STEPS - 1,
                            newStep
                        )
                    );

                newRow = 
                    Math.max(
                        0,
                        Math.min(
                            ROWS - 1,
                            newRow
                        )
                    );

                const newNote = 
                    noteList[
                        newRow
                    ];

                const collision = 
                    composition.some(
                        item =>
                            item.note ===
                                newNote &&
                            item.step ===
                                newStep
                    );

                if (collision) {

                    statusText.textContent = 
                        "이미 음표가 있는 위치입니다.";

                    renderComposition();

                    return;

                }

                const maxDuration = 
                    getMaxDurationForStep(
                        newStep
                    );

                const newDuration = 
                    Math.min(
                        noteData.durationBeats,
                        maxDuration
                    );

                composition.push({

                    note : 
                        newNote,
                    
                    step : 
                        newStep,

                    durationBeats : 
                        newDuration

                });

                statusText.textContent = 
                    `음표가 ${newNote}, ${newStep + 1}번째 박에 복제되었습니다.`;

                renderComposition();

                return;

            }

            const movedPositions = 
                selectedNotePositions.map(
                    position => {

                        let targetStep = 
                            position.step + 
                            deltaSteps;

                        let targetRow = 
                            position.row + 
                            deltaRows;

                        targetStep = 
                            Math.max(
                                0,
                                Math.min(
                                    STEPS - 1,
                                    targetStep
                                )
                            );

                        targetRow = 
                            Math.max(
                                0,
                                Math.min(
                                    ROWS - 1,
                                    targetRow
                                )
                            );

                        return {

                            noteData : 
                                position.noteData,

                            step : 
                                targetStep,

                            row : 
                                targetRow,

                            note : 
                                noteList[
                                    targetRow
                                ]

                        };

                    }
                );

            

        }
    )

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

            cellWidth =
                block.parentElement
                    .getBoundingClientRect()
                    .width;

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

            const maxDuration =
                getMaxDurationForStep(step);

            newDuration =
                Math.max(
                    0.25,
                    Math.min(
                        maxDuration,
                        newDuration
                    )
                );

            newDuration =
                Math.round(
                    newDuration * 4
                ) / 4;

            noteData.durationBeats =
                newDuration;

            updateNoteBlockWidth(
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

        composition = [];

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

pianoRoll.addEventListener(
    "scroll",
    () => {

        pianoLabels.scrollTop =
            pianoRoll.scrollTop;

    }
);

createLabels();

createBeatLabels();

createGrid();

syncBeatLabelsWidth();

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
    }
);

console.log(
    "🎼 Virtual Composer Ready!"
);