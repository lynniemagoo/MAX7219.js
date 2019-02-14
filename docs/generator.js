var generator = (function () {
	'use strict';

	function noop() {}

	function run(fn) {
		return fn();
	}

	function blankObject() {
		return Object.create(null);
	}

	function run_all(fns) {
		fns.forEach(run);
	}

	function is_function(thing) {
		return typeof thing === 'function';
	}

	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor);
	}

	function detachNode(node) {
		node.parentNode.removeChild(node);
	}

	function destroyEach(iterations, detach) {
		for (var i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detach);
		}
	}

	function createElement(name) {
		return document.createElement(name);
	}

	function createText(data) {
		return document.createTextNode(data);
	}

	function addListener(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	function children (element) {
		return Array.from(element.childNodes);
	}

	function toggleClass(element, name, toggle) {
		element.classList[toggle ? 'add' : 'remove'](name);
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	let dirty_components = [];

	let update_promise;
	const binding_callbacks = [];
	const render_callbacks = [];

	function schedule_update() {
		if (!update_promise) {
			update_promise = Promise.resolve();
			update_promise.then(flush);
		}
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function add_binding_callback(fn) {
		binding_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		update_promise = null;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case — component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detach) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detach);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = {};
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			update: noop,
			not_equal: not_equal$$1,
			bound: blankObject(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blankObject(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.bound[key]) $$.bound[key](value);

				if ($$.ctx) {
					const changed = not_equal$$1(value, $$.ctx[key]);
					if (ready && changed) {
						make_dirty(component, key);
					}

					$$.ctx[key] = value;
					return changed;
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	/* docs/Generator.svelte generated by Svelte v3.0.0-beta.3 */

	function add_css() {
		var style = createElement("style");
		style.id = 'svelte-rnapl7-style';
		style.textContent = ".container.svelte-rnapl7{display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;width:100vh}.display.svelte-rnapl7{display:flex}textarea.svelte-rnapl7{position:absolute;left:-400px}.display.svelte-rnapl7>div.svelte-rnapl7{background-color:black}.led.svelte-rnapl7{height:32px;width:32px;margin:2px;border-radius:16px;background-color:grey}.lit.svelte-rnapl7{background-color:red}button.svelte-rnapl7{margin-top:12px;font-size:18px;padding:12px 24px;border:2px solid darkslategrey;background:none;box-shadow:none;border-radius:0px}";
		append(document.head, style);
	}

	function get_each_context_1(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.c = list[i];
		child_ctx.i2 = i;
		return child_ctx;
	}

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.r = list[i];
		child_ctx.i = i;
		return child_ctx;
	}

	// (5:3) {#each r as c, i2}
	function create_each_block_1(ctx) {
		var div, dispose;

		function click_handler() {
			return ctx.click_handler(ctx);
		}

		return {
			c() {
				div = createElement("div");
				div.className = "led svelte-rnapl7";
				toggleClass(div, "lit", ctx.matrix[ctx.i][ctx.i2] === 1);
				dispose = addListener(div, "click", click_handler);
			},

			m(target, anchor) {
				insert(target, div, anchor);
			},

			p(changed, new_ctx) {
				ctx = new_ctx;
				if (changed.matrix) {
					toggleClass(div, "lit", ctx.matrix[ctx.i][ctx.i2] === 1);
				}
			},

			d(detach) {
				if (detach) {
					detachNode(div);
				}

				dispose();
			}
		};
	}

	// (3:2) {#each matrix as r, i}
	function create_each_block(ctx) {
		var div;

		var each_value_1 = ctx.r;

		var each_blocks = [];

		for (var i_1 = 0; i_1 < each_value_1.length; i_1 += 1) {
			each_blocks[i_1] = create_each_block_1(get_each_context_1(ctx, each_value_1, i_1));
		}

		return {
			c() {
				div = createElement("div");

				for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
					each_blocks[i_1].c();
				}
				div.className = "svelte-rnapl7";
			},

			m(target, anchor) {
				insert(target, div, anchor);

				for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
					each_blocks[i_1].m(div, null);
				}
			},

			p(changed, ctx) {
				if (changed.matrix) {
					each_value_1 = ctx.r;

					for (var i_1 = 0; i_1 < each_value_1.length; i_1 += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i_1);

						if (each_blocks[i_1]) {
							each_blocks[i_1].p(changed, child_ctx);
						} else {
							each_blocks[i_1] = create_each_block_1(child_ctx);
							each_blocks[i_1].c();
							each_blocks[i_1].m(div, null);
						}
					}

					for (; i_1 < each_blocks.length; i_1 += 1) {
						each_blocks[i_1].d(1);
					}
					each_blocks.length = each_value_1.length;
				}
			},

			d(detach) {
				if (detach) {
					detachNode(div);
				}

				destroyEach(each_blocks, detach);
			}
		};
	}

	function create_fragment(ctx) {
		var div1, div0, text0, textarea, textarea_value_value, text1, button, dispose;

		var each_value = ctx.matrix;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		return {
			c() {
				div1 = createElement("div");
				div0 = createElement("div");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				text0 = createText("\n\n\t");
				textarea = createElement("textarea");
				text1 = createText("\n\n\t");
				button = createElement("button");
				button.textContent = "Copy Matrix to Clipboard";
				div0.className = "display svelte-rnapl7";
				textarea.value = textarea_value_value = "\n\t" + JSON.stringify(ctx.matrix) + "\n\t";
				textarea.className = "svelte-rnapl7";
				button.type = "button";
				button.className = "svelte-rnapl7";
				div1.className = "container svelte-rnapl7";
				dispose = addListener(button, "click", ctx.copy);
			},

			m(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(div0, null);
				}

				append(div1, text0);
				append(div1, textarea);
				add_binding_callback(() => ctx.textarea_binding(textarea, null));
				append(div1, text1);
				append(div1, button);
			},

			p(changed, ctx) {
				if (changed.matrix) {
					each_value = ctx.matrix;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div0, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}

				if (changed.items) {
					ctx.textarea_binding(null, textarea);
					ctx.textarea_binding(textarea, null);
				}

				if ((changed.matrix) && textarea_value_value !== (textarea_value_value = "\n\t" + JSON.stringify(ctx.matrix) + "\n\t")) {
					textarea.value = textarea_value_value;
				}
			},

			i: noop,
			o: noop,

			d(detach) {
				if (detach) {
					detachNode(div1);
				}

				destroyEach(each_blocks, detach);

				ctx.textarea_binding(null, textarea);
				dispose();
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let json;
		const matrix = new Array(8).fill(0).map(r => new Array(8).fill(0));
		
		function toggle (r, c) {
			matrix[r][c] = matrix[r][c] ? 0 : 1; $$invalidate('matrix', matrix);
		}
		
		function copy () {
			json.select();
			document.execCommand('copy');
		}

		function click_handler({ i, i2 }) {
			return toggle(i, i2);
		}

		function textarea_binding($$node, check) {
			json = $$node;
			$$invalidate('json', json);
		}

		return {
			json,
			matrix,
			toggle,
			copy,
			click_handler,
			textarea_binding
		};
	}

	class Generator extends SvelteComponent {
		constructor(options) {
			super();
			if (!document.getElementById("svelte-rnapl7-style")) add_css();
			init(this, options, instance, create_fragment, safe_not_equal);
		}
	}

	return Generator;

}());
