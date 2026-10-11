const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                "img-src": ["'self'", "data:", "https:"],
                "script-src-attr": ["'unsafe-inline'"]
            }
        }
    })
);
app.use(express.json({ limit: "10kb" }));
app.use(cors());
app.use(express.static("public"));

const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

const authRoutes = require("./routes/authRoutes");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many requests. Please try again later."
    }
});

app.use("/api/auth", authLimiter, authRoutes);

app.get("/", (req, res) => {
    res.send("CodeAlpha E-Commerce Server is Running!");
});

async function startServer() {
    try {
        if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
            throw new Error("MONGO_URI or JWT_SECRET is missing from .env");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();