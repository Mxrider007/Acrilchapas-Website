import test from 'node:test';
import assert from 'node:assert/strict';
import { factoryLoginUrl } from './runtime.ts';

test('factory link supports a separate HTTPS origin and retains explicit loopback development', () => {
  assert.equal(factoryLoginUrl(), 'http://127.0.0.1:8000/web/login');
  assert.equal(factoryLoginUrl('https://factory.example.test'), 'https://factory.example.test/web/login');
  assert.equal(factoryLoginUrl('https://factory.example.test/web/login'), 'https://factory.example.test/web/login');
  assert.equal(factoryLoginUrl('http://localhost:8000'), 'http://localhost:8000/web/login');
});

test('factory link rejects insecure remote origins, executable URLs and embedded credentials', () => {
  for (const invalid of ['http://factory.example.test', 'javascript:alert(1)', '//factory.example.test', 'https://user:secret@factory.example.test', 'https://factory.example.test/?token=example', 'https://factory.example.test/#example', 'not a URL']) {
    assert.equal(factoryLoginUrl(invalid), null);
  }
});
