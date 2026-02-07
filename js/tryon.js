/**
 * Virtual Try-On (Clean)
 * - Live camera OR uploaded photo as background (canvas)
 * - Coat PNG overlay (transparent) with drag/scale/rotate/opacity
 * - Dog reference image (NOT on canvas) with size + view selector
 * - Coat style selector (messaging + future hook)
 */

// -------------------------
// Canvas / Camera Elements
// -------------------------
const video = document.getElementById("cam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const coatSelect = document.getElementById("coatSelect");
const bgUpload = document.getElementById("bgUpload");
const startCamBtn = document.getElementById("startCam");
const stopCamBtn = document.getElementById("stopCam");

const scaleRange = document.getElementById("scale");
const rotateRange = document.getElementById("rotate");
const opacityRange = document.getElementById("opacity");
const exportBtn = document.getElementById("export");
const resetBtn = document.getElementById("reset");

// -------------------------
// State
// -------------------------
let stream = null;
let useCamera = false;

const bgImg = new Image();
let hasBgImage = false;

const coatImg = new Image();
let coatLoaded = false;

const overlay = {
  x: 0.5, // normalized
  y: 0.55,
  scale: 0.55,
  rotate: 0,
  opacity: 0.95,
};

// Subtle size-based overlay scaling
const sizeScaleMap = {
  xs: 0.48,
  sm: 0.52,
  med: 0.55,
  lg: 0.58,
  xl: 0.62,
};

// -------------------------
// Dog Reference (Option A: keep filenames as-is)
// You must list the filenames you have per size folder.
// Start with xs, expand later.
// -------------------------
let currentDogSize = "xs";      // xs, sm, med, lg, xl
let currentDogView = "front";   // front, left, right

const dogImageEl = document.getElementById("dogImage");

// Buttons exist in HTML:
const viewBtns = document.querySelectorAll(".view-toggle button");
const sizeBtns = document.querySelectorAll(".size-grid button");

// Put your exact filenames here (case/spaces must match):
const dogFiles = {
  xs: ["shih tzu front.png", "shih tzu left.png", "shih tzu right.png"],
  sm: [],   // add later
  med: [],  // add later
  lg: [],   // add later
  xl: [],   // add later
};

function pickDogFile(sizeKey, viewKey) {
  const files = dogFiles[sizeKey] || [];
  return files.find((f) => f.toLowerCase().includes(viewKey)) || null;
}

function updateDogImage() {
  if (!dogImageEl) return;

  const file = pickDogFile(currentDogSize, currentDogView);

  // Fallback: show something instead of a blank page
  const fallback = "shih tzu front.png";
  const safeFile = file || fallback;

  dogImageEl.style.opacity = 0;
  setTimeout(() => {
    dogImageEl.src = `assets/dogs/${currentDogSize}/${encodeURIComponent(safeFile)}`;
    dogImageEl.alt = `Dog size reference: ${currentDogSize} / ${currentDogView}`;
    dogImageEl.style.opacity = 1;
  }, 220);
}

// Hook view buttons
viewBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    viewBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    currentDogView = btn.dataset.view; // front / left / right
    updateDogImage();
  });
});

// Hook size buttons (data-size="XS" etc)
sizeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    sizeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const sizeRaw = btn.dataset.size; // XS, S, M, L, XL
    const map = { XS: "xs", S: "sm", M: "med", L: "lg", XL: "xl" };
    currentDogSize = map[sizeRaw] || "med";

    // Apply gentle overlay scaling for that size + sync slider
    overlay.scale = sizeScaleMap[currentDogSize] || 0.55;
    scaleRange.value = overlay.scale;

    updateDogImage();
  });
});

// -------------------------
// Coat Style Selector (optional, messaging)
// -------------------------
const styleButtons = document.querySelectorAll(".coat-style-grid button");
const styleNote = document.getElementById("styleNote");
let currentStyle = "winter";

styleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    styleButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    currentStyle = btn.dataset.style;

    let label = "Winter Coat";
    if (currentStyle === "rain") label = "Rain Coat";
    if (currentStyle === "costume") label = "Seasonal / Costume";

    if (styleNote) {
      styleNote.innerHTML = `Shown as a representative <strong>${label}</strong>. Final design may vary for custom orders.`;
    }
  });
});

// -------------------------
// Canvas sizing
// -------------------------
function resizeCanvasToStage() {
  const stage = canvas.parentElement;
  const rect = stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  // draw in CSS pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvasToStage);

// -------------------------
// Camera / Background
// -------------------------
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    useCamera = true;
  } catch (err) {
    alert("Camera blocked or unavailable. You can still upload a photo for placement reference.");
    useCamera = false;
  }
}

