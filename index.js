document.addEventListener('DOMContentLoaded', () => {
  // Animación del fondo con partículas
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    const maxParticles = 80;
    
    let mouse = {
      x: null,
      y: null,
      radius: 130
    };

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
      constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      update() {
        if (this.x > canvas.width || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
          this.directionY = -this.directionY;
        }

        if (mouse.x !== null && mouse.y !== null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius + this.size) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            const directionX = forceDirectionX * force * 3;
            const directionY = forceDirectionY * force * 3;
            this.x -= directionX;
            this.y -= directionY;
          }
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    function init() {
      particlesArray = [];
      let numberOfParticles = Math.min(maxParticles, (canvas.width * canvas.height) / 18000);
      for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1;
        let x = Math.random() * (canvas.width - size * 2) + size;
        let y = Math.random() * (canvas.height - size * 2) + size;
        let directionX = (Math.random() * 0.4) - 0.2;
        let directionY = (Math.random() * 0.4) - 0.2;
        let color = 'rgba(150, 0, 255, 0.4)';
        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
      }
    }

    function connect() {
      let opacityValue = 1;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          let dx = particlesArray[a].x - particlesArray[b].x;
          let dy = particlesArray[a].y - particlesArray[b].y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 120) {
            opacityValue = 1 - (distance / 120);
            ctx.strokeStyle = `rgba(150, 0, 255, ${opacityValue * 0.15})`;
            ctx.lineWidth = 1;
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

  // Efecto sticky en el header al hacer scroll
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Resaltado del enlace activo en el menú
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link-item');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.pageYOffset >= (sectionTop - 150)) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').slice(1) === current) {
        link.classList.add('active');
      }
    });
  });

  // Control del menú desplegable móvil
  const menuToggle = document.getElementById('menu-toggle');
  const navLinksMenu = document.getElementById('nav-links');

  if (menuToggle && navLinksMenu) {
    menuToggle.addEventListener('click', () => {
      navLinksMenu.classList.toggle('active');
      
      // Animación del botón hamburguesa
      const spans = menuToggle.querySelectorAll('span');
      if (spans.length >= 3) {
        spans[0].style.transform = navLinksMenu.classList.contains('active') ? 'rotate(45deg) translate(6px, 6px)' : 'none';
        spans[1].style.opacity = navLinksMenu.classList.contains('active') ? '0' : '1';
        spans[2].style.transform = navLinksMenu.classList.contains('active') ? 'rotate(-45deg) translate(6px, -6px)' : 'none';
      }
    });

    // Cerrar menú móvil al hacer click en un enlace
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

  // Filtro de categorías de proyectos
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Alternar clase activa en botones
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const filterValue = button.getAttribute('data-filter');

      // Mostrar u ocultar proyectos según filtro
      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.classList.remove('hidden');
          // Animación de entrada
          card.style.animation = 'fadeIn 0.5s ease forwards';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  // Animación de barras de habilidades al entrar en viewport
  const skillsSection = document.getElementById('skills');
  const progressBars = document.querySelectorAll('.skill-progress');

  const skillsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        progressBars.forEach(bar => {
          const pct = bar.getAttribute('data-pct');
          bar.style.width = `${pct}%`;
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  if (skillsSection) {
    skillsObserver.observe(skillsSection);
  }

  // Simulación del envío de formulario
  const contactForm = document.getElementById('contact-form');
  const submitBtn = document.getElementById('form-submit-btn');

  if (contactForm && submitBtn) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Feedback visual al usuario
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Enviando... <i class="fa-solid fa-spinner fa-spin"></i>';
      submitBtn.style.backgroundColor = '#555';

      setTimeout(() => {
        submitBtn.innerHTML = '¡Mensaje Enviado! <i class="fa-solid fa-check"></i>';
        submitBtn.style.backgroundColor = '#27c93f';
        contactForm.reset();

        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          submitBtn.style.backgroundColor = '';
        }, 3000);
      }, 1500);
    });
  }

  // Animación Scroll Reveal
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });
  
  reveals.forEach(el => revealObserver.observe(el));

  // Animación de escritura simulada en terminal
  const codeElement = document.getElementById('typed-code');
  if (codeElement) {
    const codeText = `// Instancia del desarrollador
const developer = {
  name: 'AlchemyDev',
  skills: ['Node.js', 'Python', 'TypeScript', 'Luau'],
  focus: ['Discord Bots', 'Roblox', 'Automations'],
  isPassionate: true
};

function createMagic(dev) {
  if (dev.isPassionate) {
    console.log('Crafting high performance software...');
  }
}

createMagic(developer);`;
    
    let index = 0;
    function typeCode() {
      if (index < codeText.length) {
        codeElement.textContent += codeText.charAt(index);
        index++;
        setTimeout(typeCode, Math.random() * 20 + 8);
      }
    }
    
    setTimeout(typeCode, 1000);
  }
});

// Inyección de estilos CSS dinámicos
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
