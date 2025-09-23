import React, { useState } from 'react';

const CompanyRegistrationForm = ({ formData, errors, handleChange, currentRole }) => {
  const [step, setStep] = useState(1);

  const next = () => setStep((s) => Math.min(4, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const Stepper = () => (
    <div className="flex items-center gap-2 mb-4 text-sm">
      {['Company Info', 'Address', 'Primary User', 'Other Info'].map((label, idx) => {
        const n = idx + 1;
        const active = step === n;
        return (
          <div key={label} className={`flex items-center ${n < 4 ? 'flex-1' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>{n}</div>
            <div className={`ml-2 mr-4 ${active ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>{label}</div>
            {n < 4 && <div className="flex-1 h-px bg-gray-200" />}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 transition-all duration-300 ease-in-out">
      <Stepper />

      {step === 1 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
              <div className="mt-1">
                <input id="companyName" name="companyName" type="text" required={currentRole === 'company'} value={formData.companyName} onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.companyName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Acme Lending" />
              </div>
              {errors.companyName && (<p className="mt-1 text-sm text-red-600">{errors.companyName}</p>)}
            </div>

            <div>
              <label htmlFor="maxLenders" className="block text-sm font-medium text-gray-700">Max Lenders</label>
              <div className="mt-1">
                <input id="maxLenders" name="maxLenders" type="number" min="1" max="100" required={currentRole === 'company'} value={formData.maxLenders} onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.maxLenders ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="10" />
              </div>
              {errors.maxLenders && (<p className="mt-1 text-sm text-red-600">{errors.maxLenders}</p>)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">Company Email</label>
              <div className="mt-1">
                <input id="companyEmail" name="companyEmail" type="email" required={currentRole === 'company'} value={formData.companyEmail} onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.companyEmail ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="ops@acme.io" />
              </div>
              {errors.companyEmail && (<p className="mt-1 text-sm text-red-600">{errors.companyEmail}</p>)}
            </div>

            <div>
              <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700">Company Phone</label>
              <div className="mt-1">
                <input id="companyPhone" name="companyPhone" type="tel" value={formData.companyPhone} onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.companyPhone ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="+1-555-000-1111" />
              </div>
              {errors.companyPhone && (<p className="mt-1 text-sm text-red-600">{errors.companyPhone}</p>)}
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website URL</label>
              <div className="mt-1">
                <input id="website" name="website" type="url" value={formData.website} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="https://acme.io" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="nmls" className="block text-sm font-medium text-gray-700">NMLS #</label>
              <div className="mt-1">
                <input id="nmls" name="nmls" type="text" value={formData.nmls} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="123456" />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="button" onClick={next} className="px-4 py-2 bg-blue-600 text-white rounded-md">Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">Street Address</label>
              <div className="mt-1">
                <input id="addressLine1" name="addressLine1" type="text" value={formData.addressLine1} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="123 Main St" />
              </div>
            </div>
            <div>
              <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">Apt/Unit</label>
              <div className="mt-1">
                <input id="addressLine2" name="addressLine2" type="text" value={formData.addressLine2} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Apt 5B" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
              <div className="mt-1">
                <input id="city" name="city" type="text" value={formData.city} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="San Francisco" />
              </div>
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
              <div className="mt-1">
                <input id="state" name="state" type="text" value={formData.state} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="CA" />
              </div>
            </div>
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">ZIP Code</label>
              <div className="mt-1">
                <input id="zipCode" name="zipCode" type="text" value={formData.zipCode} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="94105" />
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button type="button" onClick={prev} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md">Back</button>
            <button type="button" onClick={next} className="px-4 py-2 bg-blue-600 text-white rounded-md">Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Contact Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="primaryContactFirstName" className="block text-sm font-medium text-gray-700">First Name</label>
              <div className="mt-1">
                <input id="primaryContactFirstName" name="primaryContactFirstName" type="text" required={currentRole === 'company'} value={formData.primaryContactFirstName} onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.primaryContactFirstName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Alice" />
              </div>
              {errors.primaryContactFirstName && (<p className="mt-1 text-sm text-red-600">{errors.primaryContactFirstName}</p>)}
            </div>

            <div>
              <label htmlFor="primaryContactLastName" className="block text-sm font-medium text-gray-700">Last Name</label>
              <div className="mt-1">
                <input id="primaryContactLastName" name="primaryContactLastName" type="text" required={currentRole === 'company'} value={formData.primaryContactLastName} onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.primaryContactLastName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Baker" />
              </div>
              {errors.primaryContactLastName && (<p className="mt-1 text-sm text-red-600">{errors.primaryContactLastName}</p>)}
            </div>
          </div>

          <div className="grid grid-cols-1 md-grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="primaryContactEmail" className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <input id="primaryContactEmail" name="primaryContactEmail" type="email" required={currentRole === 'company'} value={formData.primaryContactEmail} onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.primaryContactEmail ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="alice@acme.io" />
              </div>
              {errors.primaryContactEmail && (<p className="mt-1 text-sm text-red-600">{errors.primaryContactEmail}</p>)}
            </div>

            <div>
              <label htmlFor="primaryContactPhone" className="block text-sm font-medium text-gray-700">Phone</label>
              <div className="mt-1">
                <input id="primaryContactPhone" name="primaryContactPhone" type="tel" value={formData.primaryContactPhone} onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.primaryContactPhone ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="+1-555-111-2222" />
              </div>
              {errors.primaryContactPhone && (<p className="mt-1 text-sm text-red-600">{errors.primaryContactPhone}</p>)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="primaryContactPassword" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input id="primaryContactPassword" name="primaryContactPassword" type="password" required={currentRole === 'company'} value={formData.primaryContactPassword} onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.primaryContactPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="••••••••" />
              </div>
              {errors.primaryContactPassword && (<p className="mt-1 text-sm text-red-600">{errors.primaryContactPassword}</p>)}
            </div>

            <div>
              <label htmlFor="primaryContactConfirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="mt-1">
                <input id="primaryContactConfirmPassword" name="primaryContactConfirmPassword" type="password" required={currentRole === 'company'} value={formData.primaryContactConfirmPassword} onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.primaryContactConfirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="••••••••" />
              </div>
              {errors.primaryContactConfirmPassword && (<p className="mt-1 text-sm text-red-600">{errors.primaryContactConfirmPassword}</p>)}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button type="button" onClick={prev} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md">Back</button>
            <button type="button" onClick={next} className="px-4 py-2 bg-blue-600 text-white rounded-md">Next</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Other Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="legalEntityType" className="block text-sm font-medium text-gray-700">Legal Entity Type</label>
              <div className="mt-1">
                <input id="legalEntityType" name="legalEntityType" type="text" value={formData.legalEntityType} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="LLC, Inc., Sole Prop" />
              </div>
            </div>

            <div>
              <label htmlFor="legalEntityOrganizedUnder" className="block text-sm font-medium text-gray-700">Organized Under The Laws Of</label>
              <div className="mt-1">
                <input id="legalEntityOrganizedUnder" name="legalEntityOrganizedUnder" type="text" value={formData.legalEntityOrganizedUnder} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Delaware, California..." />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="posLoanAppAssignee" className="block text-sm font-medium text-gray-700">POS Loan App Assignee</label>
              <div className="mt-1">
                <input id="posLoanAppAssignee" name="posLoanAppAssignee" type="text" value={formData.posLoanAppAssignee} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Name or email (optional)" />
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button type="button" onClick={prev} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md">Back</button>
            <span />
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyRegistrationForm;
