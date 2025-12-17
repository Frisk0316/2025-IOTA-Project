# IOTA Burn After Reading (閱後即焚 DApp)

這是一個基於 IOTA Move 智能合約與 Next.js 構建的去中心化應用程式 (DApp)。
它展示了 Move 語言獨特的 **資源銷毀 (Resource Destruction)** 機制。

## ✨ 功能特點

- **發送私密訊息**：將訊息封裝為鏈上物件 (Object)。
- **閱後即焚**：接收者讀取訊息的同時，智能合約會強制銷毀該物件，鏈上不再保留紀錄。
- **全端整合**：使用 IOTA dApp Kit 與 Next.js 14 構建。

## 🛠️ 技術

- **Smart Contract**: IOTA Move
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Integration**: @iota/dapp-kit, @iota/iota-sdk

## 🚀 如何執行

### 1. 智能合約 (Contract)

確保已安裝 IOTA CLI。

```bash
cd contract
iota move build
iota client publish --gas-budget 100000000
```

部署後，記下 `Package ID` 並更新到前端設定檔中。

### 2. 前端 (Frontend)

```bash
cd frontend
npm install
# 修改 utils/config.ts 中的 PACKAGE_ID
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

