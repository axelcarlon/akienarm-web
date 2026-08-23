/* AKI ENARM · site.js — micro-interacciones del sitio (sesión 10).
   Reglas: solo transform/opacity animan; IntersectionObserver para todo lo
   diferido; prefers-reduced-motion desactiva contadores/tilt/parallax. */
(function () {
  'use strict';
  document.documentElement.classList.remove('sin-js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- tema: auto por sistema + toggle persistido ---------- */
  var raiz = document.documentElement;
  var CLAVE = 'aki_sitio_tema';
  function aplicaTema(t) {
    if (t === 'dark' || t === 'light') raiz.setAttribute('data-tema', t);
    else raiz.removeAttribute('data-tema');
  }
  try { aplicaTema(localStorage.getItem(CLAVE)); } catch (e) {}
  var temaBtn = document.getElementById('temaBtn');
  if (temaBtn) temaBtn.addEventListener('click', function () {
    var sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var actual = raiz.getAttribute('data-tema') || (sistemaOscuro ? 'dark' : 'light');
    var nuevo = actual === 'dark' ? 'light' : 'dark';
    aplicaTema(nuevo);
    try { localStorage.setItem(CLAVE, nuevo); } catch (e) {}
  });

  /* ---------- reveal por scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visto'); obs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { obs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visto'); });
  }

  /* ---------- contadores de cifras (una vez, al entrar en viewport) ---------- */
  var contadores = document.querySelectorAll('.contador');
  function formatea(n) { return n.toLocaleString('en-US'); }
  function anima(el) {
    var fin = parseInt(el.getAttribute('data-fin'), 10) || 0;
    if (reduceMotion) { el.textContent = formatea(fin); return; }
    var t0 = null, DUR = 1200;
    function paso(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / DUR, 1);
      var e = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      el.textContent = formatea(Math.round(fin * e));
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }
  if ('IntersectionObserver' in window) {
    var obsC = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { anima(en.target); obsC.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    contadores.forEach(function (el) { obsC.observe(el); });
  } else {
    contadores.forEach(function (el) { el.textContent = formatea(parseInt(el.getAttribute('data-fin'), 10) || 0); });
  }

  /* ---------- header sobre-hero + progreso + parallax del hero (un solo rAF) ---------- */
  var progreso = document.getElementById('progreso');
  var header = document.querySelector('header.site');
  var hayHero = !!document.querySelector('.hero');
  var nebulosa = document.getElementById('nebulosa');
  var akiWrap = document.getElementById('akiWrap');
  function pintaScroll() {
    marcado = false;
    var y = window.scrollY;
    if (progreso && !reduceMotion) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(y / h, 1) : 0;
      progreso.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    if (header && hayHero) header.classList.toggle('sobre-hero', y < 40);
    /* parallax por capas (solo mientras el hero esta en pantalla; transform-only) */
    if (hayHero && !reduceMotion && y < window.innerHeight * 1.2) {
      if (nebulosa) nebulosa.style.transform = 'translateY(' + (y * 0.10).toFixed(1) + 'px)';
      if (akiWrap) akiWrap.style.transform = 'translateY(' + (y * 0.22).toFixed(1) + 'px)';
    }
  }
  var marcado = false;
  window.addEventListener('scroll', function () {
    if (!marcado) { marcado = true; requestAnimationFrame(pintaScroll); }
  }, { passive: true });
  pintaScroll();

  /* ---------- nebulosa: fade-in al llegar ---------- */
  if (nebulosa) {
    if (nebulosa.complete && nebulosa.naturalWidth > 0) { nebulosa.classList.add('cargada'); }
    else { nebulosa.addEventListener('load', function () { nebulosa.classList.add('cargada'); }); }
  }

  /* ---------- resplandor que sigue el cursor (desktop fino, sin RM) ---------- */
  var cursorGlow = document.getElementById('cursorGlow');
  if (cursorGlow && !reduceMotion && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    var hero = document.querySelector('.hero');
    var glowMarco = null;
    hero.addEventListener('pointermove', function (ev) {
      if (glowMarco) return;
      glowMarco = requestAnimationFrame(function () {
        glowMarco = null;
        var r = hero.getBoundingClientRect();
        cursorGlow.style.transform = 'translate(' + (ev.clientX - r.left).toFixed(0) + 'px,' + (ev.clientY - r.top).toFixed(0) + 'px)';
      });
    });
  }

  /* ---------- tilt 3D sutil de los shots (solo puntero fino, sin RM) ---------- */
  if (!reduceMotion && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      var marco = null;
      el.style.transition = 'transform .25s cubic-bezier(.2,.85,.25,1)';
      el.addEventListener('pointermove', function (ev) {
        if (marco) return;
        marco = requestAnimationFrame(function () {
          marco = null;
          var r = el.getBoundingClientRect();
          var x = (ev.clientX - r.left) / r.width - 0.5;
          var y = (ev.clientY - r.top) / r.height - 0.5;
          el.style.transform = 'perspective(700px) rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 7).toFixed(2) + 'deg)';
        });
      });
      el.addEventListener('pointerleave', function () {
        if (marco) { cancelAnimationFrame(marco); marco = null; }
        el.style.transform = '';
      });
    });
  }

  /* ---------- video del cofre: carga y reproduce solo al verse ---------- */
  var video = document.getElementById('videoCofre');
  if (video) {
    var fuente = video.querySelector('source[data-src]');
    var cargado = false;
    function cargaVideo() {
      if (cargado || !fuente) return;
      cargado = true;
      fuente.src = fuente.getAttribute('data-src');
      video.load();
      if (!reduceMotion) { video.play().catch(function () {}); }
    }
    if ('IntersectionObserver' in window) {
      var obsV = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) { cargaVideo(); }
          else if (cargado && !video.paused) { video.pause(); }
          if (cargado && en.isIntersecting && video.paused && !reduceMotion) { video.play().catch(function () {}); }
        });
      }, { rootMargin: '120px 0px', threshold: 0.25 });
      obsV.observe(video);
    }
    /* con Reduce Motion el poster se queda quieto; un tap lo reproduce a mano */
    video.addEventListener('click', function () {
      cargaVideo();
      if (video.paused) { video.play().catch(function () {}); } else { video.pause(); }
    });
  }

  /* ---------- scroll suave del boton "Como instalarla" ---------- */
  var irInstalar = document.getElementById('irInstalar');
  if (irInstalar) irInstalar.addEventListener('click', function () {
    var destino = document.getElementById('instalar');
    if (destino) destino.scrollIntoView(reduceMotion ? {} : { behavior: 'smooth' });
  });
})();
