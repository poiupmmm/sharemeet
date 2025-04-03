// 服务器端配置
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export default function CreateActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 