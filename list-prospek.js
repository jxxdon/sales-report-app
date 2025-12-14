import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const user = localStorage.getItem("user");
if (!user) {
  window.location.href = "index.html";
}

const isAdmin = user === "admin";
const prospekList = document.getElementById("prospekList");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("detailModal");
const closeModal = document.querySelector(".close");
const detailContent = document.getElementById("detailContent");
const commentsList = document.getElementById("commentsList");
let currentDocId = null;
let currentData = null;

let unsubscribe = null; // Untuk menyimpan listener aktif

// Fungsi untuk membersihkan nomor telepon (hanya angka)
const cleanPhone = (phone) => phone ? phone.replace(/\D/g, '') : '';

// Fungsi utama untuk load prospek (DIPERBAIKI)
function loadProspek(searchTerm = "") {
  // Hapus listener lama jika ada
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  prospekList.innerHTML = "<p style='text-align:center; padding:40px; color:#999;'>Memuat data...</p>";

  const originalSearch = searchTerm.trim();
  const trimmedSearch = originalSearch.toLowerCase();
  const cleanedSearchPhone = cleanPhone(originalSearch);

  let q;
  if (isAdmin) {
    q = query(collection(db, "prospek"), orderBy("createdAt", "desc"));
  } else {
    q = query(collection(db, "prospek"), where("user", "==", user), orderBy("createdAt", "desc"));
  }

  unsubscribe = onSnapshot(q, (snapshot) => {
    prospekList.innerHTML = ""; // Kosongkan list

    if (snapshot.empty) {
      prospekList.innerHTML = "<p style='text-align:center; padding:50px; color:#999;'>Tidak ada prospek ditemukan</p>";
      return;
    }

    let hasVisible = false;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Filter client-side jika ada pencarian
      if (trimmedSearch) {
        const matchNama = data.nama ? data.nama.toLowerCase().includes(trimmedSearch) : false;
        const matchTelp = cleanedSearchPhone ? cleanPhone(data.noTelp).includes(cleanedSearchPhone) : false;
        if (!matchNama && !matchTelp) return;
      }

      hasVisible = true;

      const progres = Array.isArray(data.progresPenjualan) ? data.progresPenjualan.join(", ") : "-";
      const status = getStatusProspek(data);
      const statusClass = status.includes("Personal") ? "status-personal" :
                          status.includes("Open") ? "status-open" : "status-exclusive";

      const card = document.createElement("div");
      card.className = "prospek-card";
      card.innerHTML = `
        <div class="nama">${data.nama || "Tanpa Nama"}</div>
        <div class="info">📞 ${data.noTelp || "-"}</div>
        <div class="info">📈 Progres: ${progres}</div>
        <div class="info">👤 Dibuat oleh: ${data.user || "-"}</div>
        <div class="status-line">
          <span class="status ${statusClass}">${status}</span>
          <span style="color:#888; font-size:0.9em;">Klik untuk detail →</span>
        </div>
      `;
      card.onclick = () => openDetail(docSnap.id, data);
      prospekList.appendChild(card);
    });

    // Jika search aktif tapi tidak ada hasil
    if (!hasVisible && trimmedSearch) {
      prospekList.innerHTML = "<p style='text-align:center; padding:50px; color:#999;'>Tidak ada prospek yang sesuai dengan pencarian</p>";
    }

  }, (error) => {
    console.error("Error loading prospek:", error);
    prospekList.innerHTML = `<p style='text-align:center; color:red; padding:40px;'>Gagal memuat data: ${error.message}</p>`;
  });
}
// Hitung Status Prospek Otomatis
function getStatusProspek(data) {
  const now = new Date();
  const created = data.createdAt?.toDate() || new Date();
  const monthsDiff = (now - created) / (1000 * 60 * 60 * 24 * 30);

  if (Array.isArray(data.progresPenjualan) && data.progresPenjualan.includes("Closing")) {
    return "Exclusive Lead";
  } else if (monthsDiff < 1) {
    return "Personal Lead";
  } else {
    return "Open Lead";
  }
}

// Fungsi modal detail
function openDetail(docId, data) {
  currentDocId = docId;
  currentData = data;
  renderDetailView(data);
  loadComments(docId);
  modal.style.display = "flex";
}

function renderDetailView(data) {
  const progres = Array.isArray(data.progresPenjualan) ? data.progresPenjualan.join(", ") : "-";
  const tipeTertarik = Array.isArray(data.tipeTertarik) ? data.tipeTertarik.join(", ") : "-";

  detailContent.innerHTML = `
    <p><strong>Nama Prospek:</strong> ${data.nama || "-"}</p>
    <p><strong>No Telepon:</strong> ${data.noTelp || "-"}</p>
    <p><strong>Asal Kota:</strong> ${data.asalKota || "-"}</p>
    <p><strong>Ketertarikan:</strong> ${data.ketertarikan || "-"}</p>
    <p><strong>Tipe Tertarik:</strong> ${tipeTertarik}</p>
    <p><strong>Tanggal Survey:</strong> ${data.tanggalSurvey || "-"}</p>
    <p><strong>Catatan:</strong> ${data.catatan || "-"}</p>
    <p><strong>Status Penjualan:</strong> ${data.statusPenjualan || "-"}</p>
    <p><strong>Progres Penjualan:</strong> ${progres}</p>
    <p><strong>Dibuat oleh:</strong> ${data.user || "-"}</p>
    
    <div style="margin-top: 20px;">
      <button class="btn btn-save" id="btnEdit">Edit Data</button>
    </div>
  `;

  document.getElementById("btnEdit").onclick = () => renderEditForm(data);
}

// Load komentar (tetap sama)
function loadComments(docId) {
  commentsList.innerHTML = "<p style='color:#666; text-align:center;'>Memuat komentar...</p>";
  const docRef = doc(db, "prospek", docId);
  onSnapshot(docRef, (snap) => {
    commentsList.innerHTML = "";
    const comments = snap.data()?.comments || [];
    if (comments.length === 0) {
      commentsList.innerHTML = "<p style='color:#999; text-align:center;'>Belum ada komentar</p>";
      return;
    }

    comments.forEach(c => {
      const div = document.createElement("div");
      div.className = "comment-item";
      const date = c.timestamp?.toDate()?.toLocaleString("id-ID") || "Baru saja";
      div.innerHTML = `
        <div class="comment-avatar">${c.user.charAt(0).toUpperCase()}</div>
        <div class="comment-bubble">
          <div class="comment-meta">${c.user} <span>• ${date}</span></div>
          <div class="comment-text">${c.text.replace(/\n/g, "<br>")}</div>
        </div>
      `;
      commentsList.appendChild(div);
    });
  });
}

// Event listeners
closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

document.getElementById("btnAddComment")?.addEventListener("click", async () => {
  const textArea = document.getElementById("newComment");
  const text = textArea.value.trim();
  if (!text || !currentDocId) return;

  await updateDoc(doc(db, "prospek", currentDocId), {
    comments: arrayUnion({
      user: user,
      text: text,
      timestamp: serverTimestamp()
    })
  });
  textArea.value = "";
});

// Search dengan debounce
let searchTimeout;
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadProspek(e.target.value);
  }, 300);
});

// Init
loadProspek();
