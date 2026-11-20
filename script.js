/* ============================================================
   script.js — Ultra-Fast & Modern UI Controller
   ============================================================ */
(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
    const TUTORIAL_IDS = ['blackbox-tutorial', 'gameassistant-tutorial', 'root-tutorial'];

    /* ---------- 1. Pemutar Video YouTube Facade & Lazy Load ---------- */
    function initVideoLoaders() {
        function extractYouTubeId(url) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            return match && match[2].length === 11 ? match[2] : null;
        }

        function createVideoEmbed(targetId, videoUrl) {
            const el = document.getElementById(targetId);
            const videoId = extractYouTubeId(videoUrl);
            if (!el || !videoId) return;

            const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            el.style.backgroundImage = `linear-gradient(to bottom, rgba(3,6,15,0.25), rgba(3,6,15,0.72)), url(${thumbUrl})`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';

            el.addEventListener('click', function handler() {
                el.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1" title="YouTube video tutorial" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="aspect-ratio: 16/9; display: block; width: 100%; height: 100%; background: #000;"></iframe>`;
                el.classList.add('is-playing');
                el.style.backgroundImage = 'none';
                el.removeEventListener('click', handler);
            });
        }

        createVideoEmbed('videoPreview', 'https://youtu.be/nFo4WVc9ZX4?si=lo-ekDOfVK6zr8ZT');
        createVideoEmbed('videoPreview2', 'https://youtu.be/XmzBGlpB5Eg?si=SEooZMPBqBpqjsly');
        createVideoEmbed('videoPreviewLogin', 'https://youtu.be/tTNvWIvHrzQ?si=TwCB0ux2y74s7kYX');
    }

    /* ---------- 2. Subtle Ambient Particles ---------- */
    function initDynamicSnow() {
        const snowLayer = document.getElementById('snowLayer');
        if (!snowLayer || prefersReducedMotion || isTouchDevice) return;

        const count = 10;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('span');
            dot.style.left = (Math.random() * 94 + 3) + '%';
            dot.style.animationDuration = (Math.random() * 8 + 10) + 's';
            dot.style.animationDelay = (Math.random() * 5) + 's';
            fragment.appendChild(dot);
        }
        snowLayer.appendChild(fragment);
    }

    /* ---------- 3. Tutorial Visibility & Switching ---------- */
    function hideTutorialSections() {
        TUTORIAL_IDS.forEach(function (id) {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                el.setAttribute('aria-hidden', 'true');
            }
        });
    }

    function showTutorialSection(id) {
        TUTORIAL_IDS.forEach(function (otherId) {
            const el = document.getElementById(otherId);
            if (el) {
                el.style.display = 'none';
                el.setAttribute('aria-hidden', 'true');
            }
        });

        const target = document.getElementById(id);
        if (target) {
            target.style.display = '';
            target.removeAttribute('aria-hidden');
            // Ensure cards inside newly shown section animate in smoothly
            requestAnimationFrame(function () {
                target.querySelectorAll('.reveal, .reveal-scale, .reveal-right').forEach(function (item) {
                    item.classList.add('revealed');
                });
            });
        }
    }

    function scrollToSection(id) {
        const target = document.getElementById(id);
        const header = document.getElementById('mainHeader');
        if (!target) return;
        const headerHeight = header ? header.offsetHeight : 64;
        requestAnimationFrame(function () {
            const pos = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
            window.scrollTo({ top: pos, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
    }

    /* ---------- 4. Intro Overlay, Welcome Sound & Choice Modal ---------- */
    let openChoiceModalFn = null;
    let showToastFn = null;

    const WELCOME_MSG = 'Selamat datang di Solana, jangan lupa simak video tutorialnya pelan-pelan.';
    const welcomeAudio = typeof Audio !== 'undefined' ? new Audio('assets/welcome-voice.mp3') : null;
    let welcomeAudioFailed = false;
    let welcomePlayed = false;

    if (welcomeAudio) {
        welcomeAudio.preload = 'auto';
        welcomeAudio.addEventListener('error', function () {
            welcomeAudioFailed = true;
            if (welcomePlayed) speakWelcomeFallback();
        }, { once: true });
    }

    function playNotifChime() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        try {
            const ctx = new AudioCtx();
            const now = ctx.currentTime;
            [
                { freq: 880, start: 0, end: 0.14 },
                { freq: 1174.66, start: 0.08, end: 0.24 }
            ].forEach(function (note) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(note.freq, now + note.start);
                gain.gain.setValueAtTime(0.0001, now + note.start);
                gain.gain.exponentialRampToValueAtTime(0.035, now + note.start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + note.end);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + note.start);
                osc.stop(now + note.end + 0.02);
            });
            setTimeout(function () {
                if (ctx.state !== 'closed') ctx.close().catch(function () { });
            }, 600);
        } catch (e) { }
    }

    function speakWelcomeFallback() {
        if (!('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(WELCOME_MSG);
            utter.lang = 'id-ID';
            utter.rate = 0.98;
            utter.pitch = 1.02;
            const voices = window.speechSynthesis.getVoices();
            const idVoice = voices.find(function (v) {
                return v.lang && v.lang.toLowerCase().indexOf('id') === 0;
            });
            if (idVoice) utter.voice = idVoice;
            window.speechSynthesis.speak(utter);
        } catch (e) { }
    }

    function triggerWelcomeNotification() {
        if (welcomePlayed) return;
        welcomePlayed = true;

        playNotifChime();

        if (!welcomeAudio || welcomeAudioFailed) {
            speakWelcomeFallback();
        } else {
            try {
                welcomeAudio.currentTime = 0;
                const playPromise = welcomeAudio.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(speakWelcomeFallback);
                }
            } catch (e) {
                speakWelcomeFallback();
            }
        }

        if (showToastFn) {
            showToastFn(WELCOME_MSG, 5200);
        }
    }

    /* ---------- World Languages (Google Translate Full List) ---------- */
    const WORLD_LANGUAGES = [
        { code: 'id', flag: 'id', name: 'Bahasa Indonesia', native: 'Indonesia' },
        { code: 'en', flag: 'gb', name: 'Inggris', native: 'English' },
        { code: 'ms', flag: 'my', name: 'Melayu', native: 'Bahasa Melayu' },
        { code: 'ar', flag: 'sa', name: 'Arab', native: 'العربية' },
        { code: 'zh-CN', flag: 'cn', name: 'Mandarin (Sederhana)', native: '简体中文' },
        { code: 'zh-TW', flag: 'tw', name: 'Mandarin (Tradisional)', native: '繁體中文' },
        { code: 'ja', flag: 'jp', name: 'Jepang', native: '日本語' },
        { code: 'ko', flag: 'kr', name: 'Korea', native: '한국어' },
        { code: 'vi', flag: 'vn', name: 'Vietnam', native: 'Tiếng Việt' },
        { code: 'th', flag: 'th', name: 'Thailand', native: 'ไทย' },
        { code: 'tl', flag: 'ph', name: 'Tagalog / Filipino', native: 'Filipino' },
        { code: 'jv', flag: 'id', name: 'Jawa', native: 'Basa Jawa' },
        { code: 'su', flag: 'id', name: 'Sunda', native: 'Basa Sunda' },
        { code: 'hi', flag: 'in', name: 'Hindi', native: 'हिन्दी' },
        { code: 'bn', flag: 'bd', name: 'Bengali', native: 'বাংলা' },
        { code: 'ur', flag: 'pk', name: 'Urdu', native: 'اردو' },
        { code: 'fa', flag: 'ir', name: 'Persia', native: 'فارسی' },
        { code: 'tr', flag: 'tr', name: 'Turki', native: 'Türkçe' },
        { code: 'ru', flag: 'ru', name: 'Rusia', native: 'Русский' },
        { code: 'es', flag: 'es', name: 'Spanyol', native: 'Español' },
        { code: 'fr', flag: 'fr', name: 'Prancis', native: 'Français' },
        { code: 'de', flag: 'de', name: 'Jerman', native: 'Deutsch' },
        { code: 'pt', flag: 'pt', name: 'Portugis', native: 'Português' },
        { code: 'it', flag: 'it', name: 'Italia', native: 'Italiano' },
        { code: 'nl', flag: 'nl', name: 'Belanda', native: 'Nederlands' },
        { code: 'pl', flag: 'pl', name: 'Polandia', native: 'Polski' },
        { code: 'uk', flag: 'ua', name: 'Ukraina', native: 'Українська' },
        { code: 'ro', flag: 'ro', name: 'Rumania', native: 'Română' },
        { code: 'cs', flag: 'cz', name: 'Ceko', native: 'Čeština' },
        { code: 'sv', flag: 'se', name: 'Swedia', native: 'Svenska' },
        { code: 'da', flag: 'dk', name: 'Denmark', native: 'Dansk' },
        { code: 'fi', flag: 'fi', name: 'Finlandia', native: 'Suomi' },
        { code: 'no', flag: 'no', name: 'Norwegia', native: 'Norsk' },
        { code: 'el', flag: 'gr', name: 'Yunani', native: 'Ελληνικά' },
        { code: 'hu', flag: 'hu', name: 'Hungaria', native: 'Magyar' },
        { code: 'he', flag: 'il', name: 'Ibrani', native: 'עברית' },
        { code: 'af', flag: 'za', name: 'Afrikaans', native: 'Afrikaans' },
        { code: 'sq', flag: 'al', name: 'Albania', native: 'Shqip' },
        { code: 'am', flag: 'et', name: 'Amharik', native: 'አማርኛ' },
        { code: 'hy', flag: 'am', name: 'Armenia', native: 'Հայերեն' },
        { code: 'as', flag: 'in', name: 'Assam', native: 'অসমীয়া' },
        { code: 'ay', flag: 'bo', name: 'Aymara', native: 'Aymar aru' },
        { code: 'az', flag: 'az', name: 'Azerbaijan', native: 'Azərbaycan dili' },
        { code: 'bm', flag: 'ml', name: 'Bambara', native: 'Bamanankan' },
        { code: 'eu', flag: 'es-pv', name: 'Basque', native: 'Euskara' },
        { code: 'be', flag: 'by', name: 'Belarusia', native: 'Беларуская' },
        { code: 'bho', flag: 'in', name: 'Bhojpuri', native: 'भोजपुरी' },
        { code: 'bs', flag: 'ba', name: 'Bosnia', native: 'Bosanski' },
        { code: 'bg', flag: 'bg', name: 'Bulgaria', native: 'Български' },
        { code: 'ca', flag: 'es-ct', name: 'Katalan', native: 'Català' },
        { code: 'ceb', flag: 'ph', name: 'Cebuano', native: 'Binisaya' },
        { code: 'ny', flag: 'mw', name: 'Chichewa', native: 'Chichewa' },
        { code: 'co', flag: 'fr', name: 'Korsika', native: 'Corsu' },
        { code: 'hr', flag: 'hr', name: 'Kroasia', native: 'Hrvatski' },
        { code: 'dv', flag: 'mv', name: 'Dhivehi', native: 'ދިވެހި' },
        { code: 'doi', flag: 'in', name: 'Dogri', native: 'डोगरी' },
        { code: 'eo', flag: 'eo', name: 'Esperanto', native: 'Esperanto' },
        { code: 'et', flag: 'ee', name: 'Estonia', native: 'Eesti' },
        { code: 'ee', flag: 'tg', name: 'Ewe', native: 'Eʋegbe' },
        { code: 'fy', flag: 'nl', name: 'Frisia', native: 'Frysk' },
        { code: 'gl', flag: 'es-ga', name: 'Galisia', native: 'Galego' },
        { code: 'ka', flag: 'ge', name: 'Georgia', native: 'ქართული' },
        { code: 'gn', flag: 'py', name: 'Guarani', native: "Avañe'ẽ" },
        { code: 'gu', flag: 'in', name: 'Gujarat', native: 'ગુજરાતી' },
        { code: 'ht', flag: 'ht', name: 'Kreol Haiti', native: 'Kreyòl ayisyen' },
        { code: 'ha', flag: 'ng', name: 'Hausa', native: 'Hausa' },
        { code: 'haw', flag: 'us', name: 'Hawaii', native: 'ʻŌlelo Hawaiʻi' },
        { code: 'hmn', flag: 'la', name: 'Hmong', native: 'Hmoob' },
        { code: 'is', flag: 'is', name: 'Islandia', native: 'Íslenska' },
        { code: 'ig', flag: 'ng', name: 'Igbo', native: 'Igbo' },
        { code: 'ilo', flag: 'ph', name: 'Ilokano', native: 'Ilokano' },
        { code: 'ga', flag: 'ie', name: 'Irlandia', native: 'Gaeilge' },
        { code: 'kn', flag: 'in', name: 'Kannada', native: 'ಕನ್ನಡ' },
        { code: 'kk', flag: 'kz', name: 'Kazakh', native: 'Қазақ тілі' },
        { code: 'km', flag: 'kh', name: 'Khmer', native: 'ខ្មែរ' },
        { code: 'rw', flag: 'rw', name: 'Kinyarwanda', native: 'Ikinyarwanda' },
        { code: 'gom', flag: 'in', name: 'Konkani', native: 'कोंकणी' },
        { code: 'kri', flag: 'sl', name: 'Krio', native: 'Krio' },
        { code: 'ku', flag: 'iq', name: 'Kurdi (Kurmanji)', native: 'Kurdî' },
        { code: 'ckb', flag: 'iq', name: 'Kurdi (Sorani)', native: 'کوردی' },
        { code: 'ky', flag: 'kg', name: 'Kirgiz', native: 'Кыргызча' },
        { code: 'lo', flag: 'la', name: 'Lao', native: 'ລາວ' },
        { code: 'la', flag: 'va', name: 'Latin', native: 'Latina' },
        { code: 'lv', flag: 'lv', name: 'Latvia', native: 'Latviešu' },
        { code: 'ln', flag: 'cd', name: 'Lingala', native: 'Lingála' },
        { code: 'lt', flag: 'lt', name: 'Lituania', native: 'Lietuvių' },
        { code: 'lg', flag: 'ug', name: 'Luganda', native: 'Luganda' },
        { code: 'lb', flag: 'lu', name: 'Luksemburg', native: 'Lëtzebuergesch' },
        { code: 'mk', flag: 'mk', name: 'Makedonia', native: 'Македонски' },
        { code: 'mai', flag: 'in', name: 'Maithili', native: 'मैथिली' },
        { code: 'mg', flag: 'mg', name: 'Malagasi', native: 'Malagasy' },
        { code: 'ml', flag: 'in', name: 'Malayalam', native: 'മലയാളം' },
        { code: 'mt', flag: 'mt', name: 'Malta', native: 'Malti' },
        { code: 'mi', flag: 'nz', name: 'Maori', native: 'Te Reo Māori' },
        { code: 'mr', flag: 'in', name: 'Marathi', native: 'मराठी' },
        { code: 'mni-Mtei', flag: 'in', name: 'Meiteilon (Manipuri)', native: 'ꯃꯩꯇꯩꯂꯣꯟ' },
        { code: 'lus', flag: 'in', name: 'Mizo', native: 'Mizo ṭawng' },
        { code: 'mn', flag: 'mn', name: 'Mongolia', native: 'Монгол' },
        { code: 'my', flag: 'mm', name: 'Myanmar (Burma)', native: 'မြန်မာ' },
        { code: 'ne', flag: 'np', name: 'Nepal', native: 'नेपाली' },
        { code: 'nso', flag: 'za', name: 'Sepedi', native: 'Sepedi' },
        { code: 'or', flag: 'in', name: 'Odia (Oriya)', native: 'ଓଡ଼ିଆ' },
        { code: 'om', flag: 'et', name: 'Oromo', native: 'Afaan Oromoo' },
        { code: 'ps', flag: 'af', name: 'Pashto', native: 'پښتو' },
        { code: 'pa', flag: 'in', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
        { code: 'qu', flag: 'pe', name: 'Quechua', native: 'Runasimi' },
        { code: 'sm', flag: 'ws', name: 'Samoa', native: 'Gagana Samoa' },
        { code: 'sa', flag: 'in', name: 'Sanskerta', native: 'संस्कृतम्' },
        { code: 'gd', flag: 'gb-sct', name: 'Gaelik Skotlandia', native: 'Gàidhlig' },
        { code: 'sr', flag: 'rs', name: 'Serbia', native: 'Српски' },
        { code: 'st', flag: 'ls', name: 'Sesotho', native: 'Sesotho' },
        { code: 'sn', flag: 'zw', name: 'Shona', native: 'ChiShona' },
        { code: 'sd', flag: 'pk', name: 'Sindhi', native: 'سنڌي' },
        { code: 'si', flag: 'lk', name: 'Sinhala', native: 'සිංහල' },
        { code: 'sk', flag: 'sk', name: 'Slovakia', native: 'Slovenčina' },
        { code: 'sl', flag: 'si', name: 'Slovenia', native: 'Slovenščina' },
        { code: 'so', flag: 'so', name: 'Somalia', native: 'Soomaali' },
        { code: 'sw', flag: 'tz', name: 'Swahili', native: 'Kiswahili' },
        { code: 'tg', flag: 'tj', name: 'Tajik', native: 'Тоҷикӣ' },
        { code: 'ta', flag: 'in', name: 'Tamil', native: 'தமிழ்' },
        { code: 'tt', flag: 'ru', name: 'Tatar', native: 'Татар' },
        { code: 'te', flag: 'in', name: 'Telugu', native: 'తెలుగు' },
        { code: 'ti', flag: 'er', name: 'Tigrinya', native: 'ትግርኛ' },
        { code: 'ts', flag: 'za', name: 'Tsonga', native: 'Xitsonga' },
        { code: 'tk', flag: 'tm', name: 'Turkmen', native: 'Türkmençe' },
        { code: 'ak', flag: 'gh', name: 'Twi (Akan)', native: 'Akan' },
        { code: 'ug', flag: 'cn', name: 'Uyghur', native: 'ئۇيغۇرچە' },
        { code: 'uz', flag: 'uz', name: 'Uzbek', native: "Oʻzbekcha" },
        { code: 'cy', flag: 'gb-wls', name: 'Wales', native: 'Cymraeg' },
        { code: 'xh', flag: 'za', name: 'Xhosa', native: 'isiXhosa' },
        { code: 'yi', flag: 'il', name: 'Yiddish', native: 'ייִדיש' },
        { code: 'yo', flag: 'ng', name: 'Yoruba', native: 'Yorùbá' },
        { code: 'zu', flag: 'za', name: 'Zulu', native: 'isiZulu' }
    ];

    let pendingTranslateCode = null;

    window.googleTranslateElementInit = function () {
        if (window.google && window.google.translate && window.google.translate.TranslateElement) {
            new window.google.translate.TranslateElement({
                pageLanguage: 'id',
                autoDisplay: false
            }, 'google_translate_element');

            if (pendingTranslateCode) {
                triggerGoogleCombo(pendingTranslateCode);
                pendingTranslateCode = null;
            }
        }
    };

    function setGoogTransCookie(code) {
        if (code === 'id') {
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            if (window.location.hostname) {
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';';
            }
            return;
        }
        document.cookie = 'googtrans=/id/' + code + '; path=/;';
    }

    function triggerGoogleCombo(code, attempt) {
        const tries = attempt || 0;
        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
            combo.value = code;
            combo.dispatchEvent(new Event('change'));
            return true;
        }
        if (tries < 14) {
            setTimeout(function () { triggerGoogleCombo(code, tries + 1); }, 250);
        }
        return false;
    }

    function getShortLangTag(code) {
        return code.split('-')[0].toUpperCase();
    }

    function initLanguageModal() {
        const modal = document.getElementById('langModal');
        const backdrop = document.getElementById('langModalBackdrop');
        const closeBtn = document.getElementById('langModalClose');
        const openBtn = document.getElementById('openLangModalBtn');
        const grid = document.getElementById('langGrid');
        const searchInput = document.getElementById('langSearchInput');
        const emptyMsg = document.getElementById('langEmpty');
        const totalEl = document.getElementById('langTotalCount');
        const activeCodeEl = document.getElementById('activeLangCode');
        const activeFlagEl = document.getElementById('activeLangFlag');
        if (!modal || !grid) return;

        if (totalEl) totalEl.textContent = String(WORLD_LANGUAGES.length);

        let savedLang = 'id';
        try {
            const stored = localStorage.getItem('preferred_lang');
            if (stored && WORLD_LANGUAGES.some(function (l) { return l.code === stored; })) {
                savedLang = stored;
            }
        } catch (e) { }

        function updateActiveUI(code) {
            const selectedLang = WORLD_LANGUAGES.find(function (l) { return l.code === code; });
            if (activeCodeEl) activeCodeEl.textContent = getShortLangTag(code);
            if (activeFlagEl) {
                activeFlagEl.src = 'assets/flags/' + (selectedLang ? selectedLang.flag : 'id') + '.svg';
            }
            grid.querySelectorAll('.lang-item-btn').forEach(function (b) {
                const isSelected = b.getAttribute('data-lang') === code;
                b.classList.toggle('is-active', isSelected);
                b.setAttribute('aria-selected', String(isSelected));
            });
        }

        function applyLanguage(lang) {
            try { localStorage.setItem('preferred_lang', lang.code); } catch (e) { }
            updateActiveUI(lang.code);
            setGoogTransCookie(lang.code);
            closeModal();

            if (lang.code === 'id') {
                if (document.querySelector('.goog-te-combo')) {
                    window.location.reload();
                } else if (showToastFn) {
                    showToastFn('Bahasa diubah ke Bahasa Indonesia.', 2600);
                }
                return;
            }

            pendingTranslateCode = lang.code;
            const comboReady = triggerGoogleCombo(lang.code);
            if (showToastFn) {
                const msg = (window.location.protocol === 'file:' && !comboReady)
                    ? 'Bahasa dipilih: ' + lang.native + ' (terjemahan penuh aktif saat dibuka via web/HTTPS).'
                    : 'Menerjemahkan halaman ke ' + lang.native + '…';
                showToastFn(msg, 3200);
            }
        }

        let enLangNames = null;
        let enRegionNames = null;
        let idRegionNames = null;
        try {
            if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
                enLangNames = new Intl.DisplayNames(['en'], { type: 'language' });
                enRegionNames = new Intl.DisplayNames(['en'], { type: 'region' });
                idRegionNames = new Intl.DisplayNames(['id'], { type: 'region' });
            }
        } catch (err) {
            enLangNames = null;
            enRegionNames = null;
            idRegionNames = null;
        }

        const frag = document.createDocumentFragment();
        WORLD_LANGUAGES.forEach(function (lang) {
            let extraKeywords = '';
            if (enLangNames) {
                try {
                    extraKeywords += ' ' + (enLangNames.of(lang.code) || '');
                } catch (err) { }
            }
            const isoRegion = lang.flag.split('-')[0].toUpperCase();
            if (isoRegion.length === 2 && lang.flag !== 'eo') {
                try {
                    if (enRegionNames) extraKeywords += ' ' + (enRegionNames.of(isoRegion) || '');
                    if (idRegionNames) extraKeywords += ' ' + (idRegionNames.of(isoRegion) || '');
                } catch (err) { }
            }
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'lang-item-btn';
            btn.setAttribute('role', 'option');
            btn.setAttribute('data-lang', lang.code);
            btn.setAttribute('data-search', (lang.name + ' ' + lang.native + extraKeywords + ' ' + lang.code).toLowerCase());
            btn.innerHTML = `<img class="lang-item-flag" src="assets/flags/${lang.flag}.svg" alt="" width="28" height="21" loading="lazy" decoding="async" aria-hidden="true"><span class="lang-item-names"><strong>${lang.native}</strong><small>${lang.name}</small></span><span class="lang-item-code">${lang.code}</span>`;
            btn.addEventListener('click', function () {
                applyLanguage(lang);
            });
            frag.appendChild(btn);
        });
        grid.appendChild(frag);
        updateActiveUI(savedLang);

        if (savedLang !== 'id') {
            setGoogTransCookie(savedLang);
            pendingTranslateCode = savedLang;
        }

        function openModal() {
            modal.removeAttribute('hidden');
            document.body.style.overflow = 'hidden';
            if (searchInput) {
                searchInput.value = '';
                filterLanguages('');
                setTimeout(function () { searchInput.focus(); }, 60);
            }
        }

        function closeModal() {
            modal.setAttribute('hidden', '');
            document.body.style.overflow = '';
        }

        function filterLanguages(query) {
            const q = query.trim().toLowerCase();
            let visible = 0;
            grid.querySelectorAll('.lang-item-btn').forEach(function (btn) {
                const hay = btn.getAttribute('data-search') || '';
                const match = !q || hay.indexOf(q) !== -1;
                btn.hidden = !match;
                if (match) visible++;
            });
            if (emptyMsg) emptyMsg.hidden = visible > 0;
        }

        if (searchInput) {
            searchInput.addEventListener('input', function () {
                filterLanguages(searchInput.value);
            });
        }
        if (openBtn) openBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);

        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
                closeModal();
            }
        });
    }

    function initChoiceModal() {
        const modal = document.getElementById('choiceModal');
        if (!modal) return;

        const stepRoot = document.getElementById('stepRoot');
        const stepNoRoot = document.getElementById('stepNoRoot');
        const backBtn = document.getElementById('choiceBack');
        const closeBtn = document.getElementById('choiceModalClose');
        const backdrop = document.getElementById('choiceBackdrop');

        function openModal() {
            if (stepRoot) stepRoot.hidden = false;
            if (stepNoRoot) stepNoRoot.hidden = true;
            modal.removeAttribute('hidden');
            document.body.style.overflow = 'hidden';
            const card = modal.querySelector('.choice-card');
            if (card) card.focus();
        }

        function closeModal() {
            modal.setAttribute('hidden', '');
            document.body.style.overflow = '';
            if (stepRoot) stepRoot.hidden = false;
            if (stepNoRoot) stepNoRoot.hidden = true;
        }

        openChoiceModalFn = openModal;

        modal.querySelectorAll('[data-choice]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const choice = btn.getAttribute('data-choice');
                if (choice === 'root') {
                    showTutorialSection('root-tutorial');
                    closeModal();
                    setTimeout(function () { scrollToSection('root-tutorial'); }, 120);
                } else if (choice === 'noroot') {
                    // Blackbox disembunyikan sementara: tampilkan Game Assistant dan mulai dari atas halaman
                    showTutorialSection('gameassistant-tutorial');
                    closeModal();
                    window.scrollTo({ top: 0, behavior: 'auto' });
                }
            });
        });

        modal.querySelectorAll('[data-target]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const id = btn.getAttribute('data-target');
                showTutorialSection(id);
                closeModal();
                setTimeout(function () { scrollToSection(id); }, 120);
            });
        });

        if (backBtn) {
            backBtn.addEventListener('click', function () {
                if (stepNoRoot) stepNoRoot.hidden = true;
                if (stepRoot) stepRoot.hidden = false;
            });
        }

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);

        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
                closeModal();
            }
        });
    }

    function initIntroOverlay() {
        const overlay = document.getElementById('introOverlay');
        if (!overlay) return;

        document.body.style.overflow = 'hidden';

        function dismissOverlay() {
            if (overlay.classList.contains('intro-hidden')) return;
            triggerWelcomeNotification();
            overlay.classList.add('intro-hidden');
            document.body.style.overflow = '';
            setTimeout(function () {
                if (overlay.parentNode) overlay.remove();
            }, 500);
        }

        const enterBtn = document.getElementById('introEnterBtn');
        if (enterBtn) {
            enterBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                dismissOverlay();
                setTimeout(function () {
                    if (openChoiceModalFn) openChoiceModalFn();
                }, 320);
            });
        }

        overlay.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                dismissOverlay();
                setTimeout(function () {
                    if (openChoiceModalFn) openChoiceModalFn();
                }, 320);
            }
        });

        document.addEventListener('keydown', function onIntroKey(e) {
            if (!document.body.contains(overlay)) {
                document.removeEventListener('keydown', onIntroKey);
                return;
            }
            if (e.key === 'Enter' && !overlay.classList.contains('intro-hidden')) {
                e.preventDefault();
                dismissOverlay();
                setTimeout(function () {
                    if (openChoiceModalFn) openChoiceModalFn();
                }, 320);
                document.removeEventListener('keydown', onIntroKey);
            }
        });
    }

    function initTutorialSwitchers() {
        document.querySelectorAll('[data-switch-tutorial]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const targetId = btn.getAttribute('data-switch-tutorial');
                if (!targetId) return;
                showTutorialSection(targetId);
                setTimeout(function () { scrollToSection(targetId); }, 80);
            });
        });
    }

    /* ---------- 5. Image Lightbox Preview ---------- */
    function initLightbox() {
        const modal = document.getElementById('lightboxModal');
        const backdrop = document.getElementById('lightboxBackdrop');
        const closeBtn = document.getElementById('lightboxClose');
        const imgEl = document.getElementById('lightboxImg');
        const captionEl = document.getElementById('lightboxCaption');
        if (!modal || !imgEl) return;

        function openLightbox(src, alt) {
            imgEl.src = src;
            imgEl.alt = alt || '';
            if (captionEl) captionEl.textContent = alt || '';
            modal.removeAttribute('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            modal.setAttribute('hidden', '');
            document.body.style.overflow = '';
            imgEl.src = '';
        }

        document.querySelectorAll('[data-lightbox]').forEach(function (wrap) {
            function triggerOpen() {
                const img = wrap.querySelector('img');
                if (img && img.src) {
                    openLightbox(img.src, img.alt);
                }
            }
            wrap.addEventListener('click', triggerOpen);
            wrap.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    triggerOpen();
                }
            });
        });

        if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
        if (backdrop) backdrop.addEventListener('click', closeLightbox);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
                closeLightbox();
            }
        });
    }

    /* ---------- 6. Scroll Reveal ---------- */
    function initScrollReveal() {
        const map = [
            ['.method-card', 'reveal'],
            ['.tutorial-card', 'reveal-scale'],
            ['.feature-card', 'reveal'],
            ['.download-links', 'reveal'],
            ['.pubg-downloads', 'reveal'],
            ['.stat', 'reveal'],
            ['.root-card', 'reveal']
        ];

        const targets = [];
        map.forEach(function (pair) {
            document.querySelectorAll(pair[0]).forEach(function (el) {
                targets.push([el, pair[1]]);
            });
        });

        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            targets.forEach(function (t) { t[0].classList.add('revealed'); });
            return;
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

        targets.forEach(function (t) {
            t[0].classList.add(t[1]);
            observer.observe(t[0]);
        });
    }

    /* ---------- 7. Back to Top with Circular Progress Ring ---------- */
    function initBackToTop() {
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Kembali ke atas halaman');
        btn.innerHTML = `
            <svg class="back-to-top-ring" viewBox="0 0 48 48" aria-hidden="true">
                <circle cx="24" cy="24" r="21"></circle>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"></polyline></svg>
        `;
        document.body.appendChild(btn);

        const ringCircle = btn.querySelector('.back-to-top-ring circle');
        const circumference = 2 * Math.PI * 21; // ~131.95
        if (ringCircle) {
            ringCircle.style.strokeDasharray = circumference;
            ringCircle.style.strokeDashoffset = circumference;
        }

        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });

        let ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    const scrolled = window.pageYOffset || document.documentElement.scrollTop;
                    const max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                    const ratio = max > 0 ? Math.min(1, Math.max(0, scrolled / max)) : 0;

                    if (scrolled > 300) {
                        btn.classList.add('show');
                    } else {
                        btn.classList.remove('show');
                    }

                    if (ringCircle) {
                        ringCircle.style.strokeDashoffset = circumference * (1 - ratio);
                    }

                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /* ---------- 8. Cursor Glow & Card Spotlight ---------- */
    function initCursorGlow() {
        if (prefersReducedMotion || isTouchDevice) return;

        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        document.body.appendChild(glow);

        let ticking = false;
        window.addEventListener('mousemove', function (e) {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        document.querySelectorAll('.spotlight-card').forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
                card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
            }, { passive: true });
        });
    }

    /* ---------- 9. Toast Notification Handler ---------- */
    function initToast() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);

        function showToast(msg, duration) {
            const t = document.createElement('div');
            t.className = 'toast';
            t.innerHTML = `<span class="toast-dot"></span><span>${msg}</span>`;
            container.appendChild(t);
            requestAnimationFrame(function () { t.classList.add('show'); });
            setTimeout(function () {
                t.classList.remove('show');
                setTimeout(function () { t.remove(); }, 300);
            }, duration || 2500);
        }

        showToastFn = showToast;

        document.querySelectorAll('.download-btn, a.pubg-card, a.pubg-dl-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                showToast('Mengalihkan ke tautan unduhan resmi…');
            });
        });
    }

    /* ---------- 10. Active Nav & Header Auto-hide ---------- */
    function initNavigation() {
        const header = document.getElementById('mainHeader');
        let lastScroll = 0;
        let ticking = false;

        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                    if (header) {
                        if (currentScroll > lastScroll && currentScroll > 100) {
                            header.classList.add('nav-hidden');
                        } else {
                            header.classList.remove('nav-hidden');
                        }
                    }
                    lastScroll = currentScroll <= 0 ? 0 : currentScroll;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#' || !targetId.startsWith('#')) return;
                const sectionId = targetId.substring(1);
                if (TUTORIAL_IDS.indexOf(sectionId) !== -1) {
                    showTutorialSection(sectionId);
                }
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    scrollToSection(sectionId);
                }
            });
        });
    }

    /* ---------- 11. Animated Counters ---------- */
    function initCounters() {
        const counters = document.querySelectorAll('.stat-number');
        if (!counters.length) return;

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const target = parseInt(el.dataset.target, 10) || 0;
                const suffix = el.dataset.suffix || '';

                if (prefersReducedMotion) {
                    el.textContent = target + suffix;
                    observer.unobserve(el);
                    return;
                }

                let cur = 0;
                const step = Math.max(1, Math.ceil(target / 24));
                const timer = setInterval(function () {
                    cur += step;
                    if (cur >= target) {
                        cur = target;
                        clearInterval(timer);
                    }
                    el.textContent = cur + suffix;
                }, 32);

                observer.unobserve(el);
            });
        }, { threshold: 0.35 });

        counters.forEach(function (c) { observer.observe(c); });
    }

    /* ---------- 12. Mobile Navigation ---------- */
    function initMobileNav() {
        const toggle = document.getElementById('navToggle');
        const nav = document.getElementById('primaryNav');
        if (!toggle || !nav) return;

        function close() {
            toggle.classList.remove('is-open');
            nav.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Buka menu navigasi');
        }

        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = nav.classList.toggle('is-open');
            toggle.classList.toggle('is-open', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
            toggle.setAttribute('aria-label', isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
        });

        nav.querySelectorAll('a, button').forEach(function (item) {
            item.addEventListener('click', close);
        });

        document.addEventListener('click', function (e) {
            if (!nav.classList.contains('is-open')) return;
            const header = document.querySelector('header');
            if (header && !header.contains(e.target)) close();
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 820) close();
        }, { passive: true });
    }

    /* ---------- 13. Scroll Progress Bar ---------- */
    function initScrollProgress() {
        const bar = document.getElementById('scrollProgress');
        if (!bar) return;
        let ticking = false;

        function update() {
            const h = document.documentElement;
            const scrolled = h.scrollTop || document.body.scrollTop;
            const max = h.scrollHeight - h.clientHeight;
            const pct = max > 0 ? (scrolled / max) * 100 : 0;
            bar.style.width = pct + '%';
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    update();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        update();
    }

    /* ---------- Init Everything ---------- */
    document.addEventListener('DOMContentLoaded', function () {
        hideTutorialSections();
        initVideoLoaders();
        initDynamicSnow();
        initChoiceModal();
        initLanguageModal();
        initIntroOverlay();
        initTutorialSwitchers();
        initLightbox();
        initScrollReveal();
        initBackToTop();
        initCursorGlow();
        initToast();
        initNavigation();
        initCounters();
        initMobileNav();
        initScrollProgress();
    });
})();
