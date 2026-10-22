import { HealthCheckRecord } from '../types';

export type HealthStatusLevel = 'optimal' | 'normal' | 'waspada' | 'tinggi' | 'rendah';

export interface ParameterAnalysis {
  name: string;
  valueString: string;
  status: HealthStatusLevel;
  statusLabel: string;
  referenceRange: string;
  summary: string;
  selfControlAction: string;
  foodsToLimit: string[];
  foodsToEncourage: string[];
}

export interface ComprehensiveHealthAnalysis {
  overallStatus: 'prima' | 'perhatian' | 'peringatan';
  overallTitle: string;
  overallDescription: string;
  parameters: {
    bloodPressure: ParameterAnalysis;
    uricAcid?: ParameterAnalysis;
    cholesterol?: ParameterAnalysis;
    bloodSugar?: ParameterAnalysis;
  };
  keyHabitRecommendations: string[];
}

// Analisis Tensi Darah (AHA / PERKI)
export function analyzeBloodPressure(systolic: number, diastolic: number): ParameterAnalysis {
  let status: HealthStatusLevel = 'normal';
  let statusLabel = 'Normal';
  let summary = 'Tekanan darah berada dalam rentang ideal.';
  let selfControlAction = 'Pertahankan konsumsi air putih, tidur cukup 7 jam, dan kendalikan stres.';
  const foodsToLimit = ['Makanan kaleng/instan berkadar natrium tinggi', 'Camilan asin/keripik', 'Kopi berlebihan'];
  const foodsToEncourage = ['Pisang & alpukat (kaya kalium)', 'Bayam & sayuran hijau', 'Air putih 2-2.5L'];

  if (systolic < 90 || diastolic < 60) {
    status = 'rendah';
    statusLabel = 'Hipotensi (Tekanan Darah Rendah)';
    summary = 'Tekanan darah di bawah ambang batas standar normal.';
    selfControlAction = 'Pastikan hidrasi cukup, jangan berdiri mendadak dari duduk, dan konsumsi makanan bernutrisi seimbang.';
  } else if (systolic >= 140 || diastolic >= 90) {
    status = 'tinggi';
    statusLabel = 'Hipertensi Derajat 2';
    summary = 'Tekanan darah meningkat signifikan. Berisiko membebani jantung dan pembuluh darah.';
    selfControlAction = 'Kendali diri ketat: Batasi garam dapur maksimal 1 sendok teh/hari, hentikan rokok/alkohol, dan konsultasi ke dokter.';
  } else if (systolic >= 130 || diastolic >= 80) {
    status = 'waspada';
    statusLabel = 'Hipertensi Derajat 1';
    summary = 'Tekanan darah mulai melewati batas normal atas.';
    selfControlAction = 'Kurangi makanan olahan tinggi garam, terapkan teknik relaksasi / jalan santai 30 menit sehari.';
  } else if (systolic >= 120 && diastolic < 80) {
    status = 'waspada';
    statusLabel = 'Pre-Hipertensi (Elevated)';
    summary = 'Tekanan sistolik mulai naik, perlu dijaga agar tidak berlanjut ke hipertensi.';
    selfControlAction = 'Disiplin olahraga kardio ringan 30 menit dan hindari begadang.';
  } else {
    status = 'optimal';
    statusLabel = 'Optimal / Normal';
  }

  return {
    name: 'Tekanan Darah (Tensi)',
    valueString: `${systolic}/${diastolic} mmHg`,
    status,
    statusLabel,
    referenceRange: '< 120 / < 80 mmHg',
    summary,
    selfControlAction,
    foodsToLimit,
    foodsToEncourage
  };
}

// Analisis Asam Urat (Uric Acid)
export function analyzeUricAcid(value: number, gender: 'pria' | 'wanita' = 'pria'): ParameterAnalysis {
  const maxSafe = gender === 'wanita' ? 6.0 : 7.0;
  const minSafe = gender === 'wanita' ? 2.5 : 3.5;

  let status: HealthStatusLevel = 'normal';
  let statusLabel = 'Normal';
  let summary = `Kadar asam urat seimbang dalam batas acuan (${gender === 'wanita' ? 'Wanita: 2.5-6.0' : 'Pria: 3.5-7.0'} mg/dL).`;
  let selfControlAction = 'Jaga hidrasi minimal 8 gelas per hari untuk membantu ginjal menyaring asam urat alami.';
  const foodsToLimit = ['Jeroan (hati, babat, usus)', 'Emping melinjo', 'Seafood berlebih (udang, kerang)', 'Minuman manis fruktosa tinggi'];
  const foodsToEncourage = ['Air putih 2.5 Liter', 'Buah ceri & apel', 'Tahu & tempe dalam porsi wajar', 'Susu rendah lemak'];

  if (value > maxSafe + 1.5) {
    status = 'tinggi';
    statusLabel = 'Hiperurisemia Tinggi';
    summary = 'Kadar asam urat tinggi, berisiko memicu peradangan nyeri sendi (gout) atau kristal asam urat.';
    selfControlAction = 'Kendali diri ketat: Stop total konsumsi jeroan & emping, hindari alkohol/minuman manis boba, perbanyak air putih.';
  } else if (value > maxSafe) {
    status = 'waspada';
    statusLabel = 'Batas Tinggi (Waspada)';
    summary = 'Asam urat sedikit di atas batas rujukan normal. Mulai kurangi makanan tinggi purin.';
    selfControlAction = 'Ganti camilan gorengan dengan buah segar dan minum minimal 2.5L air hangat per hari.';
  } else if (value < minSafe) {
    status = 'rendah';
    statusLabel = 'Di Bawah Normal';
    summary = 'Kadar asam urat di bawah rentang acuan.';
    selfControlAction = 'Pastikan asupan protein seimbang.';
  }

  return {
    name: 'Asam Urat',
    valueString: `${value} mg/dL`,
    status,
    statusLabel,
    referenceRange: gender === 'wanita' ? '2.5 - 6.0 mg/dL' : '3.5 - 7.0 mg/dL',
    summary,
    selfControlAction,
    foodsToLimit,
    foodsToEncourage
  };
}

