import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const listEl = document.getElementById("list");
const modal = document.getElementById("modal");
const editAnggaranEl = document.getElementById("editAnggaran");
const btnUpdate = document.getElementById("btnUpdate");

let currentId = null;
let currentLead = 0;

const q = query(
  collection(db, "laporan_iklan")
);


onSnapshot(q, snap => {
  listEl.innerHTML = "";

  snap.docs.forEach(d => {
    const x = d.data();
    const id = d.id;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
  <div><b>${x.platform}</b> | ${x.tipeIklan} | ${x.sales}</div>

  <div>Tanggal Laporan:
    ${x.createdAt.toDate().toLocaleDateString("id-ID")}
  </div>

  <div>Periode Iklan:
    ${x.startDate.toDate().toLocaleDateString("id-ID")} -
    ${x.endDate.toDate().toLocaleDateString("id-ID")}
  </div>

  <div>Dana Dihabiskan:
    Rp ${x.anggaran.toLocaleString("id-ID")}
  </div>

  <div>Lead: ${x.jumlahLead}</div>
  <div>CPL: Rp ${x.cpl.toLocaleString("id-ID")}</div>

  <button onclick="editLaporan('${id}', ${x.anggaran}, ${x.jumlahLead})">
    Edit
  </button>
  <button onclick="hapusLaporan('${id}')">
    Hapus
  </button>
`;


    listEl.appendChild(card);
  });

  if (!snap.size) {
    listEl.innerHTML = "<p>Belum ada laporan iklan</p>";
  }
});

/* ===== EDIT ===== */
window.editLaporan = (id, anggaran, lead) => {
  currentId = id;
  currentLead = lead;
  editAnggaranEl.value = anggaran;
  modal.style.display = "block";
};

window.closeModal = () => {
  modal.style.display = "none";
};

btnUpdate.onclick = async () => {
  const anggaran = Number(editAnggaranEl.value);
  if (!anggaran) return alert("Anggaran tidak valid");

  const cpl = currentLead
    ? Math.round(anggaran / currentLead)
    : 0;

  await updateDoc(doc(db, "laporan_iklan", currentId), {
    anggaran,
    cpl
  });

  closeModal();
};

/* ===== HAPUS ===== */
window.hapusLaporan = async (id) => {
  if (!confirm("Hapus laporan ini?")) return;
  await deleteDoc(doc(db, "laporan_iklan", id));
};
