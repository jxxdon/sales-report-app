/* =========================================================
   FIREBASE AUTH → ADAPTER KE SISTEM LAMA (WAJIB PALING ATAS)
========================================================= */
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth, db } from "./firebase.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ===== variabel yang DIPAKAI OLEH KODE LAMA =====
let user = null;
let namaUser = null;
let role = null;

// ===== tunggu auth, lalu HIDUPKAN dashboard lama =====
onAuthStateChanged(auth, (u) => {
  if (!u) {
    window.location.href = "index.html";
    return;
  }

  // SAMAKAN DENGAN SISTEM LOGIN LAMA
  user = u.email.startsWith("admin") ? "admin" : u.email.split("@")[0];
  namaUser = u.email.split("@")[0];
  role = user === "admin" ? "admin" : "sales";

  // ISI localStorage AGAR SEMUA KODE LAMA TETAP JALAN
  localStorage.setItem("user", user);
  localStorage.setItem("namaUser", namaUser);
  localStorage.setItem("role", role);

  initDashboard(); // ⬅️ SATU-SATUNYA START
});


/* =========================================================
   DASHBOARD LAMA (TIDAK DIUBAH LOGIC & UI)
========================================================= */
function initDashboard() {

  /* ================== CEK LOGIN (VERSI LAMA, AMAN) ================== */
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    window.location.href = "index.html";
    return;
  }

  const storedNamaUser = localStorage.getItem("namaUser") || storedUser;
  const storedRole = localStorage.getItem("role");


  /* ================== HEADER + LOGOUT ================== */
 const header = document.createElement("div");
header.style = `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background-color: #343a40;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1000;
`;

const welcome = document.createElement("div");
welcome.innerHTML = `<strong>Selamat datang,</strong> ${storedNamaUser}`;

const rightWrap = document.createElement("div");
rightWrap.style = "display:flex; gap:10px; align-items:center;";

const logoutButton = document.createElement("button");
logoutButton.textContent = "Logout";
logoutButton.style = `
  padding: 8px 14px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

logoutButton.onclick = () => {
  if (!confirm("Apakah Anda yakin ingin keluar?")) return;
  signOut(auth).then(() => {
    localStorage.clear();
    window.location.href = "index.html";
  });
};

rightWrap.appendChild(logoutButton);
header.appendChild(welcome);
header.appendChild(rightWrap);

document.body.insertBefore(header, document.body.firstChild);
document.body.style.paddingTop = "80px";


  /* ================== NORMALISASI NO TELP ================== */
  function normalisasiNoTelp(input) {
    let nomor = input.replace(/\D/g, "");
    if (nomor.startsWith("0")) nomor = "62" + nomor.slice(1);
    if (nomor.startsWith("8")) nomor = "62" + nomor;
    if (nomor.startsWith("620")) nomor = "62" + nomor.slice(3);
    return nomor;
  }


  /* ================== SIMPAN PROSPEK ================== */
  document.getElementById("btnSimpan").addEventListener("click", async () => {

    const noTelpRaw = document.getElementById("noTelp").value.trim();
    const noTelp = normalisasiNoTelp(noTelpRaw);

    const nama = document.getElementById("nama").value.trim();
    const asalKota = document.getElementById("asalKota").value;
    const asalProspek = document.getElementById("asalProspek").value;
    const catatan = document.getElementById("catatan").value.trim();

    const tipeTertarik = Array.from(
      document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked')
    ).map(cb => cb.value);

    if (!noTelpRaw || !nama || !asalKota) {
      alert("No Telepon, Nama, dan Asal Kota wajib diisi!");
      return;
    }

    if (!noTelp.startsWith("62") || noTelp.length < 10) {
      alert("Nomor telepon tidak valid!");
      return;
    }

    if (!asalProspek) {
      alert("Asal Prospek wajib dipilih!");
      return;
    }

    if (tipeTertarik.length === 0) {
      alert("Minimal pilih 1 produk yang diminati!");
      return;
    }

    if (!catatan) {
      alert("Catatan Prospek wajib diisi!");
      return;
    }

    const btn = document.getElementById("btnSimpan");
    btn.disabled = true;
    btn.textContent = "Menyimpan...";

    try {
      const docRef = doc(db, "prospek", noTelp);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        alert("Nomor telepon ini sudah pernah dimasukkan ❌");
        return;
      }

      await setDoc(docRef, {
        user: storedUser,
        namaUser: storedNamaUser,
        role: storedRole,
        noTelp,
        nama,
        asalKota,
        asalProspek,
        tipeTertarik,
        catatan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await setDoc(
        doc(db, "aktivitas", `${Date.now()}_${storedUser}`),
        {
          user: storedUser,
          role: storedRole,
          tipe: "INPUT_PROSPEK",
          nama,
          telepon: noTelp,
          asal: asalProspek,
          produk: tipeTertarik.join(", "),
          prospekId: noTelp,
          createdAt: new Date()
        }
      );

      alert("Prospek berhasil disimpan ✅");
      location.reload();

    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan prospek ❌");
    } finally {
      btn.disabled = false;
      btn.textContent = "💾 Simpan Prospek";
    }
  });

}



