"use client";

import { useSignAndExecuteTransaction, useIotaClient } from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";
import { PACKAGE_ID, MODULE_NAME, CLOCK_ID } from "@/utils/config";
import { useState } from "react";

interface BurnMessageProps {
  objectId: string;
  sender: string;
  onBurnSuccess: () => void;
}

export function BurnMessage({ objectId, sender, onBurnSuccess }: BurnMessageProps) {
  const client = useIotaClient();
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
        // 修正錯誤 2: Type 'Transaction' mismatch
        // 使用 (tx as any) 繞過版本定義不一致的問題
        transaction: tx as any,
        options: {
          showEvents: true,
        },
      },
      {
        onSuccess: async (result) => {
          console.log("Wallet 初步回應:", result);
          
          // 修正錯誤 1: Property 'events' does not exist
          // 強制轉型 (result as any) 來讀取 events
          let events = (result as any).events;
          const digest = result.digest;

          // 若 Wallet 沒回傳 events，主動查詢
          if (!events || events.length === 0) {
            console.log("⚠️ Wallet 未回傳 Events，正在透過 Client 主動查詢...", digest);
            try {
              const txDetails = await client.waitForTransaction({
                digest: digest,
                options: {
                  showEvents: true,
                },
              });
              events = txDetails.events;
              console.log("✅ 主動查詢成功，取得 Events:", events);
            } catch (fetchError) {
              console.error("❌ 主動查詢失敗:", fetchError);
            }
          }

          if (events && events.length > 0) {
            // 修正錯誤 3: Parameter 'e' implicitly has an 'any' type
            // 加上 (e: any)
            const targetEvent = events.find((e: any) =>
              e.type.startsWith(`${PACKAGE_ID}::${MODULE_NAME}`)
            );

            if (targetEvent && targetEvent.parsedJson) {
              console.log("🔥 鎖定目標 Event:", targetEvent.type);
              
              const content = (targetEvent.parsedJson as any).content;
              
              if (content) {
                setSecretContent(content);
                setStatus("revealed");
                
                // ⚠️ 關鍵修改：註解掉這行
                // 不要呼叫 onBurnSuccess()，否則父元件會刷新列表導致此訊息消失
                // onBurnSuccess(); 
              } else {
                console.error("Event 結構異常:", targetEvent.parsedJson);
                alert(`⚠️ 找到 Event，但沒有 'content' 欄位。`);
                setStatus("idle");
              }
            } else {
              // 交易成功但沒找到特定 Event，通常這不應該發生，除非過濾條件錯了
              // 我們不在這裡報錯，避免蓋掉成功狀態，但也許可以 console.warn
              console.warn("未找到符合的 MessageBurned Event");
            }
          } else {
            console.error("❌ 最終仍未取得任何 Events");
            alert("⚠️ 交易成功，但無法讀取銷毀後的訊息。");
            setStatus("idle");
          }
        },
        onError: (err) => {
          console.error("交易失敗:", err);
          alert("❌ 銷毀失敗，請查看 Console");
          setStatus("idle");
        },
      }
    );
  };

  // 顯示銷毀後的訊息狀態
  if (status === "revealed" && secretContent) {
    return (
      <div className="mt-2 p-4 bg-red-900/50 border border-red-500 rounded animate-pulse">
        <p className="text-xs text-red-300 mb-1">🔥 訊息已銷毀，內容如下：</p>
        <p className="text-xl font-bold text-white break-all">{secretContent}</p>
        <p className="text-xs text-gray-400 mt-2">(重新整理頁面後此訊息將永遠消失)</p>
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