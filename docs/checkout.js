import {
  USD_HTG, getProduct, formatPrice, wireCurrencySelect,
  iconHTML, catLabel, variantLabel, customPriceHTG, fieldsFor, fieldLabel, isRequired,
} from "./catalog.js";
import { t, onLangChange } from "./i18n.js";

// Menm konfigirasyon Firebase ak lòt paj yo.
const firebaseConfig = {
  apiKey: "AIzaSyDxN2jYclFAeSh9tMvkoeZCTsFvWNQYOzA",
  authDomain: "ns4supportplus.firebaseapp.com",
  projectId: "ns4supportplus",
  storageBucket: "ns4supportplus.firebasestorage.app",
  messagingSenderId: "1072291248908",
  appId: "1:1072291248908:web:711d01129b833847c5a729",
  measurementId: "G-DEYNQ8GQ9B"
};

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const product = getProduct(params.get("product") || "");
const msg = $("msg");
const say = (text, ok = false) => {
  msg.textContent = text;
  msg.className = `msg ${ok ? "ok" : "err"}`;
};

if (!product) {
  document.querySelector("main").innerHTML =
    `<p class="empty">${t("co.unknown")} <a href="dashboard.html">${t("co.back")}</a>.</p>`;
  throw new Error("produit inconnu");
}

const C = product.custom || null; // { minUSD, maxUSD, presets } pou Méru ak Wise
const isSub = product.kind === "subscription";
const wantedMode = params.get("mode");
let mode = isSub ? (product.modes.includes(wantedMode) ? wantedMode : product.modes[0]) : "new"; // "profile" | "new" | "renew"
let currentCurrency = "HTG";
let selectedVariant = C ? null : product.variants[0];
let customValue = "";
const prefill = { email: params.get("email") || "", username: params.get("username") || "" };

// --- Seleksyon aktyèl la -------------------------------------------------
function getSelection() {
  if (C) {
    const n = Number(String(customValue).replace(",", "."));
    if (!customValue.trim() || !Number.isFinite(n) || n < C.minUSD || n > C.maxUSD) return null;
    const amount = Math.round(n * 100) / 100;
    return { id: "custom", label: `${amount} $`, storeLabel: `${amount} $`, amountUSD: amount, priceHTG: customPriceHTG(amount) };
  }
  if (!selectedVariant) return null;
  return {
    id: selectedVariant.id,
    label: variantLabel(selectedVariant),
    storeLabel: variantLabel(selectedVariant, "ht"), // menm lang ak ansyen kòmand yo
    priceHTG: selectedVariant.priceHTG,
    months: selectedVariant.type === "months" ? selectedVariant.n : undefined,
  };
}

// --- Rendu ---------------------------------------------------------------
function renderHead() {
  document.title = `${product.name} – Global Store`;
  $("pIcon").innerHTML = iconHTML(product);
  $("pName").textContent = product.name;
  $("pCat").textContent = catLabel(product);
}

function renderMode() {
  $("modeBlock").hidden = !isSub;
  if (!isSub) return;
  $("modeWrap").innerHTML = product.modes.map((m) =>
    `<button type="button" class="${m === mode ? "active" : ""}" data-mode="${m}" aria-pressed="${m === mode}">${t(`mode.${m}`)}</button>`).join("");
  $("modeWrap").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    if (mode === b.dataset.mode) return;
    mode = b.dataset.mode;
    renderMode();
    renderFields();
  }));
}

function renderPackages(code) {
  if (code) currentCurrency = code;
  const list = $("variantList");
  const note = $("minNote");
  const title = $("pickTitle");

  if (C) {
    title.textContent = t("co.customLabel");
    list.innerHTML = `
      <div class="amount-box">
        <div class="amount-input">
          <span aria-hidden="true">$</span>
          <input id="customAmount" type="number" inputmode="decimal" min="${C.minUSD}" max="${C.maxUSD}" step="0.01"
                 placeholder="${C.minUSD} – ${C.maxUSD}" aria-label="${t("co.customLabel")}" value="${customValue}">
        </div>
        <div class="chips">
          ${C.presets.map((n) => `<button type="button" class="chip" data-v="${n}">${n} $</button>`).join("")}
        </div>
      </div>`;
    const input = $("customAmount");
    input.addEventListener("input", () => { customValue = input.value; updateSummary(); });
    list.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        customValue = chip.dataset.v;
        input.value = customValue;
        updateSummary();
      });
    });
    note.textContent = t("co.customHint", { min: C.minUSD, max: C.maxUSD, rate: USD_HTG });
  } else {
    title.textContent = t("co.pick");
    list.innerHTML = product.variants.map((v) => `
      <label class="variant${v.id === selectedVariant.id ? " selected" : ""}">
        <input type="radio" name="variant" value="${v.id}" ${v.id === selectedVariant.id ? "checked" : ""}>
        <span class="v-label">${variantLabel(v)}</span>
        <span class="v-price">${formatPrice(v.priceHTG, currentCurrency)}</span>
      </label>`).join("");
    list.querySelectorAll('input[name="variant"]').forEach((r) => {
      r.addEventListener("change", () => {
        selectedVariant = product.variants.find((v) => v.id === r.value);
        list.querySelectorAll(".variant").forEach((el) => el.classList.toggle("selected", el.contains(r) && r.checked));
        updateSummary();
      });
    });
    const min = product.variants.reduce((a, b) => (a.priceHTG <= b.priceHTG ? a : b));
    note.textContent = t("co.minNote", { label: variantLabel(min), price: formatPrice(min.priceHTG, currentCurrency) });
  }
  updateSummary();
}

