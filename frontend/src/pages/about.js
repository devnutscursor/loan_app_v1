import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import Link from 'next/link';
import { Users, Target, Zap, Heart } from 'lucide-react';

const AboutPage = () => {
  const teamMembers = [
    {
      name: 'John Doe',
      role: 'CEO & Founder',
      imageUrl: '/images/team/john-doe.jpg',
      bio: 'John has over 20 years of experience in the financial industry and is passionate about leveraging technology to simplify the lending process.',
    },
    {
      name: 'Jane Smith',
      role: 'Chief Technology Officer',
      imageUrl: '/images/team/jane-smith.jpg',
      bio: 'Jane is a technology visionary with a track record of building scalable, secure, and user-friendly platforms.',
    },
    {
      name: 'Peter Jones',
      role: 'Head of Operations',
      imageUrl: '/images/team/peter-jones.jpg',
      bio: 'Peter ensures that our operations run smoothly and that our customers receive the best possible service.',
    },
      {
      name: 'Sarah Williams',
      role: 'Head of Customer Success',
      imageUrl: '/images/team/sarah-williams.jpg',
      bio: 'Sarah and her team are dedicated to helping our customers succeed and achieve their financial goals.',
    }
  ];

  return (
    <MainLayout title="About Us - Loan Application System">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Our Mission
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600">
              To simplify the loan process through technology, transparency, and exceptional customer service, making it easier for borrowers and lenders to connect and thrive.
            </p>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Our Story
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Founded in 2023, our platform was born from a desire to address the complexities and inefficiencies of the traditional loan industry. We saw an opportunity to create a more streamlined, transparent, and user-friendly experience for everyone involved.
              </p>
              <p className="mt-4 text-lg text-gray-600">
                Our team of financial experts and technology enthusiasts came together to build a platform that empowers borrowers to find the right loan for their needs and enables lenders to make smarter, data-driven decisions.
              </p>
            </div>
            <div className="mt-12 lg:mt-0">
              <img
                className="rounded-lg shadow-xl"
                src="/images/team/our-story.jpg"
                alt="Our team collaborating"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Our Values Section */}
      <div className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Our Values
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              Our values guide everything we do, from product development to customer support.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-600 to-blue-800 text-white mx-auto">
                <Users />
              </div>
              <h3 className="mt-5 text-lg font-medium text-gray-900">Customer-Centric</h3>
              <p className="mt-2 text-base text-gray-600">
                Our customers are at the heart of everything we build.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-600 to-blue-800 text-white mx-auto">
                <Zap />
              </div>
              <h3 className="mt-5 text-lg font-medium text-gray-900">Innovation</h3>
              <p className="mt-2 text-base text-gray-600">
                We are constantly innovating to improve the loan experience.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-600 to-blue-800 text-white mx-auto">
                <Heart />
              </div>
              <h3 className="mt-5 text-lg font-medium text-gray-900">Integrity</h3>
              <p className="mt-2 text-base text-gray-600">
                We operate with transparency and hold ourselves to the highest ethical standards.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-600 to-blue-800 text-white mx-auto">
                <Target />
              </div>
              <h3 className="mt-5 text-lg font-medium text-gray-900">Results-Driven</h3>
              <p className="mt-2 text-base text-gray-600">
                We are focused on delivering results for our customers and partners.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meet The Team Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Meet The Team
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              Our team of dedicated professionals is here to help you every step of the way.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member) => (
              <div key={member.name} className="text-center">
                {/* <img
                  className="mx-auto h-32 w-32 rounded-full object-cover"
                  src={member.imageUrl}
                  alt={member.name}
                /> */}
                <h3 className="mt-6 text-lg font-medium text-gray-900">{member.name}</h3>
                <p className="text-blue-600">{member.role}</p>
                <p className="mt-2 text-base text-gray-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to simplify your loan process?
            </h2>
            <p className="mt-4 text-lg text-blue-200">
              Create an account today and experience the future of lending.
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                href="/register"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AboutPage; 