import { wireCurrencySelect, renderProducts, getCurrency } from "./catalog.js";
import { onLangChange } from "./i18n.js";

const grid = () => document.getElementById("productGrid");
// Vizitè ki pa konekte : nou voye yo kreye yon kont anvan yo achte.
const draw = (code) => renderProducts(grid(), code, () => "inscription.html");

function init() {
  wireCurrencySelect(document.getElementById("currencySelect"), draw);
  onLangChange(() => draw(getCurrency()));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
