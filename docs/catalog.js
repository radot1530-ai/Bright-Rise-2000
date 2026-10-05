// ======================================================================
// Catalogue partagé (produits, devises, moyens de recharge) — Global Store
// Utilisé par index.html, dashboard.html et checkout.html.
// ======================================================================

// --- Devises -----------------------------------------------------------
// Les prix sont stockés en HTG (gourde haïtienne), la devise de base.
// "rate" = combien vaut 1 HTG dans cette devise. Taux approximatifs
// (USD≈130,7 HTG, EUR≈149 HTG, FCFA≈4,40 HTG) — à ajuster régulièrement,
// par exemple en les remplaçant par un appel à une API de taux de change.
export const CURRENCIES = {
  HTG: { label: "HTG", name: "Gourde haïtienne", rate: 1, decimals: 0 },
  USD: { label: "USD", name: "Dollar américain", rate: 1 / 130.7, decimals: 2 },
  EUR: { label: "EUR", name: "Euro", rate: 1 / 149.0, decimals: 2 },
  FCFA: { label: "FCFA", name: "Franc CFA", rate: 4.403, decimals: 0 },
};

const CURRENCY_KEY = "gs_currency";
export const getCurrency = () => localStorage.getItem(CURRENCY_KEY) || "HTG";
export const setCurrency = (code) => localStorage.setItem(CURRENCY_KEY, code);

export function formatPrice(amountHTG, code = getCurrency()) {
  const c = CURRENCIES[code] || CURRENCIES.HTG;
  const value = amountHTG * c.rate;
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  }).format(value);
  return `${formatted} ${c.label}`;
}

// Branche un <select> de devise : affiche la devise active et relance
// renderFn (reçoit le code devise) à chaque changement.
export function wireCurrencySelect(selectEl, renderFn) {
  if (!selectEl) return;
  selectEl.innerHTML = Object.entries(CURRENCIES)
    .map(([code, c]) => `<option value="${code}">${c.label}</option>`)
    .join("");
  selectEl.value = getCurrency();
  renderFn(getCurrency());
  selectEl.addEventListener("change", () => {
    setCurrency(selectEl.value);
    renderFn(selectEl.value);
  });
}

