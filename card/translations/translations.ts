
import en from './en.json';
import sv from './sv.json';

const translations: Record<string, any> = { en, sv };
let currentLang = 'en';

export function setLanguage(lang: string) {
  currentLang = translations[lang] ? lang : 'en';
}

export function translate(key: string, vars?: Record<string, any>): string {
  let str = translations[currentLang]?.[key] || translations['en']?.[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
    }
  }
  return str;
}
