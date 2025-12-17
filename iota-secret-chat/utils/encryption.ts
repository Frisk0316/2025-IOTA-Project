import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';

/**
 * 加密函數
 * @param content 原始文字訊息
 * @param secretKey 用來加密的密碼
 * @returns 加密後的密文 (Base64 字串)
 */
export const encryptMessage = (content: string, secretKey: string): string => {
  if (!content || !secretKey) return "";
  // AES 加密產生的是一個物件，toString() 會預設轉成 Base64 格式
  return AES.encrypt(content, secretKey).toString();
};

/**
 * 解密函數
 * @param ciphertext 從鏈上抓下來的密文
 * @param secretKey 解密用的密碼
 * @returns 解密後的原始文字，如果密碼錯誤則回傳 null
 */
export const decryptMessage = (ciphertext: string, secretKey: string): string | null => {
  if (!ciphertext || !secretKey) return null;
  
  try {
    const bytes = AES.decrypt(ciphertext, secretKey);
    const originalText = bytes.toString(encUtf8);
    
    // 如果解密出來是空字串，通常代表密碼錯誤或格式不對
    if (!originalText) return null;
    
    return originalText;
  } catch (e) {
    console.error("解密失敗:", e);
    return null;
  }
};