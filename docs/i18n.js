// ======================================================================
// Sistèm tradiksyon Global Store — Kreyòl (ht), English (en), Français (fr)
// Itilizasyon nan HTML :
//   data-i18n="kle"               → ranplase tèks eleman an
//   data-i18n-placeholder="kle"   → ranplase placeholder
//   data-i18n-aria="kle"          → ranplase aria-label
// Nan JS : import { t } from "./i18n.js";  t("kle", { name: "Jan" })
// ======================================================================

export const LANGS = { fr: "FR", en: "EN", ht: "HT" };
export const LANG_NAMES = { fr: "Français", en: "English", ht: "Kreyòl" };

const KEY = "gs_lang";
const LOCALES = { fr: "fr-FR", en: "en-US", ht: "fr-FR" };

const DICT = {
  // ------------------------------------------------------------------ FR
  fr: {
    "lang.label": "Langue",
    "cur.label": "Devise",
    "common.loading": "Chargement…",

    "nav.catalog": "Catalogue",
    "nav.how": "Comment ça marche",
    "nav.login": "Connexion",
    "nav.signup": "Créer un compte",
    "nav.about": "À propos",
    "nav.dashboard": "Tableau de bord",
    "nav.logout": "Déconnexion",

    "title.home": "Global Store – Cartes cadeaux, abonnements et recharges",
    "title.register": "Créer un compte – Global Store",
    "title.dashboard": "Tableau de bord – Global Store",
    "title.checkout": "Acheter – Global Store",

    "hero.p": "Cartes cadeaux, abonnements et recharges de jeux, livrés en quelques minutes. Un seul endroit pour tout.",
    "hero.start": "Commencer",
    "hero.catalog": "Voir le catalogue",
    "home.catalog": "Ce que vous trouvez chez nous",
    "how.title": "Commander prend trois étapes",
    "how.1.t": "Créez votre compte",
    "how.1.d": "Inscription gratuite avec votre e-mail.",
    "how.2.t": "Choisissez et payez",
    "how.2.d": "Sélectionnez la carte ou la recharge, puis réglez votre commande.",
    "how.3.t": "Recevez votre produit",
    "how.3.d": "Le code ou la recharge arrive directement sur votre compte.",
    "why.title": "Pourquoi Global Store",
    "why.p1": "Nous rassemblons les cartes et recharges les plus demandées pour que vous n'ayez plus à chercher ailleurs. Chaque commande est suivie depuis votre compte.",
    "why.p2": "Notre équipe reste disponible si un code pose problème ou si une recharge tarde. Vous savez toujours où en est votre commande.",
    "cta.title": "Prêt à recharger ?",
    "cta.btn": "Créer mon compte",
    "footer.signup": "Inscription",

    "auth.side.title": "Rejoignez Global Store.",
    "auth.side.p": "Un compte pour suivre toutes vos commandes.",
    "auth.show": "Afficher",
    "reg.title": "Créer un compte",
    "reg.sub": "Gratuit, prêt en moins d'une minute.",
    "reg.name": "Nom complet",
    "reg.email": "E-mail",
    "reg.password": "Mot de passe",
    "reg.confirm": "Confirmer le mot de passe",
    "reg.submit": "Créer mon compte",
    "reg.have": "Déjà inscrit ?",
    "reg.login": "Se connecter",

    "cat.sub": "Abonnement",
    "cat.gift": "Carte cadeau",
    "cat.diamonds": "Diamants",
    "cat.uc": "UC",
    "cat.coins": "Coins",
    "cat.topup": "Recharge",
    "product.from": "Dès",
    "v.month.one": "{n} mois",
    "v.month.other": "{n} mois",
    "g.sub": "Abonnement mensuel",
    "g.gift": "Cartes cadeaux",

    "f.email": "Votre e-mail (compte à recharger ou livraison du code)",
    "f.note": "Note ou instructions",
    "f.playerId": "ID / UID du compte de jeu",
    "f.playerName": "Nom d'utilisateur en jeu",
    "f.meruId": "E-mail ou nom d'utilisateur Méru",
    "f.wiseId": "E-mail Wise ou @Wisetag",
    "f.optional": "facultatif",

    "co.pick": "Choisir un pack",
    "co.info": "Informations nécessaires",
    "co.total": "Total",
    "co.pickPkg": "Choisissez un pack",
    "co.pickAmount": "Saisissez un montant",
    "co.confirm": "Confirmer la commande",
    "co.minNote": "Plus petit pack disponible : {label} ({price}).",
    "co.customLabel": "Montant que vous voulez acheter (USD)",
    "co.customHint": "Minimum {min} $ – Maximum {max} $ · 1 $ = {rate} HTG",
    "co.customErr": "Saisissez un montant entre {min} $ et {max} $.",
    "co.loginFirst": "Connectez-vous avant d'acheter.",
    "co.fillField": "Remplissez le champ « {label} ».",
    "co.saved": "Commande enregistrée. Nous la traitons rapidement.",
    "co.fail": "Impossible d'enregistrer la commande. Réessayez.",
    "co.unknown": "Ce produit n'existe pas.",
    "co.back": "Retour au tableau de bord",

    "dash.hello": "Bonjour, {name}",
    "dash.client": "Client",
    "dash.balance": "Solde disponible",
    "dash.orders": "Commandes totales",
    "dash.pending": "En attente",
    "dash.buy": "Acheter",
    "dash.topup": "Recharger mon solde",
    "dash.pickMethod": "Choisissez un moyen de recharge ci-dessus.",
    "dash.number": "Numéro : {n}",
    "dash.recent": "Commandes récentes",
    "dash.empty": "Aucune commande pour le moment. Choisissez un produit ci-dessus pour commencer.",
    "pay.instr": "Envoyez le montant au numéro {name} de Global Store ci-dessus, puis remplissez le formulaire avec les informations de la transaction.",
    "dep.name": "Nom complet de la personne qui a envoyé l'argent",
    "dep.phone": "Numéro de téléphone utilisé pour l'envoi",
    "dep.amount": "Montant envoyé (HTG)",
    "dep.ref": "Référence / ID de transaction reçu par SMS",
    "dep.submit": "Confirmer la recharge",
    "dep.errName": "Indiquez le nom de la personne qui a envoyé l'argent.",
    "dep.errPhone": "Indiquez le numéro de téléphone utilisé pour l'envoi.",
    "dep.errAmount": "Indiquez un montant valide.",
    "dep.errRef": "Indiquez la référence / l'ID de la transaction.",
    "dep.ok": "Demande envoyée. Votre solde sera crédité après vérification.",
    "dep.fail": "Impossible d'envoyer la demande. Réessayez.",
    "col.product": "Produit",
    "col.date": "Date",
    "col.amount": "Montant",
    "col.status": "Statut",
    "status.pending": "En attente",
    "status.delivered": "Livré",
  },

  // ------------------------------------------------------------------ EN
  en: {
    "lang.label": "Language",
    "cur.label": "Currency",
    "common.loading": "Loading…",

    "nav.catalog": "Catalog",
    "nav.how": "How it works",
    "nav.login": "Log in",
    "nav.signup": "Sign up",
    "nav.about": "About",
    "nav.dashboard": "Dashboard",
    "nav.logout": "Log out",

    "title.home": "Global Store – Gift cards, subscriptions and top-ups",
    "title.register": "Sign up – Global Store",
    "title.dashboard": "Dashboard – Global Store",
    "title.checkout": "Buy – Global Store",

    "hero.p": "Gift cards, subscriptions and game top-ups, delivered in minutes. One place for everything.",
    "hero.start": "Get started",
    "hero.catalog": "Browse the catalog",
    "home.catalog": "What you'll find with us",
    "how.title": "Ordering takes three steps",
    "how.1.t": "Create your account",
    "how.1.d": "Free sign-up with your e-mail.",
    "how.2.t": "Choose and pay",
    "how.2.d": "Pick the card or top-up, then pay for your order.",
    "how.3.t": "Receive your product",
    "how.3.d": "The code or top-up arrives directly in your account.",
    "why.title": "Why Global Store",
    "why.p1": "We bring together the most requested cards and top-ups so you don't have to look elsewhere. Every order is tracked from your account.",
    "why.p2": "Our team is available if a code has a problem or a top-up is late. You always know where your order stands.",
    "cta.title": "Ready to top up?",
    "cta.btn": "Create my account",
    "footer.signup": "Sign up",

    "auth.side.title": "Join Global Store.",
    "auth.side.p": "One account to track all your orders.",
    "auth.show": "Show",
    "reg.title": "Create an account",
    "reg.sub": "Free, ready in under a minute.",
    "reg.name": "Full name",
    "reg.email": "E-mail",
    "reg.password": "Password",
    "reg.confirm": "Confirm password",
    "reg.submit": "Create my account",
    "reg.have": "Already registered?",
    "reg.login": "Log in",

    "cat.sub": "Subscription",
    "cat.gift": "Gift card",
    "cat.diamonds": "Diamonds",
    "cat.uc": "UC",
    "cat.coins": "Coins",
    "cat.topup": "Top-up",
    "product.from": "From",
    "v.month.one": "{n} month",
    "v.month.other": "{n} months",
    "g.sub": "Monthly subscription",
    "g.gift": "Gift cards",

    "f.email": "Your e-mail (account to top up or code delivery)",
    "f.note": "Note or instructions",
    "f.playerId": "Game account ID / UID",
    "f.playerName": "In-game username",
    "f.meruId": "Méru e-mail or username",
    "f.wiseId": "Wise e-mail or @Wisetag",
    "f.optional": "optional",

    "co.pick": "Choose a package",
    "co.info": "Required information",
    "co.total": "Total",
    "co.pickPkg": "Choose a package",
    "co.pickAmount": "Enter an amount",
    "co.confirm": "Confirm order",
    "co.minNote": "Smallest package available: {label} ({price}).",
    "co.customLabel": "Amount you want to buy (USD)",
    "co.customHint": "Minimum {min} $ – Maximum {max} $ · 1 $ = {rate} HTG",
    "co.customErr": "Enter an amount between {min} $ and {max} $.",
    "co.loginFirst": "Please log in before buying.",
    "co.fillField": "Please fill in the field “{label}”.",
    "co.saved": "Order saved. We're processing it shortly.",
    "co.fail": "We couldn't save your order. Please try again.",
    "co.unknown": "This product doesn't exist.",
    "co.back": "Back to the dashboard",

    "dash.hello": "Hello, {name}",
    "dash.client": "Customer",
    "dash.balance": "Available balance",
    "dash.orders": "Total orders",
    "dash.pending": "Pending",
    "dash.buy": "Buy",
    "dash.topup": "Top up my balance",
    "dash.pickMethod": "Choose a top-up method above.",
    "dash.number": "Number: {n}",
    "dash.recent": "Recent orders",
    "dash.empty": "No orders yet. Pick a product above to get started.",
    "pay.instr": "Send the amount to Global Store's {name} number above, then fill in the form with the transaction details.",
    "dep.name": "Full name of the person who sent the money",
    "dep.phone": "Phone number used to send the money",
    "dep.amount": "Amount sent (HTG)",
    "dep.ref": "Transaction reference / ID from the SMS",
    "dep.submit": "Confirm top-up",
    "dep.errName": "Enter the name of the person who sent the money.",
    "dep.errPhone": "Enter the phone number used to send the money.",
    "dep.errAmount": "Enter a valid amount.",
    "dep.errRef": "Enter the transaction reference / ID.",
    "dep.ok": "Request sent. Your balance will be credited after verification.",
    "dep.fail": "We couldn't send the request. Please try again.",
    "col.product": "Product",
    "col.date": "Date",
    "col.amount": "Amount",
    "col.status": "Status",
    "status.pending": "Pending",
    "status.delivered": "Delivered",
  },

  // ------------------------------------------------------------------ HT
  ht: {
    "lang.label": "Lang",
    "cur.label": "Lajan",
    "common.loading": "Ap chaje…",

    "nav.catalog": "Katalòg",
    "nav.how": "Kijan sa mache",
    "nav.login": "Konekte",
    "nav.signup": "Kreye yon kont",
    "nav.about": "Konsènan nou",
    "nav.dashboard": "Dashboard",
    "nav.logout": "Dekonekte",

    "title.home": "Global Store – Kat kado, abònman ak rechaj",
    "title.register": "Kreye yon kont – Global Store",
    "title.dashboard": "Dashboard – Global Store",
    "title.checkout": "Achte – Global Store",

    "hero.p": "Kat kado, abònman ak rechaj jwèt, livre nan kèk minit. Yon sèl kote pou tout bagay.",
    "hero.start": "Kòmanse",
    "hero.catalog": "Gade katalòg la",
    "home.catalog": "Sa w ap jwenn nan men nou",
    "how.title": "Kòmande pran twa etap",
    "how.1.t": "Kreye kont ou",
    "how.1.d": "Enskripsyon an gratis avèk e-mail ou.",
    "how.2.t": "Chwazi epi peye",
    "how.2.d": "Chwazi kat la oswa rechaj la, apre sa peye kòmand ou.",
    "how.3.t": "Resevwa pwodui w",
    "how.3.d": "Kòd la oswa rechaj la rive dirèkteman sou kont ou.",
    "why.title": "Poukisa Global Store",
    "why.p1": "Nou rasanble kat ak rechaj ki pi mande yo pou ou pa bezwen chèche yon lòt kote. Nou swiv chak kòmand depi sou kont ou.",
    "why.p2": "Ekip nou toujou disponib si yon kòd gen pwoblèm oswa si yon rechaj pran reta. W toujou konnen kote kòmand ou rive.",
    "cta.title": "Pare pou rechaje?",
    "cta.btn": "Kreye kont mwen",
    "footer.signup": "Enskripsyon",

    "auth.side.title": "Rejwenn Global Store.",
    "auth.side.p": "Yon sèl kont pou swiv tout kòmand ou yo.",
    "auth.show": "Montre",
    "reg.title": "Kreye yon kont",
    "reg.sub": "Gratis, pare nan mwens pase yon minit.",
    "reg.name": "Non konplè",
    "reg.email": "E-mail",
    "reg.password": "Modpas",
    "reg.confirm": "Konfime modpas la",
    "reg.submit": "Kreye kont mwen",
    "reg.have": "Ou gen yon kont deja?",
    "reg.login": "Konekte",

    "cat.sub": "Abònman",
    "cat.gift": "Kat kado",
    "cat.diamonds": "Dyaman",
    "cat.uc": "UC",
    "cat.coins": "Coins",
    "cat.topup": "Rechaj",
    "product.from": "Depi",
    "v.month.one": "{n} mwa",
    "v.month.other": "{n} mwa",
    "g.sub": "Abònman pa mwa",
    "g.gift": "Kat kado",

    "f.email": "E-mail ou (kont pou rechaje oswa kote nou voye kòd la)",
    "f.note": "Nòt oswa enstriksyon",
    "f.playerId": "ID / UID kont jwèt la",
    "f.playerName": "Non itilizatè nan jwèt la",
    "f.meruId": "E-mail oswa non itilizatè Méru",
    "f.wiseId": "E-mail Wise oswa @Wisetag ou",
    "f.optional": "opsyonèl",

    "co.pick": "Chwazi yon pake",
    "co.info": "Enfòmasyon nesesè",
    "co.total": "Total",
    "co.pickPkg": "Chwazi yon pake",
    "co.pickAmount": "Antre yon montan",
    "co.confirm": "Konfime kòmand lan",
    "co.minNote": "Pi piti pake disponib : {label} ({price}).",
    "co.customLabel": "Montan ou vle achte (USD)",
    "co.customHint": "Minimòm {min} $ – Maksimòm {max} $ · 1 $ = {rate} HTG",
    "co.customErr": "Antre yon montan ant {min} $ ak {max} $.",
    "co.loginFirst": "Konekte w anvan w achte.",
    "co.fillField": "Ranpli chan « {label} » la.",
    "co.saved": "Kòmand ou anrejistre. N ap trete li talè.",
    "co.fail": "Nou pa t kapab anrejistre kòmand lan. Eseye ankò.",
    "co.unknown": "Pwodui sa a pa egziste.",
    "co.back": "Retounen nan dashboard la",

    "dash.hello": "Bonjou, {name}",
    "dash.client": "Kliyan",
    "dash.balance": "Solde disponib",
    "dash.orders": "Total kòmand",
    "dash.pending": "An atant",
    "dash.buy": "Achte",
    "dash.topup": "Rechaje solde m",
    "dash.pickMethod": "Chwazi yon mwayen rechaj ki anwo a.",
    "dash.number": "Nimewo : {n}",
    "dash.recent": "Dènye kòmand yo",
    "dash.empty": "Pa gen kòmand pou kounye a. Chwazi yon pwodui anwo a pou kòmanse.",
    "pay.instr": "Voye montan an sou nimewo {name} Global Store anwo a, epi ranpli fòmilè a avèk enfòmasyon tranzaksyon an.",
    "dep.name": "Non konplè moun ki voye lajan an",
    "dep.phone": "Nimewo telefòn ou te voye lajan an avè l",
    "dep.amount": "Montan ou voye (HTG)",
    "dep.ref": "Referans/ID tranzaksyon ou resevwa nan SMS",
    "dep.submit": "Konfime rechaj la",
    "dep.errName": "Mete non moun ki voye lajan an.",
    "dep.errPhone": "Mete nimewo telefòn ki voye lajan an.",
    "dep.errAmount": "Mete yon montan valid.",
    "dep.errRef": "Mete referans/ID tranzaksyon an.",
    "dep.ok": "Demann lan voye. Solde w ap kredite apre verifikasyon.",
    "dep.fail": "Nou pa t kapab voye demann lan. Eseye ankò.",
    "col.product": "Pwodui",
    "col.date": "Dat",
    "col.amount": "Montan",
    "col.status": "Estati",
    "status.pending": "An atant",
    "status.delivered": "Livre",
  },
};

