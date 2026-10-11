
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const router = express.Router();

// Authenticate logged-in user
async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Please log in to continue."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Authentication is not configured."
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId)
            .select("_id name email role");

        if (!user) {
            return res.status(401).json({
                message: "User not found. Please log in again."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired login session."
        });
    }
}

// Authenticate admin
function authenticateAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin access required."
        });
    }

    next();
}

// Get logged-in user's orders
router.get("/my-orders", authenticateUser, async (req, res) => {
    try {
        const orders = await Order.find({
            "customer.email": req.user.email
        }).sort({ createdAt: -1 });

        return res.status(200).json(orders);
    } catch (error) {
        console.error("Fetch orders error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch orders."
        });
    }
});

// Admin: Get all orders and dashboard statistics
router.get(
    "/admin",
    authenticateUser,
    authenticateAdmin,
    async (req, res) => {
        try {
            const orders = await Order.find().sort({ createdAt: -1 });

            const totalRevenue = orders
                .filter(order => order.status !== "Cancelled")
                .reduce(
                    (total, order) => total + order.totalAmount,
                    0
                );

            return res.status(200).json({
                totalOrders: orders.length,
                totalRevenue,
                orders
            });
        } catch (error) {
            console.error("Admin orders error:", error.message);

            return res.status(500).json({
                message: "Failed to fetch all orders."
            });
        }
    }
);

// Admin: Update order status
router.put(
    "/admin/:id/status",
    authenticateUser,
    authenticateAdmin,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const allowedStatuses = [
                "Pending",
                "Processing",
                "Shipped",
                "Delivered",
                "Cancelled"
            ];

            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    message: "Invalid order ID."
                });
            }

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid order status."
                });
            }

            const order = await Order.findByIdAndUpdate(
                id,
                { status },
                { new: true, runValidators: true }
            );

            if (!order) {
                return res.status(404).json({
                    message: "Order not found."
                });
            }

            return res.status(200).json({
                message: "Order status updated successfully.",
                order
            });
        } catch (error) {
            console.error("Update order status error:", error.message);

            return res.status(500).json({
                message: "Failed to update order status."
            });
        }
    }
);

// Create an order - login required
router.post("/", authenticateUser, async (req, res) => {
    try {
        const { customer, items, paymentMethod } = req.body;

        // Validate customer details
        if (
            !customer ||
            typeof customer.name !== "string" ||
            !customer.name.trim() ||
            typeof customer.phone !== "string" ||
            !customer.phone.trim() ||
            typeof customer.address !== "string" ||
            !customer.address.trim() ||
            typeof paymentMethod !== "string" ||
            !paymentMethod.trim()
        ) {
            return res.status(400).json({
                message: "Please provide all required order details."
            });
        }

        // Validate cart
        if (
            !Array.isArray(items) ||
            items.length === 0 ||
            items.length > 50
        ) {
            return res.status(400).json({
                message: "Your cart is empty or invalid."
            });
        }

        const combinedItems = new Map();

        // Combine duplicate product entries and limit each product to 10
        for (const item of items) {
            if (
                !item ||
                !mongoose.isValidObjectId(item.id) ||
                !Number.isSafeInteger(item.quantity) ||
                item.quantity < 1 ||
                item.quantity > 10
            ) {
                return res.status(400).json({
                    message: "Invalid product or quantity. Maximum quantity per product is 10."
                });
            }

            const productId = String(item.id);
            const existingQuantity = combinedItems.get(productId) || 0;
            const newQuantity = existingQuantity + item.quantity;

            if (newQuantity > 10) {
                return res.status(400).json({
                    message: "Maximum quantity per product is 10."
                });
            }

            combinedItems.set(productId, newQuantity);
        }

        const orderItems = [];
        let totalAmount = 0;

        // Calculate prices from the database
        for (const [productId, quantity] of combinedItems) {
            const product = await Product.findById(productId);

            if (
                !product ||
                !Number.isFinite(product.price) ||
                product.price <= 0
            ) {
                return res.status(400).json({
                    message: "A product in your cart is unavailable."
                });
            }

            const lineTotal = product.price * quantity;

            if (
                !Number.isSafeInteger(lineTotal) ||
                !Number.isSafeInteger(totalAmount + lineTotal)
            ) {
                return res.status(400).json({
                    message: "Order total is invalid."
                });
            }

            orderItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity
            });

            totalAmount += lineTotal;
        }

        // Use the authenticated account's email
        const order = await Order.create({
            customer: {
                name: customer.name.trim(),
                email: req.user.email,
                phone: customer.phone.trim(),
                address: customer.address.trim()
            },
            items: orderItems,
            totalAmount,
            paymentMethod: paymentMethod.trim()
        });

        return res.status(201).json({
            message: "Order placed successfully!",
            orderId: order._id,
            totalAmount: order.totalAmount
        });
    } catch (error) {
        console.error("Order creation error:", error.message);

        return res.status(500).json({
            message: "Failed to place order."
        });
    }
});

module.exports = router;
