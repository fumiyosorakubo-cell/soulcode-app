const STORAGE_KEYS = {
  current: "soul-code.current",
  records: "soul-code.records",
  logic: "soul-code.logic",
  copy: "soul-code.copy",
  templates: "soul-code.templates",
  queue: "soul-code.postQueue",
};

const defaultLogic = {
  version: "mvp-0.1",
  soulTypes: [
    "Inner Compass",
    "Wind Weaver",
    "Quiet Flame",
    "Star Listener",
    "Life Cartographer",
    "Golden Bridge",
    "Deep Harbor",
    "Awakening Seed",
  ],
  soulKeywords: [
    "静かな創造性",
    "風の時代をひらく感性",
    "本来の自分を思い出す力",
    "人を安心へ導く知性",
    "使命を形にする集中力",
    "違いを美しく結ぶ調和",
    "深い共感と観察力",
    "未来の流れを読む直感",
  ],
  essenceKeywords: [
    "調和、洞察、信頼",
    "自由、表現、変化",
    "誠実、継続、育成",
    "知性、静けさ、美意識",
    "勇気、創造、実行",
    "共感、受容、再生",
    "探究、構築、光",
    "余白、感性、使命",
  ],
  missionSeeds: [
    "人の内側にある可能性へ光を当てること。",
    "古い役割をほどき、新しい生き方へ橋をかけること。",
    "言葉にならない想いを、やさしく形にすること。",
    "静かな知性で、場と人の流れを整えること。",
    "経験から得た知恵を、次の誰かの羅針盤にすること。",
    "違いを責めず、響き合う場所をつくること。",
    "自分の真実を生きる姿で、周囲を照らすこと。",
    "風の時代に合う軽やかな選択を広げること。",
  ],
  strengthHints: [
    "場の空気を整え、必要な言葉を選ぶ力。",
    "小さな違和感を見逃さず、方向を整える力。",
    "人の奥にある願いを受け止め、育てる力。",
    "複雑なことを、静かに美しく整理する力。",
    "思いを現実へ移すための継続力。",
    "人と人、過去と未来をつなぐ橋渡しの力。",
    "深く感じたことを、信頼できる形へ変える力。",
    "余白から新しい発想を生み出す力。",
  ],
  messages: [
    "あなたの歩幅で、もう一度本来の自分を思い出してください。",
    "すでに持っている光を、少しずつ外の世界へ渡していきましょう。",
    "答えを急がず、あなたの内側にある静かな声を信じてください。",
    "人生テーマは、あなたを縛るものではなく、深く自由にする鍵です。",
    "使命は遠くにあるものではなく、日々の選択の中で育っていきます。",
    "あなたの才能は、自然にしていることの中に隠れています。",
    "魂の羅針盤は、いつもあなたの中心へ戻る道を示しています。",
    "唯一無二の響きを、あなた自身の言葉で表現していきましょう。",
  ],
};

const defaultCopy = {
  main: "あなたは、この世界にたった一人の存在です。",
  award: "あなたは唯一無二の存在です。",
};

const defaultTemplates = {
  "魂の問いかけ":
    "今日、自分の中心に戻るために、ひとつだけ手放せることは何ですか？\n\n#SoulCode分析学 #魂の羅針盤",
  "今日のSoul Codeメッセージ":
    "今日のSoul Codeメッセージ。\nあなたの才能は、自然にしていることの中に静かに息づいています。\n\n#SoulCode #本来の自分を思い出す",
  "風の時代の生き方":
    "風の時代は、重さよりも響き合いの時代。\nあなたの魂の設計図を、これからの選択に活かしていきましょう。\n\n#風の時代 #人生テーマ",
  "あなたへのギフト誘導":
    "世界に一つだけのSoul Codeを、あなたへのギフトとして受け取れます。\n\n#SoulCodePassport #唯一無二",
  "創設者ストーリー":
    "Soul Code分析学は、一人ひとりが本来の自分を思い出すための人生分析プラットフォームです。\n\n#空久保章代 #SoulCode分析学",
};

let activeProfile = sanitizeProfile(loadJson(STORAGE_KEYS.current, null));

// 古いバージョンで保存された壊れたプロファイルを無効化（描画クラッシュ防止）
function sanitizeProfile(p) {
  if (!p || typeof p !== "object") return null;
  const cs = p.coreScores;
  const ok = cs && ["L", "D", "S", "B", "C"].every((k) => typeof cs[k] === "number")
    && typeof p.soulCode === "string";
  if (!ok) {
    try { localStorage.removeItem(STORAGE_KEYS.current); } catch {}
    return null;
  }
  return p;
}
let logicConfig = loadJson(STORAGE_KEYS.logic, defaultLogic);
let copyConfig = loadJson(STORAGE_KEYS.copy, defaultCopy);
let templates = loadJson(STORAGE_KEYS.templates, defaultTemplates);

const screens = [...document.querySelectorAll("[data-screen]")];
const navButtons = [...document.querySelectorAll("[data-nav]")];
const form = document.querySelector("#soul-form");
const formError = document.querySelector("#form-error");
const unknownTime = document.querySelector("#unknown-time");
const birthTime = document.querySelector("#birth-time");
const toast = document.querySelector("#toast");

init();

function init() {
  // ナビ・フォームを最優先で登録（描画系が失敗してもボタンは必ず動く）
  safe(bindNavigation);
  safe(addBackButtons);
  safe(bindForm);
  safe(bindNumericFields);
  safe(applyCopy);
  safe(updateProfileViews);
  safe(hydrateAdmin);
  safe(bindPassportActions);
  safe(bindLuckyActions);
  safe(bindReadingPdf);
  safe(bindOfferActions);
  safe(bindAdmin);
  safe(renderTables);
  // モジュール全体（KANA_GROUP等）の初期化完了後に実行
  setTimeout(function () { safe(parseQueryProfile); }, 0);
}

// 決済後の自動メールのリンクから、本人の鑑定書を自動表示する
// 例: ?sc=1&n=そらくぼ ふみよ&y=1970&mo=6&d=11&t=14:30&pl=大分県
function parseQueryProfile() {
  const q = new URLSearchParams(location.search);
  if (q.get("sc") !== "1") return;
  const payload = {
    name: (q.get("n") || "").trim(),
    birthYear: (q.get("y") || "").trim(),
    birthMonth: (q.get("mo") || "").trim(),
    birthDay: (q.get("d") || "").trim(),
    birthTime: (q.get("t") || "").trim(),
    unknownTime: q.get("u") === "1" || !q.get("t"),
    birthPlace: (q.get("pl") || "").trim(),
  };
  if (!payload.name || !payload.birthYear || !payload.birthMonth || !payload.birthDay) return;
  activeProfile = createSoulProfile(payload);
  saveJson(STORAGE_KEYS.current, activeProfile);
  updateProfileViews();
  showScreen("fullreading");
}

// 鑑定書を「PDFで保存」（印刷）
function bindReadingPdf() {
  const btn = document.querySelector("#save-reading-pdf");
  if (!btn) return;
  btn.addEventListener("click", () => {
    document.body.classList.add("print-reading");
    window.print();
  });
  window.addEventListener("afterprint", () => document.body.classList.remove("print-reading"));
}

// 1ステップが失敗してもアプリ全体を止めない
function safe(fn) {
  try { fn(); } catch (e) { console.error("init step failed:", fn && fn.name, e); }
}

function bindNavigation() {
  // イベント委譲：再描画や将来追加のボタンでも確実に動く（要素スナップショットに依存しない）
  document.addEventListener("click", (event) => {
    const back = event.target.closest("[data-back]");
    if (back) {
      goBack();
      return;
    }
    const button = event.target.closest("[data-nav]");
    if (!button) return;
    const target = button.dataset.nav;
    if ((target === "gift" || target === "passport" || target === "offers") && !activeProfile) {
      showScreen("form");
      showToast("まず、あなたへのギフトを受け取るための情報を入力してください。");
      return;
    }
    showScreen(target);
  });
}

function bindForm() {
  unknownTime.addEventListener("change", () => {
    birthTime.disabled = unknownTime.checked;
    birthTime.value = unknownTime.checked ? "" : birthTime.value;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = readForm();
    const error = validateForm(payload);

    if (error) {
      formError.textContent = error;
      return;
    }

    formError.textContent = "";
    activeProfile = createSoulProfile(payload);
    saveJson(STORAGE_KEYS.current, activeProfile);
    appendRecord(activeProfile);
    updateProfileViews();
    renderTables();
    startGeneration();
  });
}

function bindPassportActions() {
  document.querySelector("#print-passport").addEventListener("click", () => {
    if (!requireProfile()) return;
    window.print();
  });

  document.querySelector("#download-passport").addEventListener("click", async () => {
    if (!requireProfile()) return;
    await downloadPassportImage(activeProfile);
  });
}

// 公式LINE（予約・ヒアリング・お渡し・決済リンク送付の受け皿）
const LINE_URL = "https://lin.ee/W7d54wH";

