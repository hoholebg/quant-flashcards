// QuantCards — Master WSO Quant & S&T Flashcard Engine

let allCards = [];
let filteredCards = [];
let currentIndex = 0;
let isFlipped = false;
let salariesData = {};

// Local Storage Sets
const masteredSet = new Set(JSON.parse(localStorage.getItem('quant_mastered') || '[]'));
const reviewSet = new Set(JSON.parse(localStorage.getItem('quant_review') || '[]'));
const favoritesSet = new Set(JSON.parse(localStorage.getItem('quant_favorites') || '[]'));

// Filters state
let currentTag = 'ALL';
let currentCompany = 'ALL';
let currentDifficulty = 'ALL';
let searchQuery = '';
let onlyFavorites = false;
let onlyReview = false;

// DOM Elements
const cardScene = document.getElementById('card-scene');
const activeCard = document.getElementById('active-card');
const cardCompany = document.getElementById('card-company');
const cardTags = document.getElementById('card-tags');
const cardRole = document.getElementById('card-role');
const cardCity = document.getElementById('card-city');
const cardDate = document.getElementById('card-date');
const cardDiff = document.getElementById('card-diff');
const cardQuestion = document.getElementById('card-question');
const cardAnswer = document.getElementById('card-answer');
const cardProcessFull = document.getElementById('card-process-full');
const cardSourceLink = document.getElementById('card-source-link');
const cardOutcome = document.getElementById('card-outcome');
const cardFavBtn = document.getElementById('card-fav-btn');

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const flipBtn = document.getElementById('flip-btn');
const masteredBtn = document.getElementById('mastered-btn');
const reviewBtn = document.getElementById('review-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const favFilterBtn = document.getElementById('fav-filter-btn');

const companyFilter = document.getElementById('company-filter');
const difficultyFilter = document.getElementById('difficulty-filter');
const searchInput = document.getElementById('search-input');
const tagsChips = document.getElementById('tags-chips');

const cardIndexIndicator = document.getElementById('card-index-indicator');
const progressFill = document.getElementById('progress-fill');
const progressPct = document.getElementById('progress-pct');
const masteredCountEl = document.getElementById('mastered-count');
const favCountEl = document.getElementById('fav-count');

// Company Badge Color Mapping
const BADGE_COLORS = {
  'Jane Street': 'badge-jane',
  'Optiver': 'badge-optiver',
  'Citadel': 'badge-citadel',
  'SIG (Susquehanna)': 'badge-sig',
  'Akuna Capital': 'badge-akuna',
  'IMC Trading': 'badge-imc',
  'DRW': 'badge-drw',
  'BNP Paribas': 'badge-bnp',
  'Société Générale': 'badge-sg',
  'Goldman Sachs': 'badge-goldman',
  'Hudson River Trading': 'badge-hrt',
  'Five Rings': 'badge-fiverings',
  'Two Sigma': 'badge-twosigma',
  'D.E. Shaw': 'badge-deshaw',
  'Point72 / Cubist': 'badge-point72',
  'Millennium': 'badge-millennium',
  'Bank of America': 'badge-bofa',
  'Morgan Stanley': 'badge-morganstanley',
  'J.P. Morgan': 'badge-jpmorgan',
  'Jump Trading': 'badge-jump',
  'Flow Traders': 'badge-flow',
  'Belvedere Trading': 'badge-belvedere',
  'CTC': 'badge-ctc',
  'Peak6': 'badge-peak6',
  'Maven': 'badge-maven',
  'Qube': 'badge-qube'
};

// Firm Groupings for Decks Hub
const FIRM_GROUPS = {
  prop: [
    'Jane Street',
    'Optiver',
    'SIG (Susquehanna)',
    'Akuna Capital',
    'IMC Trading',
    'DRW',
    'Five Rings',
    'Belvedere Trading',
    'CTC',
    'Hudson River Trading',
    'Peak6',
    'Maven',
    'Jump Trading',
    'Flow Traders'
  ],
  banks: [
    'Bank of America',
    'Morgan Stanley',
    'BNP Paribas',
    'Goldman Sachs',
    'Société Générale',
    'J.P. Morgan'
  ],
  funds: [
    'Citadel',
    'Point72 / Cubist',
    'D.E. Shaw',
    'Two Sigma',
    'Millennium',
    'Qube'
  ]
};

// Initialize App
async function init() {
  try {
    const res = await fetch('cards.json');
    allCards = await res.json();
    
    const totalCardsBadge = document.getElementById('total-cards-badge');
    if (totalCardsBadge) totalCardsBadge.innerText = allCards.length;

    // Load salaries data in background
    fetch('salaries.json').then(r => r.json()).then(data => {
      salariesData = data;
      renderSalariesTable();
      renderReviewsList();
    }).catch(err => console.log('Salaries load error:', err));

    populateCompanyFilter();
    renderDecksHub();
    updateBannerCounts();
    applyFilters();
    setupEventListeners();
  } catch (err) {
    console.error('Erreur chargement cards.json:', err);
    if (cardQuestion) {
      cardQuestion.innerHTML = `<span style="color:#ef4444;">Erreur lors du chargement des fiches. Vérifiez votre connexion.</span>`;
    }
  }
}

// Populate Company Select
function populateCompanyFilter() {
  if (!companyFilter) return;
  const counts = {};
  allCards.forEach(c => {
    counts[c.company] = (counts[c.company] || 0) + 1;
  });

  const sortedComps = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  companyFilter.innerHTML = `<option value="ALL">🏢 Toutes les institutions (${allCards.length} fiches)</option>`;
  sortedComps.forEach(comp => {
    const opt = document.createElement('option');
    opt.value = comp;
    opt.textContent = `${comp} (${counts[comp]})`;
    companyFilter.appendChild(opt);
  });
}

// Render Decks Hub Grid
function renderDecksHub() {
  renderDeckGroup('grid-prop', FIRM_GROUPS.prop);
  renderDeckGroup('grid-banks', FIRM_GROUPS.banks);
  renderDeckGroup('grid-funds', FIRM_GROUPS.funds);

  const countProp = document.getElementById('count-prop-decks');
  const countBanks = document.getElementById('count-banks-decks');
  const countFunds = document.getElementById('count-funds-decks');
  const totalDecksBadge = document.getElementById('total-decks-badge');

  if (countProp) countProp.innerText = `${FIRM_GROUPS.prop.length} Paquets`;
  if (countBanks) countBanks.innerText = `${FIRM_GROUPS.banks.length} Paquets`;
  if (countFunds) countFunds.innerText = `${FIRM_GROUPS.funds.length} Paquets`;
  if (totalDecksBadge) totalDecksBadge.innerText = FIRM_GROUPS.prop.length + FIRM_GROUPS.banks.length + FIRM_GROUPS.funds.length;
}

function renderDeckGroup(gridId, firmsList) {
  const container = document.getElementById(gridId);
  if (!container) return;

  const html = firmsList.map(comp => {
    const compCards = allCards.filter(c => c.company === comp);
    const count = compCards.length;
    if (count === 0) return '';

    const badgeClass = BADGE_COLORS[comp] || 'badge-default';
    const masteredInComp = compCards.filter(c => masteredSet.has(c.id)).length;
    const hardCount = compCards.filter(c => c.difficulty && c.difficulty.includes('Difficult')).length;
    const hardPct = Math.round((hardCount / count) * 100);

    // Top tags
    const tagCounts = {};
    compCards.forEach(c => {
      (c.tags || []).forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });
    const topTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 3);
    const topTagsHtml = topTags.map(t => `<span class="deck-card-tag">${t}</span>`).join('');

    return `
      <div class="deck-card" onclick="launchDeck('${escapeJsString(comp)}')">
        <div>
          <div class="deck-card-header">
            <div class="deck-card-name">${escapeHtml(comp)}</div>
            <span class="deck-card-badge ${badgeClass}">${count} cartes</span>
          </div>
          <div class="deck-card-stats">
            <span>🔥 ${hardPct}% difficiles</span>
            <span>•</span>
            <span style="color:#34d399;">✅ ${masteredInComp}/${count} maîtrisées</span>
          </div>
          <div class="deck-card-topics">
            ${topTagsHtml}
          </div>
        </div>
        <div class="deck-card-footer">
          <span>Ouvrir ce paquet</span>
          <span>→</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJsString(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Launch Deck Action
window.launchDeck = function(company) {
  currentCompany = company;
  onlyFavorites = false;
  onlyReview = false;
  currentTag = 'ALL';
  currentDifficulty = 'ALL';
  searchQuery = '';
  if (searchInput) searchInput.value = '';

  // Update company dropdown
  if (companyFilter) companyFilter.value = company;
  if (difficultyFilter) difficultyFilter.value = 'ALL';

  // Reset tag chips
  document.querySelectorAll('.tag-chip').forEach(c => {
    if (c.getAttribute('data-tag') === 'ALL') c.classList.add('active');
    else c.classList.remove('active');
  });

  // Reset favorites button style
  if (favFilterBtn) {
    favFilterBtn.style.color = 'var(--text-secondary)';
    favFilterBtn.style.borderColor = 'var(--border-color)';
  }

  // Update deck title and badge
  const activeDeckTitle = document.getElementById('active-deck-title');
  const activeDeckBadge = document.getElementById('active-deck-badge');
  if (activeDeckTitle) {
    activeDeckTitle.innerText = company === 'ALL' ? 'Grand Chelem (26 Boîtes)' : company;
  }
  if (activeDeckBadge) {
    const count = company === 'ALL' ? allCards.length : allCards.filter(c => c.company === company).length;
    activeDeckBadge.innerText = `${count} cartes`;
  }

  switchTab('cards');
  applyFilters();
};

// Open Favorites Deck
window.openFavoritesDeck = function() {
  currentCompany = 'ALL';
  onlyFavorites = true;
  onlyReview = false;
  currentTag = 'ALL';
  currentDifficulty = 'ALL';
  searchQuery = '';
  if (searchInput) searchInput.value = '';

  if (companyFilter) companyFilter.value = 'ALL';
  if (difficultyFilter) difficultyFilter.value = 'ALL';

  document.querySelectorAll('.tag-chip').forEach(c => {
    if (c.getAttribute('data-tag') === 'ALL') c.classList.add('active');
    else c.classList.remove('active');
  });

  if (favFilterBtn) {
    favFilterBtn.style.color = '#fbbf24';
    favFilterBtn.style.borderColor = '#fbbf24';
  }

  const activeDeckTitle = document.getElementById('active-deck-title');
  const activeDeckBadge = document.getElementById('active-deck-badge');
  if (activeDeckTitle) activeDeckTitle.innerText = '⭐ Mes Cartes Favorites';
  if (activeDeckBadge) activeDeckBadge.innerText = `${favoritesSet.size} cartes`;

  switchTab('cards');
  applyFilters();
};

// Open Review Deck
window.openReviewDeck = function() {
  currentCompany = 'ALL';
  onlyFavorites = false;
  onlyReview = true;
  currentTag = 'ALL';
  currentDifficulty = 'ALL';
  searchQuery = '';
  if (searchInput) searchInput.value = '';

  if (companyFilter) companyFilter.value = 'ALL';
  if (difficultyFilter) difficultyFilter.value = 'ALL';

  document.querySelectorAll('.tag-chip').forEach(c => {
    if (c.getAttribute('data-tag') === 'ALL') c.classList.add('active');
    else c.classList.remove('active');
  });

  const activeDeckTitle = document.getElementById('active-deck-title');
  const activeDeckBadge = document.getElementById('active-deck-badge');
  if (activeDeckTitle) activeDeckTitle.innerText = '❌ Cartes À Revoir';
  if (activeDeckBadge) activeDeckBadge.innerText = `${reviewSet.size} cartes`;

  switchTab('cards');
  applyFilters();
};

window.openDecksHub = function() {
  switchTab('decks');
};

// Update Header and Banner Counts
function updateBannerCounts() {
  const bannerFav = document.getElementById('banner-fav-count');
  const bannerRev = document.getElementById('banner-review-count');
  if (bannerFav) bannerFav.innerText = favoritesSet.size;
  if (bannerRev) bannerRev.innerText = reviewSet.size;
  if (favCountEl) favCountEl.innerText = favoritesSet.size;
  if (masteredCountEl) masteredCountEl.innerText = masteredSet.size;
}

// Apply Filters & Search
function applyFilters() {
  filteredCards = allCards.filter(card => {
    if (currentCompany !== 'ALL' && card.company !== currentCompany) return false;
    if (currentDifficulty !== 'ALL' && card.difficulty !== currentDifficulty) return false;
    if (currentTag !== 'ALL' && !(card.tags || []).includes(currentTag)) return false;
    if (onlyFavorites && !favoritesSet.has(card.id)) return false;
    if (onlyReview && !reviewSet.has(card.id)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (card.question && card.question.toLowerCase().includes(q)) ||
                    (card.answer && card.answer.toLowerCase().includes(q)) ||
                    (card.company && card.company.toLowerCase().includes(q)) ||
                    (card.role && card.role.toLowerCase().includes(q)) ||
                    (card.city && card.city.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  currentIndex = 0;
  isFlipped = false;
  if (activeCard) activeCard.classList.remove('flipped');
  updateStats();
  renderCurrentCard();
}

// Render Card
function renderCurrentCard() {
  if (filteredCards.length === 0) {
    if (cardCompany) {
      cardCompany.className = 'company-badge badge-default';
      cardCompany.innerText = 'Aucun résultat';
    }
    if (cardTags) cardTags.innerHTML = '';
    if (cardRole) cardRole.innerText = '—';
    if (cardCity) cardCity.innerText = '—';
    if (cardDate) cardDate.innerText = '—';
    if (cardDiff) cardDiff.innerText = '—';
    if (cardQuestion) {
      cardQuestion.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem;">
          <div style="font-size:2rem; margin-bottom:0.75rem;">🔍</div>
          <div style="font-size:1.1rem; color:#94a3b8;">Aucune flashcard ne correspond à vos filtres actuels.</div>
          <div style="font-size:0.85rem; color:#64748b; margin-top:0.5rem;">Essayez d'élargir votre recherche ou de réinitialiser les filtres.</div>
        </div>
      `;
    }
    if (cardAnswer) cardAnswer.innerText = '';
    if (cardProcessFull) cardProcessFull.style.display = 'none';
    if (cardFavBtn) cardFavBtn.classList.remove('active');
    updateProgress();
    return;
  }

  const card = filteredCards[currentIndex];

  // Badges
  const badgeClass = BADGE_COLORS[card.company] || 'badge-default';
  if (cardCompany) {
    cardCompany.className = `company-badge ${badgeClass}`;
    cardCompany.innerText = card.company;
  }

  // Tags
  if (cardTags) {
    cardTags.innerHTML = (card.tags || []).slice(0, 2).map(t => 
      `<span style="font-size:0.7rem; background:rgba(255,255,255,0.08); padding:0.2rem 0.5rem; border-radius:9999px; color:#94a3b8;">${t}</span>`
    ).join('');
  }

  // Meta
  if (cardRole) cardRole.innerText = card.role || '';
  if (cardCity) cardCity.innerText = card.city || '';
  if (cardDate) cardDate.innerText = card.date || '';
  if (cardDiff) {
    cardDiff.innerText = card.difficulty || '';
    cardDiff.style.color = (card.difficulty || '').includes('Very') ? '#f43f5e' : ((card.difficulty || '').includes('Difficult') ? '#fbbf24' : '#10b981');
  }

  // Question & Answer
  if (cardQuestion) cardQuestion.innerHTML = formatText(card.question);
  if (cardAnswer) cardAnswer.innerHTML = formatText(card.answer);

  // Hiring process
  if (cardProcessFull) {
    if (card.process && card.process.length > 10) {
      cardProcessFull.style.display = 'block';
      cardProcessFull.innerHTML = `<strong>Processus de recrutement :</strong> ${formatText(card.process)}`;
    } else {
      cardProcessFull.style.display = 'none';
    }
  }

  // Source link & Outcome
  if (cardSourceLink) cardSourceLink.href = card.link || '#';
  if (cardOutcome) cardOutcome.innerText = card.outcome ? `Issue : ${card.outcome}` : '';

  // Favorite Star
  if (cardFavBtn) {
    if (favoritesSet.has(card.id)) {
      cardFavBtn.classList.add('active');
    } else {
      cardFavBtn.classList.remove('active');
    }
  }

  // Mastered state indicator
  if (masteredSet.has(card.id)) {
    if (masteredBtn) masteredBtn.style.background = 'rgba(16, 185, 129, 0.4)';
    if (reviewBtn) reviewBtn.style.background = 'rgba(244, 63, 94, 0.15)';
  } else if (reviewSet.has(card.id)) {
    if (reviewBtn) reviewBtn.style.background = 'rgba(244, 63, 94, 0.4)';
    if (masteredBtn) masteredBtn.style.background = 'rgba(16, 185, 129, 0.15)';
  } else {
    if (masteredBtn) masteredBtn.style.background = 'rgba(16, 185, 129, 0.15)';
    if (reviewBtn) reviewBtn.style.background = 'rgba(244, 63, 94, 0.15)';
  }

  updateProgress();
}

