import React from 'react';
import CustomTemplateForm from '../../common/CustomTemplateForm';

const TemplatesSection = ({
  selectedBorrower,
  showCustomTemplateForm,
  setShowCustomTemplateForm,
  editingTemplate,
  selectedTemplateCategory,
  setSelectedTemplateCategory,
  getAllTemplatesGroupedByCategory,
  handleTemplateSelect,
  handleCustomTemplateSave,
  handleCustomTemplateCancel,
  handleCustomTemplateEdit,
  handleCustomTemplateDelete
}) => {
  return (
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
                        ? template.content.substring(0, 60) + '...'
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
  );
};

export default TemplatesSection;
