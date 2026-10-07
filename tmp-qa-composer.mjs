// Temporary QA driver for the composer page. Deleted after verification.
export default async function run(page, ui) {

    const results = {};

    // ---- 1. insert a note via the duration button + a grid cell ----
    await ui.click(await refFor("button", "♩"));
    await page.waitForTimeout(120);

    results.durationLabel = await page
        .locator("#selectedDuration")
        .innerText();

    await page.locator('.composer-cell[data-note="C4"][data-step="0"]').click();
    await page.waitForTimeout(150);

    results.afterInsert = await page.evaluate(() => ({
        noteBlocks: document.querySelectorAll(".note-block").length,
        status: document.getElementById("statusText").textContent.trim()
    }));

    // ---- 2. resize the note by dragging its handle ----
    const block = page.locator('.composer-cell[data-note="C4"][data-step="0"] .note-block');
    const handle = block.locator(".note-resize-handle");

    const before = await block.boundingBox();
    const handleBox = await handle.boundingBox();

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(
        handleBox.x + handleBox.width / 2 + 120,
        handleBox.y + handleBox.height / 2,
        { steps: 12 }
    );
    await page.mouse.up();
    await page.waitForTimeout(200);

    const after = await block.boundingBox();

    results.resize = {
        beforeWidth: Math.round(before.width),
        afterWidth: Math.round(after.width),
        status: await page.locator("#statusText").innerText()
    };

    // ---- 3. rest mode should visually disable the duration buttons ----
    await ui.click(await refFor("button", "쉼표"));
    await page.waitForTimeout(150);

    results.restMode = await page.evaluate(() => ({
        restModeActive: document
            .getElementById("restModeButton")
            .classList.contains("active"),
        durationButtonsDisabled: [
            ...document.querySelectorAll(".duration-button")
        ].every(button => button.classList.contains("disabled"))
    }));

    await ui.click(await refFor("button", "음표"));
    await page.waitForTimeout(150);

    results.noteModeRestored = await page.evaluate(() => ({
        durationButtonsEnabled: [
            ...document.querySelectorAll(".duration-button")
        ].every(button => !button.classList.contains("disabled"))
    }));

    // ---- 4. playback must really stop (no orphaned oscillators) ----
    await ui.click(await refFor("button", "▶ 재생"));
    await page.waitForTimeout(400);
    await ui.click(await refFor("button", "⏹ 정지"));
    await page.waitForTimeout(200);

    results.playback = await page.locator("#statusText").innerText();

    return results;

    async function refFor(role, name) {
        const snapshot = await ui.snapshot();
        const pattern = new RegExp(
            `@(e\\d+) ${role} "${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`
        );
        const match = snapshot.match(pattern);
        if (!match) {
            throw new Error(`no ref for ${role} "${name}"`);
        }
        return `@${match[1]}`;
    }
}