function formatText(str) {
  if (!str) return '';
  return str
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/\b([0-9]+%)\b/g, '<strong>$1</strong>');
}

// Flip Card
function toggleFlip() {
  isFlipped = !isFlipped;
  if (activeCard) activeCard.classList.toggle('flipped', isFlipped);
  if (navigator.vibrate) navigator.vibrate(20);
}

// Next / Previous Card
function nextCard() {
  if (filteredCards.length <= 1) return;
  currentIndex = (currentIndex + 1) % filteredCards.length;
  resetFlip();
}

function prevCard() {
  if (filteredCards.length <= 1) return;
  currentIndex = (currentIndex - 1 + filteredCards.length) % filteredCards.length;
  resetFlip();
}

function resetFlip() {
  isFlipped = false;
  if (activeCard) activeCard.classList.remove('flipped');
  renderCurrentCard();
  if (navigator.vibrate) navigator.vibrate(25);
}

// Progress and Stats
function updateProgress() {
  if (!cardIndexIndicator || !progressFill || !progressPct) return;
  if (filteredCards.length === 0) {
    cardIndexIndicator.innerText = '0 sur 0';
    progressFill.style.width = '0%';
    progressPct.innerText = '0%';
    return;
  }
  const current = currentIndex + 1;
  const total = filteredCards.length;
  cardIndexIndicator.innerText = `Carte ${current} sur ${total}`;
  const pct = Math.round((current / total) * 100);
  progressFill.style.width = `${pct}%`;
  progressPct.innerText = `${pct}%`;
}

