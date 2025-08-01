export function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}


export function generateWarnaDenganSeed(warnaDasar, seed) {
    // 1. Definisi rentang untuk setiap warna dasar
    const colorRanges = {
        Hitam: {
            r: { min: 0, max: 40 },
            g: { min: 0, max: 40 },
            b: { min: 0, max: 40 },
        },
        Jragem: {
            r: { min: 0, max: 25 },
            g: { min: 0, max: 25 },
            b: { min: 0, max: 25 },
        },
        Merah: {
            r: { min: 140, max: 210 },
            g: { min: 30, max: 90 },
            b: { min: 10, max: 50 },
        },
        Kuning: {
            r: { min: 200, max: 255 },
            g: { min: 170, max: 240 },
            b: { min: 40, max: 110 },
        },
        Napas: {
            r: { min: 90, max: 150 },
            g: { min: 40, max: 80 },
            b: { min: 20, max: 60 },
        },
        Silver: {
            r: { min: 190, max: 235 },
            g: { min: 190, max: 235 },
            b: { min: 190, max: 235 },
        },
        Putih: {
            r: { min: 230, max: 255 },
            g: { min: 230, max: 255 },
            b: { min: 230, max: 255 },
        },
        Bopong: {
            r: { min: 50, max: 90 },
            g: { min: 30, max: 70 },
            b: { min: 20, max: 60 },
        },
        Kelabu: {
            r: { min: 120, max: 180 },
            g: { min: 120, max: 180 },
            b: { min: 120, max: 180 },
        },
    };

    // 2. Pilih rentang warna, atau gunakan 'Hitam' jika nama tidak valid
    const range = colorRanges[warnaDasar] || colorRanges["Hitam"];

    // 3. Buat fungsi random yang hasilnya berdasarkan seed (Pseudo-Random)
    // Ini memastikan bahwa untuk seed yang sama, urutan angka "acak" yang dihasilkan selalu sama.
    let currentSeed = seed;
    const seededRandom = () => {
        // Angka-angka ini adalah konstanta umum untuk LCG (Linear Congruential Generator)
        currentSeed = (currentSeed * 1103515245 + 12345) % 2147483647;
        return currentSeed / 2147483647; // Hasilnya antara 0 dan 1
    };

    // 4. Helper untuk mengambil angka dalam rentang min/max menggunakan seededRandom
    const getSeededInt = (min, max) => {
        return Math.floor(seededRandom() * (max - min + 1)) + min;
    };

    // 5. Helper untuk format ke Hex 2-digit
    const toHex = (val) => val.toString(16).padStart(2, "0");

    // 6. Hasilkan nilai R, G, B secara berurutan agar hasilnya deterministik
    const r = getSeededInt(range.r.min, range.r.max);
    const g = getSeededInt(range.g.min, range.g.max);
    const b = getSeededInt(range.b.min, range.b.max);

    // 7. Gabungkan dan kembalikan hasilnya
    return `0x${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function createSeededDarkColorGenerator(seed, maxBrightness = 128) {
    // Ensure brightness is within the valid 0-255 range.
    const cap = Math.max(0, Math.min(255, maxBrightness));

    const numericSeed =
        typeof seed === "string" ? stringToSeed(seed) : seed;
    const random = mulberry32(numericSeed);

    return function () {
        // Generate a value for each component, capped by the brightness limit.
        const r = Math.floor(random() * (cap + 1))
            .toString(16)
            .padStart(2, "0");
        const g = Math.floor(random() * (cap + 1))
            .toString(16)
            .padStart(2, "0");
        const b = Math.floor(random() * (cap + 1))
            .toString(16)
            .padStart(2, "0");

        return `0x${r}${g}${b}`;
    };
}

/**
 * Menghasilkan kode warna kuda dengan berbagai opsi.
 *
 * @param {string} warnaDasar - Nama warna dasar ('Hitam', 'Merah', 'Kuning', dll.).
 * @param {object} [opsi={}] - Objek konfigurasi opsional.
 * @param {string} [opsi.versi='normal'] - Versi warna ('normal' atau 'terang').
 * @param {number|null} [opsi.seed=null] - Seed numerik untuk hasil deterministik. Jika null, hasil akan acak.
 * @returns {string} Kode warna dalam format '0xRRGGBB'.
 */
export function generateWarnaKuda(warnaDasar, opsi = {}) {
  // 1. Data Palet untuk semua warna dan versinya
  const paletWarna = {
    'Hitam': {
      normal: { r: { min: 0, max: 40 }, g: { min: 0, max: 40 }, b: { min: 0, max: 40 } },
      terang: { r: { min: 100, max: 150 }, g: { min: 100, max: 150 }, b: { min: 100, max: 150 } }
    },
    'Jragem': {
      normal: { r: { min: 0, max: 25 }, g: { min: 0, max: 25 }, b: { min: 0, max: 25 } },
      terang: { r: { min: 70, max: 120 }, g: { min: 70, max: 120 }, b: { min: 70, max: 120 } }
    },
    'Merah': {
      normal: { r: { min: 140, max: 210 }, g: { min: 30, max: 90 }, b: { min: 10, max: 50 } },
      terang: { r: { min: 190, max: 240 }, g: { min: 80, max: 140 }, b: { min: 60, max: 100 } }
    },
    'Kuning': {
      normal: { r: { min: 200, max: 255 }, g: { min: 170, max: 240 }, b: { min: 40, max: 110 } },
      terang: { r: { min: 230, max: 255 }, g: { min: 210, max: 255 }, b: { min: 150, max: 200 } }
    },
    'Napas': {
      normal: { r: { min: 90, max: 150 }, g: { min: 40, max: 80 }, b: { min: 20, max: 60 } },
      terang: { r: { min: 160, max: 210 }, g: { min: 110, max: 160 }, b: { min: 80, max: 130 } }
    },
    'Silver': {
      normal: { r: { min: 190, max: 235 }, g: { min: 190, max: 235 }, b: { min: 190, max: 235 } },
      terang: { r: { min: 215, max: 245 }, g: { min: 215, max: 245 }, b: { min: 215, max: 245 } }
    },
    'Putih': {
      normal: { r: { min: 230, max: 255 }, g: { min: 230, max: 255 }, b: { min: 230, max: 255 } },
      terang: { r: { min: 240, max: 255 }, g: { min: 240, max: 255 }, b: { min: 240, max: 255 } }
    },
    'Bopong': {
      normal: { r: { min: 50, max: 90 }, g: { min: 30, max: 70 }, b: { min: 20, max: 60 } },
      terang: { r: { min: 130, max: 180 }, g: { min: 90, max: 130 }, b: { min: 70, max: 110 } }
    },
    'Kelabu': {
      normal: { r: { min: 120, max: 180 }, g: { min: 120, max: 180 }, b: { min: 120, max: 180 } },
      terang: { r: { min: 190, max: 225 }, g: { min: 190, max: 225 }, b: { min: 190, max: 225 } }
    }
  };

  // 2. Tentukan opsi default
  const { versi = 'normal', seed = null } = opsi;

  // 3. Pilih palet dan rentang yang benar, dengan fallback jika input tidak valid
  const palet = paletWarna[warnaDasar] || paletWarna['Hitam'];
  const rentang = palet[versi] || palet['normal'];

  // 4. Pilih metode random: berbasis seed atau standar
  let getAngka;
  if (seed !== null) {
    // Jika ada seed, gunakan generator yang dapat diprediksi (deterministik)
    let currentSeed = seed;
    const seededRandom = () => {
      currentSeed = (currentSeed * 1103515245 + 12345) % 2147483647;
      return currentSeed / 2147483647; // Hasil antara 0 dan 1
    };
    getAngka = (min, max) => Math.floor(seededRandom() * (max - min + 1)) + min;
  } else {
    // Jika tidak ada seed, gunakan Math.random() biasa
    getAngka = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // 5. Hasilkan nilai R, G, B dan format ke Hex
  const r = getAngka(rentang.r.min, rentang.r.max);
  const g = getAngka(rentang.g.min, rentang.g.max);
  const b = getAngka(rentang.b.min, rentang.b.max);
  
  const toHex = (val) => val.toString(16).padStart(2, '0');

  return `0x${toHex(r)}${toHex(g)}${toHex(b)}`;
}