'use strict';
/**
 * Polyfill for Element​.closest()
 * From https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
 */

if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function (s) {
    var el = this;

    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);

    return null;
  };
}

'use strict';
/**
 * Optimized resize handler
 * @see https://developer.mozilla.org/en-US/docs/Web/Events/resize#requestAnimationFrame
 *
 * @example
 *     optimizedResize.add(() => console.log('Resource conscious resize callback!'));
 */
// eslint-disable-next-line no-unused-vars


var optimizedResize = function () {
  var callbacks = [],
      running = false; // Fired on resize event

  var onResize = function onResize() {
    if (!running) {
      running = true;

      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(runCallbacks);
      } else {
        setTimeout(runCallbacks, 66);
      }
    }
  }; // Run the callbacks


  var runCallbacks = function runCallbacks() {
    callbacks.forEach(function (callback) {
      callback();
    });
    running = false;
  }; // Adds callback to loop


  var addCallback = function addCallback(callback) {
    if (callback) {
      callbacks.push(callback);
    }
  };

  return {
    // Public method to add additional callback
    'add': function add(callback) {
      if (!callbacks.length) {
        window.addEventListener('resize', onResize);
      }

      addCallback(callback);
    }
  };
}();

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


document.querySelector('body').dataset.menuToggleLastOpenToggleTarget = '';
var menuToggle = {}; // Helper functions ----------------------------------------------------

/**
 * Ensures that the menu area and page are tall enough to show the menu
 * @param {DOM Object} $menuToggleTarget Sibling element to toggle button that opens
 */

menuToggle.AdjustMenuAndPageHeights = function ($menuToggleTarget) {
  var $bodyInner = document.querySelector('.body-inner');

  if ($menuToggleTarget.classList.contains('menu-toggle__toggleable--full-height')) {
    $menuToggleTarget.style.setProperty('height', "".concat(window.innerHeight - $menuToggleTarget.getBoundingClientRect().top, "px"));
    $bodyInner.style.setProperty('min-height', window.innerHeight);
    document.getElementsByTagName('body')[0].classList.add('u-body-no-scroll');
  } else {
    var menuToggleContentWrapperHeight = $menuToggleTarget.querySelector('.menu-toggle__toggleable-content-wrapper').offsetHeight;
    var bottomOfToggleTarget = menuToggleContentWrapperHeight + $menuToggleTarget.getBoundingClientRect().top;
    $menuToggleTarget.style.setProperty('height', "".concat(menuToggleContentWrapperHeight, "px"));
    $bodyInner.style.setProperty('min-height', "".concat(bottomOfToggleTarget, "px"));
  }
};
/**
 * Shuts a menu
 * @param {DOM Object} $menuToggleButton Button toggle
 * @param {DOM Object} $menuToggleTarget Sibling element to toggle button that opens
 * @param {function}   postShutCallback  Function to call after shut code
 */


menuToggle.Shut = function ($menuToggleButton, $menuToggleTarget, postShutCallback) {
  var $body = document.querySelector('body');
  var $bodyInner = document.querySelector('.body-inner');
  $bodyInner.style.removeProperty('min-height');
  $menuToggleButton.setAttribute('aria-expanded', 'false');
  $menuToggleButton.classList.remove('js-menu-toggle-button--active');
  document.getElementsByTagName('body')[0].classList.remove('u-body-no-scroll');

  if (!$menuToggleTarget.classList.contains('menu-toggle__toggleable--full-height')) {
    $menuToggleTarget.style.setProperty('height', '0');
  }

  $menuToggleTarget.classList.remove('js-menu-toggle__toggleable--open');

  if ($menuToggleTarget.getAttribute('id') === $body.dataset.menuToggleLastOpenToggleTarget) {
    if ($menuToggleTarget.dataset.parentMenuToggle) $body.dataset.menuToggleLastOpenToggleTarget = '';
  } // Check to see if this is a child toggle and manage classes


  var $parentMenuToggleTarget = document.getElementById($menuToggleTarget.dataset.parentMenuToggle);

  if ($parentMenuToggleTarget) {
    $parentMenuToggleTarget.classList.remove('js-menu-toggle__toggleable--active-child', 'js-menu-toggle__toggleable--active-child--transitioned');
  }

  $menuToggleButton.classList.remove('js-menu-toggle-button--active');
  $menuToggleTarget.classList.remove('js-menu-toggle__toggleable--open'); // Close any open child menuToggles

  var $activeMenuToggleChildren = $menuToggleTarget.querySelectorAll('.js-menu-toggle-button--active');

  if ($activeMenuToggleChildren.length) {
    for (var i = 0; i < $activeMenuToggleChildren.length; i++) {
      // Shut open children when it's convenient
      setTimeout(menuToggle.Shut($activeMenuToggleChildren[i], document.getElementById($activeMenuToggleChildren[i].getAttribute('aria-controls')), postShutCallback), 0);
    }
  } // Put focus on toggle's button after close


  $menuToggleButton.focus();

  if (typeof postShutCallback === 'function') {
    postShutCallback($menuToggleButton, $menuToggleTarget, $parentMenuToggleTarget);
  }
};
/**
 * Back out of current context
 * @param {function}  postShutCallback
 */


menuToggle.BackOut = function (postShutCallback) {
  // See where focus is and close nearest parent open toggle
  if (document.activeElement.tagName !== 'BODY') {
    var $openParentToggleTarget = document.activeElement.closest('.js-menu-toggle__toggleable--open');

    if ($openParentToggleTarget) {
      var $openParentToggle = document.querySelector("[aria-controls=\"".concat($openParentToggleTarget.getAttribute('id'), "\"]")); // console.log('Back out', $openParentToggle);

      menuToggle.Shut($openParentToggle, $openParentToggleTarget, postShutCallback);
      return;
    }
  } // Close the toggle that was opened last


  var $body = document.querySelector('body');

  if ($body.dataset.menuToggleLastOpenToggleTarget && $body.dataset.menuToggleLastOpenToggleTarget !== '') {
    var $openTarget = document.getElementById($body.dataset.menuToggleLastOpenToggleTarget);

    if ($openTarget) {
      var $openTargetToggle = document.querySelector("[aria-controls=\"".concat($body.dataset.menuToggleLastOpenToggleTarget, "\"]")); // console.log('Closed last open', $openTargetToggle);

      menuToggle.Shut($openTargetToggle, $openTarget, postShutCallback);
      return;
    }
  } // console.log('Couldn\'t find menu toggle to backout of');

};
/**
 * Open a menu
 * @param {DOM Object} $menuToggleButton Button toggle
 * @param {DOM Object} $menuToggleTarget Sibling element to toggle button that opens
 * @param {function}   postOpenCallback  Function to run after open behaviors
 */


