// Local quotes storage
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" }
];

// Display a random quote
function displayQuote() {
  const quoteDisplay = document.getElementById("quoteDisplay");
  const randomIndex = Math.floor(Math.random() * quotes.length);
  quoteDisplay.textContent = quotes[randomIndex].text + " — (" + quotes[randomIndex].category + ")";
}

// Show new quote button
document.getElementById("newQuote").addEventListener("click", displayQuote);

// Export quotes
document.getElementById("exportBtn").addEventListener("click", () => {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Import quotes
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      quotes = [...quotes, ...importedQuotes];
      localStorage.setItem("quotes", JSON.stringify(quotes));
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Error importing file.");
    }
  };
  reader.readAsText(file);
}

// ----------- NEW FUNCTIONS FOR SERVER SYNC ----------- //

// Fetch quotes from mock server
async function fetchQuotesFromServer() {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
  const data = await response.json();

  // Convert posts to quotes format
  return data.map(post => ({
    text: post.title,
    category: "Server"
  }));
}

// Post a quote to the mock server
async function postQuoteToServer(quote) {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    body: JSON.stringify(quote),
    headers: { "Content-Type": "application/json" }
  });
  return await response.json();
}

// Sync local quotes with server
async function syncQuotes() {
  const status = document.getElementById("syncStatus");
  if (status) status.textContent = "Status: Syncing...";

  try {
    const serverQuotes = await fetchQuotesFromServer();

    // Conflict resolution: server data takes precedence
    const mergedQuotes = [...serverQuotes, ...quotes];
    quotes = mergedQuotes;

    localStorage.setItem("quotes", JSON.stringify(quotes));

    if (status) status.textContent = "Status: Synced with server!";
  } catch (error) {
    if (status) status.textContent = "Status: Sync failed.";
  }
}

// Manual sync button
document.getElementById("syncBtn")?.addEventListener("click", syncQuotes);

// Periodic sync every 30 seconds
setInterval(syncQuotes, 30000);

// Initial load
displayQuote();
