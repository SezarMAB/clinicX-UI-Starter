// Data model - stores all tooth information
const toothData = {};
let selectedTooth = null;
let activeSurfaceSelection = []; // Holds multiple selected surfaces

// FDI tooth numbering
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Findings list
const findings = [
  {id: "ohne_befund", name: "Ohne Befund", icon: "✓"},
  {id: "lueckenschluss", name: "Lückenschluss", icon: ")("},
  {id: "fehlt", name: "fehlt", icon: "✗"},
  {id: "achter_fehlen", name: "8er fehlen", icon: "8"},
  {id: "durchbruch", name: "im Durchbruch", icon: "↑"},
  {id: "zerstoert", name: "zerstört", icon: "💥"},
  {id: "wurzelrest", name: "Wurzelrest", icon: "🦷"},
  {id: "milchzahn", name: "Milchzahn", icon: "🍼"},
  {id: "doppelte_anlage", name: "doppelte Anlage", icon: "👥"},
  {id: "versiegelung", name: "Versiegelung", icon: "🔒"},
  {id: "vitalitaet", name: "Vitalitätsprüfung", icon: "+?"},
  {id: "perkussion", name: "Perkussionstest", icon: "P+?"},
  {id: "keilfoermig", name: "Keilförmiger Def.", icon: "📐"},
  {id: "lockerung", name: "Lockerungsgrad I-III", icon: "I,II,III"},
  {id: "empty1", name: "", icon: ""},
  {id: "ersetzt", name: "ersetzt", icon: "🔄"},
  {id: "herd", name: "Herd", icon: "🔴"}, {id: "ur", name: "UR", icon: "UR"},
  {id: "totale_ok", name: "Totale OK", icon: "⬜"},
  {id: "hemisektion", name: "Hemisektion", icon: "½"},
  {id: "sr", name: "SR", icon: "SR"},
  {id: "totale_uk", name: "Totale UK", icon: "⬜"},
  {id: "abrasion", name: "Abrasion", icon: "///"},
  {id: "erosion", name: "Erosion", icon: "~~~"},
  {id: "implantat", name: "Implantat", icon: "🔩"},
  {id: "brackets", name: "Brackets", icon: "⚙️"},
  {id: "retainer", name: "Retainer", icon: "↔️"},
  {id: "krone", name: "Krone", icon: "👑"},
  {id: "rezession", name: "Rezession", icon: "📉"},
  {id: "zahnwanderung", name: "Zahnwanderung", icon: "→"},
  {id: "teilkrone", name: "Teilkrone", icon: "½👑"},
  {id: "drehung", name: "Drehung", icon: "🔄"},
  {id: "kippung", name: "Kippung", icon: "📐"},
  {id: "brueckenglied", name: "Brückenglied", icon: "🌉"},
  {id: "wurzelzahl", name: "Wurzelzahl", icon: "🦷"},
  {id: "empty2", name: "", icon: ""},
  {id: "teleskop", name: "Teleskop", icon: "🔭"},
  {id: "wsr", name: "WSR", icon: "WSR"}, {id: "empty3", name: "", icon: ""},
  {id: "stiftaufbau", name: "Stiftaufbau", icon: "📌"},
  {id: "verbblockung", name: "Verbblockung", icon: "🔗"},
  {id: "empty4", name: "", icon: ""}, {id: "veneer", name: "Veneer", icon: "💎"},
  {id: "zapfenzahn", name: "Zapfenzahn (Z)", icon: "Z"},
  {id: "empty5", name: "", icon: ""},
];

// Caries color mapping
const cariesColors = {
  unbestimmt: "#9e9e9e", 1: "#90caf9", 2: "#42a5f5", 3: "#ef5350", 4: "#d32f2f", 5: "#590303",
};

/**
 * NEW: Creates the default state for a single tooth surface.
 */
function createDefaultSurfaceState() {
  return {
    caries: null,
    behandlungsbedarf: "",
    fuellmaterial: "",
    flags: {fremdarbeit: false, ersetzen: false, roentgen: false},
  };
}

