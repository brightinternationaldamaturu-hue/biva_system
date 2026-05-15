const axios = require("axios");
const { db, admin } = require("../config/firebase");

/**

* =====================================
* GET DATA PLANS
* =====================================
  */

exports.getPlans = async (req, res) => {

try {

```
const { network_id } = req.params;

console.log(
  "NETWORK ID:",
  network_id
);

const response = await axios.get(
  "https://iacafe.com.ng/devapi/v1/budget-data/plans",
  {
    params: {
      network_id
    },
    headers: {
      Authorization:
        `Bearer ${process.env.IACAFE_API_KEY}`
    }
  }
);

console.log(
  "IACAFE RESPONSE:",
  response.data
);

const rawPlans =
  response.data.data || [];

/**
 * FORMAT PLANS
 */
const plans = rawPlans.map(plan => {

  const basePrice = Number(

    plan.api_user_price ||

    plan.reseller_price ||

    plan.price ||

    0
  );

  /**
   * PROFIT
   */
  let profit = 0;

  if (basePrice <= 300) {
    profit = 13;
  }

  else if (basePrice <= 1000) {
    profit = 50;
  }

  else if (basePrice <= 2000) {
    profit = 65;
  }

  else if (basePrice <= 3500) {
    profit = 100;
  }

  else if (basePrice <= 5000) {
    profit = 150;
  }

  else {
    profit = 200;
  }

  /**
   * FINAL PRICE
   */
  const sellingPrice =
    basePrice + profit;

  /**
   * CASHBACK
   */
  const cashback =
    Math.floor(
      sellingPrice * 0.01
    );

  return {

    ...plan,

    original_price:
      basePrice,

    selling_price:
      sellingPrice,

    cashback,

    cashback_text:
      `₦${cashback} Cashback`
  };
});

return res.json({

  success: true,

  data: plans
});
```

} catch (err) {

```
console.log(
  "FULL ERROR:",
  err.response?.data ||
  err.message
);

return res.status(500).json({

  success: false,

  error:
    "Failed to load plans"
});
```

}
};

/**

* =====================================
* BUY DATA
* =====================================
  */

