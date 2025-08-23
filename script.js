/* ===== SemStack Demo Auth + Purchase (localStorage) ===== */

const LS_USER_KEY = "ss_currentUser";
const LS_USERS = "ss_users";           // { username: { password } }  (demo only)
const LS_PURCHASES = "ss_purchases";   // { username: ["sem1","sem2",...] }

function read(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch{ return fallback; } }
function write(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function getCurrentUser(){ return localStorage.getItem(LS_USER_KEY); }
function setCurrentUser(u){ if(u){ localStorage.setItem(LS_USER_KEY, u); } else { localStorage.removeItem(LS_USER_KEY); } }
function getUsers(){ return read(LS_USERS, {}); }
function saveUsers(obj){ write(LS_USERS, obj); }
function getPurchases(){ return read(LS_PURCHASES, {}); }
function savePurchases(obj){ write(LS_PURCHASES, obj); }

function ensureUserBuckets(u){
  const purchases = getPurchases();
  if(!purchases[u]){ purchases[u] = []; savePurchases(purchases); }
}

function isPurchased(u, semId){
  const purchases = getPurchases();
  return purchases[u]?.includes(semId);
}

function purchase(u, semId){
  const purchases = getPurchases();
  if(!purchases[u]) purchases[u] = [];
  if(!purchases[u].includes(semId)) purchases[u].push(semId);
  savePurchases(purchases);
}

/* ----- Header user display (shared on all pages) ----- */
function renderHeaderUser(){
  const user = getCurrentUser();
  const nav = document.getElementById("nav-links");
  if(!nav) return;

  if(user){
    nav.innerHTML = `
      <span>Hi, <strong>${user}</strong></span>
      <a href="#" id="logout-link">Logout</a>
    `;
    document.getElementById("logout-link").addEventListener("click", (e)=>{
      e.preventDefault();
      setCurrentUser(null);
      location.reload();
    });
  }else{
    nav.innerHTML = `
      <a href="login.html">Login</a>
      <a href="login.html#register">Register</a>
    `;
  }
}

/* ----- Login page handlers ----- */
function initLoginPage(){
  renderHeaderUser();
  const user = getCurrentUser();
  if(user){ // already logged in -> maybe redirect back
    const next = new URLSearchParams(location.search).get("next");
    if(next){ location.href = next; }
  }
  const boxLogin = document.getElementById("box-login");
  const boxRegister = document.getElementById("box-register");
  if(location.hash === "#register"){ boxLogin.style.display="none"; boxRegister.style.display="block"; }

  // Login
  const loginForm = document.getElementById("login-form");
  if(loginForm){
    loginForm.addEventListener("submit",(e)=>{
      e.preventDefault();
      const username = loginForm.username.value.trim();
      const password = loginForm.password.value;
      if(!username || !password){ alert("Please fill all fields."); return; }
      const users = getUsers();
      if(!users[username] || users[username].password !== password){
        alert("Invalid credentials.");
        return;
      }
      setCurrentUser(username);
      ensureUserBuckets(username);
      const next = new URLSearchParams(location.search).get("next");
      location.href = next || "index.html";
    });
  }

  // Register
  const regForm = document.getElementById("register-form");
  if(regForm){
    regForm.addEventListener("submit",(e)=>{
      e.preventDefault();
      const username = regForm.username.value.trim();
      const password = regForm.password.value;
      if(!username || !password){ alert("Please fill all fields."); return; }
      const users = getUsers();
      if(users[username]){ alert("User already exists."); return; }
      users[username] = { password };
      saveUsers(users);
      setCurrentUser(username);
      ensureUserBuckets(username);
      const next = new URLSearchParams(location.search).get("next");
      location.href = next || "index.html";
    });
  }

  // Switch boxes
  document.querySelectorAll("[data-switch]").forEach(el=>{
    el.addEventListener("click",(e)=>{
      e.preventDefault();
      const target = el.getAttribute("data-switch");
      if(target==="register"){ boxLogin.style.display="none"; boxRegister.style.display="block"; }
      else { boxLogin.style.display="block"; boxRegister.style.display="none"; }
    });
  });
}

/* ----- Semester page renderer ----- */
function renderSemesterPage(config){
  // config = { id, title, price, topics:[], downloads:[{label,url}] }
  renderHeaderUser();
  const user = getCurrentUser();
  const buyBtn = document.getElementById("buy-btn");
  const dlWrap = document.getElementById("downloads");

  function showDownloads(){
    dlWrap.innerHTML = config.downloads.map(d=>`<a href="${d.url}" target="_blank" rel="noopener">📘 ${d.label}</a>`).join("");
    dlWrap.style.display="flex";
    buyBtn.style.display="none";
  }

  if(user && isPurchased(user, config.id)){ showDownloads(); }

  buyBtn.addEventListener("click", ()=>{
    const current = getCurrentUser();
    if(!current){
      // send back to this page after login
      location.href = `login.html?next=${encodeURIComponent(location.pathname)}`;
      return;
    }
    // DEMO: instantly “paid”
    purchase(current, config.id);
    alert(`Purchase successful for ${config.title}. Downloads unlocked!`);
    showDownloads();
  });
}
