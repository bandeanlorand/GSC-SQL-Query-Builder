/**
 * sortByControls.js
 * ------------------
 * UI logic for the "Sort by" block.
 *
 * Responsibilities:
 * - toggleSortBy(): Show/hide the Sort section and rotate the caret icon.
 * - addSortRow(): Append a new "field + ASC/DESC" row.
 * - removeSortRow(): Remove the last sort row (keeps at least one).
 * - updateSortRemoveButton(): Show/hide the "−" button based on row count.
 * - updateSortFieldOptions(): Rebuild <select> options for each row from the
 *   current global Sets `selectedDimensions` and `selectedMetrics`, ensuring
 *   the sort-by dropdown always offers whatever the user has selected elsewhere.
 *
 * Data sources:
 * - `selectedDimensions` and `selectedMetrics` (global Sets, defined in main.js)
 *
 * Notes:
 * - addSortRow() builds a row with a <select> and an ASC/DESC radio group.
 * - updateSortFieldOptions() is safe to call after metrics/dimensions change
 *   (e.g., on selectMetric/removeMetric/selectDimension/removeDimension).
 * - Keep IDs in index.html consistent: #sortSection, #sortArrow, #sortRows,
 *   #removeSortRowBtn so these functions can find the right nodes.
 */

export function toggleSortBy() {
  const section = document.getElementById('sortSection');
  const arrow = document.getElementById('sortArrow');
  section.classList.toggle('hidden');
  arrow.classList.toggle('rotate-180');
}
export function removeSortRow() {
  const container = document.getElementById('sortRows');
  if (container.children.length > 1) {
    container.lastElementChild.remove();
    updateSortRemoveButton();
  }
}
export function addSortRow() {
  const container = document.getElementById('sortRows');

  const wrapper = document.createElement('div');
  wrapper.className = "flex items-center gap-4";

  const fieldSelect = document.createElement('select');
  fieldSelect.className = "w-[calc(50%-0px)] select input-lg relative items-center justify-between cursor-pointer focus:outline-none h-auto p-[9px] text-sm";

  const selectedDimensions = window.selectedDimensions || new Set();
  const selectedMetrics = window.selectedMetrics || new Set();

  const allSortOptions = Array.from(new Set([
    ...Array.from(selectedDimensions),
    ...Array.from(selectedMetrics)
  ]));

  fieldSelect.innerHTML = `<option value="" disabled selected hidden>Select Field</option>` +
    allSortOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');

  const radioGroup = document.createElement('div');
  radioGroup.className = "flex items-center gap-4 text-sm ";

  radioGroup.innerHTML = `
    <label class="inline-flex items-center gap-1 m-0 font-semibold">
      <input type="radio" name="sort-${container.children.length}" value="ASC" class="radio radio-sm" checked />
      Ascending
    </label>
    <label class="inline-flex items-center gap-1 m-0 font-semibold">
      <input type="radio" name="sort-${container.children.length}" value="DESC" class="radio radio-sm" />
      Descending
    </label>
  `;

  wrapper.appendChild(fieldSelect);
  wrapper.appendChild(radioGroup);
  container.appendChild(wrapper);

  updateSortRemoveButton(); // already imported or defined in this file
  updateSortFieldOptions(); // updates dropdown with global Sets
}

export function updateSortRemoveButton() {
  const container = document.getElementById('sortRows');
  const removeBtn = document.getElementById('removeSortRowBtn');
  if (!removeBtn) return;

  if (container.children.length <= 1) {
    removeBtn.classList.add("hidden");
  } else {
    removeBtn.classList.remove("hidden");
  }
}
export function updateSortFieldOptions() {
  const sortRows = document.querySelectorAll('#sortRows select');
  console.log('updateSortFieldOptions');

  // Generate unique list from selected Sets
  const allFields = Array.from(new Set([
    ...Array.from(selectedDimensions),
    ...Array.from(selectedMetrics)
  ]));

  // For each existing <select>, refresh its options
  sortRows.forEach(select => {
    const selectedValue = select.value;
    select.innerHTML = `<option value="" disabled ${!selectedValue ? 'selected' : ''} hidden>Select Field</option>` +
      allFields.map(field => {
        const selected = field === selectedValue ? 'selected' : '';
        return `<option value="${field}" ${selected}>${field}</option>`;
      }).join('');
  });
}

