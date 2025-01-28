import Alert from '../models/alert.js';

// Get all alerts for a user
export const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Create a new alert
export const createAlert = async (req, res) => {
  try {
    const { userId, message, type = 'info' } = req.body;

    const alert = new Alert({
      userId,
      message,
      type,
    });

    await alert.save();
    res.status(201).json({ message: 'Alert created successfully.', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Update an alert
export const updateAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { message, type } = req.body;

    if (!message && !type) {
      return res.status(400).json({ message: 'No fields to update provided.' });
    }

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    if (message) alert.message = message;
    if (type) alert.type = type;

    await alert.save();
    res.status(200).json({ message: 'Alert updated successfully.', alert });
  } catch (error) {
    console.error('Error updating alert:', error.message);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Delete an alert
export const deleteAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findByIdAndDelete(alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    res.status(200).json({ message: 'Alert deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Delete all alerts
export const deleteAllAlerts = async (req, res) => {
  try {
    const result = await Alert.deleteMany({ userId: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No alerts found for this user.' });
    }

    res.status(200).json({ message: `${result.deletedCount} alerts deleted successfully.` });
  } catch (error) {
    console.error('Error deleting all alerts:', error.message);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Toggle alert active status
export const toggleAlertStatus = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    alert.isActive = !alert.isActive;
    await alert.save();

    res.status(200).json({ message: 'Alert status toggled successfully.', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Mark an alert as read
export const markAlertAsRead = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    alert.isRead = true;
    await alert.save();

    res.status(200).json({ message: 'Alert marked as read.', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
