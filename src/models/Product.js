const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, default: 'FreshFarm' },
  images: [{ type: String }],
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: 'kg' }, // kg, g, pack, pcs, l, ml
  weight: { type: String, default: '1 kg' },
  stock: { type: Number, required: true, min: 0, default: 50 },
  sku: { type: String, required: true, unique: true },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
