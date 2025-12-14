// Load daftar prospek (diperbarui tampilan card)
function loadProspek(searchTerm = "") {
  prospekBody.innerHTML = "";

  let q;
  if (searchTerm) {
    q = query(collection(db, "prospek"), orderBy("createdAt", "desc"));
  } else {
    if (isAdmin) {
      q = query(collection(db, "prospek"), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "prospek"), where("user", "==", user), orderBy("createdAt", "desc"));
    }
  }

  onSnapshot(q, (snapshot) => {
    prospekBody.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Filter pencarian
      if (searchTerm && 
          !data.nama.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !data.noTelp.includes(searchTerm)) {
        return;
      }

      const tipeTertarik = Array.isArray(data.tipeTertarik) ? data.tipeTertarik.join(", ") : "-";
      const tanggalSurvey = data.tanggalSurvey || "-";
      const status = getStatusProspek(data);
      const statusClass = status.includes("Personal") ? "status-personal" :
                          status.includes("Open") ? "status-open" : "status-exclusive";

      const card = document.createElement("div");
      card.className = "prospek-card";
      card.innerHTML = `
        <div class="nama">${data.nama || "-"}</div>
        <div class="info">${data.noTelp} - ${tipeTertarik} - ${tanggalSurvey}</div>
        <div class="footer">
          <span class="${statusClass}">${status}</span>
          <span class="sales">${data.user}</span>
        </div>
      `;
      card.onclick = () => openDetail(docSnap.id, data);
      prospekBody.appendChild(card);
    });
  });
}
