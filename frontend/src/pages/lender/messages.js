import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { MessageService } from '../../services';
import api from '../../services/api';
import { useRouter } from 'next/router';
import { ImageViewer } from '../../components/common';
import socketService from '../../services/socket.service';
import { getTemplatesGroupedByCategory } from '../../data/messageTemplates';
import { TemplateProcessor } from '../../utils/TemplateProcessor';
import { CustomTemplateManager } from '../../utils/CustomTemplateManager';
import CustomTemplateForm from '../../components/common/CustomTemplateForm';

/**
 * Lender Messages Page
 * 
 * A dedicated interface for lenders to communicate with borrowers and other team members.
 * Provides conversation management, messaging capabilities, and integration with loan information.
 */
const LenderMessages = () => {
  const router = useRouter();
  
  // State for user data
  const [userData, setUserData] = useState(null);
  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  // State for conversations
  const [conversations, setConversations] = useState([]);
  // State for loading conversations
  const [loadingConversations, setLoadingConversations] = useState(false);
  // State for selected borrower
  const [selectedBorrower, setSelectedBorrower] = useState(null);
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
  // State for template categories (for UI organization)
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState('application');
  // State for custom template form
  const [showCustomTemplateForm, setShowCustomTemplateForm] = useState(false);
  // State for custom templates
  const [customTemplates, setCustomTemplates] = useState([]);
  // State for editing template
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  // Ref for message container to auto scroll
  const messageContainerRef = useRef(null);
  // Ref for file input
  const fileInputRef = useRef(null);
  
  // Load user data when component mounts
  useEffect(() => {
    // Get borrowerId from URL if available
    const { borrowerId } = router.query;
    
    fetchUserData();
    
    // If borrowerId is provided, select that borrower
    if (borrowerId) {
      // We'll set this after loading conversations
      localStorage.setItem('selectedBorrowerId', borrowerId);
    }
  }, [router.query]);
  
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
      
      // Add message listener
      socketService.addMessageListener('lender-messages', (message) => {
        // Check if this message belongs to the current conversation
        if (selectedBorrower && message.borrower === selectedBorrower._id) {
          setMessages((prevMessages) => {
            // Check if message already exists to prevent duplicates
            const exists = prevMessages.some(m => m._id === message._id);
            if (!exists) {
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
        
        // Update conversations list with latest message
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.borrower._id === message.borrower 
              ? { 
                  ...conv, 
                  latestMessage: message 
                } 
              : conv
          )
        );
      });
      
      // Clean up on unmount
      return () => {
        socketService.removeMessageListener('lender-messages');
      };
    }
  }, [userData?.data?.user?._id, selectedBorrower]);
  
  // Fetch user data
  const fetchUserData = async () => {
    console.log("fetchUserData");
    setIsLoading(true);
    try {
      // Get the user profile from the server
      const response = await api.get('/users/me');
      console.log("response", response.data);
      setUserData(response.data);
      
      // Fetch conversations
      fetchConversations();
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data. Please try again later.');
      setIsLoading(false);
    }
  };
  
  // Fetch all conversations for the lender
  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const result = await MessageService.getConversations();
      if (result.success) {
        setConversations(result.data);
        setIsLoading(false);
        
        // If there are conversations and selectedBorrowerId exists in localStorage, select that borrower
        if (result.data.length > 0) {
          const savedBorrowerId = localStorage.getItem('selectedBorrowerId');
          if (savedBorrowerId) {
            const found = result.data.find(
              conv => conv.borrower?._id === savedBorrowerId
            );
            
            if (found) {
              selectBorrower(found.borrower);
              localStorage.removeItem('selectedBorrowerId');
            } else {
              // If no matching borrower found, select the first one
              selectBorrower(result.data[0].borrower);
            }
          } else {
            // Select first borrower by default
            selectBorrower(result.data[0].borrower);
          }
        }
      } else {
        toast.error('Failed to load conversations');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
      setIsLoading(false);
    } finally {
      setLoadingConversations(false);
    }
  };
  
  // Select a borrower to chat with
  const selectBorrower = (borrower) => {
    setSelectedBorrower(borrower);
    
    if (borrower) {
      fetchMessages(borrower._id);
    } else {
      setMessages([]);
    }
  };
  
  // Fetch messages between lender and selected borrower
  const fetchMessages = async (borrowerId) => {
    setLoadingMessages(true);
    try {
      const result = await MessageService.getMessages(borrowerId);
      if (result.success) {
        setMessages(result.data);
        
        // Update unread count in conversations
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.borrower._id === borrowerId 
              ? { ...conv, unreadCount: 0 } 
              : conv
          )
        );
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
  
  // Send a message to the selected borrower
  const sendMessage = async () => {
    if ((!messageInput.trim() && attachments.length === 0) || !selectedBorrower) return;
    
    setSendingMessage(true);
    try {
      // Extract files from the attachments
      const files = attachments.map(attachment => attachment.file);
      
      const result = await MessageService.sendMessage(selectedBorrower._id, messageInput, files);
      if (result.success) {
        setMessages([...messages, result.data]);
        setMessageInput('');
        setAttachments([]);
        
        // Emit socket event for real-time updates
        socketService.sendMessage(result.data);
        
        // Update latest message in conversations
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.borrower._id === selectedBorrower._id 
              ? { 
                  ...conv, 
                  latestMessage: result.data 
                } 
              : conv
          )
        );
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
    return `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.email || 'Unknown';
  };
  
  // Format message time
  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get the total unread count across all conversations
  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
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

  // Handle template selection with dynamic borrower name insertion
  const handleTemplateSelect = (template) => {
    try {
      const processedContent = TemplateProcessor.processTemplate(template, selectedBorrower);
      setMessageInput(processedContent);
    } catch (error) {
      console.error('Error processing template:', error);
      // Fallback to original template content if processing fails
      setMessageInput(template.content);
    }
  };

  // Load custom templates on component mount
  useEffect(() => {
    loadCustomTemplates();
  }, []);

  // Load custom templates from storage
  const loadCustomTemplates = () => {
    try {
      const templates = CustomTemplateManager.getCustomTemplates();
      setCustomTemplates(templates);
    } catch (error) {
      console.error('Error loading custom templates:', error);
      toast.error('Failed to load custom templates');
    }
  };

  // Handle custom template save
  const handleCustomTemplateSave = (template) => {
    try {
      // Reload custom templates to get the updated list
      loadCustomTemplates();
      
      // Hide the form
      setShowCustomTemplateForm(false);
      setEditingTemplate(null);
      
      toast.success(`Template "${template.title}" saved successfully!`);
    } catch (error) {
      console.error('Error handling template save:', error);
      toast.error('Failed to save template');
    }
  };

  // Handle custom template form cancel
  const handleCustomTemplateCancel = () => {
    setShowCustomTemplateForm(false);
    setEditingTemplate(null);
  };

  // Handle custom template edit
  const handleCustomTemplateEdit = (template) => {
    setEditingTemplate(template);
    setShowCustomTemplateForm(true);
  };

  // Handle custom template delete
  const handleCustomTemplateDelete = (templateId) => {
    try {
      const result = CustomTemplateManager.deleteCustomTemplate(templateId);
      if (result.success) {
        loadCustomTemplates();
        toast.success('Template deleted successfully!');
      } else {
        toast.error(result.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  // Get all templates including custom ones, organized by category
  const getAllTemplatesGroupedByCategory = () => {
    const defaultTemplates = getTemplatesGroupedByCategory();
    
    // Add custom templates to their respective categories
    customTemplates.forEach(template => {
      const categoryId = template.category || 'custom';
      
      if (!defaultTemplates[categoryId]) {
        // Create custom category if it doesn't exist
        defaultTemplates[categoryId] = {
          id: categoryId,
          name: categoryId === 'custom' ? 'Custom' : categoryId,
          templates: []
        };
      }
      
      defaultTemplates[categoryId].templates.push(template);
    });
    
    return defaultTemplates;
  };
  
  return (
    <ProtectedRoute allowedRoles={['lender', 'admin']}>
      <MainLayout>
        <div className="py-6 h-full flex flex-col">
          <div className="px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Borrower Communications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage communications with loan applicants and borrowers
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 flex-grow flex flex-col">
            {/* Loading state */}
            {isLoading ? (
              <div className="w-full h-full flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden h-[calc(100vh-10px)] flex">
                {/* Borrowers list (sidebar) */}
                <div className="w-80 border-r overflow-y-auto">
                  <div className="p-4 border-b">
                    <h2 className="font-medium text-lg">Borrowers</h2>
                    <p className="text-sm text-gray-500">
                      {getTotalUnreadCount()} unread messages
                    </p>
                  </div>
                  
                  {loadingConversations ? (
                    <div className="flex justify-center items-center h-20">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No borrowers found
                    </div>
                  ) : (
                    <div>
                      {conversations.map((conversation) => (
                        <div 
                          key={conversation.borrower._id}
                          onClick={() => selectBorrower(conversation.borrower)}
                          className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                            selectedBorrower?._id === conversation.borrower._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                                {conversation.borrower.user?.firstName?.[0] || 'B'}
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">
                                  {conversation.borrower.user?.firstName} {conversation.borrower.user?.lastName}
                                </p>
                                <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                  {conversation.latestMessage?.content || 'No messages yet'}
                                </p>
                              </div>
                            </div>
                            
                            {conversation.unreadCount > 0 && (
                              <div className="bg-blue-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                                {conversation.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Chat area */}
                <div className="flex-grow flex flex-col">
                  {selectedBorrower ? (
                    <>
                      {/* Selected borrower header */}
                      <div className="border-b p-4 flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                          {selectedBorrower.user?.firstName?.[0] || 'B'}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">
                            {selectedBorrower.user?.firstName} {selectedBorrower.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedBorrower.user?.email}
                          </p>
                        </div>
                      </div>
                      
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
                                                  className="max-w-[250px] rounded"
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
                      
                      {/* Message input area */}
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
                                if (e.key === 'Enter' && !e.shiftKey && selectedBorrower) {
                                  e.preventDefault();
                                  sendMessage();
                                }
                              }}
                              disabled={!selectedBorrower || sendingMessage}
                            />
                            
                            <div className="flex items-center h-full px-2 mb-3">
                              {/* Attachment button */}
                              <button
                                onClick={openFileSelector}
                                className="p-2 text-gray-500 hover:text-blue-500 focus:outline-none transition-colors"
                                title="Attach images"
                                disabled={!selectedBorrower || attachments.length >= 5 || sendingMessage}
                              >
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                              </button>
                              
                              {/* Send button */}
                              <button
                                onClick={sendMessage}
                                className={`ml-2 p-2 rounded-full ${
                                  !messageInput.trim() && attachments.length === 0 || !selectedBorrower || sendingMessage
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                } focus:outline-none transition-colors`}
                                disabled={(!messageInput.trim() && attachments.length === 0) || !selectedBorrower || sendingMessage}
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
                            disabled={!selectedBorrower || attachments.length >= 5 || sendingMessage}
                          />
                          
                        
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-grow flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <p>Select a borrower to start messaging</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Quick actions */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Communication guidelines */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Communication Guidelines</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Respond to all borrower messages within 24 business hours</li>
                  <li>Use templates for common responses to maintain consistency</li>
                  <li>Inform borrowers about document requirements with detailed instructions</li>
                  <li>Update borrowers on status changes promptly</li>
                  <li>Maintain professional tone in all communications</li>
                </ul>
              </div>
              
              {/* Enhanced Message Templates with Categories */}
              <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Quick Templates</h3>
                  <button
                    type="button"
                    onClick={() => setShowCustomTemplateForm(!showCustomTemplateForm)}
                    className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    {showCustomTemplateForm ? 'Cancel' : '+ Add Custom'}
                  </button>
                </div>

                {/* Custom Template Form */}
                {showCustomTemplateForm && (
                  <CustomTemplateForm
                    onSave={handleCustomTemplateSave}
                    onCancel={handleCustomTemplateCancel}
                    selectedBorrower={selectedBorrower}
                    editTemplate={editingTemplate}
                    isVisible={showCustomTemplateForm}
                  />
                )}
                
                {/* Template Category Tabs */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1 border-b border-gray-200">
                    {Object.entries(getAllTemplatesGroupedByCategory()).map(([categoryId, category]) => (
                      <button
                        key={categoryId}
                        type="button"
                        onClick={() => setSelectedTemplateCategory(categoryId)}
                        className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${
                          selectedTemplateCategory === categoryId
                            ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {category.name}
                        {category.templates.filter(t => t.isCustom).length > 0 && (
                          <span className="ml-1 text-xs bg-green-100 text-green-600 px-1 rounded">
                            {category.templates.filter(t => t.isCustom).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Template Buttons for Selected Category */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {(() => {
                    const templatesGrouped = getAllTemplatesGroupedByCategory();
                    const selectedCategory = templatesGrouped[selectedTemplateCategory];
                    
                    if (!selectedCategory || !selectedCategory.templates.length) {
                      return (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No templates available in this category
                        </div>
                      );
                    }
                    
                    return selectedCategory.templates.map((template) => (
                      <div key={template.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => handleTemplateSelect(template)}
                          className="w-full text-left px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors"
                          disabled={!selectedBorrower}
                          title={!selectedBorrower ? 'Select a borrower to use templates' : ''}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-grow">
                              <span className="block font-medium text-gray-700">
                                {template.title}
                                {template.isCustom && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-600 px-1 rounded">
                                    Custom
                                  </span>
                                )}
                              </span>
                              <span className="block text-xs text-gray-500 truncate mt-1">
                                {selectedBorrower 
                                  ? TemplateProcessor.processTemplate(template, selectedBorrower).substring(0, 60) + '...'
                                  : template.preview
                                }
                              </span>
                            </div>
                            
                            {/* Custom template actions */}
                            {template.isCustom && (
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCustomTemplateEdit(template);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 focus:outline-none"
                                  title="Edit template"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Are you sure you want to delete "${template.title}"?`)) {
                                      handleCustomTemplateDelete(template.id);
                                    }
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 focus:outline-none"
                                  title="Delete template"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    ));
                  })()}
                </div>
                
                {/* Template Usage Hint */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {selectedBorrower 
                      ? `Templates will be personalized for ${selectedBorrower.user?.firstName || 'the selected borrower'}`
                      : 'Select a borrower to personalize templates with their name'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LenderMessages;
