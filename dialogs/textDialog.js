// dialogs/TextDialog.js

const { TextPrompt } = require('botbuilder-dialogs');
const { StringExpression } = require('adaptive-expressions');
class CustomTextDialog extends TextPrompt {
    constructor(flow, services) {
        super(flow.objectId);
        this.dialog = flow;
        // Implement your custom text dialog logic here
    }

    async beginDialog(innerDc, options) {
        console.log('CustomTextDialog begin dialog');
        const expCondition = new StringExpression(this.dialog.text);
        const res = expCondition.getValue(options.dictionary);
        await this.sendTextToUser(innerDc.context, res);
        return await innerDc.endDialog();
    }

    // create onPrompt method to override the default onPrompt method
    async prompt(turnContext, state, options, isRetry) {
        await this.sendTextToUser(turnContext, this.dialog.text);
    }

    async continueDialog(innerDc) {
        await this.sendTextToUser(innerDc.context, this.dialog.text);
        return await innerDc.endDialog();
    }

    async sendTextToUser(context, text) {
        await context.sendActivity(text);
    }
}

module.exports.CustomTextDialog = CustomTextDialog;
