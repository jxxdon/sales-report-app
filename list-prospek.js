import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================
   USER & ROLE
===================== */
const user = localStorage.getItem("user")?.toLowerCase();
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
const commentsList = document.getElementById("commentsList");

/* =====================
   STATE
===================== */
let currentDocId = null;
let unsubscribe = null;

/* =====================
   HELPER
===================== */
const cleanPhone = (p) => (p ? p.replace(/\D/g, "") : "");

/* =====================
   LOAD PROSPEK
===================== */
function loadProspek(keyword = "") {
  if (unsubscribe) unsubscribe();

  prospekList.innerHTML =
    "<p style='text-align:center;padding:40px;color:#999;'>Memuat data...</p>";

  const search = keyword.toLowerCase();
  const phoneSearch = cleanPhone(keyword);

  const q = isAdmin
    ? query(collection(db, "prospek"), orderBy("createdAt", "desc"))
    : query(
        collection(db, "prospek"),
        where("user", "==", user),
        orderBy("createdAt", "desc")
      );

  unsubscribe = onSnapshot(q, (snap) => {
    prospekList.innerHTML = "";

    if (snap.empty) {
      prospekList.innerHTML =
        "<p style='text-align:center;padding:50px;color:#999;'>Tidak ada prospek</p>";
      return;
    }

    let hasData = false;

    snap.forEach((docSnap) => {
      const data = docSnap.data();

      if (search) {
        const namaMatch = data.nama?.toLowerCase().includes(search);
        const telpMatch = cleanPhone(data.noTelp).includes(phoneSearch);
        if (!namaMatch && !telpMatch) return;
      }

      hasData = true;

      const progres = Array.isArray(data.progresPenjualan)
        ? data.progresPenjualan.join(", ")
        : "-";

      const status = getStatusProspek(data);
      const statusClass = status.includes("Personal")
        ? "status-personal"
        : status.includes("Open")
        ? "status-open"
        : "status-exclusive";

      const card = document.createElement("div");
      card.className = "prospek-card";
      card.innerHTML = `
        <div class="nama">${data.nama || "Tanpa Nama"}</div>
        <div class="info">📞 ${data.noTelp || "-"}</div>
        <div class="info">📈 Progres: ${progres}</div>
        <div class="info">👤 Dibuat oleh: ${data.user || "-"}</div>
        <div class="status-line">
          <span class="status ${statusClass}">${status}</span>
          <span style="color:#888;font-size:.9em;">Klik untuk detail →</span>
        </div>
      `;

      card.onclick = () => openDetail(docSnap.id, data);
      prospekList.appendChild(card);
    });

    if (!hasData) {
      prospekList.innerHTML =
        "<p style='text-align:center;padding:50px;color:#999;'>Tidak ada hasil</p>";
    }
  });
}

/* =====================
   STATUS
===================== */
function getStatusProspek(data) {
  const now = new Date();
  const created = data.createdAt?.toDate() || new Date();
  const diffMonth = (now - created) / (1000 * 60 * 60 * 24 * 30);

  if (data.progresPenjualan?.includes("Closing")) return "Exclusive Lead";
  if (diffMonth < 1) return "Personal Lead";
  return "Open Lead";
}

/* =====================
   DETAIL MODAL
===================== */
function openDetail(docId, data) {
  currentDocId = docId;

  renderDetailView(data);
  loadComments(docId);

  modal.style.display = "flex";
}

function renderDetailView(data) {
  const progres = Array.isArray(data.progresPenjualan)
    ? data.progresPenjualan.join(", ")
    : "";

  detailContent.innerHTML = `
    <div id="viewMode">
      <p><strong>Nama:</strong> ${data.nama || "-"}</p>
      <p><strong>No Telp:</strong> ${data.noTelp || "-"}</p>
      <p><strong>Asal Kota:</strong> ${data.asalKota || "-"}</p>
      <p><strong>Catatan:</strong> ${data.catatan || "-"}</p>
      <p><strong>Progres:</strong> ${progres || "-"}</p>
      <p><strong>Dibuat oleh:</strong> ${data.user || "-"}</p>

      ${
        isAdmin || data.user === user
          ? `<div style="margin-top:20px;">
              <button class="btn btn-save" id="btnEdit">Edit Data</button>
            </div>`
          : ""
      }
    </div>
  `;

  const btnEdit = document.getElementById("btnEdit");
  if (btnEdit) {
    btnEdit.onclick = () => renderEditForm(data);
  }
}


/* =====================
   KOMENTAR
===================== */
function loadComments(docId) {
  commentsList.innerHTML =
    "<p style='text-align:center;color:#666;'>Memuat komentar...</p>";

  onSnapshot(doc(db, "prospek", docId), (snap) => {
    const comments = snap.data()?.comments || [];
    commentsList.innerHTML = "";

    if (!comments.length) {
      commentsList.innerHTML =
        "<p style='text-align:center;color:#999;'>Belum ada komentar</p>";
      return;
    }

    comments.forEach((c) => {
      const date =
        c.timestamp?.toDate?.().toLocaleString("id-ID") ||
        new Date(c.timestamp).toLocaleString("id-ID");

      commentsList.innerHTML += `
        <div class="comment-item">
          <div class="comment-avatar">${c.user[0].toUpperCase()}</div>
          <div class="comment-bubble">
            <div class="comment-meta">${c.user} • ${date}</div>
            <div class="comment-text">${c.text}</div>
          </div>
        </div>
      `;
    });
  });
}

