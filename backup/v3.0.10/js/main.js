import { copySQL, setupEnterKeyTrigger } from './utils.js';
import { predefinedCountries } from './components/predefinedCountries.js';
import { dimensionEntries } from './components/dimensionsData.js';
import { logQuery } from './components/logQuery.js';
import { getDateRangeClause } from './components/dateRangeHelper.js';
import { addSortRow, toggleSortBy, removeSortRow , updateSortFieldOptions } from './components/sortByControls.js';


// Function to toggle the visibility of the filter section
// and rotate the arrow icon  

const filterOperatorMap = {
  string: ["EQUALS", "NOT EQUALS", "CONTAINS", "NOT CONTAINS"], /* Query */
  regex: ["EQUALS", "NOT EQUALS", "CONTAINS", "NOT CONTAINS", "REGEXP CONTAINS", "NOT REGEXP CONTAINS"],
  numeric: ["EQUALS", "NOT EQUALS", "GREATER THAN", "LESS THAN", "IS NULL", "IS NOT NULL"],
  boolean: ["EQUALS", "NOT EQUALS"], // limited to true/false via radio buttons
  country: ["EQUALS", "NOT EQUALS"]
};

function getOperatorType(field) {
  if (field.startsWith("Is ")) return "boolean";
  if (field === "Country") return "country";
  if (["Impressions", "Position", "Clicks", "CTR", "Avg Position"].includes(field)) return "numeric";
  if (["Query", "URL"].includes(field)) return "regex"; // allow REGEXP for Query & URL only
  return "string";
}

document.querySelectorAll('#customFieldGroups input[type="text"]').forEach(input => {
  input.addEventListener('input', () => {
    input.classList.add('user-started');
  });
});

// Prevent Metrics and Dimensions dropdowns from closing on selection
let suppressDropdownClose = false;
document.addEventListener("DOMContentLoaded", () => {
  ['metricsDropdown', 'dimensionsDropdown'].forEach(id => {
    const dropdown = document.getElementById(id);
    dropdown?.querySelectorAll('div').forEach(item => {

      item.addEventListener('mousedown', (e) => {
        suppressDropdownClose = true; // block global click listener temporarily


        const parentId = item.parentElement.id;
        const label = item.textContent.trim();
        if (parentId === 'metricsDropdown') {
          selectMetric(label);

        } else if (parentId === 'dimensionsDropdown') {

          const span = item.querySelector('span');
          if (span) {

            selectDimension(span.textContent.trim());
          }
        }
      });


    });
  });
});

/* metrics multiselect script - starts here */
window.selectedDimensions = new Set();
window.selectedMetrics = new Set();

// const selectedMetrics = new Set();
let isDropdownOpen = false;

// const selectedDimensions = new Set();


let selectedDateRange = '';
let isDateRangeDropdownOpen = false;

document.getElementById("selectedDateRange").addEventListener("click", (event) => {
  event.stopPropagation();

  const dropdown = document.getElementById("dateRangeDropdown");
  const arrow = document.getElementById("dateRangeArrow");
  const isOpen = dropdown.getAttribute("data-open") === "true";

  toggleDropdown(dropdown, arrow, !isOpen);
});
window.selectDateRange = selectDateRange;

function selectDateRange(range) {
  selectedDateRange = range;
  document.getElementById("dateRangeLabel").textContent = range;
  closeDropdown(document.getElementById("dateRangeDropdown"));
  isDateRangeDropdownOpen = false;
  toggleCustomDateInputs(range); // Show/hide custom fields
}
// Bind selection for all date range items
document.querySelectorAll('#dateRangeDropdown [data-range]').forEach(item => {
  item.addEventListener('click', () => {
    const range = item.getAttribute('data-range');
    selectDateRange(range);
  });
});

function toggleCustomDateInputs(range) {
  const customInputs = document.getElementById('customDateInputs');
  if (range === 'Custom date range') {
    customInputs.classList.remove('hidden');
  } else {
    customInputs.classList.add('hidden');
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const tooltipBox = document.getElementById("global-tooltip");
  const metricItems = document.querySelectorAll("#metricsDropdown > div");

  const metricTooltips = {
    "Impressions": "The number of times your website was displayed on a web page.",
    "Clicks": "The number of times a user clicked on your website in search results.",
    "CTR": "The percentage of impressions that resulted in a click.",
    "Position": "The average position of your website in search results."
  };

  metricItems.forEach(item => {
    const metricName = item.dataset.metric;
    const tooltipText = metricTooltips[metricName];
    const icon = item.querySelector("i");

    if (icon && tooltipText) {
      icon.addEventListener("mouseenter", (e) => {
        tooltipBox.textContent = tooltipText;
        tooltipBox.classList.remove("hidden");

        const rect = e.target.getBoundingClientRect();
        tooltipBox.style.top = `${rect.top - 8 + window.scrollY}px`;
        tooltipBox.style.left = `${rect.right + 4 + window.scrollX}px`;
      });

      icon.addEventListener("mouseleave", () => {
        tooltipBox.classList.add("hidden");
      });
    }
  });
});


// Populate dimensions dropdown

const dimensionsDropdown = document.getElementById("dimensionsDropdown");
dimensionsDropdown.innerHTML = '<div id="dimensionsScrollArea" class="max-h-[400px] overflow-y-auto pr-2"></div>';
const scrollArea = document.getElementById("dimensionsScrollArea");


const tooltipBox = document.getElementById("global-tooltip");

dimensionEntries.forEach(([name, tooltip]) => {
  const item = document.createElement("div");
  item.className = "relative cursor-pointer p-1 hover:bg-gray-700 flex items-center justify-between";
  item.setAttribute("onclick", `selectDimension('${name}')`);

  const span = document.createElement("span");
  span.textContent = name;

  // Icon setup
  const icon = document.createElement("i");
  icon.className = "far fa-question-circle text-gray-400";
  icon.style.cursor = "pointer";

  // Tooltip logic
  icon.addEventListener("mouseenter", (e) => {
    tooltipBox.textContent = tooltip;
    tooltipBox.classList.remove("hidden");

    const rect = e.target.getBoundingClientRect();
    tooltipBox.style.top = `${rect.top - 8 + window.scrollY}px`;
    tooltipBox.style.left = `${rect.right + 4 + window.scrollX}px`;
  });

  icon.addEventListener("mouseleave", () => {
    tooltipBox.classList.add("hidden");
  });

  item.appendChild(span);
  item.appendChild(icon);
  dimensionsDropdown.appendChild(item);
  updateSortFieldOptions();
});


// dimensions dropdown items end
function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

function selectDimension(dimension) {
  if (selectedDimensions.has(dimension)) return;

  selectedDimensions.add(dimension);

  const dropdownItems = document.querySelectorAll("#dimensionsDropdown > div");
  dropdownItems.forEach(item => {
    const label = item.querySelector("span");
    if (label && label.textContent === dimension) {
      item.style.display = "none";
    }
  });

  const placeholder = document.getElementById("dimensionsPlaceholder");
  if (placeholder) placeholder.classList.add("hidden");

  const safeId = slugify(dimension);
  const tag = document.createElement("div");
  tag.className = "badge badge-lg badge-primary px-2 flex items-center cursor-default text-sm font-semibold";
  tag.id = `tag-dimension-${safeId}`;
  tag.innerHTML = `${dimension} <button onclick="removeDimension('${dimension}')" class="ml-2 mt-[-2px] leading-none text-[1.2rem] text-white font-bold outline-none border-none p-[2px] font-extralight">&times;</button>`;
  document.getElementById("dimensionsTagsContainer").appendChild(tag);

  updateClearDimensionsButton();

  const remaining = Array.from(document.querySelectorAll("#dimensionsDropdown > div"))
    .filter(item => item.style.display !== "none");

  if (remaining.length === 0) {
    closeDropdown(dimensionsDropdown);
    document.getElementById("dimensionsArrow").classList.remove("rotate-180");
  }

  refreshDropdownHeight(dimensionsDropdown);
  updateSortFieldOptions();
}


function removeDimension(dimension) {
  selectedDimensions.delete(dimension);

  const safeId = slugify(dimension);
  const tag = document.getElementById(`tag-dimension-${safeId}`);
  if (tag) tag.remove();

  const dropdownItems = document.querySelectorAll("#dimensionsDropdown > div");
  dropdownItems.forEach(item => {
    const label = item.querySelector("span");
    if (label && label.textContent === dimension) {
      item.style.display = "flex";
    }
  });

  if (selectedDimensions.size === 0) {
    const placeholder = document.getElementById("dimensionsPlaceholder");
    if (placeholder) placeholder.classList.remove("hidden");
  }

  updateClearDimensionsButton();
  refreshDropdownHeight(dimensionsDropdown);
}
window.removeDimension = removeDimension;

