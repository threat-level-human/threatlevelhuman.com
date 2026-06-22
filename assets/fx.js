/* Ambient background pulse for threatlevelhuman.com.
   On rare intervals a single faint terminal token (a public APT designation, a social-engineering
   term, or a shell snippet) fades in and out somewhere behind the page. Very low opacity, mono font,
   on the existing TUI/terminal theme. Disabled for reduced-motion. Pure decoration, stores nothing. */
(function () {
  var mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mq && mq.matches) return;

  // public threat-actor designations + social-engineering terms + harmless shell flavor.
  // SAFETY: every shell snippet here is read-only/informational. Nothing destructive, nothing that
  // opens a listener or executes an unknown file, so a visitor who copies one can't damage anything.
  var TOKENS = [
    "APT28", "APT29", "Lazarus Group", "Sandworm", "FIN7", "Scattered Spider", "Kimsuky",
    "Charming Kitten", "Cozy Bear", "Fancy Bear", "Wizard Spider", "Mustang Panda", "Volt Typhoon",
    "phishing", "spear phishing", "vishing", "smishing", "pretexting", "BEC", "MFA fatigue",
    "AiTM", "credential harvest", "payload staged", "0day", "C2 beacon", "lateral movement",
    "access granted", "session hijacked", "pivot",
    // read-only / informational shell snippets only
    "whoami", "id", "uname -a", "hostname", "ip a", "ifconfig", "netstat -tlnp", "ss -tlnp",
    "ps aux", "ls -la", "cat /etc/hostname", "env | grep", "history", "last -n 5", "w", "arp -a",
    "dig +short", "whois", "curl ifconfig.me", "ssh -V", "openssl version", "base64 -d", "route -n",
    "⚠ social engineering", "[!] human factor", "check your ego", "head to toe, check as you go"
  ];
  var AMBER = /ego|human|social|⚠|\[!\]/;

  var layer = document.createElement("div");
  layer.id = "fxbg";
  layer.setAttribute("aria-hidden", "true");
  (document.body || document.documentElement).appendChild(layer);

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function spawn() {
    var t = pick(TOKENS);
    var el = document.createElement("span");
    el.className = "fxtok" + (AMBER.test(t) ? " amber" : "");
    el.textContent = t;
    el.style.left = rand(4, 80).toFixed(2) + "%";
    el.style.top = rand(8, 88).toFixed(2) + "%";
    el.style.fontSize = rand(0.85, 2.3).toFixed(2) + "rem";
    layer.appendChild(el);
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
