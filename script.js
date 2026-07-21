const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector(".mobile-nav");
const mobileNavLinks = document.querySelectorAll(".mobile-nav a");

const setHeaderState = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 16);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

if (navToggle && mobileNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const faqItems = document.querySelectorAll(".faq-item");
faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    faqItems.forEach((other) => {
      if (other !== item) other.removeAttribute("open");
    });
  });
});

const initTypewriter = (element) => {
  const words = (element.dataset.words || "")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);

  if (!words.length) return;

  const typeRow = element.closest(".type-row");
  const typewriterHost = element.closest("h1, h2, h3, h4, p");

  typewriterHost?.classList.add("has-typewriter");

  const reserveTypeWidth = () => {
    if (!typeRow) return;

    const measureHost = typeRow.parentElement || typeRow;
    const probe = element.cloneNode(false);

    probe.setAttribute("aria-hidden", "true");
    probe.removeAttribute("data-words");
    probe.style.position = "fixed";
    probe.style.left = "-9999px";
    probe.style.top = "0";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    probe.style.whiteSpace = "nowrap";

    measureHost.appendChild(probe);

    let reservedWidth = 0;

    words.forEach((word) => {
      probe.textContent = word;
      reservedWidth = Math.max(reservedWidth, probe.getBoundingClientRect().width);
    });

    const fontSize = Number.parseFloat(window.getComputedStyle(element).fontSize) || 0;
    const caretAllowance = fontSize * 0.2;

    measureHost.removeChild(probe);
    typeRow.style.setProperty("--type-row-width", `${Math.ceil(reservedWidth + caretAllowance)}px`);
  };

  reserveTypeWidth();

  if (document.fonts?.ready) {
    document.fonts.ready.then(reserveTypeWidth);
  }

  window.addEventListener("resize", reserveTypeWidth, { passive: true });

  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const currentWord = words[wordIndex];

    if (!deleting) {
      charIndex += 1;
      element.textContent = currentWord.slice(0, charIndex);
      if (charIndex === currentWord.length) {
        deleting = true;
        window.setTimeout(tick, 1500);
        return;
      }
      window.setTimeout(tick, 85);
      return;
    }

    charIndex -= 1;
    element.textContent = currentWord.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      window.setTimeout(tick, 260);
      return;
    }
    window.setTimeout(tick, 48);
  };

  element.textContent = "";
  tick();
};

document.querySelectorAll(".type-target").forEach(initTypewriter);

const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

const TOTEM_YAW = -22;
const CUBES = [
  { id: "cube1", dir: 1, from: 0.0, to: 0.42 },
  { id: "cube2", dir: -1, from: 0.3, to: 0.72 },
  { id: "cube3", dir: 1, from: 0.6, to: 1.0 },
];

const smoothstep = (value) => {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
};

const windowProgress = (progress, from, to) => smoothstep((progress - from) / (to - from));
const mapTakeoverProgress = (progress) => {
  const clamped = Math.min(1, Math.max(0, progress));

  if (clamped <= 0.2) return 0;
  if (clamped < 0.7) return smoothstep((clamped - 0.2) / 0.5);
  if (clamped < 1) return 1 - smoothstep((clamped - 0.7) / 0.3);

  return 0;
};
const mapCopyProgress = (progress) => {
  const clamped = Math.min(1, Math.max(0, progress));

  if (clamped <= 0.2) return 0;
  if (clamped < 0.42) return smoothstep((clamped - 0.2) / 0.22);

  return 1;
};
const mapTotemShiftY = (progress) => {
  const clamped = Math.min(1, Math.max(0, progress));

  if (clamped <= 0.2) return "var(--totem-rest-y)";
  if (clamped < 0.7) {
    const centerProgress = smoothstep((clamped - 0.2) / 0.5);
    return `calc(var(--totem-rest-y) * ${(1 - centerProgress).toFixed(4)})`;
  }

  const exitProgress = smoothstep((clamped - 0.7) / 0.3);
  return `calc(var(--totem-exit-y) * -${exitProgress.toFixed(4)})`;
};