function updateClearMetricsButton() {
  const clearBtn = document.getElementById("clearMetricsBtn");
  if (selectedMetrics.size >= 2) {
    clearBtn.classList.remove("hidden");
  } else {
    clearBtn.classList.add("hidden");
  }
}

function updateMetricsArrowState() {
  const visibleItems = Array.from(document.querySelectorAll("#metricsDropdown > div"))
    .filter(item => item.style.display !== "none");

  const arrow = document.getElementById("metricsArrow");
  if (visibleItems.length === 0) {
    arrow.classList.add("text-gray-500", "cursor-not-allowed");
  } else {
    arrow.classList.remove("text-gray-500", "cursor-not-allowed");
  }
}


/* metrics dropdown functions - starts here*/


function selectMetric(metric) {
  if (selectedMetrics.has(metric)) return;

  const container = document.getElementById("metricsTagsContainer");
  const placeholder = document.getElementById("metricsPlaceholder");

  selectedMetrics.add(metric);


  document.querySelectorAll("#metricsDropdown > div").forEach(item => {
    const span = item.querySelector("span");
    if (span && span.textContent === metric) {
      item.style.display = "none";
    }
  });


  const tag = document.createElement("div");
  tag.className = "badge badge-lg badge-primary px-2 flex items-center cursor-default text-sm font-semibold";
  tag.id = `tag-${metric}`;

  const label = document.createElement("span");
  label.textContent = metric;

  const closeBtn = document.createElement("button");
  closeBtn.className = "ml-2 mt-[-2px] leading-none text-[1.2rem] text-white font-bold outline-none border-none p-[2px] font-extralight";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeMetric(metric);
  });

  tag.appendChild(label);
  tag.appendChild(closeBtn);
  container.appendChild(tag);

  placeholder.classList.add("hidden");

  updateClearMetricsButton();
  updateMetricsArrowState();

  // If all selected, hide dropdown
  const remaining = Array.from(document.querySelectorAll("#metricsDropdown > div"))
    .filter(item => item.style.display !== "none");

  if (remaining.length === 0) {
    closeDropdown(metricsDropdown);
    document.getElementById("metricsArrow").classList.remove("rotate-180");
  }

  refreshDropdownHeight(metricsDropdown);
  updateSortFieldOptions();
}

document.querySelectorAll('#metricsDropdown > div').forEach(div => {
  div.addEventListener('click', () => {
    const metric = div.dataset.metric;
    selectMetric(metric);
  });
});
/* metrics dropdown functions - ends here*/
// Function to update the "Clear all" button visibility
function removeMetric(metric) {
  selectedMetrics.delete(metric);
  document.getElementById(`tag-${metric}`)?.remove();


  document.querySelectorAll("#metricsDropdown > div").forEach(item => {
    const span = item.querySelector("span");
    if (span && span.textContent === metric) {
      item.style.display = "block";
    }
  });


  if (selectedMetrics.size === 0) {
    metricsPlaceholder.classList.remove("hidden");
  }

  // Allow dropdown to be reopened after removal
  isDropdownOpen = false;
  toggleDropdown(metricsDropdown, metricsArrow, false);
  updateClearMetricsButton();
  updateMetricsArrowState();
  refreshDropdownHeight(metricsDropdown);
  updateSortFieldOptions();
}

function clearAllMetrics() {
  const tagContainer = document.getElementById("metricsTagsContainer");
  const placeholder = document.getElementById("metricsPlaceholder");
  const arrow = document.getElementById("metricsArrow");

  if (!tagContainer || !placeholder) {
    console.error("clearAllMetrics error: tags container or placeholder is missing");
    return;
  }

  tagContainer.querySelectorAll("div").forEach(tag => tag.remove());
  selectedMetrics.clear();
  placeholder.classList.remove("hidden");

  document.querySelectorAll("#metricsDropdown > div").forEach(item => {
    item.style.display = "block";
  });

  updateClearMetricsButton();
  updateMetricsArrowState();

  isDropdownOpen = false;
  toggleDropdown(metricsDropdown, arrow, false);
  updateSortFieldOptions();
}

const selectedMetricsEl = document.getElementById("selectedMetrics");
const metricsDropdown = document.getElementById("metricsDropdown");


selectedMetricsEl.addEventListener("click", (event) => {
  // Prevent dropdown toggle if clicking a tag (e.g., close button)
  if (event.target.closest(".tag-metric")) return;

  const arrow = document.getElementById("metricsArrow");

  // Block — if arrow is disabled, stop everything
  if (arrow.classList.contains("cursor-not-allowed")) {
    return;
  }

  const visibleItems = Array.from(metricsDropdown.querySelectorAll("div"))
    .filter(item => item.style.display !== "none");

  const isOpen = metricsDropdown.getAttribute("data-open") === "true";

  if (visibleItems.length === 0) {
    closeDropdown(metricsDropdown);
    arrow.classList.remove("rotate-180");
    return;
  }

  toggleDropdown(metricsDropdown, arrow, !isOpen);
  isDropdownOpen = !isOpen;
  updateSortFieldOptions();
});


/* metrics multiselect script - ends here */
document.addEventListener("click", (e) => {
  const dropdowns = [
    { menu: document.getElementById("metricsDropdown"), trigger: document.getElementById("selectedMetrics"), arrow: document.getElementById("metricsArrow") },
    { menu: document.getElementById("dimensionsDropdown"), trigger: document.getElementById("selectedDimensions"), arrow: document.getElementById("dimensionsArrow") },
    { menu: document.getElementById("dateRangeDropdown"), trigger: document.getElementById("selectedDateRange"), arrow: document.getElementById("dateRangeArrow") }
  ];

  dropdowns.forEach(({ menu, trigger, arrow }) => {
    if (menu && !menu.contains(e.target) && !trigger.contains(e.target)) {
      closeDropdown(menu);
      arrow?.classList.remove("rotate-180");
    }
  });
});

document.querySelectorAll('.dimension-option').forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent closing the dropdown
    const label = item.getAttribute('data-label');
    if (label) {
      selectDimension(label);
    }
  });
});



function closeDropdown(dropdown) {
  dropdown.style.height = "0px";

  setTimeout(() => {
    dropdown.style.width = "0px";
    dropdown.style.opacity = "0";
  }, 300);

  setTimeout(() => {
    dropdown.classList.remove("block");
    dropdown.classList.add("hidden");
    dropdown.setAttribute("data-open", "false");
  }, 10);
}

function openDropdown(dropdown) {
  dropdown.classList.remove("hidden");
  dropdown.classList.add("block");

  dropdown.style.height = "0px";
  // dropdown.style.width = "0px";
  dropdown.style.opacity = "0";

  requestAnimationFrame(() => {
    dropdown.style.width = "100%";
    dropdown.style.opacity = "1";

    setTimeout(() => {
      dropdown.style.height = dropdown.scrollHeight + "px";
      dropdown.setAttribute("data-open", "true");
    }, 50);
  });
}
function refreshDropdownHeight(dropdown) {

  if (typeof dropdown === "string") {
    dropdown = document.getElementById(dropdown);
  }

  if (!dropdown || typeof dropdown.getAttribute !== "function") return;

  if (dropdown.getAttribute("data-open") === "true") {
    setTimeout(() => {
      dropdown.style.height = "auto"; // Reset to allow re-calc
      const newHeight = dropdown.scrollHeight + "px";

      dropdown.style.height = dropdown.offsetHeight + "px"; // Force reflow

      requestAnimationFrame(() => {
        dropdown.style.height = newHeight;
      });
    }, 300); // Delay for animation/DOM sync
  }
}





function toggleDropdown(dropdown, arrow, open) {
  const allDropdowns = document.querySelectorAll('[data-open="true"]');
  const allArrows = document.querySelectorAll('svg.rotate-180');

  // Close any other open dropdowns and reset arrows
  allDropdowns.forEach(d => {
    if (d !== dropdown) closeDropdown(d);
  });
  allArrows.forEach(a => {
    if (a !== arrow) a.classList.remove("rotate-180");
  });

  const visibleItems = Array.from(dropdown.querySelectorAll("div"))
    .filter(item => item.style.display !== "none");

  const arrowDisabled = arrow?.classList.contains("cursor-not-allowed");

  if (open && visibleItems.length === 0) {
    closeDropdown(dropdown);
    arrow?.classList.remove("rotate-180");
    return;
  }

  if (open) {
    openDropdown(dropdown);
    if (!arrowDisabled) arrow?.classList.add("rotate-180");
  } else {
    closeDropdown(dropdown);
    arrow?.classList.remove("rotate-180");
  }
}

// toogle filters slide down starts here

function toggleFilters() {
  const section = document.getElementById('filterSection');
  const arrow = document.getElementById('filterArrow');
  section.classList.toggle('hidden');
  arrow.classList.toggle('rotate-180');
}
// toogle filters slide down ends here


