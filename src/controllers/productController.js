const Product = require('../models/Product');
const Category = require('../models/Category');

const getProducts = async (req, res) => {
  try {
    const { categoryId, search, isFeatured, page = 1, limit = 20, sort = 'createdAt' } = req.query;

    const query = { isActive: true };

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    if (isFeatured === 'true') {
      query.isFeatured = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate('categoryId', 'name image')
      .sort({ [sort]: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.json({
      success: true,
      data: products,
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

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name image');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Controllers
const adminGetProducts = async (req, res) => {
  try {
    const { categoryId, search, stockStatus, page = 1, limit = 50 } = req.query;
    const query = {};

    if (categoryId) query.categoryId = categoryId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    if (stockStatus === 'low') {
      query.stock = { $gt: 0, $lte: 10 };
    } else if (stockStatus === 'out') {
      query.stock = 0;
    } else if (stockStatus === 'in') {
      query.stock = { $gt: 10 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.json({
      success: true,
      data: products,
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

const adminCreateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      categoryId,
      brand,
      images,
      price,
      discountPrice,
      unit,
      weight,
      stock,
      sku,
      isFeatured,
      isActive
    } = req.body;

    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, Category, and Price are required.' });
    }

    const generatedSku = sku || 'SKU-' + Date.now();

    let uploadedImages = Array.isArray(images) ? images : [];
    if (req.files && req.files.length > 0) {
      const fileUrls = req.files.map(f => `/uploads/${f.filename}`);
      uploadedImages = [...uploadedImages, ...fileUrls];
    }

    const product = await Product.create({
      name,
      description,
      categoryId,
      brand: brand || 'FreshFarm',
      images: uploadedImages,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : 0,
      unit: unit || 'kg',
      weight: weight || '1 kg',
      stock: stock !== undefined ? parseInt(stock) : 50,
      sku: generatedSku,
      isFeatured: isFeatured === true || isFeatured === 'true',
      isActive: isActive === undefined ? true : (isActive === true || isActive === 'true')
    });

    const populated = await Product.findById(product._id).populate('categoryId', 'name');

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminUpdateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updates = { ...req.body };

    if (req.files && req.files.length > 0) {
      const fileUrls = req.files.map(f => `/uploads/${f.filename}`);
      updates.images = [...(product.images || []), ...fileUrls];
    }

    if (updates.price !== undefined) updates.price = parseFloat(updates.price);
    if (updates.discountPrice !== undefined) updates.discountPrice = parseFloat(updates.discountPrice);
    if (updates.stock !== undefined) updates.stock = parseInt(updates.stock);
    if (updates.isFeatured !== undefined) updates.isFeatured = updates.isFeatured === true || updates.isFeatured === 'true';
    if (updates.isActive !== undefined) updates.isActive = updates.isActive === true || updates.isActive === 'true';

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name');

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct
};