// 決済は本番Stripeリンク。入金後、自動で鑑定書がメール送付される。
// リンクがある商品はStripe決済に直結、未設定の商品は公式LINEで受付。
const STRIPE_LINKS = {
  report: "https://buy.stripe.com/7sYfZg6Y41bR5Kfd6BafS00",   // 完全版鑑定書 ¥1,980（本番）
  future: "https://buy.stripe.com/fZu28q5U08Ej6OjgiNafS01",   // 未来の扉 ¥3,300（本番）
  session: "",  // 個別セッション ¥10,000（本番リンク取得後にここへ）→ 当面はLINE
};

function bindOfferActions() {
  document.querySelectorAll("[data-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = button.dataset.product;
      const link = STRIPE_LINKS[product];
      if (link) {
        // Stripe決済に直結（入金後、自動で鑑定書が届く）
        showToast("決済ページへ。入金後、自動で鑑定書がメールで届きます🌙");
        window.open(link, "_blank", "noopener");
      } else {
        // 本番リンク未設定の商品は公式LINEで受付
        showToast("公式LINEへ。トークからご予約・お支払いができます🌙");
        window.open(LINE_URL, "_blank", "noopener");
      }
    });
  });

  document.querySelector("#line-button").addEventListener("click", () => {
    window.open(LINE_URL, "_blank", "noopener");
  });
}

function bindAdmin() {
  document.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-admin-tab]").forEach((tab) => tab.classList.remove("is-active"));
      document.querySelectorAll("[data-admin-panel]").forEach((panel) => panel.classList.remove("is-active"));
      button.classList.add("is-active");
      document.querySelector(`[data-admin-panel="${button.dataset.adminTab}"]`).classList.add("is-active");
    });
  });

  document.querySelector("#save-logic").addEventListener("click", () => {
    try {
      logicConfig = JSON.parse(document.querySelector("#logic-config").value);
      saveJson(STORAGE_KEYS.logic, logicConfig);
      showToast("ロジック設定を保存しました。");
    } catch {
      showToast("JSONの形式を確認してください。");
    }
  });

  document.querySelector("#save-copy").addEventListener("click", () => {
    copyConfig = {
      main: document.querySelector("#admin-main-copy").value.trim() || defaultCopy.main,
      award: document.querySelector("#admin-award-copy").value.trim() || defaultCopy.award,
    };
    saveJson(STORAGE_KEYS.copy, copyConfig);
    applyCopy();
    showToast("表示文章を保存しました。");
  });

  const category = document.querySelector("#sns-category");
  const template = document.querySelector("#sns-template");
  category.addEventListener("change", () => {
    template.value = templates[category.value] || "";
  });

  document.querySelector("#save-template").addEventListener("click", () => {
    templates[category.value] = template.value;
    saveJson(STORAGE_KEYS.templates, templates);
    showToast("SNS投稿テンプレートを保存しました。");
  });

  document.querySelector("#create-post").addEventListener("click", () => {
    const post = createMetaPayload(category.value, template.value, activeProfile);
    const queue = loadJson(STORAGE_KEYS.queue, []);
    queue.unshift({ ...post, queuedAt: new Date().toISOString(), status: "ready" });
    saveJson(STORAGE_KEYS.queue, queue.slice(0, 50));
    showToast("投稿キューに保存しました。Meta API送信用の土台です。");
  });

  document.querySelector("#show-meta-payload").addEventListener("click", () => {
    const post = createMetaPayload(category.value, template.value, activeProfile);
    document.querySelector("#meta-payload").textContent = JSON.stringify(post, null, 2);
  });
}

function readForm() {
  return {
    name: document.querySelector("#name").value.trim().replace(/\s+/g, " "),
    birthYear: document.querySelector("#birth-year").value.trim(),
    birthMonth: document.querySelector("#birth-month").value.trim(),
    birthDay: document.querySelector("#birth-day").value.trim(),
    birthTime: birthTime.value,
    unknownTime: unknownTime.checked,
    birthPlace: document.querySelector("#birth-place").value.trim(),
  };
}

function validateForm(payload) {
  if (!payload.name) return "お名前を入力してください。";
  if (!/^[ぁ-んーa-zA-Z\s]+$/.test(payload.name)) return "名前はひらがな、またはアルファベットで入力してください。";
  if (!payload.birthYear || !payload.birthMonth || !payload.birthDay) return "生年月日を入力してください。";
  if (!isValidDate(payload.birthYear, payload.birthMonth, payload.birthDay)) return "生年月日を確認してください。";
  if (!payload.unknownTime && !payload.birthTime) return "出生時間を入力するか、わからないを選択してください。";
  if (!payload.birthPlace) return "出生場所を入力してください。";
  return "";
}

function isValidDate(year, month, day) {
  const normalized = new Date(Number(year), Number(month) - 1, Number(day));
  return (
    normalized.getFullYear() === Number(year) &&
    normalized.getMonth() === Number(month) - 1 &&
    normalized.getDate() === Number(day)
  );
}

// ===== 本物のソウルコード算出（カリキュラム準拠） =====
const KANA_GROUPS = {
  1: "あいうえおぁぃぅぇぉ",
  2: "かきくけこがぎぐげご",
  3: "さしすせそざじずぜぞ",
  4: "たちつてとだぢづでどっ",
  5: "なにぬねの",
  6: "はひふへほばびぶべぼぱぴぷぺぽ",
  7: "まみむめも",
  8: "やゆよゃゅょ",
  9: "らりるれろわをん",
};
const KANA_GROUP = {};
for (const [g, chars] of Object.entries(KANA_GROUPS)) {
  for (const c of chars) KANA_GROUP[c] = Number(g);
}
const PREF_DIR = {
  北海道: "北", 青森: "北", 岩手: "北", 宮城: "北", 秋田: "北", 山形: "北", 福島: "北",
  茨城: "東", 埼玉: "東", 千葉: "東", 栃木: "東北", 群馬: "東北",
  東京: "中央", 神奈川: "東南", 静岡: "東南",
  山梨: "西北", 新潟: "西北", 長野: "西北", 富山: "西北", 石川: "西北", 福井: "西北", 岐阜: "西北",
  愛知: "西", 三重: "西南", 奈良: "西南", 和歌山: "西南",
  滋賀: "西", 京都: "西", 大阪: "西", 兵庫: "西",
  鳥取: "西", 島根: "西", 岡山: "西", 広島: "西", 山口: "西",
  徳島: "西", 香川: "西", 愛媛: "西", 高知: "西",
  福岡: "西", 佐賀: "西", 長崎: "西", 熊本: "西", 大分: "西", 宮崎: "西", 鹿児島: "西", 沖縄: "西南",
  // 海外（東京基準の世界方位・おおまかな目安）
  ハワイ: "東", アメリカ: "東", カナダ: "東", メキシコ: "東", ブラジル: "東",
  オーストラリア: "東南", ニュージーランド: "東南",
  インドネシア: "南", フィリピン: "南", シンガポール: "西南", タイ: "西南", インド: "西南", ベトナム: "西南",
  中国: "西", 韓国: "西", 台湾: "西", 香港: "西",
  イギリス: "西北", フランス: "西北", ドイツ: "西北", イタリア: "西北", スペイン: "西北", ヨーロッパ: "西北",
};
// 海外でも使える表記用のコード変換
const ELEMENT_SYMBOL = { 木: "Wd", 火: "Fi", 土: "Er", 金: "Au", 水: "Aq" };
const DIR_CODE = { 北: "N", 東: "E", 南: "S", 西: "W", 東北: "NE", 東南: "SE", 西北: "NW", 西南: "SW", 中央: "C", "—": "?" };

function reduceNumber(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((a, d) => a + Number(d), 0);
  }
  return n;
}
function calcSoulNumber(name) {
  let sum = 0;
  for (const ch of name) {
    if (KANA_GROUP[ch]) {
      sum += KANA_GROUP[ch]; // 日本語：五十音の行グループ
    } else {
      // 海外の名前：アルファベットはピタゴラス式数秘（A=1…I=9,J=1…）
      const c = ch.toUpperCase().charCodeAt(0);
      if (c >= 65 && c <= 90) sum += ((c - 65) % 9) + 1;
    }
  }
  return reduceNumber(sum);
}
function calcLifeNumber(y, m, d) {
  const sum = `${y}${m}${d}`.split("").reduce((a, c) => a + (Number(c) || 0), 0);
  return reduceNumber(sum);
}
function calcElement(year) {
  return ["金", "金", "水", "水", "木", "木", "火", "火", "土", "土"][Number(year) % 10];
}
function zodiacIndex(timeStr, unknown) {
  if (unknown || !timeStr) return -1;
  const h = Number(String(timeStr).split(":")[0]);
  return Math.floor(((h + 1) % 24) / 2); // 0=子 … 7=未 … 11=亥
}
function calcTimeCode(timeStr, unknown) {
  const i = zodiacIndex(timeStr, unknown);
  if (i < 0) return "—";
  return ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"][i];
}
function calcZodiacNum(timeStr, unknown) {
  const i = zodiacIndex(timeStr, unknown);
  return i < 0 ? "" : String(i + 1).padStart(2, "0"); // 未 → "08"
}
function calcEarthPoint(place) {
  for (const [pref, dir] of Object.entries(PREF_DIR)) if (place.includes(pref)) return dir;
  return "—";
}

