import { eq } from 'drizzle-orm';
import { db } from '../../db/db.js';
import { users, refreshTokens } from '../../db/schema/index.js';

export const authRepository = {
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },

  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async getUserById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async createRefreshToken(tokenData) {
    const [token] = await db.insert(refreshTokens).values(tokenData).returning();
    return token;
  },

  async getRefreshTokenByHash(tokenHash) {
    const [token] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
    return token;
  },

  async revokeRefreshToken(tokenId) {
    await db.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, tokenId));
  },

  async replaceRefreshToken(oldTokenId, newTokenId) {
    await db.update(refreshTokens)
      .set({ revokedAt: new Date(), replacedById: newTokenId })
      .where(eq(refreshTokens.id, oldTokenId));
  },

  async revokeAllUserTokens(userId) {
    await db.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, userId));
  }
};