menuToggle.Open = function ($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback) {
  var $body = document.querySelector('body');
  var currentToggleTarget = $menuToggleButton.getAttribute('aria-controls'); // Shut an open toggle so long as it isn't a parent of the one we're opening

  if ($body.dataset.menuToggleLastOpenToggleTarget && $body.dataset.menuToggleLastOpenToggleTarget !== currentToggleTarget) {
    var childOfOpenToggleTarget = document.getElementById($body.dataset.menuToggleLastOpenToggleTarget).contains(document.getElementById(currentToggleTarget));

    if (!childOfOpenToggleTarget) {
      // console.log('Back Out During Open', $menuToggleButton);
      menuToggle.BackOut(postShutCallback);
    }
  }

  menuToggle.AdjustMenuAndPageHeights($menuToggleTarget);
  $menuToggleButton.setAttribute('aria-expanded', 'true');
  $menuToggleButton.classList.add('js-menu-toggle-button--active');
  $menuToggleTarget.classList.add('js-menu-toggle__toggleable--open');
  var $parentMenuToggleTarget = document.getElementById($menuToggleTarget.dataset.parentMenuToggle);

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


menuToggle.ToggleState = function ($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback) {
  $menuToggleTarget.classList.toggle('js-menu-toggle__toggleable--open');

  if ($menuToggleTarget.classList.contains('js-menu-toggle__toggleable--open')) {
    menuToggle.Open($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
  } else {
    // console.log('toggleState', $menuToggleButton);
    menuToggle.Shut($menuToggleButton, $menuToggleTarget, postShutCallback);
  }
};
/**
 * Initialize menu toggles
 * @param {DOM Object} $menuToggleButton The input label to toggle, should have class of 'menu-toggle-button'
 */


menuToggle.Init = function ($menuToggleButton, postInitCallback, toggleButtonKeyboardHandler, toggleTargetKeyboardHandler, postOpenCallback, postShutCallback) {
  if ($menuToggleButton.tagName === 'BUTTON' && $menuToggleButton.classList.contains('js-menu-toggle-button')) {
    // Abort, we've already initialized this!
    return;
  }

  var menuToggleTargetID = $menuToggleButton.dataset.controls;
  var $menuToggleTarget = document.getElementById(menuToggleTargetID);
  var $body = document.querySelector('body');

  if ($menuToggleButton.tagName === 'LABEL') {
    var checkboxID = $menuToggleButton.getAttribute('for');
    var $menuToggleCheckbox = document.getElementById(checkboxID);
    /**
     * Create button HTML to replace checkbox
     */

    var $menuToggleNewButton = document.createElement('button');
    $menuToggleNewButton.innerHTML = $menuToggleButton.innerHTML; // Get classes from current button and add them to new button

    $menuToggleButton.getAttribute('class').split(' ').forEach(function (className) {
      // Strip white space
      className = className.replace(/^\s+|\s+$/g, '');

      if (className.length) {
        $menuToggleNewButton.classList.add(className);
      }
    });
    $menuToggleNewButton.setAttribute('aria-controls', $menuToggleButton.getAttribute('data-controls'));
    $menuToggleNewButton.setAttribute('id', checkboxID);
    $menuToggleNewButton.setAttribute('aria-haspopup', 'true');
    $menuToggleNewButton.setAttribute('aria-expanded', 'false'); // Remove checkbox

    $menuToggleCheckbox.remove(); // Replace label with button

    $menuToggleButton.parentNode.replaceChild($menuToggleNewButton, $menuToggleButton);
    $menuToggleButton = $menuToggleNewButton;
  } // Class to let us know this has been initialized


  $menuToggleButton.classList.add('js-menu-toggle-button'); // If the toggle is visible, add class to target to show this JS has been processed

  if (getComputedStyle($menuToggleButton).display !== 'none') {
    $menuToggleTarget.classList.add('js-menu-toggle__toggleable');
  } // If we have a parent toggle set an attribute that gives us the id
  // @todo Test in IE


  var $parentMenuToggleTarget = $menuToggleTarget.parentElement.closest('.menu-toggle__toggleable');

  if ($parentMenuToggleTarget !== null) {
    $menuToggleTarget.dataset.parentMenuToggle = $parentMenuToggleTarget.getAttribute('id');
  } // Toggle button click behavior


  $menuToggleButton.addEventListener('click', function () {
    menuToggle.ToggleState($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
  });
  /**
   * Default Toggle Button Keyboard event handler
   * @param {object} event
   */

  var defaultToggleButtonKeyboardHandler = function defaultToggleButtonKeyboardHandler(event) {
    // var $target = event.target;
    var keyCode = event.which; // RIGHT

    if (keyCode === 39) {
      event.preventDefault();
      event.stopPropagation();
      menuToggle.Open($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
    } // LEFT
    else if (keyCode === 37) {
        event.preventDefault();
        event.stopPropagation(); // console.log('Left Button', $menuToggleButton);

        menuToggle.Shut($menuToggleButton, $menuToggleTarget, postShutCallback);
      } // DOWN
      else if (keyCode === 40) {
          event.preventDefault();
          event.stopPropagation();
          menuToggle.Open($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
        } // UP
        else if (keyCode === 38) {
            event.preventDefault();
            event.stopPropagation(); // console.log('Up Button', $menuToggleButton);

            menuToggle.Shut($menuToggleButton, $menuToggleTarget, postShutCallback);
          } // ESCAPE
          else if (keyCode === 27) {
              // console.log('pressed escape, toggle button', $menuToggleButton);
              event.preventDefault();
              event.stopPropagation();
              menuToggle.Shut($menuToggleButton, $menuToggleTarget, postShutCallback);
            } // Space or Enter
            else if (keyCode === 13 || keyCode === 32) {
                event.preventDefault();
                event.stopPropagation();
                menuToggle.ToggleState($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
              }
  };
  /**
   * Default Toggle Button Keyboard event handler
   * @param {object} event
   */


  var defaultToggleTargetKeyboardHandler = function defaultToggleTargetKeyboardHandler(event) {
    var $target = event.target;
    var keyCode = event.which; // ESCAPE

    if (keyCode === 27) {
      // console.log('pressed escape, toggle target', $target);
      event.preventDefault();
      event.stopPropagation();

      if ($target.tagName !== 'BUTTON' && !$target.classList.contains('js-menu-toggle-button')) {
        menuToggle.BackOut(postShutCallback);
      }
    }
  }; // Set keyboard handlers


  if (typeof toggleButtonKeyboardHandler === 'function') {
    $menuToggleButton.addEventListener('keydown', toggleButtonKeyboardHandler);
  } else {
    $menuToggleButton.addEventListener('keydown', defaultToggleButtonKeyboardHandler);
  } // Set keyboard handlers


  if (typeof toggleTargetKeyboardHandler === 'function') {
    $menuToggleTarget.addEventListener('keydown', toggleTargetKeyboardHandler);
  } else {
    $menuToggleTarget.addEventListener('keydown', defaultToggleTargetKeyboardHandler);
  } // Add close button if class has been added to toggleable container


  if ($menuToggleTarget.classList.contains('menu-toggle__toggleable--with-close')) {
    var $menuToggleableClose = document.createElement('button');
    $menuToggleableClose.classList.add('js-menu-toggle__toggleable__close');
    $menuToggleableClose.setAttribute('aria-controls', menuToggleTargetID);
    $menuToggleableClose.innerHTML = '<span class="element-invisible">Close</span>';
    $menuToggleableClose.addEventListener('click', function () {
      // console.log('shut button', this);
      menuToggle.Shut($menuToggleButton, $menuToggleTarget, postShutCallback);
    });
    $menuToggleTarget.appendChild($menuToggleableClose);
  } // Hide element after shut animation


  $menuToggleTarget.addEventListener('transitioned', function () {
    // If the toggle button is hidden this functionality is disabled, get outta hurr
    if (getComputedStyle($menuToggleButton).display === 'none') {
      return;
    } // After closing animation


    if (!$menuToggleTarget.classList.contains('js-menu-toggle__toggleable--open')) {
      // Miscellaneous Cleanup
      $menuToggleTarget.classList.remove('js-menu-toggle__toggleable--active-child');

      if ($menuToggleTarget.scrollTop !== 0) {
        $menuToggleTarget.scrollTop = 0;
      }

      if ($menuToggleTarget.scrollLeft !== 0) {
        $menuToggleTarget.scrollLeft = 0;
      }
    } // When it's completed animating open
    else {
        var _$parentMenuToggleTarget = document.getElementById($menuToggleTarget.dataset.parentMenuToggle);

        if (_$parentMenuToggleTarget) {
          _$parentMenuToggleTarget.classList.add('js-menu-toggle__toggleable--active-child--transitioned');
        } // Addressing some bug where a toggle opens and the height isn't set correctly


        if (!$menuToggleTarget.classList.contains('menu-toggle__toggleable--full-height') && $menuToggleTarget.querySelector('.menu-toggle__toggleable-content-wrapper').offsetHeight < $menuToggleTarget.offsetHeight) {
          menuToggle.AdjustMenuAndPageHeights($menuToggleTarget);
        }
      }
  });
  optimizedResize.add(function () {
    var menuToggleButtonDisplay = getComputedStyle($menuToggleButton).display; // On resize remove classes if the toggle button is hidden

    if (menuToggleButtonDisplay === 'none' && $menuToggleTarget.classList.contains('js-menu-toggle__toggleable')) {
      // Remove classes
      $menuToggleTarget.classList.remove('js-menu-toggle__toggleable');
    } // If the button isn't hidden and we don't have the js toggle classes, re-add
    else if (menuToggleButtonDisplay !== 'none' && !$menuToggleTarget.classList.contains('js-menu-toggle__toggleable')) {
        $menuToggleTarget.classList.add('js-menu-toggle__toggleable');
      } // On page resize make sure menu isn't and won't be clipped


    if ($body.dataset.menuToggleLastOpenToggleTarget) {
      menuToggle.AdjustMenuAndPageHeights(document.getElementById($body.dataset.menuToggleLastOpenToggleTarget));
    }
  });

  if (typeof postInitCallback === 'function') {
    postInitCallback($menuToggleButton, $menuToggleTarget, menuToggle.Open, menuToggle.Shut);
  }
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUtdG9nZ2xlLmpzIl0sIm5hbWVzIjpbIkVsZW1lbnQiLCJwcm90b3R5cGUiLCJtYXRjaGVzIiwibXNNYXRjaGVzU2VsZWN0b3IiLCJ3ZWJraXRNYXRjaGVzU2VsZWN0b3IiLCJjbG9zZXN0IiwicyIsImVsIiwicGFyZW50RWxlbWVudCIsInBhcmVudE5vZGUiLCJub2RlVHlwZSIsIm9wdGltaXplZFJlc2l6ZSIsImNhbGxiYWNrcyIsInJ1bm5pbmciLCJvblJlc2l6ZSIsIndpbmRvdyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInJ1bkNhbGxiYWNrcyIsInNldFRpbWVvdXQiLCJmb3JFYWNoIiwiY2FsbGJhY2siLCJhZGRDYWxsYmFjayIsInB1c2giLCJhZGQiLCJsZW5ndGgiLCJhZGRFdmVudExpc3RlbmVyIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yIiwiZGF0YXNldCIsIm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCIsIm1lbnVUb2dnbGUiLCJBZGp1c3RNZW51QW5kUGFnZUhlaWdodHMiLCIkbWVudVRvZ2dsZVRhcmdldCIsIiRib2R5SW5uZXIiLCJjbGFzc0xpc3QiLCJjb250YWlucyIsInN0eWxlIiwic2V0UHJvcGVydHkiLCJpbm5lckhlaWdodCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInRvcCIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwibWVudVRvZ2dsZUNvbnRlbnRXcmFwcGVySGVpZ2h0Iiwib2Zmc2V0SGVpZ2h0IiwiYm90dG9tT2ZUb2dnbGVUYXJnZXQiLCJTaHV0IiwiJG1lbnVUb2dnbGVCdXR0b24iLCJwb3N0U2h1dENhbGxiYWNrIiwiJGJvZHkiLCJyZW1vdmVQcm9wZXJ0eSIsInNldEF0dHJpYnV0ZSIsInJlbW92ZSIsImdldEF0dHJpYnV0ZSIsInBhcmVudE1lbnVUb2dnbGUiLCIkcGFyZW50TWVudVRvZ2dsZVRhcmdldCIsImdldEVsZW1lbnRCeUlkIiwiJGFjdGl2ZU1lbnVUb2dnbGVDaGlsZHJlbiIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJpIiwiZm9jdXMiLCJCYWNrT3V0IiwiYWN0aXZlRWxlbWVudCIsInRhZ05hbWUiLCIkb3BlblBhcmVudFRvZ2dsZVRhcmdldCIsIiRvcGVuUGFyZW50VG9nZ2xlIiwiJG9wZW5UYXJnZXQiLCIkb3BlblRhcmdldFRvZ2dsZSIsIk9wZW4iLCJwb3N0T3BlbkNhbGxiYWNrIiwiY3VycmVudFRvZ2dsZVRhcmdldCIsImNoaWxkT2ZPcGVuVG9nZ2xlVGFyZ2V0IiwiVG9nZ2xlU3RhdGUiLCJ0b2dnbGUiLCJJbml0IiwicG9zdEluaXRDYWxsYmFjayIsInRvZ2dsZUJ1dHRvbktleWJvYXJkSGFuZGxlciIsInRvZ2dsZVRhcmdldEtleWJvYXJkSGFuZGxlciIsIm1lbnVUb2dnbGVUYXJnZXRJRCIsImNvbnRyb2xzIiwiY2hlY2tib3hJRCIsIiRtZW51VG9nZ2xlQ2hlY2tib3giLCIkbWVudVRvZ2dsZU5ld0J1dHRvbiIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJzcGxpdCIsImNsYXNzTmFtZSIsInJlcGxhY2UiLCJyZXBsYWNlQ2hpbGQiLCJnZXRDb21wdXRlZFN0eWxlIiwiZGlzcGxheSIsImRlZmF1bHRUb2dnbGVCdXR0b25LZXlib2FyZEhhbmRsZXIiLCJldmVudCIsImtleUNvZGUiLCJ3aGljaCIsInByZXZlbnREZWZhdWx0Iiwic3RvcFByb3BhZ2F0aW9uIiwiZGVmYXVsdFRvZ2dsZVRhcmdldEtleWJvYXJkSGFuZGxlciIsIiR0YXJnZXQiLCJ0YXJnZXQiLCIkbWVudVRvZ2dsZWFibGVDbG9zZSIsImFwcGVuZENoaWxkIiwic2Nyb2xsVG9wIiwic2Nyb2xsTGVmdCIsIm1lbnVUb2dnbGVCdXR0b25EaXNwbGF5Il0sIm1hcHBpbmdzIjoiQUFBQTtBQUVBOzs7OztBQUlBLElBQUksQ0FBQ0EsT0FBTyxDQUFDQyxTQUFSLENBQWtCQyxPQUF2QixFQUFnQztBQUM5QkYsRUFBQUEsT0FBTyxDQUFDQyxTQUFSLENBQWtCQyxPQUFsQixHQUE0QkYsT0FBTyxDQUFD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LGlCQUFpQixDQUFDRSxTQUFsQixDQUE0QlgsR0FBNUIsQ0FBZ0MsNEJBQWhDO0FBQ0QsT0FWdUIsQ0FZeEI7OztBQUNBLFFBQUl5QixLQUFLLENBQUNwQixPQUFOLENBQWNDLDhCQUFsQixFQUFrRDtBQUNoREMsTUFBQUEsVUFBVSxDQUFDQyx3QkFBWCxDQUFvQ0wsUUFBUSxDQUFDNkIsY0FBVCxDQUF3QlAsS0FBSyxDQUFDcEIsT0FBTixDQUFjQyw4QkFBdEMsQ0FBcEM7QUFDRDtBQUNGLEdBaEJEOztBQWtCQSxNQUFJLE9BQU82QyxnQkFBUCxLQUE0QixVQUFoQyxFQUE0QztBQUMxQ0EsSUFBQUEsZ0JBQWdCLENBQUM1QixpQkFBRCxFQUFvQmQsaUJBQXBCLEVBQXVDRixVQUFVLENBQUNxQyxJQUFsRCxFQUF3RHJDLFVBQVUsQ0FBQ2UsSUFBbkUsQ0FBaEI7QUFDRDtBQUNGLENBdE9EIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFBvbHlmaWxsIGZvciBFbGVtZW504oCLLmNsb3Nlc3QoKVxuICogRnJvbSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9jbG9zZXN0I1BvbHlmaWxsXG4gKi9cbmlmICghRWxlbWVudC5wcm90b3R5cGUubWF0Y2hlcykge1xuICBFbGVtZW50LnByb3RvdHlwZS5tYXRjaGVzID0gRWxlbWVudC5wcm90b3R5cGUubXNNYXRjaGVzU2VsZWN0b3IgfHwgRWxlbWVudC5wcm90b3R5cGUud2Via2l0TWF0Y2hlc1NlbGVjdG9yO1xufVxuXG5pZiAoIUVsZW1lbnQucHJvdG90eXBlLmNsb3Nlc3QpIHtcbiAgRWxlbWVudC5wcm90b3R5cGUuY2xvc2VzdCA9IGZ1bmN0aW9uKHMpIHtcbiAgICB2YXIgZWwgPSB0aGlzO1xuICAgIGRvIHtcbiAgICAgIGlmIChlbC5tYXRjaGVzKHMpKSByZXR1cm4gZWw7XG4gICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQgfHwgZWwucGFyZW50Tm9kZTtcbiAgICB9IHdoaWxlIChlbCAhPT0gbnVsbCAmJiBlbC5ub2RlVHlwZSA9PT0gMSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG59XG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBPcHRpbWl6ZWQgcmVzaXplIGhhbmRsZXJcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvRXZlbnRzL3Jlc2l6ZSNyZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgIG9wdGltaXplZFJlc2l6ZS5hZGQoKCkgPT4gY29uc29sZS5sb2coJ1Jlc291cmNlIGNvbnNjaW91cyByZXNpemUgY2FsbGJhY2shJykpO1xuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbmNvbnN0IG9wdGltaXplZFJlc2l6ZSA9IChmdW5jdGlvbigpIHtcbiAgbGV0IGNhbGxiYWNrcyA9IFtdLFxuICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAvLyBGaXJlZCBvbiByZXNpemUgZXZlbnRcbiAgY29uc3Qgb25SZXNpemUgPSAoKSA9PiB7XG4gICAgaWYgKCFydW5uaW5nKSB7XG4gICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgIGlmICh3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocnVuQ2FsbGJhY2tzKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBzZXRUaW1lb3V0KHJ1bkNhbGxiYWNrcywgNjYpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBSdW4gdGhlIGNhbGxiYWNrc1xuICBjb25zdCBydW5DYWxsYmFja3MgPSAoKSA9PiB7XG4gICAgY2FsbGJhY2tzLmZvckVhY2goZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH0pO1xuICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgfTtcblxuICAvLyBBZGRzIGNhbGxiYWNrIHRvIGxvb3BcbiAgY29uc3QgYWRkQ2FsbGJhY2sgPSAoY2FsbGJhY2spID0+IHtcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICAvLyBQdWJsaWMgbWV0aG9kIHRvIGFkZCBhZGRpdGlvbmFsIGNhbGxiYWNrXG4gICAgJ2FkZCc6IGZ1bmN0aW9uIGFkZChjYWxsYmFjaykge1xuICAgICAgaWYgKCFjYWxsYmFja3MubGVuZ3RoKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvblJlc2l6ZSk7XG4gICAgICB9XG4gICAgICBhZGRDYWxsYmFjayhjYWxsYmFjayk7XG4gICAgfSxcbiAgfTtcbn0oKSk7XG5cbid1c2Ugc3RyaWN0Jztcbi8qIGdsb2JhbCBvcHRpbWl6ZWRSZXNpemUgKi9cbi8vIEB0b2RvIExvdHMgb2YgYnVncyBnb2luZyBmcm9tIGRlc2t0b3AgdG8gbW9iaWxlIG5hdlxuLy8gQHRvZG8gdGVzdCBpbiBicm93c2Vyc1xuLy8gQHRvZG8gYWNjZXNzaWJpbGl0eSBhdWRpdFxuLy8gQHRvZG8gbWFrZSBzdXJlIG5vLWpzIHdvcmtzXG4vLyBAdG9kbyBtYWtlIHN1cmUgaXQgY2FuIGhhbmRsZSByZWd1bGFyIGJ1dHRvbnNcblxuLyoqXG4gKiBIYW5kbGVzIGNvbGxhcHNpYmxlIG1lZ2EgbWVudSBiZWhhdmlvclxuICpcbiAqIFJlcGxhY2VzIGluaXRpYWwgbWFya3VwIHdpdGggaWRlYWwgYWNjZXNzaWJsZSBtYXJrdXAsIGluaXRpYWwgbWFya3VwIHdvcmtzIHdpdGhvdXQgSlMgYnV0IGlzbid0IGdyZWF0IGZvciBhY2Nlc3NpYmlsaXR5O1xuICpcbiAqIEluaXRpYWwgbWFya3VwIHNob3VsZCBoYXZlIHRoZSBmb2xsb3dpbmcgZWxlbWVudHM6XG4gKiAgICAgPGlucHV0IGlkPVwiZGVza3RvcC1idXJnZXItdG9nZ2xlXCIgY2xhc3M9XCJtZW51LXRvZ2dsZSB1LWVsZW1lbnQtaW52aXNpYmxlXCIgdHlwZT1cImNoZWNrYm94XCIgYXJpYS1jb250cm9scz1cImRlc2t0b3AtYnVyZ2VyLW1lbnUtY29udGFpbmVyXCI+XG4gKiAgICAgPGxhYmVsIGNsYXNzPVwibWVudS10b2dnbGUtYnV0dG9uXCIgZm9yPVwiZGVza3RvcC1idXJnZXItdG9nZ2xlXCIgZGF0YS1jb250cm9scz1cImRlc2t0b3AtYnVyZ2VyLW1lbnUtY29udGFpbmVyXCI+XG4gKiAgICAgICBNZW51IGljb24gb3IgTGFiZWwgVGV4dFxuICogICAgICAgPHNwYW4gY2xhc3M9XCJtZW51LXRvZ2dsZS1hc3Npc3RpdmUtdGV4dCB1LWVsZW1lbnQtaW52aXNpYmxlXCI+VG9nZ2xlIG1lbnUgdmlzaWJpbGl0eTwvc3Bhbj5cbiAqICAgICA8L2xhYmVsPlxuICogICAgIDxkaXYgY2xhc3M9XCJtZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZVwiPlxuICogICAgICAgPGRpdiBjbGFzcz1cIm1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLWNvbnRlbnQtd3JhcHBlclwiPlxuICogICAgICAgICBDb250ZW50IGluIENvbGxhcHNpYmxlIENvbnRhaW5lclxuICogICAgICAgPC9kaXY+XG4gKiAgICAgPC9kaXY+XG4gKi9cblxuLy8gS2VlcHMgdHJhY2sgb2YgbGFzdCBvcGVuIHRvZ2dsZVxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmRhdGFzZXQubWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0ID0gJyc7XG5cbmNvbnN0IG1lbnVUb2dnbGUgPSB7fTtcblxuLy8gSGVscGVyIGZ1bmN0aW9ucyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vKipcbiAqIEVuc3VyZXMgdGhhdCB0aGUgbWVudSBhcmVhIGFuZCBwYWdlIGFyZSB0YWxsIGVub3VnaCB0byBzaG93IHRoZSBtZW51XG4gKiBAcGFyYW0ge0RPTSBPYmplY3R9ICRtZW51VG9nZ2xlVGFyZ2V0IFNpYmxpbmcgZWxlbWVudCB0byB0b2dnbGUgYnV0dG9uIHRoYXQgb3BlbnNcbiAqL1xubWVudVRvZ2dsZS5BZGp1c3RNZW51QW5kUGFnZUhlaWdodHMgPSAoJG1lbnVUb2dnbGVUYXJnZXQpID0+IHtcbiAgY29uc3QgJGJvZHlJbm5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5ib2R5LWlubmVyJyk7XG4gIGlmICgkbWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1mdWxsLWhlaWdodCcpKSB7XG4gICAgJG1lbnVUb2dnbGVUYXJnZXQuc3R5bGUuc2V0UHJvcGVydHkoJ2hlaWdodCcsIGAke3dpbmRvdy5pbm5lckhlaWdodCAtICRtZW51VG9nZ2xlVGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcH1weGApO1xuICAgICRib2R5SW5uZXIuc3R5bGUuc2V0UHJvcGVydHkoJ21pbi1oZWlnaHQnLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0uY2xhc3NMaXN0LmFkZCgndS1ib2R5LW5vLXNjcm9sbCcpO1xuICB9XG4gIGVsc2Uge1xuICAgIGNvbnN0IG1lbnVUb2dnbGVDb250ZW50V3JhcHBlckhlaWdodCA9ICRtZW51VG9nZ2xlVGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS1jb250ZW50LXdyYXBwZXInKS5vZmZzZXRIZWlnaHQ7XG4gICAgY29uc3QgYm90dG9tT2ZUb2dnbGVUYXJnZXQgPSBtZW51VG9nZ2xlQ29udGVudFdyYXBwZXJIZWlnaHQgKyAkbWVudVRvZ2dsZVRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7XG4gICAgJG1lbnVUb2dnbGVUYXJnZXQuc3R5bGUuc2V0UHJvcGVydHkoJ2hlaWdodCcsIGAke21lbnVUb2dnbGVDb250ZW50V3JhcHBlckhlaWdodH1weGApO1xuICAgICRib2R5SW5uZXIuc3R5bGUuc2V0UHJvcGVydHkoJ21pbi1oZWlnaHQnLCBgJHtib3R0b21PZlRvZ2dsZVRhcmdldH1weGApO1xuICB9XG59O1xuXG4vKipcbiAqIFNodXRzIGEgbWVudVxuICogQHBhcmFtIHtET00gT2JqZWN0fSAkbWVudVRvZ2dsZUJ1dHRvbiBCdXR0b24gdG9nZ2xlXG4gKiBAcGFyYW0ge0RPTSBPYmplY3R9ICRtZW51VG9nZ2xlVGFyZ2V0IFNpYmxpbmcgZWxlbWVudCB0byB0b2dnbGUgYnV0dG9uIHRoYXQgb3BlbnNcbiAqIEBwYXJhbSB7ZnVuY3Rpb259ICAgcG9zdFNodXRDYWxsYmFjayAgRnVuY3Rpb24gdG8gY2FsbCBhZnRlciBzaHV0IGNvZGVcbiAqL1xubWVudVRvZ2dsZS5TaHV0ID0gKCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgcG9zdFNodXRDYWxsYmFjaykgPT4ge1xuICBjb25zdCAkYm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKTtcbiAgY29uc3QgJGJvZHlJbm5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5ib2R5LWlubmVyJyk7XG4gICRib2R5SW5uZXIuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ21pbi1oZWlnaHQnKTtcbiAgJG1lbnVUb2dnbGVCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICRtZW51VG9nZ2xlQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoJ2pzLW1lbnUtdG9nZ2xlLWJ1dHRvbi0tYWN0aXZlJyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0uY2xhc3NMaXN0LnJlbW92ZSgndS1ib2R5LW5vLXNjcm9sbCcpO1xuICBpZiAoISRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLWZ1bGwtaGVpZ2h0JykpIHtcbiAgICAkbWVudVRvZ2dsZVRhcmdldC5zdHlsZS5zZXRQcm9wZXJ0eSgnaGVpZ2h0JywgJzAnKTtcbiAgfVxuICAkbWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS0tb3BlbicpO1xuICBpZiAoJG1lbnVUb2dnbGVUYXJnZXQuZ2V0QXR0cmlidXRlKCdpZCcpID09PSAkYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCkge1xuICAgIGlmICgkbWVudVRvZ2dsZVRhcmdldC5kYXRhc2V0LnBhcmVudE1lbnVUb2dnbGUpXG4gICAgJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQgPSAnJztcbiAgfVxuXG4gIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGlzIGEgY2hpbGQgdG9nZ2xlIGFuZCBtYW5hZ2UgY2xhc3Nlc1xuICBjb25zdCAkcGFyZW50TWVudVRvZ2dsZVRhcmdldCA9ICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgkbWVudVRvZ2dsZVRhcmdldC5kYXRhc2V0LnBhcmVudE1lbnVUb2dnbGUpO1xuICBpZiAoJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQpIHtcbiAgICAkcGFyZW50TWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS0tYWN0aXZlLWNoaWxkJywgJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1hY3RpdmUtY2hpbGQtLXRyYW5zaXRpb25lZCcpO1xuICB9XG4gICRtZW51VG9nZ2xlQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoJ2pzLW1lbnUtdG9nZ2xlLWJ1dHRvbi0tYWN0aXZlJyk7XG4gICRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1vcGVuJyk7XG5cbiAgLy8gQ2xvc2UgYW55IG9wZW4gY2hpbGQgbWVudVRvZ2dsZXNcbiAgY29uc3QgJGFjdGl2ZU1lbnVUb2dnbGVDaGlsZHJlbiA9ICRtZW51VG9nZ2xlVGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy5qcy1tZW51LXRvZ2dsZS1idXR0b24tLWFjdGl2ZScpO1xuICBpZiAoJGFjdGl2ZU1lbnVUb2dnbGVDaGlsZHJlbi5sZW5ndGgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8ICRhY3RpdmVNZW51VG9nZ2xlQ2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIFNodXQgb3BlbiBjaGlsZHJlbiB3aGVuIGl0J3MgY29udmVuaWVudFxuICAgICAgc2V0VGltZW91dChcbiAgICAgICAgbWVudVRvZ2dsZS5TaHV0KFxuICAgICAgICAgICRhY3RpdmVNZW51VG9nZ2xlQ2hpbGRyZW5baV0sXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJGFjdGl2ZU1lbnVUb2dnbGVDaGlsZHJlbltpXS5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKSksXG4gICAgICAgICAgcG9zdFNodXRDYWxsYmFja1xuICAgICAgICApLFxuICAgICAgICAwXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8vIFB1dCBmb2N1cyBvbiB0b2dnbGUncyBidXR0b24gYWZ0ZXIgY2xvc2VcbiAgJG1lbnVUb2dnbGVCdXR0b24uZm9jdXMoKTtcblxuICBpZiAodHlwZW9mIHBvc3RTaHV0Q2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICBwb3N0U2h1dENhbGxiYWNrKCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQpO1xuICB9XG59O1xuXG4vKipcbiAqIEJhY2sgb3V0IG9mIGN1cnJlbnQgY29udGV4dFxuICogQHBhcmFtIHtmdW5jdGlvbn0gIHBvc3RTaHV0Q2FsbGJhY2tcbiAqL1xubWVudVRvZ2dsZS5CYWNrT3V0ID0gKHBvc3RTaHV0Q2FsbGJhY2spID0+IHtcbiAgLy8gU2VlIHdoZXJlIGZvY3VzIGlzIGFuZCBjbG9zZSBuZWFyZXN0IHBhcmVudCBvcGVuIHRvZ2dsZVxuICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudC50YWdOYW1lICE9PSAnQk9EWScpIHtcbiAgICBjb25zdCAkb3BlblBhcmVudFRvZ2dsZVRhcmdldCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuY2xvc2VzdCgnLmpzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1vcGVuJyk7XG4gICAgaWYgKCRvcGVuUGFyZW50VG9nZ2xlVGFyZ2V0KSB7XG4gICAgICBjb25zdCAkb3BlblBhcmVudFRvZ2dsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFthcmlhLWNvbnRyb2xzPVwiJHskb3BlblBhcmVudFRvZ2dsZVRhcmdldC5nZXRBdHRyaWJ1dGUoJ2lkJyl9XCJdYCk7XG4gICAgICAvLyBjb25zb2xlLmxvZygnQmFjayBvdXQnLCAkb3BlblBhcmVudFRvZ2dsZSk7XG4gICAgICBtZW51VG9nZ2xlLlNodXQoXG4gICAgICAgICRvcGVuUGFyZW50VG9nZ2xlLFxuICAgICAgICAkb3BlblBhcmVudFRvZ2dsZVRhcmdldCxcbiAgICAgICAgcG9zdFNodXRDYWxsYmFja1xuICAgICAgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICAvLyBDbG9zZSB0aGUgdG9nZ2xlIHRoYXQgd2FzIG9wZW5lZCBsYXN0XG4gIGNvbnN0ICRib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuICBpZiAoJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQgJiYgJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQgIT09ICcnKSB7XG4gICAgY29uc3QgJG9wZW5UYXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgkYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCk7XG4gICAgaWYgKCRvcGVuVGFyZ2V0KSB7XG4gICAgICBjb25zdCAkb3BlblRhcmdldFRvZ2dsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFthcmlhLWNvbnRyb2xzPVwiJHskYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldH1cIl1gKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdDbG9zZWQgbGFzdCBvcGVuJywgJG9wZW5UYXJnZXRUb2dnbGUpO1xuICAgICAgbWVudVRvZ2dsZS5TaHV0KFxuICAgICAgICAkb3BlblRhcmdldFRvZ2dsZSxcbiAgICAgICAgJG9wZW5UYXJnZXQsXG4gICAgICAgIHBvc3RTaHV0Q2FsbGJhY2tcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIC8vIGNvbnNvbGUubG9nKCdDb3VsZG5cXCd0IGZpbmQgbWVudSB0b2dnbGUgdG8gYmFja291dCBvZicpO1xufTtcblxuLyoqXG4gKiBPcGVuIGEgbWVudVxuICogQHBhcmFtIHtET00gT2JqZWN0fSAkbWVudVRvZ2dsZUJ1dHRvbiBCdXR0b24gdG9nZ2xlXG4gKiBAcGFyYW0ge0RPTSBPYmplY3R9ICRtZW51VG9nZ2xlVGFyZ2V0IFNpYmxpbmcgZWxlbWVudCB0byB0b2dnbGUgYnV0dG9uIHRoYXQgb3BlbnNcbiAqIEBwYXJhbSB7ZnVuY3Rpb259ICAgcG9zdE9wZW5DYWxsYmFjayAgRnVuY3Rpb24gdG8gcnVuIGFmdGVyIG9wZW4gYmVoYXZpb3JzXG4gKi9cbm1lbnVUb2dnbGUuT3BlbiA9ICgkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIHBvc3RPcGVuQ2FsbGJhY2ssIHBvc3RTaHV0Q2FsbGJhY2spID0+IHtcbiAgY29uc3QgJGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG4gIGNvbnN0IGN1cnJlbnRUb2dnbGVUYXJnZXQgPSAkbWVudVRvZ2dsZUJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKTtcbiAgLy8gU2h1dCBhbiBvcGVuIHRvZ2dsZSBzbyBsb25nIGFzIGl0IGlzbid0IGEgcGFyZW50IG9mIHRoZSBvbmUgd2UncmUgb3BlbmluZ1xuICBpZiAoXG4gICAgJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXRcbiAgICAmJiAkYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCAhPT0gY3VycmVudFRvZ2dsZVRhcmdldFxuICApIHtcbiAgICBjb25zdCBjaGlsZE9mT3BlblRvZ2dsZVRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCRib2R5LmRhdGFzZXQubWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0KS5jb250YWlucyhkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjdXJyZW50VG9nZ2xlVGFyZ2V0KSk7XG4gICAgaWYgKCFjaGlsZE9mT3BlblRvZ2dsZVRhcmdldCkge1xuICAgICAgLy8gY29uc29sZS5sb2coJ0JhY2sgT3V0IER1cmluZyBPcGVuJywgJG1lbnVUb2dnbGVCdXR0b24pO1xuICAgICAgbWVudVRvZ2dsZS5CYWNrT3V0KHBvc3RTaHV0Q2FsbGJhY2spO1xuICAgIH1cbiAgfVxuICBtZW51VG9nZ2xlLkFkanVzdE1lbnVBbmRQYWdlSGVpZ2h0cygkbWVudVRvZ2dsZVRhcmdldCk7XG4gICRtZW51VG9nZ2xlQnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICRtZW51VG9nZ2xlQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2pzLW1lbnUtdG9nZ2xlLWJ1dHRvbi0tYWN0aXZlJyk7XG4gICRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1vcGVuJyk7XG4gIGNvbnN0ICRwYXJlbnRNZW51VG9nZ2xlVGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJG1lbnVUb2dnbGVUYXJnZXQuZGF0YXNldC5wYXJlbnRNZW51VG9nZ2xlKTtcbiAgaWYgKCRwYXJlbnRNZW51VG9nZ2xlVGFyZ2V0KSB7XG4gICAgJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LmFkZCgnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLWFjdGl2ZS1jaGlsZCcpO1xuICB9XG4gICRib2R5LmRhdGFzZXQubWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0ID0gY3VycmVudFRvZ2dsZVRhcmdldDtcblxuICBpZiAodHlwZW9mIHBvc3RPcGVuQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICBwb3N0T3BlbkNhbGxiYWNrKCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQpO1xuICB9XG59O1xuXG4vKipcbiAqIFRvZ2dsZSBhIGdpdmVuIG1lbnVcbiAqL1xubWVudVRvZ2dsZS5Ub2dnbGVTdGF0ZSA9ICgkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIHBvc3RPcGVuQ2FsbGJhY2ssIHBvc3RTaHV0Q2FsbGJhY2spID0+IHtcbiAgJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LnRvZ2dsZSgnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLW9wZW4nKTtcblxuICBpZiAoJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS0tb3BlbicpKSB7XG4gICAgbWVudVRvZ2dsZS5PcGVuKCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgcG9zdE9wZW5DYWxsYmFjaywgcG9zdFNodXRDYWxsYmFjayk7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gY29uc29sZS5sb2coJ3RvZ2dsZVN0YXRlJywgJG1lbnVUb2dnbGVCdXR0b24pO1xuICAgIG1lbnVUb2dnbGUuU2h1dCgkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIHBvc3RTaHV0Q2FsbGJhY2spO1xuICB9XG59O1xuXG4vKipcbiAqIEluaXRpYWxpemUgbWVudSB0b2dnbGVzXG4gKiBAcGFyYW0ge0RPTSBPYmplY3R9ICRtZW51VG9nZ2xlQnV0dG9uIFRoZSBpbnB1dCBsYWJlbCB0byB0b2dnbGUsIHNob3VsZCBoYXZlIGNsYXNzIG9mICdtZW51LXRvZ2dsZS1idXR0b24nXG4gKi9cbm1lbnVUb2dnbGUuSW5pdCA9IChcbiAgJG1lbnVUb2dnbGVCdXR0b24sXG4gIHBvc3RJbml0Q2FsbGJhY2ssXG4gIHRvZ2dsZUJ1dHRvbktleWJvYXJkSGFuZGxlcixcbiAgdG9nZ2xlVGFyZ2V0S2V5Ym9hcmRIYW5kbGVyLFxuICBwb3N0T3BlbkNhbGxiYWNrLFxuICBwb3N0U2h1dENhbGxiYWNrXG4gICkgPT4ge1xuICBpZiAoJG1lbnVUb2dnbGVCdXR0b24udGFnTmFtZSA9PT0gJ0JVVFRPTicgJiYgJG1lbnVUb2dnbGVCdXR0b24uY2xhc3NMaXN0LmNvbnRhaW5zKCdqcy1tZW51LXRvZ2dsZS1idXR0b24nKSkge1xuICAgIC8vIEFib3J0LCB3ZSd2ZSBhbHJlYWR5IGluaXRpYWxpemVkIHRoaXMhXG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IG1lbnVUb2dnbGVUYXJnZXRJRCA9ICRtZW51VG9nZ2xlQnV0dG9uLmRhdGFzZXQuY29udHJvbHM7XG4gIGNvbnN0ICRtZW51VG9nZ2xlVGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWVudVRvZ2dsZVRhcmdldElEKTtcbiAgY29uc3QgJGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG5cbiAgaWYgKCRtZW51VG9nZ2xlQnV0dG9uLnRhZ05hbWUgPT09ICdMQUJFTCcpIHtcbiAgICBjb25zdCBjaGVja2JveElEID0gJG1lbnVUb2dnbGVCdXR0b24uZ2V0QXR0cmlidXRlKCdmb3InKTtcbiAgICBjb25zdCAkbWVudVRvZ2dsZUNoZWNrYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2hlY2tib3hJRCk7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGJ1dHRvbiBIVE1MIHRvIHJlcGxhY2UgY2hlY2tib3hcbiAgICAgKi9cbiAgICBjb25zdCAkbWVudVRvZ2dsZU5ld0J1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICRtZW51VG9nZ2xlTmV3QnV0dG9uLmlubmVySFRNTCA9ICRtZW51VG9nZ2xlQnV0dG9uLmlubmVySFRNTDtcbiAgICAvLyBHZXQgY2xhc3NlcyBmcm9tIGN1cnJlbnQgYnV0dG9uIGFuZCBhZGQgdGhlbSB0byBuZXcgYnV0dG9uXG4gICAgJG1lbnVUb2dnbGVCdXR0b24uZ2V0QXR0cmlidXRlKCdjbGFzcycpLnNwbGl0KCcgJykuZm9yRWFjaChjbGFzc05hbWUgPT4ge1xuICAgICAgLy8gU3RyaXAgd2hpdGUgc3BhY2VcbiAgICAgIGNsYXNzTmFtZSA9IGNsYXNzTmFtZS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG4gICAgICBpZiAoY2xhc3NOYW1lLmxlbmd0aCkge1xuICAgICAgICAkbWVudVRvZ2dsZU5ld0J1dHRvbi5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgJG1lbnVUb2dnbGVOZXdCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJywgJG1lbnVUb2dnbGVCdXR0b24uZ2V0QXR0cmlidXRlKCdkYXRhLWNvbnRyb2xzJykpO1xuICAgICRtZW51VG9nZ2xlTmV3QnV0dG9uLnNldEF0dHJpYnV0ZSgnaWQnLCBjaGVja2JveElEKTtcbiAgICAkbWVudVRvZ2dsZU5ld0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGFzcG9wdXAnLCAndHJ1ZScpO1xuICAgICRtZW51VG9nZ2xlTmV3QnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuXG4gICAgLy8gUmVtb3ZlIGNoZWNrYm94XG4gICAgJG1lbnVUb2dnbGVDaGVja2JveC5yZW1vdmUoKTtcbiAgICAvLyBSZXBsYWNlIGxhYmVsIHdpdGggYnV0dG9uXG4gICAgJG1lbnVUb2dnbGVCdXR0b24ucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoJG1lbnVUb2dnbGVOZXdCdXR0b24sICRtZW51VG9nZ2xlQnV0dG9uKTtcbiAgICAkbWVudVRvZ2dsZUJ1dHRvbiA9ICRtZW51VG9nZ2xlTmV3QnV0dG9uO1xuICB9XG5cbiAgLy8gQ2xhc3MgdG8gbGV0IHVzIGtub3cgdGhpcyBoYXMgYmVlbiBpbml0aWFsaXplZFxuICAkbWVudVRvZ2dsZUJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdqcy1tZW51LXRvZ2dsZS1idXR0b24nKTtcblxuICAvLyBJZiB0aGUgdG9nZ2xlIGlzIHZpc2libGUsIGFkZCBjbGFzcyB0byB0YXJnZXQgdG8gc2hvdyB0aGlzIEpTIGhhcyBiZWVuIHByb2Nlc3NlZFxuICBpZiAoZ2V0Q29tcHV0ZWRTdHlsZSgkbWVudVRvZ2dsZUJ1dHRvbikuZGlzcGxheSAhPT0gJ25vbmUnKSB7XG4gICAgJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LmFkZCgnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUnKTtcbiAgfVxuXG4gIC8vIElmIHdlIGhhdmUgYSBwYXJlbnQgdG9nZ2xlIHNldCBhbiBhdHRyaWJ1dGUgdGhhdCBnaXZlcyB1cyB0aGUgaWRcbiAgLy8gQHRvZG8gVGVzdCBpbiBJRVxuICBjb25zdCAkcGFyZW50TWVudVRvZ2dsZVRhcmdldCA9ICRtZW51VG9nZ2xlVGFyZ2V0LnBhcmVudEVsZW1lbnQuY2xvc2VzdCgnLm1lbnUtdG9nZ2xlX190b2dnbGVhYmxlJyk7XG4gIGlmICgkcGFyZW50TWVudVRvZ2dsZVRhcmdldCAhPT0gbnVsbCkge1xuICAgICRtZW51VG9nZ2xlVGFyZ2V0LmRhdGFzZXQucGFyZW50TWVudVRvZ2dsZSA9ICRwYXJlbnRNZW51VG9nZ2xlVGFyZ2V0LmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgfVxuXG4gIC8vIFRvZ2dsZSBidXR0b24gY2xpY2sgYmVoYXZpb3JcbiAgJG1lbnVUb2dnbGVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgbWVudVRvZ2dsZS5Ub2dnbGVTdGF0ZSgkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIHBvc3RPcGVuQ2FsbGJhY2ssIHBvc3RTaHV0Q2FsbGJhY2spO1xuICB9KTtcblxuICAvKipcbiAgICogRGVmYXVsdCBUb2dnbGUgQnV0dG9uIEtleWJvYXJkIGV2ZW50IGhhbmRsZXJcbiAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG4gICAqL1xuICBjb25zdCBkZWZhdWx0VG9nZ2xlQnV0dG9uS2V5Ym9hcmRIYW5kbGVyID0gKGV2ZW50KSA9PiB7XG4gICAgLy8gdmFyICR0YXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgdmFyIGtleUNvZGUgPSBldmVudC53aGljaDtcblxuICAgIC8vIFJJR0hUXG4gICAgaWYgKGtleUNvZGUgPT09IDM5KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBtZW51VG9nZ2xlLk9wZW4oJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBwb3N0T3BlbkNhbGxiYWNrLCBwb3N0U2h1dENhbGxiYWNrKTtcbiAgICB9XG4gICAgLy8gTEVGVFxuICAgIGVsc2UgaWYgKGtleUNvZGUgPT09IDM3KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAvLyBjb25zb2xlLmxvZygnTGVmdCBCdXR0b24nLCAkbWVudVRvZ2dsZUJ1dHRvbik7XG4gICAgICBtZW51VG9nZ2xlLlNodXQoXG4gICAgICAgICRtZW51VG9nZ2xlQnV0dG9uLFxuICAgICAgICAkbWVudVRvZ2dsZVRhcmdldCxcbiAgICAgICAgcG9zdFNodXRDYWxsYmFja1xuICAgICAgKTtcbiAgICB9XG4gICAgLy8gRE9XTlxuICAgIGVsc2UgaWYgKGtleUNvZGUgPT09IDQwKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBtZW51VG9nZ2xlLk9wZW4oJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBwb3N0T3BlbkNhbGxiYWNrLCBwb3N0U2h1dENhbGxiYWNrKTtcbiAgICB9XG4gICAgLy8gVVBcbiAgICBlbHNlIGlmIChrZXlDb2RlID09PSAzOCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgLy8gY29uc29sZS5sb2coJ1VwIEJ1dHRvbicsICRtZW51VG9nZ2xlQnV0dG9uKTtcbiAgICAgIG1lbnVUb2dnbGUuU2h1dCgkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIHBvc3RTaHV0Q2FsbGJhY2spO1xuICAgIH1cbiAgICAvLyBFU0NBUEVcbiAgICBlbHNlIGlmIChrZXlDb2RlID09PSAyNykge1xuICAgICAgLy8gY29uc29sZS5sb2coJ3ByZXNzZWQgZXNjYXBlLCB0b2dnbGUgYnV0dG9uJywgJG1lbnVUb2dnbGVCdXR0b24pO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgbWVudVRvZ2dsZS5TaHV0KCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgcG9zdFNodXRDYWxsYmFjayk7XG4gICAgfVxuICAgIC8vIFNwYWNlIG9yIEVudGVyXG4gICAgZWxzZSBpZiAoa2V5Q29kZSA9PT0gMTMgfHwga2V5Q29kZSA9PT0gMzIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIG1lbnVUb2dnbGUuVG9nZ2xlU3RhdGUoXG4gICAgICAgICRtZW51VG9nZ2xlQnV0dG9uLFxuICAgICAgICAkbWVudVRvZ2dsZVRhcmdldCxcbiAgICAgICAgcG9zdE9wZW5DYWxsYmFjayxcbiAgICAgICAgcG9zdFNodXRDYWxsYmFja1xuICAgICAgKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgVG9nZ2xlIEJ1dHRvbiBLZXlib2FyZCBldmVudCBoYW5kbGVyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBldmVudFxuICAgKi9cbiAgY29uc3QgZGVmYXVsdFRvZ2dsZVRhcmdldEtleWJvYXJkSGFuZGxlciA9IChldmVudCkgPT4ge1xuICAgIHZhciAkdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuICAgIHZhciBrZXlDb2RlID0gZXZlbnQud2hpY2g7XG5cbiAgICAvLyBFU0NBUEVcbiAgICBpZiAoa2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdwcmVzc2VkIGVzY2FwZSwgdG9nZ2xlIHRhcmdldCcsICR0YXJnZXQpO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgaWYgKCR0YXJnZXQudGFnTmFtZSAhPT0gJ0JVVFRPTicgJiYgISR0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdqcy1tZW51LXRvZ2dsZS1idXR0b24nKSkge1xuICAgICAgICBtZW51VG9nZ2xlLkJhY2tPdXQocG9zdFNodXRDYWxsYmFjayk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gU2V0IGtleWJvYXJkIGhhbmRsZXJzXG4gIGlmICh0eXBlb2YgdG9nZ2xlQnV0dG9uS2V5Ym9hcmRIYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgJG1lbnVUb2dnbGVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRvZ2dsZUJ1dHRvbktleWJvYXJkSGFuZGxlcik7XG4gIH1cbiAgZWxzZSB7XG4gICAgJG1lbnVUb2dnbGVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGRlZmF1bHRUb2dnbGVCdXR0b25LZXlib2FyZEhhbmRsZXIpO1xuICB9XG5cbiAgLy8gU2V0IGtleWJvYXJkIGhhbmRsZXJzXG4gIGlmICh0eXBlb2YgdG9nZ2xlVGFyZ2V0S2V5Ym9hcmRIYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgJG1lbnVUb2dnbGVUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRvZ2dsZVRhcmdldEtleWJvYXJkSGFuZGxlcik7XG4gIH1cbiAgZWxzZSB7XG4gICAgJG1lbnVUb2dnbGVUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGRlZmF1bHRUb2dnbGVUYXJnZXRLZXlib2FyZEhhbmRsZXIpO1xuICB9XG5cbiAgLy8gQWRkIGNsb3NlIGJ1dHRvbiBpZiBjbGFzcyBoYXMgYmVlbiBhZGRlZCB0byB0b2dnbGVhYmxlIGNvbnRhaW5lclxuICBpZiAoJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS0td2l0aC1jbG9zZScpKSB7XG4gICAgY29uc3QgJG1lbnVUb2dnbGVhYmxlQ2xvc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAkbWVudVRvZ2dsZWFibGVDbG9zZS5jbGFzc0xpc3QuYWRkKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZV9fY2xvc2UnKTtcbiAgICAkbWVudVRvZ2dsZWFibGVDbG9zZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnLCBtZW51VG9nZ2xlVGFyZ2V0SUQpO1xuICAgICRtZW51VG9nZ2xlYWJsZUNsb3NlLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz1cImVsZW1lbnQtaW52aXNpYmxlXCI+Q2xvc2U8L3NwYW4+JztcblxuICAgICRtZW51VG9nZ2xlYWJsZUNsb3NlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2coJ3NodXQgYnV0dG9uJywgdGhpcyk7XG4gICAgICBtZW51VG9nZ2xlLlNodXQoJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBwb3N0U2h1dENhbGxiYWNrKTtcbiAgICB9KTtcblxuICAgICRtZW51VG9nZ2xlVGFyZ2V0LmFwcGVuZENoaWxkKCRtZW51VG9nZ2xlYWJsZUNsb3NlKTtcbiAgfVxuXG4gIC8vIEhpZGUgZWxlbWVudCBhZnRlciBzaHV0IGFuaW1hdGlvblxuICAkbWVudVRvZ2dsZVRhcmdldC5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZWQnLCAoKSA9PiB7XG4gICAgLy8gSWYgdGhlIHRvZ2dsZSBidXR0b24gaXMgaGlkZGVuIHRoaXMgZnVuY3Rpb25hbGl0eSBpcyBkaXNhYmxlZCwgZ2V0IG91dHRhIGh1cnJcbiAgICBpZiAoZ2V0Q29tcHV0ZWRTdHlsZSgkbWVudVRvZ2dsZUJ1dHRvbikuZGlzcGxheSA9PT0gJ25vbmUnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQWZ0ZXIgY2xvc2luZyBhbmltYXRpb25cbiAgICBpZiAoISRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLW9wZW4nKSkge1xuICAgICAgLy8gTWlzY2VsbGFuZW91cyBDbGVhbnVwXG4gICAgICAkbWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS0tYWN0aXZlLWNoaWxkJyk7XG4gICAgICBpZiAoJG1lbnVUb2dnbGVUYXJnZXQuc2Nyb2xsVG9wICE9PSAwKSB7XG4gICAgICAgICRtZW51VG9nZ2xlVGFyZ2V0LnNjcm9sbFRvcCA9IDA7XG4gICAgICB9XG4gICAgICBpZiAoJG1lbnVUb2dnbGVUYXJnZXQuc2Nyb2xsTGVmdCAhPT0gMCkge1xuICAgICAgICAkbWVudVRvZ2dsZVRhcmdldC5zY3JvbGxMZWZ0ID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBXaGVuIGl0J3MgY29tcGxldGVkIGFuaW1hdGluZyBvcGVuXG4gICAgZWxzZSB7XG4gICAgICBjb25zdCAkcGFyZW50TWVudVRvZ2dsZVRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCRtZW51VG9nZ2xlVGFyZ2V0LmRhdGFzZXQucGFyZW50TWVudVRvZ2dsZSk7XG4gICAgICBpZiAoJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQpIHtcbiAgICAgICAgJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LmFkZCgnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLWFjdGl2ZS1jaGlsZC0tdHJhbnNpdGlvbmVkJyk7XG4gICAgICB9XG4gICAgICAvLyBBZGRyZXNzaW5nIHNvbWUgYnVnIHdoZXJlIGEgdG9nZ2xlIG9wZW5zIGFuZCB0aGUgaGVpZ2h0IGlzbid0IHNldCBjb3JyZWN0bHlcbiAgICAgIGlmIChcbiAgICAgICAgISRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLWZ1bGwtaGVpZ2h0JylcbiAgICAgICAgJiYgJG1lbnVUb2dnbGVUYXJnZXQucXVlcnlTZWxlY3RvcignLm1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLWNvbnRlbnQtd3JhcHBlcicpLm9mZnNldEhlaWdodCA8ICRtZW51VG9nZ2xlVGFyZ2V0Lm9mZnNldEhlaWdodFxuICAgICAgKSB7XG4gICAgICAgIG1lbnVUb2dnbGUuQWRqdXN0TWVudUFuZFBhZ2VIZWlnaHRzKCRtZW51VG9nZ2xlVGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgfSk7XG5cbiAgb3B0aW1pemVkUmVzaXplLmFkZCgoKSA9PiB7XG4gICAgY29uc3QgbWVudVRvZ2dsZUJ1dHRvbkRpc3BsYXkgPSBnZXRDb21wdXRlZFN0eWxlKCRtZW51VG9nZ2xlQnV0dG9uKS5kaXNwbGF5O1xuICAgIC8vIE9uIHJlc2l6ZSByZW1vdmUgY2xhc3NlcyBpZiB0aGUgdG9nZ2xlIGJ1dHRvbiBpcyBoaWRkZW5cbiAgICBpZiAobWVudVRvZ2dsZUJ1dHRvbkRpc3BsYXkgPT09ICdub25lJyAmJiAkbWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlJykpIHtcbiAgICAgIC8vIFJlbW92ZSBjbGFzc2VzXG4gICAgICAkbWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZScpO1xuICAgIH1cbiAgICAvLyBJZiB0aGUgYnV0dG9uIGlzbid0IGhpZGRlbiBhbmQgd2UgZG9uJ3QgaGF2ZSB0aGUganMgdG9nZ2xlIGNsYXNzZXMsIHJlLWFkZFxuICAgIGVsc2UgaWYgKG1lbnVUb2dnbGVCdXR0b25EaXNwbGF5ICE9PSAnbm9uZScgJiYgISRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUnKSkge1xuICAgICAgJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LmFkZCgnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUnKTtcbiAgICB9XG5cbiAgICAvLyBPbiBwYWdlIHJlc2l6ZSBtYWtlIHN1cmUgbWVudSBpc24ndCBhbmQgd29uJ3QgYmUgY2xpcHBlZFxuICAgIGlmICgkYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCkge1xuICAgICAgbWVudVRvZ2dsZS5BZGp1c3RNZW51QW5kUGFnZUhlaWdodHMoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQpKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmICh0eXBlb2YgcG9zdEluaXRDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHBvc3RJbml0Q2FsbGJhY2soJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBtZW51VG9nZ2xlLk9wZW4sIG1lbnVUb2dnbGUuU2h1dCk7XG4gIH1cbn07XG4iXSwiZmlsZSI6Im1lbnUtdG9nZ2xlLmpzIn0=