// ===== 5つのソウルコア スコアリングエンジン =====
// 源泉（数秘・五行・十二支・方位・太陽星座）→ L灯/D淵/S翔/B環/C核 への寄与
const SOULNUM_CORES = {
  1: { C: 2 }, 2: { B: 2, D: 1 }, 3: { L: 3, S: 1 }, 4: { C: 3 }, 5: { S: 3, L: 1 },
  6: { B: 3 }, 7: { D: 3 }, 8: { C: 3 }, 9: { D: 2, B: 1, L: 1 },
  11: { D: 2, L: 2 }, 22: { C: 3, B: 1 }, 33: { B: 3, L: 1 },
};
const ELEMENT_CORES = { 木: { S: 1, L: 1 }, 火: { L: 3 }, 土: { B: 1, C: 1 }, 金: { C: 3 }, 水: { D: 3, S: 1 } };
const ZODIAC_CORES = {
  子: { S: 1 }, 丑: { C: 1 }, 寅: { C: 1, L: 1 }, 卯: { B: 1 }, 辰: { L: 1, C: 1 }, 巳: { D: 1 },
  午: { S: 1, L: 1 }, 未: { B: 2, D: 1 }, 申: { S: 1 }, 酉: { C: 1, D: 1 }, 戌: { B: 1, C: 1 }, 亥: { D: 1, C: 1 },
};
const DIR_CORES = {
  北: { D: 2 }, 東: { S: 2 }, 南: { L: 2 }, 西: { L: 1, S: 1 },
  東北: { C: 1 }, 東南: { B: 1 }, 西北: { C: 1, D: 1 }, 西南: { B: 1 }, 中央: { C: 2 },
};
const SUNELEM_CORES = { fire: { L: 2 }, earth: { C: 2 }, air: { S: 1, L: 1 }, water: { D: 1, B: 1 } };
// 太陽星座のエレメント（出生日から）
const SUN_MONTH = {
  1: [20, "earth", "air"], 2: [19, "air", "water"], 3: [21, "water", "fire"], 4: [20, "fire", "earth"],
  5: [21, "earth", "air"], 6: [21, "air", "water"], 7: [23, "water", "fire"], 8: [23, "fire", "earth"],
  9: [23, "earth", "air"], 10: [23, "air", "water"], 11: [22, "water", "fire"], 12: [22, "fire", "earth"],
};
function sunElement(m, d) {
  const x = SUN_MONTH[Number(m)];
  if (!x) return null;
  return Number(d) < x[0] ? x[1] : x[2];
}

// ============================================================
// 西洋占星術：出生図エンジン（自前ephemeris / Schlyter法・外部依存なし）
// 太陽・月・水星〜土星の黄経、上昇宮を算出。星座判定に十分な精度。
// ============================================================
const _rad = Math.PI / 180;
const _sin = (x) => Math.sin(x * _rad);
const _cos = (x) => Math.cos(x * _rad);
const _tan = (x) => Math.tan(x * _rad);
const _rev = (x) => ((x % 360) + 360) % 360;
const _atan2 = (y, x) => Math.atan2(y, x) / _rad;
const SIGN_JP = ["牡羊", "牡牛", "双子", "蟹", "獅子", "乙女", "天秤", "蠍", "射手", "山羊", "水瓶", "魚"];
const SIGN_EN = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
function signIndex(lon) { return Math.floor(_rev(lon) / 30); }
function signElement(i) { return ["fire", "earth", "air", "water"][((i % 4) + 4) % 4]; }
function signModality(i) { return ["cardinal", "fixed", "mutable"][((i % 3) + 3) % 3]; }

// 出生地 → [緯度, 東経]（上昇宮計算用・主要地のみ）
const PLACE_COORDS = {
  北海道: [43.06, 141.35], 青森: [40.82, 140.74], 岩手: [39.70, 141.15], 宮城: [38.27, 140.87],
  秋田: [39.72, 140.10], 山形: [38.24, 140.36], 福島: [37.75, 140.47], 茨城: [36.34, 140.45],
  栃木: [36.57, 139.88], 群馬: [36.39, 139.06], 埼玉: [35.86, 139.65], 千葉: [35.61, 140.12],
  東京: [35.69, 139.69], 神奈川: [35.45, 139.64], 新潟: [37.90, 139.02], 富山: [36.70, 137.21],
  石川: [36.59, 136.63], 福井: [36.07, 136.22], 山梨: [35.66, 138.57], 長野: [36.65, 138.18],
  岐阜: [35.39, 136.72], 静岡: [34.98, 138.38], 愛知: [35.18, 136.91], 三重: [34.73, 136.51],
  滋賀: [35.00, 135.87], 京都: [35.02, 135.76], 大阪: [34.69, 135.50], 兵庫: [34.69, 135.18],
  奈良: [34.69, 135.83], 和歌山: [34.23, 135.17], 鳥取: [35.50, 134.24], 島根: [35.47, 133.05],
  岡山: [34.66, 133.93], 広島: [34.40, 132.46], 山口: [34.19, 131.47], 徳島: [34.07, 134.56],
  香川: [34.34, 134.04], 愛媛: [33.84, 132.77], 高知: [33.56, 133.53], 福岡: [33.61, 130.42],
  佐賀: [33.25, 130.30], 長崎: [32.74, 129.87], 熊本: [32.79, 130.74], 大分: [33.24, 131.61],
  宮崎: [31.91, 131.42], 鹿児島: [31.56, 130.56], 沖縄: [26.21, 127.68],
  ハワイ: [21.31, -157.86], アメリカ: [40.71, -74.01], カナダ: [43.65, -79.38], ブラジル: [-23.55, -46.63],
  オーストラリア: [-33.87, 151.21], ニュージーランド: [-36.85, 174.76], インドネシア: [-6.21, 106.85],
  シンガポール: [1.35, 103.82], タイ: [13.76, 100.50], インド: [28.61, 77.21], ベトナム: [21.03, 105.85],
  中国: [39.90, 116.41], 韓国: [37.57, 126.98], 台湾: [25.03, 121.57], 香港: [22.32, 114.17],
  イギリス: [51.51, -0.13], フランス: [48.86, 2.35], ドイツ: [52.52, 13.40], イタリア: [41.90, 12.50],
  スペイン: [40.42, -3.70],
};
function placeCoords(place) {
  for (const [name, c] of Object.entries(PLACE_COORDS)) if (place && place.includes(name)) return c;
  return null;
}

