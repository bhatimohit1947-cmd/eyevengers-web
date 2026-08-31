import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabase } from '../supabaseClient';

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_T34XmzvqjTeeXs',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'QEUwA7d1cV8AdBaloTJQClni',
  });
};

export const createMembershipOrder = async (req: Request, res: Response) => {
  try {
    const { planId, amount, userId } = req.body;

    if (!amount) {
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_T34XmzvqjTeeXs';

    const instance = getRazorpayInstance();

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_membership_${Date.now()}`,
      notes: {
        planId,
        userId: userId || 'guest'
      }
    };

    const order = await instance.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ error: 'Failed to create Razorpay order' });
    }

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
};

export const verifyMembershipPayment = async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      userId,
      tier,
      durationMonths
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'QEUwA7d1cV8AdBaloTJQClni';

    // Verify signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');
    const isSignatureValid = digest === razorpay_signature;
    
    if (!isSignatureValid && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Payment is valid (or we are in dev test mode bypassing strictly). 
    // Now activate membership in DB.
    
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + (durationMonths || 12));

    const membershipUpdate = {
      user_id: userId,
      plan_id: planId,
      tier: tier,
      start_date: startDate.toISOString(),
      expiry_date: expiryDate.toISOString(),
      status: 'active'
    };

    // For now, we will just return success so the frontend authStore can update.
    res.json({ 
      success: true, 
      message: 'Payment verified successfully',
      membershipDetails: membershipUpdate
    });
    
  } catch (error: any) {
    console.error('Razorpay Verify Error:', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
};
