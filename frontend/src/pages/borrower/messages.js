import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { MessageService } from '../../services';
import api from '../../services/api';
import { ImageViewer } from '../../components/common';
import socketService from '../../services/socket.service';

/**
 * Borrower Messages Page
 * 
 * A dedicated interface for borrowers to communicate with loan officers and other lenders.
 * Provides conversation management and messaging capabilities.
 */
const BorrowerMessages = () => {
  // State for user data
  const [userData, setUserData] = useState(null);
  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  // State for lender data
  const [lender, setLender] = useState(null);
  // State for messages
  const [messages, setMessages] = useState([]);
  // State for loading messages
  const [loadingMessages, setLoadingMessages] = useState(false);
  // State for message input
  const [messageInput, setMessageInput] = useState('');
  // State for sending message
  const [sendingMessage, setSendingMessage] = useState(false);
  // State for file attachments
  const [attachments, setAttachments] = useState([]);
  // State for uploading status
  const [uploading, setUploading] = useState(false);
  
  // Ref for message container to auto scroll
  const messageContainerRef = useRef(null);
  // Ref for file input
  const fileInputRef = useRef(null);
  
  // Load user data when component mounts
  useEffect(() => {
    fetchUserData();
  }, []);
  
  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Initialize socket connection
  useEffect(() => {
    if (userData?.data?.user?._id) {
      // Connect to socket
      const socket = socketService.connect();
      
      // Join user's room
      socketService.joinRoom(userData.data.user._id);
      console.log('Borrower Messages: Joined room', userData.data.user._id);
      
      // Handle direct message events
      const handleNewMessage = (message) => {
        console.log('Borrower Messages: New message received', message);
        
        // Check if this message belongs to the current conversation or is a new message
        if ((message.borrower && lender?.borrowerId && message.borrower === lender.borrowerId) || 
            (message.sender && message.sender === 'lender')) {
          setMessages((prevMessages) => {
            // Check if message already exists to prevent duplicates
            const exists = prevMessages.some(m => m._id === message._id);
            if (!exists) {
              // Show notification for new messages
              toast.success('New message received');
              return [...prevMessages, message];
            }
            return prevMessages;
          });
          
          // Scroll to bottom when new message arrives
          setTimeout(() => {
            if (messageContainerRef.current) {
              messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
            }
          }, 100);
        }
      };
      
      // Register direct event listeners
      socket.on('receive_message', handleNewMessage);
      socket.on('new_lender_message', handleNewMessage);
      
      // Clean up on unmount
      return () => {
        socket.off('receive_message', handleNewMessage);
        socket.off('new_lender_message', handleNewMessage);
      };
    }
  }, [userData?.data?.user?._id, lender?.borrowerId]);
  
  // Fetch user data
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // Get the user profile from the server
      const response = await api.get('/users/me');
      setUserData(response.data);
      
      // Get borrower information
      const borrowerResponse = await api.get('/borrower/profile');
      // console.log(borrowerResponse.data);
      const borrowerData = borrowerResponse.data;
      // console.log("borrowerData", borrowerData);
      
      // Fetch lender information
      if (borrowerData && borrowerData.data.lender) {
        try {
          console.log("borrowerData.lender", borrowerData.data.lender);
          const lenderResponse = await api.get(`/lenders/${borrowerData.data.lender}`);
          console.log("lenderResponse", lenderResponse.data);
          setLender({
            ...lenderResponse.data,
            borrowerId: borrowerData.data._id
          });
          
          // Fetch messages between borrower and lender
          fetchMessages(borrowerData.data._id);
        } catch (error) {
          console.error('Error fetching lender data:', error);
          toast.error('Failed to load lender data. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch messages between borrower and lender
  const fetchMessages = async (borrowerId) => {
    setLoadingMessages(true);
    try {
      const result = await MessageService.getMessages(borrowerId);
      if (result.success) {
        setMessages(result.data);
      } else {
        toast.error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Filter by image files only
      const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length !== newFiles.length) {
        toast.error('Only image files are allowed');
      }
      
      // Limit to 5 images at a time
      if (attachments.length + imageFiles.length > 5) {
        toast.error('Maximum 5 images allowed per message');
        return;
      }
      
      // Add preview for selected images
      const filesWithPreview = imageFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      
      setAttachments([...attachments, ...filesWithPreview]);
    }
  };
  
  // Remove an attachment
  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newAttachments[index].preview);
    
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };
  
  // Open file selector
  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Send a message to the lender
  const sendMessage = async () => {
    if ((!messageInput.trim() && attachments.length === 0) || !lender) return;
    
    setSendingMessage(true);
    try {
      // Extract files from the attachments
      const files = attachments.map(attachment => attachment.file);
      
      const result = await MessageService.sendMessage(lender.borrowerId, messageInput, files);
      if (result.success) {
        setMessages([...messages, result.data]);
        setMessageInput('');
        setAttachments([]);
        
        // Emit socket event for real-time updates
        socketService.sendMessage(result.data);
        
        toast.success('Message sent');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Get the sender's display name
  const getSenderName = (message) => {
    if (message.sender._id === userData?._id) {
      return 'You';
    }
    return `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.email || 'Loan Officer';
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if the message has an image attachment
  const hasImageAttachment = (message) => {
    return message.attachments && message.attachments.length > 0;
  };

  // Get image URL with proper base path
  const getImageUrl = (attachment) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Make sure we don't duplicate the base URL if it's already included
    if (attachment.url.startsWith('http')) {
      return attachment.url;
    }
    
    // Extract the filename from the URL path
    const urlParts = attachment.url.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Use our proxy route to avoid CORS issues
    return `${baseUrl}/api/image-proxy/${filename}`;
  };
  
  return (
    <ProtectedRoute allowedRoles={['borrower']}>
      <MainLayout>
        <div className="py-6 h-full flex flex-col">
          <div className="px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
            <p className="mt-1 text-sm text-gray-500">
              Communicate with your loan officer and other lending team members
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 flex-grow flex flex-col">
            {/* Loading state */}
            {isLoading ? (
              <div className="w-full h-full flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden h-[calc(100vh-220px)] flex flex-col">
                {/* Lender information */}
                {lender && (
                  <div className="border-b p-4 flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                      {lender.user?.firstName?.[0] || 'L'}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">
                        {lender.user?.firstName} {lender.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{lender.title || 'Loan Officer'}</p>
                    </div>
                  </div>
                )}
                
                {/* Messages container */}
                <div ref={messageContainerRef} className="flex-grow overflow-y-auto p-4">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                            {messages.map((message) => {
                              const isSender = message.sender._id !== userData.data.user?._id;
                              console.log("message", message);
                              console.log(message.sender.role);
                              console.log(userData.data.user.role);
                              const senderName = getSenderName(message);
                        
                        return (
                          <div 
                          key={message._id} 
                          className={`flex w-full ${isSender ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`flex flex-col max-w-[75%] ${isSender ? 'items-start' : 'items-end'}`}>
                            {/* Sender name */}
                            <div className={`text-xs text-gray-500 mb-1 ${isSender ? 'text-left' : 'text-right'}`}>
                              {senderName}
                            </div>
                              
                             {/* Message content */}
                             <div 
                                      className={`rounded-lg px-4 py-2 break-words ${
                                        isSender 
                                          ? 'bg-gray-200 text-black rounded-tl-none' 
                                          : 'bg-blue-500 text-white rounded-tr-none'
                                      }`}
                                    >
                                {message.content && <p>{message.content}</p>}
                                
                                {/* Image attachments */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 grid gap-2">
                                    {message.attachments.map((attachment, index) => (
                                      <div key={index} className="relative">
                                        {attachment.fileType.startsWith('image/') ? (
                                          <ImageViewer 
                                            src={getImageUrl(attachment)}
                                            alt={attachment.fileName}
                                            className="max-w-full rounded"
                                            style={{ maxHeight: '200px' }}
                                          />
                                        ) : (
                                          <div className="p-2 border rounded bg-gray-50 text-sm flex items-center">
                                            <svg className="h-5 w-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                            </svg>
                                            <a 
                                              href={getImageUrl(attachment)} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-blue-500 hover:underline"
                                            >
                                              {attachment.fileName}
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <p className={`text-xs mt-1 ${isSender ? 'text-gray-500' : 'text-gray-200'}`}>
                                  {formatMessageTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Message input */}
                <div className="border-t p-4 bg-gray-50">
                  <div className="flex flex-col">
                    {/* Selected attachments preview */}
                    {attachments.length > 0 && (
                      <div className="mb-3 bg-white rounded-lg p-2 shadow-sm">
                        <div className="flex overflow-x-auto space-x-3 pb-2">
                          {attachments.map((attachment, index) => (
                            <div key={index} className="relative flex-shrink-0">
                              <img 
                                src={attachment.preview} 
                                alt="Selected" 
                                className="h-16 w-16 object-cover rounded-md border border-gray-200"
                              />
                              <button 
                                onClick={() => removeAttachment(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold shadow-sm hover:bg-red-600 transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-end bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow p-3 focus:outline-none resize-none min-h-[60px] max-h-[120px]"
                        style={{ minHeight: '60px', maxHeight: '120px' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && lender) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        disabled={!lender || sendingMessage}
                      />
                      
                      <div className="flex items-center h-full px-2 mb-3">
                        {/* Attachment button */}
                        <button
                          onClick={openFileSelector}
                          className="p-2 text-gray-500 hover:text-blue-500 focus:outline-none transition-colors"
                          title="Attach images"
                          disabled={!lender || attachments.length >= 5 || sendingMessage}
                        >
                          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </button>
                        
                        {/* Send button */}
                        <button
                          onClick={sendMessage}
                          className={`ml-2 p-2 rounded-full ${
                            !messageInput.trim() && attachments.length === 0 || !lender || sendingMessage
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          } focus:outline-none transition-colors`}
                          disabled={(!messageInput.trim() && attachments.length === 0) || !lender || sendingMessage}
                        >
                          {sendingMessage ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                          ) : (
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                      
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={!lender || attachments.length >= 5 || sendingMessage}
                    />
                    
  
                   
                  </div>
                </div>
              </div>
            )}
            
            {/* Help section */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Help & Support</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      If you have any questions about your loan application or need assistance, message your loan officer directly through this interface. They typically respond within 24 hours on business days.
                    </p>
                    <p className="mt-2">
                      For urgent matters, please call our customer support at <a href="tel:+18005551234" className="font-medium">1-800-555-1234</a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default BorrowerMessages;