// 出生図（黄経）を計算。hour=JST時刻(数値) / null、coords=[lat,lonE] / null
function natalChart(year, month, day, hour, coords) {
  const ut = (Number.isFinite(hour) ? hour : 12) - 9; // JST → UT
  const d =
    367 * year - Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4) +
    Math.floor((275 * month) / 9) + day - 730530 + ut / 24;
  const ecl = 23.4393 - 3.563e-7 * d;

  // 太陽
  const wS = 282.9404 + 4.70935e-5 * d, eS = 0.016709 - 1.151e-9 * d, MS = _rev(356.0470 + 0.9856002585 * d);
  let ES = MS + (180 / Math.PI) * eS * _sin(MS) * (1 + eS * _cos(MS));
  const xs0 = _cos(ES) - eS, ys0 = _sin(ES) * Math.sqrt(1 - eS * eS);
  const rS = Math.sqrt(xs0 * xs0 + ys0 * ys0), vS = _atan2(ys0, xs0);
  const lonSun = _rev(vS + wS);
  const xs = rS * _cos(lonSun), ys = rS * _sin(lonSun);
  const Ls = _rev(wS + MS);

  // ケプラー解＋黄経（惑星共通）
  function planet(N, i, w, a, e, M) {
    N = _rev(N); w = _rev(w); M = _rev(M);
    let E = M + (180 / Math.PI) * e * _sin(M) * (1 + e * _cos(M));
    for (let k = 0; k < 3; k++) E = E - (E - (180 / Math.PI) * e * _sin(E) - M) / (1 - e * _cos(E));
    const xv = a * (_cos(E) - e), yv = a * Math.sqrt(1 - e * e) * _sin(E);
    const v = _rev(_atan2(yv, xv)), r = Math.sqrt(xv * xv + yv * yv);
    const xh = r * (_cos(N) * _cos(v + w) - _sin(N) * _sin(v + w) * _cos(i));
    const yh = r * (_sin(N) * _cos(v + w) + _cos(N) * _sin(v + w) * _cos(i));
    return { xh, yh, M, geoLon: _rev(_atan2(yh + ys, xh + xs)) };
  }

  // 月（地心）
  const Nm = _rev(125.1228 - 0.0529538083 * d), im = 5.1454, wm = _rev(318.0634 + 0.1643573223 * d);
  const am = 60.2666, em = 0.054900, Mm = _rev(115.3654 + 13.0649929509 * d);
  let Em = Mm + (180 / Math.PI) * em * _sin(Mm) * (1 + em * _cos(Mm));
  for (let k = 0; k < 3; k++) Em = Em - (Em - (180 / Math.PI) * em * _sin(Em) - Mm) / (1 - em * _cos(Em));
  const xm = am * (_cos(Em) - em), ym = am * Math.sqrt(1 - em * em) * _sin(Em);
  const vmo = _rev(_atan2(ym, xm)), rmo = Math.sqrt(xm * xm + ym * ym);
  const xhm = rmo * (_cos(Nm) * _cos(vmo + wm) - _sin(Nm) * _sin(vmo + wm) * _cos(im));
  const yhm = rmo * (_sin(Nm) * _cos(vmo + wm) + _cos(Nm) * _sin(vmo + wm) * _cos(im));
  let lonMoon = _rev(_atan2(yhm, xhm));
  const Lm = _rev(Nm + wm + Mm), Dm = _rev(Lm - Ls);
  lonMoon = _rev(lonMoon
    - 1.274 * _sin(Mm - 2 * Dm) + 0.658 * _sin(2 * Dm) - 0.186 * _sin(MS)
    - 0.059 * _sin(2 * Mm - 2 * Dm) - 0.057 * _sin(Mm - 2 * Dm + MS) + 0.053 * _sin(Mm + 2 * Dm)
    + 0.046 * _sin(2 * Dm - MS) + 0.041 * _sin(Mm - MS) - 0.035 * _sin(Dm)
    - 0.031 * _sin(Mm + MS) - 0.015 * _sin(2 * Lm - 2 * Nm - 2 * Dm) + 0.011 * _sin(Mm - 4 * Dm));

  const me = planet(48.3313 + 3.24587e-5 * d, 7.0047 + 5.00e-8 * d, 29.1241 + 1.01444e-5 * d, 0.387098, 0.205635 + 5.59e-10 * d, 168.6562 + 4.0923344368 * d);
  const ve = planet(76.6799 + 2.46590e-5 * d, 3.3946 + 2.75e-8 * d, 54.8910 + 1.38374e-5 * d, 0.723330, 0.006773 - 1.302e-9 * d, 48.0052 + 1.6021302244 * d);
  const ma = planet(49.5574 + 2.11081e-5 * d, 1.8497 - 1.78e-8 * d, 286.5016 + 2.92961e-5 * d, 1.523688, 0.093405 + 2.516e-9 * d, 18.6021 + 0.5240207766 * d);
  const ju = planet(100.4542 + 2.76854e-5 * d, 1.3030 - 1.557e-7 * d, 273.8777 + 1.64505e-5 * d, 5.20256, 0.048498 + 4.469e-9 * d, 19.8950 + 0.0830853001 * d);
  const sa = planet(113.6634 + 2.38980e-5 * d, 2.4886 - 1.081e-7 * d, 339.3939 + 2.97661e-5 * d, 9.55475, 0.055546 - 9.499e-9 * d, 316.9670 + 0.0334442282 * d);
  // 木星・土星の主要摂動（黄経・近似）
  const Mj = ju.M, Msa = sa.M;
  const lonJup = _rev(ju.geoLon - 0.332 * _sin(2 * Mj - 5 * Msa - 67.6) - 0.056 * _sin(2 * Mj - 2 * Msa + 21)
    + 0.042 * _sin(3 * Mj - 5 * Msa + 21) - 0.036 * _sin(Mj - 2 * Msa) + 0.022 * _cos(Mj - Msa));
  const lonSat = _rev(sa.geoLon + 0.812 * _sin(2 * Mj - 5 * Msa - 67.6) - 0.229 * _cos(2 * Mj - 4 * Msa - 2)
    + 0.119 * _sin(Mj - 2 * Msa - 3) + 0.046 * _sin(2 * Mj - 6 * Msa - 69) + 0.014 * _sin(Mj - 3 * Msa + 32));

  // 上昇宮（出生時間＋出生地が必要）
  let ascSign = null;
  if (Number.isFinite(hour) && coords) {
    const GMST = _rev(280.46061837 + 360.98564736629 * (d - 1.5));
    const LST = _rev(GMST + coords[1]); // 東経を加算
    let asc = _rev(_atan2(_cos(LST), -(_sin(LST) * _cos(ecl) + _tan(coords[0]) * _sin(ecl))));
    ascSign = signIndex(asc);
  }

  const sign = (lon) => signIndex(lon);
  return {
    sun: sign(lonSun), moon: sign(lonMoon), asc: ascSign,
    mercury: sign(me.geoLon), venus: sign(ve.geoLon), mars: sign(ma.geoLon),
    jupiter: sign(lonJup), saturn: sign(lonSat),
  };
}

// 九星気学：本命星（1〜9）。立春前(〜2/3)は前年扱い。
function nineStar(year, month, day) {
  let y = Number(year);
  if (Number(month) < 2 || (Number(month) === 2 && Number(day) <= 3)) y -= 1;
  let s = y; while (s > 9) s = String(s).split("").reduce((a, c) => a + Number(c), 0);
  let r = 11 - s; if (r > 9) r -= 9; if (r <= 0) r += 9;
  return r;
}
const NINESTAR_JP = { 1: "一白水星", 2: "二黒土星", 3: "三碧木星", 4: "四緑木星", 5: "五黄土星", 6: "六白金星", 7: "七赤金星", 8: "八白土星", 9: "九紫火星" };

// ----- 出生図 → 5コア マッピング -----
const SUN_CORE = { fire: { L: 3 }, earth: { C: 3 }, air: { S: 2, L: 1 }, water: { D: 2, B: 1 } };
const MOON_CORE = { fire: { L: 1, S: 1 }, earth: { B: 2 }, air: { S: 1, L: 1 }, water: { D: 2, B: 1 } };
const ASC_CORE = { fire: { L: 2 }, earth: { C: 2 }, air: { S: 1, L: 1 }, water: { D: 1, B: 1 } };
const PLANET_CORE = {
  mercury: { S: 1, L: 1 }, venus: { B: 1, L: 1 }, mars: { C: 1, S: 1 }, jupiter: { D: 1, L: 1 }, saturn: { C: 2 },
};
const BALANCE_CORE = { fire: "L", earth: "C", air: "S", water: "D" };
const NINESTAR_CORES = {
  1: { D: 1 }, 2: { B: 1 }, 3: { S: 1 }, 4: { S: 1, B: 1 }, 5: { C: 1 },
  6: { C: 1 }, 7: { L: 1 }, 8: { C: 1, B: 1 }, 9: { L: 1 },
};

// 称号（上位2コア／アルファベット順キー）と魂の使命
const SOUL_TITLES = {
  BC: { jp: "守り導く者", en: "The Steadfast Guardian", mjp: "人を支え、安心できる場をつくり、確かな道へ導くこと。", men: "To protect, steady others, and guide them toward solid ground." },
  BD: { jp: "癒やしの賢者", en: "The Gentle Healer", mjp: "深い理解とやさしさで、人の心を癒やし整えること。", men: "To bring deep understanding and gentleness that heals." },
  BL: { jp: "心をつなぐ伝え手", en: "The Warm Connector", mjp: "あたたかい言葉で人と人をつなぎ、輪を広げること。", men: "To connect people with warmth and widen the circle." },
  BS: { jp: "自由な調停者", en: "The Free Harmonizer", mjp: "軽やかに動きながら、対立をほどき調和を生むこと。", men: "To move freely and turn discord into harmony." },
  CD: { jp: "真理の探究者", en: "The Resolute Seeker", mjp: "ぶれない意志で本質を掘り下げ、真理に迫ること。", men: "To dig for the essence with unshakable will." },
  CL: { jp: "旗を立てる者", en: "The Bold Pioneer", mjp: "強い意志と発信力で、新しい道に旗を立てること。", men: "To plant a flag on new ground with bold conviction." },
  CS: { jp: "道を切り拓く者", en: "The Trailblazer", mjp: "自由な発想と決断力で、まだない道を切り拓くこと。", men: "To blaze trails where no path yet exists." },
  DL: { jp: "叡智を灯す者", en: "The Illuminating Sage", mjp: "深く探究して掴んだ本質を、人に照らし、伝え、分かち合うこと。", men: "To explore the depths, then illuminate and share what you find." },
  DS: { jp: "知の冒険者", en: "The Curious Explorer", mjp: "自由な好奇心で知を旅し、新しい問いを発見すること。", men: "To roam through knowledge and discover new questions." },
  LS: { jp: "風の表現者", en: "The Vivid Voice", mjp: "自由な感性を、いきいきとした表現で世界に放つこと。", men: "To turn free sensibility into vivid expression for the world." },
};