document.querySelectorAll('[data-toggle="dropdown"]').forEach(toggle => {
  toggle.addEventListener('click', function (e) {
    e.stopPropagation();

    const targetSelector = this.getAttribute('data-target');
    const arrowSelector = this.getAttribute('data-arrow');
    const dropdown = document.querySelector(targetSelector);
    const arrow = document.querySelector(arrowSelector);
    const isOpen = dropdown.getAttribute('data-open') === 'true';

    // Close all dropdowns
    document.querySelectorAll('[data-toggle="dropdown"]').forEach(el => {
      const d = document.querySelector(el.getAttribute('data-target'));
      const a = document.querySelector(el.getAttribute('data-arrow'));
      if (d) {
        d.style.height = "0px";
        d.style.width = "0px";
        d.style.opacity = "0";
        d.setAttribute('data-open', 'false');
      }
      if (a) a.classList.remove('rotate-180');
    });

    // Open current if it was closed
    if (!isOpen) {
      dropdown.style.height = dropdown.scrollHeight + "px";
      dropdown.style.width = "100%";
      dropdown.style.opacity = "1";
      dropdown.setAttribute('data-open', 'true');
      arrow?.classList.add('rotate-180');
    }
  });
});

let isDimensionsDropdownOpen = false;

const selectedDimensionsEl = document.getElementById("selectedDimensions");
const dimensionsArrow = document.getElementById("dimensionsArrow");

selectedDimensionsEl.addEventListener("click", (event) => {
  if (event.target.closest(".tag-metric")) return;

  const isOpen = dimensionsDropdown.getAttribute("data-open") === "true";

  // Close other dropdowns
  document.querySelectorAll('[data-open="true"]').forEach(d => {
    if (d !== dimensionsDropdown) closeDropdown(d);
  });
  document.querySelectorAll('svg.rotate-180').forEach(a => {
    if (a !== dimensionsArrow) a.classList.remove("rotate-180");
  });

  toggleDropdown(dimensionsDropdown, dimensionsArrow, !isOpen);
  isDimensionsDropdownOpen = !isOpen;
});

// Function to handle click on dimensions dropdown items

// Update the "Clear Dimensions" button visibility based on selected dimensions
function updateClearDimensionsButton() {
  const btn = document.getElementById("clearDimensionsBtn");
  if (selectedDimensions.size >= 2) {
    btn.classList.remove("hidden");
  } else {
    btn.classList.add("hidden");
  }
}


function clearAllDimensions() {
  selectedDimensions.clear();

  // Remove all tag-metric elements only (not the placeholder)
  const tagContainer = document.getElementById("dimensionsTagsContainer");
  // tagContainer.querySelectorAll(".tag-metric").forEach(tag => tag.remove());
  tagContainer.querySelectorAll('[id^="tag-dimension-"]').forEach(el => el.remove());

  // Show the placeholder again
  const placeholder = document.getElementById("dimensionsPlaceholder");
  if (placeholder) placeholder.classList.remove("hidden");

  // Show all dropdown options again
  document.querySelectorAll("#dimensionsDropdown > div").forEach(item => {
    item.style.display = "flex";
  });

  updateClearDimensionsButton();

  // Reset dropdown state
  isDimensionsDropdownOpen = false;
  const arrow = document.getElementById("dimensionsArrow");
  toggleDropdown(dimensionsDropdown, arrow, false);
  updateSortFieldOptions();
}

//filter functionality starts here

/* add filter row script starts here */

const filterFieldOptions = [
  "Query", "URL", "Country", "Page", "Search Type", "Device", "Site URL", "Date", "Month", "Year",
  "Is Anonymized Query", "Is Anonymized Discover", "Is AMP Top Stories", "Is AMP Blue Link", "Is Job Listing",
  "Is Job Details", "Is TPF QA", "Is TPF FAQ", "Is TPF HowTo", "Is Weblite", "Is Action", "Is Events Listing",
  "Is Events Details", "Is Search Appearance Android App", "Is AMP Story", "Is AMP Image Result", "Is Video",
  "Is Organic Shopping", "Is Review Snippet", "Is Special Announcement", "Is Recipe Feature", "Is Recipe Rich Snippet",
  "Is Subscribed Content", "Is Page Experience", "Is Practice Problems", "Is Math Solvers", "Is Translated Result",
  "Is Product Snippets", "Is Merchant Listings", "Impressions"
];

// const operatorOptions = [
//   "EQUALS", "NOT EQUALS", "CONTAINS", "NOT CONTAINS", "GREATER THAN",
//   "LESS THAN", "IS NULL", "IS NOT NULL"
// ];


function addFilterRow() {
  const container = document.getElementById('filterRows');
  const isFirst = container.children.length === 0;

  const wrapper = document.createElement('div');
  wrapper.className = "space-y-2 w-full transition-all duration-500 ease-in-out overflow-hidden1 opacity-100 max-h-[200px]";

  if (!isFirst) {
    const topRow = document.createElement('div');
    topRow.className = "flex justify-between items-center";

    const radioGroup = document.createElement('div');
    radioGroup.className = "flex items-center gap-4 text-sm text-white";

    radioGroup.innerHTML = `
      <label class="inline-flex items-center gap-1 m-0 font-semibold font-semibold font-semibold">
        <input type="radio" name="logicGroup-${container.children.length}" value="AND" class="radio radio-sm  " checked />
        AND
      </label>
      <label class="inline-flex items-center gap-1 m-0 font-semibold font-semibold font-semibold">
        <input type="radio" name="logicGroup-${container.children.length}" value="OR" class="radio radio-sm  " />
        OR
      </label>
    `;

    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = "&times;";
    removeBtn.className = "text-white text-lg font-bold px-3 hover:text-red-500 flex w-auto pr-0 cursor-pointer transition-colors duration-300 ease-in-out";
    removeBtn.onclick = () => {
      wrapper.style.opacity = '0';
      wrapper.style.maxHeight = '0px';
      wrapper.style.padding = '0';
      wrapper.style.margin = '0';
      setTimeout(() => {
        wrapper.remove();
        updateFilterRemoveButton();
      }, 500);
    };

    topRow.appendChild(radioGroup);
    topRow.appendChild(removeBtn);
    wrapper.appendChild(topRow);
  }

  const bottomRow = document.createElement('div');
  bottomRow.className = "flex flex-nowrap items-center gap-2 overflow-x-auto1";

  const fieldSelect = document.createElement('select');
  fieldSelect.className = 'w-[calc(33%-23px)] sm:w-[calc(33%-25px)] md:w-[calc(33%-25px)] select input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] text-sm';
  fieldSelect.required = true;
  fieldSelect.innerHTML =
    `<option value="" disabled selected hidden>Select Field</option>` +
    filterFieldOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');

  console.log('Filter fields loaded:', filterFieldOptions);

  const operatorSelect = document.createElement('select');
  operatorSelect.className = "w-[calc(25%-22px)] select input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] text-sm";

  const textInput = document.createElement('input');
  textInput.type = "text";
  textInput.placeholder = "Type value";
  textInput.className = "input w-[calc(50%-22px)] input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] text-sm";

  const radioWrapper = document.createElement('div');
  radioWrapper.className = "flex gap-4 items-center text-white hidden";
  radioWrapper.innerHTML = `
    <label class="inline-flex items-center gap-1 m-0 font-semibold font-semibold font-semibold">
      <input type="radio" name="bool-val-filter-${Date.now()}" value="TRUE" class="radio radio-sm  " />
      TRUE
    </label>
    <label class="inline-flex items-center gap-1 m-0 font-semibold font-semibold font-semibold">
      <input type="radio" name="bool-val-filter-${Date.now()}" value="FALSE" class="radio radio-sm  " />
      FALSE
    </label>
  `;

  // Handle field changes
  fieldSelect.addEventListener('change', () => {
    const field = fieldSelect.value;
    const type = getOperatorType(field);

    // Update operator dropdown
    let operators = filterOperatorMap[type] || [];
    let defaultOperator = 'EQUALS';

    operatorSelect.innerHTML = operators.map(opt =>
      `<option value="${opt}" ${opt === defaultOperator ? 'selected' : ''}>${opt}</option>`
    ).join('');

    // Reset visibility
    textInput.classList.add('hidden');
    radioWrapper.classList.add('hidden');
    const oldSearch = bottomRow.querySelector('.country-search-wrapper');
    if (oldSearch) oldSearch.remove();

    // Toggle input type based on field type
    if (type === 'boolean') {
      radioWrapper.classList.remove('hidden');
      const trueRadio = radioWrapper.querySelector('input[value="TRUE"]');
      if (trueRadio) trueRadio.checked = true;

      if (!bottomRow.contains(radioWrapper)) bottomRow.appendChild(radioWrapper);
    } else if (type === 'country') {
      const wrapper = document.createElement('div');
      wrapper.className = 'flex-1 h-10 country-search-wrapper';
      enableCountrySearchStyled('filter-country', window.predefinedCountries, wrapper);
      bottomRow.appendChild(wrapper);
    } else {
      textInput.classList.remove('hidden');
    }
  });

  bottomRow.appendChild(fieldSelect);
  bottomRow.appendChild(operatorSelect);
  bottomRow.appendChild(textInput);
  wrapper.appendChild(bottomRow);
  container.appendChild(wrapper);

  updateFilterRemoveButton();
  
}

