'use strict'

const { isBrowser } = require('browser-or-node')
const joli = require('@blackblock/joli-string')
const R = require('rambda')

const KEBAB_REGEX = /[A-Z]/g

const generator = joli({
	chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_'
})

const isProduction = process.env.NODE_ENV !== 'production'

const addSelector = (selector, str) => {
	// console.log('check selector at addSelector', selector)
	return isProduction ? `${selector}{${str}}` : `\n${selector} {\n${str}}\n`
}

const isAtRule = (selector) => {
	return selector[0] === '@' && selector !== '@font-face'
}

const shouldAddSpace = (selector) => {
	if (selector[0] === '@' || selector[0] === ':') {
		return selector
	}

	return ` ${selector}`
}

exports.create = function(config) {
	const renderer = {
		raw: '',
		pfx: '_',
		client: isBrowser,
		assign: Object.assign,
		kebab: (prop) => prop.replace(KEBAB_REGEX, '-$&').toLowerCase(),
		decl: (key, value) => `${renderer.kebab(key)}:${value};`,
		hash: (obj) => generator.next().value,
		selector: function(parent, selector) {
			return parent + shouldAddSpace(selector)
		},
		putRaw: function(rawCssRule) {
			renderer.raw += rawCssRule
		},
		...config
	}

	if (renderer.client) {
		if (!renderer.sh) {
			document.head.appendChild((renderer.sh = document.createElement('style')))
		}

		if (process.env.NODE_ENV !== 'production') {
			renderer.sh.setAttribute('data-nano-css-dev', '')

			// Test style sheet used in DEV mode to test if .insetRule() would throw.
			renderer.shTest = document.createElement('style')
			renderer.shTest.setAttribute('data-nano-css-dev-tests', '')
			document.head.appendChild(renderer.shTest)
		}

		renderer.putRaw = function(rawCssRule) {
			// .insertRule() is faster than .appendChild(), that's why we use it in PROD.
			// But CSS injected using .insertRule() is not displayed in Chrome Devtools,
			// that's why we use .appendChild in DEV.
			if (process.env.NODE_ENV === 'production') {
				const sheet = renderer.sh.sheet

				// Unknown pseudo-selectors will throw, this try/catch swallows all errors.
				try {
					sheet.insertRule(rawCssRule, sheet.cssRules.length)
					// eslint-disable-next-line no-empty
				} catch (error) {}
			} else {
				// Test if .insertRule() works in dev mode. Unknown pseudo-selectors will throw when
				// .insertRule() is used, but .appendChild() will not throw.
				try {
					renderer.shTest.sheet.insertRule(
						rawCssRule,
						renderer.shTest.sheet.cssRules.length
					)
				} catch (error) {
					if (config.verbose) {
						console.error(error)
					}
				}

				// Insert pretty-printed CSS for dev mode.
				renderer.sh.appendChild(document.createTextNode(rawCssRule))
			}
		}
	}

	const addAtRule = (rule, atRule) => {
		console.log('check rules to handle', rule, atRule)
		return `${atRule}{${rule}}`
	}

	const handleAtRule = (selector, decls, atrule) => {
		console.log(`check data`, selector, decls, atrule)
	}

	function fromObjectToString(selector, decls) {
		return Object.entries(decls).reduce((acc, declObj) => {
			if (R.is(Object, declObj[1])) {
				if (isAtRule(declObj[0])) {
					renderer.put(selector, declObj[1], declObj[0])
					handleAtRule(selector, declObj[1], declObj[0])
					return acc
				}
				const nestingSelector = renderer.selector(selector, declObj[0])
				// Resolve that object with a new put method call
				renderer.put(nestingSelector, declObj[1])
				return acc
			}

			return acc + renderer.decl(declObj[0], declObj[1], selector)
		}, '')
	}

	renderer.put = function(selector, decls, atRule) {
		if (atRule) {
			console.log(
				'check value when atRule presented',
				R.isEmpty(selector),
				decls,
				atRule
			)
		}

		const declInString = fromObjectToString(selector, decls)

		if (R.isEmpty(declInString)) {
			return
		}

		const withSelector = addSelector(selector, declInString)

		const withAtRule = atRule ? addAtRule(withSelector, atRule) : withSelector

		console.log('check with atRule', atRule, withAtRule)

		renderer.putRaw(withAtRule)
	}

	return renderer
}

// function fromObjectToString(selector, decls) {
// 	return Object.entries(decls).reduce((acc, declObj) => {
// 		if (R.is(Object, declObj[1])) {
// 			console.log('check value to spawn', selector, declObj[0])
// 			if (isAtRule(declObj[0])) {
// 				console.log(
// 					'this is an atRule',
// 					`${declObj[0]}{${fromObjectToString(selector, declObj[1])}}`
// 				)
// 				return `${declObj[0]}{${fromObjectToString(selector, declObj[1])}}`
// 			}
// 			const nestingSelector = renderer.selector(selector, declObj[0])
// 			// Resolve that object with a new put method call
// 			renderer.put(nestingSelector, declObj[1])
// 			return acc
// 		}
//
// 		return acc + renderer.decl(declObj[0], declObj[1], selector)
// 	}, '')
// }

// console.log('check value to spawn', selector, declObj[0])
// if (isAtRule(declObj[0])) {
// 	console.log(
// 		'this is an atRule',
// 		`${declObj[0]}{${fromObjectToString(selector, declObj[1])}}`
// 	)
// 	return `${declObj[0]}{${fromObjectToString(selector, declObj[1])}}`
// }