import { formatPrice, wireCurrencySelect, renderProducts, renderPaymentMethods } from "./catalog.js";
import { t, formatDate, onLangChange } from "./i18n.js";

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
const initials = (name, email) => (name ? name.trim()[0] : (email ? email[0] : "?")).toUpperCase();

// --- Eta paj la ----------------------------------------------------------
let currentCurrency = "HTG";
let currentUser = null;
let balanceHTG = 0;
let orders = [];
let selectedMethod = null;

// --- Rendu ---------------------------------------------------------------
const isDelivered = (o) => o.status === "livré" || o.status === "ok";

function renderOrders() {
  const body = $("ordersBody");
  const empty = $("ordersEmpty");
  body.innerHTML = "";
  $("ordersTable").hidden = !orders.length;
  empty.hidden = !!orders.length;
  for (const o of orders) {
    const tr = document.createElement("tr");
    const cells = [
      [t("col.product"), o.product ?? "—"],
      [t("col.date"), formatDate(o.createdAt)],
      [t("col.amount"), formatPrice(o.amount ?? 0, currentCurrency)],
    ];
    for (const [label, value] of cells) {
      const td = document.createElement("td");
      td.dataset.label = label;
      td.textContent = value;
      tr.appendChild(td);
    }
    const td = document.createElement("td");
    td.dataset.label = t("col.status");
    const pill = document.createElement("span");
    pill.className = `status ${isDelivered(o) ? "ok" : "pending"}`;
    pill.textContent = isDelivered(o) ? t("status.delivered") : t("status.pending");
    td.appendChild(pill);
    tr.appendChild(td);
    body.appendChild(tr);
  }
}

function renderUser() {
  const user = currentUser;
  const name = user?.displayName || t("dash.client");
  $("hello").textContent = user ? t("dash.hello", { name: name.split(" ")[0] }) : "";
  const nameEl = $("userName");
  nameEl.removeAttribute("data-i18n");
  nameEl.textContent = user ? name : t("common.loading");
  $("userEmail").textContent = user?.email || "";
  $("avatar").textContent = user ? initials(user.displayName, user.email) : "?";
}

const renderBalance = () => { $("statBalance").textContent = formatPrice(balanceHTG, currentCurrency); };

function renderProductGrid() {
  renderProducts($("productGrid"), currentCurrency, (p) => `checkout.html?product=${p.id}`);
}

function renderPayText() {
  $("payInstructions").textContent = selectedMethod
    ? t("pay.instr", { name: selectedMethod.name })
    : t("dash.pickMethod");
  $("payNumber").textContent = selectedMethod?.number ? t("dash.number", { n: selectedMethod.number }) : "";
}

function renderAll() {
  renderUser();
  renderBalance();
  renderProductGrid();
  renderOrders();
  renderPayText();
}

function onCurrency(code) {
  currentCurrency = code;
  renderBalance();
  renderProductGrid();
  renderOrders();
}

// --- Rechaj solde --------------------------------------------------------
function wireDeposit() {
  const name = $("depositName");
  const phone = $("depositPhone");
  const amount = $("depositAmount");
  const ref = $("depositRef");
  const btn = $("depositBtn");
  const inputs = [name, phone, amount, ref, btn];
  const msg = $("depositMsg");
  const say = (text, ok = false) => { msg.textContent = text; msg.className = `msg ${ok ? "ok" : "err"}`; };

  renderPaymentMethods($("payGrid"), (method) => {
    selectedMethod = method;
    renderPayText();
    inputs.forEach((el) => (el.disabled = false));
  });

  $("depositForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedMethod) return;
    if (!name.value.trim()) return say(t("dep.errName"));
    if (!phone.value.trim()) return say(t("dep.errPhone"));
    if (!amount.value || Number(amount.value) <= 0) return say(t("dep.errAmount"));
    if (!ref.value.trim()) return say(t("dep.errRef"));
    btn.disabled = true;
    try {
      await window.__gsSaveDeposit?.({
        method: selectedMethod.id,
        senderName: name.value.trim(),
        senderPhone: phone.value.trim(),
        amount: Number(amount.value),
        reference: ref.value.trim(),
      });
      say(t("dep.ok"), true);
      $("depositForm").reset();
      inputs.forEach((el) => (el.disabled = true));
      selectedMethod = null;
      $("payGrid").querySelectorAll(".pay-card").forEach((b) => b.classList.remove("active"));
      renderPayText();
    } catch {
      say(t("dep.fail"));
      btn.disabled = false;
    }
  });
}

// --- Main ----------------------------------------------------------------
async function main() {
  wireCurrencySelect($("currencySelect"), onCurrency);
  wireDeposit();
  renderAll();
  onLangChange(() => { $("depositMsg").textContent = ""; renderAll(); });

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const A = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
  const F = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);

  $("logoutBtn").addEventListener("click", async () => {
    await A.signOut(auth);
    location.href = "connexion.html";
  });

  A.onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.href = "connexion.html";
      return;
    }
    currentUser = user;
    renderUser();

    window.__gsSaveDeposit = (deposit) => F.addDoc(F.collection(db, "deposits"), {
      ...deposit,
      uid: user.uid,
      status: "en attente",
      createdAt: Date.now(),
    });

    try {
      const userSnap = await F.getDoc(F.doc(db, "users", user.uid));
      balanceHTG = userSnap.exists() ? Number(userSnap.data().balance) || 0 : 0;
    } catch {
      balanceHTG = 0;
    }
    renderBalance();

    try {
      const q = F.query(
        F.collection(db, "orders"),
        F.where("uid", "==", user.uid),
        F.orderBy("createdAt", "desc"),
        F.limit(10)
      );
      const snap = await F.getDocs(q);
      orders = snap.docs.map((d) => d.data());
      $("statOrders").textContent = orders.length;
      $("statPending").textContent = orders.filter((o) => !isDelivered(o)).length;
    } catch {
      orders = [];
    }
    renderOrders();
  });
}

main();