let allRecordsData;
let recordsData;
let currentGender = "boys";
let currentCategory = "sprints";

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

  // Initialize DataTable
  $('#' + tableId).DataTable({
    pageLength: 25,
    destroy: true
  });
}