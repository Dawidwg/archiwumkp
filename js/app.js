/**
 * Archiwum Konkursu Piosenki ESCFORUM - Main Application
 * Pure Vanilla JavaScript SPA
 */

(function () {
  'use strict';

  // State
  let DB = null;
  const STATE = {
    theme: 'light',
    currentRoute: '',
    songSearch: '',
    editionSearch: '',
    editionSort: 'desc',
    countrySearch: '',
    participantSearch: ''
  };

  // Precomputed indexes
  const INDEX = {
    edMap: new Map(),
    paMap: new Map(),
    paNameMap: new Map(),
    ucMap: new Map(),
    piMap: new Map(),
    udByEd: new Map(),
    udByPa: new Map(),
    udByUc: new Map(),
    udByPi: new Map(),
    winnerByEd: new Map(),
    countryStats: new Map(),
    participantStats: new Map()
  };

  /* ==========================================================================
     Initialization
     ========================================================================== */

  async function init() {
    initTheme();
    setupHeaderEvents();

    if (window.ARCHIWUM_DATA) {
      DB = window.ARCHIWUM_DATA;
      processDatabase();
      startRouter();
    } else {
      try {
        const res = await fetch('data/data.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        DB = await res.json();
        processDatabase();
        startRouter();
      } catch (err) {
        document.getElementById('app').innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <h2>Nie udało się załadować bazy danych</h2>
            <p>Upewnij się, że plik <code>data/data.js</code> lub <code>data/data.json</code> istnieje.</p>
            <p class="stat-label">${escapeHtml(err.message)}</p>
          </div>
        `;
      }
    }
  }

  function processDatabase() {
    // Fill maps
    DB.edycje.forEach(e => INDEX.edMap.set(e.id, e));
    DB.panstwa.forEach(p => {
      INDEX.paMap.set(p.id, p);
      INDEX.paNameMap.set(p.nazwa, p);
    });
    DB.uczestnicy.forEach(u => INDEX.ucMap.set(u.id, u));
    DB.piosenki.forEach(p => INDEX.piMap.set(p.id, p));

    DB.udzialy.forEach(u => {
      // by edycja
      if (!INDEX.udByEd.has(u.edycjaId)) INDEX.udByEd.set(u.edycjaId, []);
      INDEX.udByEd.get(u.edycjaId).push(u);

      // by panstwo
      if (!INDEX.udByPa.has(u.panstwoId)) INDEX.udByPa.set(u.panstwoId, []);
      INDEX.udByPa.get(u.panstwoId).push(u);

      // by uczestnik
      if (!INDEX.udByUc.has(u.uczestnikId)) INDEX.udByUc.set(u.uczestnikId, []);
      INDEX.udByUc.get(u.uczestnikId).push(u);

      // by piosenka
      if (!INDEX.udByPi.has(u.piosenkaId)) INDEX.udByPi.set(u.piosenkaId, []);
      INDEX.udByPi.get(u.piosenkaId).push(u);

      // winner
      if (u.wygrana) {
        INDEX.winnerByEd.set(u.edycjaId, u);
      }
    });

    // Country stats
    DB.panstwa.forEach(p => {
      const list = INDEX.udByPa.get(p.id) || [];
      const wins = list.filter(u => u.wygrana).map(u => u.edycjaId);
      const uniqueEditions = new Set(list.map(u => u.edycjaId)).size;
      const participantMap = new Map();

      list.forEach(u => {
        if (!participantMap.has(u.uczestnikId)) {
          participantMap.set(u.uczestnikId, {
            id: u.uczestnikId,
            nick: INDEX.ucMap.get(u.uczestnikId)?.nick || 'Nieznany',
            count: 0,
            latestEdition: u.edycjaId
          });
        }
        const item = participantMap.get(u.uczestnikId);
        item.count++;
        if (u.edycjaId > item.latestEdition) item.latestEdition = u.edycjaId;
      });

      const sortedParticipants = Array.from(participantMap.values())
        .sort((a, b) => b.latestEdition - a.latestEdition || b.count - a.count);

      INDEX.countryStats.set(p.id, {
        totalStarts: list.length,
        uniqueEditions,
        wins,
        participants: sortedParticipants
      });
    });

    // Participant stats
    DB.uczestnicy.forEach(u => {
      const list = INDEX.udByUc.get(u.id) || [];
      const wins = list.filter(item => item.wygrana).map(item => item.edycjaId);
      const uniqueEditions = new Set(list.map(item => item.edycjaId)).size;
      const countryMap = new Map();

      list.forEach(item => {
        if (!countryMap.has(item.panstwoId)) {
          countryMap.set(item.panstwoId, {
            id: item.panstwoId,
            nazwa: INDEX.paMap.get(item.panstwoId)?.nazwa || 'Nieznane',
            code: INDEX.paMap.get(item.panstwoId)?.code || 'xx',
            count: 0,
            latestEdition: item.edycjaId
          });
        }
        const c = countryMap.get(item.panstwoId);
        c.count++;
        if (item.edycjaId > c.latestEdition) c.latestEdition = item.edycjaId;
      });

      const sortedCountries = Array.from(countryMap.values())
        .sort((a, b) => b.latestEdition - a.latestEdition || b.count - a.count);

      INDEX.participantStats.set(u.id, {
        totalSongs: list.length,
        uniqueEditions,
        wins,
        countries: sortedCountries
      });
    });
  }

  /* ==========================================================================
     Theme & Header
     ========================================================================== */

  function initTheme() {
    const saved = localStorage.getItem('kp_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    STATE.theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', STATE.theme);
    updateThemeToggleBtn();
  }

  function toggleTheme() {
    STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', STATE.theme);
    localStorage.setItem('kp_theme', STATE.theme);
    updateThemeToggleBtn();
  }

  function updateThemeToggleBtn() {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = STATE.theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('title', STATE.theme === 'dark' ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny');
    }
  }

  function setupHeaderEvents() {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    const mobileBtn = document.getElementById('mobile-nav-toggle');
    const nav = document.getElementById('site-nav');
    if (mobileBtn && nav) {
      mobileBtn.addEventListener('click', () => {
        nav.classList.toggle('open');
      });
      // Close on link click
      nav.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          nav.classList.remove('open');
        }
      });
    }

    // Keyboard navigation (← and →)
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const hash = window.location.hash;
      const edMatch = hash.match(/^#\/edycja\/(\d+)$/);
      if (edMatch) {
        const id = parseInt(edMatch[1], 10);
        if (e.key === 'ArrowLeft' && id > 1) {
          window.location.hash = `#/edycja/${id - 1}`;
        } else if (e.key === 'ArrowRight' && id < DB.edycje.length) {
          window.location.hash = `#/edycja/${id + 1}`;
        }
      }

      const paMatch = hash.match(/^#\/panstwo\/(\d+)$/);
      if (paMatch) {
        const id = parseInt(paMatch[1], 10);
        if (e.key === 'ArrowLeft' && id > 1) {
          window.location.hash = `#/panstwo/${id - 1}`;
        } else if (e.key === 'ArrowRight' && id < DB.panstwa.length) {
          window.location.hash = `#/panstwo/${id + 1}`;
        }
      }

      const ucMatch = hash.match(/^#\/uczestnik\/(\d+)$/);
      if (ucMatch) {
        const id = parseInt(ucMatch[1], 10);
        const ucList = DB.uczestnicy;
        const currentIdx = ucList.findIndex(u => u.id === id);
        if (currentIdx !== -1) {
          if (e.key === 'ArrowLeft' && currentIdx > 0) {
            window.location.hash = `#/uczestnik/${ucList[currentIdx - 1].id}`;
          } else if (e.key === 'ArrowRight' && currentIdx < ucList.length - 1) {
            window.location.hash = `#/uczestnik/${ucList[currentIdx + 1].id}`;
          }
        }
      }
    });
  }

  /* ==========================================================================
     Router
     ========================================================================== */

  function startRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  function handleRoute() {
    let hash = window.location.hash || '#/';
    if (hash.startsWith('#')) hash = hash.slice(1);
    if (!hash || hash === '/') hash = '/';

    // Support legacy queries
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('id') && window.location.pathname.includes('edycje_szczegoly')) {
      hash = `/edycja/${searchParams.get('id')}`;
    } else if (searchParams.has('id') && window.location.pathname.includes('panstwa_szczegoly')) {
      hash = `/panstwo/${searchParams.get('id')}`;
    } else if (searchParams.has('id') && window.location.pathname.includes('uczestnicy_szczegoly')) {
      hash = `/uczestnik/${searchParams.get('id')}`;
    }

    STATE.currentRoute = hash;
    updateNavActive(hash);

    const app = document.getElementById('app');
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Route matching
    if (hash === '/' || hash === '/home') {
      renderHome(app);
    } else if (hash === '/edycje') {
      renderEdycje(app);
    } else if (hash.startsWith('/edycja/')) {
      const id = parseInt(hash.replace('/edycja/', ''), 10);
      renderEdycjaSzczegoly(app, id);
    } else if (hash === '/piosenki') {
      renderPiosenki(app);
    } else if (hash === '/panstwa') {
      renderPanstwa(app);
    } else if (hash.startsWith('/panstwo/')) {
      const id = parseInt(hash.replace('/panstwo/', ''), 10);
      renderPanstwoSzczegoly(app, id);
    } else if (hash === '/uczestnicy') {
      renderUczestnicy(app);
    } else if (hash.startsWith('/uczestnik/')) {
      const id = parseInt(hash.replace('/uczestnik/', ''), 10);
      renderUczestnikSzczegoly(app, id);
    } else {
      renderNotFound(app);
    }
  }

  function updateNavActive(hash) {
    const links = document.querySelectorAll('.site-nav .nav-link');
    links.forEach(l => {
      const href = l.getAttribute('href') || '';
      const route = href.replace('#', '');
      let active = false;

      if (route === '/' && (hash === '/' || hash === '/home')) active = true;
      else if (route === '/edycje' && (hash === '/edycje' || hash.startsWith('/edycja/'))) active = true;
      else if (route === '/piosenki' && hash === '/piosenki') active = true;
      else if (route === '/panstwa' && (hash === '/panstwa' || hash.startsWith('/panstwo/'))) active = true;
      else if (route === '/uczestnicy' && (hash === '/uczestnicy' || hash.startsWith('/uczestnik/'))) active = true;

      l.classList.toggle('active', active);
    });
  }

  /* ==========================================================================
     Helper Components & Utilities
     ========================================================================== */

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function pluralize(n, one, few, many) {
    if (n === 1) return one;
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return few;
    }
    return many;
  }

  function formatEditionsAndSongs(edCount, songCount) {
    const edStr = `${edCount} ${pluralize(edCount, 'edycja', 'edycje', 'edycji')}`;
    const songStr = `${songCount} ${pluralize(songCount, 'piosenka', 'piosenki', 'piosenek')}`;
    return `${edStr} / ${songStr}`;
  }

  function getYtUrl(title) {
    if (!title) return 'https://www.youtube.com';
    const query = title.replace(/&/g, '').trim();
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }

  function renderYtBtn(title) {
    const url = getYtUrl(title);
    return `
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="yt-btn" title="Szukaj utworu na YouTube: ${escapeHtml(title)}">
        <svg class="yt-icon" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      </a>
    `;
  }

  function getFlagCode(countryOrName) {
    if (!countryOrName) return 'xx';
    if (typeof countryOrName === 'object' && countryOrName.code) return countryOrName.code;
    const name = typeof countryOrName === 'string' ? countryOrName : countryOrName.nazwa;
    const item = INDEX.paNameMap.get(name);
    return item?.code || 'xx';
  }

  function renderFlag(countryOrName, isLarge = false) {
    const code = getFlagCode(countryOrName);
    const name = typeof countryOrName === 'string' ? countryOrName : countryOrName?.nazwa || '';
    // Lipis flag-icons 4:3 standardized SVGs: every country (including Switzerland, Kosovo, Faroe Islands) has the exact same 4:3 ratio
    const url = `https://cdn.jsdelivr.net/gh/lipis/flag-icons@main/flags/4x3/${code.toLowerCase()}.svg`;
    return `<img src="${url}" alt="${escapeHtml(name)}" class="flag-img${isLarge ? ' flag-lg' : ''}" loading="lazy">`;
  }

  function getRandomSong() {
    if (!DB.piosenki || DB.piosenki.length === 0) return null;
    const idx = Math.floor(Math.random() * DB.piosenki.length);
    return DB.piosenki[idx];
  }

  function getRandomParticipant() {
    if (!DB.uczestnicy || DB.uczestnicy.length === 0) return null;
    const idx = Math.floor(Math.random() * DB.uczestnicy.length);
    return DB.uczestnicy[idx];
  }

  /* ==========================================================================
     VIEW: Home
     ========================================================================== */

  function renderHome(container) {
    const randomSong = getRandomSong();
    const randomUser = getRandomParticipant();

    // Calculate Hall of Fame
    const topParticipantsByWins = DB.uczestnicy
      .map(u => ({ u, stats: INDEX.participantStats.get(u.id) }))
      .filter(item => item.stats && item.stats.wins.length > 0)
      .sort((a, b) => b.stats.wins.length - a.stats.wins.length || b.stats.totalSongs - a.stats.totalSongs)
      .slice(0, 5);

    const topCountriesByWins = DB.panstwa
      .map(p => ({ p, stats: INDEX.countryStats.get(p.id) }))
      .filter(item => item.stats && item.stats.wins.length > 0)
      .sort((a, b) => b.stats.wins.length - a.stats.wins.length || b.stats.totalStarts - a.stats.totalStarts)
      .slice(0, 5);

    container.innerHTML = `
      <section class="hero">
        <div class="hero-subtitle">Oficjalne Archiwum Forum</div>
        <h1 class="hero-title">Konkurs Piosenki ESCFORUM</h1>
        <p class="hero-desc">Przeglądaj historię 100 edycji konkursu, utwory, zwycięzców, państwa oraz statystyki uczestników.</p>
        
        <!-- Global Search -->
        <div class="global-search-wrapper">
          <div class="search-input-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="global-search" class="search-input" placeholder="Szukaj..." autocomplete="off">
            <button id="clear-global-search" class="clear-search-btn" title="Wyczyść">✕</button>
          </div>
          <div id="global-search-dropdown" class="search-results-dropdown"></div>
        </div>
      </section>

      <!-- Stats Grid -->
      <section class="stats-grid">
        <a href="#/edycje" class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-info">
            <span class="stat-value">${DB.metadata.totalEditions}</span>
            <span class="stat-label">Edycji konkursu</span>
          </div>
        </a>
        <a href="#/piosenki" class="stat-card">
          <div class="stat-icon">🎵</div>
          <div class="stat-info">
            <span class="stat-value">${DB.metadata.totalSongs.toLocaleString()}</span>
            <span class="stat-label">Utworów</span>
          </div>
        </a>
        <a href="#/panstwa" class="stat-card">
          <div class="stat-icon">🌍</div>
          <div class="stat-info">
            <span class="stat-value">${DB.metadata.totalCountries}</span>
            <span class="stat-label">Reprezentacji</span>
          </div>
        </a>
        <a href="#/uczestnicy" class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-value">${DB.metadata.totalParticipants}</span>
            <span class="stat-label">Uczestników</span>
          </div>
        </a>
      </section>

      <!-- Home Highlights: Random Song & Random Participant -->
      <section class="home-grid">
        <!-- Random Song Card -->
        <div class="home-card">
          <div class="card-header-styled">
            <h3 class="card-title">🎲 Wylosowany utwór</h3>
            <button id="roll-random-song-btn" class="btn btn-outline btn-sm">Losuj inny</button>
          </div>
          <div id="random-song-container">
            ${renderRandomSongBox(randomSong)}
          </div>
        </div>

        <!-- Random Participant Card -->
        <div class="home-card">
          <div class="card-header-styled">
            <h3 class="card-title">👤 Wylosowany uczestnik</h3>
            <button id="roll-random-user-btn" class="btn btn-outline btn-sm">Losuj innego</button>
          </div>
          <div id="random-user-container">
            ${renderRandomUserBox(randomUser)}
          </div>
        </div>
      </section>

      <!-- Hall of Fame / Statistics -->
      <section class="fame-section">
        <h2 class="section-heading">👑 Rekordziści konkursu</h2>
        <div class="fame-grid">
          <!-- Top Participants -->
          <div class="fame-card">
            <div class="fame-card-title">
              <span>Najwięcej zwycięstw wśród uczestników</span>
              <a href="#/uczestnicy" class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:0.2rem 0.5rem;">Wszyscy →</a>
            </div>
            <ul class="fame-list">
              ${topParticipantsByWins.map((item, idx) => `
                <li class="fame-item">
                  <div style="display:flex; align-items:center;">
                    <span class="fame-rank ${idx === 0 ? 'fame-rank-1' : idx === 1 ? 'fame-rank-2' : idx === 2 ? 'fame-rank-3' : 'fame-rank-other'}">${idx + 1}</span>
                    <a href="#/uczestnik/${item.u.id}" style="font-weight:700;">${escapeHtml(item.u.nick)}</a>
                  </div>
                  <div style="display:flex; align-items:center; gap:0.6rem;">
                    <span style="font-size:0.85rem; color:var(--text-muted);">${formatEditionsAndSongs(item.stats.uniqueEditions, item.stats.totalSongs)}</span>
                    <span class="badge-winner">🏆 ${item.stats.wins.length}</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- Top Countries -->
          <div class="fame-card">
            <div class="fame-card-title">
              <span>Najbardziej utytułowane państwa</span>
              <a href="#/panstwa" class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:0.2rem 0.5rem;">Wszystkie →</a>
            </div>
            <ul class="fame-list">
              ${topCountriesByWins.map((item, idx) => `
                <li class="fame-item">
                  <div style="display:flex; align-items:center;">
                    <span class="fame-rank ${idx === 0 ? 'fame-rank-1' : idx === 1 ? 'fame-rank-2' : idx === 2 ? 'fame-rank-3' : 'fame-rank-other'}">${idx + 1}</span>
                    ${renderFlag(item.p)}
                    <a href="#/panstwo/${item.p.id}" style="font-weight:700;">${escapeHtml(item.p.nazwa)}</a>
                  </div>
                  <div style="display:flex; align-items:center; gap:0.6rem;">
                    <span style="font-size:0.85rem; color:var(--text-muted);">${item.stats.totalStarts} startów</span>
                    <span class="badge-winner">🏆 ${item.stats.wins.length}</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </section>
    `;

    // Events
    setupGlobalSearch();

    const rollSongBtn = document.getElementById('roll-random-song-btn');
    if (rollSongBtn) {
      rollSongBtn.addEventListener('click', () => {
        const nextSong = getRandomSong();
        const box = document.getElementById('random-song-container');
        if (box) box.innerHTML = renderRandomSongBox(nextSong);
      });
    }

    const rollUserBtn = document.getElementById('roll-random-user-btn');
    if (rollUserBtn) {
      rollUserBtn.addEventListener('click', () => {
        const nextUser = getRandomParticipant();
        const box = document.getElementById('random-user-container');
        if (box) box.innerHTML = renderRandomUserBox(nextUser);
      });
    }
  }

  function renderRandomSongBox(song) {
    if (!song) return '<p>Brak utworów w bazie.</p>';
    const participations = INDEX.udByPi.get(song.id) || [];
    const editionsList = participations.map(u => {
      const ed = INDEX.edMap.get(u.edycjaId);
      const isWin = u.wygrana ? ' 🏆' : '';
      return `<a href="#/edycja/${u.edycjaId}" class="edition-badge" title="Edycja ${u.edycjaId}: ${escapeHtml(ed?.nazwa || '')}">#${u.edycjaId}${isWin}</a>`;
    }).join(' ');

    return `
      <div class="random-song-display">
        <div>
          <div class="random-song-title">${escapeHtml(song.utwor)}</div>
          <div class="random-song-sub">Edycje z udziałem utworu: ${editionsList || 'brak'}</div>
        </div>
        <div>
          ${renderYtBtn(song.utwor)}
        </div>
      </div>
    `;
  }

  function renderRandomUserBox(user) {
    if (!user) return '<p>Brak uczestników w bazie.</p>';
    const stats = INDEX.participantStats.get(user.id) || { uniqueEditions: 0, totalSongs: 0, wins: [], countries: [] };
    const winsText = stats.wins.length > 0 
      ? `<span class="badge-winner" style="margin-left:0;">🏆 ${stats.wins.length} ${pluralize(stats.wins.length, 'wygrana', 'wygrane', 'wygranych')} (${stats.wins.map(w => '#' + w).join(', ')})</span>`
      : '<span style="color:var(--text-muted); font-size:0.88rem;">0 zwycięstw</span>';

    return `
      <div class="random-user-display">
        <div class="random-user-header">
          <a href="#/uczestnik/${user.id}" class="random-user-nick">${escapeHtml(user.nick)}</a>
          <a href="#/uczestnik/${user.id}" class="btn btn-outline btn-sm">Profil gracza →</a>
        </div>
        <div class="random-user-stats">
          <span class="stat-pill">Udziały w edycjach: <strong>${stats.uniqueEditions}</strong></span>
          <span class="stat-pill">Zgłoszone piosenki: <strong>${stats.totalSongs}</strong></span>
          <span class="stat-pill">${winsText}</span>
        </div>
        <div style="font-size:0.85rem; color:var(--text-muted);">
          Reprezentowane kraje (${stats.countries.length}): 
          <span style="color:var(--text-main);">${stats.countries.slice(0, 8).map(c => renderFlag(c) + ' ' + escapeHtml(c.nazwa)).join(', ') || 'brak'}</span>
          ${stats.countries.length > 8 ? ` i ${stats.countries.length - 8} więcej...` : ''}
        </div>
      </div>
    `;
  }

  function setupGlobalSearch() {
    const input = document.getElementById('global-search');
    const dropdown = document.getElementById('global-search-dropdown');
    const clearBtn = document.getElementById('clear-global-search');
    if (!input || !dropdown) return;

    let timeout = null;
    input.addEventListener('input', () => {
      clearTimeout(timeout);
      const q = input.value.trim().toLowerCase();
      if (!q) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        return;
      }

      timeout = setTimeout(() => {
        performGlobalSearch(q, dropdown);
      }, 150);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        dropdown.classList.remove('active');
        input.focus();
      });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.global-search-wrapper')) {
        dropdown.classList.remove('active');
      }
    });

    // Close on Esc
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.remove('active');
      }
    });
  }

  function performGlobalSearch(q, dropdown) {
    const matchingEdycje = DB.edycje.filter(e => 
      e.id.toString() === q || e.nazwa.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchingSongs = DB.piosenki.filter(p => 
      p.utwor.toLowerCase().includes(q)
    ).slice(0, 8);

    const matchingCountries = DB.panstwa.filter(p => 
      p.nazwa.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchingUsers = DB.uczestnicy.filter(u => 
      u.nick.toLowerCase().includes(q)
    ).slice(0, 5);

    const totalMatches = matchingEdycje.length + matchingSongs.length + matchingCountries.length + matchingUsers.length;

    if (totalMatches === 0) {
      dropdown.innerHTML = `<div style="padding: 1.25rem; text-align: center; color: var(--text-muted);">Brak wyników dla "<strong>${escapeHtml(q)}</strong>"</div>`;
      dropdown.classList.add('active');
      return;
    }

    let html = '';

    if (matchingEdycje.length > 0) {
      html += `
        <div class="dropdown-section">
          <div class="dropdown-section-header">🏆 Edycje</div>
          ${matchingEdycje.map(e => `
            <a href="#/edycja/${e.id}" class="dropdown-item">
              <div class="dropdown-item-left">
                <span class="edition-badge">#${e.id}</span>
                <strong>Edycja ${e.id}</strong> - ${escapeHtml(e.nazwa)}
              </div>
              <div class="dropdown-item-meta">Przejdź →</div>
            </a>
          `).join('')}
        </div>
      `;
    }

    if (matchingSongs.length > 0) {
      html += `
        <div class="dropdown-section">
          <div class="dropdown-section-header">🎵 Piosenki</div>
          ${matchingSongs.map(p => {
            const parts = INDEX.udByPi.get(p.id) || [];
            const edNums = parts.map(u => '#' + u.edycjaId).join(', ');
            return `
              <div class="dropdown-item" style="cursor:default;">
                <div class="dropdown-item-left">
                  <span>🎵</span>
                  <a href="#/piosenki?q=${encodeURIComponent(p.utwor)}" style="font-weight:600;">${escapeHtml(p.utwor)}</a>
                </div>
                <div class="dropdown-item-meta" style="display:flex; align-items:center; gap:0.5rem;">
                  <span>${edNums}</span>
                  ${renderYtBtn(p.utwor)}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    if (matchingCountries.length > 0) {
      html += `
        <div class="dropdown-section">
          <div class="dropdown-section-header">🌍 Państwa</div>
          ${matchingCountries.map(p => {
            const st = INDEX.countryStats.get(p.id);
            return `
              <a href="#/panstwo/${p.id}" class="dropdown-item">
                <div class="dropdown-item-left">
                  ${renderFlag(p)}
                  <strong>${escapeHtml(p.nazwa)}</strong>
                </div>
                <div class="dropdown-item-meta">${st?.totalStarts || 0} startów ${st?.wins?.length ? `• ${st.wins.length} 🏆` : ''}</div>
              </a>
            `;
          }).join('')}
        </div>
      `;
    }

    if (matchingUsers.length > 0) {
      html += `
        <div class="dropdown-section">
          <div class="dropdown-section-header">👤 Uczestnicy</div>
          ${matchingUsers.map(u => {
            const st = INDEX.participantStats.get(u.id);
            return `
              <a href="#/uczestnik/${u.id}" class="dropdown-item">
                <div class="dropdown-item-left">
                  <span>👤</span>
                  <strong>${escapeHtml(u.nick)}</strong>
                </div>
                <div class="dropdown-item-meta">${formatEditionsAndSongs(st?.uniqueEditions || 0, st?.totalSongs || 0)} ${st?.wins?.length ? `• ${st.wins.length} 🏆` : ''}</div>
              </a>
            `;
          }).join('')}
        </div>
      `;
    }

    dropdown.innerHTML = html;
    dropdown.classList.add('active');
  }

  /* ==========================================================================
     VIEW: Edycje
     ========================================================================== */

  function renderEdycje(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🏆 Edycje Konkursu</h1>
      </div>

      <div class="page-controls">
        <div class="filter-input-wrap">
          <span class="filter-icon">🔍</span>
          <input type="text" id="edition-filter" class="filter-input" placeholder="Szukaj..." value="${escapeHtml(STATE.editionSearch)}">
        </div>
        <button id="toggle-edition-sort" class="btn btn-outline btn-sm">
          ${STATE.editionSort === 'desc' ? 'Sortuj: Od najnowszych (100-1) ▼' : 'Sortuj: Od najstarszych (1-100) ▲'}
        </button>
      </div>

      <div class="table-wrapper">
        <table class="responsive-table">
          <thead>
            <tr>
              <th style="width: 70px; text-align: center;">Edycja</th>
              <th>Nazwa</th>
              <th style="width: 45px; text-align: center;">YT</th>
              <th>Zwycięski Utwór</th>
              <th>Zwycięskie Państwo</th>
              <th>Zwycięzca</th>
            </tr>
          </thead>
          <tbody id="editions-table-body"></tbody>
        </table>
      </div>
    `;

    const filterInput = document.getElementById('edition-filter');
    const sortBtn = document.getElementById('toggle-edition-sort');
    const tableBody = document.getElementById('editions-table-body');

    function updateTable() {
      const q = STATE.editionSearch.toLowerCase().trim();
      let list = DB.edycje.slice();

      if (STATE.editionSort === 'desc') {
        list.sort((a, b) => b.id - a.id);
      } else {
        list.sort((a, b) => a.id - b.id);
      }

      if (q) {
        list = list.filter(e => {
          const idStr = e.id.toString();
          const nameMatch = e.nazwa.toLowerCase().includes(q);
          const winner = INDEX.winnerByEd.get(e.id);
          const song = winner ? INDEX.piMap.get(winner.piosenkaId) : null;
          const country = winner ? INDEX.paMap.get(winner.panstwoId) : null;
          const user = winner ? INDEX.ucMap.get(winner.uczestnikId) : null;

          return idStr === q ||
            nameMatch ||
            (song && song.utwor.toLowerCase().includes(q)) ||
            (country && country.nazwa.toLowerCase().includes(q)) ||
            (user && user.nick.toLowerCase().includes(q));
        });
      }

      if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Brak edycji spełniających kryteria.</td></tr>`;
        return;
      }

      tableBody.innerHTML = list.map(e => {
        const winner = INDEX.winnerByEd.get(e.id);
        const song = winner ? INDEX.piMap.get(winner.piosenkaId) : null;
        const country = winner ? INDEX.paMap.get(winner.panstwoId) : null;
        const user = winner ? INDEX.ucMap.get(winner.uczestnikId) : null;

        return `
          <tr>
            <td style="text-align: center;">
              <a href="#/edycja/${e.id}" class="edition-badge">#${e.id}</a>
            </td>
            <td>
              <a href="#/edycja/${e.id}" style="font-weight: 600;">${escapeHtml(e.nazwa)}</a>
            </td>
            <td style="text-align: center;">
              ${song ? renderYtBtn(song.utwor) : '-'}
            </td>
            <td>
              ${song ? `<strong>${escapeHtml(song.utwor)}</strong>` : '<span style="color:var(--text-muted);">-</span>'}
            </td>
            <td>
              ${country ? `${renderFlag(country)} <a href="#/panstwo/${country.id}">${escapeHtml(country.nazwa)}</a>` : '-'}
            </td>
            <td>
              ${user ? `<a href="#/uczestnik/${user.id}">${escapeHtml(user.nick)}</a>` : '-'}
            </td>
          </tr>
        `;
      }).join('');
    }

    filterInput.addEventListener('input', (e) => {
      STATE.editionSearch = e.target.value;
      updateTable();
    });

    sortBtn.addEventListener('click', () => {
      STATE.editionSort = STATE.editionSort === 'desc' ? 'asc' : 'desc';
      sortBtn.textContent = STATE.editionSort === 'desc' ? 'Sortuj: Od najnowszych (100-1) ▼' : 'Sortuj: Od najstarszych (1-100) ▲';
      updateTable();
    });

    updateTable();
  }

  /* ==========================================================================
     VIEW: Edycja Szczegóły
     ========================================================================== */

  function renderEdycjaSzczegoly(container, id) {
    const edition = INDEX.edMap.get(id);
    if (!edition) {
      renderNotFound(container, `Edycja #${id} nie istnieje.`);
      return;
    }

    const participations = INDEX.udByEd.get(id) || [];
    // Sort entries alphabetically by country name
    const entries = participations.map(u => ({
      udzial: u,
      song: INDEX.piMap.get(u.piosenkaId),
      country: INDEX.paMap.get(u.panstwoId),
      user: INDEX.ucMap.get(u.uczestnikId)
    })).sort((a, b) => (a.country?.nazwa || '').localeCompare(b.country?.nazwa || '', 'pl'));

    const maxEd = DB.edycje.length;

    container.innerHTML = `
      <div class="detail-card">
        <div class="detail-header-row">
          <div>
            <div style="font-size: 0.9rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em;">Szczegóły Konkursu</div>
            <h1 class="page-title">Edycja #${edition.id} &ndash; ${escapeHtml(edition.nazwa)}</h1>
          </div>
          <div class="detail-nav-buttons">
            ${id > 1 ? `<button id="prev-ed-btn" class="btn btn-outline btn-sm">← Poprzednia edycja</button>` : ''}
            <a href="#/edycje" class="btn btn-outline btn-sm">Wszystkie edycje</a>
            ${id < maxEd ? `<button id="next-ed-btn" class="btn btn-outline btn-sm">Następna edycja →</button>` : ''}
          </div>
        </div>

        <!-- Scorewiz / Links -->
        <div class="scorewiz-links-box">
          <span class="scorewiz-label">Tabele i wyniki:</span>
          ${edition.scorewiz && edition.scorewiz.length > 0 ? edition.scorewiz.map(item => `
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="scorewiz-btn">
              🔗 ${escapeHtml(item.label)} ↗
            </a>
          `).join('') : '<span style="color: var(--text-muted); font-size: 0.9rem;">Brak zewnętrznych tabel</span>'}
        </div>

        <!-- Filter within this edition -->
        <div class="page-controls" style="margin-bottom: 1rem;">
          <div class="filter-input-wrap">
            <span class="filter-icon">🔍</span>
            <input type="text" id="ed-entry-filter" class="filter-input" placeholder="Szukaj...">
          </div>
        </div>

        <div class="table-wrapper" style="margin-bottom: 0;">
          <table class="responsive-table">
            <thead>
              <tr>
                <th style="width: 45px; text-align: center;">YT</th>
                <th>Utwór</th>
                <th>Państwo</th>
                <th>Uczestnik</th>
              </tr>
            </thead>
            <tbody id="ed-entries-body"></tbody>
          </table>
        </div>
      </div>
    `;

    const filterInput = document.getElementById('ed-entry-filter');
    const tableBody = document.getElementById('ed-entries-body');

    function updateEntriesTable() {
      const q = (filterInput && filterInput.value ? filterInput.value : '').toLowerCase().trim();
      let list = entries;

      if (q) {
        list = list.filter(item => 
          (item.song?.utwor && item.song.utwor.toLowerCase().includes(q)) ||
          (item.country?.nazwa && item.country.nazwa.toLowerCase().includes(q)) ||
          (item.user?.nick && item.user.nick.toLowerCase().includes(q))
        );
      }

      if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="empty-state">Brak wyników wyszukiwania.</td></tr>`;
        return;
      }

      tableBody.innerHTML = list.map(item => {
        const isWinner = item.udzial.wygrana;
        return `
          <tr class="${isWinner ? 'row-winner' : ''}">
            <td style="text-align: center;">
              ${renderYtBtn(item.song?.utwor || '')}
            </td>
            <td>
              <span>${escapeHtml(item.song?.utwor || '')}</span>
              ${isWinner ? '<span class="badge-winner">🏆 Zwycięzca</span>' : ''}
            </td>
            <td>
              ${renderFlag(item.country)}
              <a href="#/panstwo/${item.country?.id}" style="font-weight: 500;">${escapeHtml(item.country?.nazwa || '')}</a>
            </td>
            <td>
              <a href="#/uczestnik/${item.user?.id}" style="font-weight: 500;">${escapeHtml(item.user?.nick || '')}</a>
            </td>
          </tr>
        `;
      }).join('');
    }

    filterInput.addEventListener('input', updateEntriesTable);
    updateEntriesTable();

    // Nav buttons (only exist if id > 1 or id < maxEd)
    const prevBtn = document.getElementById('prev-ed-btn');
    const nextBtn = document.getElementById('next-ed-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => window.location.hash = `#/edycja/${id - 1}`);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => window.location.hash = `#/edycja/${id + 1}`);
    }
  }

  /* ==========================================================================
     VIEW: Piosenki (Bez paginacji, bez losowania)
     ========================================================================== */

  function renderPiosenki(container) {
    const searchParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    if (searchParams.has('q')) {
      STATE.songSearch = searchParams.get('q');
    }

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🎵 Piosenki</h1>
      </div>

      <!-- Controls -->
      <div class="page-controls">
        <div class="filter-input-wrap">
          <span class="filter-icon">🔍</span>
          <input type="text" id="songs-filter" class="filter-input" placeholder="Szukaj..." value="${escapeHtml(STATE.songSearch)}">
        </div>
      </div>

      <div class="table-wrapper">
        <table class="responsive-table">
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">YT</th>
              <th>Utwór</th>
              <th>Edycje (występy)</th>
            </tr>
          </thead>
          <tbody id="songs-table-body"></tbody>
        </table>
      </div>
    `;

    const filterInput = document.getElementById('songs-filter');
    const tableBody = document.getElementById('songs-table-body');

    function updateSongsView() {
      const q = STATE.songSearch.toLowerCase().trim();
      let list = DB.piosenki;

      if (q) {
        list = list.filter(p => p.utwor.toLowerCase().includes(q));
      }

      if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" class="empty-state">Brak utworów spełniających kryteria.</td></tr>`;
        return;
      }

      tableBody.innerHTML = list.map(p => {
        const participations = INDEX.udByPi.get(p.id) || [];
        const editionsHtml = participations.map(u => {
          const ed = INDEX.edMap.get(u.edycjaId);
          const isWin = u.wygrana ? ' 🏆' : '';
          return `<a href="#/edycja/${u.edycjaId}" class="edition-badge" title="Edycja ${u.edycjaId}: ${escapeHtml(ed?.nazwa || '')}">#${u.edycjaId}${isWin}</a>`;
        }).join(' ');

        return `
          <tr>
            <td style="text-align: center;">
              ${renderYtBtn(p.utwor)}
            </td>
            <td>
              <strong>${escapeHtml(p.utwor)}</strong>
            </td>
            <td>
              <div class="tag-list">${editionsHtml || '-'}</div>
            </td>
          </tr>
        `;
      }).join('');
    }

    filterInput.addEventListener('input', (e) => {
      STATE.songSearch = e.target.value;
      updateSongsView();
    });

    updateSongsView();
  }

  /* ==========================================================================
     VIEW: Państwa
     ========================================================================== */

  function renderPanstwa(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🌍 Państwa</h1>
      </div>

      <div class="page-controls">
        <div class="filter-input-wrap">
          <span class="filter-icon">🔍</span>
          <input type="text" id="countries-filter" class="filter-input" placeholder="Szukaj..." value="${escapeHtml(STATE.countrySearch)}">
        </div>
      </div>

      <div class="table-wrapper">
        <table class="responsive-table">
          <thead>
            <tr>
              <th>Państwo</th>
              <th style="width: 100px; text-align: center;">Starty</th>
              <th style="width: 110px; text-align: center;">Zwycięstwa</th>
              <th>Prowadzący uczestnicy</th>
            </tr>
          </thead>
          <tbody id="countries-table-body"></tbody>
        </table>
      </div>
    `;

    const filterInput = document.getElementById('countries-filter');
    const tableBody = document.getElementById('countries-table-body');

    function updateCountriesTable() {
      const q = STATE.countrySearch.toLowerCase().trim();
      let list = DB.panstwa.slice().sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'));

      if (q) {
        list = list.filter(p => {
          if (p.nazwa.toLowerCase().includes(q)) return true;
          const stats = INDEX.countryStats.get(p.id);
          return stats && stats.participants.some(item => item.nick.toLowerCase().includes(q));
        });
      }

      if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="empty-state">Brak państw spełniających kryteria.</td></tr>`;
        return;
      }

      tableBody.innerHTML = list.map(p => {
        const stats = INDEX.countryStats.get(p.id) || { totalStarts: 0, wins: [], participants: [] };
        // Always show (count) for participants, including (1)
        const participantsHtml = stats.participants.map(u => 
          `<a href="#/uczestnik/${u.id}" class="pill-link">${escapeHtml(u.nick)} (${u.count})</a>`
        ).join(' ');

        return `
          <tr>
            <td>
              ${renderFlag(p)}
              <a href="#/panstwo/${p.id}" style="font-weight: 700;">${escapeHtml(p.nazwa)}</a>
            </td>
            <td style="text-align: center;">
              <strong>${stats.totalStarts}</strong>
            </td>
            <td style="text-align: center;">
              ${stats.wins.length > 0 ? `<span class="badge-winner">🏆 ${stats.wins.length}</span>` : '<span style="color:var(--text-muted);">-</span>'}
            </td>
            <td>
              <div class="tag-list">${participantsHtml || '-'}</div>
            </td>
          </tr>
        `;
      }).join('');
    }

    filterInput.addEventListener('input', (e) => {
      STATE.countrySearch = e.target.value;
      updateCountriesTable();
    });

    updateCountriesTable();
  }

  /* ==========================================================================
     VIEW: Państwo Szczegóły
     ========================================================================== */

  function renderPanstwoSzczegoly(container, id) {
    const country = INDEX.paMap.get(id);
    if (!country) {
      renderNotFound(container, `Państwo #${id} nie istnieje.`);
      return;
    }

    const stats = INDEX.countryStats.get(id) || { totalStarts: 0, wins: [], participants: [] };
    const participations = (INDEX.udByPa.get(id) || []).slice().sort((a, b) => b.edycjaId - a.edycjaId);
    const maxPa = DB.panstwa.length;

    container.innerHTML = `
      <div class="detail-card">
        <div class="detail-header-row">
          <div style="display: flex; align-items: center; gap: 1rem;">
            ${renderFlag(country, true)}
            <div>
              <div style="font-size: 0.9rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em;">Szczegóły Reprezentacji</div>
              <h1 class="page-title" style="margin: 0;">${escapeHtml(country.nazwa)}</h1>
            </div>
          </div>
          <div class="detail-nav-buttons">
            ${id > 1 ? `<button id="prev-pa-btn" class="btn btn-outline btn-sm">← Poprzednie państwo</button>` : ''}
            <a href="#/panstwa" class="btn btn-outline btn-sm">Wszystkie państwa</a>
            ${id < maxPa ? `<button id="next-pa-btn" class="btn btn-outline btn-sm">Następne państwo →</button>` : ''}
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem;">
          <span class="stat-pill">Liczba startów: <strong>${stats.totalStarts}</strong></span>
          <span class="stat-pill">Zwycięstwa: <strong>${stats.wins.length}</strong> ${stats.wins.length > 0 ? `(Edycje: ${stats.wins.map(w => '#' + w).join(', ')})` : ''}</span>
          <span class="stat-pill">Liczba reprezentantów: <strong>${stats.participants.length}</strong></span>
        </div>

        <div class="page-controls" style="margin-bottom: 1rem;">
          <div class="filter-input-wrap">
            <span class="filter-icon">🔍</span>
            <input type="text" id="pa-entries-filter" class="filter-input" placeholder="Szukaj...">
          </div>
        </div>

        <div class="table-wrapper" style="margin-bottom: 0;">
          <table class="responsive-table">
            <thead>
              <tr>
                <th style="width: 70px; text-align: center;">Edycja</th>
                <th>Nazwa edycji</th>
                <th style="width: 45px; text-align: center;">YT</th>
                <th>Utwór</th>
                <th>Uczestnik</th>
              </tr>
            </thead>
            <tbody id="pa-entries-body"></tbody>
          </table>
        </div>
      </div>
    `;

    const filterInput = document.getElementById('pa-entries-filter');
    const tableBody = document.getElementById('pa-entries-body');

    function updateTable() {
      const q = (filterInput && filterInput.value ? filterInput.value : '').toLowerCase().trim();
      let list = participations;

      if (q) {
        list = list.filter(u => {
          const ed = INDEX.edMap.get(u.edycjaId);
          const song = INDEX.piMap.get(u.piosenkaId);
          const user = INDEX.ucMap.get(u.uczestnikId);
          return u.edycjaId.toString() === q ||
            (ed && ed.nazwa.toLowerCase().includes(q)) ||
            (song && song.utwor.toLowerCase().includes(q)) ||
            (user && user.nick.toLowerCase().includes(q));
        });
      }

      if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">Brak występów spełniających kryteria.</td></tr>`;
        return;
      }

      tableBody.innerHTML = list.map(u => {
        const ed = INDEX.edMap.get(u.edycjaId);
        const song = INDEX.piMap.get(u.piosenkaId);
        const user = INDEX.ucMap.get(u.uczestnikId);
        const isWin = u.wygrana;

        return `
          <tr class="${isWin ? 'row-winner' : ''}">
            <td style="text-align: center;">
              <a href="#/edycja/${u.edycjaId}" class="edition-badge">#${u.edycjaId}</a>
            </td>
            <td>
              <a href="#/edycja/${u.edycjaId}">${escapeHtml(ed?.nazwa || '')}</a>
            </td>
            <td style="text-align: center;">
              ${renderYtBtn(song?.utwor || '')}
            </td>
            <td>
              <span>${escapeHtml(song?.utwor || '')}</span>
              ${isWin ? '<span class="badge-winner">🏆 Zwycięzca</span>' : ''}
            </td>
            <td>
              <a href="#/uczestnik/${user?.id}">${escapeHtml(user?.nick || '')}</a>
            </td>
          </tr>
        `;
      }).join('');
    }

    filterInput.addEventListener('input', updateTable);
    updateTable();

    const prevBtn = document.getElementById('prev-pa-btn');
    const nextBtn = document.getElementById('next-pa-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => window.location.hash = `#/panstwo/${id - 1}`);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => window.location.hash = `#/panstwo/${id + 1}`);
    }
  }

  /* ==========================================================================
     VIEW: Uczestnicy
     ========================================================================== */

  function renderUczestnicy(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">👥 Uczestnicy</h1>
      </div>

      <div class="page-controls">
        <div class="filter-input-wrap">
          <span class="filter-icon">🔍</span>
          <input type="text" id="users-filter" class="filter-input" placeholder="Szukaj..." value="${escapeHtml(STATE.participantSearch)}">
        </div>
      </div>

      <div class="table-wrapper">
        <table class="responsive-table">
          <thead>
            <tr>
              <th>Uczestnik</th>
              <th style="width: 90px; text-align: center;">Edycje</th>
              <th style="width: 95px; text-align: center;">Piosenki</th>
              <th style="width: 100px; text-align: center;">Zwycięstwa</th>
              <th>Prowadzone państwa</th>
            </tr>
          </thead>
          <tbody id="users-table-body"></tbody>
        </table>
      </div>
    `;

    const filterInput = document.getElementById('users-filter');
    const tableBody = document.getElementById('users-table-body');

    function updateUsersTable() {
      const q = STATE.participantSearch.toLowerCase().trim();
      let list = DB.uczestnicy.slice().sort((a, b) => a.nick.localeCompare(b.nick, 'pl'));

      if (q) {
        list = list.filter(u => {
          if (u.nick.toLowerCase().includes(q)) return true;
          const stats = INDEX.participantStats.get(u.id);
          return stats && stats.countries.some(item => item.nazwa.toLowerCase().includes(q));
        });
      }

      if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">Brak uczestników spełniających kryteria.</td></tr>`;
        return;
      }

      tableBody.innerHTML = list.map(u => {
        const stats = INDEX.participantStats.get(u.id) || { uniqueEditions: 0, totalSongs: 0, wins: [], countries: [] };
        // Always show (count) for countries, including (1)
        const countriesHtml = stats.countries.map(c => 
          `<a href="#/panstwo/${c.id}" class="pill-link">${renderFlag(c)} ${escapeHtml(c.nazwa)} (${c.count})</a>`
        ).join(' ');

        return `
          <tr>
            <td>
              <a href="#/uczestnik/${u.id}" style="font-weight: 700;">${escapeHtml(u.nick)}</a>
            </td>
            <td style="text-align: center;">
              <strong>${stats.uniqueEditions}</strong>
            </td>
            <td style="text-align: center; color: var(--text-muted);">
              ${stats.totalSongs}
            </td>
            <td style="text-align: center;">
              ${stats.wins.length > 0 ? `<span class="badge-winner">🏆 ${stats.wins.length}</span>` : '<span style="color:var(--text-muted);">-</span>'}
            </td>
            <td>
              <div class="tag-list">${countriesHtml || '-'}</div>
            </td>
          </tr>
        `;
      }).join('');
    }

    filterInput.addEventListener('input', (e) => {
      STATE.participantSearch = e.target.value;
      updateUsersTable();
    });

    updateUsersTable();
  }

  /* ==========================================================================
     VIEW: Uczestnik Szczegóły
     ========================================================================== */

  function renderUczestnikSzczegoly(container, id) {
    const user = INDEX.ucMap.get(id);
    if (!user) {
      renderNotFound(container, `Uczestnik #${id} nie istnieje.`);
      return;
    }

    const stats = INDEX.participantStats.get(id) || { uniqueEditions: 0, totalSongs: 0, wins: [], countries: [] };
    const participations = (INDEX.udByUc.get(id) || []).slice().sort((a, b) => b.edycjaId - a.edycjaId);
    const sortedUserList = DB.uczestnicy;
    const currentIdx = sortedUserList.findIndex(u => u.id === id);

    container.innerHTML = `
      <div class="detail-card">
        <div class="detail-header-row">
          <div>
            <div style="font-size: 0.9rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em;">Profil Uczestnika</div>
            <h1 class="page-title" style="margin: 0;">👤 ${escapeHtml(user.nick)}</h1>
          </div>
          <div class="detail-nav-buttons">
            ${currentIdx > 0 ? `<button id="prev-uc-btn" class="btn btn-outline btn-sm">← Poprzedni uczestnik</button>` : ''}
            <a href="#/uczestnicy" class="btn btn-outline btn-sm">Wszyscy uczestnicy</a>
            ${currentIdx < sortedUserList.length - 1 ? `<button id="next-uc-btn" class="btn btn-outline btn-sm">Następny uczestnik →</button>` : ''}
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem;">
          <span class="stat-pill">Udziały w edycjach: <strong>${stats.uniqueEditions}</strong></span>
          <span class="stat-pill">Zgłoszone piosenki: <strong>${stats.totalSongs}</strong></span>
          <span class="stat-pill">Zwycięstwa: <strong>${stats.wins.length}</strong> ${stats.wins.length > 0 ? `(Edycje: ${stats.wins.map(w => '#' + w).join(', ')})` : ''}</span>
          <span class="stat-pill">Reprezentowane kraje: <strong>${stats.countries.length}</strong></span>
        </div>

        <div class="page-controls" style="margin-bottom: 1rem;">
          <div class="filter-input-wrap">
            <span class="filter-icon">🔍</span>
            <input type="text" id="uc-entries-filter" class="filter-input" placeholder="Szukaj...">
          </div>
        </div>

        <div class="table-wrapper" style="margin-bottom: 0;">
          <table class="responsive-table">
            <thead>
              <tr>
                <th style="width: 70px; text-align: center;">Edycja</th>
                <th>Nazwa edycji</th>
                <th style="width: 45px; text-align: center;">YT</th>
                <th>Utwór</th>
                <th>Państwo</th>
              </tr>
            </thead>
            <tbody id="uc-entries-body"></tbody>
          </table>
        </div>
      </div>
    `;

    const filterInput = document.getElementById('uc-entries-filter');
    const tableBody = document.getElementById('uc-entries-body');

    function updateTable() {
      const q = (filterInput && filterInput.value ? filterInput.value : '').toLowerCase().trim();
      let list = participations;

      if (q) {
        list = list.filter(u => {
          const ed = INDEX.edMap.get(u.edycjaId);
          const song = INDEX.piMap.get(u.piosenkaId);
          const country = INDEX.paMap.get(u.panstwoId);
          return u.edycjaId.toString() === q ||
            (ed && ed.nazwa.toLowerCase().includes(q)) ||
            (song && song.utwor.toLowerCase().includes(q)) ||
            (country && country.nazwa.toLowerCase().includes(q));
        });
      }

      if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">Brak zgłoszeń spełniających kryteria.</td></tr>`;
        return;
      }

      tableBody.innerHTML = list.map(u => {
        const ed = INDEX.edMap.get(u.edycjaId);
        const song = INDEX.piMap.get(u.piosenkaId);
        const country = INDEX.paMap.get(u.panstwoId);
        const isWin = u.wygrana;

        return `
          <tr class="${isWin ? 'row-winner' : ''}">
            <td style="text-align: center;">
              <a href="#/edycja/${u.edycjaId}" class="edition-badge">#${u.edycjaId}</a>
            </td>
            <td>
              <a href="#/edycja/${u.edycjaId}">${escapeHtml(ed?.nazwa || '')}</a>
            </td>
            <td style="text-align: center;">
              ${renderYtBtn(song?.utwor || '')}
            </td>
            <td>
              <span>${escapeHtml(song?.utwor || '')}</span>
              ${isWin ? '<span class="badge-winner">🏆 Zwycięzca</span>' : ''}
            </td>
            <td>
              ${renderFlag(country)}
              <a href="#/panstwo/${country?.id}">${escapeHtml(country?.nazwa || '')}</a>
            </td>
          </tr>
        `;
      }).join('');
    }

    filterInput.addEventListener('input', updateTable);
    updateTable();

    const prevBtn = document.getElementById('prev-uc-btn');
    const nextBtn = document.getElementById('next-uc-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => window.location.hash = `#/uczestnik/${sortedUserList[currentIdx - 1].id}`);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => window.location.hash = `#/uczestnik/${sortedUserList[currentIdx + 1].id}`);
    }
  }

  /* ==========================================================================
     VIEW: 404
     ========================================================================== */

  function renderNotFound(container, msg = 'Strona nie została odnaleziona.') {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h2>404 - Nie znaleziono</h2>
        <p>${escapeHtml(msg)}</p>
        <a href="#/" class="btn btn-primary" style="margin-top: 1rem;">Wróć do strony głównej</a>
      </div>
    `;
  }

  // Start app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
