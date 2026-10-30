import type { WheelReward } from "../../geo-promo"
import { plural } from "../format"
import { defineMessages } from "../messages"

// components/geo/ExitWheelModal.tsx (client): the launch-rewards wheel offered on the public GEO pages
// when a signed-out visitor on a computer moves to leave (lib/geo-promo.ts PROMO_WHEEL.exitIntent). It
// sits in the root layout, outside the pages' LocaleProvider, and reads the language from <html lang>.
// No prices here: the rewards by name only (the plan's price is on the pricing card, lib/geo-pricing.ts).
// `rewards` and `segments` (two short lines on the wheel) follow WHEEL_REWARDS. The terms are
// in English only, so the other languages say so on the link. After the spin, `claimHow` says what
// claims the reward and `cta` names it (Kiryl, 29 Oct 2026: the button said "free report" under a won
// reward); only the check and the report are called free, never the account (as signup.ts and
// aiAnswers.ts). DE: Sie, FR: vous, ES: usted, RU: вы.

type Rewards = Record<WheelReward, string>
type Lines = Record<WheelReward, string[]>

const en = {
  title: "Before you go: everyone wins a launch reward",
  line: (days: number) =>
    `Spin once. Your reward is kept for ${plural("en", days, { one: `${days} day`, other: `${days} days` })} and waits in your account when you create one and get your free report.`,
  odds: "One of four, each with the same chance:",
  rewards: {
    setup_free: "Free setup on the monthly plan",
    month_half: "First month 50% off on the monthly plan",
    quarter_plus_month: "3 months + 1 month free",
    year_30: "A year at 30% off instead of 20%",
  } as Rewards,
  segments: {
    setup_free: ["Free", "setup"],
    month_half: ["1st month", "50% off"],
    quarter_plus_month: ["3 months", "+1 free"],
    year_30: ["A year", "30% off"],
  } as Lines,
  spin: "Spin the wheel",
  spinning: "Spinning…",
  noThanks: "No thanks",
  close: "Close",
  wonLabel: "Your launch reward",
  keptUntil: (date: string) => `Kept until ${date}.`,
  claimHow: "To claim it: enter your site, create an account and get your free report. The reward then moves into that account.",
  cta: "Claim my reward",
  terms: "Terms",
  failed: "That didn't go through. Try again in a minute.",
  announce: (reward: string, date: string) => `Your reward: ${reward}, kept until ${date}.`,
}

