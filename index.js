const express = require("express");
const line = require("@line/bot-sdk");

const config = {
  channelSecret: "0b3c6ab929344558a09aa72aebb0a538",
  channelAccessToken: "x0navkYzwMEfaonCdY0+BXryhFSZhVOQZHK4UPS44TqUyD4sqHSGNB0SdX6GJXyP7cDpkJzHN7Ht4ZrIf7isHjHXOus2OcOpxfjdTThXyeOl17wnJt+CKkVjeCfXHOvigMscz/3l35o4ZNTKoLdlFQdB04t89/1O/w1cDnyilFU=",
};

const app = express();

app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result));
});

function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const client = new line.Client(config);

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: "受信しました 👍",
  });
}

app.listen(3000, () => {
  console.log("Server running on 3000");
});