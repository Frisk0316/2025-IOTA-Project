"use client";

import { useState } from "react"; // 新增
import { useMyMessages } from "../hooks/useMyMessages"; 
import { BurnMessage } from "./BurnMessage";

export function MessageList() {
  const { messages, loading, error, refetch } = useMyMessages(); 
  // 1. 新增狀態：用來暫存剛燒毀的訊息內容
  const [revealedContent, setRevealedContent] = useState<string | null>(null);

  if (loading) return <div className="p-4 text-gray-400">正在掃描區塊鏈上的信件...</div>;

  if (error) {
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

  return (
    <div className="space-y-4">
      
      {/* 2. 顯示區：如果剛才有訊息被燒毀，顯示在這裡 (永久顯示直到重新整理) */}
      {revealedContent && (
        <div className="mb-6 p-6 bg-red-900/40 border-2 border-red-500 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-2 border-b border-red-500/30 pb-2">
            <span className="text-2xl">🔥</span>
            <h3 className="font-bold text-red-200 text-lg">訊息已銷毀</h3>
          </div>
          <div className="p-4 bg-black/30 rounded-lg">
             <p className="text-2xl font-bold text-white break-all tracking-wide font-mono">
               {revealedContent}
             </p>
          </div>
          <p className="text-xs text-red-300/70 mt-3 text-center">
            (此訊息已從區塊鏈上永久刪除，重新整理頁面後將無法再次查看)
          </p>
        </div>
      )}

      {(!messages || messages.length === 0) ? (
        <div className="p-4 text-gray-500 border border-dashed border-gray-700 rounded text-center">
          目前沒有加密信件。
        </div>
      ) : (
        messages.map((msg: any) => (
          <BurnMessage 
            key={msg.id}
            objectId={msg.id}
            sender={msg.sender}
            // 3. 傳入 callback，當子元件拿到內容時，通知父元件存起來
            onReveal={(content) => setRevealedContent(content)}
            onBurnSuccess={() => {
              console.log("銷毀成功，刷新列表...");
              refetch();
            }}
          /> 
        ))
      )}
    </div>
  );
}