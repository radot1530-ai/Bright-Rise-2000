// Remplacez par votre propre configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDxN2jYclFAeSh9tMvkoeZCTsFvWNQYOzA",
    authDomain: "ns4supportplus.firebaseapp.com",
    projectId: "ns4supportplus",
    storageBucket: "ns4supportplus.firebasestorage.app",
    messagingSenderId: "1072291248908",
    appId: "1:1072291248908:web:711d01129b833847c5a729",
    measurementId: "G-DEYNQ8GQ9B"
};
const REDIRECT_AFTER_AUTH = "a-propos.html"; // page après connexion

const form = document.getElementById("form");
const msg = document.getElementById("msg");
const mode = form.dataset.mode;
const say = (t, ok = false) => { msg.textContent = t; msg.style.color = ok ? "#fff" : "#ff8a8a"; };

const toggle = document.getElementById("toggle");
toggle.addEventListener("click", () => {
  const p = document.getElementById("password");
  const show = p.type === "password";
  p.type = show ? "text" : "password";
  toggle.textContent = show ? "Masquer" : "Afficher";
});

const errors = {
  "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
  "auth/user-not-found": "Aucun compte avec cet e-mail.",
  "auth/wrong-password": "Mot de passe incorrect.",
  "auth/email-already-in-use": "Cet e-mail est déjà utilisé. Connectez-vous.",
  "auth/weak-password": "Mot de passe trop court : 6 caractères minimum.",
  "auth/invalid-email": "Adresse e-mail invalide.",
  "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
  "auth/network-request-failed": "Problème de connexion. Vérifiez votre réseau."
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = form.email.value.trim();
  const password = form.password.value;
  if (!email || !password) return say("Remplissez tous les champs.");
  if (mode === "register") {
    if (!form.name.value.trim()) return say("Entrez votre nom.");
    if (password.length < 6) return say("Mot de passe trop court : 6 caractères minimum.");
    if (password !== form.confirm.value) return say("Les mots de passe ne correspondent pas.");
  }
  if (firebaseConfig.apiKey === "VOTRE_API_KEY") return say("Ajoutez votre configuration Firebase dans auth.js.");
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const A = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    const auth = A.getAuth(initializeApp(firebaseConfig));
    if (mode === "register") {
      const cred = await A.createUserWithEmailAndPassword(auth, email, password);
      await A.updateProfile(cred.user, { displayName: form.name.value.trim() });
      say("Compte créé. Redirection…", true);
    } else {
      await A.signInWithEmailAndPassword(auth, email, password);
      say("Connexion réussie. Redirection…", true);
    }
    setTimeout(() => (location.href = REDIRECT_AFTER_AUTH), 700);
  } catch (err) {
    say(errors[err.code] || "Une erreur est survenue. Réessayez.");
    btn.disabled = false;
  }
});
