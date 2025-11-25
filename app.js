// Wrap everything to ensure DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // ==== STATE ====
  const trips = []; // { id, name, currency, participants: [], expenses: [] }
  let activeTripId = null;

  // ==== DOM ELEMENTS ====
  const tripListEl = document.getElementById("tripList");
  const tripCreateForm = document.getElementById("tripCreateForm");
  const newTripNameEl = document.getElementById("newTripName");
  const newTripCurrencyEl = document.getElementById("newTripCurrency");

  const activeTripNameEl = document.getElementById("activeTripName");
  const openSettlementBtn = document.getElementById("openSettlementBtn");

  const currencyEl = document.getElementById("currency");
  const spentLabelEl = document.getElementById("spentLabel");
  const expensesCountLabelEl = document.getElementById("expensesCountLabel");

  const summaryPeopleEl = document.getElementById("summaryPeople");
  const summaryPerPersonEl = document.getElementById("summaryPerPerson");
  const summaryUpdatedEl = document.getElementById("summaryUpdated");

  const participantsTableBody = document.getElementById(
    "participantsTableBody"
  );
  const expensesTableBody = document.getElementById("expensesTableBody");
  const expensePaidBySelect = document.getElementById("expensePaidBy");
  const settlementTableBody = document.getElementById("settlementTableBody");

  const participantForm = document.getElementById("participantForm");
  const participantNameEl = document.getElementById("participantName");

  const expenseForm = document.getElementById("expenseForm");
  const expenseDescriptionEl = document.getElementById("expenseDescription");
  const expenseAmountEl = document.getElementById("expenseAmount");
  const expenseCategoryEl = document.getElementById("expenseCategory");

  // ==== HELPERS ====
  function getActiveTrip() {
    return trips.find((t) => t.id === activeTripId) || null;
  }

  function formatMoney(value) {
    const trip = getActiveTrip();
    const currency = trip ? trip.currency : "USD";
    const num = Number(value) || 0;
    return num.toFixed(2) + " " + currency;
  }

  // Compute balances for active trip
  function computeBalances() {
    const trip = getActiveTrip();
    if (!trip) {
      return { peopleCount: 0, totalSpent: 0, perPerson: 0, rows: [] };
    }

    const peopleCount = trip.participants.length;
    const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
    const perPerson = peopleCount > 0 ? totalSpent / peopleCount : 0;

    const rows = trip.participants.map((p) => {
      const paidTotal = trip.expenses
        .filter((e) => e.paidBy === p.id)
        .reduce((sum, e) => sum + e.amount, 0);
      const shouldPay = perPerson;
      const balance = paidTotal - shouldPay;
      return { id: p.id, name: p.name, paidTotal, shouldPay, balance };
    });

    return { peopleCount, totalSpent, perPerson, rows };
  }

  function setFormEnabled(enabled) {
    participantNameEl.disabled = !enabled;
    participantForm.querySelector("button[type='submit']").disabled = !enabled;

    expenseDescriptionEl.disabled = !enabled;
    expenseAmountEl.disabled = !enabled;
    expensePaidBySelect.disabled = !enabled;
    expenseCategoryEl.disabled = !enabled;
    expenseForm.querySelector("button[type='submit']").disabled = !enabled;

    currencyEl.disabled = !enabled;
    openSettlementBtn.disabled = !enabled;
  }

  // ==== RENDER TRIP LIST ====
  function renderTripList() {
    tripListEl.innerHTML = "";
    if (trips.length === 0) {
      tripListEl.innerHTML =
        '<li class="list-group-item bg-transparent text-secondary border-0 p-0">No trips yet – create one above.</li>';
      return;
    }

    trips.forEach((trip) => {
      const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
      const li = document.createElement("li");
      li.className =
        "list-group-item list-group-item-action bg-transparent text-light border-secondary small d-flex justify-content-between align-items-center";
      if (trip.id === activeTripId) {
        li.classList.add("active-trip");
      }
      li.dataset.id = trip.id;
      li.style.cursor = "pointer";
      li.innerHTML = `
        <span>${trip.name}</span>
        <span class="text-secondary">${totalSpent.toFixed(2)} ${
        trip.currency
      }</span>
      `;
      tripListEl.appendChild(li);
    });
  }

  // ==== UPDATE SUMMARY ====
  function updateSummary() {
    const trip = getActiveTrip();
    if (!trip) {
      spentLabelEl.textContent = "0";
      expensesCountLabelEl.textContent = "0";
      summaryPeopleEl.textContent = "0";
      summaryPerPersonEl.textContent = "0";
      summaryUpdatedEl.textContent = "–";
      return;
    }

    const { peopleCount, totalSpent, perPerson } = computeBalances();

    spentLabelEl.textContent = formatMoney(totalSpent);
    expensesCountLabelEl.textContent = trip.expenses.length;

    summaryPeopleEl.textContent = peopleCount;
    summaryPerPersonEl.textContent = formatMoney(perPerson);

    const now = new Date();
    summaryUpdatedEl.textContent = now.toLocaleTimeString();
  }

  // ==== PAID BY OPTIONS ====
  function refreshPaidByOptions() {
    const trip = getActiveTrip();
    const currentValue = expensePaidBySelect.value;
    expensePaidBySelect.innerHTML = '<option value="">Select person…</option>';

    if (!trip) return;

    trip.participants.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      expensePaidBySelect.appendChild(opt);
    });
    if (currentValue) {
      expensePaidBySelect.value = currentValue;
    }
  }

  // ==== RENDER PARTICIPANTS ====
  function renderParticipants() {
    const trip = getActiveTrip();
    participantsTableBody.innerHTML = "";

    if (!trip) {
      participantsTableBody.innerHTML =
        '<tr><td colspan="4" class="text-center text-secondary small">Create and select a trip to add participants.</td></tr>';
      return;
    }

    if (trip.participants.length === 0) {
      participantsTableBody.innerHTML =
        '<tr><td colspan="4" class="text-center text-secondary small">No participants yet – add your first traveler above.</td></tr>';
      return;
    }

    const { rows } = computeBalances();

    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.name}</td>
        <td class="text-end">${formatMoney(row.paidTotal)}</td>
        <td class="text-end ${
          row.balance >= 0 ? "text-money-positive" : "text-money-negative"
        }">${row.balance >= 0 ? "+" : ""}${formatMoney(row.balance)}</td>
        <td class="text-end">
          <button class="btn btn-outline-danger btn-sm btn-remove-participant" data-id="${
            row.id
          }">
            Remove
          </button>
        </td>
      `;
      participantsTableBody.appendChild(tr);
    });
  }

  // ==== RENDER EXPENSES ====
  function renderExpenses() {
    const trip = getActiveTrip();
    expensesTableBody.innerHTML = "";

    if (!trip) {
      expensesTableBody.innerHTML =
        '<tr><td colspan="5" class="text-center text-secondary small">Create and select a trip to add expenses.</td></tr>';
      return;
    }

    if (trip.expenses.length === 0) {
      expensesTableBody.innerHTML =
        '<tr><td colspan="5" class="text-center text-secondary small">No expenses yet – add your first expense above.</td></tr>';
      return;
    }

    trip.expenses.forEach((e) => {
      const payer = trip.participants.find((p) => p.id === e.paidBy);
      const payerName = payer ? payer.name : "Unknown";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${e.description}</td>
        <td class="text-end">${formatMoney(e.amount)}</td>
        <td>${payerName}</td>
        <td>${e.category || "-"}</td>
        <td class="text-end">
          <button class="btn btn-outline-danger btn-sm btn-remove-expense" data-id="${
            e.id
          }">
            Delete
          </button>
        </td>
      `;
      expensesTableBody.appendChild(tr);
    });
  }

  // ==== SETTLEMENT MODAL ====
  function renderSettlementModal() {
    const trip = getActiveTrip();
    settlementTableBody.innerHTML = "";

    if (!trip || trip.participants.length === 0 || trip.expenses.length === 0) {
      settlementTableBody.innerHTML =
        '<tr><td colspan="4" class="text-center text-secondary small">No data yet – add participants and expenses first.</td></tr>';
      return;
    }

    const { rows } = computeBalances();

    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.name}</td>
        <td class="text-end">${formatMoney(row.paidTotal)}</td>
        <td class="text-end">${formatMoney(row.shouldPay)}</td>
        <td class="text-end ${
          row.balance >= 0 ? "text-money-positive" : "text-money-negative"
        }">${row.balance >= 0 ? "+" : ""}${formatMoney(row.balance)}</td>
      `;
      settlementTableBody.appendChild(tr);
    });
  }

  // ==== SET ACTIVE TRIP ====
  function setActiveTrip(id) {
    activeTripId = id;
    const trip = getActiveTrip();

    if (!trip) {
      activeTripNameEl.textContent = "None selected";
      setFormEnabled(false);
      renderTripList();
      renderParticipants();
      renderExpenses();
      updateSummary();
      return;
    }

    activeTripNameEl.textContent = trip.name;
    setFormEnabled(true);
    currencyEl.value = trip.currency;

    renderTripList();
    renderParticipants();
    renderExpenses();
    refreshPaidByOptions();
    updateSummary();
  }

  // ==== CREATE TRIP ====
  tripCreateForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = newTripNameEl.value.trim();
    const currency = newTripCurrencyEl.value.trim() || "USD";

    if (!name) return;

    const id = "t_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    trips.push({
      id,
      name,
      currency,
      participants: [],
      expenses: [],
    });

    newTripNameEl.value = "";
    renderTripList();
    setActiveTrip(id);
  });

  // ==== SELECT TRIP FROM LIST ====
  tripListEl.addEventListener("click", function (e) {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    const id = li.dataset.id;
    setActiveTrip(id);
  });

  // ==== UPDATE CURRENCY ====
  currencyEl.addEventListener("input", () => {
    const trip = getActiveTrip();
    if (!trip) return;
    trip.currency = currencyEl.value.trim() || "USD";
    renderTripList();
    renderParticipants();
    renderExpenses();
    updateSummary();
  });

  // ==== ADD PARTICIPANT ====
  participantForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const trip = getActiveTrip();
    if (!trip) {
      alert("Please create and select a trip first.");
      return;
    }

    const name = participantNameEl.value.trim();
    if (!name) return;

    const id = "p_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    trip.participants.push({ id, name });

    participantNameEl.value = "";
    refreshPaidByOptions();
    renderParticipants();
    updateSummary();
  });

  // ==== ADD EXPENSE ====
  expenseForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const trip = getActiveTrip();
    if (!trip) {
      alert("Please create and select a trip first.");
      return;
    }

    const description = expenseDescriptionEl.value.trim();
    const amount = Number(expenseAmountEl.value);
    const paidBy = expensePaidBySelect.value;
    const category = expenseCategoryEl.value.trim();

    if (!description || !amount || !paidBy) return;

    const id = "e_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    trip.expenses.push({
      id,
      description,
      amount,
      paidBy,
      category,
    });

    expenseDescriptionEl.value = "";
    expenseAmountEl.value = "";
    expenseCategoryEl.value = "";

    renderExpenses();
    renderParticipants();
    renderTripList();
    updateSummary();
  });

  // ==== REMOVE PARTICIPANT / EXPENSE ====
  document.addEventListener("click", function (e) {
    const trip = getActiveTrip();
    if (!trip) return;

    if (e.target.classList.contains("btn-remove-participant")) {
      const id = e.target.getAttribute("data-id");
      const index = trip.participants.findIndex((p) => p.id === id);
      if (index !== -1) {
        for (let i = trip.expenses.length - 1; i >= 0; i--) {
          if (trip.expenses[i].paidBy === id) {
            trip.expenses.splice(i, 1);
          }
        }
        trip.participants.splice(index, 1);
        refreshPaidByOptions();
        renderParticipants();
        renderExpenses();
        renderTripList();
        updateSummary();
      }
    }

    if (e.target.classList.contains("btn-remove-expense")) {
      const id = e.target.getAttribute("data-id");
      const index = trip.expenses.findIndex((exp) => exp.id === id);
      if (index !== -1) {
        trip.expenses.splice(index, 1);
        renderExpenses();
        renderParticipants();
        renderTripList();
        updateSummary();
      }
    }
  });

  // ==== SETTLEMENT MODAL ====
  const settlementModalEl = document.getElementById("settlementModal");
  const settlementModal = new bootstrap.Modal(settlementModalEl);

  openSettlementBtn.addEventListener("click", () => {
    renderSettlementModal();
    settlementModal.show();
  });

  // Initial
  setFormEnabled(false);
  updateSummary();
});
