"use client";

import { useSignAndExecuteTransaction } from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";
import { PACKAGE_ID, MODULE_NAME, CLOCK_ID } from "@/utils/config";
import { useState } from "react";

interface BurnMessageProps {
  objectId: string;
  sender: string;
  onBurnSuccess: () => void;
}

export function BurnMessage({ objectId, sender, onBurnSuccess }: BurnMessageProps) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [status, setStatus] = useState<"idle" | "burning" | "revealed">("idle");
  const [secretContent, setSecretContent] = useState<string | null>(null);

  const handleBurn = () => {
    setStatus("burning");
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::burn`,
      arguments: [
        tx.object(objectId),
        tx.object(CLOCK_ID),
      ],
    });

    signAndExecute(
      {
        transaction: tx as any,
        options: {
          showEvents: true,
        },
      },
      {
        onSuccess: (result) => {
          // --- Debug 區塊 ---
          console.log("交易完整結果:", result);
          console.log("觸發的 Events:", (result as any).events);

          // 1. 建構預期的 Event Type 字串 (Package::Module::EventName)
          // 注意：請確認你的 Move 合約中的 Event Struct 真的是 "MessageBurned"
          const expectedEventType = `${PACKAGE_ID}::${MODULE_NAME}::MessageBurned`;

          // 2. 搜尋 Event (比對 type 是否包含預期字串)
          const burnEvent = (result as any).events?.find((e: any) =>
            e.type.includes(expectedEventType)
          );

          if (burnEvent && burnEvent.parsedJson) {
            const content = (burnEvent.parsedJson as any).content;
            setSecretContent(content);
            setStatus("revealed");
            onBurnSuccess();
          } else {
            // 如果進到這裡，請按 F12 看 Console 印出的 "觸發的 Events" 
            // 檢查 e.type 跟我們組出的 expectedEventType 差在哪裡
            console.error(`找不到符合 ${expectedEventType} 的 Event`);
            alert("⚠️ 交易成功，但找不到 Event 內容。請查看 Console 確認 Event 名稱。");
            setStatus("idle");
          }
        },
        onError: (err) => {
          console.error(err);
          alert("❌ 銷毀失敗");
          setStatus("idle");
        },
      }
    );
  };

  if (status === "revealed" && secretContent) {
    return (
      <div className="mt-2 p-4 bg-red-900/50 border border-red-500 rounded animate-pulse">
        <p className="text-xs text-red-300 mb-1">🔥 訊息已銷毀，內容如下：</p>
        <p className="text-xl font-bold text-white break-all">{secretContent}</p>
        <p className="text-xs text-gray-400 mt-2">(重新整理頁面後將永遠消失)</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg mb-3 hover:bg-gray-600 transition-colors">
      <div>
        <div className="text-sm text-gray-300">來自: <span className="font-mono text-xs bg-gray-800 px-1 rounded">{sender.slice(0, 6)}...{sender.slice(-4)}</span></div>
        <div className="text-xs text-gray-500 font-mono">ID: {objectId.slice(0, 10)}...</div>
      </div>
      
      <button
        onClick={handleBurn}
        disabled={status === "burning"}
        className={`px-4 py-2 rounded font-bold text-sm ${
          status === "burning"
            ? "bg-gray-500 cursor-wait"
            : "bg-red-600 hover:bg-red-500 text-white shadow-red-500/20 shadow-lg"
        }`}
      >
        {status === "burning" ? "銷毀中..." : "🔥 讀取並銷毀"}
      </button>
    </div>
  );
}