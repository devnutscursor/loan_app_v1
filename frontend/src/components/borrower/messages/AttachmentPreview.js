import React from 'react';

/**
 * Component for previewing selected file attachments before sending
 * Shows thumbnails with remove buttons
 */
const AttachmentPreview = ({ attachments, onRemoveAttachment }) => {
  if (attachments.length === 0) return null;

  return (
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
              onClick={() => onRemoveAttachment(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold shadow-sm hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentPreview;
