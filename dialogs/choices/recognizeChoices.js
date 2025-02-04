const Recognizers = require('@microsoft/recognizers-text-number');
const { findChoices, FindChoicesOptions } = require('./findChoices');
const { ModelResult } = require('./modelResult');

/**
 * High-level function for recognizing a choice in a user's utterance.
 *
 * @remarks
 * This is layered above the `findChoices()` function and adds logic to let the user specify their
 * choice by index (they can say "one" to pick `choice[0]`) or ordinal position (they can say "the
 * second one" to pick `choice[1]`.) The user's utterance is recognized in the following order:
 *
 * - By name using `findChoices()`.
 * - By 1's based ordinal position.
 * - By 1's based index position.
 *
 * @param utterance The text or user utterance to search over. For an incoming 'message' activity, you can simply use `context.activity.text`.
 * @param choices List of choices to search over.
 * @param options (Optional) options used to tweak the search that's performed.
 */
async function recognizeChoices(utterance, choices, options) {
    function matchChoiceByIndex(match) {
        try {
            const index = parseInt(match.resolution.value, 10) - 1;
            if (index >= 0 && index < list.length) {
                const choice = list[index];
                matched.push({
                    start: match.start,
                    end: match.end,
                    typeName: 'choice',
                    text: match.text,
                    resolution: {
                        value: choice.value,
                        index: index,
                        score: 1
                    }
                });
            }
        } catch (e) {
            // noop
            // TODO: Should this log an error or do something?
        }
    }

    // Normalize choices
    const list = (choices || []).map(
        (choice) => (typeof choice === 'string' ? { value: choice } : choice)
    ).filter(
        (choice) => choice // TODO: does this do anything?
    );

    // Try finding choices by text search first
    // - We only want to use a single strategy for returning results to avoid issues where utterances
    //   like "the third one" or "the red one" or "the first division book" would miss-recognize as
    //   a numerical index or ordinal as well.
    const locale = options && options.locale ? options.locale : 'en-us';
    let matched = findChoices(utterance, list, options);
    if (matched.length === 0) {
        // Next, try finding by ordinal
        const ordinals = Recognizers.recognizeOrdinal(utterance, locale);
        if (ordinals.length > 0) {
            ordinals.forEach(matchChoiceByIndex);
        } else {
            // Finally, try by numerical index
            Recognizers.recognizeNumber(utterance, locale).forEach(matchChoiceByIndex);
        }

        // Sort any found matches by their position within the utterance.
        // - The results from findChoices() are already properly sorted, so we just need this
        //   for ordinal & numerical lookups.
        matched = matched.sort((a, b) => a.start - b.start);
    }

    return matched;
}
module.exports = { recognizeChoices };
