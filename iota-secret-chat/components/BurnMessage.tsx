"use client";

import { useSignAndExecuteTransaction, useIotaClient } from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";
import { PACKAGE_ID, MODULE_NAME, CLOCK_ID } from "@/utils/config";
import { useState } from "react";

interface BurnMessageProps {
  objectId: string;
  sender: string;
  onBurnSuccess: () => void;
  // 1. 新增這個 props，用來把秘密內容傳給父元件
  onReveal: (content: string) => void;
}

export function BurnMessage({ objectId, sender, onBurnSuccess, onReveal }: BurnMessageProps) {
  const client = useIotaClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [status, setStatus] = useState<"idle" | "burning">("idle");

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
        options: { showEvents: true },
      },
      {
        onSuccess: async (result) => {
          let events = (result as any).events;
          const digest = result.digest;

          // 若 Wallet 沒回傳 events，主動查詢
          if (!events || events.length === 0) {
            try {
              const txDetails = await client.waitForTransaction({
                digest: digest,
                options: { showEvents: true },
              });
              events = txDetails.events;
            } catch (fetchError) {
              console.error("❌ 主動查詢失敗:", fetchError);
            }
          }

          if (events && events.length > 0) {
            const targetEvent = events.find((e: any) =>
              e.type.startsWith(`${PACKAGE_ID}::${MODULE_NAME}`)
            );

            if (targetEvent && targetEvent.parsedJson) {
              const content = (targetEvent.parsedJson as any).content;
              
              if (content) {
                // 2. 關鍵修改：抓到內容後，直接交給父元件處理顯示
                onReveal(content);
                
                // 3. 通知父元件去刷新列表 (這會導致此元件被移除，但沒關係了，因為內容已經交出去了)
                onBurnSuccess(); 
              } else {
                alert(`⚠️ 內容欄位遺失`);
                setStatus("idle");
              }
            } 
          } else {
            alert("⚠️ 交易成功，但無法讀取銷毀後的訊息。");
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