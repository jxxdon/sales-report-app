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
  detailContent.innerHTML = `
    <div id="editMode">
      <div class="edit-field">
        <label>Nama</label>
        <input id="editNama" value="${data.nama || ""}">
      </div>

      <div class="edit-field">
        <label>No Telp</label>
        <input id="editNoTelp" value="${data.noTelp || ""}">
      </div>

      <div class="edit-field">
        <label>Asal Kota</label>
        <input id="editAsalKota" value="${data.asalKota || ""}">
      </div>

      <div class="edit-field">
        <label>Catatan</label>
        <textarea id="editCatatan">${data.catatan || ""}</textarea>
      </div>

      <div class="edit-field">
        <label>Progres Penjualan (pisahkan dengan koma)</label>
        <input id="editProgres" value="${
          Array.isArray(data.progresPenjualan)
            ? data.progresPenjualan.join(", ")
            : ""
        }">
      </div>

      <button class="btn btn-save" id="btnUpdate">Update Prospek</button>
    </div>
  `;

  document.getElementById("btnUpdate").onclick = async () => {
    try {
      await updateDoc(doc(db, "prospek", currentDocId), {
        nama: document.getElementById("editNama").value.trim(),
        noTelp: document.getElementById("editNoTelp").value.trim(),
        asalKota: document.getElementById("editAsalKota").value.trim(),
        catatan: document.getElementById("editCatatan").value.trim(),
        progresPenjualan: document
          .getElementById("editProgres")
          .value.split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      });

      alert("Data berhasil diupdate");
    } catch (err) {
      console.error(err);
      alert("Gagal update data");
    }
  };
}
