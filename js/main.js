// Reveal-on-scroll
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) e.target.classList.add("show");
  }
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach(el => io.observe(el));

// Simple parallax (moves the ::before background via CSS variable)
const parallaxEls = document.querySelectorAll("[data-parallax]");
function onScroll(){
  const y = window.scrollY;
  parallaxEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    const progress = (rect.top + rect.height * 0.5) / window.innerHeight; // ~0..1
    const offset = (progress - 0.5) * 28; // px
    el.style.setProperty("--parallaxY", `${offset}px`);
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Apply CSS var to parallax ::before (inline style doesn't affect pseudo elements,
// so we inject a tiny stylesheet rule using attribute selector)
const styleTag = document.createElement("style");
styleTag.textContent = `
  [data-parallax].parallax::before{
    transform: translate3d(0, var(--parallaxY, 0px), 0) scale(1.15) !important;
  }
`;
document.head.appendChild(styleTag);

// 3D tilt for cards
function tiltCard(card, ev){
  const rect = card.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width;
  const y = (ev.clientY - rect.top) / rect.height;
  const rotY = (x - 0.5) * 12; // degrees
  const rotX = (0.5 - y) * 10;

  card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
}
function resetCard(card){
  card.style.transform = `rotateX(0deg) rotateY(0deg) translateY(0px)`;
}

document.querySelectorAll("[data-tilt]").forEach(card => {
  card.addEventListener("mousemove", (ev) => tiltCard(card, ev));
  card.addEventListener("mouseleave", () => resetCard(card));
});