const initTotemHero = (section) => {
  const track = section.querySelector("[data-totem-track]");
  if (!track) return;
  const sticky = section.querySelector(".totem-hero__sticky");
  const shell = section.querySelector(".totem-hero__totem-wrap");
  const header = document.querySelector(".site-header");

  const cubes = CUBES.map((cube) => ({
    ...cube,
    el: section.querySelector(`#${cube.id}`),
  })).filter((cube) => cube.el);

  if (!cubes.length) return;

  const steps = Array.from(section.querySelectorAll("[data-totem-step]"));

  const applyState = (rotationProgress, shellProgress = rotationProgress) => {
    section.style.setProperty(
      "--hero-media-shift",
      `${((0.5 - rotationProgress) * 28).toFixed(2)}px`,
    );
    section.style.setProperty("--totem-copy-progress", mapCopyProgress(rotationProgress).toFixed(4));
    section.style.setProperty("--totem-shift-y", mapTotemShiftY(rotationProgress));

    if (shell) {
      section.style.setProperty("--totem-shell-progress", shellProgress.toFixed(4));
    }

    cubes.forEach((cube, index) => {
      const localProgress = windowProgress(rotationProgress, cube.from, cube.to);
      const angle = cube.dir * localProgress * 360;

      cube.el.style.transform = `rotateY(${angle}deg)`;

      Array.from(cube.el.children).forEach((face, faceIndex) => {
        const faceAngle = (TOTEM_YAW + angle + faceIndex * 90) * (Math.PI / 180);
        const facing = Math.cos(faceAngle);
        const brightness = 0.45 + 0.55 * (facing * 0.5 + 0.5);
        face.style.filter = `brightness(${brightness.toFixed(3)})`;
      });

      steps[index]?.classList.toggle("is-active", localProgress > 0.05);
    });
  };

  const update = () => {
    const scrollable = track.offsetHeight - window.innerHeight;
    if (scrollable <= 0) {
      applyState(0);
      return;
    }

    const rect = track.getBoundingClientRect();
    const rawProgress = Math.min(1, Math.max(0, -rect.top / scrollable));
    const takeoverProgress = mapTakeoverProgress(rawProgress);
    const takeoverActive = rawProgress >= 0.2 && rawProgress <= 0.7;
    section.classList.toggle("is-takeover-active", takeoverActive);
    sticky?.classList.toggle("is-takeover-active", takeoverActive);
    header?.classList.toggle("is-totem-takeover", takeoverActive);
    applyState(rawProgress, takeoverProgress);
  };

  if (prefersReducedMotion) {
    section.classList.add("is-reduced-motion");
    section.style.setProperty("--hero-media-shift", "0px");
    section.style.setProperty("--totem-copy-progress", "0");
    if (shell) {
      section.style.setProperty("--totem-shell-progress", "0");
    }
    sticky?.classList.remove("is-takeover-active");
    header?.classList.remove("is-totem-takeover");
    applyState(0);
    return;
  }

  let ticking = false;

  const onScroll = () => {
    if (ticking) return;

    ticking = true;
    window.requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  window.addEventListener("load", update, { once: true, passive: true });

  update();
};

document.querySelectorAll(".totem-hero-section").forEach(initTotemHero);

const initAutoSlider = (slider) => {
  const slides = Array.from(slider.querySelectorAll(".results-gallery__slide"));
  const progressItems = Array.from(slider.querySelectorAll(".results-gallery__progress-item"));
  const prevButton = slider.querySelector("[data-slider-prev]");
  const nextButton = slider.querySelector("[data-slider-next]");
  const currentValue = slider.querySelector("[data-slider-current]");
  const totalValue = slider.querySelector("[data-slider-total]");
  const interval = Number(slider.dataset.sliderInterval || 2600);

  if (!slides.length) return;

  let activeIndex = 0;
  let autoplayId = null;

  slider.style.setProperty("--slider-interval", `${interval}ms`);

  const updateMeta = () => {
    if (currentValue) currentValue.textContent = String(activeIndex + 1).padStart(2, "0");
    if (totalValue) totalValue.textContent = String(slides.length).padStart(2, "0");
  };

  const setActiveSlide = (nextIndex) => {
    activeIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex);
    });

    progressItems.forEach((item, itemIndex) => {
      item.classList.remove("is-active");
      item.setAttribute("aria-current", String(itemIndex === activeIndex));
    });

    if (progressItems[activeIndex]) {
      // Reflow restarts the active progress animation on each transition.
      void progressItems[activeIndex].offsetWidth;
      progressItems[activeIndex].classList.add("is-active");
    }

    updateMeta();
  };

  const restartAutoplay = () => {
    if (autoplayId) window.clearInterval(autoplayId);
    if (prefersReducedMotion || slides.length < 2) return;

    autoplayId = window.setInterval(() => {
      setActiveSlide(activeIndex + 1);
    }, interval);
  };

  progressItems.forEach((item) => {
    item.addEventListener("click", () => {
      const nextIndex = Number(item.dataset.sliderIndex);
      if (Number.isNaN(nextIndex)) return;
      setActiveSlide(nextIndex);
      restartAutoplay();
    });
  });

  prevButton?.addEventListener("click", () => {
    setActiveSlide(activeIndex - 1);
    restartAutoplay();
  });

  nextButton?.addEventListener("click", () => {
    setActiveSlide(activeIndex + 1);
    restartAutoplay();
  });

  setActiveSlide(0);
  restartAutoplay();
};

