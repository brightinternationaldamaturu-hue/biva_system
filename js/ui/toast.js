// CREATE CONTAINER
function getContainer(){

  let container =
  document.querySelector(".toast-container");

  if(!container){

    container =
    document.createElement("div");

    container.className =
    "toast-container";

    document.body.appendChild(container);

  }

  return container;

}


// CREATE TOAST
function createToast(message, type){

  const container =
  getContainer();

  const toast =
  document.createElement("div");

  toast.className =
  `toast toast-${type}`;

  toast.innerText =
  message;


  // ADD TO PAGE
  container.appendChild(toast);


  // REMOVE AFTER 3 SECONDS
  setTimeout(()=>{

    toast.remove();

  }, 3000);

}


// SUCCESS
export function showToastSuccess(message){

  createToast(message, "success");

}


// ERROR
export function showToastError(message){

  createToast(message, "error");

}


// INFO
export function showToastInfo(message){

  createToast(message, "info");

}