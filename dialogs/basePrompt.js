const { Dialog, DialogReason, DialogTurnStatus, ListStyle, ChoiceFactory, ChoicePrompt } = require('botbuilder-dialogs');

class BasePrompt extends Dialog {
    constructor(dialogId, numOfRetries = 2, validator = null) {
        super(dialogId);
        this.numOfRetries = numOfRetries;
        this.validator = validator;
    }

    async beginDialogAsync(dc, options) {
        if (!dc) {
            throw new Error('Invalid dialog context');
        }

        if (!options) {
            throw new Error('Invalid options');
        }

        // Ensure prompts have input hint set
        const opt = options;
        const state = dc.activeDialog.state;
        state.retries = 0;
        state.promptOptions = opt;

        await this.onPromptAsync(dc.context, state, state.promptOptions, false);
        return Dialog.EndOfTurn;
    }

    async onPromptAsync(context, state, promptOptions, isRetry) {
        // Implement your prompt logic here
    }

    async onRecognizeAsync(turnContext, state, options) {
        // Implement your recognition logic here
    }

    async continueDialogAsync(dc) {
        // Implement your continue dialog logic here
    }

    async endPromptAsync(dc, value) {
        // Implement your end prompt logic here
        return await dc.endDialog(value);
    }

    async repromptDialogAsync(turnContext, instance) {
        const options = instance.state.promptOptions;
        await this.onPromptAsync(turnContext, instance.state, options, false);
    }

    async resumeDialogAsync(dc, reason, result) {
        // Implement your resume dialog logic here
    }
}

module.exports.BasePrompt = BasePrompt;
