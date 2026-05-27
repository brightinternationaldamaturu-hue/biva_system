// =========================
// SHOW LOADER
// =========================

export function showLoader(
  title = "Loading...",
  message = "Please wait"
){

  let loader =
    document.getElementById("globalLoader");

  if(loader){

    loader.remove();

  }

  loader = document.createElement("div");

  loader.id = "globalLoader";

  loader.className = "loader-overlay";

  loader.innerHTML = `

    <div class="loader-box">

      <div class="loader-logo-wrap">

        <img
          class="loader-logo-img loader-pulse"
          src="../assets/logo.png"
          alt="BIVA Logo"
        >

      </div>

      <div class="loader-title">
        ${title}
      </div>

      <div class="loader-message">
        ${message}
      </div>

    </div>

  `;

  document.body.appendChild(loader);

}


// =========================
// HIDE LOADER
// =========================

export function hideLoader(){

  const oldLoader =

  document.getElementById(
    "globalLoader"
  );

  if(oldLoader){

    oldLoader.remove();

  }

}