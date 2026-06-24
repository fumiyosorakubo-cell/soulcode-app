# Instagram 自動投稿セットアップ手順（Meta API）

自動投稿を動かすには、**Meta側の設定（あなたの操作）**と、**スクリプトへの値の入力**が必要です。
ここはアカウント認証が絡むので私（Claude）が代行できません。順番にやれば30〜60分ほどで完了します。

---

## 前提：2つの「壁」

1. **アカウント条件** … Instagramを**プロアカウント**にして、**Facebookページ**と連携する必要があります。
2. **画像はネット上に置く必要がある** … APIは「公開URLの画像」しか投稿できません。
   → 既にお持ちのNetlify（`golden-raindrop-de63d0.netlify.app`）等に画像を置けばOK。

---

## STEP 1. Instagramをプロアカウントにする
1. Instagramアプリ → 設定 → アカウント → 「プロアカウントに切り替える」
2. 「ビジネス」または「クリエイター」を選択
3. 連携用の**Facebookページ**を作成 or 選択して紐づける
   （Facebookページが無ければ、facebook.com で無料で1つ作成）

## STEP 2. Meta開発者アプリを作る
1. https://developers.facebook.com/ にログイン
2. 「マイアプリ」→「アプリを作成」→ タイプ「ビジネス」
3. アプリ名を入力して作成（例: SoulCode Poster）

## STEP 3. 必要な権限でトークンを取得
1. 左メニュー →「ツール」→「Graph API エクスプローラ」
2. 右上で作成したアプリを選択
3. 「Add permissions」で次の権限にチェック：
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - `business_management`
4. 「Generate Access Token」→ Facebookログインで承認
   → ここで出る文字列が**短期トークン**（後で長期化します）

## STEP 4. Instagramビジネスアカウントの「数値ID」を調べる
Graph API エクスプローラのURL欄で順に実行：
1. `me/accounts` → あなたのFacebookページの `id` を確認
2. `{ページのid}?fields=instagram_business_account`
   → 返ってきた `instagram_business_account.id` が **IG_USER_ID** です。

## STEP 5. 短期トークンを「長期トークン」に変換
ブラウザのアドレスバーに以下を貼って実行（{}は置き換え）：
```
https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={アプリID}&client_secret={アプリのシークレット}&fb_exchange_token={STEP3の短期トークン}
```
- アプリID / シークレット … 開発者ダッシュボードの「設定 → ベーシック」
- 返ってきた `access_token` が **IG_ACCESS_TOKEN**（約60日有効）

---

## STEP 6. スクリプトに値を入れる
このフォルダで：
```bash
cp .env.example .env
```
`.env` を開いて記入：
```
IG_USER_ID=（STEP4の数値ID）
IG_ACCESS_TOKEN=（STEP5の長期トークン）
GRAPH_VERSION=v21.0
```

## STEP 7. テスト投稿してみる
画像を公開URLに置いてから：
```bash
# 1枚
node publish.mjs --caption-file caption.txt --image "https://あなたのサイト/test.jpg"

# カルーセル（複数枚）
node publish.mjs --caption-file caption.txt \
  --image "https://.../1.jpg" --image "https://.../2.jpg"
```
`✅ 投稿完了！` と出れば成功です。

---

## よくある注意点
- **トークンは約60日で失効** → 失効したらSTEP5をやり直し（自動更新も後で組めます）
- 画像は **JPEG/PNG・公開HTTPS** であること
- カルーセルは **最大10枚**
- `.env` は秘密情報なので **絶対に共有・公開しない**（.gitignore済み）
- 1日の投稿数にはAPI制限あり（通常25件/日）

---

## 私（Claude）が引き続きできること
- 取得した値を `.env` に入れる作業のサポート
- 投稿する画像（カルーセル）の生成
- caption.txt（本文＋ハッシュタグ）の用意 … 双子座新月分は作成済み
- トークン自動更新スクリプトの追加