function updateStats() {
  updateBannerCounts();
}

// Event Listeners
function setupEventListeners() {
  // Flip on click/tap scene
  if (cardScene) {
    cardScene.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      toggleFlip();
    });
  }

  // Buttons
  if (flipBtn) flipBtn.addEventListener('click', toggleFlip);
  if (nextBtn) nextBtn.addEventListener('click', nextCard);
  if (prevBtn) prevBtn.addEventListener('click', prevCard);

  // Mastered / Review
  if (masteredBtn) {
    masteredBtn.addEventListener('click', () => {
      if (filteredCards.length === 0) return;
      const cardId = filteredCards[currentIndex].id;
      masteredSet.add(cardId);
      reviewSet.delete(cardId);
      localStorage.setItem('quant_mastered', JSON.stringify([...masteredSet]));
      localStorage.setItem('quant_review', JSON.stringify([...reviewSet]));
      updateStats();
      renderCurrentCard();
      renderDecksHub();
      nextCard();
    });
  }

  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => {
      if (filteredCards.length === 0) return;
      const cardId = filteredCards[currentIndex].id;
      reviewSet.add(cardId);
      masteredSet.delete(cardId);
      localStorage.setItem('quant_mastered', JSON.stringify([...masteredSet]));
      localStorage.setItem('quant_review', JSON.stringify([...reviewSet]));
      updateStats();
      renderCurrentCard();
      renderDecksHub();
      nextCard();
    });
  }

  // Favorite Toggle
  if (cardFavBtn) {
    cardFavBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (filteredCards.length === 0) return;
      const cardId = filteredCards[currentIndex].id;
      if (favoritesSet.has(cardId)) {
        favoritesSet.delete(cardId);
        cardFavBtn.classList.remove('active');
      } else {
        favoritesSet.add(cardId);
        cardFavBtn.classList.add('active');
      }
      localStorage.setItem('quant_favorites', JSON.stringify([...favoritesSet]));
      updateBannerCounts();
    });
  }

  // Favorites Filter Toggle
  if (favFilterBtn) {
    favFilterBtn.addEventListener('click', () => {
      onlyFavorites = !onlyFavorites;
      favFilterBtn.style.color = onlyFavorites ? '#fbbf24' : 'var(--text-secondary)';
      favFilterBtn.style.borderColor = onlyFavorites ? '#fbbf24' : 'var(--border-color)';
      applyFilters();
    });
  }

  // Shuffle Cards
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      for (let i = filteredCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredCards[i], filteredCards[j]] = [filteredCards[j], filteredCards[i]];
      }
      currentIndex = 0;
      resetFlip();
    });
  }

  // Filter Selects
  if (companyFilter) {
    companyFilter.addEventListener('change', (e) => {
      currentCompany = e.target.value;
      const activeDeckTitle = document.getElementById('active-deck-title');
      const activeDeckBadge = document.getElementById('active-deck-badge');
      if (activeDeckTitle) {
        activeDeckTitle.innerText = currentCompany === 'ALL' ? 'Grand Chelem (26 Boîtes)' : currentCompany;
      }
      if (activeDeckBadge) {
        const count = currentCompany === 'ALL' ? allCards.length : allCards.filter(c => c.company === currentCompany).length;
        activeDeckBadge.innerText = `${count} cartes`;
      }
      applyFilters();
    });
  }

  if (difficultyFilter) {
    difficultyFilter.addEventListener('change', (e) => {
      currentDifficulty = e.target.value;
      applyFilters();
    });
  }

  // Search Input with Debounce
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value.trim();
        applyFilters();
      }, 250);
    });
  }

  // Tag Chips
  if (tagsChips) {
    tagsChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.tag-chip');
      if (!chip) return;
      document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentTag = chip.getAttribute('data-tag');
      applyFilters();
    });
  }

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;

    if (e.code === 'Space') {
      e.preventDefault();
      toggleFlip();
    } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
      e.preventDefault();
      nextCard();
    } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
      e.preventDefault();
      prevCard();
    } else if (e.key === 'm' || e.key === 'M') {
      if (masteredBtn) masteredBtn.click();
    } else if (e.key === 'r' || e.key === 'R') {
      if (reviewBtn) reviewBtn.click();
    }
  });

  // Touch Swipe for Mobile
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;

  if (cardScene) {
    cardScene.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    cardScene.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        nextCard();
      } else {
        prevCard();
      }
    }
  }

  // Salary Search Filter
  const salarySearchInput = document.getElementById('salary-search-input');
  if (salarySearchInput) {
    salarySearchInput.addEventListener('input', (e) => {
      renderSalariesTable(e.target.value.toLowerCase().trim());
    });
  }

  // Review Search Filter
  const reviewSearchInput = document.getElementById('review-search-input');
  if (reviewSearchInput) {
    reviewSearchInput.addEventListener('input', (e) => {
      renderReviewsList(e.target.value.toLowerCase().trim());
    });
  }
}

