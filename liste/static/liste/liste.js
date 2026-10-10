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

// Kategorier i den rekkefølgen du går gjennom en typisk norsk dagligvarebutikk.
var CATEGORY_ORDER = [
  "frukt_grønt",
  "brød_bakevarer",
  "kjøtt_fisk",
  "meieri_melk",
  "frokost_kaffe",
  "middag_tørrmat",
  "hus_hjem",
  "personlig_pleie",
  "frys",
  "drikke",
  "snacks_godteri",
  "annet"
];

var CATEGORY_LABELS = {
  "frukt_grønt": "Frukt & grønt",
  "brød_bakevarer": "Brød & bakevarer",
  "kjøtt_fisk": "Kjøtt & fisk",
  "meieri_melk": "Meieri, melk & juice",
  "frokost_kaffe": "Frokost & kaffe",
  "middag_tørrmat": "Middag & tørrmat",
  "hus_hjem": "Hus, hjem & rengjøring",
  "personlig_pleie": "Personlig pleie & hygiene",
  "frys": "Frysevarer & is",
  "drikke": "Drikke & mineralvann",
  "snacks_godteri": "Snacks & godteri",
  "annet": "Annet & kassevarer"
};

// Nøkkelord -> [ikon, kategori]. Lengste nøkkel matches først.
var ITEM_DB = {
  // --- FRUKT & BÆR ---
  "eple": ["🍎", "frukt_grønt"], "epler": ["🍎", "frukt_grønt"],
  "banan": ["🍌", "frukt_grønt"], "bananer": ["🍌", "frukt_grønt"],
  "appelsin": ["🍊", "frukt_grønt"], "appelsiner": ["🍊", "frukt_grønt"],
  "sitron": ["🍋", "frukt_grønt"], "lime": ["🍋", "frukt_grønt"],
  "druer": ["🍇", "frukt_grønt"], "jordbær": ["🍓", "frukt_grønt"],
  "bringebær": ["🍓", "frukt_grønt"], "blåbær": ["🫐", "frukt_grønt"],
  "bjørnebær": ["🫐", "frukt_grønt"], "tranebær": ["🍒", "frukt_grønt"],
  "stikkelsbær": ["🫐", "frukt_grønt"], "kirsebær": ["🍒", "frukt_grønt"],
  "moreller": ["🍒", "frukt_grønt"], "pære": ["🍐", "frukt_grønt"],
  "pærer": ["🍐", "frukt_grønt"], "avokado": ["🥑", "frukt_grønt"],
  "ananas": ["🍍", "frukt_grønt"], "mango": ["🥭", "frukt_grønt"],
  "kiwi": ["🥝", "frukt_grønt"], "melon": ["🍉", "frukt_grønt"],
  "vannmelon": ["🍉", "frukt_grønt"], "galiamelon": ["🍈", "frukt_grønt"],
  "honningmelon": ["🍈", "frukt_grønt"], "klementin": ["🍊", "frukt_grønt"],
  "klementiner": ["🍊", "frukt_grønt"], "mandarin": ["🍊", "frukt_grønt"],
  "mandariner": ["🍊", "frukt_grønt"], "fersken": ["🍑", "frukt_grønt"],
  "nektarin": ["🍑", "frukt_grønt"], "plomme": ["🍑", "frukt_grønt"],
  "plommer": ["🍑", "frukt_grønt"], "pasjonsfrukt": ["🥭", "frukt_grønt"],
  "granateple": ["🍎", "frukt_grønt"], "fiken": ["🥭", "frukt_grønt"],
  "daddel": ["🥭", "frukt_grønt"], "dadler": ["🥭", "frukt_grønt"],
  "rosiner": ["🍇", "frukt_grønt"], "grapefrukt": ["🍊", "frukt_grønt"],
  "svisker": ["🍇", "frukt_grønt"], "sviske": ["🍇", "frukt_grønt"],
  "kaki": ["🍊", "frukt_grønt"], "sharon": ["🍊", "frukt_grønt"],
  "papaya": ["🥭", "frukt_grønt"], "kokosnøtt": ["🥥", "frukt_grønt"],
  "kumquat": ["🍊", "frukt_grønt"], "stjernefrukt": ["⭐", "frukt_grønt"],
  "tørket frukt": ["🍇", "frukt_grønt"], "tørket aprikos": ["🍑", "frukt_grønt"],
  "aprikos": ["🍑", "frukt_grønt"], "husholdningsfrukt": ["🍎", "frukt_grønt"],
  "skogsbær": ["🫐", "frukt_grønt"], "multe": ["🫐", "frukt_grønt"],
  "multer": ["🫐", "frukt_grønt"],

  // --- GRØNNSAKER & URTER ---
  "poteter": ["🥔", "frukt_grønt"], "potet": ["🥔", "frukt_grønt"],
  "søtpotet": ["🥔", "frukt_grønt"], "amadinepotet": ["🥔", "frukt_grønt"],
  "potetmiks": ["🥔", "frukt_grønt"], "løk": ["🧅", "frukt_grønt"],
  "rødløk": ["🧅", "frukt_grønt"], "vårløk": ["🧅", "frukt_grønt"],
  "sjalottløk": ["🧅", "frukt_grønt"], "skalottløk": ["🧅", "frukt_grønt"],
  "hvitløk": ["🧄", "frukt_grønt"], "hvitløksfedd": ["🧄", "frukt_grønt"],
  "purre": ["🥬", "frukt_grønt"], "gulrøtter": ["🥕", "frukt_grønt"],
  "gulrot": ["🥕", "frukt_grønt"], "minigulrøtter": ["🥕", "frukt_grønt"],
  "snackgulrøtter": ["🥕", "frukt_grønt"], "tomat": ["🍅", "frukt_grønt"],
  "tomater": ["🍅", "frukt_grønt"], "cherrytomat": ["🍅", "frukt_grønt"],
  "cherrytomater": ["🍅", "frukt_grønt"], "agurk": ["🥒", "frukt_grønt"],
  "salat": ["🥬", "frukt_grønt"], "isbergsalat": ["🥬", "frukt_grønt"],
  "hjertesalat": ["🥬", "frukt_grønt"], "brokkoli": ["🥦", "frukt_grønt"],
  "paprika": ["🫑", "frukt_grønt"], "spisspaprika": ["🫑", "frukt_grønt"],
  "paprika mix": ["🫑", "frukt_grønt"], "snackpaprika": ["🫑", "frukt_grønt"],
  "mais": ["🌽", "frukt_grønt"], "maiskolbe": ["🌽", "frukt_grønt"],
  "blomkål": ["🥦", "frukt_grønt"], "ruccola": ["🥬", "frukt_grønt"],
  "rucola": ["🥬", "frukt_grønt"], "spinat": ["🥬", "frukt_grønt"],
  "chili": ["🌶️", "frukt_grønt"], "jalapeno": ["🌶️", "frukt_grønt"],
  "squash": ["🥒", "frukt_grønt"], "aubergine": ["🍆", "frukt_grønt"],
  "champignon": ["🍄", "frukt_grønt"], "sopp": ["🍄", "frukt_grønt"],
  "kantarell": ["🍄", "frukt_grønt"], "aromasopp": ["🍄", "frukt_grønt"],
  "ingefær": ["🫚", "frukt_grønt"], "stangselleri": ["🥬", "frukt_grønt"],
  "sellerirot": ["🥔", "frukt_grønt"], "kålrabi": ["🥔", "frukt_grønt"],
  "kålrot": ["🥔", "frukt_grønt"], "hodekål": ["🥬", "frukt_grønt"],
  "rødkål": ["🥬", "frukt_grønt"], "sommerkål": ["🥬", "frukt_grønt"],
  "rosenkål": ["🥦", "frukt_grønt"], "sukkererter": ["🫛", "frukt_grønt"],
  "bønner": ["🫘", "frukt_grønt"], "linser": ["🫘", "frukt_grønt"],
  "kikerter": ["🫘", "frukt_grønt"], "asparges": ["🥬", "frukt_grønt"],
  "reddik": ["🧅", "frukt_grønt"], "basilikum": ["🌿", "frukt_grønt"],
  "koriander": ["🌿", "frukt_grønt"], "persille": ["🌿", "frukt_grønt"],
  "dill": ["🌿", "frukt_grønt"], "timian": ["🌿", "frukt_grønt"],
  "rosmarin": ["🌿", "frukt_grønt"], "mynte": ["🌿", "frukt_grønt"],
  "fenikkel": ["🥬", "frukt_grønt"], "fennikel": ["🥬", "frukt_grønt"],
  "pastinakk": ["🥕", "frukt_grønt"], "nepe": ["🥔", "frukt_grønt"],
  "pepperrot": ["🫚", "frukt_grønt"], "edamame": ["🫛", "frukt_grønt"],
  "vannkastanjer": ["🥫", "frukt_grønt"], "bambusskudd": ["🥫", "frukt_grønt"],
  "svarte bønner": ["🫘", "frukt_grønt"], "kidneybønner": ["🫘", "frukt_grønt"],
  "hvite bønner": ["🫘", "frukt_grønt"], "brekkbønner": ["🫛", "frukt_grønt"],
  "artisjokk": ["🥬", "frukt_grønt"],

  // --- BRØD & BAKEVARER ---
  "brød": ["🍞", "brød_bakevarer"], "kneipp": ["🍞", "brød_bakevarer"],
  "kneippbrød": ["🍞", "brød_bakevarer"], "loff": ["🍞", "brød_bakevarer"],
  "grovbrød": ["🍞", "brød_bakevarer"], "surdeigsbrød": ["🍞", "brød_bakevarer"],
  "polarbrød": ["🍞", "brød_bakevarer"], "brioche": ["🍞", "brød_bakevarer"],
  "rundstykker": ["🥐", "brød_bakevarer"], "rundstykke": ["🥐", "brød_bakevarer"],
  "knekkebrød": ["🍞", "brød_bakevarer"], "wasa": ["🍞", "brød_bakevarer"],
  "knekkebrød wasa": ["🍞", "brød_bakevarer"], "lomper": ["🌮", "brød_bakevarer"],
  "lompe": ["🌮", "brød_bakevarer"], "lompe gilde": ["🌮", "brød_bakevarer"],
  "pølsebrød": ["🌭", "brød_bakevarer"], "hamburgerbrød": ["🍔", "brød_bakevarer"],
  "baguette": ["🥖", "brød_bakevarer"], "ciabatta": ["🥖", "brød_bakevarer"],
  "croissant": ["🥐", "brød_bakevarer"], "tortilla": ["🌮", "brød_bakevarer"],
  "tortillawraps": ["🌮", "brød_bakevarer"], "pitabrød": ["🥙", "brød_bakevarer"],
  "pita": ["🥙", "brød_bakevarer"], "nanbrød": ["🫓", "brød_bakevarer"],
  "naan": ["🫓", "brød_bakevarer"], "focaccia": ["🍞", "brød_bakevarer"],
  "boller": ["🧁", "brød_bakevarer"], "kanelbolle": ["🧁", "brød_bakevarer"],
  "skolebolle": ["🧁", "brød_bakevarer"], "muffin": ["🧁", "brød_bakevarer"],
  "muffins": ["🧁", "brød_bakevarer"], "donuts": ["🍩", "brød_bakevarer"],
  "glutenfritt brød": ["🍞", "brød_bakevarer"],
  "glutenfrie rundstykker": ["🥐", "brød_bakevarer"],
  "grissini": ["🥖", "brød_bakevarer"], "kavring": ["🍞", "brød_bakevarer"],
  "riskaker": ["🍘", "brød_bakevarer"], "pizzabunn": ["🍕", "brød_bakevarer"],
  "pizzadeig fersk": ["🍕", "brød_bakevarer"], "paideig": ["🥧", "brød_bakevarer"],
  "butterdeig": ["🥐", "brød_bakevarer"],

  // --- KJØTT, FISK & PÅLEGG ---
  "kylling": ["🍗", "kjøtt_fisk"], "kyllingfilet": ["🍗", "kjøtt_fisk"],
  "kyllingkjøttdeig": ["🥩", "kjøtt_fisk"], "kyllingvinger": ["🍗", "kjøtt_fisk"],
  "grillkylling": ["🍗", "kjøtt_fisk"], "kyllingstrimler": ["🍗", "kjøtt_fisk"],
  "kyllingkjøttboller": ["🧆", "kjøtt_fisk"], "kalkun": ["🍗", "kjøtt_fisk"],
  "kalkunpålegg": ["🍖", "kjøtt_fisk"], "kalkunbryst": ["🍗", "kjøtt_fisk"],
  "andebryst": ["🍗", "kjøtt_fisk"], "and": ["🍗", "kjøtt_fisk"],
  "kjøttdeig": ["🥩", "kjøtt_fisk"], "karbonadedeig": ["🥩", "kjøtt_fisk"],
  "familiedeig": ["🥩", "kjøtt_fisk"], "kjøttdeig svin": ["🥩", "kjøtt_fisk"],
  "medisterdeig": ["🥩", "kjøtt_fisk"], "biff": ["🥩", "kjøtt_fisk"],
  "indrefilet": ["🥩", "kjøtt_fisk"], "ytrefilet": ["🥩", "kjøtt_fisk"],
  "entrecote": ["🥩", "kjøtt_fisk"], "storfekjøtt": ["🥩", "kjøtt_fisk"],
  "renskåret kjøtt": ["🥩", "kjøtt_fisk"], "hakket kjøtt": ["🥩", "kjøtt_fisk"],
  "grytekjøtt": ["🥩", "kjøtt_fisk"], "biffstrimler": ["🥩", "kjøtt_fisk"],
  "kjøtt": ["🥩", "kjøtt_fisk"], "kjøttkaker": ["🧆", "kjøtt_fisk"],
  "kjøttboller": ["🧆", "kjøtt_fisk"], "medisterkaker": ["🧆", "kjøtt_fisk"],
  "svinekjøtt": ["🥩", "kjøtt_fisk"], "svinekoteletter": ["🥩", "kjøtt_fisk"],
  "svinefilet": ["🥩", "kjøtt_fisk"], "svinestrimler": ["🥩", "kjøtt_fisk"],
  "skinkesteik": ["🥩", "kjøtt_fisk"], "skinkestek": ["🥩", "kjøtt_fisk"],
  "oksesteik": ["🥩", "kjøtt_fisk"], "lammekjøtt": ["🥩", "kjøtt_fisk"],
  "lammekoteletter": ["🥩", "kjøtt_fisk"], "lammelår": ["🥩", "kjøtt_fisk"],
  "lammelår skivet": ["🥩", "kjøtt_fisk"], "fårikålkjøtt": ["🥩", "kjøtt_fisk"],
  "pinnekjøtt": ["🥩", "kjøtt_fisk"], "ribbe": ["🥩", "kjøtt_fisk"],
  "juleribbe": ["🥩", "kjøtt_fisk"], "reinsdyrkjøtt": ["🥩", "kjøtt_fisk"],
  "finnbiff": ["🥩", "kjøtt_fisk"], "viltskav": ["🥩", "kjøtt_fisk"],
  "hjortekjøtt": ["🥩", "kjøtt_fisk"], "elgkjøtt": ["🥩", "kjøtt_fisk"],
  "bacon": ["🥓", "kjøtt_fisk"], "pølser": ["🌭", "kjøtt_fisk"],
  "pølse": ["🌭", "kjøtt_fisk"], "gilde": ["🥩", "kjøtt_fisk"],
  "wienerpølse": ["🌭", "kjøtt_fisk"], "grillpølse": ["🌭", "kjøtt_fisk"],
  "vossakorv": ["🌭", "kjøtt_fisk"], "mørkølpølse": ["🌭", "kjøtt_fisk"],
  "medisterpølse": ["🌭", "kjøtt_fisk"], "julepølse": ["🌭", "kjøtt_fisk"],
  "skinke": ["🍖", "kjøtt_fisk"], "kokeskinke": ["🍖", "kjøtt_fisk"],
  "kjøttpålegg": ["🍖", "kjøtt_fisk"], "hamburger": ["🍔", "kjøtt_fisk"],
  "burgere": ["🍔", "kjøtt_fisk"], "leverpostei": ["🥫", "kjøtt_fisk"],
  "stabburet": ["🥫", "kjøtt_fisk"], "salami": ["🥩", "kjøtt_fisk"],
  "fårepølse": ["🥩", "kjøtt_fisk"], "spekeskinke": ["🥓", "kjøtt_fisk"],
  "fenalår": ["🥩", "kjøtt_fisk"], "spekepølse": ["🥩", "kjøtt_fisk"],
  "morrpølse": ["🥩", "kjøtt_fisk"], "sylte": ["🥩", "kjøtt_fisk"],
  "pastrami": ["🥩", "kjøtt_fisk"], "roastbiff": ["🥩", "kjøtt_fisk"],
  "syltelabb": ["🥩", "kjøtt_fisk"], "fisk": ["🐟", "kjøtt_fisk"],
  "laks": ["🐟", "kjøtt_fisk"], "laksefilet": ["🐟", "kjøtt_fisk"],
  "røkt laks": ["🐟", "kjøtt_fisk"], "gravlaks": ["🐟", "kjøtt_fisk"],
  "torsk": ["🐟", "kjøtt_fisk"], "torskefilet": ["🐟", "kjøtt_fisk"],
  "sei": ["🐟", "kjøtt_fisk"], "seifilet": ["🐟", "kjøtt_fisk"],
  "seiblokk": ["🐟", "kjøtt_fisk"], "fiskepinner": ["🐟", "kjøtt_fisk"],
  "fiskekaker": ["🐟", "kjøtt_fisk"], "fiskepudding": ["🐟", "kjøtt_fisk"],
  "fiskeboller": ["🥫", "kjøtt_fisk"], "panert fisk": ["🐟", "kjøtt_fisk"],
  "fiskefilet": ["🐟", "kjøtt_fisk"], "røkt kolje": ["🐟", "kjøtt_fisk"],
  "klippfisk": ["🐟", "kjøtt_fisk"], "lutefisk": ["🐟", "kjøtt_fisk"],
  "rakfisk": ["🐟", "kjøtt_fisk"], "sild": ["🐟", "kjøtt_fisk"],
  "tomatsild": ["🐟", "kjøtt_fisk"], "sursild": ["🐟", "kjøtt_fisk"],
  "reker": ["🦐", "kjøtt_fisk"], "scampi": ["🦐", "kjøtt_fisk"],
  "krabbe": ["🦀", "kjøtt_fisk"], "crabstick": ["🦀", "kjøtt_fisk"],
  "surimi": ["🦀", "kjøtt_fisk"], "blåskjell": ["🦪", "kjøtt_fisk"],
  "østers": ["🦪", "kjøtt_fisk"], "makrell i tomat": ["🐟", "kjøtt_fisk"],
  "stabbur-makrell": ["🐟", "kjøtt_fisk"], "tunfisk": ["🥫", "kjøtt_fisk"],
  "kaviar": ["🐟", "kjøtt_fisk"], "mills kaviar": ["🐟", "kjøtt_fisk"],
  "italiensk salat": ["🥗", "kjøtt_fisk"], "rekesalat": ["🥗", "kjøtt_fisk"],
  "kyllingsalat": ["🥗", "kjøtt_fisk"], "egg-salat": ["🥗", "kjøtt_fisk"],
  "krabbesalat": ["🥗", "kjøtt_fisk"], "rødbetsalat": ["🥗", "kjøtt_fisk"],
  "potetsalat": ["🥗", "kjøtt_fisk"], "waldorfsalat": ["🥗", "kjøtt_fisk"],
  "vegansk kjøttdeig": ["🥩", "kjøtt_fisk"], "veganske pølser": ["🌭", "kjøtt_fisk"],
  "tofu": ["⬜", "kjøtt_fisk"], "tofublokk": ["⬜", "kjøtt_fisk"],

  // --- MEIERI, MELK & JUICE ---
  "melk": ["🥛", "meieri_melk"], "helmelk": ["🥛", "meieri_melk"],
  "lettmelk": ["🥛", "meieri_melk"], "skummetmelk": ["🥛", "meieri_melk"],
  "ekstra lettmelk": ["🥛", "meieri_melk"], "kulturmelk": ["🥛", "meieri_melk"],
  "kefir": ["🥛", "meieri_melk"], "havremelk": ["🥛", "meieri_melk"],
  "soyamelk": ["🥛", "meieri_melk"], "mandelmelk": ["🥛", "meieri_melk"],
  "gryr": ["🥛", "meieri_melk"], "oatly": ["🥛", "meieri_melk"],
  "laktosefri melk": ["🥛", "meieri_melk"], "syret melk": ["🥛", "meieri_melk"],
  "juice": ["🧃", "meieri_melk"], "appelsinjuice": ["🧃", "meieri_melk"],
  "eplejuice": ["🧃", "meieri_melk"], "tropisk juice": ["🧃", "meieri_melk"],
  "smoothie": ["🥤", "meieri_melk"], "meierienes": ["🧃", "meieri_melk"],
  "fløte": ["🥛", "meieri_melk"], "kremfløte": ["🥛", "meieri_melk"],
  "matfløte": ["🥛", "meieri_melk"], "rømme": ["🥛", "meieri_melk"],
  "seterrømme": ["🥛", "meieri_melk"], "lettrømme": ["🥛", "meieri_melk"],
  "lett-rømme": ["🥛", "meieri_melk"], "creme fraiche": ["🥛", "meieri_melk"],
  "crème fraîche": ["🥛", "meieri_melk"], "rømmekoll": ["🥛", "meieri_melk"],
  "kvarg": ["🥣", "meieri_melk"], "yoghurt": ["🥣", "meieri_melk"],
  "gresk yoghurt": ["🥣", "meieri_melk"], "turkisk yoghurt": ["🥣", "meieri_melk"],
  "vaniljeyoghurt": ["🥣", "meieri_melk"], "kesam": ["🥣", "meieri_melk"],
  "cottage cheese": ["🥣", "meieri_melk"], "skyr": ["🥣", "meieri_melk"],
  "yoplait": ["🥣", "meieri_melk"], "yt": ["🥛", "meieri_melk"],
  "ost": ["🧀", "meieri_melk"], "gulost": ["🧀", "meieri_melk"],
  "brunost": ["🧀", "meieri_melk"], "fløtemysost": ["🧀", "meieri_melk"],
  "gudbrandsdalsost": ["🧀", "meieri_melk"], "norvegia": ["🧀", "meieri_melk"],
  "jarlsberg": ["🧀", "meieri_melk"], "parmesan": ["🧀", "meieri_melk"],
  "grana padano": ["🧀", "meieri_melk"], "mozzarella": ["🧀", "meieri_melk"],
  "fetaost": ["🧀", "meieri_melk"], "feta": ["🧀", "meieri_melk"],
  "kremost": ["🧀", "meieri_melk"], "tine kremost": ["🧀", "meieri_melk"],
  "brie": ["🧀", "meieri_melk"], "camembert": ["🧀", "meieri_melk"],
  "blåmuggost": ["🧀", "meieri_melk"], "cheddar": ["🧀", "meieri_melk"],
  "revet ost": ["🧀", "meieri_melk"], "revet mozzarella": ["🧀", "meieri_melk"],
  "revet cheddar": ["🧀", "meieri_melk"], "hamburgerost": ["🧀", "meieri_melk"],
  "smøreost": ["🧀", "meieri_melk"], "baconost": ["🧀", "meieri_melk"],
  "rekeost": ["🧀", "meieri_melk"], "skinkeost": ["🧀", "meieri_melk"],
  "jalapenoost": ["🧀", "meieri_melk"], "prim": ["🧀", "meieri_melk"],
  "prim litago": ["🧀", "meieri_melk"], "pultost": ["🧀", "meieri_melk"],
  "gammelost": ["🧀", "meieri_melk"], "provolone": ["🧀", "meieri_melk"],
  "ricotta": ["🧀", "meieri_melk"], "mascarpone": ["🧀", "meieri_melk"],
  "halloumi": ["🧀", "meieri_melk"], "salatost": ["🧀", "meieri_melk"],
  "vegansk ost": ["🧀", "meieri_melk"], "pizzadeig": ["🍞", "meieri_melk"],
  "smør": ["🧈", "meieri_melk"], "margarin": ["🧈", "meieri_melk"],
  "bremykt": ["🧈", "meieri_melk"], "melange": ["🧈", "meieri_melk"],
  "olivero": ["🧈", "meieri_melk"], "egg": ["🥚", "meieri_melk"],
  "tzatziki": ["🥣", "meieri_melk"], "hummus": ["🥣", "meieri_melk"],
  "rømmedipp": ["🥣", "meieri_melk"], "guacamole": ["🥑", "meieri_melk"],
  "vaniljesaus": ["🥛", "meieri_melk"],

  // --- FROKOST & KAFFE ---
  "kaffe": ["☕", "frokost_kaffe"], "kaffebønner": ["☕", "frokost_kaffe"],
  "pulverkaffe": ["☕", "frokost_kaffe"], "nescafe": ["☕", "frokost_kaffe"],
  "evergood": ["☕", "frokost_kaffe"], "ali kaffe": ["☕", "frokost_kaffe"],
  "nespresso": ["☕", "frokost_kaffe"], "kaffekapsler": ["☕", "frokost_kaffe"],
  "te": ["🍵", "frokost_kaffe"], "earl grey": ["🍵", "frokost_kaffe"],
  "grønn te": ["🍵", "frokost_kaffe"], "fruktté": ["🍵", "frokost_kaffe"],
  "kakaopulver": ["☕", "frokost_kaffe"], "oboy": ["🍫", "frokost_kaffe"],
  "nesquik": ["🍫", "frokost_kaffe"], "havregryn": ["🥣", "frokost_kaffe"],
  "havregryn store": ["🥣", "frokost_kaffe"], "havregryn lettkokte": ["🥣", "frokost_kaffe"],
  "müsli": ["🥣", "frokost_kaffe"], "müsli frukt": ["🥣", "frokost_kaffe"],
  "granola": ["🥣", "frokost_kaffe"], "frokostblanding": ["🥣", "frokost_kaffe"],
  "cornflakes": ["🥣", "frokost_kaffe"], "cheerios": ["🥣", "frokost_kaffe"],
  "syltetøy": ["🍓", "frokost_kaffe"], "jordbærsyltetøy": ["🍓", "frokost_kaffe"],
  "hallonsyltetøy": ["🍓", "frokost_kaffe"], "blåbærsyltetøy": ["🫐", "frokost_kaffe"],
  "nora": ["🍓", "frokost_kaffe"], "nugatti": ["🍫", "frokost_kaffe"],
  "sjokade": ["🍫", "frokost_kaffe"], "nutella": ["🍫", "frokost_kaffe"],
  "sunda": ["🍫", "frokost_kaffe"], "hapå": ["🍯", "frokost_kaffe"],
  "peanøttsmør": ["🥜", "frokost_kaffe"], "marmelade": ["🍊", "frokost_kaffe"],

  // --- MIDDAG & TØRRMAT ---
  "mel": ["🌾", "middag_tørrmat"], "hvetemel": ["🌾", "middag_tørrmat"],
  "siktet hvetemel": ["🌾", "middag_tørrmat"], "sammalt hvetemel": ["🌾", "middag_tørrmat"],
  "rugmel": ["🌾", "middag_tørrmat"], "speltmel": ["🌾", "middag_tørrmat"],
  "potetmel": ["🌾", "middag_tørrmat"], "maizena": ["🌾", "middag_tørrmat"],
  "mandelmel": ["🌾", "middag_tørrmat"], "havremel": ["🌾", "middag_tørrmat"],
  "glutenfritt mel": ["🌾", "middag_tørrmat"], "gjær": ["🍞", "middag_tørrmat"],
  "tørrgjær": ["🍞", "middag_tørrmat"], "bakepulver": ["🧁", "middag_tørrmat"],
  "natron": ["🧁", "middag_tørrmat"], "vaniljesukker": ["🧁", "middag_tørrmat"],
  "kakao": ["🍫", "middag_tørrmat"], "selskapschokolade": ["🍫", "middag_tørrmat"],
  "selskapssjokolade": ["🍫", "middag_tørrmat"], "mørk kokesjokolade": ["🍫", "middag_tørrmat"],
  "lys kokesjokolade": ["🍫", "middag_tørrmat"], "hvit kokesjokolade": ["🍫", "middag_tørrmat"],
  "sjokoladeknapper": ["🍫", "middag_tørrmat"], "marsipan": ["🍬", "middag_tørrmat"],
  "kokosmasse": ["🥥", "middag_tørrmat"], "konditorfarge": ["🎨", "middag_tørrmat"],
  "kakepynt": ["✨", "middag_tørrmat"], "gelepulver": ["🍓", "middag_tørrmat"],
  "ris": ["🍚", "middag_tørrmat"], "jasminris": ["🍚", "middag_tørrmat"],
  "basmatiris": ["🍚", "middag_tørrmat"], "middagsris": ["🍚", "middag_tørrmat"],
  "grøt ris": ["🍚", "middag_tørrmat"], "risgrøt": ["🍚", "middag_tørrmat"],
  "sushi ris": ["🍚", "middag_tørrmat"], "sushi-ris": ["🍚", "middag_tørrmat"],
  "bulgur": ["🌾", "middag_tørrmat"], "couscous": ["🌾", "middag_tørrmat"],
  "quinoa": ["🌾", "middag_tørrmat"], "pasta": ["🍝", "middag_tørrmat"],
  "spaghetti": ["🍝", "middag_tørrmat"], "macaroni": ["🍝", "middag_tørrmat"],
  "makaroni": ["🍝", "middag_tørrmat"], "penne": ["🍝", "middag_tørrmat"],
  "fusilli": ["🍝", "middag_tørrmat"], "lasagneplater": ["🍝", "middag_tørrmat"],
  "glutenfri pasta": ["🍝", "middag_tørrmat"], "nudler": ["🍜", "middag_tørrmat"],
  "yum yum": ["🍜", "middag_tørrmat"], "egg-nudler": ["🍜", "middag_tørrmat"],
  "glassnudler": ["🍜", "middag_tørrmat"], "ramen": ["🍜", "middag_tørrmat"],
  "sukker": ["🍬", "middag_tørrmat"], "farin": ["🍬", "middag_tørrmat"],
  "brunt sukker": ["🍬", "middag_tørrmat"], "melis": ["🍬", "middag_tørrmat"],
  "honning": ["🍯", "middag_tørrmat"], "sirup": ["🍯", "middag_tørrmat"],
  "salt": ["🧂", "middag_tørrmat"], "bordsalt": ["🧂", "middag_tørrmat"],
  "havsalt": ["🧂", "middag_tørrmat"], "maldonsalt": ["🧂", "middag_tørrmat"],
  "pepper": ["🧂", "middag_tørrmat"], "svart pepper": ["🧂", "middag_tørrmat"],
  "grillkrydder": ["🧂", "middag_tørrmat"], "piffi": ["🧂", "middag_tørrmat"],
  "aromat": ["🧂", "middag_tørrmat"], "oregano": ["🌿", "middag_tørrmat"],
  "paprikakrydder": ["🧂", "middag_tørrmat"], "spisskummen": ["🧂", "middag_tørrmat"],
  "kanel": ["🧂", "middag_tørrmat"], "kardemomme": ["🧂", "middag_tørrmat"],
  "nellik": ["🧂", "middag_tørrmat"], "muskatnøtt": ["🧂", "middag_tørrmat"],
  "gurkemeie": ["🧂", "middag_tørrmat"], "curry": ["🧂", "middag_tørrmat"],
  "karri": ["🧂", "middag_tørrmat"], "chiliflakes": ["🌶️", "middag_tørrmat"],
  "løkpudder": ["🧂", "middag_tørrmat"], "hvitløkspulver": ["🧂", "middag_tørrmat"],
  "olje": ["🫒", "middag_tørrmat"], "rapsolje": ["🫒", "middag_tørrmat"],
  "olivenolje": ["🫒", "middag_tørrmat"], "solsikkeolje": ["🫒", "middag_tørrmat"],
  "sesamolje": ["🫒", "middag_tørrmat"], "soyaolje": ["🫒", "middag_tørrmat"],
  "eddik": ["🫙", "middag_tørrmat"], "vineddik": ["🫙", "middag_tørrmat"],
  "balsamico": ["🫙", "middag_tørrmat"], "sushi eddik": ["🫙", "middag_tørrmat"],
  "hermetiske tomater": ["🥫", "middag_tørrmat"], "hakkede tomater": ["🥫", "middag_tørrmat"],
  "tomatpuré": ["🥫", "middag_tørrmat"], "tomatsaus": ["🥫", "middag_tørrmat"],
  "pesto": ["🫙", "middag_tørrmat"], "grønn pesto": ["🫙", "middag_tørrmat"],
  "rød pesto": ["🫙", "middag_tørrmat"], "pastasaus": ["🫙", "middag_tørrmat"],
  "dolmio": ["🫙", "middag_tørrmat"], "pizzasaus": ["🍅", "middag_tørrmat"],
  "taco": ["🌮", "middag_tørrmat"], "tacosaus": ["🌮", "middag_tørrmat"],
  "tacoskjell": ["🌮", "middag_tørrmat"], "taco-skjell": ["🌮", "middag_tørrmat"],
  "tacokrydder": ["🧂", "middag_tørrmat"], "salsa": ["🌮", "middag_tørrmat"],
  "tortillachips": ["🌮", "middag_tørrmat"], "nachos": ["🌮", "middag_tørrmat"],
  "buljong": ["🥫", "middag_tørrmat"], "kjøttbuljong": ["🥫", "middag_tørrmat"],
  "grønnsaksbuljong": ["🥫", "middag_tørrmat"], "kyllingbuljong": ["🥫", "middag_tørrmat"],
  "soyasaus": ["🫙", "middag_tørrmat"], "sweet chili": ["🫙", "middag_tørrmat"],
  "kokosmelk": ["🥥", "middag_tørrmat"], "kokosmelk light": ["🥥", "middag_tørrmat"],
  "ketsjup": ["🍅", "middag_tørrmat"], "idun ketsjup": ["🍅", "middag_tørrmat"],
  "sennep": ["🌭", "middag_tørrmat"], "bergbys": ["🌭", "middag_tørrmat"],
  "majones": ["🫙", "middag_tørrmat"], "mills majones": ["🫙", "middag_tørrmat"],
  "aioli": ["🧄", "middag_tørrmat"], "dressing": ["🥗", "middag_tørrmat"],
  "bearnaise": ["🫙", "middag_tørrmat"], "peppersaus": ["🫙", "middag_tørrmat"],
  "brun saus": ["🫙", "middag_tørrmat"], "fløtesaus": ["🫙", "middag_tørrmat"],
  "curry paste": ["🫙", "middag_tørrmat"], "teriyaki": ["🫙", "middag_tørrmat"],
  "sriracha": ["🌶️", "middag_tørrmat"], "fiskesaus": ["🫙", "middag_tørrmat"],
  "oystersaus": ["🫙", "middag_tørrmat"], "hoisinsaus": ["🫙", "middag_tørrmat"],
  "wasabi": ["🟢", "middag_tørrmat"], "nori": ["🍙", "middag_tørrmat"],
  "sesamfrø": ["🌱", "middag_tørrmat"], "chiafrø": ["🌱", "middag_tørrmat"],
  "flatbrød": ["🍞", "middag_tørrmat"], "sprøløk": ["🧅", "middag_tørrmat"],
  "surkål": ["🥬", "middag_tørrmat"], "sylteagurk": ["🥒", "middag_tørrmat"],
  "rødbeter": ["🧅", "middag_tørrmat"], "panko": ["🍞", "middag_tørrmat"],
  "toro": ["📦", "middag_tørrmat"], "tomatsuppe": ["🍲", "middag_tørrmat"],
  "fiskesuppe": ["🍲", "middag_tørrmat"],

  // --- HUS, HJEM & RENGJØRING ---
  "oppvaskmiddel": ["🧴", "hus_hjem"], "zalo": ["🧴", "hus_hjem"],
  "oppvaskmaskintabletter": ["🧽", "hus_hjem"], "sun": ["🧽", "hus_hjem"],
  "vaskemiddel": ["🧺", "hus_hjem"], "tøymykner": ["🧴", "hus_hjem"],
  "comfort": ["🧴", "hus_hjem"], "blenda": ["🧺", "hus_hjem"],
  "milo": ["🧺", "hus_hjem"], "klorin": ["🧴", "hus_hjem"],
  "salmiakk": ["🧴", "hus_hjem"], "jif": ["🧴", "hus_hjem"],
  "oppvaskbørste": ["🧹", "hus_hjem"], "kjøkkenklut": ["🧽", "hus_hjem"],
  "svamp": ["🧽", "hus_hjem"], "mikrofiberklut": ["🧽", "hus_hjem"],
  "støvsugerposer": ["🧹", "hus_hjem"], "bakepapir": ["📜", "hus_hjem"],
  "folie": ["📄", "hus_hjem"], "alufolie": ["📄", "hus_hjem"],
  "plastfolie": ["📄", "hus_hjem"], "gladpack": ["📄", "hus_hjem"],
  "fryseposer": ["🛍️", "hus_hjem"], "ziplock": ["🛍️", "hus_hjem"],
  "søppelposer": ["🗑️", "hus_hjem"], "avfallsposer": ["🗑️", "hus_hjem"],
  "handlepose": ["🛍️", "hus_hjem"], "poser": ["🛍️", "hus_hjem"],
  "telys": ["🕯️", "hus_hjem"], "kronelys": ["🕯️", "hus_hjem"],
  "fyrstikker": ["🔥", "hus_hjem"], "tennvæske": ["🔥", "hus_hjem"],
  "ved": ["🪵", "hus_hjem"], "batterier": ["🔋", "hus_hjem"],
  "lyspære": ["💡", "hus_hjem"], "blomsterjord": ["🪴", "hus_hjem"],
  "hundemat": ["🐶", "hus_hjem"], "hundefôr": ["🐶", "hus_hjem"],
  "kattemat": ["🐱", "hus_hjem"], "kattefôr": ["🐱", "hus_hjem"],
  "kattesand": ["🐱", "hus_hjem"], "bæsjeposer": ["🐶", "hus_hjem"],

  // --- PERSONLIG PLEIE & HYGIENE ---
  "toalettpapir": ["🧻", "personlig_pleie"], "dopapir": ["🧻", "personlig_pleie"],
  "lambi": ["🧻", "personlig_pleie"], "tørkerull": ["🧻", "personlig_pleie"],
  "servietter": ["🧻", "personlig_pleie"], "tannkrem": ["🪥", "personlig_pleie"],
  "solidox": ["🪥", "personlig_pleie"], "colgate": ["🪥", "personlig_pleie"],
  "tannbørste": ["🪥", "personlig_pleie"], "tanntråd": ["🪥", "personlig_pleie"],
  "munnskyll": ["🧴", "personlig_pleie"], "såpe": ["🧼", "personlig_pleie"],
  "håndsåpe": ["🧼", "personlig_pleie"], "lano": ["🧼", "personlig_pleie"],
  "sjampo": ["🧴", "personlig_pleie"], "shampoo": ["🧴", "personlig_pleie"],
  "balsam": ["🧴", "personlig_pleie"], "define": ["🧴", "personlig_pleie"],
  "dusjsåpe": ["🧼", "personlig_pleie"], "deodorant": ["🧴", "personlig_pleie"],
  "deo": ["🧴", "personlig_pleie"], "fuktighetskrem": ["🧴", "personlig_pleie"],
  "solkrem": ["☀️", "personlig_pleie"], "antibac": ["🧴", "personlig_pleie"],
  "paracet": ["💊", "personlig_pleie"], "ibux": ["💊", "personlig_pleie"],
  "plaster": ["🩹", "personlig_pleie"], "nesespray": ["💧", "personlig_pleie"],
  "otrivin": ["💧", "personlig_pleie"], "halstabletter": ["🍬", "personlig_pleie"],
  "tran": ["🐟", "personlig_pleie"], "vitaminer": ["💊", "personlig_pleie"],
  "omega 3": ["💊", "personlig_pleie"], "barberhøvel": ["🪒", "personlig_pleie"],
  "barberskum": ["🪒", "personlig_pleie"], "gillette": ["🪒", "personlig_pleie"],
  "bind": ["🧻", "personlig_pleie"], "tamponger": ["🧻", "personlig_pleie"],
  "libresse": ["🧻", "personlig_pleie"], "bomullspads": ["☁️", "personlig_pleie"],
  "q-tips": ["☁️", "personlig_pleie"], "bleier": ["👶", "personlig_pleie"],
  "pampers": ["👶", "personlig_pleie"], "libero": ["👶", "personlig_pleie"],
  "våtservietter": ["🧻", "personlig_pleie"], "barnemat": ["👶", "personlig_pleie"],
  "morsmelkerstatning": ["🍼", "personlig_pleie"],

  // --- FRYSEVARER & IS ---
  "is": ["🍦", "frys"], "krone-is": ["🍦", "frys"],
  "kroneis": ["🍦", "frys"], "saftis": ["🍧", "frys"],
  "fløteis": ["🍨", "frys"], "iskrem": ["🍨", "frys"],
  "småis": ["🍦", "frys"], "diplom-is": ["🍨", "frys"],
  "henig olsen": ["🍨", "frys"], "ben & jerrys": ["🍨", "frys"],
  "frosne grønnsaker": ["🥦", "frys"], "erter": ["🫛", "frys"],
  "frosne erter": ["🫛", "frys"], "frossenblanding": ["🥦", "frys"],
  "wokblanding": ["🥦", "frys"], "frosne bær": ["🫐", "frys"],
  "frosne jordbær": ["🍓", "frys"], "frossenpizza": ["🍕", "frys"],
  "grandiosa": ["🍕", "frys"], "big one": ["🍕", "frys"],
  "dr oetker": ["🍕", "frys"], "pommes frites": ["🍟", "frys"],
  "pommfritt": ["🍟", "frys"], "søtpotetfries": ["🍟", "frys"],
  "kyllingnuggets": ["🍗", "frys"], "isposer": ["🧊", "frys"],
  "isbitposer": ["🧊", "frys"],

  // --- DRIKKE & MINERALVANN ---
  "vann": ["💧", "drikke"], "farris": ["💧", "drikke"],
  "ramlösa": ["💧", "drikke"], "brus": ["🥤", "drikke"],
  "coca cola": ["🥤", "drikke"], "cola": ["🥤", "drikke"],
  "cola zero": ["🥤", "drikke"], "pepsi": ["🥤", "drikke"],
  "pepsi max": ["🥤", "drikke"], "solo": ["🥤", "drikke"],
  "fanta": ["🥤", "drikke"], "sprite": ["🥤", "drikke"],
  "urge": ["🥤", "drikke"], "julebrus": ["🥤", "drikke"],
  "øl": ["🍺", "drikke"], "pils": ["🍺", "drikke"],
  "tuborg": ["🍺", "drikke"], "ringnes": ["🍺", "drikke"],
  "carlsberg": ["🍺", "drikke"], "vørterøl": ["🍺", "drikke"],
  "alkoholfritt øl": ["🍺", "drikke"], "cider": ["🍺", "drikke"],
  "vin": ["🍷", "drikke"], "alkoholfri vin": ["🍷", "drikke"],
  "energidrikk": ["⚡", "drikke"], "red bull": ["⚡", "drikke"],
  "monster": ["⚡", "drikke"], "battery": ["⚡", "drikke"],
  "is-te": ["🧃", "drikke"], "iste": ["🧃", "drikke"],
  "iskaffe": ["🧃", "drikke"], "tine iskaffe": ["🧃", "drikke"],
  "saft": ["🧃", "drikke"], "fun light": ["🧃", "drikke"],
  "ingefærøl": ["🍺", "drikke"], "tonic": ["🥤", "drikke"],

  // --- SNACKS & GODTERI ---
  "sjokolade": ["🍫", "snacks_godteri"], "kvikk lunsj": ["🍫", "snacks_godteri"],
  "freia": ["🍫", "snacks_godteri"], "melkesjokolade": ["🍫", "snacks_godteri"],
  "firkløver": ["🍫", "snacks_godteri"], "stratos": ["🍫", "snacks_godteri"],
  "troika": ["🍫", "snacks_godteri"], "smil": ["🍫", "snacks_godteri"],
  "snickers": ["🍫", "snacks_godteri"], "mars": ["🍫", "snacks_godteri"],
  "twix": ["🍫", "snacks_godteri"], "kinder": ["🍫", "snacks_godteri"],
  "smågodt": ["🍬", "snacks_godteri"], "godteri": ["🍬", "snacks_godteri"],
  "seigmenn": ["🍬", "snacks_godteri"], "kjeks": ["🍪", "snacks_godteri"],
  "oreo": ["🍪", "snacks_godteri"], "bixit": ["🍪", "snacks_godteri"],
  "mariekjeks": ["🍪", "snacks_godteri"], "ritz": ["🍪", "snacks_godteri"],
  "chips": ["🍿", "snacks_godteri"], "potetgull": ["🍿", "snacks_godteri"],
  "maarud": ["🍿", "snacks_godteri"], "kims": ["🍿", "snacks_godteri"],
  "sørlandschips": ["🍿", "snacks_godteri"], "pringles": ["🍿", "snacks_godteri"],
  "doritos": ["🌮", "snacks_godteri"], "bacongull": ["🥓", "snacks_godteri"],
  "ostepop": ["🧀", "snacks_godteri"], "cheez doodles": ["🧀", "snacks_godteri"],
  "nøtter": ["🥜", "snacks_godteri"], "peanøtter": ["🥜", "snacks_godteri"],
  "cashewnøtter": ["🥜", "snacks_godteri"], "chilinøtter": ["🥜", "snacks_godteri"],
  "mandler": ["🥜", "snacks_godteri"], "valnøtter": ["🥜", "snacks_godteri"],
  "popkorn": ["🍿", "snacks_godteri"], "popcorn": ["🍿", "snacks_godteri"],
  "mikropop": ["🍿", "snacks_godteri"], "dip": ["🥣", "snacks_godteri"],
  "holiday dip": ["🥣", "snacks_godteri"], "tyggegummi": ["🍬", "snacks_godteri"],
  "extra": ["🍬", "snacks_godteri"], "lackerol": ["🍬", "snacks_godteri"],
  "läkerol": ["🍬", "snacks_godteri"], "dent": ["🍬", "snacks_godteri"],
  "ifa": ["🍬", "snacks_godteri"], "laban": ["🍬", "snacks_godteri"],
  "non stop": ["🍬", "snacks_godteri"], "haribo": ["🍬", "snacks_godteri"],
  "lakris": ["🍬", "snacks_godteri"], "proteinbar": ["🍫", "snacks_godteri"],
  "barebells": ["🍫", "snacks_godteri"],

  // --- ANNET & KASSEVARER ---
  "blomster": ["💐", "annet"], "roser": ["🌹", "annet"],
  "tulipan": ["🌷", "annet"], "snus": ["🫙", "annet"],
  "skruf": ["🫙", "annet"], "epok": ["🫙", "annet"],
  "snus bokser": ["🫙", "annet"], "tobakk": ["🚬", "annet"],
  "sigaretter": ["🚬", "annet"]
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
  var $inputMulti = document.getElementById("sl-input-multi");
  var $multiToggle = document.getElementById("sl-multi-toggle");
  var $add = document.getElementById("sl-add");
  var flerModus = false;
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

  // Selve "legg til én vare"-logikken, uten lagring/rendring.
  // Brukes både for enkeltvarer og for hver vare i en bulk-innlegging,
  // slik at vi bare lagrer og rendrer én gang uansett hvor mange varer som legges til.
  function leggTilEnVare(name) {
    var existing = items.find(function (i) { return i.name.toLowerCase() === name.toLowerCase(); });
    if (existing) {
      existing.qty += 1;
    } else {
      var info = guessInfo(name);
      items.push({ name: name, icon: info.icon, category: info.category, qty: 1, plukket: false });
    }

    var known = history.some(function (h) { return h.toLowerCase() === name.toLowerCase(); });
    if (!known) history.push(name);
  }

  function addItem(rawName) {
    var name = (rawName || "").trim();
    if (!name) return;

    leggTilEnVare(name);
    saveState();

    $input.value = "";
    hideSuggestions();
    render();
    $input.focus();
  }

  // Fjerner kulepunkt/tall-prefiks fra starten av en linje, f.eks.
  // "- Melk", "• Brød", "1. Egg" eller "2) Smør" blir til "Melk", "Brød", "Egg", "Smør".
  function rensVarelinje(linje) {
    return linje.replace(/^\s*(?:[-•*]+|\d+[.)])\s*/, "").trim();
  }

  // Kjenner igjen en linje som BARE er en mengde, f.eks. "3,5 dl", "100 g",
  // "1 stk" eller "1/2 ts" – typisk når man limer inn en oppskrift der
  // mengde og varenavn står på hver sin linje.
  var MENGDE_REGEX = /^(\d+\/\d+|\d+(?:[.,]\d+)?)\s*(ss|ts|dl|cl|ml|l|kg|g|mg|stk|boks|bokser|pose|poser|fedd|skive|skiver|klype|knivsodd|pk)\.?$/i;

  function erMengdeLinje(linje) {
    return MENGDE_REGEX.test(linje.trim());
  }

  // Splitter limt inn tekst på linjeskift. Hvis en linje bare er en mengde
  // (og neste linje ikke også er det), slås den sammen med varenavnet på
  // neste linje som tilleggsinfo i parentes – f.eks. "3,5 dl" + "hvetemel"
  // blir til "hvetemel (3,5 dl)". Linjer som ikke slås sammen kan fortsatt
  // inneholde flere varer skilt med komma/semikolon, som før.
  //
  // Sammenslåtte linjer splittes IKKE videre på komma, slik at et desimaltall
  // skrevet med komma (f.eks. "3,5 dl") ikke kuttes feil i to.
  function parseFlereVarer(tekst) {
    var linjer = (tekst || "")
      .split(/\n+/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });

    var resultat = [];
    var i = 0;
    while (i < linjer.length) {
      var linje = linjer[i];
      var neste = linjer[i + 1];

      if (erMengdeLinje(linje) && neste && !erMengdeLinje(neste)) {
        var navn = rensVarelinje(neste);
        if (navn) resultat.push(navn + " (" + linje + ")");
        i += 2;
        continue;
      }

      linje.split(/[,;]+/).forEach(function (del) {
        var ren = rensVarelinje(del);
        if (ren) resultat.push(ren);
      });
      i += 1;
    }

    return resultat;
  }

  function addMultipleItems(rawText) {
    var navn = parseFlereVarer(rawText);
    if (navn.length === 0) return;

    navn.forEach(leggTilEnVare);
    saveState();

    $inputMulti.value = "";
    hideSuggestions();
    render();

    showToast(navn.length === 1 ? "La til 1 vare" : "La til " + navn.length + " varer");
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

  $add.addEventListener("click", function () {
    if (flerModus) {
      addMultipleItems($inputMulti.value);
    } else {
      addItem($input.value);
    }
  });

  if ($multiToggle && $inputMulti) {
    $multiToggle.addEventListener("click", function () {
      flerModus = !flerModus;
      hideSuggestions();

      if (flerModus) {
        $input.hidden = true;
        $input.value = "";
        $inputMulti.hidden = false;
        $inputMulti.value = "";
        $inputMulti.focus();
        $add.textContent = "Legg til alle";
        $multiToggle.textContent = "✎ Én vare om gangen";
      } else {
        $inputMulti.hidden = true;
        $inputMulti.value = "";
        $input.hidden = false;
        $input.value = "";
        $add.textContent = "Legg til";
        $multiToggle.textContent = "📋 Lim inn flere varer";
        $input.focus();
      }
    });
  }

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
