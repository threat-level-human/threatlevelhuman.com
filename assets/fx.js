/* Ambient background pulse for threatlevelhuman.com.
   On rare intervals a single faint terminal token (a public APT designation, a social-engineering
   term, or a read-only shell snippet) fades in and out behind the page. Very low opacity, mono font,
   on the existing TUI/terminal theme. Each spot is hit-tested so a token only appears where the page
   background is actually visible (empty centre space included) and never behind an opaque content
   box. Disabled for reduced-motion. Pure decoration, stores nothing. */
(function () {
  var mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mq && mq.matches) return;

  // public threat-actor designations + social-engineering terms + harmless shell flavor.
  // SAFETY: every shell snippet here is read-only/informational. Nothing destructive, nothing that
  // opens a listener or executes an unknown file, so a visitor who copies one can't damage anything.
  var TOKENS = [
    // nation-state / threat-actor groups
    "APT1", "APT3", "APT10", "APT28", "APT29", "APT33", "APT34", "APT38", "APT41",
    "Equation Group", "Turla", "Gamaredon", "Sandworm", "Lazarus Group", "Kimsuky", "Andariel",
    "BlueNoroff", "Charming Kitten", "MuddyWater", "OilRig", "Cozy Bear", "Fancy Bear",
    "Wizard Spider", "Mustang Panda", "Volt Typhoon", "Salt Typhoon", "Flax Typhoon",
    "FIN7", "FIN8", "Scattered Spider", "Lapsus$", "Karakurt", "Evil Corp", "TA505", "Star Blizzard",
    // ransomware / e-crime crews
    "LockBit", "BlackCat", "ALPHV", "Cl0p", "Conti", "REvil", "DarkSide", "Black Basta", "Royal",
    "Akira", "Play", "BianLian", "Rhysida", "Medusa", "Qilin", "Hunters International", "RansomHub",
    "8Base", "Vice Society", "Hive", "Snatch",
    // offensive-security tooling (names only)
    "Mimikatz", "Cobalt Strike", "Metasploit", "BloodHound", "SharpHound", "Rubeus", "Impacket",
    "Responder", "NetExec", "CrackMapExec", "Sliver", "Havoc", "Brute Ratel", "PowerSploit",
    "Empire", "Nmap", "masscan", "Burp Suite", "sqlmap", "Hydra", "John the Ripper", "Hashcat",
    "Aircrack-ng", "Wireshark", "Nessus", "Nikto", "Gobuster", "ffuf", "Nuclei", "Amass", "Shodan",
    "Maltego", "Evilginx2", "Gophish", "BeEF", "Wifiphisher", "Flipper Zero", "USB Rubber Ducky",
    "Bash Bunny", "ngrok", "Chisel", "proxychains", "Pacu", "ScoutSuite", "Seatbelt", "Kerbrute",
    "LaZagne", "Snaffler", "PetitPotam",
    // social engineering / phishing
    "phishing", "spear phishing", "vishing", "smishing", "quishing", "pretexting", "baiting",
    "tailgating", "BEC", "CEO fraud", "MFA fatigue", "MFA bombing", "callback phishing",
    "consent phishing", "OAuth phishing", "pig butchering", "romance scam", "invoice fraud",
    "gift-card scam", "SIM swap", "watering hole", "typosquatting", "homoglyph attack",
    "lookalike domain", "deepfake CFO",
    // deepfake / AI threats
    "deepfake", "voice cloning", "face swap", "lip-sync forgery", "synthetic media",
    "synthetic identity", "liveness bypass", "prompt injection", "jailbreak", "model poisoning",
    "data poisoning", "WormGPT", "FraudGPT", "generative phishing", "real-time face swap",
    "audio deepfake", "shadow AI",
    // attack chain / techniques
    "initial access", "persistence", "privilege escalation", "defense evasion", "credential access",
    "lateral movement", "exfiltration", "command and control", "C2 beacon", "living off the land",
    "LOLBins", "pass-the-hash", "pass-the-ticket", "golden ticket", "Kerberoasting",
    "AS-REP roasting", "DCSync", "NTLM relay", "ADCS abuse", "token impersonation",
    "DLL sideloading", "process injection", "AiTM", "credential harvest", "payload staged",
    "session hijacked", "cookie theft", "token theft", "0day", "pivot", "access granted",
    // web / app vulns
    "SQL injection", "XSS", "CSRF", "SSRF", "RCE", "path traversal", "insecure deserialization",
    "buffer overflow", "use-after-free", "supply-chain attack", "dependency confusion",
    "malicious package", "zero-day exploit",
    // read-only / informational shell snippets only (nothing destructive)
    "whoami", "id", "uname -a", "hostname", "ip a", "ifconfig", "netstat -tlnp", "ss -tlnp",
    "ps aux", "ps -ef", "ls -la", "cat /etc/hostname", "env | grep", "history", "last -n 5", "w",
    "arp -a", "dig +short", "nslookup", "host -t mx", "whois", "curl ifconfig.me", "ssh -V",
    "openssl version", "base64 -d", "route -n", "ip route", "sudo -l", "crontab -l", "lsof -i",
    "getent passwd", "groups", "uptime", "df -h", "traceroute", "ping -c 1",
    // thematic / brand (amber)
    "⚠ social engineering", "[!] human factor", "check your ego", "head to toe, check as you go",
    "[!] verify out of band", "⚠ trust but verify", "the human is the vector"
  ];
  var AMBER = /ego|human|social|trust|verify|vector|⚠|\[!\]/;

  var layer = document.createElement("div");
  layer.id = "fxbg";
  layer.setAttribute("aria-hidden", "true");
  (document.body || document.documentElement).appendChild(layer);

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var EDGE = 8, TRIES = 18;

  // A point is "clear" only if the stack above the page background at (x,y) is transparent layout
  // containers all the way down to <body> — i.e. NO opaque content box (or image/iframe) covers it.
  // This lets tokens use empty space ANYWHERE, including gaps in the centre, but never sit hidden
  // behind a solid box. (#fxbg and its tokens are pointer-events:none, so they're never returned.)
  function isClear(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el) return false;
    while (el && el !== document.body && el !== document.documentElement) {
      var tag = el.tagName;
      if (tag === "IMG" || tag === "IFRAME" || tag === "VIDEO" || tag === "CANVAS") return false;
      var m = getComputedStyle(el).backgroundColor.match(/^rgba?\(([\d.,\s]+)\)/);
      if (m) {
        var p = m[1].split(",");
        if ((p.length >= 4 ? parseFloat(p[3]) : 1) > 0.25) return false;  // opaque box covers it
      }
      el = el.parentElement;
    }
    return true;
  }

  // Find a viewport spot where the whole token rectangle is clear; null if none after a few tries.
  function clearSpot(w, h) {
    var vw = window.innerWidth, vh = window.innerHeight;
    if (vw - 2 * EDGE < w || vh - 2 * EDGE < h) return null;
    for (var i = 0; i < TRIES; i++) {
      var x = rand(EDGE, vw - EDGE - w);
      var y = rand(Math.max(EDGE, vh * 0.06), vh - EDGE - h);
      var pts = [[x + 3, y + 3], [x + w - 3, y + 3], [x + 3, y + h - 3],
                 [x + w - 3, y + h - 3], [x + w / 2, y + h / 2]];
      var ok = true;
      for (var j = 0; j < pts.length; j++) {
        if (!isClear(pts[j][0], pts[j][1])) { ok = false; break; }
      }
      if (ok) return { x: x, y: y };
    }
    return null;
  }

  function spawn() {
    var t = pick(TOKENS);
    var el = document.createElement("span");
    el.className = "fxtok" + (AMBER.test(t) ? " amber" : "");
    el.textContent = t;
    el.style.fontSize = rand(0.85, 2.3).toFixed(2) + "rem";
    el.style.left = "-9999px";   // off-screen to measure before placing
    el.style.top = "0";
    layer.appendChild(el);

    var spot = clearSpot(el.offsetWidth, el.offsetHeight);
    if (!spot) { layer.removeChild(el); return; }   // nowhere clear this cycle -> skip
    el.style.left = Math.round(spot.x) + "px";
    el.style.top = Math.round(spot.y) + "px";

    requestAnimationFrame(function () { el.classList.add("on"); });   // fade in
    setTimeout(function () { el.classList.remove("on"); }, rand(3400, 5200));  // fade out
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 8200);
  }

  function loop() {
    if (!document.hidden) spawn();
    setTimeout(loop, rand(6500, 14000));   // rare: one every ~6.5-14s
  }
  setTimeout(loop, 2600);
})();
