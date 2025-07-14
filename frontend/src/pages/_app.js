import React from 'react';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import { AuthProvider } from '../contexts/AuthContext';
import '@/styles/globals.css';
   
function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>Loan Application System</title>
        <meta name="description" content="A comprehensive loan application system connecting borrowers with lenders" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Toaster position="top-right" />
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
