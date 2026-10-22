/* ADKINTOR — Language switcher
 * - Saves the user's language preference in localStorage
 * - Marks the active language link in the [🌐 ES | EN] selector
 * - Ensures html lang attribute matches the current folder (/es/ or /en/)
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'adkintor_lang';
  var path = window.location.pathname || '/';

  // Detect current language from the URL path: /es/... or /en/...
  var current = 'es';
  if (path.indexOf('/en/') === 0) {
    current = 'en';
  } else if (path.indexOf('/es/') === 0) {
    current = 'es';
  } else {
    // Fallback: use <html lang="..."> if the URL doesn't match
    var htmlLang = (document.documentElement.lang || '').toLowerCase();
    if (htmlLang.indexOf('en') === 0) current = 'en';
  }

  // 1. Save preference
  try {
    localStorage.setItem(STORAGE_KEY, current);
  } catch (e) {
    /* localStorage may be disabled (private mode, etc.) — fail silently */
  }

  // 2. Ensure <html lang> matches
  document.documentElement.lang = current;

  // 3. Mark the active language link
  var links = document.querySelectorAll('.lang-link');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    if (link.getAttribute('data-lang') === current) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'true');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  }
})();
