(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // node_modules/ftdomdelegate/main.js
  function Delegate(root) {
    this.listenerMap = [{}, {}];
    if (root) {
      this.root(root);
    }
    this.handle = Delegate.prototype.handle.bind(this);
    this._removedListeners = [];
  }
  Delegate.prototype.root = function(root) {
    const listenerMap = this.listenerMap;
    let eventType;
    if (this.rootElement) {
      for (eventType in listenerMap[1]) {
        if (listenerMap[1].hasOwnProperty(eventType)) {
          this.rootElement.removeEventListener(eventType, this.handle, true);
        }
      }
      for (eventType in listenerMap[0]) {
        if (listenerMap[0].hasOwnProperty(eventType)) {
          this.rootElement.removeEventListener(eventType, this.handle, false);
        }
      }
    }
    if (!root || !root.addEventListener) {
      if (this.rootElement) {
        delete this.rootElement;
      }
      return this;
    }
    this.rootElement = root;
    for (eventType in listenerMap[1]) {
      if (listenerMap[1].hasOwnProperty(eventType)) {
        this.rootElement.addEventListener(eventType, this.handle, true);
      }
    }
    for (eventType in listenerMap[0]) {
      if (listenerMap[0].hasOwnProperty(eventType)) {
        this.rootElement.addEventListener(eventType, this.handle, false);
      }
    }
    return this;
  };
  Delegate.prototype.captureForType = function(eventType) {
    return ["blur", "error", "focus", "load", "resize", "scroll"].indexOf(eventType) !== -1;
  };
  Delegate.prototype.on = function(eventType, selector, handler, useCapture) {
    let root;
    let listenerMap;
    let matcher;
    let matcherParam;
    if (!eventType) {
      throw new TypeError("Invalid event type: " + eventType);
    }
    if (typeof selector === "function") {
      useCapture = handler;
      handler = selector;
      selector = null;
    }
    if (useCapture === void 0) {
      useCapture = this.captureForType(eventType);
    }
    if (typeof handler !== "function") {
      throw new TypeError("Handler must be a type of Function");
    }
    root = this.rootElement;
    listenerMap = this.listenerMap[useCapture ? 1 : 0];
    if (!listenerMap[eventType]) {
      if (root) {
        root.addEventListener(eventType, this.handle, useCapture);
      }
      listenerMap[eventType] = [];
    }
    if (!selector) {
      matcherParam = null;
      matcher = matchesRoot.bind(this);
    } else if (/^[a-z]+$/i.test(selector)) {
      matcherParam = selector;
      matcher = matchesTag;
    } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
      matcherParam = selector.slice(1);
      matcher = matchesId;
    } else {
      matcherParam = selector;
      matcher = Element.prototype.matches;
    }
    listenerMap[eventType].push({
      selector,
      handler,
      matcher,
      matcherParam
    });
    return this;
  };
  Delegate.prototype.off = function(eventType, selector, handler, useCapture) {
    let i;
    let listener;
    let listenerMap;
    let listenerList;
    let singleEventType;
    if (typeof selector === "function") {
      useCapture = handler;
      handler = selector;
      selector = null;
    }
    if (useCapture === void 0) {
      this.off(eventType, selector, handler, true);
      this.off(eventType, selector, handler, false);
      return this;
    }
    listenerMap = this.listenerMap[useCapture ? 1 : 0];
    if (!eventType) {
      for (singleEventType in listenerMap) {
        if (listenerMap.hasOwnProperty(singleEventType)) {
          this.off(singleEventType, selector, handler);
        }
      }
      return this;
    }
    listenerList = listenerMap[eventType];
    if (!listenerList || !listenerList.length) {
      return this;
    }
    for (i = listenerList.length - 1; i >= 0; i--) {
      listener = listenerList[i];
      if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
        this._removedListeners.push(listener);
        listenerList.splice(i, 1);
      }
    }
    if (!listenerList.length) {
      delete listenerMap[eventType];
      if (this.rootElement) {
        this.rootElement.removeEventListener(eventType, this.handle, useCapture);
      }
    }
    return this;
  };
  Delegate.prototype.handle = function(event) {
    let i;
    let l;
    const type = event.type;
    let root;
    let phase;
    let listener;
    let returned;
    let listenerList = [];
    let target;
    const eventIgnore = "ftLabsDelegateIgnore";
    if (event[eventIgnore] === true) {
      return;
    }
    target = event.target;
    if (target.nodeType === 3) {
      target = target.parentNode;
    }
    if (target.correspondingUseElement) {
      target = target.correspondingUseElement;
    }
    root = this.rootElement;
    phase = event.eventPhase || (event.target !== event.currentTarget ? 3 : 2);
    switch (phase) {
      case 1:
        listenerList = this.listenerMap[1][type];
        break;
      case 2:
        if (this.listenerMap[0] && this.listenerMap[0][type]) {
          listenerList = listenerList.concat(this.listenerMap[0][type]);
        }
        if (this.listenerMap[1] && this.listenerMap[1][type]) {
          listenerList = listenerList.concat(this.listenerMap[1][type]);
        }
        break;
      case 3:
        listenerList = this.listenerMap[0][type];
        break;
    }
    let toFire = [];
    l = listenerList.length;
    while (target && l) {
      for (i = 0; i < l; i++) {
        listener = listenerList[i];
        if (!listener) {
          break;
        }
        if (target.tagName && ["button", "input", "select", "textarea"].indexOf(target.tagName.toLowerCase()) > -1 && target.hasAttribute("disabled")) {
          toFire = [];
        } else if (listener.matcher.call(target, listener.matcherParam, target)) {
          toFire.push([event, target, listener]);
        }
      }
      if (target === root) {
        break;
      }
      l = listenerList.length;
      target = target.parentElement || target.parentNode;
      if (target instanceof HTMLDocument) {
        break;
      }
    }
    let ret;
    for (i = 0; i < toFire.length; i++) {
      if (this._removedListeners.indexOf(toFire[i][2]) > -1) {
        continue;
      }
      returned = this.fire.apply(this, toFire[i]);
      if (returned === false) {
        toFire[i][0][eventIgnore] = true;
        toFire[i][0].preventDefault();
        ret = false;
        break;
      }
    }
    return ret;
  };
  Delegate.prototype.fire = function(event, target, listener) {
    return listener.handler.call(target, event, target);
  };
  function matchesTag(tagName, element) {
    return tagName.toLowerCase() === element.tagName.toLowerCase();
  }
  function matchesRoot(selector, element) {
    if (this.rootElement === window) {
      return element === document || element === document.documentElement || element === window;
    }
    return this.rootElement === element;
  }
  function matchesId(id, element) {
    return id === element.id;
  }
  Delegate.prototype.destroy = function() {
    this.off();
    this.root();
  };
  var main_default = Delegate;

  // js/components/input-binding-manager.js
  var InputBindingManager = class {
    constructor() {
      this.delegateElement = new main_default(document.body);
      this.delegateElement.on("change", "[data-bind-value]", this._onValueChanged.bind(this));
    }
    _onValueChanged(event, target) {
      const boundElement = document.getElementById(target.getAttribute("data-bind-value"));
      if (boundElement) {
        if (target.tagName === "SELECT") {
          target = target.options[target.selectedIndex];
        }
        boundElement.innerHTML = target.hasAttribute("title") ? target.getAttribute("title") : target.value;
      }
    }
  };

  // js/helper/event.js
  function triggerEvent(element, name, data = {}) {
    element.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      detail: data
    }));
  }
  function triggerNonBubblingEvent(element, name, data = {}) {
    element.dispatchEvent(new CustomEvent(name, {
      bubbles: false,
      detail: data
    }));
  }

  // js/custom-element/custom-html-element.js
  var CustomHTMLElement = class extends HTMLElement {
    constructor() {
      super();
      this._hasSectionReloaded = false;
      if (Shopify.designMode) {
        this.rootDelegate.on("shopify:section:select", (event) => {
          const parentSection = this.closest(".shopify-section");
          if (event.target === parentSection && event.detail.load) {
            this._hasSectionReloaded = true;
          }
        });
      }
    }
    get rootDelegate() {
      return this._rootDelegate = this._rootDelegate || new main_default(document.documentElement);
    }
    get delegate() {
      return this._delegate = this._delegate || new main_default(this);
    }
    showLoadingBar() {
      triggerEvent(document.documentElement, "theme:loading:start");
    }
    hideLoadingBar() {
      triggerEvent(document.documentElement, "theme:loading:end");
    }
    untilVisible(intersectionObserverOptions = { rootMargin: "30px 0px", threshold: 0 }) {
      const onBecameVisible = () => {
        this.classList.add("became-visible");
        this.style.opacity = "1";
      };
      return new Promise((resolve) => {
        if (window.IntersectionObserver) {
          this.intersectionObserver = new IntersectionObserver((event) => {
            if (event[0].isIntersecting) {
              this.intersectionObserver.disconnect();
              requestAnimationFrame(() => {
                resolve();
                onBecameVisible();
              });
            }
          }, intersectionObserverOptions);
          this.intersectionObserver.observe(this);
        } else {
          resolve();
          onBecameVisible();
        }
      });
    }
    disconnectedCallback() {
      var _a;
      this.delegate.destroy();
      this.rootDelegate.destroy();
      (_a = this.intersectionObserver) == null ? void 0 : _a.disconnect();
      delete this._delegate;
      delete this._rootDelegate;
    }
  };

  // node_modules/tabbable/dist/index.esm.js
  var candidateSelectors = ["input", "select", "textarea", "a[href]", "button", "[tabindex]", "audio[controls]", "video[controls]", '[contenteditable]:not([contenteditable="false"])', "details>summary:first-of-type", "details"];
  var candidateSelector = /* @__PURE__ */ candidateSelectors.join(",");
  var matches = typeof Element === "undefined" ? function() {
  } : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  var getCandidates = function getCandidates2(el, includeContainer, filter) {
    var candidates = Array.prototype.slice.apply(el.querySelectorAll(candidateSelector));
    if (includeContainer && matches.call(el, candidateSelector)) {
      candidates.unshift(el);
    }
    candidates = candidates.filter(filter);
    return candidates;
  };
  var isContentEditable = function isContentEditable2(node) {
    return node.contentEditable === "true";
  };
  var getTabindex = function getTabindex2(node) {
    var tabindexAttr = parseInt(node.getAttribute("tabindex"), 10);
    if (!isNaN(tabindexAttr)) {
      return tabindexAttr;
    }
    if (isContentEditable(node)) {
      return 0;
    }
    if ((node.nodeName === "AUDIO" || node.nodeName === "VIDEO" || node.nodeName === "DETAILS") && node.getAttribute("tabindex") === null) {
      return 0;
    }
    return node.tabIndex;
  };
  var sortOrderedTabbables = function sortOrderedTabbables2(a, b) {
    return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
  };
  var isInput = function isInput2(node) {
    return node.tagName === "INPUT";
  };
  var isHiddenInput = function isHiddenInput2(node) {
    return isInput(node) && node.type === "hidden";
  };
  var isDetailsWithSummary = function isDetailsWithSummary2(node) {
    var r = node.tagName === "DETAILS" && Array.prototype.slice.apply(node.children).some(function(child) {
      return child.tagName === "SUMMARY";
    });
    return r;
  };
  var getCheckedRadio = function getCheckedRadio2(nodes, form) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].checked && nodes[i].form === form) {
        return nodes[i];
      }
    }
  };
  var isTabbableRadio = function isTabbableRadio2(node) {
    if (!node.name) {
      return true;
    }
    var radioScope = node.form || node.ownerDocument;
    var queryRadios = function queryRadios2(name) {
      return radioScope.querySelectorAll('input[type="radio"][name="' + name + '"]');
    };
    var radioSet;
    if (typeof window !== "undefined" && typeof window.CSS !== "undefined" && typeof window.CSS.escape === "function") {
      radioSet = queryRadios(window.CSS.escape(node.name));
    } else {
      try {
        radioSet = queryRadios(node.name);
      } catch (err) {
        console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", err.message);
        return false;
      }
    }
    var checked = getCheckedRadio(radioSet, node.form);
    return !checked || checked === node;
  };
  var isRadio = function isRadio2(node) {
    return isInput(node) && node.type === "radio";
  };
  var isNonTabbableRadio = function isNonTabbableRadio2(node) {
    return isRadio(node) && !isTabbableRadio(node);
  };
  var isHidden = function isHidden2(node, displayCheck) {
    if (getComputedStyle(node).visibility === "hidden") {
      return true;
    }
    var isDirectSummary = matches.call(node, "details>summary:first-of-type");
    var nodeUnderDetails = isDirectSummary ? node.parentElement : node;
    if (matches.call(nodeUnderDetails, "details:not([open]) *")) {
      return true;
    }
    if (!displayCheck || displayCheck === "full") {
      while (node) {
        if (getComputedStyle(node).display === "none") {
          return true;
        }
        node = node.parentElement;
      }
    } else if (displayCheck === "non-zero-area") {
      var _node$getBoundingClie = node.getBoundingClientRect(), width = _node$getBoundingClie.width, height = _node$getBoundingClie.height;
      return width === 0 && height === 0;
    }
    return false;
  };
  var isDisabledFromFieldset = function isDisabledFromFieldset2(node) {
    if (isInput(node) || node.tagName === "SELECT" || node.tagName === "TEXTAREA" || node.tagName === "BUTTON") {
      var parentNode = node.parentElement;
      while (parentNode) {
        if (parentNode.tagName === "FIELDSET" && parentNode.disabled) {
          for (var i = 0; i < parentNode.children.length; i++) {
            var child = parentNode.children.item(i);
            if (child.tagName === "LEGEND") {
              if (child.contains(node)) {
                return false;
              }
              return true;
            }
          }
          return true;
        }
        parentNode = parentNode.parentElement;
      }
    }
    return false;
  };
  var isNodeMatchingSelectorFocusable = function isNodeMatchingSelectorFocusable2(options, node) {
    if (node.disabled || isHiddenInput(node) || isHidden(node, options.displayCheck) || isDetailsWithSummary(node) || isDisabledFromFieldset(node)) {
      return false;
    }
    return true;
  };
  var isNodeMatchingSelectorTabbable = function isNodeMatchingSelectorTabbable2(options, node) {
    if (!isNodeMatchingSelectorFocusable(options, node) || isNonTabbableRadio(node) || getTabindex(node) < 0) {
      return false;
    }
    return true;
  };
  var tabbable = function tabbable2(el, options) {
    options = options || {};
    var regularTabbables = [];
    var orderedTabbables = [];
    var candidates = getCandidates(el, options.includeContainer, isNodeMatchingSelectorTabbable.bind(null, options));
    candidates.forEach(function(candidate, i) {
      var candidateTabindex = getTabindex(candidate);
      if (candidateTabindex === 0) {
        regularTabbables.push(candidate);
      } else {
        orderedTabbables.push({
          documentOrder: i,
          tabIndex: candidateTabindex,
          node: candidate
        });
      }
    });
    var tabbableNodes = orderedTabbables.sort(sortOrderedTabbables).map(function(a) {
      return a.node;
    }).concat(regularTabbables);
    return tabbableNodes;
  };
  var focusableCandidateSelector = /* @__PURE__ */ candidateSelectors.concat("iframe").join(",");
  var isFocusable = function isFocusable2(node, options) {
    options = options || {};
    if (!node) {
      throw new Error("No node provided");
    }
    if (matches.call(node, focusableCandidateSelector) === false) {
      return false;
    }
    return isNodeMatchingSelectorFocusable(options, node);
  };


  // js/custom-element/behavior/openable-element.js
  var OpenableElement = class extends CustomHTMLElement {
    static get observedAttributes() {
      return ["open"];
    }
    constructor() {
      super();
      if (Shopify.designMode) {
        this.rootDelegate.on("shopify:section:select", (event) => filterShopifyEvent(event, this, () => this.open = true));
        this.rootDelegate.on("shopify:section:deselect", (event) => filterShopifyEvent(event, this, () => this.open = false));
      }
      if (this.hasAttribute("append-body")) {
        const existingNode = document.getElementById(this.id);
        this.removeAttribute("append-body");
        if (existingNode && existingNode !== this) {
          existingNode.replaceWith(this.cloneNode(true));
          this.remove();
        } else {
          document.body.appendChild(this);
        }
      }
    }
    connectedCallback() {
      this.delegate.on("click", ".openable__overlay", () => this.open = false);
      this.delegate.on("click", '[data-action="close"]', (event) => {
        event.stopPropagation();
        this.open = false;
      });
    }
    get requiresLoading() {
      return this.hasAttribute("href");
    }
    get open() {
      return this.hasAttribute("open");
    }
    set open(value) {
      if (value) {
        (async () => {
          await this._load();
          this.clientWidth;
          this.setAttribute("open", "");
        })();
      } else {
        this.removeAttribute("open");
      }
    }
    get shouldTrapFocus() {
      return true;
    }
    get returnFocusOnDeactivate() {
      return !this.hasAttribute("return-focus") || this.getAttribute("return-focus") === "true";
    }
    get focusTrap() {
      return this._focusTrap = this._focusTrap || createFocusTrap(this, {
        fallbackFocus: this,
        initialFocus: this.hasAttribute("initial-focus-selector") ? this.getAttribute("initial-focus-selector") : void 0,
        clickOutsideDeactivates: (event) => !(event.target.hasAttribute("aria-controls") && event.target.getAttribute("aria-controls") === this.id),
        allowOutsideClick: (event) => event.target.hasAttribute("aria-controls") && event.target.getAttribute("aria-controls") === this.id,
        returnFocusOnDeactivate: this.returnFocusOnDeactivate,
        onDeactivate: () => this.open = false,
        preventScroll: true
      });
    }
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case "open":
          if (oldValue === null && newValue === "") {
            if (this.shouldTrapFocus) {
              setTimeout(() => this.focusTrap.activate(), 150);
            }
            triggerEvent(this, "openable-element:open");
          } else if (newValue === null) {
            if (this.shouldTrapFocus) {
              this.focusTrap.deactivate();
            }
            triggerEvent(this, "openable-element:close");
          }
      }
    }
    async _load() {
      if (!this.requiresLoading) {
        return;
      }
      triggerNonBubblingEvent(this, "openable-element:load:start");
      const response = await fetch(this.getAttribute("href"));
      const element = document.createElement("div");
      element.innerHTML = await response.text();
      this.innerHTML = element.querySelector(this.tagName.toLowerCase()).innerHTML;
      this.removeAttribute("href");
      triggerNonBubblingEvent(this, "openable-element:load:end");
    }
  };
  window.customElements.define("openable-element", OpenableElement);

  // js/custom-element/behavior/collapsible-content.js
  var CollapsibleContent = class extends OpenableElement {
    constructor() {
      super();
      this.ignoreNextTransition = this.open;
      this.addEventListener("shopify:block:select", () => this.open = true);
      this.addEventListener("shopify:block:deselect", () => this.open = false);
    }
    get animateItems() {
      return this.hasAttribute("animate-items");
    }
    attributeChangedCallback(name) {
      if (this.ignoreNextTransition) {
        return this.ignoreNextTransition = false;
      }
      switch (name) {
        case "open":
          this.style.overflow = "hidden";
          const keyframes = {
            height: ["0px", `${this.scrollHeight}px`],
            visibility: ["hidden", "visible"]
          };
          if (this.animateItems) {
            keyframes["opacity"] = this.open ? [0, 0] : [0, 1];
          }
          this.animate(keyframes, {
            duration: 500,
            direction: this.open ? "normal" : "reverse",
            easing: "cubic-bezier(0.75, 0, 0.175, 1)"
          }).onfinish = () => {
            this.style.overflow = this.open ? "visible" : "hidden";
          };
          if (this.animateItems && this.open) {
            this.animate({
              opacity: [0, 1],
              transform: ["translateY(10px)", "translateY(0)"]
            }, {
              duration: 250,
              delay: 250,
              easing: "cubic-bezier(0.75, 0, 0.175, 1)"
            });
          }
          triggerEvent(this, this.open ? "openable-element:open" : "openable-element:close");
      }
    }
  };
  window.customElements.define("collapsible-content", CollapsibleContent);

  // js/custom-element/behavior/confirm-button.js
  var ConfirmButton = class extends HTMLButtonElement {
    connectedCallback() {
      this.addEventListener("click", (event) => {
        if (!window.confirm(this.getAttribute("data-message") || "Are you sure you wish to do this?")) {
          event.preventDefault();
        }
      });
    }
  };
  window.customElements.define("confirm-button", ConfirmButton, { extends: "button" });

  // js/mixin/loader-button.js
  var LoaderButtonMixin = {
    _prepareButton() {
      this.originalContent = this.innerHTML;
      this._startTransitionPromise = null;
      this.innerHTML = `
      <span class="loader-button__text">${this.innerHTML}</span>
      <span class="loader-button__loader" hidden>
        <div class="spinner">
          <svg focusable="false" width="24" height="24" class="icon icon--spinner" viewBox="25 25 50 50">
            <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="5"></circle>
          </svg>
        </div>
      </span>
    `;
      this.textElement = this.firstElementChild;
      this.spinnerElement = this.lastElementChild;
      window.addEventListener("pagehide", () => this.removeAttribute("aria-busy"));
    },
    _startTransition() {
      const textAnimation = this.textElement.animate({
        opacity: [1, 0],
        transform: ["translateY(0)", "translateY(-10px)"]
      }, {
        duration: 75,
        easing: "ease",
        fill: "forwards"
      });
      this.spinnerElement.hidden = false;
      const spinnerAnimation = this.spinnerElement.animate({
        opacity: [0, 1],
        transform: ["translate(-50%, 0%)", "translate(-50%, -50%)"]
      }, {
        duration: 75,
        delay: 75,
        easing: "ease",
        fill: "forwards"
      });
      this._startTransitionPromise = Promise.all([
        new Promise((resolve) => textAnimation.onfinish = () => resolve()),
        new Promise((resolve) => spinnerAnimation.onfinish = () => resolve())
      ]);
    },
    async _endTransition() {
      if (!this._startTransitionPromise) {
        return;
      }
      await this._startTransitionPromise;
      this.spinnerElement.animate({
        opacity: [1, 0],
        transform: ["translate(-50%, -50%)", "translate(-50%, -100%)"]
      }, {
        duration: 75,
        delay: 100,
        easing: "ease",
        fill: "forwards"
      }).onfinish = () => this.spinnerElement.hidden = true;
      this.textElement.animate({
        opacity: [0, 1],
        transform: ["translateY(10px)", "translateY(0)"]
      }, {
        duration: 75,
        delay: 175,
        easing: "ease",
        fill: "forwards"
      });
      this._startTransitionPromise = null;
    }
  };

  // js/custom-element/behavior/loader-button.js
  var LoaderButton = class extends HTMLButtonElement {
    static get observedAttributes() {
      return ["aria-busy"];
    }
    constructor() {
      super();
      this.addEventListener("click", (event) => {
        if (this.type === "submit" && this.form && this.form.checkValidity() && !this.form.hasAttribute("is")) {
          if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
            event.preventDefault();
            this.setAttribute("aria-busy", "true");
            setTimeout(() => this.form.submit(), 250);
          } else {
            this.setAttribute("aria-busy", "true");
          }
        }
      });
    }
    connectedCallback() {
      this._prepareButton();
    }
    disconnectedCallback() {
      this.innerHTML = this.originalContent;
    }
    attributeChangedCallback(property, oldValue, newValue) {
      if (property === "aria-busy") {
        if (newValue === "true") {
          this._startTransition();
        } else {
          this._endTransition();
        }
      }
    }
  };
  Object.assign(LoaderButton.prototype, LoaderButtonMixin);
  window.customElements.define("loader-button", LoaderButton, { extends: "button" });


  // js/custom-element/behavior/toggle-button.js
  var ToggleButton = class extends HTMLButtonElement {
    static get observedAttributes() {
      return ["aria-expanded", "aria-busy"];
    }
    constructor() {
      super();
      if (this.hasAttribute("loader")) {
        this._prepareButton();
      }
      this.addEventListener("click", this._onButtonClick.bind(this));
      this.rootDelegate = new main_default(document.documentElement);
    }
    _onButtonClick() {
      this.isExpanded = !this.isExpanded;
    }
    connectedCallback() {
      document.addEventListener("openable-element:close", (event) => {
        if (this.controlledElement === event.target) {
          this.isExpanded = false;
          event.stopPropagation();
        }
      });
      document.addEventListener("openable-element:open", (event) => {
        if (this.controlledElement === event.target) {
          this.isExpanded = true;
          event.stopPropagation();
        }
      });
      this.rootDelegate.on("openable-element:load:start", `#${this.getAttribute("aria-controls")}`, () => {
        if (this.classList.contains("button")) {
          this.setAttribute("aria-busy", "true");
        } else if (this.offsetParent !== null) {
          triggerEvent(document.documentElement, "theme:loading:start");
        }
      }, true);
      this.rootDelegate.on("openable-element:load:end", `#${this.getAttribute("aria-controls")}`, () => {
        if (this.classList.contains("button")) {
          this.removeAttribute("aria-busy");
        } else if (this.offsetParent !== null) {
          triggerEvent(document.documentElement, "theme:loading:end");
        }
      }, true);
    }
    disconnectedCallback() {
      this.rootDelegate.destroy();
    }
    get isExpanded() {
      return this.getAttribute("aria-expanded") === "true";
    }
    set isExpanded(value) {
      this.setAttribute("aria-expanded", value ? "true" : "false");
    }
    get controlledElement() {
      return document.getElementById(this.getAttribute("aria-controls"));
    }
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case "aria-expanded":
          if (oldValue === "false" && newValue === "true") {
            this.controlledElement.open = true;
          } else if (oldValue === "true" && newValue === "false") {
            this.controlledElement.open = false;
          }
          break;
        case "aria-busy":
          if (this.hasAttribute("loader")) {
            if (newValue === "true") {
              this._startTransition();
            } else {
              this._endTransition();
            }
          }
          break;
      }
    }
  };
  Object.assign(ToggleButton.prototype, LoaderButtonMixin);
  window.customElements.define("toggle-button", ToggleButton, { extends: "button" });

  // js/custom-element/behavior/toggle-link.js
  var ToggleLink = class extends HTMLAnchorElement {
    static get observedAttributes() {
      return ["aria-expanded"];
    }
    constructor() {
      super();
      this.addEventListener("click", (event) => {
        event.preventDefault();
        this.isExpanded = !this.isExpanded;
      });
      this.rootDelegate = new main_default(document.documentElement);
    }
    connectedCallback() {
      this.rootDelegate.on("openable-element:close", `#${this.getAttribute("aria-controls")}`, (event) => {
        if (this.controlledElement === event.target) {
          this.isExpanded = false;
        }
      }, true);
      this.rootDelegate.on("openable-element:open", `#${this.getAttribute("aria-controls")}`, (event) => {
        if (this.controlledElement === event.target) {
          this.isExpanded = true;
        }
      }, true);
    }
    disconnectedCallback() {
      this.rootDelegate.destroy();
    }
    get isExpanded() {
      return this.getAttribute("aria-expanded") === "true";
    }
    set isExpanded(value) {
      this.setAttribute("aria-expanded", value ? "true" : "false");
    }
    get controlledElement() {
      return document.querySelector(`#${this.getAttribute("aria-controls")}`);
    }
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case "aria-expanded":
          if (oldValue === "false" && newValue === "true") {
            this.controlledElement.open = true;
          } else if (oldValue === "true" && newValue === "false") {
            this.controlledElement.open = false;
          }
      }
    }
  };
  window.customElements.define("toggle-link", ToggleLink, { extends: "a" });


  // js/custom-element/behavior/share-toggle-button.js
  var ShareToggleButton = class extends ToggleButton {
    _onButtonClick() {
      if (window.matchMedia(window.themeVariables.breakpoints.phone).matches && navigator.share) {
        navigator.share({
          title: this.hasAttribute("share-title") ? this.getAttribute("share-title") : document.title,
          url: this.hasAttribute("share-url") ? this.getAttribute("share-url") : window.location.href
        });
      } else {
        super._onButtonClick();
      }
    }
  };
  window.customElements.define("share-toggle-button", ShareToggleButton, { extends: "button" });


  // js/custom-element/ui/popover.js
  var PopoverContent = class extends OpenableElement {
    connectedCallback() {
      super.connectedCallback();
      this.delegate.on("click", ".popover__overlay", () => this.open = false);
    }
    attributeChangedCallback(name, oldValue, newValue) {
      super.attributeChangedCallback(name, oldValue, newValue);
      switch (name) {
        case "open":
          document.documentElement.classList.toggle("lock-mobile", this.open);
      }
    }
  };
  window.customElements.define("popover-content", PopoverContent);


  // js/custom-element/ui/modal.js
  var ModalContent = class extends OpenableElement {
    connectedCallback() {
      super.connectedCallback();
      if (this.appearAfterDelay && !(this.onlyOnce && this.hasAppearedOnce)) {
        setTimeout(() => this.open = true, this.apparitionDelay);
      }
      this.delegate.on("click", ".modal__overlay", () => this.open = false);
    }
    get appearAfterDelay() {
      return this.hasAttribute("apparition-delay");
    }
    get apparitionDelay() {
      return parseInt(this.getAttribute("apparition-delay") || 0) * 1e3;
    }
    get onlyOnce() {
      return this.hasAttribute("only-once");
    }
    get hasAppearedOnce() {
      return localStorage.getItem("theme:popup-appeared") !== null;
    }
    attributeChangedCallback(name, oldValue, newValue) {
      super.attributeChangedCallback(name, oldValue, newValue);
      switch (name) {
        case "open":
          document.documentElement.classList.toggle("lock-all", this.open);
          if (this.open) {
            localStorage.setItem("theme:popup-appeared", true);
          }
      }
    }
  };
  window.customElements.define("modal-content", ModalContent);

  // js/custom-element/ui/modal-age.js
  var ModalContentAgeCheck = class extends OpenableElement {
    connectedCallback() {
      super.connectedCallback();
      if (this.appearAfterDelay && !(this.onlyOnce && this.hasAppearedOnce)) {
        setTimeout(() => this.open = true, this.apparitionDelay);
      }
      this.delegate.on("click", ".modal__overlay", () => this.open = false);
    }

    get appearAfterDelay() {
      return this.hasAttribute("apparition-delay");
    }
    get apparitionDelay() {
      return parseInt(this.getAttribute("apparition-delay") || 0) * 1e3;
    }
    get onlyOnce() {
      return this.hasAttribute("only-once");
    }
     get hasAppearedOnce() {
      return localStorage.getItem("Agecheck") !== null;
    } 
    attributeChangedCallback(name, oldValue, newValue) {
      super.attributeChangedCallback(name, oldValue, newValue);
      switch (name) {
        case "open":
          document.documentElement.classList.toggle("lock-all", this.open);
          if (this.open) {
            localStorage.setItem("Agecheck", );
          }
      }
    }
  };

  window.customElements.define("modal-content-age", ModalContentAgeCheck);

  // js/index.js
  (() => {
    new InputBindingManager();
  })();
  (() => {
    if (Shopify.designMode) {
      document.addEventListener("shopify:section:load", () => {
        if (window.SPR) {
          window.SPR.initDomEls();
          window.SPR.loadProducts();
        }
      });
    }
    window.SPRCallbacks = {
      onFormSuccess: (event, info) => {
        document.getElementById(`form_${info.id}`).classList.add("spr-form--success");
      }
    };
  })();
  (() => {
    let previousClientWidth = window.visualViewport ? window.visualViewport.width : document.documentElement.clientWidth;
    let setViewportProperty = () => {
      const clientWidth = window.visualViewport ? window.visualViewport.width : document.documentElement.clientWidth, clientHeight = window.visualViewport ? window.visualViewport.height : document.documentElement.clientHeight;
      if (clientWidth === previousClientWidth) {
        return;
      }
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--window-height", clientHeight + "px");
        previousClientWidth = clientWidth;
      });
    };
    setViewportProperty();
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setViewportProperty);
    } else {
      window.addEventListener("resize", setViewportProperty);
    }
  })();
  (() => {
    let documentDelegate = new main_default(document.body);
    documentDelegate.on("keyup", 'input:not([type="checkbox"]):not([type="radio"]), textarea', (event, target) => {
      target.classList.toggle("is-filled", target.value !== "");
    });
    documentDelegate.on("change", "select", (event, target) => {
      target.parentNode.classList.toggle("is-filled", target.value !== "");
    });
  })();
  (() => {
    document.querySelectorAll(".rte table").forEach((table) => {
      table.outerHTML = '<div class="table-wrapper">' + table.outerHTML + "</div>";
    });
    document.querySelectorAll(".rte iframe").forEach((iframe) => {
      if (iframe.src.indexOf("youtube") !== -1 || iframe.src.indexOf("youtu.be") !== -1 || iframe.src.indexOf("vimeo") !== -1) {
        iframe.outerHTML = '<div class="video-wrapper">' + iframe.outerHTML + "</div>";
      }
    });
  })();
  (() => {
    let documentDelegate = new main_default(document.documentElement);
    documentDelegate.on("click", "[data-smooth-scroll]", (event, target) => {
      const elementToScroll = document.querySelector(target.getAttribute("href"));
      if (elementToScroll) {
        event.preventDefault();
        elementToScroll.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  })();
  (() => {
    document.addEventListener("keyup", function(event) {
      if (event.key === "Tab") {
        document.body.classList.remove("no-focus-outline");
        document.body.classList.add("focus-outline");
      }
    });
  })();
})();
/*!
* focus-trap 6.7.1
* @license MIT, https://github.com/focus-trap/focus-trap/blob/master/LICENSE
*/
/*!
* tabbable 5.2.1
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/