function removeFilterRow() {
  const container = document.getElementById('filterRows');
  if (container.children.length > 1) {
    container.lastElementChild.remove();
    updateFilterRemoveButton();
  }
}

function updateFilterRemoveButton() {
  const container = document.getElementById('filterRows');
  const removeBtn = document.getElementById('removeFilterRowBtn');
  updateSortFieldOptions();
  if (!removeBtn) return;

  if (container.children.length <= 1) {
    removeBtn.classList.add("hidden");
  } else {
    removeBtn.classList.remove("hidden");
  }
  
}



/* add filter row script ends here */


function enableCountrySearchStyled(idPrefix, countries, parentElement) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex-1 country-search-wrapper relative';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type to search country...';
  input.className = 'input input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] w-[calc(100%-0px)] text-sm';
  input.autocomplete = 'off';

  input.classList.add('country-search-input'); // Adding class to the serach-dropdown-input 

  const dropdown = document.createElement('div');
  dropdown.className = 'absolute z-50 bg-gray-800 border border-gray-600 rounded max-h-[200px] w-full overflow-y-auto hidden';
  dropdown.style.maxHeight = '200px';

  let currentSelection = null;

  function renderOptions(filtered) {
    dropdown.innerHTML = '';
    filtered.forEach(country => {
      const option = document.createElement('div');
      option.className = 'px-3 py-2 text-white hover:bg-gray-600 cursor-pointer ';
      option.textContent = country.name;
      option.dataset.code = country.code;

      option.addEventListener('click', () => {
        input.value = country.name;
        input.dataset.code = country.code;
        currentSelection = country;
        dropdown.classList.add('hidden');
      });

      dropdown.appendChild(option);
    });

    if (filtered.length > 0) {
      dropdown.classList.remove('hidden');
    } else {
      dropdown.classList.add('hidden');
    }
  }

  input.addEventListener('input', () => {
    const term = input.value.trim().toLowerCase();
    const filtered = countries.filter(c =>
      c.name.toLowerCase().startsWith(term)
    );
    renderOptions(filtered);
  });

  input.addEventListener('focus', () => {
    const term = input.value.trim().toLowerCase();
    const filtered = countries.filter(c =>
      c.name.toLowerCase().startsWith(term)
    );
    renderOptions(filtered);
  });

  // Optional: hide on click outside
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });

  wrapper.appendChild(input);
  wrapper.appendChild(dropdown);

  parentElement.appendChild(wrapper);

  return input; // So you can still access input.dataset.code
}


/* scripts for creating custom Fields filters - starts here */


function toggleCustomFields() {
  const section = document.getElementById('customFieldsSection');
  const arrow = document.getElementById('customFilterArrow');
  section.classList.toggle('hidden');
  arrow.classList.toggle('rotate-180');
}


