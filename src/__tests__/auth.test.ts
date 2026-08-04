import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import { signToken, verifyToken } from '@/lib/auth';
import { POST as signupPOST } from '@/app/api/auth/signup/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import bcrypt from 'bcryptjs';

describe('Auth JWT Utility (src/lib/auth.ts)', () => {
  it('signs and verifies a valid JWT payload correctly', async () => {
    const payload = { userId: 'uuid-101', email: 'test@shawty.link' };
    const token = await signToken(payload);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('uuid-101');
    expect(verified?.email).toBe('test@shawty.link');
  });

  it('returns null for an invalid or tampered JWT token', async () => {
    const token = await signToken({ userId: 'uuid-101', email: 'test@shawty.link' });
    const tampered = token.replace(/\.[^.]+$/, '.invalid_signature_string');

    const verified = await verifyToken(tampered);
    expect(verified).toBeNull();
  });

  it('returns null for an expired JWT token', async () => {
    const expiredPayload = {
      userId: 'uuid-expired',
      email: 'expired@shawty.link',
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
    };
    const token = await signToken(expiredPayload);

    const verified = await verifyToken(token);
    expect(verified).toBeNull();
  });
});

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid email addresses with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email', password: 'password123' }),
    });

    const res = await signupPOST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('valid email');
  });

  it('rejects passwords shorter than 6 characters with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@shawty.link', password: '123' }),
    });

    const res = await signupPOST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('6 characters');
  });

  it('returns 409 if user account already exists', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'existing-id' } as any);

    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'taken@shawty.link', password: 'password123' }),
    });

    const res = await signupPOST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain('already exists');
  });

  it('creates account and returns 201 when valid credentials provided', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({
      id: 'new-user-id',
      email: 'new@shawty.link',
      plan: 'free',
      createdAt: new Date('2026-08-04T00:00:00Z'),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@shawty.link', password: 'password123' }),
    });

    const res = await signupPOST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.user.id).toBe('new-user-id');
    expect(json.user.email).toBe('new@shawty.link');
    expect(res.cookies.get('shawty_token')).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when email is not registered', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@shawty.link', password: 'password123' }),
    });

    const res = await loginPOST(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 and sets cookie when password matches', async () => {
    const hash = await bcrypt.hash('secretpass', 10);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'uuid-1',
      email: 'member@shawty.link',
      passwordHash: hash,
      plan: 'pro',
      createdAt: new Date('2026-08-01T00:00:00Z'),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'member@shawty.link', password: 'secretpass' }),
    });

    const res = await loginPOST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.email).toBe('member@shawty.link');
    expect(res.cookies.get('shawty_token')).toBeDefined();
  });
});
