import { useCurrentAccount, useIotaClientQuery } from "@iota/dapp-kit";
import { SECRET_MESSAGE_TYPE } from "@/utils/config";

export function useMyMessages() {
  const account = useCurrentAccount();

  const { data, refetch, isPending, error } = useIotaClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: { StructType: SECRET_MESSAGE_TYPE }, 
      options: {
        showContent: true, // 必須為 true 才能看到 sender 和 message
        showDisplay: true,
      },
    },
    {
      enabled: !!account,
      refetchInterval: 5000, 
    }
  );

  // --- Debug 區域 (請打開瀏覽器 Console 查看) ---
  console.log("🔍 目前帳戶:", account?.address);
  console.log("🔍 搜尋 Type:", SECRET_MESSAGE_TYPE);
  console.log("📦 鏈上回傳原始資料:", data);
  // -------------------------------------------

  // 解析資料：把複雜的 SDK 結構轉成簡單的 UI 格式
  const messages =
    data?.data?.map((obj) => {
      const content = obj.data?.content;

      // 確保是 Move 物件
      if (content?.dataType !== "moveObject") return null;

      // 這裡使用了 as any 強制讀取 fields，因為 SDK 型別有時會推斷不出來
      const fields = content.fields as any;

      return {
        id: obj.data?.objectId,
        sender: fields?.sender || "未知寄件者", // 確保這裡對應 Move 合約的欄位名稱
        message: fields?.message || "無法讀取內容", // 確保這裡對應 Move 合約的欄位名稱
      };
    }).filter((msg) => msg !== null) || []; // 過濾掉 null

  return {
    messages,
    loading: isPending,
    error,
    refetch,
  };
}