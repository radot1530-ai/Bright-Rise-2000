import { ICONS, getProduct, formatPrice, wireCurrencySelect } from "./catalog.js";

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
const say = (t, ok = false) => { msg.textContent = t; msg.style.color = ok ? "#fff" : "#ff8a8a"; };

if (!product) {
  document.querySelector("main").innerHTML = `<p class="empty">Pwodui sa a pa egziste. <a href="dashboard.html">Retounen nan dashboard la</a>.</p>`;
  throw new Error("produit inconnu");
}

let currentCurrency = "HTG";
let selectedVariant = product.variants[0];

function renderHead() {
  document.title = `${product.name} – Global Store`;
  document.getElementById("pIcon").innerHTML = product.img ? `<img src="${product.img}" alt="${product.name}">` : ICONS[product.icon] || "";
  document.getElementById("pName").textContent = product.name;
  document.getElementById("pCat").textContent = product.cat;
}

function renderVariants(code) {
  currentCurrency = code;
  const list = document.getElementById("variantList");
  list.innerHTML = product.variants.map((v) => `
    <div class="variant">
      <label>
        <input type="radio" name="variant" value="${v.id}" ${v.id === selectedVariant.id ? "checked" : ""}>
        ${v.label}
      </label>
      <span class="v-price">${formatPrice(v.priceHTG, code)}</span>
    </div>`).join("");
  list.querySelectorAll('input[name="variant"]').forEach((r) => {
    r.addEventListener("change", () => {
      selectedVariant = product.variants.find((v) => v.id === r.value);
      updateSummary();
    });
  });
  document.getElementById("minNote").textContent =
    `Pi piti pake disponib : ${product.variants[0].label} (${formatPrice(product.variants[0].priceHTG, code)}).`;
  updateSummary();
}

function updateSummary() {
  document.getElementById("summaryName").textContent = `${product.name} — ${selectedVariant.label}`;
  document.getElementById("summaryPrice").textContent = formatPrice(selectedVariant.priceHTG, currentCurrency);
}

function renderFields() {
  const wrap = document.getElementById("fieldsWrap");
  wrap.innerHTML = product.fields.map((f) => `
    <label for="f_${f.id}">${f.label}${f.required ? "" : " (opsyonèl)"}</label>
    <input id="f_${f.id}" type="${f.type}" ${f.required ? "required" : ""}>`).join("");
}

async function main() {
  renderHead();
  renderFields();
  wireCurrencySelect(document.getElementById("currencySelect"), renderVariants);

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
    if (!currentUser) { say("Konekte w anvan w achte."); return; }

    const fieldValues = {};
    for (const f of product.fields) {
      const input = document.getElementById(`f_${f.id}`);
      if (f.required && !input.value.trim()) { say(`Ranpli chan "${f.label}" la.`); input.focus(); return; }
      fieldValues[f.id] = input.value.trim();
    }

    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    try {
      await F.addDoc(F.collection(db, "orders"), {
        uid: currentUser.uid,
        productId: product.id,
        product: product.name,
        variantId: selectedVariant.id,
        variantLabel: selectedVariant.label,
        amount: selectedVariant.priceHTG,
        fields: fieldValues,
        status: "en attente",
        createdAt: Date.now(),
      });
      say("Kòmand ou anrejistre. N ap trete li talè.", true);
      setTimeout(() => (location.href = "dashboard.html"), 900);
    } catch {
      say("Nou pa t kapab anrejistre kòmand lan. Eseye ankò.");
      btn.disabled = false;
    }
  });
}

main();