// MODIFIED: Initialize tooth data with a detailed structure for each surface
function initializeToothData() {
  const surfaceIds = ["m", "d", "o", "b", "p", "roots", "a"];
  [...upperTeeth, ...lowerTeeth].forEach((toothNum) => {
    toothData[toothNum] = {
      surfaces: {},
      findings: [], // These remain at the tooth level
    };
    surfaceIds.forEach(id => {
      toothData[toothNum].surfaces[id] = createDefaultSurfaceState();
    });
  });
}

function createToothSVG(toothNum, isInteractive) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "tooth-svg");
  svg.setAttribute("viewBox", "0 20 70 45");
  const surfaces = [
    {
      id: "roots",
      path: "M15 55 L32 55 L32 70 A5 5 0 0 1 27 75 L20 75 A5 5 0 0 1 15 70 Z M38 55 L55 55 L55 70 A5 5 0 0 1 50 75 L43 75 A5 5 0 0 1 38 70 Z",
      label: "roots"
    },
    {id: "a", path: "M25 20 L45 20 L45 45 L25 45 Z", label: "base"},
    {
      id: "m",
      path: "M15 25 A10 10 0 0 0 10 35 L10 45 A10 10 0 0 0 15 55 L25 45 L25 35 Z",
      label: "mesial"
    }, {
      id: "d",
      path: "M55 25 A10 10 0 0 1 60 35 L60 45 A10 10 0 0 1 55 55 L45 45 L45 35 Z",
      label: "distal"
    }, {
      id: "o",
      path: `M18 25 L52 25 A3 3 0 0 1 55 28 L45 35 L25 35 L15 28 A3 3 0 0 1 18 25 Z`,
      label: "occlusal"
    }, {id: "b", path: "M25 35 L45 35 L45 45 L25 45 Z", label: "buccal"},
    {id: "p", path: "M25 45 L45 45 L55 55 L15 55 Z", label: "palatal"},
  ];

  surfaces.forEach((surface) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", surface.path);
    path.setAttribute("class", "surface");
    path.setAttribute("data-surface", surface.id);
    path.setAttribute("data-tooth", toothNum);

    if (isInteractive) {
      path.addEventListener("click", () => {
        toggleSurfaceSelection(surface.id);
      });
    }
    svg.appendChild(path);
  });
  return svg;
}

function renderDentalChart() {
  const upperJaw = document.getElementById("upperJaw");
  const lowerJaw = document.getElementById("lowerJaw");
  upperJaw.innerHTML = "";
  lowerJaw.innerHTML = "";

  upperTeeth.forEach((toothNum) => {
    const toothDiv = createToothElement(toothNum, false);
    upperJaw.appendChild(toothDiv);
  });

  lowerTeeth.forEach((toothNum) => {
    const toothDiv = createToothElement(toothNum, false);
    lowerJaw.appendChild(toothDiv);
  });
}

function createToothElement(toothNum, isInteractive) {
  const toothDiv = document.createElement("div");
  toothDiv.className = "tooth";
  toothDiv.setAttribute("data-tooth", toothNum);

  const svg = createToothSVG(toothNum, isInteractive);
  toothDiv.appendChild(svg);

  if (!isInteractive) {
    toothDiv.addEventListener("click", () => {
      selectTooth(toothNum);
    });
  }
  return toothDiv;
}

function selectTooth(toothNum) {
  if (selectedTooth === toothNum) {
    return;
  }
  activeSurfaceSelection = []; // Clear surface selection

  document.querySelectorAll(".tooth.selected").forEach((el) => {
    el.classList.remove("selected");
  });

  const toothElement = document.querySelector(`.jaw-row [data-tooth="${toothNum}"]`);
  if (toothElement) {
    toothElement.classList.add("selected");
    selectedTooth = toothNum;

    renderDetailView();
    updateCurrentSelection();
    updateSelectedToothInfo();
    updateSidebarForSelection(); // Use the new function to update sidebar
    updateFindingsPalette();
  }
}

