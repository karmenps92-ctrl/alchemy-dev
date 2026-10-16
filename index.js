document.addEventListener('DOMContentLoaded', () => {
  const pageLoadedAt = Date.now();

  class SoundController {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    playTone(freq = 440, type = 'sine', duration = 0.06, gainVal = 0.025, slideFreq = null) {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slideFreq) {
          osc.frequency.exponentialRampToValueAtTime(slideFreq, now + duration);
        }
        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {}
    }

    click() {
      this.playTone(520, 'triangle', 0.06, 0.025, 260);
    }

    switchTheme() {
      this.playTone(330, 'sine', 0.16, 0.03, 660);
      setTimeout(() => this.playTone(495, 'triangle', 0.2, 0.025, 990), 65);
    }

    success() {
      this.playTone(440, 'sine', 0.08, 0.025, 587.33);
      setTimeout(() => this.playTone(587.33, 'sine', 0.14, 0.03, 880), 80);
    }
  }

  const sfx = new SoundController();
  const sfxBtn = document.getElementById('sfx-toggle-btn');
  if (sfxBtn) {
    sfxBtn.addEventListener('click', () => {
      sfx.enabled = !sfx.enabled;
      sfxBtn.classList.toggle('active', sfx.enabled);
      sfxBtn.setAttribute('aria-pressed', String(sfx.enabled));
      if (sfx.enabled) sfx.success();
    });
  }

  const THEMES = [
    { id: 'void', name: 'Obsidian Violet', primary: '#8b5cf6', secondary: '#06b6d4', rgb: [139, 92, 246] },
    { id: 'crimson', name: 'Crimson Red', primary: '#f43f5e', secondary: '#fbbf24', rgb: [244, 63, 94] },
    { id: 'matrix', name: 'Emerald Terminal', primary: '#10b981', secondary: '#22d3ee', rgb: [16, 185, 129] },
    { id: 'aurum', name: 'Solar Gold', primary: '#f59e0b', secondary: '#c084fc', rgb: [245, 158, 11] }
  ];
  let currentThemeIdx = 0;

  function applyTheme(indexOrId) {
    if (typeof indexOrId === 'string') {
      const found = THEMES.findIndex(t => t.id === indexOrId);
      if (found !== -1) currentThemeIdx = found;
    } else {
      currentThemeIdx = indexOrId % THEMES.length;
    }
    const theme = THEMES[currentThemeIdx];
    document.documentElement.setAttribute('data-theme', theme.id);
    sfx.switchTheme();
    drawSkillsRadar();
  }

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      applyTheme(currentThemeIdx + 1);
    });
  }

  const scrollProgress = document.createElement('div');
  scrollProgress.className = 'scroll-progress';
  document.body.prepend(scrollProgress);

  const header = document.getElementById('header');
  function handleScroll() {
    const scrollTop = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = `${scrollPercent}%`;
    if (header) {
      header.classList.toggle('scrolled', scrollTop > 40);
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hudCoords = document.getElementById('hud-coords');
  const hudFps = document.getElementById('hud-fps');

  if (!isTouchDevice && window.innerWidth > 968) {
    const cursorGlow = document.createElement('div');
    cursorGlow.className = 'cursor-glow';
    document.body.appendChild(cursorGlow);

    const TRAIL_COUNT = 7;
    const trails = [];
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.width = `${6 - i * 0.6}px`;
      trail.style.height = `${6 - i * 0.6}px`;
      document.body.appendChild(trail);
      trails.push({ el: trail, x: 0, y: 0 });
    }

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorGlow.style.opacity = '1';
      trails.forEach((t, idx) => {
        t.el.style.opacity = String(0.55 - idx * 0.06);
      });
      if (hudCoords) {
        hudCoords.textContent = `X:${String(mouseX).padStart(4, '0')} Y:${String(mouseY).padStart(4, '0')}`;
      }
    });

    document.addEventListener('mouseleave', () => {
      cursorGlow.style.opacity = '0';
      trails.forEach(t => t.el.style.opacity = '0');
    });

    function animateCursor() {
      glowX += (mouseX - glowX) * 0.14;
      glowY += (mouseY - glowY) * 0.14;
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';

      let prevX = mouseX, prevY = mouseY;
      trails.forEach((t, i) => {
        const speed = 0.2 - i * 0.018;
        t.x += (prevX - t.x) * speed;
        t.y += (prevY - t.y) * speed;
        t.el.style.left = t.x + 'px';
        t.el.style.top = t.y + 'px';
        prevX = t.x;
        prevY = t.y;
      });

      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

  document.querySelectorAll('.spotlight-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  });

  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    let ripples = [];
    const maxParticles = 75;
    let mouse = { x: null, y: null, radius: 170 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    window.addEventListener('click', (e) => {
      if (e.target.closest('button, a, input, select, textarea, .modal-container, .cmd-box')) return;
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 5,
        maxRadius: 250,
        alpha: 0.7
      });
      sfx.click();
    });

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    }
    window.addEventListener('resize', resizeCanvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
      constructor(x, y, dirX, dirY, size, opacity) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.size = size;
        this.baseSize = size;
        this.opacity = opacity;
      }

      draw(rgb) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${this.opacity})`;
        ctx.fill();
      }

      update(rgb) {
        if (this.x > canvas.width || this.x < 0) this.dirX = -this.dirX;
        if (this.y > canvas.height || this.y < 0) this.dirY = -this.dirY;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius && dist > 0) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 2.5;
            this.y -= (dy / dist) * force * 2.5;
            this.size = this.baseSize + force * 1.8;
          } else {
            this.size += (this.baseSize - this.size) * 0.05;
          }
        }

        for (let r of ripples) {
          const dx = this.x - r.x;
          const dy = this.y - r.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (Math.abs(dist - r.radius) < 35 && dist > 0) {
            this.x += (dx / dist) * 4;
            this.y += (dy / dist) * 4;
          }
        }

        this.x += this.dirX;
        this.y += this.dirY;
        this.draw(rgb);
      }
    }

    function initParticles() {
      particlesArray = [];
      const num = Math.min(maxParticles, Math.floor((canvas.width * canvas.height) / 18000));
      for (let i = 0; i < num; i++) {
        const size = Math.random() * 2 + 0.9;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const dirX = (Math.random() - 0.5) * 0.4;
        const dirY = (Math.random() - 0.5) * 0.4;
        const opacity = Math.random() * 0.35 + 0.15;
        particlesArray.push(new Particle(x, y, dirX, dirY, size, opacity));
      }
    }

    function connectParticles(rgb) {
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const dist = dx * dx + dy * dy;
          if (dist < 15000) {
            const opacity = (1 - dist / 15000) * 0.14;
            ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    }

    let isAnimationRunning = true;
    let lastFpsTime = performance.now();
    let frameCount = 0;

    function animateCanvas(now) {
      if (!isAnimationRunning) return;
      frameCount++;
      if (now - lastFpsTime >= 1000) {
        if (hudFps) hudFps.textContent = String(Math.min(60, frameCount));
        frameCount = 0;
        lastFpsTime = now;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rgb = THEMES[currentThemeIdx].rgb;

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update(rgb);
      }
      connectParticles(rgb);

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 6;
        r.alpha *= 0.94;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${r.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (r.radius > r.maxRadius || r.alpha < 0.02) {
          ripples.splice(i, 1);
        }
      }

      requestAnimationFrame(animateCanvas);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isAnimationRunning = false;
      } else if (!isAnimationRunning) {
        isAnimationRunning = true;
        requestAnimationFrame(animateCanvas);
      }
    });

    initParticles();
    requestAnimationFrame(animateCanvas);
  }

  const CIPHER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}';
  function scrambleText(el) {
    const original = el.getAttribute('data-value') || el.textContent;
    if (el.dataset.scrambling === 'true') return;
    el.dataset.scrambling = 'true';
    let iteration = 0;
    const interval = setInterval(() => {
      el.textContent = original
        .split('')
        .map((char, idx) => {
          if (char === ' ') return ' ';
          if (idx < iteration) return original[idx];
          return CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
        })
        .join('');
      if (iteration >= original.length) {
        clearInterval(interval);
        el.textContent = original;
        el.dataset.scrambling = 'false';
      }
      iteration += 0.5;
    }, 24);
  }

  document.querySelectorAll('.cipher-title').forEach(el => {
    el.addEventListener('mouseenter', () => scrambleText(el));
  });

  const codeElement = document.getElementById('typed-code');
  const termTabs = document.querySelectorAll('.term-tab');
  const termBodyCode = document.getElementById('terminal-body-code');
  const termBodyCli = document.getElementById('terminal-body-cli');
  const termRunBtn = document.getElementById('term-run-btn');
  const consoleLog = document.getElementById('console-log');
  const consoleStatus = document.getElementById('console-status');

  const CODE_SNIPPETS = {
    core: {
      status: 'TS_NODE v22.4 • 0.3ms',
      output: '[OK] Compilación limpia: 21 sistemas registrados | Latencia: 0.3ms | Estado: Producción.',
      tokens: [
        { text: '// Configuración de Arquitectura AlchemyDev\n', cls: 'syn-comment' },
        { text: 'const ', cls: 'syn-keyword' },
        { text: 'systemConfig', cls: 'syn-variable' },
        { text: ' = {\n', cls: 'syn-bracket' },
        { text: '  engineer', cls: 'syn-property' },
        { text: ': ', cls: '' },
        { text: "'AlchemyDev'", cls: 'syn-string' },
        { text: ',\n  coreStack', cls: 'syn-property' },
        { text: ': [', cls: 'syn-bracket' },
        { text: "'Rust'", cls: 'syn-string' },
        { text: ', ', cls: '' },
        { text: "'Luau'", cls: 'syn-string' },
        { text: ', ', cls: '' },
        { text: "'Python'", cls: 'syn-string' },
        { text: ', ', cls: '' },
        { text: "'TypeScript'", cls: 'syn-string' },
        { text: '],\n', cls: 'syn-bracket' },
        { text: '  securityLayer', cls: 'syn-property' },
        { text: ': ', cls: '' },
        { text: "'AES-256 & Server Validation'", cls: 'syn-string' },
        { text: ',\n  available', cls: 'syn-property' },
        { text: ': ', cls: '' },
        { text: 'true\n', cls: 'syn-boolean' },
        { text: '};\n\n', cls: 'syn-bracket' },
        { text: 'await ', cls: 'syn-keyword' },
        { text: 'initializeCluster', cls: 'syn-function' },
        { text: '(systemConfig);', cls: 'syn-bracket' }
      ]
    },
    luau: {
      status: 'LUAU_VM v0.648 • 60 FPS',
      output: '[OK] Knit Server iniciado | DataStore sincronizado | Validación Anti-Exploit activa.',
      tokens: [
        { text: '-- Arquitectura Cliente-Servidor en Roblox Luau\n', cls: 'syn-comment' },
        { text: 'local ', cls: 'syn-keyword' },
        { text: 'Knit = ', cls: '' },
        { text: 'require', cls: 'syn-function' },
        { text: '(ReplicatedStorage.Packages.Knit)\n\n', cls: 'syn-bracket' },
        { text: 'local ', cls: 'syn-keyword' },
        { text: 'NetworkGuard = Knit.', cls: '' },
        { text: 'CreateService', cls: 'syn-function' },
        { text: '({\n', cls: 'syn-bracket' },
        { text: '  Name = ', cls: 'syn-property' },
        { text: '"NetworkGuard"', cls: 'syn-string' },
        { text: ',\n  StrictValidation = ', cls: 'syn-property' },
        { text: 'true\n', cls: 'syn-boolean' },
        { text: '})\n\n', cls: 'syn-bracket' },
        { text: 'function ', cls: 'syn-keyword' },
        { text: 'NetworkGuard:KnitStart', cls: 'syn-function' },
        { text: '()\n  print(', cls: 'syn-bracket' },
        { text: '"Servidor validado a 60Hz"', cls: 'syn-string' },
        { text: ')\nend', cls: 'syn-keyword' }
      ]
    },
    rust: {
      status: 'CARGO / RUSTC 1.82 • NATIVO',
      output: '[OK] Binario Tauri compilado | Memoria base: 14.2 MB | Cifrado de bloques verificado.',
      tokens: [
        { text: '// Módulo de Cifrado Local en Rust & Tauri\n', cls: 'syn-comment' },
        { text: 'use ', cls: 'syn-keyword' },
        { text: 'aes_gcm::{Aes256Gcm, KeyInit};\n\n', cls: 'syn-variable' },
        { text: '#[tauri::command]\n', cls: 'syn-property' },
        { text: 'pub fn ', cls: 'syn-keyword' },
        { text: 'seal_vault_block', cls: 'syn-function' },
        { text: '(payload: &[u8]) -> ', cls: 'syn-bracket' },
        { text: 'Result', cls: 'syn-variable' },
        { text: '<Vec<u8>, String> {\n', cls: 'syn-bracket' },
        { text: '  let ', cls: 'syn-keyword' },
        { text: 'cipher = Aes256Gcm::', cls: '' },
        { text: 'new_from_slice', cls: 'syn-function' },
        { text: '(KEY_BYTES);\n', cls: 'syn-bracket' },
        { text: '  Ok', cls: 'syn-function' },
        { text: '(cipher.encrypt(payload))\n}', cls: 'syn-bracket' }
      ]
    }
  };

  let activeTab = 'core';
  let typingTimer = null;

  function renderCodeSnippet(tabKey, animate = true) {
    if (!codeElement) return;
    clearTimeout(typingTimer);
    codeElement.replaceChildren();
    const snippet = CODE_SNIPPETS[tabKey];
    if (!snippet) return;

    if (consoleStatus) consoleStatus.textContent = snippet.status;

    if (!animate) {
      snippet.tokens.forEach(token => {
        const span = document.createElement('span');
        if (token.cls) span.className = token.cls;
        span.textContent = token.text;
        codeElement.appendChild(span);
      });
      return;
    }

    let tokenIdx = 0;
    let charIdx = 0;

    function typeNext() {
      if (tokenIdx >= snippet.tokens.length) return;
      const token = snippet.tokens[tokenIdx];
      if (charIdx < token.text.length) {
        let span = codeElement.lastElementChild;
        if (!span || span.className !== (token.cls || '')) {
          span = document.createElement('span');
          if (token.cls) span.className = token.cls;
          codeElement.appendChild(span);
        }
        span.textContent += token.text.charAt(charIdx);
        charIdx++;
        const ch = token.text.charAt(charIdx - 1);
        typingTimer = setTimeout(typeNext, ch === '\n' ? 35 : 10);
      } else {
        tokenIdx++;
        charIdx = 0;
        typingTimer = setTimeout(typeNext, 4);
      }
    }
    typeNext();
  }

  termTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      activeTab = targetTab;
      termTabs.forEach(t => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      sfx.click();

      if (targetTab === 'cli') {
        if (termBodyCode) termBodyCode.style.display = 'none';
        if (termBodyCli) termBodyCli.style.display = 'flex';
        document.getElementById('cli-input')?.focus();
      } else {
        if (termBodyCli) termBodyCli.style.display = 'none';
        if (termBodyCode) termBodyCode.style.display = 'flex';
        renderCodeSnippet(targetTab, true);
      }
    });
  });

  if (termRunBtn) {
    termRunBtn.addEventListener('click', () => {
      sfx.success();
      if (activeTab === 'cli') {
        executeCliCommand('projects');
        return;
      }
      renderCodeSnippet(activeTab, false);
      const snippet = CODE_SNIPPETS[activeTab];
      if (consoleLog && snippet) {
        consoleLog.innerHTML = `<span style="color:#34d399;">${snippet.output}</span>`;
      }
    });
  }

  setTimeout(() => renderCodeSnippet('core', true), 450);

  const cliInput = document.getElementById('cli-input');
  const cliOutput = document.getElementById('cli-output');

  function appendCliLine(text, cls = 'info') {
    if (!cliOutput) return;
    const div = document.createElement('div');
    div.className = `cli-line ${cls}`;
    div.textContent = text;
    cliOutput.appendChild(div);
    cliOutput.scrollTop = cliOutput.scrollHeight;
  }

  function executeCliCommand(rawCmd) {
    const cmd = (rawCmd || '').trim().toLowerCase();
    if (!cmd) return;
    appendCliLine(`alchemy@dev:~$ ${rawCmd}`, 'cmd');
    sfx.click();

    switch (cmd) {
      case 'help':
        appendCliLine('Comandos disponibles: stack, projects, theme, quote, whoami, clear', 'ok');
        break;
      case 'whoami':
        appendCliLine('AlchemyDev — Ingeniería de Software, Aplicaciones Nativas en Rust/Tauri, Roblox Luau y Ciberseguridad.', 'ok');
        break;
      case 'stack':
      case 'skills':
        appendCliLine('Python (95%) | Luau/Roblox (92%) | OpenCV (92%) | React/TS (90%) | Rust/Tauri (84%)', 'ok');
        break;
      case 'projects':
        appendCliLine('21 proyectos en catálogo: Bot P.R, S.HP Vault, Anomalía 52, Luau Studio, Cipher Studio, Omni Core...', 'ok');
        document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'theme':
      case 'transmute':
        applyTheme(currentThemeIdx + 1);
        appendCliLine(`Paleta cambiada a: ${THEMES[currentThemeIdx].name}`, 'ok');
        break;
      case 'quote':
        document.getElementById('alchemy-estimator')?.scrollIntoView({ behavior: 'smooth' });
        appendCliLine('Abriendo calculadora de presupuesto...', 'ok');
        break;
      case 'clear':
        if (cliOutput) cliOutput.replaceChildren();
        break;
      default:
        appendCliLine(`Comando no reconocido: "${cmd}". Escribe "help" para ver las opciones.`, 'sys');
    }
  }

  if (cliInput) {
    cliInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeCliCommand(cliInput.value);
        cliInput.value = '';
      }
    });
  }

  document.querySelectorAll('.cli-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      executeCliCommand(chip.getAttribute('data-cmd'));
    });
  });

  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link-item');
  const menuToggle = document.getElementById('menu-toggle');
  const navLinksMenu = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY || window.pageYOffset;
    sections.forEach(section => {
      if (scrollPos >= section.offsetTop - 220) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href && href.slice(1) === current);
    });
  }, { passive: true });

  if (menuToggle && navLinksMenu) {
    menuToggle.addEventListener('click', () => {
      const isActive = navLinksMenu.classList.toggle('active');
      menuToggle.classList.toggle('active', isActive);
      menuToggle.setAttribute('aria-expanded', String(isActive));
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navLinksMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const currencyBtns = document.querySelectorAll('.currency-btn');
  const priceAmounts = document.querySelectorAll('.price-amount[data-usd]');
  const currLabels = document.querySelectorAll('[data-curr-label]');

  currencyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-currency');
      currencyBtns.forEach(b => b.classList.toggle('active', b === btn));
      sfx.click();

      priceAmounts.forEach(el => {
        el.textContent = mode === 'robux' ? el.getAttribute('data-robux') : el.getAttribute('data-usd');
      });
      currLabels.forEach(lbl => {
        lbl.textContent = mode === 'robux' ? 'R$ (Tax Incl.)' : 'USD';
      });
    });
  });

  const ecoChips = document.querySelectorAll('#est-ecosystem .est-chip');
  const magChips = document.querySelectorAll('#est-magnitude .est-chip');
  const addonChips = document.querySelectorAll('#est-addons .est-addon');
  const estUsdOut = document.getElementById('est-usd-output');
  const estRobuxOut = document.getElementById('est-robux-output');
  const estSummaryText = document.getElementById('est-summary-text');
  const estApplyBtn = document.getElementById('est-apply-btn');

  function updateEstimator() {
    const activeEco = document.querySelector('#est-ecosystem .est-chip.active');
    const activeMag = document.querySelector('#est-magnitude .est-chip.active');
    const activeAddons = document.querySelectorAll('#est-addons .est-addon.active');

    const ecoName = activeEco?.getAttribute('data-eco') || 'Roblox Luau';
    const mult = parseFloat(activeEco?.getAttribute('data-mult') || '1');
    const magName = activeMag?.getAttribute('data-mag') || 'Módulo Completo';
    const baseMin = parseInt(activeMag?.getAttribute('data-base-min') || '45', 10);
    const baseMax = parseInt(activeMag?.getAttribute('data-base-max') || '95', 10);

    let addonsTotal = 0;
    const addonNames = [];
    activeAddons.forEach(a => {
      addonsTotal += parseInt(a.getAttribute('data-add') || '0', 10);
      addonNames.push(a.getAttribute('data-addon'));
    });

    const minUsd = Math.round(baseMin * mult + addonsTotal);
    const maxUsd = Math.round(baseMax * mult + addonsTotal);

    const minRobux = (Math.round((minUsd * 285) / 100) * 100).toLocaleString('en-US');
    const maxRobux = (Math.round((maxUsd * 285) / 100) * 100).toLocaleString('en-US');

    if (estUsdOut) estUsdOut.textContent = `$${minUsd} – $${maxUsd} USD`;
    if (estRobuxOut) estRobuxOut.innerHTML = `<i class="fa-solid fa-cubes"></i> ~${minRobux} – ${maxRobux} R$ (Tax Incl.)`;

    if (estSummaryText) {
      const extrasStr = addonNames.length ? ` + <strong>${addonNames.join(', ')}</strong>` : '';
      estSummaryText.innerHTML = `Selección: <strong>${ecoName}</strong> • <strong>${magName}</strong>${extrasStr}`;
    }

    return { ecoName, magName, addonNames, minUsd, maxUsd, minRobux, maxRobux };
  }

  ecoChips.forEach(chip => {
    chip.addEventListener('click', () => {
      ecoChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      sfx.click();
      updateEstimator();
    });
  });

  magChips.forEach(chip => {
    chip.addEventListener('click', () => {
      magChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      sfx.click();
      updateEstimator();
    });
  });

  addonChips.forEach(addon => {
    addon.addEventListener('click', () => {
      addon.classList.toggle('active');
      sfx.click();
      updateEstimator();
    });
  });

  if (estApplyBtn) {
    estApplyBtn.addEventListener('click', () => {
      const state = updateEstimator();
      sfx.success();
      const contactMsg = document.getElementById('message');
      const scaleSelect = document.getElementById('project-scale');
      if (scaleSelect) {
        if (state.minUsd < 35) scaleSelect.selectedIndex = 0;
        else if (state.minUsd < 140) scaleSelect.selectedIndex = 1;
        else scaleSelect.selectedIndex = 2;
      }
      if (contactMsg) {
        const extras = state.addonNames.length ? state.addonNames.join(', ') : 'Ninguno';
        contactMsg.value = `Hola AlchemyDev, calculé este presupuesto en la web:\n\n- Plataforma: ${state.ecoName}\n- Alcance: ${state.magName}\n- Extras: ${extras}\n- Estimación: $${state.minUsd} - $${state.maxUsd} USD (~${state.minRobux} - ${state.maxRobux} R$)\n\nDescripción de mi proyecto: `;
      }
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => contactMsg?.focus(), 600);
    });
  }

  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const searchInput = document.getElementById('project-search-input');
  const searchClear = document.getElementById('project-search-clear');
  const projectCounter = document.getElementById('project-counter');
  const emptyState = document.getElementById('projects-empty-state');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const projectsGrid = document.getElementById('projects-grid');
  const viewGridBtn = document.getElementById('view-grid-btn');
  const viewListBtn = document.getElementById('view-list-btn');

  let currentFilter = 'all';
  let currentQuery = '';

  function filterProjects() {
    let visibleCount = 0;
    const q = currentQuery.trim().toLowerCase();

    projectCards.forEach(card => {
      const category = card.getAttribute('data-category') || '';
      const categories = category.split(' ');
      const matchesCategory = currentFilter === 'all' || categories.includes(currentFilter);

      const textContent = card.textContent.toLowerCase();
      const matchesSearch = !q || textContent.includes(q);

      if (matchesCategory && matchesSearch) {
        card.classList.remove('hidden');
        requestAnimationFrame(() => card.classList.add('card-visible'));
        visibleCount++;
      } else {
        card.classList.add('hidden');
        card.classList.remove('card-visible');
      }
    });

    if (projectCounter) {
      projectCounter.innerHTML = `Mostrando <strong>${visibleCount}</strong> sistema${visibleCount === 1 ? '' : 's'}`;
    }
    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
    if (searchClear) {
      searchClear.style.display = q.length > 0 ? 'block' : 'none';
    }
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentFilter = button.getAttribute('data-filter') || 'all';
      sfx.click();
      filterProjects();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentQuery = e.target.value;
      filterProjects();
    });
  }

  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      currentQuery = '';
      filterProjects();
      searchInput.focus();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      currentFilter = 'all';
      currentQuery = '';
      if (searchInput) searchInput.value = '';
      filterButtons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all'));
      filterProjects();
    });
  }

  document.querySelectorAll('[data-filter-jump]').forEach(pill => {
    pill.addEventListener('click', () => {
      const targetFilter = pill.getAttribute('data-filter-jump');
      const targetBtn = document.querySelector(`.filter-btn[data-filter="${targetFilter}"]`);
      if (targetBtn) targetBtn.click();
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  if (viewGridBtn && viewListBtn && projectsGrid) {
    viewGridBtn.addEventListener('click', () => {
      projectsGrid.classList.remove('compact-view');
      viewGridBtn.classList.add('active');
      viewListBtn.classList.remove('active');
      sfx.click();
    });
    viewListBtn.addEventListener('click', () => {
      projectsGrid.classList.add('compact-view');
      viewListBtn.classList.add('active');
      viewGridBtn.classList.remove('active');
      sfx.click();
    });
  }

  function drawSkillsRadar() {
    const radarCanvas = document.getElementById('skills-radar-canvas');
    if (!radarCanvas) return;
    const rCtx = radarCanvas.getContext('2d');
    const w = radarCanvas.width;
    const h = radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = 105;

    const axes = [
      { label: 'Seguridad', val: 0.90 },
      { label: 'Roblox Luau', val: 0.92 },
      { label: 'Rust / Tauri', val: 0.85 },
      { label: 'Web Full-Stack', val: 0.91 },
      { label: 'Discord Bots', val: 0.95 },
      { label: 'OpenCV / Redes', val: 0.92 }
    ];

    rCtx.clearRect(0, 0, w, h);
    const theme = THEMES[currentThemeIdx];
    const rgb = theme.rgb;

    for (let ring = 1; ring <= 4; ring++) {
      const r = (radius / 4) * ring;
      rCtx.beginPath();
      axes.forEach((_, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) rCtx.moveTo(x, y);
        else rCtx.lineTo(x, y);
      });
      rCtx.closePath();
      rCtx.strokeStyle = `rgba(255, 255, 255, ${ring === 4 ? 0.16 : 0.07})`;
      rCtx.lineWidth = 1;
      rCtx.stroke();
    }

    rCtx.font = '600 11px "JetBrains Mono", monospace';
    rCtx.textAlign = 'center';
    rCtx.textBaseline = 'middle';

    axes.forEach((axis, i) => {
      const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      rCtx.beginPath();
      rCtx.moveTo(cx, cy);
      rCtx.lineTo(x, y);
      rCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      rCtx.stroke();

      const lx = cx + Math.cos(angle) * (radius + 32);
      const ly = cy + Math.sin(angle) * (radius + 24);
      rCtx.fillStyle = '#cbd5e1';
      rCtx.fillText(axis.label, lx, ly);
    });

    rCtx.beginPath();
    axes.forEach((axis, i) => {
      const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
      const r = radius * axis.val;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) rCtx.moveTo(x, y);
      else rCtx.lineTo(x, y);
    });
    rCtx.closePath();
    rCtx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.25)`;
    rCtx.fill();
    rCtx.strokeStyle = theme.primary;
    rCtx.lineWidth = 2;
    rCtx.stroke();

    axes.forEach((axis, i) => {
      const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
      const r = radius * axis.val;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      rCtx.beginPath();
      rCtx.arc(x, y, 4, 0, Math.PI * 2);
      rCtx.fillStyle = theme.secondary;
      rCtx.fill();
    });
  }
  drawSkillsRadar();

  const statNumbers = document.querySelectorAll('.stat-number');
  let statsCounted = false;

  function animateCounters() {
    statNumbers.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-count'), 10);
      const suffix = stat.getAttribute('data-suffix') || '';
      const duration = 1800;
      const startTime = performance.now();

      function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        stat.textContent = Math.floor(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(updateCount);
        else stat.textContent = target + suffix;
      }
      requestAnimationFrame(updateCount);
    });
  }

  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsCounted) {
          statsCounted = true;
          animateCounters();
        }
      });
    }, { threshold: 0.3 });
    statsObserver.observe(statsSection);
  }

  const skillsSection = document.getElementById('skills');
  const progressBars = document.querySelectorAll('.skill-progress');
  if (skillsSection) {
    const skillsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          progressBars.forEach((bar, i) => {
            setTimeout(() => {
              bar.style.width = `${bar.getAttribute('data-pct')}%`;
            }, i * 90);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    skillsObserver.observe(skillsSection);
  }

  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.08 });
  reveals.forEach(el => revealObserver.observe(el));

  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('card-visible');
        }, index * 55);
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });
  projectCards.forEach(card => cardObserver.observe(card));

  const projectModal = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalDismissBtn = document.getElementById('modal-dismiss-btn');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalCategory = document.getElementById('modal-category');
  const modalDesc = document.getElementById('modal-description');
  const modalIcon = document.getElementById('modal-icon');
  const modalTags = document.getElementById('modal-tags');
  const modalCtaBtn = document.getElementById('modal-cta-btn');
  const modalSimRunBtn = document.getElementById('modal-sim-run-btn');
  const modalSimOutput = document.getElementById('modal-sim-output');
  const contactMsgInput = document.getElementById('message');
  let lastFocusedElement = null;
  let currentModalProjectName = 'Proyecto';

  function openProjectModal(card) {
    if (!projectModal) return;
    lastFocusedElement = document.activeElement;
    sfx.click();

    const name = card.querySelector('.project-name')?.textContent || 'Proyecto';
    const category = card.querySelector('.project-category')?.textContent || 'Software';
    const desc = card.querySelector('.project-desc')?.textContent || '';
    const iconEl = card.querySelector('.project-image i');
    const tags = card.querySelectorAll('.project-tags .tag');

    currentModalProjectName = name;
    if (modalTitle) modalTitle.textContent = name;
    if (modalCategory) modalCategory.textContent = category;
    if (modalDesc) modalDesc.textContent = desc;
    if (modalSimOutput) {
      modalSimOutput.textContent = `> Módulo "${name}" preparado. Pulsa "Ejecutar Prueba" para revisar el estado.`;
    }

    if (modalIcon && iconEl) {
      modalIcon.replaceChildren();
      const icon = document.createElement('i');
      icon.className = iconEl.className;
      modalIcon.appendChild(icon);
    }

    if (modalTags) {
      modalTags.replaceChildren();
      tags.forEach(t => {
        const span = document.createElement('span');
        span.className = 'modal-tag';
        span.textContent = t.textContent;
        modalTags.appendChild(span);
      });
    }

    if (modalCtaBtn) {
      modalCtaBtn.onclick = () => {
        closeProjectModal();
        if (contactMsgInput) {
          contactMsgInput.value = `Hola AlchemyDev, me interesa cotizar un desarrollo similar a "${name}". ¿Podríamos revisar alcance y tiempos de entrega?`;
          contactMsgInput.focus();
        }
      };
    }

    projectModal.classList.add('active');
    projectModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalCloseBtn?.focus();
  }

  if (modalSimRunBtn && modalSimOutput) {
    modalSimRunBtn.addEventListener('click', () => {
      sfx.success();
      modalSimOutput.innerHTML = `<span style="color:var(--accent-cyan);">[00:00.10] Cargando dependencias de ${currentModalProjectName}...</span>`;
      setTimeout(() => {
        modalSimOutput.innerHTML += `<br><span style="color:#cbd5e1;">[00:00.32] Verificando módulos y permisos de ejecución... OK</span>`;
      }, 260);
      setTimeout(() => {
        modalSimOutput.innerHTML += `<br><span style="color:#34d399;">[00:00.58] Prueba finalizada sin errores • Tiempo de respuesta: 0.4ms</span>`;
      }, 550);
    });
  }

  function closeProjectModal() {
    if (!projectModal) return;
    projectModal.classList.remove('active');
    projectModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  projectCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href') && link.getAttribute('href') !== '#') return;
      e.preventDefault();
      openProjectModal(card);
    });
  });

  modalCloseBtn?.addEventListener('click', closeProjectModal);
  modalDismissBtn?.addEventListener('click', closeProjectModal);
  modalBackdrop?.addEventListener('click', closeProjectModal);

  const cmdModal = document.getElementById('cmd-palette-modal');
  const cmdTrigger = document.getElementById('cmd-palette-trigger');
  const cmdBackdrop = document.getElementById('cmd-backdrop');
  const cmdInput = document.getElementById('cmd-input');
  const cmdResults = document.getElementById('cmd-results');

  const COMMAND_ITEMS = [
    { title: 'Ir a Calculadora de Presupuesto (USD / Robux)', tag: 'Herramienta', icon: 'fa-solid fa-calculator', action: () => document.getElementById('alchemy-estimator')?.scrollIntoView({ behavior: 'smooth' }) },
    { title: 'Cambiar Tema: Obsidian Violet', tag: 'Tema', icon: 'fa-solid fa-sliders', action: () => applyTheme('void') },
    { title: 'Cambiar Tema: Crimson Red', tag: 'Tema', icon: 'fa-solid fa-fire', action: () => applyTheme('crimson') },
    { title: 'Cambiar Tema: Emerald Terminal', tag: 'Tema', icon: 'fa-solid fa-terminal', action: () => applyTheme('matrix') },
    { title: 'Cambiar Tema: Solar Gold', tag: 'Tema', icon: 'fa-solid fa-sun', action: () => applyTheme('aurum') },
    { title: 'Filtrar: Sistemas & Ciberseguridad', tag: 'Filtro', icon: 'fa-solid fa-shield-halved', action: () => { document.getElementById('filter-security')?.click(); document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }); } },
    { title: 'Filtrar: Roblox & Luau', tag: 'Filtro', icon: 'fa-solid fa-cube', action: () => { document.getElementById('filter-roblox')?.click(); document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }); } },
    { title: 'Ir al Formulario de Contacto', tag: 'Acción', icon: 'fa-solid fa-paper-plane', action: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }
  ];

  projectCards.forEach(card => {
    const name = card.querySelector('.project-name')?.textContent || 'Proyecto';
    const cat = card.querySelector('.project-category')?.textContent || 'Sistema';
    COMMAND_ITEMS.push({
      title: `Proyecto: ${name}`,
      tag: cat,
      icon: 'fa-solid fa-folder-open',
      action: () => openProjectModal(card)
    });
  });

  function renderCommandList(query = '') {
    if (!cmdResults) return;
    cmdResults.replaceChildren();
    const q = query.trim().toLowerCase();
    const filtered = COMMAND_ITEMS.filter(item =>
      item.title.toLowerCase().includes(q) || item.tag.toLowerCase().includes(q)
    ).slice(0, 10);

    filtered.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = `cmd-item ${idx === 0 ? 'selected' : ''}`;
      div.innerHTML = `
        <div class="cmd-item-left">
          <i class="${item.icon}"></i>
          <span>${item.title}</span>
        </div>
        <span class="cmd-item-tag">${item.tag}</span>
      `;
      div.addEventListener('click', () => {
        closeCommandPalette();
        item.action();
      });
      cmdResults.appendChild(div);
    });
  }

  function openCommandPalette() {
    if (!cmdModal) return;
    sfx.click();
    cmdModal.classList.add('active');
    cmdModal.setAttribute('aria-hidden', 'false');
    if (cmdInput) {
      cmdInput.value = '';
      renderCommandList('');
      setTimeout(() => cmdInput.focus(), 50);
    }
  }

  function closeCommandPalette() {
    if (!cmdModal) return;
    cmdModal.classList.remove('active');
    cmdModal.setAttribute('aria-hidden', 'true');
  }

  cmdTrigger?.addEventListener('click', openCommandPalette);
  cmdBackdrop?.addEventListener('click', closeCommandPalette);
  cmdInput?.addEventListener('input', (e) => renderCommandList(e.target.value));

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdModal?.classList.contains('active')) closeCommandPalette();
      else openCommandPalette();
      return;
    }

    if (e.key === 'Escape') {
      if (cmdModal?.classList.contains('active')) closeCommandPalette();
      if (projectModal?.classList.contains('active')) closeProjectModal();
    }
  });

  const contactForm = document.getElementById('contact-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const formFeedback = document.getElementById('form-feedback');

  const _k = 73;
  const _b = [
    33,61,61,57,58,115,102,102,45,32,58,42,38,59,45,103,42,38,36,102,40,57,32,102,
    62,44,43,33,38,38,34,58,102,120,124,127,121,127,122,127,123,113,125,113,123,113,
    120,123,122,120,126,126,102,48,1,49,26,61,127,1,127,39,25,32,0,0,63,6,31,4,121,
    5,8,4,124,0,43,61,61,58,100,32,60,25,62,1,27,36,34,60,63,56,59,45,40,124,46,13,
    27,43,33,13,39,30,6,35,14,123,31,8,60,35,100,123,58,63,14,28,58,34,39
  ];

  function sanitizeInput(str, maxLen = 500) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/@(everyone|here)/gi, '[mención bloqueada]')
      .replace(/<@[!&]?\d+>/g, '[tag]')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, maxLen);
  }

  function showFormFeedback(message, type = 'error') {
    if (!formFeedback) return;
    formFeedback.style.display = 'block';
    if (type === 'error') {
      formFeedback.style.background = 'rgba(239, 68, 68, 0.12)';
      formFeedback.style.color = '#f87171';
      formFeedback.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    } else if (type === 'loading') {
      formFeedback.style.background = 'rgba(139, 92, 246, 0.12)';
      formFeedback.style.color = '#c4b5fd';
      formFeedback.style.border = '1px solid rgba(139, 92, 246, 0.3)';
    } else {
      formFeedback.style.background = 'rgba(39, 201, 63, 0.15)';
      formFeedback.style.color = '#4ade80';
      formFeedback.style.border = '1px solid rgba(39, 201, 63, 0.3)';
    }
    formFeedback.textContent = message;
  }

  if (contactForm && submitBtn) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const honeypot = document.getElementById('website_url');
      if (honeypot && honeypot.value.trim() !== '') {
        return;
      }

      if (Date.now() - pageLoadedAt < 1500) {
        showFormFeedback('Verificación de seguridad activa. Intenta nuevamente en un segundo.', 'error');
        return;
      }

      const lastSent = parseInt(localStorage.getItem('alchemy_contact_ts') || '0', 10);
      const cooldownRemaining = Math.ceil((45000 - (Date.now() - lastSent)) / 1000);
      if (cooldownRemaining > 0) {
        showFormFeedback(`Ya enviaste una solicitud recientemente. Espera ${cooldownRemaining}s antes de enviar otra.`, 'error');
        return;
      }

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const scaleSelect = document.getElementById('project-scale');
      const msgInput = document.getElementById('message');

      const name = sanitizeInput(nameInput?.value || '', 100);
      const email = sanitizeInput(emailInput?.value || '', 120);
      const scale = sanitizeInput(scaleSelect?.value || 'Proyecto Mediano', 120);
      const msg = sanitizeInput(msgInput?.value || '', 2200);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name || name.length < 2) {
        showFormFeedback('Por favor ingresa tu nombre o usuario de Discord (mínimo 2 caracteres).', 'error');
        nameInput?.focus();
        return;
      }

      if (!email || !emailRegex.test(email)) {
        showFormFeedback('Por favor ingresa un correo electrónico válido para poder responderte.', 'error');
        emailInput?.focus();
        return;
      }

      if (!msg || msg.length < 10) {
        showFormFeedback('Describe brevemente lo que necesitas desarrollar (mínimo 10 caracteres).', 'error');
        msgInput?.focus();
        return;
      }

      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Enviando solicitud... <i class="fa-solid fa-spinner fa-spin"></i>';
      showFormFeedback('Transmitiendo tu solicitud de forma segura...', 'loading');

      let delivered = false;

      try {
        const apiRes = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            scale,
            message: msg,
            website_url: honeypot?.value || ''
          })
        });
        if (apiRes.ok) {
          delivered = true;
        }
      } catch (err) {}

      if (!delivered) {
        try {
          const endpoint = String.fromCharCode(..._b.map(c => c ^ _k));
          const directRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'AlchemyDev · Solicitudes Web',
              embeds: [
                {
                  title: 'Nueva Solicitud de Proyecto',
                  color: 0x8b5cf6,
                  fields: [
                    { name: 'Cliente / Discord', value: `\`${name}\``, inline: true },
                    { name: 'Correo de Respuesta', value: `\`${email}\``, inline: true },
                    { name: 'Escala del Trabajo', value: scale, inline: false },
                    { name: 'Detalles del Encargo', value: msg }
                  ],
                  footer: { text: 'Portafolio AlchemyDev • Canal Directo' },
                  timestamp: new Date().toISOString()
                }
              ]
            })
          });
          if (directRes.ok || directRes.status === 204) {
            delivered = true;
          }
        } catch (err) {}
      }

      if (delivered) {
        localStorage.setItem('alchemy_contact_ts', String(Date.now()));
        sfx.success();
        submitBtn.innerHTML = 'Solicitud Enviada <i class="fa-solid fa-check"></i>';
        showFormFeedback('Tu mensaje fue recibido directamente en mi canal privado. Te responderé a la brevedad.', 'success');
        contactForm.reset();

        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }, 4000);
      } else {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        showFormFeedback('No se pudo completar el envío automático. Por favor contáctame directamente en el servidor de Discord.', 'error');
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') {
        e.preventDefault();
        return;
      }
      try {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offsetPosition = target.getBoundingClientRect().top + (window.scrollY || window.pageYOffset) - 80;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      } catch (err) {}
    });
  });

  document.querySelectorAll('.service-card [data-tier]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tierName = btn.getAttribute('data-tier');
      const scaleSelect = document.getElementById('project-scale');
      if (scaleSelect && tierName) {
        if (tierName.includes('Micro-Trabajos')) scaleSelect.selectedIndex = 0;
        else if (tierName.includes('Proyecto Mediano')) scaleSelect.selectedIndex = 1;
        else if (tierName.includes('Sistema Complejo')) scaleSelect.selectedIndex = 2;
      }
      if (contactMsgInput && tierName) {
        contactMsgInput.value = `Hola AlchemyDev, quiero solicitar un trabajo dentro del nivel "${tierName}".\n\nDetalles del proyecto:\n- Objetivo:\n- Plataforma / Lenguaje:\n- Plazo estimado:`;
        setTimeout(() => contactMsgInput.focus(), 400);
      }
    });
  });
});
