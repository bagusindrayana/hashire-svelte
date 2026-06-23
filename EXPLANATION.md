# Penjelasan Logika Tampilan Lap, Pemotongan Lintasan (Clipping), dan Visibilitas Penanda (Markers)

Dokumen ini menjelaskan mengapa legenda/penanda seperti garis Start & Finish "hilang" saat beralih ke Lap 2 atau 3 pada implementasi sebelumnya, serta bagaimana logika baru diterapkan untuk memperbaikinya agar lintasan dan legendanya dinamis (seperti contoh pada Gambar 2, 3, dan 4).

## 1. Masalah Utama: Mengapa Penanda Hilang di Lap 2 atau 3?

Pada implementasi awal, visibilitas pin penanda (Start, Finish, PK, Spurt) pada **Visual Track Timeline** dan **Schematic Racetrack Card** dihitung berdasarkan **jarak absolut balapan (absolute race distance)**:
- **Start Line** berada pada jarak absolut `startLineDist` (misalnya `0m` pada Lap 1).
- **Finish Line** berada pada jarak absolut akhir balapan (misalnya `1570m` pada Lap 1 untuk race 1 lap, atau `3370m` untuk race 2 lap).

Ketika Anda memilih tab **Lap 2**:
- Jarak aktif lap bergeser ke jendela `[1800m - 3600m]`.
- Karena posisi Start Line (`0m`) dan Finish Line (`1570m`) berada di luar rentang `[1800m - 3600m]`, logika pengondisian `{#if}` menyembunyikan penanda tersebut karena mendeteksi penanda tersebut tidak terjadi pada putaran (lap) kedua.
- Hal ini membuat tampilan timeline dan peta terkesan kehilangan legenda penting secara tidak sengaja.

---

## 2. Solusi & Logika Baru: Pemotongan Lintasan (Lap Clipping)

Untuk mereplikasi perilaku pada **Gambar 2 (All Laps)**, **Gambar 3 (Lap 1)**, dan **Gambar 4 (Lap 2)**, kita menerapkan konsep **Lap-Based Clipping** pada lintasan dan memproyeksikan penanda secara dinamis berdasarkan lap yang aktif.

### A. Rentang Balapan Absolut (Absolute Race Range)
Balapan berjalan dari titik mulai absolut hingga titik selesai absolut:
- `raceStartAbs = startLineDist` (biasanya `0m`)
- `raceEndAbs = (lapsCount - 1) * trackLength + finishLineDist` (misalnya, untuk 2 Laps dengan track `1800m` dan finish di `1570m`, total jarak balapan adalah `1800 + 1570 = 3370m`).

### B. Pemotongan Lintasan per Lap (Lap Path Clipping)
Untuk lap ke-$L$ (di mana Lap 1 adalah $L=0$, Lap 2 adalah $L=1$, dst.), rentang jarak yang ditempuh pada putaran tersebut adalah bagian dari balapan yang beririsan dengan jendela lap tersebut:
- Rentang Lap $L$: `[L * trackLength, (L + 1) * trackLength]`
- Irisan aktif (Jarak Absolut):
  - `startAbs = Math.max(raceStartAbs, L * trackLength)`
  - `endAbs = Math.min(raceEndAbs, (L + 1) * trackLength)`
- Jarak Relatif terhadap loop track (0 hingga `trackLength`):
  - `startRel = startAbs - (L * trackLength)`
  - `endRel = endAbs - (L * trackLength)`

**Hasil Pemotongan Visual**:
1. **Dinamika Lintasan**: Hanya bagian kurva antara `startRel` dan `endRel` yang digambar dengan warna terrain penuh (`Turf`/`Dirt`) dan overlay fase balapan.
2. **Garis Referensi Abu-abu**: Sisa lintasan yang tidak dilalui pada lap tersebut digambar dengan garis abu-abu tipis putus-putus (`stroke-dasharray="4 4"`) sebagai referensi bentuk sirkuit.
3. **Penyaringan Penanda**: Penanda fisik (Start, Finish, PK, Spurt, dan label tikungan/lurus) hanya ditampilkan pada lap aktif jika posisinya dilalui oleh pelari pada putaran tersebut.

---

## 3. Contoh Ilustrasi Perubahan (Sesuai Gambar User)

Berikut adalah bagaimana visualisasi berubah secara dinamis berdasarkan tab lap yang dipilih (untuk Race 2 Laps, Track 1800m, Start 0m, Finish 1570m):

| Tampilan Tab | Jarak Balapan Tercover | Visualisasi Lintasan (Track Path) | Penanda yang Muncul |
| :--- | :--- | :--- | :--- |
| **All Laps** | `0m - 3370m` | Sirkuit penuh berwarna tebal. | Semua penanda (Start, Finish, PK, Spurt) muncul bersamaan. |
| **Lap 1** | `0m - 1800m` | Lintasan penuh terwarnai (karena Lap 1 melaju penuh `1800m`). | Bendera **Start** muncul (karena `0m` ada di Lap 1). Bendera **Finish** tidak muncul (karena finish di Lap 2). |
| **Lap 2** | `1800m - 3370m` | Hanya bagian `0m` hingga `1570m` yang berwarna. Sisa lintasan `1570m - 1800m` berupa garis abu-abu tipis. | Bendera **Finish** muncul (di posisi `1570m`). Bendera **Start** (awal balapan) tidak muncul karena balapan sudah dimulai sejak Lap 1. |

Dengan pendekatan ini, gambar lintasan dan penanda ikon berubah secara akurat dan tidak akan hilang secara salah (tetap sinkron dengan lap yang sedang disimulasikan).
