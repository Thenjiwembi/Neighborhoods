const listings = [
  { id: 1, name: "Morrow & Moss", category: "Food & Drink", location: "Riverside", description: "A sunlit corner for excellent coffee, seasonal toast and lingering conversations.", hours: "Open until 5pm", symbol: "✦", tone: "mint", added: 9 },
  { id: 2, name: "Common Thread", category: "Wellness", location: "North Quarter", description: "Slow, considered movement classes in a studio that feels like a deep breath.", hours: "Class at 6pm", symbol: "◒", tone: "orange", added: 8 },
  { id: 3, name: "The Greenhouse", category: "Culture", location: "Old Town", description: "Plants, prints and little workshops for people who like making things by hand.", hours: "Open until 7pm", symbol: "✳", tone: "yellow", added: 7 },
  { id: 4, name: "Orbit Books", category: "Shopping", location: "Riverside", description: "A beautifully curated bookshop for new ideas, old favourites and one-more-chapter days.", hours: "Open until 8pm", symbol: "◎", tone: "blue", added: 6 },
  { id: 5, name: "Clay Social", category: "Culture", location: "Southside", description: "Drop-in ceramics, friendly faces and the most satisfying shelves in the city.", hours: "Drop-in today", symbol: "◌", tone: "cream", added: 5 },
  { id: 6, name: "Field Notes", category: "Wellness", location: "Old Town", description: "A pocket-sized garden shop with workshops for tending, growing and getting muddy.", hours: "Open until 6pm", symbol: "✽", tone: "mint", added: 4 },
  { id: 7, name: "Juniper Table", category: "Food & Drink", location: "Southside", description: "Neighbourhood dinners, natural wine and the kind of welcome that keeps you late.", hours: "Dinner from 5pm", symbol: "◒", tone: "orange", added: 3 },
  { id: 8, name: "Radio Local", category: "Community", location: "North Quarter", description: "A tiny listening room and community broadcast for curious ears and open minds.", hours: "Live tonight", symbol: "◉", tone: "blue", added: 2 }
];

const state = {
  query: "",
  category: "All",
  location: "All",
  sort: "recent",
  savedOnly: false,
  favourites: loadFavourites(),
  status: "loading"
};

const els = {
  resultsRegion: document.querySelector("#results-region"),
  resultsSummary: document.querySelector("#results-summary"),
  searchInput: document.querySelector("#search-input"),
  categoryOptions: document.querySelector("#category-options"),
  locationOptions: document.querySelector("#location-options"),
  clearFilters: document.querySelector("#clear-filters"),
  savedToggle: document.querySelector("#saved-toggle"),
  savedCount: document.querySelector("#saved-count"),
  sortToggle: document.querySelector("#sort-toggle"),
  contactForm: document.querySelector("#contact-form"),
  formStatus: document.querySelector("#form-status")
};

function loadFavourites() {
  try {
    const stored = JSON.parse(localStorage.getItem("neighborhoods-favourites") || "[]");
    return Array.isArray(stored) ? stored.map(Number) : [];
  } catch (error) {
    return [];
  }
}

function saveFavourites() {
  try {
    localStorage.setItem("neighborhoods-favourites", JSON.stringify(state.favourites));
  } catch (error) {
    // The UI remains usable in privacy modes where storage is unavailable.
  }
}

function uniqueValues(key) {
  return ["All", ...new Set(listings.map((listing) => listing[key]))];
}

function renderFilterOptions() {
  els.categoryOptions.innerHTML = uniqueValues("category").map((value) => filterTemplate("category", value)).join("");
  els.locationOptions.innerHTML = uniqueValues("location").map((value) => filterTemplate("location", value)).join("");
  document.querySelectorAll("input[name='category'], input[name='location']").forEach((input) => input.addEventListener("change", handleFilterChange));
}

function filterTemplate(type, value) {
  const checked = state[type] === value ? "checked" : "";
  const label = value === "All" ? `All ${type === "category" ? "categories" : "locations"}` : value;
  return `<label class="filter-option"><input type="radio" name="${type}" value="${value}" ${checked} /> <span>${label}</span></label>`;
}

function getVisibleListings() {
  const query = state.query.trim().toLowerCase();
  const visible = listings.filter((listing) => {
    const matchesQuery = !query || [listing.name, listing.category, listing.location, listing.description].some((value) => value.toLowerCase().includes(query));
    const matchesCategory = state.category === "All" || listing.category === state.category;
    const matchesLocation = state.location === "All" || listing.location === state.location;
    const matchesSaved = !state.savedOnly || state.favourites.includes(listing.id);
    return matchesQuery && matchesCategory && matchesLocation && matchesSaved;
  });
  return [...visible].sort((a, b) => state.sort === "recent" ? b.added - a.added : a.name.localeCompare(b.name));
}

function cardTemplate(listing, index) {
  const isSaved = state.favourites.includes(listing.id);
  return `<article class="listing-card" style="animation-delay: ${Math.min(index * 45, 280)}ms">
    <div class="card-visual ${listing.tone}">
      <div class="card-topline"><span class="card-category">${listing.category}</span><button class="favorite-button ${isSaved ? "is-saved" : ""}" type="button" data-favourite="${listing.id}" aria-label="${isSaved ? "Remove" : "Save"} ${listing.name}" aria-pressed="${isSaved}">${isSaved ? "♥" : "♡"}</button></div>
      <span class="card-symbol">${listing.symbol}</span>
    </div>
    <div class="card-body">
      <div class="card-title-row"><h3 class="card-title">${listing.name}</h3></div>
      <p class="card-description">${listing.description}</p>
      <div class="card-meta"><span><strong>⌖</strong>${listing.location}</span><span><strong>◷</strong>${listing.hours}</span></div>
    </div>
  </article>`;
}

