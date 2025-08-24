/**********************
 * Keys & Endpoints
 **********************/
const LS_QUOTES_KEY      = 'dqg_quotes_v1';
const SS_LAST_QUOTE_KEY  = 'dqg_last_quote_v1';
const LS_LAST_FILTER_KEY = 'dqg_last_filter_v1';
const LS_LAST_SYNC_KEY   = 'dqg_last_sync_v1';

const SERVER_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';
const SERVER_LIMIT    = 10;      // how many to pull each sync
const AUTO_SYNC_MS    = 30000;   // 30s

/**********************
 * Load / Save
 **********************/
function loadQuotes() {
  try {
    const raw = localStorage.getItem(LS_QUOTES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(q => q && typeof q.text === 'string' && typeof q.category === 'string')
          .map(q => ({ ...q })); // shallow copy
      }
    }
  } catch (_) {}
  // Seed data (first run)
  return [
    { text: "The best way to predict the future is to invent it.", category: "Inspiration" },
    { text: "Do not wait to strike till the iron is hot; but make it hot by striking.", category: "Motivation" },
    { text: "Life is what happens when you’re busy making other plans.", category: "Life" }
  ];
}
function saveQuotes() {
  localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
}
function setLastSync(ts) {
  localStorage.setItem(LS_LAST_SYNC_KEY, String(ts));
  const label = document.getElementById('syncStatus');
  label.textContent = 'Last sync: ' + new Date(ts).toLocaleString();
}

/**********************
 * Data & DOM refs
 **********************/
let quotes = loadQuotes();

const quoteDisplay   = document.getElementById("quoteDisplay");
const newQuoteBtn    = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const exportBtn      = document.getElementById("exportBtn");
const importInput    = document.getElementById("importFile");
const syncNowBtn     = document.getElementById("syncNow");
const autoSyncCb     = document.getElementById("autoSync");
const syncNoticeBox  = document.getElementById("syncNotice");

/**********************
 * Helpers / UI
 **********************/
function renderQuote(q) {
  quoteDisplay.innerHTML = "";
  const quoteText = document.createElement("p");
  quoteText.textContent = `"${q.text}"`;
  const quoteCategory = document.createElement("small");
  quoteCategory.textContent = `Category: ${q.category}`;
  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
}

function showNotice(msg) {
  syncNoticeBox.textContent = msg;
  syncNoticeBox.style.display = 'inline-block';
  clearTimeout(showNotice._t);
  showNotice._t = setTimeout(() => { syncNoticeBox.style.display = 'none'; }, 3500);
}

/**********************
 * Task 1: core features
 **********************/
function showRandomQuote() {
  const selected = categoryFilter.value || 'all';
  const pool = selected === 'all' ? quotes : quotes.filter(q => q.category === selected);

  if (!pool.length) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }
  const idx = Math.floor(Math.random() * pool.length);
  const q = pool[idx];
  renderQuote(q);
  try { sessionStorage.setItem(SS_LAST_QUOTE_KEY, JSON.stringify(q)); } catch (_) {}
}

function createAddQuoteForm() {
  const formDiv = document.createElement("div");
  formDiv.style.marginTop = "12px";

  const inputText = document.createElement("input");
  inputText.type = "text";
  inputText.id = "newQuoteText";
  inputText.placeholder = "Enter a new quote";
  inputText.style.marginRight = "6px";

  const inputCategory = document.createElement("input");
  inputCategory.type = "text";
  inputCategory.id = "newQuoteCategory";
  inputCategory.placeholder = "Enter quote category";
  inputCategory.style.marginRight = "6px";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.onclick = addQuote;

  formDiv.appendChild(inputText);
  formDiv.appendChild(inputCategory);
  formDiv.appendChild(addBtn);
  document.body.appendChild(formDiv);
}

function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  // clear prior messages
  [...textInput.parentElement.querySelectorAll('.msg')].forEach(n => n.remove());

  if (newText && newCategory) {
    const newQ = { text: newText, category: newCategory };
    quotes.push(newQ);
    saveQuotes();

    // Ensure category dropdown reflects new category
    populateCategories();

    textInput.value = "";
    categoryInput.value = "";

    const message = document.createElement("p");
    message.className = "msg";
    message.textContent = "✅ Quote added locally!";
    message.style.color = "green";
    textInput.parentElement.appendChild(message);
    setTimeout(() => message.remove(), 2000);

    renderQuote(newQ);
    try { sessionStorage.setItem(SS_LAST_QUOTE_KEY, JSON.stringify(newQ)); } catch (_) {}

    // Optionally push to server (best-effort)
    postQuoteToServer(newQ).catch(() => {});
  } else {
    const message = document.createElement("p");
    message.className = "msg";
    message.textContent = "⚠️ Please fill in both fields.";
    message.style.color = "red";
    textInput.parentElement.appendChild(message);
    setTimeout(() => message.remove(), 2000);
  }
}

/**********************
 * Categories (Task 3)
 **********************/
function populateCategories() {
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = "";
  for (const cat of categories) {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  }
  // restore last selected filter
  const last = localStorage.getItem(LS_LAST_FILTER_KEY);
  if (last && categories.includes(last)) categoryFilter.value = last;
}