function createConditionRow(hasRemove = true, addButtons = true, groupContainer = null, defaultField = '', defaultOperator = 'EQUALS') {
  const wrapper = document.createElement('div');
  wrapper.className = 'card-body gap-4 bg-gray-800 border-gray-200 card-border border-base-300';

  const inputRow = document.createElement('div');
  inputRow.className = 'flex items-center gap-2 flex-wrap ';

  const whenLabel = document.createElement('label');
  whenLabel.className = 'text-white text-sm whitespace-nowrap mt-0 w-[calc(50px)] font-semibold font-semibold';
  whenLabel.textContent = 'When';
  inputRow.appendChild(whenLabel);

  const fieldSelect = document.createElement('select');
  fieldSelect.className = 'w-[calc(33%-23px)] sm:w-[calc(33%-25px)] select input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] text-sm';
  fieldSelect.innerHTML =
    `<option value="" disabled ${!defaultField ? 'selected hidden' : ''}>Select Field</option>` +
    fieldOptionsCustomField.map(opt => `<option value="${opt}" ${opt === defaultField ? 'selected' : ''}>${opt}</option>`).join('');

  const operatorSelect = document.createElement('select');
  operatorSelect.className = 'w-[calc(33%-23px)] sm:w-[calc(33%-25px)] select input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] text-sm';

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.placeholder = 'My Website Name';
  valueInput.className = 'input w-[calc(30%-1px)] input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] text-sm';

  const valueSelectWrapper = document.createElement('div');
  valueSelectWrapper.className = 'hidden w-full flex-1';

  const uniqueRadioName = `bool-val-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const radioWrapper = document.createElement('div');
  radioWrapper.className = "flex gap-4 items-center text-white hidden";
  radioWrapper.innerHTML = `
    <label class="inline-flex items-center gap-1 m-0 font-semibold font-semibold font-semibold">
      <input type="radio" name="${uniqueRadioName}" value="TRUE" class="radio radio-sm  " />
      TRUE
    </label>
    <label class="inline-flex items-center gap-1 m-0 font-semibold font-semibold font-semibold">
      <input type="radio" name="${uniqueRadioName}" value="FALSE" class="radio radio-sm  " />
      FALSE
    </label>
  `;

  function updateValueInputType(field) {
    const type = getOperatorType(field);
    const operators = filterOperatorMap[type] || [];
    const defaultOp = 'EQUALS';

    operatorSelect.innerHTML =
      operators.map(opt => `<option value="${opt}" ${opt === defaultOp ? 'selected' : ''}>${opt}</option>`).join('');

    valueInput.classList.add('hidden');
    radioWrapper.classList.add('hidden');
    valueSelectWrapper.classList.add('hidden');
    valueSelectWrapper.innerHTML = '';

    if (type === 'boolean') {
      radioWrapper.classList.remove('hidden');
      const trueRadio = radioWrapper.querySelector(`input[value="TRUE"]`);
      if (trueRadio) trueRadio.checked = true;
    } else if (type === 'country') {
      valueSelectWrapper.classList.remove('hidden');
      enableCountrySearchStyled(`customfield-country-${Date.now()}`, window.predefinedCountries, valueSelectWrapper);
    } else {
      valueInput.classList.remove('hidden');
    }
  }

  fieldSelect.addEventListener('change', () => {
    updateValueInputType(fieldSelect.value);
  });

  // Auto-select first field if no default provided
  if (!defaultField) {
    const firstOption = fieldSelect.querySelector('option:not([disabled])');
    if (firstOption) fieldSelect.value = firstOption.value;
  }

  inputRow.appendChild(fieldSelect);
  inputRow.appendChild(operatorSelect);
  inputRow.appendChild(valueInput);
  inputRow.appendChild(valueSelectWrapper);
  inputRow.appendChild(radioWrapper);
  wrapper.appendChild(inputRow);

  const thenRow = document.createElement('div');
  thenRow.className = 'flex items-center gap-2';

  const thenLabel = document.createElement('label');
  thenLabel.className = 'text-white text-sm whitespace-nowrap mt-0 w-[calc(50px)] font-semibold font-semibold';
  thenLabel.textContent = 'Then';

  const thenInput = document.createElement('input');
  thenInput.type = 'text';
  thenInput.placeholder = 'Brand';
  thenInput.className = 'input input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] w-[calc(65%-22px)] text-sm';

  thenRow.appendChild(thenLabel);
  thenRow.appendChild(thenInput);

  if (addButtons) {
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '−';
    removeBtn.className = 'btn btn-md btn-ghost ';
    removeBtn.onclick = () => {
      wrapper.remove();
      updateConditionButtonsVisibility(groupContainer);
    };

    const addConditionBtn = document.createElement('button');
    addConditionBtn.textContent = '+ Condition';
    addConditionBtn.className = 'btn btn-md btn-ghost';
    addConditionBtn.onclick = () => {
      if (!groupContainer) return;
      const newGroup = createConditionRow(true, true, groupContainer, '', 'EQUALS');
      newGroup.classList.add('added-custom-condition-group');

      const elseRow = Array.from(groupContainer.children).find(child => {
        const label = child.querySelector('label');
        return label && label.textContent.trim().toLowerCase() === 'else';
      });

      if (elseRow) {
        groupContainer.insertBefore(newGroup, elseRow);
      } else {
        groupContainer.appendChild(newGroup);
      }

      updateConditionButtonsVisibility(groupContainer);
    };

    thenRow.appendChild(removeBtn);
    thenRow.appendChild(addConditionBtn);
  }

  wrapper.appendChild(thenRow);

  // Trigger input initialization after DOM is attached
  setTimeout(() => {
    const initialField = fieldSelect.value || defaultField;
    if (initialField) updateValueInputType(initialField);
  }, 0);

  return wrapper;
}


function createConditionGroupWrapper(groupContainer) {
  // Defaults: no preselected field, but operator is 'EQUALS'
  const newGroup = createConditionRow(true, true, groupContainer, '', 'EQUALS');
  newGroup.classList.add('added-custom-condition-group');
  return newGroup;
}

// Pre-select "Query" and "CONTAINS" for the first custom field group
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const firstGroup = document.querySelector('#customFieldGroups > div');
    if (!firstGroup) return;

    const fieldSelect = firstGroup.querySelector('select:nth-of-type(1)');
    const operatorSelect = firstGroup.querySelector('select:nth-of-type(2)');

    if (fieldSelect) fieldSelect.value = 'Query';
    if (operatorSelect) operatorSelect.value = 'CONTAINS';
  }, 100); // slight delay to ensure DOM is updated
});





function addCustomFieldGroup() {
  const groupContainer = document.createElement('div');
  groupContainer.className = 'card bg-base-100 card-border border-base-300 card-sm gap-4 p-4 pt-[24px]';

  const isFirstGroup = document.querySelectorAll('#customFieldGroups > div').length > 0;

  if (isFirstGroup) {
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'absolute top-1 right-1 text-white text-lg w-[20px] h-[20px] font-bold hover:text-red-500 font-extralight rounded-[5px] leading-[100%]';
    closeBtn.onclick = () => groupContainer.remove();
    groupContainer.appendChild(closeBtn);
  }

  const conditionsWrapper = document.createElement('div');
  conditionsWrapper.className = 'space-y-4 custom-condition-group';

  const conditionRow = document.createElement('div');
  conditionRow.className = 'space-y-2';

  const inputRow = document.createElement('div');
  inputRow.className = 'flex items-center gap-2 flex-wrap';

  const whenLabel = document.createElement('label');
  whenLabel.className = 'text-white text-sm whitespace-nowrap mt-0 w-[calc(50px)] font-semibold font-semibold';
  whenLabel.textContent = 'When';

  const fieldSelect = document.createElement('select');
  fieldSelect.className = 'w-[calc(33%-23px)] sm:w-[calc(33%-25px)] select input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] text-sm';
  fieldSelect.innerHTML = `<option value="" disabled selected hidden>Select Field</option>` +
    fieldOptionsCustomField.map(opt => `<option value="${opt}">${opt}</option>`).join('');

  const operatorSelect = document.createElement('select');
  operatorSelect.className = 'w-[calc(33%-23px)] sm:w-[calc(33%-25px)] select input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] text-sm';

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.placeholder = 'My Website Name';
  valueInput.className = 'input w-[calc(33%-23px)] sm:w-[calc(33%-25px)] input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] text-sm';

  const valueSelect = document.createElement('select');
  valueSelect.className = 'hidden flex-1 h-10 px-3 rounded-[8px] border border-gray-600 bg-gray-700 text-white';
  valueSelect.innerHTML = `<option value="" disabled selected hidden>Select Country</option>` +
    predefinedCountries.map(c => `<option value="${c.code}">${c.name}</option>`).join('');

  const uniqueRadioName = `bool-val-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const radioWrapper = document.createElement('div');
  radioWrapper.className = 'flex gap-4 items-center text-white hidden';
  radioWrapper.innerHTML = `
    <label class="inline-flex items-center gap-1 m-0 font-semibold font-semibold font-semibold">
      <input type="radio" name="${uniqueRadioName}" value="TRUE" class="radio radio-sm  " checked />
      TRUE
    </label>
    <label class="inline-flex items-center gap-1 m-0 font-semibold font-semibold font-semibold">
      <input type="radio" name="${uniqueRadioName}" value="FALSE" class="radio radio-sm  " />
      FALSE
    </label>
  `;

  fieldSelect.addEventListener('change', () => {
    const isBooleanField = fieldSelect.value.startsWith('Is ');
    const isCountryField = fieldSelect.value === 'Country';

    // Remove previous country search wrapper if exists
    const oldCountryWrapper = inputRow.querySelector('.country-search-wrapper');
    if (oldCountryWrapper) oldCountryWrapper.remove();

    if (isBooleanField) {
      operatorSelect.innerHTML = `<option value="EQUALS" selected>EQUALS</option><option value="NOT EQUALS">NOT EQUALS</option>`;
      valueInput.classList.add('hidden');
      valueSelect.classList.add('hidden');
      radioWrapper.classList.remove('hidden');

      // Select TRUE by default
      const trueRadio = radioWrapper.querySelector(`input[value="TRUE"]`);
      if (trueRadio) trueRadio.checked = true;

    } else if (isCountryField) {
      operatorSelect.innerHTML = `
        <option value="EQUALS" selected>EQUALS</option>
        <option value="NOT EQUALS">NOT EQUALS</option>
      `;
      valueInput.classList.add('hidden');
      radioWrapper.classList.add('hidden');



      const countryWrapper = document.createElement('div');
      countryWrapper.className = 'flex-1 country-search-wrapper h-10';

      enableCountrySearchStyled('custom-country', window.predefinedCountries, countryWrapper);
      inputRow.appendChild(countryWrapper);

    } else {
      operatorSelect.innerHTML = operatorOptionsCustomFields.map(opt =>
        `<option value="${opt}" ${opt === 'EQUALS' ? 'selected' : ''}>${opt}</option>`).join('');
      valueInput.classList.remove('hidden');
      valueSelect.classList.add('hidden');
      radioWrapper.classList.add('hidden');
    }
  });

  inputRow.appendChild(whenLabel);
  inputRow.appendChild(fieldSelect);
  inputRow.appendChild(operatorSelect);
  inputRow.appendChild(valueInput);
  inputRow.appendChild(valueSelect);
  inputRow.appendChild(radioWrapper);

  // Trigger initial selection so the operator is populated and EQUALS is selected
  setTimeout(() => {
    fieldSelect.value = 'Query';
    fieldSelect.dispatchEvent(new Event('change'));
  }, 500);

  conditionRow.appendChild(inputRow);
  conditionsWrapper.appendChild(conditionRow);



  const thenRow = document.createElement('div');
  thenRow.className = 'flex items-center gap-2';

  const thenLabel = document.createElement('label');
  thenLabel.className = 'text-white text-sm whitespace-nowrap mt-0 w-[calc(50px)] font-semibold font-semibold';
  thenLabel.textContent = 'Then';

  const thenInput = document.createElement('input');
  thenInput.type = 'text';
  thenInput.placeholder = 'Brand';
  thenInput.className = 'input input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] w-[calc(72%-8px)] text-sm';

  const addConditionBtn = document.createElement('button');
  addConditionBtn.textContent = '+ Condition';
  addConditionBtn.className = 'btn btn-md btn-ghost ';
  addConditionBtn.onclick = () => {
    const newGroup = createConditionGroupWrapper(groupContainer);
    const elseRow = Array.from(groupContainer.children).find(child => {
      const label = child.querySelector('label');
      return label && label.textContent.trim().toLowerCase() === 'else';
    });

    if (elseRow) {
      groupContainer.insertBefore(newGroup, elseRow);
    } else {
      groupContainer.appendChild(newGroup);
    }

    updateConditionButtonsVisibility(groupContainer);
  };

  thenRow.appendChild(thenLabel);
  thenRow.appendChild(thenInput);
  thenRow.appendChild(addConditionBtn);

  const elseRow = document.createElement('div');
  elseRow.className = 'flex items-center gap-2';

  const elseLabel = document.createElement('label');
  elseLabel.className = 'text-white text-sm whitespace-nowrap mt-0 w-[calc(55px)] font-semibold';
  elseLabel.textContent = 'Else';

  const elseInput = document.createElement('input');
  elseInput.type = 'text';
  elseInput.placeholder = 'Non-Brand';
  elseInput.className = 'input w-full input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] text-sm';

  elseRow.appendChild(elseLabel);
  elseRow.appendChild(elseInput);

  groupContainer.appendChild(conditionsWrapper);
  groupContainer.appendChild(thenRow);
  groupContainer.appendChild(elseRow);

  document.getElementById('customFieldGroups').appendChild(groupContainer);
}

