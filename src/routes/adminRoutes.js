const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const {
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct
} = require('../controllers/productController');

const {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory
} = require('../controllers/categoryController');

const {
  adminGetAllOrders,
  adminUpdateOrderStatus,
  getOrderById
} = require('../controllers/orderController');

const {
  adminGetCustomers,
  adminGetCustomerById,
  adminUpdateCustomerStatus
} = require('../controllers/customerController');

const {
  adminGetDashboardStats,
  adminGetSalesChart,
  adminGetTopProducts
} = require('../controllers/dashboardController');

const {
  adminGetSalesReport,
  adminGetOrdersReport,
  adminGetProductsReport
} = require('../controllers/reportController');

const { adminSendNotification } = require('../controllers/notificationController');

// All Admin routes require Auth + Admin Role
router.use(authenticateUser, requireAdmin);

// Dashboard & Analytics
router.get('/dashboard', adminGetDashboardStats);
router.get('/dashboard/sales', adminGetSalesChart);
router.get('/dashboard/top-products', adminGetTopProducts);

// Products
router.get('/products', adminGetProducts);
router.post('/products', upload.array('images', 5), adminCreateProduct);
router.put('/products/:id', upload.array('images', 5), adminUpdateProduct);
router.delete('/products/:id', adminDeleteProduct);

// Categories
router.get('/categories', adminGetCategories);
router.post('/categories', upload.single('image'), adminCreateCategory);
router.put('/categories/:id', upload.single('image'), adminUpdateCategory);
router.delete('/categories/:id', adminDeleteCategory);

// Orders
router.get('/orders', adminGetAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', adminUpdateOrderStatus);

// Inventory
router.get('/inventory', adminGetProducts);

// Customers
router.get('/customers', adminGetCustomers);
router.get('/customers/:id', adminGetCustomerById);
router.put('/customers/:id/status', adminUpdateCustomerStatus);

// Reports
router.get('/reports/sales', adminGetSalesReport);
router.get('/reports/orders', adminGetOrdersReport);
router.get('/reports/products', adminGetProductsReport);

// Notifications
router.post('/notifications', adminSendNotification);

module.exports = router;
