import './globals.css';

export const metadata = {
  title: 'ShareMeet - 一起分享，一起相遇',
  description: '创建和发现身边的活动，认识志同道合的朋友。',
  keywords: '活动,社交,聚会,分享,交友',
  authors: [{ name: 'ShareMeet Team' }],
  creator: 'ShareMeet',
  publisher: 'ShareMeet',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className="flex flex-col h-screen">
        <main>{children}</main>
      </body>
    </html>
  );
}