// ---------------------------------------------------------------------
export function getLang() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && DICT[saved]) return saved;
  } catch {}
  const nav = (navigator.language || "fr").slice(0, 2).toLowerCase();
  return DICT[nav] ? nav : "fr";
}

export function t(key, vars = {}, lang = getLang()) {
  const str = DICT[lang]?.[key] ?? DICT.fr[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

export const getLocale = () => LOCALES[getLang()];

export function formatDate(ts) {
  if (!ts) return "—";
  const lang = getLang();
  const opts = lang === "ht"
    ? { day: "2-digit", month: "2-digit", year: "numeric" }
    : { day: "2-digit", month: "short", year: "numeric" };
  return new Date(ts).toLocaleDateString(getLocale(), opts);
}

export function applyI18n(root = document) {
  document.documentElement.lang = getLang();
  root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
}

export function setLang(code) {
  if (!DICT[code]) return;
  try { localStorage.setItem(KEY, code); } catch {}
  applyI18n();
  window.dispatchEvent(new CustomEvent("gs:langchange", { detail: code }));
}

export const onLangChange = (fn) => window.addEventListener("gs:langchange", () => fn(getLang()));

export function wireLangSelect(selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = Object.entries(LANGS)
    .map(([code, label]) => `<option value="${code}" title="${LANG_NAMES[code]}">${label}</option>`)
    .join("");
  selectEl.value = getLang();
  selectEl.addEventListener("change", () => setLang(selectEl.value));
}

function boot() {
  applyI18n();
  wireLangSelect(document.getElementById("langSelect"));
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();