/**
 * Virtual Try-On MVP:
 * - Live camera OR uploaded photo as background
 * - Coat PNG overlay (transparent)
 * - Drag overlay with mouse/touch
 * - Scale + rotate sliders
 * - Export screenshot
 */

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

let stream = null;
let useCamera = false;

const bgImg = new Image();
let hasBgImage = false;

const coatImg = new Image();
let coatLoaded = false;

const overlay = {
  x: 0.5,  // normalized
  y: 0.55,
  scale: 0.55,
  rotate: 0,
  opacity: 0.95,
};

// --- Subtle size-based overlay scaling ---
const sizeScaleMap = {
  xs: 0.48,
  sm: 0.52,
  med: 0.55, // baseline
  lg: 0.58,
  xl: 0.62
};

function resizeCanvasToStage(){
  const stage = canvas.parentElement;
  const rect = stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
}

window.addEventListener("resize", resizeCanvasToStage);

async function startCamera(){
  try{
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio:false });
    video.srcObject = stream;
    await video.play();
    useCamera = true;
  }catch(err){
    alert("Camera blocked or unavailable. You can still upload a photo for try-on.");
    useCamera = false;
  }
}

function stopCamera(){
  useCamera = false;
  if(stream){
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  video.srcObject = null;
}

function loadCoat(src){
  coatLoaded = false;
  coatImg.onload = () => { coatLoaded = true; };
  coatImg.onerror = () => { coatLoaded = false; alert("Couldn't load coat image."); };
  coatImg.src = src;
}

function loadBgFromFile(file){
  if(!file) return;
  const url = URL.createObjectURL(file);
  bgImg.onload = () => {
    hasBgImage = true;
    URL.revokeObjectURL(url);
  };
  bgImg.src = url;
}

function draw(){
  resizeCanvasToStage();

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  // Background: camera > uploaded photo > fallback gradient
  if(useCamera && video.readyState >= 2){
    ctx.drawImage(video, 0, 0, w, h);
  }else if(hasBgImage){
    // cover-fit background image
    const ir = bgImg.width / bgImg.height;
    const cr = w / h;
    let dw = w, dh = h, dx = 0, dy = 0;
    if(ir > cr){
      dh = h;
      dw = h * ir;
      dx = (w - dw) / 2;
    }else{
      dw = w;
      dh = w / ir;
      dy = (h - dh) / 2;
    }
    ctx.drawImage(bgImg, dx, dy, dw, dh);
  }else{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, "#0b0f14");
    g.addColorStop(1, "#101826");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.font = "16px system-ui";
    ctx.fillText("Start Camera or Upload a Dog Photo →", 16, 28);
  }
  let currentSize = "med";
let currentView = "front";

const dogImage = document.getElementById("dogImage");
const viewButtons = document.querySelectorAll(".view-toggle button");

function updateDogImage() {
  dogImage.style.opacity = 0;
  setTimeout(() => {
    dogImage.src = `assets/dogs/${currentSize}/${currentView}.png`;
    dogImage.style.opacity = 1;
  }, 150);
}

viewButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    viewButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentView = btn.dataset.view;
    updateDogImage();
  });
});

// Hook into your existing size selector
sizeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentSize = btn.dataset.size.toLowerCase();
    updateDogImage();
  });
});

<div class="view-toggle">
  <button data-view="front" class="active" type="button">Front</button>
  <button data-view="left" type="button">Side</button>
  <button data-view="right" type="button">Back</button>
</div>

img.style.opacity = 0;
setTimeout(() => {
  img.src = newSrc;
  img.style.opacity = 1;
}, 240);

<div class="dog-stage">
  <img id="dogImage" alt="Dog reference" />
</div>

// --- Coat Style Selector ---
const styleButtons = document.querySelectorAll(".coat-style-grid button");
const styleNote = document.getElementById("styleNote");

let currentStyle = "winter";

styleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    styleButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentStyle = btn.dataset.style;

    let label = "Winter Coat";
    if (currentStyle === "rain") label = "Rain Coat";
    if (currentStyle === "costume") label = "Seasonal / Costume";

    styleNote.innerHTML = `
      Shown as a representative <strong>${label}</strong>.
      Final design may vary for custom orders.
    `;

    // Future hook:
    // adjustOverlayByStyle(currentStyle);
  });
});

  // Overlay coat
  if(coatLoaded){
    ctx.save();
    ctx.globalAlpha = overlay.opacity;

    const px = overlay.x * w;
    const py = overlay.y * h;

    const base = Math.min(w, h);
    const targetW = base * overlay.scale;     // "visual size"
    const aspect = coatImg.width / coatImg.height;
    const targetH = targetW / aspect;

    ctx.translate(px, py);
    ctx.rotate(overlay.rotate * Math.PI / 180);

    // draw centered
    ctx.drawImage(coatImg, -targetW/2, -targetH/2, targetW, targetH);
    ctx.restore();

    // helper outline (subtle)
    ctx.save();
    ctx.strokeStyle = "rgba(46,196,199,.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6,6]);
    ctx.strokeRect(px - 70, py - 45, 140, 90);
    ctx.restore();
  }

  requestAnimationFrame(draw);
}

