import { defineMessages } from "../messages"

// components/geo/GuestRewardNote.tsx (client): the reminder of a reward won on the website's wheel, for
// a signed-out visitor whose browser holds one: under the quick check's form ("check"), at the quick
// check's account offer ("gate"), on /signup ("signup") and on /login ("login"). Each gets the reward's
// name (exitWheel.ts `rewards`, in <b>) and its date ("November 5 at 2:20 PM", in the page's language).
// What is true of the reward (lib/geo-promo.ts): it moves into the account once that account's free
// report is ready, one per account, and never into an account that has or had the plan. No prices.
// Only the check and the report are called free, never the account (the site's rule, as signup.ts and
// aiAnswers.ts). DE: Sie, FR: vous, ES: usted, RU: вы. "Plan" as the pricing block names it
// (pricingPlans.ts).

const en = {
  check: (reward: string, date: string) =>
    `Your launch reward: <b>${reward}</b> · kept until ${date}. Check your site and create an account to claim it.`,
  gate: (reward: string, date: string) =>
    `Your launch reward: <b>${reward}</b> · kept until ${date}. It moves into your account once your free report is ready.`,
  signup: (reward: string, date: string) =>
    `Your launch reward: <b>${reward}</b> · kept until ${date}. It will be added to this account once your free report is ready.`,
  login: (reward: string, date: string) =>
    `Your launch reward: <b>${reward}</b> · kept until ${date}. It will be added to your account once its free report is ready (one reward per account, not for accounts that have or had the plan).`,
}

export default defineMessages(en, {
  de: {
    check: (reward, date) =>
      `Ihr Startbonus: <b>${reward}</b> · reserviert bis ${date}. Prüfen Sie Ihre Website und legen Sie ein Konto an, um ihn einzulösen.`,
    gate: (reward, date) =>
      `Ihr Startbonus: <b>${reward}</b> · reserviert bis ${date}. Er geht in Ihr Konto über, sobald Ihr kostenloser Bericht fertig ist.`,
    signup: (reward, date) =>
      `Ihr Startbonus: <b>${reward}</b> · reserviert bis ${date}. Er wird diesem Konto hinzugefügt, sobald Ihr kostenloser Bericht fertig ist.`,
    login: (reward, date) =>
      `Ihr Startbonus: <b>${reward}</b> · reserviert bis ${date}. Er wird Ihrem Konto hinzugefügt, sobald dessen kostenloser Bericht fertig ist (ein Bonus pro Konto, nicht für Konten, die den Plan haben oder hatten).`,
  },
  fr: {
    check: (reward, date) =>
      `Votre offre de lancement : <b>${reward}</b> · gardée jusqu’au ${date}. Vérifiez votre site et créez un compte pour en profiter.`,
    gate: (reward, date) =>
      `Votre offre de lancement : <b>${reward}</b> · gardée jusqu’au ${date}. Elle passe dans votre compte dès que votre rapport gratuit est prêt.`,
    signup: (reward, date) =>
      `Votre offre de lancement : <b>${reward}</b> · gardée jusqu’au ${date}. Elle sera ajoutée à ce compte dès que votre rapport gratuit sera prêt.`,
    login: (reward, date) =>
      `Votre offre de lancement : <b>${reward}</b> · gardée jusqu’au ${date}. Elle sera ajoutée à votre compte dès que son rapport gratuit sera prêt (une offre par compte, pas pour les comptes qui ont ou ont eu l’abonnement).`,
  },
  es: {
    check: (reward, date) =>
      `Su recompensa de lanzamiento: <b>${reward}</b> · guardada hasta el ${date}. Analice su sitio y cree una cuenta para obtenerla.`,
    gate: (reward, date) =>
      `Su recompensa de lanzamiento: <b>${reward}</b> · guardada hasta el ${date}. Pasará a su cuenta en cuanto su informe gratuito esté listo.`,
    signup: (reward, date) =>
      `Su recompensa de lanzamiento: <b>${reward}</b> · guardada hasta el ${date}. Se añadirá a esta cuenta en cuanto su informe gratuito esté listo.`,
    login: (reward, date) =>
      `Su recompensa de lanzamiento: <b>${reward}</b> · guardada hasta el ${date}. Se añadirá a su cuenta en cuanto su informe gratuito esté listo (una recompensa por cuenta, no para cuentas que tienen o tuvieron el plan).`,
  },
  ru: {
    check: (reward, date) =>
      `Ваш стартовый бонус: <b>${reward}</b> · хранится до ${date}. Проверьте свой сайт и создайте аккаунт, чтобы забрать его.`,
    gate: (reward, date) =>
      `Ваш стартовый бонус: <b>${reward}</b> · хранится до ${date}. Он перейдёт в ваш аккаунт, как только будет готов бесплатный отчёт.`,
    signup: (reward, date) =>
      `Ваш стартовый бонус: <b>${reward}</b> · хранится до ${date}. Он будет добавлен в этот аккаунт, как только будет готов бесплатный отчёт.`,
    login: (reward, date) =>
      `Ваш стартовый бонус: <b>${reward}</b> · хранится до ${date}. Он будет добавлен в ваш аккаунт, как только будет готов его бесплатный отчёт (один бонус на аккаунт, не для аккаунтов, у которых есть или была подписка).`,
  },
})
