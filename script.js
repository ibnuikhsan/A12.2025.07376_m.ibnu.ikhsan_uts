/* ===================== PENGATURAN (ubah di sini) ===================== */
const NOMOR_WA = "6285725730930";      // GANTI: nomor WhatsApp, format 62...
const DURASI_SALE_JAM = 5;             // lama promo dalam jam
const VOUCHER = { STATIC10: 0.10 };    // kode voucher : persen diskon

/* Daftar produk. Foto: simpan di assets/images/ lalu ganti nama file di "gambar". */
const PRODUK = [
  { id: 1, nama: "Bootleg T-Shirt",     kat: "atasan",  harga: 150000, diskon: 60, stok: 78, gambar: "assets/images/produk-1.jpg" },
  { id: 2, nama: "Butterfly Crop Top",      kat: "atasan",  harga: 130000, diskon: 55, stok: 45, gambar: "assets/images/produk-2.jpg" },
  { id: 3, nama: "Parachute Cargo Pants",   kat: "bawahan", harga: 280000, diskon: 70, stok: 30, gambar: "assets/images/produk-3.jpg" },
  { id: 4, nama: "Pleated Mini Skirt",      kat: "bawahan", harga: 175000, diskon: 50, stok: 62, gambar: "assets/images/produk-4.jpg" },
  { id: 5, nama: "Chrome Zip Hoodie",       kat: "outer",   harga: 320000, diskon: 65, stok: 25, gambar: "assets/images/produk-5.jpg" },
  { id: 6, nama: "Starlight Denim Jacket",  kat: "outer",   harga: 350000, diskon: 70, stok: 18, gambar: "assets/images/produk-6.jpg" }
];
const UKURAN = ["S", "M", "L", "XL"];

/* ===================== HELPER ===================== */
const $ = (id) => document.getElementById(id);
const rupiah = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
const hargaAkhir = (p) => p.harga * (1 - p.diskon / 100);
const produkById = (id) => PRODUK.find((p) => p.id === id);

/* Placeholder otomatis kalau foto belum ada, supaya tampilan tidak rusak */
const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#7fd0ff'/><stop offset='1' stop-color='#ff6fd8'/></linearGradient></defs><rect width='300' height='400' fill='url(#g)'/><text x='150' y='205' font-size='64' text-anchor='middle' fill='white'>✿</text><text x='150' y='250' font-size='16' text-anchor='middle' fill='white' font-family='Verdana'>foto belum ditambahkan</text></svg>");
function pasangFallback(root = document) {
  root.querySelectorAll("img").forEach((img) => {
    const ganti = () => { img.onerror = null; img.src = PLACEHOLDER; };
    img.onerror = ganti;
    if (img.complete && img.naturalWidth === 0) ganti();
  });
}

