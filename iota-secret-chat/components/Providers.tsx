"use client";

import { createNetworkConfig, IotaClientProvider, WalletProvider } from "@iota/dapp-kit";
import { getFullnodeUrl } from "@iota/iota-sdk/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NETWORK } from "@/utils/config";
import "@iota/dapp-kit/dist/index.css"; // 引入錢包樣式

// 設定網路配置
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl(NETWORK) },
});

// 建立 React Query 客戶端 (負責管理數據緩存)
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <IotaClientProvider networks={networkConfig} defaultNetwork={NETWORK}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </IotaClientProvider>
    </QueryClientProvider>
  );
}