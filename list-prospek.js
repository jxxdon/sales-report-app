import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "./firebase.js";

let user = null;
let isAdmin = false;

onAuthStateChanged(auth, (u) => {
  if (!u) {
    window.location.href = "index.html";
    return;
  }

  // menyamakan dengan sistem lama
  user = u.email.startsWith("admin") ? "admin" : u.email;
  isAdmin = user === "admin";
  init(); // ✅ WAJIB
});

import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================
   USER
===================== */

/* =====================
   ELEMENT
===================== */
const prospekList = document.getElementById("prospekList");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("detailModal");
const closeModal = document.querySelector(".close");
const detailContent = document.getElementById("detailContent");
const progressList = document.getElementById("progressList");
const commentInput = document.getElementById("commentInput");
const btnPost = document.getElementById("btnPostComment");
const commentList = document.getElementById("commentList");

/* =====================
   WA BUTTON
===================== */
const btnWa = document.createElement("button");
btnWa.textContent = "Kirim WA";
btnWa.style.cssText = `
  padding:6px 14px;
  border-radius:8px;
  border:1px solid #25D366;
  background:#25D366;
  color:#fff;
  cursor:pointer;
  margin-bottom:10px;
`;

btnWa.onclick = () => {
  if (!currentDocId) return;
  onSnapshot(doc(db, "prospek", currentDocId), snap => {
    const d = snap.data();
    if (!d?.noTelp) return;
    let phone = d.noTelp.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
    window.open(`https://wa.me/${phone}`, "_blank");
  });
};

/* =====================
   SHORTLIST
===================== */
const shortlistWrap = document.createElement("div");
shortlistWrap.style.cssText = `
  display:flex;
  gap:8px;
  margin:10px 0 16px;
  flex-wrap:wrap;
  justify-content:center;
`;

const SHORTLIST = ["Hot","Survey","Negosiasi","Booking","Closing"];
let selectedShortlistProgress = null;

SHORTLIST.forEach(p => {
  const btn = document.createElement("button");
  btn.textContent = p;
  btn.style.cssText = `
    padding:6px 14px;
    border-radius:14px;
    border:1px solid #ccc;
    background:#f5f5f5;
    font-size:.85em;
    cursor:pointer;
  `;

  btn.onclick = () => {
    selectedShortlistProgress =
      selectedShortlistProgress === p ? null : p;

    [...shortlistWrap.children].forEach(b=>{
      b.style.background="#f5f5f5";
      b.style.color="#000";
    });

    if (selectedShortlistProgress) {
      btn.style.background="#5d5af8";
      btn.style.color="#fff";
    }

    visibleCount = 10;
    loadProspek(searchInput.value);
  };

  shortlistWrap.appendChild(btn);
});

searchInput.parentNode.insertBefore(
  shortlistWrap,
  searchInput.nextSibling
);

/* =====================
   STATE
===================== */
let unsubscribe = null;
let currentDocId = null;
let currentProspekNama = "";
let selectedProgress = null;
let visibleCount = 10;

/* =====================
   CONST
===================== */
const PROGRESS = [
  "Cold","Warm","Hot","Survey",
  "Negosiasi","Booking","DP",
  "Closing","Lost","Batal"
];

/* =====================
   HELPER
===================== */
const cleanPhone = v => v ? v.replace(/\D/g,"") : "";

function getStatus(createdAt) {
  if (!createdAt?.toDate) return "Personal Lead";
  const diff = (new Date() - createdAt.toDate()) / 86400000;
  return diff < 30 ? "Personal Lead" : "Open Lead";
}

function formatDate(ts) {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("id-ID");
}

