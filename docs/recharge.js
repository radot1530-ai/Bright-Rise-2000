import {
  formatPrice, wireCurrencySelect, renderPaymentMethods, wireCopy, PAYMENT_METHODS,
} from "./catalog.js";
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
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const ms = (v) => (v?.toMillis ? v.toMillis() : Number(v) || 0);

// --- Eta paj la ----------------------------------------------------------
let currentCurrency = "HTG";
let balanceHTG = 0;
let deposits = [];
let selectedMethod = null;

function depositInfo(d) {
  const s = String(d.status || "").toLowerCase();
  if (["crédité", "credite", "ok", "approuvé", "livré"].includes(s)) return { cls: "ok", label: t("dep.st.ok") };
  if (["rejeté", "refusé", "annulé"].includes(s)) return { cls: "bad", label: t("dep.st.rejected") };
  return { cls: "pending", label: t("dep.st.pending") };
}

// --- Rendu ---------------------------------------------------------------
const renderBalance = () => { $("statBalance").textContent = formatPrice(balanceHTG, currentCurrency); };

function renderPayText() {
  $("payInstructions").textContent = selectedMethod
    ? t("pay.instr", { name: selectedMethod.name })
    : t("dash.pickMethod");
  $("payNumber").textContent = selectedMethod?.number ? t("dash.number", { n: selectedMethod.number }) : "";
  $("copyBtn").hidden = !selectedMethod;
}

function renderDeposits() {
  const list = $("depositList");
  list.innerHTML = "";
  $("depositEmpty").hidden = !!deposits.length;
  for (const d of deposits) {
    const row = el("div", "list-row");
    const left = el("div");
    const method = PAYMENT_METHODS.find((m) => m.id === d.method)?.name || d.method || "";
    left.append(
      el("div", "row-main", `${method} · ${formatPrice(d.amount ?? 0, currentCurrency)}`),
      el("div", "row-sub", `${formatDate(d.createdAt)}${d.reference ? ` · ${d.reference}` : ""}`),
    );
    const info = depositInfo(d);
    row.append(left, el("span", `status ${info.cls}`, info.label));
    list.appendChild(row);
  }
}

function renderAll() {
  renderBalance();
  renderPayText();
  renderDeposits();
}

// --- Fòmilè rechaj -------------------------------------------------------
function wireDeposit() {
  const name = $("depositName");
  const phone = $("depositPhone");
  const amount = $("depositAmount");
  const ref = $("depositRef");
  const btn = $("depositBtn");
  const inputs = [name, phone, amount, ref, btn];
  const msg = $("depositMsg");
  const say = (text, ok = false) => { msg.textContent = text; msg.className = `msg ${ok ? "ok" : "err"}`; };

  wireCopy($("copyBtn"), () => selectedMethod?.number || "");
  renderPaymentMethods($("payGrid"), (method) => {
    selectedMethod = method;
    renderPayText();
    inputs.forEach((i) => (i.disabled = false));
  });

  $("depositForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedMethod) return;
    if (!name.value.trim()) return say(t("dep.errName"));
    if (!phone.value.trim()) return say(t("dep.errPhone"));
    if (!amount.value || Number(amount.value) <= 0) return say(t("dep.errAmount"));
    if (!ref.value.trim()) return say(t("dep.errRef"));
    btn.disabled = true;
    const deposit = {
      method: selectedMethod.id,
      senderName: name.value.trim(),
      senderPhone: phone.value.trim(),
      amount: Math.round(Number(amount.value)),
      reference: ref.value.trim().toUpperCase(),
    };
    try {
      await window.__gsSaveDeposit?.(deposit);
      say(t("dep.ok"), true);
      deposits.unshift({ ...deposit, status: "en attente", createdAt: Date.now() });
      renderDeposits();
      $("depositForm").reset();
      inputs.forEach((i) => (i.disabled = true));
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
  wireCurrencySelect($("currencySelect"), (code) => { currentCurrency = code; renderAll(); });
  wireDeposit();
  renderAll();
  onLangChange(() => { $("depositMsg").textContent = ""; $("copyBtn").textContent = t("common.copy"); renderAll(); });

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const A = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
  const F = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);

  A.onAuthStateChanged(auth, async (user) => {
    if (!user) { location.href = "connexion.html"; return; }

    window.__gsSaveDeposit = (deposit) => F.addDoc(F.collection(db, "deposits"), {
      ...deposit,
      uid: user.uid,
      userEmail: user.email || "",
      userName: user.displayName || "",
      status: "en attente",
      createdAt: Date.now(),
    });

    try {
      const snap = await F.getDoc(F.doc(db, "users", user.uid));
      balanceHTG = snap.exists() ? Number(snap.data().balance) || 0 : 0;
    } catch { balanceHTG = 0; }
    renderBalance();

    try {
      const snap = await F.getDocs(F.query(F.collection(db, "deposits"), F.where("uid", "==", user.uid), F.limit(20)));
      deposits = snap.docs.map((d) => d.data()).sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
    } catch { deposits = []; }
    renderDeposits();
  });
}

main();