import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { MessageService } from '../services';
import api from '../services/api';
import socketService from '../services/socket.service';

export const useMessages = () => {
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
      const borrowerData = borrowerResponse.data;

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

  return {
    // State
    userData,
    isLoading,
    lender,
    messages,
    loadingMessages,
    messageInput,
    setMessageInput,
    sendingMessage,
    attachments,
    uploading,
    
    // Refs
    messageContainerRef,
    fileInputRef,
    
    // Handlers
    handleFileChange,
    removeAttachment,
    openFileSelector,
    sendMessage,
    
    // Utility functions
    getSenderName,
    formatMessageTime,
    hasImageAttachment,
    getImageUrl
  };
};
