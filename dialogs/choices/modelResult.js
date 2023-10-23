/**
 * Outer result returned by an entity recognizer like `recognizeChoices()`.
 *
 * @remarks
 * This structure is wrapped around the recognized result and contains [start](#start) and
 * [end](#end) position information to identify the span of text in the user's utterance that was
 * recognized. The actual result can be accessed through the [resolution](#resolution) property.
 * @param T The type of entity/resolution being returned.
 */
class ModelResult {
    /**
     * Create a new ModelResult instance.
     * @param {string} text - Substring of the utterance that was recognized.
     * @param {number} start - Start character position of the recognized substring.
     * @param {number} end - End character position of the recognized substring.
     * @param {string} typeName - Type of entity that was recognized.
     * @param {T} resolution - The recognized entity.
     */
    constructor(text, start, end, typeName, resolution) {
        this.text = text;
        this.start = start;
        this.end = end;
        this.typeName = typeName;
        this.resolution = resolution;
    }
}

module.exports = ModelResult;
