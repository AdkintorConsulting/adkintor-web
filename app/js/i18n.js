/**
 * ============================================
 * ADKINTOR i18n ENGINE
 * ============================================
 * Motor de internacionalización ligero para EAMS + FORESIGHT.
 * - Lee el idioma desde adkintor_session.language (WEB_USERS)
 * - Fallback a adkintor_lang -> navigator.language -> 'en'
 * - Escucha postMessage SET_LANGUAGE desde el padre (main.html)
 * - Traduce HTML estático (data-i18n*) y textos dinámicos (t / tStatus)
 * ============================================
 */
(function () {
    'use strict';

    var SUPPORTED_LANGS = ['en', 'es'];
    var DEFAULT_LANG = 'en';

    function normalizeLang(raw) {
        if (!raw || typeof raw !== 'string') return null;
        var clean = raw.trim().toLowerCase();
        if (clean.indexOf('es') === 0) return 'es';
        if (clean.indexOf('en') === 0) return 'en';
        return SUPPORTED_LANGS.indexOf(clean) !== -1 ? clean : null;
    }

    function detectInitialLang() {
        // 1. Prioridad máxima: sesión del usuario (viene de WEB_USERS)
        try {
            var sessionStr = localStorage.getItem('adkintor_session');
            if (sessionStr) {
                var session = JSON.parse(sessionStr);
                var sessionLang = normalizeLang(session.language || session.lang);
                if (sessionLang) return sessionLang;
            }
        } catch (e) {}

        // 2. Preferencia guardada localmente (útil en login antes de autenticar)
        try {
            var savedLang = normalizeLang(localStorage.getItem('adkintor_lang'));
            if (savedLang) return savedLang;
        } catch (e) {}

        // 3. Idioma del navegador (fallback inicial en login)
        try {
            var navLang = normalizeLang(navigator.language || navigator.userLanguage);
            if (navLang) return navLang;
        } catch (e) {}

        return DEFAULT_LANG;
    }

    var currentLang = detectInitialLang();

    function getDictValue(lang, key) {
        var dictAll = window.ADKINTOR_TRANSLATIONS || {};
        var dict = dictAll[lang];
        if (!dict || !key) return undefined;

        // Soporte directo por si la clave es plana
        if (Object.prototype.hasOwnProperty.call(dict, key)) {
            return dict[key];
        }

        // Búsqueda por ruta con puntos: "cal.title" -> dict.cal.title
        var parts = String(key).split('.');
        var current = dict;
        for (var i = 0; i < parts.length; i++) {
            if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, parts[i])) {
                current = current[parts[i]];
            } else {
                return undefined;
            }
        }
        return typeof current === 'string' ? current : undefined;
    }

    function interpolate(str, params) {
        if (!params || typeof params !== 'object') return str;
        return str.replace(/\{(\w+)\}/g, function (match, name) {
            return Object.prototype.hasOwnProperty.call(params, name) ? params[name] : match;
        });
    }

    function t(key, params) {
        var val = getDictValue(currentLang, key);
        if (val === undefined && currentLang !== DEFAULT_LANG) {
            val = getDictValue(DEFAULT_LANG, key);
        }
        if (val === undefined) {
            return key;
        }
        return interpolate(val, params);
    }

    /**
     * Traduce visualmente estados/valores fijos del sistema (Active, Closed, PASS, FAIL, etc.)
     * sin alterar el valor real guardado en Google Sheets.
     * Si el valor no está en el diccionario (ej. texto propio del cliente), lo devuelve intacto.
     */
    function tStatus(rawValue) {
        if (rawValue === null || rawValue === undefined || rawValue === '') return '';
        var str = String(rawValue).trim();
        var dictAll = window.ADKINTOR_TRANSLATIONS || {};
        var statusMap = (dictAll[currentLang] && dictAll[currentLang].status) || {};

        if (Object.prototype.hasOwnProperty.call(statusMap, str)) {
            return statusMap[str];
        }

        // Búsqueda insensible a mayúsculas/minúsculas
        var lower = str.toLowerCase();
        var keys = Object.keys(statusMap);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].toLowerCase() === lower) {
                return statusMap[keys[i]];
            }
        }

        return rawValue;
    }

    function applyTranslations(root) {
        var scope = root || document;
        if (!scope || !scope.querySelectorAll) return;

        // Texto plano
        scope.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (key) el.textContent = t(key);
        });

        // HTML interno (cuando contiene iconos o etiquetas <strong>)
        scope.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-html');
            if (key) el.innerHTML = t(key);
        });

        // Placeholder de inputs/textareas
        scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-placeholder');
            if (key) el.placeholder = t(key);
        });

        // Atributo title (tooltips)
        scope.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-title');
            if (key) el.title = t(key);
        });

        // Atributo value (botones input)
        scope.querySelectorAll('[data-i18n-value]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-value');
            if (key) el.value = t(key);
        });
    }

    function setLang(lang, persist) {
        var normalized = normalizeLang(lang) || DEFAULT_LANG;
        currentLang = normalized;

        if (persist !== false) {
            try {
                localStorage.setItem('adkintor_lang', normalized);
            } catch (e) {}
        }

        if (document && document.documentElement) {
            document.documentElement.lang = normalized;
        }

        applyTranslations(document);
        return currentLang;
    }

    function getLang() {
        return currentLang;
    }

    function getLocale() {
        return currentLang === 'es' ? 'es-ES' : 'en-US';
    }

    function formatDate(dateInput, options) {
        if (!dateInput) return '-';
        var d = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (isNaN(d.getTime())) return String(dateInput);
        return d.toLocaleDateString(getLocale(), options || {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Escuchar cambios de idioma enviados desde el padre (main.html -> iframe)
    window.addEventListener('message', function (event) {
        var data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'SET_LANGUAGE' && data.lang) {
            var next = normalizeLang(data.lang);
            if (next && next !== currentLang) {
                setLang(next, false);
                if (typeof window.onAdkintorLanguageChange === 'function') {
                    window.onAdkintorLanguageChange(next);
                }
            }
        }
    });

    // Aplicar idioma automáticamente al cargar el DOM
    function initOnReady() {
        if (document && document.documentElement) {
            document.documentElement.lang = currentLang;
        }
        applyTranslations(document);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOnReady);
    } else {
        initOnReady();
    }

    // Exposición pública
    window.I18n = {
        getLang: getLang,
        setLang: setLang,
        getLocale: getLocale,
        t: t,
        tStatus: tStatus,
        applyTranslations: applyTranslations,
        formatDate: formatDate
    };

    if (typeof window.t === 'undefined') {
        window.t = t;
    }
    if (typeof window.tStatus === 'undefined') {
        window.tStatus = tStatus;
    }
})();
