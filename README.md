# CodeAlpha E-Commerce Store

A full-stack e-commerce web application built as part of the CodeAlpha internship project.

## Features

- User registration and login
- Secure password hashing and JWT authentication
- Product listing and product details
- Shopping cart with add and remove functionality
- Checkout and order processing
- Order history for customers
- Admin dashboard for product management
- Order status management
- MongoDB database integration
- Responsive user interface

## Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JSON Web Tokens (JWT), bcrypt
- **Tools:** Visual Studio Code, Git, GitHub

## Project Structure

```text
CodeAlpha_EcommerceStore/
├── models/
├── public/
├── routes/
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

## Installation and Setup

### Prerequisites

- Node.js and npm
- A MongoDB database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/abhiramdevhub/CodeAlpha_EcommerceStore.git
cd CodeAlpha_EcommerceStore
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and configure these variables with your own values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
```

Never commit your `.env` file or expose database credentials and secret keys.

### 4. Start the application

```bash
npm start
```

If the start script is not configured, run:

```bash
node server.js
```

Open `http://localhost:5000` in your browser.

## Main Modules

- **Authentication:** Registration, login, and user sessions.
- **Products:** Product listing and administration.
- **Cart:** Adding, removing, and calculating cart totals.
- **Orders:** Checkout, order creation, and order history.
- **Admin:** Product management and order status updates.

## Future Enhancements

- Online payment gateway integration
- Persistent carts linked to customer accounts
- Product ratings and reviews
- Product categories and advanced search
- Deployment to a cloud hosting platform

## Author

**Abhi Ram**

## Project

CodeAlpha Internship — E-Commerce Store