function filterQuotes() {
  const selected = categoryFilter.value || 'all';
  localStorage.setItem(LS_LAST_FILTER_KEY, selected);
  showRandomQuote();
}

/**********************
 * Import / Export (Task 2)
 **********************/
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('File must contain an array of quotes');

      const sanitized = imported.filter(it => it && typeof it.text === 'string' && typeof it.category === 'string')
                                .map(it => ({ text: it.text, category: it.category }));

      // Merge without duplicating identical text+category
      const existingKeys = new Set(quotes.map(q => (q.text.trim().toLowerCase() + '|' + q.category.trim().toLowerCase())));
      let added = 0;
      for (const q of sanitized) {
        const key = q.text.trim().toLowerCase() + '|' + q.category.trim().toLowerCase();
        if (!existingKeys.has(key)) {
          quotes.push(q);
          existingKeys.add(key);
          added++;
        }
      }
      saveQuotes();
      populateCategories();
      showRandomQuote();
      alert(`Quotes imported successfully! (+${added})`);
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      importInput.value = '';
    }
  };
  reader.readAsText(file);
}

/**********************
 * Server Sync (Task 4)
 * - fetch server quotes periodically
 * - merge with local (server wins on conflict)
 **********************/
async function fetchServerQuotes() {
  const res = await fetch(`${SERVER_ENDPOINT}?_limit=${SERVER_LIMIT}`);
  if (!res.ok) throw new Error('Failed to fetch server quotes');
  const posts = await res.json();

  // Map posts -> quote objects
  // Using title as text (shorter), and userId as a category label
  return posts.map(p => ({
    text: String(p.title || '').trim(),
    category: `Category ${p.userId ?? 'Server'}`
  })).filter(q => q.text);
}

// best-effort upload of a local quote (simulation)
async function postQuoteToServer(q) {
  try {
    await fetch(SERVER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ title: q.text, body: q.category })
    });
  } catch (_) {
    // ignore network errors in this simulation
  }
}

function mergeServerIntoLocal(serverQuotes) {
  // Identify existing entries by normalized (text|category)
  const norm = (q) => q.text.trim().toLowerCase() + '|' + q.category.trim().toLowerCase();
  const map = new Map(quotes.map(q => [norm(q), q]));

  let added = 0;
  let conflicts = 0;

  for (const sq of serverQuotes) {
    // If there's a local quote with same text but *different* category, treat as conflict → server wins
    const sameTextLocal = quotes.find(q => q.text.trim().toLowerCase() === sq.text.trim().toLowerCase());
    if (sameTextLocal && sameTextLocal.category.trim().toLowerCase() !== sq.category.trim().toLowerCase()) {
      // replace local with server version
      const idx = quotes.indexOf(sameTextLocal);
      quotes[idx] = { text: sq.text, category: sq.category };
      conflicts++;
      continue;
    }

    // If exact text+category not present, add it
    const key = norm(sq);
    if (!map.has(key)) {
      quotes.push({ text: sq.text, category: sq.category });
      map.set(key, sq);
      added++;
    }
  }

  if (added || conflicts) {
    saveQuotes();
    populateCategories();
  }
  return { added, conflicts };
}

async function syncNow() {
  try {
    const serverQuotes = await fetchServerQuotes();
    const { added, conflicts } = mergeServerIntoLocal(serverQuotes);
    setLastSync(Date.now());

    if (added || conflicts) {
      showNotice(`🔄 Sync complete: +${added} new, ${conflicts} conflict${conflicts === 1 ? '' : 's'} resolved (server wins).`);
      // Refresh current view
      filterQuotes();
    } else {
      showNotice('🔄 Sync complete: no changes.');
    }
  } catch (err) {
    showNotice('⚠️ Sync failed: ' + err.message);
  }
}

/**********************
 * Events & Init
 **********************/
newQuoteBtn.addEventListener("click", showRandomQuote);
exportBtn.addEventListener("click", exportToJsonFile);
syncNowBtn.addEventListener("click", syncNow);

let autoSyncTimer = null;
function startAutoSync() {
  stopAutoSync();
  autoSyncTimer = setInterval(syncNow, AUTO_SYNC_MS);
}
function stopAutoSync() {
  if (autoSyncTimer) clearInterval(autoSyncTimer);
  autoSyncTimer = null;
}
autoSyncCb.addEventListener('change', () => {
  if (autoSyncCb.checked) startAutoSync(); else stopAutoSync();
});

// Build form, categories, and initial view
createAddQuoteForm();
populateCategories();

// Restore last-in-session quote if available
(function initFirstView() {
  // Last sync label
  const lastTs = Number(localStorage.getItem(LS_LAST_SYNC_KEY) || 0);
  if (lastTs) setLastSync(lastTs);

  try {
    const last = sessionStorage.getItem(SS_LAST_QUOTE_KEY);
    if (last) {
      const q = JSON.parse(last);
      if (q && typeof q.text === 'string' && typeof q.category === 'string') {
        renderQuote(q);
      } else {
        showRandomQuote();
      }
    } else {
      showRandomQuote();
    }
  } catch (_) {
    showRandomQuote();
  }
})();

// Kick off auto sync
if (autoSyncCb.checked) startAutoSync();
