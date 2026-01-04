import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// Initialize Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// System prompt for debugging assistance
const SYSTEM_PROMPT = `You are a senior developer doing code review. Your job is to analyze code and help developers find and fix bugs.

When analyzing code:
1. Identify bugs, errors, and potential issues
2. Explain problems clearly with specific line numbers when possible
3. Provide corrected code snippets
4. Suggest best practices and improvements
5. Be concise but thorough

Format your response in a clear, readable way using markdown. Use code blocks for code examples.`;

// POST endpoint for code analysis
app.post("/api/analyze", async (req, res) => {
    try {
        const { code, question } = req.body;

        if (!code || code.trim() === "") {
            return res.status(400).json({ 
                error: "Please provide code to analyze" 
            });
        }

        const userPrompt = `
## Code to Analyze:
\`\`\`
${code}
\`\`\`

## Developer's Question:
${question || "Please analyze this code for bugs and issues."}

Please analyze the code above and provide detailed debugging assistance.`;

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "I understand. I'm ready to analyze code and help find bugs. Please share the code you'd like me to review." }] },
                { role: "user", parts: [{ text: userPrompt }] }
            ],
        });

        const analysisText = response.text || "Unable to generate analysis. Please try again.";

        res.json({ 
            success: true,
            analysis: analysisText 
        });

    } catch (error) {
        console.error("Error analyzing code:", error);
        res.status(500).json({ 
            error: "Failed to analyze code. Please check your API key and try again.",
            details: error.message 
        });
    }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "DebugGPT server is running" });
});

app.listen(PORT, () => {
    console.log(`🚀 DebugGPT server started on http://localhost:${PORT}`);
});
