import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { auth, db } from "./firebase.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// ================== AUTH GUARD (WAJIB) ==================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // ⬇️ SEMUA LOGIC DASHBOARD DI SINI
  initDashboard(user);
});


// ================== INIT DASHBOARD ==================
function initDashboard(user) {

  const uid = user.uid;
  const email = user.email;

  // ================== HEADER + LOGOUT ==================
  window.addEventListener("DOMContentLoaded", () => {
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
    welcome.innerHTML = `<strong>Selamat datang,</strong> ${email}`;

    const logoutButton = document.createElement("button");
    logoutButton.textContent = "Logout";
    logoutButton.style = `
      padding: 10px 20px;
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    `;

    logoutButton.onclick = () => {
      if (confirm("Apakah Anda yakin ingin keluar?")) {
        signOut(auth).then(() => {
          window.location.href = "index.html";
        });
      }
    };

    header.appendChild(welcome);
    header.appendChild(logoutButton);
    document.body.insertBefore(header, document.body.firstChild);
    document.body.style.paddingTop = "80px";
  });


  // ================== NORMALISASI NO TELP ==================
  function normalisasiNoTelp(input) {
    let nomor = input.replace(/\D/g, "");

    if (nomor.startsWith("0")) {
      nomor = "62" + nomor.slice(1);
    } else if (nomor.startsWith("8")) {
      nomor = "62" + nomor;
    } else if (nomor.startsWith("620")) {
      nomor = "62" + nomor.slice(3);
    }

    return nomor;
  }


  // ================== SIMPAN PROSPEK ==================
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

    // ================== VALIDASI ==================
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
        userId: uid,
        email,
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
        doc(db, "aktivitas", `${Date.now()}_${uid}`),
        {
          userId: uid,
          email,
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
