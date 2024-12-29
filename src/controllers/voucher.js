import Voucher from '../models/voucher.js';

export const getAllVouchers = async (req, res) => {
    try {
      const vouchers = await Voucher.find({ isActive: true });
  
      res.status(200).json(vouchers);
    } catch (error) {
      res.status(500).json({ message: 'Server error.', error: error.message });
    }
  };
  

export const getVoucherById = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const voucher = await Voucher.findById(voucherId);

    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found.' });
    }

    res.status(200).json(voucher);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const createVoucher = async (req, res) => {
  try {
    const { name, shopId, quantity, discount, minPurchase, expired, isActive } = req.body;

    const voucher = new Voucher({
      name,
      shopId,
      quantity,
      discount,
      minPurchase,
      expired,
      isActive: isActive !== undefined ? isActive : true,
    });

    await voucher.save();
    res.status(201).json({ message: 'Voucher created successfully.', voucher });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const updateVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const { name, quantity, discount, minPurchase, expired, isActive } = req.body;

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found.' });
    }

    if (name) voucher.name = name;
    if (quantity) voucher.quantity = quantity;
    if (discount) voucher.discount = discount;
    if (minPurchase) voucher.minPurchase = minPurchase;
    if (expired) voucher.expired = expired;
    if (isActive !== undefined) voucher.isActive = isActive;

    await voucher.save();
    res.status(200).json({ message: 'Voucher updated successfully.', voucher });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const deleteVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;

    const voucher = await Voucher.findByIdAndDelete(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found.' });
    }

    res.status(200).json({ message: 'Voucher deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const toggleVoucherStatus = async (req, res) => {
  try {
    const { voucherId } = req.params;

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found.' });
    }

    voucher.isActive = !voucher.isActive;
    await voucher.save();

    res.status(200).json({ message: 'Voucher status toggled successfully.', voucher });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
