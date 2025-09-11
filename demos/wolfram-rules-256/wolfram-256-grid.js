"use strict";

(function () {
  // Core helpers for Wolfram ECA
  const RULE_BITS = 8; // 2^3 neighborhoods

  const toBitsLSB = (n) => {
    const arr = new Array(RULE_BITS);
    for (let i = 0; i < RULE_BITS; i++) arr[i] = (n >> i) & 1;
    return arr;
  };

  const toBinary8 = (n) => n.toString(2).padStart(8, "0"); // MSB-left display

  // Compute generations for a rule with toroidal boundaries and single-seed center
  function computeGrid(ruleNumber, widthCells, generations) {
    const rule = toBitsLSB(ruleNumber);
    const grid = Array.from({ length: generations }, () => new Uint8Array(widthCells));
    grid[0][Math.floor(widthCells / 2)] = 1;
    for (let y = 0; y < generations - 1; y++) {
      const row = grid[y];
      const next = grid[y + 1];
      for (let x = 0; x < widthCells; x++) {
        const left = row[(x - 1 + widthCells) % widthCells];
        const c = row[x];
        const right = row[(x + 1) % widthCells];
        next[x] = rule[(left << 2) | (c << 1) | right];
      }
    }
    return grid;
  }

  // Render a boolean grid to canvas via offscreen buffer for speed
  function renderGridToCanvas(grid, canvas, cellSize = 1, aliveColor = [255, 215, 0]) {
    const h = grid.length;
    const w = grid[0].length;
    // Draw to a 1:1 offscreen canvas, then scale into the target
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d", { willReadFrequently: false });
    const img = octx.createImageData(w, h);
    const data = img.data;
    const [r, g, b] = aliveColor;
    let i = 0;
    for (let y = 0; y < h; y++) {
      const row = grid[y];
      for (let x = 0; x < w; x++) {
        if (row[x]) {
          data[i] = r;     // R
          data[i + 1] = g; // G
          data[i + 2] = b; // B
          data[i + 3] = 255; // A
        } else {
          // transparent black
          data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;
        }
        i += 4;
      }
    }
    octx.putImageData(img, 0, 0);

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    canvas.width = w * cellSize;
    canvas.height = h * cellSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  }

  // Build a single tile element for a rule
  function makeRuleTile(ruleNumber) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.rule = String(ruleNumber);

    const header = document.createElement("div");
    header.className = "tile-header";
    const title = document.createElement("div");
    title.className = "rule-number";
    title.textContent = `Rule ${ruleNumber}`;
    const bits = document.createElement("div");
    bits.className = "bits";
    bits.title = "Binary (MSB→LSB)";
    bits.textContent = toBinary8(ruleNumber);
    header.appendChild(title);
    header.appendChild(bits);

    const canvas = document.createElement("canvas");
    canvas.className = "tile-canvas";

    tile.appendChild(header);
    tile.appendChild(canvas);

    // Click to highlight
    tile.addEventListener("click", () => {
      tile.classList.toggle("highlight");
    });

    return { tile, canvas };
  }

  function clamp(n, min, max) { return Math.min(Math.max(n, min), max); }

  // Main orchestration
  function bootstrap() {
    const gridEl = document.getElementById("rules-grid");
    const widthInput = document.getElementById("width-input");
    const gensInput = document.getElementById("gens-input");
    const sizeInput = document.getElementById("cell-size-input");
    const rerenderBtn = document.getElementById("rerender-btn");

    function currentParams() {
      // width odd to keep a clean center seed
      let w = parseInt(widthInput.value, 10);
      if (isNaN(w)) w = 129;
      if (w % 2 === 0) w += 1;
      w = clamp(w, 33, 401);
      let g = parseInt(gensInput.value, 10);
      if (isNaN(g)) g = 96;
      g = clamp(g, 16, 256);
      let s = parseInt(sizeInput.value, 10);
      if (isNaN(s)) s = 1;
      s = clamp(s, 1, 3);
      return { w, g, s };
    }

    // Create tiles once
    const tiles = [];
    const frag = document.createDocumentFragment();
    for (let r = 0; r < 256; r++) {
      const { tile, canvas } = makeRuleTile(r);
      tiles.push({ rule: r, canvas });
      frag.appendChild(tile);
    }
    gridEl.appendChild(frag);

    function renderAll() {
      gridEl.setAttribute("aria-busy", "true");
      const { w, g, s } = currentParams();
      // Render in small batches to keep UI responsive
      let idx = 0;
      function step() {
        const chunk = 16; // tiles per frame
        const end = Math.min(idx + chunk, tiles.length);
        for (; idx < end; idx++) {
          const { rule, canvas } = tiles[idx];
          const grid = computeGrid(rule, w, g);
          renderGridToCanvas(grid, canvas, s);
        }
        if (idx < tiles.length) {
          requestAnimationFrame(step);
        } else {
          gridEl.setAttribute("aria-busy", "false");
        }
      }
      step();
    }

    rerenderBtn.addEventListener("click", renderAll);
    // First render
    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();