function computeCores(c) {
  const cores = { L: 0, D: 0, S: 0, B: 0, C: 0 };
  const add = (t) => { if (t) for (const k in t) cores[k] += t[k]; };
  // 東洋：数秘・五行・十二支・方位・九星
  add(SOULNUM_CORES[c.soulNumber]);
  add(SOULNUM_CORES[c.lifeNumber]);
  add(ELEMENT_CORES[c.element]);
  add(ZODIAC_CORES[c.timeCode]);
  add(DIR_CORES[c.earthPoint]);
  add(NINESTAR_CORES[c.nineStar]);
  // 西洋占星術：出生図（太陽・月・上昇宮・各惑星・エレメント分布）
  const ch = c.chart;
  if (ch) {
    add(SUN_CORE[signElement(ch.sun)]);
    add(MOON_CORE[signElement(ch.moon)]);
    if (ch.asc != null) add(ASC_CORE[signElement(ch.asc)]);
    for (const p of ["mercury", "venus", "mars", "jupiter", "saturn"]) {
      add(PLANET_CORE[p]);
      add({ [BALANCE_CORE[signElement(ch[p])]]: 0.5 });
    }
    const counts = { fire: 0, earth: 0, air: 0, water: 0 };
    for (const p of ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]) counts[signElement(ch[p])]++;
    if (ch.asc != null) counts[signElement(ch.asc)]++;
    for (const el in counts) if (counts[el] >= 3) add({ [BALANCE_CORE[el]]: counts[el] - 2 });
  } else {
    add(SUNELEM_CORES[sunElement(c.birthMonth, c.birthDay)]);
  }
  const vals = Object.values(cores);
  const mx = Math.max(...vals), mn = Math.min(...vals);
  const scores = {};
  for (const k in cores) scores[k] = mx === mn ? 70 : Math.round(40 + 55 * (cores[k] - mn) / (mx - mn));
  return scores;
}
function coreCodeFrom(scores) {
  return Object.entries(scores).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}${Math.floor(v / 10)}`).join("·");
}
function resolveTitle(scores) {
  const key = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 2).map((e) => e[0]).sort().join("");
  return SOUL_TITLES[key] || { jp: "唯一無二の探究者", en: "The Original", mjp: "あなただけの道を見つけ、歩んでいくこと。", men: "To find and walk a path that is yours alone." };
}

function createSoulProfile(payload) {
  const source = [
    payload.name,
    payload.birthYear.padStart(4, "0"),
    payload.birthMonth.padStart(2, "0"),
    payload.birthDay.padStart(2, "0"),
    payload.unknownTime ? "unknown" : payload.birthTime,
    payload.birthPlace,
  ].join("|");
  const hash = stableHash(source);
  const index = hash % logicConfig.soulTypes.length;
  const second = Math.floor(hash / 7) % logicConfig.soulKeywords.length;
  const third = Math.floor(hash / 17) % logicConfig.missionSeeds.length;

  // 本物の5コードを算出
  const soulNumber = calcSoulNumber(payload.name);
  const lifeNumber = calcLifeNumber(payload.birthYear, payload.birthMonth, payload.birthDay);
  const element = calcElement(payload.birthYear);
  const timeCode = calcTimeCode(payload.birthTime, payload.unknownTime);
  const earthPoint = calcEarthPoint(payload.birthPlace);
  // 西洋占星術の出生図＋九星気学
  const hourNum = payload.unknownTime || !payload.birthTime
    ? null
    : Number(String(payload.birthTime).split(":")[0]) + Number(String(payload.birthTime).split(":")[1] || 0) / 60;
  const chart = natalChart(
    Number(payload.birthYear), Number(payload.birthMonth), Number(payload.birthDay),
    hourNum, placeCoords(payload.birthPlace),
  );
  const nineStarNo = nineStar(payload.birthYear, payload.birthMonth, payload.birthDay);

  // 源泉を統合した「5つのソウルコア」スコア → 固有コード・称号・魂の使命
  const coreScores = computeCores({
    soulNumber, lifeNumber, element, timeCode, earthPoint,
    birthMonth: payload.birthMonth, birthDay: payload.birthDay,
    chart, nineStar: nineStarNo,
  });
  const code = coreCodeFrom(coreScores); // 例：L9·D7·S5·C5·B4
  const title = resolveTitle(coreScores); // {jp,en,mjp,men}
  // 裏側の源泉コード（参考・内部用）
  const zodiacNum = calcZodiacNum(payload.birthTime, payload.unknownTime);
  const sourceCode =
    `${soulNumber}${lifeNumber}·${ELEMENT_SYMBOL[element] || "?"}` +
    `·${DIR_CODE[earthPoint] || "?"}` + (zodiacNum ? `·${zodiacNum}` : "");

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `sc-${Date.now()}`,
    name: payload.name,
    birthDate: `${payload.birthYear.padStart(4, "0")}-${payload.birthMonth.padStart(2, "0")}-${payload.birthDay.padStart(2, "0")}`,
    birthTime: payload.unknownTime ? "わからない" : payload.birthTime,
    birthPlace: payload.birthPlace,
    soulNumber,
    lifeNumber,
    element,
    timeCode,
    earthPoint,
    soulCode: code,
    coreScores,
    sourceCode,
    chart,
    nineStarNo,
    soulTitle: title.jp,
    soulTitleEn: title.en,
    soulMission: title.mjp,
    soulMissionEn: title.men,
    soulType: logicConfig.soulTypes[index],
    soulKeyword: logicConfig.soulKeywords[second],
    essenceKeyword: logicConfig.essenceKeywords[(index + third) % logicConfig.essenceKeywords.length],
    missionSeed: logicConfig.missionSeeds[third],
    strengthHint: logicConfig.strengthHints[(second + third) % logicConfig.strengthHints.length],
    message: logicConfig.messages[(index + second + third) % logicConfig.messages.length],
    issuedAt: new Date().toISOString(),
  };
}

function stableHash(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function formatSoulCode(hash, source) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const extra = stableHash(source.split("").reverse().join(""));
  const num = String(hash % 10000).padStart(4, "0");
  const blockA = `${letters[hash % letters.length]}${letters[Math.floor(hash / 23) % letters.length]}${String(extra % 100).padStart(2, "0")}`;
  const blockB = `${letters[Math.floor(extra / 11) % letters.length]}${letters[Math.floor(extra / 47) % letters.length]}${String(Math.floor(hash / 97) % 100).padStart(2, "0")}`;
  return `SC-${num}-${blockA}-${blockB}`;
}

function startGeneration() {
  showScreen("generating");
  const bar = document.querySelector("#progress-bar");
  const steps = [...document.querySelectorAll("#generation-steps li")];
  bar.style.width = "0%";
  steps.forEach((step, index) => step.classList.toggle("is-lit", index === 0));

  const checkpoints = [
    { width: "34%", step: 0, delay: 180 },
    { width: "68%", step: 1, delay: 820 },
    { width: "100%", step: 2, delay: 1460 },
  ];

  checkpoints.forEach((checkpoint) => {
    window.setTimeout(() => {
      bar.style.width = checkpoint.width;
      steps.forEach((step, index) => step.classList.toggle("is-lit", index <= checkpoint.step));
    }, checkpoint.delay);
  });

  window.setTimeout(() => {
    showScreen("award");
  }, 2100);
}

const screenHistory = [];
function showScreen(id, isBack) {
  const current = screens.find((s) => s.classList.contains("is-active"));
  const currentId = current ? current.dataset.screen : null;
  if (!isBack && currentId && currentId !== id) {
    screenHistory.push(currentId);
  }
  screens.forEach((screen) => screen.classList.toggle("is-active", screen.dataset.screen === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
  updateBackVisibility();
}
function goBack() {
  const prev = screenHistory.pop();
  showScreen(prev || "home", true);
}

// 「戻る」ボタンを画面左下に1つ固定（home・生成中は非表示）
var backBtnEl = null;
function addBackButtons() {
  backBtnEl = document.createElement("button");
  backBtnEl.type = "button";
  backBtnEl.className = "back-action back-fixed";
  backBtnEl.setAttribute("data-back", "");
  backBtnEl.textContent = "← 戻る";
  document.body.appendChild(backBtnEl);
  updateBackVisibility();
}
function updateBackVisibility() {
  const btn = document.querySelector(".back-fixed");
  if (!btn) return;
  const cur = document.querySelector("[data-screen].is-active");
  const id = cur ? cur.getAttribute("data-screen") : null;
  const hide = !id || id === "home" || id === "generating";
  btn.style.display = hide ? "none" : "inline-flex";
}

function requireProfile() {
  if (activeProfile) return true;
  showScreen("form");
  showToast("Soul Codeを生成すると、この機能を使えます。");
  return false;
}

function updateProfileViews() {
  const profile = activeProfile;
  if (!profile) return;

  setText("#award-code", profile.soulCode);
  setText("#gift-code", profile.soulCode);
  setText("#gift-title-en", profile.soulTitleEn);
  setText("#gift-title-jp", profile.soulTitle);
  setText("#gift-mission", profile.soulMission);
  setText("#gift-mission-en", profile.soulMissionEn);
  const giftCores = document.querySelector("#gift-cores");
  if (giftCores && profile.coreScores) giftCores.innerHTML = renderCores(profile.coreScores);
  const giftPractical = document.querySelector("#gift-practical");
  if (giftPractical) giftPractical.innerHTML = renderPractical(profile);
  const fullBody = document.querySelector("#fullreading-body");
  if (fullBody) fullBody.innerHTML = renderFullReading(profile);
  // 占星術（出生図）は裏で算出してコアに反映するのみ。表には出さない。

  setText("#passport-name", profile.name);
  setText("#passport-code", profile.soulCode);
  setText("#passport-type", profile.soulTitle);
  setText("#passport-keyword", `${profile.soulTitleEn}`);
  setText("#passport-mission", profile.soulMission);
  setText("#passport-issued", `Issued ${formatDate(profile.issuedAt)}`);
}

// 5コアのバー表示を組み立てる
const CORE_INFO = {
  L: ["LUMEN", "自分を表現し、人に伝え、照らす力"],
  D: ["DEEP", "深く探究し、本質を見抜く力"],
  S: ["SOAR", "自由に発想し、知性で軽やかに動く力"],
  B: ["BOND", "人と調和し、共感でつなぐ力"],
  C: ["CORE", "意志を貫き、決断して形にする力"],
};
function renderCores(scores) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => {
      const info = CORE_INFO[k];
      if (!info) return "";
      const [en, desc] = info;
      return `<div class="core-row"><span class="core-badge">${k}</span>` +
        `<span class="core-name">${en} <small>${desc}</small></span>` +
        `<span class="core-track"><span class="core-fill" style="width:${v}%"></span></span>` +
        `<span class="core-val">${v}</span></div>`;
    })
    .join("");
}

// ===== 実用カテゴリー（元素・5コアから自動生成）=====
const ELEMENT_LUCK = {
  金: { color: "白・ゴールド・シルバー", stone: "水晶・ホワイトトパーズ", day: "金曜日" },
  木: { color: "緑・若草色", stone: "翡翠・アベンチュリン", day: "木曜日" },
  火: { color: "赤・朱色", stone: "ガーネット・カーネリアン", day: "火曜日" },
  土: { color: "黄・テラコッタ", stone: "タイガーアイ・シトリン", day: "土曜日" },
  水: { color: "青・深い藍", stone: "ラピスラズリ・アクアマリン", day: "水曜日" },
};
const CORE_JOBS = {
  L: ["表現・発信", "講師・スピーカー", "クリエイティブ"],
  D: ["研究・分析", "専門職・士業", "ライター・編集"],
  S: ["企画・起業", "コンサル", "新規開拓"],
  B: ["教育・育成", "対人ケア", "コミュニティ運営"],
  C: ["リーダー・経営", "職人・技術", "プロジェクト推進"],
};
const CORE_WORD = { L: "表現", D: "探究", S: "自由", B: "調和", C: "意志" };
function practicalFor(p) {
  const el = ELEMENT_LUCK[p.element] || ELEMENT_LUCK["金"];
  const top = Object.entries(p.coreScores || {}).sort((a, b) => b[1] - a[1]).map((e) => e[0]);
  const jobs = [...new Set([...(CORE_JOBS[top[0]] || []).slice(0, 2), ...(CORE_JOBS[top[1]] || []).slice(0, 2)])];
  return { color: el.color, stone: el.stone, day: el.day, jobs, keywords: top.slice(0, 3).map((k) => CORE_WORD[k]) };
}
// 金色の宇宙的アイコン（SVGライン）
const GI = {
  color: `<svg class="gi" viewBox="0 0 24 24"><path d="M12 3c3.5 4.5 5.5 7.6 5.5 10.6a5.5 5.5 0 0 1-11 0C6.5 10.6 8.5 7.5 12 3z"/></svg>`,
  stone: `<svg class="gi" viewBox="0 0 24 24"><path d="M7 4h10l3.5 5.5L12 20.5 3.5 9.5z"/><path d="M3.5 9.5h17M12 4 9 9.5l3 11 3-11z"/></svg>`,
  day: `<svg class="gi" viewBox="0 0 24 24"><path d="M17.5 3.5a8 8 0 1 0 3.6 12.8A7 7 0 0 1 17.5 3.5z"/><path d="M20 6.3l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5L17.4 8l1.5-.6z" fill="#e7d49a" stroke="none"/></svg>`,
  field: `<svg class="gi" viewBox="0 0 24 24"><path d="M12 2l2.1 6.5H21l-5.5 4 2.1 6.6L12 15.4 6.4 19.1l2.1-6.6L3 8.5h6.9z"/></svg>`,
  key: `<svg class="gi" viewBox="0 0 24 24"><circle cx="8.5" cy="8.5" r="4.3"/><path d="M11.5 11.5l8.5 8.5M16.5 16.5l2.2-2.2M18.7 18.7l2-2"/></svg>`,
};
function renderPractical(p) {
  const pr = practicalFor(p);
  const item = (ic, label, val) =>
    `<div class="pc"><span class="pc-ic">${ic}</span><span class="pc-l">${label}</span><span class="pc-v">${val}</span></div>`;
  return item(GI.color, "ラッキーカラー", pr.color) +
    item(GI.field, "向いている分野", pr.jobs.join("・")) +
    item(GI.stone, "パワーストーン", pr.stone) +
    item(GI.day, "ラッキーデー", pr.day) +
    item(GI.key, "キーワード", pr.keywords.join("・"));
}

// ===== 完全版鑑定書（入力した人ごとに自動生成）=====
const CORE_DEEP = {
  L: "あなたは、自分の内側にあるものを表現し、人に伝え、照らす力を持っています。言葉や空気感で人を惹きつけ、場を明るくできる人。あなたが声を上げると、まわりに光が広がります。",
  D: "あなたは、表面で満足せず本質まで深く潜っていく力を持っています。静かに考え、観察し、真理を見抜く洞察力。あなたの深さは、人に大切な気づきを与えます。",
  S: "あなたは、自由に発想し、軽やかに動きながら知性を働かせる力を持っています。好奇心が広く、枠を越えて新しい視点を取り込める人。あなたの自由さが、新しい風を生みます。",
  B: "あなたは、人と調和し、共感でつなぐ力を持っています。相手の気持ちを汲み、場をやわらげ、信頼の輪を育てられる人。あなたのそばは、安心できる場所になります。",
  C: "あなたは、意志を貫き、決断して形にする力を持っています。ぶれない芯と実行力で、思いを現実に変えられる人。あなたの決断が、物事を前へ進めます。",
};
const CORE_FULLNAME = { L: "LUMEN（表現と発信）", D: "DEEP（探究と洞察）", S: "SOAR（自由と知性）", B: "BOND（調和と共感）", C: "CORE（意志と決断）" };
const CORE_WORK = {
  L: "あなたは「伝える・表現する」仕事で輝きます。話す・書く・発信する場面であなたの魅力が最大化し、人の心を動かせます。",
  D: "あなたは「深く探究する」仕事で力を発揮します。専門性を磨き、本質を見抜く役割が天職。学べば学ぶほど価値が増していきます。",
  S: "あなたは「自由に動き、企てる」仕事が向いています。新しいことの立ち上げや変化のある環境で、いきいきと才能を発揮します。",
  B: "あなたは「人を支え、つなぐ」仕事で深く信頼されます。チームや場を整え、人を育てる役割で大きな価値を生みます。",
  C: "あなたは「決めて、やり遂げる」仕事で頼られます。責任ある立場や、形にして完成させる役割があなたを輝かせます。",
};
const CORE_LOVE = {
  L: "恋愛では、素直に気持ちを表現することで関係が深まります。あなたの明るさが相手を照らし、一緒にいると元気になれる存在に。",
  D: "恋愛では、心の奥まで理解し合えるパートナーと結ばれると安心します。深く静かな信頼を、時間をかけて育てていけます。",
  S: "恋愛では、お互いの自由を尊重できる関係が心地よい。束縛より、一緒に新しい世界を冒険できる相手と長続きします。",
  B: "恋愛では、思いやりと共感であたたかい関係を築けます。安心できるやわらかな愛情で、相手をやさしく包みます。",
  C: "恋愛では、誠実さと一途さが魅力。決めた人を大切にし、揺るがない信頼の絆を築いていけます。",
};
const CORE_MONEY = {
  L: "お金は「発信・表現」から巡ってきます。あなたの言葉や作品、人を惹きつける力が、そのまま豊かさに変わっていきます。",
  D: "お金は「専門性・深い知識」から生まれます。一つの分野を極めることが、長く続く豊かさの源になります。",
  S: "お金は「自由な発想・新しい挑戦」から流れてきます。動き、試すほどに、思いがけないチャンスが広がります。",
  B: "お金は「人とのつながり・信頼」から育ちます。人を大切にする姿勢が、巡り巡ってあなたを豊かにします。",
  C: "お金は「継続・着実な積み上げ」から築かれます。決めたことをやり切る力が、確かな財を成していきます。",
};
const CORE_RELATION = {
  L: "あなたは、その明るさと表現力で人を惹きつけ、場を温める存在。あなたがいるだけで、まわりが前向きになります。",
  D: "あなたは、深い理解力で人の本音を受け止められる人。表面的でない、本物のつながりを大切にします。",
  S: "あなたは、軽やかさと好奇心で人と人をつなぐ人。さまざまなタイプと自由にわたり合える社交性があります。",
  B: "あなたは、共感と思いやりで信頼の輪を育てる人。あなたのそばは、みんなが安心できる居場所になります。",
  C: "あなたは、誠実さと頼りがいで信頼される人。いざという時に頼れる、芯のある存在として慕われます。",
};
const CORE_GROWTH = {
  L: "ときに「伝える」より「聴く」ことを意識すると、あなたの光はさらに深く、遠くまで届きます。",
  D: "深く潜って得た気づきを「外へ開いて分かち合う」ことで、あなたの世界も人の世界も広がります。",
  S: "自由を愛するあなたは、「一つに絞って続ける」とき、その才能が大きく実を結びます。",
  B: "人を大切にするあまり後回しにしがちな「自分の声」も大事に。あなたが満たされてこそ、与えられます。",
  C: "強い意志に「ゆるめる勇気・人に任せる余白」が加わると、もっと軽やかに遠くへ進めます。",
};
function renderFullReading(p) {
  const sorted = Object.entries(p.coreScores || {}).sort((a, b) => b[1] - a[1]);
  const pr = practicalFor(p);
  const t1 = sorted[0][0], t2 = sorted[1][0];
  const coresHtml = sorted.map(([k, v]) => {
    const lvl = v >= 75 ? "特に強く" : v >= 55 ? "しっかりと" : "穏やかに";
    return `<div class="fr-core"><h4>${CORE_FULLNAME[k]}<span>${v}</span></h4>` +
      `<p>${CORE_DEEP[k]}<br><b>あなたの中では「${CORE_WORD[k]}」の力が${lvl}あらわれています。</b></p></div>`;
  }).join("");
  let n = 0;
  const para = (t) => `<p class="fr-p">${t}</p>`;
  const sec = (title, body) => {
    n++;
    return `<section class="fr-sec"><div class="fr-sech"><span class="fr-num">${String(n).padStart(2, "0")}</span><h3>${title}</h3></div><div class="fr-secbody">${body}</div></section>`;
  };
  return `<div class="fr-doc">` +
    sec("はじめに", para(`この鑑定書は、あなたの「名前・生年月日・出生時間・出生地」という4つの事実を入り口に、数千年の古代の叡智と最新の分析学を重ね合わせて読み解いた、あなただけの記録です。`) +
      para(`あなたのソウルコードは <b>${p.soulCode}</b>。同じ並びを持つ人は、世界にあなたしか存在しません。これは"占い"ではなく、あなたの傾向をデータから描き出した「魂の設計図」です。`)) +
    sec("ソウルコードとは", para(`ソウルコードは、人の魂を5つの根源の力でとらえます。<b>L（表現）・D（探究）・S（自由と知性）・B（調和）・C（意志）</b>。この5つのバランスが、あなたという唯一無二の模様を描きます。数値が高い力ほど、あなたらしさとして強くあらわれます。`)) +
    sec("あなたを動かす5つの力", coresHtml) +
    sec("コードが描く、あなたの輪郭", para(`あなたの中で最も強いのは「<b>${CORE_WORD[t1]}</b>」、次に「<b>${CORE_WORD[t2]}</b>」。この2つが組み合わさり、あなたは"${CORE_WORD[t1]}を軸に動き、${CORE_WORD[t2]}で形にしていく人"という個性を持ちます。これが、あなたの行動の源です。`)) +
    sec("才能と仕事", para(CORE_WORK[t1]) + para(`そこに「${CORE_WORD[t2]}」の力が加わると、あなたの仕事はより立体的になります。向いている分野は <b>${pr.jobs.join("・")}</b>。`)) +
    sec("人間関係", para(CORE_RELATION[t1]) + para(`タイプの違う人とは、少し歩幅を合わせる意識を持つと、より深く長くつながれます。`)) +
    sec("恋愛・パートナーシップ", para(CORE_LOVE[t1])) +
    sec("お金・豊かさとの付き合い方", para(CORE_MONEY[t1])) +
    sec("人生のテーマと成長", para(`あなたの人生のテーマは「<b>${CORE_WORD[t1]}</b>」を生き切ること。`) + para(CORE_GROWTH[t1])) +
    sec("これからの過ごし方", para(`完璧を待たず、いちばん自由でいられる選択を。あなたが一歩動くたびに道はできていきます。その歩みは、いつか誰かの希望になります。`)) +
    sec("開運ガイド", `<div class="fr-practical">${renderPractical(p)}</div>`) +
    `<div class="fr-mission"><p class="fr-ml">YOUR SOUL MISSION ・ あなたの魂の使命</p><p class="fr-mission-jp">${p.soulMission || ""}</p><p class="fr-mission-en">${p.soulMissionEn || ""}</p></div>` +
    `<div class="fr-msg">あなたは「たまたま」生まれたのではありません。<br>名前も、生まれた日も、時間も、場所も——すべてが重なって、世界にひとつだけのコードになりました。<span class="fr-msg-big">あなたは、かけがえのない大切な存在です。</span></div>` +
    `<p class="fr-end">✦　Soul Code 分析　|　ソウルコードリサーチャー Fumiyo Sorakubo　✦</p>` +
    `</div>`;
}

// 出生図（構成要素）の補助表示
function renderChart(p) {
  if (!p.chart) return "";
  const c = p.chart;
  const sgn = (i) => (i == null ? "—" : `${SIGN_JP[i]}座 <small>${SIGN_EN[i]}</small>`);
  const row = (jp, en, i) =>
    `<div class="chart-row"><span class="chart-k">${jp} <small>${en}</small></span><span class="chart-v">${sgn(i)}</span></div>`;
  let html = row("太陽", "Sun", c.sun) + row("月", "Moon", c.moon) + row("上昇宮", "Ascendant", c.asc);
  const pl = [["水星", c.mercury], ["金星", c.venus], ["火星", c.mars], ["木星", c.jupiter], ["土星", c.saturn]];
  html += `<div class="chart-planets">${pl.map(([j, i]) => `<span>${j}${SIGN_JP[i]}</span>`).join("")}</div>`;
  if (p.nineStarNo) html += row("九星", "Nine Star", null).replace("—", NINESTAR_JP[p.nineStarNo]);
  return html;
}

function applyCopy() {
  const heroLead = document.querySelector(".hero-lead");
  const awardMessage = document.querySelector(".award-message");
  if (heroLead) heroLead.textContent = copyConfig.main;
  if (awardMessage) awardMessage.textContent = copyConfig.award;
}

function hydrateAdmin() {
  document.querySelector("#logic-config").value = JSON.stringify(logicConfig, null, 2);
  document.querySelector("#admin-main-copy").value = copyConfig.main;
  document.querySelector("#admin-award-copy").value = copyConfig.award;
  document.querySelector("#sns-template").value = templates[document.querySelector("#sns-category").value] || "";
}

function renderTables() {
  const records = loadJson(STORAGE_KEYS.records, []);
  const usersTable = document.querySelector("#users-table");
  const codesTable = document.querySelector("#codes-table");
  usersTable.innerHTML = records
    .map(
      (record) => `
        <tr>
          <td>${escapeHtml(record.name)}</td>
          <td>${escapeHtml(record.birthDate)}</td>
          <td>${escapeHtml(record.birthPlace)}</td>
          <td>${escapeHtml(formatDate(record.issuedAt))}</td>
        </tr>
      `,
    )
    .join("");

  codesTable.innerHTML = records
    .map(
      (record) => `
        <tr>
          <td>${escapeHtml(record.soulCode)}</td>
          <td>${escapeHtml(record.soulType)}</td>
          <td>${escapeHtml(record.soulKeyword)}</td>
          <td>${escapeHtml(record.missionSeed)}</td>
        </tr>
      `,
    )
    .join("");
}

function appendRecord(profile) {
  const records = loadJson(STORAGE_KEYS.records, []);
  const deduped = records.filter((record) => record.soulCode !== profile.soulCode);
  deduped.unshift(profile);
  saveJson(STORAGE_KEYS.records, deduped.slice(0, 200));
}

async function downloadPassportImage(profile) {
  const canvas = document.querySelector("#passport-canvas");
  const context = canvas.getContext("2d");
  const image = await loadImage("./assets/soul-passport-bg.png");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(6, 17, 31, 0.58)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(240, 217, 149, 0.74)";
  context.lineWidth = 3;
  context.strokeRect(64, 64, canvas.width - 128, canvas.height - 128);
  context.strokeStyle = "rgba(240, 217, 149, 0.42)";
  context.strokeRect(92, 92, canvas.width - 184, canvas.height - 184);

  drawCanvasText(context, "Soul Code Passport", 128, 150, {
    size: 34,
    color: "#f0d995",
    family: "Georgia, serif",
  });
  drawCanvasText(context, `Issued ${formatDate(profile.issuedAt)}`, 1180, 150, {
    size: 25,
    color: "rgba(255,255,255,0.76)",
  });
  drawCanvasText(context, "あなただけの魂の設計図", 128, 310, {
    size: 34,
    color: "#f0d995",
  });
  drawCanvasText(context, profile.name, 128, 395, {
    size: 74,
    color: "#ffffff",
    family: '"Hiragino Mincho ProN", serif',
  });
  drawCanvasText(context, profile.soulCode, 128, 485, {
    size: 58,
    color: "#f0d995",
    family: "Georgia, serif",
  });

  drawInfoBlock(context, "魂タイプ", profile.soulType, 128, 610, 380);
  drawInfoBlock(context, "魂のキーワード", profile.soulKeyword, 570, 610, 380);
  drawInfoBlock(context, "使命の種", profile.missionSeed, 1012, 610, 420);
  drawCanvasText(context, "Soul Code分析学 創設者 空久保章代", 1030, 875, {
    size: 26,
    color: "rgba(255,255,255,0.82)",
  });

  const link = document.createElement("a");
  link.download = `${profile.soulCode}-passport.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast("Soul Code Passport画像を保存しました。");
}