function updateSummary() {
  const sel = getSelection();
  $("summaryName").textContent = sel ? `${product.name} — ${sel.label}` : t(C ? "co.pickAmount" : "co.pickPkg");
  $("summaryPrice").textContent = sel ? formatPrice(sel.priceHTG, currentCurrency) : "—";
  document.querySelectorAll(".chip").forEach((chip) =>
    chip.classList.toggle("active", Number(chip.dataset.v) === Number(customValue)));
}

function renderFields() {
  // Kenbe sa itilizatè a te deja ekri lè mòd la chanje.
  const old = {};
  product.fields.forEach((f) => { const el = $(`f_${f.id}`); if (el) old[f.id] = el.value; });
  for (const key of ["email", "username"]) if (prefill[key] && old[key] === undefined) old[key] = prefill[key];

  $("fieldsWrap").innerHTML = fieldsFor(product, mode).map((f) => {
    const attrs = `id="f_${f.id}" type="${f.type}" ${isRequired(f, mode) ? "required" : ""}` +
      ` autocomplete="${f.type === "email" ? "email" : f.type === "password" ? "off" : "off"}"` +
      (f.id === "identifier" || f.id === "username" || f.type === "email" ? ' autocapitalize="none" spellcheck="false"' : "");
    const input = f.type === "password"
      ? `<div class="pw"><input ${attrs}><button type="button" data-toggle="f_${f.id}"></button></div>`
      : `<input ${attrs}>`;
    return `<label for="f_${f.id}" id="l_${f.id}"></label>${input}`;
  }).join("");

  for (const f of fieldsFor(product, mode)) if (old[f.id] !== undefined) $(`f_${f.id}`).value = old[f.id];
  document.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => {
    const input = $(b.dataset.toggle);
    input.type = input.type === "password" ? "text" : "password";
    b.textContent = t(input.type === "password" ? "auth.show" : "auth.hide");
  }));
  updateFieldLabels();

  renderNotes();
}

function renderNotes() {
  if (!isSub) { $("subNotes").innerHTML = ""; return; }
  $("subNotes").innerHTML = mode === "profile"
    ? `<p class="min-note">${t("sub.profileNote")}</p>`
    : `<p class="min-note">${t("sub.ownerNote")}</p><p class="min-note">${t("sub.pwNote")}</p>`;
}

function updateFieldLabels() {
  for (const f of fieldsFor(product, mode)) {
    $(`l_${f.id}`).textContent = fieldLabel(f, mode) + (isRequired(f, mode) ? "" : ` (${t("f.optional")})`);
  }
  document.querySelectorAll("[data-toggle]").forEach((b) => {
    b.textContent = t($(b.dataset.toggle).type === "password" ? "auth.show" : "auth.hide");
  });
  renderNotes();
}

// --- Main ----------------------------------------------------------------
async function main() {
  renderHead();
  renderMode();
  renderFields();
  wireCurrencySelect($("currencySelect"), renderPackages);
  onLangChange(() => {
    renderHead();
    renderMode();
    updateFieldLabels();
    renderPackages();
    msg.textContent = "";
  });

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const A = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
  const F = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);

  let currentUser = null;
  A.onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Pa gen moun ki konekte : voye yo konekte, yo ka retounen achte apre.
      location.href = "connexion.html";
      return;
    }
    currentUser = user;
  });

  $("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) { say(t("co.loginFirst")); return; }

    const sel = getSelection();
    if (!sel) {
      say(C ? t("co.customErr", { min: C.minUSD, max: C.maxUSD }) : t("co.pickPkg"));
      $("customAmount")?.focus();
      return;
    }

    const fieldValues = {};
    for (const f of fieldsFor(product, mode)) {
      const input = $(`f_${f.id}`);
      const value = input.value.trim();
      const badEmail = f.type === "email" && value && !input.validity.valid;
      if ((isRequired(f, mode) && !value) || badEmail) {
        say(t("co.fillField", { label: fieldLabel(f, mode) }));
        input.focus();
        return;
      }
      fieldValues[f.id] = f.type === "password" ? input.value : value; // modpas la pa koupe
    }

    const btn = $("submitBtn");
    btn.disabled = true;
    try {
      // Kòmand lan kreye "en attente de paiement" → peman an fèt sou paiement.html
      const ref = await F.addDoc(F.collection(db, "orders"), {
        uid: currentUser.uid,
        productId: product.id,
        product: product.name,
        kind: product.kind,
        variantId: sel.id,
        variantLabel: sel.storeLabel,
        amount: sel.priceHTG,
        ...(sel.amountUSD ? { amountUSD: sel.amountUSD, rateUSD: USD_HTG } : {}),
        ...(isSub ? { months: sel.months, mode } : {}),
        fields: fieldValues,
        status: "en attente de paiement",
        createdAt: Date.now(),
      });
      say(t("co.redirect"), true);
      setTimeout(() => (location.href = `paiement.html?order=${ref.id}`), 500);
    } catch {
      say(t("co.fail"));
      btn.disabled = false;
    }
  });
}

main();