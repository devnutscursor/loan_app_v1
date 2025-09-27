import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { MessageService } from '../../services';
import api from '../../services/api';
import socketService from '../../services/socket.service';
import { getTemplatesGroupedByCategory } from '../../data/messageTemplates';
import { TemplateProcessor } from '../../utils/TemplateProcessor';
import { CustomTemplateManager } from '../../utils/CustomTemplateManager';

const useLenderMessages = () => {
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

  return {
    // Data
    userData,
    conversations,
    selectedBorrower,
    messages,
    messageInput,
    attachments,
    customTemplates,
    editingTemplate,
    selectedTemplateCategory,
    showCustomTemplateForm,
    
    // Loading states
    isLoading,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    uploading,
    
    // Refs
    messageContainerRef,
    fileInputRef,
    
    // Event handlers
    selectBorrower,
    setMessageInput,
    handleFileChange,
    removeAttachment,
    openFileSelector,
    sendMessage,
    getSenderName,
    formatMessageTime,
    getTotalUnreadCount,
    getImageUrl,
    handleTemplateSelect,
    handleCustomTemplateSave,
    handleCustomTemplateCancel,
    handleCustomTemplateEdit,
    handleCustomTemplateDelete,
    getAllTemplatesGroupedByCategory,
    
    // Template state handlers
    setSelectedTemplateCategory,
    setShowCustomTemplateForm
  };
};

export default useLenderMessages;
