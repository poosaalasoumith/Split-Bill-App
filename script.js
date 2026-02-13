/*********************************
 * AVATAR COLOR SYSTEM (GLOBAL)
 *********************************/

/* 🚫 NO BLUE COLORS */
const AVATAR_COLORS = [
  "#14b8a6", // teal
  "#2dd4bf", // mint
  "#22c55e", // green
  "#a855f7", // purple
  "#f59e0b", // amber
  "#ec4899", // rose
];

/* Deterministic hash → same name = same color */
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* Create avatar HTML */
function createAvatar(letter, name) {
  const color = getAvatarColor(name);
  return `
    <span class="avatar" style="background:${color}">
      ${letter}
    </span>
  `;
}

/*********************************
 * STORAGE KEYS
 *********************************/
const PARTICIPANT_KEY = "split_participants";
const EXPENSE_KEY = "split_expenses";

/*********************************
 * PARTICIPANTS – STORAGE
 *********************************/
function getParticipants() {
  return JSON.parse(localStorage.getItem(PARTICIPANT_KEY)) || [];
}

function saveParticipants(list) {
  localStorage.setItem(PARTICIPANT_KEY, JSON.stringify(list));
}

/*********************************
 * EXPENSES – STORAGE
 *********************************/
function getExpenses() {
  return JSON.parse(localStorage.getItem(EXPENSE_KEY)) || [];
}

function saveExpenses(list) {
  localStorage.setItem(EXPENSE_KEY, JSON.stringify(list));
}

/*********************************
 * ADD PARTICIPANT
 *********************************/
function addParticipant() {
  const input = document.getElementById("participantInput");
  const name = input.value.trim();

  if (!name) return;

  const participants = getParticipants();

  if (participants.includes(name)) {
    alert("Participant already exists");
    return;
  }

  if (participants.length >= 20) {
    alert("Maximum 20 participants allowed");
    return;
  }

  participants.push(name);
  saveParticipants(participants);
  input.value = "";

  renderParticipants();
}

/*********************************
 * REMOVE / CLEAR PARTICIPANTS
 *********************************/
function removeParticipant(index) {
  const participants = getParticipants();
  participants.splice(index, 1);
  saveParticipants(participants);
  renderParticipants();
}

function clearParticipants() {
  if (!confirm("Remove all participants?")) return;
  localStorage.removeItem(PARTICIPANT_KEY);
  renderParticipants();
}

/*********************************
 * RENDER PARTICIPANTS
 *********************************/
function renderParticipants() {
  const listEl = document.getElementById("participantList");
  const dashboardCount = document.getElementById("dashboardParticipantCount");
  const sectionCount = document.getElementById("participantSectionCount");

  const participants = getParticipants();
  listEl.innerHTML = "";

  participants.forEach((name, index) => {
    const div = document.createElement("div"); // ✅ REQUIRED
    div.className = "participant-chip";
    const balances = calculateBalances();
    const amount = balances[name] || 0;

    let balanceText = "";
    let balanceClass = "";

    if (amount > 0.01) {
      balanceText = `+₹${amount.toFixed(2)} to receive`;
      balanceClass = "receive";
    } else if (amount < -0.01) {
      balanceText = `₹${Math.abs(amount).toFixed(2)} owes`;
      balanceClass = "owe";
    }

    div.innerHTML = `
  ${createAvatar(name[0].toUpperCase(), name)}
  <div class="participant-info">
    <span class="name">${name}</span>
    <span class="balance ${balanceClass}">${balanceText}</span>
  </div>
  <button class="delete-btn" onclick="removeParticipant(${index})">✕</button>
`;

    listEl.appendChild(div);
  });

  dashboardCount.textContent = `${participants.length}/20`;
  sectionCount.textContent = `${participants.length}/20 participants`;

  populatePaidBy();
  populateSplitAmong();
}

/*********************************
 * PAID BY – DROPDOWN
 *********************************/
function populatePaidBy() {
  const paidBy = document.getElementById("paidBy");
  const participants = getParticipants();

  paidBy.innerHTML = `<option value="">Paid by</option>`;

  participants.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    paidBy.appendChild(opt);
  });
}

/*********************************
 * SPLIT AMONG – AVATAR DROPDOWN
 *********************************/
const splitInput = document.getElementById("splitInput");
const splitMenu = document.getElementById("splitMenu");
const splitOptions = document.getElementById("splitOptions");
const splitPlaceholder = document.getElementById("splitPlaceholder");
const splitAll = document.getElementById("splitAll");

let selectedSplit = [];

/* Toggle dropdown */
splitInput.addEventListener("click", () => {
  splitMenu.classList.toggle("show");
  splitInput.classList.toggle("active");
});

/* Close on outside click */
document.addEventListener("click", (e) => {
  if (!e.target.closest(".split-dropdown")) {
    splitMenu.classList.remove("show");
    splitInput.classList.remove("active");
  }
});

