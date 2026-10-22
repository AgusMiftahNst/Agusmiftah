export interface JarvisUserContext {
  userName?: string;
  pendingActivities?: Array<{
    title: string;
    deadline?: string;
    category?: string;
    priority?: string;
  }>;
  latestHealthCheck?: {
    date?: string;
    checkDate?: string;
    systolic?: number;
    diastolic?: number;
    uricAcid?: number;
    cholesterol?: number;
    bloodSugar?: number;
    notes?: string;
    [key: string]: any;
  };
  todayHabits?: Array<{
    title: string;
    progress: string;
  }>;
  recentTransactions?: Array<{
    id?: string;
    title?: string;
    amount?: number;
    type?: string;
    category?: string;
    date?: string;
    description?: string;
    [key: string]: any;
  }>;
}

export function generateContextualJarvisReply(userText: string, context?: JarvisUserContext): string {
  const q = (userText || '').toLowerCase().trim();
  const name = context?.userName || 'Agus';
  const pending = context?.pendingActivities || [];
  const health = context?.latestHealthCheck;
  const habits = context?.todayHabits || [];

  // 1. Kegiatan & Deadline
  if (
    q.includes('kegiatan') ||
    q.includes('deadline') ||
    q.includes('aktivitas') ||
    q.includes('tugas') ||
    q.includes('kerjaan') ||
    q.includes('belum') ||
    q.includes('jadwal')
  ) {
    if (pending.length === 0) {
      return `🎉 Kabar hebat ${name}! Tidak ada kegiatan atau deadline yang menumpuk saat ini. Semua tugas sudah tuntas! Jangan lupa istirahat yang cukup ya.`;
    }

    const listStr = pending
      .slice(0, 7)
      .map((item, idx) => {
        const priorityBadge = item.priority === 'high' ? '🔥 [PENTING]' : item.priority === 'low' ? '🟢 [Santai]' : '⚡ [Normal]';
        const deadlineStr = item.deadline && item.deadline.trim() ? `(Deadline: ${item.deadline})` : '(Tanpa batas waktu)';
        return `${idx + 1}. ${priorityBadge} **${item.title}** ${deadlineStr}`;
      })
      .join('\n');

    return `📋 **Daftar Kegiatan & Deadline Tertunda (${pending.length} tugas):**\n\n${listStr}\n\n💡 *Saran JARVIS*: Dahulukan yang bertanda 🔥 [PENTING] agar pikiran lebih tenang. Kamu pasti bisa menyelesaikan semuanya, ${name}!`;
  }

  // 2. Tensi, Asam Urat, Kolesterol, Skrining Kesehatan
  if (
    q.includes('tensi') ||
    q.includes('asam urat') ||
    q.includes('kolesterol') ||
    q.includes('gula darah') ||
    q.includes('darah') ||
    q.includes('tekanan') ||
    q.includes('skrining') ||
    (q.includes('hasil') && (q.includes('tes') || q.includes('lab') || q.includes('kesehatan')))
  ) {
    if (!health) {
      return `🩺 Halo ${name}, belum ada data skrining kesehatan terbaru yang tercatat di sistem. Yuk luangkan waktu sebentar untuk ukur tensi dan cek asam urat, lalu tekan tombol **+ Skrining Baru** di tab Kesehatan ya!`;
    }

    const findings: string[] = [];
    if (health.systolic && health.diastolic) {
      const status = health.systolic >= 140 || health.diastolic >= 90
        ? '⚠️ Tinggi (Hipertensi)'
        : health.systolic >= 130 || health.diastolic >= 85
        ? '⚠️ Pra-Hipertensi'
        : '✅ Normal';
      findings.push(`• **Tensi Darah**: ${health.systolic}/${health.diastolic} mmHg (${status})`);
    }

    if (health.uricAcid) {
      const status = health.uricAcid > 7.0 ? '⚠️ Tinggi (Waspada sendi)' : '✅ Normal';
      findings.push(`• **Asam Urat**: ${health.uricAcid} mg/dL (${status}) [Standar aman: < 7.0 mg/dL]`);
    }

    if (health.cholesterol) {
      const status = health.cholesterol >= 200 ? '⚠️ Tinggi' : '✅ Aman';
      findings.push(`• **Kolesterol Total**: ${health.cholesterol} mg/dL (${status}) [Standar aman: < 200 mg/dL]`);
    }

    if (health.bloodSugar) {
      const status = health.bloodSugar >= 140 ? '⚠️ Perlu diwaspadai' : '✅ Terkontrol';
      findings.push(`• **Gula Darah**: ${health.bloodSugar} mg/dL (${status})`);
    }

    return `🩺 **Hasil Skrining Kesehatan Terakhir (${health.checkDate || health.date || 'Tercatat'}):**\n\n${findings.join('\n')}\n\n💡 *Catatan JARVIS*: ${
      health.notes ? `"${health.notes}" - ` : ''
    }Tetap jaga pola hidrasi air putih minimal 2 liter/hari dan batasi asupan purin serta minyak berlebih agar kondisi selalu fit!`;
  }

  // 3. Pantangan Makanan & Tips Nutrisi
  if (
    q.includes('pantangan') ||
    q.includes('makanan') ||
    q.includes('makan') ||
    q.includes('purin') ||
    q.includes('diet') ||
    q.includes('jeroan') ||
    q.includes('emping')
  ) {
    return `🥗 **Panduan Nutrisi & Pantangan Sehat untuk ${name}:**\n\n` +
      `🚫 **Wajib Dibatasi / Hindari:**\n` +
      `1. Jeroan (hati, usus, babat, paru, otak)\n` +
      `2. Emping melinjo & kacang tanah berlebih\n` +
      `3. Makanan laut tinggi purin (kerang, udang, kepiting)\n` +
      `4. Gorengan bersantan kental (memicu kolesterol & asam lambung)\n` +
      `5. Minuman kemasan tinggi gula fruktosa (menghambat pembuangan asam urat)\n\n` +
      `✅ **Sangat Disarankan:**\n` +
      `• Air putih minimal 8–10 gelas/hari (membuang kelebihan asam urat lewat ginjal)\n` +
      `• Mentimun, seledri, dan wortel\n` +
      `• Buah berry, apel, atau air perasan jeruk nipis hangat di pagi hari\n` +
      `• Ikan rendah lemak (kukus/panggang) & tahu/tempe secukupnya.`;
  }

  // 4. Evaluasi Air, Tidur & Kebiasaan
  if (
    q.includes('air') ||
    q.includes('minum') ||
    q.includes('tidur') ||
    q.includes('habit') ||
    q.includes('kebiasaan') ||
    q.includes('evaluasi')
  ) {
    if (habits.length === 0) {
      return `💧 Kebiasaan sehat hari ini belum dicatat, ${name}. Pastikan kamu sudah minum air minimal 2000 ml dan siapkan waktu istirahat tidur malam 7–8 jam ya!`;
    }

    const habitsList = habits.map((h) => `• **${h.title}**: ${h.progress}`).join('\n');
    return `💧 **Evaluasi Target Harian (${name}):**\n\n${habitsList}\n\n💡 *Rekomendasi JARVIS*: Jika target air belum genap 2000 ml, minum satu gelas sekarang ya! Jangan begadang agar tensi besok pagi tetap stabil.`;
  }

  // 5. Semangat & Motivasi
  if (
    q.includes('semangat') ||
    q.includes('motivasi') ||
    q.includes('capek') ||
    q.includes('lelah') ||
    q.includes('stres') ||
    q.includes('dorong')
  ) {
    return `⚡ **Tetap Semangat, Boss ${name}!**\n\n"Setiap langkah kecil yang kamu selesaikan hari ini adalah investasi besar untuk masa depan dan kesehatanmu."\n\nKerjakan satu per satu dengan tenang, tarik napas dalam-dalam, dan ingat: kesehatan tubuhmu adalah aset nomer satu. JARVIS ada di sini siap membantumu kapan saja! 💪`;
  }

  // 6. Default / Sapaan Umum
  return `Halo Boss ${name}! JARVIS siap melayani kebutuhan harianmu. 

Kamu bisa tanyakan atau minta bantuan langsung:
1. 📋 *"Apa kegiatan & deadline yang belum kuselesaikan?"*
2. 🩺 *"Bagaimana hasil tensi & asam uratku?"*
3. 🥗 *"Tips pantangan makanan asam urat & kolesterol"*
4. 💧 *"Bantu evaluasi minum air & tidurku hari ini"*
5. ⚡ *"Semangati aku dong!"*

Ada hal penting apa yang ingin kita selesaikan sekarang?`;
}
