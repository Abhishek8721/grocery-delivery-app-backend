const Address = require('../models/Address');

const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json({ success: true, data: addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createAddress = async (req, res) => {
  try {
    const { name, phone, house, street, area, city, state, pincode, landmark, type, latitude, longitude, isDefault } = req.body;

    if (!name || !phone || !house || !street || !area || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'Please provide all required address fields.' });
    }

    if (isDefault) {
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }

    const address = await Address.create({
      userId: req.user.id,
      name,
      phone,
      house,
      street,
      area,
      city,
      state,
      pincode,
      landmark: landmark || '',
      type: type || 'Home',
      latitude: latitude || 0,
      longitude: longitude || 0,
      isDefault: isDefault || false
    });

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: address
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const updated = await Address.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    return res.json({ success: true, message: 'Address updated successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    return res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress
};
