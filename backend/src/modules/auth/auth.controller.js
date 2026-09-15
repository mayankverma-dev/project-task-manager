import { authService } from './auth.service.js';
import { apiResponse } from '../../utils/apiResponse.js';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

export const authController = {
  async register(req, res) {
    const user = await authService.register(req.body);
    res.status(201).json(apiResponse({ user }));
  },

  async login(req, res) {
    const { email, password } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(email, password, ip, userAgent);

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json(apiResponse({
      user: result.user,
      accessToken: result.accessToken,
    }));
  },

  async refresh(req, res) {
    const oldToken = req.cookies[REFRESH_TOKEN_COOKIE];
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.refresh(oldToken, ip, userAgent);

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json(apiResponse({
      user: result.user,
      accessToken: result.accessToken,
    }));
  },

  async logout(req, res) {
    const token = req.cookies[REFRESH_TOKEN_COOKIE];
    await authService.logout(token);

    res.clearCookie(REFRESH_TOKEN_COOKIE);
    res.status(200).json(apiResponse({ success: true }));
  }
};
