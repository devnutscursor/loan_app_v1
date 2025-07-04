import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Disclosure } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "What types of loans can I apply for?",
    answer: "Our platform supports a variety of loan types, including personal loans, home loans, and auto loans. Each loan program has different eligibility criteria, which you can review before applying.",
  },
  {
    question: "How long does the application process take?",
    answer: "The initial application can be completed in as little as 10 minutes. Once submitted, the time to approval varies depending on the lender and the complexity of your application, but our streamlined process is designed to be much faster than traditional methods.",
  },
  {
    question: "What documents do I need to apply?",
    answer: "Typically, you will need proof of identity (such as a driver's license or passport), proof of income (such as pay stubs or tax returns), and information about your assets and debts. The specific requirements may vary by lender and loan type.",
  },
  {
    question: "Is my personal information secure?",
    answer: "Yes, we take data security very seriously. We use bank-level encryption and follow industry best practices to protect your personal and financial information. For more details, please see our Privacy Policy.",
  },
  {
    question: "How can I check the status of my loan application?",
    answer: "You can track the status of your application in real-time through your dashboard. We also send email notifications at each major milestone of the process.",
  },
  {
    question: "Can I apply with a co-borrower?",
    answer: "Yes, our platform supports applications with co-borrowers. You can invite a co-borrower to complete their portion of the application directly through our system.",
  },
];

const FaqPage = () => {
  return (
    <MainLayout title="FAQ - Loan Application System">
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              Find answers to common questions about our loan application process.
            </p>
          </div>
          <div className="mt-12">
            <dl className="space-y-6">
              {faqs.map((faq, index) => (
                <Disclosure as="div" key={index} className="pt-6">
                  {({ open }) => (
                    <>
                      <dt className="text-lg">
                        <Disclosure.Button className="text-left w-full flex justify-between items-start text-gray-500">
                          <span className="font-medium text-gray-900">{faq.question}</span>
                          <span className="ml-6 h-7 flex items-center">
                            <ChevronDown
                              className={`${
                                open ? '-rotate-180' : 'rotate-0'
                              } h-6 w-6 transform transition-transform duration-200`}
                            />
                          </span>
                        </Disclosure.Button>
                      </dt>
                      <Disclosure.Panel as="dd" className="mt-2 pr-12">
                        <p className="text-base text-gray-600">{faq.answer}</p>
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FaqPage; 