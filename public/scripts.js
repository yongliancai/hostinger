document.addEventListener('DOMContentLoaded', (event) => {
    // 你的 JavaScript 代码放在这里
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chatInput');
    const chatHistory = document.getElementById('chatHistory');

    // 根据当前页面的主机名动态确定 WebSocket 的 URL
    let wsUrl;
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        wsUrl = 'ws://localhost:3000';
    } else {
        // 注意：这里你需要将 'your-app-id.REGION_ID.r.appspot.com' 替换为你的实际 App Engine 应用的 URL
        // 并且确保使用 wss 协议（安全的 WebSocket）
        wsUrl = 'https://nckuchat.online/';
    }
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('Connected to the server');
    };

    ws.onmessage = (event) => {
        const message = event.data;
        console.log('Message received:', message);
        // 更新聊天历史，区分用户和机器人的消息
        chatHistory.innerHTML += `<div class="message bot-message"><span>Bot:</span> ${message}</div>`;
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('Disconnected from the server');
    };

    chatForm.onsubmit = (e) => {
        e.preventDefault();
        const message = chatInput.value.trim(); // 删除输入值两端的空白字符
        if (message) {
            // 在尝试发送消息前检查 WebSocket 连接状态
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message); // 如果消息非空，通过 WebSocket 发送消息
                console.log('Message sent:', message);
                // 可选：在聊天历史中添加用户消息
                chatHistory.innerHTML += `<div class="message user-message"><span>You:</span> ${message}</div>`;
                chatInput.value = ''; // 清空输入框
            } else {
                console.log('WebSocket is not open. Unable to send message.');
            }
        } else {
            console.log('Empty message not sent.'); // 如果消息为空，打印日志但不发送
        }
    };
});
