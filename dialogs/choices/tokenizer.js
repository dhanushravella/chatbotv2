/**
 * Individual token returned by a `TokenizerFunction`.
 */
class Token {
}

/**
 * Signature for an alternate word breaker that can be passed to `recognizeChoices()`,
 * `findChoices()`, or `findValues()`.
 *
 * @param text The text to be tokenized.
 * @param locale (Optional) locale of the text if known.
 */
function TokenizerFunction(text, locale) {
    return [];
}

/**
 * Simple tokenizer that breaks on spaces and punctuation.
 *
 * The only normalization done is to lowercase the tokens. Developers can wrap this tokenizer with
 * their own function to perform additional normalization like stemming.
 *
 * @param text The text to tokenize.
 * @param locale (Optional) locale of the text if known.
 */
function defaultTokenizer(text, locale) {
    const tokens = [];
    let token;
    function appendToken(end) {
        if (token) {
            token.end = end;
            token.normalized = token.text.toLowerCase();
            tokens.push(token);
            token = undefined;
        }
    }

    // Parse text
    const length = text ? text.length : 0;
    let i = 0;
    while (i < length) {
        // Get both the UNICODE value of the current character and the complete character itself
        // which can potentially be multiple segments.
        const codePoint = text.codePointAt(i) || text.charCodeAt(i);
        const chr = String.fromCodePoint(codePoint);

        // Process current character
        if (isBreakingChar(codePoint)) {
            // Character is in Unicode Plane 0 and is in an excluded block
            appendToken(i - 1);
        } else if (codePoint > 0xFFFF) {
            // Character is in a Supplementary Unicode Plane. This is where emoji live so
            // we're going to just break each character in this range out as its own token.
            appendToken(i - 1);
            tokens.push({
                start: i,
                end: i + (chr.length - 1),
                text: chr,
                normalized: chr
            });
        } else if (!token) {
            // Start a new token
            token = { start: i, text: chr };
        } else {
            // Add on to the current token
            token.text += chr;
        }
        i += chr.length;
    }
    appendToken(length - 1);

    return tokens;
}

/**
 * @private
 * @param codePoint Number of the character
 */
function isBreakingChar(codePoint) {
    return (
        isBetween(codePoint, 0x0000, 0x002F) ||
        isBetween(codePoint, 0x003A, 0x0040) ||
        isBetween(codePoint, 0x005B, 0x0060) ||
        isBetween(codePoint, 0x007B, 0x00BF) ||
        isBetween(codePoint, 0x02B9, 0x036F) ||
        isBetween(codePoint, 0x2000, 0x2BFF) ||
        isBetween(codePoint, 0x2E00, 0x2E7F)
    );
}

/**
 * @private
 * @param value Number value
 * @param from Low range
 * @param to High range
 */
function isBetween(value, from, to) {
    return value >= from && value <= to;
}

module.exports = {
    Token,
    TokenizerFunction,
    defaultTokenizer
};
