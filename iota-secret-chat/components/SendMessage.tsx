"use client";

import { useSignAndExecuteTransaction } from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";
import { useState } from "react";
import { PACKAGE_ID, MODULE_NAME } from "@/utils/config";

export function SendMessage() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    if (!recipient || !message) return;
    setIsSending(true);

    const tx = new Transaction();
    // 呼叫合約的 send_message 函數
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::send_message`,
      arguments: [
        tx.pure.address(recipient), // 接收者地址
        tx.pure.string(message),    // 訊息內容 (會自動轉成 vector<u8>)
      ],
    });

    signAndExecute(
      { transaction: tx as any},
      {
        onSuccess: () => {
          alert("✅ 訊息已加密發送！");
          setMessage(""); // 清空輸入框
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
      <h2 className="text-xl font-bold mb-4 text-white">✉️ 寄送秘密信件</h2>
      
      <div className="space-y-4">
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
          disabled={!recipient || !message || isSending}
          className={`w-full py-3 rounded font-bold transition-all ${
            !recipient || !message || isSending
              ? "bg-gray-600 cursor-not-allowed text-gray-400"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 shadow-lg"
          }`}
        >
          {isSending ? "發送中..." : "🚀 發送加密物件"}
        </button>
      </div>
    </div>
  );
}