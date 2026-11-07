/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Growtopia AI Farming Knowledge Base & Advisor Engine
 * Provides instant, deep, and highly accurate answers for all Growtopia farming questions.
 */

export interface GrowtopiaAIResponse {
  reply: string;
  sources?: { title: string; uri: string }[];
}

export const CROP_KNOWLEDGE: Record<string, {
  name: string;
  growTime: string;
  durationHours: number;
  hits: number;
  recipe: string;
  gemsPerTree: string;
  gemsFullWorld: string;
  wlEstimate: string;
  bestFor: string;
  tips: string[];
}> = {
  laserGrid: {
    name: 'Laser Grid (Lgrid)',
    growTime: '3 hari 15 jam (87 jam)',
    durationHours: 87,
    hits: 3,
    recipe: 'Splat Steel Seed + Glass Seed',
    gemsPerTree: '20 - 30 Gems',
    gemsFullWorld: '~60.000 - 75.000 Gems (2.600 pohon)',
    wlEstimate: '30 - 40 World Lock (via Megaphone / SSP)',
    bestFor: 'Pilihan utama farmer menengah hingga sultan karena hanya butuh 3 hit (sangat cepat dipecahkan di BFG atau manual).',
    tips: [
      'Gunakan Rayman Fist + Sorrow Harvester untuk panen maksimal.',
      'Biji (seed) Laser Grid bernilai stabil (sekitar 18-20 seed per WL).',
      'Rotasi ideal: miliki 4 world Laser Grid agar bisa panen setiap hari!',
    ],
  },
  chandelier: {
    name: 'Chandelier (Chandi)',
    growTime: '7 hari 0 jam (168 jam)',
    durationHours: 168,
    hits: 6,
    recipe: 'Crystal Seed + Portal Seed',
    gemsPerTree: '40 - 55 Gems',
    gemsFullWorld: '~110.000 - 130.000 Gems (2.600 pohon)',
    wlEstimate: '55 - 70 World Lock per panen',
    bestFor: 'Farmer yang tidak punya banyak waktu luang (hanya panen seminggu sekali) namun menginginkan gems dalam jumlah masif.',
    tips: [
      'Jumlah hit adalah 6 kali, disarankan menggunakan Magplant di world BFG agar pengerjaan efisien.',
      'Paling disukai untuk persiapan event SummerFest dan Clash.',
      'Sangat cocok dipadukan dengan Lucky Clover untuk drop gems maksimal.',
    ],
  },
  pepperTree: {
    name: 'Pepper Tree',
    growTime: '1 hari 7 jam 30 menit (31.5 jam)',
    durationHours: 31.5,
    hits: 3,
    recipe: 'Lava Seed + Magic Bell Seed',
    gemsPerTree: '8 - 14 Gems',
    gemsFullWorld: '~22.000 - 30.000 Gems (2.600 pohon)',
    wlEstimate: '12 - 16 World Lock',
    bestFor: 'Farmer aktif harian dengan modal awal terjangkau.',
    tips: [
      'Siklus panen sangat cepat (hampir setiap 1.3 hari).',
      'Biji Pepper mudah dijual cepat di world BUYPEPPER.',
      'Sangat mudah di-splice sendiri dari nol.',
    ],
  },
  fishTank: {
    name: 'Fish Tank (FT)',
    growTime: '16 jam 40 menit',
    durationHours: 16.67,
    hits: 2,
    recipe: 'Water Bucket Seed + Window Seed',
    gemsPerTree: '3 - 7 Gems',
    gemsFullWorld: '~10.000 - 14.000 Gems',
    wlEstimate: '5 - 8 World Lock',
    bestFor: 'Petani pemula (Newbie / Low Budget) yang ingin memutar modal dalam hitungan jam.',
    tips: [
      'Hanya butuh 2 hit tanpa pickaxe sekalipun!',
      'Cocok untuk menaikkan level akun baru dengan cepat.',
    ],
  },
  sorcererStone: {
    name: 'Sorcerer Stone',
    growTime: '3 hari 0 jam (72 jam)',
    durationHours: 72,
    hits: 4,
    recipe: 'Magic Bell Seed + Stone Seed',
    gemsPerTree: '18 - 25 Gems',
    gemsFullWorld: '~48.000 - 60.000 Gems',
    wlEstimate: '25 - 30 World Lock',
    bestFor: 'Alternatif Laser Grid untuk diversifikasi pohon farm.',
    tips: [
      'Sangat cocok saat ada event Wizard / Clash.',
    ],
  },
  magicBell: {
    name: 'Magic Bell',
    growTime: '18 jam 20 menit',
    durationHours: 18.33,
    hits: 3,
    recipe: 'Door Seed + Glass Seed',
    gemsPerTree: '4 - 8 Gems',
    gemsFullWorld: '~11.000 - 16.000 Gems',
    wlEstimate: '6 - 9 World Lock',
    bestFor: 'Bahan splice krusial untuk membuat Pepper Tree dan Sorcerer Stone.',
    tips: [
      'Jangan langsung dijual bloknya, lebih menguntungkan dibuat jadi bibit Pepper.',
    ],
  },
  sugarcane: {
    name: 'Sugarcane',
    growTime: '7 jam 12 menit',
    durationHours: 7.2,
    hits: 2,
    recipe: 'Wood Block Seed + Yellow Block Seed',
    gemsPerTree: '2 - 4 Gems',
    gemsFullWorld: '~5.000 - 8.000 Gems',
    wlEstimate: '3 - 5 World Lock',
    bestFor: 'Farming super kilat dalam satu hari bisa panen 2-3 kali.',
    tips: [
      'Bisa dipakai untuk memasak (Cook) resep di oven.',
    ],
  },
};

