// js/translations.js

/**
 * Multilingual Translation System for NKS Project
 * Provides complete trilingual support (EN/ZH/JA) for all UI elements
 * Includes comprehensive translation data for chapters, UI components, and chatbot
 * 
 * Supported Languages:
 * - English (en): Primary language with full coverage
 * - Chinese (zh): Simplified Chinese with complete translations
 * - Japanese (ja): Full Japanese localization
 * 
 * Translation Keys:
 * - UI elements: navigation, buttons, labels
 * - Chapter titles: all 12 chapters plus intro content
 * - Chatbot interface: messages, placeholders, responses
 * - Interactive elements: Conway's Game of Life, rule explorers
 * 
 * Usage: Access via window.translations[language][key]
 * Default Language: Chinese ('zh') for new users
 * Language Persistence: Stored in localStorage as 'nks-language'
 */

window.APP = window.APP || {};

(function (APP) {
    'use strict';

    /**
     * Complete translation data for all supported languages
     * Organized by language code with comprehensive key coverage
     * 
     * Structure: translations[language][key] = "translated text"
     * Languages: en (English), zh (Chinese), ja (Japanese)
     * 
     * @const {Object} translations
     */
    const translations = {
        en: {
            author: 'Stephen Wolfram',
            title: 'A New Kind of Science',
            subtitle: 'Personal notes and annotations',
            outline: 'Outline',
            annotations: 'Annotations',
            'annotation-placeholder': 'Click on any highlighted link in the notes to view detailed annotations and additional context.',
            'chapter1': 'Chapter 1: The Foundations for a New Kind of Science',
            'chapter2': 'Chapter 2: The Crucial Experiment',
            'chapter3': 'Chapter 3: The World of Simple Programs',
            'chapter4': 'Chapter 4: Systems Based on Numbers',
            'chapter5': 'Chapter 5: Two Dimensions and Beyond',
            'chapter6': 'Chapter 6: Starting from Randomness',
            'chapter7': 'Chapter 7: Mechanisms in Programs and Nature',
            'chapter8': 'Chapter 8: Implications for Everyday Systems',
            'chapter9': 'Chapter 9: Fundamental Physics',
            'chapter10': 'Chapter 10: Processes of Perception and Analysis',
            'chapter11': 'Chapter 11: The Notion of Computation',
            'chapter12': 'Chapter 12: The Principle of Computational Equivalence',
            'loading': 'Loading chapter content...',
            'rule-bg': 'BG',
            'rule-header': 'Header',
            'rule': 'Rule',
            'site-guide': 'Site Usage Guide',
            'intro-demo': 'Interactive Demo: Conway\'s Game of Life',
            'wolfram-demo': '🔬 Interactive Demo: Wolfram Rules Explorer',
            'chapter2-ca-static-demo': '🔬 Elementary CA Static Demo',
            'chapter3-demo': '🔬 Interactive Demo: Chapter 3 Experiments',
            'chapter3-wolfram256': '🔬 Wolfram 256 Rules Demo',
            'play': '▶ Play',
            'pause': '⏸ Pause',
            'chatbot-title': 'NKS Assistant',
            'chatbot-welcome': 'Hello! I\'m your NKS Assistant. Ask me anything about Stephen Wolfram\'s "A New Kind of Science" - cellular automata, computational equivalence, emergence, or any concepts from the book!',
            'chatbot-placeholder': 'Ask about cellular automata, Rule 30, complexity...',
            'chatbot-thinking': 'NKS Assistant is thinking...',
            'chatbot-toggle-title': 'Chat with NKS Assistant',
            'chat-quick-placeholder': '💡 Ask about A New Kind of Science...',
            'chat-input-placeholder': 'Continue the conversation...',
            'model-label': 'Model:',
            'model-chatgpt': 'ChatGPT',
            'model-gemini': 'Gemini',
            'model-glm': 'GLM'
        },
        zh: {
            preface: '前言',
            author: '斯蒂芬·沃尔夫拉姆',
            title: '一种新科学',
            subtitle: '个人笔记和注释',
            outline: '大纲',
            annotations: '注释',
            'annotation-placeholder': '点击笔记中任何高亮链接以查看详细注释和额外内容。',
            'chapter1': '第1章：新科学的基础',
            'chapter2': '第2章：关键实验',
            'chapter3': '第3章：简单程序的世界',
            'chapter4': '第4章：基于数字的系统',
            'chapter5': '第5章：二维及更高维度',
            'chapter6': '第6章：从随机性开始',
            'chapter7': '第7章：程序和自然界的机制',
            'chapter8': '第8章：对日常系统的影响',
            'chapter9': '第9章：基础物理学',
            'chapter10': '第10章：感知和分析过程',
            'chapter11': '第11章：计算的概念',
            'chapter12': '第12章：计算等价性原理',
            'loading': '正在加载章节内容...',
            'rule-bg': '背景',
            'rule-header': '标题',
            'rule': '元胞自动机：规则',
            'site-guide': '本站使用指南',
            'intro-demo': '交互演示：康威生命游戏',
            'wolfram-demo': '🔬 交互演示：Wolfram规则探索器',
            'chapter2-ca-static-demo': '🔬 交互演示：初等元胞自动机',
            'chapter3-demo': '🔬 交互演示：第3章实验合集',
            'chapter3-wolfram256': '🔬 演示：Wolfram 256 条规则',
            'play': '▶ 播放',
            'pause': '⏸ 暂停',
            'chatbot-title': 'NKS 助手',
            'chatbot-welcome': '您好！我是您的 NKS 助手。请随时询问关于斯蒂芬·沃尔夫拉姆《一种新科学》的任何问题——细胞自动机、计算等价性、涌现或书中的任何概念！为节省服务器费用（Google Cloud BigQuery免费版），查询速度较慢，请耐心等待。',
            'chatbot-placeholder': '询问细胞自动机、规则30、复杂性...',
            'chatbot-thinking': 'NKS 助手正在思考中...',
            'chatbot-toggle-title': '与 NKS 助手聊天',
            'chat-quick-placeholder': '💡 询问《一种新科学》相关问题...',
            'chat-input-placeholder': '继续对话...',
            'model-label': '模型：',
            'model-chatgpt': 'ChatGPT',
            'model-gemini': 'Gemini',
            'model-glm': 'GLM'
        },
        ja: {
            preface: '序文',
            author: 'スティーブン・ウルフラム',
            title: '新しい科学',
            subtitle: '個人ノートと注釈',
            outline: 'アウトライン',
            annotations: '注釈',
            'annotation-placeholder': 'ノート内のハイライトされたリンクをクリックして、詳細な注釈と追加のコンテキストを表示します。',
            'chapter1': '第1章：新しい科学の基礎',
            'chapter2': '第2章：決定的実験',
            'chapter3': '第3章：シンプルなプログラムの世界',
            'chapter4': '第4章：数値ベースのシステム',
            'chapter5': '第5章：二次元とその先',
            'chapter6': '第6章：ランダム性からの出発',
            'chapter7': '第7章：プログラムと自然界のメカニズム',
            'chapter8': '第8章：日常システムへの影響',
            'chapter9': '第9章：基礎物理学',
            'chapter10': '第10章：知覚と分析のプロセス',
            'chapter11': '第11章：計算の概念',
            'chapter12': '第12章：計算等価性の原理',
            'loading': 'チャプター内容を読み込み中...',
            'rule-bg': 'BG',
            'rule-header': 'ヘッダー',
            'rule': 'ルール',
            'site-guide': 'サイト使用ガイド',
            'intro-demo': 'インタラクティブデモ：コンウェイのライフゲーム',
            'wolfram-demo': '🔬 インタラクティブデモ：ウルフラムルール探索',
            'chapter2-ca-static-demo': '🔬 初等セルオートマトン静的デモ',
            'chapter3-demo': '🔬 インタラクティブデモ：第3章の実験',
            'chapter3-wolfram256': '🔬 ウルフラム256ルールデモ',
            'play': '▶ プレイ',
            'pause': '⏸ 一時停止',
            'chatbot-title': 'NKS アシスタント',
            'chatbot-welcome': 'こんにちは！私はあなたの NKS アシスタントです。スティーブン・ウルフラムの『新しい科学』について、セルオートマトン、計算等価性、創発、または本のあらゆる概念について何でもお聞きください！',
            'chatbot-placeholder': 'セルオートマトン、ルール30、複雑性について質問...',
            'chatbot-thinking': 'NKS アシスタントが考えています...',
            'chatbot-toggle-title': 'NKS アシスタントとチャット',
            'chat-quick-placeholder': '💡 『新しい科学』について質問...',
            'chat-input-placeholder': '会話を続ける...',
            'model-label': 'モデル：',
            'model-chatgpt': 'ChatGPT',
            'model-gemini': 'Gemini',
            'model-glm': 'GLM'
        }
    };

    /**
     * Language configuration and defaults
     * @const {string} DEFAULT_LANGUAGE - Default language for new users
     */
    const DEFAULT_LANGUAGE = 'zh';

    /**
     * Initialize translation system by exposing to global scope
     * Makes translations accessible to all modules and maintains backward compatibility
     * 
     * @function initTranslations
     * @returns {void}
     */
    function initTranslations() {
        // Expose to global scope for backward compatibility
        window.translations = translations;

        // Set default language if not already set
        if (!window.currentLanguage) {
            window.currentLanguage = localStorage.getItem('nks-language') || DEFAULT_LANGUAGE;
        }

        console.log('🌍 Translation system initialized with', Object.keys(translations).length, 'languages');
    }

    /**
     * Get translated text for a given key and language
     * Provides fallback mechanism: requested language → Chinese → English
     * 
     * @function getTranslation
     * @param {string} key - Translation key to look up
     * @param {string} [language] - Language code, defaults to current language
     * @param {string} [fallback=''] - Fallback text if translation not found
     * @returns {string} Translated text or fallback
     */
    function getTranslation(key, language = null, fallback = '') {
        const lang = language || window.currentLanguage || DEFAULT_LANGUAGE;

        // Try requested language
        if (translations[lang] && translations[lang][key]) {
            return translations[lang][key];
        }

        // Fallback to Chinese if not English
        if (lang !== 'zh' && translations.zh && translations.zh[key]) {
            return translations.zh[key];
        }

        // Fallback to English
        if (lang !== 'en' && translations.en && translations.en[key]) {
            return translations.en[key];
        }

        return fallback;
    }

    /**
     * Get all supported language codes
     * @function getSupportedLanguages
     * @returns {string[]} Array of supported language codes
     */
    function getSupportedLanguages() {
        return Object.keys(translations);
    }

    /**
     * Check if a language is supported
     * @function isLanguageSupported
     * @param {string} language - Language code to check
     * @returns {boolean} True if language is supported
     */
    function isLanguageSupported(language) {
        return translations.hasOwnProperty(language);
    }

    // Initialize translations system on load
    initTranslations();

    // Expose translations API to APP namespace
    APP.Translations = {
        translations,
        DEFAULT_LANGUAGE,
        initTranslations,
        getTranslation,
        getSupportedLanguages,
        isLanguageSupported
    };

})(window.APP);
