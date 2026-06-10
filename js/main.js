const isMobile = () => matchMedia('(max-width:900px)').matches;

/* ════ marquee loop ════ */
const mq = document.getElementById('mq');
mq.innerHTML += mq.innerHTML;

/* ════ mobile menu ════ */
const burger = document.getElementById('burger'),
    menu = document.getElementById('mobile-menu');
function toggleMenu(force) {
    const open = force !== undefined ? force : !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
}
burger.addEventListener('click', () => toggleMenu());
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

/* ════ nav background on scroll ════ */
const navEl = document.getElementById('nav');

/* ════ build the winding SVG spine ════ */
const spine = document.getElementById('spine'),
    ghost = document.getElementById('ghostPath'),
    draw = document.getElementById('drawPath'),
    dot = document.getElementById('dotHead');
let pathLen = 0;

function buildSpine() {
    const H = document.documentElement.scrollHeight;
    const W = Math.min(innerWidth, 1400);
    spine.setAttribute('width', W);
    spine.setAttribute('height', H);
    const step = innerHeight * 1.1;
    // gentler curve on mobile so the line stays out of the way
    const amp = isMobile() ? 0.46 : 0.32;
    let d = `M ${W * 0.5} 0`;
    let side = 1;
    for (let y = step; y < H + step; y += step) {
        const x = W * (0.5 + amp * side);
        d += ` C ${W * 0.5} ${y - step * 0.5}, ${x} ${y - step * 0.5}, ${x} ${y}`;
        side *= -1;
    }
    ghost.setAttribute('d', d);
    draw.setAttribute('d', d);
    pathLen = draw.getTotalLength();
    draw.style.strokeDasharray = pathLen;
    draw.style.strokeDashoffset = pathLen;
}

/* ════ master scroll handler ════ */
let ticking = false;
function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        const p = max > 0 ? scrollY / max : 0;

        document.getElementById('progress').style.width = (p * 100) + '%';
        navEl.classList.toggle('scrolled', scrollY > 40);

        const drawn = pathLen * p;
        draw.style.strokeDashoffset = pathLen - drawn;
        if (pathLen) {
            const pt = draw.getPointAtLength(drawn);
            dot.setAttribute('cx', pt.x);
            dot.setAttribute('cy', pt.y);
        }

        // parallax: desktop only (saves battery + avoids jank on touch scroll)
        if (!isMobile()) {
            document.querySelectorAll('.plx').forEach(img => {
                const r = img.getBoundingClientRect();
                const center = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
                img.style.transform = `scale(1.18) translateY(${center * -img.dataset.speed}px)`;
            });
        }

        ticking = false;
    });
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => {
    document.querySelectorAll('.plx').forEach(img => img.style.transform = '');
    buildSpine(); onScroll();
});
addEventListener('load', () => { buildSpine(); onScroll(); });
buildSpine();

/* ════ reveal observer ════ */
const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('in');
}), { threshold: isMobile() ? .08 : .15, rootMargin: '0px 0px -5% 0px' });
document.querySelectorAll('.rv,.rv-l,.rv-r,.proj').forEach(el => io.observe(el));

/* ════ animated counters ════ */
const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, t0 = performance.now();
    (function tick(t) {
        const k = Math.min((t - t0) / 1400, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + '+';
        if (k < 1) requestAnimationFrame(tick);
    })(t0);
    cio.unobserve(el);
}), { threshold: .6 });
document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));