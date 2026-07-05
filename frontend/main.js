/* ═══════════════════════════════════════════
   NEUROVIA NEXUS — MAIN.JS
   Cursor · Canvas · Reveal · Counter · Countdown
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ══════ CUSTOM CURSOR ══════ */
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  let mx = -100, my = -100, fx = -100, fy = -100;

  if (cursor && follower) {
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top = my + 'px';
    });

    const lerp = (a, b, t) => a + (b - a) * t;
    const followCursor = () => {
      fx = lerp(fx, mx, 0.1);
      fy = lerp(fy, my, 0.1);
      follower.style.left = fx + 'px';
      follower.style.top = fy + 'px';
      requestAnimationFrame(followCursor);
    };
    followCursor();

    document.querySelectorAll('a, button, .service-card, .tcard, .future-card').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hovering');
        follower.classList.add('hovering');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hovering');
        follower.classList.remove('hovering');
      });
    });
  }

  /* ══════ NAVBAR ══════ */
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  mobileMenu?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ══════ HERO CANVAS — floating nodes ══════ */
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, nodes = [], mouse = { x: -999, y: -999 };
    const NODE_COUNT = 60;

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    class Node {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.r = Math.random() * 1.5 + 0.5;
        this.a = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > W) this.vx *= -1;
        if (this.y < 0 || this.y > H) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79,127,255,${this.a})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < NODE_COUNT; i++) nodes.push(new Node());

    const connect = (a, b) => {
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 140) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        const alpha = (1 - dist / 140) * 0.12;
        ctx.strokeStyle = `rgba(79,127,255,${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      nodes.forEach(n => { n.update(); n.draw(); });
      for (let i = 0; i < nodes.length; i++)
        for (let j = i+1; j < nodes.length; j++)
          connect(nodes[i], nodes[j]);
      requestAnimationFrame(animate);
    };
    animate();
  }

  /* ══════ SCROLL REVEAL ══════ */
  const reveals = document.querySelectorAll('.reveal');
  window.revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        window.revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => window.revealObserver.observe(el));

  /* ══════ ANIMATED STAT COUNTERS ══════ */
  const counters = document.querySelectorAll('.stat-num[data-target]');
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.target);
      const duration = 1800;
      const start = performance.now();

      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.floor(ease * target);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      };
      requestAnimationFrame(tick);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObs.observe(el));

  /* ══════ LIVE COUNTDOWN ══════ */
  const TARGET = new Date('2027-06-01T00:00:00.000Z');

  const pad = n => String(n).padStart(2, '0');
  const pad3 = n => String(n).padStart(3, '0');

  const updateCountdown = () => {
    const now = new Date();
    const diff = Math.max(0, TARGET - now);

    const totalSecs = Math.floor(diff / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hours');
    const mEl = document.getElementById('cd-mins');
    const sEl = document.getElementById('cd-secs');

    if (dEl) dEl.textContent = pad3(days);
    if (hEl) hEl.textContent = pad(hours);
    if (mEl) mEl.textContent = pad(mins);
    if (sEl) sEl.textContent = pad(secs);
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ══════ STEP HOVER HIGHLIGHT ══════ */
  document.querySelectorAll('.step').forEach(step => {
    step.addEventListener('mouseenter', () => {
      document.querySelectorAll('.step').forEach(s => {
        s.style.opacity = s === step ? '1' : '0.4';
      });
    });
    step.addEventListener('mouseleave', () => {
      document.querySelectorAll('.step').forEach(s => {
        s.style.opacity = '1';
      });
    });
  });

  /* ══════ PARALLAX ON HERO TITLE ══════ */
  const heroTitle = document.querySelector('.hero-title');
  window.addEventListener('scroll', () => {
    if (!heroTitle) return;
    const y = window.scrollY;
    heroTitle.style.transform = `translateY(${y * 0.25}px)`;
    heroTitle.style.opacity = Math.max(0, 1 - y / 500);
  });

  /* ══════ SERVICE CARD — TILT ══════ */
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateZ(4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
      card.style.transition = 'transform 0.5s ease';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'none';
    });
  });

  /* ══════ SMOOTH ANCHOR SCROLL ══════ */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ══════ VIDEO LIBRARY ══════ */
  const videos = [
    {
      id: 1, cat: 'repair', catLabel: 'Live Repair',
      title: "Recovering a Dead Laptop: From Blank Screen to Fully Working in 28 Minutes",
      desc: "Arjun walks through a complete onsite repair — no power, no display. Watch the full diagnostic process, part replacement, and final test.",
      tech: "Arjun Rao", duration: "12:34", rating: 4.9, views: "2.4k",
      grad: "linear-gradient(135deg,#0a1628,#1a0e28)", featured: true,
      date: "Jun 2025", likes: 142
    },
    {
      id: 2, cat: 'tutorial', catLabel: 'Tutorial',
      title: "How to Remove a Virus Without Losing Your Data",
      desc: "Step-by-step safe virus removal using free tools. No data loss, no reinstall.",
      tech: "Ananya Mishra", duration: "8:22", rating: 4.8, views: "5.1k",
      grad: "linear-gradient(135deg,#1a0e0e,#2a1010)", featured: false,
      date: "May 2025", likes: 280
    },
    {
      id: 3, cat: 'tip', catLabel: 'Quick Tip',
      title: "Speed Up Windows 11 in 5 Minutes — No Software Needed",
      desc: "These built-in tweaks will noticeably speed up any Windows 11 machine right now.",
      tech: "Ananya Mishra", duration: "5:10", rating: 4.7, views: "8.9k",
      grad: "linear-gradient(135deg,#0e1a10,#0d260e)", featured: false,
      date: "May 2025", likes: 510
    },
    {
      id: 4, cat: 'ai', catLabel: 'AI & Future',
      title: "NADT Explained: How We're Teaching AI to Fix Your Computer",
      desc: "An honest look at our AI research — what it can do today, what it can't, and where it's headed.",
      tech: "Neurovia Nexus", duration: "15:48", rating: 5.0, views: "3.2k",
      grad: "linear-gradient(135deg,#0e0f28,#1a1040)", featured: false,
      date: "Apr 2025", likes: 198
    },
    {
      id: 5, cat: 'repair', catLabel: 'Live Repair',
      title: "Office Network Down: Setting Up 20 Workstations From Scratch",
      desc: "Neha documents a full office network rollout — structured cabling, switches, and WiFi access points.",
      tech: "Neha Mehta", duration: "22:15", rating: 4.9, views: "1.8k",
      grad: "linear-gradient(135deg,#1a1208,#2a2010)", featured: false,
      date: "Apr 2025", likes: 97
    },
    {
      id: 6, cat: 'tutorial', catLabel: 'Tutorial',
      title: "Data Recovery From a Dead Hard Drive: 3 Methods That Actually Work",
      desc: "Priya tests three different recovery approaches on a physically failed 2TB drive.",
      tech: "Priya Desai", duration: "18:03", rating: 4.6, views: "4.5k",
      grad: "linear-gradient(135deg,#1a0e28,#2a1438)", featured: false,
      date: "Mar 2025", likes: 223
    },
    {
      id: 7, cat: 'tip', catLabel: 'Quick Tip',
      title: "The Right Way to Clean Your Laptop Keyboard (Without Breaking It)",
      desc: "A short guide to safe keyboard cleaning — what to use, what to avoid, and when to call a professional.",
      tech: "Arjun Rao", duration: "4:30", rating: 4.8, views: "6.7k",
      grad: "linear-gradient(135deg,#0a1a10,#0e2818)", featured: false,
      date: "Mar 2025", likes: 334
    },
    {
      id: 8, cat: 'ai', catLabel: 'AI & Future',
      title: "Building NADT: Month 6 Progress Report",
      desc: "Six months in — here's what our AI diagnostic system got right, what surprised us, and what's next.",
      tech: "Neurovia Nexus", duration: "11:20", rating: 4.9, views: "2.1k",
      grad: "linear-gradient(135deg,#0e0e1a,#181828)", featured: false,
      date: "Feb 2025", likes: 156
    },
    {
      id: 9, cat: 'repair', catLabel: 'Live Repair',
      title: "MacBook Screen Replacement: Full Teardown & Rebuild",
      desc: "Vishal opens up a MacBook Pro 14\" and replaces the display panel — from first screw to final boot.",
      tech: "Vishal Kumar", duration: "28:45", rating: 5.0, views: "3.8k",
      grad: "linear-gradient(135deg,#1a1010,#280e0e)", featured: false,
      date: "Feb 2025", likes: 271
    },
  ];

  const catColors = {
    'Tutorial':    { bg: 'rgba(79,127,255,0.2)',  text: '#6b9fff' },
    'Live Repair': { bg: 'rgba(245,158,11,0.2)',  text: '#f59e0b' },
    'Quick Tip':   { bg: 'rgba(34,197,94,0.2)',   text: '#22c55e' },
    'AI & Future': { bg: 'rgba(168,85,247,0.2)',  text: '#a855f7' },
  };

  let activeVideoFilter = 'all';
  let likes = {};
  videos.forEach(v => likes[v.id] = v.likes);

  function renderVideos() {
    const grid = document.getElementById('video-grid');
    if (!grid) return;

    const filtered = activeVideoFilter === 'all'
      ? videos.filter(v => !v.featured)
      : videos.filter(v => v.cat === activeVideoFilter);

    const starsStr = r => {
      const full = Math.floor(r);
      const half = r % 1 >= 0.5 ? 1 : 0;
      return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
    };

    grid.innerHTML = filtered.map((v, i) => {
      const cc = catColors[v.catLabel] || { bg: 'rgba(255,255,255,0.1)', text: '#fff' };
      return `
        <div class="video-card reveal${i > 0 && i < 5 ? ' delay-' + Math.min(i,4) : ''}"
             onclick="setFeatured(${v.id})" data-vid="${v.id}">
          <div class="vc-thumb" style="background:${v.grad}">
            <div class="vc-play">▶</div>
            <div class="vc-dur">${v.duration}</div>
            <div class="vc-cat" style="background:${cc.bg};color:${cc.text};">${v.catLabel}</div>
          </div>
          <div class="vc-body">
            <h4>${v.title}</h4>
            <div class="vc-rating-row">
              <span class="vc-stars-mini">${'★'.repeat(Math.round(v.rating))}${'☆'.repeat(5-Math.round(v.rating))}</span>
              <span class="vc-rating-num">${v.rating}</span>
              <span class="vc-views">(${v.views})</span>
              <span class="vc-tech">${v.tech}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // re-observe
    grid.querySelectorAll('.reveal').forEach(el => {
      el.classList.remove('visible');
      setTimeout(() => el.classList.add('visible'), 60);
    });
  }

  window.setFeatured = function(id) {
    const v = videos.find(x => x.id === id);
    if (!v) return;
    const starsHtml = '★'.repeat(Math.round(v.rating)) + '☆'.repeat(5 - Math.round(v.rating));
    document.getElementById('featured-title').textContent = v.title;
    document.getElementById('featured-desc').textContent = v.desc;
    document.getElementById('featured-cat').textContent = v.catLabel;
    document.getElementById('featured-stars').textContent = starsHtml;
    document.getElementById('featured-rating').textContent = v.rating;
    document.getElementById('featured-views').textContent = `(${v.views} views)`;
    document.getElementById('featured-tech').textContent = `By ${v.tech}`;
    document.getElementById('featured-date').textContent = v.date;
    document.getElementById('like-count').textContent = likes[id];
    document.getElementById('featured-thumb').style.background = v.grad;

    // reset overlay
    document.getElementById('featured-overlay').style.display = 'none';
    document.getElementById('featured-thumb').style.display = 'flex';

    // scroll to featured
    document.querySelector('.video-featured').scrollIntoView({ behavior: 'smooth', block: 'center' });

    // store current featured id
    document.querySelector('.video-featured').dataset.currentId = id;
  };

  window.playFeatured = function() {
    document.getElementById('featured-thumb').style.display = 'none';
    document.getElementById('featured-overlay').style.display = 'flex';
  };

  window.likeVideo = function(which) {
    const vid = document.querySelector('.video-featured');
    const id = parseInt(vid?.dataset.currentId) || 1;
    likes[id] = (likes[id] || 0) + 1;
    document.getElementById('like-count').textContent = likes[id];
  };

  // Video filter buttons
  document.querySelectorAll('.vf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.vf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeVideoFilter = btn.dataset.vcat;
      renderVideos();
    });
  });

  renderVideos();

});
