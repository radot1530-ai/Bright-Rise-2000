// ======================================================================
// Katalòg pataje (pwodui, lajan, mwayen rechaj) — Global Store
// Itilize pa index.html, dashboard.html ak checkout.html.
// ======================================================================
import { t, getLocale } from "./i18n.js";

// --- Taux --------------------------------------------------------------
export const USD_HTG = 144; // 1 $ = 144 HTG

// --- Devises -----------------------------------------------------------
export const CURRENCIES = {
  HTG: { label: "HTG", name: "Gourde haïtienne", rate: 1, decimals: 0 },
  USD: { label: "USD", name: "Dollar américain", rate: 1 / USD_HTG, decimals: 2 },
  EUR: { label: "EUR", name: "Euro", rate: 1 / 149.0, decimals: 2 },
  FCFA: { label: "FCFA", name: "Franc CFA", rate: 4.403, decimals: 0 },
};

const CURRENCY_KEY = "gs_currency";
export const getCurrency = () => {
  try { return localStorage.getItem(CURRENCY_KEY) || "HTG"; } catch { return "HTG"; }
};
export const setCurrency = (code) => {
  try { localStorage.setItem(CURRENCY_KEY, code); } catch {}
};

export function formatPrice(amountHTG, code = getCurrency()) {
  const c = CURRENCIES[code] || CURRENCIES.HTG;
  const value = amountHTG * c.rate;
  const formatted = new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  }).format(value);
  return `${formatted} ${c.label}`;
}

export function wireCurrencySelect(selectEl, renderFn) {
  if (!selectEl) return;
  selectEl.innerHTML = Object.entries(CURRENCIES)
    .map(([code, c]) => `<option value="${code}" title="${c.name}">${c.label}</option>`)
    .join("");
  selectEl.value = getCurrency();
  renderFn(getCurrency());
  selectEl.addEventListener("change", () => {
    setCurrency(selectEl.value);
    renderFn(selectEl.value);
  });
}

// --- Icônes (fallback si l'image ne charge pas) ------------------------
export const ICONS = {
  giftcard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="8" width="18" height="12" rx="1"/><path d="M3 12h18"/><path d="M12 8v12"/><path d="M12 8c-1.5-3-5.5-3-5.5 0S10.5 11 12 8z"/><path d="M12 8c1.5-3 5.5-3 5.5 0S13.5 11 12 8z"/></svg>`,
  game: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 10v4M5 12h4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18.5" cy="14" r="1" fill="currentColor" stroke="none"/></svg>`,
  wallet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="17" cy="14.5" r="1" fill="currentColor" stroke="none"/></svg>`,
  card: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/></svg>`,
  visa: `<svg viewBox="0 0 120 80" aria-hidden="true"><rect width="120" height="80" fill="#1434cb"/><text x="60" y="52" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="30" fill="#fff" letter-spacing="1">VISA</text></svg>`,
};

// Rann HTML ikòn nan : imaj lokal la, ak SVG kòm rezèv (CSS kache SVG a si imaj la chaje).
export const iconHTML = (item, fallbackIcon = "card") =>
  `${item.img ? `<img src="${item.img}" alt="${item.name}" loading="lazy" decoding="async" onerror="this.remove()">` : ""}${ICONS[item.icon] || ICONS[fallbackIcon]}`;

// --- Chan ki nesesè selon tip pwodui a ---------------------------------
// label = kle tradiksyon (i18n.js)
export const FIELD_SETS = {
  giftcard: [
    { id: "email", label: "f.email", type: "email", required: true },
    { id: "note", label: "f.note", type: "text", required: false },
  ],
  topup: [
    { id: "playerId", label: "f.playerId", type: "text", required: true },
    { id: "playerName", label: "f.playerName", type: "text", required: false },
  ],
  meru: [
    { id: "identifier", label: "f.meruId", type: "text", required: true },
    { id: "note", label: "f.note", type: "text", required: false },
  ],
  wise: [
    { id: "identifier", label: "f.wiseId", type: "text", required: true },
    { id: "note", label: "f.note", type: "text", required: false },
  ],
};

// --- Pake yo -------------------------------------------------------------
const usd = (n) => Math.round(n * USD_HTG);
const months = (list) => list.map(([n, priceHTG]) => ({ id: `${n}m`, group: "sub", type: "months", n, priceHTG }));
const usdCards = (list) => list.map((n) => ({ id: `${n}usd`, group: "gift", type: "usd", amount: n, priceHTG: usd(n) }));
const raw = (list) => list.map(([id, label, priceHTG]) => ({ id, type: "raw", label, priceHTG }));

// Montan lib pou Méru ak Wise : minimòm 5 $, maksimòm 100 $.
const CUSTOM_USD = { minUSD: 5, maxUSD: 100, presets: [5, 10, 25, 50, 100] };

