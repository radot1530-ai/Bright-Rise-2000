import { getProduct, variantLabel, customPriceHTG, PAYMENT_METHODS } from "./catalog.js";

// Paj admin (Kreyòl sèlman). Aksè : users/{uid}.role === "admin" — ak règ Firestore yo (firestore.rules).
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
const VERIF = "vérification";
const PAID = "payé";
const DONE = "livré";
const CANCEL = "annulé";
const WAIT = "en attente";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const htg = (n) => `${new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0))} HTG`;
const ms = (v) => (v?.toMillis ? v.toMillis() : Number(v) || 0);
const when = (v) => (v ? new Date(ms(v)).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

const ORDER_STATUS = {
  [UNPAID]: ["Pa peye", "unpaid"],
  [VERIF]: ["Ap verifye", "pending"],
  [PAID]: ["Peye – pou livre", "pending"],
  [WAIT]: ["An atant", "pending"],
  [DONE]: ["Livre", "ok"],
  ok: ["Livre", "ok"],
  [CANCEL]: ["Anile", "bad"],
};
const REQ_STATUS = { [WAIT]: ["An atant", "pending"], "confirmé": ["Konfime", "ok"], "crédité": ["Kredite", "ok"], "refusé": ["Refize", "bad"] };
const KIND = { subscription: "Abònman", giftcard: "Kat kado", topup: "Rechaj jwèt", wallet: "Pòtfèy" };
const FIELD_LABELS = {
  email: "E-mail", username: "Non itilizatè", pin: "Kòd PIN", password: "Modpas",
  identifier: "Kont (e-mail / non)", playerId: "ID jwèt", playerName: "Non nan jwèt", note: "Nòt kliyan",
};
const FILTERS = {
  orders: [["todo", "Pou livre"], ["verif", "Ap verifye"], ["unpaid", "Pa peye"], ["done", "Livre"], ["cancel", "Anile"], ["all", "Tout"]],
  payments: [["wait", "An atant"], ["all", "Tout"]],
  deposits: [["wait", "An atant"], ["all", "Tout"]],
  users: [],
};
const isTodo = (o) => o.status === PAID || o.status === WAIT;
const ORDER_FILTER = {
  todo: isTodo,
  verif: (o) => o.status === VERIF,
  unpaid: (o) => o.status === UNPAID,
  done: (o) => o.status === DONE || o.status === "ok",
  cancel: (o) => o.status === CANCEL,
  all: () => true,
};

// --- Eta ------------------------------------------------------------------
let F, db, me;
const data = { orders: [], payments: [], deposits: [], users: new Map() };
let tab = "orders";
const filter = { orders: "todo", payments: "wait", deposits: "wait" };
let query = "";
const drafts = {}; // brouyon fòmilè livrezon (pa pèdi tèks la lè done yo rafrechi)
let pendingRender = false;
let toastTimer = null;

// --- Èd -------------------------------------------------------------------
const userOf = (uid) => data.users.get(uid) || {};
const who = (uid, fallback) => {
  const u = userOf(uid);
  return u.email || fallback || `uid:${String(uid).slice(0, 8)}`;
};
const methodName = (id) => PAYMENT_METHODS.find((m) => m.id === id)?.name || id || "—";

function expectedHTG(o) {
  const p = getProduct(o.productId);
  if (!p) return null;
  if (p.custom) return o.amountUSD ? customPriceHTG(o.amountUSD) : null;
  return p.variants.find((v) => v.id === o.variantId)?.priceHTG ?? null;
}

const dupRef = (self, ref) => {
  const r = String(ref || "").trim().toLowerCase();
  if (!r) return false;
  return [...data.payments, ...data.deposits].some((x) => x !== self && String(x.reference || "").trim().toLowerCase() === r);
};

function toast(text, err = false) {
  const el = $("toast");
  el.textContent = text;
  el.className = `toast${err ? " err" : ""}`;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 3500);
}

const pill = (map, status) => {
  const [label, cls] = map[status] || [status || "—", "pending"];
  return `<span class="status ${cls}">${esc(label)}</span>`;
};
const btn = (act, id, text, cls = "") => `<button type="button" class="btn ${cls}" data-act="${act}" data-id="${esc(id)}">${text}</button>`;
const copyBtn = (v) => `<button type="button" class="copy-btn" data-copy="${esc(v)}">Kopye</button>`;
const matches = (...parts) => !query || parts.join(" ").toLowerCase().includes(query);

