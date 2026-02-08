/**
 * Virtual Try-On MVP (stable)
 * Size → Breed → View reference system
 */

const video = document.getElementById("cam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startCamBtn = document.getElementById("startCam");
const stopCamBtn = document.getElementById("stopCam");
const bgUpload = document.getElementById("bgUpload");
const resetBtn = document.getElementById("reset");

const dogImageEl = document.getElementById("dogImage");
const viewBtns = document.querySelectorAll(".view-toggle button");
const sizeBtns = document.querySelectorAll(".size-grid button");
const breedSelect = document.getElementById("breedSelect");

let stream = null;
let useCamera = false;
const bgImg = new Image();
let hasBgImage = false;

const SIZE_MAP = {
  XS: "xs",
  S: "sm",
  M: "med",
  L: "lg",
  XL: "xl"
};

const breedsBySize = {
  xs: ["Chihuahua", "Papillon", "Pomeranian", "Yorkshire Terrier"],
  sm: ["Dachshund", "French Bulldog", "Jack Russel", "Shih Tzu"],
  med: [],
  lg: [],
  xl: []
};

const state = {
  size: "xs",
  breed: "",
  view: "front"
};

// -----------------------------
// BREEDS
// -----------------------------
function populateBreeds() {
  breedSelect.innerHTML = "";

  const breeds = breedsBySize[state.size] || [];
  if (!breeds.length) return;

  breeds.forEach((breed, index) => {
    const opt = document.createElement("option");
    opt.value = breed;
    opt.textContent = breed;
    breedSelect.appendChild(opt);
    if (index === 0) state.breed = breed;
  });

  updateDogImage();
}

// -----------------------------
// IMAGE
// -----------------------------
function updateDogImage() {
  if (!state.breed) return;

  dogImageEl.style.opacity = 0;
  setTimeout(() => {
    dogImageEl.src = `assets/dogs/${state.size}/${state.breed}/${state.view}.png`;
    dogImageEl.alt = `${state.size} ${state.breed} ${state.view}`;
    dogImageEl.style.opacity = 1;
  }, 150);
}

// -----------------------------
// SIZE / BREED / VIEW
// -----------------------------
sizeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    sizeBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    state.size = SIZE_MAP[btn.dataset.size];
    populateBreeds();
  });
});

breedSelect.addEventListener("change", e => {
  state.breed = e.target.value;
  updateDogImage();
});

viewBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    viewBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.view = btn.dataset.view;
    updateDogImage();
  });
});

// -----------------------------
// CANVAS
// -----------------------------
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
    useCamera = true;
  } catch {}
}

function stopCamera() {
  useCamera = false;
  if (stream) stream.getTracks().forEach(t => t.stop());
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

function draw() {
  resizeCanvas();
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
