import { formatPrice, wireCurrencySelect, renderProducts, renderPaymentMethods } from "./catalog.js";

// Même configuration Firebase que dans auth.js — copiez-la ici aussi.
const firebaseConfig = {
    apiKey: "AIzaSyDxN2jYclFAeSh9tMvkoeZCTsFvWNQYOzA",
    authDomain: "ns4supportplus.firebaseapp.com",
    projectId: "ns4supportplus",
    storageBucket: "ns4supportplus.firebasestorage.app",
    messagingSenderId: "1072291248908",
    appId: "1:1072291248908:web:711d01129b833847c5a729",
    measurementId: "G-DEYNQ8GQ9B"
};

const dateFr = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const initials = (name, email) => (name ? name.trim()[0] : (email ? email[0] : "?")).toUpperCase();

let currentCurrency = "HTG";

function renderOrders(orders) {
  const body = document.getElementById("ordersBody");
  const empty = document.getElementById("ordersEmpty");
  body.innerHTML = "";
  if (!orders.length) { empty.hidden = false; return; }
  empty.hidden = true;
  for (const o of orders) {
    const tr = document.createElement("tr");
    const statusClass = o.status === "livré" || o.status === "ok" ? "ok" : "pending";
    tr.innerHTML = `
      <td>${o.product ?? "—"}</td>
      <td>${dateFr(o.createdAt)}</td>
      <td>${formatPrice(o.amount ?? 0, currentCurrency)}</td>
      <td><span class="status ${statusClass}">${o.status ?? "en attente"}</span></td>`;
    body.appendChild(tr);
  }
}

function wireProducts(code) {
  currentCurrency = code;
  renderProducts(document.getElementById("productGrid"), code, (product) => {
    // Relie cet achat à ta page de paiement / commande une fois créée.
    alert(`Achat "${product.name}" (${formatPrice(product.priceHTG, code)}) — connecte ce bouton à ta page de commande.`);
  });
  document.getElementById("statBalance").dataset.htg && refreshBalanceDisplay();
}

function refreshBalanceDisplay() {
  const el = document.getElementById("statBalance");
  const htg = Number(el.dataset.htg || 0);
  el.textContent = formatPrice(htg, currentCurrency);
}

function wireDeposit() {
  const amount = document.getElementById("depositAmount");
  const ref = document.getElementById("depositRef");
  const btn = document.getElementById("depositBtn");
  let selected = null;

  renderPaymentMethods(document.getElementById("payGrid"), (method) => {
    selected = method;
    document.getElementById("payInstructions").textContent = method.instructions;
    [amount, ref, btn].forEach((el) => (el.disabled = false));
  });

  document.getElementById("depositForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("depositMsg");
    if (!selected) return;
    if (!amount.value || Number(amount.value) <= 0) { msg.textContent = "Entre un montant valide."; return; }
    if (!ref.value.trim()) { msg.textContent = "Entre la référence reçue par SMS."; return; }
    btn.disabled = true;
    try {
      await window.__gsSaveDeposit?.({
        method: selected.id,
        amount: Number(amount.value),
        reference: ref.value.trim(),
      });
      msg.style.color = "#fff";
      msg.textContent = "Demande envoyée. Ton solde sera crédité après vérification.";
      document.getElementById("depositForm").reset();
    } catch {
      msg.style.color = "#ff8a8a";
      msg.textContent = "Impossible d'envoyer la demande pour le moment. Réessaie.";
    } finally {
      btn.disabled = false;
    }
  });
}

async function main() {
  wireCurrencySelect(document.getElementById("currencySelect"), wireProducts);
  wireDeposit();

  if (firebaseConfig.apiKey === "VOTRE_API_KEY") {
    document.getElementById("hello").textContent = "Ajoute ta configuration Firebase dans dashboard.js";
    document.getElementById("userName").textContent = "—";
    return;
  }

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const A = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
  const F = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await A.signOut(auth);
    location.href = "connexion.html";
  });

  A.onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.href = "connexion.html";
      return;
    }

    const name = user.displayName || "Client";
    document.getElementById("hello").textContent = `Bonjour, ${name.split(" ")[0]}`;
    document.getElementById("userName").textContent = name;
    document.getElementById("userEmail").textContent = user.email || "";
    document.getElementById("avatar").textContent = initials(user.displayName, user.email);

    window.__gsSaveDeposit = (deposit) => F.addDoc(F.collection(db, "deposits"), {
      ...deposit,
      uid: user.uid,
      status: "en attente",
      createdAt: Date.now(),
    });

    try {
      const userSnap = await F.getDoc(F.doc(db, "users", user.uid));
      const balance = userSnap.exists() ? userSnap.data().balance : 0;
      document.getElementById("statBalance").dataset.htg = balance || 0;
      refreshBalanceDisplay();
    } catch {
      document.getElementById("statBalance").dataset.htg = 0;
      refreshBalanceDisplay();
    }

    try {
      const q = F.query(
        F.collection(db, "orders"),
        F.where("uid", "==", user.uid),
        F.orderBy("createdAt", "desc"),
        F.limit(10)
      );
      const snap = await F.getDocs(q);
      const orders = snap.docs.map((d) => d.data());
      renderOrders(orders);
      document.getElementById("statOrders").textContent = orders.length;
      document.getElementById("statPending").textContent = orders.filter((o) => o.status !== "livré" && o.status !== "ok").length;
    } catch {
      renderOrders([]);
    }
  });
}

main();
