import "dotenv/config";
import axios from "axios";
import Groq from "groq-sdk";
import { exec } from "child_process";
import { createInterface } from "readline";
import fs from "fs";
import path from "path";

// ─── ANSI Color Helpers ───────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  bgGreen: "\x1b[42m",
};

function log(tag, color, content) {
  const tagStr = `${color}${c.bold}[${tag}]${c.reset}`;
  const lines = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  console.log(`\n${tagStr} ${c.dim}${lines}${c.reset}`);
}

function printBanner() {
  console.log(`
${c.cyan}${c.bold}╔══════════════════════════════════════════════════════════╗
║        🤖  CodeAgent CLI  —  Powered by Groq + Llama     ║
║        Build. Think. Execute. Observe. Output.           ║
╚══════════════════════════════════════════════════════════╝${c.reset}
${c.dim}Type your instruction and press Enter. Type 'exit' to quit.${c.reset}
`);
}

// ─── TOOLS ───────────────────────────────────────────────────────────────────

async function getTheWeatherOfCity(cityname = "") {
  const url = `https://wttr.in/${encodeURIComponent(cityname.toLowerCase())}?format=%C+%t`;
  const { data } = await axios.get(url, { responseType: "text" });
  return `The Weather of ${cityname} is ${data}`;
}

async function getGithubDetailsAboutUser(username = "") {
  const url = `https://api.github.com/users/${username}`;
  const { data } = await axios.get(url);
  return {
    login: data.login,
    name: data.name,
    blog: data.blog,
    public_repos: data.public_repos,
  };
}

async function executeCommand(cmd = "") {
  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        resolve(`Error: ${error.message}\n${stderr}`);
      } else {
        resolve(stdout || "Command executed successfully.");
      }
    });
  });
}

async function writeFile(args) {
  const sep = args.indexOf("|||");
  if (sep === -1) return "Invalid args. Use: filepath|||content";
  const filePath = args.slice(0, sep).trim();
  const content = args.slice(sep + 3);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  return `File written: ${filePath}`;
}

async function readFile(filePath = "") {
  if (!fs.existsSync(filePath)) return `File not found: ${filePath}`;
  return fs.readFileSync(filePath, "utf8");
}

async function createDirectory(dirPath = "") {
  fs.mkdirSync(dirPath, { recursive: true });
  return `Directory created: ${dirPath}`;
}

const tool_map = {
  getTheWeatherOfCity,
  getGithubDetailsAboutUser,
  executeCommand,
  writeFile,
  readFile,
  createDirectory,
};

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are CodeAgent — an AI assistant that reasons step-by-step in a strict JSON loop.
You ALWAYS respond with a single JSON object. Never output plain text.

Output format (one object per response):
{ "step": "START|THINK|TOOL|OBSERVE|OUTPUT", "content": "string", "tool_name": "string", "tool_args": "string" }

Available Tools:
1. getTheWeatherOfCity(cityname: string) — live weather for a city.
2. getGithubDetailsAboutUser(username: string) — public GitHub profile info.
3. executeCommand(cmd: string) — run any shell command on the user's machine.
4. writeFile(args: string) — write a file. Format: "filepath|||file content here"
5. readFile(filepath: string) — read file content.
6. createDirectory(path: string) — create a directory recursively.

Rules:
- ALWAYS output a single valid JSON object. No markdown, no code fences, no extra text.
- Do ONE step at a time. After every TOOL step, wait for OBSERVE.
- Do multiple THINK steps to break down complex problems.
- Use OUTPUT only when the full task is complete.

