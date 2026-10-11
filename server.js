const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const productRoutes = require("./routes/productRoutes");

app.use("/api/products", productRoutes);

const orderRoutes = require("./routes/orderRoutes");

app.use("/api/orders", orderRoutes);

const authRoutes = require("./routes/authRoutes");

app.use("/api/auth", authRoutes);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });

app.get("/", (req, res) => {
    res.send("CodeAlpha E-Commerce Server is Running!");
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});