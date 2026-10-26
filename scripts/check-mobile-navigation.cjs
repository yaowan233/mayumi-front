// Read-only browser regression checks. Start Next first; optionally set MOBILE_BASE_URL.
// Requires Playwright, or PLAYWRIGHT_MODULE / CHROMIUM_EXECUTABLE for existing installs.
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.MOBILE_BASE_URL || 'http://localhost:3000';
const tournament = encodeURIComponent(process.env.MOBILE_TOURNAMENT || 'EMC2');

(async () => {
    const browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? {executablePath: process.env.CHROMIUM_EXECUTABLE} : {})});
    const page = await browser.newPage({isMobile: true, hasTouch: true});
    page.on('pageerror', error => console.error(error.message.slice(0, 2500)));
    page.setDefaultTimeout(15000);
    try {
        for (const width of [320, 390, 768, 1024]) {
            await page.setViewportSize({width, height: 844});
            for (const path of ['/', `/tournaments/${tournament}/schedule`]) {
                await page.goto(base + path, {waitUntil: 'domcontentloaded', timeout: 120000});
                const menu = page.getByRole('button', {name: 'Open menu', exact: true});
                const desktop = page.getByRole('link', {name: path === '/' ? '比赛管理' : '比赛主页', exact: true});
                await (width < 1024 ? menu : desktop).waitFor({state: 'visible'});
                assert(await menu.isVisible() || await desktop.isVisible(), `Missing navigation at ${width}px: ${path}`);
                assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Page overflows at ${width}px: ${path}`);
            }
            console.log(`PASS navigation at ${width}px`);
        }
        await page.setViewportSize({width: 390, height: 400});
        await page.goto(`${base}/tournaments/${tournament}/schedule`, {waitUntil: 'domcontentloaded', timeout: 120000});
        await page.getByRole('button', {name: 'Open menu', exact: true}).click();
        const staff = page.getByRole('link', {name: '工作人员', exact: true}).filter({visible: true});
        await staff.scrollIntoViewIfNeeded();
        assert(await staff.evaluate(e => {
            const rect = e.getBoundingClientRect();
            return rect.top >= 0 && rect.bottom <= innerHeight + 1;
        }), 'Last menu item is inaccessible on a short screen');
        console.log('PASS short-screen menu scroll');
        await page.getByRole('button', {name: 'Close menu', exact: true}).click();
        for (const width of [320, 390, 768]) {
            await page.setViewportSize({width, height: 844});
            for (const route of ['schedule', 'mappools']) {
                await page.goto(`${base}/tournaments/${tournament}/${route}`, {waitUntil: 'domcontentloaded', timeout: 120000});
                const active = page.locator('[aria-label="比赛轮次"] [aria-current="true"]');
                await active.waitFor({state: 'visible'});
                await page.waitForFunction(() => {
                    const item = document.querySelector('[aria-label="比赛轮次"] [aria-current="true"]');
                    if (!item) return false;
                    const rect = item.getBoundingClientRect(), bounds = item.parentElement.getBoundingClientRect();
                    return rect.left >= Math.max(0, bounds.left) - 1 && rect.right <= Math.min(innerWidth, bounds.right) + 1;
                });
                console.log(`PASS selected round visible: ${route} ${width}px`);
            }
        }
    } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