// --- Katalòg ---------------------------------------------------------------
export const PRODUCTS = [
  {
    id: "netflix", name: "Netflix", catKeys: ["cat.sub", "cat.gift"], icon: "giftcard", img: "netflix.png",
    fields: FIELD_SETS.giftcard,
    variants: [
      ...months([[1, 500], [2, 1000], [3, 1500], [6, 3000], [12, 6000]]),
      ...usdCards([15, 25, 50, 100]),
    ],
  },
  {
    id: "prime-video", name: "Prime Video", catKeys: ["cat.gift"], icon: "giftcard", img: "primevideo.jpg",
    fields: FIELD_SETS.giftcard,
    variants: usdCards([15, 20, 25, 50, 100]),
  },
  {
    id: "disney", name: "Disney+", catKeys: ["cat.gift"], icon: "giftcard", img: "disney.png",
    fields: FIELD_SETS.giftcard,
    variants: usdCards([25, 50, 100]),
  },
  {
    id: "visa", name: "Visa", catKeys: ["cat.gift"], icon: "visa", img: null,
    fields: FIELD_SETS.giftcard,
    variants: usdCards([10, 25, 50, 100]),
  },
  {
    id: "free-fire", name: "Free Fire", catKeys: ["cat.diamonds"], icon: "game", img: "freefire.jpg",
    fields: FIELD_SETS.topup,
    variants: raw([["100", "100 💎", 150], ["310", "310 💎", 450], ["520", "520 💎", 750], ["1060", "1060 💎", 1500]]),
  },
  {
    id: "pubg", name: "PUBG", catKeys: ["cat.uc"], icon: "game", img: "pubg.jpg",
    fields: FIELD_SETS.topup,
    variants: raw([["60", "60 UC", 150], ["325", "325 UC", 750], ["660", "660 UC", 1500], ["1800", "1800 UC", 3750]]),
  },
  {
    id: "efootball", name: "eFootball", catKeys: ["cat.coins"], icon: "game", img: "efootball.png",
    fields: FIELD_SETS.topup,
    variants: raw([["125", "125 coins", 150], ["250", "250 coins", 300], ["525", "525 coins", 600], ["1050", "1050 coins", 1150]]),
  },
  {
    id: "dls", name: "DLS", catKeys: ["cat.diamonds"], icon: "game", img: "dls.jpg",
    fields: FIELD_SETS.topup,
    variants: raw([["140", "140 💎", 150], ["300", "300 💎", 300], ["700", "700 💎", 650]]),
  },
  {
    id: "meru", name: "Méru", catKeys: ["cat.topup"], icon: "wallet", img: "meru.png",
    fields: FIELD_SETS.meru,
    custom: CUSTOM_USD,
    variants: [],
  },
  {
    id: "wise", name: "Wise", catKeys: ["cat.topup"], icon: "wallet", img: "wise.jpg",
    fields: FIELD_SETS.wise,
    custom: CUSTOM_USD,
    variants: [],
  },
];

export const getProduct = (id) => PRODUCTS.find((p) => p.id === id);
export const catLabel = (p) => p.catKeys.map((k) => t(k)).join(" · ");

export function variantLabel(v, lang) {
  if (v.type === "months") return t(v.n === 1 ? "v.month.one" : "v.month.other", { n: v.n }, lang);
  if (v.type === "usd") return `${v.amount} $`;
  return v.label;
}

export const customPriceHTG = (amountUSD) => Math.round(amountUSD * USD_HTG);

export function cheapestPriceHTG(p) {
  if (p.custom) return customPriceHTG(p.custom.minUSD);
  return Math.min(...p.variants.map((v) => v.priceHTG));
}

// --- Moyens de recharge du solde -----------------------------------------
export const PAYMENT_METHODS = [
  {
    id: "moncash", name: "MonCash", sub: "Digicel", img: "moncash.jpg",
    number: "+509 00 00 0000",
  },
  {
    id: "natcash", name: "NatCash", sub: "Natcom", img: "natcash.png",
    number: "+509 00 00 0000",
  },
];

// --- Rendu du catalogue en grille -----------------------------------------
export function renderProducts(container, currencyCode, hrefFor) {
  container.innerHTML = PRODUCTS.map((p) => `
    <a class="product-card" href="${hrefFor(p)}">
      <span class="product-icon">${iconHTML(p)}</span>
      <span class="product-body">
        <span class="product-name">${p.name}</span>
        <span class="product-cat">${catLabel(p)}</span>
        <span class="product-price">${t("product.from")} ${formatPrice(cheapestPriceHTG(p), currencyCode)}</span>
      </span>
    </a>`).join("");
}

// --- Rendu des moyens de recharge -----------------------------------------
export function renderPaymentMethods(container, onSelect) {
  container.innerHTML = PAYMENT_METHODS.map((m) => `
    <button class="pay-card" data-id="${m.id}" type="button">
      <span class="pay-icon">${iconHTML(m, "wallet")}</span>
      <span class="pay-text">
        <span class="pay-name">${m.name}</span>
        <span class="pay-sub">${m.sub}</span>
      </span>
    </button>`).join("");
  container.querySelectorAll(".pay-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".pay-card").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      onSelect(PAYMENT_METHODS.find((m) => m.id === btn.dataset.id));
    });
  });
}
