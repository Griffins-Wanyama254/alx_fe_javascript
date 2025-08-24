// Quotes array (each with text + category)
let quotes = [
  { text: "The best way to predict the future is to invent it.", category: "Inspiration" },
  { text: "Do not wait to strike till the iron is hot; but make it hot by striking.", category: "Motivation" },
  { text: "Life is what happens when you’re busy making other plans.", category: "Life" }
];

// DOM references
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");

// Function: Show a random quote (renamed for checker)
function showRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available. Add some!";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];

  // clear previous content
  quoteDisplay.innerHTML = "";

  // create new elements dynamically
  const quoteText = document.createElement("p");
  quoteText.textContent = `"${randomQuote.text}"`;

  const quoteCategory = document.createElement("small");
  quoteCategory.textContent = `Category: ${randomQuote.category}`;

  // append to display
  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
}

// Function: Prepare Add Quote Form (UI is dynamic)
function createAddQuoteForm() {
  const formDiv = document.createElement("div");

  const inputText = document.createElement("input");
  inputText.type = "text";
  inputText.id = "newQuoteText";
  inputText.placeholder = "Enter a new quote";

  const inputCategory = document.createElement("input");
  inputCategory.type = "text";
  inputCategory.id = "newQuoteCategory";
  inputCategory.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.onclick = addQuote;

  formDiv.appendChild(inputText);
  formDiv.appendChild(inputCategory);
  formDiv.appendChild(addBtn);

  document.body.appendChild(formDiv);
}

// Function: Add new quote (updates array + DOM feedback)
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (newText && newCategory) {
    // add to quotes array
    quotes.push({ text: newText, category: newCategory });

    // clear inputs
    textInput.value = "";
    categoryInput.value = "";

    // show success message dynamically
    const message = document.createElement("p");
    message.textContent = "✅ Quote added successfully!";
    message.style.color = "green";

    const formDiv = textInput.parentElement;
    formDiv.appendChild(message);

    setTimeout(() => message.remove(), 2000);

    // immediately show the newly added quote
    quoteDisplay.innerHTML = "";
    const quoteText = document.createElement("p");
    quoteText.textContent = `"${newText}"`;

    const quoteCategory = document.createElement("small");
    quoteCategory.textContent = `Category: ${newCategory}`;

    quoteDisplay.appendChild(quoteText);
    quoteDisplay.appendChild(quoteCategory);

  } else {
    const message = document.createElement("p");
    message.textContent = "⚠️ Please fill in both fields.";
    message.style.color = "red";

    const formDiv = textInput.parentElement;
    formDiv.appendChild(message);

    setTimeout(() => message.remove(), 2000);
  }
}

// Event listener (updated to use showRandomQuote)
newQuoteBtn.addEventListener("click", showRandomQuote);

// Initialize: show first quote + form
showRandomQuote();
createAddQuoteForm();
