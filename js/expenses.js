(() => {
  "use strict";

  const STORAGE_KEY = "expenses";
  const byId = (id) => document.getElementById(id);
  const expenseList = byId("expense-list");
  const editModal = byId("edit-modal");
  const editForm = byId("edit-form");
  if (!expenseList || !editModal || !editForm) return;

  const toast = byId("toast");
  const searchInput = byId("search");
  const categoryFilter = byId("filter-category");
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

  function formatMoney(amount) {
    return `${Number(amount || 0).toLocaleString()} Lek`;
  }

  function formatDate(value) {
    if (!value) return "";
    const parts = value.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
  }

  function updateStats(expenses) {
    const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const count = expenses.length;
    const average = count ? Math.round(total / count) : 0;
    const biggest = expenses.reduce((best, item) => {
      return !best || Number(item.amount) > Number(best.amount) ? item : best;
    }, null);

    byId("stat-total").textContent = formatMoney(total);
    byId("stat-count").textContent = String(count);
    byId("stat-average").textContent = formatMoney(average);
    byId("stat-biggest").textContent = biggest
      ? `${biggest.title} (${formatMoney(biggest.amount)})`
      : "none";
  }

  function makeCell(value, className) {
    const cell = document.createElement("td");
    cell.textContent = value == null ? "" : String(value);
    if (className) cell.className = className;
    return cell;
  }

  function renderExpenses() {
    const allExpenses = getExpenses();
    const query = (searchInput?.value || "").trim().toLocaleLowerCase();
    const category = categoryFilter?.value || "";

    const filtered = allExpenses.filter((expense) => {
      const title = String(expense.title || "").toLocaleLowerCase();
      return title.includes(query) && (!category || expense.category === category);
    });

    expenseList.replaceChildren();

    filtered.forEach((expense) => {
      const row = document.createElement("tr");
      row.append(
        makeCell(formatDate(expense.date)),
        makeCell(expense.title),
        makeCell(expense.category),
        makeCell(formatMoney(expense.amount), "num")
      );

      const actions = document.createElement("td");
      actions.className = "actions";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn";
      editButton.textContent = "Edit";
      editButton.setAttribute("aria-label", `Edit ${expense.title}`);
      editButton.addEventListener("click", () => openEdit(expense.id));

      actions.append(editButton);
      row.append(actions);
      expenseList.append(row);
    });

    updateStats(allExpenses);

    const count = byId("count");
    if (count) count.textContent = `(${filtered.length})`;

    const emptyMessage = byId("empty-message");
    if (emptyMessage) {
      emptyMessage.style.display = filtered.length ? "none" : "block";
      const emptyText = emptyMessage.firstChild;
      if (emptyText && allExpenses.length && !filtered.length) {
        emptyText.textContent = "No matching expenses. Try another search or category. ";
      } else if (emptyText) {
        emptyText.textContent = "No expenses yet. ";
      }
    }
  }

  function clearEditErrors() {
    editForm.querySelectorAll(".error").forEach((node) => {
      node.textContent = "";
    });
  }

  function setEditError(field, message) {
    const target = editForm.querySelector(`.error[data-for="${field}"]`);
    if (target) target.textContent = message;
  }

  function openEdit(id) {
    const expense = getExpenses().find((item) => String(item.id) === String(id));
    if (!expense) {
      showToast("That expense could not be found.");
      return;
    }

    byId("edit-id").value = expense.id;
    byId("edit-title").value = expense.title || "";
    byId("edit-amount").value = expense.amount ?? "";
    byId("edit-category").value = expense.category || "";
    byId("edit-date").value = expense.date || "";

    clearEditErrors();
    editModal.classList.add("open");
    byId("edit-title").focus();
  }

  function closeEdit() {
    editModal.classList.remove("open");
    editForm.reset();
    clearEditErrors();
  }

  byId("cancel-edit")?.addEventListener("click", closeEdit);

  editModal.addEventListener("click", (event) => {
    if (event.target === editModal) closeEdit();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && editModal.classList.contains("open")) {
      closeEdit();
    }
  });

  editForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const updated = {
      id: byId("edit-id").value,
      title: byId("edit-title").value.trim(),
      amount: Number(byId("edit-amount").value),
      category: byId("edit-category").value,
      date: byId("edit-date").value
    };

    clearEditErrors();
    let valid = true;

    if (!updated.title) {
      setEditError("title", "Please enter an expense title.");
      valid = false;
    } else if (updated.title.length > 80) {
      setEditError("title", "Title must be 80 characters or fewer.");
      valid = false;
    }

    if (!Number.isInteger(updated.amount) || updated.amount < 1) {
      setEditError("amount", "Enter a positive whole amount in Lek.");
      valid = false;
    }

    if (!["Food", "Transport", "Books", "Rent", "Fun", "Other"].includes(updated.category)) {
      setEditError("category", "Please choose a category.");
      valid = false;
    }

    if (!updated.date || !/^\d{4}-\d{2}-\d{2}$/.test(updated.date)) {
      setEditError("date", "Please choose a valid date.");
      valid = false;
    }

    if (!valid) return;

    const expenses = getExpenses();
    const index = expenses.findIndex((item) => String(item.id) === String(updated.id));
    if (index < 0) {
      showToast("That expense no longer exists.");
      closeEdit();
      renderExpenses();
      return;
    }

    expenses[index] = updated;
    saveExpenses(expenses);
    closeEdit();
    renderExpenses();
    showToast("Expense updated successfully.");
  });

  searchInput?.addEventListener("input", renderExpenses);
  categoryFilter?.addEventListener("change", renderExpenses);

  byId("clear-all")?.addEventListener("click", () => {
    const expenses = getExpenses();
    if (!expenses.length) return;

    if (window.confirm("Delete all expenses? This cannot be undone.")) {
      saveExpenses([]);
      renderExpenses();
      showToast("All expenses deleted.");
    }
  });

  byId("load-sample")?.addEventListener("click", () => {
    if (getExpenses().length) {
      showToast("Sample data can only be loaded when the list is empty.");
      return;
    }

    const samples = [
      { id: "sample-1", title: "Coffee", amount: 250, category: "Food", date: "2026-11-01" },
      { id: "sample-2", title: "Bus ticket", amount: 100, category: "Transport", date: "2026-11-02" },
      { id: "sample-3", title: "Programming book", amount: 1500, category: "Books", date: "2026-11-03" },
      { id: "sample-4", title: "Cinema", amount: 700, category: "Fun", date: "2026-11-04" }
    ];

    saveExpenses(samples);
    renderExpenses();
    showToast("Sample expenses loaded.");
  });

  const clock = byId("clock");
  function updateClock() {
    if (clock) clock.textContent = new Date().toLocaleTimeString();
  }
  updateClock();
  setInterval(updateClock, 1000);

  renderExpenses();
})();
