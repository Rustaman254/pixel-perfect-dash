(function() {
    // Watchtower - Autonomous Behavioral Crawler
    const scriptTag = document.currentScript || Array.from(document.querySelectorAll('script')).find(s => s.src.includes('watchtower.js'));
    const backendUrl = scriptTag ? new URL(scriptTag.src).origin : 'https://sokostack.ddns.net';
    const ENDPOINT = `${backendUrl}/api/watchtower/ingest`;

    const CONFIG = {
        endpoint: ENDPOINT,
        batchInterval: 5000,
        rageClickThreshold: 3,
        rageClickTime: 2000,
        rageClickDistance: 100,
        dwellThreshold: 1000,
        mouseThrottle: 500
    };

    let events = [];
    let sessionId = sessionStorage.getItem('watchtower_sid') || generateId();
    sessionStorage.setItem('watchtower_sid', sessionId);

    let lastClicks = [];
    let lastScrollDepth = 0;
    let dwellStart = null;
    let dwellTarget = null;
    let recordRrweb = false;

    function generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    function trackEvent(type, data) {
        events.push({
            type,
            target: typeof data?.target === 'string' ? data.target : null,
            data: JSON.stringify(data),
            timestamp: new Date().toISOString(),
            url: window.location.href,
            path: window.location.pathname
        });
    }

    function getFeatureIdentity(el) {
        if (!el) return null;
        let text = el.innerText?.trim().substring(0, 30);
        if (el.type === 'password' || el.type === 'email') {
            text = '***masked***';
        }
        const role = el.getAttribute('role');
        const aria = el.getAttribute('aria-label');
        const id = el.id;
        const name = el.getAttribute('name');
        if (aria) return aria;
        if (id) return '#' + id;
        if (name) return '[name="' + name + '"]';
        if (text && el.tagName !== 'INPUT') return text;
        if (role) return '[' + role + ']';
        return el.tagName + (el.className ? '.' + el.className.split(' ')[0] : '');
    }

    function sendData() {
        if (events.length === 0) return;

        const payload = {
            session: {
                sessionId,
                projectId: window.watchtowerProjectId || 'default',
                browser: getBrowserInfo(),
                os: getOSInfo(),
                device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                screenW: window.screen.width,
                screenH: window.screen.height
            },
            events: [...events]
        };

        events = [];

        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
            navigator.sendBeacon(CONFIG.endpoint, blob);
        } else {
            fetch(CONFIG.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload),
                keepalive: true
            }).catch(err => console.debug('Watchtower drop:', err));
        }
    }

    function getBrowserInfo() {
        const ua = navigator.userAgent;
        if (ua.indexOf("Firefox") > -1) return "Firefox";
        if (ua.indexOf("SamsungBrowser") > -1) return "Samsung Internet";
        if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) return "Opera";
        if (ua.indexOf("Trident") > -1) return "IE";
        if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) return "Edge";
        if (ua.indexOf("Chrome") > -1) return "Chrome";
        if (ua.indexOf("Safari") > -1) return "Safari";
        return "Unknown";
    }

    function getOSInfo() {
        const p = navigator.platform;
        const ua = navigator.userAgent;
        if (p.indexOf("Win") > -1) return "Windows";
        if (p.indexOf("Mac") > -1) return "MacOS";
        if (p.indexOf("Linux") > -1 && !/Android/.test(ua)) return "Linux";
        if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
        if (/Android/.test(ua)) return "Android";
        return "Unknown";
    }

    function init() {
        trackEvent('pageview', { title: document.title, referrer: document.referrer });

        const rrwebScript = document.createElement('script');
        rrwebScript.src = "https://cdn.jsdelivr.net/npm/rrweb@2.0.0-alpha.11/dist/rrweb.min.js";
        rrwebScript.onload = () => {
            if (window.rrweb && typeof window.rrweb.record === 'function') {
                recordRrweb = true;
                window.rrweb.record({
                    emit(event) {
                        trackEvent('rrweb_event', event);
                    },
                    packFn: window.rrweb.pack,
                    recordCanvas: true,
                    sampling: {
                        mousemove: false,
                        mouseInteraction: true,
                        scroll: 150,
                        input: 'last'
                    },
                    maskInputOptions: {
                        password: true,
                        email: true,
                    }
                });
            }
        };
        document.head.appendChild(rrwebScript);

        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, a, input[type="submit"], [role="button"]');
            const targetId = getFeatureIdentity(target || e.target);
            trackEvent('click', {
                x: e.clientX,
                y: e.clientY,
                target: targetId,
                isFeature: !!target
            });
            detectRageClick(e.clientX, e.clientY, targetId);
        }, true);

        document.addEventListener('change', (e) => {
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
                const targetId = getFeatureIdentity(target);
                trackEvent('input', {
                    target: targetId,
                    type: target.type,
                    maskedLength: target.value?.length || 0
                });
            }
        }, true);

        document.addEventListener('submit', (e) => {
            const targetId = getFeatureIdentity(e.target);
            trackEvent('submit', { target: targetId });
        }, true);

        let lastMouseTime = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastMouseTime > CONFIG.mouseThrottle) {
                lastMouseTime = now;
                trackEvent('mousemove', { x: e.clientX, y: e.clientY });
            }
        }, { passive: true });

        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('button, a, [role="button"]');
            if (target) {
                dwellTarget = getFeatureIdentity(target);
                dwellStart = Date.now();
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (dwellStart && dwellTarget) {
                const duration = Date.now() - dwellStart;
                if (duration > CONFIG.dwellThreshold) {
                    trackEvent('dwell', { target: dwellTarget, duration });
                }
                dwellStart = null;
                dwellTarget = null;
            }
        });

        window.addEventListener('scroll', () => {
            const scrollHeight = document.documentElement.scrollHeight;
            if (scrollHeight === 0) return;
            const scrollPercent = Math.round((window.scrollY + window.innerHeight) / scrollHeight * 100);
            if (scrollPercent >= lastScrollDepth + 25) {
                lastScrollDepth = Math.floor(scrollPercent / 25) * 25;
                trackEvent('scroll', { depth: lastScrollDepth });
            }
        }, { passive: true });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                trackEvent('resize', { w: window.innerWidth, h: window.innerHeight });
            }, 500);
        });

        const originalPushState = history.pushState;
        history.pushState = function() {
            originalPushState.apply(this, arguments);
            trackEvent('pageview', { title: document.title, trigger: 'pushState' });
        };
        const originalReplaceState = history.replaceState;
        history.replaceState = function() {
            originalReplaceState.apply(this, arguments);
            trackEvent('pageview', { title: document.title, trigger: 'replaceState' });
        };
        window.addEventListener('popstate', () => {
            trackEvent('pageview', { title: document.title, trigger: 'popstate' });
        });

        setInterval(sendData, CONFIG.batchInterval);
        window.addEventListener('beforeunload', sendData);
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') sendData();
        });
    }

    function detectRageClick(x, y, targetId) {
        const now = Date.now();
        lastClicks.push({ x, y, time: now, target: targetId });
        lastClicks = lastClicks.filter(c => now - c.time < CONFIG.rageClickTime);
        if (lastClicks.length >= CONFIG.rageClickThreshold) {
            const first = lastClicks[0];
            const dist = Math.sqrt(Math.pow(x - first.x, 2) + Math.pow(y - first.y, 2));
            if (dist < CONFIG.rageClickDistance) {
                trackEvent('rage_click', { count: lastClicks.length, x, y, target: targetId });
                lastClicks = [];
            }
        }
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();
