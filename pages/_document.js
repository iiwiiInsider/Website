import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="BurnProjects Marketplace - Buy items on the live market today. Discover listings from trusted sellers and shop with confidence." />
        <meta name="keywords" content="marketplace, buy, sell, items, listings, BurnProjects" />
        <meta name="author" content="BurnProjects" />
        <meta property="og:title" content="BurnProjects Marketplace" />
        <meta property="og:description" content="Buy items on the live market today" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/Website/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
