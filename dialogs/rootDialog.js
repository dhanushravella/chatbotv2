// Create rootdialog calss file that will accept the json file path and will create the dialog set
// Create a dialog factory class that will create the dialog based on the json file
// Create a dialog class that will create the dialog based on the json file

const { Dialog, DialogSet, DialogTurnStatus, DialogContext, ComponentDialog } = require('botbuilder-dialogs');

// const fs = require('fs');
// const path = require('path');

// const { RootDialogDetail } = require('../models/rootDialogDetail');
const { DialogFactory } = require('./dialogFactory');
class RootDialog extends ComponentDialog {
    constructor(dialogId, accessor) {
        console.log('in root dialog');
        super(dialogId);
        // this._services = services;
        // this._services = null;
        // this._botDbService = services.get('IBotDbService');
        // this._dialogAccessor = services.get('IStatePropertyAccessor');
        // this._dialogs = new DialogSet(this._dialogAccessor);
        this._dialogs = new DialogSet(accessor);
        this._initialized = false;
    }

    async beginDialog(dc, options = null, cancellationToken = undefined) {
        // let fileName = '';
        console.log('*****In the root begin dailog*********');
        var context = dc.context;
        // console.log(context.turnState);
        // console.log('---------',context.turnState.UserData.user.senderData.info);
        const user = context.turnState.UserData.user.senderData;
        const flows = options;

        if (!flows || flows.length === 0) {
            throw new Error('Flow cannot be empty');
        }

        const newStateData = {
            dictionary: {
                user: user.info,
                basicInfo: user.info,
                channel: user.info.platform,
                emailId: user.OEMAILID,
                conversations: []
            },
            index: flows[0].objectId,
            conversationFlows: flows,
            currentFlow: flows[0]
        };

        const conversations = [];
        const dict = {};
        dict[user.name] = context.activity.text;
        conversations.push(dict);
        newStateData.dictionary[conversations] = conversations;
        dc.activeDialog.state.stateKey = newStateData;

        await this.ensureInitializedAsync(dc);
        return await this.continueActionsAsync(dc, options, cancellationToken);
    }

    async continueDialog(dc, cancellationToken = undefined) {
        await this.ensureInitializedAsync(dc);
        return await this.continueActionsAsync(dc, null, cancellationToken);
    }

    async ensureInitializedAsync(outerDc) {
        console.log('in ensureInitializedAsync');
        // if (!this._initialized) {
        //     this._initialized = true;
        console.log('++++++ ', outerDc.activeDialog.state);
        const flowData = outerDc.activeDialog.state.stateKey;
        // console.log('@@@@@@@@@@@@@@@@: ',flowData);
        const flows = flowData.conversationFlows;
        const factory = new DialogFactory(flows);

        for (const flow of flows) {
            // this._dialogs.add(factory.createDialog(flow, this._services));
            this._dialogs.add(factory.createDialog(flow, null));
        }
        // }
    }

