import { formatPrice, wireCurrencySelect, renderProducts } from "./catalog.js";
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

const UNPAID = "en attente de paiement";
const DAY = 86400000;
const SOON = 3 * DAY; // anonse "ap ekspire talè" 3 jou anvan

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const initials = (name, email) => (name ? name.trim()[0] : (email ? email[0] : "?")).toUpperCase();
const ms = (v) => (v?.toMillis ? v.toMillis() : Number(v) || 0); // sipòte Timestamp Firestore tou
const addMonths = (ts, n) => { const d = new Date(ts); d.setMonth(d.getMonth() + n); return d.getTime(); };

// --- Eta paj la ----------------------------------------------------------
let currentCurrency = "HTG";
let currentUser = null;
let balanceHTG = 0;
let orders = [];
let subs = [];
let subCards = [];
let lastBanner = null;

// --- Estati ---------------------------------------------------------------
const isDelivered = (o) => o.status === "livré" || o.status === "ok";

function statusInfo(o) {
  if (isDelivered(o)) return { cls: "ok", label: t("status.delivered") };
  if (o.status === UNPAID) return { cls: "unpaid", label: t("status.unpaid") };
  if (o.status === "payé") return { cls: "pending", label: t("status.paid") };
  if (o.status === "vérification") return { cls: "pending", label: t("status.verifying") };
  if (o.status === "annulé") return { cls: "bad", label: t("dep.st.rejected") };
  return { cls: "pending", label: t("status.pending") };
}

const orderTitle = (o) => {
  const kind = o.kind === "subscription" ? ` · ${t("cat.sub")}` : o.kind === "giftcard" ? ` · ${t("cat.gift")}` : "";
  return `${o.product ?? "—"}${kind}`;
};

// --- Kòmand yo -----------------------------------------------------------
function renderOrders() {
  const body = $("ordersBody");
  body.innerHTML = "";
  $("ordersTable").hidden = !orders.length;
  $("ordersEmpty").hidden = !!orders.length;
  for (const o of orders) {
    const tr = document.createElement("tr");

    // Pwodui (+ kòd / mesaj livrezon an si admin lan mete youn)
    const tdProduct = el("td");
    tdProduct.dataset.label = t("col.product");
    const wrap = el("span");
    wrap.append(orderTitle(o));
    if (o.deliveryNote && isDelivered(o)) wrap.append(el("div", "row-sub", o.deliveryNote));
    tdProduct.appendChild(wrap);
    tr.appendChild(tdProduct);

    const cells = [
      [t("col.date"), formatDate(o.createdAt)],
      [t("col.amount"), formatPrice(o.amount ?? 0, currentCurrency)],
    ];
    for (const [label, value] of cells) {
      const td = el("td", "", value);
      td.dataset.label = label;
      tr.appendChild(td);
    }

    const td = el("td");
    td.dataset.label = t("col.status");
    const info = statusInfo(o);
    td.appendChild(el("span", `status ${info.cls}`, info.label));
    if (o.status === UNPAID && o.id) {
      const a = el("a", "row-link", t("ord.pay"));
      a.href = `paiement.html?order=${encodeURIComponent(o.id)}`;
      td.appendChild(a);
    }
    tr.appendChild(td);
    body.appendChild(tr);
  }
}

// --- Monitè abònman yo ----------------------------------------------------
// Dat ekspirasyon : o.expiresAt si admin mete l; sinon (activatedAt | deliveredAt | createdAt) + mwa.
// Renouvèlman pou menm kont lan (menm pwodui + menm e-mail / non itilizatè) ajoute sou dat ekspirasyon ki egziste a.
function computeSubs(list) {
  const groups = new Map();
  list
    .filter((o) => o.kind === "subscription" && isDelivered(o))
    .sort((a, b) => ms(a.activatedAt || a.deliveredAt || a.createdAt) - ms(b.activatedAt || b.deliveredAt || b.createdAt))
    .forEach((o) => {
      const email = String(o.fields?.email || "").toLowerCase();
      const username = String(o.fields?.username || "");
      const key = `${o.productId}|${email || username.toLowerCase()}`;
      const start = ms(o.activatedAt || o.deliveredAt || o.createdAt);
      const prev = groups.get(key);
      const expiresAt = o.expiresAt
        ? ms(o.expiresAt)
        : addMonths(Math.max(start, prev?.expiresAt || 0), Number(o.months) || 1);
      groups.set(key, { key, productId: o.productId, name: o.product, email, username, mode: o.mode, lastStart: start, expiresAt });
    });
  return [...groups.values()].sort((a, b) => a.expiresAt - b.expiresAt);
}

const fmt = (left, short = false) => {
  const s = Math.max(0, Math.floor(left / 1000));
  return t(short ? "sub.fmtShort" : "sub.fmt", {
    d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60,
  });
};
const stateOf = (left) => (left <= 0 ? "expired" : left <= SOON ? "soon" : "active");