function renderDetailView() {
  const detailView = document.getElementById("toothDetailView");
  const container = document.getElementById("toothDetailSVGContainer");
  const title = detailView.querySelector('h4');

  detailView.style.display = 'block';

  if (selectedTooth) {
    detailView.classList.remove('placeholder');
    title.style.display = 'block';
    container.innerHTML = "";

    const interactiveToothSVG = createToothSVG(selectedTooth, true);
    container.appendChild(interactiveToothSVG);
    updateDetailViewVisuals();
  } else {
    detailView.classList.add('placeholder');
    title.style.display = 'none';
    container.innerHTML = "Bitte einen Zahn aus der Übersicht auswählen.";
  }
}

function updateDetailViewVisuals() {
  if (!selectedTooth) return;
  const container = document.getElementById("toothDetailSVGContainer");
  const toothElement = container.querySelector(".tooth-svg");
  updateToothVisual(selectedTooth, toothElement);
}

function toggleSurfaceSelection(surfaceId) {
  const index = activeSurfaceSelection.indexOf(surfaceId);
  if (index > -1) {
    activeSurfaceSelection.splice(index, 1);
  } else {
    activeSurfaceSelection.push(surfaceId);
  }

  updateDetailViewVisuals();
  updateSidebarForSelection(); // Update sidebar based on new selection
}

/**
 * MODIFIED: Updates tooth visuals based on the new data structure.
 * Selection is shown with a border, fill is based on caries data.
 * @param {number} toothNum - The tooth number to update.
 * @param {Element} toothElement - The specific SVG element to update.
 */
function updateToothVisual(toothNum, toothElement) {
  const data = toothData[toothNum];
  if (!toothElement) return;

  const surfaces = toothElement.querySelectorAll(".surface");
  surfaces.forEach((surface) => {
    const surfaceId = surface.getAttribute("data-surface");
    const surfaceData = data.surfaces[surfaceId];
    const grade = surfaceData ? surfaceData.caries : null;
    const isSelected = activeSurfaceSelection.includes(surfaceId);

    surface.style.fill = grade ? cariesColors[grade] : 'white';
    surface.classList.toggle('selection-active', isSelected);
  });
}

function updateChartToothVisual(toothNum) {
  const toothElement = document.querySelector(`.jaw-row [data-tooth="${toothNum}"] .tooth-svg`);
  updateToothVisual(toothNum, toothElement);
}

function updateCurrentSelection() {
  const display = document.getElementById("currentToothDisplay");
  if (selectedTooth) {
    display.textContent = `Zahn ${selectedTooth}`;
    display.style.color = "#e65100";
    display.style.fontWeight = "bold";
  } else {
    display.textContent = "Kein Zahn ausgewählt";
    display.style.color = "#666";
    display.style.fontWeight = "normal";
  }
}

// Enable/disable sidebar sections based on selection
function enableSidebarSurfaceSections(enabled) {
  const sections = ["generalSection", "cariesSection", "treatmentSection", "materialSection"];
  sections.forEach((sectionId) => {
    document.getElementById(sectionId).classList.toggle("disabled", !enabled);
  });
}

function updateFindingsPalette() {
  const findingItems = document.querySelectorAll(".finding-item");
  findingItems.forEach((item) => {
    item.classList.toggle("disabled", !selectedTooth);
  });
}

function renderFindingsPalette() {
  const grid = document.getElementById("findingsGrid");
  grid.innerHTML = "";
  findings.forEach((finding) => {
    if (finding.name === "") {
      grid.appendChild(document.createElement("div"));
      return;
    }
    const item = document.createElement("div");
    item.className = "finding-item";
    item.classList.toggle("disabled", !selectedTooth);
    item.innerHTML = `<div class="finding-icon">${finding.icon}</div><div>${finding.name}</div>`;
    item.addEventListener("click", () => addFindingToTooth(finding));
    grid.appendChild(item);
  });
}

