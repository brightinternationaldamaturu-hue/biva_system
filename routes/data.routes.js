router.get(
  "/plans/:network_id",
  dataController.getPlans
);

router.post(
  "/buy",
  dataController.buyData
);

router.post(
  "/withdraw-cashback",
  dataController.withdrawCashback
);

module.exports = router;
