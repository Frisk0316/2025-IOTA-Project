module burn_after_reading::chat {
    use std::string::{Self, String};
    use iota::object::{Self, UID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use iota::event;
    use iota::clock::{Self, Clock};

    // --- 資料結構 ---

    // 這是秘密訊息物件
    // 只有 key 能力，沒有 store/drop，所以不能隨意轉移或丟棄，必須透過合約處理
    struct SecretMessage has key {
        id: UID,
        sender: address,
        content: String,
    }

    // --- 事件 ---

    // 當訊息被燒毀時，發出此事件供前端讀取
    struct MessageBurned has copy, drop {
        reader: address,
        sender: address,
        content: String,
        timestamp_ms: u64
    }

    // --- 入口函數 (Entry Functions) ---

    // 1. 發送訊息 (Mint & Transfer)
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

        // 直接將物件所有權轉給接收者
        transfer::transfer(message, recipient);
    }

    // 2. 閱後即焚 (Burn)
    // 接收者呼叫此函數，合約會銷毀物件並發出事件
    public entry fun burn(
        message: SecretMessage, 
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = message.sender;
        let content = message.content;
        
        // --- 銷毀儀式 ---
        // 解構 Struct
        let SecretMessage { id, sender: _, content: _ } = message;
        // 刪除 UID (永久移除)
        object::delete(id);

        // --- 發出事件 ---
        event::emit(MessageBurned {
            reader: tx_context::sender(ctx),
            sender: sender,
            content: content,
            timestamp_ms: clock::timestamp_ms(clock)
        });
    }
}