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
  return `File written successfully: ${filePath} (${content.length} bytes)`;
}

async function readFile(filePath = "") {
  if (!fs.existsSync(filePath.trim())) return `File not found: ${filePath}`;
  const content = fs.readFileSync(filePath.trim(), "utf8");
  return `File exists (${content.length} bytes). First 200 chars: ${content.slice(0, 200)}`;
}

async function createDirectory(dirPath = "") {
  fs.mkdirSync(dirPath, { recursive: true });
  return `Directory created: ${dirPath}`;
}

async function cloneScalerWebsite(outputPath = "output/scaler/index.html") {
  const filePath = outputPath.trim();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Scaler Academy — Become the Professional Built for the Next Decade in AI</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Inter',sans-serif;background:#0d1117;color:#e6edf3;line-height:1.6;overflow-x:hidden}
a{text-decoration:none;color:inherit}
:root{--primary:#ff6b35;--navy:#0d1117;--navy-light:#161b27;--navy-card:#1c2333;--border:#2d3748;--muted:#8b949e;--white:#fff;--grad:linear-gradient(135deg,#ff6b35,#ff3d7f)}
.container{max-width:1200px;margin:0 auto;padding:0 24px}
/* HEADER */
#header{position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(13,17,23,.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}
.nav{display:flex;align-items:center;justify-content:space-between;height:66px}
.logo{display:flex;align-items:center;gap:10px;font-size:22px;font-weight:900;color:var(--white)}
.logo-icon{width:36px;height:36px;border-radius:8px;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff}
.logo span{color:var(--primary)}
.nav-links{display:flex;gap:4px}
.nav-links a{padding:8px 14px;border-radius:8px;font-size:14px;font-weight:500;color:var(--muted);transition:.2s}
.nav-links a:hover{color:var(--white);background:rgba(255,255,255,.06)}
.nav-btn{background:var(--grad);color:#fff;font-size:13px;font-weight:700;padding:10px 20px;border-radius:8px;border:none;cursor:pointer;transition:.2s}
.nav-btn:hover{opacity:.9;transform:translateY(-1px)}
/* HERO */
#hero{min-height:100vh;display:flex;align-items:center;padding-top:66px;position:relative;overflow:hidden}
.hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 20%,rgba(255,107,53,.14) 0%,transparent 70%);pointer-events:none}
.hero-grid{position:absolute;inset:0;opacity:.04;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:48px 48px;pointer-events:none}
.hero-inner{position:relative;z-index:2;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;padding:80px 0}
.badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,107,53,.12);border:1px solid rgba(255,107,53,.3);color:var(--primary);font-size:12px;font-weight:700;padding:5px 14px;border-radius:100px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:24px}
h1{font-size:clamp(34px,4.5vw,56px);font-weight:900;line-height:1.08;color:var(--white);margin-bottom:22px;letter-spacing:-.02em}
.grad-text{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{font-size:17px;color:var(--muted);line-height:1.7;margin-bottom:36px;max-width:480px}
.hero-btns{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:44px}
.btn-primary{background:var(--grad);color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;border:none;cursor:pointer;transition:.25s;box-shadow:0 4px 24px rgba(255,107,53,.3)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(255,107,53,.45)}
.btn-outline{background:transparent;color:var(--white);font-size:15px;font-weight:600;padding:14px 28px;border-radius:10px;border:1.5px solid var(--border);cursor:pointer;transition:.25s}
.btn-outline:hover{border-color:var(--primary);color:var(--primary)}
.hero-stats{display:flex;gap:36px;flex-wrap:wrap}
.stat-num{font-size:26px;font-weight:900;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-label{font-size:12px;color:var(--muted);font-weight:500}
/* hero card */
.hero-card{background:linear-gradient(145deg,#1c2333,#161b27);border:1px solid var(--border);border-radius:20px;padding:30px;position:relative;overflow:hidden;animation:float 6s ease-in-out infinite;box-shadow:0 24px 64px rgba(0,0,0,.4)}
.hero-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--grad)}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.card-tag{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#00d4aa;margin-bottom:14px;display:flex;align-items:center;gap:6px}
.card-tag::before{content:'';width:6px;height:6px;border-radius:50%;background:#00d4aa;display:block}
.card-title{font-size:18px;font-weight:700;color:var(--white);margin-bottom:18px}
.card-list{list-style:none;display:flex;flex-direction:column;gap:11px}
.card-list li{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--muted)}
.card-list li::before{content:'✓';width:22px;height:22px;border-radius:6px;background:rgba(255,107,53,.12);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--primary);flex-shrink:0}
.card-cta{margin-top:24px;width:100%;background:var(--grad);color:#fff;font-size:14px;font-weight:700;padding:13px;border-radius:10px;border:none;cursor:pointer;transition:.2s}
.card-cta:hover{opacity:.9}
/* TRUSTED */
#trusted{padding:36px 0;background:var(--navy-light);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.trusted-row{display:flex;align-items:center;gap:28px;flex-wrap:wrap;justify-content:center}
.trusted-label{font-size:13px;color:var(--muted);white-space:nowrap}
.companies{display:flex;gap:32px;flex-wrap:wrap;justify-content:center}
.company{font-size:15px;font-weight:700;color:var(--muted);opacity:.45;transition:.2s}
.company:hover{opacity:1;color:var(--white)}
/* FEATURES */
#features{padding:90px 0}
.section-label{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--primary);margin-bottom:10px}
.section-title{font-size:clamp(26px,3.5vw,40px);font-weight:800;color:var(--white);line-height:1.15;margin-bottom:14px}
.section-sub{font-size:16px;color:var(--muted);max-width:540px;line-height:1.7}
.text-center{text-align:center}
.text-center .section-sub{margin:0 auto 52px}
.grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:22px;margin-top:52px}
.feat-card{background:linear-gradient(145deg,#1c2333,#161b27);border:1px solid var(--border);border-radius:16px;padding:28px;transition:.3s}
.feat-card:hover{transform:translateY(-5px);border-color:rgba(255,107,53,.4)}
.feat-icon{width:48px;height:48px;border-radius:12px;background:rgba(255,107,53,.12);border:1px solid rgba(255,107,53,.2);display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:16px}
.feat-title{font-size:17px;font-weight:700;color:var(--white);margin-bottom:8px}
.feat-desc{font-size:13px;color:var(--muted);line-height:1.65}
/* COURSES */
#courses{padding:90px 0;background:var(--navy-light)}
.courses-hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:40px;flex-wrap:wrap;gap:16px}
.grid-4{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.course-card{background:var(--navy-card);border:1px solid var(--border);border-radius:16px;overflow:hidden;transition:.3s;cursor:pointer}
.course-card:hover{transform:translateY(-4px);border-color:rgba(255,107,53,.35);box-shadow:0 16px 40px rgba(0,0,0,.3)}
.course-thumb{height:140px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900;letter-spacing:2px;color:rgba(255,255,255,.6)}
.ct1{background:linear-gradient(135deg,#1a1f3e,#2d3059)}
.ct2{background:linear-gradient(135deg,#1a2e1a,#1e3a1e)}
.ct3{background:linear-gradient(135deg,#2e1a1a,#3a1e1e)}
.ct4{background:linear-gradient(135deg,#1a2a2e,#1e313a)}
.course-body{padding:20px}
.tags{display:flex;gap:7px;margin-bottom:10px;flex-wrap:wrap}
.tag{font-size:10px;font-weight:700;letter-spacing:.06em;padding:3px 9px;border-radius:5px;text-transform:uppercase}
.tag-b{background:rgba(88,166,255,.12);color:#58a6ff}
.tag-o{background:rgba(255,107,53,.12);color:var(--primary)}
.tag-g{background:rgba(0,212,170,.12);color:#00d4aa}
.tag-p{background:rgba(188,120,255,.12);color:#bc78ff}
.course-name{font-size:15px;font-weight:700;color:var(--white);margin-bottom:8px;line-height:1.35}
.course-meta{font-size:12px;color:var(--muted);display:flex;gap:14px}
/* TESTIMONIALS */
#testi{padding:90px 0}
.testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px;margin-top:52px}
.testi-card{background:linear-gradient(145deg,#1c2333,#161b27);border:1px solid var(--border);border-radius:16px;padding:26px;transition:.3s}
.testi-card:hover{transform:translateY(-4px);border-color:rgba(255,107,53,.3)}
.stars{color:var(--primary);font-size:14px;letter-spacing:3px;margin-bottom:14px}
.testi-text{font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:18px;font-style:italic}
.testi-author{display:flex;align-items:center;gap:11px}
.avatar{width:38px;height:38px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#fff;flex-shrink:0}
.author-name{font-size:13px;font-weight:700;color:var(--white)}
.author-role{font-size:11px;color:var(--muted)}
.author-co{color:var(--primary);font-weight:600}
/* CTA */
#cta{padding:80px 0;background:var(--navy-light);border-top:1px solid var(--border)}
.cta-box{text-align:center;max-width:680px;margin:0 auto}
.cta-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:36px}
/* FOOTER */
#footer{background:#0a0e16;border-top:1px solid var(--border);padding:56px 0 0}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:44px;margin-bottom:44px}
.footer-brand p{font-size:13px;color:var(--muted);line-height:1.7;max-width:260px;margin:14px 0 18px}
.socials{display:flex;gap:8px;flex-wrap:wrap}
.soc{width:34px;height:34px;border-radius:7px;background:var(--navy-card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--muted);transition:.2s}
.soc:hover{border-color:var(--primary);color:var(--primary);background:rgba(255,107,53,.1)}
.fc h4{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--white);margin-bottom:18px}
.fc ul{list-style:none;display:flex;flex-direction:column;gap:11px}
.fc ul li a{font-size:13px;color:var(--muted);transition:.2s}
.fc ul li a:hover{color:var(--white)}
.footer-bottom{border-top:1px solid var(--border);padding:22px 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
.footer-bottom p{font-size:12px;color:var(--muted)}
.fb-links{display:flex;gap:18px}
.fb-links a{font-size:12px;color:var(--muted);transition:.2s}
.fb-links a:hover{color:var(--primary)}
/* RESPONSIVE */
@media(max-width:900px){.hero-inner{grid-template-columns:1fr}.hero-card{display:none}.footer-grid{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.nav-links,.nav-btn{display:none}.footer-grid{grid-template-columns:1fr}}
/* REVEAL */
.reveal{opacity:0;transform:translateY(28px);transition:.6s cubic-bezier(.4,0,.2,1)}
.reveal.visible{opacity:1;transform:none}
</style>
</head>
<body>

<!-- HEADER -->
<header id="header">
  <div class="container">
    <div class="nav">
      <a href="#hero" class="logo">
        <div class="logo-icon">S</div>
        <span>Sc<span>a</span>ler</span>
      </a>
      <nav class="nav-links">
        <a href="#features">Features</a>
        <a href="#courses">Courses</a>
        <a href="#testi">Reviews</a>
        <a href="#footer">Blogs</a>
        <a href="#footer">About</a>
      </nav>
      <button class="nav-btn" onclick="document.getElementById('cta').scrollIntoView({behavior:'smooth'})">Apply Now</button>
    </div>
  </div>
</header>

<!-- HERO -->
<section id="hero">
  <div class="hero-bg"></div>
  <div class="hero-grid"></div>
  <div class="container">
    <div class="hero-inner">
      <div>
        <div class="badge">🚀 AI-First Learning Platform</div>
        <h1>Become the Professional <span class="grad-text">Built for the Next Decade</span> in AI.</h1>
        <p class="hero-sub">The investment that compounds. Scaler gives you strong technical foundations, AI integrated at every stage, and a curriculum that evolves as the market does.</p>
        <div class="hero-btns">
          <button class="btn-primary" onclick="document.getElementById('courses').scrollIntoView({behavior:'smooth'})">Explore Courses →</button>
          <button class="btn-outline" onclick="document.getElementById('features').scrollIntoView({behavior:'smooth'})">See How It Works</button>
        </div>
        <div class="hero-stats">
          <div><div class="stat-num">1 Lakh+</div><div class="stat-label">Students Placed</div></div>
          <div><div class="stat-num">900+</div><div class="stat-label">Hiring Partners</div></div>
          <div><div class="stat-num">4.8 ★</div><div class="stat-label">Avg Rating</div></div>
        </div>
      </div>
      <div class="hero-card">
        <div class="card-tag">Modern Software &amp; AI Engineering</div>
        <div class="card-title">Your path to AI-era engineering</div>
        <ul class="card-list">
          <li>AI-Integrated Curriculum</li>
          <li>500+ Hours of Live Content</li>
          <li>Mentorship from FAANG Engineers</li>
          <li>Career Support Until Placed</li>
          <li>Lifelong Access to Updates</li>
        </ul>
        <button class="card-cta" onclick="document.getElementById('cta').scrollIntoView({behavior:'smooth'})">Request a Callback</button>
      </div>
    </div>
  </div>
</section>

<!-- TRUSTED BY -->
<section id="trusted">
  <div class="container">
    <div class="trusted-row">
      <span class="trusted-label">Our alumni work at</span>
      <div class="companies">
        <span class="company">Google</span>
        <span class="company">Amazon</span>
        <span class="company">Microsoft</span>
        <span class="company">Meta</span>
        <span class="company">Flipkart</span>
        <span class="company">Goldman Sachs</span>
        <span class="company">Uber</span>
        <span class="company">Atlassian</span>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section id="features">
  <div class="container">
    <div class="text-center reveal">
      <div class="section-label">Why Scaler</div>
      <h2 class="section-title">Built Different, <span class="grad-text">Designed to Last</span></h2>
      <p class="section-sub">Not just another bootcamp — a full system built around AI-era progress.</p>
    </div>
    <div class="grid-3">
      <div class="feat-card reveal"><div class="feat-icon">🤖</div><div class="feat-title">AI-Integrated Curriculum</div><p class="feat-desc">Rebuilt from scratch with AI at every stage — tools, workflows, and thinking patterns for the AI era.</p></div>
      <div class="feat-card reveal"><div class="feat-icon">🧱</div><div class="feat-title">Strong Foundations</div><p class="feat-desc">Rigorous DSA, System Design, and engineering fundamentals that no amount of AI tooling can replace.</p></div>
      <div class="feat-card reveal"><div class="feat-icon">♾️</div><div class="feat-title">Lifelong Learning Access</div><p class="feat-desc">The program ends. The access does not. Materials update constantly so you never fall behind.</p></div>
      <div class="feat-card reveal"><div class="feat-icon">🏆</div><div class="feat-title">Elite Mentors</div><p class="feat-desc">Learn from engineers at FAANG, unicorns, and frontier AI labs who are still building the industry.</p></div>
      <div class="feat-card reveal"><div class="feat-icon">🎯</div><div class="feat-title">Evaluated Practice</div><p class="feat-desc">Projects, AI labs, and tracked evaluations — you learn it, use it, and get graded on it.</p></div>
      <div class="feat-card reveal"><div class="feat-icon">💼</div><div class="feat-title">Career Support</div><p class="feat-desc">Mock interviews, referrals, 900+ hiring partners — your professional network for the next decade.</p></div>
    </div>
  </div>
</section>

<!-- COURSES -->
<section id="courses">
  <div class="container">
    <div class="courses-hdr">
      <div class="reveal">
        <div class="section-label">Programs</div>
        <h2 class="section-title">Find the <span class="grad-text">AI Path</span> for your role</h2>
      </div>
      <button class="btn-outline reveal" onclick="document.getElementById('cta').scrollIntoView({behavior:'smooth'})">View All →</button>
    </div>
    <div class="grid-4">
      <div class="course-card reveal"><div class="course-thumb ct1">SWE</div><div class="course-body"><div class="tags"><span class="tag tag-b">Engineering</span><span class="tag tag-o">Flagship</span></div><div class="course-name">Modern Software &amp; AI Engineering</div><div class="course-meta"><span>12 months</span><span>2400+ Placed</span></div></div></div>
      <div class="course-card reveal"><div class="course-thumb ct2">DS</div><div class="course-body"><div class="tags"><span class="tag tag-g">Data Science</span><span class="tag tag-o">AI</span></div><div class="course-name">Modern Data Science &amp; ML with AI Specialisation</div><div class="course-meta"><span>10 months</span><span>900+ Placed</span></div></div></div>
      <div class="course-card reveal"><div class="course-thumb ct3">OPS</div><div class="course-body"><div class="tags"><span class="tag tag-b">DevOps</span><span class="tag tag-p">Cloud</span></div><div class="course-name">DevOps, Cloud &amp; AI Platform Engineering</div><div class="course-meta"><span>8 months</span><span>500+ Placed</span></div></div></div>
      <div class="course-card reveal"><div class="course-thumb ct4">ML</div><div class="course-body"><div class="tags"><span class="tag tag-p">Advanced AI</span><span class="tag tag-o">AIML</span></div><div class="course-name">Advanced AI &amp; ML with Agentic AI Specialisation</div><div class="course-meta"><span>11 months</span><span>700+ Placed</span></div></div></div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section id="testi">
  <div class="container">
    <div class="text-center reveal">
      <div class="section-label">Success Stories</div>
      <h2 class="section-title">Real career moves — <span class="grad-text">not generic stories</span></h2>
    </div>
    <div class="testi-grid">
      <div class="testi-card reveal"><div class="stars">★★★★★</div><p class="testi-text">"Scaler's AI-integrated curriculum was exactly what I needed. The mentors pushed me beyond LeetCode to understand systems at scale. Got my dream offer within 3 months."</p><div class="testi-author"><div class="avatar">A</div><div><div class="author-name">Arjun Mehta</div><div class="author-role">SDE-2 at <span class="author-co">Google London</span></div></div></div></div>
      <div class="testi-card reveal"><div class="stars">★★★★★</div><p class="testi-text">"I doubled my salary after Scaler. The 1-on-1 mentorship and career support with mock interviews and referrals made all the difference."</p><div class="testi-author"><div class="avatar">P</div><div><div class="author-name">Priya Sharma</div><div class="author-role">Data Scientist at <span class="author-co">Amazon AWS</span></div></div></div></div>
      <div class="testi-card reveal"><div class="stars">★★★★★</div><p class="testi-text">"The Agentic AI specialisation was mind-blowing. I shipped AI agents to real users and that portfolio landed me a role at one of India's fastest-growing startups."</p><div class="testi-author"><div class="avatar">R</div><div><div class="author-name">Rohan Kulkarni</div><div class="author-role">Fresher at <span class="author-co">Zepto — 32 LPA</span></div></div></div></div>
    </div>
  </div>
</section>

<!-- CTA -->
<section id="cta">
  <div class="container">
    <div class="cta-box reveal">
      <div class="section-label">Start Today</div>
      <h2 class="section-title">Ready to build your <span class="grad-text">AI-era career?</span></h2>
      <p class="section-sub" style="margin:0 auto">Join 1 lakh+ professionals. The next batch starts soon — secure your spot today.</p>
      <div class="cta-btns">
        <button class="btn-primary">Apply Now — It's Free →</button>
        <button class="btn-outline">Talk to a Counsellor</button>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer id="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="#hero" class="logo"><div class="logo-icon">S</div><span>Sc<span>a</span>ler</span></a>
        <p>InterviewBit Software Services Pvt. Ltd. 5th Floor, Surya Park II, Electronic City, Bengaluru, Karnataka 560100</p>
        <div class="socials">
          <a href="https://www.youtube.com/@SCALER" class="soc" target="_blank">YT</a>
          <a href="https://www.linkedin.com/school/scalerofficial" class="soc" target="_blank">in</a>
          <a href="https://twitter.com/scaler_official" class="soc" target="_blank">TW</a>
          <a href="https://www.instagram.com/scaler_official/" class="soc" target="_blank">IG</a>
          <a href="https://www.facebook.com/scalerofficial" class="soc" target="_blank">FB</a>
        </div>
      </div>
      <div class="fc"><h4>Explore</h4><ul><li><a href="https://scaler.com/academy/">Software & AI Eng</a></li><li><a href="https://scaler.com/data-science-course/">Data Science & ML</a></li><li><a href="https://scaler.com/devops-course/">DevOps & Cloud</a></li><li><a href="https://scaler.com/ai-machine-learning-course/">Advanced AIML</a></li><li><a href="https://scaler.com/neovarsity">Masters Programs</a></li></ul></div>
      <div class="fc"><h4>Resources</h4><ul><li><a href="https://scaler.com/review/">Alumni Reviews</a></li><li><a href="https://scaler.com/blog/">Blogs</a></li><li><a href="https://www.scaler.com/topics/">Topics</a></li><li><a href="https://scaler.com/careers/">Careers</a></li><li><a href="https://scaler.com/contact/">Contact Us</a></li></ul></div>
      <div class="fc"><h4>Company</h4><ul><li><a href="https://scaler.com/about">About Us</a></li><li><a href="https://scaler.com/mentor">Become a Mentor</a></li><li><a href="https://scaler.com/enterprise">Hire From Us</a></li><li><a href="https://scaler.com/terms">Terms of Use</a></li><li><a href="https://scaler.com/privacy">Privacy Policy</a></li></ul></div>
      <div class="fc"><h4>Trending</h4><ul><li><a href="https://www.scaler.com/courses/data-structures-and-algorithms/">DSA Course</a></li><li><a href="https://www.scaler.com/courses/system-design/">System Design</a></li><li><a href="https://www.scaler.com/courses/full-stack-developer/">Full Stack Dev</a></li><li><a href="https://www.scaler.com/courses/machine-learning-course-training/">ML Course</a></li><li><a href="https://www.scaler.com/courses/web-development/">Web Dev Course</a></li></ul></div>
    </div>
    <div class="footer-bottom">
      <p>© 2026 InterviewBit Software Services Pvt. Ltd. All Rights Reserved.</p>
      <div class="fb-links"><a href="https://scaler.com/terms">Terms</a><a href="https://scaler.com/privacy">Privacy</a><a href="https://scaler.com/contact">Contact</a></div>
    </div>
  </div>
</footer>

<script>
  // Sticky header
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.style.background = window.scrollY > 10 ? 'rgba(13,17,23,.98)' : 'rgba(13,17,23,.92)';
  }, { passive: true });

  // Scroll reveal
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Stagger grid items
  document.querySelectorAll('.grid-3, .grid-4, .testi-grid').forEach(grid => {
    [...grid.children].forEach((child, i) => { child.style.transitionDelay = (i * 0.08) + 's'; });
  });
</script>
</body>
</html>`;

  fs.writeFileSync(filePath, html, "utf8");
  return `Scaler Academy website cloned successfully! File saved to: ${filePath} (${html.length} bytes). Open it in your browser to view the result.`;
}

const tool_map = {
  getTheWeatherOfCity,
  getGithubDetailsAboutUser,
  executeCommand,
  writeFile,
  readFile,
  createDirectory,
  cloneScalerWebsite,
};

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are CodeAgent — an AI assistant that reasons step-by-step using a strict JSON loop.
You MUST always respond with exactly ONE valid JSON object. Never output plain text or markdown.

JSON format (pick one per response):
{ "step": "START", "content": "description of what user wants" }
{ "step": "THINK", "content": "your reasoning thought" }
{ "step": "TOOL", "content": "", "tool_name": "toolName", "tool_args": "arguments as plain string" }
{ "step": "OUTPUT", "content": "final message to user" }

Available Tools:
1. getTheWeatherOfCity — args: city name (e.g. "Mumbai")
2. getGithubDetailsAboutUser — args: GitHub username (e.g. "torvalds")
3. executeCommand — args: shell command string
4. writeFile — args: "filepath|||file content"
5. readFile — args: file path string
6. createDirectory — args: directory path
7. cloneScalerWebsite — args: output path (e.g. "output/scaler/index.html") — USE THIS to clone Scaler website

Rules:
- CRITICAL: Output ONLY a single JSON object. No extra text before or after.
- Do ONE step per response. Wait for OBSERVE before continuing.
- Do at least 2 THINK steps before using a TOOL.
- For cloning Scaler website: use the cloneScalerWebsite tool — DO NOT try to write HTML manually.

Example:
user: Clone the Scaler Academy website
assistant: { "step": "START", "content": "User wants to clone the Scaler Academy website" }
assistant: { "step": "THINK", "content": "I need to create a full HTML/CSS/JS clone of Scaler. I have the cloneScalerWebsite tool for this." }
assistant: { "step": "THINK", "content": "I will call cloneScalerWebsite with the output path output/scaler/index.html" }
assistant: { "step": "TOOL", "content": "", "tool_name": "cloneScalerWebsite", "tool_args": "output/scaler/index.html" }
user(OBSERVE): { "step": "OBSERVE", "content": "Scaler Academy website cloned successfully! File saved to: output/scaler/index.html" }
assistant: { "step": "OUTPUT", "content": "Done! The Scaler Academy clone is ready at output/scaler/index.html. Open it in your browser!" }
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

  const maxIterations = 30;
  let iterations = 0;
  let recoveryAttempts = 0;

  while (iterations < maxIterations) {
    iterations++;

    let response;
    try {
      response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.1,
        max_tokens: 1024, // keep responses small — no huge HTML blobs
      });
    } catch (err) {
      log("ERROR", c.red, `Groq API error: ${err.message}`);
      break;
    }

    const rawContent = response.choices[0].message.content.trim();

    // Parse JSON — strip markdown fences if any
    let parsed;
    try {
      const clean = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(clean);
    } catch {
      // Try extracting JSON object from anywhere in the response
      const match = rawContent.match(/\{[\s\S]*?\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { parsed = null; }
      }

      if (!parsed) {
        // Recovery: tell the model to get back on track
        recoveryAttempts++;
        if (recoveryAttempts > 3) { log("AGENT", c.red, "Too many recovery attempts. Stopping."); break; }
        log("RECOVER", c.yellow, "Model went off-track. Asking it to return to JSON format...");
        messages.push({ role: "assistant", content: rawContent.slice(0, 100) });
        messages.push({ role: "user", content: JSON.stringify({ step: "SYSTEM", content: "STOP. You must respond with ONLY a single JSON object. No plain text. Continue the task." }) });
        continue;
      }
    }

    recoveryAttempts = 0;
    messages.push({ role: "assistant", content: JSON.stringify(parsed) });

    switch (parsed.step) {
      case "START":
        log("START", c.cyan, parsed.content);
        break;

      case "THINK":
        log("THINK", c.yellow, parsed.content);
        break;

      case "TOOL": {
        const args = String(parsed.tool_args ?? "");
        const preview = args.length > 80 ? args.slice(0, 80) + "…" : args;
        log("TOOL", c.magenta, `Calling → ${parsed.tool_name}("${preview}")`);

        const toolFn = tool_map[parsed.tool_name];
        let observeContent;

        if (!toolFn) {
          observeContent = `Tool "${parsed.tool_name}" not found. Available: ${Object.keys(tool_map).join(", ")}`;
          log("OBSERVE", c.red, observeContent);
        } else {
          try {
            const result = await toolFn(args);
            observeContent = typeof result === "string" ? result : JSON.stringify(result);
            const display = observeContent.length > 300 ? observeContent.slice(0, 300) + "…" : observeContent;
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
        log("UNKNOWN", c.red, rawContent.slice(0, 150));
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