// 全角数字→半角に自動変換（生年月日の入力欄）。全角でも反応するようにする。
function toHalfWidthDigits(s) {
  return s
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^0-9]/g, "");
}
function bindNumericFields() {
  ["#birth-year", "#birth-month", "#birth-day"].forEach((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const fix = () => {
      const cleaned = toHalfWidthDigits(el.value);
      if (el.value !== cleaned) el.value = cleaned;
    };
    el.addEventListener("input", fix);
    el.addEventListener("blur", fix);
  });
}

// ===== 幸運のソウルコード：待ち受け画像（1080x1920）=====
function bindLuckyActions() {
  const saveBtn = document.querySelector("#save-lucky");
  const shareBtn = document.querySelector("#share-ig");
  if (saveBtn) saveBtn.addEventListener("click", () => {
    if (!requireProfile()) return;
    downloadLuckyWallpaper(activeProfile);
  });
  if (shareBtn) shareBtn.addEventListener("click", () => {
    if (!requireProfile()) return;
    shareLucky(activeProfile);
  });
}

function luckyText(ctx, text, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.weight || 400} ${o.size || 40}px ${o.family || '"Hiragino Kaku Gothic ProN",sans-serif'}`;
  ctx.textAlign = o.align || "center";
  ctx.textBaseline = "alphabetic";
  if (o.spacing && "letterSpacing" in ctx) ctx.letterSpacing = `${o.spacing}px`;
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowBlur || 22; }
  ctx.fillStyle = o.fill || o.color || "#ffffff";
  ctx.fillText(text, x, y);
  ctx.restore();
}

// 採用デザイン(assets/lucky-bg.png 852x1070)を背景に、本人の5コアを差し替えて描画
const LUCKY_BG = "./assets/lucky-bg.png?v=46";
// 5コアの配置（強い順：上→左上→右上→左下→右下）。元数字の中心に合わせて校正済み。
const LUCKY_POS = [[423, 279], [187, 458], [662, 458], [258, 690], [600, 690]];

async function renderLuckyCanvas(profile) {
  const canvas = document.querySelector("#lucky-canvas");
  const W = 852, H = 1070;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const bg = await loadImage(LUCKY_BG);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(bg, 0, 0, W, H);

  const cores = Object.entries(profile.coreScores || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  cores.forEach(([k, v], i) => {
    const [x, y] = LUCKY_POS[i] || [0, 0];
    // 元の数値をネイビーでマスク（数字を完全に覆う大きさ）
    const m = ctx.createRadialGradient(x, y, 0, x, y, 56);
    m.addColorStop(0, "#0d1a2c"); m.addColorStop(0.66, "#0d1a2c"); m.addColorStop(1, "rgba(13,26,44,0)");
    ctx.fillStyle = m; ctx.beginPath(); ctx.arc(x, y, 56, 0, 7); ctx.fill();
    // 本人のコアを金で描画
    const g = ctx.createLinearGradient(0, y - 26, 0, y + 26);
    g.addColorStop(0, "#fff3cf"); g.addColorStop(0.55, "#e7c873"); g.addColorStop(1, "#b9933f");
    ctx.font = '600 46px Georgia,"Times New Roman","Hiragino Mincho ProN",serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 8;
    ctx.fillStyle = g;
    const digit = Math.min(9, Math.floor(v / 10)); // コードと同じ1桁表記
    ctx.fillText(`${k}${digit}`, x, y + 2);
    ctx.shadowBlur = 0;
  });

  return canvas;
}

async function downloadLuckyWallpaper(profile) {
  const canvas = await renderLuckyCanvas(profile);
  const link = document.createElement("a");
  link.download = `${profile.soulCode}-lucky.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast("幸運のソウルコード画像を保存しました🌙 待ち受けに設定してね。");
}

