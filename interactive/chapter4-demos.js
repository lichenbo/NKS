(() => {
    'use strict';

    function initializeChapter4Demos() {
        const api = window.Chapter4Demos;
        if (!api) {
            console.warn('Chapter4Demos module not found');
            return;
        }

        const {
            BinaryExpansionVisualizer,
            RecurrenceSequenceExplorer,
            PrimeSieveAnimator,
            ConstantRandomnessLab,
            ChaoticLogisticMapLab
        } = api;

        new BinaryExpansionVisualizer({
            canvas: document.getElementById('binary-canvas'),
            sequenceSelect: document.getElementById('binary-sequence'),
            baseSlider: document.getElementById('binary-base'),
            baseDisplay: document.getElementById('binary-base-display'),
            rowsSlider: document.getElementById('binary-rows'),
            rowsDisplay: document.getElementById('binary-rows-display'),
            widthSlider: document.getElementById('binary-width'),
            widthDisplay: document.getElementById('binary-width-display'),
            playBtn: document.getElementById('binary-play'),
            stepBtn: document.getElementById('binary-step'),
            resetBtn: document.getElementById('binary-reset'),
            legend: document.getElementById('binary-legend'),
            entropyDisplay: document.getElementById('binary-entropy'),
            transitionsDisplay: document.getElementById('binary-transitions'),
            patternDisplay: document.getElementById('binary-patterns')
        });

        new RecurrenceSequenceExplorer({
            canvas: document.getElementById('recurrence-canvas'),
            sequenceSelect: document.getElementById('recurrence-sequence'),
            baseSlider: document.getElementById('recurrence-base'),
            baseDisplay: document.getElementById('recurrence-base-display'),
            termsSlider: document.getElementById('recurrence-terms'),
            termsDisplay: document.getElementById('recurrence-terms-display'),
            widthSlider: document.getElementById('recurrence-width'),
            widthDisplay: document.getElementById('recurrence-width-display'),
            playBtn: document.getElementById('recurrence-play'),
            resetBtn: document.getElementById('recurrence-reset'),
            legend: document.getElementById('recurrence-legend'),
            entropyDisplay: document.getElementById('recurrence-entropy'),
            growthDisplay: document.getElementById('recurrence-growth'),
            lastDisplay: document.getElementById('recurrence-last')
        });

        new PrimeSieveAnimator({
            canvas: document.getElementById('sieve-canvas'),
            limitSlider: document.getElementById('sieve-limit'),
            limitDisplay: document.getElementById('sieve-limit-display'),
            playBtn: document.getElementById('sieve-play'),
            stepBtn: document.getElementById('sieve-step'),
            resetBtn: document.getElementById('sieve-reset'),
            countDisplay: document.getElementById('sieve-count'),
            densityDisplay: document.getElementById('sieve-density'),
            latestDisplay: document.getElementById('sieve-latest'),
            gapDisplay: document.getElementById('sieve-gap')
        });

        new ConstantRandomnessLab({
            constantSelect: document.getElementById('constants-constant'),
            startSlider: document.getElementById('constants-start'),
            startDisplay: document.getElementById('constants-start-display'),
            countSlider: document.getElementById('constants-count'),
            countDisplay: document.getElementById('constants-count-display'),
            barContainer: document.getElementById('constants-bars'),
            streamContainer: document.getElementById('constants-stream'),
            entropyDisplay: document.getElementById('constants-entropy'),
            chiDisplay: document.getElementById('constants-chi'),
            deviationDisplay: document.getElementById('constants-deviation')
        });

        new ChaoticLogisticMapLab({
            rSlider: document.getElementById('chaos-r'),
            rDisplay: document.getElementById('chaos-r-display'),
            x0Input: document.getElementById('chaos-x0'),
            stepsSlider: document.getElementById('chaos-steps'),
            stepsDisplay: document.getElementById('chaos-steps-display'),
            timeCanvas: document.getElementById('chaos-time-canvas'),
            digitCanvas: document.getElementById('chaos-digit-canvas'),
            lyapunovDisplay: document.getElementById('chaos-lyapunov'),
            spreadDisplay: document.getElementById('chaos-spread'),
            entropyDisplay: document.getElementById('chaos-entropy'),
            runBtn: document.getElementById('chaos-run')
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChapter4Demos);
    } else {
        initializeChapter4Demos();
    }
})();
