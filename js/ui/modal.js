// ===============================
// SHOW SUCCESS MODAL
// ===============================

export function showSuccess(message){

  createModal(

    "success",

    "✔️",

    message

  );

}


// ===============================
// SHOW ERROR MODAL
// ===============================

export function showError(message){

  createModal(

    "error",

    "❌",

    message

  );

}


// ===============================
// CREATE MODAL
// ===============================

function createModal(

  type,
  icon,
  message

){

  // REMOVE OLD
  const oldModal =
  document.getElementById(
    "globalModal"
  );

  if(oldModal){

    oldModal.remove();

  }


  // OVERLAY
  const overlay =
  document.createElement("div");

  overlay.className =
  "modal-overlay";

  overlay.id =
  "globalModal";


  // HTML
  overlay.innerHTML = `

    <div class="modal-box">

      <div class="modal-icon ${type}">

        ${icon}

      </div>


      <h2>

        ${
          type === "success"
          ? "Successful"
          : "Failed"
        }

      </h2>


      <p>

        ${message}

      </p>


      <button id="closeModalBtn">

        OK

      </button>

    </div>

  `;


  // ADD TO BODY
  document.body.appendChild(
    overlay
  );


  // CLOSE
  document.getElementById(
    "closeModalBtn"
  )

  .addEventListener(

    "click",

    ()=>{

      overlay.remove();

    }

  );

}