const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

const adminGetDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      revenueAggregation,
      todayRevenueAggregation
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Order.countDocuments({ orderStatus: { $in: ['Order Placed', 'Confirmed', 'Preparing'] } }),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Product.countDocuments({ stock: { $lte: 10 } }),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;
    const todayRevenue = todayRevenueAggregation.length > 0 ? todayRevenueAggregation[0].total : 0;

    const recentOrders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(6);

    return res.json({
      success: true,
      data: {
        totalOrders,
        todayOrders,
        pendingOrders,
        totalRevenue,
        todayRevenue,
        totalCustomers,
        totalProducts,
        lowStockProducts,
        recentOrders
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminGetSalesChart = async (req, res) => {
  try {
    const { range = 'Last 7 Days' } = req.query;

    let startDate = new Date();
    let groupFormat = '%Y-%m-%d';

    if (range === 'Today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'Last 7 Days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === 'Last 30 Days' || range === 'This Month') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (range === 'This Year') {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      groupFormat = '%Y-%m';
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          sales: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedChart = salesData.map(item => ({
      date: item._id,
      sales: item.sales,
      orders: item.ordersCount
    }));

    return res.json({
      success: true,
      data: formattedChart
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminGetTopProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    return res.json({ success: true, data: topProducts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  adminGetDashboardStats,
  adminGetSalesChart,
  adminGetTopProducts
};
