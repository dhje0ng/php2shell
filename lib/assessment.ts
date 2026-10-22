export const PATCHES = { '8.2': 35, '8.3': 36, '8.4': 27, '8.5': 12 } as const;
export type Verdict = 'risk' | 'patched' | 'unknown';
export type CheckResult = {
  url: string; finalUrl: string; status: number; method: string; checkedAt: string;
  duration: number; phpVersion: string | null; server: string | null;
  verdict: Verdict; reason: string; recommendedVersion: string | null;
  headers: Record<string, string>; demo?: boolean;
};

export function assessVersion(version: string | null): Pick<CheckResult, 'verdict' | 'reason' | 'recommendedVersion'> {
  if (!version) return { verdict: 'unknown', reason: '응답 헤더에 PHP 버전이 공개되어 있지 않습니다. 서버에서 실행 중인 PHP 패키지와 보안 패치 적용 여부를 직접 확인하세요.', recommendedVersion: null };
  const match = /^(\d+)\.(\d+)\.(\d+)(.*)$/.exec(version);
  if (!match) return { verdict: 'unknown', reason: '정확한 PHP 패치 버전을 확인할 수 없습니다. 서버의 패키지 정보를 확인하세요.', recommendedVersion: null };
  const [, major, minor, patch, suffix] = match;
  const branch = `${major}.${minor}`;
  const fix = PATCHES[branch as keyof typeof PATCHES];
  if (/^(?:RC|alpha|beta|dev)/i.test(suffix)) return { verdict: 'unknown', reason: '개발 또는 사전 릴리스 버전입니다. 공식 보안 패치 포함 여부를 별도로 확인하세요.', recommendedVersion: fix ? `${branch}.${fix}` : null };
  if (fix !== undefined) {
    return Number(patch) >= fix
      ? { verdict: 'patched', reason: '공개된 PHP 버전이 공식 패치 버전 이상입니다. 헤더는 실제 실행 환경과 다를 수 있으므로 서버 패키지와 모든 PHP 워커의 패치 적용도 확인하세요.', recommendedVersion: `${branch}.${fix}` }
      : { verdict: 'risk', reason: '공개된 PHP 버전이 PHP2Shell 공식 패치 버전보다 낮습니다. 배포판의 백포트 패치가 적용되었을 수 있으므로 패키지 보안 공지를 함께 확인하세요.', recommendedVersion: `${branch}.${fix}` };
  }
  if (Number(major) < 8 || (Number(major) === 8 && Number(minor) < 2)) {
    // The PHP2Shell disclosure covers PHP 5.4 onward. Older versions are unsupported,
    // but this advisory alone cannot establish their susceptibility.
    if (Number(major) < 5 || (Number(major) === 5 && Number(minor) < 4)) return { verdict: 'unknown', reason: '공식 확인 범위 이전의 지원 종료 버전입니다. PHP2Shell 영향 여부를 단정할 수 없으며 지원 중인 PHP로 이전해야 합니다.', recommendedVersion: '8.5.12' };
    return { verdict: 'risk', reason: 'PHP2Shell의 영향 범위에 포함된 지원 종료 버전입니다. 지원 중인 PHP로 업그레이드하거나 공급업체의 보안 패치 제공 여부를 확인하세요.', recommendedVersion: '8.5.12' };
  }
  return { verdict: 'unknown', reason: '현재 점검 기준에 포함되지 않은 PHP 버전입니다. 최신 공식 보안 공지와 해당 패키지를 확인하세요.', recommendedVersion: null };
}

export function extractPhpVersion(headers: Record<string, string>): string | null {
  for (const key of ['x-powered-by', 'server', 'x-generator', 'via']) {
    const value = headers[key];
    if (!value) continue;
    const match = /\bPHP\/([0-9]+\.[0-9]+(?:\.[0-9]+)?(?:[a-zA-Z][\w.+~-]*)?(?:[-+~][\w.+~-]+)?)/i.exec(value);
    if (match) return match[1];
  }
  return null;
}
