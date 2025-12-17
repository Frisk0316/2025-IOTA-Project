"use client";

import { ConnectButton, useCurrentAccount } from "@iota/dapp-kit";
import { SendMessage } from "@/components/SendMessage";
import { MessageList } from "@/components/MessageList";

export default function Home() {
  const account = useCurrentAccount();

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 bg-gray-900 text-white selection:bg-red-500 selection:text-white">
      {/* Navbar 區域 */}
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-12">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
          <h1 className="text-2xl font-bold tracking-tighter">BURN AFTER READING</h1>
        </div>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-black via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <ConnectButton />
        </div>
      </div>

      {/* 主要內容區域 */}
      {!account ? (
        <div className="flex flex-col items-center justify-center mt-20 text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-500">請先連接錢包</h2>
          <p className="text-gray-400">連接後即可發送或接收閱後即焚訊息</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl">
          {/* 左側：發送 */}
          <div className="flex flex-col items-center">
            <SendMessage />
          </div>

          {/* 右側：列表 */}
          <div className="flex flex-col items-center border-t lg:border-t-0 lg:border-l border-gray-700 pt-8 lg:pt-0 lg:pl-12">
            <MessageList />
          </div>
        </div>
      )}
    </main>
  );
}