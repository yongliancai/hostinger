require("dotenv").config();
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const OpenAI = require("openai");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public")); // 假设你的前端文件放在 'public' 目录下

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

wss.on("connection", function connection(ws) {
  console.log("Client connected");
  ws.on("message", async function incoming(messageBuffer) {
    // 将接收到的 Buffer 转换为字符串
    const message = messageBuffer.toString();

    console.log("Received message:", message);
    if (!message.trim()) {
      ws.send("Please send a non-empty message.");
      return;
    }

    try {
      const assistant = await openai.beta.assistants.retrieve("asst_RKX6bjenf3FWz2iz7mKwofNI");

      const thread = await openai.beta.threads.create();

      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: message,
      });

      const run = await openai.beta.threads.runs.create(thread.id, {assistant_id: assistant.id});

      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      while (runStatus.status !== "completed") {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 稍微等待
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessageForRun = messages.data.filter(
        (msg) => msg.run_id === run.id && msg.role === "assistant"
      ).pop();

      if (lastMessageForRun) {
        ws.send(lastMessageForRun.content[0].text.value);
      } else {
        // 如果没有找到助理的消息，发送一个默认回复
        ws.send("I'm sorry, I couldn't process your request. Please try again.");
      }
    } catch (error) {
      console.error('Error processing the message:', error);
      ws.send("Sorry, there was an error processing your request. Make sure your query is correctly formatted.");
    }
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

