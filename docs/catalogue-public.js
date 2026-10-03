import { wireCurrencySelect, renderProducts } from "./catalog.js";

document.addEventListener("DOMContentLoaded", () => {
  wireCurrencySelect(document.getElementById("currencySelect"), (code) => {
    renderProducts(document.getElementById("productGrid"), code, () => {
      // Visiteur non connecté : on l'envoie créer un compte pour acheter.
      location.href = "inscription.html";
    });
  });
});