function updateConditionButtonsVisibility(groupContainer) {
  const addedGroups = Array.from(groupContainer.querySelectorAll('.added-custom-condition-group'));

  // Hide all + Condition buttons in this group
  addedGroups.forEach(group => {
    const plusBtn = [...group.querySelectorAll('button')].find(btn => btn.textContent.trim() === '+ Condition');
    if (plusBtn) {
      plusBtn.classList.add('hidden');
    }
  });

  // Show + Condition only in the last added group (within this container)
  if (addedGroups.length > 0) {
    const lastGroup = addedGroups[addedGroups.length - 1];
    const lastPlusBtn = [...lastGroup.querySelectorAll('button')].find(btn => btn.textContent.trim() === '+ Condition');
    if (lastPlusBtn) {
      lastPlusBtn.classList.remove('hidden');
    }
  }

  // Handle the initial (non-added) group in this container


  const conditionsWrapper = groupContainer.querySelector('.custom-condition-group');
  const initialGroup = conditionsWrapper?.querySelector(':scope > div:not(.added-custom-condition-group)');


  if (initialGroup) {

    const initialPlusBtn = groupContainer.querySelector('.initial-add-btn');
    // const initialMinusBtn = groupContainer.querySelector('.initial-remove-btn');

    if (initialPlusBtn) {

      if (addedGroups.length === 0) {
        initialPlusBtn.classList.remove('hidden');
        // initialMinusBtn.classList.add('hidden');
      } else {
        initialPlusBtn.classList.add('hidden');
        // initialMinusBtn.classList.remove('hidden');
      }
    }
  }
}


// Shared dropdown values for custom fields
const fieldOptionsCustomField = [
  "Query", "URL", "Country", "Search Type", "Device", "Site URL", "Date", "Month", "Year",
  "Is Anonymized Query", "Is Anonymized Discover", "Is AMP Top Stories", "Is AMP Blue Link",
  "Is Job Listing", "Is Job Details", "Is TPF QA", "Is TPF FAQ", "Is TPF HowTo", "Is Weblite",
  "Is Action", "Is Events Listing", "Is Events Details", "Is Search Appearance Android App",
  "Is AMP Story", "Is AMP Image Result", "Is Video", "Is Organic Shopping", "Is Review Snippet",
  "Is Special Announcement", "Is Recipe Feature", "Is Recipe Rich Snippet", "Is Subscribed Content",
  "Is Page Experience", "Is Practice Problems", "Is Math Solvers", "Is Translated Result",
  "Is Product Snippets", "Is Merchant Listings"
];

const operatorOptionsCustomFields = [
  "EQUALS", "NOT EQUALS", "CONTAINS", "NOT CONTAINS", "REGEX CONTAINS", "REGEX NOT CONTAINS"
];

/* scripts for creating custom Fields filters - ends here */


document.addEventListener("click", (e) => {
  const dropdowns = [
    {
      menu: document.getElementById("metricsDropdown"),
      trigger: document.getElementById("selectedMetrics"),
      arrow: document.getElementById("metricsArrow")
    },
    {
      menu: document.getElementById("dimensionsDropdown"),
      trigger: document.getElementById("selectedDimensions"),
      arrow: document.getElementById("dimensionsArrow")
    },
    {
      menu: document.getElementById("dateRangeDropdown"),
      trigger: document.getElementById("selectedDateRange"),
      arrow: document.getElementById("dateRangeArrow")
    }
  ];

  dropdowns.forEach(({ menu, trigger, arrow }) => {
    if (
      menu?.getAttribute("data-open") === "true" &&
      !menu.contains(e.target) &&
      !trigger.contains(e.target)
    ) {
      // Close dropdown
      menu.classList.add("hidden");
      menu.classList.remove("block");
      menu.setAttribute("data-open", "false");

      // Reset arrow rotation
      arrow?.classList.remove("rotate-180");
    }
  });
});


//filter functionality ends here
// Pre-select default metrics on page load
['Clicks', 'Impressions', 'CTR', 'Position'].forEach(metric => selectMetric(metric));
// Inject the first filter row on page load
addFilterRow();
// Inject the first sort row on page load
addSortRow();
// Inject the first custom field group is present on page load
addCustomFieldGroup();


function normalizeFieldName(fieldLabel) {
  const trimmed = fieldLabel.trim();
  if (trimmed === 'Year') return 'YEAR';
  if (trimmed === 'Month') return 'MONTH';
  if (trimmed === 'Date') return 'DATE';
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '_');
}