function renderResults() {
  if (state.status === "loading") {
    els.resultsRegion.setAttribute("aria-busy", "true");
    els.resultsRegion.innerHTML = `<div class="loading-grid" aria-label="Loading listings"><div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div>`;
    els.resultsSummary.textContent = "Loading listings…";
    return;
  }

  if (state.status === "error") {
    els.resultsRegion.setAttribute("aria-busy", "false");
    els.resultsRegion.innerHTML = `<div class="state-card"><div class="state-symbol">!</div><h3>That path got a little tangled.</h3><p>We couldn't load the directory right now. Give it another try.</p><button class="state-action" id="retry-listings" type="button">Try again</button></div>`;
    els.resultsSummary.textContent = "Directory unavailable";
    document.querySelector("#retry-listings").addEventListener("click", () => { state.status = "loading"; renderResults(); setTimeout(() => { state.status = "ready"; renderResults(); }, 450); });
    return;
  }

  const visible = getVisibleListings();
  els.resultsRegion.setAttribute("aria-busy", "false");
  els.resultsSummary.textContent = `${visible.length} ${visible.length === 1 ? "place" : "places"} to explore`;
  els.sortToggle.innerHTML = `${state.sort === "recent" ? "Recently added" : "Name A–Z"} <span aria-hidden="true">↕</span>`;

  if (!visible.length) {
    els.resultsRegion.innerHTML = `<div class="state-card"><div class="state-symbol">⌁</div><h3>Nothing here yet.</h3><p>Try widening your search, or clear a filter to see more of the neighbourhood.</p><button class="state-action" id="empty-reset" type="button">Clear filters</button></div>`;
    document.querySelector("#empty-reset").addEventListener("click", clearFilters);
    return;
  }

  els.resultsRegion.innerHTML = `<div class="results-grid">${visible.map(cardTemplate).join("")}</div>`;
  document.querySelectorAll("[data-favourite]").forEach((button) => button.addEventListener("click", () => toggleFavourite(Number(button.dataset.favourite))));
}

function updateSavedCount() {
  els.savedCount.textContent = state.favourites.length;
  els.savedToggle.setAttribute("aria-pressed", String(state.savedOnly));
  els.savedToggle.classList.toggle("saved-filter-active", state.savedOnly);
}

function toggleFavourite(id) {
  state.favourites = state.favourites.includes(id) ? state.favourites.filter((favourite) => favourite !== id) : [...state.favourites, id];
  saveFavourites();
  updateSavedCount();
  renderResults();
}

function handleFilterChange(event) {
  state[event.target.name] = event.target.value;
  state.savedOnly = false;
  updateSavedCount();
  renderResults();
}

function clearFilters() {
  state.query = "";
  state.category = "All";
  state.location = "All";
  state.savedOnly = false;
  els.searchInput.value = "";
  renderFilterOptions();
  updateSavedCount();
  renderResults();
}

function validateField(field) {
  const value = field.value.trim();
  let message = "";
  if (!value) message = "This field is required.";
  if (field.id === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = "Enter a valid email address.";
  if (field.id === "message" && value && value.length < 15) message = "Give us a little more detail (15 characters minimum).";
  const wrapper = field.closest(".form-field");
  wrapper.classList.toggle("has-error", Boolean(message));
  field.setAttribute("aria-invalid", String(Boolean(message)));
  document.querySelector(`#${field.id}-error`).textContent = message;
  return !message;
}

function setupForm() {
  const fields = [...els.contactForm.querySelectorAll("input, textarea")];
  fields.forEach((field) => field.addEventListener("blur", () => validateField(field)));
  els.contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const valid = fields.map(validateField).every(Boolean);
    if (!valid) {
      els.formStatus.textContent = "A couple of details need your attention above.";
      els.formStatus.className = "form-status";
      return;
    }
    els.formStatus.textContent = "Thanks — your recommendation is on its way to the neighbourhood team.";
    els.formStatus.className = "form-status success";
    els.contactForm.reset();
    fields.forEach((field) => { field.closest(".form-field").classList.remove("has-error"); field.removeAttribute("aria-invalid"); });
  });
}

function init() {
  renderFilterOptions();
  updateSavedCount();
  setupForm();
  els.searchInput.addEventListener("input", (event) => { state.query = event.target.value; state.savedOnly = false; updateSavedCount(); renderResults(); });
  els.clearFilters.addEventListener("click", clearFilters);
  els.savedToggle.addEventListener("click", () => { state.savedOnly = !state.savedOnly; updateSavedCount(); renderResults(); });
  els.sortToggle.addEventListener("click", () => { state.sort = state.sort === "recent" ? "alpha" : "recent"; renderResults(); });
  document.addEventListener("keydown", (event) => { if (event.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { event.preventDefault(); els.searchInput.focus(); } });
  setTimeout(() => { state.status = "ready"; renderResults(); }, 650);
}

init();
