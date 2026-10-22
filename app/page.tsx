'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Check, CheckCheck, ChevronDown, ChevronRight, CircleAlert, CircleHelp, Clock3, Code2, Copy, ExternalLink, FileCheck2, Globe2, Info, Layers3, LoaderCircle, LockKeyhole, Radar, RotateCcw, Search, Server, Shield, ShieldCheck, Terminal } from 'lucide-react';
import type { CheckResult } from '@/lib/assessment';

const official = 'https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w';
const second = 'https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp';
const versions = [['8.5', '8.5.12'], ['8.4', '8.4.27'], ['8.3', '8.3.36'], ['8.2', '8.2.35']];
const verdicts = {
  risk: { title: '취약 가능성이 발견되었습니다', label: '업데이트 필요', icon: CircleAlert, className: 'risk' },
  patched: { title: '패치 버전이 확인되었습니다', label: '패치 버전 확인', icon: ShieldCheck, className: 'patched' },
  unknown: { title: 'PHP 버전을 확인할 수 없습니다', label: '판단 불가', icon: CircleHelp, className: 'unknown' },
};

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [tab, setTab] = useState<'overview' | 'headers' | 'guide'>('overview');
  const [copied, setCopied] = useState(false);
  const [activeNav, setActiveNav] = useState('check');
  const input = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  async function runCheck(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true); setError(''); setResult(null); setTab('overview');
    try {
      const response = await fetch('/api/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }), signal: AbortSignal.timeout(16000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '점검을 완료하지 못했습니다. 다시 시도해주세요.');
      setResult(data);
    } catch (error) { setError(error instanceof Error && error.name !== 'TimeoutError' ? error.message : '연결 시간이 초과되었습니다. 다시 시도해주세요.'); }
    finally { setLoading(false); }
  }

  function showDemo() {
    setError(''); setTab('overview');
    setResult({ url: 'https://example.com/', finalUrl: 'https://example.com/', status: 200, method: 'HEAD', checkedAt: new Date().toISOString(), duration: 248, phpVersion: '8.3.35', server: 'nginx', verdict: 'risk', reason: '공개된 PHP 버전이 PHP2Shell 공식 패치 버전보다 낮습니다. 배포판의 백포트 패치가 적용되었을 수 있으므로 패키지 보안 공지를 함께 확인하세요.', recommendedVersion: '8.3.36', headers: { server: 'nginx', 'x-powered-by': 'PHP/8.3.35', 'content-type': 'text/html; charset=UTF-8', 'x-content-type-options': 'nosniff' }, demo: true });
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function downloadReport() {
    if (!result) return;
    const blob = new Blob([JSON.stringify({ ...result, referenceDate: '2026-10-22', references: [official, second], disclaimer: '공개 응답 헤더에 기반한 버전 비교 결과입니다. 실제 취약 여부와 백포트 패치는 서버에서 확인해야 합니다.' }, null, 2)], { type: 'application/json;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = href; anchor.download = `php2shell-${result.demo ? 'example-' : ''}${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(href);
  }

  async function copyHeaders() {
    if (!result) return;
    try { await navigator.clipboard.writeText(Object.entries(result.headers).map(([key, value]) => `${key}: ${value}`).join('\n')); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setError('클립보드 접근이 제한되어 있습니다. 결과 다운로드를 이용해주세요.'); }
  }

  const state = result ? verdicts[result.verdict] : null;
  const StateIcon = state?.icon ?? CircleHelp;

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a href="#" className="brand" aria-label="PHP2Shell Check 홈"><span className="brand-icon"><ShieldCheck size={23}/></span><span>PHP2Shell<span className="brand-light"> Check</span></span><span className="beta">BETA</span></a>
          <nav aria-label="메인 메뉴"><a className={activeNav === 'check' ? 'active' : ''} href="#check" onClick={() => setActiveNav('check')}>보안 점검</a><a className={activeNav === 'guide' ? 'active' : ''} href="#guide" onClick={() => setActiveNav('guide')}>대응 가이드</a><a href={official} target="_blank" rel="noreferrer">공식 보안 공지 <ArrowUpRight size={14}/></a></nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot"/> PHP 보안, 지금 확인하세요 <span className="eyebrow-line"/> PASSIVE SECURITY CHECK</div>
            <h1>내 웹사이트는<br/><span>PHP2Shell</span>로부터 안전할까요?</h1>
            <p>사이트 주소 하나로 PHP 버전과 공개된 응답 헤더를 확인하세요.<br className="desktop-break"/>취약 가능성부터 필요한 대응까지, 알기 쉽게 안내합니다.</p>
          </div>
          <div className="hero-visual" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/><div className="visual-dots"/><div className="floating-code"><Code2 size={20}/></div><div className="shield-plate"><ShieldCheck size={66} strokeWidth={1.3}/></div><div className="floating-check"><Check size={15}/><span>Security first.</span></div></div>
        </section>

        <div className="advisory-strip"><div className="advisory-left"><span className="notice-icon"><Info size={16}/></span><span><strong>PHP2Shell 보안 업데이트</strong><span className="advisory-detail"> PHP 엔진의 원격 코드 실행 취약점 2건에 대한 보안 패치가 공개되었습니다.</span></span></div><a href={official} target="_blank" rel="noreferrer">공지 확인 <ArrowUpRight size={14}/></a></div>

        <div className="workspace">
          <div className="main-column">
            <section className="card scan-card" id="check">
              <div className="section-heading"><div className="title-line"><span className="section-icon"><Globe2 size={19}/></span><h2>웹사이트 보안 점검</h2></div><span className="small-tag"><LockKeyhole size={11}/> 비침투형 점검</span></div>
              <p className="section-description">점검할 웹사이트의 주소를 입력해주세요.</p>
              <form onSubmit={runCheck}>
                <label className="input-label" htmlFor="target-url">사이트 주소</label>
                <div className={`url-field ${error ? 'has-error' : ''}`}><Globe2 size={18}/><input ref={input} id="target-url" name="url" type="text" inputMode="url" autoComplete="url" placeholder="https://example.com" value={url} onChange={e => { setUrl(e.target.value); setError(''); }} required disabled={loading} aria-describedby={error ? 'form-error' : 'url-hint'}/><button type="submit" disabled={loading || !url.trim()}>{loading ? <LoaderCircle className="spin" size={17}/> : <Search size={17}/>}<span>{loading ? '점검 중' : '보안 점검'}</span>{!loading && <ArrowRight size={16}/>}</button></div>
                {error && <div className="form-error" id="form-error" role="alert"><CircleAlert size={15}/>{error}</div>}
                <div className="form-help" id="url-hint"><span><ShieldCheck size={13}/> 소유하거나 점검 권한이 있는 사이트만 입력해주세요.</span><button type="button" onClick={showDemo} disabled={loading}>예시 결과 보기 <ArrowUpRight size={13}/></button></div>
              </form>
              <div className="scan-details"><span><Check size={13}/> 공개 헤더 확인</span><span><Check size={13}/> PHP 버전 분석</span><span><Check size={13}/> 맞춤 대응 안내</span></div>
            </section>

            <section className={`card result-card ${result ? 'has-result' : ''}`} ref={resultRef} aria-busy={loading} aria-live="polite">
              <div className="section-heading result-heading"><div className="title-line"><span className="section-icon"><FileCheck2 size={19}/></span><h2>점검 결과</h2>{result?.demo && <span className="demo-badge">예시 데이터</span>}</div><div className="result-actions">{result ? <><button title="결과 초기화" aria-label="결과 초기화" className="icon-button" onClick={() => { setResult(null); input.current?.focus(); }}><RotateCcw size={15}/></button><button className="download-button" onClick={downloadReport}><ArrowDownToLine size={14}/> 결과 다운로드</button></> : <span className={`waiting-label ${loading ? 'is-loading' : ''}`}><span/>{loading ? '분석 진행 중' : '점검 대기 중'}</span>}</div></div>
              {!result ? <div className="empty-result"><div className={`radar-wrap ${loading ? 'scanning' : ''}`}><span className="radar-ring"/><Radar size={38} strokeWidth={1.3}/>{loading && <span className="radar-sweep"/>}</div><h3>{loading ? '웹사이트의 응답을 확인하고 있습니다' : '웹사이트의 보안 상태를 확인해보세요'}</h3><p>{loading ? '공개 헤더를 수집하고 PHP 패치 버전과 비교합니다.' : '주소를 입력하면 PHP2Shell 취약 가능성과'}{!loading && <><br/>분석 결과에 따른 대응 방법을 안내해드립니다.</>}</p><div className="empty-steps"><span className={loading ? 'current' : ''}><span>1</span> 서버 응답 확인</span><ChevronRight size={13}/><span><span>2</span> PHP 버전 분석</span><ChevronRight size={13}/><span><span>3</span> 결과 안내</span></div></div> : <>
                <div className="result-tabs" role="tablist" aria-label="점검 결과 보기">{([['overview', '점검 요약'], ['headers', '응답 헤더'], ['guide', '대응 방법']] as const).map(([key, title]) => <button id={`tab-${key}`} role="tab" aria-selected={tab === key} aria-controls="result-panel" key={key} onClick={() => setTab(key)} className={tab === key ? 'selected' : ''}>{title}{key === 'headers' && <span>{Object.keys(result.headers).length}</span>}</button>)}</div>
                <div id="result-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="result-panel">
                {tab === 'overview' && <><div className={`verdict ${state?.className}`}><StateIcon size={23}/><div><span className="verdict-label">{state?.label}</span><h3>{state?.title}</h3><p>{result.reason}</p></div></div><div className="result-metrics"><div><span><Code2 size={13}/> PHP 버전</span><strong>{result.phpVersion ?? '미노출'}</strong></div><div><span><Server size={13}/> 웹 서버</span><strong>{result.server ?? '미노출'}</strong></div><div><span><Globe2 size={13}/> HTTP 응답</span><strong>{result.status}<small>{result.status >= 400 ? '접근 제한 가능' : result.status >= 300 ? 'Redirect' : '응답 수신'}</small></strong></div></div><div className="target-row"><span>점검 주소</span><code>{result.finalUrl}</code></div>{result.url !== result.finalUrl && <p className="redirect-note">입력 주소에서 리디렉션된 최종 응답을 분석했습니다.</p>}<div className="result-note"><Info size={14}/><span>{result.demo ? '화면 확인용 예시입니다. 실제 대상에 요청을 보내지 않았습니다.' : '헤더 기반 참고 결과입니다. 헤더 미노출은 안전함을 의미하지 않으며 백포트 패치는 별도 확인이 필요합니다.'}</span></div></>}
                {tab === 'headers' && <><div className="headers-top"><p>최종 응답에서 확인된 공개 헤더</p><button className="text-button" onClick={copyHeaders}>{copied ? <CheckCheck size={14}/> : <Copy size={14}/>} {copied ? '복사 완료' : '복사'}</button></div><div className="header-table">{Object.entries(result.headers).length ? Object.entries(result.headers).map(([key, value]) => <div key={key}><code>{key}</code><code>{value}</code></div>) : <p className="no-headers">분석할 수 있는 공개 헤더가 없습니다.</p>}</div><p className="header-caption">쿠키 등 민감한 헤더와 응답 본문은 수집하지 않습니다.</p></>}
                {tab === 'guide' && <div className="result-guide"><h3>{result.verdict === 'risk' ? 'PHP 보안 패치를 우선 적용하세요' : result.verdict === 'patched' ? '실제 실행 환경의 패치 상태를 확인하세요' : '서버에서 PHP 버전을 직접 확인하세요'}</h3><p>{result.recommendedVersion ? `공식 패치 기준: PHP ${result.recommendedVersion} 이상. ` : ''}운영체제 배포판 패키지는 보안 패치가 백포트되었을 수 있습니다.</p><ol><li>웹 요청을 처리하는 PHP 패키지와 공급업체 보안 공지를 확인합니다.</li><li>해당 브랜치의 패치를 적용하거나 지원 중인 최신 브랜치로 이전합니다.</li><li>PHP-FPM·Apache 등 모든 PHP 워커를 재시작하고 적용 상태를 확인합니다.</li></ol><a href="#guide" className="text-button">전체 대응 가이드 <ArrowRight size={14}/></a></div>}
                <div className="result-meta"><span><Clock3 size={12}/>{new Date(result.checkedAt).toLocaleString('ko-KR', { hour12: false })}</span><span>{result.method} · {result.duration} ms</span></div></div>
              </>}
              {!result && <div className="result-footer"><LockKeyhole size={13}/><span>공개된 응답 헤더만 확인하며, 공격 코드를 실행하지 않습니다.</span></div>}
            </section>

            <div className="method-note"><Info size={16}/><p><strong>점검 결과를 이렇게 이해해주세요.</strong> 이 도구는 공개 HTTP 헤더에 기반한 사전 점검 도구입니다. 실제 취약 여부는 서버 설정, 배포판 패치, 실행 환경을 함께 확인해야 합니다.</p></div>
          </div>

          <aside className="side-column">
            <section className="card about-card"><div className="about-title"><span className="mini-shield"><Shield size={18}/></span><h2>PHP2Shell이란?</h2><span className="critical-tag">CRITICAL</span></div><p>PHP 엔진에서 발견된 메모리 안전성 취약점으로, 원격 코드 실행이나 민감 정보 노출로 이어질 수 있습니다.</p><div className="cve-list"><a href={official} target="_blank" rel="noreferrer"><span>CVE-2026-109618</span><ArrowUpRight size={13}/></a><a href={second} target="_blank" rel="noreferrer"><span>CVE-2026-109619</span><ArrowUpRight size={13}/></a></div><a className="learn-link" href={official} target="_blank" rel="noreferrer">취약점 자세히 알아보기 <ArrowRight size={14}/></a></section>
            <section className="card patch-card"><div className="title-line"><span className="patch-icon"><ShieldCheck size={19}/></span><h2>보안 패치 버전</h2></div><p>아래 버전 이상으로 업데이트하세요.</p><div className="version-table"><div className="version-table-head"><span>PHP 브랜치</span><span>패치 버전</span></div>{versions.map(([branch, version]) => <div className="version-row" key={branch}><span>PHP {branch}<span className="branch-dot">.x</span></span><span><Check size={12}/>{version} +</span></div>)}</div><div className="eol-note"><CircleAlert size={14}/><span>PHP 8.1 이하는 지원 종료 상태입니다.<br/>지원 중인 브랜치로 이전하세요.</span></div><span className="updated-at">기준일 2026. 10. 22 · PHP 공식 보안 권고</span></section>
            <div className="privacy-note"><ShieldCheck size={20}/><div><strong>필요한 정보만, 안전하게</strong><p>대상 서버의 본문과 쿠키를 수집하지 않으며, 점검 결과는 DB에 저장하지 않습니다.</p></div></div>
          </aside>
        </div>

        <section id="guide" className="guide-section"><div className="guide-heading"><div><div className="overline">NEXT STEPS</div><h2>점검 후, 이렇게 대응하세요</h2><p>보안을 위한 가장 확실한 첫걸음은 최신 패치를 적용하는 것입니다.</p></div><a href="https://www.php.net/downloads" target="_blank" rel="noreferrer" className="outline-link">PHP 다운로드 <ArrowUpRight size={15}/></a></div><div className="guide-grid"><article><div className="guide-top"><span className="guide-number">01</span><span className="guide-symbol"><Search size={21}/></span></div><h3>실행 중인 PHP 확인</h3><p>웹 서버가 사용하는 PHP 버전과 패키지를 확인하세요. CLI 버전과 웹 서버의 버전은 다를 수 있습니다.</p><div className="command"><Terminal size={14}/><code>php -v</code><span>CLI 버전 참고</span></div></article><article><div className="guide-top"><span className="guide-number">02</span><span className="guide-symbol"><Layers3 size={21}/></span></div><h3>보안 패치 적용</h3><p>브랜치별 패치 버전 이상으로 업데이트하고, PHP-FPM 또는 Apache의 모든 PHP 워커를 재시작하세요.</p><a href="https://www.php.net/downloads" target="_blank" rel="noreferrer">지원 버전 확인하기 <ArrowUpRight size={14}/></a></article><article><div className="guide-top"><span className="guide-number">03</span><span className="guide-symbol"><ShieldCheck size={21}/></span></div><h3>설정 및 적용 상태 확인</h3><p>모든 실행 환경의 패치 적용을 확인하세요. 헤더에서 버전을 숨기는 설정은 취약점 패치를 대신하지 않습니다.</p><a href={second} target="_blank" rel="noreferrer">공식 대응 권고 확인 <ArrowUpRight size={14}/></a></article></div></section>

        <section className="faq-section"><div className="faq-title"><CircleHelp size={19}/><h2>자주 묻는 질문</h2></div><div className="faq-list"><details><summary>PHP 버전이 확인되지 않으면 안전한가요?<ChevronDown size={17}/></summary><p>아닙니다. 서버가 버전 정보를 숨기거나 프록시·CDN이 헤더를 제거할 수 있습니다. 서버에서 웹 요청을 처리하는 PHP 패키지와 보안 패치 적용 여부를 직접 확인해야 합니다.</p></details><details><summary>점검 과정에서 서버에 영향을 주나요?<ChevronDown size={17}/></summary><p>일반적인 HEAD 요청으로 공개 응답 헤더만 확인합니다. 서버가 HEAD를 지원하지 않으면 GET 요청의 헤더만 확인하고 본문 다운로드를 중단합니다. 리디렉션은 최대 3회 따라가며 공격 요청은 전송하지 않습니다.</p></details><details><summary>버전이 낮아도 보안 패치가 적용되어 있을 수 있나요?<ChevronDown size={17}/></summary><p>네. 운영체제 배포판이나 호스팅 업체가 버전 번호를 유지한 채 보안 패치를 백포트할 수 있습니다. 설치된 패키지의 전체 릴리스 번호와 공급업체의 보안 공지를 함께 확인하세요.</p></details></div></section>

        <div className="bottom-notice"><Info size={15}/><p>즉시 패치가 어렵다면 공식 권고에 따라 노출을 줄이세요. 임시 설정이나 WAF는 완전한 패치를 대신할 수 없습니다.</p><a href={official} target="_blank" rel="noreferrer">공식 권고 <ArrowUpRight size={13}/></a></div>
      </main>
      <footer><div><a className="footer-brand" href="#"><ShieldCheck size={18}/> PHP2Shell Check</a><span>더 안전한 웹을 위한 작은 점검.</span></div><div><span>헤더 기반 사전 점검 도구</span><span className="footer-divider"/><a href={official} target="_blank" rel="noreferrer">PHP Security Advisories <ExternalLink size={12}/></a></div></footer>
    </>
  );
}
