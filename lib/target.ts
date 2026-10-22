import ipaddr from 'ipaddr.js';

export function isPublicAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) return false;
  // process() converts IPv4-mapped IPv6 before range checks.
  return ipaddr.process(address).range() === 'unicast';
}

export function parseTarget(input: unknown): URL {
  if (typeof input !== 'string' || !input.trim() || input.length > 2048) throw new Error('점검할 올바른 사이트 주소를 입력해주세요.');
  let url: URL;
  try { url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`); }
  catch { throw new Error('사이트 주소 형식을 확인해주세요. 예: https://example.com'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))) throw new Error('인증 정보가 없는 HTTP/HTTPS 주소와 기본 웹 포트만 사용할 수 있습니다.');
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (ipaddr.isValid(host) ? !isPublicAddress(host) : !host.includes('.') || /(^|\.)(localhost|local|internal|test|invalid)$/.test(host)) throw new Error('인터넷에 공개된 사이트 주소만 점검할 수 있습니다.');
  url.hash = '';
  return url;
}
