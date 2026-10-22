# PHP2Shell Check

한국어 PHP2Shell 사전 점검 웹 페이지. Next.js App Router + React + TypeScript.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속. 운영 실행은 `npm run build` 후 `npm start`.
Node.js 20.9 이상이 필요합니다. SSR 및 Node.js API 라우트를 사용하므로 정적 호스팅만으로는 실제 점검 기능을 실행할 수 없습니다.

## 기능

- 화이트톤 반응형 UI, 한국어 안내, 로딩·오류·결과 미확인 상태
- HEAD 요청으로 공개 응답 헤더 확인. 405/501이면 GET 헤더 확인 후 본문 중단
- 최대 3회 리디렉션, 전체 요청 12초 제한, 요청별 8초 제한
- HTTP/HTTPS 기본 웹 포트만 허용. 내부·루프백·예약 네트워크 차단
- DNS 전체 응답 검증 후 검증된 주소에 연결을 고정하여 DNS rebinding 방지
- PHP 버전 비교, 공개 헤더 표시, 대응 방법, JSON 결과 다운로드, 헤더 복사
- 실제 서버 요청과 구분되는 예시 결과
- 본문과 쿠키 수집 제외, 결과 DB 저장 없음

## 판정과 한계

기준일: 2026-10-22. PHP 공식 보안 권고의 패치 버전은 8.2.35 / 8.3.36 / 8.4.27 / 8.5.12입니다.

- `risk`: 패치 이전 또는 영향 범위에 포함된 지원 종료 버전. 실제 공격 성공 여부를 확인한 결과가 아닙니다.
- `patched`: 공개된 버전이 해당 브랜치의 패치 버전 이상. 전체 서버 환경의 안전성을 보증하지 않습니다.
- `unknown`: 버전 미노출, 부분 버전, 사전 릴리스, 확인 범위 외 브랜치.

헤더는 프록시에서 수정되거나 실제 엔진과 다를 수 있습니다. 배포판 백포트는 버전 문자열로 판단할 수 없습니다. 웹 서버에서 사용하는 실제 패키지와 공급업체 보안 공지를 확인해야 합니다. 공개 서비스로 확장할 경우 배포 환경에서 요청량 제한을 설정하세요.

참고 자료:
- https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w
- https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp

## 검증

```bash
npm test
npm run typecheck
npm run build
```
