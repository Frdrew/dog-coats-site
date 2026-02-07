/**
 * Virtual Try-On MVP (Clean, Honest Version)
 * - Camera OR uploaded photo for placement reference
 * - Dog size + view reference images
 * - Canvas export (no coat overlays until real assets exist)
 */

// =====================
// DOM ELEMENTS
// =====================
const video = document.getElementById("cam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startCamBtn = document.getElementById("startCam");
const stopCamBtn = document.getElementById("stopCam");
const bgUpload = document.getElementById("bgUpload");
const exportBtn = document.getElementById("export");
const resetBtn = document.getElementById("reset");

const scaleRange = document.getElementById("scale");
const rotateRange = document.getElementById("rotate");
const opacityRange = document.getElementById("opacity");

const dogImageEl = document.getElementById("dogImage");
const viewBtns = document.querySelectorAll(".view-toggle button");
const sizeBtns = document.querySelectorAll(".size-grid button");

// =====================
// STATE
// =====================
let stream = null;
let useCamera = false;

const bgImg = new Image();
let hasBgImage = false;

const state = {
  dogSize: "xs",       // xs | sm | med | lg | xl
  dogView: "front",    // front | left | right
};

// Gentle visual scaling per size (future-proof)
const sizeScaleMap = {
  xs: 0.48,
  sm: 0.52,
  med: 0.55,
  lg: 0.58,
  xl: 0.62,
};

// =====================
// DOG REFERENCE FILE MAP
// (keep filenames as-is)
// =====================
const dogFiles = {
  xs: ["shih tzu front.png", "shih tzu left.png", "shih tzu right.png"],
  // add others later when ready
};

function pickDogFile(size, view) {
  const files = dogFiles[size] || [];
  return files.find(f => f.toLowerCase().includes(view)) || files[0];
}

function updateDogImage() {
  if (!dogImageEl) return;

  const file = pickDogFile(state.dogSize, state.dogView);
  if (!file) return;

  dogImageEl.style.opacity = 0;
  setTimeout(() => {
    dogImageEl.src = `assets/dogs/${state.dogSize}/${encodeURIComponent(file)}`;
    dogImageEl.alt = `Dog reference: ${state.dogSize} / ${state.dogView}`;
    dogImageEl.style.opacity = 1;
  }, 200);
}

// =====================
// SIZE & VIEW CONTROLS
// =====================
viewBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    viewBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.dogView = btn.dataset.view;
    updateDogImage();
  });
});

sizeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    sizeBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const map = { XS: "xs", S: "sm", M: "med", L: "lg", XL: "xl" };
    state.dogSize = map[btn.dataset.size] || "xs";

    updateDogImage();
  });
});

// =====================
// CANVAS + CAMERA
// =====================
function resizeCanvas() {
  const stage = canvas.parentElement;
  const rect = stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    useCamera = true;
  } catch {
    useCamera = false;
  }
}

function stopCamera() {
  useCamera = false;
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  video.srcObject = null;
}

function loadBg(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  bgImg.onload = () => {
    hasBgImage = true;
    URL.revokeObjectURL(url);
  };
  bgImg.src = url;
}

// =====================
// RENDER LOOP
// =====================
function draw() {
  resizeCanvas();
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  if (useCamera && video.readyState >= 2) {
    ctx.drawImage(video, 0, 0, w, h);
  } else if (hasBgImage) {
    ctx.drawImage(bgImg, 0, 0, w, h);
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#0b0f14");
    g.addColorStop(1, "#101826");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  requestAnimationFrame(draw);
}

// =====================
// CONTROLS
// =====================
bgUpload.addEventListener("change", e => loadBg(e.target.files[0]));
startCamBtn.addEventListener("click", startCamera);
stopCamBtn.addEventListener("click", stopCamera);

resetBtn.addEventListener("click", () => {
  stopCamera();
  hasBgImage = false;
});

exportBtn.addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = "fit-preview.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
});

// =====================
// BOOT
// =====================
resizeCanvas();
updateDogImage();
draw();
