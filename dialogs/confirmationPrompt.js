const { ActivityTypes, ActionTypes, CardFactory } = require('botbuilder');
const { ChoicePrompt, WaterfallDialog, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { CustomInputDialog } = require('./inputDialog');
// const { LuisRecognizer } = require('botbuilder-ai');

class CustomConfirmationPrompt extends CustomInputDialog {
    constructor(flow, services) {
        super(flow);

        // Define any constants or member variables here
        this.numToShow = 9;
        this.numToShowFB = 5;
        this.numToShowDL = 30;
        this._flow = flow;
    }

    async promptUserAsync(context, state, options, isRetry) {
        if (!context) {
            throw new Error('Invalid context');
        }

        if (!options) {
            throw new Error('Invalid options');
        }

        let reply;
        let suggKey;

        if (isRetry && options.retryPrompt) {
            reply = options.retryPrompt;
            suggKey = '_ADDED_SUGG_RETRY_';

            if (options.retryPrompt === options.prompt) {
                suggKey = '_ADDED_SUGG_';
            }
        } else if (options.prompt) {
            reply = options.prompt;
            suggKey = '_ADDED_SUGG_';
        } else {
            throw new Error('There is no prompt or retryPrompt');
        }

        if (reply.suggestedActions) {
            options.choices = reply.suggestedActions.actions.map(action => new Choice(action.value.toString()));
        }

        if (!state[suggKey]) {
            this.addSuggestedActions(context, reply);
            state[suggKey] = true;
        }

        await context.sendActivity(reply);
    }

    addSuggestedActions(context, reply) {
        if (!reply.suggestedActions) {
            reply.suggestedActions = { actions: [] };
        }

        const yesWord = 'yes';
        const noWord = 'no';

        // Replace these with your localization logic if needed
        // const user = context.turnState.get('userData').user;
        // const yesWord = this.loc.getQuestion('General', 'OPT_YES', user.languageCode);
        // const noWord = this.loc.getQuestion('General', 'OPT_NO', user.languageCode);

        if (!reply.suggestedActions.actions.some(c => c.value === noWord)) {
            reply.suggestedActions.actions.unshift({
                title: noWord,
                type: ActionTypes.ImBack,
                value: noWord
            });
        }
        if (!reply.suggestedActions.actions.some(c => c.value === yesWord)) {
            reply.suggestedActions.actions.unshift({
                title: yesWord,
                type: ActionTypes.ImBack,
                value: yesWord
            });
        }
    }

    async onRecognizeInput(context, state, options) {
        if (!context) {
            throw new Error('Invalid context');
        }

        const result = { succeeded: false };
        if (context.activity.type === ActivityTypes.Message) {
            const message = context.activity.text;
            if (message) {
                const userData = context.turnState.get('userData');
                const luisRes = await this.luisRecognizer.recognize(message.toLowerCase(), userData.user);

                const intent = this.luisRecognizer.recognizeIntents(luisRes);

                if (intent === 'ConfirmYes' || this.patterns.containsYes(message)) {
                    result.succeeded = true;
                    result.value = 'ConfirmYes';
                } else if (intent === 'ConfirmNo' || this.patterns.containsNo(message)) {
                    result.succeeded = true;
                    result.value = 'ConfirmNo';
                } else if (options.choices) {
                    const results = ChoiceRecognizers.recognizeChoices(context.activity.text, options.choices);
                    if (results.length > 0) {
                        result.value = results[0].resolution.value;
                        result.succeeded = true;
                        return result;
                    }
                } else if (this.validator) {
                    result.value = message;
                    result.succeeded = false;
                }
            }

            return result;
        } else {
            result.succeeded = false;
            return result;
        }
    }
}

module.exports.CustomConfirmationPrompt = CustomConfirmationPrompt;
