import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Phone, Mail, MapPin } from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('Sending...');
    // In a real application, you would handle form submission here.
    // For this demo, we'll just simulate a success message.
    setTimeout(() => {
      setStatus('Message sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 2000);
  };

  return (
    <MainLayout title="Contact Us - Loan Application System">
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Contact Us
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              We're here to help. If you have any questions, please don't hesitate to reach out.
            </p>
          </div>
          <div className="mt-16 lg:grid lg:grid-cols-2 lg:gap-16">
            <div className="lg:pr-8">
              <h2 className="text-2xl font-extrabold text-gray-900">Get in touch</h2>
              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div>
                  <label htmlFor="name" className="sr-only">Name</label>
                  <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md" placeholder="Your Name" />
                </div>
                <div>
                  <label htmlFor="email" className="sr-only">Email</label>
                  <input type="email" name="email" id="email" required value={formData.email} onChange={handleChange} className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md" placeholder="Your Email" />
                </div>
                <div>
                  <label htmlFor="subject" className="sr-only">Subject</label>
                  <input type="text" name="subject" id="subject" required value={formData.subject} onChange={handleChange} className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md" placeholder="Subject" />
                </div>
                <div>
                  <label htmlFor="message" className="sr-only">Message</label>
                  <textarea id="message" name="message" rows="4" required value={formData.message} onChange={handleChange} className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border border-gray-300 rounded-md" placeholder="Your Message"></textarea>
                </div>
                <div>
                  <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Send Message
                  </button>
                </div>
                {status && <p className="text-center text-gray-600">{status}</p>}
              </form>
            </div>
            <div className="mt-12 lg:mt-0">
              <h2 className="text-2xl font-extrabold text-gray-900">Contact Information</h2>
              <div className="mt-6 space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg text-gray-900">123 Loan Street, Suite 100</p>
                    <p className="text-base text-gray-600">Finance City, USA 12345</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg text-gray-900">(123) 456-7890</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg text-gray-900">support@loanapp.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ContactPage; 