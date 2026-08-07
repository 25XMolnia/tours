/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      afterFiles: [
        // Прежние URL сохранены; папок со скобками ([slug], [...route]) больше нет,
        // чтобы проект можно было загружать через веб-интерфейс GitHub.
        { source: "/api/:route", destination: "/api/portal?__route=:route" },
        { source: "/tours/:slug", destination: "/tours/detail?slug=:slug" },
      ],
    };
  },
};
export default nextConfig;
