import { wireCurrencySelect, renderProducts } from "./catalog.js";

document.addEventListener("DOMContentLoaded", () => {
  wireCurrencySelect(document.getElementById("currencySelect"), (code) => {
    // Vizitè ki pa konekte : nou voye yo kreye yon kont anvan yo achte.
    renderProducts(document.getElementById("productGrid"), code, () => "inscription.html");
  });
});

