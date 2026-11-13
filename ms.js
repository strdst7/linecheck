/* Malay content for everything that carries prose inside the engine:
   scenarios, checks, findings, agenda steps, and the fault catalogue.
   Kept in one file so engine.js stays language-agnostic. */

export const MS_DIAGNOSES = {
  drop_cable:      { label: "Kerosakan kabel turun / masuk",            skill: "Juruteknik kabel",          parts: ["Kabel turun 2-pair (anggaran panjang)", "Pengapit kabel turun", "Demput / sarung masuk kedap"] },
  premise_wiring:  { label: "Kerosakan pendawaian / sambungan dalam rumah", skill: "Juruteknik lapangan",    parts: ["Kabel tampal", "Klip kabel permukaan", "Jak keystone"] },
  socket_fault:    { label: "Kerosakan soket / terminal pertama",        skill: "Juruteknik lapangan",       parts: ["Soket rangkaian", "Kotak belakang (flush)", "Kabel tampal"] },
  radio_signal:    { label: "Masalah isyarat di talian pelanggan",        skill: "Juruteknik akses",         parts: ["Kit penyambung (f-type)", "Pemisah (isolator atas permintaan)"] },
  radio_drop:      { label: "Masalah kabel turun / penyambung di luar",   skill: "Juruteknik akses",         parts: ["Kabel turun luar", "Penyambung f-type", "Pengapit tiang"] },
  radio_distance:  { label: "Had jarak / liputan (talian di hujung cawangan)", skill: "Rujukan pasukan rangkaian", parts: ["Laporan meter isyarat", "Bacaan profil talian"] },
  olt_capacity:    { label: "Kapasiti / kesesakan pada cawangan dikongsi", skill: "Rujukan pasukan rangkaian", parts: ["Eksport penggunaan port"] },
  splitter:        { label: "Kehilangan di pemisah atau bahagian nod",    skill: "Juruteknik akses",         parts: ["Pemisah (1x8)", "Kit penyambung (sc/apc)"] },
  router_hardware: { label: "Kerosakan perkakasan atau perisian router",  skill: "Pulangan dan tukar",       parts: ["Tukar ONT/router model sama", "Beg pulangan berlabel"] },
  wifi_coverage:   { label: "Liputan Wi-Fi dalam rumah",                  skill: "Pelanggan baiki sendiri",  parts: ["Nod mesh pilihan (bercaj)"] },
  customer_lan:    { label: "Peralatan pelanggan atau pendawaian dalam rumah", skill: "Pelanggan baiki sendiri", parts: [] },
  interference:    { label: "Gangguan setempat (belum disahkan)",         skill: "Juruteknik lapangan",      parts: ["Tukar saluran router (perisian)", "Laporan imbasan saluran"] },
};

/* Scenario prose by report id. Customer names, addresses, and phones stay
   as given: they are fictional either way, and inventing a second set of
   fake people for a second language adds nothing a reader can verify. */
