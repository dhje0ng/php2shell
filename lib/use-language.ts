'use client';

import { useEffect, useState } from 'react';
import { LANGUAGE_STORAGE_KEY, normalizeLanguage, translate, type Language } from './i18n';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('ko');

  useEffect(() => {
    try { setLanguage(normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))); }
    catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate('PHP2Shell Check — 내 웹사이트의 PHP 보안 점검', language);
    document.querySelector('meta[name="description"]')?.setAttribute('content', translate('공개 HTTP 헤더와 PHP 버전을 확인하고 PHP2Shell 취약 가능성과 대응 방법을 안내합니다.', language));
  }, [language]);

  function changeLanguage(value: Language) {
    setLanguage(value);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, value); }
    catch {}
  }

  return { language, changeLanguage, t: (text: string) => translate(text, language) };
}
