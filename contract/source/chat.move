module burn_after_reading::chat {
    use std::string::{Self, String};
    use iota::object::{Self, UID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use iota::event;

    // --- Error Codes ---
    // 雖然 Move 的所有權機制已經保證只有擁有人能呼叫，
    // 但我們還是可以預留錯誤碼
    const ENotOwner: u64 = 0;

    // --- Data Structures (資料結構) ---

    // 這是我們的核心物件：秘密訊息
    // 注意：它只有 key 能力，沒有 drop！
    // 這意味著它不能被隨意丟棄，必須透過合約銷毀。
    struct SecretMessage has key {
        id: UID,
        sender: address,
        content: String, // 實際的訊息內容 (在真實應用中這裡通常是加密後的字串)
    }

    // --- Events (事件) ---

    // 當訊息被燒毀時，我們發出這個事件。
    // 前端監聽這個事件來顯示訊息內容給使用者。
    struct MessageBurned has copy, drop {
        reader: address,
        sender: address,
        content: String,
        timestamp_ms: u64
    }

    // --- Entry Functions (入口函數) ---

    // 1. 發送訊息
    public entry fun send_message(
        recipient: address,
        content_bytes: vector<u8>, 
        ctx: &mut TxContext
    ) {
        let message = SecretMessage {
            id: object::new(ctx),
            sender: tx_context::sender(ctx),
            content: string::utf8(content_bytes)
        };

        // 將物件的所有權直接轉移給接收者
        // 只有接收者之後能使用這個物件ID來呼叫 burn
        transfer::transfer(message, recipient);
    }

    // 2. 閱後即焚 (讀取 + 銷毀)
    // 注意：這裡我們直接傳入 `message` 值 (Pass by Value)，而不是參考 (&message)
    // 這代表函數執行結束後，這個 struct 必須被處理掉 (Unpack)，否則編譯器會報錯。
    public entry fun burn(
        message: SecretMessage, 
        clock: &iota::clock::Clock, // 為了記錄讀取時間 (選用)
        ctx: &mut TxContext
    ) {
        let sender = message.sender;
        let content = message.content;
        
        // --- 銷毀儀式 (Destruction) ---
        // 我們必須把 Struct 解構 (Unpack) 才能取出裡面的 UID 進行刪除
        let SecretMessage { id, sender: _, content: _ } = message;

        // 刪除 UID，這會將物件從鏈上儲存空間永久移除
        object::delete(id);

        // --- 發送事件 ---
        // 這是前端獲取訊息內容的唯一管道
        event::emit(MessageBurned {
            reader: tx_context::sender(ctx),
            sender: sender,
            content: content,
            timestamp_ms: iota::clock::timestamp_ms(clock)
        });
    }
}