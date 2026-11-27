let allRecordsData;
let recordsData;
let currentGender = "boys";
let currentCategory = "sprints";

/* ── Sorting by performance ───────────────────────────────────────────────
   These lists default to the best mark first rather than alphabetically by
   athlete. Neither column sorts correctly as plain text: times run "10.65"
   and "4:09.09", and field marks are feet-and-inches ("12' 6.5\""), where a
   string compare would put 9' above 12'. So each is parsed to a number first.

   Field events sort on the visible "Mark" column rather than "Mark (m)" —
   11 rows in the data have a metric value that disagrees with their
   feet-inches value, and sorting on the column people actually read keeps the
   displayed order correct.
───────────────────────────────────────────────────────────────────────────*/

// "4:09.09" / "52.24" / "10.5" -> seconds. Unparseable values sort last.
$.fn.dataTable.ext.type.order["track-time-pre"] = function (d) {
  const m = String(d == null ? "" : d).trim().match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!m) return Number.POSITIVE_INFINITY;
  return (m[1] ? parseInt(m[1], 10) * 60 : 0) + parseFloat(m[2]);
};

// "12' 6.5\"" -> total inches. Tolerates the handful of rows with a stray
// space or a straight quote ("46 '3\"", "133' 8'"). Unparseable sort last.
$.fn.dataTable.ext.type.order["track-mark-pre"] = function (d) {
  const n = String(d == null ? "" : d).match(/\d+(?:\.\d+)?/g);
  if (!n) return Number.NEGATIVE_INFINITY;
  if (n.length === 1) return parseFloat(n[0]);
  return parseFloat(n[0]) * 12 + parseFloat(n[1]);
};

// Picks the column to open on: time ascending, distance/height descending.
function defaultSort(columns) {
  let i = columns.indexOf("Time");
  if (i !== -1) return { index: i, dir: "asc", type: "track-time" };
  i = columns.indexOf("Mark");
  if (i !== -1) return { index: i, dir: "desc", type: "track-mark" };
  i = columns.indexOf("Markm");
  if (i !== -1) return { index: i, dir: "desc", type: "num" };
  return null;
}

// Always show times to the hundredths: 10.5 -> "10.50", 52 -> "52.00",
// "4:09.1" -> "4:09.10". The JSON stores many times as numbers, which drops
// trailing zeros. Anything that isn't a time is returned unchanged.
function formatTime(v) {
  const m = String(v == null ? "" : v).trim().match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!m) return v ?? "";
  let secs = parseFloat(m[2]).toFixed(2);
  if (m[1]) secs = secs.padStart(5, "0"); // keep "4:09.10", not "4:9.10"
  return m[1] ? `${m[1]}:${secs}` : secs;
}

// Load JSON
fetch("assets/json/allTimeListUpdated.json")
  .then(res => res.json())
  .then(data => {
    allRecordsData = data;
    recordsData = allRecordsData[currentGender];
    showCategory(currentCategory); // initially show sprints
  });

// Gender toggle switch click handler
const genderToggle = document.getElementById("gender-toggle");
document.querySelectorAll(".gender-toggle-option").forEach(btn => {
  btn.addEventListener("click", () => {
    const gender = btn.dataset.gender;
    if (gender === currentGender) return;

    currentGender = gender;
    recordsData = allRecordsData[currentGender];

    document.querySelectorAll(".gender-toggle-option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    genderToggle.classList.toggle("girls", gender === "girls");

    showCategory(currentCategory);
  });
});

// Category button click handler
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // Highlight active category
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    showCategory(btn.dataset.category);
  });
});

// Show event buttons for the selected category
function showCategory(category) {
  currentCategory = category;

  const eventContainer = document.getElementById("event-buttons-container");
  eventContainer.innerHTML = ""; // clear previous event buttons

  const events = recordsData[category] || {};
  const eventNames = Object.keys(events);

  eventNames.forEach((eventName, index) => {
    const btn = document.createElement("button");
    btn.textContent = eventName;
    btn.classList.add("tab-btn");
    btn.style.margin = "5px"; // spacing

    btn.addEventListener("click", () => {
      // Remove active from all event buttons
      eventContainer.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

      // Highlight the clicked event button
      btn.classList.add("active");

      // Load the selected event
      loadEvent(category, eventName);
    });

    eventContainer.appendChild(btn);

    // Automatically highlight the first event button
    if (index === 0) {
      btn.classList.add("active");
      loadEvent(category, eventName); // load the first event by default
    }
  });
}

// Load a single event table
function loadEvent(category, eventName) {
  const container = document.getElementById("events-container");
  container.innerHTML = ""; // clear previous table

  const eventData = recordsData[category][eventName] || [];

  if (eventData.length === 0) {
    return;
  }

  // STEP 1: detect columns (union across all records, since some rows may omit fields like athlete names)
  const columns = [...new Set(eventData.flatMap(record => Object.keys(record)))];

  // STEP 2: build header
  let headerHtml = "<tr>";
  columns.forEach(col => {
    let displayName = col;

    // Add space before numbers (Athlete1 → Athlete 1)
    displayName = displayName.replace(/([a-zA-Z])(\d+)/, "$1 $2");

    // Convert Markm → Mark (m)
    if (displayName.toLowerCase() === "markm") {
      displayName = "Mark (m)";
    }

    headerHtml += `<th>${displayName}</th>`;
  });
  headerHtml += "</tr>";

  // STEP 3: build rows
  let rowsHtml = "";

  eventData.forEach(record => {
    rowsHtml += "<tr>";

    columns.forEach(col => {
      let value = record[col] ?? "";
      if (col === "Time") value = formatTime(value);
      // Only timed events get the hover marker; field marks keep a plain "*"
      if (col === "Meet" && isTime(record.Time)) value = formatMeet(value);
      rowsHtml += `<td>${value}</td>`;
    });

    rowsHtml += "</tr>";
  });

  // Create table container
  const eventDiv = document.createElement("div");
  eventDiv.classList.add("event");

  const tableId = "table-" + eventName.replace(/[^a-zA-Z0-9]+/g, "-");

  eventDiv.innerHTML = `
    <h2>${eventName}</h2>
    <table id="${tableId}" class="display">
      <thead>${headerHtml}</thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

  container.appendChild(eventDiv);

  // Initialize DataTable, opening on the best performance rather than
  // alphabetically by athlete (which is what column 0 gives by default).
  const sort = defaultSort(columns);
  const opts = { pageLength: 25, destroy: true };
  if (sort) {
    opts.order = [[sort.index, sort.dir]];
    opts.columnDefs = [{ type: sort.type, targets: sort.index }];
  }
  $('#' + tableId).DataTable(opts);
}