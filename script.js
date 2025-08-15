document.addEventListener('DOMContentLoaded', function() {
    initColorPicker();
    initTextCounter();
    initQuoteGenerator();
    initCalculator();
});

function initColorPicker() {
    const colorPicker = document.getElementById('colorPicker');
    const hexValue = document.getElementById('hexValue');
    const rgbValue = document.getElementById('rgbValue');

    function updateColorInfo(color) {
        hexValue.textContent = color;
        const rgb = hexToRgb(color);
        rgbValue.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    colorPicker.addEventListener('input', function() {
        updateColorInfo(this.value);
    });

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}

function initTextCounter() {
    const textInput = document.getElementById('textInput');
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');

    function updateCounts() {
        const text = textInput.value;
        charCount.textContent = text.length;
        
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        wordCount.textContent = words.length;
    }

    textInput.addEventListener('input', updateCounts);
}

function initQuoteGenerator() {
    const quotes = [
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Innovation distinguishes between a leader and a follower. - Steve Jobs",
        "Life is what happens to you while you're busy making other plans. - John Lennon",
        "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
        "It is during our darkest moments that we must focus to see the light. - Aristotle",
        "The only impossible journey is the one you never begin. - Tony Robbins",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
        "The way to get started is to quit talking and begin doing. - Walt Disney",
        "Don't let yesterday take up too much of today. - Will Rogers",
        "You learn more from failure than from success. Don't let it stop you. Failure builds character. - Unknown"
    ];

    const quoteElement = document.getElementById('quote');
    const quoteBtn = document.getElementById('quoteBtn');

    quoteBtn.addEventListener('click', function() {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteElement.textContent = quotes[randomIndex];
    });
}

function initCalculator() {
    window.calcDisplay = document.getElementById('calcDisplay');
    window.currentInput = '';
}

function appendToCalc(value) {
    window.currentInput += value;
    window.calcDisplay.value = window.currentInput;
}

function clearCalc() {
    window.currentInput = '';
    window.calcDisplay.value = '';
}

function deleteLast() {
    window.currentInput = window.currentInput.slice(0, -1);
    window.calcDisplay.value = window.currentInput;
}

function calculate() {
    try {
        if (window.currentInput.trim() === '') return;
        
        const result = Function('"use strict"; return (' + window.currentInput + ')')();
        window.calcDisplay.value = result;
        window.currentInput = result.toString();
    } catch (error) {
        window.calcDisplay.value = 'Error';
        window.currentInput = '';
    }
}