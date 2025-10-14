import React, { useState } from 'react';
import { User, Mail, FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SupportTicket = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [ticketData, setTicketData] = useState({
    fullName: '',
    email: '',
    accountId: '',
    issueType: '',
    description: '',
    attachment: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
 const [emailSent, setEmailSent] = useState(false);

  const issueTypes = [
    'Technical Issue',
    'Order / Delivery Issue',
    'Billing / Payment Problem',
    'Product Query',
    'Other'
  ];

  const generateTicketNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `T${timestamp}${random}`;
  };

  const handleInputChange = (field, value) => {
    setTicketData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB');
        return;
      }
      setTicketData(prev => ({
        ...prev,
        attachment: file
      }));
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return ticketData.fullName.trim() !== '';
      case 2:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(ticketData.email);
      case 3:
        return true; // Account ID is optional
      case 4:
        return ticketData.issueType !== '';
      case 5:
        return ticketData.description.trim().length >= 10;
      case 6:
        return true; // Attachment is optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Please fill in the required information');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const submitTicket = async () => {
    if (!validateStep(5)) {
      toast.error('Please provide a detailed description');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(ticketData).forEach(key => {
        if (ticketData[key] !== null && ticketData[key] !== '') {
          formData.append(key, ticketData[key]);
        }
      });

      const response = await fetch('/api/tickets', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setTicketNumber(result.data.ticketNumber);
        setIsCompleted(true);
        const emailed = result?.data?.emailSent;
      setEmailSent(!!emailed);
        if (emailed) {
          toast.success('Support ticket created successfully! Ticket ID has been emailed to you.');
        } else {
          toast.success('Support ticket created successfully!');
          toast('We could not send the ticket ID via email right now. Please note it down: #' + result.data.ticketNumber, { icon: '⚠️' });
        }
      } else {
        toast.error(result.message || 'Failed to create support ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setTicketData({
      fullName: '',
      email: '',
      accountId: '',
      issueType: '',
      description: '',
      attachment: null
    });
    setIsCompleted(false);
    setTicketNumber('');
  };

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Created Successfully!</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-lg font-semibold text-green-800">Ticket Number: #{ticketNumber}</p>
            <p className="text-green-700 mt-2">
              Thank you! Your ticket #{ticketNumber} has been created. Our support team will review it and get back to you shortly.
            </p>
            <p className="text-green-700 mt-1">
              We have emailed your ticket number to you for reference.
            </p>
            {emailSent ? (
              <p className="text-green-700 mt-1">We have emailed your ticket number to you for reference.</p>
           ) : (
                <p className="text-amber-700 mt-1">We could not email your ticket number right now. Please keep this ID safe: #{ticketNumber}</p>
            )}
          </div>
          <div className="space-y-2 text-left bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900">Ticket Summary:</h3>
            <p><span className="font-medium">Name:</span> {ticketData.fullName}</p>
            <p><span className="font-medium">Email:</span> {ticketData.email}</p>
            {ticketData.accountId && <p><span className="font-medium">Account ID:</span> {ticketData.accountId}</p>}
            <p><span className="font-medium">Issue Type:</span> {ticketData.issueType}</p>
            <p><span className="font-medium">Description:</span> {ticketData.description.substring(0, 100)}...</p>
            <div className="mt-2 text-sm text-gray-700">
              Track your ticket anytime using the Track Ticket page with your email and ticket number.
            </div>
          </div>
          <button
            onClick={resetForm}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Support Ticket</h2>
        <p className="text-gray-600">We're here to help! Please provide the following information to create your support ticket.</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {currentStep === 1 && (
          <div>
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Step 1: Your Full Name</h3>
            </div>
            <input
              type="text"
              placeholder="Enter your full name"
              value={ticketData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <div className="flex items-center mb-4">
              <Mail className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Step 2: Email Address</h3>
            </div>
            <input
              type="email"
              placeholder="Enter your email address"
              value={ticketData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">We'll use this email to follow up on your ticket.</p>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Step 3: Account / Order ID (Optional)</h3>
            </div>
            <input
              type="text"
              placeholder="Enter your account ID, order number, or invoice number"
              value={ticketData.accountId}
              onChange={(e) => handleInputChange('accountId', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">This helps us locate your account faster (optional).</p>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <div className="flex items-center mb-4">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Step 4: Issue Type</h3>
            </div>
            <div className="space-y-2">
              {issueTypes.map((type) => (
                <label key={type} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="issueType"
                    value={type}
                    checked={ticketData.issueType === type}
                    onChange={(e) => handleInputChange('issueType', e.target.value)}
                    className="mr-3"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div>
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Step 5: Describe Your Problem</h3>
            </div>
            <textarea
              placeholder="Please describe your problem in detail. Include any error messages, steps you took, and what you expected to happen."
              value={ticketData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">
              {ticketData.description.length}/1000 characters (minimum 10 characters required)
            </p>
          </div>
        )}

        {currentStep === 6 && (
          <div>
            <div className="flex items-center mb-4">
              <Upload className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Step 6: Attach Files (Optional)</h3>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">Upload screenshots, documents, or other files</p>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
              >
                Choose File
              </label>
              <p className="text-sm text-gray-500 mt-2">Max file size: 5MB</p>
              {ticketData.attachment && (
                <p className="text-green-600 mt-2">✓ {ticketData.attachment.name}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`px-6 py-2 rounded-lg transition-colors ${
            currentStep === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          Previous
        </button>

        {currentStep < 6 ? (
          <button
            onClick={nextStep}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={submitTicket}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-lg transition-colors ${
              isSubmitting
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isSubmitting ? 'Creating Ticket...' : 'Create Ticket'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SupportTicket;