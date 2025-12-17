"use client";

import { useSignAndExecuteTransaction } from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";
import { useState } from "react";
import { PACKAGE_ID, MODULE_NAME } from "@/utils/config";
import { encryptMessage } from "@/utils/encryption"; // 1. 引入加密工具

export function SendMessage() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  
  // 2. 新增密碼的狀態
  const [password, setPassword] = useState("");
  
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    // 檢查必須包含密碼
    if (!recipient || !message || !password) return;
    setIsSending(true);

    // 3. 關鍵步驟：在打包交易前，先進行加密
    const encryptedContent = encryptMessage(message, password);
    
    console.log("原文:", message);
    console.log("加密後 (上鏈內容):", encryptedContent);

    const tx = new Transaction();
    
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::send_message`,
      arguments: [
        tx.pure.address(recipient),
        // 4. 這裡傳送的是「加密後的亂碼 (encryptedContent)」，而不是明文 message
        tx.pure.string(encryptedContent),
      ],
    });

    signAndExecute(
      { transaction: tx as any },
      {
        onSuccess: () => {
          alert("✅ 訊息已加密並發送成功！\n⚠️ 請務必將密碼告知接收者，否則他無法解讀。");
          setMessage(""); 
          setPassword(""); // 發送後清空密碼
          setIsSending(false);
        },
        onError: (error) => {
          console.error(error);
          alert("❌ 發送失敗，請檢查地址或網路");
          setIsSending(false);
        },
      }
    );
  };

  return (
    <div className="w-full max-w-lg p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-white">✉️ 寄送加密信件</h2>
      
      <div className="space-y-4">
        {/* 接收者地址輸入框 */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">接收者地址 (0x...)</label>
          <input
            type="text"
            placeholder="0x123..."
            className="w-full p-3 rounded bg-gray-900 text-white border border-gray-600 focus:border-blue-500 outline-none font-mono text-sm"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>

        {/* 5. 新增：設定密碼輸入框 */}
        <div>
          <label className="block text-sm text-yellow-400 mb-1 font-bold">🔐 設定解密密碼 (重要)</label>
          <input
            type="password"
            placeholder="接收者需要這組密碼才能解開..."
            className="w-full p-3 rounded bg-gray-900 text-white border border-yellow-600/50 focus:border-yellow-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            * 密碼不會上鏈，請通過其他安全管道告知接收者。
          </p>
        </div>

        {/* 訊息內容輸入框 */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">秘密內容</label>
          <textarea
            placeholder="寫些什麼..."
            rows={4}
            className="w-full p-3 rounded bg-gray-900 text-white border border-gray-600 focus:border-blue-500 outline-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button
          onClick={handleSend}
          // 沒填密碼不能發送
          disabled={!recipient || !message || !password || isSending}
          className={`w-full py-3 rounded font-bold transition-all ${
            !recipient || !message || !password || isSending
              ? "bg-gray-600 cursor-not-allowed text-gray-400"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 shadow-lg"
          }`}
        >
          {isSending ? "加密並發送中..." : "🚀 發送加密物件"}
        </button>
      </div>
    </div>
  );
}