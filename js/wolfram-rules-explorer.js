'use strict';

// Elementary CA (Wolfram) Rules Explorer
// Extracted from wolfram-rules-explorer.html for maintainability

const RULE_BITS = 8;                 // number of neighborhood patterns (2^3)
const RULE_MAX = (1 << RULE_BITS) - 1; // 255

class WolframRuleExplorer {
  constructor() {
    // Cache DOM nodes
    this.canvas = document.getElementById('cellular-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ruleGridEl = document.getElementById('rule-grid');
    this.presetHostEl = document.getElementById('preset-rules');
    this.els = {
      currentRule: document.getElementById('current-rule'),
      analysisText: document.getElementById('analysis-text'),
      evolutionStatus: document.getElementById('evolution-status'),
      startBtn: document.getElementById('start-btn'),
      currentGeneration: document.getElementById('current-generation'),
      activeCells: document.getElementById('active-cells'),
      patternType: document.getElementById('pattern-type')
    };

    // Runtime state
    this.width = 800;
    this.maxGenerations = 300;
    this.cellSize = 1;
    this.currentGeneration = 0;
    this.speedLevel = 5;
    this.speed = this.calculateDelay(this.speedLevel);
    this.isRunning = false;
    this.animationId = null;

    // Default rule: Rule-30
    this.ruleNumber = 30;
    this.rule = this.toBitArray(this.ruleNumber);

    // Grid state
    this.grid = [];

    // Saved rules
    this.savedRules = new Set();
    this.savedRulesContainer = document.getElementById('saved-rules');
    this.loadSavedRulesFromStorage();

    // Presets collection
    this.presets = [
      { n: 30,  desc: '随机复杂' },
      { n: 90,  desc: '分形图案' },
      { n: 110, desc: '图灵完备' },
      { n: 150, desc: '对称分形' },
      { n: 184, desc: '交通流' },
      { n: 250, desc: '棋盘模式' },
      { n: 254, desc: '填充模式' },
      { n: 126, desc: '混沌边缘' }
    ];

    this.init();
  }

  /* ---------- helpers ---------- */

  clamp(n, min, max) { return Math.min(Math.max(n, min), max); }

  // Converts 0-255 rule number into 8-element bit array (LSB-first)
  toBitArray(num) {
    const arr = new Array(RULE_BITS);
    for (let i = 0; i < RULE_BITS; i++) arr[i] = (num >> i) & 1;
    return arr;
  }

  // Converts 8-element bit array back to rule number
  fromBitArray(bits) { return bits.reduce((acc, bit, idx) => acc | (bit << idx), 0); }

  // 1-10 level → delay (ms)
  calculateDelay(level) { return Math.max(10, 510 - level * 50); }

  // Keep slider input and label in sync
  updateSlider(inputId, labelId, value) {
    const input = document.getElementById(inputId);
    if (input) input.value = value;
    const label = document.getElementById(labelId);
    if (label) label.textContent = value;
  }

  /* ---------- initialisation ---------- */

  init() {
    this.setupCanvas();
    this.buildRuleGrid();
    this.buildPresetRules();
    this.setupEventListeners();
    this.reflectUI();
    this.updateSavedRulesUI();
    this.resetGrid();
  }

  setupCanvas() {
    this.canvas.width = this.width * this.cellSize;
    this.canvas.height = this.maxGenerations * this.cellSize;
    this.ctx.imageSmoothingEnabled = false;
  }

  /* ---------- UI / Events ---------- */

  setupEventListeners() {
    // Toggle individual rule outputs (delegated)
    this.ruleGridEl.addEventListener('click', (e) => {
      const target = e.target.closest('.rule-output');
      if (target) this.toggleRuleOutput(target);
    });

    // Preset rules (delegated)
    this.presetHostEl.addEventListener('click', (e) => {
      const card = e.target.closest('.preset-rule');
      if (card) this.loadPresetRule(card);
    });

    // Main control buttons
    [
      ['start-btn', () => this.start()],
      ['stop-btn', () => this.stop()],
      ['reset-btn', () => this.reset()],
      ['random-rule-btn', () => this.generateRandomRule()],
      ['add-rule-btn', () => this.saveCurrentRule()]
    ].forEach(([id, handler]) => document.getElementById(id).addEventListener('click', handler));

    // Sliders
    [
      ['canvas-width', e => this.setCanvasParam('width', +e.target.value)],
      ['generations', e => this.setCanvasParam('generations', +e.target.value)],
      ['speed', e => this.setSpeed(+e.target.value)]
    ].forEach(([id, handler]) => document.getElementById(id).addEventListener('input', handler));

    // Rule slider with validation
    document.getElementById('rule-slider')
      .addEventListener('input', e => {
        const val = this.clamp(+e.target.value, 0, RULE_MAX);
        this.setRule(val);
      });
  }

  buildRuleGrid() {
    const patterns = ['111','110','101','100','011','010','001','000'];
    const frag = document.createDocumentFragment();
    patterns.forEach(pStr => {
      const cell = document.createElement('div');
      cell.className = 'rule-cell';
      const pat = document.createElement('div');
      pat.className = 'rule-pattern';
      pat.textContent = pStr;
      const out = document.createElement('div');
      out.className = 'rule-output';
      out.dataset.pattern = pStr;
      out.textContent = '0';
      cell.appendChild(pat);
      cell.appendChild(out);
      frag.appendChild(cell);
    });
    this.ruleGridEl.appendChild(frag);
  }

  buildPresetRules() {
    const frag = document.createDocumentFragment();
    this.presets.forEach(pr => {
      const card = document.createElement('div');
      card.className = 'preset-rule';
      card.dataset.rule = pr.n;
      if (pr.n === this.ruleNumber) card.classList.add('active');
      const num = document.createElement('div');
      num.className = 'preset-number';
      num.textContent = `规则 ${pr.n}`;
      const desc = document.createElement('div');
      desc.className = 'preset-description';
      desc.textContent = pr.desc;
      card.appendChild(num);
      card.appendChild(desc);
      frag.appendChild(card);
    });
    this.presetHostEl.appendChild(frag);
  }

  toggleRuleOutput(el) {
    const nowActive = !el.classList.contains('active');
    el.classList.toggle('active', nowActive);
    el.textContent = nowActive ? '1' : '0';
    this.updateRuleFromUI();
    this.reflectUI();
  }

  updateRuleFromUI() {
    this.rule = new Array(RULE_BITS).fill(0);
    document.querySelectorAll('.rule-output').forEach(output => {
      const patternVal = parseInt(output.dataset.pattern, 2);
      this.rule[patternVal] = output.classList.contains('active') ? 1 : 0;
    });
    this.ruleNumber = this.fromBitArray(this.rule);
  }

  /* ---------- rule setters ---------- */

  loadPresetRule(el) { this.setRule(+el.dataset.rule); }

  setRule(ruleNumber) {
    this.ruleNumber = this.clamp(ruleNumber, 0, RULE_MAX);
    this.rule = this.toBitArray(this.ruleNumber);
    this.reflectUI();
  }

  reflectUI() {
    // Rule number and slider value
    this.els.currentRule.textContent = this.ruleNumber;
    this.updateSlider('rule-slider', 'rule-slider-value', this.ruleNumber);

    // Toggle grid bits to match rule
    document.querySelectorAll('.rule-output').forEach(output => {
      const patternVal = parseInt(output.dataset.pattern, 2);
      const active = this.rule[patternVal] === 1;
      output.classList.toggle('active', active);
      output.textContent = active ? '1' : '0';
    });

    // Analysis text
    const analyses = {
      30:  '规则30：产生看似随机的复杂图案，是Wolfram最重要的发现之一。尽管规则极其简单，但行为展现出真正的随机性特征。',
      90:  '规则90：生成经典的谢尔宾斯基三角形分形图案。具有自相似的嵌套结构，展现数学之美。',
      110: '规则110：被证明是图灵完备的，能够进行通用计算。产生复杂的局部结构和相互作用。',
      150: '规则150：生成对称的分形图案，与规则90相似但更加复杂。展现出左右对称的嵌套结构。',
      184: '规则184：模拟交通流动力学。粒子向右移动，展现出集体行为和流体特性。',
      250: '规则250：产生简单的重复图案，类似棋盘。展现周期性行为。',
      254: '规则254：产生均匀填充的简单图案。几乎所有细胞都变为活跃状态。',
      126: '规则126：处于混沌边缘，产生复杂但有一定规律的图案。'
    };
    const text = analyses[this.ruleNumber] || `规则${this.ruleNumber}：自定义规则。观察其产生的图案特征，分析其复杂性和规律性。`;
    this.els.analysisText.textContent = text;

    // Update active states for all rule cards
    [this.savedRulesContainer, this.presetHostEl].forEach(container => {
      container.querySelectorAll('[data-rule]').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.rule) === this.ruleNumber);
      });
    });

    // Stats
    this.updateStats();
  }

  /* ---------- misc UI actions ---------- */

  generateRandomRule() { this.setRule(Math.floor(Math.random() * (RULE_MAX + 1))); }

  /* ---------- saved rules ---------- */

  loadSavedRulesFromStorage() {
    try {
      const savedData = localStorage.getItem('wolfram-saved-rules');
      if (savedData) {
        const rulesArray = JSON.parse(savedData);
        this.savedRules = new Set(rulesArray);
      }
    } catch (error) {
      console.warn('Failed to load saved rules from localStorage:', error);
      this.savedRules = new Set();
    }
  }

  saveSavedRulesToStorage() {
    try {
      const rulesArray = Array.from(this.savedRules);
      localStorage.setItem('wolfram-saved-rules', JSON.stringify(rulesArray));
    } catch (error) {
      console.warn('Failed to save rules to localStorage:', error);
    }
  }

  saveCurrentRule() {
    if (this.savedRules.has(this.ruleNumber)) return; // already saved
    this.savedRules.add(this.ruleNumber);
    this.saveSavedRulesToStorage();
    this.updateSavedRulesUI();
  }

  removeSavedRule(ruleNumber) {
    this.savedRules.delete(ruleNumber);
    this.saveSavedRulesToStorage();
    this.updateSavedRulesUI();
  }

  updateSavedRulesUI() {
    this.savedRulesContainer.innerHTML = '';
    this.savedRulesContainer.classList.toggle('empty', this.savedRules.size === 0);

    if (this.savedRules.size > 0) {
      const sortedRules = Array.from(this.savedRules).sort((a, b) => a - b);
      this.savedRulesContainer.innerHTML = sortedRules.map(ruleNumber =>
        `<div class="saved-rule" data-rule="${ruleNumber}">
          <span class="saved-rule-label">规则 ${ruleNumber}</span>
          <button class="saved-rule-remove" title="移除此规则">×</button>
        </div>`
      ).join('');

      // Event delegation
      this.savedRulesContainer.onclick = (e) => {
        const rule = e.target.closest('.saved-rule');
        if (!rule) return;
        if (e.target.classList.contains('saved-rule-remove')) {
          e.stopPropagation();
          this.removeSavedRule(+rule.dataset.rule);
        } else {
          this.setRule(+rule.dataset.rule);
        }
      };
    }
  }

  /* ---------- user adjustable params ---------- */

  setCanvasParam(param, value) {
    if (param === 'width') {
      this.width = value;
      this.updateSlider('canvas-width', 'canvas-width-value', value);
    } else if (param === 'generations') {
      this.maxGenerations = value;
      this.updateSlider('generations', 'generations-value', value);
    }
    this.setupCanvas();
    this.resetGrid();
  }

  setSpeed(level) {
    this.speedLevel = level;
    this.speed = this.calculateDelay(level);
    this.updateSlider('speed', 'speed-value', level);
  }

  /* ---------- simulation core ---------- */

  resetGrid() {
    this.currentGeneration = 0;
    this.grid = Array.from({ length: this.maxGenerations }, () => new Array(this.width).fill(0));
    this.grid[0][Math.floor(this.width / 2)] = 1;
    this.updateStats();
    this.paintAll();
  }

  applyRule(left, centre, right) {
    const pattern = (left << 2) | (centre << 1) | right;
    return this.rule[pattern];
  }

  evolve() {
    if (this.currentGeneration >= this.maxGenerations - 1) { this.stop(); return; }
    const y = this.currentGeneration;
    const ny = y + 1;
    for (let x = 0; x < this.width; x++) {
      const left = this.grid[y][(x - 1 + this.width) % this.width];
      const centre = this.grid[y][x];
      const right = this.grid[y][(x + 1) % this.width];
      this.grid[ny][x] = this.applyRule(left, centre, right);
    }
    this.currentGeneration++;
    this.paintRow(this.currentGeneration);
    this.updateStats();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.els.evolutionStatus.textContent = '运行中';
    this.els.startBtn.classList.add('generating');
    const step = () => {
      if (!this.isRunning) return;
      this.evolve();
      if (this.currentGeneration < this.maxGenerations - 1) {
        this.animationId = setTimeout(step, this.speed);
      } else { this.stop(); }
    };
    step();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) { clearTimeout(this.animationId); this.animationId = null; }
    this.els.evolutionStatus.textContent = '已停止';
    this.els.startBtn.classList.remove('generating');
  }

  reset() {
    this.stop();
    this.resetGrid();
    this.els.evolutionStatus.textContent = '就绪';
  }

  paintAll() {
    const s = this.cellSize;
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#ffd700';
    for (let y = 0; y <= this.currentGeneration; y++) {
      for (let x = 0; x < this.width; x++) if (this.grid[y][x] === 1) this.ctx.fillRect(x * s, y * s, s, s);
    }
  }

  paintRow(y) {
    const s = this.cellSize;
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, y * s, this.canvas.width, s);
    this.ctx.fillStyle = '#ffd700';
    for (let x = 0; x < this.width; x++) if (this.grid[y][x] === 1) this.ctx.fillRect(x * s, y * s, s, s);
  }

  countActiveInRow(y) {
    if (y < 0 || y >= this.maxGenerations || !this.grid[y]) return 0;
    return this.grid[y].reduce((a, c) => a + c, 0);
  }

  updateStats() {
    this.els.currentGeneration.textContent = this.currentGeneration;
    const active = this.countActiveInRow(this.currentGeneration);
    this.els.activeCells.textContent = active;
    const patterns = {30:'随机复杂', 90:'分形', 110:'复杂结构', 150:'分形', 184:'粒子', 250:'简单重复', 254:'简单重复'};
    const type = patterns[this.ruleNumber] || (active === 0 ? '消亡' : active > this.width * 0.7 ? '填充' : '复杂');
    this.els.patternType.textContent = type;
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  const explorer = new WolframRuleExplorer();
  // Expose for debugging if needed
  window.WolframRuleExplorer = WolframRuleExplorer;
  window._wolframExplorer = explorer;
});

