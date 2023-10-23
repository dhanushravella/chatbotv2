const { CustomChoiceDialog } = require('./choiceDialog');
const { CustomInputDialog } = require('./inputDialog');
const { CustomTextDialog } = require('./textDialog');
const { CustomApiDialog } = require('./callApiDialog');
const { AdaptiveCardDialog } = require('./adaptiveCardDialog');
const { TextListDialog } = require('./textListDialog');
const { CustomConfirmationPrompt } = require('./confirmationPrompt');
const { CustomAdaptiveCardDialog } = require('./adaptiveCardDialog');
const { CustomEntityDialog } = require('./entityDialog');
const { IfElseDialog } = require('./ifElseDialog');
const { SetPropertyDialog } = require('./setPropertyDialog');
const { NotificationDialog } = require('./notificationDialog');
const { Dialog } = require('botbuilder-dialogs');

class DialogFactory extends Dialog {
    // constructor(flow, services) {
    //     super(flow.objectId);
    //     this._flow = flow;
    //     // this._services = services;
    //     this._services = null;
    // }

    createDialog(flow, userState, services) {
        console.log('+++++++++++++++++', flow);
        switch (flow.type?.toLowerCase()) {
        case 'choicedialog':
            return new CustomChoiceDialog(flow, services);
        case 'inputdialog':
            return new CustomInputDialog(flow, services);
        case 'textdialog':
            return new CustomTextDialog(flow, services);
        case 'callapi':
            console.log('in call api');
            return new CustomApiDialog(flow, services);
        case 'adaptivecard':
            console.log('in adaptive card D factory');
            return new AdaptiveCardDialog(flow, services);
        case 'textlistdialog':
            console.log('in textlist card D factory');
            return new TextListDialog(flow, services);
        case 'confirmationdialog':
            return new CustomConfirmationPrompt(flow, services);
        case 'adaptivecarddialog':
            return new CustomAdaptiveCardDialog(flow, services);
        case 'entitydialog':
            return new CustomEntityDialog(flow, services);
        case 'ifelsedialog':
            return new IfElseDialog(flow, services);
        case 'setpropertydialog':
            return new SetPropertyDialog(flow, services);
        case 'notificationdialog':
            return new NotificationDialog(flow, services);
        default:
            throw new Error('Type is not implemented yet');
        }
    }
}

module.exports.DialogFactory = DialogFactory;
