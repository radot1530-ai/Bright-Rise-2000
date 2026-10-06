import {
  formatPrice, wireCurrencySelect, renderPaymentMethods, wireCopy, getProduct, variantLabel,
} from "./catalog.js";
import { t, onLangChange } from "./i18n.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxN2jYclFAeSh9tMvkoeZCTsFvWNQYOzA",
  authDomain: "ns4supportplus.firebaseapp.com",
  projectId: "ns4supportplus",
  storageBucket: "ns4supportplus.firebasestorage.app",
  messagingSenderId: "1072291248908",
  appId: "1:1072291248908:web:711d01129b833847c5a729",
  measurementId: "G-DEYNQ8GQ9B"
};

const UNPAID = "en attente de paiement";
const $ = (id) => document.getElementById(id);
const orderId = new URLSearchParams(location.search).get("order");

// --- Eta paj la ----------------------------------------------------------
let currentCurrency = "HTG";
let order = null;
let balance = 0;
let view = "loading"; // loading | notfound | already | ready | done
let selectedMethod = null;
let busy = false;

const say = (id, text, ok = false) => { const el = $(id); el.textContent = text; el.className = `msg ${ok ? "ok" : "err"}`; };

function orderLabel() {
  // Rekonstwi etikèt la nan lang aktyèl la (sinon itilize sa ki sove a).
  const p = getProduct(order.productId);
  const v = p?.variants.find((x) => x.id === order.variantId);
  if (v) return variantLabel(v);
  if (order.amountUSD) return `${order.amountUSD} $`;
  return order.variantLabel || "";
}

// --- Rendu ---------------------------------------------------------------
function render() {
  $("orderName").textContent = order ? `${order.product} — ${orderLabel()}` : "—";
  $("orderPrice").textContent = order ? formatPrice(order.amount, currentCurrency) : "—";

  const stateBox = $("payState");
  const stateText = { notfound: "pay.notFound", already: "pay.already", done: "pay.done" }[view];
  stateBox.hidden = !stateText;
  if (stateText) {
    stateBox.innerHTML = "";
    stateBox.append(`${t(stateText)} `);
    const a = document.createElement("a");
    a.href = "dashboard.html";
    a.textContent = t("co.back");
    stateBox.append(a);
  }
  $("payBody").hidden = view !== "ready";
  if (view !== "ready") return;

  // Peye ak solde
  $("payBalance").textContent = formatPrice(balance, currentCurrency);
  const enough = balance >= order.amount;
  const btn = $("payBalanceBtn");
  btn.textContent = t("pay.btnBalance", { price: formatPrice(order.amount, currentCurrency) });
  btn.disabled = !enough || busy;
  $("balanceNote").hidden = enough;
  $("topupLink").hidden = enough;
  if (!enough) $("balanceNote").textContent = t("pay.insufficient", { missing: formatPrice(order.amount - balance, currentCurrency) });

  // Peye ak MonCash / NatCash
  $("payInstructions").textContent = selectedMethod
    ? t("pay.mobileInstr", { amount: order.amount, name: selectedMethod.name })
    : t("pay.pickMethod");
  $("payNumber").textContent = selectedMethod?.number ?? "";
  $("copyBtn").hidden = !selectedMethod;
}

// --- Main ----------------------------------------------------------------
async function main() {
  wireCurrencySelect($("currencySelect"), (code) => { currentCurrency = code; render(); });
  onLangChange(() => {
    $("balanceMsg").textContent = "";
    $("mobileMsg").textContent = "";
    $("copyBtn").textContent = t("common.copy");
    render();
  });
  wireCopy($("copyBtn"), () => selectedMethod?.number || "");

  const mInputs = [$("mName"), $("mPhone"), $("mRef"), $("mBtn")];
  renderPaymentMethods($("payGrid"), (method) => {
    selectedMethod = method;
    mInputs.forEach((el) => (el.disabled = false));
    render();
  });
  render();

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const A = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
  const F = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);

  A.onAuthStateChanged(auth, async (user) => {
    if (!user) { location.href = "connexion.html"; return; }
    if (!orderId) { view = "notfound"; render(); return; }

    const orderRef = F.doc(db, "orders", orderId);
    const userRef = F.doc(db, "users", user.uid);

    try {
      const snap = await F.getDoc(orderRef);
      if (!snap.exists() || snap.data().uid !== user.uid) { view = "notfound"; render(); return; }
      order = snap.data();
      const uSnap = await F.getDoc(userRef).catch(() => null);
      balance = uSnap?.exists() ? Number(uSnap.data().balance) || 0 : 0;
      view = order.status === UNPAID ? "ready" : "already";
    } catch {
      view = "notfound";
    }
    render();
    if (view !== "ready") return;

    // ---- Peye ak solde : transaksyon (li solde a + kòmand lan, epi ekri tou de) ----
    $("payBalanceBtn").addEventListener("click", async () => {
      if (busy) return;
      busy = true; render();
      try {
        await F.runTransaction(db, async (tx) => {
          const o = await tx.get(orderRef);
          const u = await tx.get(userRef);
          if (!o.exists() || o.data().uid !== user.uid) throw new Error("notfound");
          if (o.data().status !== UNPAID) throw new Error("status");
          const bal = u.exists() ? Number(u.data().balance) || 0 : 0;
          const amount = Number(o.data().amount) || 0;
          if (amount <= 0 || bal < amount) throw new Error("balance");
          tx.update(userRef, { balance: bal - amount });
          tx.update(orderRef, { status: "payé", paidWith: "balance", paidAt: Date.now() });
        });
        view = "done";
        render();
        setTimeout(() => (location.href = "dashboard.html"), 1800);
      } catch (e) {
        if (e.message === "status") { view = "already"; }
        else if (e.message === "balance") {
          const uSnap = await F.getDoc(userRef).catch(() => null);
          balance = uSnap?.exists() ? Number(uSnap.data().balance) || 0 : 0;
          say("balanceMsg", t("pay.insufficient", { missing: formatPrice(Math.max(order.amount - balance, 0), currentCurrency) }));
        } else say("balanceMsg", t("pay.fail"));
      } finally {
        busy = false;
        if (view === "ready") render();
      }
    });

    // ---- Peye dirèkteman ak MonCash / NatCash ----
    $("mobileForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!selectedMethod || busy) return;
      const name = $("mName").value.trim();
      const phone = $("mPhone").value.trim();
      const reference = $("mRef").value.trim().toUpperCase();
      if (!name) return say("mobileMsg", t("dep.errName"));
      if (!phone) return say("mobileMsg", t("dep.errPhone"));
      if (!reference) return say("mobileMsg", t("dep.errRef"));

      busy = true;
      $("mBtn").disabled = true;
      try {
        const payRef = F.doc(F.collection(db, "payments"));
        const batch = F.writeBatch(db);
        batch.set(payRef, {
          orderId, uid: user.uid, method: selectedMethod.id,
          senderName: name, senderPhone: phone, reference,
          amount: order.amount, status: "en attente", createdAt: Date.now(),
        });
        batch.update(orderRef, {
          status: "vérification", paidWith: selectedMethod.id, paymentId: payRef.id, paymentRef: reference,
        });
        await batch.commit();
        say("mobileMsg", t("pay.sent"), true);
        $("mobileForm").reset();
        mInputs.forEach((el) => (el.disabled = true));
        setTimeout(() => (location.href = "dashboard.html"), 1800);
      } catch {
        say("mobileMsg", t("pay.fail"));
        $("mBtn").disabled = false;
        busy = false;
      }
    });
  });
}

main();