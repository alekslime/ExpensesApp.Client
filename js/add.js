(() => {
  "use strict";

  const STORAGE_KEY = "expenses";
  const form = document.getElementById("expense-form");
  if (!form) return;

  const byId = (id) => document.getElementById(id);
  const toast = byId("toast");
  const recentSection = byId("recent");
  const recentList = byId("recent-list");
  let toastTimer;

  function getExpenses() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveExpenses(expenses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function clearErrors() {
    form.querySelectorAll(".error").forEach((node) => {
      node.textContent = "";
    });
  }

  function setError(field, message) {
    const target = form.querySelector(`.error[data-for="${field}"]`);
    if (target) target.textContent = message;
  }

  function validate(data) {
    clearErrors();
    let valid = true;

    if (!data.title) {
      setError("title", "Please enter an expense title.");
      valid = false;
    } else if (data.title.length > 80) {
      setError("title", "Title must be 80 characters or fewer.");
      valid = false;
    }

    if (!Number.isInteger(data.amount) || data.amount < 1) {
      setError("amount", "Enter a positive whole amount in Lek.");
      valid = false;
    }

    if (!["Food", "Transport", "Books", "Rent", "Fun", "Other"].includes(data.category)) {
      setError("category", "Please choose a category.");
      valid = false;
    }

    if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      setError("date", "Please choose a valid date.");
      valid = false;
    }

    return valid;
  }

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addRecent(expense) {
    if (!recentSection || !recentList) return;

    recentSection.style.display = "block";
    const item = document.createElement("li");
    item.textContent = `${expense.title} — ${expense.amount.toLocaleString()} Lek · ${expense.category} · ${expense.date}`;
    recentList.prepend(item);
  }

  const dateInput = byId("date");
  if (dateInput && !dateInput.value) {
    dateInput.value = localDateString();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = {
      title: byId("title").value.trim(),
      amount: Number(byId("amount").value),
      category: byId("category").value,
      date: byId("date").value
    };

    if (!validate(data)) return;

    const expenses = getExpenses();
    const expense = {
      id: (globalThis.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...data
    };

    expenses.push(expense);

    try {
      saveExpenses(expenses);
    } catch (error) {
      showToast("Could not save. Check your browser storage settings.");
      console.error(error);
      return;
    }

    addRecent(expense);
    form.reset();
    clearErrors();
    if (dateInput) dateInput.value = localDateString();
    showToast("Expense added successfully.");
  });

  // Shared header clock.
  const clock = byId("clock");
  function updateClock() {
    if (clock) clock.textContent = new Date().toLocaleTimeString();
  }
  updateClock();
  setInterval(updateClock, 1000);
})();