function renderSubs() {
  const grid = $("subGrid");
  grid.innerHTML = "";
  subCards = [];
  $("subSection").hidden = !subs.length;
  for (const s of subs) {
    const card = el("div", "sub-card");
    const top = el("div", "sub-top");
    const info = el("div");
    info.append(el("div", "sub-name", s.name), el("div", "sub-acct", s.email || s.username));
    const pill = el("span", "status");
    top.append(info, pill);
    const time = el("div", "sub-time");
    const bar = el("div", "bar");
    const fill = document.createElement("i");
    bar.append(fill);
    const exp = el("div", "sub-exp", t("sub.expiresOn", { date: formatDate(s.expiresAt) }));
    const renew = el("a", "btn ghost", t("sub.renew"));
    const pid = encodeURIComponent(s.productId);
    renew.href = s.mode === "profile" || s.mode === "new"
      ? `checkout.html?product=${pid}&mode=${s.mode}&username=${encodeURIComponent(s.username)}` // kont san e-mail : non itilizatè
      : `checkout.html?product=${pid}&mode=renew&email=${encodeURIComponent(s.email)}`;
    card.append(top, time, bar, exp, renew);
    grid.append(card);
    subCards.push({ s, card, pill, time, fill });
  }
  lastBanner = null;
  tick();
}

function tick() {
  if (!subCards.length) { renderBanners([]); return; }
  const now = Date.now();
  const banners = [];
  for (const c of subCards) {
    const left = c.s.expiresAt - now;
    const st = stateOf(left);
    c.time.textContent = fmt(left);
    c.pill.className = `status ${{ active: "ok", soon: "unpaid", expired: "bad" }[st]}`;
    c.pill.textContent = t(`sub.${st}`);
    c.card.classList.toggle("expired", st === "expired");
    const total = Math.max(c.s.expiresAt - c.s.lastStart, 1);
    c.fill.style.width = `${Math.max(0, Math.min(100, (left / total) * 100))}%`;
    const who = c.s.email || c.s.username;
    const name = who ? `${c.s.name} (${who})` : c.s.name;
    if (st === "soon") banners.push({ st, text: t("sub.bannerSoon", { name, left: fmt(left, true) }) });
    if (st === "expired") banners.push({ st, text: t("sub.bannerExpired", { name }) });
  }
  renderBanners(banners);
}

function renderBanners(banners) {
  const sig = banners.map((b) => b.text).join("\n");
  if (sig === lastBanner) return; // pa manipile DOM la pou anyen chak segonn
  lastBanner = sig;
  const box = $("expiryBanners");
  box.innerHTML = "";
  for (const b of banners) box.appendChild(el("div", `alert-banner${b.st === "soon" ? " soon" : ""}`, b.text));
}

// --- Itilizatè / solde / pwodui ---------------------------------------------
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
const renderProductGrid = () => renderProducts($("productGrid"), currentCurrency, (p) => `checkout.html?product=${p.id}`);

function renderAll() {
  renderUser();
  renderBalance();
  renderProductGrid();
  renderOrders();
  renderSubs();
}

function onCurrency(code) {
  currentCurrency = code;
  renderBalance();
  renderProductGrid();
  renderOrders();
}

// --- Main ----------------------------------------------------------------
async function main() {
  wireCurrencySelect($("currencySelect"), onCurrency);
  renderAll();
  onLangChange(renderAll);
  setInterval(tick, 1000);

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

    // Solde + wòl + pwofil (admin an wè e-mail kliyan an gras a sa)
    try {
      const userRef = F.doc(db, "users", user.uid);
      const snap = await F.getDoc(userRef);
      const u = snap.exists() ? snap.data() : {};
      balanceHTG = Number(u.balance) || 0;
      if (u.role === "admin") $("adminLink").hidden = false;
      const email = user.email || "";
      const displayName = user.displayName || "";
      if (u.email !== email || (u.displayName || "") !== displayName) {
        F.setDoc(userRef, { email, displayName }, { merge: true }).catch(() => {});
      }
    } catch {
      balanceHTG = 0;
    }
    renderBalance();

    // Dènye kòmand yo
    try {
      const q = F.query(
        F.collection(db, "orders"),
        F.where("uid", "==", user.uid),
        F.orderBy("createdAt", "desc"),
        F.limit(10)
      );
      const snap = await F.getDocs(q);
      orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      $("statOrders").textContent = orders.length;
      $("statPending").textContent = orders.filter((o) => !isDelivered(o) && o.status !== "annulé").length;
    } catch {
      orders = [];
    }
    renderOrders();

    // Abònman aktif yo (monitè)
    try {
      const snap = await F.getDocs(F.query(
        F.collection(db, "orders"),
        F.where("uid", "==", user.uid),
        F.where("kind", "==", "subscription"),
        F.limit(100)
      ));
      subs = computeSubs(snap.docs.map((d) => d.data()));
    } catch {
      subs = [];
    }
    renderSubs();
  });
}

main();