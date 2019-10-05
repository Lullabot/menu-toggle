'use strict';
/* global optimizedResize */
// @todo Lots of bugs going from desktop to mobile nav
// @todo test in browsers
// @todo accessibility audit
// @todo make sure no-js works
// @todo make sure it can handle regular buttons

/**
 * Handles collapsible mega menu behavior
 *
 * Replaces initial markup with ideal accessible markup, initial markup works without JS but isn't great for accessibility;
 *
 * Initial markup should have the following elements:
 *     <input id="desktop-burger-toggle" class="menu-toggle u-element-invisible" type="checkbox" aria-controls="desktop-burger-menu-container">
 *     <label class="menu-toggle-button" for="desktop-burger-toggle" data-controls="desktop-burger-menu-container">
 *       Menu icon or Label Text
 *       <span class="menu-toggle-assistive-text u-element-invisible">Toggle menu visibility</span>
 *     </label>
 *     <div class="menu-toggle__toggleable">
 *       <div class="menu-toggle__toggleable-content-wrapper">
 *         Content in Collapsible Container
 *       </div>
 *     </div>
 */

// Keeps track of last open toggle
window.addEventListener('DOMContentLoaded', function () {
  document.querySelector('body').dataset.menuToggleLastOpenToggleTarget = '';
});

const menuToggle = {};

// Helper functions ----------------------------------------------------
/**
 * Ensures that the menu area and page are tall enough to show the menu
 * @param {DOM Object} $menuToggleTarget Sibling element to toggle button that opens
 */
menuToggle.AdjustMenuAndPageHeights = ($menuToggleTarget) => {
  const $bodyInner = document.querySelector('.body-inner');
  if (
    $menuToggleTarget.classList.contains('menu-toggle__toggleable--full-height')
    || $menuToggleTarget.classList.contains('menu-toggle__toggleable--full-height-on-open')
  ) {
    $menuToggleTarget.style.setProperty('height', `${window.innerHeight - $menuToggleTarget.getBoundingClientRect().top}px`);
    $bodyInner.style.setProperty('min-height', window.innerHeight);
    document.getElementsByTagName('body')[0].classList.add('u-body-no-scroll');
  }
  else {
    const menuToggleContentWrapperHeight = $menuToggleTarget.querySelector('.menu-toggle__toggleable-content-wrapper').offsetHeight;
    const bottomOfToggleTarget = menuToggleContentWrapperHeight + $menuToggleTarget.getBoundingClientRect().top;
    $menuToggleTarget.style.setProperty('height', `${menuToggleContentWrapperHeight}px`);
    $bodyInner.style.setProperty('min-height', `${bottomOfToggleTarget}px`);
  }
};

/**
 * Shuts a menu
 * @param {DOM Object} $menuToggleButton Button toggle
 * @param {DOM Object} $menuToggleTarget Sibling element to toggle button that opens
 * @param {function}   postShutCallback  Function to call after shut code
 */
menuToggle.Shut = ($menuToggleButton, $menuToggleTarget, postShutCallback) => {
  // Quick exit if it's already shut
  if (!$menuToggleButton.classList.contains('js-menu-toggle-button--active')) {
    return;
  }
  const $body = document.querySelector('body');
  const $bodyInner = document.querySelector('.body-inner');
  $bodyInner.style.removeProperty('min-height');
  $menuToggleButton.setAttribute('aria-expanded', 'false');
  $menuToggleButton.classList.remove('js-menu-toggle-button--active');
  document.getElementsByTagName('body')[0].classList.remove('u-body-no-scroll');
  if (!$menuToggleTarget.classList.contains('menu-toggle__toggleable--full-height')) {
    $menuToggleTarget.style.setProperty('height', '0');
  }
  $menuToggleTarget.classList.remove('js-menu-toggle__toggleable--open');
  if ($menuToggleTarget.getAttribute('id') === $body.dataset.menuToggleLastOpenToggleTarget) {
    if ($menuToggleTarget.dataset.parentMenuToggle) {
      $body.dataset.menuToggleLastOpenToggleTarget = $menuToggleTarget.dataset.parentMenuToggle;
    }
    else {
      $body.dataset.menuToggleLastOpenToggleTarget = '';
    }
  }

  // Check to see if this is a child toggle and manage classes
  const $parentMenuToggleTarget =  document.getElementById($menuToggleTarget.dataset.parentMenuToggle);
  if ($parentMenuToggleTarget) {
    $parentMenuToggleTarget.classList.remove('js-menu-toggle__toggleable--active-child', 'js-menu-toggle__toggleable--active-child--transitioned');
  }
  $menuToggleButton.classList.remove('js-menu-toggle-button--active');
  $menuToggleTarget.classList.remove('js-menu-toggle__toggleable--open');

  // Close any open child menuToggles
  const $activeMenuToggleChildren = $menuToggleTarget.querySelectorAll('.js-menu-toggle-button--active');
  if ($activeMenuToggleChildren.length) {
    for (let i = 0; i < $activeMenuToggleChildren.length; i++) {
      // Shut open children when it's convenient
      setTimeout(
        menuToggle.Shut(
          $activeMenuToggleChildren[i],
          document.getElementById($activeMenuToggleChildren[i].getAttribute('aria-controls')),
          postShutCallback
        ),
        0
      );
    }
  }

  // Put focus on toggle's button after close
  $menuToggleButton.focus();

  if (typeof postShutCallback === 'function') {
    postShutCallback($menuToggleButton, $menuToggleTarget, $parentMenuToggleTarget);
  }
};

