
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
