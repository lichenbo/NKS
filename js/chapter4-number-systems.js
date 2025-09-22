(function (global) {
    'use strict';

    const CONSTANT_DIGITS = {
        pi: {
            label: 'π',
            digits: '314159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196442881097566593344612847564823378678316527120190914564856692346034861045432664821339360726024914127372458700660631558817488152092096282925409171536436789259036001133053054882046652138414695194151160943305727036575959195'
        },
        e: {
            label: 'e',
            digits: '271828182845904523536028747135266249775724709369995957496696762772407663035354759457138217852516642742746639193200305992181741359662904357290033429526059563073813232862794349076323382988075319525101901157383418793070215408914993488416750924476146066808226480016847741185374234544243710753907774499206955170276183860626133138458300075204493382656029760673711320070932870912744374704723069697720931014169283681902551510865'
        },
        sqrt2: {
            label: '√2',
            digits: '141421356237309504880168872420969807856967187537694807317667973799073247846210703885038753432764157273501384623091229702492483605585073721264412149709993583141322266592750559275579995050115278206057147010955997160597027453459686201472851741864088919860955232923048430871432145083976260362799525140798968725339654633180882964062061525835239505474575028775996172983557522033753185701135437460340849884716038689997069900481'
        }
    };

    const RECURRENCE_CONFIG = {
        fibonacci: {
            label: 'Fibonacci',
            maxTerms: 60,
            defaultTerms: 24
        },
        sylvester: {
            label: 'Sylvester',
            maxTerms: 18,
            defaultTerms: 10
        },
        nonlinear: {
            label: 'Nonlinear Modular',
            maxTerms: 60,
            defaultTerms: 30
        }
    };

    function digitLabel(digit) {
        return digit < 10 ? digit.toString() : String.fromCharCode(55 + digit);
    }

    function bigIntToDigits(value, base, width) {
        const digits = new Array(width).fill(0);
        const bigBase = BigInt(base);
        let index = width - 1;
        let working = value < 0n ? -value : value;
        while (working > 0n && index >= 0) {
            digits[index] = Number(working % bigBase);
            working /= bigBase;
            index--;
        }
        return digits;
    }

    function computeDigitCounts(matrix, base) {
        const counts = new Array(base).fill(0);
        for (const row of matrix) {
            for (const digit of row) {
                if (digit >= 0 && digit < base) {
                    counts[digit] += 1;
                }
            }
        }
        return counts;
    }

    function computeEntropy(counts, base) {
        const total = counts.reduce((a, b) => a + b, 0);
        if (!total) {
            return 0;
        }
        let entropy = 0;
        for (const count of counts) {
            if (count === 0) continue;
            const p = count / total;
            entropy -= p * Math.log2(p);
        }
        const maxEntropy = Math.log2(Math.min(base, counts.length));
        return entropy / (maxEntropy || 1);
    }

    function computeTransitionRate(matrix) {
        if (matrix.length < 2) return 0;
        const rows = matrix.length;
        const cols = matrix[0].length;
        let changes = 0;
        for (let y = 1; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (matrix[y][x] !== matrix[y - 1][x]) {
                    changes += 1;
                }
            }
        }
        return changes / ((rows - 1) * cols);
    }

    function distinctColumnPatterns(matrix) {
        const cols = matrix[0]?.length || 0;
        const signatures = new Set();
        for (let x = 0; x < cols; x++) {
            let signature = '';
            for (let y = 0; y < matrix.length; y++) {
                signature += matrix[y][x];
            }
            signatures.add(signature);
        }
        return signatures.size;
    }

    function getDigitColor(digit, base) {
        if (base === 2) {
            return digit === 1 ? '#ffd700' : '#111111';
        }
        const ratio = base > 1 ? digit / (base - 1) : 0;
        const hue = 40 + ratio * 220;
        const lightness = 25 + ratio * 40;
        return `hsl(${hue}, 70%, ${lightness}%)`;
    }

    function drawDigitMatrix(ctx, matrix, base) {
        if (!ctx) return;
        const rows = matrix.length;
        const cols = matrix[0]?.length || 0;
        ctx.save();
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (!rows || !cols) {
            ctx.restore();
            return;
        }
        const cellWidth = ctx.canvas.width / cols;
        const cellHeight = ctx.canvas.height / rows;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const digit = matrix[y][x];
                ctx.fillStyle = getDigitColor(digit, base);
                ctx.fillRect(x * cellWidth, y * cellHeight, Math.ceil(cellWidth) + 0.5, Math.ceil(cellHeight) + 0.5);
            }
        }
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellWidth, 0);
            ctx.lineTo(x * cellWidth, ctx.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellHeight);
            ctx.lineTo(ctx.canvas.width, y * cellHeight);
            ctx.stroke();
        }
        ctx.restore();
    }

    function updateLegend(container, base) {
        if (!container) return;
        const digitsToShow = Math.min(base, 16);
        const pieces = [];
        for (let digit = 0; digit < digitsToShow; digit++) {
            const color = getDigitColor(digit, base);
            pieces.push(`<span><span class="color-box" style="background:${color}"></span>${digitLabel(digit)}</span>`);
        }
        container.innerHTML = pieces.join('');
    }

    function formatEntropy(value) {
        if (!isFinite(value)) return '–';
        return `${value.toFixed(3)}`;
    }

    function formatPercentage(value) {
        return `${(value * 100).toFixed(1)}%`;
    }

    function formatLargeNumber(value) {
        const str = value.toString();
        if (str.length <= 12) return str;
        return `${str.slice(0, 6)}… (${str.length} digits)`;
    }

    function chiSquaredStatistic(counts, expected) {
        let chi = 0;
        for (let i = 0; i < counts.length; i++) {
            const diff = counts[i] - expected;
            chi += (diff * diff) / (expected || 1);
        }
        return chi;
    }

    function standardDeviation(values) {
        if (!values.length) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
        return Math.sqrt(variance);
    }

    class BinaryExpansionVisualizer {
        constructor(elements) {
            this.canvas = elements?.canvas || null;
            if (!this.canvas || !this.canvas.getContext) {
                this.enabled = false;
                return;
            }
            this.ctx = this.canvas.getContext('2d');
            this.sequenceSelect = elements.sequenceSelect || null;
            this.baseSlider = elements.baseSlider || null;
            this.baseDisplay = elements.baseDisplay || null;
            this.rowsSlider = elements.rowsSlider || null;
            this.rowsDisplay = elements.rowsDisplay || null;
            this.widthSlider = elements.widthSlider || null;
            this.widthDisplay = elements.widthDisplay || null;
            this.playBtn = elements.playBtn || null;
            this.stepBtn = elements.stepBtn || null;
            this.resetBtn = elements.resetBtn || null;
            this.legend = elements.legend || null;
            this.entropyDisplay = elements.entropyDisplay || null;
            this.transitionsDisplay = elements.transitionsDisplay || null;
            this.patternDisplay = elements.patternDisplay || null;
            this.isPlaying = false;
            this.timer = null;

            this.updateDisplays();
            this.attachListeners();
            this.render();
        }

        updateDisplays() {
            if (this.baseSlider && this.baseDisplay) this.baseDisplay.textContent = this.baseSlider.value;
            if (this.rowsSlider && this.rowsDisplay) this.rowsDisplay.textContent = this.rowsSlider.value;
            if (this.widthSlider && this.widthDisplay) this.widthDisplay.textContent = this.widthSlider.value;
        }

        attachListeners() {
            const scheduleRender = () => this.render();
            if (this.sequenceSelect) this.sequenceSelect.addEventListener('change', scheduleRender);
            if (this.baseSlider) {
                this.baseSlider.addEventListener('input', () => {
                    if (this.baseDisplay) this.baseDisplay.textContent = this.baseSlider.value;
                    scheduleRender();
                });
            }
            if (this.rowsSlider) {
                this.rowsSlider.addEventListener('input', () => {
                    if (this.rowsDisplay) this.rowsDisplay.textContent = this.rowsSlider.value;
                    if (!this.isPlaying) scheduleRender();
                });
            }
            if (this.widthSlider) {
                this.widthSlider.addEventListener('input', () => {
                    if (this.widthDisplay) this.widthDisplay.textContent = this.widthSlider.value;
                    scheduleRender();
                });
            }
            if (this.playBtn) this.playBtn.addEventListener('click', () => this.togglePlay());
            if (this.stepBtn) this.stepBtn.addEventListener('click', () => {
                this.stop();
                this.incrementRows();
            });
            if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.reset());
        }

        togglePlay() {
            if (this.isPlaying) {
                this.stop();
            } else {
                this.isPlaying = true;
                if (this.playBtn) this.playBtn.textContent = 'Pause';
                this.loop();
            }
        }

        stop() {
            this.isPlaying = false;
            if (this.playBtn) this.playBtn.textContent = 'Play';
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        }

        incrementRows() {
            if (!this.rowsSlider || !this.rowsDisplay) return;
            const maxRows = parseInt(this.rowsSlider.max, 10);
            let current = parseInt(this.rowsSlider.value, 10);
            if (current < maxRows) {
                current += 1;
                this.rowsSlider.value = current;
                this.rowsDisplay.textContent = current;
            }
            this.render();
        }

        loop() {
            if (!this.isPlaying) return;
            this.incrementRows();
            this.timer = setTimeout(() => this.loop(), 600);
        }

        reset() {
            this.stop();
            if (this.baseSlider) {
                this.baseSlider.value = '2';
                if (this.baseDisplay) this.baseDisplay.textContent = '2';
            }
            if (this.rowsSlider) {
                this.rowsSlider.value = '32';
                if (this.rowsDisplay) this.rowsDisplay.textContent = '32';
            }
            if (this.widthSlider) {
                this.widthSlider.value = '16';
                if (this.widthDisplay) this.widthDisplay.textContent = '16';
            }
            if (this.sequenceSelect) this.sequenceSelect.value = 'count';
            this.render();
        }

        generateMatrix() {
            const base = this.baseSlider ? parseInt(this.baseSlider.value, 10) : 2;
            const rows = this.rowsSlider ? parseInt(this.rowsSlider.value, 10) : 0;
            const width = this.widthSlider ? parseInt(this.widthSlider.value, 10) : 0;
            const sequence = this.sequenceSelect ? this.sequenceSelect.value : 'count';
            const matrix = [];
            for (let i = 0; i < rows; i++) {
                let value = 0n;
                switch (sequence) {
                    case 'count':
                        value = BigInt(i);
                        break;
                    case 'powers3':
                        value = 3n ** BigInt(i);
                        break;
                    case 'powers5':
                        value = 5n ** BigInt(i);
                        break;
                    default:
                        value = BigInt(i);
                        break;
                }
                matrix.push(bigIntToDigits(value, base, width));
            }
            return matrix;
        }

        render() {
            if (!this.ctx) return;
            const base = this.baseSlider ? parseInt(this.baseSlider.value, 10) : 2;
            const matrix = this.generateMatrix();
            drawDigitMatrix(this.ctx, matrix, base);
            updateLegend(this.legend, base);
            const counts = computeDigitCounts(matrix, base);
            const entropy = computeEntropy(counts, base);
            const transitions = computeTransitionRate(matrix);
            const patterns = distinctColumnPatterns(matrix);
            if (this.entropyDisplay) this.entropyDisplay.textContent = `${formatEntropy(entropy)} (of 1.000)`;
            if (this.transitionsDisplay) this.transitionsDisplay.textContent = formatPercentage(transitions);
            if (this.patternDisplay) this.patternDisplay.textContent = patterns.toString();
        }
    }

    class RecurrenceSequenceExplorer {
        constructor(elements) {
            this.canvas = elements?.canvas || null;
            if (!this.canvas || !this.canvas.getContext) {
                this.enabled = false;
                return;
            }
            this.ctx = this.canvas.getContext('2d');
            this.sequenceSelect = elements.sequenceSelect || null;
            this.baseSlider = elements.baseSlider || null;
            this.baseDisplay = elements.baseDisplay || null;
            this.termsSlider = elements.termsSlider || null;
            this.termsDisplay = elements.termsDisplay || null;
            this.widthSlider = elements.widthSlider || null;
            this.widthDisplay = elements.widthDisplay || null;
            this.playBtn = elements.playBtn || null;
            this.resetBtn = elements.resetBtn || null;
            this.legend = elements.legend || null;
            this.entropyDisplay = elements.entropyDisplay || null;
            this.growthDisplay = elements.growthDisplay || null;
            this.lastDisplay = elements.lastDisplay || null;
            this.isPlaying = false;
            this.timer = null;
            this.values = [];

            this.updateDisplays();
            this.attachListeners();
            this.applyConfig();
            this.render();
        }

        updateDisplays() {
            if (this.baseSlider && this.baseDisplay) this.baseDisplay.textContent = this.baseSlider.value;
            if (this.termsSlider && this.termsDisplay) this.termsDisplay.textContent = this.termsSlider.value;
            if (this.widthSlider && this.widthDisplay) this.widthDisplay.textContent = this.widthSlider.value;
        }

        attachListeners() {
            if (this.sequenceSelect) {
                this.sequenceSelect.addEventListener('change', () => {
                    this.applyConfig();
                    this.render();
                });
            }
            if (this.baseSlider) {
                this.baseSlider.addEventListener('input', () => {
                    if (this.baseDisplay) this.baseDisplay.textContent = this.baseSlider.value;
                    this.render();
                });
            }
            if (this.termsSlider) {
                this.termsSlider.addEventListener('input', () => {
                    if (this.termsDisplay) this.termsDisplay.textContent = this.termsSlider.value;
                    if (!this.isPlaying) this.render();
                });
            }
            if (this.widthSlider) {
                this.widthSlider.addEventListener('input', () => {
                    if (this.widthDisplay) this.widthDisplay.textContent = this.widthSlider.value;
                    this.render();
                });
            }
            if (this.playBtn) this.playBtn.addEventListener('click', () => this.togglePlay());
            if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.reset());
        }

        applyConfig() {
            if (!this.sequenceSelect || !this.termsSlider || !this.termsDisplay) return;
            const config = RECURRENCE_CONFIG[this.sequenceSelect.value] || RECURRENCE_CONFIG.fibonacci;
            this.termsSlider.max = config.maxTerms.toString();
            if (parseInt(this.termsSlider.value, 10) > config.maxTerms) {
                this.termsSlider.value = config.maxTerms.toString();
            }
            if (!this.isPlaying) {
                this.termsSlider.value = config.defaultTerms.toString();
            }
            this.termsDisplay.textContent = this.termsSlider.value;
        }

        togglePlay() {
            if (this.isPlaying) {
                this.stop();
            } else {
                this.isPlaying = true;
                if (this.playBtn) this.playBtn.textContent = 'Pause';
                this.loop();
            }
        }

        stop() {
            this.isPlaying = false;
            if (this.playBtn) this.playBtn.textContent = 'Play';
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        }

        loop() {
            if (!this.isPlaying || !this.termsSlider || !this.termsDisplay) return;
            const maxTerms = parseInt(this.termsSlider.max, 10);
            let current = parseInt(this.termsSlider.value, 10);
            if (current < maxTerms) {
                current += 1;
                this.termsSlider.value = current.toString();
                this.termsDisplay.textContent = this.termsSlider.value;
                this.render();
                this.timer = setTimeout(() => this.loop(), 700);
            } else {
                this.stop();
            }
        }

        reset() {
            this.stop();
            this.applyConfig();
            if (this.baseSlider) {
                this.baseSlider.value = '10';
                if (this.baseDisplay) this.baseDisplay.textContent = '10';
            }
            if (this.widthSlider) {
                this.widthSlider.value = '20';
                if (this.widthDisplay) this.widthDisplay.textContent = '20';
            }
            this.render();
        }

        generateValues() {
            const terms = this.termsSlider ? parseInt(this.termsSlider.value, 10) : 0;
            const type = this.sequenceSelect ? this.sequenceSelect.value : 'fibonacci';
            const values = [];
            if (type === 'fibonacci') {
                values.push(0n, 1n);
                for (let i = 2; i < terms; i++) {
                    values.push(values[i - 1] + values[i - 2]);
                }
            } else if (type === 'sylvester') {
                values.push(2n);
                for (let i = 1; i < terms; i++) {
                    const previousProduct = values.slice(0, i).reduce((acc, value) => acc * value, 1n);
                    values.push(previousProduct + 1n);
                }
            } else {
                values.push(1n, 1n);
                for (let i = 2; i < terms; i++) {
                    const next = (values[i - 1] * values[i - 2] + BigInt(i * i)) % 997n;
                    values.push(next);
                }
            }
            return values.slice(0, terms);
        }

        computeGrowth(values) {
            if (values.length < 2) return '–';
            const last = values[values.length - 1];
            const prev = values[values.length - 2];
            if (prev === 0n) return '–';
            const ratio = Number(last) / Number(prev);
            if (!Number.isFinite(ratio)) return '–';
            return ratio.toFixed(3);
        }

        draw() {
            if (!this.ctx) return;
            const base = this.baseSlider ? parseInt(this.baseSlider.value, 10) : 10;
            const width = this.widthSlider ? parseInt(this.widthSlider.value, 10) : 10;
            const matrix = this.values.map(value => bigIntToDigits(value, base, width));
            drawDigitMatrix(this.ctx, matrix, base);
            updateLegend(this.legend, base);
        }

        updateStats() {
            if (!this.values.length) {
                if (this.entropyDisplay) this.entropyDisplay.textContent = '–';
                if (this.growthDisplay) this.growthDisplay.textContent = '–';
                if (this.lastDisplay) this.lastDisplay.textContent = '–';
                return;
            }
            const base = this.baseSlider ? parseInt(this.baseSlider.value, 10) : 10;
            const width = this.widthSlider ? parseInt(this.widthSlider.value, 10) : 10;
            const matrix = this.values.map(value => bigIntToDigits(value, base, width));
            const counts = computeDigitCounts(matrix, base);
            const entropy = computeEntropy(counts, base);
            if (this.entropyDisplay) this.entropyDisplay.textContent = `${formatEntropy(entropy)} (of 1.000)`;
            if (this.growthDisplay) this.growthDisplay.textContent = this.computeGrowth(this.values);
            if (this.lastDisplay) this.lastDisplay.textContent = formatLargeNumber(this.values[this.values.length - 1]);
        }

        render() {
            this.values = this.generateValues();
            this.draw();
            this.updateStats();
        }
    }

    class PrimeSieveAnimator {
        constructor(elements) {
            this.canvas = elements?.canvas || null;
            if (!this.canvas || !this.canvas.getContext) {
                this.enabled = false;
                return;
            }
            this.ctx = this.canvas.getContext('2d');
            this.limitSlider = elements.limitSlider || null;
            this.limitDisplay = elements.limitDisplay || null;
            this.playBtn = elements.playBtn || null;
            this.stepBtn = elements.stepBtn || null;
            this.resetBtn = elements.resetBtn || null;
            this.countDisplay = elements.countDisplay || null;
            this.densityDisplay = elements.densityDisplay || null;
            this.latestDisplay = elements.latestDisplay || null;
            this.gapDisplay = elements.gapDisplay || null;
            this.timer = null;
            this.isRunning = false;

            this.reset();
            this.attachListeners();
        }

        attachListeners() {
            if (this.limitSlider) {
                this.limitSlider.addEventListener('input', () => {
                    if (this.limitDisplay) this.limitDisplay.textContent = this.limitSlider.value;
                    this.reset();
                });
            }
            if (this.playBtn) this.playBtn.addEventListener('click', () => this.togglePlay());
            if (this.stepBtn) this.stepBtn.addEventListener('click', () => {
                this.stop();
                this.step();
                this.draw();
                this.updateStats();
            });
            if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.reset());
        }

        togglePlay() {
            if (this.isRunning) {
                this.stop();
            } else {
                this.isRunning = true;
                if (this.playBtn) this.playBtn.textContent = 'Pause';
                this.loop();
            }
        }

        stop() {
            this.isRunning = false;
            if (this.playBtn) this.playBtn.textContent = 'Play';
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        }

        reset() {
            this.stop();
            this.limit = this.limitSlider ? parseInt(this.limitSlider.value, 10) : 120;
            this.numbers = [];
            for (let value = 2; value <= this.limit; value++) {
                this.numbers.push({ value, state: 'unknown' });
            }
            this.primes = [];
            this.currentPrimeIndex = null;
            this.nextMultiple = null;
            this.complete = false;
            if (this.limitDisplay && this.limitSlider) this.limitDisplay.textContent = this.limitSlider.value;
            this.draw();
            this.updateStats();
        }

        loop() {
            if (!this.isRunning) return;
            const progressed = this.step();
            this.draw();
            this.updateStats();
            if (!progressed || this.complete) {
                this.stop();
                return;
            }
            this.timer = setTimeout(() => this.loop(), 320);
        }

        step() {
            if (this.complete) return false;
            if (this.currentPrimeIndex === null) {
                this.currentPrimeIndex = this.findNextPrimeIndex(-1);
                if (this.currentPrimeIndex === null) {
                    this.complete = true;
                    return false;
                }
                this.promotePrime(this.currentPrimeIndex);
            }
            if (this.nextMultiple === null) {
                const primeValue = this.numbers[this.currentPrimeIndex].value;
                const start = primeValue * primeValue;
                this.nextMultiple = start <= this.limit ? start : null;
                if (this.nextMultiple === null) {
                    this.currentPrimeIndex = this.findNextPrimeIndex(this.currentPrimeIndex);
                    if (this.currentPrimeIndex === null) {
                        this.complete = true;
                        return false;
                    }
                    this.promotePrime(this.currentPrimeIndex);
                    return true;
                }
            }
            const primeValue = this.numbers[this.currentPrimeIndex].value;
            while (this.nextMultiple !== null && this.nextMultiple <= this.limit) {
                const index = this.nextMultiple - 2;
                if (this.numbers[index].state === 'unknown') {
                    this.numbers[index].state = 'composite';
                    this.nextMultiple += primeValue;
                    return true;
                }
                this.nextMultiple += primeValue;
            }
            this.nextMultiple = null;
            const nextIndex = this.findNextPrimeIndex(this.currentPrimeIndex);
            if (nextIndex === null) {
                this.complete = true;
                return false;
            }
            this.promotePrime(nextIndex);
            return true;
        }

        promotePrime(index) {
            const entry = this.numbers[index];
            if (entry.state !== 'prime') {
                entry.state = 'prime';
                this.primes.push(entry.value);
            }
            this.currentPrimeIndex = index;
            this.nextMultiple = null;
        }

        findNextPrimeIndex(startIndex) {
            for (let i = startIndex + 1; i < this.numbers.length; i++) {
                if (this.numbers[i].state === 'unknown') {
                    return i;
                }
            }
            return null;
        }

        draw() {
            if (!this.ctx) return;
            const ctx = this.ctx;
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, width, height);
            const count = this.numbers.length;
            if (!count) return;
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);
            const cellWidth = width / cols;
            const cellHeight = height / rows;
            for (let i = 0; i < count; i++) {
                const { value, state } = this.numbers[i];
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = col * cellWidth;
                const y = row * cellHeight;
                let fill = '#3a3a3a';
                if (state === 'prime') fill = '#ffd700';
                if (state === 'composite') fill = '#1b1b1b';
                if (this.currentPrimeIndex === i) fill = '#ff8c00';
                ctx.fillStyle = fill;
                ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
                ctx.fillStyle = '#aaaaaa';
                ctx.font = `${Math.max(10, Math.floor(cellHeight * 0.32))}px 'Inter', sans-serif`;
                ctx.globalAlpha = 0.6;
                ctx.fillText(value.toString(), x + 4, y + cellHeight * 0.6);
                ctx.globalAlpha = 1;
            }
        }

        updateStats() {
            const count = this.primes.length;
            if (this.countDisplay) this.countDisplay.textContent = count.toString();
            const density = count / Math.max(1, this.numbers.length);
            if (this.densityDisplay) this.densityDisplay.textContent = formatPercentage(density);
            const latest = this.primes[count - 1];
            if (this.latestDisplay) this.latestDisplay.textContent = latest ? latest.toString() : '–';
            if (count >= 2) {
                const gap = this.primes[count - 1] - this.primes[count - 2];
                if (this.gapDisplay) this.gapDisplay.textContent = gap.toString();
            } else if (this.gapDisplay) {
                this.gapDisplay.textContent = '–';
            }
        }
    }

    class ConstantRandomnessLab {
        constructor(elements) {
            this.constantSelect = elements?.constantSelect || null;
            this.startSlider = elements?.startSlider || null;
            this.startDisplay = elements?.startDisplay || null;
            this.countSlider = elements?.countSlider || null;
            this.countDisplay = elements?.countDisplay || null;
            this.barContainer = elements?.barContainer || null;
            this.streamContainer = elements?.streamContainer || null;
            this.entropyDisplay = elements?.entropyDisplay || null;
            this.chiDisplay = elements?.chiDisplay || null;
            this.deviationDisplay = elements?.deviationDisplay || null;
            if (!this.constantSelect) {
                return;
            }
            this.attachListeners();
            this.render();
        }

        attachListeners() {
            if (this.constantSelect) this.constantSelect.addEventListener('change', () => this.render());
            if (this.startSlider) {
                this.startSlider.addEventListener('input', () => {
                    if (this.startDisplay) this.startDisplay.textContent = this.startSlider.value;
                    this.render();
                });
            }
            if (this.countSlider) {
                this.countSlider.addEventListener('input', () => {
                    if (this.countDisplay) this.countDisplay.textContent = this.countSlider.value;
                    this.render();
                });
            }
        }

        sampleDigits() {
            const constant = this.constantSelect ? this.constantSelect.value : 'pi';
            const data = CONSTANT_DIGITS[constant];
            const start = this.startSlider ? parseInt(this.startSlider.value, 10) : 0;
            const count = this.countSlider ? parseInt(this.countSlider.value, 10) : 0;
            const digits = data?.digits?.slice(start, start + count) || '';
            return digits.split('').map(d => parseInt(d, 10));
        }

        renderBars(counts, total) {
            if (!this.barContainer) return;
            const pieces = [];
            for (let digit = 0; digit < counts.length; digit++) {
                const frequency = counts[digit] / (total || 1);
                const width = Math.round(frequency * 100);
                pieces.push(`
                    <div class="bar">
                        <div class="bar-label">Digit ${digit}</div>
                        <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
                        <div class="bar-label" style="font-size:0.8rem; opacity:0.65;">${(frequency * 100).toFixed(2)}%</div>
                    </div>
                `);
            }
            this.barContainer.innerHTML = pieces.join('');
        }

        renderStream(digits) {
            if (!this.streamContainer) return;
            const chunked = [];
            for (let i = 0; i < digits.length; i += 4) {
                chunked.push(digits.slice(i, i + 4).join(''));
            }
            this.streamContainer.textContent = chunked.join(' ');
        }

        render() {
            const digits = this.sampleDigits();
            if (!digits.length) {
                if (this.barContainer) this.barContainer.innerHTML = '';
                if (this.streamContainer) this.streamContainer.textContent = '';
                if (this.entropyDisplay) this.entropyDisplay.textContent = '–';
                if (this.chiDisplay) this.chiDisplay.textContent = '–';
                if (this.deviationDisplay) this.deviationDisplay.textContent = '–';
                return;
            }
            const counts = new Array(10).fill(0);
            for (const digit of digits) {
                if (!Number.isNaN(digit)) {
                    counts[digit] += 1;
                }
            }
            const entropy = computeEntropy(counts, 10);
            const expected = digits.length / 10;
            const chi = chiSquaredStatistic(counts, expected);
            const maxDeviation = counts.reduce((max, count) => Math.max(max, Math.abs(count - expected)), 0);
            this.renderBars(counts, digits.length);
            this.renderStream(digits);
            if (this.entropyDisplay) this.entropyDisplay.textContent = `${formatEntropy(entropy)} (of 1.000)`;
            if (this.chiDisplay) this.chiDisplay.textContent = chi.toFixed(2);
            if (this.deviationDisplay) this.deviationDisplay.textContent = maxDeviation.toFixed(1);
        }
    }

    class ChaoticLogisticMapLab {
        constructor(elements) {
            this.rSlider = elements?.rSlider || null;
            this.rDisplay = elements?.rDisplay || null;
            this.x0Input = elements?.x0Input || null;
            this.stepsSlider = elements?.stepsSlider || null;
            this.stepsDisplay = elements?.stepsDisplay || null;
            this.timeCanvas = elements?.timeCanvas || null;
            this.digitCanvas = elements?.digitCanvas || null;
            this.lyapunovDisplay = elements?.lyapunovDisplay || null;
            this.spreadDisplay = elements?.spreadDisplay || null;
            this.entropyDisplay = elements?.entropyDisplay || null;
            this.runBtn = elements?.runBtn || null;
            this.timeCtx = this.timeCanvas?.getContext ? this.timeCanvas.getContext('2d') : null;
            this.digitCtx = this.digitCanvas?.getContext ? this.digitCanvas.getContext('2d') : null;

            if (!this.rSlider || !this.timeCtx || !this.digitCtx) {
                return;
            }

            this.attachListeners();
            this.render();
        }

        attachListeners() {
            if (this.rSlider) {
                this.rSlider.addEventListener('input', () => {
                    if (this.rDisplay) this.rDisplay.textContent = parseFloat(this.rSlider.value).toFixed(2);
                    this.render();
                });
            }
            if (this.stepsSlider) {
                this.stepsSlider.addEventListener('input', () => {
                    if (this.stepsDisplay) this.stepsDisplay.textContent = this.stepsSlider.value;
                    this.render();
                });
            }
            if (this.x0Input) this.x0Input.addEventListener('change', () => this.render());
            if (this.runBtn) this.runBtn.addEventListener('click', () => this.render());
        }

        iterate() {
            let x = this.x0Input ? parseFloat(this.x0Input.value) : 0.215;
            if (!Number.isFinite(x) || x <= 0 || x >= 1) {
                x = 0.215;
                if (this.x0Input) this.x0Input.value = '0.215';
            }
            const r = this.rSlider ? parseFloat(this.rSlider.value) : 3.7;
            const steps = this.stepsSlider ? parseInt(this.stepsSlider.value, 10) : 120;
            const values = [];
            for (let i = 0; i < steps; i++) {
                x = r * x * (1 - x);
                values.push(x);
            }
            return values;
        }

        drawTimeSeries(values) {
            const ctx = this.timeCtx;
            if (!ctx) return;
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, width, height);
            if (!values.length) return;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            values.forEach((value, index) => {
                const x = (index / (values.length - 1 || 1)) * width;
                const y = height - value * height;
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.fillStyle = '#777';
            ctx.font = "12px 'Inter', sans-serif";
            ctx.fillText('0', 6, height - 6);
            ctx.fillText('1', 6, 14);
        }

        drawDigitTiles(values) {
            const matrix = values.map(value => {
                const digits = Math.abs(value).toFixed(16).split('.')[1] || '';
                const slice = digits.slice(0, 16).padEnd(16, '0');
                return slice.split('').map(ch => parseInt(ch, 10));
            });
            drawDigitMatrix(this.digitCtx, matrix, 10);
        }

        render() {
            if (this.rDisplay && this.rSlider) this.rDisplay.textContent = parseFloat(this.rSlider.value).toFixed(2);
            if (this.stepsDisplay && this.stepsSlider) this.stepsDisplay.textContent = this.stepsSlider.value;
            const values = this.iterate();
            this.drawTimeSeries(values);
            this.drawDigitTiles(values);
            if (!values.length) {
                if (this.lyapunovDisplay) this.lyapunovDisplay.textContent = '–';
                if (this.spreadDisplay) this.spreadDisplay.textContent = '–';
                if (this.entropyDisplay) this.entropyDisplay.textContent = '–';
                return;
            }
            const r = this.rSlider ? parseFloat(this.rSlider.value) : 0;
            let sumLyapunov = 0;
            const digitsMatrix = values.map(value => {
                const digits = Math.abs(value).toFixed(16).split('.')[1] || '';
                const slice = digits.slice(0, 16).padEnd(16, '0');
                return slice.split('').map(ch => parseInt(ch, 10));
            });
            for (const value of values) {
                const term = Math.abs(r * (1 - 2 * value));
                if (term > 0) {
                    sumLyapunov += Math.log(Math.abs(term));
                }
            }
            const lyapunov = sumLyapunov / values.length;
            if (this.lyapunovDisplay) this.lyapunovDisplay.textContent = lyapunov.toFixed(3);
            const spread = standardDeviation(values);
            if (this.spreadDisplay) this.spreadDisplay.textContent = spread.toFixed(3);
            const counts = computeDigitCounts(digitsMatrix, 10);
            const entropy = computeEntropy(counts, 10);
            if (this.entropyDisplay) this.entropyDisplay.textContent = `${formatEntropy(entropy)} (of 1.000)`;
        }
    }

    global.Chapter4Demos = {
        BinaryExpansionVisualizer,
        RecurrenceSequenceExplorer,
        PrimeSieveAnimator,
        ConstantRandomnessLab,
        ChaoticLogisticMapLab,
        utils: {
            bigIntToDigits,
            drawDigitMatrix,
            computeDigitCounts,
            computeEntropy,
            computeTransitionRate,
            distinctColumnPatterns,
            formatEntropy,
            formatLargeNumber,
            formatPercentage
        }
    };
})(typeof window !== 'undefined' ? window : globalThis);
