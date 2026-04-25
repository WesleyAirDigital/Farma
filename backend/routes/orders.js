const express = require("express");

const ordersController = require("../controllers/ordersController");
const { requireAdminAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAdminAuth, ordersController.listOrders);
router.post("/", ordersController.createOrder);
router.patch("/:id/status", requireAdminAuth, ordersController.updateOrderStatus);

module.exports = router;