export default defineMessages(en, {
  de: {
    title: "Bevor Sie gehen: Jeder gewinnt einen Startbonus",
    line: (days) =>
      `Einmal drehen. Ihr Bonus bleibt ${plural("de", days, { one: `${days} Tag`, other: `${days} Tage` })} reserviert und wartet in Ihrem Konto, sobald Sie eines anlegen und Ihren kostenlosen Bericht erhalten.`,
    odds: "Einer von vier, jeder mit der gleichen Chance:",
    rewards: {
      setup_free: "Kostenlose Einrichtung bei monatlicher Zahlung",
      month_half: "Erster Monat 50 % günstiger bei monatlicher Zahlung",
      quarter_plus_month: "3 Monate + 1 Monat gratis",
      year_30: "Ein Jahr mit 30 % statt 20 % Rabatt",
    },
    segments: {
      setup_free: ["Einrichtung", "gratis"],
      month_half: ["1. Monat", "−50 %"],
      quarter_plus_month: ["3 Monate", "+1 gratis"],
      year_30: ["1 Jahr", "−30 %"],
    },
    spin: "Rad drehen",
    spinning: "Das Rad dreht sich…",
    noThanks: "Nein, danke",
    close: "Schließen",
    wonLabel: "Ihr Startbonus",
    keptUntil: (date) => `Reserviert bis ${date}.`,
    claimHow:
      "So lösen Sie ihn ein: Geben Sie Ihre Website ein, legen Sie ein Konto an und erhalten Sie Ihren kostenlosen Bericht. Dann geht der Bonus in dieses Konto über.",
    cta: "Bonus sichern",
    terms: "Bedingungen (Englisch)",
    failed: "Das hat nicht geklappt. Bitte versuchen Sie es in einer Minute erneut.",
    announce: (reward, date) => `Ihr Bonus: ${reward}, reserviert bis ${date}.`,
  },
  fr: {
    title: "Avant de partir : tout le monde gagne une offre de lancement",
    line: (days) =>
      `Un seul tour. Votre offre est gardée ${plural("fr", days, { one: `${days} jour`, other: `${days} jours` })} et vous attend dans votre compte dès que vous en créez un et recevez votre rapport gratuit.`,
    odds: "Une offre sur quatre, chacune avec la même chance :",
    rewards: {
      setup_free: "Mise en place offerte avec l’abonnement mensuel",
      month_half: "Premier mois à −50 % avec l’abonnement mensuel",
      quarter_plus_month: "3 mois + 1 mois offert",
      year_30: "Un an à −30 % au lieu de −20 %",
    },
    segments: {
      setup_free: ["Mise en place", "offerte"],
      month_half: ["1er mois", "−50 %"],
      quarter_plus_month: ["3 mois", "+1 offert"],
      year_30: ["1 an", "−30 %"],
    },
    spin: "Tourner la roue",
    spinning: "La roue tourne…",
    noThanks: "Non merci",
    close: "Fermer",
    wonLabel: "Votre offre de lancement",
    keptUntil: (date) => `Gardée jusqu’au ${date}.`,
    claimHow: "Pour en profiter : saisissez votre site, créez un compte et recevez votre rapport gratuit. L’offre passe alors dans ce compte.",
    cta: "Récupérer mon offre",
    terms: "Conditions (en anglais)",
    failed: "Cela n’a pas abouti. Réessayez dans une minute.",
    announce: (reward, date) => `Votre offre : ${reward}, gardée jusqu’au ${date}.`,
  },
  es: {
    title: "Antes de irse: todos ganan una recompensa de lanzamiento",
    line: (days) =>
      `Gire una vez. Su recompensa se guarda ${plural("es", days, { one: `${days} día`, other: `${days} días` })} y le espera en su cuenta cuando la cree y reciba su informe gratuito.`,
    odds: "Una de cuatro, todas con la misma probabilidad:",
    rewards: {
      setup_free: "Configuración inicial gratis en el plan mensual",
      month_half: "Primer mes con un 50 % de descuento en el plan mensual",
      quarter_plus_month: "3 meses + 1 mes gratis",
      year_30: "Un año con un 30 % de descuento en lugar del 20 %",
    },
    segments: {
      setup_free: ["Configuración", "gratis"],
      month_half: ["1.er mes", "−50 %"],
      quarter_plus_month: ["3 meses", "+1 gratis"],
      year_30: ["1 año", "−30 %"],
    },
    spin: "Girar la rueda",
    spinning: "Girando…",
    noThanks: "No, gracias",
    close: "Cerrar",
    wonLabel: "Su recompensa de lanzamiento",
    keptUntil: (date) => `Guardada hasta el ${date}.`,
    claimHow: "Para obtenerla: introduzca su sitio, cree una cuenta y reciba su informe gratuito. La recompensa pasará entonces a esa cuenta.",
    cta: "Obtener mi recompensa",
    terms: "Condiciones (en inglés)",
    failed: "No se ha podido completar. Inténtelo de nuevo en un minuto.",
    announce: (reward, date) => `Su recompensa: ${reward}, guardada hasta el ${date}.`,
  },
  ru: {
    title: "Прежде чем уйти: каждый получает стартовый бонус",
    line: (days) =>
      `Одна попытка. Бонус хранится ${plural("ru", days, { one: `${days} день`, few: `${days} дня`, many: `${days} дней`, other: `${days} дня` })} и ждёт вас в аккаунте, когда вы его создадите и получите бесплатный отчёт.`,
    odds: "Один из четырёх, у каждого одинаковый шанс:",
    rewards: {
      setup_free: "Бесплатная настройка на помесячном плане",
      month_half: "Первый месяц −50 % на помесячном плане",
      quarter_plus_month: "3 месяца + 1 месяц в подарок",
      year_30: "Год со скидкой 30 % вместо 20 %",
    },
    segments: {
      setup_free: ["Настройка", "бесплатно"],
      month_half: ["1-й месяц", "−50 %"],
      quarter_plus_month: ["3 месяца", "+1 в подарок"],
      year_30: ["Год", "−30 %"],
    },
    spin: "Крутить колесо",
    spinning: "Колесо крутится…",
    noThanks: "Нет, спасибо",
    close: "Закрыть",
    wonLabel: "Ваш стартовый бонус",
    keptUntil: (date) => `Хранится до ${date}.`,
    claimHow: "Как забрать: введите адрес сайта, создайте аккаунт и получите бесплатный отчёт. Бонус перейдёт в этот аккаунт.",
    cta: "Забрать бонус",
    terms: "Условия (на английском)",
    failed: "Не получилось. Попробуйте ещё раз через минуту.",
    announce: (reward, date) => `Ваш бонус: ${reward}, хранится до ${date}.`,
  },
})
