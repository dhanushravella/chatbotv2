const { findValues, FindValuesOptions, FoundValue, SortedValue } = require('./findValues');
const { ModelResult } = require('./modelResult');

/**
 * An instance of a choice that can be used to render a choice to a user or recognize something a
 * user picked.
 */
class Choice {
    /**
     * Value to return when recognized by `findChoices()`. Will also be used to render choices
     * to the user if no [action](#action) is provided.
     */
    constructor(value, action, synonyms) {
        this.value = value;
        this.action = action;
        this.synonyms = synonyms;
    }
}

/**
 * Options to control the recognition performed by `findChoices()`.
 */
class FindChoicesOptions extends FindValuesOptions {
    /**
     * (Optional) If `true`, the choices `value` field will NOT be search over. Defaults to `false`.
     */
    constructor(noValue, noAction) {
        super();
        this.noValue = noValue || false;
        this.noAction = noAction || false;
    }
}

/**
 * Result returned by `findChoices()`.
 */
class FoundChoice {
    /**
     * The value of the choice that was matched.
     * @param value
     * @param index
     * @param score
     * @param synonym
     */
    constructor(value, index, score, synonym) {
        this.value = value;
        this.index = index;
        this.score = score;
        this.synonym = synonym;
    }
}

/**
 * Mid-level search function for recognizing a choice in an utterance.
 * @param utterance The text or user utterance to search over.
 * @param choices List of choices to search over.
 * @param options (Optional) options used to tweak the search that's performed.
 */
function findChoices(utterance, choices, options) {
    const opt = options || {};

    // Normalize choices
    const list = (choices || []).map((choice) => (typeof choice === 'string' ? new Choice(choice) : choice));

    // Build up a full list of synonyms to search over.
    // - Each entry in the list contains the index of the choice it belongs to, which will later be
    //   used to map the search results back to their choice.
    const synonyms = [];
    list.forEach((choice, index) => {
        // if (!opt.noValue) synonyms.push({ value: choice.value, index });
        if (choice && choice.answer && !opt.noAction) synonyms.push({ value: choice.answer, index });
        (choice.synonyms || []).forEach((synonym) => synonyms.push({ value: synonym, index }));
    });

    // Find synonyms in utterance and map back to their choices
    return findValues(utterance, synonyms, options).map((v) => {
        const choice = list[v.resolution.index];

        return new FoundChoice(choice.value, v.resolution.index, v.resolution.score, v.resolution.value);
    });
}

module.exports = {
    Choice,
    FindChoicesOptions,
    FoundChoice,
    findChoices
};
