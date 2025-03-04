document.addEventListener("DOMContentLoaded", () => {
  const icons = document.querySelectorAll(".more-icon");
  let isVertical = true;

  document.querySelector(".icon-container").addEventListener("click", () => {
    icons.forEach((icon, index) => {
      if (index === 1) return;
      if (isVertical) {
        icon.style.transform = `translateX(${index === 0 ? -60 : 60}px)`;
      } else {
        icon.style.transform = `translateY(${index === 0 ? -60 : 60}px)`;
      }
    });
    isVertical = !isVertical;
  });
});
