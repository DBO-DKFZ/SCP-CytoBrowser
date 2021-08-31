const filters = (function () {
    "use strict";


    const tokenTypes = {
        and: Symbol("Intersection"),
        or: Symbol("Union"),
        not: Symbol("Negation"),
        eq: Symbol("Equality"),
        gt: Symbol("Greater than"),
        lt: Symbol("Less than"),
        key: Symbol("Key"),
        boolValue: Symbol("Boolean value"),
        stringValue: Symbol("String value"),
        numberValue: Symbol("Number value"),
        leftP: Symbol("Left parenthesis"),
        rightP: Symbol("Right parenthesis")
    };

    const tokenExp = /\s*(("[^"]*")|('[^']*')|([a-zA-Z]+)|(-?\d+(\.\d+)?)|[^\s\da-zA-Z])\s*/g;
    const keyExp = /^[a-zA-Z]+\S*$/;
    const boolValueExp = /^(false)|(true)$/;
    const stringValueExp = /^(("[^"]*")|('[^']*'))$/;
    const numberValueExp = /^-?\d+(\.\d+)?$/;

    function getTokenType(token) {
        switch (token) {
            case "AND":
            case "and":
                return tokenTypes.and;
            case "OR":
            case "or":
                return tokenTypes.or;
            case "NOT":
            case "not":
                return tokenTypes.not;
            case "=":
            case "IS":
            case "is":
                return tokenTypes.eq;
            case ">":
                return tokenTypes.gt;
            case "<":
                return tokenTypes.lt;
            case "(":
            case "[":
                return tokenTypes.leftP;
            case ")":
            case "]":
                return tokenTypes.rightP;
            default:
                if (boolValueExp.test(token)) {
                    return tokenTypes.boolValue;
                }
                else if (keyExp.test(token)) {
                    return tokenTypes.key;
                }
                else if (stringValueExp.test(token)) {
                    return tokenTypes.stringValue;
                }
                else if (numberValueExp.test(token)) {
                    return tokenTypes.numberValue;
                }
                else {
                    throw new Error(`Unexpected token: '${token}'`);
                }
        }
    }

    class Filter {
        evaluate(input) {
            return true;
        }
    }

    class NegationFilter extends Filter {
        constructor(operand) {
            super();
            this.operand = operand;
        }

        evaluate(input) {
            return !this.operand.evaluate(input);
        }
    }

    class IntersectionFilter extends Filter {
        constructor(lhs, rhs) {
            super();
            this.lhs = lhs;
            this.rhs = rhs;
        }

        evaluate(input) {
            return this.lhs.evaluate(input) && this.rhs.evaluate(input);
        }
    }

    class UnionFilter extends Filter {
        constructor(lhs, rhs) {
            super();
            this.lhs = lhs;
            this.rhs = rhs;
        }

        evaluate(input) {
            return this.lhs.evaluate(input) || this.rhs.evaluate(input);
        }
    }

    class EqualityFilter extends Filter {
        constructor(key, value) {
            super();
            this.key = key;
            this.value = value;
        }

        evaluate(input) {
            return input[this.key] === this.value.evaluate(input);
        }
    }

    class GreaterThanFilter extends Filter {
        constructor(key, value) {
            super();
            this.key = key;
            this.value = value;
        }

        evaluate(input) {
            return input[this.key] > this.value.evaluate(input);
        }
    }

    class LessThanFilter extends Filter {
        constructor(key, value) {
            super();
            this.key = key;
            this.value = value;
        }

        evaluate(input) {
            return input[this.key] < this.value.evaluate(input);
        }
    }

    class FilterValue {
        constructor(value) {
            this.value = value;
        }

        evaluate(input) {
            return this.value;
        }
    }

    class FilterKeyValue extends FilterValue {
        constructor(value) {
            super(value);
        }

        evaluate(input) {
            return input[this.value];
        }
    }

    function getPrimitiveFilterConstructor(token) {
        switch (token.type) {
            case tokenTypes.eq:
                return EqualityFilter;
            case tokenTypes.gt:
                return GreaterThanFilter;
            case tokenTypes.lt:
                return LessThanFilter;
            default:
                throw new Error(`Expected '=', '>' or '<', got '${token.value}'`);
        }
    }

    function getCombinedFilterConstructor(token) {
        switch (token.type) {
            case tokenTypes.and:
                return IntersectionFilter;
            case tokenTypes.or:
                return UnionFilter;
            default:
                throw new Error(`Expected 'AND' or 'OR', got '${token.value}'`);
        }
    }

    function getPrimitiveValue(token) {
        if (!token) {
            throw new Error("Expected a string, a boolean, a number, or a key");
        }
        switch (token.type) {
            case tokenTypes.boolValue:
                return new FilterValue(token.value === "true");
            case tokenTypes.stringValue:
                return new FilterValue(token.value.slice(1, -1));
            case tokenTypes.numberValue:
                return new FilterValue(Number(token.value));
            case tokenTypes.key:
                return new FilterKeyValue(token.value);
            default:
                throw new Error(`Expected a string, a boolean, a number, or a key, got '${token.value}'`);
        }
    }

    function tokenizeQuery(query) {
        const rawTokens = query.match(tokenExp);
        if (rawTokens) {
            const tokenInfo = rawTokens.map(rawToken => {
                const value = rawToken.trim();
                const type = getTokenType(value);
                return {
                    value: value,
                    type: type
                };
            });
            return tokenInfo;
        }
        else {
            return [];
        }
    }

    function parsePrimitiveSubfilter(key, tokens) {
        const operationToken = tokens.shift();
        const filterConstructor = getPrimitiveFilterConstructor(operationToken);
        const rhsToken = tokens.shift();
        const rhsValue = getPrimitiveValue(rhsToken);
        const filter = new filterConstructor(key, rhsValue);
        if (tokens.length === 0 || tokens[0].type === tokenTypes.rightP) {
            return filter;
        }
        else {
            return parseCombinedSubfilter(filter, tokens);
        }
    }

    function parseCombinedSubfilter(filter, tokens) {
        const operationToken = tokens.shift();
        const filterConstructor = getCombinedFilterConstructor(operationToken);
        const rhs = parseFilter(tokens);
        return new filterConstructor(filter, rhs);
    }

    function parseParenthesizedSubfilter(tokens) {
        const filter = parseFilter(tokens);
        const rightParenthesis = tokens.shift();
        if (!rightParenthesis) {
            throw new Error("Expected ')'");
        }
        else if (rightParenthesis.type === tokenTypes.rightP) {
            if (tokens.length === 0) {
                return filter;
            }
            else {
                return parseCombinedSubfilter(filter, tokens);
            }
        }
        else {
            throw new Error(`Expected ')', got '${rightParenthesis.value}'`);
        }
    }

    function parseFilter(tokens) {
        const token = tokens.shift();
        if (!token) {
            throw new Error("Expected key, '(', or 'NOT'");
        }
        else if (token.type === tokenTypes.not) {
            const negatedFilter = parseFilter(tokens);
            return new NegationFilter(negatedFilter);
        }
        else if (token.type === tokenTypes.leftP) {
            return parseParenthesizedSubfilter(tokens);
        }
        else if (token.type === tokenTypes.key) {
            return parsePrimitiveSubfilter(token.value, tokens);
        }
        else {
            throw new Error(`Expected key, '(', or 'NOT', got '${token.value}'`);
        }
    }

    function getFilterFromQuery(query) {
        const tokens = tokenizeQuery(query);
        if (tokens.length === 0) {
            return new Filter(); // Trivial, all-passing filter
        }
        else {
            const filter = parseFilter(tokens);
            if (tokens.length === 0) {
                return filter;
            }
            else {
                const unexpectedToken = tokens.shift();
                throw new Error(`Unexpected '${unexpectedToken.value}'`);

            }
        }
    }

    /**
     * Create an object that contains the filterable properties of an
     * annotation.
     * @param {annotationHandler.Annotation} annotation The annotation to be
     * processed.
     * @return {Object} The processed object.
     */
    function preprocessDatumBeforeFiltering(annotation) {
        return {
            class: annotation.mclass,
            author: annotation.author,
            comments: annotation.comments ? annotation.comments.length : 0,
            bookmarked: annotation.bookmarked,
            region: annotation.points.length > 1,
            marker: annotation.points.length === 1,
            x: annotation.centroid.x,
            y: annotation.centroid.y,
            z: annotation.z,
        };
    }

    return {
        getFilterFromQuery: getFilterFromQuery,
        preprocessDatumBeforeFiltering: preprocessDatumBeforeFiltering
    };
})();
