"use client";

import { useSignAndExecuteTransaction, useIotaClient } from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";
import { PACKAGE_ID, MODULE_NAME, CLOCK_ID } from "@/utils/config";
import { useState } from "react";
import { decryptMessage } from "@/utils/encryption"; // 記得引入剛剛寫的工具

interface BurnMessageProps {
  objectId: string;
  sender: string;
  onBurnSuccess: () => void;
  onReveal: (content: string) => void;
}

export function BurnMessage({ objectId, sender, onBurnSuccess, onReveal }: BurnMessageProps) {
  const client = useIotaClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [status, setStatus] = useState<"idle" | "burning">("idle");

  const handleBurn = () => {
    // 1. 在銷毀前，先要求使用者輸入解密密碼
    const password = prompt("🔐 這是一則加密訊息，請輸入密碼以解密：");
    
    if (!password) {
      alert("❌ 必須輸入密碼才能進行銷毀與讀取。");
      return;
    }

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
              // 這是鏈上的「密文」 (亂碼)
              const cipherText = (targetEvent.parsedJson as any).content;
              
              if (cipherText) {
                // 2. 嘗試解密
                const originalContent = decryptMessage(cipherText, password);

                if (originalContent) {
                  // 解密成功！顯示原文
                  onReveal(originalContent);
                  onBurnSuccess(); 
                } else {
                  // 解密失敗 (密碼錯誤)
                  // 注意：此時物件已經在鏈上被銷毀了，這就是「閱後即焚」殘酷的地方
                  // 如果密碼打錯，這則訊息就永遠找不回來了。
                  alert(`⚠️ 銷毀成功，但解密失敗！可能是密碼錯誤。\n\n密文: ${cipherText}`);
                  // 我們還是要把密文顯示出來，至少讓使用者有機會去試著手動解密
                  onReveal(`(解密失敗，密文如下): ${cipherText}`);
                  onBurnSuccess();
                }
              } 
            } 
          } else {
            alert("⚠️ 交易成功，但無法讀取內容。");
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
            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 shadow-lg"
        }`}
      >
        {status === "burning" ? "處理中..." : "🔐 解密並銷毀"}
      </button>
    </div>
  );
}