document.querySelectorAll("[data-product-gallery]").forEach((gallery) => {
  const panels = [...gallery.querySelectorAll<HTMLElement>("[data-gallery-panel]")];
  const thumbs = [...gallery.querySelectorAll<HTMLButtonElement>("[data-gallery-thumb]")];
  if (thumbs.length < 2) return;

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const active = thumb.dataset.galleryThumb;
      panels.forEach((panel) => {
        panel.classList.toggle("is-hidden", panel.dataset.galleryPanel !== active);
      });
      thumbs.forEach((button) => {
        button.setAttribute("aria-pressed", String(button === thumb));
      });
    });
  });
});
