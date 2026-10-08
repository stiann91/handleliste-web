// Frittstående handleliste-side. Erstatter delen fra dashbordet.

function getCookie(name) {
  var m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : null;
}

// Anonym enhets-ID for telling av aktive enheter. Lagres kun i denne nettleseren.
var ENHET_ID = (function () {
  try {
    var id = localStorage.getItem("enhet-id");
    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(16).slice(2);
      localStorage.setItem("enhet-id", id);
    }
    return id;
  } catch (e) {
    return "";
  }
})();

// ── Handleliste (delt, lagret i rå JSON-fil på serveren) ──
(function () {
  "use strict";

  if (!document.getElementById("sl-widget")) return; // widgeten er ikke på siden

  // Endepunkter for delt lagring på server (rå JSON-fil i Django-mappen).
  var LISTE_ID = document.getElementById("sl-widget").getAttribute("data-liste-id");
  var GET_URL = "/api/liste/" + LISTE_ID + "/";
  var SAVE_URL = "/api/liste/" + LISTE_ID + "/lagre/";

  // Kategorier i den rekkefølgen du går gjennom butikken.
  var CATEGORY_ORDER = [
    "frukt", "grønnsaker", "brød", "kaffe", "melk", "juice",
    "meieri", "drikke", "tørrmat", "is", "godteri", "annet"
  ];

  var CATEGORY_LABELS = {
    "frukt": "Frukt", "grønnsaker": "Grønnsaker", "brød": "Brød",
    "kaffe": "Kaffe", "melk": "Melk", "juice": "Juice",
    "meieri": "Meieri", "drikke": "Drikke", "tørrmat": "Tørrmat",
    "is": "Is", "godteri": "Godteri", "annet": "Annet"
  };

  // Nøkkelord -> [ikon, kategori]. Lengste nøkkel matches først.
  var ITEM_DB = {
    "eple": ["🍎", "frukt"], "epler": ["🍎", "frukt"],
    "banan": ["🍌", "frukt"], "bananer": ["🍌", "frukt"],
    "appelsin": ["🍊", "frukt"], "sitron": ["🍋", "frukt"],
    "druer": ["🍇", "frukt"], "jordbær": ["🍓", "frukt"],
    "avokado": ["🥑", "frukt"], "ananas": ["🍍", "frukt"],

    "poteter": ["🥔", "grønnsaker"], "potet": ["🥔", "grønnsaker"],
    "løk": ["🧅", "grønnsaker"], "hvitløk": ["🧄", "grønnsaker"],
    "gulrøtter": ["🥕", "grønnsaker"], "gulrot": ["🥕", "grønnsaker"],
    "tomat": ["🍅", "grønnsaker"], "agurk": ["🥒", "grønnsaker"],
    "salat": ["🥬", "grønnsaker"], "brokkoli": ["🥦", "grønnsaker"],
    "paprika": ["🫑", "grønnsaker"], "mais": ["🌽", "grønnsaker"],

    "brød": ["🍞", "brød"], "rundstykke": ["🥐", "brød"], "knekkebrød": ["🍞", "brød"],

    "kaffe": ["☕", "kaffe"], "te": ["🍵", "kaffe"],

    "melk": ["🥛", "melk"],

    "juice": ["🧃", "juice"],

    "fløte": ["🥛", "meieri"], "rømme": ["🥛", "meieri"], "yoghurt": ["🥣", "meieri"],
    "ost": ["🧀", "meieri"], "smør": ["🧈", "meieri"], "egg": ["🥚", "meieri"],

    "vann": ["💧", "drikke"], "brus": ["🥤", "drikke"], "øl": ["🍺", "drikke"], "vin": ["🍷", "drikke"],

    "mel": ["🌾", "tørrmat"], "ris": ["🍚", "tørrmat"], "pasta": ["🍝", "tørrmat"],
    "nudler": ["🍜", "tørrmat"], "sukker": ["🍬", "tørrmat"], "honning": ["🍯", "tørrmat"],
    "salt": ["🧂", "tørrmat"], "pepper": ["🧂", "tørrmat"], "olje": ["🫒", "tørrmat"],
    "snacks": ["🍿", "tørrmat"],

    "is": ["🍦", "is"],

    "sjokolade": ["🍫", "godteri"], "kjeks": ["🍪", "godteri"], "godteri": ["🍬", "godteri"],

    "kylling": ["🍗", "annet"], "kjøttdeig": ["🥩", "annet"], "biff": ["🥩", "annet"],
    "kjøtt": ["🥩", "annet"], "bacon": ["🥓", "annet"], "pølser": ["🌭", "annet"],
    "pølse": ["🌭", "annet"], "fisk": ["🐟", "annet"], "laks": ["🐟", "annet"],
    "reker": ["🦐", "annet"], "pizza": ["🍕", "annet"],
    "toalettpapir": ["🧻", "annet"], "oppvaskmiddel": ["🧴", "annet"],
    "vaskemiddel": ["🧴", "annet"], "tannkrem": ["🪥", "annet"],
    "såpe": ["🧼", "annet"], "blomster": ["💐", "annet"]
  };
  var ITEM_KEYS = Object.keys(ITEM_DB).sort(function (a, b) { return b.length - a.length; });

  function guessInfo(name) {
    var lower = name.toLowerCase();
    for (var i = 0; i < ITEM_KEYS.length; i++) {
      if (lower.indexOf(ITEM_KEYS[i]) !== -1) {
        return { icon: ITEM_DB[ITEM_KEYS[i]][0], category: ITEM_DB[ITEM_KEYS[i]][1] };
      }
    }
    return { icon: null, category: "annet" };
  }
  function guessIcon(name) { return guessInfo(name).icon; }

  function fetchState() {
    return fetch(GET_URL, { credentials: "same-origin", headers: { "X-Enhet-ID": ENHET_ID } })
      .then(function (res) { if (!res.ok) throw new Error("GET feilet"); return res.json(); })
      .then(function (data) {
        var loadedItems = (Array.isArray(data.items) ? data.items : []).map(function (i) {
          return {
            name: i.name,
            icon: typeof i.icon !== "undefined" ? i.icon : guessInfo(i.name).icon,
            category: i.category || guessInfo(i.name).category,
            qty: i.qty || 1,
            plukket: !!i.plukket
          };
        });
        var loadedTurer = (Array.isArray(data.turer) ? data.turer : []).map(function (t) {
          return {
            dato: t.dato || "",
            items: (Array.isArray(t.items) ? t.items : []).map(function (i) {
              return { name: i.name, icon: i.icon || "", category: i.category || "annet", qty: i.qty || 1 };
            })
          };
        });
        return {
          items: loadedItems,
          history: Array.isArray(data.history) ? data.history : [],
          turer: loadedTurer
        };
      })
  }

  function saveState() {
    if (!stateLoaded) {
      showToast("Venter på serveren før lagring");
      return;
    }
    fetch(SAVE_URL, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
        "X-Enhet-ID": ENHET_ID
      },
      body: JSON.stringify({ items: items, history: history, turer: turer })
    }).catch(function () {
      showToast("Kunne ikke lagre til serveren");
    });
  }

  var items = [];
  var history = [];
  var turer = [];
  var stateLoaded = false;

  var $input = document.getElementById("sl-input");
  var $add = document.getElementById("sl-add");
  var $list = document.getElementById("sl-list");
  var $empty = document.getElementById("sl-empty");
  var $suggestions = document.getElementById("sl-suggestions");
  var $copy = document.getElementById("sl-copy");
  var $clear = document.getElementById("sl-clear");
  var $toast = document.getElementById("sl-toast");
  var $turerSection = document.getElementById("sl-turer");
  var $turerList = document.getElementById("sl-turer-list");

  var activeSuggestionIndex = -1;

  function buildItemRow(item, index) {
    var li = document.createElement("li");
    li.className = "sl-item" + (item.plukket ? " sl-item-plukket" : "");
    li.addEventListener("click", function (e) {
      if (e.target.closest("button")) return;
      item.plukket = !item.plukket;
      saveState();
      render();
    });

    var icon = document.createElement("span");
    icon.className = "sl-item-icon";
    icon.textContent = item.icon || "";

    var name = document.createElement("span");
    name.className = "sl-item-name";
    name.textContent = item.name;

    var qtyWrap = document.createElement("div");
    qtyWrap.className = "sl-qty";

    var minus = document.createElement("button");
    minus.className = "sl-qty-btn";
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "Færre " + item.name);
    minus.addEventListener("click", function () {
      item.qty -= 1;
      if (item.qty < 1) items.splice(index, 1);
      saveState();
      render();
    });

    var qtyNum = document.createElement("span");
    qtyNum.className = "sl-qty-num";
    qtyNum.textContent = item.qty;

    var plus = document.createElement("button");
    plus.className = "sl-qty-btn";
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "Flere " + item.name);
    plus.addEventListener("click", function () {
      item.qty += 1;
      saveState();
      render();
    });

    qtyWrap.appendChild(minus);
    qtyWrap.appendChild(qtyNum);
    qtyWrap.appendChild(plus);

    var remove = document.createElement("button");
    remove.className = "sl-item-remove";
    remove.type = "button";
    remove.setAttribute("aria-label", "Fjern " + item.name);
    remove.textContent = "✕";
    remove.addEventListener("click", function () {
      items.splice(index, 1);
      saveState();
      render();
    });

    li.appendChild(icon);
    li.appendChild(name);
    li.appendChild(qtyWrap);
    li.appendChild(remove);
    return li;
  }

  function render() {
    $list.innerHTML = "";

    // Grupper de ikke-plukkede varene etter kategori, i butikk-rekkefølge,
    // alfabetisk sortert innad i hver gruppe. Dette er bare en visningsrekkefølge,
    // den underliggende items-listen (og indeksene brukt i knappene) endres ikke.
    CATEGORY_ORDER.forEach(function (cat) {
      var indekser = [];
      items.forEach(function (item, i) {
        if (!item.plukket && (item.category || "annet") === cat) indekser.push(i);
      });
      if (indekser.length === 0) return;

      indekser.sort(function (a, b) {
        return items[a].name.localeCompare(items[b].name, "no");
      });

      var header = document.createElement("li");
      header.className = "sl-group-header";
      header.textContent = CATEGORY_LABELS[cat] || cat;
      $list.appendChild(header);

      indekser.forEach(function (i) {
        $list.appendChild(buildItemRow(items[i], i));
      });
    });

    // Plukkede varer samles i en egen gruppe nederst, uavhengig av kategori.
    var plukkedeIndekser = [];
    items.forEach(function (item, i) {
      if (item.plukket) plukkedeIndekser.push(i);
    });
    if (plukkedeIndekser.length > 0) {
      plukkedeIndekser.sort(function (a, b) {
        return items[a].name.localeCompare(items[b].name, "no");
      });

      var plukketHeader = document.createElement("li");
      plukketHeader.className = "sl-group-header";
      plukketHeader.textContent = "Plukket";
      $list.appendChild(plukketHeader);

      plukkedeIndekser.forEach(function (i) {
        $list.appendChild(buildItemRow(items[i], i));
      });
    }

    $empty.classList.toggle("sl-hidden", items.length > 0);
    renderTurer();
  }

  function renderTurer() {
    if (!$turerSection || !$turerList) return;
    $turerList.innerHTML = "";

    if (turer.length === 0) {
      $turerSection.hidden = true;
      return;
    }
    $turerSection.hidden = false;

    turer.forEach(function (tur, turIndex) {
      var li = document.createElement("li");
      li.className = "sl-tur";

      var info = document.createElement("div");
      info.className = "sl-tur-info";

      var dato = document.createElement("div");
      dato.className = "sl-tur-dato";
      dato.textContent = tur.dato || "Tidligere tur";

      var vareliste = document.createElement("div");
      vareliste.className = "sl-tur-varer";
      vareliste.textContent = tur.items.map(function (i) { return i.name; }).join(", ");

      info.appendChild(dato);
      info.appendChild(vareliste);

      var hent = document.createElement("button");
      hent.className = "sl-btn sl-btn-ghost sl-btn-hent";
      hent.type = "button";
      hent.textContent = "Hent tilbake";
      hent.addEventListener("click", function () {
        hentTilbakeTur(turIndex);
      });

      li.appendChild(info);
      li.appendChild(hent);
      $turerList.appendChild(li);
    });
  }

  function hentTilbakeTur(turIndex) {
    var tur = turer[turIndex];
    if (!tur) return;

    tur.items.forEach(function (vare) {
      var eksisterende = items.find(function (i) {
        return i.name.toLowerCase() === vare.name.toLowerCase();
      });
      if (eksisterende) {
        eksisterende.qty += vare.qty;
      } else {
        items.push({ name: vare.name, icon: vare.icon, category: vare.category, qty: vare.qty, plukket: false });
      }
    });
    saveState();
    render();
    showToast("Hentet tilbake " + tur.items.length + " varer");
  }

  function addItem(rawName) {
    var name = (rawName || "").trim();
    if (!name) return;

    var existing = items.find(function (i) { return i.name.toLowerCase() === name.toLowerCase(); });
    if (existing) {
      existing.qty += 1;
    } else {
      var info = guessInfo(name);
      items.push({ name: name, icon: info.icon, category: info.category, qty: 1, plukket: false });
    }

    var known = history.some(function (h) { return h.toLowerCase() === name.toLowerCase(); });
    if (!known) history.push(name);

    saveState();

    $input.value = "";
    hideSuggestions();
    render();
    $input.focus();
  }

  function showSuggestions(query) {
    var q = query.trim().toLowerCase();
    if (!q) { hideSuggestions(); return; }

    var matches = history
      .filter(function (h) { return h.toLowerCase().indexOf(q) !== -1; })
      .filter(function (h) { return !items.some(function (i) { return i.name.toLowerCase() === h.toLowerCase(); }); })
      .slice(0, 6);

    if (matches.length === 0) { hideSuggestions(); return; }

    $suggestions.innerHTML = "";
    matches.forEach(function (m) {
      var li = document.createElement("li");
      var icon = guessIcon(m);
      li.innerHTML = (icon ? icon + " " : "") + escapeHtml(m);
      li.addEventListener("mousedown", function (e) {
        e.preventDefault();
        addItem(m);
      });
      $suggestions.appendChild(li);
    });
    activeSuggestionIndex = -1;
    $suggestions.hidden = false;
  }

  function hideSuggestions() {
    $suggestions.hidden = true;
    $suggestions.innerHTML = "";
    activeSuggestionIndex = -1;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(message) {
    $toast.textContent = message;
    $toast.classList.add("sl-show");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function () {
      $toast.classList.remove("sl-show");
    }, 1800);
  }

  // ── Strekkodeskanning ──
  var scanner = null;
  var $scanBtn = document.getElementById("sl-scan");
  var $scanBox = document.getElementById("sl-scanner");

  function rensNavn(navn) {
    return navn.replace(/\s+\d+([.,]\d+)?\s?(g|kg|ml|cl|l|stk)\b.*$/i, "").trim();
  }

  function lookupBarcode(kode) {
    showToast("Slår opp " + kode + " …");
    return fetch("/api/barcode/" + encodeURIComponent(kode) + "/", { credentials: "same-origin" })
      .then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, d: d }; });
      })
      .then(function (res) {
        if (res.ok && res.d.navn) {
          var navn = rensNavn(res.d.navn);
          addItem(navn);
          showToast("Lagt til: " + navn);
        } else {
          $input.value = "";
          $input.focus();
          showToast("Fant ikke varen. Skriv navnet selv.");
        }
      })
      .catch(function () { showToast("Oppslag feilet"); });
  }

  function stopScan() {
    if (!scanner) return Promise.resolve();
    var s = scanner;
    scanner = null;
    $scanBox.hidden = true;
    return s.stop().then(function () { s.clear(); }).catch(function () {});
  }

  function startScan() {
    if (typeof Html5Qrcode === "undefined") {
      showToast("Skanneren kunne ikke lastes");
      return;
    }
    $scanBox.hidden = false;
    scanner = new Html5Qrcode("sl-scanner");
    scanner.start(
      { facingMode: "environment" },
      {
        fps: 15,
        qrbox: { width: 300, height: 150 },
        videoConstraints: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      },
      function (kode) {
        stopScan().then(function () { lookupBarcode(kode); });
      }
    ).catch(function () {
      scanner = null;
      $scanBox.hidden = true;
      showToast("Fant ikke kamera (krever HTTPS)");
    });
  }

  $scanBtn.addEventListener("click", function () {
    if (scanner) stopScan(); else startScan();
  });

  // Slå av kameraet når fanen skjules
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopScan();
  });

  $add.addEventListener("click", function () { addItem($input.value); });

  $input.addEventListener("input", function () { showSuggestions($input.value); });

  $input.addEventListener("keydown", function (e) {
    var visibleItems = $suggestions.querySelectorAll("li");

    if (e.key === "Enter") {
      e.preventDefault();
      if (!$suggestions.hidden && activeSuggestionIndex >= 0 && visibleItems[activeSuggestionIndex]) {
        addItem(visibleItems[activeSuggestionIndex].textContent);
      } else {
        addItem($input.value);
      }
      return;
    }
    if (e.key === "ArrowDown" && !$suggestions.hidden) {
      e.preventDefault();
      activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, visibleItems.length - 1);
      updateActiveSuggestion(visibleItems);
    }
    if (e.key === "ArrowUp" && !$suggestions.hidden) {
      e.preventDefault();
      activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, 0);
      updateActiveSuggestion(visibleItems);
    }
    if (e.key === "Escape") hideSuggestions();
  });

  function updateActiveSuggestion(visibleItems) {
    visibleItems.forEach(function (el, i) {
      el.classList.toggle("sl-active", i === activeSuggestionIndex);
    });
  }

  document.addEventListener("click", function (e) {
    if (!document.getElementById("sl-widget").contains(e.target)) hideSuggestions();
  });

  $copy.addEventListener("click", function () {
    if (items.length === 0) {
      showToast("Listen er tom");
      return;
    }
    var text = items
      .map(function (i) { return (i.icon ? i.icon + " " : "") + i.name + (i.qty > 1 ? " (" + i.qty + "x)" : ""); })
      .join("\n");

    // Samme mønster som copyCard(): krever sikker kontekst (HTTPS/localhost)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        function () { showToast("Kopiert!"); },
        function () { showToast("Kunne ikke kopiere"); }
      );
    } else {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        showToast("Kopiert!");
      } catch (e) {
        showToast("Kunne ikke kopiere (ikke sikker kontekst - trenger HTTPS)");
      }
      document.body.removeChild(textarea);
    }
  });

  function datoKlokkeslett() {
    var now = new Date();
    var dato = now.toLocaleDateString("no-NO", { day: "2-digit", month: "2-digit", year: "numeric" });
    var tid = now.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" });
    return dato + " " + tid;
  }

  $clear.addEventListener("click", function () {
    if (items.length === 0) return;
    var confirmed = window.confirm("Tøm hele handlelisten?");
    if (!confirmed) return;

    turer.unshift({
      dato: datoKlokkeslett(),
      items: items.map(function (i) {
        return { name: i.name, icon: i.icon, category: i.category, qty: i.qty };
      })
    });
    turer = turer.slice(0, 5);

    items = [];
    saveState();
    render();
    showToast("Listen er tømt");
  });

  function applyState(state) {
    items = state.items;
    history = state.history;
    turer = state.turer || [];
    stateLoaded = true;
    render();
  }

  // Ikke forstyrr brukeren midt i en handling: hopp over en automatisk
  // oppdatering rett etter at man selv har lagret noe herfra.
  var lastLocalSaveAt = 0;
  var origSaveState = saveState;
  saveState = function () {
    lastLocalSaveAt = Date.now();
    return origSaveState();
  };

  function shoppingSlideActive() {
    return !document.hidden;
  }

  function refreshFromServer() {
    if (!shoppingSlideActive()) return; // skjult slide eller skjult fane: ikke spør serveren
    if (Date.now() - lastLocalSaveAt < 1500) return; // nettopp lagret selv, ikke overskriv ennå
    fetchState().then(applyState).catch(function () { /* behold lokal tilstand */ });
  }

  fetchState().then(applyState).catch(function () {
    showToast("Kunne ikke hente handlelisten");
  });

  // Hold flere enheter i sync uten at man må trykke F5:
  // sjekk med jevne mellomrom, og alltid når fanen/vinduet får fokus igjen.
  window.setInterval(refreshFromServer, 5000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") refreshFromServer();
  });
  window.addEventListener("focus", refreshFromServer);
})();
