// Copyright 2013 Lauren Sperber
// https://github.com/lauren/specify-me/blob/master/LICENSE
//
// A more efficient way to calculate selector specificity. If you want to preserve the
// hierarchy of the inputted selectors, try the version called
// specificity-calculator-with-hierarchy.js

;(function (exports) {
  // does not include the :not pseudoclass, which does not contribute to specificity calc
  var pseudoClasses = [":link", ":visited", ":hover", ":active", ":target", ":lang", ":focus",
                       ":enabled", ":disabled", ":checked", ":indeterminate", ":root", ":nth-child",
                       ":nth-last-child", ":nth-of-type", ":nth-last-of-type", ":first-child",
                       ":last-child", ":first-of-type", ":last-of-type", ":only-child",
                       ":only-of-type", ":empty"],
      pseudoElements = ["::first-line", "::first-letter", "::before", "::after"],
      delimiterRegex = /(\.|#|:|\[|\*|\+|\<|\>|\~|\s)/,
      specialCharRegex = /^(\*|\+|\<|\>|\~|\s)+/;

  // checks if input is an array of selectors or a single selector and routes it appropriately
  var inputRouter = function (input) {
    return (typeof input === "string") ?
      calculateSpecificity(input) :
      getSpecificities(input);
  };

  // takes an array of selectors and returns an array with the specificity of each
  var getSpecificities = function (array) {
    return array.map(calculateSpecificity);
  };

  // takes a single selector string, passes to parser, then calculates specificity
  // of resulting object
  var calculateSpecificity = function (selectors) {
    var selectorObject = parseSelectors(selectors),
        specificity = {
          score: [0,0,0],
          components: {
            ids: [],
            elementsAndPseudoElements: [],
            classesPseudoClassesAndAttributes: []
          }
        };
    for (type in selectorObject) {
      switch (type) {
        case "nodes": case "pseudoElements":
          specificity.score[2] += selectorObject[type].length;
          specificity.components.elementsAndPseudoElements =
            specificity.components.elementsAndPseudoElements.concat(selectorObject[type]);
          break;
        case "classes": case "pseudoClasses": case "attributes":
          specificity.score[1] += selectorObject[type].length;
          specificity.components.classesPseudoClassesAndAttributes =
            specificity.components.classesPseudoClassesAndAttributes.concat(selectorObject[type]);
          break;
        case "ids":
          specificity.score[0] += selectorObject[type].length;
          specificity.components.ids = selectorObject[type];
          break;
      }
    }
    return specificity;
  };

  var stripSpecialChars = function (string) {
    return string.replace(specialCharRegex, "");
  };

  var lex = function (s) {
    s = stripSpecialChars(s);

    if (s.length === 0) return [];

    var next = s.slice(1).search(delimiterRegex),
        next = (next >= 0) ? next + 1 : s.length,
        token = s.slice(0, next).replace(/\(|\)/, ""),
        rest  = s.slice(next);

    return [token].concat(lex(rest));
  };

  function parse(tokens) {
    var categorizedTokens = {
      ids: [],
      classes: [],
      attributes: [],
      pseudos: [],
      pseudoClasses: [],
      pseudoElements: [],
      nodes: [],
      wildcardAndCombinators: []
    }

    return tokens.reduce(function (acc, token) {
      acc[stringType(token)].push(token);
      return acc;
    }, categorizedTokens);
  }

  // takes a selector string and returns an object with properties for each
  // possible subselector type. the properties will contain an array of all matching
  // selectors.
  var parseSelectors = function (string) {
    var subselectors = parse(lex(string));
    validatePseudos(subselectors);
    return subselectors;
  };

  // takes a string and returns what type of selector it is based on the first char
  var stringType = function (string) {
    switch(string.charAt(0)) {
      case "*": case "+": case "~": case "<": case ">":
        return "wildcardAndCombinators";
        break;
      case "#":
        return "ids";
        break;
      case ".":
        return "classes";
        break;
      case "[":
        return "attributes";
        break;
      case ":":
        return "pseudos";
        break;
      default:
        return "nodes";
        break;
    }
  };

  // takes a selector object. parses argument parens and pseudos they contain
  // out of pseudos if necessary, then checks each pseudo to categorize it as
  // a pseudo-element or pseudo-class and deletes the irrelevant pseudos property
  var validatePseudos = function (object) {
    if (object.pseudos) {
      for (var i = 0; i < object.pseudos.length; i++) {
        if (inArray(pseudoElements, ":" + object.pseudos[i])) {
          object.pseudoElements.push(":" + object.pseudos[i]);
        } else if (inArray(pseudoClasses, object.pseudos[i])) {
          object.pseudoClasses.push(object.pseudos[i]);
        }
      }
      delete object.pseudos;
    }
  };

  // because IE doesn't like indexOf
  var inArray = function (array,object) {
    for (var i = 0; i < array.length; i++) {
      if(array[i] === object) {
          return true;
      }
    };
    return false;
  };

  // Shims

  if (Array.prototype.map === undefined) {
    Array.prototype.map = function(fn) {
      var res = [];
      for (var i = 0, len = this.length; i < len; i++) {
        res.push(fn(this[i]));
      }
      return res;
    }
  }

  if (Array.prototype.reduce === undefined) {
    Array.prototype.reduce = function(fn, acc) {
      if (this.length === 0 && acc === undefined) {
        throw new TypeError("Reduce of empty array with no initial value");
      }

      var i = 0;

      if (acc === undefined) {
        acc = this[0];
        i = 1;
      }

      for (var len=this.length; i < len; i++) {
        acc = fn(acc, this[i]);
      }

      return acc;
    }
  }

  exports.specifyMe = inputRouter;

})(this);
