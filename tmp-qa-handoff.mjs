// Temporary QA: piano keyboard play + record + send-to-composer handoff.
export default async function run(page, ui) {

    const results = {};

    // ---- play two notes with the computer keyboard ----
    await page.keyboard.down("a");
    await page.waitForTimeout(120);
    results.currentNoteAfterA = await page.locator("#currentNote").innerText();
    await page.keyboard.up("a");

    await page.keyboard.down("s");
    await page.waitForTimeout(120);
    results.currentNoteAfterS = await page.locator("#currentNote").innerText();
    await page.keyboard.up("s");

    // ---- record a short take ----
    await ui.click(await refFor("button", "🔴 녹음"));
    await page.waitForTimeout(100);

    await page.keyboard.down("a");
    await page.waitForTimeout(300);
    await page.keyboard.up("a");
    await page.keyboard.down("d");
    await page.waitForTimeout(300);
    await page.keyboard.up("d");

    await ui.click(await refFor("button", "⏹ 녹음 중지"));
    await page.waitForTimeout(200);

    results.recordStatus = await page.locator("#recordStatus").innerText();

    results.sendDisabled = await page
        .locator("#sendToComposerButton")
        .isDisabled();

    // ---- hand the take to the composer ----
    await ui.click(await refFor("button", "🎼 작곡실로 보내기"));
    await page.waitForURL(/composer\.html/, { timeout: 10000 });
    await page.waitForTimeout(600);

    results.composer = await page.evaluate(() => ({
        url: location.pathname + location.search,
        notes: document.querySelectorAll(".note-block").length,
        status: document.getElementById("statusText")?.textContent.trim(),
        title: document.getElementById("songTitle")?.value
    }));

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
