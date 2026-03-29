const express = require("express");
const line = require("@line/bot-sdk");

const config = {
  channelAccessToken: process.env.Be1YuIjx3zsCT/vlSX61p2v9iAWv2QIJBlhQPjDhEdF4EHHnsOiy058X5pUkl/FU7cDpkJzHN7Ht4ZrIf7isHjHXOus2OcOpxfjdTThXyeO+H1Mi0g5suwmLm/1z7kP3WyI+lwwJiMzLe8PqlJ8ADwdB04t89/1O/w1cDnyilFU=,
  channelSecret: process.env.0b3c6ab929344558a09aa72aebb0a538
};

const app = express();
const client = new line.Client(config);

// ユーザー回答保存
const userState = {};

// webhook
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    // 検証時は events が空でも 200 を返す
    if (!req.body || !req.body.events || req.body.events.length === 0) {
      return res.sendStatus(200);
    }

    const results = await Promise.all(req.body.events.map(handleEvent));
    return res.json(results);
  } catch (err) {
    console.error("Webhook error:", err);
    return res.sendStatus(500);
  }
});

function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const text = event.message.text;

  if (text === "ツアー診断") {
    return client.replyMessage(event.replyToken, {
      type: "template",
      altText: "ツアー診断スタート",
      template: {
        type: "buttons",
        text: "3つの質問であなたにぴったりのツアーを診断します！\n\nQ1. 参加スタイルは？",
        actions: [
          { type: "message", label: "👶 子ども中心", text: "子ども" },
          { type: "message", label: "👨‍👩‍👧 親子参加", text: "親子" },
          { type: "message", label: "👫 大人だけ", text: "大人" }
        ]
      }
    });
  }

  if (text === "子ども" || text === "親子" || text === "大人") {
    const userId = event.source.userId;
    userState[userId] = { q1: text };

    return client.replyMessage(event.replyToken, {
      type: "template",
      altText: "質問2",
      template: {
        type: "buttons",
        text: "Q2. どんな自然体験をしたい？",
        actions: [
          { type: "message", label: "🌊 海で遊びたい", text: "海" },
          { type: "message", label: "🏞 森・川で遊びたい", text: "森" }
        ]
      }
    });
  }

  if (text === "森") {
    const userId = event.source.userId;
    if (!userState[userId]) userState[userId] = {};
    userState[userId].q2 = text;

    const result = "リバートレッキング";

    return client.replyMessage(event.replyToken, {
      type: "text",
      text:
        "おすすめツアーは\n\n🌟" +
        result +
        "です！\n\nやんばるの自然をダイレクトに体感できる、リバートレッキングツアーです！\n\n🌳ツアーの様子はこちら👇\nhttps://www.instagram.com/okuma.big_sup/"
    });
  }

  if (text === "海") {
    const userId = event.source.userId;
    if (!userState[userId]) userState[userId] = {};
    userState[userId].q2 = text;

    return client.replyMessage(event.replyToken, {
      type: "template",
      altText: "質問3",
      template: {
        type: "buttons",
        text: "Q3. ツアーのスタイルは？",
        actions: [
          { type: "message", label: "🌟 1組限定がいい", text: "プライベート" },
          { type: "message", label: "👨‍👩‍👧 みんなで楽しむ", text: "グループ" }
        ]
      }
    });
  }

  if (text === "プライベート" || text === "グループ") {
    const userId = event.source.userId;
    if (!userState[userId]) userState[userId] = {};

    userState[userId].q3 = text;

    const q1 = userState[userId].q1;
    const q2 = userState[userId].q2;
    const q3 = userState[userId].q3;

    let result = "";

    if (q2 === "海") {
      if ((q1 === "子ども" || q1 === "親子") && q3 === "グループ") {
        result = "わんぱく教室";
      } else {
        result = "ビッグサップツアー";
      }
    }

    if (q3 === "プライベート") {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text:
          "おすすめツアーは\n\n🌟" +
          result +
          "です！\n\n一組限定のプライベートツアーだから海初心者でも安心して楽しめます！\n\n🌊ツアーの様子はこちら👇\nhttps://www.instagram.com/okuma.big_sup/"
      });
    } else {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text:
          "おすすめツアーは\n\n🌟" +
          result +
          "です！\n\n子どもが主役の、みんなでワイワイ楽しめる自然体験プログラムです！\n\n👦👧ツアーの様子はこちら👇\nhttps://www.instagram.com/okuma_wanpaku/"
      });
    }
  }

  return Promise.resolve(null);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});