"use client";

import { useSignAndExecuteTransaction, useIotaClient } from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";
import { PACKAGE_ID, MODULE_NAME, CLOCK_ID } from "@/utils/config";
import { useState } from "react";
import { decryptMessage } from "@/utils/encryption";

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
    // 1. 移除這裡的 prompt，直接開始執行銷毀交易
    // 我們改在交易成功後再問密碼
    if (!confirm("🔥 確定要讀取並銷毀這則訊息嗎？\n(銷毀後將要求輸入解密密碼)")) {
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

          // 雙重確認機制：若 Wallet 沒回傳 Events，主動去鏈上查
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
              const cipherText = (targetEvent.parsedJson as any).content;
              
              if (cipherText) {
                // --- 2. 新增：三次解密機會邏輯 ---
                let attempts = 0;
                let decryptedContent: string | null = null;

                while (attempts < 3) {
                  // 根據嘗試次數顯示不同提示
                  const promptMsg = attempts === 0 
                    ? "🔐 訊息已從鏈上銷毀！\n請輸入密碼進行解密："
                    : `❌ 密碼錯誤！剩餘 ${3 - attempts} 次機會：`;

                  const inputPwd = prompt(promptMsg);

                  // 如果使用者按取消，視同放棄
                  if (inputPwd === null) break;

                  const result = decryptMessage(cipherText, inputPwd);
                  if (result) {
                    decryptedContent = result;
                    break; // 解密成功，跳出迴圈
                  }
                  
                  attempts++;
                }

                // --- 3. 判斷最終結果 ---
                if (decryptedContent) {
                  // 成功：顯示內容
                  onReveal(decryptedContent);
                } else {
                  // 失敗：不顯示密文，直接報錯並結束
                  alert("❌ 三次密碼錯誤 (或已取消)。\n\n訊息已在區塊鏈上銷毀，且因無法解密，內容已永久遺失。");
                  // 這裡我們不再呼叫 onReveal，所以畫面上不會出現紅色框框
                }
                
                // 刷新列表 (移除該項目)
                onBurnSuccess(); 
                
              } else {
                alert(`⚠️ 內容欄位遺失`);
                setStatus("idle");
              }
            } 
          } else {
            alert("⚠️ 交易成功，但無法讀取內容。");
            setStatus("idle");
          }
        },
        onError: (err) => {
          console.error(err);
          alert("❌ 銷毀交易失敗");
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