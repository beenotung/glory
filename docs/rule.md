# `rule()` Addon

`rule()` is a wrapper around [`put()`](./put.md) interface; it is a [3<sup>rd</sup> generation](https://github.com/streamich/freestyler/blob/master/docs/en/generations.md#3rd-generation)
interface. You can find this interface in many other CSS-in-JS libraries, it simply
returns a list of class names given a CSS-like object:

```js
const css = {
    color: 'tomato',
    ':hover': {
        color: 'blue',
    },
};
const className = nano.rule(css);

<div className={className}>Hello world!</div>
```

---

> __Nota Bene__
>
> The code above will automatically generate predictable class names on the server and browser.
> However, by default it uses unstable JSON stringify, which is fine in most cases if your
> app runs only in a browser, however, if you render on the server side and want to re-hydrate
> your CSS, you should use [`stable` addon](./stable.md), which makes sure that class names
> are the same between different JavaScript environments.

---

Optionally, using the second argument, you can specify a name or your style explicitly for performance
and semantic reasons.

```js
const className = rule(css, 'RedText');
```

> __P.S.__
>
> If you specify all style names explicitly, you don't need to install `stable` addon.


## Leading Space

`nano-css` always returns class names with a leading space, so you can concatenate those with other classes.

```jsx
const otherClass = 'foo';
const className = rule(css);

<div className={otherClass + className}>Hello world!</div>
```

This results in:

```html
<div class="foo _xuhuadsf">Hello world!</div>
```


## Installation

Simply add the the `rule` addon.

```js
import {create} from 'nano-css';
import {addon} from 'nano-css/addon/rule';

const nano = create();
addon(nano);
const {rule} = nano;

export {
    rule
}
```

Read more about the [Addon Installation](./addons.md#addon-installation).