function stopCamera() {
  useCamera = false;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.srcObject = null;
}

function loadBgFromFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  bgImg.onload = () => {
    hasBgImage = true;
    URL.revokeObjectURL(url);
  };
  bgImg.src = url;
}

// -------------------------
// Coat overlay image
// -------------------------
function loadCoat(src) {
  coatLoaded = false;
  coatImg.onload = () => {
    coatLoaded = true;
  };
  coatImg.onerror = () => {
  coatLoaded = false;

};
  coatImg.src = src;
}

// -------------------------
// Render Loop (Canvas)
// -------------------------
function draw() {
  resizeCanvasToStage();

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  // Background: camera > uploaded photo > fallback gradient
  if (useCamera && video.readyState >= 2) {
    ctx.drawImage(video, 0, 0, w, h);
  } else if (hasBgImage) {
    // cover-fit background image
    const ir = bgImg.width / bgImg.height;
    const cr = w / h;
    let dw = w,
      dh = h,
      dx = 0,
      dy = 0;

    if (ir > cr) {
      dh = h;
      dw = h * ir;
      dx = (w - dw) / 2;
    } else {
      dw = w;
      dh = w / ir;
      dy = (h - dh) / 2;
    }
    ctx.drawImage(bgImg, dx, dy, dw, dh);
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#0b0f14");
    g.addColorStop(1, "#101826");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.font = "16px system-ui";
    ctx.fillText("Select a size/breed to preview fit. Upload optional.", 16, 28);
  }

  // Coat overlay
  if (coatLoaded) {
    ctx.save();
    ctx.globalAlpha = overlay.opacity;

    const px = overlay.x * w;
    const py = overlay.y * h;

    const base = Math.min(w, h);
    const targetW = base * overlay.scale;
    const aspect = coatImg.width / coatImg.height;
    const targetH = targetW / aspect;

    ctx.translate(px, py);
    ctx.rotate((overlay.rotate * Math.PI) / 180);
    ctx.drawImage(coatImg, -targetW / 2, -targetH / 2, targetW, targetH);
    ctx.restore();
  }

  requestAnimationFrame(draw);
}

// -------------------------
// Drag overlay (canvas)
// -------------------------
let dragging = false;

function pointerPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = evt.clientX - rect.left;
  const y = evt.clientY - rect.top;
  return { x, y, w: rect.width, h: rect.height };
}

function onDown(evt) {
  dragging = true;
  canvas.setPointerCapture(evt.pointerId);
}
function onMove(evt) {
  if (!dragging) return;
  const p = pointerPos(evt);
  overlay.x = Math.max(0, Math.min(1, p.x / p.w));
  overlay.y = Math.max(0, Math.min(1, p.y / p.h));
}
function onUp(evt) {
  dragging = false;
  try {
    canvas.releasePointerCapture(evt.pointerId);
  } catch {}
}

canvas.addEventListener("pointerdown", onDown);
canvas.addEventListener("pointermove", onMove);
canvas.addEventListener("pointerup", onUp);
canvas.addEventListener("pointercancel", onUp);

// -------------------------
// Controls
// -------------------------
scaleRange.addEventListener("input", () => (overlay.scale = Number(scaleRange.value)));
rotateRange.addEventListener("input", () => (overlay.rotate = Number(rotateRange.value)));
opacityRange.addEventListener("input", () => (overlay.opacity = Number(opacityRange.value)));

coatSelect.addEventListener("change", () => loadCoat(coatSelect.value));
bgUpload.addEventListener("change", (e) => loadBgFromFile(e.target.files[0]));

startCamBtn.addEventListener("click", async () => {
  await startCamera();
});
stopCamBtn.addEventListener("click", () => stopCamera());

resetBtn.addEventListener("click", () => {
  overlay.x = 0.5;
  overlay.y = 0.55;
  overlay.rotate = 0;
  overlay.opacity = 0.95;

  overlay.scale = sizeScaleMap[currentDogSize] || 0.55;
  scaleRange.value = overlay.scale;
  rotateRange.value = overlay.rotate;
  opacityRange.value = overlay.opacity;
});

exportBtn.addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = "dog-coat-tryon.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
});

// -------------------------
// Boot
// -------------------------
resizeCanvasToStage();
loadCoat("assets/coats/coat-1.png"); // default coat overlay
updateDogImage();                    // show dog reference immediately
draw();
// loadCoat("assets/coats/coat-1.png");
