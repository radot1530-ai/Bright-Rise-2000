// ====================
// 🔐 LOGIN ADMIN
// ====================
const loginSection = document.getElementById("login-section");
const adminDashboard = document.getElementById("admin-dashboard");
const loginBtn = document.getElementById("login-btn");

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const user = document.getElementById("admin-username").value.trim();
    const pass = document.getElementById("admin-password").value.trim();

    if (user === "admin" && pass === "kaylakay2025") {
      localStorage.setItem("adminLogged", "true");
      loginSection.classList.remove("active");
      adminDashboard.classList.add("active");
    } else {
      alert("❌ Non itilizatè oswa modpas la pa kòrèk.");
    }
  });
}

// ✅ Si admin deja konekte
if (localStorage.getItem("adminLogged") === "true") {
  if (loginSection) loginSection.classList.remove("active");
  if (adminDashboard) adminDashboard.classList.add("active");
}

// 🚪 Dekoneksyon
function logoutAdmin() {
  localStorage.removeItem("adminLogged");
  window.location.reload();
}
// ------------------- NAVIGATION -------------------
if (document.querySelector(".tab")) {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });
}
// ----------------- Fonksyon montre popup -----------------
function montrePopup(anons){
  const popup = document.getElementById("popupDemann");
  popup.classList.remove("hidden");
  document.getElementById("popupTitre").innerText = anons.titre;

  const overlay = popup.querySelector(".popup-overlay");
  const closeBtn = popup.querySelector("#fèmenPopup");
  overlay.onclick = closeBtn.onclick = () => popup.classList.add("hidden");

  const sendBtn = popup.querySelector("#envoyeDemann");
  sendBtn.onclick = async () => {
    const num = document.getElementById("clientNumber").value.trim();
    if(!num) return alert("Tanpri mete nimewo ou!");

    // Voye demann nan backend
    const formData = new FormData();
    formData.append("titre", anons.titre);
    formData.append("prix", anons.prix);
    formData.append("nom", anons.nom || "Kliyan");
    formData.append("whatsapp", `https://wa.me/${num}`);

    const res = await fetch("/add_demande", { method:"POST", body: formData });
    const data = await res.json();
    if(data.success){
      alert("✅ Demann ou an voye avèk siksè!");
      popup.classList.add("hidden");
      
      // Ouvri WhatsApp admin otomatik
      const adminNumber = "https://wa.me/50948404585";
      const text = encodeURIComponent(`Nouvo demann pou: ${anons.titre} | Kliyan: ${num}`);
      window.open(`${adminNumber}?text=${text}`, "_blank");
    }
  };
}

// ----------------- Afiche anons -----------------
async function afficheAnonsIndex(){
  const res = await fetch("/get_annonces");
  const annonces = await res.json();

  const sections = {
    kay: document.getElementById("accueil"),
    Tè: document.getElementById("terres"),
    Sèvis: document.getElementById("services"),
  };

  Object.values(sections).forEach(sec => {
    sec.querySelectorAll(".property-card").forEach(e=>e.remove());
  });

  annonces.forEach(a => {
    const sec = sections[a.categorie];
    if(!sec) return;

    const div = document.createElement("div");
    div.className = "property-card";
    div.innerHTML = `
      <img src="${a.imageUrl}" alt="${a.titre}" class="property-img">
      <div class="property-info">
        <h3>${a.titre}</h3>
        <p><strong>Pri:</strong> ${a.prix}</p>
        <p><strong>Adrès:</strong> ${a.adresse}</p>
        <p><strong>Deskripsyon:</strong> ${a.description}</p>
        <button class="details-btn">💬 Enterese?</button>
      </div>
    `;
    sec.appendChild(div);

    div.querySelector(".details-btn").onclick = ()=>montrePopup(a);
  });
}

document.addEventListener("DOMContentLoaded", afficheAnonsIndex);
