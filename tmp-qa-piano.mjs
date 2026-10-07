// Temporary: simulate a real keyboard press on the piano page and inspect state.
export default async function run(page, ui) {

    const results = {};

    // Hold a real keydown via the DOM so repeat/pressed-set semantics apply.
    await page.evaluate(() => {
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "a", bubbles: true })
        );
    });
    await page.waitForTimeout(300);

    results.afterKeydown = await page.evaluate(() => ({
        currentNote: document.getElementById("currentNote").textContent.trim(),
        activeKeys: document.querySelectorAll(".piano .key.active").length
    }));

    await page.evaluate(() => {
        document.dispatchEvent(
            new KeyboardEvent("keyup", { key: "a", bubbles: true })
        );
    });
    await page.waitForTimeout(200);

    results.afterKeyup = await page.evaluate(() => ({
        activeKeys: document.querySelectorAll(".piano .key.active").length
    }));

    // Now record a take.
    await page.evaluate(() => {
        document.getElementById("recordButton").click();
    });
    await page.waitForTimeout(100);

    await page.evaluate(() => {
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "a", bubbles: true })
        );
    });
    await page.waitForTimeout(250);
    await page.evaluate(() => {
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "s", bubbles: true })
        );
    });
    await page.waitForTimeout(250);
    await page.evaluate(() => {
        document.dispatchEvent(
            new KeyboardEvent("keyup", { key: "a", bubbles: true })
        );
        document.dispatchEvent(
            new KeyboardEvent("keyup", { key: "s", bubbles: true })
        );
    });
    await page.waitForTimeout(150);

    await page.evaluate(() => {
        document.getElementById("recordButton").click();
    });
    await page.waitForTimeout(300);

    results.recording = await page.evaluate(() => ({
        recordStatus: document.getElementById("recordStatus").textContent.trim(),
        sendDisabled: document.getElementById("sendToComposerButton").disabled,
        stored: !!localStorage.getItem("louisKarielPianoRecording")
    }));

    results.diagnostics = await page.evaluate(() => ({
        aKeyExists: !!document.querySelector('.piano .key[data-midi="60"]'),
        inputEngine: typeof playKeyboardNote,
        resetFn: typeof resetKeyboardInput,
        keyCount: document.querySelectorAll(".piano .key").length
    }));

    return results;
}