// --- Icônes (SVG maison, pas de logo de marque — voir note plus bas) ---
export const ICONS = {
  giftcard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="8" width="18" height="12" rx="1"/><path d="M3 12h18"/><path d="M12 8v12"/><path d="M12 8c-1.5-3-5.5-3-5.5 0S10.5 11 12 8z"/><path d="M12 8c1.5-3 5.5-3 5.5 0S13.5 11 12 8z"/></svg>`,
  game: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 10v4M5 12h4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18.5" cy="14" r="1" fill="currentColor" stroke="none"/></svg>`,
  wallet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="17" cy="14.5" r="1" fill="currentColor" stroke="none"/></svg>`,
};

// --- Chan ki nesesè selon tip pwodui a ------------------------------------
// "giftcard" : sèvis tankou Netflix/Prime — nou bezwen imèl kont lan pou
// nou ka aplike/rechaje abònman an.
// "topup" : rechaj nan yon jwèt — nou bezwen ID/UID kont jwè a.
export const FIELD_SETS = {
  giftcard: [
    { id: "email", label: "E-mail kont lan (pou nou rechaje sèvis la)", type: "email", required: true },
    { id: "note", label: "Nòt oswa enstriksyon (opsyonèl)", type: "text", required: false },
  ],
  topup: [
    { id: "playerId", label: "ID / UID kont jwèt la", type: "text", required: true },
    { id: "playerName", label: "Non itilizatè nan jwèt la (opsyonèl)", type: "text", required: false },
  ],
};

// --- Katalòg ---------------------------------------------------------------
// Chak pwodui gen plizyè "variants" (pa gen yon sèl pri fiks) :
// { id, label, priceHTG }. Pri yo isit la se egzanp — ajiste yo selon
// founisè w. Pou kat kado (Netflix, Prime), pi piti pri a dwe omwen
// ekivalan 15 $ US (règ magazen an) ; pou rechaj jwèt yo, pi piti pake a
// chwazi espre pou li pa twò piti.
//
// NOTE SOU IMAJ YO : "img" vid pa default — yon icon fèt pa nou menm
// (san logo mak depoze) parèt nan plas li, pou nou pa itilize logo ofisyèl
// Netflix/PUBG/elatriye san otorizasyon. Pou mete vrè logo a, ebèje imaj la
// (sou Firebase Storage pa egzanp, oswa yon lòt CDN ou gen dwa itilize) epi
// kole lyen https:// li nan "img", pa egzanp :
//   img: "https://firebasestorage.googleapis.com/.../netflix.png"
export const PRODUCTS = [
  {
    id: "netflix", name: "Netflix", cat: "Abònman", icon: "giftcard", img: "",
    fields: FIELD_SETS.giftcard,
    variants: [
      { id: "1m", label: "1 mwa", priceHTG: 500 },
      { id: "2m", label: "2 mwa", priceHTG: 1000 },
      { id: "3m", label: "3 mwa", priceHTG: 1500 },
      { id: "6m", label: "6 mwa", priceHTG: 3000 },
      { id: "12m", label: "12 mwa", priceHTG: 6000 },
    ],
  },
  {
    id: "prime-video", name: "Prime Video", cat: "Kat kado", icon: "giftcard", img: "",
    fields: FIELD_SETS.giftcard,
    // Minimòm 15 $ US pou kat kado yo — konvèti an HTG ak CURRENCIES.USD.rate.
    variants: [
      { id: "15usd", label: "15 $", priceHTG: Math.round(15 / CURRENCIES.USD.rate) },
      { id: "20usd", label: "20 $", priceHTG: Math.round(20 / CURRENCIES.USD.rate) },
      { id: "25usd", label: "25 $", priceHTG: Math.round(25 / CURRENCIES.USD.rate) },
      { id: "50usd", label: "50 $", priceHTG: Math.round(50 / CURRENCIES.USD.rate) },
      { id: "100usd", label: "100 $", priceHTG: Math.round(100 / CURRENCIES.USD.rate) },
    ],
  },
  {
    id: "free-fire", name: "Free Fire", cat: "Diamants", icon: "game", img: "",
    fields: FIELD_SETS.topup,
    variants: [
      { id: "100", label: "100 💎", priceHTG: 150 },
      { id: "310", label: "310 💎", priceHTG: 450 },
      { id: "520", label: "520 💎", priceHTG: 750 },
      { id: "1060", label: "1060 💎", priceHTG: 1500 },
    ],
  },
  {
    id: "pubg", name: "PUBG", cat: "UC", icon: "game", img: "",
    fields: FIELD_SETS.topup,
    variants: [
      { id: "60", label: "60 UC", priceHTG: 150 },
      { id: "325", label: "325 UC", priceHTG: 750 },
      { id: "660", label: "660 UC", priceHTG: 1500 },
      { id: "1800", label: "1800 UC", priceHTG: 3750 },
    ],
  },
  {
    id: "efootball", name: "eFootball", cat: "Coins", icon: "game", img: "",
    fields: FIELD_SETS.topup,
    variants: [
      { id: "125", label: "125 coins", priceHTG: 150 },
      { id: "250", label: "250 coins", priceHTG: 300 },
      { id: "525", label: "525 coins", priceHTG: 600 },
      { id: "1050", label: "1050 coins", priceHTG: 1150 },
    ],
  },
  {
    id: "dls", name: "DLS", cat: "Diamants", icon: "game", img: "",
    fields: FIELD_SETS.topup,
    variants: [
      { id: "140", label: "140 💎", priceHTG: 150 },
      { id: "300", label: "300 💎", priceHTG: 300 },
      { id: "700", label: "700 💎", priceHTG: 650 },
    ],
  },
  {
    id: "meru", name: "Méru", cat: "Recharge", icon: "game", img: "",
    fields: FIELD_SETS.topup,
    variants: [
      { id: "petit", label: "Pake Piti", priceHTG: 150 },
      { id: "moyen", label: "Pake Mwayen", priceHTG: 300 },
      { id: "gwo", label: "Pake Gwo", priceHTG: 600 },
    ],
  },
];

export const getProduct = (id) => PRODUCTS.find((p) => p.id === id);
export const cheapestVariant = (p) => p.variants.reduce((a, b) => (a.priceHTG < b.priceHTG ? a : b));

// --- Moyens de recharge du solde -----------------------------------------
// Même règle pour "img" que pour les produits : vide par défaut, une icône
// maison est utilisée ; colle l'URL du vrai logo si tu as le droit de l'utiliser.
export const PAYMENT_METHODS = [
  {
    id: "moncash",
    name: "MonCash",
    sub: "Digicel",
    img: "",
    number: "+509 00 00 0000", // ranplase ak vrè nimewo MonCash biznis ou
    instructions: "Voye montan an sou nimewo MonCash Global Store anwo a, epi ranpli fòmilè a avèk enfòmasyon tranzaksyon an.",
  },
  {
    id: "natcash",
    name: "NatCash",
    sub: "Natcom",
    img: "",
    number: "+509 00 00 0000", // ranplase ak vrè nimewo NatCash biznis ou
    instructions: "Voye montan an sou nimewo NatCash Global Store anwo a, epi ranpli fòmilè a avèk enfòmasyon tranzaksyon an.",
  },
];

// --- Rendu du catalogue en grille -----------------------------------------
// container: élément DOM. hrefFor(product): string — lien de la carte.
export function renderProducts(container, currencyCode, hrefFor) {
  container.innerHTML = PRODUCTS.map((p) => `
    <a class="product-card" href="${hrefFor(p)}">
      <span class="product-icon">${p.img ? `<img src="${p.img}" alt="${p.name}">` : ICONS[p.icon] || ""}</span>
      <span class="product-name">${p.name}</span>
      <span class="product-cat">${p.cat}</span>
      <span class="product-price">Depi ${formatPrice(cheapestVariant(p).priceHTG, currencyCode)}</span>
    </a>`).join("");
}

// --- Rendu des moyens de recharge -----------------------------------------
// container: élément DOM. onSelect(method): appelé au clic sur une carte.
export function renderPaymentMethods(container, onSelect) {
  container.innerHTML = PAYMENT_METHODS.map((m) => `
    <button class="pay-card" data-id="${m.id}" type="button">
      <span class="pay-icon">${m.img ? `<img src="${m.img}" alt="${m.name}">` : ICONS.wallet}</span>
      <span>
        <span class="pay-name">${m.name}</span><br>
        <span class="pay-sub">${m.sub}</span>
      </span>
    </button>`).join("");
  container.querySelectorAll(".pay-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".pay-card").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const method = PAYMENT_METHODS.find((m) => m.id === btn.dataset.id);
      onSelect(method);
    });
  });
}
