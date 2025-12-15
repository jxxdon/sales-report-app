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
const user = localStorage.getItem("user")?.trim().toLowerCase();
if (!user) window.location.href = "index.html";
const isAdmin = user === "admin";

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
   SHORTLIST PROGRESS
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
    if (selectedShortlistProgress === p) {
      selectedShortlistProgress = null;
      btn.style.background = "#f5f5f5";
      btn.style.color = "#000";
    } else {
      selectedShortlistProgress = p;
      [...shortlistWrap.children].forEach(b=>{
        b.style.background="#f5f5f5";
        b.style.color="#000";
      });
      btn.style.background = "#5d5af8";
      btn.style.color = "#fff";
    }
    loadProspek(searchInput.value);
  };

  shortlistWrap.appendChild(btn);
});

// PASANG TEPAT SETELAH SEARCH INPUT
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
let selectedShortlistProgress = null;
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
const cleanPhone = (v) => (v ? v.replace(/\D/g, "") : "");

function getStatus(createdAt) {
  if (!createdAt || !createdAt.toDate) return "Personal Lead";
  const diff = (new Date() - createdAt.toDate()) / (1000*60*60*24);
  return diff < 30 ? "Personal Lead" : "Open Lead";
}

function formatDate(ts) {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("id-ID", {
    day:"2-digit", month:"short", year:"2-digit",
    hour:"2-digit", minute:"2-digit", second:"2-digit"
  });
}

/* =====================
   LOAD PROSPEK (FINAL)
===================== */
function loadProspek(keyword = "") {
  visibleCount = 10;
  if (unsubscribe) unsubscribe();

  const search = keyword.trim().toLowerCase();
  const phoneSearch = cleanPhone(keyword);

  let q;

  // ADMIN → semua
  if (isAdmin) {
    q = query(collection(db, "prospek"));

  // SALES + SEARCH → semua (difilter di frontend)
  } else if (search.length > 0 || phoneSearch.length > 0) {
    q = query(collection(db, "prospek"));

  // SALES NORMAL → hanya prospeknya
  } else {
    q = query(
      collection(db, "prospek"),
      where("namaUser", "==", user)
    );
  }

  unsubscribe = onSnapshot(q, snap => {
    prospekList.innerHTML = "";

    // SORT FRONTEND (AMAN DATA LAMA)
    const docs = snap.docs.sort((a, b) => {
      const ta = a.data().createdAt?.toDate?.() || new Date(0);
      const tb = b.data().createdAt?.toDate?.() || new Date(0);
      return tb - ta;
    });

    docs.slice(0, visibleCount).forEach(docSnap => {
      const d = docSnap.data();
// FILTER SHORTLIST BERDASARKAN KOMENTAR TERAKHIR
if (selectedShortlistProgress) {
  const comments = d.comments || [];
  if (!comments.length) return;

  const lastProgress =
    comments[comments.length - 1]?.progress;

  if (lastProgress !== selectedShortlistProgress) return;
}

      // FILTER SEARCH
      if (search) {
        const namaMatch = (d.nama || "").toLowerCase().includes(search);
        const telpMatch =
          phoneSearch.length > 0
            ? cleanPhone(d.noTelp).includes(phoneSearch)
            : false;
        if (!namaMatch && !telpMatch) return;
      }

      const status = getStatus(d.createdAt);
      const statusClass =
        status === "Personal Lead" ? "status-personal" : "status-open";

      const card = document.createElement("div");
      card.className = "prospek-card";

      card.innerHTML = `
        <div class="nama">${d.nama || "-"}</div>

        <div class="info">
          📞 ${d.noTelp || "-"} - ${d.asalKota || "-"} - ${d.asalProspek || "-"}
        </div>

        <div class="info">👤 ${d.namaUser || "-"}</div>

        <div class="status-line">
          <span class="status ${statusClass}">
            ${status}
          </span>
          <span style="color:#888;font-size:.9em;">
            Klik untuk detail →
          </span>
        </div>
      `;

      card.onclick = () => openDetail(docSnap.id, d);
      prospekList.appendChild(card);
    });

    if (!prospekList.innerHTML) {
      prospekList.innerHTML =
        "<p style='text-align:center;color:#999;padding:40px'>Tidak ada prospek</p>";
    }
  });
}

/* =====================
   DETAIL + COMMENT
===================== */
function openDetail(docId, data) {
  currentDocId = docId;
  currentProspekNama = data.nama || "-";
  selectedProgress = null;

  detailContent.innerHTML = `
    <div style="white-space:pre-wrap">${data.catatan || "-"}</div>
  `;

  renderProgress();
  loadComments();
  modal.style.display = "flex";
}

function renderProgress() {
  progressList.innerHTML = "";
  PROGRESS.forEach(p => {
    const btn = document.createElement("button");
    btn.textContent = p;
    btn.style.cssText = `
      padding:4px 10px;
      border-radius:12px;
      border:1px solid #ccc;
      background:#f1f1f1;
      cursor:pointer;
      font-size:.85em;
    `;
    btn.onclick = () => {
      selectedProgress = p;
      [...progressList.children].forEach(b=>{
        b.style.background="#f1f1f1";
        b.style.color="#000";
      });
      btn.style.background="#5d5af8";
      btn.style.color="#fff";
    };
    progressList.appendChild(btn);
  });
}

function loadComments() {
  onSnapshot(doc(db,"prospek",currentDocId), snap => {
    const comments = snap.data().comments || [];
    commentList.innerHTML = "";
    comments.forEach(c => {
      commentList.innerHTML += `
        <div style="margin-bottom:12px;">
          <strong>${c.progress}</strong> - ${c.text}<br>
          <small style="color:#666">
            ${c.user} ; ${formatDate(c.createdAt)}
          </small>
        </div>
      `;
    });
  });
}

/* =====================
   POST COMMENT + LOG
===================== */
btnPost.onclick = async () => {
  const text = commentInput.value.trim();
  if (!text) return alert("Komentar kosong");
  if (!selectedProgress) return alert("Pilih progres dulu");
  if (!currentDocId) return;

  // SIMPAN KOMENTAR
  await updateDoc(doc(db,"prospek",currentDocId), {
    comments: arrayUnion({
      progress: selectedProgress,
      text,
      user,
      createdAt: new Date()
    })
  });

  // LOG AKTIVITASawait setDoc(
  await setDoc(
  doc(db, "aktivitas", `${Date.now()}_${user}`),
  {
    user: user,
    role: isAdmin ? "admin" : "sales",
    tipe: "KOMENTAR",
    pesan: `Komentar di Prospek ${currentProspekNama} ; ${selectedProgress} - ${text}`,
    prospekId: currentDocId, // ⬅️ INI KUNCI NYAWA
    createdAt: new Date()
  }
);


  commentInput.value = "";
  selectedProgress = null;
  renderProgress();
};

/* =====================
   EVENT
===================== */
window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 200
  ) {
    visibleCount += 10;
    loadProspek(searchInput.value);
  }
});


closeModal.onclick = () => modal.style.display = "none";

searchInput.addEventListener("input", e => {
  clearTimeout(window._d);
  window._d = setTimeout(
    () => loadProspek(e.target.value),
    300
  );
});

/* =====================
   INIT
===================== */
const params = new URLSearchParams(window.location.search);
const openId = params.get("open");

if (openId) {
  onSnapshot(doc(db, "prospek", openId), snap => {
    if (snap.exists()) {
      openDetail(openId, snap.data());
    }
  });
}

loadProspek();
