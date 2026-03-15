// 🔹 FIREBASE DATABASE
const db = firebase.database();

// 🔹 EMAILJS CONFIG
// Kreye kont sou https://www.emailjs.com/ epi ranpli serviceID & templateID ou
const EMAILJS_SERVICE = "service_nu5u2ti"; // ranplase ak serviceID ou
const EMAILJS_TEMPLATE = "template_dlt7swv"; // ranplase ak templateID ou
const EMAILJS_PUBLICKEY = "6B2SmWLisR0O_FHEK"; // ranplase ak public key ou

// ===============================
// POPUP
// ===============================
function showMessage(text){
  const box=document.createElement("div");
  box.className="popup-overlay";

  const content=document.createElement("div");
  content.className="popup-content";

  const p=document.createElement("p");
  p.innerText=text;

  const btn=document.createElement("button");
  btn.innerText="OK";

  btn.onclick=function(){
    document.body.removeChild(box);
  };

  content.appendChild(p);
  content.appendChild(btn);
  box.appendChild(content);

  document.body.appendChild(box);
}

function askInput(text){
  return new Promise(resolve=>{
    const box=document.createElement("div");
    box.className="popup-overlay";

    const content=document.createElement("div");
    content.className="popup-content";

    const p=document.createElement("p");
    p.innerText=text;

    const input=document.createElement("input");

    const btn=document.createElement("button");
    btn.innerText="OK";

    btn.onclick=function(){
      const value=input.value;
      document.body.removeChild(box);
      resolve(value);
    };

    content.appendChild(p);
    content.appendChild(input);
    content.appendChild(btn);
    box.appendChild(content);

    document.body.appendChild(box);
  });
}

// ===============================
// OTP SYSTEM
// ===============================
function generateOTP(){
  return Math.floor(1000 + Math.random()*9000).toString();
}

function saveOTP(code){
  localStorage.setItem("ns4_otp", code);
  localStorage.setItem("ns4_otp_time", Date.now());
}

function verifyOTP(input){
  const saved = localStorage.getItem("ns4_otp");
  const time = localStorage.getItem("ns4_otp_time");
  if(!saved) return false;

  const expired = (Date.now() - time) > 300000; // 5 min
  if(expired){
    showMessage("Kòd la ekspire ❌");
    return false;
  }

  return input === saved;
}

async function sendEmailOTP(email, code){
  if(!email) return;
  try {
    await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
      to_email: email,
      otp: code
    }, EMAILJS_PUBLICKEY);
    console.log("OTP voye sou email!");
  } catch(err){
    console.log("Error voye OTP:", err);
  }
}

// ===============================
// MONCASH PAYMENT
// ===============================
async function payMonCash(amount, phone){
  try {
    const response = await fetch("https://api.moncashbutton.digicelgroup.com/payment", {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "Authorization":"Bearer YOUR_ACCESS_TOKEN" // ranplase ak token ou
      },
      body: JSON.stringify({
        amount: amount,
        phone: phone,
        description: "NS4 Payment"
      })
    });
    const data = await response.json();
    if(data.status === "success"){
      showMessage("Peman aksepte ✅");
      return true;
    } else {
      showMessage("Peman echwe ❌");
      return false;
    }
  } catch(err){
    console.log(err);
    showMessage("Erè nan MonCash ❌");
    return false;
  }
}

// ===============================
// SIGNUP
// ===============================
async function signup(){
  const pseudo = val("pseudo");
  const contact = val("contact");
  const serie = val("serie");

  if(!pseudo || !contact || !serie){
    status("Ranpli tout chan yo ❌","red");
    return;
  }

  // verify pseudo deja egziste
  const snapPseudo = await db.ref("users/"+pseudo).once("value");
  if(snapPseudo.exists()){
    status("Pseudo deja egziste ❌","red");
    return;
  }

  // verify email/WhatsApp deja itilize
  const snapAll = await db.ref("users").once("value");
  if(snapAll.exists()){
    const allUsers = snapAll.val();
    for(let key in allUsers){
      if(allUsers[key].contact === contact){
        status("Email oswa WhatsApp deja itilize ❌","red");
        return;
      }
    }
  }

  // 🔹 OTP EMAIL
  const code = generateOTP();
  saveOTP(code);
  await sendEmailOTP(contact, code);
  showMessage("Kòd verifikasyon voye sou email ou ✅");

  const userCode = await askInput("Antre kòd la:");
  if(!verifyOTP(userCode)){
    status("Move kòd ❌","red");
    return;
  }

  // 🔹 MONCASH PAYMENT
  const phone = await askInput("Antre nimewo MonCash pou peman 100 HTG:");
  const paid = await payMonCash(100, phone);
  if(!paid) return;

  // 🔹 SAVE USER FIREBASE
  const user = {pseudo, contact, serie, verified: true};
  await db.ref("users/"+pseudo).set(user);
  localStorage.setItem("ns4_user", JSON.stringify(user));

  status("Kont kreye ✔","green");
  setTimeout(()=>location="home.html",800);
}

// ===============================
// HELPERS
// ===============================
function val(id){ return document.getElementById(id).value.trim(); }
function status(msg,color){ const s=document.getElementById("status"); s.innerText=msg; s.style.color=color; }

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", function(){
  document.getElementById("signupBtn").addEventListener("click", signup);
});