// Tab Switching
window.switchTab = function(tabName) {
  document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`tab-${tabName}`);
  if (activeBtn) activeBtn.classList.add('active');

  const viewDecks = document.getElementById('view-decks');
  const viewCards = document.getElementById('view-cards');
  const viewSalaries = document.getElementById('view-salaries');
  const viewReviews = document.getElementById('view-reviews');

  if (viewDecks) viewDecks.style.display = tabName === 'decks' ? 'flex' : 'none';
  if (viewCards) viewCards.style.display = tabName === 'cards' ? 'block' : 'none';
  if (viewSalaries) viewSalaries.style.display = tabName === 'salaries' ? 'flex' : 'none';
  if (viewReviews) viewReviews.style.display = tabName === 'reviews' ? 'flex' : 'none';

  if (tabName === 'decks') {
    updateBannerCounts();
    renderDecksHub();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Render Salaries Table
function renderSalariesTable(filter = '') {
  const tbody = document.getElementById('salaries-table-body');
  if (!tbody || !salariesData) return;

  const rows = [];
  let totalCount = 0;

  for (const [comp, data] of Object.entries(salariesData)) {
    const salaries = data.salaries || [];
    salaries.forEach(s => {
      totalCount++;
      const textToSearch = `${comp} ${s.title} ${s.desk} ${s.location} ${s.year} ${s.base} ${s.bonus} ${s.total || ''}`.toLowerCase();
      if (filter && !textToSearch.includes(filter)) return;

      const badgeClass = BADGE_COLORS[comp] || 'badge-default';

      rows.push(`
        <tr>
          <td><span class="company-badge ${badgeClass}" style="font-size:0.75rem; padding:0.2rem 0.5rem; white-space:nowrap;">${escapeHtml(comp)}</span></td>
          <td style="color:#94a3b8; font-weight:600;">${s.year}</td>
          <td><strong style="color:#f8fafc;">${escapeHtml(s.title)}</strong></td>
          <td style="color:#cbd5e1; font-size:0.8rem;">${escapeHtml(s.desk)}</td>
          <td><span style="background:rgba(59,130,246,0.15); color:#60a5fa; padding:0.15rem 0.45rem; border-radius:0.25rem; font-size:0.75rem; font-weight:600; white-space:nowrap;">${escapeHtml(s.location)}</span></td>
          <td><span class="badge-money">${s.base}</span></td>
          <td><span class="badge-money" style="color:#60a5fa; background:rgba(96,165,250,0.1);">${s.bonus}</span></td>
          <td><span class="badge-money" style="color:#f59e0b; background:rgba(245,158,11,0.12); font-weight:700;">${s.total || s.base}</span></td>
        </tr>
      `);
    });
  }

  const salBadge = document.getElementById('total-sal-badge');
  if (salBadge) salBadge.innerText = totalCount;

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:#94a3b8;">Aucun salaire trouvé pour "${escapeHtml(filter)}".</td></tr>`;
  } else {
    tbody.innerHTML = rows.join('');
  }
}

