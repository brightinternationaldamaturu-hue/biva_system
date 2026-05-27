// ===============================
// SHOW TRANSACTION DETAILS
// ===============================

export function showTransactionDetails(tx) {

  const old = document.getElementById("txModalOverlay");
  if (old) old.remove();

  // ===============================
  // STATUS
  // ===============================
  const status = (tx.status || "").toLowerCase();

  let icon = "⏳";
  let statusClass = "pending";

  if (["success", "successful", "completed"].includes(status)) {
    icon = "✔️";
    statusClass = "success";
  } else if (["failed", "error"].includes(status)) {
    icon = "❌";
    statusClass = "failed";
  }

  const txType = (tx.type || tx.category || "").toLowerCase();

  let serviceTitle = tx.plan || tx.title || "Transaction";

  if (txType === "cashback") serviceTitle = "Cashback Reward";
  if (txType === "cashback_withdrawal") serviceTitle = "Cashback Withdrawal";

  const txDate = tx.createdAt?.toDate
    ? tx.createdAt.toDate().toLocaleString()
    : "Now";

  const isCredit =
    ["cashback", "cashback_withdrawal", "credit"].includes(txType);

  const amountPrefix = isCredit ? "+" : "-";

  // ===============================
  // BALANCES (SAFE HANDLING)
  // ===============================
  const beforeBalance =
    tx.beforeBalance ?? tx.balanceBefore ?? null;

  const afterBalance =
    tx.afterBalance ?? tx.balanceAfter ?? null;

  const formatMoney = (val) =>
    val !== null && val !== undefined
      ? "₦" + Number(val).toLocaleString("en-NG")
      : "N/A";

  // ===============================
  // MODAL
  // ===============================
  const overlay = document.createElement("div");
  overlay.id = "txModalOverlay";
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="tx-modal-box">

      <!-- HEADER -->
      <div class="tx-modal-header">

        <div class="tx-status-icon ${statusClass}">
          ${icon}
        </div>

        <h2>
          ${
            ["success", "successful", "completed"].includes(status)
              ? "Transaction Successful"
              : ["failed", "error"].includes(status)
              ? "Transaction Failed"
              : "Transaction Pending"
          }
        </h2>

      </div>

      <!-- AMOUNT -->
      <div class="tx-modal-amount">
        ${amountPrefix} ₦${Number(tx.amount || 0).toLocaleString("en-NG")}
      </div>

      <!-- DETAILS -->
      <div class="tx-modal-details">

        <div>
          <span>Service</span>
          <strong>${serviceTitle}</strong>
        </div>

        <div>
          <span>Network</span>
          <strong>${tx.network || "N/A"}</strong>
        </div>

        <div>
          <span>Phone</span>
          <strong>${tx.phone || "N/A"}</strong>
        </div>

        ${tx.voucher ? `
        <div>
          <span>Voucher Code</span>
          <strong style="color:#00D492;font-size:18px;letter-spacing:2px;font-weight:900;">
            ${tx.voucher}
          </strong>
        </div>
        ` : ""}

        <!-- ✅ BALANCES -->
        <div>
          <span>Balance Before</span>
          <strong>${formatMoney(beforeBalance)}</strong>
        </div>

        <div>
          <span>Balance After</span>
          <strong>${formatMoney(afterBalance)}</strong>
        </div>

        <div>
          <span>Status</span>
          <strong style="text-transform:capitalize;">${tx.status || "pending"}</strong>
        </div>

        <div>
          <span>Provider</span>
          <strong>${tx.provider || "BIVA"}</strong>
        </div>

        <div>
          <span>Reference</span>
          <strong>${tx.request_id || tx.reference || "N/A"}</strong>
        </div>

        <div>
          <span>Date</span>
          <strong>${txDate}</strong>
        </div>

        ${tx.failureReason ? `
        <div>
          <span>Reason</span>
          <strong>${tx.failureReason}</strong>
        </div>
        ` : ""}

      </div>

      <button id="closeTxModal">Close</button>

    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("closeTxModal").onclick = () => {
    overlay.remove();
  };
}