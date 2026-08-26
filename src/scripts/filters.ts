function matchesCoverage(acres: number, band: string): boolean {
  if (band === "under-0.5") return acres < 0.5;
  if (band === "0.5-1.5") return acres >= 0.5 && acres <= 1.5;
  if (band === "over-1.5") return acres > 1.5;
  return true;
}

function applyFilters() {
  const params = new URLSearchParams(window.location.search);
  const wire = params.get("wire") ?? "all";
  const coverage = params.get("coverage") ?? "all";
  const nav = params.get("nav") ?? "all";

  document.querySelectorAll<HTMLButtonElement>("[data-filter]").forEach((button) => {
    const group = button.dataset.filter;
    const value = button.dataset.value;
    const selected =
      (group === "wire" && wire === value) ||
      (group === "coverage" && coverage === value) ||
      (group === "nav" && nav === value);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });

  const cards = [...document.querySelectorAll<HTMLElement>("[data-listing-card]")];
  let visible = 0;

  for (const card of cards) {
    const cardWire = card.dataset.wire;
    const acres = Number(card.dataset.coverage);
    const cardNav = (card.dataset.nav ?? "").split(" ");
    const wireOk = wire === "all" || cardWire === wire;
    const coverageOk = coverage === "all" || matchesCoverage(acres, coverage);
    const navOk = nav === "all" || cardNav.includes(nav);
    const show = wireOk && coverageOk && navOk;
    card.hidden = !show;
    if (show) visible += 1;
  }

  const count = document.querySelector("[data-result-count]");
  if (count) {
    count.textContent = String(visible).padStart(2, "0");
  }

  const label = document.querySelector("[data-result-label]");
  if (label) {
    label.textContent = visible === 1 ? "machine shown" : "machines shown";
  }

  const empty = document.querySelector<HTMLElement>("[data-empty]");
  if (empty) empty.hidden = visible !== 0;

  const reset = document.querySelector<HTMLButtonElement>("[data-reset]");
  if (reset) reset.hidden = wire === "all" && coverage === "all" && nav === "all";
}

function setParam(key: string, value: string) {
  const url = new URL(window.location.href);
  if (value === "all") url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  history.replaceState({}, "", url);
  applyFilters();
}

function selectedCards() {
  const slugs = [...document.querySelectorAll<HTMLInputElement>("[data-compare]:checked")].map(
    (input) => input.value,
  );
  return [...document.querySelectorAll<HTMLElement>("[data-listing-card]")].filter((card) =>
    slugs.includes(card.dataset.slug ?? ""),
  );
}

function renderCompare() {
  const panel = document.querySelector<HTMLElement>("[data-compare-panel]");
  const body = document.querySelector("[data-compare-body]");
  if (!panel || !body) return;

  const cards = selectedCards();
  if (cards.length < 2) {
    panel.hidden = true;
    body.innerHTML = "";
    return;
  }

  const cells = (fn: (card: HTMLElement) => string) =>
    cards.map((card) => `<td>${fn(card)}</td>`).join("");

  body.innerHTML = `
    <tr><th scope="row">Model</th>${cells((c) => c.dataset.title ?? "")}</tr>
    <tr><th scope="row">Brand</th>${cells((c) => c.dataset.brand ?? "")}</tr>
    <tr><th scope="row">Coverage</th>${cells((c) => `${c.dataset.coverage} acres`)}</tr>
    <tr><th scope="row">Slope</th>${cells((c) => (c.dataset.slope ? `${c.dataset.slope}%` : "Not stated"))}</tr>
    <tr><th scope="row">Navigation</th>${cells((c) => (c.dataset.nav ?? "").replaceAll(" ", " + "))}</tr>
    <tr><th scope="row">Boundary</th>${cells((c) => (c.dataset.wire === "free" ? "Wire-free" : "Boundary wire"))}</tr>
    <tr><th scope="row">Price</th>${cells((c) => (c.dataset.price ? `$${Number(c.dataset.price).toLocaleString("en-US")}` : "Varies"))}</tr>
    <tr><th scope="row">Who it's for</th>${cells((c) => c.dataset.who ?? "")}</tr>
  `;
  panel.hidden = false;
}

document.querySelectorAll<HTMLButtonElement>("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.dataset.filter;
    const value = button.dataset.value;
    if (group && value) setParam(group, value);
  });
});

document.querySelector("[data-reset]")?.addEventListener("click", () => {
  const url = new URL(window.location.href);
  url.search = "";
  history.replaceState({}, "", url);
  applyFilters();
});

document.querySelectorAll<HTMLInputElement>("[data-compare]").forEach((input) => {
  input.addEventListener("change", () => {
    const checked = document.querySelectorAll<HTMLInputElement>("[data-compare]:checked");
    if (checked.length > 3) {
      input.checked = false;
      return;
    }
    renderCompare();
  });
});

applyFilters();
renderCompare();
