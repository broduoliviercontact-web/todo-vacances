import * as api from './api.js';

var LIST_ID = 'default';
var INITIAL_DATA = [
  {
    name: 'CÉSAR',
    items: [
      'Repas', 'Tenue piscine', 'Chapeau été', 'Couches', 'Matelas à langer',
      'Lunette de soleil', 'Tenue été + tenue manche longue', 'Casquette snoopy',
      '1 gilet', 'Turbulette', 'Serviette', 'Produit à langer + bain + Gant grenouille',
      'Jouet + livre', 'Tapis éveil', 'Siège nomade',
      'Trousse pharma (Doliprane et gel dent, sirop toux)', 'Bavoir + 2 cuillères',
      'Crème solaire', 'Doudou', 'Babyphone', 'Drap matelas lit', 'Boîte à musique',
      'Petit ventilateur', 'Lit parapluie (pour royan)', 'Veilleuse'
    ]
  },
  {
    name: 'MIU',
    items: ['Pled miu', 'Croquette', 'Litière', 'Spray pheromone']
  }
];
let state = null;
var dirty = false;
const app = document.getElementById('app');

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// --- Theme ---
(function initTheme() {
  var saved = localStorage.getItem('theme');
  var theme = saved || 'warm';
  document.documentElement.setAttribute('data-theme', theme);
})();

function toggleTheme() {
  var cur = document.documentElement.getAttribute('data-theme');
  var next = cur === 'ocean' ? 'warm' : 'ocean';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  renderThemeIcon();
}

function renderThemeIcon() {
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.textContent = document.documentElement.getAttribute('data-theme') === 'ocean' ? '☀️' : '🌙';
}

function toast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 300); }, 2000);
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function showError(msg) {
  app.innerHTML = `<div style="text-align:center;padding:60px 20px;"><p style="color:#dc2626;font-weight:600;">${esc(msg)}</p><button class="btn btn-primary" style="margin-top:16px;" onclick="location.reload()">Réessayer</button></div>`;
}

// --- Actions (local-only, save must be called explicitly) ---

async function loadList() {
  try {
    state = await api.getList(LIST_ID);
    dirty = false;
  } catch {
    try {
      state = await api.createList(LIST_ID, 'Avant de partir', INITIAL_DATA);
      dirty = false;
    } catch (e2) {
      showError('Impossible de créer la liste: ' + e2.message);
      return;
    }
  }
  render();
}

async function save() {
  try {
    state = await api.saveList(LIST_ID, state);
    dirty = false;
    render();
    toast('Sauvegardé');
  } catch (e) {
    toast('Erreur sauvegarde: ' + e.message);
  }
}

function markDirty() { dirty = true; render(); }

function addCategory(name) {
  state.categories.push({ id: uid(), name: name, items: [] });
  markDirty();
}

function deleteCategory(catId, name) {
  if (!confirm('Supprimer "' + name + '" et tous ses items ?')) return;
  state.categories = state.categories.filter(function (c) { return c.id !== catId; });
  markDirty();
}

function addItem(catId, text) {
  var cat = state.categories.find(function (c) { return c.id === catId; });
  if (!cat) return;
  cat.items.push({ id: uid(), text: text, checked: false });
  markDirty();
}

function toggleItem(catId, item) {
  item.checked = !item.checked;
  markDirty();
}

function deleteItem(catId, itemId) {
  var cat = state.categories.find(function (c) { return c.id === catId; });
  if (!cat) return;
  cat.items = cat.items.filter(function (i) { return i.id !== itemId; });
  markDirty();
}

function addSubItem(catId, itemId, text) {
  var cat = state.categories.find(function (c) { return c.id === catId; });
  if (!cat) return;
  var item = cat.items.find(function (i) { return i.id === itemId; });
  if (!item) return;
  if (!item.subItems) item.subItems = [];
  item.subItems.push({ id: uid(), text: text, checked: false });
  markDirty();
}

function toggleSubItem(catId, itemId, subItem) {
  subItem.checked = !subItem.checked;
  markDirty();
}

function deleteSubItem(catId, itemId, subItemId) {
  var cat = state.categories.find(function (c) { return c.id === catId; });
  if (!cat) return;
  var item = cat.items.find(function (i) { return i.id === itemId; });
  if (!item || !item.subItems) return;
  item.subItems = item.subItems.filter(function (s) { return s.id !== subItemId; });
  markDirty();
}

// --- Render ---

function render() {
  if (!state) {
    app.innerHTML = '<div style="text-align:center;padding:60px 20px;"><div class="spinner"></div><p style="color:#6b7280;margin-top:16px;">Chargement...</p></div>';
    return;
  }

  const list = state;
  const total = list.categories.reduce((s, c) => s + c.items.length, 0);
  const checked = list.categories.reduce((s, c) => s + c.items.filter(i => i.checked).length, 0);
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

  let html = '<button class="theme-toggle" id="theme-toggle" title="Changer de thème"></button>';
  html += '<div class="title-area">';
  html += '<span class="title-emoji">🏖️</span>';
  html += '<h1>' + esc(list.title) + '</h1>';
  html += '<div class="global-progress">';
  if (total > 0) {
    html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="progress-text">' + checked + ' / ' + total + ' coché' + (total > 1 ? 's' : '') + ' (' + pct + '%)</div>';
  } else {
    html += '<p style="color:var(--text-muted);font-size:0.88rem;">Ajoutez une catégorie pour commencer</p>';
  }
  html += '</div>';
  html += '</div>';
  html += '<div style="text-align:center;margin-bottom:16px;">';
  html += '<button class="btn btn-primary" id="save-btn" style="font-size:0.95rem;padding:10px 32px;"> Sauvegarder</button>';
  html += '<div id="save-hint" style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;min-height:18px;"></div>';
  html += '</div>';
  html += '<div id="cats"></div>';
  html += '<div class="add-form" style="border-top:none;margin-bottom:24px;">';
  html += '<input type="text" class="add-input" id="cat-input" placeholder="Nouvelle catégorie (ex: César, Miu, Papa, Plage...)">';
  html += '<button class="btn btn-primary btn-sm" id="cat-btn">Ajouter</button>';
  html += '</div>';

  app.innerHTML = html;

  renderThemeIcon();
  document.getElementById('theme-toggle').onclick = toggleTheme;

  var saveBtn = document.getElementById('save-btn');
  var saveHint = document.getElementById('save-hint');
  saveBtn.onclick = save;

  if (dirty) {
    saveBtn.textContent = ' Sauvegarder *';
    saveHint.textContent = 'Modifications non sauvegardées';
  } else {
    saveBtn.textContent = ' Sauvegarder';
    saveHint.textContent = '';
  }

  document.getElementById('cat-btn').onclick = function () {
    var v = document.getElementById('cat-input').value.trim();
    if (v) { addCategory(v); document.getElementById('cat-input').value = ''; }
  };
  document.getElementById('cat-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') { document.getElementById('cat-btn').click(); }
  });

  renderCategories(list);
}

