"use client";

import { useMyMessages } from "../hooks/useMyMessages"; 
import { BurnMessage } from "./BurnMessage";

export function MessageList() {
  const { messages, loading, error, refetch } = useMyMessages(); 

  if (loading) return <div className="p-4 text-gray-400">正在掃描區塊鏈上的信件...</div>;

  if (error) {
    // 修正重點：判斷 error 是否為 Error 物件，若是則取 message，否則轉字串
    const errorMessage = error instanceof Error ? error.message : String(error);

    return (
      <div className="p-4 bg-red-900/20 text-red-400 border border-red-800 rounded">
        <h3>發生錯誤：</h3>
        <p>{errorMessage}</p> 
        <button onClick={() => refetch()} className="mt-2 text-sm underline hover:text-red-300">
          重試
        </button>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return <div className="p-4 text-gray-500 border border-dashed border-gray-700 rounded text-center">目前沒有加密信件。</div>;
  }

  return (
    <div className="space-y-4">
      {messages.map((msg: any) => (
        <BurnMessage 
          key={msg.id}
          objectId={msg.id}
          sender={msg.sender}
          onBurnSuccess={() => {
            console.log("銷毀成功，刷新列表...");
            refetch();
          }}
        /> 
      ))}
    </div>
  );
}