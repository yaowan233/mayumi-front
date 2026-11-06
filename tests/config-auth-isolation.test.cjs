const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

function harness(pathname, session) {
    let sessionReads = 0;
    const source = readFileSync(`${__dirname}/../app/user_context.tsx`, 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
    }).outputText;
    const exports = {};
    const mocks = {
        react: React,
        'react/jsx-runtime': require('react/jsx-runtime'),
        'next/navigation': {usePathname: () => pathname},
        swr: {__esModule: true, default: () => {
            sessionReads++;
            return {...session, mutate: () => {}};
        }, SWRConfig: ({children}) => children},
        '@/config/site': {siteConfig: {backend_url: 'https://backend.example'}},
        '@/lib/client-api': {fetchCurrentUser: () => {throw new Error('Unexpected network request');}},
    };
    new Function('require', 'exports', compiled)(name => {
        if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`);
        return mocks[name];
    }, exports);
    function TicketForm() {
        const session = React.useContext(exports.default);
        assert.equal(session, null, 'One-time ticket forms must not depend on account session changes');
        return React.createElement('form', {'data-ticket': 'synthetic'});
    }
    return {
        render: (children = React.createElement(TicketForm)) => renderToStaticMarkup(React.createElement(exports.UserProvider, null, children)),
        reads: () => sessionReads,
        context: exports.default,
    };
}

test('one-time configuration pages never read account state, before or after login resolves', () => {
    for (const session of [{isLoading: true}, {isLoading: false, data: {uid: 12345}}]) {
        const h = harness('/config/synthetic-ticket', session);
        assert.match(h.render(), /data-ticket="synthetic"/);
        assert.equal(h.reads(), 0, 'Account loading must not reset or remount the ticket form');
    }
});

test('ordinary pages retain account context and per-user caching', () => {
    for (const pathname of ['/', '/tournaments/Cup/home', '/configuration', '/config-other']) {
        const h = harness(pathname, {isLoading: false, data: {uid: 12345}});
        function AccountPage() {
            const session = React.useContext(h.context);
            return React.createElement('span', null, session.currentUser.uid);
        }
        assert.equal(h.render(React.createElement(AccountPage)), '<span>12345</span>');
        assert.equal(h.reads(), 1);
    }
});