exports.buyData = async (req, res) => {

try {

```
const {
  userId,
  phone,
  data_plan,
  network_id
} = req.body;

/**
 * VALIDATION
 */
if (
  !userId ||
  !phone ||
  !data_plan ||
  !network_id
) {

  return res.status(400).json({

    success: false,

    error:
      "Missing required fields"
  });
}

/**
 * GET USER
 */
const userRef =
  db.collection("users").doc(userId);

const userSnap =
  await userRef.get();

if (!userSnap.exists) {

  return res.status(404).json({

    success: false,

    error:
      "User not found"
  });
}

const userData =
  userSnap.data();

/**
 * FETCH PLANS
 */
const planRes = await axios.get(
  "https://iacafe.com.ng/devapi/v1/budget-data/plans",
  {
    params: {
      network_id
    },
    headers: {
      Authorization:
        `Bearer ${process.env.IACAFE_API_KEY}`
    }
  }
);

const plans =
  planRes.data?.data || [];

/**
 * FIND PLAN
 */
const selectedPlan = plans.find(
  p =>
    String(p.data_plan) ===
    String(data_plan)
);

if (!selectedPlan) {

  return res.status(400).json({

    success: false,

    error:
      "Invalid data plan"
  });
}

/**
 * ORIGINAL PRICE
 */
const originalAmount = Number(

  selectedPlan.api_user_price ||

  selectedPlan.reseller_price ||

  selectedPlan.price ||

  0
);

/**
 * ADD PROFIT
 */
let profit = 0;

if (originalAmount <= 300) {
  profit = 13;
}

else if (originalAmount <= 1000) {
  profit = 50;
}

else if (originalAmount <= 2000) {
  profit = 65;
}

else if (originalAmount <= 3500) {
  profit = 100;
}

else if (originalAmount <= 5000) {
  profit = 150;
}

else {
  profit = 200;
}

const sellingAmount =
  originalAmount + profit;

/**
 * CHECK WALLET
 */
if (
  Number(userData.wallet) <
  sellingAmount
) {

  return res.status(400).json({

    success: false,

    error:
      "Insufficient balance"
  });
}

/**
 * DEDUCT WALLET
 */
await userRef.update({

  wallet:
    admin.firestore
    .FieldValue
    .increment(-sellingAmount)

});

/**
 * REQUEST ID
 */
const request_id =
  "BD_" +
  Date.now() +
  "_" +
  Math.floor(
    Math.random() * 1000
  );

try {

  /**
   * SEND TO IACAFE
   */
  const response = await axios.post(
    "https://iacafe.com.ng/devapi/v1/budget-data",
    {
      request_id,
      phone,
      data_plan,
      network_id
    },
    {
      headers: {
        Authorization:
          `Bearer ${process.env.IACAFE_API_KEY}`,
        "Content-Type":
          "application/json"
      }
    }
  );

  const result =
    response.data;

  console.log(
    "PURCHASE RESPONSE:",
    result
  );

  const success =

    result?.success === true ||

    result?.code === "success";

  if (!success) {

    throw new Error(

      result?.message ||

      "Purchase failed"
    );
  }

  /**
   * NETWORK MAP
   */
  const networkNames = {

    "1": "MTN",

    "2": "GLO",

    "3": "AIRTEL",

    "4": "9MOBILE"
  };

  /**
   * SAVE TRANSACTION
   */
  await db.collection("transactions")
  .doc(request_id)
  .set({

    userId,

    email:
      userData.email || "",

    fullName:
      userData.fullName || "",

    phone,

    type: "data",

    network:
      networkNames[
        String(network_id)
      ] || "Unknown",

    plan:

      selectedPlan.plan_name ||

      selectedPlan.name ||

      selectedPlan.plan ||

      selectedPlan.size ||

      data_plan,

    network_id,

    data_plan,

    originalAmount,

    profit,

    amount:
      sellingAmount,

    amountCharged:
      sellingAmount,

    status: "success",

    response: result,

    createdAt:
      admin.firestore
      .FieldValue
      .serverTimestamp()

  });

  /**
   * ==========================
   * DATA CASHBACK
   * ==========================
   */

  const cashback =
    Math.floor(
      Number(sellingAmount) * 0.01
    );

  /**
   * CREDIT CASHBACK
   */
  await userRef.update({

    wallet:
      admin.firestore
      .FieldValue
      .increment(cashback)

  });

  /**
   * SAVE CASHBACK
   */
  await db.collection("transactions")
  .add({

    userId,

    email:
      userData.email || "",

    fullName:
      userData.fullName || "",

    phone:
      userData.phone || "",

    type: "cashback",

    amount:
      cashback,

    amountCharged:
      cashback,

    status: "success",

    description:
      "1% Data cashback reward",

    createdAt:
      admin.firestore
      .FieldValue
      .serverTimestamp()

  });

  return res.json({

    success: true,

    message:
      `Data purchase successful. You earned ₦${cashback} cashback 🎉`,

    amountCharged:
      sellingAmount,

    cashback,

    data: result
  });

} catch (err) {

  console.error(
    "PURCHASE ERROR:",
    err.response?.data ||
    err.message
  );

  /**
   * REFUND USER
   */
  await userRef.update({

    wallet:
      admin.firestore
      .FieldValue
      .increment(sellingAmount)

  });

  return res.status(500).json({

    success: false,

    error:
      "Data purchase failed",

    details:
      err.response?.data ||
      err.message
  });
}
```

} catch (err) {

```
console.error(
  "MAIN ERROR:",
  err.message
);

return res.status(500).json({

  success: false,

  error: err.message
});
```

}
};
