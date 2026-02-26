import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const API_KEY = process.env.GEMINI_API_KEY || fs.readFileSync(path.join(import.meta.dirname, "../.env"), "utf-8").match(/GEMINI_API_KEY=(.+)/)[1];

const genAI = new GoogleGenerativeAI(API_KEY);

const avatars = [
  {
    name: "god",
    prompt: "A photorealistic portrait of a wise, benevolent elderly man with a long white flowing beard, warm gentle eyes full of love and compassion, bathed in soft golden holy light with subtle rays. He wears simple white robes. The background is a warm golden ethereal glow. The style should be like a Renaissance painting but photorealistic. Square format, centered face, warm color palette of golds and creams.",
  },
  {
    name: "buddha",
    prompt: "A photorealistic portrait of Shakyamuni Buddha in deep peaceful meditation. Serene Asian face with half-closed eyes showing inner peace, golden skin tone, traditional ushnisha (cranial bump) on top of the head. Wearing simple saffron/orange monk robes. Soft natural light, background of soft green and gold tones suggesting a peaceful forest. Square format, centered face, serene and calming atmosphere.",
  },
  {
    name: "allah",
    prompt: "A beautiful, intricate Islamic geometric art pattern in deep teal and gold colors forming an ornate circular mandala design. The center features elegant Arabic calligraphy of 'Allah' in gold on a deep teal background. Surrounded by traditional Islamic arabesque patterns, eight-pointed stars, and floral motifs. Rich colors of teal (#1A6B5A), gold, and cream. No human figures. Square format, symmetrical, highly detailed craftsmanship.",
  },
];

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp-image-generation",
  generationConfig: {
    responseModalities: ["image", "text"],
  },
});

for (const avatar of avatars) {
  console.log(`Generating ${avatar.name}...`);
  try {
    const result = await model.generateContent(avatar.prompt);
    const response = result.response;

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        const ext = part.inlineData.mimeType === "image/png" ? "png" : "jpg";
        const outPath = path.join(import.meta.dirname, `../public/avatar-${avatar.name}.${ext}`);
        fs.writeFileSync(outPath, buffer);
        console.log(`  Saved: ${outPath}`);
      }
    }
  } catch (err) {
    console.error(`  Error for ${avatar.name}:`, err.message);
  }
}

console.log("Done!");
