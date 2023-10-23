const { ActivityTypes, InputHints, MessageFactory } = require('botbuilder');
const { Dialog } = require('botbuilder-dialogs');
const { ValueExpression } = require('adaptive-expressions');

class CustomInputDialog extends Dialog {
    constructor(flow, services) {
        super(flow.objectId);
        this._flow = flow;
        this.TURN_COUNT_PROPERTY = 'this.turnCount';
        this.OPTIONS = 'this.options';
        this.DATA = 'this.data';
        this.LAST_ACTIVITY = 'lastActivity';
        this.CONVERSATIONS = 'conversations';
        this.VALUE_PROPERTY = 'this.value';
        this.MaxTurnCount = 3;
        // this._notificationConnector = services.get('NotificationServiceConnector');
        // this._localization = services.get('ILocalizationUtilities');
    }

    async beginDialog(dc, options, cancellationToken = null) {
        console.log(1111111);
        if (!dc) {
            throw new Error('DialogContext is required.');
        }

        // if (options instanceof CancellationToken) {
        //     throw new Error(`${options} cannot be a cancellation token.`);
        // }

        const state = dc.activeDialog.state;
        if (dc.api_response) {
            options.currentFlow.data = dc.api_response.leave_balance;
            console.log(options);
        } else {
            if (options.currentFlow.data !== null && options.currentFlow.data !== undefined && typeof options.currentFlow.data !== 'object') {
                const expression = new ValueExpression(options.currentFlow.data);
                const val = expression.getValue(options.dictionary);
                options.currentFlow.data = JSON.parse(val);
            }
        }
        const op = await this.onInitializeOptions(dc, options);
        state[this.OPTIONS] = op;
        state[this.TURN_COUNT_PROPERTY] = 1;

        // eslint-disable-next-line no-prototype-builtins
        if (op.currentFlow != null && op.currentFlow.type?.toLowerCase() === 'adaptivecarddialog' && state.hasOwnProperty('choices')) {
            const choices = state.choices;
            if (!choices || choices.length === 0) {
                await this.promptUserAsync(dc, state, cancellationToken);
                return dc.endDialog();
            }
        }

        return this.promptUserAsync(dc, state, cancellationToken);
    }

    async onInitializeOptions(dc, options) {
        return options;
    }

    async continueDialog(dc, cancellationToken = null) {
        const activity = dc.context.activity;

        if (activity.type !== ActivityTypes.Message) {
            return Dialog.EndOfTurn;
        }

        const state = dc.activeDialog.state;
        const turnCount = parseInt(state[this.TURN_COUNT_PROPERTY]);

        const inputState = await this.recognizeInputAsync(dc, turnCount, cancellationToken);

        if (inputState === 'Valid') {
            const input = state[this.VALUE_PROPERTY];
            return dc.endDialog(input, { cancellationToken });
        } else if (inputState === 'ShowMore') {
            return this.promptUserAsync(dc, inputState, cancellationToken);
        } else if (!this.MaxTurnCount || turnCount < this.MaxTurnCount) {
            state[this.TURN_COUNT_PROPERTY] = turnCount + 1;
            return this.promptUserAsync(dc, state, cancellationToken);
        } else {
            // eslint-disable-next-line no-undef
            throw new TriesExceededException();
        }
    }

    async resumeDialogAsync(dc, reason, result = null, cancellationToken = null) {
        return this.promptUserAsync(dc, 'Missing', cancellationToken);
    }

    async onRecognizeInputAsync(dc) {
        console.log(22222);
        // Implement input recognition logic specific to this dialog
        // Return InputState.Valid, InputState.Unrecognized, or InputState.Missing
        return 'Valid';
    }

    async recognizeInputAsync(dc, turnCount, cancellationToken = undefined) {
        let input = null;
        console.log(dc.activeDialog);
        const state = dc.activeDialog.state;

        if (input === null && turnCount > 0) {
            if (dc.constructor.name === 'AttachmentInputDialog') {
                input = dc.context.activity.attachments || [];
            } else {
                input = dc.context.activity.text;
            }

            // If there is no visible text AND we have a value object, then fallback to that.
            if (!dc.context.activity.text && dc.context.activity.value !== undefined) {
                input = dc.context.activity.value;
            }
        }

        // Update "this.value" and perform additional recognition and validations

        state[this.VALUE_PROPERTY] = input;

        if (input !== null) {
            const inputState = await this.onRecognizeInputAsync(dc, cancellationToken).catch((error) => {
                console.error(error);
            });

            if (inputState === 'Valid') {
                return 'Valid';
            } else {
                // return inputState;
                // return "Valid";

                return 'Invalid';
            }
        } else {
            return 'Missing';
        }
    }

    async getPromptActivity(dialogContext, data = null, localizationUtilities = null) {
        const message = MessageFactory.text('');

        const dataDict = data || {};

        if (this.Question && this.Question.getValue(data)) {
            if (localizationUtilities && dataDict.user) {
                const keyVal = this.Question.getValue(data);
                const module = localizationUtilities.getModule(keyVal);

                if (dataDict.user && module) {
                    const user = dataDict.user;

                    const question = localizationUtilities.getQuestion(module, keyVal, user.LanguageCode);
                    const text = question.getValue(data);

                    message.text = text;
                    message.speak = text;
                }
            }

            message.text = message.text || this.Question.getValue(data);
            message.speak = message.speak || this.Question.getValue(data);
        }

        if (this.Attachments && this.Attachments.length > 0) {
            for (const attachment of this.Attachments) {
                let newAttachment;

                if (attachment.ContentUrl) {
                    newAttachment = {
                        contentUrl: attachment.ContentUrl.getValue(data),
                        contentType: attachment.ContentType.getValue(data)
                    };
                } else {
                    newAttachment = {
                        contentType: attachment.ContentType.getValue(data),
                        content: attachment.Content
                    };
                }

                message.attachments.push(newAttachment);
            }

            message.attachmentLayout = 'list';
        }

        if (this.Path && !this.Path.isEmpty()) {
            dataDict.lastLuisResult = null;
            // eslint-disable-next-line no-undef
            const adaptiveCard = AdaptiveCardUtilities.createAdaptiveCardAttachment('', this.Path, JSON.stringify(data));
            const msg = MessageFactory.attachment(adaptiveCard);

            if (msg && msg.attachments.length > 0) {
                message.attachments = msg.attachments;
                message.attachmentLayout = msg.attachmentLayout;
            }
        }

        return message;
    }

    async onRenderPromptAsync(dc, state, cancellationToken = null) {
        let msg = null;
        const options = dc.activeDialog.state[this.OPTIONS];

        if (msg === null) {
            msg = await this.getPromptActivity(dc, options.dictionary, { cancellationToken, localizationUtilities: this._localization });

            msg.text = this._flow.question;
        }

        msg.inputHint = InputHints.ExpectingInput;

        const conversations = options.dictionary[this.CONVERSATIONS];

        if (msg.text !== null && msg.text !== undefined && msg.text.trim() !== '') {
            const dict = {};
            dict.Bot = msg.text;
            conversations.push(dict);
            options.dictionary[this.CONVERSATIONS] = conversations;
        }

        return msg;
    }

    async promptUserAsync(dc, state, cancellationToken = null) {
        const prompt = await this.onRenderPromptAsync(dc, state, cancellationToken);

        await dc.context.sendActivity(prompt);
        return Dialog.EndOfTurn;
    }
}

module.exports.CustomInputDialog = CustomInputDialog;
