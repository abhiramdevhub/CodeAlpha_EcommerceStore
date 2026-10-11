
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const router = express.Router();

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

        res.status(200).json(orders);
    } catch (error) {
        console.error("Fetch orders error:", error.message);

        res.status(500).json({
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
                .reduce((total, order) => total + order.totalAmount, 0);

            res.status(200).json({
                totalOrders: orders.length,
                totalRevenue,
                orders
            });
        } catch (error) {
            console.error("Admin orders error:", error.message);

            res.status(500).json({
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

            res.status(200).json({
                message: "Order status updated successfully.",
                order
            });
        } catch (error) {
            console.error("Update order status error:", error.message);

            res.status(500).json({
                message: "Failed to update order status."
            });
        }
    }
);

// Create an order
router.post("/", async (req, res) => {
    try {
        const { customer, items, paymentMethod } = req.body;

        if (
            !customer ||
            !customer.name ||
            !customer.email ||
            !customer.phone ||
            !customer.address ||
            !Array.isArray(items) ||
            items.length === 0 ||
            !paymentMethod
        ) {
            return res.status(400).json({
                message: "Please provide all required order details."
            });
        }

        const orderItems = [];
        let totalAmount = 0;

        for (const item of items) {
            if (
                !mongoose.isValidObjectId(item.id) ||
                !Number.isInteger(item.quantity) ||
                item.quantity < 1
            ) {
                return res.status(400).json({
                    message: "Invalid product or quantity."
                });
            }

            const product = await Product.findById(item.id);

            if (!product) {
                return res.status(400).json({
                    message: "A product in your cart was not found."
                });
            }

            orderItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity
            });

            totalAmount += product.price * item.quantity;
        }

        const order = await Order.create({
            customer: {
                name: customer.name.trim(),
                email: customer.email.trim().toLowerCase(),
                phone: customer.phone.trim(),
                address: customer.address.trim()
            },
            items: orderItems,
            totalAmount,
            paymentMethod
        });

        res.status(201).json({
            message: "Order placed successfully!",
            orderId: order._id,
            totalAmount: order.totalAmount
        });
    } catch (error) {
        console.error("Order creation error:", error.message);

        res.status(500).json({
            message: "Failed to place order."
        });
    }
});

module.exports = router;
