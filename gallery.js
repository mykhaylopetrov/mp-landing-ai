/* ============================================
   TaskFlow AI — Gallery Lightbox init
   Uses the GLightbox library (local copy in
   vendor/glightbox, no jQuery, no CDN).
   All `a.glightbox` links with the same
   `data-gallery` value form one navigable set.
   Captions come from `data-title`.
   This file only configures the library.
   ============================================ */

(function () {
    'use strict';

    if (typeof GLightbox === 'undefined') return;

    /* eslint-disable no-undef */
    GLightbox({
        selector: '.glightbox',
        touchNavigation: true,
        loop: true,
        closeOnOutsideClick: true,
        openEffect: 'zoom',
        closeEffect: 'fade',
        slideEffect: 'slide',
        moreText: 'Показати більше',
        descPosition: 'bottom'
    });
    /* eslint-enable no-undef */
})();
