import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getDb, getUserByOpenId } from '../db';
import { users } from '../../drizzle/schema';

const WECHAT_API_URL = 'https://api.weixin.qq.com/sns/jscode2session';

export const wechatRouter = router({
  // 微信登录：code换取openid和session_key
  code2session: publicProcedure
    .input(z.object({
      code: z.string().min(1, 'Code is required'),
    }))
    .mutation(async ({ input }) => {
      try {
        const appId = process.env.VITE_APP_ID;
        const appSecret = process.env.WECHAT_APP_SECRET;

        if (!appId || !appSecret) {
          throw new Error('WeChat credentials not configured');
        }

        // 调用微信API换取openid和session_key
        const response = await axios.get(WECHAT_API_URL, {
          params: {
            appid: appId,
            secret: appSecret,
            js_code: input.code,
            grant_type: 'authorization_code',
          },
        });

        if (response.data.errcode) {
          throw new Error(`WeChat API error: ${response.data.errmsg}`);
        }

        const { openid, session_key } = response.data;

        // 在数据库中查找或创建用户
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        let user = await getUserByOpenId(openid);

        if (!user) {
          // 创建新用户
          const randomNickname = `诗词达人_${Math.floor(Math.random() * 10000)}`;
          await db
            .insert(users)
            .values({
              openId: openid,
              name: randomNickname,
              email: `${openid}@wechat.local`,
              loginMethod: 'wechat',
              role: 'user',
            });
          // 重新查询新创建的用户
          user = await getUserByOpenId(openid);
        }

        if (!user) {
          throw new Error('Failed to create or find user');
        }

        // 生成JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          throw new Error('JWT_SECRET not configured');
        }

        const token = jwt.sign(
          {
            userId: user.id,
            openId: openid,
            name: user.name || 'Unknown',
          },
          jwtSecret,
          { expiresIn: '7d' }
        );

        return {
          success: true,
          openid,
          sessionKey: session_key,
          token,
          user: {
            id: user.id,
            name: user.name || 'Unknown',
            openId: openid,
          },
        };
      } catch (error) {
        console.error('WeChat code2session error:', error);
        throw new Error(
          error instanceof Error ? error.message : 'WeChat login failed'
        );
      }
    }),

  // 获取微信用户信息
  getUserInfo: publicProcedure
    .input(z.object({
      encryptedData: z.string(),
      iv: z.string(),
      openid: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        return {
          success: true,
          openid: input.openid,
        };
      } catch (error) {
        console.error('Get user info error:', error);
        throw new Error(
          error instanceof Error ? error.message : 'Failed to get user info'
        );
      }
    }),
});
