/* ============================================
   TaskFlow AI — Landing Page
   Robust smooth scroll: ignores prefers-reduced-motion
   for the scroll itself (user explicitly wants slow),
   uses direct scrollTop assignment (works everywhere
   including iOS Safari and Android Chrome).
   ============================================ */

(function () {
    'use strict';

    const progressBar = document.getElementById('scrollProgress');

    function setProgress(p) {
        if (progressBar) {
            progressBar.style.setProperty('--scroll-progress', (p * 100).toFixed(2) + '%');
        }
    }

    /* ------------------------------------------
       Universal rAF smooth scroll.
       Direct scrollTop assignment — bypasses
       browser's scrollTo quirks on mobile.
       ------------------------------------------ */
    function smoothScrollTo(targetY, duration) {
        duration = duration || 3000;

        // cancel previous animation if any
        if (smoothScrollTo._raf) {
            cancelAnimationFrame(smoothScrollTo._raf);
            smoothScrollTo._raf = null;
        }

        const startY = window.pageYOffset || document.documentElement.scrollTop;
        const distance = targetY - startY;

        if (Math.abs(distance) < 2) {
            document.documentElement.scrollTop = targetY;
            setProgress(1);
            return;
        }

        const startTime = performance.now();
        const scrollingElement = document.documentElement;

        function easeInOutQuart(t) {
            return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
        }

        setProgress(0);

        function step() {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeInOutQuart(progress);
            const y = Math.round(startY + distance * eased);

            // Direct assignment — bypasses scrollTo/clip conflicts
            scrollingElement.scrollTop = y;

            setProgress(progress);

            if (progress < 1) {
                smoothScrollTo._raf = requestAnimationFrame(step);
            } else {
                smoothScrollTo._raf = null;
                setTimeout(() => setProgress(0), 600);
            }
        }
        smoothScrollTo._raf = requestAnimationFrame(step);
    }

    /* ------------------------------------------
       Anchor links — slow smooth scroll
       ------------------------------------------ */
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

        const href = link.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const headerH = document.querySelector('.header');
        const offset = headerH ? headerH.offsetHeight : 72;
        const y = target.getBoundingClientRect().top +
                  (window.pageYOffset || document.documentElement.scrollTop) -
                  offset + 1;
        smoothScrollTo(y, 3000);
        if (history.pushState) history.pushState(null, '', href);
    });

    /* ------------------------------------------
       Burger menu — toggle class on <html>
       ------------------------------------------ */
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    const header = document.querySelector('.header');
    const root = document.documentElement;

    function setMenu(open) {
        root.classList.toggle('menu-open', open);
        burger.classList.toggle('is-active', open);

        if (open) {
            if (header) header.style.zIndex = '300';
        } else if (header) {
            setTimeout(() => {
                if (!root.classList.contains('menu-open')) {
                    header.style.zIndex = '';
                }
            }, 300);
        }

        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    }

    if (burger && nav) {
        burger.addEventListener('click', (e) => {
            e.stopPropagation();
            setMenu(!root.classList.contains('menu-open'));
        });

        nav.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) setMenu(false);
        });

        document.addEventListener('click', (e) => {
            if (!root.classList.contains('menu-open')) return;
            if (!nav.contains(e.target) && !burger.contains(e.target)) {
                setMenu(false);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && root.classList.contains('menu-open')) {
                setMenu(false);
                burger.focus();
            }
        });

        const mq = window.matchMedia('(min-width: 1101px)');
        const onMq = (ev) => {
            if (ev.matches && root.classList.contains('menu-open')) setMenu(false);
        };
        mq.addEventListener ? mq.addEventListener('change', onMq)
                            : mq.addListener(onMq);
    }

    /* ------------------------------------------
       Theme toggle — dark / light.
       The initial value is set by a tiny inline
       script in <head> (avoids a flash); here we
       sync the button, persist the choice and
       tint the theme-color meta.
       ------------------------------------------ */
    const themeToggle = document.getElementById('themeToggle');
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('taskflow-theme', theme);
        } catch (e) { /* private mode — keep in-memory only */ }
        if (themeColorMeta) {
            themeColorMeta.setAttribute(
                'content', theme === 'dark' ? '#0f172a' : '#6366f1'
            );
        }
        if (themeToggle) {
            const dark = theme === 'dark';
            themeToggle.setAttribute('aria-pressed', String(dark));
            themeToggle.setAttribute('aria-label', dark ? 'Перемкнути на світлу тему'
                                                        : 'Перемкнути на темну тему');
            themeToggle.setAttribute('title', dark ? 'Перемкнути на світлу тему'
                                                   : 'Перемкнути на темну тему');
        }
    }

    if (themeToggle) {
        const initial = root.getAttribute('data-theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(initial);
        themeToggle.addEventListener('click', () => {
            applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        });
    } else if (themeColorMeta && root.getAttribute('data-theme') === 'dark') {
        themeColorMeta.setAttribute('content', '#0f172a');
    }

    /* ------------------------------------------
       "Back to top" floating button.
       10-second cinematic slow scroll.
       ------------------------------------------ */
    const toTop = document.getElementById('toTop');
    if (toTop) {
        function scrollToTopSlow() {
            if (scrollToTopSlow._raf) {
                cancelAnimationFrame(scrollToTopSlow._raf);
                scrollToTopSlow._raf = null;
            }

            const startY = window.pageYOffset || document.documentElement.scrollTop;
            if (startY <= 0) return;

            const distance = startY;
            const duration = 5000;   // 5 seconds
            const startTime = performance.now();
            const scrollingElement = document.documentElement;

            toTop.classList.add('is-scrolling');
            setProgress(0);

            function easeInOutQuart(t) {
                return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
            }

            function step() {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeInOutQuart(progress);
                const y = Math.round(startY - distance * eased);
                scrollingElement.scrollTop = y;
                setProgress(progress);

                if (progress < 1) {
                    scrollToTopSlow._raf = requestAnimationFrame(step);
                } else {
                    scrollToTopSlow._raf = null;
                    toTop.classList.remove('is-scrolling');
                    setTimeout(() => setProgress(0), 600);
                }
            }
            scrollToTopSlow._raf = requestAnimationFrame(step);
        }

        toTop.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollToTopSlow();
        });

        const TO_TOP_THRESHOLD = 150;
        const updateToTop = () => {
            toTop.classList.toggle('is-visible', window.scrollY > TO_TOP_THRESHOLD);
        };
        updateToTop();
        window.addEventListener('scroll', updateToTop, { passive: true });
    }

    /* ------------------------------------------
       Header shadow on scroll
       ------------------------------------------ */
    if (header) {
        const onScroll = () => {
            header.classList.toggle('is-scrolled', window.scrollY > 8);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ------------------------------------------
       Animated counters in stats block
       ------------------------------------------ */
    const stats = document.querySelectorAll('.stat__num');
    if (stats.length && 'IntersectionObserver' in window) {
        const animate = (el) => {
            const target = parseInt(el.dataset.target, 10) || 0;
            const suffix = el.dataset.suffix || '';
            const duration = 1800;
            const startTime = performance.now();
            (function tick(now) {
                const t = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - t, 3);
                el.textContent = Math.round(target * eased).toLocaleString('uk-UA') + suffix;
                if (t < 1) requestAnimationFrame(tick);
            })(performance.now());
        };
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        stats.forEach(s => io.observe(s));
    }

    /* ------------------------------------------
       FAQ — accordion
       ------------------------------------------ */
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('toggle', () => {
            if (item.open) {
                faqItems.forEach(other => {
                    if (other !== item && other.open) other.open = false;
                });
            }
        });
    });

    /* ------------------------------------------
       CTA form — basic validation feedback
       ------------------------------------------ */
    const ctaForm = document.querySelector('.cta__form');
    if (ctaForm) {
        ctaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = ctaForm.querySelector('.cta__input');
            const btn = ctaForm.querySelector('button');
            if (!input || !input.value || !input.checkValidity()) {
                if (input) input.focus();
                return;
            }
            if (btn) {
                const original = btn.textContent;
                btn.textContent = 'Готово! Перевірте пошту ✨';
                btn.disabled = true;
                setTimeout(() => {
                    btn.textContent = original;
                    btn.disabled = false;
                    input.value = '';
                }, 3500);
            }
        });
    }

    /* ------------------------------------------
       Stories slider (Swiper)
       3 slides on desktop, 2 on tablets, 1 on mobile.
       Prev/next + dynamic pagination bullets.
       ------------------------------------------ */
    const storiesEl = document.querySelector('.stories__slider');
    if (storiesEl && typeof Swiper !== 'undefined') {
        /* eslint-disable no-undef */
        new Swiper(storiesEl, {
            slidesPerView: 1,
            spaceBetween: 20,
            grabCursor: true,
            loop: true,
            speed: 600,
            breakpoints: {
                // ≥640px: tablet — 2 slides
                640: { slidesPerView: 2, spaceBetween: 24 },
                // ≥1024px: desktop — 3 slides
                1024: { slidesPerView: 3, spaceBetween: 32 }
            },
            navigation: {
                prevEl: '.stories__nav--prev',
                nextEl: '.stories__nav--next'
            },
            pagination: {
                el: '.stories__pagination',
                clickable: true,
                dynamicBullets: true,
                dynamicMainBullets: 5
            },
            keyboard: { enabled: true, onlyInViewport: true },
            a11y: {
                enabled: true,
                prevSlideMessage: 'Попередній відгук',
                nextSlideMessage: 'Наступний відгук',
                paginationBulletMessage: 'Перейти до відгуку {{index}}'
            }
        });
        /* eslint-enable no-undef */
    }

    /* ------------------------------------------
       Timeline / Roadmap — staggered reveal
       on first scroll into view.
       ------------------------------------------ */
    const timelineItems = document.querySelectorAll('.timeline__item');
    if (timelineItems.length && 'IntersectionObserver' in window) {
        const revealTimeline = (entries) => {
            // Stagger items that appear together by their DOM order
            const visible = entries
                .filter(e => e.isIntersecting)
                .sort((a, b) =>
                    Array.prototype.indexOf.call(timelineItems, a.target) -
                    Array.prototype.indexOf.call(timelineItems, b.target)
                );
            visible.forEach((entry, i) => {
                setTimeout(() => entry.target.classList.add('is-visible'), i * 120);
                io.unobserve(entry.target);
            });
        };
        const io = new IntersectionObserver(revealTimeline, {
            threshold: 0.2,
            rootMargin: '0px 0px -40px 0px'
        });
        timelineItems.forEach(item => io.observe(item));
    } else {
        // No IO support — just show everything
        timelineItems.forEach(item => item.classList.add('is-visible'));
    }

    /* ------------------------------------------
       Modal — open/close (Hero "Замовити демо")
       Handles: triggers, backdrop click, close button,
       Escape key, focus trap & return, body scroll lock,
       basic form validation feedback.
       ------------------------------------------ */
    const modals = document.querySelectorAll('.modal');
    if (modals.length) {
        let lastFocused = null;

        const focusableSelector = [
            'a[href]', 'button:not([disabled])',
            'input:not([disabled])', 'select:not([disabled])',
            'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
        ].join(',');

        function getFocusable(modal) {
            return Array.prototype.slice
                .call(modal.querySelectorAll(focusableSelector))
                .filter(el => el.offsetParent !== null || el === document.activeElement);
        }

        function openModal(id) {
            const modal = document.getElementById(id);
            if (!modal) return;
            lastFocused = document.activeElement;
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            root.classList.add('modal-open');

            const focusables = getFocusable(modal);
            if (focusables.length) focusables[0].focus();
        }

        function closeModal(modal) {
            if (!modal) return;
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');

            // Only unlock scroll if no other modal is open
            if (!document.querySelector('.modal.is-open')) {
                root.classList.remove('modal-open');
            }

            const success = modal.querySelector('.modal__success');
            const form = modal.querySelector('form');
            if (success) success.hidden = true;
            if (form) {
                form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
            }

            if (lastFocused && typeof lastFocused.focus === 'function') {
                lastFocused.focus();
            }
            lastFocused = null;
        }

        // Open triggers
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-modal-open]');
            if (trigger) {
                e.preventDefault();
                openModal(trigger.getAttribute('data-modal-open'));
                return;
            }
            // Close triggers (backdrop, X button)
            const closer = e.target.closest('[data-modal-close]');
            if (closer) {
                e.preventDefault();
                const modal = closer.closest('.modal');
                closeModal(modal);
            }
        });

        // Escape key + focus trap
        document.addEventListener('keydown', (e) => {
            const openOne = document.querySelector('.modal.is-open');
            if (!openOne) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                closeModal(openOne);
                return;
            }

            if (e.key === 'Tab') {
                const focusables = getFocusable(openOne);
                if (!focusables.length) return;
                const first = focusables[0];
                const last  = focusables[focusables.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        // Demo form — simple inline validation + fake submit
        const demoForm = document.getElementById('demoForm');
        if (demoForm) {
            demoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let valid = true;
                demoForm.querySelectorAll('input[required]').forEach(input => {
                    const isCheck = input.type === 'checkbox';
                    const ok = isCheck ? input.checked : input.checkValidity();
                    input.classList.toggle('is-invalid', !ok);
                    if (!ok) valid = false;
                });
                if (!valid) {
                    const firstBad = demoForm.querySelector('.is-invalid');
                    if (firstBad) firstBad.focus();
                    return;
                }
                const success = demoForm.querySelector('.modal__success');
                const submit = demoForm.querySelector('button[type="submit"]');
                if (success) success.hidden = false;
                if (submit) {
                    submit.disabled = true;
                    submit.textContent = 'Заявку надіслано ✓';
                }
                demoForm.querySelectorAll('input').forEach(i => { if (i.type !== 'checkbox') i.value = ''; });
            });
        }

        /* ------------------------------------------
           Contacts form — validation + fake submit
           ------------------------------------------ */
        const contactsForm = document.getElementById('contactsForm');
        if (contactsForm) {
            contactsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let valid = true;
                contactsForm
                    .querySelectorAll('input[required], textarea[required]')
                    .forEach(input => {
                        const ok = input.checkValidity();
                        input.classList.toggle('is-invalid', !ok);
                        if (!ok) valid = false;
                    });
                if (!valid) {
                    const firstBad = contactsForm.querySelector('.is-invalid');
                    if (firstBad) firstBad.focus();
                    return;
                }
                const success = contactsForm.querySelector('.contacts__success');
                const submit = contactsForm.querySelector('button[type="submit"]');
                if (success) success.hidden = false;
                if (submit) {
                    submit.disabled = true;
                    submit.textContent = 'Надіслано ✓';
                }
                contactsForm
                    .querySelectorAll('input, textarea')
                    .forEach(i => { i.value = ''; });
            });
        }
    }
    /* ------------------------------------------
       Showcase tabs — accessible tablist.
       Click / ArrowLeft / ArrowRight / Home / End.
       ------------------------------------------ */
    const tabsRoot = document.querySelector('[data-tabs]');
    if (tabsRoot) {
        const tabs = Array.prototype.slice.call(
            tabsRoot.querySelectorAll('[role="tab"]')
        );
        const panels = Array.prototype.slice.call(
            tabsRoot.querySelectorAll('[role="tabpanel"]')
        );

        function activateTab(tab, focus) {
            tabs.forEach(t => {
                const selected = t === tab;
                t.classList.toggle('is-active', selected);
                t.setAttribute('aria-selected', String(selected));
                t.tabIndex = selected ? 0 : -1;
            });
            panels.forEach(p => {
                const show = p.id === tab.getAttribute('aria-controls');
                p.classList.toggle('is-active', show);
                if (show) {
                    p.removeAttribute('hidden');
                } else {
                    p.setAttribute('hidden', '');
                }
            });
            if (focus) tab.focus();
        }

        tabs.forEach((tab, i) => {
            tab.addEventListener('click', () => activateTab(tab, false));
            tab.addEventListener('keydown', (e) => {
                let next = null;
                if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
                else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
                else if (e.key === 'Home') next = tabs[0];
                else if (e.key === 'End') next = tabs[tabs.length - 1];
                if (next) {
                    e.preventDefault();
                    activateTab(next, true);
                }
            });
        });
    }
})();
