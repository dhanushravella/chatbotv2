const {
    ComponentDialog,
    WaterfallDialog
} = require('botbuilder-dialogs');

class CustomComponentDialog extends ComponentDialog {
    constructor(flow, services) {
        super(flow.objectId);
        // Implement your custom input dialog logic here
    }
}

module.exports = CustomComponentDialog;
