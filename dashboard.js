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

import { collection, getDocs }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

async function hitungPointBulanan(userLogin) {
  const snap = await getDocs(collection(db,"prospek"));

  const now = new Date();
  const bulan = now.getMonth();
  const tahun = now.getFullYear();

  /* ===== DATABASE (OWNER) ===== */
  const totalDatabase = snap.docs
    .map(d=>d.data())
    .filter(p=>p.namaUser === userLogin).length;

  if (!totalDatabase) return "0.0";

 /* ===== AKTIVITAS (PELAKU) ===== */
let survey = 0;
let booking = 0;
let totalAktivitas = 0;

snap.docs.forEach(docSnap=>{
  const p = docSnap.data();
  (p.comments||[]).forEach(c=>{
    if (c.user !== userLogin) return;
    if (!c.createdAt) return;

    const d = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
    if (d.getFullYear() !== tahun) return;
    if (d.getMonth() !== bulan) return;

    totalAktivitas++;

    if (c.progress === "Survey") survey++;
    if (c.progress === "Booking") booking++;
  });
});

/* ===== HITUNG PROSPEK AKTIF ===== */
const prospekAktifSet = new Set();
snap.docs.forEach(docSnap=>{
  const p = docSnap.data();
  (p.comments||[]).forEach(c=>{
    if (c.user !== userLogin) return;
    if (!c.createdAt) return;

    const d = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
    if (d.getFullYear() !== tahun) return;
    if (d.getMonth() !== bulan) return;

    prospekAktifSet.add(p.noTelp);
  });
});
const prospekAktif = prospekAktifSet.size;

/* ===== TARGET BARU ===== */
const TARGET_INPUT_HARIAN   = 5;
const TARGET_KOMENTAR_HARI  = 10;
const TARGET_PROSPEK_AKTIF  = 150;
const TARGET_SURVEY_BULAN   = 15;
const TARGET_BOOKING_BULAN  = 2;

/* ===== HITUNG HARI ===== */
const hari = new Date(tahun, bulan + 1, 0).getDate();

/* ===== HARIAN ===== */
const inputPerHari    = totalDatabase / hari;
const komentarPerHari = totalAktivitas / hari;

/* ===== RATE ===== */
const inputRate        = Math.min(inputPerHari / TARGET_INPUT_HARIAN, 1);
const komentarRate     = Math.min(komentarPerHari / TARGET_KOMENTAR_HARI, 1);
const prospekAktifRate = Math.min(prospekAktif / TARGET_PROSPEK_AKTIF, 1);
const surveyRate       = Math.min(survey / TARGET_SURVEY_BULAN, 1);
const bookingRate      = Math.min(booking / TARGET_BOOKING_BULAN, 1);

/* ===== SKOR AKHIR ===== */
const skorAkhir =
  (inputRate        * 15) +
  (komentarRate     * 15) +
  (prospekAktifRate * 15) +
  (surveyRate       * 15) +
  (bookingRate      * 40);

return skorAkhir.toFixed(1);
}

function labelKinerja(skor){
  if (skor < 5)
    return {
      text: "Perlu Evaluasi",
      color: "#ef4444",
      desc: "Aktivitas sangat rendah, perlu pendampingan"
    };

  if (skor < 15)
    return {
      text: "Mulai Bergerak",
      color: "#f97316",
      desc: "Sudah ada usaha, tapi belum konsisten"
    };

  if (skor < 30)
    return {
      text: "Cukup Aktif",
      color: "#eab308",
      desc: "Ritme mulai terbentuk, jaga konsistensi"
    };

  if (skor < 50)
    return {
      text: "Sales Aktif",
      color: "#22c55e",
      desc: "Aktivitas stabil, pipeline mulai sehat"
    };

  if (skor < 70)
    return {
      text: "Top Performer",
      color: "#3b82f6",
      desc: "Kinerja konsisten dan berdampak"
    };

  return {
    text: "Sales Elite",
    color: "#8b5cf6",
    desc: "Disiplin tinggi dan hasil konsisten"
  };
}


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

  // 🔒 SEMBUNYIKAN STATISTIK UNTUK SALES
  if (storedRole !== "admin") {
    document.getElementById("btnStatistik")?.remove();
  }

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
welcome.innerHTML = `
  <div style="font-weight:bold">
    Selamat datang, ${storedNamaUser}
  </div>
  <div id="pointKinerja"
       style="font-size:13px;color:#ffc107">
    Point bulan ini: menghitung...
  </div>
`;


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
hitungPointBulanan(storedNamaUser).then(skor=>{
  const el = document.getElementById("pointKinerja");
  if (!el) return;

  const label = labelKinerja(Number(skor));

  el.innerHTML = `
    <span>Point Saat Ini: <strong>${skor}</strong></span>
    <span
      title="${label.desc}"
      style="
        margin-left:8px;
        color:${label.color};
        font-weight:600;
        cursor:help;
      "
    >
      • ${label.text}
    </span>
  `;
});


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