// Analisis Kolesterol Total
export function analyzeCholesterol(value: number): ParameterAnalysis {
  let status: HealthStatusLevel = 'normal';
  let statusLabel = 'Normal';
  let summary = 'Kadar kolesterol total sehat (< 200 mg/dL).';
  let selfControlAction = 'Pertahankan pola makan serat tinggi dan olahraga teratur.';
  const foodsToLimit = ['Gorengan minyak kelapa sawit daur ulang', 'Santan kental berlebih', 'Daging berlemak / kulit ayam', 'Kuning telur berlebih'];
  const foodsToEncourage = ['Oatmeal & biji-bijian utuh', 'Ikan salmon/kembung (omega-3)', 'Sayuran hijau serat larut', 'Minyak zaitun murni'];

  if (value >= 240) {
    status = 'tinggi';
    statusLabel = 'Kolesterol Tinggi (Risiko Kardiovaskular)';
    summary = 'Kadar kolesterol tinggi, berpotensi membentuk plak di dinding pembuluh darah arteri.';
    selfControlAction = 'Kendali diri ketat: Hindari total gorengan, stop makanan bersantan kental, tingkatkan jalan kaki 30 menit setiap hari.';
  } else if (value >= 200) {
    status = 'waspada';
    statusLabel = 'Batas Waspada (Borderline High)';
    summary = 'Kolesterol berada di ambang batas atas. Perlu intervensi gaya hidup sebelum menjadi tinggi.';
    selfControlAction = 'Ganti metode masak dari menggoreng menjadi rebus/kukus/panggang, dan konsumsi oatmeal saat sarapan.';
  }

  return {
    name: 'Kolesterol Total',
    valueString: `${value} mg/dL`,
    status,
    statusLabel,
    referenceRange: '< 200 mg/dL',
    summary,
    selfControlAction,
    foodsToLimit,
    foodsToEncourage
  };
}

// Analisis Gula Darah (Blood Sugar)
export function analyzeBloodSugar(
  value: number,
  type: 'puasa' | 'sewaktu' | 'setelah_makan' = 'puasa'
): ParameterAnalysis {
  let status: HealthStatusLevel = 'normal';
  let statusLabel = 'Normal';
  let summary = '';
  let refRange = '';
  let selfControlAction = 'Jaga kendali diri terhadap minuman manis, teh kemasan, dan camilan tinggi gula.';
  const foodsToLimit = ['Minuman boba, soda, & kopi susu manis', 'Nasi putih porsi jumbo', 'Kue manis & tepung terigu olahan'];
  const foodsToEncourage = ['Beras merah / nasi jagung', 'Sayuran hijau tinggi serat', 'Alpukat & kacang almond', 'Air putih'];

  if (type === 'puasa') {
    refRange = '70 - 99 mg/dL (Puasa)';
    if (value >= 126) {
      status = 'tinggi';
      statusLabel = 'Gula Darah Tinggi (Rentang Diabetes)';
      summary = 'Kadar gula darah puasa tinggi (>= 126 mg/dL). Tubuh kesulitan memproses glukosa secara efisien.';
      selfControlAction = 'Kendali diri ketat: Batasi karbohidrat olahan, stop minuman manis kemasan, dan konsultasikan ke dokter.';
    } else if (value >= 100) {
      status = 'waspada';
      statusLabel = 'Prediabetes (Toleransi Glukosa Terganggu)';
      summary = 'Gula darah puasa berada di zona waspada prediabetes (100-125 mg/dL). Masih sangat bisa dinormalkan dengan disiplin.';
      selfControlAction = 'Ganti minuman manis dengan air putih atau teh tawar. Berjalan santai 15 menit setelah makan.';
    } else if (value < 70) {
      status = 'rendah';
      statusLabel = 'Hipoglikemia (Rendah)';
      summary = 'Kadar glukosa darah terlalu rendah. Waspadai gejala pusing atau keringat dingin.';
      selfControlAction = 'Konsumsi sumber karbohidrat sehat atau buah potong.';
    } else {
      status = 'normal';
      statusLabel = 'Normal (Sehat)';
      summary = 'Gula darah puasa ideal dan stabil.';
    }
  } else {
    // Sewaktu / Setelah makan
    refRange = '< 140 mg/dL (Sewaktu)';
    if (value >= 200) {
      status = 'tinggi';
      statusLabel = 'Tinggi (Rentang Diabetes)';
      summary = 'Gula darah sewaktu >= 200 mg/dL mengindikasikan lonjakan glukosa darah yang signifikan.';
      selfControlAction = 'Hindari total minuman manis bersoda, boba, atau sirup.';
    } else if (value >= 140) {
      status = 'waspada';
      statusLabel = 'Prediabetes (Batas Atas)';
      summary = 'Gula darah sewaktu (140-199 mg/dL) berada di atas batas ideal pasca makan.';
      selfControlAction = 'Kendalikan porsi makan malam dan lakukan jalan kaki setelah makan.';
    } else {
      status = 'normal';
      statusLabel = 'Normal (Stabil)';
      summary = 'Gula darah sewaktu terkontrol dengan baik di bawah 140 mg/dL.';
    }
  }

  return {
    name: 'Gula Darah',
    valueString: `${value} mg/dL (${type === 'puasa' ? 'Puasa' : type === 'setelah_makan' ? '2 Jam Pasca Makan' : 'Sewaktu'})`,
    status,
    statusLabel,
    referenceRange: refRange,
    summary,
    selfControlAction,
    foodsToLimit,
    foodsToEncourage
  };
}