/* Populate split options */
function populateSplitAmong() {
  splitOptions.innerHTML = "";
  selectedSplit = [];
  splitAll.checked = false;
  updateSplitText();

  const participants = getParticipants();

  participants.forEach((name) => {
    const row = document.createElement("div");
    row.className = "split-option";

    row.innerHTML = `
  <input type="checkbox" value="${name}">
  <div class="split-avatar" style="background:${getAvatarColor(name)}">
    ${name[0].toUpperCase()}
  </div>
  <span>${name}</span>
`;

    row.querySelector("input").addEventListener("change", (e) => {
      const value = e.target.value;

      if (e.target.checked) {
        selectedSplit.push(value);
      } else {
        selectedSplit = selectedSplit.filter((n) => n !== value);
        splitAll.checked = false;
      }

      updateSplitText();
    });

    splitOptions.appendChild(row);
  });
}

/* Select all */
splitAll.addEventListener("change", (e) => {
  const checkboxes = splitOptions.querySelectorAll("input");
  selectedSplit = [];

  checkboxes.forEach((cb) => {
    cb.checked = e.target.checked;
    if (e.target.checked) selectedSplit.push(cb.value);
  });

  updateSplitText();
});

/* Update input text */
function updateSplitText() {
  if (selectedSplit.length === 0) {
    splitPlaceholder.textContent = "Split among";
    splitPlaceholder.className = "";
  } else {
    splitPlaceholder.textContent = `${selectedSplit.length} selected`;
    splitPlaceholder.className = "split-selected";
  }
}

/* Getter for expense logic */
function getSplitAmongValues() {
  return selectedSplit;
}

/*********************************
 * ADD EXPENSE
 *********************************/
document.getElementById("addExpenseBtn").addEventListener("click", () => {
  const desc = document.getElementById("expenseDesc").value.trim();
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const paidBy = document.getElementById("paidBy").value;
  const splitAmong = getSplitAmongValues();

  if (!desc || amount <= 0 || !paidBy || splitAmong.length === 0) {
    alert("Please fill all expense fields");
    return;
  }

  const expense = {
    desc,
    amount,
    paidBy,
    splitAmong,
    date: new Date().toISOString(),
  };

  const expenses = getExpenses();
  expenses.unshift(expense);
  saveExpenses(expenses);

  document.getElementById("expenseDesc").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("paidBy").value = "";

  selectedSplit = [];
  populateSplitAmong();

  splitMenu.classList.remove("show");
  splitInput.classList.remove("active");

  renderExpenses();
  updateTotalSpent();

  renderParticipants();
  renderSettlements();
  updateSettlementStats();
});

/*********************************
 * RENDER EXPENSES
 *********************************/
function renderExpenses() {
  const container = document.getElementById("recentExpenses");
  const expenses = getExpenses();

  if (expenses.length === 0) {
    container.innerHTML = `<p class="muted-text">No expenses yet</p>`;
    return;
  }

  container.innerHTML = "";

  expenses.slice(0, 5).forEach((exp, index) => {
    const peopleCount = exp.splitAmong.length;
    const peopleText = peopleCount === 1 ? "person" : "people";

    const div = document.createElement("div");
    div.className = "expense-item";

    div.innerHTML = `
      <div class="expense-title">
        <span>${capitalize(exp.desc)}</span>
        <div class="expense-actions">
          <button class="edit-btn" onclick="editExpense(${index})">Edit</button>
          <button class="delete-expense-btn" onclick="deleteExpense(${index})">❌</button>
        </div>
      </div>

      <p class="expense-meta">
        ₹${exp.amount.toFixed(2)} · ${exp.paidBy} paid · ${peopleCount} ${peopleText}
      </p>
      <p class="expense-time">
  ${formatDateTime(exp.date)}
    `;

    container.appendChild(div);
  });
}

/*********************************
 * TOTAL SPENT
 *********************************/
function updateTotalSpent() {
  const totalEl = document.getElementById("totalSpentValue");
  const expenses = getExpenses();
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalEl.textContent = `₹${total.toFixed(2)}`;
}

/*********************************
 * EVENTS + INIT
 *********************************/
document
  .getElementById("addParticipantBtn")
  ?.addEventListener("click", addParticipant);

document
  .getElementById("clearParticipants")
  ?.addEventListener("click", clearParticipants);

document
  .getElementById("participantInput")
  ?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addParticipant();
    }
  });

document.addEventListener("DOMContentLoaded", () => {
  renderExpenses();
  updateTotalSpent();
  renderParticipants();
  renderSettlements();
  updateSettlementStats();
});

function deleteExpense(index) {
  if (!confirm("Delete this expense?")) return;

  const expenses = getExpenses();
  expenses.splice(index, 1);
  saveExpenses(expenses);

  renderExpenses();
  updateTotalSpent();
  renderParticipants();
  renderSettlements();
  updateSettlementStats();
}

