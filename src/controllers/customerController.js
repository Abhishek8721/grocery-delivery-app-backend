const User = require('../models/User');
const Order = require('../models/Order');

const adminGetCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = { role: 'user' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Aggregate orders for stats per user
    const formattedCustomers = await Promise.all(users.map(async (user) => {
      const stats = await Order.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpending: { $sum: '$totalAmount' }
          }
        }
      ]);

      const userObj = user.toObject();
      userObj.totalOrders = stats.length > 0 ? stats[0].totalOrders : 0;
      userObj.totalSpending = stats.length > 0 ? stats[0].totalSpending : 0;

      return userObj;
    }));

    return res.json({
      success: true,
      data: formattedCustomers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminGetCustomerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });

    const totalSpending = orders.reduce((acc, order) => acc + order.totalAmount, 0);

    return res.json({
      success: true,
      data: {
        customer: user,
        totalOrders: orders.length,
        totalSpending,
        orders
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminUpdateCustomerStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    user.isActive = isActive === true || isActive === 'true';
    await user.save();

    return res.json({
      success: true,
      message: `Customer account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  adminGetCustomers,
  adminGetCustomerById,
  adminUpdateCustomerStatus
};