// --- Rendu ----------------------------------------------------------------
function renderTabs() {
  const counts = {
    orders: data.orders.filter(isTodo).length + data.orders.filter(ORDER_FILTER.verif).length,
    payments: data.payments.filter((p) => p.status === WAIT).length,
    deposits: data.deposits.filter((d) => d.status === WAIT).length,
  };
  const defs = [["orders", "Kòmand"], ["payments", "Peman"], ["deposits", "Rechaj"], ["users", "Kliyan"]];
  $("tabs").innerHTML = defs.map(([id, label]) =>
    `<button type="button" role="tab" data-tab="${id}" class="${id === tab ? "active" : ""}" aria-selected="${id === tab}">${label}${counts[id] ? `<span class="adm-badge">${counts[id]}</span>` : ""}</button>`).join("");
  $("filters").innerHTML = FILTERS[tab].map(([id, label]) =>
    `<button type="button" class="chip${filter[tab] === id ? " active" : ""}" data-filter="${id}">${label}</button>`).join("");
}

const none = () => `<div class="adm-none">Anyen isit la pou kounye a.</div>`;

function orderCard(o) {
  const exp = expectedHTG(o);
  const product = getProduct(o.productId);
  const variant = product?.variants.find((v) => v.id === o.variantId);
  const vLabel = variant ? variantLabel(variant, "ht") : o.variantLabel || "";
  const fields = Object.entries(o.fields || {}).filter(([, v]) => v).map(([k, v]) =>
    `<div class="adm-f"><dt>${esc(FIELD_LABELS[k] || k)}</dt><dd><span>${esc(v)}</span>${copyBtn(v)}</dd></div>`).join("");
  const draft = drafts[o.id] || {};
  const isSub = o.kind === "subscription";
  const acts = [];
  if (o.status === UNPAID || o.status === VERIF) acts.push(btn("order-paid", o.id, "Make peye"));
  if (o.status === PAID || o.status === WAIT) acts.push(btn("deliver-open", o.id, "Livre"));
  if (o.status !== DONE && o.status !== "ok" && o.status !== CANCEL) acts.push(btn("order-cancel", o.id, "Anile", "ghost"));

  return `<article class="adm-card">
    <div class="adm-top">
      <div class="adm-title">${esc(o.product)}<small>${esc(KIND[o.kind] || "")} · ${esc(vLabel)}</small></div>
      ${pill(ORDER_STATUS, o.status)}
    </div>
    <div class="adm-meta"><b>${esc(who(o.uid, o.userEmail))}</b> · ${when(o.createdAt)} · <b>${htg(o.amount)}</b>${o.paidWith ? ` · peye ak ${esc(methodName(o.paidWith))}` : ""}${o.paymentRef ? ` · ref ${esc(o.paymentRef)}` : ""}${isSub ? ` · ${esc(o.months || "?")} mwa${o.mode ? ` · mòd ${esc(o.mode)}` : ""}` : ""}</div>
    ${exp != null && exp !== o.amount ? `<div class="adm-warn">⚠ Montan an (${htg(o.amount)}) pa matche pri katalòg la (${htg(exp)}). Verifye anvan ou livre.</div>` : ""}
    ${o.deliveryNote ? `<div class="adm-meta">Nòt livrezon : <b>${esc(o.deliveryNote)}</b></div>` : ""}
    ${fields ? `<dl class="adm-fields">${fields}</dl>` : ""}
    ${acts.length ? `<div class="adm-actions">${acts.join("")}</div>` : ""}
    <div class="adm-form" data-form="${esc(o.id)}" ${draft.open ? "" : "hidden"}>
      <label>Kòd / mesaj pou kliyan an (parèt nan dashboard li)</label>
      <textarea rows="2" data-note placeholder="Egzanp : kòd kat la, oswa mesaj konfimasyon">${esc(draft.note || "")}</textarea>
      ${isSub ? `<label>Dat ekspirasyon (si ou pa vle kalkil otomatik la)</label><input type="date" data-exp value="${esc(draft.exp || "")}">` : ""}
      ${btn("deliver", o.id, "Konfime livrezon")}
    </div>
  </article>`;
}

function renderOrders() {
  const list = data.orders.filter(ORDER_FILTER[filter.orders]).filter((o) =>
    matches(o.product, who(o.uid, o.userEmail), o.id, o.paymentRef, o.variantLabel, ...Object.values(o.fields || {})));
  $("panel").innerHTML = list.length ? list.map(orderCard).join("") : none();
}

