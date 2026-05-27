import {

  doc,
  getDoc

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {

  verifyTransactionPin

}

from "../ui/pinModal.js";



import {

  auth,
  db

}

from "../firebase/config.js";



import {
  renderBottomNav
}
from "../components/bottomNav.js";

import {
  getDataPlans,
  buyDataService
}
from "../services/data.service.js";


import {
  showLoader,
  hideLoader
}
from "../ui/loader.js";

import {
  showSuccess,
  showError
}
from "../ui/modal.js";





function formatNaira(amount) {
  if (!amount || isNaN(amount)) return "₦0";
  return "₦" + Number(amount).toLocaleString("en-NG");
}


const CASHBACK_RATE = 0.01;



function calculateCashback(amount) {
  if (!amount || isNaN(amount)) return 0;
  return Math.floor(Number(amount) * CASHBACK_RATE);
}


let allPlans = [];







// ===============================
// NAVIGATION
// ===============================

document.getElementById(
  "bottomNav"
).innerHTML =

renderBottomNav("home");


// ===============================
// LOAD NETWORK PLANS
// ===============================

window.selectNetwork =
async(network, element)=>{

  try{

    // ACTIVE CARD
    document
    .querySelectorAll(
      ".network-card"
    )

    .forEach((card)=>{

      card.classList.remove(
        "active-network"
      );

    });

    element.classList.add(
      "active-network"
    );


    showLoader(
      "Loading Plans..."
    );


    // FETCH PLANS
    const plans =
    await getDataPlans(
      network
    );

allPlans = plans;







renderPlans(
  allPlans,
  network
);

  }




  catch(error){

    console.error(error);

    showError(

      error.message ||

      "Failed to load plans"

    );

  }

  finally{

    hideLoader();

  }

};






window.filterPlans = (

  type,
  element

)=>{

  // ACTIVE BUTTON
  document
  .querySelectorAll(
    ".filter-btn"
  )

  .forEach((btn)=>{

    btn.classList.remove(
      "active-filter"
    );

  });

  element.classList.add(
    "active-filter"
  );


  let filtered =
  [...allPlans];


  // FILTER
  if(type !== "all"){

    filtered =
    allPlans.filter((plan)=>{

      const name =

        (
          plan.name ||

          plan.data_plan ||

          ""
        )

        .toLowerCase();


      return name.includes(type);

    });

  }


  // CURRENT NETWORK
  const activeCard =
  document.querySelector(
    ".active-network"
  );

  const network =

    activeCard?.dataset
    ?.network ||

    "mtn";


  renderPlans(
    filtered,
    network
  );

};






// ===============================
// RENDER DATA PLANS
// ===============================

function renderPlans(

  plans,
  network

){

  const container =
  document.getElementById(
    "dataPlans"
  );

  container.innerHTML = "";


  plans.forEach((plan)=>{

    const card =
    document.createElement("div");

    card.className =
    "plan-card";


    card.innerHTML = `
  <h3>
    ${plan.name || plan.data_plan}
  </h3>

  <p>
    ${plan.validity || ""}
  </p>

  <h2>
    ${formatNaira(plan.selling_price)}
  </h2>

  <div style="font-size:12px; color:#FFD166; margin-bottom:6px;">
    Cashback (1%): 
    <b>
      ${formatNaira(
        calculateCashback(plan.selling_price)
      )}
    </b>
  </div>

  <div style="font-size:12px; color:#00D492; margin-bottom:12px;">
    You earn instantly after purchase 🎉
  </div>

  <button>
    Buy Now
  </button>
`;


    // BUTTON
    const btn =
    card.querySelector(
      "button"
    );


    btn.onclick = ()=>{

      buyPlan(

        network,

        plan.data_plan,

        plan.selling_price

      );

    };


    container.appendChild(
      card
    );

  });

}


// ===============================
// BUY DATA
// ===============================

let processing = false;

async function buyPlan(

  network,
  data_plan,
  amount

){

  if(processing){

    return;

  }

  try{

    const phone =
    document.getElementById(
      "dataPhone"
    ).value.trim();

    // ===============================
    // VALIDATION
    // ===============================

    if(!phone){

      throw new Error(
        "Enter phone number"
      );

    }

    if(!auth.currentUser){

      throw new Error(
        "Login required"
      );

    }

    // ===============================
    // LOCK BUTTON
    // ===============================

    processing = true;

    showLoader(
      "Preparing Purchase..."
    );

    // ===============================
    // GET USER
    // ===============================

    const userDoc = await getDoc(

      doc(
        db,
        "users",
        auth.currentUser.uid
      )

    );

    if(!userDoc.exists()){

      throw new Error(
        "User account not found"
      );

    }

    const userData =
    userDoc.data();

    // ===============================
    // CHECK BALANCE
    // ===============================

    if(

      Number(userData.wallet || 0)
      < Number(amount)

    ){

      throw new Error(
        "Insufficient wallet balance"
      );

    }

    // ===============================
    // CHECK PIN
    // ===============================

    if(

      !userData.transactionPin

    ){

      throw new Error(

        "Please setup transaction PIN first"

      );

    }

    // ===============================
    // VERIFY PIN
    // ===============================

    await verifyTransactionPin(

      userData.transactionPin,

      {

        title:"Data Purchase",

        amount,

        network,

        phone

      }

    );

    // ===============================
    // PROCESSING
    // ===============================

    showLoader(
      "Processing Data..."
    );

    // ===============================
    // BUY DATA
    // ===============================

    const response =
    await buyDataService({

      userId:
      auth.currentUser.uid,

      phone,

      data_plan,

      network_id:
      network

    });

    // ===============================
    // SUCCESS
    // ===============================

    showSuccess(

      response.message ||

      "Data Purchase Successful"

    );

    // ===============================
    // CLEAR FORM
    // ===============================

    document.getElementById(
      "dataPhone"
    ).value = "";

  }

  catch(error){

    console.error(error);

    showError(

      error.message ||

      "Transaction Failed"

    );

  }

  finally{

    processing = false;

    hideLoader();

  }

}






function detectNetwork(phone){

  const prefixes = {

    mtn: [

      "0803","0806","0703","0706",
      "0813","0816","0810","0814",
      "0903","0906","0913","0916"

    ],

    airtel: [

      "0802","0808","0708","0812",
      "0701","0902","0901","0904",
      "0907","0912"

    ],

    glo: [

      "0805","0807","0705","0815",
      "0811","0905","0915"

    ],

    "9mobile": [

      "0809","0817","0818","0908",
      "0909"

    ]

  };


  const clean =

    phone.replace(/\D/g,'');


  const prefix =
  clean.substring(0,4);


  for(const network in prefixes){

    if(

      prefixes[network]
      .includes(prefix)

    ){

      return network;

    }

  }


  return null;

}







const phoneInput =
document.getElementById(
  "dataPhone"
);

let currentDetectedNetwork =
null;


// AUTO DETECT NETWORK
phoneInput.addEventListener(

  "input",

  ()=>{

    const clean =

      phoneInput.value
      .replace(/\D/g,'');


    // WAIT UNTIL 11 DIGITS
    if(clean.length < 11){

      return;

    }


    const network =
    detectNetwork(clean);


    // PREVENT RELOADING SAME NETWORK
    if(

      !network ||

      network ===
      currentDetectedNetwork

    ){

      return;

    }


    currentDetectedNetwork =
    network;


    const card =
    document.querySelector(

      `[data-network="${network}"]`

    );


    if(card){

      window.selectNetwork(
        network,
        card
      );

    }

  }

);