/**
 * Back out of current context
 * @param {function}  postShutCallback
 */
menuToggle.BackOut = (postShutCallback) => {
  // See where focus is and close nearest parent open toggle
  if (document.activeElement.tagName !== 'BODY') {
    const $openParentToggleTarget = document.activeElement.closest('.js-menu-toggle__toggleable--open');
    if ($openParentToggleTarget) {
      const $openParentToggle = document.querySelector(`[aria-controls="${$openParentToggleTarget.getAttribute('id')}"]`);
      // console.log('Back out', $openParentToggle);
      menuToggle.Shut(
        $openParentToggle,
        $openParentToggleTarget,
        postShutCallback
      );
      return;
    }
  }

  // Close the toggle that was opened last
  const $body = document.querySelector('body');
  if ($body.dataset.menuToggleLastOpenToggleTarget && $body.dataset.menuToggleLastOpenToggleTarget !== '') {
    const $openTarget = document.getElementById($body.dataset.menuToggleLastOpenToggleTarget);
    if ($openTarget) {
      const $openTargetToggle = document.querySelector(`[aria-controls="${$body.dataset.menuToggleLastOpenToggleTarget}"]`);
      // console.log('Closed last open', $openTargetToggle);
      menuToggle.Shut(
        $openTargetToggle,
        $openTarget,
        postShutCallback
      );
      return;
    }
  }
  // console.log('Couldn\'t find menu toggle to backout of');
};

/**
 * Open a menu
 * @param {DOM Object} $menuToggleButton Button toggle
 * @param {DOM Object} $menuToggleTarget Sibling element to toggle button that opens
 * @param {function}   postOpenCallback  Function to run after open behaviors
 */
menuToggle.Open = ($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback) => {
  const $body = document.querySelector('body');
  const currentToggleTarget = $menuToggleButton.getAttribute('aria-controls');
  const menuToggleLastOpenToggleTarget = $body.dataset.menuToggleLastOpenToggleTarget;

  // Shut an open toggle so long as it isn't a parent of the one we're opening
  if (
    menuToggleLastOpenToggleTarget
    && menuToggleLastOpenToggleTarget !== currentToggleTarget
  ) {
    const $lastOpenToggleTarget = document.getElementById(menuToggleLastOpenToggleTarget);
    const childOfOpenToggleTarget = $lastOpenToggleTarget.contains(document.getElementById(currentToggleTarget));
    if (!childOfOpenToggleTarget) {
      // console.log('Back Out During Open', $menuToggleButton);
      // Find the toggle target's button
      const $lastOpenToggleTargetsButton = document.querySelector('[aria-controls="' + menuToggleLastOpenToggleTarget + '"]');
      if ($lastOpenToggleTargetsButton) {
        menuToggle.Shut($lastOpenToggleTargetsButton, $lastOpenToggleTarget, postShutCallback);
      }
    }
  }
  menuToggle.AdjustMenuAndPageHeights($menuToggleTarget);
  $menuToggleButton.setAttribute('aria-expanded', 'true');
  $menuToggleButton.classList.add('js-menu-toggle-button--active');
  $menuToggleTarget.classList.add('js-menu-toggle__toggleable--open');
  const $parentMenuToggleTarget = document.getElementById($menuToggleTarget.dataset.parentMenuToggle);
  if ($parentMenuToggleTarget) {
    $parentMenuToggleTarget.classList.add('js-menu-toggle__toggleable--active-child');
  }
  $body.dataset.menuToggleLastOpenToggleTarget = currentToggleTarget;

  if (typeof postOpenCallback === 'function') {
    postOpenCallback($menuToggleButton, $menuToggleTarget, $parentMenuToggleTarget);
  }
};

