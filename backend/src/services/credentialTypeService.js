const { CREDENTIAL_TYPES } = require('../constants/credentialTypes');

class CredentialTypeService {
    /**
     * Get all available credential types
     */
    getAvailableTypes() {
        return Object.entries(CREDENTIAL_TYPES)
            .filter(([key, config]) => config.isVisible)
            .map(([key, config]) => ({
                id: key,
                displayName: config.displayName,
                description: config.description,
                category: config.category,
                fields: config.fields
            }));
    }

    /**
     * Get credential type configuration by ID
     */
    getTypeConfig(typeId) {
        return CREDENTIAL_TYPES[typeId] || null;
    }

    /**
     * Get types by category
     */
    getTypesByCategory(category) {
        return Object.entries(CREDENTIAL_TYPES)
            .filter(([key, config]) => config.category === category && config.isVisible)
            .map(([key, config]) => ({
                id: key,
                displayName: config.displayName,
                description: config.description
            }));
    }

    /**
     * Check if credential type exists and is visible
     */
    isValidType(typeId) {
        const config = CREDENTIAL_TYPES[typeId];
        return config && config.isVisible;
    }
}

module.exports = new CredentialTypeService();
