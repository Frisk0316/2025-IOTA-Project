import { getFullnodeUrl } from "@iota/iota-sdk/client";

// 1. 設定網路環境
export const NETWORK = "testnet";
export const FULLNODE_URL = getFullnodeUrl(NETWORK);

// 2. 填入你剛才拿到的 Package ID
export const PACKAGE_ID = "0x42a1f63d5e6e536e089bf70706f60de4259e929503ebba6a3a0e165e233aff9c";

// 3. 設定模組與 Struct 名稱 (必須與 Move 合約一致)
export const MODULE_NAME = "chat";
export const STRUCT_NAME = "SecretMessage";

// 4. 組合出完整的 Type 字串 (Package::Module::Struct)
export const SECRET_MESSAGE_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::${STRUCT_NAME}`;
export const BURN_EVENT_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::MessageBurned`;

// 5. 系統 Clock 物件 ID (用於 burn 函數)
export const CLOCK_ID = "0x6";