/* =====================
   LOAD PROSPEK (FIXED)
===================== */
function loadProspek(keyword = "") {
  if (unsubscribe) unsubscribe();

  const search = keyword.trim().toLowerCase();
  const phoneSearch = cleanPhone(keyword);

  let q;
  if (isAdmin || search || phoneSearch) {
    q = query(collection(db,"prospek"));
  } else {
    q = query(
      collection(db,"prospek"),
      where("namaUser","==",user)
    );
  }

  unsubscribe = onSnapshot(q, snap => {
    prospekList.innerHTML = "";

    let docs = snap.docs.sort((a,b)=>{
      const ta = a.data().createdAt?.toDate?.() || 0;
      const tb = b.data().createdAt?.toDate?.() || 0;
      return tb - ta;
    });

    // FILTER
    docs = docs.filter(docSnap=>{
      const d = docSnap.data();

      if (selectedShortlistProgress) {
        const c = d.comments || [];
        if (!c.length) return false;
        if (c[c.length-1]?.progress !== selectedShortlistProgress)
          return false;
      }

      if (search) {
        const n = (d.nama||"").toLowerCase().includes(search);
        const t = phoneSearch &&
          cleanPhone(d.noTelp).includes(phoneSearch);
        if (!n && !t) return false;
      }
      return true;
    });

    docs.slice(0,visibleCount).forEach(docSnap=>{
      const d = docSnap.data();
      const status = getStatus(d.createdAt);
      const card = document.createElement("div");
      card.className = "prospek-card";
      const ketertarikan = d.ketertarikan || "-";
const catatan = d.catatan || "-";

card.innerHTML = `
  <div class="nama">${d.nama||"-"}</div>
  <div class="info">
    📞 ${d.noTelp||"-"} - ${d.asalKota||"-"} - ${d.asalProspek||"-"} - 
    ${ketertarikan} - ${catatan}
  </div>
  <div class="info">👤 ${d.namaUser||"-"}</div>
  <div class="status-line">
    <span class="status ${status==="Personal Lead"?"status-personal":"status-open"}">${status}</span>
    <span style="color:#888;font-size:.9em;">Klik untuk detail →</span>
  </div>
`;
      card.onclick = ()=>openDetail(docSnap.id,d);
      prospekList.appendChild(card);
    });

    if (!prospekList.innerHTML) {
      prospekList.innerHTML =
        "<p style='text-align:center;color:#999;padding:40px'>Tidak ada prospek</p>";
    }
  });
}

/* =====================
   DETAIL
===================== */
function openDetail(id,data){
  currentDocId=id;
  currentProspekNama=data.nama||"-";
  selectedProgress=null;

  detailContent.innerHTML =
    `<div style="white-space:pre-wrap">${data.catatan||"-"}</div>`;

  if (!btnWa.isConnected)
    detailContent.prepend(btnWa);

  renderProgress();
  loadComments();
  modal.style.display="flex";
}

function renderProgress(){
  progressList.innerHTML="";
  PROGRESS.forEach(p=>{
    const b=document.createElement("button");
    b.textContent=p;
    b.style.cssText="padding:4px 10px;border-radius:12px;border:1px solid #ccc;background:#f1f1f1;font-size:.85em;";
    b.onclick=()=>{
      selectedProgress=p;
      [...progressList.children].forEach(x=>x.style.background="#f1f1f1");
      b.style.background="#5d5af8";
      b.style.color="#fff";
    };
    progressList.appendChild(b);
  });
}

function loadComments(){
  onSnapshot(doc(db,"prospek",currentDocId),snap=>{
    commentList.innerHTML="";
    (snap.data().comments||[]).forEach(c=>{
      commentList.innerHTML+=`
        <div style="margin-bottom:12px">
          <strong>${c.progress}</strong> - ${c.text}<br>
          <small>${c.user} ; ${formatDate(c.createdAt)}</small>
        </div>`;
    });
  });
}

/* =====================
   POST COMMENT
===================== */
btnPost.onclick=async()=>{
  if(!commentInput.value||!selectedProgress)return;
  await updateDoc(doc(db,"prospek",currentDocId),{
    comments:arrayUnion({
      progress:selectedProgress,
      text:commentInput.value,
      user,
      createdAt:new Date()
    })
  });

  await setDoc(
  doc(db,"aktivitas",`${Date.now()}_${user}`),
  {
    user,
    role: isAdmin ? "admin" : "sales",
    tipe: "KOMENTAR",
    progress: selectedProgress,
    komentar: commentInput.value,
    prospekId: currentDocId,
    namaProspek: currentProspekNama, // ✅ TAMBAHKAN INI
    createdAt: new Date()
  }
);



  commentInput.value="";
  selectedProgress=null;
  renderProgress();
};

/* =====================
   EVENT
===================== */
window.addEventListener("scroll",()=>{
  if(window.innerHeight+window.scrollY>=document.body.offsetHeight-200){
    visibleCount+=10;
    loadProspek(searchInput.value);
  }
});

closeModal.onclick=()=>modal.style.display="none";

searchInput.addEventListener("input",e=>{
  clearTimeout(window._d);
  window._d=setTimeout(()=>{
    visibleCount=10;
    loadProspek(e.target.value);
  },300);
});

/* =====================
   INIT
===================== */
function init() {

  const openId = localStorage.getItem("openProspekId");
  if (openId) {
    localStorage.removeItem("openProspekId");

    onSnapshot(doc(db, "prospek", openId), snap => {
      if (snap.exists()) {
        openDetail(openId, snap.data());
      }
    });
  }

  loadProspek();
}
