/* ego.js - Ego introduces himself, typed out in the terminal.
 *
 * The lines below are typed character-by-character into #ego-out with a blinking cursor, the same
 * "rendered to the console" feel as the whoami traceroute. Respects prefers-reduced-motion (prints
 * everything at once), starts when the terminal scrolls into view, and lets a click skip to the end.
 * No network, no tracking - pure presentation. */
(function () {
  "use strict";
  var out = document.getElementById("ego-out");
  if (!out) return;

  // Each entry: [class, text]. "" = plain output, "p" = a spoken/prompt line (cyan),
  // "sys" = dim system line, "cmd" = a typed command (with the $ prefix).
  var LINES = [
    ["cmd", "ego --introduce"],
    ["sys", "loading persona ................ ok"],
    ["", ""],
    ["p", "Hi. People call me Ego."],
    ["p", "I don't have a face. Look again. It's blank on purpose."],
    ["p", "It's blank because it could be yours. Or mine. Or anyone's."],
    ["", ""],
    ["p", "I'm the anyman. The person on the other end of every attack."],
    ["p", "Not the hacker. The human the hacker is counting on."],
    ["", ""],
    ["p", "Social engineers don't pick locks. They ask you to open the door."],
    ["p", "They do it by working your ego: the part of you that wants to"],
    ["p", "help, to be trusted, to be right, to move fast, to not look foolish."],
    ["", ""],
    ["p", "That instinct is good. They just aim it at the wrong target."],
    ["", ""],
    ["p", "So before you click, reply, approve, or pay, do one thing:"],
    ["p", "check your ego."],
    ["", ""],
    ["p", "Head to toe, check as you go."],
  ];

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function span(cls, text) {
    var s = document.createElement("span");
    if (cls) s.className = "el-" + cls;
    s.textContent = (cls === "cmd" ? "$ " : "") + text;
    return s;
  }

  // Glide Ego alongside the typing: p=0 -> near the first line, p=1 -> settled at the bottom.
  // He's positioned by translateY (CSS transitions it smoothly) so the box growing a line never
  // makes him jump. The idle float lives on the inner .ego-bob layer, so the two never collide.
  var figEl = document.getElementById("ego-fig");
  var box = out.closest(".ego-term");
  var lastP = 0;
  function place(p) {
    lastP = p;
    if (!figEl || !box) return;
    var figH = figEl.offsetHeight, boxH = box.clientHeight;
    var minY = 12, maxY = Math.max(minY, boxH - figH - 12);
    figEl.style.transform = "translateY(" + (minY + (maxY - minY) * p) + "px)";
  }
  window.addEventListener("resize", function () { place(lastP); });
  if (figEl) {
    var fimg = figEl.querySelector("img");
    if (fimg) fimg.addEventListener("load", function () { place(lastP); });
  }

  function renderAll() {
    out.textContent = "";
    LINES.forEach(function (ln) {
      out.appendChild(span(ln[0], ln[1]));
      out.appendChild(document.createTextNode("\n"));
    });
    out.classList.add("done");
    place(1);
  }

  var done = false;
  function run() {
    if (done) return;
    done = true;
    if (reduce) { renderAll(); return; }

    place(0);
    var li = 0;
    function nextLine() {
      if (li >= LINES.length) { out.classList.add("done"); place(1); return; }
      var ln = LINES[li++];
      place(li / LINES.length);  // glide down to track the line being written
      var prefix = ln[0] === "cmd" ? "$ " : "";
      var full = prefix + ln[1];
      var node = span(ln[0], "");
      node.textContent = prefix; // show the prompt prefix immediately
      out.appendChild(node);
      var nl = document.createTextNode("\n");
      out.appendChild(nl);

      // blank lines and the slow "boot" line get a short pause, not a per-char type
      if (ln[1] === "") { setTimeout(nextLine, 160); return; }

      var i = prefix.length;
      function typeChar() {
        node.textContent = full.slice(0, ++i);
        out.scrollTop = out.scrollHeight;
        if (i < full.length) {
          setTimeout(typeChar, ln[0] === "sys" ? 12 : 18 + Math.random() * 34);
        } else {
          setTimeout(nextLine, ln[0] === "cmd" ? 360 : 240);
        }
      }
      typeChar();
    }
    nextLine();
  }

  // click anywhere on the terminal to skip the animation
  var term = out.closest(".ego-term") || out;
  term.addEventListener("click", function () {
    if (out.classList.contains("done")) return;
    done = false; // allow renderAll to take over
    out.querySelectorAll && (out.textContent = "");
    renderAll();
    done = true;
  });

  // start when the terminal is on screen (or immediately if IntersectionObserver is missing)
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.disconnect(); setTimeout(run, 250); }
      });
    }, { threshold: 0.35 });
    io.observe(out);
  } else {
    run();
  }
})();
