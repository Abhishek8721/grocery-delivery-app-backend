const Category = require('../models/Category');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return res.json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminGetCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminCreateCategory = async (req, res) => {
  try {
    const { name, description, image, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    let imageUrl = image || '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const category = await Category.create({
      name,
      description: description || '',
      image: imageUrl,
      isActive: isActive === undefined ? true : (isActive === true || isActive === 'true')
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminUpdateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }

    if (updates.isActive !== undefined) {
      updates.isActive = updates.isActive === true || updates.isActive === 'true';
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: 'Category updated successfully',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminDeleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCategories,
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory
};