/* =====================
   ADD COMMENT (FIX FINAL)
===================== */
document.addEventListener("click", async (e) => {
  if (e.target?.id !== "btnAddComment") return;

  const textarea = document.getElementById("newComment");
  const text = textarea.value.trim();
  if (!text || !currentDocId) return;

  try {
    await updateDoc(doc(db, "prospek", currentDocId), {
      comments: arrayUnion({
        user,
        text,
        timestamp: new Date() // ⬅️ FIX ERROR FIREBASE
      })
    });

    textarea.value = "";
  } catch (err) {
    console.error("Gagal tambah komentar:", err);
    alert("Komentar gagal disimpan");
  }
});

/* =====================
   EVENT
===================== */
closeModal.onclick = () => (modal.style.display = "none");
window.onclick = (e) => e.target === modal && (modal.style.display = "none");

searchInput.addEventListener("input", (e) => {
  clearTimeout(window._delay);
  window._delay = setTimeout(() => loadProspek(e.target.value), 300);
});

/* =====================
   INIT
===================== */
loadProspek();
function renderEditForm(data) {
  const tipeList = [
    "Volands","Carina","Nashira","Dorado","Lyra",
    "Myra","Arion","Leonis","Vella"
  ];

  const progresList = [
    "Prospek","Tertarik","Follow Up","Negosiasi","Survey",
    "Booking","DP Masuk","Closing","Sukses","Pending","Batal"
  ];

  detailContent.innerHTML = `
    <h3>✏️ Edit Prospek</h3>

    <label>No Telepon</label>
    <input id="editNoTelp" value="${data.noTelp || ""}" disabled>

    <label>Nama Prospek</label>
    <input id="editNama" value="${data.nama || ""}">

    <label>Asal Kota</label>
    <select id="editAsalKota">
      ${document.getElementById("asalKota")
        ? ""
        : `
        <option value="">Pilih Kota</option>
        <option ${data.asalKota==="Palembang"?"selected":""}>Palembang</option>
        <option ${data.asalKota==="Prabumulih"?"selected":""}>Prabumulih</option>
        <option ${data.asalKota==="Pagar Alam"?"selected":""}>Pagar Alam</option>
        <option ${data.asalKota==="Lubuklinggau"?"selected":""}>Lubuklinggau</option>
        <option ${data.asalKota==="Banyuasin"?"selected":""}>Banyuasin</option>
        <option ${data.asalKota==="Lahat"?"selected":""}>Lahat</option>
        <option ${data.asalKota==="Muara Enim"?"selected":""}>Muara Enim</option>
        <option ${data.asalKota==="Provinsi Lain"?"selected":""}>Provinsi Lain</option>
      `}
    </select>

    <label>Asal Prospek</label>
    <select id="editAsalProspek">
      ${["Iklan Official","Sosial Media","Walk in","Referensi","Event","Agent","Database"]
        .map(v => `<option ${data.asalProspek===v?"selected":""}>${v}</option>`)
        .join("")}
    </select>

    <label>Tertarik Tipe Produk</label>
    <div class="checkbox-group">
      ${tipeList.map(t => `
        <div class="checkbox-item">
          <label>
            <input type="checkbox" value="${t}"
              ${data.tipeTertarik?.includes(t) ? "checked" : ""}>
            ${t}
          </label>
        </div>
      `).join("")}
    </div>

    <label>Tanggal Survey</label>
    <input id="editTanggalSurvey" type="date"
      value="${data.tanggalSurvey || ""}">

    <label>Catatan</label>
    <textarea id="editCatatan">${data.catatan || ""}</textarea>

    <label>Status Penjualan</label>
    <input id="editStatusPenjualan" value="${data.statusPenjualan || ""}">

    <label>Progres Penjualan</label>
    <div class="checkbox-group">
      ${progresList.map(p => `
        <div class="checkbox-item">
          <label>
            <input type="checkbox" value="${p}"
              ${data.progresPenjualan?.includes(p) ? "checked" : ""}>
            ${p}
          </label>
        </div>
      `).join("")}
    </div>

    <button class="btn btn-save" id="btnUpdate">💾 Update Prospek</button>
  `;

  document.getElementById("btnUpdate").onclick = async () => {
    const tipeTertarik = Array.from(
      detailContent.querySelectorAll('input[type="checkbox"][value]:not(.progres)')
    ).filter(cb => cb.checked).map(cb => cb.value);

    const progresPenjualan = Array.from(
      detailContent.querySelectorAll('.checkbox-group input[type="checkbox"]')
    ).filter(cb => cb.checked).map(cb => cb.value);

    try {
      await updateDoc(doc(db, "prospek", currentDocId), {
        nama: editNama.value.trim(),
        asalKota: editAsalKota.value,
        asalProspek: editAsalProspek.value,
        tipeTertarik,
        tanggalSurvey: editTanggalSurvey.value || null,
        catatan: editCatatan.value.trim(),
        statusPenjualan: editStatusPenjualan.value.trim(),
        progresPenjualan,
        updatedAt: new Date()
      });

      alert("✅ Prospek berhasil diupdate");
    } catch (err) {
      console.error(err);
      alert("❌ Gagal update prospek");
    }
  };
}
