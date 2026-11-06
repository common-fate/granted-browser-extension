const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

// Run the real content script with deterministic timers and DOM/native-host stubs.
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname,
  '../entrypoints/allow_access_confirm.content.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

async function scenario({
  regional = true, code = 'ABCD-EFGH', codes = ['ABCD-EFGH'],
  nativeError, consentOnly = false, delayed = false,
} = {}) {
  let confirmed = 0, allowed = 0, closed = 0, verified = false;
  let clock = 0, nextId = 0;
  const timers = new Map();
  const body = { textContent: '', prepend() {} };
  const confirmButton = {
    style: {}, disabled: false, classList: { remove() {} },
    setAttribute(k, v) { this[k] = v; },
    click() {
      confirmed++;
      body.textContent = regional
        ? 'Allow Granted CLI to access your data?' : 'Allow access to your data?';
    },
  };
  const allowButton = {
    click() {
      allowed++;
      body.textContent = regional
        ? 'You can now close this tab.' : 'You can close this window.';
    },
  };
  const wrapper = {
    click() { throw new Error('Clicked AWS wrapper instead of its native button'); },
  };
  function render() {
    body.textContent = consentOnly ? 'Allow Granted CLI to access your data?'
      : regional ? 'Authorization Request' : 'Authorization requested';
  }
  if (!delayed) render();
  const document = {
    body,
    createElement() { return { style: {} }; },
    querySelector(selector) {
      const authorization = body.textContent.startsWith('Authorization');
      if (selector === '.device-verification-user-code')
        return regional && authorization && code ? { textContent: code } : null;
      if (selector === '#user-code, .device-verification-user-code')
        return authorization && code ? { textContent: code } : null;
      if (selector === '#cli_verification_btn, [data-testid="query-param-user-code"] button[type="submit"]')
        return authorization ? confirmButton : null;
      if (selector === '[data-testid="allow-access-button"] button')
        return regional && body.textContent.startsWith('Allow') ? allowButton : null;
      if (selector === '[data-testid="allow-access-button"]')
        return body.textContent.startsWith('Allow') ? regional ? wrapper : allowButton : null;
      return null;
    },
    getElementById(id) {
      if (regional || !body.textContent.startsWith('Authorization')) return null;
      return id === 'user-code' && code ? { textContent: code }
        : id === 'cli_verification_btn' ? confirmButton : null;
    },
  };
  async function sendMessage(type, data) {
    switch (type) {
      case 'getValidUserCodes':
        if (nativeError) throw new Error(nativeError);
        return codes;
      case 'setUserCode':
        assert.ok(codes.includes(data));
        verified = true;
        return;
      case 'userCodeIsSet': {
        const res = verified;
        verified = false;
        return res;
      }
      case 'closeTab':
        closed++;
        return;
      default: throw new Error('Unexpected message: ' + type);
    }
  }
  let script;
  const context = vm.createContext({
    document, exports: {},
    require: () => ({ sendMessage }),
    defineContentScript: value => (script = value),
    console: { log() {}, debug() {}, warn() {}, error() {} },
    Date: { now: () => clock },
    setInterval(fn) { const id = ++nextId; timers.set(id, fn); return id; },
    clearInterval(id) { timers.delete(id); },
  });
  vm.runInContext(source, context);
  await script.main();
  assert.ok(script.matches.includes('https://*.signin.aws/platform/*'));
  for (let tick = 0; tick < 120; tick++) {
    clock += 200;
    if (delayed && tick === 4) render();
    for (const [id, fn] of [...timers]) if (timers.has(id)) fn();
    for (let n = 0; n < 10; n++) await Promise.resolve();
  }
  return { confirmed, allowed, closed, disabled: confirmButton.disabled };
}

for (const regional of [true, false]) {
  const layout = regional ? 'regional' : 'legacy';
  test(`${layout}: verifies the code before consenting and closing`, async () => {
    assert.deepEqual(await scenario({ regional }), {
      confirmed: 1, allowed: 1, closed: 1, disabled: false,
    });
  });
  for (const [name, options] of [
    ['no native codes', { codes: [] }],
    ['mismatched code', { codes: ['OTHER-CODE'] }],
    ['native connection failure', { nativeError: 'Failed to fetch' }],
  ]) {
    test(`${layout}: rejects ${name}`, async () => {
      const actual = await scenario({ regional, ...options });
      assert.equal(actual.confirmed, 0);
      assert.equal(actual.allowed, 0);
      assert.equal(actual.disabled, 'true');
    });
  }
}
test('waits for a delayed regional form', async () => {
  assert.deepEqual(await scenario({ delayed: true }), {
    confirmed: 1, allowed: 1, closed: 1, disabled: false,
  });
});
test('does not approve consent without a verified code in this tab', async () => {
  const actual = await scenario({ consentOnly: true });
  assert.equal(actual.confirmed, 0);
  assert.equal(actual.allowed, 0);
});
test('does not confirm or approve a missing code', async () => {
  const actual = await scenario({ code: null });
  assert.equal(actual.confirmed, 0);
  assert.equal(actual.allowed, 0);
});
