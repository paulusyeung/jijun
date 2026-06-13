# 應用程式簽署與 Play Store 上架

## 快速開始

### 1. 產生簽署金鑰（Release Keystore）

```bash
# 在 android/keystore/ 目錄下執行
keytool -genkey -v -keystore release.keystore \
  -alias easyaccounting \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

系統會詢問：
- 密碼（請妥善保管）
- 姓名（輸入你的名字或組織名稱）
- 組織單位與地點（可選）

### 2. 建立 keystore.properties

建立 `android/keystore.properties`（**不要提交到 Git**）：

```properties
storeFile=keystore/release.keystore
keyAlias=easyaccounting
keyPassword=你的金鑰密碼
storePassword=你的儲存庫密碼
```

### 3. 建置 Release AAB

```bash
cd android
./gradlew bundleRelease
```

AAB 檔案位置：`android/app/build/outputs/bundle/release/app-release.aab`

---

## Play App Signing（推薦）

Google Play 提供 **Play App Signing** 功能，讓 Google 管理你的應用程式簽署金鑰，你只需要上傳上傳金鑰（upload key）。

### 設定步驟

1. 在 Play Console → 建立應用程式 → 前往「應用程式完整性」
2. 選擇「使用 Play App Signing」
3. 上傳由上述 `keytool` 產生的金鑰憑證（可從 keystore 匯出）
4. Google 會產生並管理應用程式簽署金鑰

### 優點

- **安全**：即使上傳金鑰遺失，Google 仍可協助更換
- **自動**：Google 會自動為新安裝用戶簽署 APK
- **必要**：從 2021 年 8 月開始，Play Console 要求新應用程式使用 Play App Signing

### 備份金鑰

```bash
# 匯出金鑰憑證（備用）
keytool -export -rfc \
  -keystore release.keystore \
  -alias easyaccounting \
  -file upload_certificate.pem
```

**請將 `release.keystore` 和 `upload_certificate.pem` 備份到安全位置**（密碼管理器、加密雲端儲存等）。

---

## VersionCode 計算規則

使用語意化版本映射為整數：

```
versionCode = major * 1000000 + minor * 10000 + patch * 100 + build
```

### 範例

| 版本 | versionCode | 計算方式 |
|------|-------------|----------|
| 2.1.5.6 | 2010506 | 2*1000000 + 1*10000 + 5*100 + 6 |
| 2.1.5.7 | 2010507 | 2*1000000 + 1*10000 + 5*100 + 7 |
| 2.2.0.0 | 2020000 | 2*1000000 + 2*10000 + 0*100 + 0 |
| 3.0.0.0 | 3000000 | 3*1000000 + 0*10000 + 0*100 + 0 |

### 規則

- 每次上架新版本，versionCode 必須**單調遞增**
- 如果 versionName 降級（例如 2.2.0.0 → 2.1.5.6），versionCode 仍要**遞增**（例如 2020000 → 2020001）

---

## 上架前檢查清單

### Play Console 設定（非程式碼）

- [ ] 建立 Play Console 專案並設定應用程式列表
- [ ] 完成 IARC 內容分級問卷
- [ ] 準備應用程式列表素材（螢幕截圖、精選圖示、簡短/完整描述）
- [ ] 在 Play Console → 應用程式內容 → 隱私權政策，設定隱私權政策 URL
- [ ] 決定應用程式類別和聯絡電子郵件

### AdMob

- [ ] 將 `AndroidManifest.xml` 中的 AdMob App ID 替換為正式 ID
- [ ] 將 `package.json` → `adConfig.admobBannerId` 替換為正式橫幅廣告單元 ID
- [ ] 將 `package.json` → `adConfig.admobRewardedId` 替換為正式獎勵廣告單元 ID
- [ ] 確認 `package.json` → `adConfig.isTesting` 為 `false`

---

## 故障排除

### 建置失敗：`AAPT: error: resource color/colorPrimary not found.`

確保 `android/app/src/main/res/values/colors.xml` 存在，並包含 `colorPrimary`、`colorPrimaryDark`、`colorAccent`。

### Release APK 啟動時崩潰

可能是 ProGuard 過度混淆。嘗試：
1. 設定 `minifyEnabled false` 確認問題是否消失
2. 如果消失，在 `proguard-rules.pro` 添加對應的 keep 規則

### AdMob 廣告不顯示

- 使用測試 ID 確認 SDK 整合正確
- 確認 AdMob 帳戶已核准
- 檢查網路連線
