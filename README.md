CSS Specify Me
==============

A CSS specificity calculator. Accepts a CSS selector as an input and returns an array representing its specificity.

For more on how CSS specificity works, check out [the speficication](http://www.w3.org/TR/css3-selectors/#specificity) or [this great calculator website](http://specificity.keegan.st/).

Usage
-----

Call `specifyMe` on a CSS selector:

```javascript
specifyMe("h1 < a[title]:first-child");
```

Will return:

```
[0,2,2]
```