/* The Mirror: a client-side social-engineering teachable page. It reveals what your connection gives
   away (device, network, location, reverse DNS) using public, no-key, CORS-friendly IP lookups your
   browser calls directly. Stores nothing, sends nothing to us. Builds a reconstructed traceroute-
   style path that types itself out when scrolled into view. */
(function () {
  var rows = document.getElementById("rows");
  if (!rows) return;
  var i = 0;
  var cells = {};   // key -> the .v element, so the network lookup can fill them in later

  function add(key, label, value, hot) {
    var el = document.createElement("div");
    el.className = "row";
    el.style.animationDelay = (i * 0.1) + "s";
    i++;
    var v = (value === undefined || value === null || value === "") ? "not exposed" : value;
    el.innerHTML = '<div class="k">' + label + '</div><div class="v' + (hot ? " hot" : "") + '"></div>';
    var cell = el.querySelector(".v");
    cell.textContent = v;
    rows.appendChild(el);
    if (key) cells[key] = cell;
  }
  function set(key, value, hot) {
    var cell = cells[key];
    if (!cell) return;
    cell.textContent = (value === undefined || value === null || value === "") ? "not exposed" : value;
    if (hot) cell.classList.add("hot");
  }

  var n = navigator, s = screen;
  var ua = n.userAgent || "";
  var browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera"
    : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari" : "your browser";
  var os = /Windows NT 10/.test(ua) ? "Windows 10 or 11" : /Windows/.test(ua) ? "Windows"
    : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "your OS";
  var browserTz = "";
  try { browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
  // The actual GPU, straight from WebGL's unmasked renderer string -- a website can read your exact
  // graphics card with no permission prompt. (resistFingerprinting / locked-down browsers mask it.)
  function gpuInfo() {
    try {
      var c = document.createElement("canvas");
      var gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) return "";
      var dbg = gl.getExtension("WEBGL_debug_renderer_info");
      var r = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      return r ? String(r) : "";
    } catch (e) { return ""; }
  }

  // A stable, cookieless fingerprint: a small hash of the device traits above + a canvas/font render
  // that differs subtly per machine. The point of the page -- you can be re-recognised with no cookie.
  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var k = 0; k < str.length; k++) {
      h ^= str.charCodeAt(k);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ("0000000" + h.toString(16)).slice(-8);
  }
  function canvasTrait() {
    try {
      var c = document.createElement("canvas"); c.width = 240; c.height = 60;
      var x = c.getContext("2d");
      x.textBaseline = "top"; x.font = "16px 'Arial'";
      x.fillStyle = "#069"; x.fillRect(2, 2, 200, 40);
      x.fillStyle = "#f60"; x.fillText("threat level: human ⚠ ego", 4, 8);
      x.strokeStyle = "#4FC3F7"; x.beginPath(); x.arc(60, 30, 18, 0, Math.PI * 2); x.stroke();
      return c.toDataURL();
    } catch (e) { return ""; }
  }

  var gpu = gpuInfo();
  var cores = n.hardwareConcurrency ? (n.hardwareConcurrency + " logical cores") : "";
  var ram = n.deviceMemory ? ("about " + n.deviceMemory + " GB") : "";   // Chromium only, coarse
  var dpr = window.devicePixelRatio || 1;
  var touch = n.maxTouchPoints || 0;
  var fp = fnv1a([
    ua, (n.languages || []).join(","), browserTz,
    s ? (s.width + "x" + s.height + "x" + s.colorDepth) : "", dpr,
    n.hardwareConcurrency || "", n.deviceMemory || "", gpu, canvasTrait()
  ].join("|"));

  // navigator.connection only exists in Chromium browsers; effectiveType is a coarse SPEED bucket
  // (slow-2g/2g/3g/4g), not "you're on cellular". Show the real numbers it also exposes when present.
  var c = n.connection, connLine = "";
  if (c) {
    var cp = [];
    if (c.effectiveType) cp.push(c.effectiveType + " tier");
    if (c.downlink) cp.push("about " + c.downlink + " Mbps");
    if (c.rtt != null) cp.push(c.rtt + " ms round-trip");
    connLine = cp.join(", ");
  }

  // --- what the browser hands over, no network call needed ---
  add(null, "Local time", new Date().toLocaleString());
  add(null, "Browser", browser);
  add(null, "Operating system", os);
  add(null, "Device type", /Mobi|Android|iPhone/.test(ua) ? "phone or tablet" : "desktop or laptop");
  add(null, "Graphics (GPU)", gpu, true);
  add(null, "Processor", cores, true);
  add(null, "Memory", ram, true);
  add(null, "Screen", s ? (s.width + " x " + s.height + ", " + (s.colorDepth || "?") + "-bit color") : "");
  add(null, "Display detail", dpr + "x pixel ratio" + (touch ? ", " + touch + " touch points" : ", no touch"));
  add(null, "Window size", window.innerWidth + " x " + window.innerHeight);
  add(null, "Languages", (n.languages || [n.language]).join(", "), true);
  add(null, "Connection speed (est.)", connLine);
  add(null, "Device fingerprint", fp + "  ·  recognises this browser with no cookie", true);
  add(null, "Came from", document.referrer || "typed or bookmarked (you came in clean)");
  add(null, "Cookies enabled", n.cookieEnabled ? "yes" : "no");

  // --- what a public IP lookup fills in (placeholders updated by the fetch chain) ---
  add("ipv4", "IPv4 address", "looking up...", true);
  add("ipv6", "IPv6 address", "looking up...", true);
  add("city", "City", "looking up...", true);
  add("region", "Region / state", "looking up...", true);
  add("postal", "Postal code", "looking up...", true);
  add("country", "Country", "looking up...", true);
  add("coords", "Coordinates", "looking up...", true);
  add("tz", "Time zone", browserTz || "looking up...", true);
  add("isp", "Network / ISP", "looking up...", true);
  add("asn", "Network owner (ASN)", "looking up...", true);
  add("rdns", "Reverse DNS (PTR)", "looking up...", true);
  add("nettype", "Network type", "looking up...", true);

  function showMap(lat, lon) {
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return;
    var dx = 0.05, dy = 0.03;
    var bbox = (lon - dx) + "," + (lat - dy) + "," + (lon + dx) + "," + (lat + dy);
    var frame = document.getElementById("map-frame");
    frame.src = "https://www.openstreetmap.org/export/embed.html?bbox="
      + encodeURIComponent(bbox) + "&layer=mapnik&marker="
      + encodeURIComponent(lat + "," + lon);
    document.getElementById("map-link").href = "https://www.google.com/maps?q=" + lat + "," + lon;
    document.getElementById("map-wrap").classList.add("show");
  }

  // Normalize the differing shapes from each free, no-key, CORS-friendly provider.
  function normalize(d) {
    if (!d || d.success === false || d.error) return null;
    var lat = d.latitude != null ? d.latitude : d.lat;
    var lon = d.longitude != null ? d.longitude : d.lon;
    var tz = d.timezone;
    if (tz && typeof tz === "object") tz = tz.id || tz.name || "";
    return {
      ip: d.ip || d.query,
      city: d.city,
      region: d.region || d.region_name || d.state,
      postal: d.postal || d.postal_code || d.zip,
      country: d.country || d.country_name,
      lat: lat, lon: lon,
      tz: tz,
      isp: (d.connection && (d.connection.isp || d.connection.org))
        || d.isp || d.org || d.organization_name,
      asn: d.asn || (d.connection && d.connection.asn) || d.as
    };
  }

  var providers = [
    "https://ipwho.is/",
    "https://ipapi.co/json/",
    "https://get.geojs.io/v1/ip/geo.json"
  ];

  function looksV6(ip) { return !!ip && ip.indexOf(":") >= 0; }
  function fillIp(kind, ip) {
    var cell = cells[kind];
    if (cell && cell.textContent === "looking up...") set(kind, ip);
  }

  // Honest residential/mobile/hosting inference from the network owner's name -- the same tell
  // an analyst uses to spot "is this person on a VPN/cloud or their real home line?"
  var HOSTING_RE = /(amazon|aws|google|microsoft|azure|oracle|alibaba|tencent|digitalocean|linode|akamai|fastly|cloudflare|ovh|hetzner|leaseweb|vultr|choopa|m247|datacamp|contabo|scaleway|hostwinds|colocrossing|nforce|ip ?volume|packethub|quadranet|psychz|zenlayer|cogent|datacenter|data ?center|hosting|host europe|server|vpn|proxy|gigabit)/i;
  var MOBILE_RE = /(wireless|mobile|cellular|t-mobile|mobility|verizon wireless|vodafone|telefonica|orange|jio|airtel|sprint|cricket|telstra|lte)/i;
  function classifyNetwork(org) {
    if (!org) return "unknown";
    if (HOSTING_RE.test(org)) return "datacenter / hosting -- likely a VPN, proxy, or cloud exit (you may be masking your real network)";
    if (MOBILE_RE.test(org)) return "mobile carrier";
    return "residential or business ISP";
  }

  // Reverse DNS (PTR) via Google's DNS-over-HTTPS -- the hostname behind an IP often leaks the
  // ISP, the region, sometimes a customer name. v4 only (v6 PTR is rarely set).
  var rdnsDone = false, trace2 = null, rdnsHost = "";
  function ensureRdns(ip) {
    if (rdnsDone || !ip || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return;
    rdnsDone = true;
    var name = ip.split(".").reverse().join(".") + ".in-addr.arpa";
    fetch("https://dns.google/resolve?name=" + encodeURIComponent(name) + "&type=PTR")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var ans = d && d.Answer;
        var host = (ans && ans.length) ? String(ans[ans.length - 1].data || "").replace(/\.$/, "") : "";
        set("rdns", host || "no PTR record");
        rdnsHost = host;
        // if hop 2 was already typed out, append the hostname live
        if (host && trace2) trace2.appendChild(document.createTextNode("  ->  " + host));
      })
      .catch(function () { set("rdns", "lookup failed"); });
  }

  // A reconstructed, clearly-labelled traceroute-style path (real ICMP traces can't run in a
  // browser). It shows "please wait ..." until the box scrolls into view and you stop scrolling,
  // then types itself out like a console. Dynamic values use textContent (no markup injection).
  var traceBuilt = false, traceTyped = false, traceHops = [];
  function buildTrace(o) {
    if (traceBuilt) return;
    traceBuilt = true;
    // just the ASN here -- the ISP company name is already shown in the rows above; this keeps
    // the reverse-DNS host (e.g. ...comcast.net) on one line
    var net = o.asn ? ("AS" + String(o.asn).replace(/^AS/i, "")) : "your provider";
    var loc = [o.city, o.region, o.country].filter(Boolean).join(", ") || "unknown";
    // each hop = array of {t: text, cls: optional color class}; hop 2 flagged for live rDNS
    traceHops = [
      [{t: " 1  ", cls: "num"}, {t: "your device", cls: "lbl"}, {t: "  " + browser + " on " + os}],
      [{t: " 2  ", cls: "num"}, {t: "your network", cls: "lbl"}, {t: "  " + net}],
      [{t: " 3  ", cls: "num"}, {t: "your region", cls: "lbl"}, {t: "  " + loc}],
      [{t: " 4  ", cls: "num"}, {t: "* * *", cls: "note"}, {t: "  the open internet"}],
      [{t: " 5  ", cls: "num"}, {t: "threatlevelhuman.com", cls: "lbl"}, {t: "  [reached]"}]
    ];
    var body = document.getElementById("trace-body");
    body.innerHTML = '<div class="trace-line"><span class="num"> 0</span>  '
      + 'resolving route to threatlevelhuman.com, please wait <span class="dots"></span></div>';
    document.getElementById("trace").classList.add("show");
    watchTrace();
  }

  function watchTrace() {
    var el = document.getElementById("trace");
    var inView = false, timer = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function arm() {                       // type only after scrolling settles
      if (traceTyped || !inView) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { if (inView && !traceTyped) typeTrace(reduce); }, 450);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { inView = e.isIntersecting; if (inView) arm(); });
      }, {threshold: 0.35}).observe(el);
      window.addEventListener("scroll", function () { if (inView) arm(); }, {passive: true});
    } else {
      typeTrace(true);                     // no observer: just render it
    }
  }

  function typeTrace(instant) {
    if (traceTyped) return;
    traceTyped = true;
    var body = document.getElementById("trace-body");
    body.textContent = "";
    var cursor = document.createElement("span");
    cursor.className = "tcursor";
    var hop = 0;

    function finishHop2(line) {
      if (rdnsHost) line.insertBefore(document.createTextNode("  ->  " + rdnsHost), cursor);
      else trace2 = line;                  // late rDNS will append here
    }
    function nextHop() {
      if (hop >= traceHops.length) return;
      var line = document.createElement("div");
      line.className = "trace-line";
      body.appendChild(line);
      line.appendChild(cursor);
      var segs = traceHops[hop];
      if (instant) {
        segs.forEach(function (s) {
          var sp = document.createElement("span");
          if (s.cls) sp.className = s.cls;
          sp.textContent = s.t;
          line.insertBefore(sp, cursor);
        });
        if (hop === 1) finishHop2(line);
        hop++;
        if (hop < traceHops.length) nextHop(); else cursor.remove();
        return;
      }
      typeSegs(line, cursor, segs, 0, 0, function () {
        if (hop === 1) finishHop2(line);
        hop++;
        if (hop < traceHops.length) setTimeout(nextHop, 130);
        // else: leave the cursor blinking on the final line
      });
    }
    nextHop();
  }

  function typeSegs(line, cursor, segs, si, ci, done) {
    if (si >= segs.length) { done(); return; }
    var seg = segs[si];
    if (ci === 0) {
      seg._span = document.createElement("span");
      if (seg.cls) seg._span.className = seg.cls;
      line.insertBefore(seg._span, cursor);
    }
    if (ci < seg.t.length) {
      seg._span.textContent += seg.t.charAt(ci);
      setTimeout(function () { typeSegs(line, cursor, segs, si, ci + 1, done); }, 16);
    } else {
      typeSegs(line, cursor, segs, si + 1, 0, done);
    }
  }

  function fill(o) {
    // the geo provider returns one address (v4 or v6); use it to fill whichever family is
    // still pending, but the dedicated ipify endpoints below are the primary source for both.
    if (o.ip) fillIp(looksV6(o.ip) ? "ipv6" : "ipv4", o.ip);
    set("city", o.city || "hidden");
    set("region", o.region || "hidden");
    set("postal", o.postal || "hidden");
    set("country", o.country || "hidden");
    set("coords", (o.lat != null && o.lon != null) ? (Number(o.lat).toFixed(4) + ", " + Number(o.lon).toFixed(4)) : "hidden");
    if (o.tz) set("tz", o.tz);
    set("isp", o.isp || "hidden");
    set("asn", o.asn ? ("AS" + String(o.asn).replace(/^AS/i, "") + (o.isp ? " · " + o.isp : "")) : "hidden");
    set("nettype", classifyNetwork(o.isp));
    showMap(Number(o.lat), Number(o.lon));
    buildTrace(o);
    if (o.ip && !looksV6(o.ip)) ensureRdns(o.ip);
    document.getElementById("scan-title").textContent = "scan complete.";
  }

  function tryProvider(idx) {
    if (idx >= providers.length) {
      ["city", "region", "postal", "country", "coords", "isp", "asn", "nettype"].forEach(function (k) {
        set(k, "lookup blocked");
      });
      set("city", "lookup blocked (good instinct, or a blocker stopped it)");
      document.getElementById("scan-title").textContent = "scan complete (lookup blocked).";
      return;
    }
    fetch(providers[idx], { headers: { "Accept": "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var o = normalize(d);
        if (!o || (!o.ip && o.lat == null)) throw new Error("empty");
        fill(o);
      })
      .catch(function () { tryProvider(idx + 1); });
  }
  tryProvider(0);

  // Dedicated IPv4 + IPv6 lookups (ipify resolves the v4-only and v6-only hostnames separately,
  // so each only succeeds if your connection actually carries that family).
  fetch("https://api.ipify.org?format=json")
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.ip) { set("ipv4", d.ip); ensureRdns(d.ip); } })
    .catch(function () { if (cells.ipv4 && cells.ipv4.textContent === "looking up...") set("ipv4", "not detected"); });
  fetch("https://api6.ipify.org?format=json")
    .then(function (r) { return r.json(); })
    .then(function (d) {
      set("ipv6", (d && d.ip && looksV6(d.ip)) ? d.ip : "none on this connection");
    })
    .catch(function () { set("ipv6", "none on this connection (IPv4 only)"); });
})();
