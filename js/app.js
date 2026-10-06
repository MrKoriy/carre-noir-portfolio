(function () {
  "use strict";

  /* ======================================================================
     Настройки: цены-ориентиры и контакты. Правьте здесь.
     ====================================================================== */
  const PRICING = {
    textures: [
      { id: "matte",  name: "Мат",    full: "Французский мат",  rate: 3500, cls: "fill-matte" },
      { id: "satin",  name: "Сатин",  full: "Сатин",            rate: 3900, cls: "fill-satin" },
      { id: "fabric", name: "Descor", full: "Ткань Descor",     rate: 6500, cls: "fill-fabric" }
    ],
    rooms: [
      { id: "living",  name: "Гостиная",      area: 28 },
      { id: "bed",     name: "Спальня",       area: 16 },
      { id: "kitchen", name: "Кухня",         area: 12 },
      { id: "kids",    name: "Детская",       area: 14 },
      { id: "bath",    name: "Ванная",        area: 5 },
      { id: "flat",    name: "Вся квартира",  area: 75 }
    ],
    options: [
      { id: "shadow", name: "Теневой профиль EuroKraab", hint: "зазор 6 мм по периметру", unit: "perimeter", rate: 2400, on: true },
      { id: "niche",  name: "Скрытый карниз",            hint: "ниша под шторы вдоль окна", unit: "side", rate: 4500 },
      { id: "spots",  name: "Точечные светильники",      hint: "встроенные в полотно", unit: "pcs", rate: 1200, count: 4 },
      { id: "lines",  name: "Световые линии",            hint: "до 3 м каждая", unit: "pcs", rate: 9800, count: 2 },
      { id: "track",  name: "Магнитный трек",            hint: "в плоскости потолка", unit: "pcs", rate: 14500, count: 1 }
    ]
  };
  // Укажите username Telegram (без @) и номер WhatsApp (только цифры), чтобы сметы приходили вам напрямую.
  const CONTACT = { telegram: "", whatsapp: "" };

  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n));
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Меню ---------- */
  const menuBtn = $("[data-menu-button]");
  const nav = $("[data-nav]");
  if (menuBtn && nav) {
    const setMenu = (open) => {
      nav.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
    $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  }

  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- День / ночь ---------- */
  const themeBtn = $("[data-theme-toggle]");
  const themeLabel = $("[data-theme-label]");
  const syncThemeLabel = () => { if (themeLabel) themeLabel.textContent = root.dataset.theme === "night" ? "Вечер" : "День"; };
  syncThemeLabel();
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      root.classList.add("theme-anim");
      root.dataset.theme = root.dataset.theme === "night" ? "day" : "night";
      try { localStorage.setItem("cn-theme", root.dataset.theme); } catch (e) {}
      syncThemeLabel();
      renderPlan && renderPlan();
      setTimeout(() => root.classList.remove("theme-anim"), 900);
    });
  }

  /* ---------- Кастомный курсор-квадрат и магнитные кнопки ---------- */
  if (finePointer && !reduce) {
    const cur = $(".cursor");
    root.classList.add("has-cursor");
    let mx = -100, my = -100, cx = -100, cy = -100;
    addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
      cx += (mx - cx) * 0.22; cy += (my - cy) * 0.22;
      cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", (e) => {
      cur.classList.toggle("is-hover", !!e.target.closest("a, button, input, label, [data-light], [data-compare]"));
    });

    $$(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * 0.25;
        const dy = (e.clientY - r.top - r.height / 2) * 0.35;
        b.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  /* ---------- Появление и счётчики ---------- */
  const countUp = (el) => {
    const to = parseFloat(el.dataset.count);
    const from = parseFloat(el.dataset.countFrom || "0");
    if (reduce) { el.textContent = to; return; }
    const dur = 1600, t0 = performance.now();
    const step = (t) => {
      const p = ease((t - t0) / dur);
      el.textContent = Math.round(from + (to - from) * p);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      $$("[data-count]", en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
  $$("[data-reveal], [data-draw], .profile__media").forEach((el) => io.observe(el));

  /* ---------- Фактуры под светом ---------- */
  $$("[data-light]").forEach((card) => {
    const set = (x, y, i) => {
      card.style.setProperty("--x", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--y", (y * 100).toFixed(1) + "%");
      card.style.setProperty("--xn", x.toFixed(3));
      if (i != null) card.style.setProperty("--i", i);
    };
    let hovering = false, raf = 0;
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      hovering = true;
      set(clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height), 1);
    });
    card.addEventListener("pointerleave", () => { hovering = false; card.style.setProperty("--i", 0.6); });
    // На тач-экранах и без наведения «лампа» плавает сама
    if (!reduce) {
      const seed = Math.random() * 10;
      const vis = new IntersectionObserver(([en]) => {
        cancelAnimationFrame(raf);
        if (!en.isIntersecting) return;
        const loop = (t) => {
          if (!hovering) {
            const s = t / 1000 + seed;
            set(0.5 + Math.sin(s * 0.7) * 0.32, 0.35 + Math.cos(s * 0.53) * 0.22);
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      });
      vis.observe(card);
    }
  });

  /* ---------- До / после ---------- */
  $$("[data-compare]").forEach((box) => {
    const range = $("[data-compare-range]", box);
    const upd = () => box.style.setProperty("--pos", range.value + "%");
    range.addEventListener("input", upd);
    upd();
    // Подсказка движением при первом появлении
    if (!reduce) {
      const hintIO = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return;
        hintIO.disconnect();
        const t0 = performance.now();
        const anim = (t) => {
          const p = (t - t0) / 1800;
          if (p > 1 || box.dataset.touched) return;
          range.value = 50 + Math.sin(p * Math.PI * 2) * 22;
          upd();
          requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
      }, { threshold: 0.6 });
      hintIO.observe(box);
      range.addEventListener("pointerdown", () => { box.dataset.touched = "1"; });
    }
  });

  /* ---------- Scroll-сцены: квадрат, вода, история, шапка ---------- */
  const header = $("[data-header]");
  const square = $("[data-parallax-square]");
  const water = $("[data-water]");
  const history = $("[data-history]");
  const rail = $("[data-history-rail]");
  const histProg = $("[data-history-progress]");
  const navLinks = $$(".nav a");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);

  const w = water && {
    membrane: $("[data-water-membrane]", water),
    body: $("[data-water-body]", water),
    drops: $$("[data-water-drops] circle", water),
    liters: $("[data-water-liters]", water),
    status: $("[data-water-status]", water),
    steps: $$("[data-step]", water)
  };
  const progressOf = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / (r.height - innerHeight));
  };

  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    // шапка прячется при прокрутке вниз
    if (header) header.classList.toggle("is-hidden", y > lastY && y > innerHeight * 1.5 && !(nav && nav.classList.contains("is-open")));
    lastY = y;

    if (square && !reduce) {
      const r = square.parentElement.getBoundingClientRect();
      const p = clamp(1 - (r.top + r.height) / (innerHeight + r.height));
      square.style.setProperty("--py", (p * -120).toFixed(1) + "px");
      square.style.setProperty("--pr", (p * 12).toFixed(2) + "deg");
    }

    if (w) {
      const p = progressOf(water);
      const fill = ease(clamp((p - 0.12) / 0.5));
      const drain = ease(clamp((p - 0.78) / 0.16));
      const sag = 150 * fill * (1 - drain);
      const cy = 150 + sag * 2;
      w.membrane.setAttribute("d", `M60 150 Q500 ${cy.toFixed(1)} 940 150`);
      w.body.setAttribute("d", `M60 150 Q500 ${cy.toFixed(1)} 940 150 Z`);
      const liters = Math.round(100 * fill * (1 - drain));
      w.liters.textContent = liters;
      const dropping = p > 0.03 && p < 0.7;
      w.drops.forEach((d, i) => {
        const ph = (p * 14 + i * 0.37) % 1;
        d.style.opacity = dropping ? (1 - ph) : 0;
        d.setAttribute("cy", (75 + ph * (70 + sag * 0.9)).toFixed(1));
      });
      const step = p < 0.12 ? 0 : p < 0.78 ? 1 : 2;
      w.steps.forEach((li, i) => li.classList.toggle("is-active", i === step));
      w.status.textContent = step === 2 ? "Вода слита — полотно как новое" : liters >= 100 ? "100 литров. Паркет сухой" : "Ремонт в безопасности";
    }

    if (history && rail) {
      const p = progressOf(history);
      const dist = Math.max(0, rail.scrollWidth - innerWidth + 48);
      rail.style.transform = `translate3d(${(-p * dist).toFixed(1)}px, 0, 0)`;
      if (histProg) histProg.style.transform = `scaleX(${p.toFixed(3)})`;
    }

    // активный пункт меню
    let active = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) active = i; });
    navLinks.forEach((a, i) => a.classList.toggle("is-active", i === active));
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Конфигуратор сметы ---------- */
  const form = $("[data-config]");
  var renderPlan = null;
  if (form) {
    const state = {
      room: PRICING.rooms[0].id,
      area: PRICING.rooms[0].area,
      texture: "satin",
      opts: Object.fromEntries(PRICING.options.map((o) => [o.id, { on: !!o.on, count: o.count || 1 }]))
    };
    const areaEl = $("[data-area]", form);
    const areaOut = $("[data-area-out]", form);
    const roomsEl = $("[data-rooms]", form);
    const texEl = $("[data-textures]", form);
    const optsEl = $("[data-options]", form);
    const planEl = $("[data-plan]");
    const priceEl = $("[data-price]");
    const breakdownEl = $("[data-breakdown]");

    roomsEl.innerHTML = PRICING.rooms.map((r) =>
      `<button type="button" class="chip" data-room="${r.id}" aria-pressed="false">${r.name}</button>`).join("");
    texEl.innerHTML = PRICING.textures.map((t) =>
      `<button type="button" class="tex" data-tex="${t.id}" aria-pressed="false">
         <span class="tex__sw ${t.cls}"></span>
         <span class="tex__body"><span class="tex__name">${t.name}</span><span class="tex__price">${fmt(t.rate)} ₽/м²</span></span>
       </button>`).join("");
    optsEl.innerHTML = PRICING.options.map((o) =>
      `<label class="opt" data-opt="${o.id}">
         <input type="checkbox" ${o.on ? "checked" : ""}>
         <span><span class="opt__name">${o.name}</span><span class="opt__hint">${o.hint}</span></span>
         ${o.unit === "pcs"
           ? `<span class="stepper"><button type="button" data-dec aria-label="Меньше">−</button><output>${o.count}</output><button type="button" data-inc aria-label="Больше">+</button></span>`
           : `<span class="opt__hint">${fmt(o.rate)} ₽/м</span>`}
       </label>`).join("");

    roomsEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-room]"); if (!b) return;
      const r = PRICING.rooms.find((x) => x.id === b.dataset.room);
      state.room = r.id; state.area = r.area; areaEl.value = r.area; update();
    });
    texEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tex]"); if (!b) return;
      state.texture = b.dataset.tex; update();
    });
    areaEl.addEventListener("input", () => { state.area = +areaEl.value; update(); });
    optsEl.addEventListener("change", (e) => {
      const l = e.target.closest("[data-opt]"); if (!l) return;
      state.opts[l.dataset.opt].on = e.target.checked; update();
    });
    optsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-inc], [data-dec]"); if (!btn) return;
      e.preventDefault();
      const id = btn.closest("[data-opt]").dataset.opt;
      const o = state.opts[id];
      o.count = clamp(o.count + (btn.hasAttribute("data-inc") ? 1 : -1), 1, 40);
      update();
    });

    const geometry = () => {
      const side = Math.sqrt(state.area);
      const a = side * 1.2, b = side / 1.2; // прямоугольник ~ 1.44:1
      return { a, b, perimeter: 2 * (a + b) };
    };
    const calc = () => {
      const g = geometry();
      const tex = PRICING.textures.find((t) => t.id === state.texture);
      const lines = [{ name: `${tex.full}, ${state.area} м²`, sum: tex.rate * state.area }];
      PRICING.options.forEach((o) => {
        const s = state.opts[o.id]; if (!s.on) return;
        if (o.unit === "perimeter") lines.push({ name: `${o.name}, ${g.perimeter.toFixed(1)} м`, sum: o.rate * g.perimeter });
        if (o.unit === "side") lines.push({ name: `${o.name}, ${g.a.toFixed(1)} м`, sum: o.rate * g.a });
        if (o.unit === "pcs") lines.push({ name: `${o.name} × ${s.count}`, sum: o.rate * s.count });
      });
      return { lines, total: lines.reduce((x, l) => x + l.sum, 0), tex, g };
    };

    renderPlan = () => {
      const { g, tex } = calc();
      // масштаб: комната растёт с площадью, но всегда хорошо читается
      const t = Math.sqrt(clamp((state.area - 3) / (200 - 3)));
      const W = 200 + t * 240, H = W / 1.44;
      const x = (500 - W) / 2, y = (300 - H) / 2;
      const night = root.dataset.theme === "night";
      const ink = night ? "#f2efe9" : "#0d0d0f";
      const glow = "#ffc46e";
      const o = state.opts;
      let svg = `<svg viewBox="0 0 500 320" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="pm" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${night ? "#57544e" : "#ffffff"}"/><stop offset="1" stop-color="${night ? "#2c2b28" : "#ecebe7"}"/></radialGradient>
          <linearGradient id="ps" x1="0" y1="0" x2="1" y2="1"><stop offset=".1" stop-color="${night ? "#34332f" : "#e5e3df"}"/><stop offset=".45" stop-color="${night ? "#6b675f" : "#ffffff"}"/><stop offset=".62" stop-color="${night ? "#3a3935" : "#e3e0da"}"/><stop offset="1" stop-color="${night ? "#2e2d2a" : "#f2f0ec"}"/></linearGradient>
          <pattern id="pf" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="${night ? "#393630" : "#ebe7df"}"/><path d="M0 .5H4M.5 0V4" stroke="${night ? "#2a2824" : "#d6d0c4"}" stroke-width=".6"/></pattern>
          <filter id="pg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
        </defs>
        <rect class="p-room" x="${x}" y="${y}" width="${W}" height="${H}" fill="${{ matte: "url(#pm)", satin: "url(#ps)", fabric: "url(#pf)" }[tex.id]}" stroke="${ink}" stroke-width="1.5"/>`;
      if (o.shadow.on) svg += `<rect x="${x + 5}" y="${y + 5}" width="${W - 10}" height="${H - 10}" fill="none" stroke="${ink}" stroke-width="2.5"/>`;
      if (o.niche.on) {
        svg += `<rect x="${x + 5}" y="${y + 5}" width="${W - 10}" height="12" fill="${ink}"/>`;
        if (night) svg += `<rect x="${x + 5}" y="${y + 17}" width="${W - 10}" height="3" fill="${glow}" filter="url(#pg)"/>`;
        for (let i = 0; i < 18; i++) svg += `<path d="M${x + 10 + i * (W - 20) / 18} ${y + 8} q3 2 0 6" stroke="${night ? "#0b0b0c" : "#f2efe9"}" fill="none" stroke-width="1"/>`;
      }
      if (o.lines.on) {
        const n = o.lines.count;
        for (let i = 0; i < n; i++) {
          const lx = x + W * (i + 1) / (n + 1);
          svg += `<line x1="${lx}" y1="${y + 26}" x2="${lx}" y2="${y + H - 18}" stroke="${night ? glow : ink}" stroke-width="3"/>`;
          if (night) svg += `<line x1="${lx}" y1="${y + 26}" x2="${lx}" y2="${y + H - 18}" stroke="${glow}" stroke-width="6" filter="url(#pg)" opacity=".8"/>`;
        }
      }
      if (o.track.on) {
        const n = o.track.count;
        for (let i = 0; i < n; i++) {
          const ty = y + 30 + (H - 50) * (i + 1) / (n + 1);
          svg += `<line x1="${x + 24}" y1="${ty}" x2="${x + W - 24}" y2="${ty}" stroke="${ink}" stroke-width="4"/>`;
          for (let j = 0; j < 4; j++) svg += `<rect x="${x + 34 + j * (W - 78) / 3}" y="${ty - 5}" width="10" height="10" fill="${night ? glow : ink}"/>`;
        }
      }
      if (o.spots.on) {
        const n = o.spots.count, cols = Math.ceil(Math.sqrt(n * W / H)), rows = Math.ceil(n / cols);
        let c = 0;
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols && c < n; q++, c++) {
          const sx = x + W * (q + 1) / (cols + 1), sy = y + 20 + (H - 30) * (r + 1) / (rows + 1);
          if (night) svg += `<circle cx="${sx}" cy="${sy}" r="9" fill="${glow}" opacity=".55" filter="url(#pg)"/>`;
          svg += `<circle cx="${sx}" cy="${sy}" r="4" fill="${night ? "#fff3dd" : ink}"/>`;
        }
      }
      svg += `<text class="p-label" x="250" y="${y + H + 26}" text-anchor="middle">≈ ${g.a.toFixed(1)} × ${g.b.toFixed(1)} м · ${state.area} м²</text></svg>`;
      planEl.innerHTML = svg;
    };

    let shown = 0, target = 0, priceRaf = 0;
    const tweenPrice = () => {
      cancelAnimationFrame(priceRaf);
      const from = shown, t0 = performance.now();
      const step = (t) => {
        const p = reduce ? 1 : ease((t - t0) / 600);
        shown = from + (target - from) * p;
        priceEl.textContent = fmt(shown);
        if (p < 1) priceRaf = requestAnimationFrame(step);
      };
      priceRaf = requestAnimationFrame(step);
    };

    const shareText = (r) => {
      const room = PRICING.rooms.find((x) => x.id === state.room);
      return `Здравствуйте! Хочу потолок Carré Noir.\n${room ? room.name + ", " : ""}${r.lines.map((l) => "• " + l.name).join("\n")}\nОриентировочно: ${fmt(r.total)} ₽.\nПрошу вызвать замерщика.`;
    };

    function update() {
      areaOut.textContent = state.area + " м²";
      areaEl.style.setProperty("--fill", ((state.area - areaEl.min) / (areaEl.max - areaEl.min) * 100) + "%");
      $$("[data-room]", roomsEl).forEach((b) => {
        const r = PRICING.rooms.find((x) => x.id === b.dataset.room);
        b.setAttribute("aria-pressed", String(b.dataset.room === state.room && r.area === state.area));
      });
      $$("[data-tex]", texEl).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tex === state.texture)));
      $$("[data-opt]", optsEl).forEach((l) => {
        const s = state.opts[l.dataset.opt];
        l.classList.toggle("is-on", s.on);
        const out = $("output", l); if (out) out.textContent = s.count;
      });
      const r = calc();
      target = r.total; tweenPrice();
      breakdownEl.innerHTML = r.lines.map((l) => `<li><span>${l.name}</span><span>${fmt(l.sum)} ₽</span></li>`).join("");
      renderPlan();
      const text = shareText(r);
      const url = location.href.split("#")[0];
      $("[data-share-tg]").href = CONTACT.telegram
        ? `https://t.me/${CONTACT.telegram}?text=${encodeURIComponent(text)}`
        : `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      $("[data-share-wa]").href = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
      $("[data-share-copy]").dataset.text = text;
    }

    $("[data-share-copy]").addEventListener("click", async (e) => {
      const b = e.currentTarget;
      try { await navigator.clipboard.writeText(b.dataset.text); b.textContent = "Скопировано"; }
      catch (err) { b.textContent = "Не удалось"; }
      setTimeout(() => { b.textContent = "Скопировать"; }, 1600);
    });

    update();
  }
})();
