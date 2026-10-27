import { defineMessages } from "../messages"

// components/CookieBanner.tsx (client): the compact banner on phones (narrower than 640 px), on the GEO
// pages only, at the top of the screen. The banner is in the root layout, outside the pages'
// LocaleProvider, and reads the language from <html lang>.
// The desktop banner and the cookie settings stay in English.
// <link>…</link> opens the cookie policy. Accept and Decline mean what "Accept all" and "Decline" mean
// on the desktop banner; Settings opens the same cookie settings.

const en = {
  short: "Analytics and ad <link>cookies</link> only if you accept.",
  accept: "Accept",
  decline: "Decline",
  settings: "Settings",
}

export default defineMessages(en, {
  de: {
    short: "Analyse- und Werbe-<link>Cookies</link> nur mit Ihrer Zustimmung.",
    accept: "Akzeptieren",
    decline: "Ablehnen",
    settings: "Einstellungen",
  },
  fr: {
    short: "<link>Cookies</link> d’analyse et de publicité seulement avec votre accord.",
    accept: "Accepter",
    decline: "Refuser",
    settings: "Paramètres",
  },
  es: {
    short: "<link>Cookies</link> de análisis y publicidad solo si acepta.",
    accept: "Aceptar",
    decline: "Rechazar",
    settings: "Ajustes",
  },
  ru: {
    short: "<link>Cookie</link> аналитики и рекламы — только с вашего согласия.",
    accept: "Принять",
    decline: "Отклонить",
    settings: "Настройки",
  },
})
