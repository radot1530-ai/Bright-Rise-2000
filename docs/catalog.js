// ======================================================================
// Catalogue partagé (produits, devises, moyens de recharge) — Global Store
// Utilisé par dashboard.html et index.html.
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
const ICONS = {
  giftcard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="8" width="18" height="12" rx="1"/><path d="M3 12h18"/><path d="M12 8v12"/><path d="M12 8c-1.5-3-5.5-3-5.5 0S10.5 11 12 8z"/><path d="M12 8c1.5-3 5.5-3 5.5 0S13.5 11 12 8z"/></svg>`,
  game: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 10v4M5 12h4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18.5" cy="14" r="1" fill="currentColor" stroke="none"/></svg>`,
  wallet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="17" cy="14.5" r="1" fill="currentColor" stroke="none"/></svg>`,
};

// --- Catalogue -----------------------------------------------------------
// Chaque produit : { id, name, cat (libellé affiché), icon (clé ICONS),
// img (URL https:// optionnelle — remplace l'icône si fournie), priceHTG }.
// NOTE SUR LES IMAGES : par défaut "img" est vide et une icône maison
// (sans logo de marque) est utilisée, pour éviter d'intégrer des logos
// officiels (Netflix, PUBG, etc.) sans autorisation. Pour afficher le
// vrai logo d'un service, héberge l'image toi-même (ou via un CDN que tu
// as le droit d'utiliser) et colle son URL dans "img", par ex. :
//   img: "https://tonsite.com/logos/netflix.png"
export const PRODUCTS = [
  { id: "netflix", name: "Netflix", cat: "Carte cadeau", icon: "giftcard", img: "", priceHTG: 2000 },
  { id: "prime-video", name: "Prime Video", cat: "Carte cadeau", icon: "giftcard", img: "", priceHTG: 1500 },
  { id: "free-fire", name: "Free Fire", cat: "Diamants", icon: "game", img: "", priceHTG: 650 },
  { id: "pubg", name: "PUBG", cat: "UC", icon: "game", img: "", priceHTG: 700 },
  { id: "efootball", name: "eFootball", cat: "Coins", icon: "game", img: "", priceHTG: 650 },
  { id: "dls", name: "DLS", cat: "Diamants", icon: "game", img: "", priceHTG: 500 },
  { id: "meru", name: "Méru", cat: "Recharge", icon: "game", img: "", priceHTG: 500 },
];

// --- Moyens de recharge du solde -----------------------------------------
// Même règle pour "img" que pour les produits : vide par défaut, une icône
// maison est utilisée ; colle l'URL du vrai logo si tu as le droit de l'utiliser.
export const PAYMENT_METHODS = [
  {
    id: "moncash",
    name: "MonCash",
    sub: "Digicel",
    img: "",
    instructions: "Envoie le montant au numéro MonCash de Global Store, puis indique la référence reçue par SMS ci-dessous.",
  },
  {
    id: "natcash",
    name: "NatCash",
    sub: "Natcom",
    img: "",
    instructions: "Envoie le montant au numéro NatCash de Global Store, puis indique la référence reçue par SMS ci-dessous.",
  },
];

// --- Rendu du catalogue en grille -----------------------------------------
// container: élément DOM. onBuy(product): appelé au clic sur une carte.
export function renderProducts(container, currencyCode, onBuy) {
  container.innerHTML = PRODUCTS.map((p) => `
    <button class="product-card" data-id="${p.id}">
      <span class="product-icon">${p.img ? `<img src="${p.img}" alt="${p.name}">` : ICONS[p.icon] || ""}</span>
      <span class="product-name">${p.name}</span>
      <span class="product-cat">${p.cat}</span>
      <span class="product-price">${formatPrice(p.priceHTG, currencyCode)}</span>
    </button>`).join("");
  if (onBuy) {
    container.querySelectorAll(".product-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const product = PRODUCTS.find((p) => p.id === btn.dataset.id);
        onBuy(product);
      });
    });
  }
}

// --- Rendu des moyens de recharge -----------------------------------------
// container: élément DOM. onSelect(method): appelé au clic sur une carte.
export function renderPaymentMethods(container, onSelect) {
  container.innerHTML = PAYMENT_METHODS.map((m) => `
    <button class="pay-card" data-id="${m.id}">
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
