/*************************
FIREBASE
*************************/

const auth = firebase.auth();
const db = firebase.database();

/*************************
POPUP SYSTEM
*************************/

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
input.type="text";

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


/*************************
EMAIL VERIFICATION
*************************/

async function createAccount(email,password){

try{

const userCredential = await auth.createUserWithEmailAndPassword(email,password);

await userCredential.user.sendEmailVerification();

showMessage("📧 Nou voye yon email verifikasyon. Tcheke Gmail ou.");

return true;

}catch(err){

console.log(err);

if(err.code==="auth/email-already-in-use"){

showMessage("Email deja itilize ❌");

}
else if(err.code==="auth/invalid-email"){

showMessage("Email pa valab ❌");

}
else if(err.code==="auth/weak-password"){

showMessage("Modpas twò fèb ❌");

}
else{

showMessage("Erè kreye kont ❌");

}

return false;

}

}


async function checkEmailVerified(){

const user = auth.currentUser;

if(!user) return false;

await user.reload();

if(user.emailVerified){

return true;

}else{

showMessage("Tanpri verifye email ou avan");

return false;

}

}


/*************************
MONCASH PAYMENT
*************************/

async function payMonCash(phone){

try{

const response = await fetch("https://YOURSERVER.com/pay",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({phone:phone,amount:100})

});

const data = await response.json();

if(data.success){

showMessage("Peman reyisi ✔");

return true;

}else{

showMessage("Peman echwe ❌");

return false;

}

}catch(err){

console.log(err);

showMessage("Erè MonCash");

return false;

}

}


/*************************
SIGNUP
*************************/

async function signup(){

const name = val("name");
const lastname = val("lastname");
const pseudo = val("pseudo");
const serie = val("serie");
const email = val("contact");

if(!pseudo || !email || !serie){

status("Ranpli tout chan yo","red");

return;

}


/* verify pseudo */

const snapPseudo = await db.ref("users")
.orderByChild("pseudo")
.equalTo(pseudo)
.once("value");

if(snapPseudo.exists()){

status("Pseudo deja egziste ❌","red");

return;

}


/* verify email nan database sèlman */

const snapEmail = await db.ref("users")
.orderByChild("email")
.equalTo(email)
.once("value");

if(snapEmail.exists()){

status("Email sa deja enskri ❌","red");

return;

}


/* PASSWORD */

let password="";

do{

password = await askInput("Kreye yon modpas (min 6 karaktè)");

if(!password || password.length<6){

showMessage("Modpas twò kout ❌");

}

}while(!password || password.length<6);


/* CREATE ACCOUNT */

const created = await createAccount(email,password);

if(!created) return;


/* WAIT EMAIL VERIFICATION */

await askInput("Apre ou verifye email la nan Gmail, tape OK");


const verified = await checkEmailVerified();

if(!verified){

const user = auth.currentUser;

if(user){

await user.delete(); // efase kont ki pa verifye

}

return;

}


/* MONCASH */

const phone = await askInput("Antre nimewo MonCash");

const paid = await payMonCash(phone);

if(!paid) return;


/* SAVE USER */

const uid = auth.currentUser.uid;

const user={

name,
lastname,
pseudo,
serie,
email,
points:0,
verified:true,
createdAt:Date.now()

};


await db.ref("users/"+uid).set(user);


localStorage.setItem("ns4_user",JSON.stringify(user));


status("Kont kreye ✔","green");


setTimeout(()=>location="home.html",1000);

}


/*************************
HELPERS
*************************/

function val(id){

return document.getElementById(id).value.trim();

}

function status(msg,color){

const s=document.getElementById("status");

s.innerText=msg;

s.style.color=color;

}


/*************************
INIT
*************************/

document.addEventListener("DOMContentLoaded",function(){

document.getElementById("signupBtn").addEventListener("click",signup);

});
