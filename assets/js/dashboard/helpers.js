export const createStarRating = (currentRank, maxRating = 5, interactive = false, saveCallback = null) => {
  const container = document.createElement("div");
  container.classList.add("star-rating");

  for (let i = 1; i <= maxRating; i++) {
    const star = document.createElement("i");
    star.classList.add("fa", "fa-star", "star");

    // Full stars
    if (i <= Math.floor(currentRank)) {
      star.classList.add("gold");
    }
    // Half stars
    else if (i === Math.ceil(currentRank) && currentRank % 1 >= 0.5) {
      star.classList.add("gold");
      star.classList.add("fa-star-half-alt");
    }
    // Empty stars
    else {
      star.classList.add("gray");
    }

    // Add interactivity if enabled
    if (interactive) {
      star.addEventListener("mouseover", () => highlightStars(container, i));
      star.addEventListener("mouseout", () => resetStars(container, currentRank));
      star.addEventListener("click", () => {
        selectStars(container, i);
        if (saveCallback) saveCallback(i); // Save the rank when clicked
      });
    } else {
      // Disable interactivity for read-only mode
      star.style.pointerEvents = "none";
    }

    container.appendChild(star);
  }

  return container;
};

/**
 * Highlight stars on hover.
 * @param {HTMLElement} container - The star rating container.
 * @param {number} rating - The rating to highlight up to.
 */
export const highlightStars = (container, rating) => {
  const stars = container.querySelectorAll(".star");
  stars.forEach((star, index) => {
    star.style.color = index < rating ? "gold" : "lightgray";
  });
};

/**
 * Reset stars to their default state.
 * @param {HTMLElement} container - The star rating container.
 * @param {number} currentRank - The current rank to display.
 */
export const resetStars = (container, currentRank) => {
  const stars = container.querySelectorAll(".star");
  stars.forEach((star, index) => {
    star.style.color = index < currentRank ? "gold" : "lightgray";
    star.classList.toggle("selected", index < currentRank);
  });
};

/**
 * Select stars on click.
 * @param {HTMLElement} container - The star rating container.
 * @param {number} rating - The rating to select.
 */
export const selectStars = (container, rating) => {
  const stars = container.querySelectorAll(".star");
  stars.forEach((star, index) => {
    star.classList.toggle("selected", index < rating);
    star.style.color = index < rating ? "gold" : "lightgray";
  });
};
