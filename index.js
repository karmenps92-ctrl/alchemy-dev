document.addEventListener('DOMContentLoaded', () => {
  // ===========================
  // Scroll Progress Bar
  // ===========================
  const scrollProgress = document.createElement('div');
  scrollProgress.className = 'scroll-progress';
  document.body.prepend(scrollProgress);

  function updateScrollProgress() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = `${scrollPercent}%`;
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });

  // ===========================
  // Animated Particle Background
  // ===========================
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    const maxParticles = 70;
    
    let mouse = { x: null, y: null, radius: 150 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    });

    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    }
    window.addEventListener('resize', resizeCanvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
      constructor(x, y, dirX, dirY, size, color, opacity) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.size = size;
        this.color = color;
        this.opacity = opacity;
        this.baseSize = size;
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 0, 255, ${this.opacity})`;
        ctx.fill();
      }

      update() {
        if (this.x > canvas.width || this.x < 0) this.dirX = -this.dirX;
        if (this.y > canvas.height || this.y < 0) this.dirY = -this.dirY;

        // Mouse interaction - soft repulsion
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 2.5;
            this.y -= (dy / dist) * force * 2.5;
            this.size = this.baseSize + force * 1.5;
          } else {
            this.size += (this.baseSize - this.size) * 0.05;
          }
        }

        this.x += this.dirX;
        this.y += this.dirY;
        this.draw();
      }
    }

    function init() {
      particlesArray = [];
      const num = Math.min(maxParticles, Math.floor((canvas.width * canvas.height) / 20000));
      for (let i = 0; i < num; i++) {
        const size = Math.random() * 1.8 + 0.8;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const dirX = (Math.random() - 0.5) * 0.3;
        const dirY = (Math.random() - 0.5) * 0.3;
        const opacity = Math.random() * 0.3 + 0.15;
        particlesArray.push(new Particle(x, y, dirX, dirY, size, '#9600ff', opacity));
      }
    }

    function connect() {
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const dist = dx * dx + dy * dy;
          if (dist < 15000) {
            const opacity = (1 - dist / 15000) * 0.12;
            ctx.strokeStyle = `rgba(150, 0, 255, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      connect();
    }
    
    init();
    animate();
  }

  // ===========================
  // Header Scroll Effect
  // ===========================
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // ===========================
  // Active Nav Link Highlighting
  // ===========================
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link-item');

  function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
      if (window.pageYOffset >= section.offsetTop - 200) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href').slice(1) === current);
    });
  }
  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // ===========================
  // Mobile Menu
  // ===========================
  const menuToggle = document.getElementById('menu-toggle');
  const navLinksMenu = document.getElementById('nav-links');

  if (menuToggle && navLinksMenu) {
    menuToggle.addEventListener('click', () => {
      const isActive = navLinksMenu.classList.toggle('active');
      const spans = menuToggle.querySelectorAll('span');
      if (spans.length >= 3) {
        spans[0].style.transform = isActive ? 'rotate(45deg) translate(5px, 5px)' : 'none';
        spans[1].style.opacity = isActive ? '0' : '1';
        spans[2].style.transform = isActive ? 'rotate(-45deg) translate(5px, -5px)' : 'none';
      }
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navLinksMenu.classList.remove('active');
        const spans = menuToggle.querySelectorAll('span');
        if (spans.length >= 3) {
          spans[0].style.transform = 'none';
          spans[1].style.opacity = '1';
          spans[2].style.transform = 'none';
        }
      });
    });
  }

  // ===========================
  // Project Filters with Animation
  // ===========================
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const filterValue = button.getAttribute('data-filter');

      projectCards.forEach((card, index) => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.classList.remove('hidden');
          card.style.animation = `fadeIn 0.5s ease ${index * 0.04}s forwards`;
        } else {
          card.classList.add('hidden');
          card.style.animation = '';
        }
      });
    });
  });

  // ===========================
  // Animated Stats Counter
  // ===========================
  const statNumbers = document.querySelectorAll('.stat-number');
  let statsCounted = false;

  function animateCounters() {
    statNumbers.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-count'), 10);
      const suffix = stat.getAttribute('data-suffix') || '';
      const duration = 2000;
      const startTime = performance.now();

      function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        stat.textContent = current + suffix;
        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          stat.textContent = target + suffix;
        }
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

  // ===========================
  // Skill Bars Animation
  // ===========================
  const skillsSection = document.getElementById('skills');
  const progressBars = document.querySelectorAll('.skill-progress');

  if (skillsSection) {
    const skillsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          progressBars.forEach((bar, i) => {
            setTimeout(() => {
              bar.style.width = `${bar.getAttribute('data-pct')}%`;
            }, i * 100);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    skillsObserver.observe(skillsSection);
  }

  // ===========================
  // Contact Form Simulation
  // ===========================
  const contactForm = document.getElementById('contact-form');
  const submitBtn = document.getElementById('form-submit-btn');

  if (contactForm && submitBtn) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Enviando... <i class="fa-solid fa-spinner fa-spin"></i>';
      submitBtn.style.opacity = '0.7';

      setTimeout(() => {
        submitBtn.innerHTML = '¡Mensaje Enviado! <i class="fa-solid fa-check"></i>';
        submitBtn.style.opacity = '1';
        submitBtn.style.background = '#27c93f';
        contactForm.reset();

        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          submitBtn.style.background = '';
          submitBtn.style.opacity = '';
        }, 3000);
      }, 1500);
    });
  }

  // ===========================
  // Scroll Reveal Animations
  // ===========================
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  
  reveals.forEach(el => revealObserver.observe(el));

  // Staggered project card reveal
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('card-visible');
        }, index * 80);
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  projectCards.forEach(card => cardObserver.observe(card));

  // ===========================
  // Terminal Typing with Syntax Highlighting
  // ===========================
  const codeElement = document.getElementById('typed-code');
  if (codeElement) {
    const codeTokens = [
      { text: '// Instancia del desarrollador\n', cls: 'syn-comment' },
      { text: 'const ', cls: 'syn-keyword' },
      { text: 'developer', cls: 'syn-variable' },
      { text: ' = ', cls: '' },
      { text: '{\n', cls: 'syn-bracket' },
      { text: '  name', cls: 'syn-property' },
      { text: ': ', cls: '' },
      { text: "'AlchemyDev'", cls: 'syn-string' },
      { text: ',\n', cls: '' },
      { text: '  skills', cls: 'syn-property' },
      { text: ': [', cls: 'syn-bracket' },
      { text: "'Node.js'", cls: 'syn-string' },
      { text: ', ', cls: '' },
      { text: "'Python'", cls: 'syn-string' },
      { text: ', ', cls: '' },
      { text: "'TypeScript'", cls: 'syn-string' },
      { text: ', ', cls: '' },
      { text: "'Luau'", cls: 'syn-string' },
      { text: ']', cls: 'syn-bracket' },
      { text: ',\n', cls: '' },
      { text: '  focus', cls: 'syn-property' },
      { text: ': [', cls: 'syn-bracket' },
      { text: "'Discord Bots'", cls: 'syn-string' },
      { text: ', ', cls: '' },
      { text: "'Roblox'", cls: 'syn-string' },
      { text: ', ', cls: '' },
      { text: "'AI'", cls: 'syn-string' },
      { text: ']', cls: 'syn-bracket' },
      { text: ',\n', cls: '' },
      { text: '  isPassionate', cls: 'syn-property' },
      { text: ': ', cls: '' },
      { text: 'true', cls: 'syn-boolean' },
      { text: '\n', cls: '' },
      { text: '}', cls: 'syn-bracket' },
      { text: ';\n\n', cls: '' },
      { text: 'function ', cls: 'syn-keyword' },
      { text: 'createMagic', cls: 'syn-function' },
      { text: '(', cls: 'syn-bracket' },
      { text: 'dev', cls: 'syn-variable' },
      { text: ') {\n', cls: 'syn-bracket' },
      { text: '  if ', cls: 'syn-keyword' },
      { text: '(', cls: 'syn-bracket' },
      { text: 'dev', cls: 'syn-variable' },
      { text: '.', cls: '' },
      { text: 'isPassionate', cls: 'syn-property' },
      { text: ') {\n', cls: 'syn-bracket' },
      { text: '    console', cls: 'syn-variable' },
      { text: '.', cls: '' },
      { text: 'log', cls: 'syn-function' },
      { text: '(', cls: 'syn-bracket' },
      { text: "'✨ Crafting premium code...'", cls: 'syn-string' },
      { text: ')', cls: 'syn-bracket' },
      { text: ';\n', cls: '' },
      { text: '  }\n', cls: 'syn-bracket' },
      { text: '}', cls: 'syn-bracket' },
      { text: '\n\n', cls: '' },
      { text: 'createMagic', cls: 'syn-function' },
      { text: '(', cls: 'syn-bracket' },
      { text: 'developer', cls: 'syn-variable' },
      { text: ')', cls: 'syn-bracket' },
      { text: ';', cls: '' },
    ];

    let tokenIdx = 0;
    let charIdx = 0;

    function typeToken() {
      if (tokenIdx >= codeTokens.length) return;

      const token = codeTokens[tokenIdx];
      if (charIdx < token.text.length) {
        const span = codeElement.lastElementChild;
        // If current span doesn't match, create new one
        if (!span || span.className !== (token.cls || '')) {
          const newSpan = document.createElement('span');
          if (token.cls) newSpan.className = token.cls;
          codeElement.appendChild(newSpan);
        }
        const target = codeElement.lastElementChild || codeElement;
        target.textContent += token.text.charAt(charIdx);
        charIdx++;
        
        const char = token.text.charAt(charIdx - 1);
        const delay = char === '\n' ? 60 : (Math.random() * 18 + 6);
        setTimeout(typeToken, delay);
      } else {
        tokenIdx++;
        charIdx = 0;
        setTimeout(typeToken, 5);
      }
    }

    // Start typing after a small delay
    setTimeout(typeToken, 800);
  }

  // ===========================
  // Smooth Scroll for Anchor Links
  // ===========================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
});