// Render Reviews List
function renderReviewsList(filter = '') {
  const container = document.getElementById('reviews-cards-container');
  if (!container || !salariesData) return;

  const cardsHtml = [];
  let totalRevCount = 0;

  for (const [comp, data] of Object.entries(salariesData)) {
    const reviews = data.reviews || [];
    reviews.forEach(r => {
      totalRevCount++;
      const textToSearch = `${comp} ${r.title} ${r.city} ${r.status} ${r.pros} ${r.cons}`.toLowerCase();
      if (filter && !textToSearch.includes(filter)) return;

      cardsHtml.push(`
        <div style="background:#111827; border:1px solid var(--border-color); border-radius:0.75rem; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <strong style="color:#f8fafc; font-size:1rem;">${escapeHtml(comp)}</strong> — 
              <span style="color:#94a3b8; font-size:0.85rem;">${escapeHtml(r.title)}</span>
            </div>
            <div style="display:flex; gap:0.5rem; font-size:0.75rem;">
              <span style="background:rgba(59,130,246,0.15); color:#60a5fa; padding:0.2rem 0.5rem; border-radius:0.25rem;">${escapeHtml(r.city || 'N/A')}</span>
              <span style="background:rgba(255,255,255,0.06); color:#cbd5e1; padding:0.2rem 0.5rem; border-radius:0.25rem;">${r.year}</span>
              ${r.offer_rate ? `<span style="background:rgba(16,185,129,0.15); color:#34d399; padding:0.2rem 0.5rem; border-radius:0.25rem;">Offre CDI: ${escapeHtml(r.offer_rate)}</span>` : ''}
            </div>
          </div>
          ${r.pros ? `<div style="font-size:0.85rem; color:#cbd5e1; margin-top:0.5rem;"><strong style="color:#34d399;">Points Positifs :</strong> ${escapeHtml(r.pros)}</div>` : ''}
          ${r.cons ? `<div style="font-size:0.85rem; color:#cbd5e1; margin-top:0.5rem;"><strong style="color:#f43f5e;">Inconvénients :</strong> ${escapeHtml(r.cons)}</div>` : ''}
          ${r.tips ? `<div style="font-size:0.8rem; color:#94a3b8; margin-top:0.5rem; font-style:italic;"><strong>Conseils Management :</strong> "${escapeHtml(r.tips)}"</div>` : ''}
        </div>
      `);
    });
  }

  const revBadge = document.getElementById('total-rev-badge');
  if (revBadge) revBadge.innerText = totalRevCount;

  if (cardsHtml.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:2rem; color:#94a3b8;">Aucun avis trouvé pour "${escapeHtml(filter)}".</div>`;
  } else {
    container.innerHTML = cardsHtml.join('');
  }
}

// Start
init();
