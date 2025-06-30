import Order from '../models/Order.js';

export const createOrder = async (req, res) => {
  const user_id = req.user.userId;
  const { phone, items } = req.body; // items - массив сборок
  
  try {
    const total = items.reduce(
      (sum, item) => sum + (item.unit_price * item.quantity), 
      0
    );
    
    // Передаем items в модель
    const order = await Order.create({ user_id, phone, total, items });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
export const getUserOrders = async (req, res) => {
  const user_id = req.user.userId;

  try {
    const orders = await Order.getByUser(user_id);
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
};

export const completeOrder = async (req, res) => {
  const order_id = req.params.id;
  
  try {
    const order = await Order.completeOrder(order_id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
