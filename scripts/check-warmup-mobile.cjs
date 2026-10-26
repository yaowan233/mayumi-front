// Run after building or starting Next to generate CSS. Requires Playwright;
// PLAYWRIGHT_MODULE and CHROMIUM_EXECUTABLE can point to existing installations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
process.chdir(path.resolve(__dirname, '..'));

(async () => {
    const ui = await import('@heroui/react');
    const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
    const source = fs.readFileSync('components/schedule_comp.tsx', 'utf8');
    const chunk = source.slice(source.indexOf('const MapComp ='), source.indexOf('export interface ScheduleStage'));
    const compiled = ts.transpileModule(chunk, {compilerOptions: {jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022}}).outputText;
    let preview = false, stateIndex = 0;
    const map = {map_id: 123, map_set_id: 456, map_name: 'A long beatmap title for mobile layout verification', diff_name: 'A very long difficulty name', mapper: 'Mapper', cs: 4, ar: 9, od: 8, hp: 6, star_rating: 5.25, bpm: 180};
    const bindings = {React, ...ui, useState: value => {
        const index = stateIndex++;
        return React.useState(preview && index === 0 ? '123' : preview && index === 1 ? map : value);
    }, useEffect: React.useEffect, useRef: React.useRef, useContext: () => ({currentUser: {uid: 1}}), CurrentUserContext: {}, parseUtcDateTime: () => null};
    const Warmup = new Function(...Object.keys(bindings), compiled + ';return WarmupSelect;')(...Object.values(bindings));
    const cssFiles = [...fs.globSync('.next/static/**/*.css'), ...fs.globSync('.next/dev/static/chunks/styles_globals_css*.css')];
    assert(cssFiles.length, 'Build or start the app first to generate its CSS');
    const css = cssFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
    const browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? {executablePath: process.env.CHROMIUM_EXECUTABLE} : {})});
    try {
        const page = await browser.newPage();
        await page.route('https://assets.ppy.sh/**', route => route.abort());
        for (preview of [false, true]) {
            stateIndex = 0;
            const html = renderToStaticMarkup(React.createElement(Warmup, {uid: [1]}));
            for (const width of [320, 375, 390, 430, 768]) {
                await page.setViewportSize({width, height: 844});
                await page.setContent('<style>' + css + '</style><main style="padding:48px"><div id="bounds">' + html + '</div></main>');
                const boxes = await page.evaluate(() => {
                    const bounds = document.querySelector('#bounds').getBoundingClientRect();
                    return [...document.querySelectorAll('input, button')].map(element => {
                        const rect = element.getBoundingClientRect();
                        return {tag: element.tagName, left: rect.left, right: rect.right, boundsLeft: bounds.left, boundsRight: bounds.right};
                    });
                });
                for (const box of boxes) assert(box.left >= box.boundsLeft - 1 && box.right <= box.boundsRight + 1, `${width}px preview=${preview}: ${JSON.stringify(box)}`);
                console.log(`PASS ${width}px preview=${preview}: input and submit fit the schedule card`);
            }
        }
    } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
