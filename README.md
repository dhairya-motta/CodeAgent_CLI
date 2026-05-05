# 🤖 CodeAgent CLI — AI Agent that Clones the Scaler Website

A conversational CLI agent — similar to how Cursor or Windsurf work — where you can chat with the agent directly in the terminal. The agent reasons through tasks step-by-step, takes real actions (runs shell commands, writes files), and produces working output.

---

## 🎯 What It Does

- Accepts **natural language instructions** from the user in the terminal
- Reasons in a loop: **START → THINK → TOOL → OBSERVE → OUTPUT**
- Can **clone the Scaler Academy website** by generating a fully working `index.html` with Header, Hero, and Footer
- Has access to real tools: write files, run commands, get weather, GitHub info, and more
- Loops until the task is complete — not a single-shot response

---

## 📁 Project Structure

```
CodeAgent_CLI/
├── agent.js              # Main CLI agent with reasoning loop
├── output/
│   └── scaler/
│       └── index.html    # Pre-generated Scaler Academy clone
├── package.json
├── .env.example          # Copy to .env and add your API key
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/dhairya-motta/CodeAgent_CLI.git
cd CodeAgent_CLI
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up your API key
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-...
```

### 4. Run the agent
```bash
node agent.js
```

---

## 💬 Example Prompts

```
You ▶ Clone the Scaler Academy website with header, hero section, and footer

You ▶ What is the weather in Mumbai?

You ▶ Get GitHub details for dhairya-motta

You ▶ Create a folder called my_app and build a todo app in HTML, CSS and JS
```

---

## 🛠 Available Tools

| Tool | Description |
|------|-------------|
| `writeFile(filepath\|\|\|content)` | Writes content to any file |
| `readFile(filepath)` | Reads file content |
| `createDirectory(path)` | Creates directories recursively |
| `executeCommand(cmd)` | Runs any shell command |
| `getTheWeatherOfCity(city)` | Fetches live weather |
| `getGithubDetailsAboutUser(username)` | Gets GitHub profile info |

---

## 🧠 Agent Reasoning Loop

The agent uses a structured JSON format for every step:

```json
{ "step": "START",   "content": "User wants to clone Scaler website" }
{ "step": "THINK",   "content": "I need to create an HTML file with header, hero, footer..." }
{ "step": "TOOL",    "tool_name": "writeFile", "tool_args": "output/scaler/index.html|||<html>..." }
{ "step": "OBSERVE", "content": "File written: output/scaler/index.html" }
{ "step": "OUTPUT",  "content": "Done! Open output/scaler/index.html in your browser." }
```

---

## 🌐 Pre-generated Scaler Clone

The repo includes a pre-generated clone at `output/scaler/index.html`. Open it directly in any browser:

- ✅ **Header** — Fixed nav with logo, links, Apply Now button, mobile hamburger
- ✅ **Hero Section** — Headline, subtext, CTA buttons, stats, floating card
- ✅ **Features Section** — 6 feature cards with hover animations
- ✅ **Courses Section** — 6 course cards matching Scaler's programs
- ✅ **Testimonials** — 3 alumni success stories
- ✅ **Footer** — 5-column footer with all links, socials, copyright

Color scheme: **Dark navy (#0d1117) + Orange (#ff6b35)** — matching Scaler branding.

---

## 📦 Tech Stack

- **Runtime**: Node.js (v18+)
- **AI**: OpenAI GPT-4.1-mini
- **HTTP**: Axios
- **CLI**: Node built-in `readline`
- **Env**: dotenv

---

## 📋 Assignment Checklist

- [x] CLI tool that accepts natural language instructions
- [x] Agent reasoning loop (START → THINK → TOOL → OBSERVE → OUTPUT)
- [x] Scaler website clone with Header, Hero, Footer
- [x] Output opens in browser as working HTML/CSS/JS
- [x] Multiple tool calls (writeFile, executeCommand, etc.)
- [x] Clean code with documentation

---

## 🔑 Notes

- Requires an OpenAI API key (GPT-4.1-mini is cost-efficient)
- The agent loops up to 50 iterations per task
- All generated files are saved to `output/` directory

---

*Built for Scaler Academy Assignment 02 — AI Agent CLI Tool*
