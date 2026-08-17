import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../supabaseClient';

// Use the API Keys provided by the user
const razorpay = new Razorpay({
  key_id: 'rzp_test_T34XmzvqjTeeXs',
  key_secret: 'QEUwA7d1cV8AdBaloTJQClni',
});

// Get all orders (for Admin Panel)
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Map snake_case to camelCase
    const formattedOrders = (data || []).map(order => ({
      ...order,
      createdAt: order.created_at,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      razorpayOrderId: order.razorpay_order_id,
      razorpayPaymentId: order.razorpay_payment_id
    }));
    
    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Create an order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { amount, paymentMethod, orderDetails } = req.body;
    
    // Create local order record
    const newOrder = {
      id: `ORD-${Date.now()}`,
      amount,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cod' ? 'Pending' : 'Initiated',
      status: 'Pending', // Setting explicitly based on customer requirement
      details: orderDetails, // contains frame, lenses, power, etc.
      razorpay_order_id: null as string | null
    };

    if (paymentMethod === 'prepaid') {
      // Create Razorpay order
      const options = {
        amount: amount * 100, // Amount in paise
        currency: "INR",
        receipt: newOrder.id,
      };
      
      const rzpOrder = await razorpay.orders.create(options);
      newOrder.razorpay_order_id = rzpOrder.id;
      
      // Insert to Supabase
      const { error } = await supabase.from('orders').insert([newOrder]);
      if (error) throw error;
      
      return res.json({ success: true, order: newOrder, razorpayOrder: rzpOrder });
    }

    // Cash on Delivery
    const { error } = await supabase.from('orders').insert([newOrder]);
    if (error) throw error;
    
    // format for frontend
    const formattedOrder = {
      ...newOrder,
      createdAt: new Date().toISOString(), // fake it for immediate response
      paymentMethod: newOrder.payment_method,
      paymentStatus: newOrder.payment_status,
      razorpayOrderId: newOrder.razorpay_order_id
    };
    
    res.json({ success: true, order: formattedOrder });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Verify Razorpay payment
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", "QEUwA7d1cV8AdBaloTJQClni")
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Update Supabase order status
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'Paid',
          razorpay_payment_id: razorpay_payment_id
        })
        .eq('razorpay_order_id', razorpay_order_id);
        
      if (error) throw error;
      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

// Update Order Status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const formattedOrder = {
      ...data[0],
      createdAt: data[0].created_at,
      paymentMethod: data[0].payment_method,
      paymentStatus: data[0].payment_status,
      razorpayOrderId: data[0].razorpay_order_id,
      razorpayPaymentId: data[0].razorpay_payment_id
    };
    
    res.json({ success: true, order: formattedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
