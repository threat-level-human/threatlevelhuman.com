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
