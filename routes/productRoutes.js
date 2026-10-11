
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Product = require("../models/Product");
const User = require("../models/User");

const router = express.Router();

// Verify that the logged-in user is an admin
async function authenticateAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Please log in as an admin."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Authentication is not configured."
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);

        if (!user || user.role !== "admin") {
            return res.status(403).json({
                message: "Admin access required."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please log in again."
        });
    }
}

// Get all products - public
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch products."
        });
    }
});

// Seed products - admin only
router.post("/seed", authenticateAdmin, async (req, res) => {
    try {
        const products = [
            {
                name: "Wireless Headphones",
                price: 1499,
                image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
                description: "High-quality wireless headphones with comfortable design and clear sound."
            },
            {
                name: "Smart Watch",
                price: 2499,
                image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
                description: "Modern smart watch with fitness tracking and everyday smart features."
            },
            {
                name: "Running Shoes",
                price: 1999,
                image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
                description: "Comfortable running shoes designed for everyday use and active lifestyles."
            },
            {
                name: "Backpack",
                price: 999,
                image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
                description: "Durable backpack suitable for college, travel and everyday carrying."
            }
        ];

        await Product.deleteMany({});
        const insertedProducts = await Product.insertMany(products);

        res.json({
            message: "Products added successfully.",
            count: insertedProducts.length
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to seed products."
        });
    }
});

// Add a product - admin only
router.post("/", authenticateAdmin, async (req, res) => {
    try {
        const { name, price, image, description } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            !Number.isFinite(price) || price <= 0 ||
            typeof image !== "string" || !image.trim() ||
            typeof description !== "string" || !description.trim()
        ) {
            return res.status(400).json({
                message: "Provide a valid name, price, image URL and description."
            });
        }

        const product = await Product.create({
            name: name.trim(),
            price,
            image: image.trim(),
            description: description.trim()
        });

        res.status(201).json({
            message: "Product added successfully.",
            product
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to add product."
        });
    }
});

// Edit a product - admin only
router.put("/:id", authenticateAdmin, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid product ID."
            });
        }

        const { name, price, image, description } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            !Number.isFinite(price) || price <= 0 ||
            typeof image !== "string" || !image.trim() ||
            typeof description !== "string" || !description.trim()
        ) {
            return res.status(400).json({
                message: "Provide valid product details."
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name: name.trim(),
                price,
                image: image.trim(),
                description: description.trim()
            },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.json({
            message: "Product updated successfully.",
            product
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update product."
        });
    }
});

// Delete a product - admin only
router.delete("/:id", authenticateAdmin, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid product ID."
            });
        }

        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.json({
            message: "Product deleted successfully."
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete product."
        });
    }
});

module.exports = router;
