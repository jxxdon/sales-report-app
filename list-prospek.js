import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================
   USER
===================== */
const user = localStorage.getItem("user")?.trim().toLowerCase();
if (!user) location.href = "index.html";
const isAdmin = user === "admin";

/* =====================
   ELEMENT
===================== */
const prospekList = document.getElementById("prospekList");
const searchInput = document.getElementById("searchInput");
const shortlistBox = document.getElementById("shortlistProgress");
const statsBox = document.getElementById("statsBox");

const modal = document.getElementById("detailModal");
const closeModal = document.querySelector(".close");
const detailContent = document.getElementById("detailContent");
const progressList = document.getElementById("progressList");
const commentInput = document.getElementById("commentInput");
const btnPost = document.getElementById("btnPostComment");
const commentList = document.getElementById("commentList");

/* =====================
   STATE
===================== */
let unsubscribe = null;
let currentDocId = null;
let currentProspekNama = "";
let selectedProgress = null;
let shortlistProgress = "";

/* =====================
   CONST
===================== */
const PROGRESS = [
  "Cold","Warm","Hot","Survey",
  "Negosiasi","Booking","DP",
  "Closing","Lost","Batal"
];

const PROGRESS_COLOR = {
  Cold:"#b0bec5",
  Warm:"#ffcc80",
  Hot:"#ff7043",
  Survey:"#64b5f6",
  Negosiasi:"#9575cd",
  Booking:"#4caf50",
  DP:"#26a69a",
  Closing:"#2e7d32",
  Lost:"#ef5350",
  Batal:"#9e9e9e"
};

/* =====================
   HELPER
===================== */
const cleanPhone = v => v ? v.replace(/\D/g,"") : "";

function getStatus(createdAt){
  if (!createdAt || !createdAt.toDate) return "Personal Lead";
  const diff = (new Date()-createdAt.toDate())/(1000*60*60*24);
  return diff < 30 ? "Personal Lead" : "Open Lead";
}

function formatDate(ts){
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("id-ID",{
    day:"2-digit",month:"short",year:"2-digit",
    hour:"2-digit",minute:"2-digit",second:"2-digit"
  });
}

/* =====================
   LOAD PROSPEK
===================== */
function loadProspek(keyword=""){
  if (unsubscribe) unsubscribe();

  const search = keyword.trim().toLowerCase();
  const phoneSearch = cleanPhone(keyword);

  let q;
  if (isAdmin || search) {
    q = query(collection(db,"prospek"));
  } else {
    q = query(
      collection(db,"prospek"),
      where("namaUser","==",user)
    );
  }

  unsubscribe = onSnapshot(q, snap=>{
    prospekList.innerHTML = "";

    let total=0, totalSurvey=0, totalBooking=0;

    let docs = snap.docs.map(d=>({
      id:d.id,
      ...d.data()
    }));

    // SORT: INPUT TERBARU (DEFAULT)
    docs.sort((a,b)=>{
      const ta=a.createdAt?.toDate?.()||new Date(0);
      const tb=b.createdAt?.toDate?.()||new Date(0);
      return tb-ta;
    });

    docs.forEach(d=>{
      total++;

      const lastProgress =
        d.comments?.length
          ? d.comments[d.comments.length-1].progress
          : "";

      if (lastProgress==="Survey") totalSurvey++;
      if (lastProgress==="Booking") totalBooking++;

      // FILTER SEARCH
      if (search){
        const namaMatch=(d.nama||"").toLowerCase().includes(search);
        const telpMatch=phoneSearch && cleanPhone(d.noTelp).includes(phoneSearch);
        if (!namaMatch && !telpMatch) return;
      }

      // FILTER SHORTLIST
      if (shortlistProgress && lastProgress!==shortlistProgress) return;

      const card=document.createElement("div");
      card.className="prospek-card";

      card.innerHTML=`
        <div class="nama">${d.nama||"-"}</div>
        <div class="info">
          📞 ${d.noTelp||"-"} - ${d.asalKota||"-"} - ${d.asalProspek||"-"}
        </div>
        <div class="status-line">
          ${
            lastProgress
            ? `<span class="status" style="background:${PROGRESS_COLOR[lastProgress]};color:#fff">
                ${lastProgress}
              </span>`
            : ""
          }
          <span class="status ${getStatus(d.createdAt)==="Personal Lead"?"status-personal":"status-open"}">
            ${getStatus(d.createdAt)}
          </span>
        </div>
      `;

      card.onclick=()=>openDetail(d.id,d);
      prospekList.appendChild(card);
    });

    if (!prospekList.innerHTML){
      prospekList.innerHTML="<p style='text-align:center;color:#999;padding:40px'>Tidak ada prospek</p>";
    }

    // STATS
    statsBox.innerHTML=`
      Total Prospek: <b>${total}</b> |
      Total Survey: <b>${totalSurvey}</b> |
      Total Booking: <b>${totalBooking}</b>
    `;
  });
}

/* =====================
   DETAIL + COMMENT
===================== */
function openDetail(id,data){
  currentDocId=id;
  currentProspekNama=data.nama;
  selectedProgress=null;

  detailContent.innerHTML=`<div style="white-space:pre-wrap">${data.catatan||"-"}</div>`;
  renderProgress();
  loadComments();
  modal.style.display="flex";
}

function renderProgress(){
  progressList.innerHTML="";
  PROGRESS.forEach(p=>{
    const btn=document.createElement("button");
    btn.textContent=p;
    btn.style.cssText=`
      padding:4px 10px;
      border-radius:12px;
      border:none;
      background:${PROGRESS_COLOR[p]};
      color:#fff;
      font-size:.8em;
      cursor:pointer;
      margin:2px;
    `;
    btn.onclick=()=>{
      selectedProgress=p;
    };
    progressList.appendChild(btn);
  });
}

function loadComments(){
  onSnapshot(doc(db,"prospek",currentDocId),snap=>{
    const comments=snap.data().comments||[];
    commentList.innerHTML="";
    comments.forEach(c=>{
      commentList.innerHTML+=`
        <div style="margin-bottom:10px">
          <b>${c.progress}</b> - ${c.text}<br>
          <small>${c.user} ; ${formatDate(c.createdAt)}</small>
        </div>
      `;
    });
  });
}

/* =====================
   POST COMMENT
===================== */
btnPost.onclick=async()=>{
  const text=commentInput.value.trim();
  if (!text||!selectedProgress) return alert("Lengkapi komentar");

  await updateDoc(doc(db,"prospek",currentDocId),{
    comments:arrayUnion({
      progress:selectedProgress,
      text,
      user,
      createdAt:new Date()
    })
  });

  commentInput.value="";
  selectedProgress=null;
  renderProgress();
};

/* =====================
   SHORTLIST UI
===================== */
PROGRESS.forEach(p=>{
  const b=document.createElement("button");
  b.textContent=p;
  b.style.cssText=`
    padding:6px 12px;
    border:none;
    border-radius:14px;
    background:${PROGRESS_COLOR[p]};
    color:#fff;
    margin:4px;
    cursor:pointer;
  `;
  b.onclick=()=>{
    shortlistProgress = shortlistProgress===p ? "" : p;
    loadProspek(searchInput.value);
  };
  shortlistBox.appendChild(b);
});

/* =====================
   EVENT
===================== */
closeModal.onclick=()=>modal.style.display="none";
searchInput.oninput=e=>{
  clearTimeout(window._d);
  window._d=setTimeout(()=>loadProspek(e.target.value),300);
};

/* =====================
   INIT
===================== */
loadProspek();
