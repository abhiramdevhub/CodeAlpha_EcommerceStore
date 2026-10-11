
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        customer: {
            name: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
            address: { type: String, required: true }
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },
                name: { type: String, required: true },
                price: { type: Number, required: true },
                quantity: { type: Number, default: 1 }
            }
        ],
        totalAmount: {
            type: Number,
            required: true
        },
        paymentMethod: {
            type: String,
            required: true
        },
        status: {
            type: String,
            default: "Pending"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
