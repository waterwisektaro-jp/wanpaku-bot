const express = require("express");
const line = require("@line/bot-sdk");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const app = express();
const client = new line.Client(config);

// ユーザー回答保存
const userState = {};

// webhook（1つだけ）
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];
    await Promise.all(events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

async function handleEvent(event) {

  if (event.type !== "message" || event.message.type !== "text") {
    return null;
  }

  const text = event.message.text;

  // ----------------------
  // 診断スタート
  // ----------------------

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

  // ----------------------
  // Q2
  // ----------------------

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
          { type: "message", label: "🏞 森・川で遊びたい(5月2日スタート)", text: "森" }
        ]
      }
    });
  }

  // ----------------------
  // Q3（森）
  // ----------------------

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
        "です！\n\nやんばるの自然をダイレクトに体感できる、リバートレッキングツアーです！\n\n🌳ツアーの様子はこちら（現在は開催していません。5月2日から開催します）👇\nhttps://www.instagram.com/okuma.big_sup/"
    });
  }

  // ----------------------
  // Q3（海）
  // ----------------------

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

  // ----------------------
  // 診断結果（Q3）
  // ----------------------

  if (text === "プライベート" || text === "グループ") {

    const userId = event.source.userId;
    if (!userState[userId]) userState[userId] = {};

    userState[userId].q3 = text;

    const q1 = userState[userId].q1;
    const q2 = userState[userId].q2;
    const q3 = userState[userId].q3;

    let result = " ";

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
