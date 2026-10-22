import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessVersion } from './assessment';
import { parseTarget } from './target';
import { normalizeLanguage, patchReference, translate } from './i18n';

test('all assessment outcomes translate without changing canonical results', () => {
  for (const version of [null, '8.3', '8.5.12RC1', '8.5.12', '8.3.35', '5.3.29', '7.4.33', '9.0.0']) {
    const result = assessVersion(version);
    assert.match(result.reason, /[가-힣]/);
    assert.doesNotMatch(translate(result.reason, 'en'), /[가-힣]/, String(version));
    assert.equal(translate(result.reason, 'ko'), result.reason);
  }
});

test('URL validation errors are available in both languages', () => {
  for (const target of ['', 'https://bad host', 'ftp://example.com', 'http://127.0.0.1']) {
    assert.throws(() => parseTarget(target), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.doesNotMatch(translate(error.message, 'en'), /[가-힣]/);
      assert.equal(translate(error.message, 'ko'), error.message);
      return true;
    });
  }
});

test('translation preserves spacing and raw server data', () => {
  assert.equal(translate(' 복사 ', 'en'), ' Copy ');
  assert.equal(translate(' 복사 ', 'ko'), ' 복사 ');
  assert.equal(translate('PHP/8.5.12', 'en'), 'PHP/8.5.12');
  assert.equal(translate('  ', 'en'), '  ');
  assert.match(patchReference('8.5.12', 'en'), /PHP 8\.5\.12 or later/);
  assert.match(patchReference('8.5.12', 'ko'), /PHP 8\.5\.12 이상/);
});

test('only supported stored language values are used', () => {
  assert.equal(normalizeLanguage('en'), 'en');
  for (const value of ['ko', null, '', 'fr', '<script>']) assert.equal(normalizeLanguage(value), 'ko');
});