export function answerGrowtopiaQuestion(query: string): GrowtopiaAIResponse {
  const q = query.toLowerCase().trim();

  // 1. LASER GRID
  if (q.includes('laser grid') || q.includes('lgrid') || q.includes('lg')) {
    const crop = CROP_KNOWLEDGE.laserGrid;
    return {
      reply: `🌱 **PANDUAN LENGKAP FARMING LASER GRID (LGRID)**

- **Waktu Panen:** ${crop.growTime}
- **Jumlah Hit:** ${crop.hits} Hit (sangat ringan dipecahkan!)
- **Resep Splice:** ${crop.recipe}
- **Estimasi Gems (1 Full World 2.600 Pohon):** ${crop.gemsFullWorld}
- **Potensi Pendapatan:** ${crop.wlEstimate}

💡 **Tips Rotasi Terbaik:**
1. **Strategi 4 World:** Buat 4 world farm Laser Grid dengan selisih tanam 1 hari. Dengan begitu, Anda bisa panen 1 full world setiap hari tanpa henti!
2. **Kombinasi Gear:** Gunakan *Rayman's Fist* + *Sorrow Harvester* saat panen untuk melipatgandakan pengembalian seed.
3. **Pemberian ke BFG:** Jika tidak sempat memecahkan sendiri, buka room BFG publik (fee 5-10 WL per jam atau gratisan) dengan Magplant.

*Ada yang ingin ditanyakan lagi seputar Laser Grid atau kalkulasi profitnya?*`,
      sources: [
        { title: 'Growtopia Wiki - Laser Grid', uri: 'https://growtopia.fandom.com/wiki/Laser_Grid' },
      ],
    };
  }

  // 2. CHANDELIER
  if (q.includes('chandelier') || q.includes('chandi') || q.includes('chande')) {
    const crop = CROP_KNOWLEDGE.chandelier;
    return {
      reply: `💎 **PANDUAN LENGKAP FARMING CHANDELIER**

- **Waktu Panen:** ${crop.growTime} (Tepat 1 Minggu)
- **Jumlah Hit:** ${crop.hits} Hit
- **Resep Splice:** ${crop.recipe}
- **Estimasi Gems (1 Full World 2.600 Pohon):** ${crop.gemsFullWorld}
- **Estimasi Pendapatan WL:** ${crop.wlEstimate}

👑 **Analisis Keunggulan:**
- Chandelier adalah pohon penghasil Gems tertinggi di kelas farmable murni.
- Sangat efisien untuk pemain sibuk: Cukup rawat dan panen seminggu sekali saat akhir pekan!
- **Tips Ekstra:** Simpan gems hasil panen Chandelier untuk dibelanjakan saat **SummerFest** (beli Fireworks Pack) atau **Winterfest** untuk melipatgandakan rasio keuntungan hingga 2x lipat!`,
      sources: [
        { title: 'Growtopia Wiki - Chandelier', uri: 'https://growtopia.fandom.com/wiki/Chandelier' },
      ],
    };
  }

  // 3. PEPPER TREE
  if (q.includes('pepper') || q.includes('peper')) {
    const crop = CROP_KNOWLEDGE.pepperTree;
    return {
      reply: `🌶️ **PANDUAN LENGKAP FARMING PEPPER TREE**

- **Waktu Panen:** ${crop.growTime}
- **Jumlah Hit:** ${crop.hits} Hit
- **Resep Splice:** ${crop.recipe}
- **Estimasi Gems (1 Full World):** ${crop.gemsFullWorld}
- **Estimasi WL:** ${crop.wlEstimate}

🔥 **Keuntungan Pepper Tree:**
- Waktu tumbuh hanya ~31 jam, sangat cepat berputar. Dalam 1 bulan Anda bisa memanen sekitar 22-24 kali per world!
- Modal bibit awal sangat terjangkau dibanding Laser Grid atau Chandelier.
- Permintaan pasar untuk Pepper Tree Seed selalu tinggi di world BUYPEPPER.`,
      sources: [
        { title: 'Growtopia Wiki - Pepper Tree', uri: 'https://growtopia.fandom.com/wiki/Pepper_Tree' },
      ],
    };
  }

  // 4. FISH TANK
  if (q.includes('fish tank') || q.includes('fishtank') || q.includes('ft')) {
    const crop = CROP_KNOWLEDGE.fishTank;
    return {
      reply: `🐟 **PANDUAN FARMING FISH TANK (FT)**

- **Waktu Panen:** ${crop.growTime}
- **Jumlah Hit:** ${crop.hits} Hit (Hanya 2 pukulan!)
- **Resep Splice:** ${crop.recipe}
- **Estimasi Gems:** ${crop.gemsFullWorld}

⚡ **Sangat Direkomendasikan Untuk:**
- Pemain pemula dengan modal di bawah 5-10 WL.
- Leveling akun GrowID dari level 1 ke level 20+ dalam beberapa hari.
- Karena hanya 2 hit, memecahkan 5.000 blok Fish Tank bisa selesai dalam waktu kurang dari 30 menit!`,
      sources: [
        { title: 'Growtopia Wiki - Fish Tank', uri: 'https://growtopia.fandom.com/wiki/Fish_Tank' },
      ],
    };
  }

  // 5. PACK STORE / CONVERT GEMS KE WL
  if (
    q.includes('pack') ||
    q.includes('store') ||
    q.includes('toko') ||
    q.includes('convert') ||
    q.includes('tukar gem') ||
    q.includes('beli apa')
  ) {
    return {
      reply: `🛍️ **REKOMENDASI BELANJA STORE PACK TERBAIK (GEMS ➡️ WL)**

Berdasarkan rasio konversi harga pasar Growtopia saat ini:

1. **Megaphone Pack (20.000 Gems)** 📢
   - Dijual sekitar: **10 - 13 WL** per pack (atau 3 pack seharga ~35 WL).
   - Rasio: Sangat likuid dan cepat laku dalam hitungan detik di world BUYMEGA.

2. **Surgery Pack (20.000 Gems)** 🩺
   - Dijual sekitar: **6 - 8 WL** per pack.
   - Paling dicari oleh pemain yang sedang menaikkan Role Surgeon atau quest Malpractice.

3. **Small Seed Pack / SSP (500 Gems)** 🌱
   - Beli grosir 20-40 pack lalu buka atau jual pack utuh di BUYSSP.
   - Rasio stabil: ~2.000 Gems = 1 WL.

4. **Event Pack (Musiman)** ⭐
   - **Summer Surprise Pack** (saat SummerFest): Rasio bisa mencapai 15-25 WL per 25.000 Gems!
   - Simpan Gems Anda jika event besar tinggal beberapa minggu lagi.`,
      sources: [
        { title: 'Growtopia Store Guide', uri: 'https://growtopia.fandom.com/wiki/Store' },
      ],
    };
  }

  // 6. GEAR, BUFF & EQUIPMENT FARMING
  if (
    q.includes('gear') ||
    q.includes('rayman') ||
    q.includes('sorrow') ||
    q.includes('clover') ||
    q.includes('item farm') ||
    q.includes('alat')
  ) {
    return {
      reply: `🛠️ **GEAR & BUFF UTAMA UNTUK PETANI GROWTOPIA**

Untuk memaksimalkan kecepatan dan keuntungan farming Anda:

1. **Rayman's Fist** 👊
   - Menghancurkan 3 blok sekaligus secara horizontal dalam 1 pukulan.
   - Menghemat waktu breaking hingga 66%!

2. **Sorrow Harvester (Tractor)** 🚜
   - Memberikan chance ekstra drop benih (seed) dan gems saat panen pohon.
   - Wajib dimiliki untuk farmer dengan 3+ world agar jumlah pohon terus bertambah.

3. **Lucky Clover** 🍀
   - Meningkatkan persentase drop Gems dari setiap blok yang dipecahkan selama 2 jam.
   - Selalu konsumsi sebelum sesi breaking BFG 1 full world!

4. **Ring of Force** 💍
   - Memberikan efek punch lebih cepat dan knockback stabil.

5. **Diamond Dragon** 🐉
   - Mendukung drop gems tambahan saat aktivitas game berlangsung.`,
      sources: [
        { title: 'Growtopia Farming Equipment', uri: 'https://growtopia.fandom.com/wiki/Farming' },
      ],
    };
  }

  // 7. BFG (BREAK FOR GEMS) EXPLANATION
  if (q.includes('bfg') || q.includes('break for gem') || q.includes('magplant')) {
    return {
      reply: `⚡ **PANDUAN SISTEM BFG (BREAK FOR GEMS)**

**Apa itu BFG?**
BFG adalah sistem di mana pemilik world menyediakan blok (biasanya Laser Grid / Chandelier) menggunakan remote *Magplant 5000*. Pemain lain (breaker) datang untuk memecahkan blok tersebut secara cuma-cuma:
- **Pemilik Farm:** Mendapatkan semua biji (seed) dan blok hasil panen kembali ke Magplant.
- **Breaker (Pemain):** Mendapatkan seluruh Gems yang jatuh dari blok yang mereka pecahkan secara gratis!

**Cara Mengatur World BFG Sendiri:**
1. Siapkan world dengan pintu masuk yang rapi dan deretan platform vertikal.
2. Tempatkan Magplant 5000 dengan mode *Remote Deposit Enabled*.
3. Pasang display monitor di world BUYBFG atau BFG untuk menarik pemain.
4. Anda bisa farming 5-10 world sehari tanpa perlu pegal memecahkan blok sendiri!`,
      sources: [
        { title: 'Growtopia BFG System', uri: 'https://growtopia.fandom.com/wiki/Magplant_5000' },
      ],
    };
  }

  // 8. CARA CEPAT KAYA / TIPS PEMULA
  if (
    q.includes('pemula') ||
    q.includes('cepat kaya') ||
    q.includes('modal') ||
    q.includes('profit') ||
    q.includes('tips') ||
    q.includes('rekomendasi')
  ) {
    return {
      reply: `🚀 **PANDUAN STRATEGI PROFIT FARMING DARI NOL KE 100+ WL**

**Tahap 1: Modal 0 - 5 WL (Newbie)**
- Mulai dari pohon **Grass**, **Dirt**, lalu splice menjadi **Wood Block** dan **Fish Tank**.
- Panen Fish Tank setiap 16 jam. Kumpulkan 10.000 Gems pertama Anda.

**Tahap 2: Modal 5 - 20 WL (Menengah Bawah)**
- Tukar Gems menjadi **Pepper Tree Seed** (beli di world BUYPEPPER).
- Tanam 1.000 - 2.000 pohon Pepper Tree. Panen setiap 1.3 hari.

**Tahap 3: Modal 20 - 100+ WL (Pro Farmer)**
- Alihkan seluruh modal ke **Laser Grid**.
- Bangun 1 world full (2.600 pohon). Setiap panen menghasilkan 60.000+ Gems (~35 WL).
- Re-investasikan hasilnya untuk membeli world Laser Grid ke-2, ke-3, dan ke-4.

**Tahap 4: Sultan Mode (100+ WL)**
- Gunakan Chandelier + Rayman Fist + sewa/buka world BFG publik.
- Panen ratusan ribu Gems per minggu tanpa memecahkan satu blok pun secara manual!`,
      sources: [
        { title: 'Growtopia Economy Guide', uri: 'https://growtopia.fandom.com/wiki/World_Lock' },
      ],
    };
  }

  // 9. RESEP DAN SPLICE
  if (q.includes('resep') || q.includes('splice') || q.includes('buat') || q.includes('bikin')) {
    return {
      reply: `🧪 **DAFTAR RESEP SPLICE BENIH POPULER GROWTOPIA**

- **Laser Grid:** Splat Steel Seed + Glass Seed
- **Chandelier:** Crystal Seed + Portal Seed
- **Pepper Tree:** Lava Seed + Magic Bell Seed
- **Fish Tank:** Water Bucket Seed + Window Seed
- **Sorcerer Stone:** Magic Bell Seed + Stone Seed
- **Magic Bell:** Door Seed + Glass Seed
- **Portcullis:** Dungeon Door Seed + Iron Grid Seed
- **High Tech Block:** Grid Seed + Plasma Gun Seed

*Tips Splice:* Selalu pastikan kedua jenis benih memiliki tier yang cocok dan tanam di lahan yang bersih dari bebatuan liar!`,
      sources: [
        { title: 'Growtopia Splice Recipes', uri: 'https://growtopia.fandom.com/wiki/Splicing' },
      ],
    };
  }

  // 10. DEFAULT / GENERAL GREETING & FALLBACK
  return {
    reply: `👋 **Halo Farmer Growtopia! Saya Guru Farming AI Anda.**

Saya siap membantu menjawab segala hal seputar rotasi farming dan ekonomi Growtopia:

- 🌾 **Waktu & Rotasi:** Laser Grid (87 jam), Chandelier (168 jam), Pepper Tree (31.5 jam), Fish Tank (16 jam).
- 💎 **Kalkulasi Gems & WL:** Estimasi pendapatan dari 2.600 pohon per world.
- 🛍️ **Store Packs:** Cara menukar Gems jadi WL dengan untung maksimal (Megaphone, Surgery, SSP).
- 🛠️ **Peralatan Terbaik:** Tips memakai Rayman, Sorrow Harvester, dan Lucky Clover.
- ⚡ **Sistem BFG:** Strategi hosting dan breaking blok cepat.

*Pertanyaan spesifik Anda:* "${query}"
Ada tanaman atau strategi tertentu yang ingin kita hitung sekarang? Silakan ketik misalnya *"Berapa lama panen Laser Grid?"* atau *"Pack apa paling untung?"*!`,
    sources: [
      { title: 'Growtopia Official Community Wiki', uri: 'https://growtopia.fandom.com/wiki/Growtopia_Wiki' },
    ],
  };
}
