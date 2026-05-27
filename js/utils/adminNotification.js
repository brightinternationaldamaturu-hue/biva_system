const { db, admin } =
require("../config/firebase");

exports.sendAdminNotification =
async ({
  type,
  title,
  amount,
  user,
  reference,
  extra = {}
}) => {

  try {

    await db
    .collection("admin_notifications")
    .add({

      type,

      title,

      amount,

      reference,

      userId:
        user.userId || "",

      fullName:
        user.fullName || "",

      email:
        user.email || "",

      phone:
        user.phone || "",

      read: false,

      createdAt:
        admin.firestore
        .FieldValue
        .serverTimestamp(),

      ...extra

    });

  }

  catch(err){

    console.log(
      "ADMIN NOTIFICATION ERROR:",
      err.message
    );

  }

};