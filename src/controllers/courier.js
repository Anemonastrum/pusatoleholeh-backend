import Courier from '../models/courier.js';

export const getAllCouriers = async (req, res) => {
    try {
      const couriers = await Courier.find({ isActive: true });
      res.status(200).json(couriers);
    } catch (error) {
      res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

export const getCourierById = async (req, res) => {
    try {
      const { courierId } = req.params;
      const courier = await Courier.findById(courierId);
  
      if (!courier) {
        return res.status(404).json({ message: 'Courier not found.' });
      }
  
      res.status(200).json(courier);
    } catch (error) {
      res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

export const createCourier = async (req, res) => {
    try {
      const { name, receiptSecret, cost } = req.body;
  
      const courier = new Courier({
        name,
        receiptSecret,
        cost
      });
  
      await courier.save();
      res.status(201).json({ message: 'Courier created successfully.', courier });
    } catch (error) {
      res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

export const updateCourier = async (req, res) => {
    try {
      const { courierId } = req.params;
      const { name, receiptSecret, cost, isActive } = req.body;
  
      const courier = await Courier.findById(courierId);
      if (!courier) {
        return res.status(404).json({ message: 'Courier not found.' });
      }
  
      if (name) courier.name = name;
      if (receiptSecret) courier.receiptSecret = receiptSecret;
      if (cost) courier.cost = cost;
      if (isActive !== undefined) courier.isActive = isActive;
  
      await courier.save();
      res.status(200).json({ message: 'Courier updated successfully.', courier });
    } catch (error) {
      res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

export const deleteCourier = async (req, res) => {
    try {
      const { courierId } = req.params;
  
      const courier = await Courier.findOne({_id: courierId});
      if (!courier) {
        return res.status(404).json({ message: 'Courier not found.' });
      }

      await Courier.deleteOne({ _id: courierId });
  
      res.status(200).json({ message: 'Courier deleted successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

export const toggleCourierStatus = async (req, res) => {
    try {
      const { courierId } = req.params;
  
      const courier = await Courier.findById(courierId);
      if (!courier) {
        return res.status(404).json({ message: 'Courier not found.' });
      }
  
      courier.isActive = !courier.isActive;
      await courier.save();
  
      res.status(200).json({ message: 'Courier status toggled successfully.', courier });
    } catch (error) {
      res.status(500).json({ message: 'Server error.', error: error.message });
    }
};
  