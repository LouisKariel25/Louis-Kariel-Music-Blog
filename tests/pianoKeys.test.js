const test = require("node:test");
const assert = require("node:assert");

const {
    PIANO_START_MIDI,
    PIANO_END_MIDI,
    midiToNote,
    midiToFrequency,
    isBlackKey,
    createPianoKeys,
    pianoKeys
} = require("../js/piano/pianoKeys.js");

test("88개 건반이 생성된다", () => {
    assert.strictEqual(pianoKeys.length, 88);
});

test("첫 건반은 A0, 마지막 건반은 C8", () => {
    assert.strictEqual(pianoKeys[0].name, "A0");
    assert.strictEqual(pianoKeys[0].midi, PIANO_START_MIDI);

    const last = pianoKeys[pianoKeys.length - 1];
    assert.strictEqual(last.name, "C8");
    assert.strictEqual(last.midi, PIANO_END_MIDI);
});

test("midiToNote가 음이름과 옥타브를 정확히 계산한다", () => {
    assert.deepStrictEqual(midiToNote(60), {
        name: "C4",
        note: "C",
        octave: 4
    });

    assert.deepStrictEqual(midiToNote(69), {
        name: "A4",
        note: "A",
        octave: 4
    });
});

test("A4(69)의 주파수는 440Hz이다", () => {
    assert.strictEqual(midiToFrequency(69), 440);
});

test("한 옥타브 위(A5=81)는 A4의 두 배 주파수이다", () => {
    const a4 = midiToFrequency(69);
    const a5 = midiToFrequency(81);

    assert.ok(
        Math.abs(a5 - a4 * 2) < 0.0001,
        `A5(${a5})는 A4(${a4})의 두 배여야 합니다`
    );
});

test("isBlackKey가 검은 건반을 구분한다", () => {
    assert.strictEqual(isBlackKey("C#"), true);
    assert.strictEqual(isBlackKey("D#"), true);
    assert.strictEqual(isBlackKey("C"), false);
    assert.strictEqual(isBlackKey("E"), false);
});

test("모든 건반이 유효한 midi, 주파수, 타입을 가진다", () => {
    pianoKeys.forEach(key => {

        assert.ok(
            key.midi >= PIANO_START_MIDI &&
            key.midi <= PIANO_END_MIDI,
            `${key.name}의 midi(${key.midi})가 범위를 벗어났습니다`
        );

        assert.ok(
            key.frequency > 0,
            `${key.name}의 주파수가 유효하지 않습니다`
        );

        assert.ok(
            key.type === "white" || key.type === "black",
            `${key.name}의 타입이 유효하지 않습니다`
        );

    });
});

test("createPianoKeys는 매번 같은 결과를 만든다", () => {
    assert.deepStrictEqual(
        createPianoKeys(),
        pianoKeys
    );
});