const LUCKY_CAPTION = (code) =>
  `私の幸運のソウルコードは ${code} 🌙\n宇宙のエネルギーを受け取る、世界に一つだけの設計図。\nあなたも受け取ってみて✨ 感想も教えてね！\n#幸運のソウルコード #ソウルコード分析学 @sorakubo_mind`;

async function shareLucky(profile) {
  const canvas = await renderLuckyCanvas(profile);
  const caption = LUCKY_CAPTION(profile.soulCode);
  canvas.toBlob(async (blob) => {
    const file = new File([blob], `${profile.soulCode}-lucky.png`, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: caption });
        return;
      } catch { /* キャンセル時は何もしない */ }
    } else {
      // 非対応端末：画像を保存＋キャプションをコピー
      const link = document.createElement("a");
      link.download = `${profile.soulCode}-lucky.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      try { await navigator.clipboard.writeText(caption); } catch {}
      showToast("画像を保存し、キャプションをコピーしました🌙 Instagramに貼り付けて投稿してね。");
    }
  }, "image/png");
}

function drawInfoBlock(context, label, value, x, y, width) {
  context.fillStyle = "rgba(6, 17, 31, 0.62)";
  context.strokeStyle = "rgba(240, 217, 149, 0.42)";
  context.lineWidth = 2;
  context.fillRect(x, y, width, 160);
  context.strokeRect(x, y, width, 160);
  drawCanvasText(context, label, x + 24, y + 44, { size: 24, color: "#f0d995" });
  wrapCanvasText(context, value, x + 24, y + 92, width - 48, 31, {
    size: 27,
    color: "#ffffff",
  });
}

function drawCanvasText(context, text, x, y, options = {}) {
  context.font = `${options.weight || 400} ${options.size || 28}px ${options.family || '"Hiragino Kaku Gothic ProN", sans-serif'}`;
  context.fillStyle = options.color || "#ffffff";
  context.textBaseline = "alphabetic";
  context.fillText(text, x, y);
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight, options = {}) {
  context.font = `${options.weight || 400} ${options.size || 28}px ${options.family || '"Hiragino Kaku Gothic ProN", sans-serif'}`;
  context.fillStyle = options.color || "#ffffff";
  let line = "";
  let lineY = y;

  [...text].forEach((char) => {
    const testLine = line + char;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, lineY);
      line = char;
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  });

  if (line) context.fillText(line, x, lineY);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function createReportSeed(profile, product) {
  return {
    product,
    profile,
    sections: [
      "魂の本質",
      "才能",
      "強み",
      "人生テーマ",
      "使命",
      "人生課題",
      "人間関係傾向",
      "魂からのメッセージ",
      "仕事",
      "お金",
      "パートナーシップ",
      "子育て",
      "家族",
      "人生ステージ",
      "風の時代の生き方",
      "具体的行動アドバイス",
    ],
    pdf: {
      format: "A4",
      targetPages: "30-50",
      status: "foundation-ready",
    },
  };
}

function createMetaPayload(category, template, profile) {
  const safeProfile = profile || {
    soulCode: "SC-0000-AA00-AA00",
    soulKeyword: "唯一無二",
    missionSeed: "本来の自分を思い出すこと。",
  };

  return {
    provider: "Meta API",
    channels: ["instagram", "facebook"],
    category,
    message: template
      .replaceAll("{{SoulCode}}", safeProfile.soulCode)
      .replaceAll("{{魂のキーワード}}", safeProfile.soulKeyword)
      .replaceAll("{{使命の種}}", safeProfile.missionSeed),
    media: {
      type: "image",
      source: "Soul Code Passport生成画像または投稿用テンプレート画像",
    },
    publishMode: "queue",
  };
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function formatDate(iso) {
  const date = iso ? new Date(iso) : new Date();
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("/", ".");
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2800);
}