export const MS_SCENARIO = {
  "S-4471": {
    windows: "08:00 hingga 12:00, mana-mana hari bekerja",
    address: "14 Jalan Kenari 3, Taman Sri Kenari, 56000 Cheras, Kuala Lumpur",
    accessNotes: "Teres berpagar. Kod pagar diberikan pelanggan atas permintaan. Di belakang rumah, kabel turun merentasi bumbung port kereta berkongsi dan memerlukan kebenaran jiran untuk sampai. Tanya dahulu sebelum memanjat.",
    safety: [
      "Bumbung port kereta berkongsi sudah reput: jangan dipijak. Periksa kabel turun dari paras tanah dan anak tangga bawah sahaja.",
      "Ada anjing di sempadan belakang. Pelanggan mesti mengikatnya sebelum juruteknik masuk.",
    ],
    report: "Terputus-putus dan perlahan pada waktu petang selama 6 minggu, tiga laporan berasingan. Router menunjukkan 'No Service' selama beberapa minit setiap kali.",
    csrChecklist: "Status talian disemak: talian dalam talian. Tiada rekod disahkan di pihak pelanggan. LED router dilaporkan merah pada dua laporan.",
    prevFound: null,
  },
  "S-2290": {
    windows: "13:00 hingga 17:00, Sabtu sahaja",
    address: "5A Jalan Jelatek, 54200 Kuala Lumpur",
    accessNotes: "Apartmen, aras 5. Akses lif. Fiber berakhir di almari utiliti unit; bersebelahan kotak unit jiran. Beri label pada setiap kabel yang anda tanggalkan.",
    safety: [
      "Almari utiliti sempit dengan tepi pelapik terdedah. Sarung tangan dan lampu suluh diperlukan.",
      "Pelanggan memelihara burung di ruang tamu. Elakkan membuka tingkap di sebelah itu.",
    ],
    report: "Tiada internet selepas ribut petir. Mahu lawatan hari sama. Kata 'kotak berkelip' dan TV juga dimulakan semula malam itu.",
    csrChecklist: "Talian disahkan dari hujung jauh: talian mati. Corak lampu router: merah. Tiada kerosakan lonjakan dilaporkan pelanggan setakat ini.",
    prevFound: { "install": "Pemasangan rutin. Cat6 dari almari utiliti ke kabinet TV, soket ditamatkan, baik." },
  },
  "S-7734": {
    windows: "09:00 hingga 18:00, hari bekerja",
    address: "9 Lorong 4, Taman Megah, 47300 Petaling Jaya",
    accessNotes: "Teres, hadapan lapang. Kotak fiber di dinding hadapan di sebelah kanan pintu. Pagar terbuka sepanjang tempoh lawatan.",
    safety: ["Hanya kerja pada ketinggian rendah. Tiada pemanjatan dijangka."],
    report: "Kelajuan pantas di router, sangat perlahan di tempat lain. Wi-Fi memutuskan aplikasi panggilan video di bilik belakang. Mahu jurutera 'membaiki pendawaian'. Kelajuan talian tidak dilaporkan perlahan.",
    csrChecklist: "Talian disahkan: talian hidup. Pelanggan melaporkan perkara sama pada setiap peranti di bilik belakang. Bilik hadapan baik.",
    prevFound: null,
  },
  "S-1180": {
    windows: "08:00 hingga 11:00, hari bekerja",
    address: "22 Jalan Pandan Indah 6, 55100 Kuala Lumpur",
    accessNotes: "Teres, kabel turun dari tiang berkongsi di belakang. Laluan tiang berlumpur selepas hujan. Bawa penutup kasut.",
    safety: [
      "Tiang dikongsi dengan bekalan elektrik. Patuhi jarak pendekatan minimum dan pastikan tiang tiada wayar sokongan sementara sebelum menyentuh apa-apa.",
      "Laluan di belakang tidak rata dan lumpur boleh menyembunyikan bucu jalan: jalan dahulu sebelum membawa tangga.",
    ],
    report: "Dua lawatan lepas melaporkan 'tiada kerosakan ditemui'. Kelajuan di bawah separuh pakej di router, tetapi hanya pada waktu petang. Lawatan pertama menukar kabel, lawatan kedua dicaj sebagai NFF. Pelanggan merakam kedua-dua lawatan dan kecewa.",
    csrChecklist: "Talian disahkan: talian hidup. Profil talian menunjukkan profil kelajuan 100/50 disediakan untuk pakej 30 Mbps. Sampel kelajuan pelanggan 3 hingga 4 Mbps di router semasa puncak.",
    prevFound: {
      "hardware swap": "Menukar kabel turun luar 'sebagai langkah berjaga-jaga'. Kelajuan tidak berubah.",
      "NFF": "Dicaj: tiada kerosakan ditemui. Kelajuan tidak diuji pada waktu puncak.",
    },
  },
};

export const MS_CHECK_LABEL_DETAIL = {
  speed_at_router: { label: "Kelajuan pada LAN router adalah normal", detail: "Uji peranti berkabel di router semasa waktu sibuk biasa pelanggan." },
  line_status: { label: "Status talian dari rangkaian akses", detail: "Semak keadaan talian yang dilaporkan rangkaian sebelum anda mengetuk." },
  router_light: { label: "Lampu router apabila kerosakan berlaku", detail: "Tanya pelanggan. 'Berkelip' bermaksud berbeza pada model berbeza, jadi guna label peranti." },
  wifi_pattern: { label: "Perlahan hanya pada Wi-Fi", detail: "Bandingkan ujian sama melalui Wi-Fi dan melalui kabel di bilik yang sama." },
};

export const MS_OPTION_LABEL = {
  y: "Ya, hampir pakej", n: "Tidak, lemah di router", nt: "Tidak diuji / luar puncak",
  up: "Talian hidup", down: "Talian mati", unknown: "Tidak disahkan",
  green: "Hijau tetap, masih tiada perkhidmatan", red: "Merah atau berkelip merah", off: "Mati / tiada kuasa",
};
// 'nt'/'y'/'n' clash across checks, so labels are resolved per check id.
export const MS_OPTION = {
  speed_at_router: { y: "Ya, hampir pakej", n: "Tidak, lemah di router", nt: "Tidak diuji / luar puncak" },
  line_status: { up: "Talian hidup", down: "Talian mati", unknown: "Tidak disahkan" },
  router_light: { green: "Hijau tetap, masih tiada perkhidmatan", red: "Merah atau berkelip merah", off: "Mati / tiada kuasa", unknown: "Pelanggan tidak dapat pastikan" },
  wifi_pattern: { y: "Ya, kabel baik", n: "Tidak, kabel pun perlahan", nt: "Tidak dibandingkan" },
};