function reqCard(kind, r) {
  const isPay = kind === "payment";
  const order = isPay ? data.orders.find((o) => o.id === r.orderId) : null;
  const warnings = [];
  if (dupRef(r, r.reference)) warnings.push("⚠ Menm referans lan egziste deja yon lòt kote. Verifye SMS la.");
  if (isPay && order && order.amount !== r.amount) warnings.push(`⚠ Montan peman an (${htg(r.amount)}) pa menm ak kòmand lan (${htg(order.amount)}).`);
  const pending = r.status === WAIT;
  const acts = pending
    ? btn(isPay ? "pay-ok" : "dep-ok", r.id, isPay ? "Konfime peman" : "Kredite solde a") + btn(isPay ? "pay-no" : "dep-no", r.id, "Refize", "ghost")
    : "";
  return `<article class="adm-card">
    <div class="adm-top">
      <div class="adm-title">${htg(r.amount)}<small>${esc(methodName(r.method))}</small></div>
      ${pill(REQ_STATUS, r.status)}
    </div>
    <div class="adm-meta"><b>${esc(who(r.uid, r.userEmail))}</b> · ${when(r.createdAt)}${isPay ? ` · kòmand : <b>${esc(order ? `${order.product} (${order.variantLabel || ""})` : r.orderId)}</b>` : ` · solde kounye a : <b>${htg(userOf(r.uid).balance)}</b>`}</div>
    <dl class="adm-fields">
      <div class="adm-f"><dt>Non moun ki voye</dt><dd><span>${esc(r.senderName)}</span></dd></div>
      <div class="adm-f"><dt>Telefòn</dt><dd><span>${esc(r.senderPhone)}</span>${copyBtn(r.senderPhone)}</dd></div>
      <div class="adm-f"><dt>Referans</dt><dd><span>${esc(r.reference)}</span>${copyBtn(r.reference)}</dd></div>
    </dl>
    ${warnings.map((w) => `<div class="adm-warn">${esc(w)}</div>`).join("")}
    ${acts ? `<div class="adm-actions">${acts}</div>` : ""}
  </article>`;
}

function renderRequests(kind) {
  const src = kind === "payment" ? data.payments : data.deposits;
  const f = filter[kind === "payment" ? "payments" : "deposits"];
  const list = src.filter((r) => f === "all" || r.status === WAIT).filter((r) =>
    matches(who(r.uid, r.userEmail), r.reference, r.senderName, r.senderPhone, r.amount));
  $("panel").innerHTML = list.length ? list.map((r) => reqCard(kind, r)).join("") : none();
}

function renderUsers() {
  const rows = [...data.users.entries()]
    .map(([uid, u]) => ({ uid, ...u }))
    .filter((u) => matches(u.email, u.displayName, u.uid))
    .sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0));
  $("panel").innerHTML = rows.length ? rows.map((u) => `<article class="adm-card adm-user">
    <div>
      <div class="adm-title">${esc(u.email || `uid:${u.uid.slice(0, 8)}`)}${u.role === "admin" ? `<small>admin</small>` : ""}</div>
      <div class="adm-meta">${esc(u.displayName || "—")}</div>
    </div>
    <div style="text-align:right">
      <div class="adm-bal">${htg(u.balance)}</div>
      ${btn("adjust", u.uid, "Ajiste solde", "ghost")}
    </div>
  </article>`).join("") : none();
}

function render() {
  renderTabs();
  if (tab === "orders") renderOrders();
  else if (tab === "payments") renderRequests("payment");
  else if (tab === "deposits") renderRequests("deposit");
  else renderUsers();
}

// Pa rafrechi pandan admin lan ap tape nan yon fòmilè.
function scheduleRender() {
  const a = document.activeElement;
  if (a && $("panel").contains(a) && /^(TEXTAREA|INPUT)$/.test(a.tagName)) { pendingRender = true; return; }
  pendingRender = false;
  render();
}

// --- Aksyon ---------------------------------------------------------------
const now = () => Date.now();
const find = (list, id) => list.find((x) => x.id === id);
const setOrder = (id, patch) => F.updateDoc(F.doc(db, "orders", id), { ...patch, updatedAt: now(), updatedBy: me.uid });
const balanceLog = (tx, uid, delta, reason) =>
  tx.set(F.doc(F.collection(db, "balanceLog")), { uid, delta, reason, by: me.uid, at: now() });

