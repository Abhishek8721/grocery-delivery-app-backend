const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Address = require('../models/Address');
const { emitOrderCreated, emitOrderStatusUpdated } = require('../services/socket');
const { sendPushNotification } = require('../services/fcm');

const createOrder = async (req, res) => {
  try {
    const { addressId, address: rawAddress, paymentMethod = 'Cash on Delivery' } = req.body;

    let deliveryAddress = rawAddress;
    if (addressId) {
      const savedAddress = await Address.findOne({ _id: addressId, userId: req.user.id });
      if (savedAddress) {
        deliveryAddress = {
          name: savedAddress.name,
          phone: savedAddress.phone,
          house: savedAddress.house,
          street: savedAddress.street,
          area: savedAddress.area,
          city: savedAddress.city,
          state: savedAddress.state,
          pincode: savedAddress.pincode,
          landmark: savedAddress.landmark,
          type: savedAddress.type
        };
      }
    }

    if (!deliveryAddress || !deliveryAddress.house || !deliveryAddress.city || !deliveryAddress.pincode) {
      return res.status(400).json({ success: false, message: 'Valid delivery address is required.' });
    }

    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    // Verify stock and prepare order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = item.productId;
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product "${item.productId?.name || 'Item'}" is no longer available.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for "${product.name}". Only ${product.stock} available.` 
        });
      }

      const unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        image: (product.images && product.images.length > 0) ? product.images[0] : '',
        quantity: item.quantity,
        unitPrice,
        totalPrice
      });
    }

    const deliveryFee = subtotal > 500 ? 0 : 40;
    const tax = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + deliveryFee + tax;

    // Generate Order Number: GRO-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `GRO-${dateStr}-${randomSuffix}`;

    const order = await Order.create({
      orderNumber,
      userId: req.user.id,
      items: orderItems,
      address: deliveryAddress,
      subtotal,
      deliveryFee,
      discount: 0,
      tax,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      orderStatus: 'Order Placed'
    });

    // Deduct Product Stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.productId._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear Cart
    cart.items = [];
    await cart.save();

    // Emit Realtime Socket Event
    emitOrderCreated(order);

    // Send FCM push notification log
    await sendPushNotification({
      userId: req.user.id,
      title: 'Order Placed Successfully!',
      message: `Your order #${order.orderNumber} for ₹${order.totalAmount} has been placed.`,
      type: 'order'
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Order.countDocuments({ userId: req.user.id });
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.json({
      success: true,
      data: orders,
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

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Customer can only view their own order unless admin
    if (req.user.role !== 'admin' && order.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this order.' });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Controllers
const adminGetAllOrders = async (req, res) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status) query.orderStatus = status;

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'address.name': { $regex: search, $options: 'i' } },
        { 'address.phone': { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.json({
      success: true,
      data: orders,
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

const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const validStatuses = ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status value.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If order status is changed to Cancelled from non-cancelled, restore product stock
    if (status === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity }
        });
      }
    }

    if (status) order.orderStatus = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (status === 'Delivered') order.paymentStatus = 'Paid';

    await order.save();

    // Realtime Broadcast
    emitOrderStatusUpdated(order);

    // Push notification to user
    await sendPushNotification({
      userId: order.userId.toString(),
      title: `Order Update: #${order.orderNumber}`,
      message: `Your order status is now: ${order.orderStatus}`,
      type: 'order'
    });

    return res.json({
      success: true,
      message: `Order status updated to "${order.orderStatus}"`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  adminGetAllOrders,
  adminUpdateOrderStatus
};
