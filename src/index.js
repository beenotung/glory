'use strict'
import { isBrowser } from 'browser-or-node'
import joli from '@blackblock/joli-string'
import { isEmpty } from 'rambda'
import { isAtRule, cssifyObject, assembleRule } from './helper'
import { hyphenateProperty } from 'css-in-js-utils'
const isProduction = process.env.NODE_ENV !== 'production'

const shouldAddSpace = (selector) =>
	selector[0] === '@' || selector[0] === ':' ? selector : ` ${selector}`

const create = function (config) {
	const next = joli('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_')

	const renderer = {
		raw: '',
		pfx: '',
		client: isBrowser,
		hash: (obj) => next(),
		selector: (parent, selector) => {
			return parent + shouldAddSpace(selector)
		},
		...config
	}

	const handleNestedDecls = (selector, atRule) => (prop, value) => {
		if (isAtRule(prop)) {
			renderer.put(selector, value, prop)
		} else {
			renderer.put(renderer.selector(selector, prop), value, atRule)
		}
	}

	if (renderer.client) {
		if (!renderer.sh) {
			renderer.sh = document.createElement('style')
			document.head.appendChild(renderer.sh)
		}

		if (process.env.NODE_ENV !== 'production') {
			renderer.sh.setAttribute('data-nano-css-dev', '')
			renderer.shTest = document.createElement('style')
			renderer.shTest.setAttribute('data-nano-css-dev-tests', '')
			document.head.appendChild(renderer.shTest)
		}

		renderer.putRaw = function (rawCssRule) {
			if (process.env.NODE_ENV === 'production') {
				const sheet = renderer.sh.sheet

				try {
					sheet.insertRule(rawCssRule, sheet.cssRules.length)
					// eslint-disable-next-line no-empty
				} catch (error) {
					console.log(error)
				}
			} else {
				try {
					renderer.shTest.sheet.insertRule(
						rawCssRule,
						renderer.shTest.sheet.cssRules.length
					)
				} catch (error) {
					console.error(error)
				}
				renderer.sh.appendChild(document.createTextNode(rawCssRule))
			}
		}
	} else {
		renderer.putRaw = function (rawCssRule) {
			renderer.raw += rawCssRule
		}
	}

	renderer.put = function (selector, decls, atRule) {
		const css = cssifyObject(decls, handleNestedDecls(selector, atRule))

		if (isEmpty(css)) {
			return ''
		}

		const withSelector = assembleRule(selector, css)

		renderer.putRaw(atRule ? assembleRule(atRule, withSelector) : withSelector)

		return ''
	}

	return renderer
}

export { create }
