import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authRepository } from './auth.repository.js';
import { ApiError } from '../../utils/ApiError.js';

const generateTokens = async (user, ip, userAgent) => {
  // Access Token
  const accessToken = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  // Refresh Token
  const rawRefreshToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  // 30 days expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const refreshTokenDoc = await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash,
    userAgent,
    ip,
    expiresAt,
  });

  return { accessToken, rawRefreshToken, refreshTokenDoc };
};

export const authService = {
  async register(data) {
    const existingUser = await authRepository.getUserByEmail(data.email);
    if (existingUser) {
      throw new ApiError(409, 'CONFLICT', 'Email is already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await authRepository.createUser({
      name: data.name,
      email: data.email,
      passwordHash,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async login(email, password, ip, userAgent) {
    const user = await authRepository.getUserByEmail(email);
    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    const tokens = await generateTokens(user, ip, userAgent);

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.rawRefreshToken,
    };
  },

  async refresh(rawOldToken, ip, userAgent) {
    if (!rawOldToken) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Refresh token is missing');
    }

    const oldTokenHash = crypto.createHash('sha256').update(rawOldToken).digest('hex');
    const oldToken = await authRepository.getRefreshTokenByHash(oldTokenHash);

    if (!oldToken) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid refresh token');
    }

    // Reuse detection 
    if (oldToken.revokedAt !== null) {
      await authRepository.revokeAllUserTokens(oldToken.userId);
      throw new ApiError(401, 'UNAUTHORIZED', 'Token reuse detected. Please log in again.');
    }

    if (new Date() > oldToken.expiresAt) {
      await authRepository.revokeRefreshToken(oldToken.id);
      throw new ApiError(401, 'UNAUTHORIZED', 'Refresh token expired');
    }

    const user = await authRepository.getUserById(oldToken.userId);
    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User no longer exists');
    }

    const tokens = await generateTokens(user, ip, userAgent);
    await authRepository.replaceRefreshToken(oldToken.id, tokens.refreshTokenDoc.id);

    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.rawRefreshToken,
    };
  },

  async logout(rawToken) {
    if (!rawToken) return;

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const token = await authRepository.getRefreshTokenByHash(tokenHash);

    if (token && !token.revokedAt) {
      await authRepository.revokeRefreshToken(token.id);
    }
  }
};
