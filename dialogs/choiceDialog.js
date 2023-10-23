const { ChoiceFactory } = require('botbuilder-dialogs');
const { MessageFactory, ActionTypes } = require('botbuilder');
const { CustomInputDialog } = require('./inputDialog');
const { ConversationFlowUtilitiesV2 } = require('./conversationFlowUtilitiesV2');
const { StringExpression } = require('adaptive-expressions');
// const { tr } = require('date-fns/locale');
// const timeformator = require('../utils/timeformat');
const recognizeChoices = require('./choices/recognizeChoices');
// const { recognizeChoices } = require('./choices');

// const ChoiceRecognizers = require('./ChoiceRecognizers');
// var ChoiceRecognizers = require('@microsoft/recognizers-text-choice');
// Import the ChoiceRecognizers module from a separate file

class CustomChoiceDialog extends CustomInputDialog {
    constructor(flow, services) {
        super(flow);

        // Define any constants or member variables here
        this.numToShow = 9;
        this.numToShowFB = 5;
        this.numToShowDL = 30;
        this._flow = flow;
    }

    async onInitializeOptions(dc, options) {
        const flowData = options;
        const state = dc.activeDialog.state;
        const choices = [];
        this._flow.data = flowData.currentFlow.data;
        // Update dialog state so that options can be updated
        // this._flow.Options = ConversationFlowUtilitiesV2.ResolveMenu3(this._flow.Data, this._flow.Options, flowData.Dictionary, out choices);
        var conversationFlowUtilitiesV2 = new ConversationFlowUtilitiesV2();
        const result = conversationFlowUtilitiesV2.resolveMenu3(this._flow.data, flowData.currentFlow.options, flowData.dictionary, choices, null);
        // const latestOptions = ConversationFlowUtilitiesV2.resolveMenu3(this._flow.data, flowData.currentFlow.options, flowData.Dictionary, choices, null);

        if (this._flow.Style === 'Carousel') {
            state.HeroCards = conversationFlowUtilitiesV2.createCarousel(this._flow.data, this._flow.card, flowData.dictionary, choices, dc.context.activity.channelId, dc.context, result);
            // state.HeroCards = conversationFlowUtilitiesV2.resolveCards2(this._flow.data, this._flow.card, flowData.dictionary, choices, dc.context.activity.channelId,dc.context);
        }

        state.choices = result.choices;
        state.options = result.latestOptions;
        return options;
    }

    async resumeDialogAsync(dc, reason, result = null, cancellationToken) {
        // eslint-disable-next-line no-undef
        const foundChoice = result instanceof FoundChoice ? result : null;

        if (foundChoice) {
            // Return the value instead of FoundChoice object
            return await super.resumeDialogAsync(dc, reason, foundChoice.value, cancellationToken);
        }

        return await super.resumeDialogAsync(dc, reason, result, cancellationToken);
    }

    async onRecognizeInputAsync(dc) {
        if (this._flow.Style === 'suggestedAction') {
            return 'Valid';
        }
        const input = dc.activeDialog.state['this.value'];
        const choices = dc.activeDialog.state.options;
        var results = await recognizeChoices.recognizeChoices(input, choices, null);

        const result = {
            succeeded: Array.isArray(results) && results.length > 0,
            value: results.length > 0 ? results[0].resolution : undefined
        };

        if (result.succeeded === true) {
            if ('resolution' in results[0]) {
                dc.activeDialog.state['this.value'] = dc.activeDialog.state.options[results[0].resolution.index];
            } else {
                dc.activeDialog.state['this.value'] = dc.activeDialog.state.options[results[0].index];
            }
            console.log('--------->', dc.activeDialog.state['this.value']);

            return 'Valid';
        } else {
            return 'Invalid';
        }
    }

