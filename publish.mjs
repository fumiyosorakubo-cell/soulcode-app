#!/usr/bin/env node
// publish.js — Instagram 自動投稿スクリプト（Meta Graph API / Content Publishing）
//
// 使い方:
//   1枚画像:
//     node publish.js --caption-file caption.txt --image "https://example.com/1.jpg"
//   カルーセル（複数枚, 最大10枚）:
//     node publish.js --caption-file caption.txt \
//       --image "https://.../1.jpg" --image "https://.../2.jpg" --image "https://.../3.jpg"
//   キャプションを直接渡す:
//     node publish.js --caption "本文..." --image "https://.../1.jpg"
//
// 必要な環境変数（.env または シェルで設定）:
//   IG_USER_ID        … Instagramビジネスアカウントの数値ID
//   IG_ACCESS_TOKEN   … 長期アクセストークン
//   GRAPH_VERSION     … 省略可（既定 v21.0）
//
// 注意: 画像は「公開HTTPSのURL」が必須です（APIがURLから画像を取得します）。
//       ローカルファイルは直接アップロードできません。

import { readFileSync } from "node:fs";

// ---- .env 読み込み（依存ライブラリなしの簡易パーサ）----
function loadEnv() {
  try {
    const text = readFileSync(new URL("./.env", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* .env が無くてもOK（環境変数で渡す場合）*/
  }
}
loadEnv();

const IG_USER_ID = process.env.IG_USER_ID;
const TOKEN = process.env.IG_ACCESS_TOKEN;
const VERSION = process.env.GRAPH_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${VERSION}`;

// ---- 引数パース ----
function parseArgs(argv) {
  const images = [];
  let caption = "";
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--image") images.push(argv[++i]);
    else if (a === "--caption") caption = argv[++i];
    else if (a === "--caption-file") caption = readFileSync(argv[++i], "utf8").trim();
    else throw new Error(`不明な引数: ${a}`);
  }
  return { images, caption };
}

async function graph(path, params, method = "POST") {
  const url = new URL(`${BASE}/${path}`);
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const res =
    method === "GET"
      ? await fetch(`${url}?${body}`)
      : await fetch(url, { method, body });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`Graph APIエラー: ${JSON.stringify(json.error || json)}`);
  }
  return json;
}

// コンテナが投稿可能になるまで待つ（推奨）
async function waitReady(creationId, tries = 15) {
  for (let i = 0; i < tries; i++) {
    const { status_code } = await graph(
      creationId,
      { fields: "status_code" },
      "GET"
    );
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR") throw new Error("メディア処理がエラーになりました");
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("メディア処理がタイムアウトしました");
}

async function main() {
  if (!IG_USER_ID || !TOKEN) {
    console.error("❌ IG_USER_ID と IG_ACCESS_TOKEN を .env に設定してください。");
    process.exit(1);
  }
  const { images, caption } = parseArgs(process.argv);
  if (images.length === 0) {
    console.error("❌ --image で画像URLを1つ以上指定してください。");
    process.exit(1);
  }

  let creationId;

  if (images.length === 1) {
    // --- 1枚画像 ---
    console.log("📦 メディアコンテナを作成中...");
    const r = await graph(`${IG_USER_ID}/media`, {
      image_url: images[0],
      caption,
    });
    creationId = r.id;
  } else {
    // --- カルーセル ---
    console.log(`📦 カルーセル ${images.length}枚 を作成中...`);
    const childIds = [];
    for (const [idx, img] of images.entries()) {
      const child = await graph(`${IG_USER_ID}/media`, {
        image_url: img,
        is_carousel_item: "true",
      });
      console.log(`  ✔ ${idx + 1}枚目 OK`);
      childIds.push(child.id);
    }
    const carousel = await graph(`${IG_USER_ID}/media`, {
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption,
    });
    creationId = carousel.id;
  }

  console.log("⏳ メディア処理の完了を待機中...");
  await waitReady(creationId);

  console.log("🚀 投稿を公開中...");
  const published = await graph(`${IG_USER_ID}/media_publish`, {
    creation_id: creationId,
  });

  console.log(`✅ 投稿完了！ media id: ${published.id}`);
}

main().catch((e) => {
  console.error(`\n❌ 失敗: ${e.message}`);
  process.exit(1);
});
