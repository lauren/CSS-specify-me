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
      idDelimiterRegex = /(\.|:|\[|\*|\+|\<|\>|\~|\s)/,
      specialCharRegex = /(\*|\+|\<|\>|\~|\s)/;

  // checks if input is an array of selectors or a single selector and routes it appropriately
  var inputRouter = function (input) {
    if (typeof input === "string") {
      return calculateSpecificity(input);
    } else {
      return getSpecificities(input);
    }
  };

  // takes an array of selectors and returns an array with the specificity of each
  var getSpecificities = function (array) {
    var specificities = [],
        specificityGetter = function (thisArray) {
          if (thisArray.length === 0) {
            return specificities;
          } else {
            specificities.push(calculateSpecificity(thisArray[0]));
            if (thisArray.length > 1) {
              specificityGetter(thisArray.slice(1,thisArray.length));
            } 
          }
          return specificities;
        }
    return specificityGetter(array);
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

  // takes a selector string and returns an object with properties for each
  // possible subselector type. the properties will contain an array of all matching
  // selectors.
  var parseSelectors = function (string) {
    var subselectors = {
      ids: [],
      classes: [],
      attributes: [],
      pseudos: [],
      pseudoClasses: [],
      pseudoElements: [],
      nodes: [],
      wildcardAndCombinators: []
    },
      parser = function (string) {
        string = specialCharStripper(string);
        if (string.length === 0) {
          return;
        } else {
          var type = stringType(string),
            next = (string.charAt(0) === "#")
              ? string.slice(1,string.length).search(idDelimiterRegex)
              : string.slice(1,string.length).search(delimiterRegex),
            subselector;
          next = (next >= 0) ? next : string.length;
          subselector = string.slice(0,next+1);
          subselectors[type].push(subselector);
          parser(string.slice(next+1,string.length));
        }
      },
      specialCharStripper = function (string) {
        return (specialCharRegex.test(string.slice(0,1)))
        ? specialCharStripper(string.slice(1,string.length))
        : string;
      };
    parser(string);
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
        if (/(\(|\))/.test(object.pseudos[i])) {
          var pseudosArray = object.pseudos[i].split(/(\(|\))/g);
          object.pseudos[i] = pseudosArray[0];
          findPseudos(pseudosArray.slice(1,pseudosArray.length));
        }
        if (inArray(pseudoElements, ":" + object.pseudos[i])) { 
          object.pseudoElements.push(":" + object.pseudos[i]);
        } else if (inArray(pseudoClasses, object.pseudos[i])) {
          object.pseudoClasses.push(object.pseudos[i]);
        }
      }
      delete object.pseudos;
    }
  };

  // checks an array for pseudos
  var findPseudos = function (array, object) {
    for (var i = 0; i < array.length; i++) {
      if (array[i].charAt[0] === ":") {
        object.pseudos.push(array[i]);
      }
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

  exports.specifyMe = inputRouter;

})(this);