function addFindingToTooth(finding) {
  if (!selectedTooth) {
    alert("Bitte wählen Sie zuerst einen Zahn aus.");
    return;
  }
  const data = toothData[selectedTooth];
  if (!data.findings.includes(finding.id)) {
    data.findings.push(finding.id);
    updateSelectedToothInfo();
  }
}

function updateSelectedToothInfo() {
  const infoDiv = document.getElementById("selectedToothInfo");
  const numberSpan = document.getElementById("selectedToothNumber");
  const findingsDiv = document.getElementById("selectedToothFindings");
  if (!selectedTooth) {
    infoDiv.style.display = "none";
    return;
  }
  infoDiv.style.display = "block";
  numberSpan.textContent = selectedTooth;
  const data = toothData[selectedTooth];
  findingsDiv.innerHTML = "";
  if (data.findings.length === 0) {
    findingsDiv.innerHTML = "<em>Keine Befunde</em>";
  } else {
    data.findings.forEach((findingId) => {
      const finding = findings.find((f) => f.id === findingId);
      if (finding) {
        const tag = document.createElement("span");
        tag.className = "finding-tag";
        tag.textContent = finding.name;
        tag.title = "Klicken zum Entfernen";
        tag.addEventListener("click", () => removeFindingFromTooth(findingId));
        findingsDiv.appendChild(tag);
      }
    });
  }
}

function removeFindingFromTooth(findingId) {
  if (!selectedTooth) return;
  const data = toothData[selectedTooth];
  const index = data.findings.indexOf(findingId);
  if (index > -1) {
    data.findings.splice(index, 1);
    updateSelectedToothInfo();
  }
}

/**
 * NEW/REWRITTEN: Updates the entire sidebar based on the currently selected surfaces.
 * Handles single, multiple, and no selections.
 */
function updateSidebarForSelection() {
  if (activeSurfaceSelection.length === 0) {
    // No surfaces selected, so disable and reset controls.
    enableSidebarSurfaceSections(false);
    resetCariesSelection();
    document.getElementById("fremdarbeit").checked = false;
    document.getElementById("ersetzen").checked = false;
    document.getElementById("roentgen").checked = false;
    document.getElementById("behandlungsbedarf").value = "";
    document.getElementById("fuellmaterial").value = "";
    return;
  }

  // Surfaces are selected, so enable controls.
  enableSidebarSurfaceSections(true);

  const data = toothData[selectedTooth];
  const firstSurfaceId = activeSurfaceSelection[0];
  const firstSurfaceData = data.surfaces[firstSurfaceId];

  // Helper function to check if all selected surfaces have the same value for a property
  const allHaveSameValue = (propAccessor) => {
    const firstValue = propAccessor(firstSurfaceData);
    return activeSurfaceSelection.every(surfaceId => propAccessor(data.surfaces[surfaceId]) === firstValue);
  };

  // Update Caries Radio Buttons
  if (allHaveSameValue(s => s.caries)) {
    if (firstSurfaceData.caries) {
      document.querySelector(`input[name="caries"][value="${firstSurfaceData.caries}"]`).checked = true;
    } else {
      resetCariesSelection();
    }
  } else {
    resetCariesSelection(); // Mixed values
  }

  // Update Checkboxes
  ['fremdarbeit', 'ersetzen', 'roentgen'].forEach(flag => {
    document.getElementById(flag).checked = allHaveSameValue(s => s.flags[flag]) ? firstSurfaceData.flags[flag] : false;
  });

  // Update Select Dropdowns
  ['behandlungsbedarf', 'fuellmaterial'].forEach(prop => {
    document.getElementById(prop).value = allHaveSameValue(s => s[prop]) ? firstSurfaceData[prop] : "";
  });
}

function resetCariesSelection() {
  document.querySelectorAll('input[name="caries"]').forEach(radio => radio.checked = false);
}

