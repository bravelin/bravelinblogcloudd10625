import { Context } from 'hono';
import axios from 'axios';

interface WechatTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
    unionid?: string;
    errcode?: number;
    errmsg?: string;
}

interface WechatUserInfoResponse {
    openid: string;
    nickname: string;
    sex: number;
    province: string;
    city: string;
    country: string;
    headimgurl: string;
    privilege: string[];
    unionid: string;
    errcode?: number;
    errmsg?: string;
}

const WX_CONFIG = {
    appId: '',
    appSecret: ''
}

export async function handleWx(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
        // 1. 从请求体中获取授权码 code
        const { code } = await c.req.json<{ code: string }>();
        if (!code) {
            return c.json({ success: false, message: '缺少授权码 code' }, 400);
        }
        // 2. 调用微信接口，用 code 换取 access_token
        const tokenUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token';
        const tokenResponse = await axios.get<WechatTokenResponse>(tokenUrl, {
            params: {
                appid: WX_CONFIG.appId,
                secret: WX_CONFIG.appSecret,
                code: code,
                grant_type: 'authorization_code',
            },
        });
        const tokenData = tokenResponse.data;
        // 3. 检查微信是否返回错误
        if (tokenData.errcode) {
            console.error('微信换取 access_token 失败:', tokenData);
            return c.json({ success: false, message: `微信授权失败: ${tokenData.errmsg}` }, 400);
        }
        // 4. 成功获取用户凭证
        const { access_token, openid, unionid, refresh_token } = tokenData;

        return c.json({
            success: true,
            data: { access_token, openid, unionid, refresh_token }
        }, 200);
    } catch (error) {
        console.error('处理微信登录请求时出错:', error);
        return c.json({ success: false, message: '处理微信登录请求时出错：' + error }, 500);
    }
}