export const MS_WHY = {
  speed_at_router: {
    y: "Kelajuan di router memenuhi pakej. Talian sedang menghantar; kerosakan di hilir.",
    n: "Router sudah perlahan. Talian, kabel turun, atau cawangan dikongsi kurang daripada pakej.",
    nt: "Kelajuan belum disahkan. Lawatan tidak boleh menutup kerja tanpa ujian pada waktu puncak di router.",
  },
  line_status: {
    up: "Talian hidup. Kegagalan talian sepenuhnya dikecualikan; kerosakan berselang masih mungkin.",
    down: "Talian mati. Kerosakan di talian pelanggan atau sebelum itu.",
    unknown: "Status talian tidak disahkan. Sebarang kesimpulan pendawaian hanya bergantung pada huraian pelanggan.",
  },
  router_light: {
    green: "Lampu tetap tanpa perkhidmatan menjauhkan punca daripada talian.",
    red: "Merah tanpa perkhidmatan konsisten dengan kerosakan talian atau penyediaan.",
    off: "Tiada kuasa mengalahkan semua penjelasan lain. Sahkan kuasa dahulu.",
    unknown: "Tiada pengesahan dari peranti.",
  },
  wifi_pattern: {
    y: "Kabel baik, Wi-Fi lemah: liputan, saluran, atau gangguan.",
    n: "Kabel pun lemah: bukan masalah Wi-Fi.",
    nt: "Tidak dapat memisahkan kerosakan talian daripada kerosakan Wi-Fi.",
  },
};

export const MS_FINDING = {
  line_down: { title: "Talian mati", note: "Talian mati mengecualikan punca dalam rumah sehingga talian dipulihkan." },
  power: { title: "Tiada kuasa ke router", note: "Semak kuasa dan penyesuai sebelum apa-apa. Ini penjelasan termurah dan paling kerap." },
  swap_already: { title: "Perkakasan sudah ditukar", note: "Perkakasan sudah ditukar dan kerosakan kembali. Jangan tukar model sama lagi tanpa bukti baharu." },
  repeat_nff: { title: "Lawatan NFF berulang", note: "Lawatan NFF berulang. Anggap kesimpulan lepas sebagai syak, bukan bukti. Ambil ukuran yang lawatan lepas terlepas." },
  line_shortfall: { title: "Talian kurang daripada pakej", note: "Lemah di router bermaksud talian, kabel turun, atau cawangan dikongsi, bukan rangkaian dalam rumah." },
  wifi_inside: { title: "Kerosakan di dalam rumah", note: "Talian sedang menghantar. Masalah antara router dan peranti." },
  recurring_clean: { title: "Kerosakan berulang, bersih semasa ujian", note: "Kerosakan berulang yang bersih semasa lawatan perlu ujian mengikut masa, bukan tukar kabel lagi." },
  no_peak_test: { title: "Tiada ukuran waktu puncak", note: "Uji semasa waktu sibuk pelanggan sebelum menulis sebarang kesimpulan. Ujian luar puncak tidak boleh menutup kerosakan waktu puncak." },
  shared_leg: { title: "Jiran pada cawangan dikongsi turut laporkan", note: "Jiran pada cawangan dikongsi sama melaporkan corak sama. Semak pemisah atau port sebelum menyalahkan kabel turun pelanggan." },
  recurring_first_time: { title: "Berulang kali pertama direkodkan", note: "Pengulangan pertama didokumenkan. Rekod sampel bercap masa supaya lawatan kedua ada pembanding." },
  self_fix_exhausted: { title: "Pelanggan sudah cuba asas", note: "Jangan ulang langkah asas yang pelanggan sudah buat. Nyatakan apa yang anda akan buat secara berbeza." },
};

export const MS_FINDING_BECAUSE = {
  "Line status: down (checked from the access network at visit time)": "Status talian: mati (disemak dari rangkaian akses semasa lawatan)",
  "Router indicator: off / no power": "Lampu router: mati / tiada kuasa",
  "Speed at the router is below the plan during the busy hour": "Kelajuan di router di bawah pakej semasa waktu sibuk",
  "Speed at the router is fine": "Kelajuan di router baik",
  "Cable fine, Wi-Fi poor": "Kabel baik, Wi-Fi lemah",
  "Customer describes trouble away from the router": "Pelanggan menyatakan masalah jauh dari router",
  "Speed at the router is fine on every test so far": "Kelajuan di router baik pada setiap ujian setakat ini",
  "Customer reports the fault keeps coming back": "Pelanggan melaporkan kerosakan terus berulang",
  "Speed at the router: not tested, or off-peak only": "Kelajuan di router: tidak diuji, atau luar puncak sahaja",
  "Customer reports the fault recurring": "Pelanggan melaporkan kerosakan berulang",
  "Customer already tried the reset and restart routine": "Pelanggan sudah cuba rutin set semula dan mula semula",
};

