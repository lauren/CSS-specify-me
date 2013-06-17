;(function (exports) {
  // does not include the :not pseudoclass, which does not contribute to specificity calc
  var pseudoClasses = [":link", ":visited", ":hover", ":active", ":target", ":lang", ":focus", 
                       ":enabled", ":disabled", ":checked", ":indeterminate", ":root", ":nth-child",
                       ":nth-last-child", ":nth-of-type", ":nth-last-of-type", ":first-child",
                       ":last-child", ":first-of-type", ":last-of-type", ":only-child",
                       ":only-of-type", ":empty"],
      pseudoElements = ["::first-line", "::first-letter", "::before", "::after"];

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

  // takes a single selector string, passes to parser, then iterates over resulting 
  // array of selector objects summing their specificities
  var calculateSpecificity = function (selectors) {
    var selectorObjectArray = parseSelectors(selectors),
        specificity = [0,0,0],
        calculateArraySpecificity = function (selectorObjectArray) {
          if (selectorObjectArray.length === 0) {
            return specificity;
          } else if (selectorObjectArray.length === 1) {
            specificity = sumSpecificityArrays(specificity, calculateObjectSpecificity(selectorObjectArray[0]));
          } else {
            specificity = sumSpecificityArrays(specificity, calculateObjectSpecificity(selectorObjectArray[0]));
            if (selectorObjectArray.length > 1) {
              calculateArraySpecificity(selectorObjectArray.slice(1,selectorObjectArray.length));
            } 
          }
          return specificity;
        };
    return calculateArraySpecificity(selectorObjectArray);
  };

  // requires two specificity arrays of the same length. luckily, specificity arrays are
  // always the same length!
  var sumSpecificityArrays = function (array1, array2) {
    var summedArray = [],
        sumArrays = function (xs, ys) {
          if (xs.length === 0) {
            return summedArray;
          } else {
            summedArray.push(xs[0] + ys[0]);
            if (xs.length > 1) {
              sumArrays(xs.slice(1,xs.length), ys.slice(1,ys.length));
            } 
          }
          return summedArray;
        };
    return sumArrays(array1,array2);
  };

  // calculates specificity of one selector object
  var calculateObjectSpecificity = function (selectorObject) {
    var specificity = [0,0,0];
    for (type in selectorObject) {
      switch (type) {
        case "node": case "pseudoElement":
          specificity[2] += 1;
          break;
        case "classes": case "pseudoClasses": case "attributes":
          specificity[1] += selectorObject[type].length;
          break;
        case "id":
          specificity[0] += 1;
          break;
      }
    }
    return specificity;
  };

  var parseSelectors = function (selectors) {
    selectors = selectors.split(/(\s|\*|\+|\~|\<)/);
    for (var i = 0; i < selectors.length; i++) {
      // change each selector into object with ID/class/node property based
      // on first character, then parse out additional classes or IDs if needed.
      // we're going from ["node.class", "node#id", "#id.class.class", ".class.class"] to
      // [{node: 'node', classes: ['.class'}, {node: 'node', id: '#id'}, 
      // {id: '#id', classes: ['.class', '.class']}, {classes: ['class', '.class']}]
      switch(selectors[i].charAt(0)) {
        case "*": case "+": case "~": case "<": case ">": case "": case " ":
          selectors[i] = {wildcardOrCombinator: selectors[i]};
          break;
        case "#":
          selectors[i] = {id: selectors[i]};
          findClassesInObject(selectors[i]);
          break;
        case ".":
          selectors[i] = {classes: findClasses(selectors[i])};
          break;
        case "[":
          selectors[i] = {attributes: findAttributes(selectors[i])};
          break;
        case ":":
          selectors[i] = {pseudos: findPseudos(selectors[i])};
          break;
        default:
          selectors[i] = {node: selectors[i]};
          if (/#/.test(selectors[i].node)) {
            selectors[i] = findNodeIds(selectors[i].node);
          }
          findClassesInObject(selectors[i]);
      }
      // parse out attributes, pseudo-elements, and pseudo-classes in each part
      // of the selector object we constructed
      for (type in selectors[i]) {
        (typeof selectors[i][type] === "object") 
          ? findPseudosAndAttributesInArray(selectors[i], type)
          : findPseudosAndAttributesInObject(selectors[i], type);
      }
      validatePseudos(selectors[i]);
    };
    console.log(selectors);
    return selectors;
  }

  // takes a string like "node#id" and returns an object like {node: node, id: id}
  var findNodeIds = function (string) {
    var nodeAndId = string.split("#");
    return {
      node: nodeAndId[0], 
      id: "#" + nodeAndId[1]
    };
  };
  
  // takes a astring like "node.class.class" and returns an array like "[class, class]" TBD: does it include leading class?
  var findClasses = function (string) {
    var classes = string.split(".");
    classes.shift();
    for (var i = 0; i < classes.length; i++) {
      classes[i] = "." + classes[i];
    }
    return classes;
  };

  // takes a selector object like {node: "node.class.class"} or {id: "#id.class.class"} or 
  // {node: "node"} or {id: "#id"} and returns {node: "node", classes: [".class", ".class"]} or 
  // {id: "#id", classes: [".class", ".class"]} or {node: "node"} or {id: "#id"}
  var findClassesInObject = function (object) {
    for (type in object) {
      if (/\./.test(object[type])) {
        object.classes = findClasses(object[type]);
        object[type] = object[type].split(".")[0];
      }
    }
  };

  // takes a string like "node::pseudo-element" and returns a string like "::pseudo-element"
  var findPseudoElements = function (string) {
    var mainAndPseudo = string.split("::");
    return "::" + mainAndPseudo[1];
  };

  // takes a string like "node:pseudo-selector:pseudo-selector" and returns an array like 
  // [":pseudo-selector", "pseudo-selector"]
  var findPseudos = function (string) {
    var pseudos = string.split(":");
    pseudos.shift();
    for (var i = 0; i < pseudos.length; i++) {
      if (/\(/.test(pseudos[i])) { // strip out any parameters passed to pseudo elements
        pseudos[i].split(")");
        pseudos[i] = pseudos[i][0];
      }
      pseudos[i] = ":" + pseudos[i];
    }
    return pseudos;
  };

  // takes a selector object. parses attributes out of pseudos if necessary, then checks 
  // each pseudo to categorize it as a pseudo-element or pseudo-class
  var validatePseudos = function (object) {
    if (object.pseudos) {
      object.pseudoClasses = []
      for (var i = 0; i < object.pseudos.length; i++) {
        if (/(\[|\])/.test(object.pseudos[i])) {
          object.attributes = object.attributes
          ? object.attributes.concat(findAttributes(object.pseudos[i]))
          : findAttributes(object.pseudos[i]);
          object.pseudos[i] = object.pseudos[i].split("[")[0];
        }
        if (inArray(pseudoElements, ":" + object.pseudos[i])) { 
          object.pseudoElement = ":" + object.pseudos[i];
        } else if (inArray(pseudoClasses, object.pseudos[i])) {
          object.pseudoClasses.push(object.pseudos[i]);
        }
      }
      delete object.pseudos;
    }
  }

  // takes a string like "node[attribute][attribute]" and returns an array like 
  // [attribute, attribute]
  var findAttributes = function (string) {
    var attributes = string.split(/(\[|\])/),
        cleanedAttributes = [];
    attributes.shift();
    for (var i = 0; i < attributes.length; i++) {
      switch(attributes[i]) {
        case "": case "[": case "]":
          delete attributes[i];
          break;
        default:
          cleanedAttributes.push(attributes[i]);
          break;
      }
    }
    for (var i = 0; i < cleanedAttributes.length; i++) {
      attributes[i] = "[" + attributes[i] + "]";
    }
    return cleanedAttributes;
  };

  // takes a selector object and iterates over array of a given property to find
  // pseudo-elements, pseudo-classes, and attributes
  var findPseudosAndAttributesInArray = function (object, property) {
    for (var i = 0; i < object[property].length; i++) {
      findPseudosAndAttributesInObject(object,property,i);
    }
  };

  // takes a selector object and parses a given property to find
  // pseudo-elements, pseudo-classes, and attributes
  var findPseudosAndAttributesInObject = function (object, property,index) {
    var currentItem = (typeof index === "number") ? object[property][index] : object[property];
    if (/::/.test(currentItem)) {
      object.pseudoElement = findPseudoElements(currentItem);
      currentItem = currentItem.split("::")[0];
      if (/:/.test(object.pseudoElement.slice(2,object.pseudoElement.length))) {
        object.pseudos = object.pseudos
        ? object.pseudos.concat(findPseudos(object.pseudoElement.slice(2,object.pseudoElement.length)))
        : findPseudos(object.pseudoElement.slice(2,object.pseudoElement.length));
        object.pseudoElement = object.pseudoElement.slice(2,object.pseudoElement.length).split(":")[0];
      }
      if (/(\[|\])/.test(object.pseudoElement)) {
        object.attributes = object.attributes 
          ? object.attributes.concat(findAttributes(object.pseudoElement)) 
          : findAttributes(object.pseudoElement);
        object.pseudoElement = object.pseudoElement.split("[")[0];
      }
    }
    if (/:/.test(currentItem) && type !== "pseudos") {
      object.pseudos = object.pseudos ? object.pseudos.concat(findPseudos(currentItem)) 
        : findPseudos(currentItem);
      currentItem = currentItem.split(":")[0];
    }
    if (/(\[|\])/.test(currentItem)) {
      object.attributes = object.attributes 
      ? object.attributes.concat(findAttributes(currentItem)) 
      : findAttributes(currentItem);
      currentItem = currentItem.split("[")[0];
    }
    (typeof index === "number") ? object[property][index] = currentItem
      : object[property] = currentItem;
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