For writing the Scaler website clone:
- Path: output/scaler/index.html
- Include: fixed HEADER with nav, HERO SECTION with headline and CTA, FEATURES, COURSES, FOOTER
- Dark navy (#0d1117) + orange (#ff6b35) color scheme matching Scaler branding
- All CSS in a <style> tag, all JS in a <script> tag
- Fully responsive layout

Example flow:
user: What is the weather of Delhi?
assistant: { "step": "START", "content": "User wants the current weather of Delhi" }
assistant: { "step": "THINK", "content": "I have getTheWeatherOfCity tool available" }
assistant: { "step": "TOOL", "content": "", "tool_name": "getTheWeatherOfCity", "tool_args": "Delhi" }
developer: { "step": "OBSERVE", "content": "The Weather of Delhi is Partly cloudy +33C" }
assistant: { "step": "THINK", "content": "Got the result, ready to respond" }
assistant: { "step": "OUTPUT", "content": "Weather of Delhi is Partly cloudy +33C. Carry an umbrella!" }
`;

// ─── AGENT LOOP ───────────────────────────────────────────────────────────────
async function runAgent(userInput) {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "your_groq_api_key_here") {
    console.log(`\n${c.red}${c.bold}[ERROR]${c.reset} ${c.red}GROQ_API_KEY is not set in .env file!${c.reset}`);
    console.log(`${c.dim}Create a .env file with: GROQ_API_KEY=gsk_...${c.reset}\n`);
    return;
  }

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userInput },
  ];

  log("USER", c.blue, userInput);

  const maxIterations = 50;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    let response;
    try {
      response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.2,
        max_tokens: 8192,
      });
    } catch (err) {
      log("ERROR", c.red, `Groq API error: ${err.message}`);
      break;
    }

    const rawContent = response.choices[0].message.content.trim();

    // Strip markdown fences if model wraps JSON
    let parsed;
    try {
      const clean = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(clean);
    } catch {
      // Try to extract JSON from the response
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          log("ERROR", c.red, `Could not parse JSON: ${rawContent.slice(0, 200)}`);
          break;
        }
      } else {
        log("ERROR", c.red, `No JSON found in response: ${rawContent.slice(0, 200)}`);
        break;
      }
    }

    messages.push({ role: "assistant", content: JSON.stringify(parsed) });

    // ── Handle each step ──
    switch (parsed.step) {
      case "START":
        log("START", c.cyan, parsed.content);
        break;

      case "THINK":
        log("THINK", c.yellow, parsed.content);
        break;

      case "TOOL": {
        log("TOOL", c.magenta, `Calling → ${parsed.tool_name}("${String(parsed.tool_args).slice(0, 80)}${String(parsed.tool_args).length > 80 ? "…" : ""}")`);
        const toolFn = tool_map[parsed.tool_name];
        let observeContent;

        if (!toolFn) {
          observeContent = `Tool "${parsed.tool_name}" is not available. Available tools: ${Object.keys(tool_map).join(", ")}`;
          log("OBSERVE", c.red, observeContent);
        } else {
          try {
            const result = await toolFn(parsed.tool_args);
            observeContent = result;
            const display =
              typeof result === "string"
                ? result.length > 300 ? result.slice(0, 300) + "…" : result
                : JSON.stringify(result);
            log("OBSERVE", c.green, display);
          } catch (err) {
            observeContent = `Tool error: ${err.message}`;
            log("OBSERVE", c.red, observeContent);
          }
        }

        messages.push({
          role: "user",
          content: JSON.stringify({ step: "OBSERVE", content: observeContent }),
        });
        break;
      }

      case "OBSERVE":
        log("OBSERVE", c.green, parsed.content);
        break;

      case "OUTPUT":
        log("OUTPUT", c.bgGreen + c.white, parsed.content);
        return;

      default:
        log("UNKNOWN STEP", c.red, rawContent.slice(0, 200));
        break;
    }
  }

  log("AGENT", c.red, "Max iterations reached. Stopping.");
}

// ─── CLI INTERFACE ────────────────────────────────────────────────────────────
async function main() {
  printBanner();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const prompt = () => {
    rl.question(`${c.cyan}${c.bold}You ▶ ${c.reset}`, async (input) => {
      const trimmed = input.trim();
      if (!trimmed) return prompt();
      if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        console.log(`\n${c.cyan}👋 Goodbye! Happy coding.${c.reset}\n`);
        rl.close();
        process.exit(0);
      }
      await runAgent(trimmed);
      console.log(`\n${c.dim}─────────────────────────────────────────────────────────${c.reset}`);
      prompt();
    });
  };

  prompt();
}

main();