function highlightSQL(sqlText) {
  return sqlText
    .replace(/\b(SELECT|FROM|WHERE|AND|OR|GROUP BY|ORDER BY|CASE|WHEN|THEN|ELSE|END|AS|BETWEEN|IS NOT NULL|IS NULL|NOT|IN|ON|JOIN|INNER|LEFT|OUTER|DISTINCT)\b/gi,
      match => `<span class="sql-keyword">${match.toUpperCase()}</span>`)
    .replace(/\b(SUM|SAFE_DIVIDE|REGEXP_CONTAINS|AVG|COUNT|MAX|MIN)\b(?=\s*\()/gi,
      match => `<span class="sql-function">${match}</span>`)

    .replace(/\b(CURRENT_DATE|CURRENT_TIMESTAMP|NOW)\b/gi,
      match => `<span class="sql-function">${match.toUpperCase()}</span>`)
    .replace(/\bAS\s+(\w+)/gi, (match, p1) => {
      const upper = p1.toUpperCase();
      const specialAlias = ['YEAR', 'MONTH', 'DATE'];
      if (specialAlias.includes(upper)) {
        return `AS <span class="sql-alias-special">${upper}</span>`;
      }
      return `AS <span class="sql-alias">${p1}</span>`;
    })
    .replace(/'(%Y(?:-%m)?)'/g, (match, pattern) => {
      return `<span class="sql-date-format">'${pattern}'</span>`;
    })
    .replace(/\b(TRUE|FALSE)\b/gi,
      match => `<span class="sql-boolean">${match.toUpperCase()}</span>`)
    .replace(/(?<![\w])(\d+(\.\d+)?)(?![\w])/g,
      match => `<span class="sql-expression">${match}</span>`)
    .replace(/\b(\w+)\s+(ASC|DESC)\b/gi,
      (match, col, dir) =>
        `<span class="sql-column">${col}</span> <span class="sql-keyword">${dir.toUpperCase()}</span>`)
    .replace(/\b(YEAR|MONTH|DATE)\b/g,
      match => `<span class="sql-alias-special">${match}</span>`);
}



function isDerivedDimension(dim) {
  return dim === 'Year';
}

function getDimensionSelectLine(dim) {
  const normalized = normalizeFieldName(dim);

  if (dim === 'Year') {
    return {
      html: `<span class="sql-function">FORMAT_TIMESTAMP('%Y', data_date)</span> AS <span class="sql-alias">year</span>`,
      text: `    FORMAT_TIMESTAMP('%Y', data_date) AS year`,
      alias: 'year'
    };
  } else if (dim === 'Month') {
    return {
      html: `<span class="sql-function">FORMAT_TIMESTAMP('%Y-%m', data_date)</span> AS <span class="sql-alias">month</span>`,
      text: `    FORMAT_TIMESTAMP('%Y-%m', data_date) AS month`,
      alias: 'month'
    };
  } else if (dim === 'Date') {
    return {
      html: `<span class="sql-column">data_date</span> AS <span class="sql-alias">date</span>`,
      text: `    data_date AS date`,
      alias: 'date'
    };
  }

  return {
    html: `<span class="sql-column">${normalized}</span>`,
    text: `    ${normalized}`,
    alias: normalized
  };
}

export function generateSQL() {
  updateFilterAndSortClauses();
  const dateClause = getDateRangeClause(selectedDateRange);
  const metrics = Array.from(selectedMetrics);
  const dimensions = Array.from(selectedDimensions);

  const indent = '<span style="display:inline-block; width:1em"></span>';
  const selectLines = [];
  const plainSelectLines = [];
  const customFieldsToGroup = [];
  const groupAliases = [];

  dimensions.forEach(dim => {
    const { html, text, alias } = getDimensionSelectLine(dim);

    // Force lowercase alias if it's DATE (or always)
    const aliasLower = alias.toLowerCase();
    const textLower = text.replace(new RegExp(` AS ${alias}`, 'i'), ` AS ${aliasLower}`);

    selectLines.push(`${indent}${html.replace(new RegExp(` AS ${alias}`, 'i'), ` AS ${aliasLower}`)}`);
    plainSelectLines.push(textLower);
    groupAliases.push(aliasLower);
  });




  if (metrics.includes('Clicks')) {
    selectLines.push(`${indent}<span class="sql-function">SUM(clicks)</span> AS <span class="sql-alias">clicks</span>`);
    plainSelectLines.push(`    SUM(clicks) AS clicks`);
  }
  if (metrics.includes('Impressions')) {
    selectLines.push(`${indent}<span class="sql-function">SUM(impressions)</span> AS <span class="sql-alias">impressions</span>`);
    plainSelectLines.push(`    SUM(impressions) AS impressions`);
  }
  if (metrics.includes('CTR')) {
    selectLines.push(`${indent}<span class="sql-function">SAFE_DIVIDE</span>(<span class="sql-function">SUM(clicks)</span>, <span class="sql-function">SUM(impressions)</span>) AS <span class="sql-alias">ctr</span>`);
    plainSelectLines.push(`    SAFE_DIVIDE(SUM(clicks), SUM(impressions)) AS ctr`);
  }

  //adding + 1.0 as avg position script commented if needed - starts here
  console.log('Dimensions:', dimensions);
  // if (metrics.includes('Position')) {
  //   const useTopPosition =
  //     dimensions.length === 0 || // No dimensions selected
  //     (dimensions.length === 1 && dimensions[0] === 'URL'); // Only URL selected

  //   const positionField = useTopPosition ? 'sum_top_position' : 'sum_position';

  //   selectLines.push(
  //     `${indent}<span class="sql-function">SAFE_DIVIDE</span>(<span class="sql-function">SUM(${positionField})</span>, <span class="sql-function">SUM(impressions)</span>) + 1.0 AS <span class="sql-alias">avg_position</span>`
  //   );
  //   plainSelectLines.push(
  //     `    SAFE_DIVIDE(SUM(${positionField}), SUM(impressions)) + 1.0 AS avg_position`
  //   );
  // }
  //adding + 1.0 as avg position script commented if needed - ends here

  if (metrics.includes('Position')) {
    const normalizedDims = dimensions.map(d => d.toLowerCase());
    const includesURL = normalizedDims.includes('url');

    const positionField = includesURL ? 'sum_position' : 'sum_top_position';

    selectLines.push(
      `${indent}<span class="sql-function">SAFE_DIVIDE</span>(<span class="sql-function">SUM(${positionField})</span>, <span class="sql-function">SUM(impressions)</span>) AS <span class="sql-alias">avg_position</span>`
    );

    plainSelectLines.push(
      `    SAFE_DIVIDE(SUM(${positionField}), SUM(impressions)) AS avg_position`
    );
  }
  const customFieldGroups = document.querySelectorAll('#customFieldGroups > div');
  let customFieldIndex = 1;

  customFieldGroups.forEach((group) => {
    const conditionBlocks = group.querySelectorAll('.custom-condition-group > div, .added-custom-condition-group');
    const elseRow = group.querySelector('input[placeholder="Non-Brand"], input[placeholder="Non-Brand2"], input[placeholder="Else"]');
    const elseValue = elseRow ? elseRow.value.trim() : '';
    const cases = [];

    conditionBlocks.forEach((block) => {
      const selects = block.querySelectorAll('select');
      const field = selects[0]?.value;
      const normalizedField = normalizeFieldName(field);
      const operator = selects[1]?.value;

      const valueInput = block.querySelector('input[type="text"]');
      // const valueSelect = block.querySelector('select:nth-of-type(3)');

      const countryInputStyled = block.querySelector('input.country-search-input');
      const valueSelect = countryInputStyled?.dataset.code;

      const radioInput = block.querySelector('input[name^="bool-val"]:checked');

      let value;
      if (field === 'Country') {
        // value = valueSelect?.value?.trim();
        value = valueSelect?.trim();
      } else if (field?.startsWith('Is ')) {
        value = radioInput?.value;
      } else {
        value = valueInput?.value?.trim();
      }

      let thenInput;
      if (block.classList.contains('added-custom-condition-group')) {
        thenInput = block.querySelector('input[placeholder="Brand"]');
      } else {
        const thenRow = group.querySelectorAll('div.flex.items-center.gap-2')[1];
        thenInput = thenRow?.querySelector('input[type="text"]');
      }
      const thenValue = thenInput?.value.trim();

      if (!field || !operator || !value || !thenValue) return;

      let condition = '';
      switch (operator) {
        case 'EQUALS':
          condition = field.startsWith('Is ') ? `${normalizedField} = ${value.toUpperCase()}` : `${normalizedField} = '${value}'`;
          break;
        case 'NOT EQUALS':
          if (field.startsWith('Is ') && (value.toUpperCase() === 'FALSE' || value.toUpperCase() === 'TRUE')) {
            const correctedValue = value.toUpperCase() === 'FALSE' ? 'TRUE' : 'FALSE';
            condition = `${normalizedField} = ${correctedValue}`;
            console.log(`[Custom Field Adjusted] ${normalizedField} != ${value.toUpperCase()} ➜ ${normalizedField} = ${correctedValue}`);
          } else {
            condition = `${normalizedField} != '${value}'`;
          }
          break;
        case 'CONTAINS':
          condition = `${normalizedField} LIKE '%${value}%'`;
          break;
        case 'NOT CONTAINS':
          condition = `${normalizedField} NOT LIKE '%${value}%'`;
          break;
        case 'REGEX CONTAINS':
          condition = `REGEXP_CONTAINS(${normalizedField}, '${value}')`;
          break;
        case 'REGEX NOT CONTAINS':
          condition = `NOT REGEXP_CONTAINS(${normalizedField}, '${value}')`;
          break;
      }

      cases.push(`WHEN ${condition} THEN '${thenValue}'`);
    });

    if (cases.length > 0 || elseValue) {
      const alias = `custom_field_${customFieldIndex++}`;
      const caseSQL = `CASE\n    ${cases.join('\n    ')}\n    ELSE '${elseValue}'\nEND AS ${alias}`;
      let visualCaseSQL = caseSQL
        .replace(/\n/g, '<br>' + indent)
        .replace(/=\s*(TRUE|FALSE)/gi, '<span class="sql-boolean">= $1</span>');

      selectLines.push(`${indent}${visualCaseSQL}`);
      plainSelectLines.push(`    ${caseSQL}`);

      // customFieldsToGroup.push(alias);
      // GROUP BY clause with the full CASE expressions instead of using aliases
      const fullCaseExpr = `CASE\n    ${cases.join('\n    ')}\n    ELSE '${elseValue}'\nEND`;
      customFieldsToGroup.push(fullCaseExpr);
    }
  });

  const selectClause = `<span class="sql-keyword">SELECT</span><br>${selectLines.join(',<br>')}`;
  const plainSelectClause = `SELECT\n${plainSelectLines.join(',\n')}`;

  const fromTable = dimensions.includes('URL')
    ? '`searchconsole.searchdata_url_impression`'
    : '`searchconsole.searchdata_site_impression`';

  const fromClause = `<br><span class="sql-keyword">FROM</span><br>${indent}<span class="sql-table">${fromTable}</span>`;
  const plainFromClause = `FROM\n    ${fromTable}`;

  const baseWhereClause = `<br><span class="sql-keyword">WHERE</span><br>${indent}<span class="sql-column">data_date</span> <span class="sql-keyword">BETWEEN</span> ${dateClause}`;
  const basePlainWhereClause = `WHERE\n    data_date BETWEEN ${dateClause}`;

  const rawFilterClauses = window._filterClauses || [];
  /* fix for unwanted TRUE clause / highlight TRUE and FALSE */
  const highlightedFilterClauses = rawFilterClauses.map(f => {
    let clause = f.clause;
    clause = clause.replace(/=\s*(TRUE|FALSE)/gi, '<span class="sql-boolean">= $1</span>');
    return { ...f, clause };
  });

  const sortClauses = window._sortClauses || [];

  // Generate the extra WHERE clause based on the filter clauses
  // const extraWhereText = (() => {
  //   if (!rawFilterClauses.length) return '';

  //   const globalLogic = document.querySelector('#filterRows input[type="radio"]:checked')?.value || 'AND';
  //   const clauses = rawFilterClauses.map(f => f.clause);

  //   if (clauses.length === 1) {
  //     return `${clauses[0]}`;
  //   }

  //   return `(${clauses.join(` ${globalLogic} `)})`;
  // })();
  const extraWhereText = (() => {
    if (!rawFilterClauses.length) return '';
    const logic = window._filterLogic || 'AND';
    const clauses = rawFilterClauses.map(f => f.clause);
    return clauses.length === 1 ? clauses[0] : `(${clauses.join(` ${logic} `)})`;
  })();


  // Generate the extra WHERE HTML based on the highlighted filter clauses
  // const extraWhereHTML = (() => {
  //   if (!highlightedFilterClauses.length) return '';

  //   const globalLogic = document.querySelector('#filterRows input[type="radio"]:checked')?.value || 'AND';
  //   const keyword = `<span class="sql-keyword">${globalLogic}</span>`;
  //   const clauses = highlightedFilterClauses.map(f => f.clause);

  //   if (clauses.length === 1) {
  //     return clauses[0];
  //   }

  //   return `(${clauses.join(` ${keyword} `)})`;
  // })();
  const extraWhereHTML = (() => {
    if (!highlightedFilterClauses.length) return '';
    const logic = window._filterLogic || 'AND';
    const keyword = `<span class="sql-keyword">${logic}</span>`;
    const clauses = highlightedFilterClauses.map(f => f.clause);
    return clauses.length === 1 ? clauses[0] : `(${clauses.join(` ${keyword} `)})`;
  })();




  const whereHTML = extraWhereHTML ? `<br>${indent}<span class="sql-keyword">AND</span> ${extraWhereHTML}` : '';


  const whereText = extraWhereText ? `\n    AND ${extraWhereText}` : '';

  const groupItems = [...groupAliases, ...customFieldsToGroup];
  const groupByClause = groupItems.length
    ? `<br><span class="sql-keyword">GROUP BY</span><br>${groupItems.map(d => `${indent}<span class="sql-column">${d}</span>`).join(',<br>')}`
    : '';


  const plainGroupByClause = groupItems.length
    ? `GROUP BY\n    ${groupItems.map(item => item.trim()).join(',\n    ')}`
    : '';

  const orderHTML = sortClauses.length
    ? `<br><span class="sql-keyword">ORDER BY</span><br>${indent}${sortClauses.map(cl => `<span class="sql-column">${cl}</span>`).join(', ')}`
    : '';
  const orderText = sortClauses.length
    ? `\nORDER BY\n    ${sortClauses.join(', ')}`
    : '';

  const sql = `${selectClause}${fromClause}${baseWhereClause}${whereHTML}${groupByClause}${orderHTML}`;
  const plainSQL = `${plainSelectClause}\n${plainFromClause}\n${basePlainWhereClause}${whereText}${plainGroupByClause ? `\n${plainGroupByClause}` : ''}${orderText}`;

  document.getElementById('sqlOutput').innerHTML = highlightSQL(plainSQL);
  document.getElementById('sqlOutputFormated').textContent = plainSQL;

  document.querySelectorAll('#customFieldGroups input[type="text"]').forEach(input => {
    input.addEventListener('input', () => {
      if (input.value.trim() !== '') {
        input.classList.add('user-started');
      } else {
        input.classList.remove('user-started');
      }
    });
  });

  const body = document.body;
  const sqlStatus = document.getElementById('sqlStatus');

  body.classList.remove('show-generated', 'show-generated-incomplete');
  const hasErrors = document.querySelectorAll('#customFieldGroups .border-red-500').length > 0;
  const userTouchedInputs = document.querySelectorAll('#customFieldGroups input.user-started').length > 0;

  if (userTouchedInputs && hasErrors) {
    void body.offsetHeight;
    body.classList.add('show-generated-incomplete');
    if (sqlStatus) sqlStatus.setAttribute('title', 'There are incomplete fields – SQL Generated!');
  } else {
    body.classList.add('show-generated');
    setTimeout(() => {
      body.classList.remove('show-generated');
    }, 3000);
    if (sqlStatus) sqlStatus.removeAttribute('title');
  }
  return plainSQL;
}


function updateFilterAndSortClauses() {
  const filters = [];
  document.querySelectorAll('#filterRows > div').forEach(filter => {
    const selects = filter.querySelectorAll('select');
    const field = selects[0]?.value;
    const operator = selects[1]?.value;
    const logic = filter.querySelector('input[type="radio"]:checked')?.value || 'AND';

    const textInput = filter.querySelector('input[type="text"]');
    const booleanRadio = filter.querySelector('input[name^="bool-val"]:checked');
    const countryInputStyled = filter.querySelector('input.country-search-input');

    let value = null;

    if (field?.startsWith('Is ') && booleanRadio) {
      value = booleanRadio.value?.toUpperCase();
    } else if (field === 'Country') {
      if (countryInputStyled?.dataset?.code) {
        value = countryInputStyled.dataset.code.trim();
      }
    } else if (textInput) {
      value = textInput.value?.trim();
    }

    if (typeof value === 'string') {
      value = value.trim();
    }

    const normalizedField = normalizeFieldName(field);
    if (
      field &&
      operator &&
      (
        operator.includes('NULL') ||
        (typeof value === 'string' && value.trim() !== '') ||
        (typeof value === 'boolean') ||
        (typeof value === 'string' && (value.toUpperCase() === 'TRUE' || value.toUpperCase() === 'FALSE'))
      )
    ) {

      let clause = '';

      switch (operator) {
        case 'EQUALS':
          clause = field.startsWith('Is ') ? `${normalizedField} = ${value.toUpperCase()}` : `${normalizedField} = '${value}'`;
          break;

        case 'NOT EQUALS':
          if (field.startsWith('Is ') && (value.toUpperCase() === 'FALSE' || value.toUpperCase() === 'TRUE')) {
            const correctedValue = value.toUpperCase() === 'FALSE' ? 'TRUE' : 'FALSE';
            clause = `${normalizedField} = ${correctedValue}`;
            console.log(`[Adjusted] ${normalizedField} != ${value.toUpperCase()} ➜ ${normalizedField} = ${correctedValue}`);
          } else {
            clause = `${normalizedField} != '${value}'`;
          }
          break;

        case 'CONTAINS':
          clause = `${normalizedField} LIKE '%${value}%'`;
          break;

        case 'NOT CONTAINS':
          clause = `${normalizedField} NOT LIKE '%${value}%'`;
          break;

        case 'GREATER THAN':
          clause = `${normalizedField} > '${value}'`;
          break;

        case 'LESS THAN':
          clause = `${normalizedField} < '${value}'`;
          break;

        case 'IS NULL':
          clause = `${normalizedField} IS NULL`;
          break;

        case 'IS NOT NULL':
          clause = `${normalizedField} IS NOT NULL`;
          break;

        case 'REGEXP CONTAINS':
          if (['query', 'url'].includes(normalizedField)) {
            clause = `REGEXP_CONTAINS(${normalizedField}, r'${value}')`;
          }
          break;

        case 'NOT REGEXP CONTAINS':
          if (['query', 'url'].includes(normalizedField)) {
            clause = `NOT REGEXP_CONTAINS(${normalizedField}, r'${value}')`;
          }
          break;
      }

      if (clause) filters.push({ clause, logic });
    }
    // Save the global filter logic (AND/OR) for SQL generation
    const globalLogicInput = document.querySelector('#filterRows input[type="radio"]:checked');
    window._filterLogic = globalLogicInput ? globalLogicInput.value : 'AND';
  });

  const sorts = [];
  document.querySelectorAll('#sortRows > div').forEach(row => {
    const select = row.querySelector('select');
    const direction = row.querySelector('input[type="radio"]:checked')?.value || 'ASC';
    if (select && select.value) {
      const normalizedSort = normalizeFieldName(select.value);
      sorts.push(`${normalizedSort} ${direction}`);
    }
  });

  window._filterClauses = filters;
  window._sortClauses = sorts;
}
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

function setupEventListeners() {
  const listeners = [
    ['copySQLButton', 'click', copySQL],
    ['generateSQLButton', 'click', generateSQL],
    ['clearMetricsBtn', 'click', clearAllMetrics],
    ['clearDimensionsBtn', 'click', clearAllDimensions],
    ['toggleFiltersHeader', 'click', toggleFilters],
    ['addFilterRowBtn', 'click', addFilterRow],
    ['removeFilterRowBtn', 'click', removeFilterRow],
    ['toggleSortByHeader', 'click', toggleSortBy],
    ['addSortRowBtn', 'click', addSortRow],
    ['removeSortRowBtn', 'click', removeSortRow],
    ['toggleCustomFieldsHeader', 'click', toggleCustomFields],
    ['addCustomFieldGroupBtn', 'click', addCustomFieldGroup],
  ];

  listeners.forEach(([id, event, handler]) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener(event, handler);
    }
  });

  // Optional fallback (if old buttons had inline handlers)
  const fallbackCopyBtn = document.querySelector('button[onclick="copySQL()"]');
  if (fallbackCopyBtn) fallbackCopyBtn.addEventListener('click', copySQL);

  const fallbackGenBtn = document.querySelector('button[onclick="generateSQL()"]');
  if (fallbackGenBtn) fallbackGenBtn.addEventListener('click', generateSQL);

  setupEnterKeyTrigger(generateSQL);
}
document.addEventListener("DOMContentLoaded", () => {
  const customFieldsTooltipIcon = document.getElementById("custom-fields-tooltip-icon");
  const tooltipBox = document.getElementById("global-tooltip");

  if (customFieldsTooltipIcon && tooltipBox) {
    const customTooltipText = `Create your own fields. For example, group branded vs non-branded keywords. When query contains your brand name, the field will show "Brand", else "Non-Brand".`;

    customFieldsTooltipIcon.addEventListener("mouseenter", (e) => {
      tooltipBox.textContent = customTooltipText;
      tooltipBox.classList.remove("hidden");

      const rect = e.target.getBoundingClientRect();
      tooltipBox.style.top = `${rect.top - 8 + window.scrollY}px`;
      tooltipBox.style.left = `${rect.right + 4 + window.scrollX}px`;
    });

    customFieldsTooltipIcon.addEventListener("mouseleave", () => {
      tooltipBox.classList.add("hidden");
    });
  }
});

document.getElementById('generateSQLButton').addEventListener('click', () => {
  const sql = generateSQL();
  logQuery({ query: sql, source_page: window.location.pathname });
});