document.querySelectorAll("[data-auto-slider]").forEach(initAutoSlider);

const easeOutCubic = (progress) => 1 - Math.pow(1 - progress, 3);

const formatCounterValue = (value, decimals) => {
  if (decimals > 0) return value.toFixed(decimals);
  return String(Math.round(value));
};

const setCounterValue = (element, value) => {
  const decimals = Number(element.dataset.countDecimals || 0);
  element.textContent = formatCounterValue(value, decimals);
};

const animateCounter = (element, duration = 1200) => {
  const endValue = Number(element.dataset.countEnd);

  if (!Number.isFinite(endValue)) return;

  if (prefersReducedMotion) {
    setCounterValue(element, endValue);
    return;
  }

  const startTime = performance.now();

  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedValue = easeOutCubic(progress) * endValue;

    setCounterValue(element, easedValue);

    if (progress < 1) {
      window.requestAnimationFrame(step);
      return;
    }

    setCounterValue(element, endValue);
  };

  window.requestAnimationFrame(step);
};

const initCountGroup = (group) => {
  const counters = Array.from(group.querySelectorAll("[data-countup]"));

  if (!counters.length) return;

  const revealFinalValues = () => {
    counters.forEach((counter) => {
      const endValue = Number(counter.dataset.countEnd);
      if (Number.isFinite(endValue)) setCounterValue(counter, endValue);
    });
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealFinalValues();
    return;
  }

  counters.forEach((counter) => setCounterValue(counter, 0));

  let hasAnimated = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || hasAnimated) return;
        hasAnimated = true;
        counters.forEach((counter) => animateCounter(counter));
        observer.unobserve(group);
      });
    },
    { threshold: 0.4 },
  );

  observer.observe(group);
};

document.querySelectorAll("[data-count-group]").forEach(initCountGroup);

const supportsFinePointer =
  window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ?? false;