/* Drag support */
let dragging = false;

function pointerPos(evt){
  const rect = canvas.getBoundingClientRect();
  const x = (evt.clientX - rect.left);
  const y = (evt.clientY - rect.top);
  return { x, y, w: rect.width, h: rect.height };
}

function onDown(evt){
  dragging = true;
  canvas.setPointerCapture(evt.pointerId);
}
function onMove(evt){
  if(!dragging) return;
  const p = pointerPos(evt);
  overlay.x = Math.max(0, Math.min(1, p.x / p.w));
  overlay.y = Math.max(0, Math.min(1, p.y / p.h));
}
function onUp(evt){
  dragging = false;
  try{ canvas.releasePointerCapture(evt.pointerId); }catch{}
}

canvas.addEventListener("pointerdown", onDown);
canvas.addEventListener("pointermove", onMove);
canvas.addEventListener("pointerup", onUp);
canvas.addEventListener("pointercancel", onUp);

/* Controls */
scaleRange.addEventListener("input", () => overlay.scale = Number(scaleRange.value));
overlay.scale = sizeScaleMap[currentDogSize] || 0.55;
scaleRange.value = overlay.scale;

rotateRange.addEventListener("input", () => overlay.rotate = Number(rotateRange.value));
opacityRange.addEventListener("input", () => overlay.opacity = Number(opacityRange.value));

coatSelect.addEventListener("change", () => loadCoat(coatSelect.value));
bgUpload.addEventListener("change", (e) => loadBgFromFile(e.target.files[0]));

startCamBtn.addEventListener("click", async () => {
  await startCamera();
});
stopCamBtn.addEventListener("click", () => stopCamera());

resetBtn.addEventListener("click", () => {
  overlay.x = 0.5; overlay.y = 0.55;
  overlay.scale = 0.55; overlay.rotate = 0;
  overlay.opacity = 0.95;
  scaleRange.value = overlay.scale;
  rotateRange.value = overlay.rotate;
  opacityRange.value = overlay.opacity;
});

exportBtn.addEventListener("click", () => {
  // Export a screenshot of the canvas as PNG
  const a = document.createElement("a");
  a.download = "dog-coat-tryon.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
});

/* Boot */
resizeCanvasToStage();
loadCoat("assets/coats/coat-1.png"); // default
draw();
// --- Dog reference image loader (Option A: keep your filenames) ---
let currentDogSize = "xs";     // xs, sm, med, lg, xl
let currentDogView = "front";  // front, left, right

const dogImageEl = document.getElementById("dogImage");
const viewBtns = document.querySelectorAll(".view-toggle button");

// A small map of size -> list of files. We'll fetch a JSON list we create manually.
// Easiest no-server way: hardcode per folder (you can expand gradually).
const dogFiles = {
  xs: ["shih tzu front.png", "shih tzu left.png", "shih tzu right.png"],
  sm: [],
  med: [],
  lg: [],
  xl: []
};

function pickDogFile(sizeKey, viewKey){
  const files = dogFiles[sizeKey] || [];
  // find file that includes the view word
  return files.find(f => f.toLowerCase().includes(viewKey)) || null;
}

function updateDogImage(){
  const file = pickDogFile(currentDogSize, currentDogView);
  if(!file){
    // If you haven’t filled in that folder yet
    dogImageEl.removeAttribute("src");
    dogImageEl.alt = `No dog image set yet for ${currentDogSize} / ${currentDogView}`;
    return;
  }

  dogImageEl.style.opacity = 0;
  setTimeout(() => {
    dogImageEl.src = `assets/dogs/${currentDogSize}/${encodeURIComponent(file)}`;
    dogImageEl.style.opacity = 1;
  }, 120);
}

// View buttons
viewBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    viewBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentDogView = btn.dataset.view;
    updateDogImage();
  });
});

// Hook into your size selector buttons if you added them earlier
// If your size buttons have data-size="XS" etc:
document.querySelectorAll(".size-grid button").forEach(btn => {
  btn.addEventListener("click", () => {
    const sizeRaw = btn.dataset.size; // XS, S, M, L, XL
    const map = { XS:"xs", S:"sm", M:"med", L:"lg", XL:"xl" };
    currentDogSize = map[sizeRaw] || "med";
    updateDogImage();
  });
});
// Adjust overlay scale gently based on size
if (sizeScaleMap[currentDogSize]) {
  overlay.scale = sizeScaleMap[currentDogSize];
  scaleRange.value = overlay.scale;
}
// First load
updateDogImage();

if (!file) {
  dogImageEl.src = "assets/dogs/xs/shih tzu front.png";
  dogImageEl.style.opacity = 1;
  return;
}