function editExpense(index) {
  const expenses = getExpenses();
  const exp = expenses[index];

  // Fill form with existing values
  document.getElementById("expenseDesc").value = exp.desc;
  document.getElementById("expenseAmount").value = exp.amount;
  document.getElementById("paidBy").value = exp.paidBy;

  // Restore split selection
  selectedSplit = [...exp.splitAmong];
  populateSplitAmong();

  // Remove old expense (will be re-added on save)
  expenses.splice(index, 1);
  saveExpenses(expenses);

  renderExpenses();
  updateTotalSpent();
  renderParticipants();
  renderSettlements();
  updateSettlementStats();
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/*********************************
 * SMART SETTLEMENT ENGINE
 *********************************/
function calculateSettlements() {
  const participants = getParticipants();
  const expenses = getExpenses();
  const paidSettlements = getPaidSettlements();

  const balances = {};

  // Init balances
  participants.forEach((p) => (balances[p] = 0));

  // Calculate net balance
  expenses.forEach((exp) => {
    const share = exp.amount / exp.splitAmong.length;

    balances[exp.paidBy] += exp.amount;

    exp.splitAmong.forEach((p) => {
      balances[p] -= share;
    });
  });

  // 🔥 SUBTRACT PAID SETTLEMENTS
  paidSettlements.forEach((p) => {
    balances[p.from] += p.amount;
    balances[p.to] -= p.amount;
  });

  // Split creditors & debtors
  const creditors = [];
  const debtors = [];

  Object.entries(balances).forEach(([name, amount]) => {
    if (amount > 0.01) creditors.push({ name, amount });
    else if (amount < -0.01) debtors.push({ name, amount: -amount });
  });

  // Generate optimized settlements
  const settlements = [];
  let i = 0,
    j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const payAmount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amount: payAmount,
    });

    debtor.amount -= payAmount;
    creditor.amount -= payAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
}

// for ui own update

function calculateBalances() {
  const participants = getParticipants();
  const expenses = getExpenses();
  const paidSettlements = getPaidSettlements();

  const balances = {};
  participants.forEach((p) => (balances[p] = 0));

  expenses.forEach((exp) => {
    const share = exp.amount / exp.splitAmong.length;

    balances[exp.paidBy] += exp.amount;
    exp.splitAmong.forEach((p) => {
      balances[p] -= share;
    });
  });

  // 🔥 apply paid settlements
  paidSettlements.forEach((p) => {
    balances[p.from] += p.amount;
    balances[p.to] -= p.amount;
  });

  return balances;
}

function renderSettlements() {
  const list = document.getElementById("settlementList");
  const settlements = calculateSettlements();

  list.innerHTML = "";

  if (settlements.length === 0) {
    list.innerHTML = `<p class="muted-text">All settled 🎉</p>`;
    return;
  }

  settlements.forEach((s) => {
    const row = document.createElement("div");
    row.className = "settlement-row";

    row.innerHTML = `
      <div class="user">
        ${createAvatar(s.from[0].toUpperCase(), s.from)}
        <span>${s.from}</span>
      </div>

      <div class="transfer">
        <span class="amount-pill">₹${s.amount.toFixed(2)}</span>
        <span class="arrow">→</span>
      </div>

      <div class="user">
        ${createAvatar(s.to[0].toUpperCase(), s.to)}
        <span>${s.to}</span>
      </div>

      <button class="paid-btn" onclick="markSettlementPaid('${s.from}','${s.to}',${s.amount})">
    ✔ Paid
  </button>
    `;

    list.appendChild(row);
  });
}

function updateSettlementStats() {
  const expenses = getExpenses();
  const settlements = calculateSettlements();

  const naive = expenses.reduce((sum, e) => sum + e.splitAmong.length - 1, 0);

  const optimized = settlements.length;
  const reduction =
    naive === 0 ? 0 : Math.round(((naive - optimized) / naive) * 100);

  document.querySelector(
    ".dashboard-card:nth-child(3) .card-value",
  ).textContent = optimized;

  document.querySelector(
    ".dashboard-card:nth-child(4) .card-value",
  ).textContent = `${reduction}%`;

  document.querySelector(".smart-settlements-section .muted-text").textContent =
    `Dijkstra's algorithm reduced ${naive} potential transactions to just ${optimized}`;
}

/*********************************
 * PAID SETTLEMENTS – STORAGE
 *********************************/
const PAID_KEY = "split_paid_settlements";

function getPaidSettlements() {
  return JSON.parse(localStorage.getItem(PAID_KEY)) || [];
}

function savePaidSettlements(list) {
  localStorage.setItem(PAID_KEY, JSON.stringify(list));
}

function markSettlementPaid(from, to, amount) {
  const paid = getPaidSettlements();

  paid.push({
    from,
    to,
    amount,
    date: new Date().toISOString(),
  });

  savePaidSettlements(paid);

  // Refresh everything
  renderParticipants();
  renderSettlements();
  updateSettlementStats();
}

// date and time

function formatDateTime(iso) {
  const d = new Date(iso);

  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
