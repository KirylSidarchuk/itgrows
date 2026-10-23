import { defineMessages } from "../messages"

// components/i18n/LanguageSwitcher.tsx. The language names themselves are endonyms
// (LOCALE_NAMES in lib/i18n/config.ts) and are the same on every page.

const en = {
  label: "Language",
  current: (name: string) => `Language: ${name}`,
}

export default defineMessages(en, {
  de: {
    label: "Sprache",
    current: (name) => `Sprache: ${name}`,
  },
  fr: {
    label: "Langue",
    current: (name) => `Langue\u00a0: ${name}`,
  },
  es: {
    label: "Idioma",
    current: (name) => `Idioma: ${name}`,
  },
  ru: {
    label: "Язык",
    current: (name) => `Язык: ${name}`,
  },
})
