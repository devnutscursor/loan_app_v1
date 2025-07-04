import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '../components/layout/MainLayout';

const Home = () => {
  const features = [
    {
      name: 'Fast Application Process',
      description: 'Complete your loan application in minutes with our streamlined process. No paperwork, no hassle.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      name: 'Secure Document Management',
      description: 'Upload, store, and share your documents securely. All data is encrypted and protected.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      name: 'Transparent Process',
      description: 'Track your loan application status in real-time. Get notifications at each milestone.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      name: 'Financial Tools',
      description: 'Access loan calculators, payment schedules, and financial metrics to make informed decisions.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Create an account',
      description: 'Sign up and complete your profile with basic information to get started.'
    },
    {
      number: '2',
      title: 'Submit your application',
      description: 'Fill out the loan application form and upload necessary documents.'
    },
    {
      number: '3',
      title: 'Get approved',
      description: 'Lenders review your application and provide loan offers for you to select.'
    }
  ];

  return (
    <MainLayout title="Loan Application System - Home">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="px-4 sm:px-6 lg:px-8 flex flex-col justify-center py-16 sm:py-24 lg:py-32">
            <div className="mx-auto max-w-md sm:max-w-lg lg:mx-0">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Simplify your</span>{' '}
                  <span className="block text-blue-600">
                    loan process
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg md:mt-5 md:text-xl">
                  A comprehensive platform connecting borrowers with lenders. Streamline your loan application, track its progress, and manage documents all in one place.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      href="/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:bg-blue-800"
                    >
                      Get started
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      href="/about"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      Learn more
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative h-64 sm:h-72 md:h-96 lg:h-full">
            <Image
              src="/images/hero-image.jpg"
              alt="Person managing finances"
              className="object-cover"
              fill
              priority
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Features</h2>
            <h3 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              A better way to manage loans
            </h3>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Our platform offers comprehensive tools for both borrowers and lenders to streamline the loan process.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
              {features.map((feature, index) => (
                <div key={index} className="relative p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="absolute -top-6 left-6 flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                    {feature.icon}
                  </div>
                  <h4 className="mt-6 text-lg font-medium text-gray-900">{feature.name}</h4>
                  <p className="mt-2 text-base text-gray-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">How it works</h2>
            <h3 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Simple steps to get your loan
            </h3>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 text-white text-2xl font-bold">
                    {step.number}
                  </div>
                  <h4 className="mt-6 text-lg font-medium text-gray-900">{step.title}</h4>
                  <p className="mt-2 text-base text-gray-500">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block text-blue-100 mt-2">Create your account today.</span>
            </h2>
            <div className="mt-10 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link href="/register" className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50">
                Sign up
              </Link>
              <Link href="/login" className="px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-700">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