// Setup event listeners for sidebar controls
function setupSidebarListeners() {
  // MODIFIED: Checkbox listeners apply to all selected surfaces
  ["fremdarbeit", "ersetzen", "roentgen"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (e) => {
      if (selectedTooth && activeSurfaceSelection.length > 0) {
        const isChecked = e.target.checked;
        activeSurfaceSelection.forEach(surfaceId => {
          toothData[selectedTooth].surfaces[surfaceId].flags[id] = isChecked;
        });
        updateSidebarForSelection();
      }
    });
  });

  // MODIFIED: Caries listener applies grade to all selected surfaces
  document.querySelectorAll('input[name="caries"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (!e.target.checked || activeSurfaceSelection.length === 0) return;

      const gradeToApply = e.target.value;
      activeSurfaceSelection.forEach(surfaceId => {
        toothData[selectedTooth].surfaces[surfaceId].caries = gradeToApply;
      });

      // Visually update and then clear selection
      updateDetailViewVisuals();
      updateChartToothVisual(selectedTooth);
      activeSurfaceSelection = [];
      updateDetailViewVisuals(); // Update again to show deselection
      updateSidebarForSelection(); // Reset sidebar
    });
  });

  // MODIFIED: Select dropdowns apply to all selected surfaces
  document.getElementById("behandlungsbedarf").addEventListener("change", (e) => {
    if (selectedTooth && activeSurfaceSelection.length > 0) {
      const value = e.target.value;
      activeSurfaceSelection.forEach(surfaceId => {
        toothData[selectedTooth].surfaces[surfaceId].behandlungsbedarf = value;
      });
      updateSidebarForSelection();
    }
  });

  document.getElementById("fuellmaterial").addEventListener("change", (e) => {
    if (selectedTooth && activeSurfaceSelection.length > 0) {
      const value = e.target.value;
      activeSurfaceSelection.forEach(surfaceId => {
        toothData[selectedTooth].surfaces[surfaceId].fuellmaterial = value;
      });
      updateSidebarForSelection();
    }
  });

  document.getElementById("fileInput").addEventListener("change", importData);
}

// Import data from JSON
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (typeof importedData !== "object") throw new Error("Invalid data format");

      selectedTooth = null;
      activeSurfaceSelection = [];
      document.querySelectorAll(".tooth.selected").forEach(el => el.classList.remove("selected"));

      initializeToothData(); // Reset to default structure first

      // Deep merge the imported data
      Object.keys(importedData).forEach((toothNum) => {
        if (toothData[toothNum]) {
          // This simple assign works if the imported structure is complete.
          // For more complex merges, a deep merge utility would be safer.
          Object.assign(toothData[toothNum], importedData[toothNum]);
        }
      });

      [...upperTeeth, ...lowerTeeth].forEach(toothNum => updateChartToothVisual(toothNum));

      updateCurrentSelection();
      updateSelectedToothInfo();
      updateFindingsPalette();
      renderDetailView();
      updateSidebarForSelection();

    } catch (error) {
      alert("Fehler beim Importieren der Daten: " + error.message);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

// Export data as JSON
window.exportData = function () {
  const dataStr = JSON.stringify(toothData, null, 2);
  const dataBlob = new Blob([dataStr], {type: "application/json"});
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "zahnstatus.json";
  link.click();
  URL.revokeObjectURL(url);
};

// Renders the tooth numbers between the jaws
function renderNumberingRow() {
  const numberingRow = document.getElementById("numberingRow");
  numberingRow.innerHTML = "";
  const numbers = [8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8];

  numbers.forEach((num) => {
    const numberDiv = document.createElement("div");
    numberDiv.className = "number-item";
    numberDiv.textContent = num;
    numberingRow.appendChild(numberDiv);
  });
}

// Initialize application
function init() {
  initializeToothData();
  renderDentalChart();
  renderNumberingRow();
  renderFindingsPalette();
  setupSidebarListeners();
  updateCurrentSelection();
  renderDetailView();
  updateSidebarForSelection(); // Initial sidebar state
}

// Start the app
init();
