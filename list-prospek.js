<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daftar Prospek 🌟</title>
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      margin: 0;
      padding: 15px;
      min-height: 100vh;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.1);
    }
    h2 {
      text-align: center;
      color: #5d5af8;
      margin-bottom: 10px;
      font-size: 1.8em;
    }
    .back-btn {
      display: inline-block;
      margin-bottom: 25px;
      padding: 12px 24px;
      background: #6c757d;
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-size: 1em;
      transition: background 0.3s;
    }
    .back-btn:hover {
      background: #5a6268;
    }
    .search-box {
      width: 100%;
      padding: 16px;
      border: 2px solid #ddd;
      border-radius: 14px;
      font-size: 1.1em;
      margin-bottom: 30px;
      box-sizing: border-box;
    }
    .prospek-list {
      display: grid;
      gap: 18px;
    }
    .prospek-card {
      background: white;
      border-radius: 18px;
      padding: 22px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 6px 20px rgba(0,0,0,0.08);
      border-left: 6px solid #5d5af8;
    }
    .prospek-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.15);
      background: #fbfbff;
    }
    .line-nama {
      font-size: 1.6em;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 10px;
      line-height: 1.2;
    }
    .line-info {
      font-size: 1.15em;
      color: #34495e;
      margin-bottom: 14px;
      line-height: 1.4;
    }
    .line-footer {
      font-size: 1.1em;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
      line-height: 1.4;
    }
    .status-personal { color: #28a745; }
    .status-open { color: #ffc107; }
    .status-exclusive { color: #dc3545; }
    .sales {
      color: #007bff;
      font-weight: 600;
    }

    /* Modal styles tetap sama, cukup copy dari sebelumnya */
    .modal {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      border-radius: 20px;
      padding: 30px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 15px 40px rgba(0,0,0,0.2);
    }
    .close {
      float: right;
      font-size: 1.8em;
      cursor: pointer;
      color: #aaa;
    }
    .close:hover {
      color: #000;
    }
    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1em;
      margin-top: 10px;
    }
    .btn-comment { background: #007bff; color: white; }
    .comment {
      background: #f8f9fa;
      padding: 14px;
      border-radius: 12px;
      margin: 12px 0;
    }
    .comment-meta {
      font-weight: bold;
      color: #555;
      margin-bottom: 6px;
    }
  </style>
</head>
<body>

<div class="container">
  <h2>📋 Daftar Prospek</h2>
  
  <a href="dashboard.html" class="back-btn">⬅ Kembali ke Dashboard</a>

  <input type="text" id="searchInput" class="search-box" placeholder="🔍 Cari nama atau nomor telepon...">

  <div id="prospekBody" class="prospek-list">
    <!-- Prospek akan muncul di sini -->
  </div>
</div>

<!-- Modal Detail -->
<div id="detailModal" class="modal">
  <div class="modal-content">
    <span class="close">&times;</span>
    <h3>Detail & Edit Prospek</h3>
    <div id="detailContent"></div>
    <hr>
    <h4>Komentar / Log</h4>
    <div id="commentsList"></div>
    <textarea id="newComment" placeholder="Tulis komentar atau update progres..." style="width:100%; padding:12px; border-radius:10px; border:1px solid #ddd; margin-top:10px;"></textarea>
    <button class="btn btn-comment" id="btnAddComment">Tambah Komentar</button>
  </div>
</div>

<script type="module" src="list-prospek.js"></script>
</body>
</html>
