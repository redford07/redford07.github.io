(() => {
  'use strict';
  const content = window.PORTFOLIO_CONTENT;
  const windows = new Map();
  let layer = 10;
  const labels = { welcome: 'Welcome to WooChan OS', about: 'About Me', experience: 'Work Experience', projects: 'Projects', education: 'Education & Awards', skills: 'Skills', gallery: 'My Pictures', contact: 'Contact' };
  const home = `<div class="welcome"><div class="eyebrow">WELCOME TO MY PERSONAL WEBSITE</div><h1>Kim WooChan</h1><p class="role">Full Stack Developer</p><div class="home-links"><button class="text-link" data-app="about">ABOUT</button><button class="text-link" data-app="experience">EXPERIENCE</button><button class="text-link" data-app="projects">PROJECTS</button><button class="text-link" data-app="education">EDUCATION</button><button class="text-link" data-app="contact">CONTACT</button></div><p class="intro">안녕하세요, 김우찬입니다.<br>높은 성능과 최적화를 추구하며,<br>웹 · 모바일 · AI로 더 나은 서비스를 만듭니다.</p><div class="welcome-stamp">LET'S BUILD<small>SOMETHING GREAT TOGETHER</small></div><hr><footer>Seongnam, Korea · <a href="https://velog.io/@redford07" target="_blank" rel="noopener">Jeremy 기술연구소</a><br>Thank you for visiting my little corner of the internet.</footer></div>`;
  const skills = `<h1 class="document-heading">Skills</h1><div class="skills-grid"><section class="skill-row"><h2>Front-End</h2><p>JSP · PHP · Vue.js · React · JavaScript · HTML · CSS</p></section><section class="skill-row"><h2>Back-End</h2><p>Java · Spring · Node.js · PHP · MySQL · Oracle · PostgreSQL</p></section><section class="skill-row"><h2>Infrastructure & Mobile</h2><p>AWS EC2 · S3 · CloudFront · Kafka · Jenkins · Shell · Android · iOS</p></section></div><p>실제 프로젝트별 기술 스택과 담당 업무는 경력 및 프로젝트 창에서 확인할 수 있습니다.</p><button class="classic-button" data-app="experience">경력 보기</button>`;
  const contact = `<h1 class="document-heading">Let's get in touch.</h1><p>프로젝트와 개발에 관한 이야기를 기다립니다.</p><div class="contact-links"><a href="mailto:thekim07@naver.com">Email<br><strong>thekim07@naver.com</strong></a><a href="tel:+821051999647">Phone<br><strong>+82-10-5199-9647</strong></a><a href="https://velog.io/@redford07" target="_blank" rel="noopener">Blog<br><strong>Jeremy 기술연구소</strong></a><a href="https://github.com/redford07" target="_blank" rel="noopener">GitHub<br><strong>redford07</strong></a></div><p>Seongnam, Korea</p>`;
  function escapeHTML(value) { return value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
  function page(app) {
    if (app === 'welcome') return home;
    if (app === 'skills') return skills;
    if (app === 'contact') return contact;
    if (app === 'gallery') return `<h1 class="document-heading">My Pictures</h1><p>사진을 선택하면 원본을 새 탭에서 볼 수 있습니다.</p><div class="gallery-grid">${content.gallery.map(image => `<figure><a href="${image.src}" target="_blank" rel="noopener"><img src="${image.src}" alt="${escapeHTML(image.title)}" loading="lazy"></a><figcaption>${escapeHTML(image.title)}</figcaption></figure>`).join('')}</div>`;
    return `<h1 class="document-heading">${labels[app]}</h1>${content[app]}`;
  }
  function focusWindow(record) {
    for (const other of windows.values()) { other.element.classList.add('inactive'); other.task.classList.remove('active'); }
    record.element.hidden = false;
    record.element.classList.remove('inactive');
    record.element.style.zIndex = ++layer;
    record.task.classList.add('active');
  }
  function render(record, app, remember = true) {
    if (remember && record.app) record.history.push(record.app);
    record.app = app;
    record.element.querySelector('.window-title').textContent = labels[app] + (app === 'welcome' ? '' : ' — WooChan OS');
    record.element.setAttribute('aria-label', labels[app]);
    record.element.querySelector('.address-path').textContent = 'C:\\WooChan\\' + (app === 'welcome' ? 'index.html' : app);
    record.element.querySelector('.window-content').innerHTML = page(app);
    record.element.querySelector('.window-content').scrollTop = 0;
    record.element.querySelector('[data-action="back"]').disabled = record.history.length === 0;
    record.task.textContent = labels[app];
  }
  function openApp(app) {
    if (!labels[app]) return;
    const existing = [...windows.values()].find(record => record.app === app);
    if (existing) { focusWindow(existing); existing.element.focus({ preventScroll: true }); return; }
    const element = document.getElementById('window-template').content.firstElementChild.cloneNode(true);
    const task = document.createElement('button');
    const id = 'window-' + (++layer);
    element.id = id;
    task.setAttribute('aria-controls', id);
    const record = { id, element, task, app: null, history: [] };
    if (windows.size && innerWidth > 650) { element.style.left = (14 + windows.size * 2 % 10) + '%'; element.style.top = (6 + windows.size * 3 % 10) + '%'; }
    windows.set(id, record);
    document.getElementById('windows').append(element);
    document.getElementById('tasks').append(task);
    render(record, app);
    focusWindow(record);
    element.focus({ preventScroll: true });
    element.addEventListener('pointerdown', () => focusWindow(record));
    task.onclick = () => {
      if (!element.hidden && task.classList.contains('active')) { element.hidden = true; task.classList.remove('active'); }
      else { focusWindow(record); element.focus({ preventScroll: true }); }
    };
    element.addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      switch (button.dataset.action) {
        case 'close': {
          element.remove(); task.remove(); windows.delete(id);
          const next = [...windows.values()].filter(item => !item.element.hidden).sort((a,b) => Number(b.element.style.zIndex)-Number(a.element.style.zIndex))[0];
          if (next) { focusWindow(next); next.element.focus({ preventScroll: true }); }
          else document.getElementById('start-button').focus();
          break;
        }
        case 'minimize': element.hidden = true; task.classList.remove('active'); task.focus(); break;
        case 'maximize': element.classList.toggle('maximized'); button.setAttribute('aria-label', element.classList.contains('maximized') ? '창 크기 복원' : '최대화'); break;
        case 'home': render(record, 'welcome'); break;
        case 'contact': render(record, 'contact'); break;
        case 'back': if (record.history.length) render(record, record.history.pop(), false); break;
      }
    });
    const title = element.querySelector('.titlebar');
    title.addEventListener('dblclick', event => { if (!event.target.closest('button')) element.classList.toggle('maximized'); });
    title.addEventListener('pointerdown', event => {
      if (event.target.closest('button') || element.classList.contains('maximized') || innerWidth <= 650) return;
      event.preventDefault();
      const left = element.offsetLeft, top = element.offsetTop, x = event.clientX, y = event.clientY;
      title.setPointerCapture(event.pointerId);
      const move = e => {
        element.style.left = Math.max(0, Math.min(innerWidth - Math.min(element.offsetWidth, innerWidth), left + e.clientX - x)) + 'px';
        element.style.top = Math.max(0, Math.min(innerHeight - 90, top + e.clientY - y)) + 'px';
      };
      const stop = () => { title.removeEventListener('pointermove', move); title.removeEventListener('pointerup', stop); title.removeEventListener('pointercancel', stop); };
      title.addEventListener('pointermove', move);
      title.addEventListener('pointerup', stop);
      title.addEventListener('pointercancel', stop);
    });
  }
  const start = document.getElementById('start-button');
  const menu = document.getElementById('start-menu');
  function closeStart() { menu.hidden = true; start.setAttribute('aria-expanded', 'false'); }
  start.onclick = () => { menu.hidden = !menu.hidden; start.setAttribute('aria-expanded', String(!menu.hidden)); };
  document.addEventListener('click', event => {
    const app = event.target.closest('[data-app]');
    if (app) {
      const owner = app.closest('.os-window');
      if (owner) { const record = windows.get(owner.id); render(record, app.dataset.app); focusWindow(record); }
      else openApp(app.dataset.app);
      closeStart();
    } else if (!event.target.closest('#start-menu, #start-button')) closeStart();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeStart();
      if (window.parent !== window) window.parent.postMessage('portfolio:escape', location.origin);
    }
  });
  function tick() { const now = new Date(); const clock = document.getElementById('clock'); clock.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); clock.dateTime = now.toISOString(); }
  tick(); setInterval(tick, 1000 * 30);
  openApp('welcome');
})();
