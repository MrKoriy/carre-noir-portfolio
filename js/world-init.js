(function () {
  "use strict";

  const worldEl = document.getElementById("world");
  if (!worldEl || typeof window.mountScrollWorld !== "function") return;

  window.mountScrollWorld(worldEl, {
    brand: null,
    cta: null,
    hint: null,
    crossfade: 0.08,
    atmosphere: false,
    nav: false,
    connectors: [],
    sections: [
      {
        id: "french-standard",
        label: "Французские потолки с 1998 года",
        still: "assets/world/scene1-desktop.webp",
        clip: "assets/world/scene1-desktop.mp4",
        stillMobile: "assets/world/scene1-mobile.webp",
        clipMobile: "assets/world/scene1-mobile.mp4",
        accent: "#b38938",
        scroll: 2.2,
        linger: 0,
        eyebrow: "ФРАНЦУЗСКИЕ ПОТОЛКИ · С 1998 ГОДА",
        title: "Идеально ровная плоскость",
        body: "Оригинальные европейские полотна без запаха и провисания. Белоснежный бархатный мат и сатин, выдерживающие до 100 литров воды на м² при заливах."
      },
      {
        id: "eurokraab-shadow",
        label: "Теневой зазор EuroKraab",
        still: "assets/world/scene2-desktop.webp",
        clip: "assets/world/scene2-desktop.mp4",
        stillMobile: "assets/world/scene2-mobile.webp",
        clipMobile: "assets/world/scene2-mobile.mp4",
        accent: "#b38938",
        scroll: 2.2,
        linger: 0,
        eyebrow: "ИНЖЕНЕРНЫЕ СИСТЕМЫ",
        title: "Теневой зазор<br>и&nbsp;скрытый свет",
        body: "Теневой профиль 6 мм по периметру стены и скрытые карнизы для штор. Чистый архитектурный минимализм без пластиковых вставок и плинтусов.",
        cta: {
          primary: { label: "Вызвать инженера на замер", href: "#calc" }
        }
      }
    ]
  });
})();
