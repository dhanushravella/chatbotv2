const { defaultTokenizer, TokenizerFunction } = require('./tokenizer');

/**
 * Basic search options used to control how choices are recognized in a user's utterance.
 */
class FindValuesOptions {
    /**
     * (Optional) if true, then only some of the tokens in a value need to exist to be considered a match. The default value is "false".
     * @param allowPartialMatches
     * @param locale
     * @param maxTokenDistance
     * @param tokenizer
     */
    constructor(allowPartialMatches, locale, maxTokenDistance, tokenizer) {
        this.allowPartialMatches = allowPartialMatches || false;
        this.locale = locale || 'en-US';
        this.maxTokenDistance = maxTokenDistance || 2;
        this.tokenizer = tokenizer || defaultTokenizer;
    }
}

/**
 * INTERNAL: Raw search result returned by `findValues()`.
 */
class FoundValue {
    /**
     * The value that was matched.
     * @param value
     * @param index
     * @param score
     */
    constructor(value, index, score) {
        this.value = value;
        this.index = index;
        this.score = score;
    }
}

/**
 * INTERNAL: A value that can be sorted and still refer to its original position within a source array.
 * The `findChoices()` function expands the passed-in choices to individual `SortedValue` instances and passes them to `findValues()`.
 * Each individual `Choice` can result in multiple synonyms that should be searched for, so this data structure lets us pass each synonym as a value to search while maintaining the index of the choice that value came from.
 */
class SortedValue {
    /**
     * The value that will be sorted.
     * @param value
     * @param index
     */
    constructor(value, index) {
        this.value = value;
        this.index = index;
    }
}

/**
 * INTERNAL: Low-level function that searches for a set of values within an utterance. Higher-level functions like `findChoices()` and `recognizeChoices()` are layered above this function.
 * @param utterance The text or user utterance to search over.
 * @param values List of values to search over.
 * @param options (Optional) options used to tweak the search that's performed.
 */
function findValues(utterance, values, options) {
    function indexOfToken(token, startPos) {
        for (let i = startPos; i < tokens.length; i++) {
            if (tokens[i].normalized === token.normalized) {
                return i;
            }
        }

        return -1;
    }

    function matchValue(index, value, vTokens, startPos) {
        let matched = 0;
        let totalDeviation = 0;
        let start = -1;
        let end = -1;
        vTokens.forEach((token) => {
            const pos = indexOfToken(token, startPos);
            if (pos >= 0) {
                const distance = matched > 0 ? pos - startPos : 0;
                if (distance <= maxDistance) {
                    matched++;
                    totalDeviation += distance;
                    startPos = pos + 1;
                    if (start < 0) { start = pos; }
                    end = pos;
                }
            }
        });

        let result;
        if (matched > 0 && (matched === vTokens.length || opt.allowPartialMatches)) {
            const completeness = matched / vTokens.length;
            const accuracy = matched / (matched + totalDeviation);
            const score = completeness * accuracy;

            result = {
                start: start,
                end: end,
                typeName: 'value',
                resolution: {
                    value: value,
                    index: index,
                    score: score
                }
            };
        }

        return result;
    }

    const list = values.sort((a, b) => b.value.length - a.value.length);
    let matches = [];
    const opt = options || {};
    const tokenizer = opt.tokenizer || defaultTokenizer;
    const tokens = tokenizer(utterance, opt.locale);
    const maxDistance = opt.maxTokenDistance !== undefined ? opt.maxTokenDistance : 2;
    list.forEach((entry) => {
        let startPos = 0;
        const vTokens = tokenizer(entry.value.trim(), opt.locale);
        while (startPos < tokens.length) {
            const match = matchValue(entry.index, entry.value, vTokens, startPos);
            if (match) {
                startPos = match.end + 1;
                matches.push(match);
            } else {
                break;
            }
        }
    });

    matches = matches.sort((a, b) => b.resolution.score - a.resolution.score);

    const results = [];
    const foundIndexes = {};
    const usedTokens = {};
    matches.forEach((match) => {
        let add = !foundIndexes.hasOwnProperty(match.resolution.index);
        for (let i = match.start; i <= match.end; i++) {
            if (usedTokens[i]) {
                add = false;
                break;
            }
        }

        if (add) {
            foundIndexes[match.resolution.index] = true;
            for (let i = match.start; i <= match.end; i++) { usedTokens[i] = true; }

            match.start = tokens[match.start].start;
            match.end = tokens[match.end].end;
            match.text = utterance.substring(match.start, match.end + 1);
            results.push(match);
        }
    });

    return results.sort((a, b) => a.start - b.start);
}

module.exports = {
    FindValuesOptions,
    FoundValue,
    SortedValue,
    findValues
};