const actions = {
  async "order-paid"(id) {
    await setOrder(id, { status: PAID, paidAt: now() });
    toast("Kòmand make peye ✓");
  },

  async "deliver-open"(id) {
    drafts[id] = { ...drafts[id], open: !drafts[id]?.open };
    render();
  },

  async deliver(id, b) {
    const o = find(data.orders, id);
    const form = b.closest(".adm-form");
    const note = form.querySelector("[data-note]").value.trim();
    const exp = form.querySelector("[data-exp]")?.value;
    const t = now();
    await setOrder(id, {
      status: DONE,
      deliveredAt: t,
      ...(o.kind === "subscription" ? { activatedAt: t } : {}),
      ...(note ? { deliveryNote: note } : {}),
      ...(exp ? { expiresAt: new Date(`${exp}T23:59:59`).getTime() } : {}),
    });
    delete drafts[id];
    toast("Kòmand livre ✓");
  },

  async "order-cancel"(id) {
    const o = find(data.orders, id);
    const refundable = o.paidWith === "balance" && o.status === PAID;
    if (!confirm(refundable ? "Anile kòmand sa a epi renmèt lajan an sou solde kliyan an?" : "Anile kòmand sa a?")) return;
    await F.runTransaction(db, async (tx) => {
      const oRef = F.doc(db, "orders", id);
      const snap = await tx.get(oRef);
      const od = snap.data();
      if (!od || od.status === DONE || od.status === "ok" || od.status === CANCEL) throw new Error("Kòmand lan fini oswa anile deja.");
      const refund = od.paidWith === "balance" && od.status === PAID;
      let uSnap = null;
      const uRef = F.doc(db, "users", od.uid);
      if (refund) uSnap = await tx.get(uRef);
      if (refund) {
        tx.set(uRef, { balance: (Number(uSnap.data()?.balance) || 0) + Number(od.amount) }, { merge: true });
        balanceLog(tx, od.uid, Number(od.amount), `Ranbousman kòmand ${id}`);
      }
      tx.update(oRef, { status: CANCEL, cancelledAt: now(), refunded: refund, updatedBy: me.uid });
    });
    toast("Kòmand anile ✓");
  },

  // ---- Peman dirèk (MonCash / NatCash) sou yon kòmand ----
  async "pay-ok"(id) {
    const p = find(data.payments, id);
    const batch = F.writeBatch(db);
    batch.update(F.doc(db, "payments", id), { status: "confirmé", confirmedAt: now(), confirmedBy: me.uid });
    if (p.orderId) batch.update(F.doc(db, "orders", p.orderId), { status: PAID, paidAt: now(), updatedBy: me.uid });
    await batch.commit();
    toast("Peman konfime ✓ — kòmand lan pare pou livre");
  },

  async "pay-no"(id) {
    if (!confirm("Refize peman sa a? Kliyan an ka eseye ankò.")) return;
    const p = find(data.payments, id);
    const batch = F.writeBatch(db);
    batch.update(F.doc(db, "payments", id), { status: "refusé", rejectedAt: now(), rejectedBy: me.uid });
    if (p.orderId) {
      batch.update(F.doc(db, "orders", p.orderId), {
        status: UNPAID, paymentId: F.deleteField(), paymentRef: F.deleteField(), paidWith: F.deleteField(), updatedBy: me.uid,
      });
    }
    await batch.commit();
    toast("Peman refize");
  },

  // ---- Rechaj solde ----
  async "dep-ok"(id) {
    if (!confirm("Kredite solde kliyan an ak montan sa a?")) return;
    await F.runTransaction(db, async (tx) => {
      const dRef = F.doc(db, "deposits", id);
      const dSnap = await tx.get(dRef);
      const d = dSnap.data();
      if (!d || d.status !== WAIT) throw new Error("Rechaj sa a trete deja.");
      const uRef = F.doc(db, "users", d.uid);
      const uSnap = await tx.get(uRef);
      const amount = Math.round(Number(d.amount) || 0);
      if (amount <= 0) throw new Error("Montan envalid.");
      tx.set(uRef, { balance: (Number(uSnap.data()?.balance) || 0) + amount }, { merge: true });
      tx.update(dRef, { status: "crédité", creditedAt: now(), creditedBy: me.uid });
      balanceLog(tx, d.uid, amount, `Rechaj ${d.method} · ref ${d.reference}`);
    });
    toast("Solde kredite ✓");
  },

  async "dep-no"(id) {
    if (!confirm("Refize rechaj sa a?")) return;
    await F.updateDoc(F.doc(db, "deposits", id), { status: "refusé", rejectedAt: now(), rejectedBy: me.uid });
    toast("Rechaj refize");
  },

  // ---- Ajiste solde manyèlman ----
  async adjust(uid) {
    const raw = prompt("Montan an HTG (egzanp 500 pou ajoute, -500 pou retire) :");
    if (raw === null) return;
    const delta = Math.round(Number(String(raw).replace(",", ".")));
    if (!Number.isFinite(delta) || !delta) throw new Error("Montan envalid.");
    const reason = (prompt("Rezon (opsyonèl) :") || "Ajisteman manyèl").trim();
    await F.runTransaction(db, async (tx) => {
      const uRef = F.doc(db, "users", uid);
      const uSnap = await tx.get(uRef);
      const bal = Number(uSnap.data()?.balance) || 0;
      if (bal + delta < 0) throw new Error("Solde a pa ka vin negatif.");
      tx.set(uRef, { balance: bal + delta }, { merge: true });
      balanceLog(tx, uid, delta, reason);
    });
    toast("Solde ajiste ✓");
  },
};

