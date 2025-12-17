# IOTA Burn After Reading (加密閱後即焚 DApp)

這是一個基於 IOTA Move 智能合約與 Next.js 構建的去中心化隱私通訊應用程式 (DApp)。
本專案展示了 Move 語言獨特的 **資源銷毀 (Resource Destruction)** 機制，並結合前端 **AES 加密** 技術，實現真正的端對端隱私保護。

## ✨ 核心功能

* **🔒 端對端加密 (E2EE)**
    * 訊息在前端使用 **AES 演算法** 與 **使用者自訂密碼** 進行加密。
    * 區塊鏈上僅儲存加密後的亂碼 (Ciphertext)，即使透過區塊鏈瀏覽器查看原始數據也無法破解。
* **🔑 密碼保護機制**
    * 發送者需設定解密密碼。
    * 接收者必須輸入正確密碼才能在銷毀瞬間還原內容。
* **🔥 閱後即焚 (Burn)**
    * 接收者讀取訊息的同時，智能合約會強制銷毀該物件。
    * 物件被刪除後，鏈上狀態不再保留，且歷史交易紀錄僅剩無法解讀的亂碼。
* **🛡️ 穩健的事件處理**
    * 實作了雙重確認機制（Wallet Response + Client Polling），解決錢包可能未回傳 Event 的問題，確保銷毀後一定能讀取到訊息。

## 🛠️ 技術堆疊

- **Smart Contract**: IOTA Move (Object Capabilities, Event Emission)
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Blockchain Integration**: @iota/dapp-kit, @iota/iota-sdk
- **Cryptography**: crypto-js (AES Encryption)

## 🚀 運作流程

1.  **發送 (Encrypt & Send)**
    * 使用者輸入明文訊息與密碼。
    * 前端執行 `AES.encrypt(content, password)`。
    * 呼叫合約 `send_message`，將 **密文** 上鏈。

2.  **銷毀與讀取 (Burn & Decrypt)**
    * 接收者點擊「讀取並銷毀」，輸入密碼。
    * 呼叫合約 `burn`，銷毀鏈上物件並發出包含密文的 `Event`。
    * 前端捕捉 Event，執行 `AES.decrypt(ciphertext, password)`。
    * 若密碼正確，顯示原文；若錯誤，訊息將永久遺失（因為物件已銷毀）。

## 📦 安裝與執行

### 1. 智能合約 (Contract)

確保已安裝 IOTA CLI。

```bash
cd contract
iota move build
# 發布合約
iota client publish --gas-budget 100000000
```

### 2. 安裝前端依賴（Frontend)

確保安裝了所有依賴套件（包含 `crypto-js`）。
```bash
cd iota-secret-chat
npm install
```

### 3. 設定前端環境 (Configuration)

當智能合約部署成功後，終端機 (Terminal) 會回傳交易結果。請在輸出資訊中找到 **`Package ID`** (通常在 `Created Objects` 或 `Immutable` 區段，格式為 `0x...`)。

接著，請開啟前端專案中的 `utils/config.ts` 檔案，並填入對應數值：

```typescript
// utils/config.ts

// 1. 填入剛剛部署獲得的 Package ID
export const PACKAGE_ID = "0x你的PackageID..."; 

// 2. 確認模組名稱 (需與 Move 合約中的 module 名稱一致)
export const MODULE_NAME = "chat"; 

// 3. IOTA/Sui 的系統時鐘物件 ID (通常固定為 0x6)
export const CLOCK_ID = "0x6";
```

### 4. 啟動前端（Run Frontend)

```bash
npm run dev
```

開啟瀏覽器前往 http://localhost:3000 即可開始使用。

### 💡 使用說明
1. 發送訊息：輸入接收者地址、訊息內容與解密密碼。點擊發送後，前端會將內容加密成亂碼並上鏈。

2. 通知對方：請透過安全管道（例如：面對面）告知接收者該則訊息的密碼。

3. 接收與銷毀：
    * 接收者在列表中點擊「🔥 讀取並銷毀」。
    * 瀏覽器彈出提示框，請輸入正確密碼。
    * 若密碼正確，訊息將顯示在畫面上；若錯誤，物件仍會被銷毀，但內容將無法還原。

### ⚠️ 安全與注意事項
* 密碼不上鏈：解密密碼完全在前端處理，**不會**上傳至區塊鏈。

* 不可逆性：一旦按下「銷毀」，鏈上物件即被移除。若此時輸入錯誤密碼導致解密失敗，該訊息將無法再次找回（這正是閱後即焚的特性）。

* 公開元數據：雖然內容已加密，但「誰發送給誰 (Sender/Recipient Address)」以及「發送時間」在區塊鏈上仍是公開資訊。