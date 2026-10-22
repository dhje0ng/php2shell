import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessVersion, extractPhpVersion, PATCHES } from './assessment';
import { isPublicAddress, parseTarget } from './target';

test('each supported branch changes verdict at its actual patch boundary', () => {
  for (const [branch, patch] of Object.entries(PATCHES)) {
    assert.equal(assessVersion(`${branch}.${patch - 1}`).verdict, 'risk');
    assert.equal(assessVersion(`${branch}.${patch}`).verdict, 'patched');
    assert.equal(assessVersion(`${branch}.${patch + 1}`).verdict, 'patched');
  }
});
test('missing, partial, future and prerelease versions are inconclusive', () => {
  for (const version of [null, '8.3', '9.0.0', '8.6.0', '8.5.12RC1', 'unknown', '5.3.29']) assert.equal(assessVersion(version).verdict, 'unknown');
  assert.equal(assessVersion('7.4.33').verdict, 'risk');
  assert.equal(assessVersion('8.1.34').verdict, 'risk');
});
test('PHP extraction supports server headers and vendor package suffixes', () => {
  assert.equal(extractPhpVersion({ 'x-powered-by': 'PHP/8.3.35-1ubuntu2' }), '8.3.35-1ubuntu2');
  assert.equal(extractPhpVersion({ server: 'Apache/2.4.62 (Unix) PHP/8.5.12' }), '8.5.12');
  assert.equal(extractPhpVersion({ server: 'nginx' }), null);
});
test('only public destination addresses are permitted, including mapped IPv6', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.1.2', '192.168.1.1', '169.254.169.254', '0.0.0.0', '100.64.0.1', '224.0.0.1', '::1', 'fe80::1', 'fc00::1', '::ffff:127.0.0.1']) assert.equal(isPublicAddress(ip), false, ip);
  assert.equal(isPublicAddress('1.1.1.1'), true);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
});
test('target parsing normalizes URLs and blocks alternate protocols, ports and internal hosts', () => {
  assert.equal(parseTarget('example.com').href, 'https://example.com/');
  assert.equal(parseTarget(' https://example.com/path#hash ').href, 'https://example.com/path');
  for (const value of ['', 'ftp://example.com', 'https://user:pass@example.com', 'http://localhost', 'http://127.1', 'http://0x7f000001', 'http://[::1]', 'http://192.168.1.1', 'http://example.com:8080', 'https://foo.internal']) assert.throws(() => parseTarget(value), Error, value);
});