/**
 * Toggle a given menu
 */
menuToggle.ToggleState = ($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback) => {
  $menuToggleTarget.classList.toggle('js-menu-toggle__toggleable--open');

  if ($menuToggleTarget.classList.contains('js-menu-toggle__toggleable--open')) {
    menuToggle.Open($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
  }
  else {
    // console.log('toggleState', $menuToggleButton);
    menuToggle.Shut($menuToggleButton, $menuToggleTarget, postShutCallback);
  }
};

/**
 * Initialize menu toggles
 * @param {DOM Object} $menuToggleButton The input label to toggle, should have class of 'menu-toggle-button'
 */
menuToggle.Init = (
  $menuToggleButton,
  postInitCallback,
  toggleButtonKeyboardHandler,
  toggleTargetKeyboardHandler,
  postOpenCallback,
  postShutCallback
  ) => {
  if ($menuToggleButton.tagName === 'BUTTON' && $menuToggleButton.classList.contains('js-menu-toggle-button')) {
    // Abort, we've already initialized this!
    return;
  }
  const menuToggleTargetID = $menuToggleButton.dataset.controls;
  const $menuToggleTarget = document.getElementById(menuToggleTargetID);
  const $body = document.querySelector('body');

  if ($menuToggleButton.tagName === 'LABEL') {
    const checkboxID = $menuToggleButton.getAttribute('for');
    const $menuToggleCheckbox = document.getElementById(checkboxID);
    /**
     * Create button HTML to replace checkbox
     */
    const $menuToggleNewButton = document.createElement('button');
    $menuToggleNewButton.innerHTML = $menuToggleButton.innerHTML;
    // Get classes from current button and add them to new button
    $menuToggleButton.getAttribute('class').split(' ').forEach(className => {
      // Strip white space
      className = className.replace(/^\s+|\s+$/g, '');
      if (className.length) {
        $menuToggleNewButton.classList.add(className);
      }
    });
    $menuToggleNewButton.setAttribute('aria-controls', $menuToggleButton.getAttribute('data-controls'));
    $menuToggleNewButton.setAttribute('id', checkboxID);
    $menuToggleNewButton.setAttribute('aria-haspopup', 'true');
    $menuToggleNewButton.setAttribute('aria-expanded', 'false');

    // Remove checkbox
    $menuToggleCheckbox.remove();
    // Replace label with button
    $menuToggleButton.parentNode.replaceChild($menuToggleNewButton, $menuToggleButton);
    $menuToggleButton = $menuToggleNewButton;
  }

  // Class to let us know this has been initialized
  $menuToggleButton.classList.add('js-menu-toggle-button');

  // If the toggle is visible, add class to target to show this JS has been processed
  if (getComputedStyle($menuToggleButton).display !== 'none') {
    $menuToggleTarget.classList.add('js-menu-toggle__toggleable');
  }

  // If we have a parent toggle set an attribute that gives us the id
  // @todo Test in IE
  const $parentMenuToggleTarget = $menuToggleTarget.parentElement.closest('.menu-toggle__toggleable');
  if ($parentMenuToggleTarget !== null) {
    $menuToggleTarget.dataset.parentMenuToggle = $parentMenuToggleTarget.getAttribute('id');
  }

  // Toggle button click behavior
  $menuToggleButton.addEventListener('click', () => {
    menuToggle.ToggleState($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
  });

  /**
   * Default Toggle Button Keyboard event handler
   * @param {object} event
   */
  const defaultToggleButtonKeyboardHandler = (event) => {
    // var $target = event.target;
    var keyCode = event.which;

    // RIGHT
    if (keyCode === 39) {
      event.preventDefault();
      event.stopPropagation();
      menuToggle.Open($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
    }
    // LEFT
    else if (keyCode === 37) {
      event.preventDefault();
      event.stopPropagation();
      // console.log('Left Button', $menuToggleButton);
      menuToggle.Shut(
        $menuToggleButton,
        $menuToggleTarget,
        postShutCallback
      );
    }
    // DOWN
    else if (keyCode === 40) {
      event.preventDefault();
      event.stopPropagation();
      menuToggle.Open($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
    }
    // UP
    else if (keyCode === 38) {
      event.preventDefault();
      event.stopPropagation();
      // console.log('Up Button', $menuToggleButton);
      menuToggle.Shut($menuToggleButton, $menuToggleTarget, postShutCallback);
    }
    // ESCAPE
    else if (keyCode === 27) {
      // console.log('pressed escape, toggle button', $menuToggleButton);
      event.preventDefault();
      event.stopPropagation();
      menuToggle.Shut($menuToggleButton, $menuToggleTarget, postShutCallback);
    }
    // Space or Enter
    else if (keyCode === 13 || keyCode === 32) {
      event.preventDefault();
      event.stopPropagation();
      menuToggle.ToggleState(
        $menuToggleButton,
        $menuToggleTarget,
        postOpenCallback,
        postShutCallback
      );
    }
  };

  /**
   * Default Toggle Button Keyboard event handler
   * @param {object} event
   */
  const defaultToggleTargetKeyboardHandler = (event) => {
    var $target = event.target;
    var keyCode = event.which;

    // ESCAPE
    if (keyCode === 27) {
      // console.log('pressed escape, toggle target', $target);
      event.preventDefault();
      event.stopPropagation();
      if ($target.tagName !== 'BUTTON' && !$target.classList.contains('js-menu-toggle-button')) {
        menuToggle.BackOut(postShutCallback);
      }
    }
  };


  // Set keyboard handlers
  if (typeof toggleButtonKeyboardHandler === 'function') {
    $menuToggleButton.addEventListener('keydown', toggleButtonKeyboardHandler);
  }
  else {
    $menuToggleButton.addEventListener('keydown', defaultToggleButtonKeyboardHandler);
  }

  // Set keyboard handlers
  if (typeof toggleTargetKeyboardHandler === 'function') {
    $menuToggleTarget.addEventListener('keydown', toggleTargetKeyboardHandler);
  }
  else {
    $menuToggleTarget.addEventListener('keydown', defaultToggleTargetKeyboardHandler);
  }

  // Add close button if class has been added to toggleable container
  if ($menuToggleTarget.classList.contains('menu-toggle__toggleable--with-close')) {
    const $menuToggleableClose = document.createElement('button');
    $menuToggleableClose.classList.add('js-menu-toggle__toggleable__close');
    $menuToggleableClose.setAttribute('aria-controls', menuToggleTargetID);
    $menuToggleableClose.innerHTML = '<span class="element-invisible">Close</span>';

    $menuToggleableClose.addEventListener('click', () => {
      // console.log('shut button', this);
      menuToggle.Shut($menuToggleButton, $menuToggleTarget, postShutCallback);
    });

    $menuToggleTarget.appendChild($menuToggleableClose);
  }

  optimizedResize.add(() => {
    const menuToggleButtonDisplay = getComputedStyle($menuToggleButton).display;
    // On resize remove classes if the toggle button is hidden
    if (menuToggleButtonDisplay === 'none' && $menuToggleTarget.classList.contains('js-menu-toggle__toggleable')) {
      // Remove classes
      $menuToggleTarget.classList.remove('js-menu-toggle__toggleable');
    }
    // If the button isn't hidden and we don't have the js toggle classes, re-add
    else if (menuToggleButtonDisplay !== 'none' && !$menuToggleTarget.classList.contains('js-menu-toggle__toggleable')) {
      $menuToggleTarget.classList.add('js-menu-toggle__toggleable');
    }

    // On page resize make sure menu isn't and won't be clipped
    if ($body.dataset.menuToggleLastOpenToggleTarget) {
      menuToggle.AdjustMenuAndPageHeights(document.getElementById($body.dataset.menuToggleLastOpenToggleTarget));
    }
  });

  if (typeof postInitCallback === 'function') {
    postInitCallback($menuToggleButton, $menuToggleTarget, menuToggle.Open, menuToggle.Shut);
  }
};
