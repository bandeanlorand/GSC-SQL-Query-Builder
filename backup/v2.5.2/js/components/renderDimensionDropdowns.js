import { selectDimension } from '../selectHandlers.js'; // adjust path based on actual location

export function renderDimensionsDropdown() {
  const dimensionEntries = [
    ["Query", "The user query. When is_anonymized_query is true, this will be a zero-length string."],
    ["URL", "The fully-qualified URL where the user eventually lands when they click the search result or Discover story."],
    ["Country", "Country from where the query was made, in ISO-3166-1-Alpha-3 format (for example, “USA”)."],
    ["Search Type", "The type of search (web, image, video, or news)."],
    ["Device", "The device type (desktop, tablet, or mobile)."],
    ["Site URL", "URL of the property. For domain-level properties, this will be sc-domain:property-name. For URL-prefix properties, it will be the full URL of the property definition."],
    ["Date", "The day on which the data in this row was generated (Pacific Time)."],
    ["Month", "The month (YYYY-MM) of the data in this row."],
    ["Year", "The year (YYYY) of the data in this row."],
    ["Is Anonymized Query", "Rare queries (called anonymized queries) are marked with this bool. The query field will be null when it’s true to protect the privacy of users making the query."],
    ["Is Anonymized Discover", "Whether the data row is under the Discover anonymization threshold. When under the threshold, some other fields (like URL and country) will be missing to protect user privacy."],
    ["Is AMP Top Stories", "Whether the URL is an AMP Top Story."],
    ["Is AMP Blue Link", "Whether the URL is an AMP Blue Link."],
    ["Is Job Listing", "Whether the URL is a job listing."],
    ["Is Job Details", "Whether the URL is a job details page."],
    ["Is TPF QA", "Whether the URL is a top places for a query."],
    ["Is TPF FAQ", "Whether the URL is a top places faq."],
    ["Is TPF HowTo", "Whether the URL is a top places how-to."],
    ["Is Weblite", "Whether the URL is a weblite."],
    ["Is Action", "Whether the URL is an action."],
    ["Is Events Listing", "Whether the URL is an events listing."],
    ["Is Events Details", "Whether the URL is an events details page."],
    ["Is Search Appearance Android App", "Whether the URL is a search appearance android app."],
    ["Is AMP Story", "Whether the URL is an AMP story."],
    ["Is AMP Image Result", "Whether the URL is an AMP image result."],
    ["Is Video", "Whether the URL is a video."],
    ["Is Organc Shopping", "Whether the URL is an organic shopping result."],
    ["Is Review Snippet", "Whether the URL is a review snippet."],
    ["Is Special Announcement", "Whether the URL is a special announcement."],
    ["Is Recipe Feature", "Whether the URL is a recipe feature."],
    ["Is Recipe Rich Snippet", "Whether the URL is a recipe rich snippet."],
    ["Is Subscribed Content", "Whether the URL is subscribed content."],
    ["Is Page Experience", "Whether the URL is a page experience."],
    ["Is Practice Problems", "Whether the URL is a practice problem."],
    ["Is Math Solvers", "Whether the URL is a math solver."],
    ["Is Translated Result", "Whether the URL is a translated result."],
    ["Is Product Snippets", "Whether the URL is a product snippet."],
    ["Is Merchant Listings", "Whether the URL is a merchant listing."]
  ];

  const dimensionsDropdown = document.getElementById("dimensionsDropdown");
  if (!dimensionsDropdown) return;

  dimensionsDropdown.innerHTML = '<div id="dimensionsScrollArea" class="max-h-[400px] overflow-y-auto pr-2"></div>';
  const scrollArea = document.getElementById("dimensionsScrollArea");
  const tooltipBox = document.getElementById("global-tooltip");

  dimensionEntries.forEach(([name, tooltip]) => {
    const item = document.createElement("div");
    item.className = "relative cursor-pointer p-1 hover:bg-gray-700 flex items-center justify-between";

    const span = document.createElement("span");
    span.textContent = name;

    const icon = document.createElement("i");
    icon.className = "far fa-question-circle text-gray-400";
    icon.style.cursor = "pointer";

    icon.addEventListener("mouseenter", (e) => {
      tooltipBox.textContent = tooltip;
      tooltipBox.classList.remove("hidden");

      const rect = e.target.getBoundingClientRect();
      tooltipBox.style.top = `${rect.top + window.scrollY}px`;
      tooltipBox.style.left = `${rect.right + 8 + window.scrollX}px`;
    });

    icon.addEventListener("mouseleave", () => {
      tooltipBox.classList.add("hidden");
    });

    item.addEventListener("click", () => selectDimension(name));

    item.appendChild(span);
    item.appendChild(icon);
    scrollArea.appendChild(item);
  });
}
