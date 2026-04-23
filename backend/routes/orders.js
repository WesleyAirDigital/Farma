const express = require("express");

const ordersController = require("../controllers/ordersController");

const router = express.Router();

router.get("/", ordersController.listOrders);
router.post("/", ordersController.createOrder);
router.patch("/:id/status", ordersController.updateOrderStatus);

module.exports = router;
