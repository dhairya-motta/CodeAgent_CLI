import "dotenv/config";
import axios from "axios";
import { OpenAI } from "openai";
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
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m",
};

function log(tag, color, content) {
  const tag_str = `${color}${c.bold}[${tag}]${c.reset}`;
  const lines = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  console.log(`\n${tag_str} ${c.dim}${lines}${c.reset}`);
}

function printBanner() {
  console.log(`
${c.cyan}${c.bold}╔══════════════════════════════════════════════════════════╗
║           🤖  CodeAgent CLI  —  AI Reasoning Loop        ║
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
  return new Promise((resolve, reject) => {
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
  // args: "filepath|||content"
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
You ALWAYS use the format: { "step": "START|THINK|TOOL|OBSERVE|OUTPUT", "content": "...", "tool_name": "...", "tool_args": "..." }

Available Tools:
1. getTheWeatherOfCity(cityname: string) — live weather for a city.
2. getGithubDetailsAboutUser(username: string) — public GitHub profile info.
3. executeCommand(cmd: string) — run any shell command on the user's machine.
4. writeFile(args: string) — write content to a file. Format args as: "filepath|||file content here"
5. readFile(filepath: string) — read file content.
6. createDirectory(path: string) — create a directory recursively.

Rules:
- ALWAYS output strict JSON. Never output plain text.
- Do ONE step at a time and wait for OBSERVE before continuing.
- Perform multiple THINK steps to break down complex problems.
- Use TOOL to call tools. Immediately after a TOOL step you MUST wait for OBSERVE.
- Use OUTPUT only when the full task is complete.
- For writing HTML/CSS/JS websites: use writeFile tool multiple times.
- For Scaler website cloning: create output/scaler/index.html with full HTML, CSS, JS inline or in separate files.

JSON Format:
{ "step": "START", "content": "description of what user wants" }
{ "step": "THINK", "content": "reasoning thought" }
{ "step": "TOOL", "content": "", "tool_name": "toolName", "tool_args": "arguments" }
{ "step": "OUTPUT", "content": "final response to user" }

Scaler Website Cloning Guidelines (when asked):
- Create output/scaler/index.html
- Include a professional HEADER with Scaler logo (text-based), nav links: Courses, Topics, Blogs, Careers, About
- Include a HERO SECTION with headline "Become the Professional Built for the Next Decade in AI", subtext, and a CTA button
- Include FEATURES section showing 4 cards: AI-Integrated Curriculum, Strong Foundations, Lifelong Access, Career Support
- Include COURSES section with at least 4 courses
- Include FOOTER with links for Explore Scaler, Resources, Socials, copyright
- Use a dark navy + orange color scheme matching Scaler branding (#1a1f36, #ff6b35, #ffffff)
- Make it fully responsive and visually impressive
- Write all CSS inline in a <style> tag and all JS in a <script> tag
`;

// ─── AGENT LOOP ───────────────────────────────────────────────────────────────
async function runAgent(userInput) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here") {
    console.log(`\n${c.red}${c.bold}[ERROR]${c.reset} ${c.red}OPENAI_API_KEY is not set in .env file!${c.reset}`);
    console.log(`${c.dim}Create a .env file with: OPENAI_API_KEY=sk-...${c.reset}\n`);
    return;
  }

  const client = new OpenAI();
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
        model: "gpt-4.1-mini",
        messages,
        temperature: 0.2,
      });
    } catch (err) {
      log("ERROR", c.red, `OpenAI API error: ${err.message}`);
      break;
    }

    const rawContent = response.choices[0].message.content.trim();

    // Parse JSON (strip markdown fences if any)
    let parsed;
    try {
      const clean = rawContent.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      log("ERROR", c.red, `Could not parse JSON: ${rawContent}`);
      break;
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
        log("TOOL", c.magenta, `Calling → ${parsed.tool_name}("${parsed.tool_args}")`);
        const toolFn = tool_map[parsed.tool_name];
        let observeContent;
        if (!toolFn) {
          observeContent = `Tool "${parsed.tool_name}" is not available.`;
          log("OBSERVE", c.red, observeContent);
        } else {
          try {
            const result = await toolFn(parsed.tool_args);
            observeContent = result;
            const display =
              typeof result === "string"
                ? result.length > 300
                  ? result.slice(0, 300) + "…"
                  : result
                : JSON.stringify(result);
            log("OBSERVE", c.green, display);
          } catch (err) {
            observeContent = `Tool error: ${err.message}`;
            log("OBSERVE", c.red, observeContent);
          }
        }
        messages.push({
          role: "developer",
          content: JSON.stringify({ step: "OBSERVE", content: observeContent }),
        });
        break;
      }

      case "OBSERVE":
        // Model sometimes emits its own OBSERVE — just log it
        log("OBSERVE", c.green, parsed.content);
        break;

      case "OUTPUT":
        log("OUTPUT", c.bgGreen + c.white, parsed.content);
        return;

      default:
        log("UNKNOWN", c.red, rawContent);
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
