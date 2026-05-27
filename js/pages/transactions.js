import { showTransactionDetails }
from "../ui/transactionModal.js";

import { auth }
from "../firebase/config.js";

import {
  listenToTransactions
}
from "../services/transaction.service.js";

import {
  renderBottomNav
}
from "../components/bottomNav.js";

import {
  showLoader,
  hideLoader
}
from "../ui/loader.js";


// =========================
// PAGE LOADED
// =========================

window.addEventListener(

  "DOMContentLoaded",

  ()=>{

    // NAV
    document.getElementById(
      "bottomNav"
    ).innerHTML =

    renderBottomNav("history");


    showLoader(
      "Loading...",
      "Fetching transactions"
    );


    auth.onAuthStateChanged(

      (user)=>{

        if(!user){

          hideLoader();

          window.location.href =
          "login.html";

          return;

        }

        // REALTIME LISTENER
        listenToTransactions(

          user.uid,

          (transactions)=>{

            const list =
            document.getElementById(
              "transactionList"
            );

            list.innerHTML = "";


            // EMPTY
            if(

              !transactions.length

            ){

              list.innerHTML = `

                <p style="
                  text-align:center;
                  opacity:.7;
                  margin-top:40px;
                ">

                  No transactions yet

                </p>

              `;

              hideLoader();

              return;

            }


            // RENDER
            transactions.forEach((tx)=>{

              const iconMap = {

                data: "🌐",

                airtime: "📱",

                electricity: "⚡",

                voucher: "🎟️",

                cashback: "💸",

                cashback_withdrawal: "💰"

              };

              const txKey = (

                tx.type ||

                tx.category ||

                ""

              ).toLowerCase();

              const icon = iconMap[txKey] || "💳";


              const card =
              document.createElement("div");

              card.className =
              "transaction-card";


card.innerHTML = `

  <div class="tx-left">

    <div class="tx-icon">

      ${icon}

    </div>

    <div class="tx-info">

      <h3>

        ${
          tx.type === "wallet_funding" ||
          tx.type === "funding" ||
          tx.type === "deposit" ||
          tx.type === "fund"
            ? "Wallet Funding"
            : tx.plan || tx.title || "Transaction"
        }

      </h3>

      <p class="tx-date">

        ${
          tx.createdAt?.toDate
          ? tx.createdAt.toDate().toLocaleString()
          : "Now"
        }

      </p>

    </div>

  </div>

  <div class="tx-right">

    <div class="tx-amount ${
      [
        "cashback",
        "credit",
        "cashback_withdrawal",
        "wallet_funding",
        "deposit",
        "funding",
        "fund"
      ].includes(tx.type)
        ? "credit"
        : "debit"
    }">

      ${
        [
          "cashback",
          "credit",
          "cashback_withdrawal",
          "wallet_funding",
          "deposit",
          "funding",
          "fund"
        ].includes(tx.type)
          ? "+"
          : "-"
      }

      ₦${Number(
        tx.amount || 0
      ).toLocaleString("en-NG")}

    </div>

    <div class="tx-status status-${tx.status}">

      ${tx.status || "pending"}

    </div>

  </div>

`;


              // DETAILS
              card.addEventListener(

                "click",

                ()=>{

                  showTransactionDetails(tx);

                }

              );

              list.appendChild(card);

            });

            hideLoader();
          }

        );

      }

    );

  }

);