let toastTimer;
function toast(pesan) {
  const t = $("toast");
  t.textContent = pesan;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ===================== RENDER PRODUK + FILTER + CARI ===================== */
let kategoriAktif = "semua";

function renderProduk() {
  const kata = $("search").value.trim().toLowerCase();
  const hasil = PRODUK.filter((p) =>
    (kategoriAktif === "semua" || p.kat === kategoriAktif) && p.nama.toLowerCase().includes(kata));
  const grid = $("productGrid");
  grid.innerHTML = "";
  hasil.forEach((p) => {
    const kartu = document.createElement("article");
    kartu.className = "card";
    kartu.innerHTML = `
      <span class="tag">-${p.diskon}%</span>
      <img src="${p.gambar}" alt="${p.nama}" loading="lazy">
      <div class="card-body">
        <h3>${p.nama}</h3>
        <div class="harga"><b>${rupiah(hargaAkhir(p))}</b><s>${rupiah(p.harga)}</s></div>
        <div class="stok" title="Sisa stok"><i style="width:${p.stok}%"></i></div>
        <small>Sisa ${p.stok} pcs</small>
        <select aria-label="Pilih ukuran ${p.nama}">${UKURAN.map((u) => `<option>${u}</option>`).join("")}</select>
        <button class="btn" data-id="${p.id}">Tambah ke keranjang</button>
      </div>`;
    grid.appendChild(kartu);
  });
  $("empty").hidden = hasil.length > 0;
  pasangFallback(grid);
}

$("filters").addEventListener("click", (e) => {
  const tombol = e.target.closest("button");
  if (!tombol) return;
  document.querySelectorAll("#filters .chip").forEach((c) => c.classList.remove("active"));
  tombol.classList.add("active");
  kategoriAktif = tombol.dataset.kat;
  renderProduk();
});
$("search").addEventListener("input", renderProduk);

$("productGrid").addEventListener("click", (e) => {
  const tombol = e.target.closest("button[data-id]");
  if (!tombol) return;
  const ukuran = tombol.parentElement.querySelector("select").value;
  tambahKeKeranjang(Number(tombol.dataset.id), ukuran);
});

/* ===================== KERANJANG ===================== */
let keranjang = [];      // { id, ukuran, qty }
let persenVoucher = 0;

function tambahKeKeranjang(id, ukuran) {
  const ada = keranjang.find((i) => i.id === id && i.ukuran === ukuran);
  if (ada) ada.qty++; else keranjang.push({ id, ukuran, qty: 1 });
  renderKeranjang();
  toast(`${produkById(id).nama} (${ukuran}) masuk keranjang`);
}

function renderKeranjang() {
  const daftar = $("cartList");
  daftar.innerHTML = "";
  if (keranjang.length === 0) {
    daftar.innerHTML = "<li style='display:block;text-align:center'>Keranjang masih kosong. Pilih produk diskon dulu, ya.</li>";
  }
  keranjang.forEach((item, idx) => {
    const p = produkById(item.id);
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${p.gambar}" alt="${p.nama}">
      <div><b>${p.nama}</b><br><small>Ukuran ${item.ukuran} • ${rupiah(hargaAkhir(p))}</small>
        <div class="qty"><button data-aksi="kurang" data-i="${idx}" aria-label="Kurangi">−</button><span>${item.qty}</span><button data-aksi="tambah" data-i="${idx}" aria-label="Tambah">+</button></div></div>
      <button class="hapus" data-aksi="hapus" data-i="${idx}" aria-label="Hapus item">🗑</button>`;
    daftar.appendChild(li);
  });
  pasangFallback(daftar);

  const subtotal = keranjang.reduce((s, i) => s + hargaAkhir(produkById(i.id)) * i.qty, 0);
  const potongan = subtotal * persenVoucher;
  $("subtotal").textContent = rupiah(subtotal);
  $("potongan").textContent = "-" + rupiah(potongan);
  $("total").textContent = rupiah(subtotal - potongan);
  $("cartCount").textContent = keranjang.reduce((s, i) => s + i.qty, 0);
}

$("cartList").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-aksi]");
  if (!b) return;
  const i = Number(b.dataset.i);
  if (b.dataset.aksi === "tambah") keranjang[i].qty++;
  if (b.dataset.aksi === "kurang") keranjang[i].qty--;
  if (b.dataset.aksi === "hapus" || keranjang[i].qty <= 0) keranjang.splice(i, 1);
  renderKeranjang();
});

function bukaKeranjang(buka) {
  $("drawer").classList.toggle("open", buka);
  $("overlay").hidden = !buka;
}
$("cartBtn").addEventListener("click", () => bukaKeranjang(true));
$("closeCart").addEventListener("click", () => bukaKeranjang(false));
$("overlay").addEventListener("click", () => bukaKeranjang(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") bukaKeranjang(false); });

/* Voucher */
$("couponBtn").addEventListener("click", () => {
  const kode = $("couponInput").value.trim().toUpperCase();
  const pesan = $("couponMsg");
  if (VOUCHER[kode]) {
    persenVoucher = VOUCHER[kode];
    pesan.textContent = `Voucher ${kode} dipakai: diskon ${persenVoucher * 100}%`;
  } else {
    persenVoucher = 0;
    pesan.textContent = "Kode tidak valid. Periksa lagi penulisannya.";
  }
  renderKeranjang();
});
$("copyVoucher").addEventListener("click", () => {
  $("couponInput").value = "STATIC10";
  if (navigator.clipboard) navigator.clipboard.writeText("STATIC10").catch(() => {});
  toast("Kode STATIC10 disalin");
});

/* Checkout ke WhatsApp */
$("checkoutBtn").addEventListener("click", () => {
  if (keranjang.length === 0) { toast("Keranjang masih kosong"); return; }
  const baris = keranjang.map((i) => `- ${produkById(i.id).nama} (${i.ukuran}) x${i.qty}`).join("\n");
  const teks = `Halo staticbloom, saya mau pesan:\n${baris}\nTotal: ${$("total").textContent}`;
  window.open(`https://wa.me/${NOMOR_WA}?text=${encodeURIComponent(teks)}`, "_blank");
});

/* ===================== COUNTDOWN ===================== */
let waktuAkhir = Date.now() + DURASI_SALE_JAM * 3600 * 1000;
try {
  const simpan = Number(localStorage.getItem("sb_akhir"));
  if (simpan > Date.now()) waktuAkhir = simpan; else localStorage.setItem("sb_akhir", waktuAkhir);
} catch (err) { /* abaikan jika localStorage tidak tersedia */ }

function updateCountdown() {
  let sisa = Math.max(0, Math.floor((waktuAkhir - Date.now()) / 1000));
  if (sisa === 0) {            // promo habis, mulai lagi otomatis
    waktuAkhir = Date.now() + DURASI_SALE_JAM * 3600 * 1000;
    try { localStorage.setItem("sb_akhir", waktuAkhir); } catch (err) {}
    sisa = DURASI_SALE_JAM * 3600;
  }
  const dua = (n) => String(n).padStart(2, "0");
  $("cdH").textContent = dua(Math.floor(sisa / 3600));
  $("cdM").textContent = dua(Math.floor((sisa % 3600) / 60));
  $("cdS").textContent = dua(sisa % 60);
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ===================== TEMA, MENU, SCROLL ===================== */
$("themeBtn").addEventListener("click", () => {
  const gelap = document.body.classList.toggle("dark");
  $("themeBtn").textContent = gelap ? "☀ Mode Siang" : "🌙 Mode Malam";
});
$("menuBtn").addEventListener("click", () => {
  const buka = $("nav").classList.toggle("open");
  $("menuBtn").setAttribute("aria-expanded", buka);
});
$("nav").addEventListener("click", () => $("nav").classList.remove("open"));

window.addEventListener("scroll", () => { $("toTop").hidden = window.scrollY < 400; });
$("toTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ===================== START ===================== */
renderProduk();
renderKeranjang();
pasangFallback();