function renderCategories(list) {
  var container = document.getElementById('cats');
  if (!list.categories.length) {
    container.innerHTML = '<div class="empty">Aucune catégorie pour le moment.</div>';
    return;
  }

  list.categories.forEach(function (cat) {
    var total = cat.items.length;
    var checked = cat.items.filter(function (i) { return i.checked; }).length;
    var pct = total > 0 ? (checked / total) * 100 : 0;

    var card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div class="category-header">' +
      '<span class="category-title">' + esc(cat.name) + '</span>' +
      '<button class="btn-danger-text">Supprimer</button>' +
      '</div>' +
      '<div id="items-' + cat.id + '"></div>' +
      '<div class="add-form">' +
      '<input type="text" class="add-input" id="inp-' + cat.id + '" placeholder="Ajouter un item...">' +
      '<button class="btn btn-primary btn-sm" id="btn-' + cat.id + '">+</button>' +
      '</div>' +
      '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="progress-text">' + checked + ' / ' + total + '</div>';
    container.appendChild(card);

    card.querySelector('.btn-danger-text').onclick = function () { deleteCategory(cat.id, cat.name); };

    var itemsEl = document.getElementById('items-' + cat.id);
    if (!cat.items.length) {
      itemsEl.innerHTML = '<div class="empty">Aucun item</div>';
    }
    cat.items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'item';
      var hasSubs = item.subItems && item.subItems.length > 0;
      row.innerHTML =
        '<div class="item-main-row">' +
        '<div class="checkbox ' + (item.checked ? 'checked' : '') + '"></div>' +
        '<span class="item-text ' + (item.checked ? 'checked' : '') + '">' + esc(item.text) + '</span>' +
        '<button class="sub-add-btn">' + (hasSubs ? '+▾' : '+') + '</button>' +
        '<button class="item-delete">×</button>' +
        '</div>' +
        '<div class="sub-items" id="subitems-' + item.id + '" style="display:none">' +
        '</div>';
      itemsEl.appendChild(row);

      row.querySelector('.item-main-row .checkbox').onclick = function () { toggleItem(cat.id, item); };
      row.querySelector('.item-main-row .item-delete').onclick = function () { deleteItem(cat.id, item.id); };

      var subAddBtn = row.querySelector('.sub-add-btn');
      var subContainer = row.querySelector('.sub-items');

      subAddBtn.onclick = function () {
        subContainer.style.display = subContainer.style.display === 'none' ? 'block' : 'none';
      };

      // Render existing sub-items
      if (item.subItems) {
        item.subItems.forEach(function (sub) {
          var subRow = document.createElement('div');
          subRow.className = 'sub-item';
          subRow.innerHTML =
            '<div class="checkbox ' + (sub.checked ? 'checked' : '') + '"></div>' +
            '<span class="item-text ' + (sub.checked ? 'checked' : '') + '">' + esc(sub.text) + '</span>' +
            '<button class="item-delete">×</button>';
          subContainer.appendChild(subRow);
          subRow.querySelector('.checkbox').onclick = function () { toggleSubItem(cat.id, item.id, sub); };
          subRow.querySelector('.item-delete').onclick = function () { deleteSubItem(cat.id, item.id, sub.id); };
        });
      }

      // Add form for new sub-items
      var subForm = document.createElement('div');
      subForm.className = 'sub-add-form';
      subForm.innerHTML =
        '<input type="text" class="add-input" placeholder="Sous-item...">' +
        '<button class="btn btn-primary btn-sm">+</button>';
      subContainer.appendChild(subForm);
      var subInput = subForm.querySelector('input');
      var subBtn = subForm.querySelector('button');
      subBtn.onclick = function () {
        var v = subInput.value.trim();
        if (v) { addSubItem(cat.id, item.id, v); }
      };
      subInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') { subBtn.click(); }
      });
    });

    document.getElementById('btn-' + cat.id).onclick = function () {
      var v = document.getElementById('inp-' + cat.id).value.trim();
      if (v) { addItem(cat.id, v); document.getElementById('inp-' + cat.id).value = ''; }
    };
    document.getElementById('inp-' + cat.id).addEventListener('keypress', function (e) {
      if (e.key === 'Enter') document.getElementById('btn-' + cat.id).click();
    });
  });
}

window.addEventListener('beforeunload', function (e) {
  if (dirty) { e.preventDefault(); e.returnValue = ''; }
});

document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (dirty) save();
  }
});

loadList();