// --- Evènman --------------------------------------------------------------
function wireUI() {
  $("app").addEventListener("click", async (e) => {
    const copy = e.target.closest("[data-copy]");
    if (copy) {
      try { await navigator.clipboard.writeText(copy.dataset.copy); copy.textContent = "Kopye!"; setTimeout(() => (copy.textContent = "Kopye"), 1200); } catch {}
      return;
    }
    const tabBtn = e.target.closest("[data-tab]");
    if (tabBtn) { tab = tabBtn.dataset.tab; query = ""; $("q").value = ""; render(); return; }
    const fBtn = e.target.closest("[data-filter]");
    if (fBtn) { filter[tab] = fBtn.dataset.filter; render(); return; }

    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    b.disabled = true;
    try {
      await actions[b.dataset.act](b.dataset.id, b);
    } catch (err) {
      console.error(err);
      toast(err?.message || "Yon erè pase.", true);
    } finally {
      b.disabled = false;
    }
  });

  $("q").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });

  document.addEventListener("input", (e) => {
    const form = e.target.closest?.(".adm-form");
    if (!form) return;
    drafts[form.dataset.form] = {
      open: true,
      note: form.querySelector("[data-note]")?.value || "",
      exp: form.querySelector("[data-exp]")?.value || "",
    };
  });
  document.addEventListener("focusout", () => {
    if (pendingRender) setTimeout(scheduleRender, 80);
  });
}

// --- Main ----------------------------------------------------------------
async function main() {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const A = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
  F = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  db = F.getFirestore(app);

  A.onAuthStateChanged(auth, async (user) => {
    if (!user) { location.href = "connexion.html"; return; }
    me = user;

    let isAdmin = false;
    try {
      const snap = await F.getDoc(F.doc(db, "users", user.uid));
      isAdmin = snap.exists() && snap.data().role === "admin";
    } catch {}
    if (!isAdmin) {
      $("gate").innerHTML = `Aksè refize. Sèlman yon admin ka wè paj sa a. <a href="dashboard.html">Retounen nan dashboard la</a>.`;
      return;
    }

    $("gate").hidden = true;
    $("app").hidden = false;
    wireUI();

    const watch = (label, q, apply) => F.onSnapshot(q, (s) => { apply(s); scheduleRender(); },
      (err) => toast(`Pa ka li ${label} : ${err.code}`, true));
    const docs = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));
    const recent = (name) => F.query(F.collection(db, name), F.orderBy("createdAt", "desc"), F.limit(300));

    watch("kòmand yo", recent("orders"), (s) => { data.orders = docs(s); });
    watch("peman yo", recent("payments"), (s) => { data.payments = docs(s); });
    watch("rechaj yo", recent("deposits"), (s) => { data.deposits = docs(s); });
    watch("kliyan yo", F.query(F.collection(db, "users"), F.limit(500)), (s) => {
      data.users = new Map(s.docs.map((d) => [d.id, d.data()]));
    });
    render();
  });
}

main();