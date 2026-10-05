import {
  USD_HTG, getProduct, formatPrice, wireCurrencySelect,
  iconHTML, catLabel, variantLabel, customPriceHTG,
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

const params = new URLSearchParams(location.search);
const product = getProduct(params.get("product") || "");
const msg = document.getElementById("msg");
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
let currentCurrency = "HTG";
let selectedVariant = C ? null : product.variants[0];
let customValue = "";

// --- Seleksyon aktyèl la -------------------------------------------------
function getSelection() {
  if (C) {
    const n = Number(String(customValue).replace(",", "."));
    if (!customValue.trim() || !Number.isFinite(n) || n < C.minUSD || n > C.maxUSD) return null;
    const amount = Math.round(n * 100) / 100;
    return {
      id: "custom",
      label: `${amount} $`,
      storeLabel: `${amount} $`,
      amountUSD: amount,
      priceHTG: customPriceHTG(amount),
    };
  }
  if (!selectedVariant) return null;
  return {
    id: selectedVariant.id,
    label: variantLabel(selectedVariant),
    storeLabel: variantLabel(selectedVariant, "ht"), // menm lang ak ansyen kòmand yo
    priceHTG: selectedVariant.priceHTG,
  };
}

// --- Rendu ---------------------------------------------------------------
function renderHead() {
  document.title = `${product.name} – Global Store`;
  document.getElementById("pIcon").innerHTML = iconHTML(product);
  document.getElementById("pName").textContent = product.name;
  document.getElementById("pCat").textContent = catLabel(product);
}

function renderPackages(code) {
  if (code) currentCurrency = code;
  const list = document.getElementById("variantList");
  const note = document.getElementById("minNote");
  const title = document.getElementById("pickTitle");

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
    const input = document.getElementById("customAmount");
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
    const groups = [...new Set(product.variants.map((v) => v.group || "_"))];
    list.innerHTML = groups.map((g) => {
      const heading = groups.length > 1 ? `<h3 class="variant-group">${t(`g.${g}`)}</h3>` : "";
      const items = product.variants.filter((v) => (v.group || "_") === g).map((v) => `
        <label class="variant${v.id === selectedVariant.id ? " selected" : ""}">
          <input type="radio" name="variant" value="${v.id}" ${v.id === selectedVariant.id ? "checked" : ""}>
          <span class="v-label">${variantLabel(v)}</span>
          <span class="v-price">${formatPrice(v.priceHTG, currentCurrency)}</span>
        </label>`).join("");
      return heading + items;
    }).join("");
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
  document.getElementById("summaryName").textContent = sel
    ? `${product.name} — ${sel.label}`
    : t(C ? "co.pickAmount" : "co.pickPkg");
  document.getElementById("summaryPrice").textContent = sel ? formatPrice(sel.priceHTG, currentCurrency) : "—";
  document.querySelectorAll(".chip").forEach((chip) =>
    chip.classList.toggle("active", Number(chip.dataset.v) === Number(customValue)));
}

function renderFields() {
  document.getElementById("fieldsWrap").innerHTML = product.fields.map((f) => `
    <label for="f_${f.id}" id="l_${f.id}"></label>
    <input id="f_${f.id}" type="${f.type}" ${f.required ? "required" : ""}
           autocomplete="${f.type === "email" ? "email" : "off"}" ${f.id === "identifier" ? 'autocapitalize="none" spellcheck="false"' : ""}>`).join("");
  updateFieldLabels();
}

function updateFieldLabels() {
  for (const f of product.fields) {
    document.getElementById(`l_${f.id}`).textContent = t(f.label) + (f.required ? "" : ` (${t("f.optional")})`);
  }
}

// --- Main ----------------------------------------------------------------
async function main() {
  renderHead();
  renderFields();
  wireCurrencySelect(document.getElementById("currencySelect"), renderPackages);
  onLangChange(() => {
    renderHead();
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

  document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) { say(t("co.loginFirst")); return; }

    const sel = getSelection();
    if (!sel) {
      say(C ? t("co.customErr", { min: C.minUSD, max: C.maxUSD }) : t("co.pickPkg"));
      document.getElementById("customAmount")?.focus();
      return;
    }

    const fieldValues = {};
    for (const f of product.fields) {
      const input = document.getElementById(`f_${f.id}`);
      if (f.required && !input.value.trim()) {
        say(t("co.fillField", { label: t(f.label) }));
        input.focus();
        return;
      }
      fieldValues[f.id] = input.value.trim();
    }

    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    try {
      await F.addDoc(F.collection(db, "orders"), {
        uid: currentUser.uid,
        productId: product.id,
        product: product.name,
        variantId: sel.id,
        variantLabel: sel.storeLabel,
        amount: sel.priceHTG,
        ...(sel.amountUSD ? { amountUSD: sel.amountUSD, rateUSD: USD_HTG } : {}),
        fields: fieldValues,
        status: "en attente",
        createdAt: Date.now(),
      });
      say(t("co.saved"), true);
      setTimeout(() => (location.href = "dashboard.html"), 900);
    } catch {
      say(t("co.fail"));
      btn.disabled = false;
    }
  });
}

main();
