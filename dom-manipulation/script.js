// ===== Keys for Web Storage =====
const LS_KEY = 'dqg_quotes_v1';
const SS_KEY = 'dqg_last_quote_v1';

// ===== Load / Save helpers (Local Storage) =====
function loadQuotes() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(q => q && typeof q.text === 'string' && typeof q.category === 'string');
      }
    }
  } catch (_) {}
  // Seed (first run)
  return [
    { text: "The best way to predict the future is to invent it.", category: "Inspiration" },
    { text: "Do not wait to strike till the iron is hot; but make it hot by striking.", category: "Motivation" },
    { text: "Life is what happens when you’re busy making other plans.", category: "Life" }
  ];
}
function saveQuotes() {
  localStorage.setItem(LS_KEY, JSON.stringify(quotes));
}

// ===== Data =====
let quotes = loadQuotes();

// ===== DOM refs =====
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn  = document.getElementById("newQuote");
const exportBtn    = document.getElementById("exportBtn");
// import input uses inline onchange per instructions

// ===== Render helper =====
function renderQuote(q) {
  quoteDisplay.innerHTML = "";
  const quoteText = document.createElement("p");
  quoteText.textContent = `"${q.text}"`;
  const quoteCategory = document.createElement("small");
  quoteCategory.textContent = `Category: ${q.category}`;
  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
}

// ===== Task 1: showRandomQuote (kept for checker) =====
function showRandomQuote() {
  if (!quotes.length) {
    quoteDisplay.textContent = "No quotes available. Add some!";
    return;
  }
  const idx = Math.floor(Math.random() * quotes.length);
  const q = quotes[idx];
  renderQuote(q);

  // Remember last viewed quote in THIS tab (Session Storage)
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(q)); } catch (_) {}
}

// ===== Task 1: createAddQuoteForm (dynamic UI) =====
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

// ===== Task 1: addQuote (now persists to LocalStorage) =====
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  // clear previous inline messages
  [...textInput.parentElement.querySelectorAll('.msg')].forEach(n => n.remove());

  if (newText && newCategory) {
    quotes.push({ text: newText, category: newCategory });
    saveQuotes(); // persist

    textInput.value = "";
    categoryInput.value = "";

    const message = document.createElement("p");
    message.className = "msg";
    message.textContent = "✅ Quote added successfully!";
    message.style.color = "green";
    textInput.parentElement.appendChild(message);
    setTimeout(() => message.remove(), 2000);

    renderQuote({ text: newText, category: newCategory });
    try { sessionStorage.setItem(SS_KEY, JSON.stringify({ text: newText, category: newCategory })); } catch (_) {}
  } else {
    const message = document.createElement("p");
    message.className = "msg";
    message.textContent = "⚠️ Please fill in both fields.";
    message.style.color = "red";
    textInput.parentElement.appendChild(message);
    setTimeout(() => message.remove(), 2000);
  }
}

// ===== Export as JSON =====
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

// Wire export button
exportBtn.addEventListener("click", exportToJsonFile);

// ===== Import from JSON (exact signature from instructions) =====
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    alert('Quotes imported successfully!');
    // show one of the newly imported quotes right away
    showRandomQuote();
  };
  fileReader.readAsText(event.target.files[0]);
}

// ===== Events & Initialization =====
newQuoteBtn.addEventListener("click", showRandomQuote);

// Build the add-quote UI
createAddQuoteForm();

// On first load: restore last-in-session if available, else random
(function initFirstView() {
  try {
    const last = sessionStorage.getItem(SS_KEY);
    if (last) {
      const q = JSON.parse(last);
      if (q && typeof q.text === 'string' && typeof q.category === 'string') {
        renderQuote(q);
        return;
      }
    }
  } catch (_) {}
  showRandomQuote();
})();
