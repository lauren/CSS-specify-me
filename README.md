CSS Specify Me
==============

[Check out the demo page!](http://lauren.github.io/CSS-specify-me/)

A CSS specificity calculator. Accepts a CSS selector as an input and returns an object containing two properties: `score`, the selector's specificity score, and `components`, the pieces of the selector that contributed to each number in the score.

For more on how CSS specificity works, check out [the speficication](http://www.w3.org/TR/css3-selectors/#specificity), my [demo page](http://lauren.github.io/CSS-specify-me/), or [this great calculator website](http://specificity.keegan.st/) that inspired my demo page.

Usage
-----

Call `specifyMe` on a CSS selector:

```javascript
specifyMe("h1 < a[title]:first-child");
```

Will return:

```
{
  score: [0,2,2],
  components: {
    ids: [],
    classesPseudoClassesAndAttributes: [":first-child", "[title]"],
    elementsAndPseudoElements: ["h1", "a"]
  }
}
```

Call `specifyMe` on an array of CSS selectors:

```javascript
specifyMe(["h1 < a[title]:first-child", "h3::first-letter #ilike.potatoes"]);
```

Will return:

```
[
  {
    score: [0,2,2],
    components: {
      ids: [],
      classesPseudoClassesAndAttributes: [":first-child", "[title]"],
      elementsAndPseudoElements: ["h1", "a"]
    }
  }
  {
    score: [1,1,2],
    components: {
      ids: ["ilike"],
      classesPseudoClassesAndAttributes: [".potatoes"],
      elementsAndPseudoElements: ["::first-letter", "h3"]
    }
  }
]