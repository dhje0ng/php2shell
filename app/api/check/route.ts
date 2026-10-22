import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { assessVersion, extractPhpVersion } from '@/lib/assessment';
import { isPublicAddress, parseTarget } from '@/lib/target';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const visibleHeaders = ['server', 'x-powered-by', 'x-generator', 'content-type', 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'content-security-policy', 'referrer-policy', 'permissions-policy', 'via'];

async function requestHeaders(url: URL, method: 'HEAD' | 'GET', signal: AbortSignal): Promise<{ status: number; location?: string; headers: Record<string, string> }> {
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = await new Promise<Awaited<ReturnType<typeof lookup>>[]>((resolve, reject) => {
    const onAbort = () => reject(new Error('요청 시간이 초과되었습니다.'));
    if (signal.aborted) { onAbort(); return; }
    signal.addEventListener('abort', onAbort, { once: true });
    lookup(host, { all: true }).then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
  if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) throw new Error('내부 또는 예약된 네트워크로 연결되는 주소는 점검할 수 없습니다.');
  if (signal.aborted) throw new Error('요청 시간이 초과되었습니다.');
  const pinned = addresses[0];
  return new Promise((resolve, reject) => {
    const req = (url.protocol === 'https:' ? https : http).request(url, {
      method, signal, agent: false,
      // Pin the verified DNS answer while retaining the original Host and TLS SNI.
      lookup: (_hostname, options, callback) => {
        if (options?.all) callback(null, [pinned]);
        else callback(null, pinned.address, pinned.family);
      },
      headers: { 'User-Agent': 'PHP2ShellCheck/1.0 (passive-header-check)', Accept: '*/*' },
      maxHeaderSize: 32768,
    }, response => {
      const headers: Record<string, string> = {};
      for (const key of visibleHeaders) {
        const value = response.headers[key];
        if (value) headers[key] = (Array.isArray(value) ? value.join(', ') : value).slice(0, 4096);
      }
      resolve({ status: response.statusCode ?? 0, location: response.headers.location, headers });
      // Never download or inspect the response body.
      response.destroy();
    });
    req.setTimeout(8000, () => req.destroy(new Error('응답 시간이 초과되었습니다.')));
    req.on('error', reject);
    req.end();
  });
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') && request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 });
  if (Number(request.headers.get('content-length') ?? 0) > 4096) return NextResponse.json({ error: '요청이 너무 큽니다.' }, { status: 413 });
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const raw = await request.text();
    if (raw.length > 4096) throw new Error('요청이 너무 큽니다.');
    const body = JSON.parse(raw);
    let url = parseTarget(body.url);
    const original = url.href;
    let method: 'HEAD' | 'GET' = 'HEAD';
    for (let redirects = 0; redirects <= 3; redirects++) {
      let response = await requestHeaders(url, method, controller.signal);
      if (response.status === 405 || response.status === 501) { method = 'GET'; response = await requestHeaders(url, method, controller.signal); }
      if ([301, 302, 303, 307, 308].includes(response.status) && response.location) {
        if (redirects === 3) throw new Error('리디렉션이 너무 많습니다. 최종 사이트 주소로 다시 점검해주세요.');
        url = parseTarget(new URL(response.location, url).href);
        continue;
      }
      const phpVersion = extractPhpVersion(response.headers);
      return NextResponse.json({ url: original, finalUrl: url.href, status: response.status, method, headers: response.headers, server: response.headers.server ?? null, phpVersion, ...assessVersion(phpVersion), duration: Date.now() - start, checkedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const known = /입력|주소|HTTP|내부|네트워크|리디렉션|요청이 너무/.test(message);
    return NextResponse.json({ error: known ? message : controller.signal.aborted || /초과|abort/i.test(message) ? '서버 응답이 12초를 초과했습니다. 잠시 후 다시 시도해주세요.' : '대상 서버에 연결할 수 없습니다. 주소, TLS 인증서 또는 접근 제한을 확인해주세요.' }, { status: known ? 400 : 502 });
  } finally { clearTimeout(timer); }
}
