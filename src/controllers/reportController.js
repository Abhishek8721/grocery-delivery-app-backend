const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const adminGetSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;
    const query = { orderStatus: { $ne: 'Cancelled' } };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query).populate('userId', 'name email').sort({ createdAt: -1 });

    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;
    const totalTax = orders.reduce((sum, o) => sum + o.tax, 0);
    const totalDeliveryFees = orders.reduce((sum, o) => sum + o.deliveryFee, 0);

    if (format === 'csv') {
      let csv = 'Order Number,Customer Name,Customer Email,Date,Payment Method,Status,Subtotal,Tax,Delivery Fee,Total Amount\n';
      orders.forEach(o => {
        csv += `"${o.orderNumber}","${o.userId ? o.userId.name : 'N/A'}","${o.userId ? o.userId.email : 'N/A'}","${o.createdAt.toISOString()}","${o.paymentMethod}","${o.orderStatus}",${o.subtotal},${o.tax},${o.deliveryFee},${o.totalAmount}\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.csv"');
      return res.send(csv);
    }

    return res.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalOrders,
          totalTax,
          totalDeliveryFees,
          averageOrderValue: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0
        },
        orders
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminGetOrdersReport = async (req, res) => {
  try {
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' }
        }
      }
    ]);

    return res.json({ success: true, data: statusCounts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminGetProductsReport = async (req, res) => {
  try {
    const { format } = req.query;
    const products = await Product.find().populate('categoryId', 'name').sort({ stock: 1 });

    if (format === 'csv') {
      let csv = 'SKU,Product Name,Category,Price,Discount Price,Stock,Status,Created At\n';
      products.forEach(p => {
        const catName = p.categoryId ? p.categoryId.name : 'N/A';
        const stockStatus = p.stock === 0 ? 'Out of Stock' : (p.stock <= 10 ? 'Low Stock' : 'In Stock');
        csv += `"${p.sku}","${p.name}","${catName}",${p.price},${p.discountPrice},${p.stock},"${stockStatus}","${p.createdAt.toISOString()}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="products_report.csv"');
      return res.send(csv);
    }

    return res.json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  adminGetSalesReport,
  adminGetOrdersReport,
  adminGetProductsReport
};
