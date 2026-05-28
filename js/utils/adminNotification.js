const { db, admin } = require("../../config/firebase");

exports.sendAdminNotification = async (data) => {

  try {

    console.log("ADMIN NOTIFICATION START");

    const notification = {

      type:
        data.type || "system",

      title:
        data.title || "New Notification",

      amount:
        data.amount || 0,

      reference:
        data.reference || "",

      user:
        data.user || {},

      extra:
        data.extra || {},

      read: false,

      createdAt:
        admin.firestore.FieldValue.serverTimestamp()

    };

    // SAVE TO FIRESTORE
    await db
      .collection("admin_notifications")
      .add(notification);

    console.log(
      "ADMIN NOTIFICATION SAVED"
    );

  }

  catch (err) {

    console.log(
      "ADMIN NOTIFICATION ERROR:",
      err.message
    );

  }

};
