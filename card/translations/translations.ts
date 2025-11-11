import en from "./en.json";
import sv from "./sv.json";

const translations: Record<string, any> = { en, sv };
let currentLang = "en";

export function setLanguage(lang: string) {
  currentLang = translations[lang] ? lang : "en";
}

export function translate(key: string, vars?: Record<string, any>): string {
  // Support nested keys like 'quick_add.title'
  function getNested(obj: any, path: string): any {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  }
  let str =
    getNested(translations[currentLang], key) ||
    getNested(translations["en"], key) ||
    key;
  if (vars && typeof str === "string") {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`{${k}}`, "g"), String(v));
    }
  }
  return str;
}