    async onRenderPromptAsync(dc, state, options, isRetry) {
        const channelId = dc.context.activity.channelId;
        // const channelId = "emulator";
        // const style = ChoiceFactoryOptions.style.suggestedAction;
        // const style = "default";
        var style = '';
        if (this._flow.Style === 'Carousel') {
            style = 'Carousel';
        } else if (this._flow.Style === 'suggestedAction') {
            style = 'suggestedAction';
        } else {
            style = 'default';
        }

        // const style = "suggestedAction";
        // Get base prompt text (if any)
        // const text = dc.context.activity.text || '';
        const res = this._flow.question || '';
        const expCondition = new StringExpression(res);
        const text = expCondition.getValue(state['this.options'].dictionary);

        // Create temporary msg
        let msg;

        switch (style) {
        case 'inline':
            msg = ChoiceFactory.inline(state.choices, text, null, options);
            break;

        case 'list':
            msg = ChoiceFactory.list(state.choices, text, null, options);
            break;

        case 'suggestedAction':
            msg = ChoiceFactory.suggestedAction(state.choices, text);
            break;

        case 'heroCard':
            msg = ChoiceFactory.heroCard(state.choices, text);
            break;

        case 'Carousel':
            // const attachments = this.getCurrentAttachments(dc);
            // msg = MessageFactory.carousel(attachments, text);
            msg = MessageFactory.carousel(state.HeroCards, text);
            // Create multiple Hero Cards
            // const heroCard1 = CardFactory.heroCard('Card 1 Title', 'Subtitle 1');
            // const heroCard2 = CardFactory.heroCard('Card 2 Title', 'Subtitle 2', ['https://example.com/image2.jpg']);
            // const heroCard3 = CardFactory.heroCard('Card 2 Title', 'Subtitle 2', ['https://example.com/image2.jpg']);
            // const heroCard4 = CardFactory.heroCard('Card 2 Title', 'Subtitle 2', ['https://example.com/image2.jpg']);

            // const attachments = [heroCard1, heroCard2,heroCard3,heroCard4]
            // msg = MessageFactory.carousel(attachments, text);

            break;

        default:
            msg = ChoiceFactory.forChannel(channelId, state.choices, text, null, options);
            break;
        }

        if (!isRetry) {
            msg.inputHint = 'expectingInput';
        }

        return msg;
    }

    getCurrentChoices(context) {
        const state = context.state;
        // const user = context.turnState.get('UserData').User;
        const showMore = 'OPT_SHOWMORE'; // Replace with your localization logic

        let index = state.index || 0;
        let newIndex = state.newIndex || 0;

        if (context.activity.text.toLowerCase() === showMore.toLowerCase()) {
            index = newIndex;
        }

        const choices = state.choices;
        const numToShow = Math.min(index + this.getNumToShow(context.activity.channelId), choices.length);
        const newChoices = choices.slice(index, numToShow);

        if (numToShow < choices.length) {
            newChoices.push({
                value: showMore
            });
            newIndex = numToShow;
        } else {
            newIndex = -1;
        }

        state.index = index;
        state.newIndex = newIndex;

        return newChoices;
    }

    getCurrentAttachments(dc) {
        const state = dc.activeDialog.state;
        // const user = context.turnState.get('UserData').User;

        // let index = state.index || 0;
        // let newIndex = state.newIndex || 0;
        let index = 0;
        let newIndex = 0;
        const showMore = 'OPT_SHOWMORE'; // Replace with your localization logic

        if (dc.context.activity.text.toLowerCase() === showMore.toLowerCase()) {
            index = newIndex;
        }

        const heroCards = state.HeroCards;
        const numToShow = Math.min(index + this.getNumToShow(dc.context.activity.channelId), heroCards.length);

        const attachments = [];
        for (let i = index; i < numToShow; i++) {
            if (heroCards[i]) {
                // attachments.push(heroCards[i].toAttachment());
                attachments.push(MessageFactory.attachment(heroCards[i]));
            }
        }

        const choices = state.choices;
        if (numToShow < choices.length) {
            attachments.push({
                buttons: [{
                    title: showMore,
                    type: ActionTypes.ImBack,
                    value: showMore
                }]
            });
            newIndex = numToShow;
        } else {
            newIndex = -1;
        }

        state.index = index;
        state.newIndex = newIndex;

        return attachments;
    }

    getNumToShow(channelId) {
        if (channelId.toLowerCase() === 'facebook') {
            return this.numToShowFB;
        } else if (channelId.toLowerCase() === 'directline') {
            return this.numToShowDL;
        } else {
            return this.numToShow;
        }
    }
}

module.exports.CustomChoiceDialog = CustomChoiceDialog;
