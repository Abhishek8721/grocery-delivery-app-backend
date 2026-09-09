const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id }).populate({
      path: 'items.productId',
      select: 'name price discountPrice images stock unit weight isActive'
    });

    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [] });
    }

    // Filter out inactive or deleted products
    const validItems = cart.items.filter(item => item.productId && item.productId.isActive);

    let subtotal = 0;
    const formattedItems = validItems.map(item => {
      const p = item.productId;
      const effectivePrice = p.discountPrice > 0 ? p.discountPrice : p.price;
      const itemTotal = effectivePrice * item.quantity;
      subtotal += itemTotal;

      return {
        productId: p._id,
        name: p.name,
        image: (p.images && p.images.length > 0) ? p.images[0] : '',
        price: p.price,
        discountPrice: p.discountPrice,
        effectivePrice,
        stock: p.stock,
        unit: p.unit,
        weight: p.weight,
        quantity: item.quantity,
        totalPrice: itemTotal
      };
    });

    const deliveryFee = subtotal > 500 || subtotal === 0 ? 0 : 40;
    const tax = Math.round(subtotal * 0.05); // 5% GST/Tax
    const grandTotal = subtotal + deliveryFee + tax;

    return res.json({
      success: true,
      data: {
        items: formattedItems,
        subtotal,
        deliveryFee,
        tax,
        grandTotal,
        itemCount: formattedItems.reduce((acc, item) => acc + item.quantity, 0)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available in stock.` });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    const existingIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + parseInt(quantity);
      if (product.stock < newQty) {
        return res.status(400).json({ success: false, message: `Cannot add more. Stock limit reached (${product.stock}).` });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({ productId, quantity: parseInt(quantity) });
    }

    await cart.save();
    return getCart(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    if (quantity === 0) {
      cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    } else {
      const product = await Product.findById(productId);
      if (product && product.stock < quantity) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} units available in stock.` });
      }

      const item = cart.items.find(i => i.productId.toString() === productId);
      if (item) {
        item.quantity = parseInt(quantity);
      }
    }

    await cart.save();
    return getCart(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    let cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      cart.items = cart.items.filter(item => item.productId.toString() !== productId);
      await cart.save();
    }
    return getCart(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
