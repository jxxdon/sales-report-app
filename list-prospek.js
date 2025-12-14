import { db } from "./firebase.js";
import {
  collection, query, where,
  onSnapshot, doc, updateDoc,
  arrayUnion, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const user = localStorage.getItem("user")?.toLowerCase();
if (!user) location.href="index.html";
const isAdmin = user==="admin";

const prospekList = document.getElementById("prospekList");
const searchInput = document.getElementById("searchInput");

const sumTotal = document.getElementById("sumTotal");
const sumSurvey = document.getElementById("sumSurvey");
const sumBooking = document.getElementById("sumBooking");

const modal = document.getElementById("detailModal");
const closeModal = document.querySelector(".close");
const detailContent = document.getElementById("detailContent");
const progressList = document.getElementById("progressList");
const commentInput = document.getElementById("commentInput");
const btnPost = document.getElementById("btnPostComment");
const commentList = document.getElementById("commentList");

let currentDocId=null, selectedProgress=null, currentNama="";

const PROGRESS=["Cold","Warm","Hot","Survey","Booking","Closing","Lost","Batal"];

const cleanPhone=v=>v?v.replace(/\D/g,""):"";

function lastProgress(comments=[]){
  if(!comments.length) return "-";
  return comments[comments.length-1].progress;
}

function loadProspek(keyword=""){
  const search=keyword.toLowerCase();
  let q=isAdmin
    ? query(collection(db,"prospek"))
    : query(collection(db,"prospek"), where("namaUser","==",user));

  onSnapshot(q,snap=>{
    prospekList.innerHTML="";
    let total=0,survey=0,booking=0;

    const docs=snap.docs.sort((a,b)=>{
      const ta=a.data().createdAt?.toDate?.()||0;
      const tb=b.data().createdAt?.toDate?.()||0;
      return tb-ta;
    });

    docs.forEach(ds=>{
      const d=ds.data();
      if(search){
        if(!(d.nama||"").toLowerCase().includes(search)
          && !cleanPhone(d.noTelp).includes(cleanPhone(search))) return;
      }

      total++;
      const prog=lastProgress(d.comments);
      if(prog==="Survey") survey++;
      if(prog==="Booking") booking++;

      const card=document.createElement("div");
      card.className="prospek-card";
      card.innerHTML=`
        <div class="nama">${d.nama||"-"}</div>
        <div class="info">📞 ${d.noTelp||"-"} - ${d.asalProspek||"-"}</div>
        <div class="status-line">
          <span class="badge p-${prog}">${prog}</span>
          <span style="font-size:.85em;color:#888">Detail →</span>
        </div>
      `;
      card.onclick=()=>openDetail(ds.id,d);
      prospekList.appendChild(card);
    });

    sumTotal.textContent=total;
    sumSurvey.textContent=survey;
    sumBooking.textContent=booking;

    if(!prospekList.innerHTML)
      prospekList.innerHTML="<p style='text-align:center;color:#999'>Tidak ada prospek</p>";
  });
}

function openDetail(id,data){
  currentDocId=id;
  currentNama=data.nama;
  selectedProgress=null;
  detailContent.textContent=data.catatan||"-";
  renderProgress();
  loadComments();
  modal.style.display="flex";
}

function renderProgress(){
  progressList.innerHTML="";
  PROGRESS.forEach(p=>{
    const b=document.createElement("button");
    b.textContent=p;
    b.onclick=()=>{
      selectedProgress=p;
      [...progressList.children].forEach(x=>x.style.background="#eee");
      b.style.background="#5d5af8"; b.style.color="#fff";
    };
    progressList.appendChild(b);
  });
}

function loadComments(){
  onSnapshot(doc(db,"prospek",currentDocId),s=>{
    commentList.innerHTML="";
    (s.data().comments||[]).forEach(c=>{
      commentList.innerHTML+=`
        <div><b>${c.progress}</b> - ${c.text}<br>
        <small>${c.user}</small></div>`;
    });
  });
}

btnPost.onclick=async()=>{
  if(!commentInput.value||!selectedProgress) return;
  await updateDoc(doc(db,"prospek",currentDocId),{
    comments:arrayUnion({
      progress:selectedProgress,
      text:commentInput.value,
      user,
      createdAt:new Date()
    })
  });
  await setDoc(doc(db,"aktivitas",Date.now()+"_"+user),{
    user,tipe:"KOMENTAR",
    pesan:`${currentNama} - ${selectedProgress}`,
    createdAt:new Date()
  });
  commentInput.value="";
};

closeModal.onclick=()=>modal.style.display="none";
searchInput.oninput=e=>loadProspek(e.target.value);

loadProspek();