    async continueActionsAsync(dc, options, cancellationToken) {
        // console.log('++++>>>>: ',dc.activeDialog.state.stateKey);
        const innerDc = this.createInnerDc(dc, dc.activeDialog);
        // console.log();
        const flowData = dc.activeDialog.state.stateKey;
        // console.log(flowData);
        let flow = flowData.currentFlow;
        while (flow !== undefined) {
            let result = null;

            if (!innerDc.activeDialog) {
                console.log('begin inner DC');
                innerDc.user = dc.activeDialog.state.stateKey.dictionary;
                result = await innerDc.beginDialog(flow.objectId, flowData);
            } else {
                console.log('continue inner DC');
                result = await innerDc.continueDialog(cancellationToken);
            }

            console.log('this is result: ', result);

            if (result.status === DialogTurnStatus.waiting) {
                return result;
            }
            this.SetProperty(flowData, result);

            let option = null;
            if (result?.result !== null && flowData.currentFlow.options !== null) {
                // option = flowData.currentFlow.options.find(x => x.validation !== null && x.validation.toString().toLowerCase() === result.result.toString().toLowerCase());
                try {
                    if (flowData.currentFlow.type !== undefined && flowData.currentFlow.type.toString().toLowerCase() === 'choicedialog') {
                        option = option || flowData.currentFlow.options.find(x => x.answer !== null && x.answer.toString().toLowerCase() === result.result.answer.toString().toLowerCase());
                    } else {
                        option = option || flowData.currentFlow.options.find(x => x.answer !== null && x.answer.toString().toLowerCase() === result.result.toString().toLowerCase());
                    }
                } catch (error) {
                    option = null;
                }
            }

            option = option || (flowData.currentFlow.options ? flowData.currentFlow.options[0] : null);

            // TODO: refactor code; to be handled in ChoiceInputDialog
            // eslint-disable-next-line no-undef
            if (flow.type?.toLowerCase() === 'choiceinputdialog' && flow.style === ChoiceInputStyle.Carousel) {
                const requestIndex = dc.context.activity.text.split('.');
                if (requestIndex.length > 1) {
                    const isParseSuccess = !isNaN(requestIndex[1]);
                    if (isParseSuccess) {
                        const choiceIndex = parseInt(requestIndex[1]) - 1; // zero indexing
                        option = flowData.currentFlow.options[choiceIndex];
                    }
                }
            }

            flowData.currentFlow = flowData.conversationFlows.find(x => x.objectId === option.nextQuestion);
            flow = flowData.currentFlow;
            console.log('this is flow in while loop: ', flow);
        }

        return await this.onEndOfActionsAsync(dc, cancellationToken);
    }

    createInnerDc(context, instance) {
        if (!instance) {
            const dialogInstance = { state: {} };
            instance = dialogInstance;
        }

        const PERSISTED_DIALOG_STATE = 'dialogs'; // Replace with your constant if needed
        const dialogState = instance.state[PERSISTED_DIALOG_STATE] || { dialogStack: [] };
        instance.state[PERSISTED_DIALOG_STATE] = dialogState;

        // Assuming this.dialogs is defined elsewhere
        return new DialogContext(this._dialogs, context, dialogState);
    }

    SetProperty(flowData, result) {
        if (flowData.currentFlow.property !== null) {
            console.log(typeof flowData.currentFlow.property);
            if (typeof flowData.currentFlow.property === 'object') {
                for (let i = 0; i <= flowData.currentFlow.property.length; i++) {
                    if (result.result !== null) {
                        // eslint-disable-next-line no-prototype-builtins
                        if (flowData.dictionary.hasOwnProperty(flowData.currentFlow.property[i])) {
                            flowData.dictionary[flowData.currentFlow.property[i]] = result.result[i];
                        } else {
                            flowData.dictionary[flowData.currentFlow.property[i]] = result.result[i];
                        }
                    } else {
                        // eslint-disable-next-line no-prototype-builtins
                        if (flowData.dictionary.hasOwnProperty(flowData.currentFlow.property[i])) {
                            flowData.dictionary[flowData.currentFlow.property[i]] = result.result;
                        } else {
                            flowData.dictionary[flowData.currentFlow.property[i]] = result.result;
                        }
                    }
                }
            } else {
                // eslint-disable-next-line no-prototype-builtins
                if (flowData.dictionary.hasOwnProperty(flowData.currentFlow.property)) {
                    flowData.dictionary[flowData.currentFlow.property] = result.result;
                } else {
                    flowData.dictionary[flowData.currentFlow.property] = result.result;
                }
            }
        }
    }

    async onEndOfActionsAsync(actionContext, cancellationToken = undefined) {
        return await actionContext.endDialog();
    }

    async resumeDialogAsync(outerDc, reason, result = null, cancellationToken = undefined) {
        if (result) {
            throw new Error(' cannot be a cancellation token');
        }

        await this.ensureInitializedAsync(outerDc);

        await this.repromptDialogAsync(outerDc.context, outerDc.activeDialog, cancellationToken);
        return Dialog.endOfTurn;
    }

    async repromptDialogAsync(turnContext, instance, cancellationToken = undefined) {
        const innerDc = this.createInnerDc(turnContext, instance);
        await innerDc.repromptDialogAsync(cancellationToken);
    }

    async endDialog(turnContext, instance, reason, cancellationToken = undefined) {
        return await super.endDialog(turnContext, instance, reason, cancellationToken);
    }

    getUser(context) {
        return context.turnState.get('UserData').user;
    }
}

module.exports.RootDialog = RootDialog;
