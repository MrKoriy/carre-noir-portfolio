(function () {
  "use strict";

  // Мобильное меню
  const menuBtn = document.querySelector("[data-menu-button]");
  const nav = document.querySelector("[data-nav]");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }

  // Год в копирайте
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Быстрый калькулятор ориентировочной сметы
  const calcForm = document.getElementById("calc-form");
  if (calcForm) {
    calcForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const area = parseFloat(document.getElementById("calc-area")?.value || "0");
      const system = document.getElementById("calc-system")?.value;
      const resultEl = document.getElementById("calc-result");

      let rate = 3500; // EuroKraab base
      if (system === "kraab-tracks") rate = 5800;
      if (system === "lumfer") rate = 6500;

      const total = area > 0 ? area * rate : 0;
      if (resultEl) {
        resultEl.innerHTML = total > 0
          ? `Ориентировочно: <strong style="color: #D4AF37;">${new Intl.NumberFormat("ru-RU").format(total)} ₽</strong> (включая полотно, профиль и монтаж). Точный расчет после лазерного замера.`
          : "Укажите площадь помещения";
        resultEl.style.display = "block";
      }
    });
  }
})();