export const MS_AGENDA = {
  review: { title: "Baca semula lawatan lepas sebelum menyentuh apa-apa", detailNff: "Lawatan terakhir ditutup sebagai tiada kerosakan ditemui ({ids}). Nyatakan apa yang anda akan ukur yang lawatan lepas tidak ukur.", detailNone: "Tiada penutupan NFF sebelum ini pada talian ini." },
  speed: { title: "Uji kelajuan di router semasa waktu sibuk pelanggan", detail: "Peranti berkabel di router. Rekod masa, kelajuan pakej, dan keputusan. Angka waktu puncak itu tujuannya." },
  line: { title: "Sahkan status talian dari rangkaian akses sebelum lawatan", detail: "Keadaan talian menentukan sama ada anda mengejar kerosakan talian atau kerosakan dalam rumah." },
  wifi: { title: "Bandingkan Wi-Fi dengan kabel di bilik terjejas", detail: "Jika kabel baik, berhenti menyiasat talian dan semak liputan, saluran, dan peranti." },
  photo: { title: "Ambil gambar terminal dan titik masuk kabel turun", detail: "Bukti yang lawatan seterusnya boleh bandingkan. Sertakan meter atau ID soket pelanggan dalam bingkai." },
  close: { title: "Sepakati hasil di dalam bilik", detail: "Nyatakan selesai, kerja rangkaian tertunggak, atau perlu baiki sendiri. Serahkan ringkasan selepas lawatan sebelum pergi." },
};

export const MS_UNRESOLVED = {
  "line status not verified": "status talian tidak disahkan",
  "no peak-hour speed measurement at the router": "tiada ukuran kelajuan waktu puncak di router",
  "Wi-Fi versus cable not compared": "Wi-Fi berbanding kabel tidak dibandingkan",
  "no supported diagnosis; one or more checks needed": "tiada diagnosis disokong; satu atau lebih semakan diperlukan",
};

export const MS_PRIOR_VISIT = {
  "Billed: no fault found. Replaced patch lead at customer request.": "Dicaj: tiada kerosakan ditemui. Menukar kabel tampal atas permintaan pelanggan.",
  "Replaced customer router (same model). Drop-outs continued same week.": "Menukar router pelanggan (model sama). Putus berterusan minggu itu.",
  "Billed: no fault found. Longer visit (95 min).": "Dicaj: tiada kerosakan ditemui. Lawatan lebih lama (95 min).",
};

export const MS_NEIGHBOUR = {
  "neighbour, direct cable path": "jiran, laluan kabel terus",
  "neighbour, works from home": "jiran, bekerja dari rumah",
  "business line, no after-hours use": "talian perniagaan, tiada penggunaan luar waktu",
  "neighbour, same closet": "jiran, almari sama",
  "neighbour, reports OK": "jiran, melaporkan normal",
  "building main": "utama bangunan",
  "neighbour": "jiran",
  "shared splitter": "pemisah dikongsi",
  "splitter group": "kumpulan pemisah",
  "same splitter": "pemisah sama",
  "line 6 to 8": "talian 6 hingga 8",
  "line 6 to 10": "talian 6 hingga 10",
  "line 5 to 2": "talian 5 hingga 2",
  "unit 5B": "unit 5B",
  "unit 4C": "unit 4C",
  "building line": "talian bangunan",
  "Lorong 4": "Lorong 4",
};
export const MS_NEIGHBOUR_NOTE = {
  "Shares the carport the drop crosses.": "Berkongsi port kereta yang dilalui kabel turun.",
  "Reports evening video calls failing, same as Halima.": "Melaporkan panggilan video petang gagal, sama seperti Halima.",
  "No complaints on record.": "Tiada aduan direkodkan.",
  "Same closet, separate connection. Could have been knocked.": "Almari sama, sambungan berasingan. Mungkin tersentuh.",
  "No issues reported.": "Tiada masalah dilaporkan.",
  "Confirms no site-wide incident reported.": "Mengesahkan tiada insiden seluruh tapak dilaporkan.",
  "No issue reported.": "Tiada masalah dilaporkan.",
  "Three neighbours on the same splitter group report slow evenings.": "Tiga jiran dalam kumpulan pemisah sama melaporkan petang perlahan.",
  "Slow evenings only, daytime fine.": "Petang perlahan sahaja, siang baik.",
};