// Analisis Komprehensif Seluruh Parameter
export function generateComprehensiveAnalysis(record: HealthCheckRecord): ComprehensiveHealthAnalysis {
  const bpAnalysis = analyzeBloodPressure(record.systolic, record.diastolic);
  const uricAnalysis = record.uricAcid ? analyzeUricAcid(record.uricAcid, record.gender || 'pria') : undefined;
  const cholAnalysis = record.cholesterol ? analyzeCholesterol(record.cholesterol) : undefined;
  const bsAnalysis = record.bloodSugar ? analyzeBloodSugar(record.bloodSugar, record.bloodSugarType || 'puasa') : undefined;

  const allStatuses: HealthStatusLevel[] = [
    bpAnalysis.status,
    uricAnalysis?.status,
    cholAnalysis?.status,
    bsAnalysis?.status
  ].filter(Boolean) as HealthStatusLevel[];

  const hasHigh = allStatuses.some((s) => s === 'tinggi');
  const hasWarning = allStatuses.some((s) => s === 'waspada' || s === 'rendah');

  let overallStatus: 'prima' | 'perhatian' | 'peringatan' = 'prima';
  let overallTitle = 'Kondisi Kesehatan Prima & Terkendali';
  let overallDescription = 'Semua parameter yang diperiksa berada dalam rentang normal dan aman. Terus pertahankan disiplin hidrasi, tidur, dan pola makan sehatmu.';

  if (hasHigh) {
    overallStatus = 'peringatan';
    overallTitle = 'Perlu Tindakan & Kendali Diri Ketat';
    overallDescription = 'Ditemukan parameter kesehatan yang berada di ambang batas tinggi. Terapkan rem kendali diri terhadap makanan pemicu dan pertimbangkan konsultasi dengan tenaga medis.';
  } else if (hasWarning) {
    overallStatus = 'perhatian';
    overallTitle = 'Kondisi Waspada (Perlu Perhatian Pola Hidup)';
    overallDescription = 'Sebagian parameter mulai mendekati ambang batas atas. Perbaiki waktu istirahat, kurangi asupan garam/lemak/gula, dan perbanyak air putih.';
  }

  const recommendations: string[] = [];
  if (bpAnalysis.status !== 'optimal' && bpAnalysis.status !== 'normal') {
    recommendations.push('Kendalikan konsumsi garam, batasi kopi/energi instan, dan tidur minimal 7 jam.');
  }
  if (uricAnalysis && uricAnalysis.status !== 'normal') {
    recommendations.push('Tahan godaan jeroan, emping, serta perbanyak minum air putih 2.5 liter per hari.');
  }
  if (cholAnalysis && cholAnalysis.status !== 'normal') {
    recommendations.push('Ganti camilan gorengan dengan buah potong, dan rutin jalan kaki 30 menit.');
  }
  if (bsAnalysis && bsAnalysis.status !== 'normal') {
    recommendations.push('Hentikan konsumsi minuman manis boba/kemasan dan kurangi karbohidrat olahan.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Pertahankan hidrasi 8 gelas air putih dan aktivitas jalan 30 menit harian.');
    recommendations.push('Lakukan pemeriksaan berkala setiap 1-3 bulan untuk memantau tren kesehatan.');
  }

  return {
    overallStatus,
    overallTitle,
    overallDescription,
    parameters: {
      bloodPressure: bpAnalysis,
      uricAcid: uricAnalysis,
      cholesterol: cholAnalysis,
      bloodSugar: bsAnalysis
    },
    keyHabitRecommendations: recommendations
  };
}
