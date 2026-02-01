/**
 * サイトマップ生成
 * - Next.jsのMetadataRouteを利用して /sitemap.xml を自動生成
 * - 本番URLは NEXT_PUBLIC_SITE_URL または VERCEL_URL を使用
 * - 主要ページのみを静的に列挙（必要に応じて追加）
 */
import type { MetadataRoute } from 'next';

const defaultBaseUrl = 'http://localhost:3000';

function getBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL;
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    return defaultBaseUrl;
}

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = getBaseUrl();
    const lastModified = new Date();

    const routes = ['/', '/setup', '/record', '/album', '/oracle', '/mypage'];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: route === '/' ? 1 : 0.7,
    }));
}
