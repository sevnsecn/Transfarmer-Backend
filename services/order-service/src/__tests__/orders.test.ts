process.env.JWT_SECRET = 'test-secret';

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('../services/orderService', () => ({
  getAllOrders: jest.fn(),
  getOrderById: jest.fn(),
  createOrder: jest.fn(),
  updateOrder: jest.fn(),
  deleteOrder: jest.fn(),
  checkoutOrder: jest.fn(),
  getOrdersByUser: jest.fn(),
  completeOrder: jest.fn(),
  autoCompleteOrders: jest.fn(),
}));

import orderRoutes from '../routes/orders';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  checkoutOrder,
  getOrdersByUser,
  completeOrder,
} from '../services/orderService';

const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function makeToken(isAdmin = false, userId = 'user1') {
  return jwt.sign({ id: userId, is_admin: isAdmin }, JWT_SECRET);
}

const mockOrder = {
  _id: 'order1',
  user_id: 'user1',
  user_name: 'Test User',
  status: 'pending',
  total_price: 50000,
  items: [],
};

// ── GET ALL ────────────────────────────────────────────────────────────────────

describe('GET /api/orders', () => {
  it('should return all orders', async () => {
    (getAllOrders as jest.Mock).mockResolvedValue([mockOrder]);

    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('should return empty array when no orders exist', async () => {
    (getAllOrders as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('should return 500 on db error', async () => {
    (getAllOrders as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── GET BY ID ──────────────────────────────────────────────────────────────────

describe('GET /api/orders/:id', () => {
  it('should return order if found', async () => {
    (getOrderById as jest.Mock).mockResolvedValue(mockOrder);

    const res = await request(app).get('/api/orders/order1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('pending');
  });

  it('should return 404 if order not found', async () => {
    (getOrderById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/orders/badid');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ── POST ───────────────────────────────────────────────────────────────────────

describe('POST /api/orders', () => {
  it('should return 400 if user_id is missing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ total_price: 50000 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 201 on valid create', async () => {
    (createOrder as jest.Mock).mockResolvedValue(mockOrder);

    const res = await request(app)
      .post('/api/orders')
      .send({ user_id: 'user1', total_price: 50000 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

// ── MY ORDERS ──────────────────────────────────────────────────────────────────

describe('GET /api/orders/my-orders', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/orders/my-orders');
    expect(res.status).toBe(401);
  });

  it('should return orders for authenticated user', async () => {
    (getOrdersByUser as jest.Mock).mockResolvedValue([mockOrder]);

    const res = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('should return empty array if user has no orders', async () => {
    (getOrdersByUser as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

// ── CHECKOUT ───────────────────────────────────────────────────────────────────

describe('POST /api/orders/checkout', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/orders/checkout');
    expect(res.status).toBe(401);
  });

  it('should return 500 if cart is empty', async () => {
    (checkoutOrder as jest.Mock).mockRejectedValue(new Error('Cart is empty'));

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Cart is empty');
  });

  it('should return 500 if address not set', async () => {
    (checkoutOrder as jest.Mock).mockRejectedValue(new Error('Address not set'));

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Address not set');
  });

  it('should return 200 on successful checkout', async () => {
    (checkoutOrder as jest.Mock).mockResolvedValue({ ...mockOrder, status: 'pending' });

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ── PUT ────────────────────────────────────────────────────────────────────────

describe('PUT /api/orders/:id', () => {
  it('should return 404 if order not found', async () => {
    (getOrderById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/orders/badid')
      .send({ status: 'confirmed' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if trying to revert status', async () => {
    (getOrderById as jest.Mock).mockResolvedValue({ ...mockOrder, status: 'confirmed' });

    const res = await request(app)
      .put('/api/orders/order1')
      .send({ status: 'pending' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 on valid status update', async () => {
    (getOrderById as jest.Mock).mockResolvedValue(mockOrder);
    (updateOrder as jest.Mock).mockResolvedValue({ ...mockOrder, status: 'confirmed' });

    const res = await request(app)
      .put('/api/orders/order1')
      .send({ status: 'confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('confirmed');
  });
});

// ── DELETE ─────────────────────────────────────────────────────────────────────

describe('DELETE /api/orders/:id', () => {
  it('should return 500 if order not found', async () => {
    (deleteOrder as jest.Mock).mockRejectedValue(new Error('Order not found'));

    const res = await request(app).delete('/api/orders/badid');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 on valid delete', async () => {
    (deleteOrder as jest.Mock).mockResolvedValue(mockOrder);

    const res = await request(app).delete('/api/orders/order1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ── COMPLETE ───────────────────────────────────────────────────────────────────

describe('POST /api/orders/:id/complete', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/orders/order1/complete');
    expect(res.status).toBe(401);
  });

  it('should return 400 if order is not in delivered status', async () => {
    (completeOrder as jest.Mock).mockRejectedValue(
      new Error('Order can only be completed after it has been delivered')
    );

    const res = await request(app)
      .post('/api/orders/order1/complete')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if user does not own the order', async () => {
    (completeOrder as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    const res = await request(app)
      .post('/api/orders/order1/complete')
      .set('Authorization', `Bearer ${makeToken(false, 'otheruser')}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 on valid complete', async () => {
    (completeOrder as jest.Mock).mockResolvedValue({ ...mockOrder, status: 'completed' });

    const res = await request(app)
      .post('/api/orders/order1/complete')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});