const initFooterExperience = (footer) => {
  if (!footer) return;

  const wordmark = footer.querySelector("[data-footer-wordmark]");
  const wordmarkLabel = wordmark?.querySelector(":scope > span");
  const bottomSection = footer.querySelector(".site-footer__bottom-section");
  const canvas = footer.querySelector("[data-footer-trail]");
  let footerRect = footer.getBoundingClientRect();

  const updateFooterRect = () => {
    footerRect = footer.getBoundingClientRect();
  };

  const fitFooterHeading = () => {
    if (!wordmark || !wordmarkLabel || !bottomSection) return;

    const probeSize = 200;
    wordmark.style.setProperty("--footer-heading-size", `${probeSize}px`);

    const measuredWidth = Math.max(
      wordmarkLabel.getBoundingClientRect().width,
      wordmarkLabel.scrollWidth,
    );
    if (!measuredWidth) return;

    const availableWidth = bottomSection.getBoundingClientRect().width;
    const wordmarkInset =
      Number.parseFloat(getComputedStyle(footer).getPropertyValue("--footer-wordmark-inset")) || 0;
    const safeWidth = Math.max(availableWidth - wordmarkInset * 2, 1);
    const contentRatio = window.innerWidth >= 1024 ? 1.01 : 0.985;
    const targetWidth = safeWidth * contentRatio;
    const fittedSize = (targetWidth * probeSize) / measuredWidth;

    wordmark.style.setProperty("--footer-heading-size", `${fittedSize}px`);
  };

  const refreshFooterLayout = () => {
    updateFooterRect();
    fitFooterHeading();
  };

  const updateAmbientTarget = (clientX, clientY) => {
    const width = Math.max(footerRect.width, 1);
    const height = Math.max(footerRect.height, 1);
    const relativeX = Math.min(Math.max((clientX - footerRect.left) / width, 0), 1);
    const relativeY = Math.min(Math.max((clientY - footerRect.top) / height, 0), 1);

    footer.style.setProperty("--footer-blob-x", relativeX.toFixed(3));
    footer.style.setProperty("--footer-blob-y", relativeY.toFixed(3));
    footer.style.setProperty("--footer-pill-x", `${(relativeX * 100).toFixed(2)}`);
    footer.style.setProperty("--footer-pill-y", `${(relativeY * 100).toFixed(2)}`);
  };

  wordmark?.addEventListener("mouseenter", () => {
    footer.classList.add("is-wordmark-hover");
  });

  wordmark?.addEventListener("mouseleave", () => {
    footer.classList.remove("is-wordmark-hover");
  });

  wordmark?.addEventListener("focus", () => {
    footer.classList.add("is-wordmark-hover");
  });

  wordmark?.addEventListener("blur", () => {
    footer.classList.remove("is-wordmark-hover");
  });

  footer.addEventListener(
    "pointerenter",
    (event) => {
      refreshFooterLayout();
      updateAmbientTarget(event.clientX, event.clientY);
    },
    { passive: true },
  );

  if (document.fonts?.ready) {
    document.fonts.ready.then(refreshFooterLayout);
  } else {
    refreshFooterLayout();
  }

  if (!canvas || prefersReducedMotion || !supportsFinePointer) {
    window.addEventListener("resize", refreshFooterLayout, { passive: true });
    window.addEventListener("scroll", updateFooterRect, { passive: true });
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) return;

  const particleColor =
    getComputedStyle(footer).getPropertyValue("--footer-trail-rgb").trim() || "1, 90, 213";

  const state = {
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    particles: [],
    lastX: null,
    lastY: null,
    frameId: 0,
    lastFrameTime: performance.now(),
  };

  const resizeCanvas = () => {
    refreshFooterLayout();

    const width = Math.max(1, Math.round(footerRect.width * state.dpr));
    const height = Math.max(1, Math.round(footerRect.height * state.dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${footerRect.width}px`;
      canvas.style.height = `${footerRect.height}px`;
    }
  };

  const spawnParticles = (clientX, clientY) => {
    const localX = clientX - footerRect.left;
    const localY = clientY - footerRect.top;

    if (state.lastX === null || state.lastY === null) {
      state.lastX = localX;
      state.lastY = localY;
    }

    const deltaX = localX - state.lastX;
    const deltaY = localY - state.lastY;
    const distance = Math.hypot(deltaX, deltaY);
    const steps = Math.max(1, Math.floor(distance / 14));

    for (let step = 0; step <= steps; step += 1) {
      const progress = distance === 0 ? 1 : step / steps;

      state.particles.push({
        x: state.lastX + deltaX * progress,
        y: state.lastY + deltaY * progress,
        radius: 92 + Math.random() * 18,
        opacity: 0.86 - Math.random() * 0.12,
        age: 0,
        life: 900 + Math.random() * 280,
      });
    }

    if (state.particles.length > 180) {
      state.particles.splice(0, state.particles.length - 180);
    }

    state.lastX = localX;
    state.lastY = localY;
  };

  const drawParticles = (frameTime) => {
    const delta = Math.min(frameTime - state.lastFrameTime, 32);
    state.lastFrameTime = frameTime;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    state.particles = state.particles.filter((particle) => {
      particle.age += delta;

      const progress = particle.age / particle.life;
      if (progress >= 1) return false;

      const alpha = particle.opacity * (1 - Math.pow(progress, 1.35));

      context.beginPath();
      context.fillStyle = `rgba(${particleColor}, ${alpha})`;
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();

      return true;
    });

    state.frameId = window.requestAnimationFrame(drawParticles);
  };

  const handlePointerMove = (event) => {
    updateAmbientTarget(event.clientX, event.clientY);
    spawnParticles(event.clientX, event.clientY);
  };

  const handlePointerLeave = () => {
    state.lastX = null;
    state.lastY = null;
  };

  resizeCanvas();
  state.frameId = window.requestAnimationFrame(drawParticles);

  footer.addEventListener("pointermove", handlePointerMove, { passive: true });
  footer.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.addEventListener("scroll", updateFooterRect, { passive: true });
};

document.querySelectorAll(".site-footer").forEach(initFooterExperience);

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray("[data-reveal]").forEach((element, index) => {
    gsap.from(element, {
      y: 36,
      autoAlpha: 0,
      duration: 0.9,
      ease: "power3.out",
      delay: Math.min(index * 0.03, 0.18),
      scrollTrigger: {
        trigger: element,
        start: "top 86%",
      },
    });
  });

  gsap.to(".paper-accent", {
    yPercent: -18,
    ease: "none",
    scrollTrigger: {
      trigger: ".testimonial-card",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });

  gsap.to(".final-cta__fabric", {
    yPercent: -10,
    ease: "none",
    scrollTrigger: {
      trigger: ".final-cta__shell",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });

  gsap.utils.toArray(".timeline-card, .pillar-card, .champion-card").forEach((card) => {
    gsap.from(card, {
      scale: 0.98,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: card,
        start: "top 88%",
      },
    });
  });
}
