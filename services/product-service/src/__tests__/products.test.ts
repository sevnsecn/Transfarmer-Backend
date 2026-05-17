process.env.JWT_SECRET = 'test-secret';

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('../services/productService', () => ({
  getAllProducts: jest.fn(),
  getProductById: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
}));

import productRoutes from '../routes/products';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../services/productService';

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function makeToken(isAdmin: boolean) {
  return jwt.sign({ id: 'user1', is_admin: isAdmin }, JWT_SECRET);
}

const mockProduct = {
  _id: '1',
  product_name: 'Tomato',
  price_per_kg: 5000,
  stock_kg: 100,
  farm_id: { _id: 'farm1', farm_name: 'Test Farm' },
};

// ── GET ALL ────────────────────────────────────────────────────────────────────

describe('GET /api/products', () => {
  it('should return all products', async () => {
    (getAllProducts as jest.Mock).mockResolvedValue([mockProduct]);

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
  });

  it('should support search filter', async () => {
    (getAllProducts as jest.Mock).mockResolvedValue([mockProduct]);

    const res = await request(app).get('/api/products?search=Tomato');
    expect(res.status).toBe(200);
    expect(res.body.data[0].product_name).toBe('Tomato');
  });

  it('should support farm_id filter', async () => {
    (getAllProducts as jest.Mock).mockResolvedValue([mockProduct]);

    const res = await request(app).get('/api/products?farm_id=farm1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return empty array when no products match', async () => {
    (getAllProducts as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/api/products?search=nonexistent');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('should return 500 on db error', async () => {
    (getAllProducts as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── GET BY ID ──────────────────────────────────────────────────────────────────

describe('GET /api/products/:id', () => {
  it('should return product if found', async () => {
    (getProductById as jest.Mock).mockResolvedValue(mockProduct);

    const res = await request(app).get('/api/products/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product_name).toBe('Tomato');
  });

  it('should return 404 if product not found', async () => {
    (getProductById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/products/badid');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ── POST ───────────────────────────────────────────────────────────────────────

describe('POST /api/products', () => {
  it('should return 401 without token', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ product_name: 'Carrot', price_per_kg: 3000, stock_kg: 50, farm_id: 'farm1' });
    expect(res.status).toBe(401);
  });

  it('should return 403 if user is not admin', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${makeToken(false)}`)
      .send({ product_name: 'Carrot', price_per_kg: 3000, stock_kg: 50, farm_id: 'farm1' });
    expect(res.status).toBe(403);
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ product_name: 'Carrot' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if price_per_kg is zero or negative', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ product_name: 'Carrot', price_per_kg: 0, stock_kg: 50, farm_id: 'farm1' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if stock_kg is negative', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ product_name: 'Carrot', price_per_kg: 3000, stock_kg: -1, farm_id: 'farm1' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 if farm not found', async () => {
    (createProduct as jest.Mock).mockRejectedValue(new Error('Farm not found'));

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ product_name: 'Carrot', price_per_kg: 3000, stock_kg: 50, farm_id: 'badfarm' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 201 on valid create by admin', async () => {
    (createProduct as jest.Mock).mockResolvedValue(mockProduct);

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ product_name: 'Tomato', price_per_kg: 5000, stock_kg: 100, farm_id: 'farm1' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product_name).toBe('Tomato');
  });
});

// ── PUT ────────────────────────────────────────────────────────────────────────

describe('PUT /api/products/:id', () => {
  it('should return 401 without token', async () => {
    const res = await request(app)
      .put('/api/products/1')
      .send({ product_name: 'Updated Tomato' });
    expect(res.status).toBe(401);
  });

  it('should return 403 if user is not admin', async () => {
    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${makeToken(false)}`)
      .send({ product_name: 'Updated Tomato' });
    expect(res.status).toBe(403);
  });

  it('should return 400 if price_per_kg is zero or negative', async () => {
    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ price_per_kg: -100 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if stock_kg is negative', async () => {
    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ stock_kg: -5 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 if product not found', async () => {
    (updateProduct as jest.Mock).mockRejectedValue(new Error('Product not found'));

    const res = await request(app)
      .put('/api/products/badid')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ product_name: 'Updated' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 on valid update by admin', async () => {
    (updateProduct as jest.Mock).mockResolvedValue({ ...mockProduct, product_name: 'Updated Tomato' });

    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ product_name: 'Updated Tomato' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product_name).toBe('Updated Tomato');
  });
});

// ── DELETE ─────────────────────────────────────────────────────────────────────

describe('DELETE /api/products/:id', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).delete('/api/products/1');
    expect(res.status).toBe(401);
  });

  it('should return 403 if user is not admin', async () => {
    const res = await request(app)
      .delete('/api/products/1')
      .set('Authorization', `Bearer ${makeToken(false)}`);
    expect(res.status).toBe(403);
  });

  it('should return 404 if product not found', async () => {
    (deleteProduct as jest.Mock).mockRejectedValue(new Error('Product not found'));

    const res = await request(app)
      .delete('/api/products/badid')
      .set('Authorization', `Bearer ${makeToken(true)}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 on valid delete by admin', async () => {
    (deleteProduct as jest.Mock).mockResolvedValue({ _id: '1' });

    const res = await request(app)
      .delete('/api/products/1')
      .set('Authorization', `Bearer ${makeToken(true)}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});