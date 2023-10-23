const { Dialog } = require('botbuilder-dialogs');
const { StringExpression } = require('adaptive-expressions');

class IfElseDialog extends Dialog {
    constructor(flow, services) {
        super(flow.objectId);
        this.flow = flow;
    }

    async beginDialog(dc, options = null) {
        let result = false;
        const flowData = options;
        const expCondition = new StringExpression(this.flow.condition);
        const res = expCondition.getValue(flowData.dictionary);

        if (res !== null && res === 'true') {
            result = true;
        }

        return await dc.endDialog(result);
    }
}

module.exports.IfElseDialog = IfElseDialog;
