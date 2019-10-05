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


window.addEventListener('DOMContentLoaded', function () {
  document.querySelector('body').dataset.menuToggleLastOpenToggleTarget = '';
});
var menuToggle = {}; // Helper functions ----------------------------------------------------

/**
 * Ensures that the menu area and page are tall enough to show the menu
 * @param {DOM Object} $menuToggleTarget Sibling element to toggle button that opens
 */

menuToggle.AdjustMenuAndPageHeights = function ($menuToggleTarget) {
  var $bodyInner = document.querySelector('.body-inner');

  if ($menuToggleTarget.classList.contains('menu-toggle__toggleable--full-height') || $menuToggleTarget.classList.contains('menu-toggle__toggleable--full-height-on-open')) {
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
  // Quick exit if it's already shut
  if (!$menuToggleButton.classList.contains('js-menu-toggle-button--active')) {
    return;
  }

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
    if ($menuToggleTarget.dataset.parentMenuToggle) {
      $body.dataset.menuToggleLastOpenToggleTarget = $menuToggleTarget.dataset.parentMenuToggle;
    } else {
      $body.dataset.menuToggleLastOpenToggleTarget = '';
    }
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
  var currentToggleTarget = $menuToggleButton.getAttribute('aria-controls');
  var menuToggleLastOpenToggleTarget = $body.dataset.menuToggleLastOpenToggleTarget; // Shut an open toggle so long as it isn't a parent of the one we're opening

  if (menuToggleLastOpenToggleTarget && menuToggleLastOpenToggleTarget !== currentToggleTarget) {
    var $lastOpenToggleTarget = document.getElementById(menuToggleLastOpenToggleTarget);
    var childOfOpenToggleTarget = $lastOpenToggleTarget.contains(document.getElementById(currentToggleTarget));

    if (!childOfOpenToggleTarget) {
      // console.log('Back Out During Open', $menuToggleButton);
      // Find the toggle target's button
      var $lastOpenToggleTargetsButton = document.querySelector('[aria-controls="' + menuToggleLastOpenToggleTarget + '"]');

      if ($lastOpenToggleTargetsButton) {
        menuToggle.Shut($lastOpenToggleTargetsButton, $lastOpenToggleTarget, postShutCallback);
      }
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
  }

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUtdG9nZ2xlLmpzIl0sIm5hbWVzIjpbIkVsZW1lbnQiLCJwcm90b3R5cGUiLCJtYXRjaGVzIiwibXNNYXRjaGVzU2VsZWN0b3IiLCJ3ZWJraXRNYXRjaGVzU2VsZWN0b3IiLCJjbG9zZXN0IiwicyIsImVsIiwicGFyZW50RWxlbWVudCIsInBhcmVudE5vZGUiLCJub2RlVHlwZSIsIm9wdGltaXplZFJlc2l6ZSIsImNhbGxiYWNrcyIsInJ1bm5pbmciLCJvblJlc2l6ZSIsIndpbmRvdyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInJ1bkNhbGxiYWNrcyIsInNldFRpbWVvdXQiLCJmb3JFYWNoIiwiY2FsbGJhY2siLCJhZGRDYWxsYmFjayIsInB1c2giLCJhZGQiLCJsZW5ndGgiLCJhZGRFdmVudExpc3RlbmVyIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yIiwiZGF0YXNldCIsIm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCIsIm1lbnVUb2dnbGUiLCJBZGp1c3RNZW51QW5kUGFnZUhlaWdodHMiLCIkbWVudVRvZ2dsZVRhcmdldCIsIiRib2R5SW5uZXIiLCJjbGFzc0xpc3QiLCJjb250YWlucyIsInN0eWxlIiwic2V0UHJvcGVydHkiLCJpbm5lckhlaWdodCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInRvcCIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwibWVudVRvZ2dsZUNvbnRlbnRXcmFwcGVySGVpZ2h0Iiwib2Zmc2V0SGVpZ2h0IiwiYm90dG9tT2ZUb2dnbGVUYXJnZXQiLCJTaHV0IiwiJG1lbnVUb2dnbGVCdXR0b24iLCJwb3N0U2h1dENhbGxiYWNrIiwiJGJvZHkiLCJyZW1vdmVQcm9wZXJ0eSIsInNldEF0dHJpYnV0ZSIsInJlbW92ZSIsImdldEF0dHJpYnV0ZSIsInBhcmVudE1lbnVUb2dnbGUiLCIkcGFyZW50TWVudVRvZ2dsZVRhcmdldCIsImdldEVsZW1lbnRCeUlkIiwiJGFjdGl2ZU1lbnVUb2dnbGVDaGlsZHJlbiIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJpIiwiZm9jdXMiLCJCYWNrT3V0IiwiYWN0aXZlRWxlbWVudCIsInRhZ05hbWUiLCIkb3BlblBhcmVudFRvZ2dsZVRhcmdldCIsIiRvcGVuUGFyZW50VG9nZ2xlIiwiJG9wZW5UYXJnZXQiLCIkb3BlblRhcmdldFRvZ2dsZSIsIk9wZW4iLCJwb3N0T3BlbkNhbGxiYWNrIiwiY3VycmVudFRvZ2dsZVRhcmdldCIsIiRsYXN0T3BlblRvZ2dsZVRhcmdldCIsImNoaWxkT2ZPcGVuVG9nZ2xlVGFyZ2V0IiwiJGxhc3RPcGVuVG9nZ2xlVGFyZ2V0c0J1dHRvbiIsIlRvZ2dsZVN0YXRlIiwidG9nZ2xlIiwiSW5pdCIsInBvc3RJbml0Q2FsbGJhY2siLCJ0b2dnbGVCdXR0b25LZXlib2FyZEhhbmRsZXIiLCJ0b2dnbGVUYXJnZXRLZXlib2FyZEhhbmRsZXIiLCJtZW51VG9nZ2xlVGFyZ2V0SUQiLCJjb250cm9scyIsImNoZWNrYm94SUQiLCIkbWVudVRvZ2dsZUNoZWNrYm94IiwiJG1lbnVUb2dnbGVOZXdCdXR0b24iLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwic3BsaXQiLCJjbGFzc05hbWUiLCJyZXBsYWNlIiwicmVwbGFjZUNoaWxkIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImRpc3BsYXkiLCJkZWZhdWx0VG9nZ2xlQnV0dG9uS2V5Ym9hcmRIYW5kbGVyIiwiZXZlbnQiLCJrZXlDb2RlIiwid2hpY2giLCJwcmV2ZW50RGVmYXVsdCIsInN0b3BQcm9wYWdhdGlvbiIsImRlZmF1bHRUb2dnbGVUYXJnZXRLZXlib2FyZEhhbmRsZXIiLCIkdGFyZ2V0IiwidGFyZ2V0IiwiJG1lbnVUb2dnbGVhYmxlQ2xvc2UiLCJhcHBlbmRDaGlsZCIsIm1lbnVUb2dnbGVCdXR0b25EaXNwbGF5Il0sIm1hcHBpbmdzIjoiQUFBQTtBQUVBOzs7OztBQUlBLElBQUksQ0FBQ0EsT0FBTyxDQUFDQyxTQUFSLENBQWtCQyxPQUF2QixFQUFnQztBQUM5QkYsRUFBQUEsT0FBTyxDQUFDQyxTQUFS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JztcblxuLyoqXG4gKiBQb2x5ZmlsbCBmb3IgRWxlbWVudOKAiy5jbG9zZXN0KClcbiAqIEZyb20gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnQvY2xvc2VzdCNQb2x5ZmlsbFxuICovXG5pZiAoIUVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXMpIHtcbiAgRWxlbWVudC5wcm90b3R5cGUubWF0Y2hlcyA9IEVsZW1lbnQucHJvdG90eXBlLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IEVsZW1lbnQucHJvdG90eXBlLndlYmtpdE1hdGNoZXNTZWxlY3Rvcjtcbn1cblxuaWYgKCFFbGVtZW50LnByb3RvdHlwZS5jbG9zZXN0KSB7XG4gIEVsZW1lbnQucHJvdG90eXBlLmNsb3Nlc3QgPSBmdW5jdGlvbihzKSB7XG4gICAgdmFyIGVsID0gdGhpcztcbiAgICBkbyB7XG4gICAgICBpZiAoZWwubWF0Y2hlcyhzKSkgcmV0dXJuIGVsO1xuICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50IHx8IGVsLnBhcmVudE5vZGU7XG4gICAgfSB3aGlsZSAoZWwgIT09IG51bGwgJiYgZWwubm9kZVR5cGUgPT09IDEpO1xuICAgIHJldHVybiBudWxsO1xuICB9O1xufVxuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogT3B0aW1pemVkIHJlc2l6ZSBoYW5kbGVyXG4gKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0V2ZW50cy9yZXNpemUjcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gKlxuICogQGV4YW1wbGVcbiAqICAgICBvcHRpbWl6ZWRSZXNpemUuYWRkKCgpID0+IGNvbnNvbGUubG9nKCdSZXNvdXJjZSBjb25zY2lvdXMgcmVzaXplIGNhbGxiYWNrIScpKTtcbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG5jb25zdCBvcHRpbWl6ZWRSZXNpemUgPSAoZnVuY3Rpb24oKSB7XG4gIGxldCBjYWxsYmFja3MgPSBbXSxcbiAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgLy8gRmlyZWQgb24gcmVzaXplIGV2ZW50XG4gIGNvbnN0IG9uUmVzaXplID0gKCkgPT4ge1xuICAgIGlmICghcnVubmluZykge1xuICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICBpZiAod2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJ1bkNhbGxiYWNrcyk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dChydW5DYWxsYmFja3MsIDY2KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUnVuIHRoZSBjYWxsYmFja3NcbiAgY29uc3QgcnVuQ2FsbGJhY2tzID0gKCkgPT4ge1xuICAgIGNhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9KTtcbiAgICBydW5uaW5nID0gZmFsc2U7XG4gIH07XG5cbiAgLy8gQWRkcyBjYWxsYmFjayB0byBsb29wXG4gIGNvbnN0IGFkZENhbGxiYWNrID0gKGNhbGxiYWNrKSA9PiB7XG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgLy8gUHVibGljIG1ldGhvZCB0byBhZGQgYWRkaXRpb25hbCBjYWxsYmFja1xuICAgICdhZGQnOiBmdW5jdGlvbiBhZGQoY2FsbGJhY2spIHtcbiAgICAgIGlmICghY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgb25SZXNpemUpO1xuICAgICAgfVxuICAgICAgYWRkQ2FsbGJhY2soY2FsbGJhY2spO1xuICAgIH0sXG4gIH07XG59KCkpO1xuXG4ndXNlIHN0cmljdCc7XG4vKiBnbG9iYWwgb3B0aW1pemVkUmVzaXplICovXG4vLyBAdG9kbyBMb3RzIG9mIGJ1Z3MgZ29pbmcgZnJvbSBkZXNrdG9wIHRvIG1vYmlsZSBuYXZcbi8vIEB0b2RvIHRlc3QgaW4gYnJvd3NlcnNcbi8vIEB0b2RvIGFjY2Vzc2liaWxpdHkgYXVkaXRcbi8vIEB0b2RvIG1ha2Ugc3VyZSBuby1qcyB3b3Jrc1xuLy8gQHRvZG8gbWFrZSBzdXJlIGl0IGNhbiBoYW5kbGUgcmVndWxhciBidXR0b25zXG5cbi8qKlxuICogSGFuZGxlcyBjb2xsYXBzaWJsZSBtZWdhIG1lbnUgYmVoYXZpb3JcbiAqXG4gKiBSZXBsYWNlcyBpbml0aWFsIG1hcmt1cCB3aXRoIGlkZWFsIGFjY2Vzc2libGUgbWFya3VwLCBpbml0aWFsIG1hcmt1cCB3b3JrcyB3aXRob3V0IEpTIGJ1dCBpc24ndCBncmVhdCBmb3IgYWNjZXNzaWJpbGl0eTtcbiAqXG4gKiBJbml0aWFsIG1hcmt1cCBzaG91bGQgaGF2ZSB0aGUgZm9sbG93aW5nIGVsZW1lbnRzOlxuICogICAgIDxpbnB1dCBpZD1cImRlc2t0b3AtYnVyZ2VyLXRvZ2dsZVwiIGNsYXNzPVwibWVudS10b2dnbGUgdS1lbGVtZW50LWludmlzaWJsZVwiIHR5cGU9XCJjaGVja2JveFwiIGFyaWEtY29udHJvbHM9XCJkZXNrdG9wLWJ1cmdlci1tZW51LWNvbnRhaW5lclwiPlxuICogICAgIDxsYWJlbCBjbGFzcz1cIm1lbnUtdG9nZ2xlLWJ1dHRvblwiIGZvcj1cImRlc2t0b3AtYnVyZ2VyLXRvZ2dsZVwiIGRhdGEtY29udHJvbHM9XCJkZXNrdG9wLWJ1cmdlci1tZW51LWNvbnRhaW5lclwiPlxuICogICAgICAgTWVudSBpY29uIG9yIExhYmVsIFRleHRcbiAqICAgICAgIDxzcGFuIGNsYXNzPVwibWVudS10b2dnbGUtYXNzaXN0aXZlLXRleHQgdS1lbGVtZW50LWludmlzaWJsZVwiPlRvZ2dsZSBtZW51IHZpc2liaWxpdHk8L3NwYW4+XG4gKiAgICAgPC9sYWJlbD5cbiAqICAgICA8ZGl2IGNsYXNzPVwibWVudS10b2dnbGVfX3RvZ2dsZWFibGVcIj5cbiAqICAgICAgIDxkaXYgY2xhc3M9XCJtZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS1jb250ZW50LXdyYXBwZXJcIj5cbiAqICAgICAgICAgQ29udGVudCBpbiBDb2xsYXBzaWJsZSBDb250YWluZXJcbiAqICAgICAgIDwvZGl2PlxuICogICAgIDwvZGl2PlxuICovXG5cbi8vIEtlZXBzIHRyYWNrIG9mIGxhc3Qgb3BlbiB0b2dnbGVcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24gKCkge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQgPSAnJztcbn0pO1xuXG5jb25zdCBtZW51VG9nZ2xlID0ge307XG5cbi8vIEhlbHBlciBmdW5jdGlvbnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLyoqXG4gKiBFbnN1cmVzIHRoYXQgdGhlIG1lbnUgYXJlYSBhbmQgcGFnZSBhcmUgdGFsbCBlbm91Z2ggdG8gc2hvdyB0aGUgbWVudVxuICogQHBhcmFtIHtET00gT2JqZWN0fSAkbWVudVRvZ2dsZVRhcmdldCBTaWJsaW5nIGVsZW1lbnQgdG8gdG9nZ2xlIGJ1dHRvbiB0aGF0IG9wZW5zXG4gKi9cbm1lbnVUb2dnbGUuQWRqdXN0TWVudUFuZFBhZ2VIZWlnaHRzID0gKCRtZW51VG9nZ2xlVGFyZ2V0KSA9PiB7XG4gIGNvbnN0ICRib2R5SW5uZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYm9keS1pbm5lcicpO1xuICBpZiAoXG4gICAgJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS0tZnVsbC1oZWlnaHQnKVxuICAgIHx8ICRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLWZ1bGwtaGVpZ2h0LW9uLW9wZW4nKVxuICApIHtcbiAgICAkbWVudVRvZ2dsZVRhcmdldC5zdHlsZS5zZXRQcm9wZXJ0eSgnaGVpZ2h0JywgYCR7d2luZG93LmlubmVySGVpZ2h0IC0gJG1lbnVUb2dnbGVUYXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wfXB4YCk7XG4gICAgJGJvZHlJbm5lci5zdHlsZS5zZXRQcm9wZXJ0eSgnbWluLWhlaWdodCcsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXS5jbGFzc0xpc3QuYWRkKCd1LWJvZHktbm8tc2Nyb2xsJyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uc3QgbWVudVRvZ2dsZUNvbnRlbnRXcmFwcGVySGVpZ2h0ID0gJG1lbnVUb2dnbGVUYXJnZXQucXVlcnlTZWxlY3RvcignLm1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLWNvbnRlbnQtd3JhcHBlcicpLm9mZnNldEhlaWdodDtcbiAgICBjb25zdCBib3R0b21PZlRvZ2dsZVRhcmdldCA9IG1lbnVUb2dnbGVDb250ZW50V3JhcHBlckhlaWdodCArICRtZW51VG9nZ2xlVGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgICAkbWVudVRvZ2dsZVRhcmdldC5zdHlsZS5zZXRQcm9wZXJ0eSgnaGVpZ2h0JywgYCR7bWVudVRvZ2dsZUNvbnRlbnRXcmFwcGVySGVpZ2h0fXB4YCk7XG4gICAgJGJvZHlJbm5lci5zdHlsZS5zZXRQcm9wZXJ0eSgnbWluLWhlaWdodCcsIGAke2JvdHRvbU9mVG9nZ2xlVGFyZ2V0fXB4YCk7XG4gIH1cbn07XG5cbi8qKlxuICogU2h1dHMgYSBtZW51XG4gKiBAcGFyYW0ge0RPTSBPYmplY3R9ICRtZW51VG9nZ2xlQnV0dG9uIEJ1dHRvbiB0b2dnbGVcbiAqIEBwYXJhbSB7RE9NIE9iamVjdH0gJG1lbnVUb2dnbGVUYXJnZXQgU2libGluZyBlbGVtZW50IHRvIHRvZ2dsZSBidXR0b24gdGhhdCBvcGVuc1xuICogQHBhcmFtIHtmdW5jdGlvbn0gICBwb3N0U2h1dENhbGxiYWNrICBGdW5jdGlvbiB0byBjYWxsIGFmdGVyIHNodXQgY29kZVxuICovXG5tZW51VG9nZ2xlLlNodXQgPSAoJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBwb3N0U2h1dENhbGxiYWNrKSA9PiB7XG4gIC8vIFF1aWNrIGV4aXQgaWYgaXQncyBhbHJlYWR5IHNodXRcbiAgaWYgKCEkbWVudVRvZ2dsZUJ1dHRvbi5jbGFzc0xpc3QuY29udGFpbnMoJ2pzLW1lbnUtdG9nZ2xlLWJ1dHRvbi0tYWN0aXZlJykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgJGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG4gIGNvbnN0ICRib2R5SW5uZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYm9keS1pbm5lcicpO1xuICAkYm9keUlubmVyLnN0eWxlLnJlbW92ZVByb3BlcnR5KCdtaW4taGVpZ2h0Jyk7XG4gICRtZW51VG9nZ2xlQnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAkbWVudVRvZ2dsZUJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdqcy1tZW51LXRvZ2dsZS1idXR0b24tLWFjdGl2ZScpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdLmNsYXNzTGlzdC5yZW1vdmUoJ3UtYm9keS1uby1zY3JvbGwnKTtcbiAgaWYgKCEkbWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1mdWxsLWhlaWdodCcpKSB7XG4gICAgJG1lbnVUb2dnbGVUYXJnZXQuc3R5bGUuc2V0UHJvcGVydHkoJ2hlaWdodCcsICcwJyk7XG4gIH1cbiAgJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZSgnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLW9wZW4nKTtcbiAgaWYgKCRtZW51VG9nZ2xlVGFyZ2V0LmdldEF0dHJpYnV0ZSgnaWQnKSA9PT0gJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQpIHtcbiAgICBpZiAoJG1lbnVUb2dnbGVUYXJnZXQuZGF0YXNldC5wYXJlbnRNZW51VG9nZ2xlKSB7XG4gICAgICAkYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCA9ICRtZW51VG9nZ2xlVGFyZ2V0LmRhdGFzZXQucGFyZW50TWVudVRvZ2dsZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAkYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCA9ICcnO1xuICAgIH1cbiAgfVxuXG4gIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGlzIGEgY2hpbGQgdG9nZ2xlIGFuZCBtYW5hZ2UgY2xhc3Nlc1xuICBjb25zdCAkcGFyZW50TWVudVRvZ2dsZVRhcmdldCA9ICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgkbWVudVRvZ2dsZVRhcmdldC5kYXRhc2V0LnBhcmVudE1lbnVUb2dnbGUpO1xuICBpZiAoJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQpIHtcbiAgICAkcGFyZW50TWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS0tYWN0aXZlLWNoaWxkJywgJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1hY3RpdmUtY2hpbGQtLXRyYW5zaXRpb25lZCcpO1xuICB9XG4gICRtZW51VG9nZ2xlQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoJ2pzLW1lbnUtdG9nZ2xlLWJ1dHRvbi0tYWN0aXZlJyk7XG4gICRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1vcGVuJyk7XG5cbiAgLy8gQ2xvc2UgYW55IG9wZW4gY2hpbGQgbWVudVRvZ2dsZXNcbiAgY29uc3QgJGFjdGl2ZU1lbnVUb2dnbGVDaGlsZHJlbiA9ICRtZW51VG9nZ2xlVGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy5qcy1tZW51LXRvZ2dsZS1idXR0b24tLWFjdGl2ZScpO1xuICBpZiAoJGFjdGl2ZU1lbnVUb2dnbGVDaGlsZHJlbi5sZW5ndGgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8ICRhY3RpdmVNZW51VG9nZ2xlQ2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIFNodXQgb3BlbiBjaGlsZHJlbiB3aGVuIGl0J3MgY29udmVuaWVudFxuICAgICAgc2V0VGltZW91dChcbiAgICAgICAgbWVudVRvZ2dsZS5TaHV0KFxuICAgICAgICAgICRhY3RpdmVNZW51VG9nZ2xlQ2hpbGRyZW5baV0sXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJGFjdGl2ZU1lbnVUb2dnbGVDaGlsZHJlbltpXS5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKSksXG4gICAgICAgICAgcG9zdFNodXRDYWxsYmFja1xuICAgICAgICApLFxuICAgICAgICAwXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8vIFB1dCBmb2N1cyBvbiB0b2dnbGUncyBidXR0b24gYWZ0ZXIgY2xvc2VcbiAgJG1lbnVUb2dnbGVCdXR0b24uZm9jdXMoKTtcblxuICBpZiAodHlwZW9mIHBvc3RTaHV0Q2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICBwb3N0U2h1dENhbGxiYWNrKCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQpO1xuICB9XG59O1xuXG4vKipcbiAqIEJhY2sgb3V0IG9mIGN1cnJlbnQgY29udGV4dFxuICogQHBhcmFtIHtmdW5jdGlvbn0gIHBvc3RTaHV0Q2FsbGJhY2tcbiAqL1xubWVudVRvZ2dsZS5CYWNrT3V0ID0gKHBvc3RTaHV0Q2FsbGJhY2spID0+IHtcbiAgLy8gU2VlIHdoZXJlIGZvY3VzIGlzIGFuZCBjbG9zZSBuZWFyZXN0IHBhcmVudCBvcGVuIHRvZ2dsZVxuICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudC50YWdOYW1lICE9PSAnQk9EWScpIHtcbiAgICBjb25zdCAkb3BlblBhcmVudFRvZ2dsZVRhcmdldCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuY2xvc2VzdCgnLmpzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1vcGVuJyk7XG4gICAgaWYgKCRvcGVuUGFyZW50VG9nZ2xlVGFyZ2V0KSB7XG4gICAgICBjb25zdCAkb3BlblBhcmVudFRvZ2dsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFthcmlhLWNvbnRyb2xzPVwiJHskb3BlblBhcmVudFRvZ2dsZVRhcmdldC5nZXRBdHRyaWJ1dGUoJ2lkJyl9XCJdYCk7XG4gICAgICAvLyBjb25zb2xlLmxvZygnQmFjayBvdXQnLCAkb3BlblBhcmVudFRvZ2dsZSk7XG4gICAgICBtZW51VG9nZ2xlLlNodXQoXG4gICAgICAgICRvcGVuUGFyZW50VG9nZ2xlLFxuICAgICAgICAkb3BlblBhcmVudFRvZ2dsZVRhcmdldCxcbiAgICAgICAgcG9zdFNodXRDYWxsYmFja1xuICAgICAgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICAvLyBDbG9zZSB0aGUgdG9nZ2xlIHRoYXQgd2FzIG9wZW5lZCBsYXN0XG4gIGNvbnN0ICRib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuICBpZiAoJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQgJiYgJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQgIT09ICcnKSB7XG4gICAgY29uc3QgJG9wZW5UYXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgkYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCk7XG4gICAgaWYgKCRvcGVuVGFyZ2V0KSB7XG4gICAgICBjb25zdCAkb3BlblRhcmdldFRvZ2dsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFthcmlhLWNvbnRyb2xzPVwiJHskYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldH1cIl1gKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdDbG9zZWQgbGFzdCBvcGVuJywgJG9wZW5UYXJnZXRUb2dnbGUpO1xuICAgICAgbWVudVRvZ2dsZS5TaHV0KFxuICAgICAgICAkb3BlblRhcmdldFRvZ2dsZSxcbiAgICAgICAgJG9wZW5UYXJnZXQsXG4gICAgICAgIHBvc3RTaHV0Q2FsbGJhY2tcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIC8vIGNvbnNvbGUubG9nKCdDb3VsZG5cXCd0IGZpbmQgbWVudSB0b2dnbGUgdG8gYmFja291dCBvZicpO1xufTtcblxuLyoqXG4gKiBPcGVuIGEgbWVudVxuICogQHBhcmFtIHtET00gT2JqZWN0fSAkbWVudVRvZ2dsZUJ1dHRvbiBCdXR0b24gdG9nZ2xlXG4gKiBAcGFyYW0ge0RPTSBPYmplY3R9ICRtZW51VG9nZ2xlVGFyZ2V0IFNpYmxpbmcgZWxlbWVudCB0byB0b2dnbGUgYnV0dG9uIHRoYXQgb3BlbnNcbiAqIEBwYXJhbSB7ZnVuY3Rpb259ICAgcG9zdE9wZW5DYWxsYmFjayAgRnVuY3Rpb24gdG8gcnVuIGFmdGVyIG9wZW4gYmVoYXZpb3JzXG4gKi9cbm1lbnVUb2dnbGUuT3BlbiA9ICgkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIHBvc3RPcGVuQ2FsbGJhY2ssIHBvc3RTaHV0Q2FsbGJhY2spID0+IHtcbiAgY29uc3QgJGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG4gIGNvbnN0IGN1cnJlbnRUb2dnbGVUYXJnZXQgPSAkbWVudVRvZ2dsZUJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKTtcbiAgY29uc3QgbWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0ID0gJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQ7XG5cbiAgLy8gU2h1dCBhbiBvcGVuIHRvZ2dsZSBzbyBsb25nIGFzIGl0IGlzbid0IGEgcGFyZW50IG9mIHRoZSBvbmUgd2UncmUgb3BlbmluZ1xuICBpZiAoXG4gICAgbWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0XG4gICAgJiYgbWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0ICE9PSBjdXJyZW50VG9nZ2xlVGFyZ2V0XG4gICkge1xuICAgIGNvbnN0ICRsYXN0T3BlblRvZ2dsZVRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCk7XG4gICAgY29uc3QgY2hpbGRPZk9wZW5Ub2dnbGVUYXJnZXQgPSAkbGFzdE9wZW5Ub2dnbGVUYXJnZXQuY29udGFpbnMoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY3VycmVudFRvZ2dsZVRhcmdldCkpO1xuICAgIGlmICghY2hpbGRPZk9wZW5Ub2dnbGVUYXJnZXQpIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdCYWNrIE91dCBEdXJpbmcgT3BlbicsICRtZW51VG9nZ2xlQnV0dG9uKTtcbiAgICAgIC8vIEZpbmQgdGhlIHRvZ2dsZSB0YXJnZXQncyBidXR0b25cbiAgICAgIGNvbnN0ICRsYXN0T3BlblRvZ2dsZVRhcmdldHNCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbYXJpYS1jb250cm9scz1cIicgKyBtZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQgKyAnXCJdJyk7XG4gICAgICBpZiAoJGxhc3RPcGVuVG9nZ2xlVGFyZ2V0c0J1dHRvbikge1xuICAgICAgICBtZW51VG9nZ2xlLlNodXQoJGxhc3RPcGVuVG9nZ2xlVGFyZ2V0c0J1dHRvbiwgJGxhc3RPcGVuVG9nZ2xlVGFyZ2V0LCBwb3N0U2h1dENhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgbWVudVRvZ2dsZS5BZGp1c3RNZW51QW5kUGFnZUhlaWdodHMoJG1lbnVUb2dnbGVUYXJnZXQpO1xuICAkbWVudVRvZ2dsZUJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuICAkbWVudVRvZ2dsZUJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdqcy1tZW51LXRvZ2dsZS1idXR0b24tLWFjdGl2ZScpO1xuICAkbWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QuYWRkKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS0tb3BlbicpO1xuICBjb25zdCAkcGFyZW50TWVudVRvZ2dsZVRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCRtZW51VG9nZ2xlVGFyZ2V0LmRhdGFzZXQucGFyZW50TWVudVRvZ2dsZSk7XG4gIGlmICgkcGFyZW50TWVudVRvZ2dsZVRhcmdldCkge1xuICAgICRwYXJlbnRNZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1hY3RpdmUtY2hpbGQnKTtcbiAgfVxuICAkYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCA9IGN1cnJlbnRUb2dnbGVUYXJnZXQ7XG5cbiAgaWYgKHR5cGVvZiBwb3N0T3BlbkNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcG9zdE9wZW5DYWxsYmFjaygkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsICRwYXJlbnRNZW51VG9nZ2xlVGFyZ2V0KTtcbiAgfVxufTtcblxuLyoqXG4gKiBUb2dnbGUgYSBnaXZlbiBtZW51XG4gKi9cbm1lbnVUb2dnbGUuVG9nZ2xlU3RhdGUgPSAoJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBwb3N0T3BlbkNhbGxiYWNrLCBwb3N0U2h1dENhbGxiYWNrKSA9PiB7XG4gICRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUoJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1vcGVuJyk7XG5cbiAgaWYgKCRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLW9wZW4nKSkge1xuICAgIG1lbnVUb2dnbGUuT3BlbigkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIHBvc3RPcGVuQ2FsbGJhY2ssIHBvc3RTaHV0Q2FsbGJhY2spO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIGNvbnNvbGUubG9nKCd0b2dnbGVTdGF0ZScsICRtZW51VG9nZ2xlQnV0dG9uKTtcbiAgICBtZW51VG9nZ2xlLlNodXQoJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBwb3N0U2h1dENhbGxiYWNrKTtcbiAgfVxufTtcblxuLyoqXG4gKiBJbml0aWFsaXplIG1lbnUgdG9nZ2xlc1xuICogQHBhcmFtIHtET00gT2JqZWN0fSAkbWVudVRvZ2dsZUJ1dHRvbiBUaGUgaW5wdXQgbGFiZWwgdG8gdG9nZ2xlLCBzaG91bGQgaGF2ZSBjbGFzcyBvZiAnbWVudS10b2dnbGUtYnV0dG9uJ1xuICovXG5tZW51VG9nZ2xlLkluaXQgPSAoXG4gICRtZW51VG9nZ2xlQnV0dG9uLFxuICBwb3N0SW5pdENhbGxiYWNrLFxuICB0b2dnbGVCdXR0b25LZXlib2FyZEhhbmRsZXIsXG4gIHRvZ2dsZVRhcmdldEtleWJvYXJkSGFuZGxlcixcbiAgcG9zdE9wZW5DYWxsYmFjayxcbiAgcG9zdFNodXRDYWxsYmFja1xuICApID0+IHtcbiAgaWYgKCRtZW51VG9nZ2xlQnV0dG9uLnRhZ05hbWUgPT09ICdCVVRUT04nICYmICRtZW51VG9nZ2xlQnV0dG9uLmNsYXNzTGlzdC5jb250YWlucygnanMtbWVudS10b2dnbGUtYnV0dG9uJykpIHtcbiAgICAvLyBBYm9ydCwgd2UndmUgYWxyZWFkeSBpbml0aWFsaXplZCB0aGlzIVxuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBtZW51VG9nZ2xlVGFyZ2V0SUQgPSAkbWVudVRvZ2dsZUJ1dHRvbi5kYXRhc2V0LmNvbnRyb2xzO1xuICBjb25zdCAkbWVudVRvZ2dsZVRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1lbnVUb2dnbGVUYXJnZXRJRCk7XG4gIGNvbnN0ICRib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuXG4gIGlmICgkbWVudVRvZ2dsZUJ1dHRvbi50YWdOYW1lID09PSAnTEFCRUwnKSB7XG4gICAgY29uc3QgY2hlY2tib3hJRCA9ICRtZW51VG9nZ2xlQnV0dG9uLmdldEF0dHJpYnV0ZSgnZm9yJyk7XG4gICAgY29uc3QgJG1lbnVUb2dnbGVDaGVja2JveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNoZWNrYm94SUQpO1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBidXR0b24gSFRNTCB0byByZXBsYWNlIGNoZWNrYm94XG4gICAgICovXG4gICAgY29uc3QgJG1lbnVUb2dnbGVOZXdCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAkbWVudVRvZ2dsZU5ld0J1dHRvbi5pbm5lckhUTUwgPSAkbWVudVRvZ2dsZUJ1dHRvbi5pbm5lckhUTUw7XG4gICAgLy8gR2V0IGNsYXNzZXMgZnJvbSBjdXJyZW50IGJ1dHRvbiBhbmQgYWRkIHRoZW0gdG8gbmV3IGJ1dHRvblxuICAgICRtZW51VG9nZ2xlQnV0dG9uLmdldEF0dHJpYnV0ZSgnY2xhc3MnKS5zcGxpdCgnICcpLmZvckVhY2goY2xhc3NOYW1lID0+IHtcbiAgICAgIC8vIFN0cmlwIHdoaXRlIHNwYWNlXG4gICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuICAgICAgaWYgKGNsYXNzTmFtZS5sZW5ndGgpIHtcbiAgICAgICAgJG1lbnVUb2dnbGVOZXdCdXR0b24uY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgICRtZW51VG9nZ2xlTmV3QnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1jb250cm9scycsICRtZW51VG9nZ2xlQnV0dG9uLmdldEF0dHJpYnV0ZSgnZGF0YS1jb250cm9scycpKTtcbiAgICAkbWVudVRvZ2dsZU5ld0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ2lkJywgY2hlY2tib3hJRCk7XG4gICAgJG1lbnVUb2dnbGVOZXdCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWhhc3BvcHVwJywgJ3RydWUnKTtcbiAgICAkbWVudVRvZ2dsZU5ld0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcblxuICAgIC8vIFJlbW92ZSBjaGVja2JveFxuICAgICRtZW51VG9nZ2xlQ2hlY2tib3gucmVtb3ZlKCk7XG4gICAgLy8gUmVwbGFjZSBsYWJlbCB3aXRoIGJ1dHRvblxuICAgICRtZW51VG9nZ2xlQnV0dG9uLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKCRtZW51VG9nZ2xlTmV3QnV0dG9uLCAkbWVudVRvZ2dsZUJ1dHRvbik7XG4gICAgJG1lbnVUb2dnbGVCdXR0b24gPSAkbWVudVRvZ2dsZU5ld0J1dHRvbjtcbiAgfVxuXG4gIC8vIENsYXNzIHRvIGxldCB1cyBrbm93IHRoaXMgaGFzIGJlZW4gaW5pdGlhbGl6ZWRcbiAgJG1lbnVUb2dnbGVCdXR0b24uY2xhc3NMaXN0LmFkZCgnanMtbWVudS10b2dnbGUtYnV0dG9uJyk7XG5cbiAgLy8gSWYgdGhlIHRvZ2dsZSBpcyB2aXNpYmxlLCBhZGQgY2xhc3MgdG8gdGFyZ2V0IHRvIHNob3cgdGhpcyBKUyBoYXMgYmVlbiBwcm9jZXNzZWRcbiAgaWYgKGdldENvbXB1dGVkU3R5bGUoJG1lbnVUb2dnbGVCdXR0b24pLmRpc3BsYXkgIT09ICdub25lJykge1xuICAgICRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlJyk7XG4gIH1cblxuICAvLyBJZiB3ZSBoYXZlIGEgcGFyZW50IHRvZ2dsZSBzZXQgYW4gYXR0cmlidXRlIHRoYXQgZ2l2ZXMgdXMgdGhlIGlkXG4gIC8vIEB0b2RvIFRlc3QgaW4gSUVcbiAgY29uc3QgJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQgPSAkbWVudVRvZ2dsZVRhcmdldC5wYXJlbnRFbGVtZW50LmNsb3Nlc3QoJy5tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZScpO1xuICBpZiAoJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQgIT09IG51bGwpIHtcbiAgICAkbWVudVRvZ2dsZVRhcmdldC5kYXRhc2V0LnBhcmVudE1lbnVUb2dnbGUgPSAkcGFyZW50TWVudVRvZ2dsZVRhcmdldC5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gIH1cblxuICAvLyBUb2dnbGUgYnV0dG9uIGNsaWNrIGJlaGF2aW9yXG4gICRtZW51VG9nZ2xlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgIG1lbnVUb2dnbGUuVG9nZ2xlU3RhdGUoJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBwb3N0T3BlbkNhbGxiYWNrLCBwb3N0U2h1dENhbGxiYWNrKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgVG9nZ2xlIEJ1dHRvbiBLZXlib2FyZCBldmVudCBoYW5kbGVyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBldmVudFxuICAgKi9cbiAgY29uc3QgZGVmYXVsdFRvZ2dsZUJ1dHRvbktleWJvYXJkSGFuZGxlciA9IChldmVudCkgPT4ge1xuICAgIC8vIHZhciAkdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuICAgIHZhciBrZXlDb2RlID0gZXZlbnQud2hpY2g7XG5cbiAgICAvLyBSSUdIVFxuICAgIGlmIChrZXlDb2RlID09PSAzOSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgbWVudVRvZ2dsZS5PcGVuKCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgcG9zdE9wZW5DYWxsYmFjaywgcG9zdFNodXRDYWxsYmFjayk7XG4gICAgfVxuICAgIC8vIExFRlRcbiAgICBlbHNlIGlmIChrZXlDb2RlID09PSAzNykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgLy8gY29uc29sZS5sb2coJ0xlZnQgQnV0dG9uJywgJG1lbnVUb2dnbGVCdXR0b24pO1xuICAgICAgbWVudVRvZ2dsZS5TaHV0KFxuICAgICAgICAkbWVudVRvZ2dsZUJ1dHRvbixcbiAgICAgICAgJG1lbnVUb2dnbGVUYXJnZXQsXG4gICAgICAgIHBvc3RTaHV0Q2FsbGJhY2tcbiAgICAgICk7XG4gICAgfVxuICAgIC8vIERPV05cbiAgICBlbHNlIGlmIChrZXlDb2RlID09PSA0MCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgbWVudVRvZ2dsZS5PcGVuKCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgcG9zdE9wZW5DYWxsYmFjaywgcG9zdFNodXRDYWxsYmFjayk7XG4gICAgfVxuICAgIC8vIFVQXG4gICAgZWxzZSBpZiAoa2V5Q29kZSA9PT0gMzgpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdVcCBCdXR0b24nLCAkbWVudVRvZ2dsZUJ1dHRvbik7XG4gICAgICBtZW51VG9nZ2xlLlNodXQoJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBwb3N0U2h1dENhbGxiYWNrKTtcbiAgICB9XG4gICAgLy8gRVNDQVBFXG4gICAgZWxzZSBpZiAoa2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdwcmVzc2VkIGVzY2FwZSwgdG9nZ2xlIGJ1dHRvbicsICRtZW51VG9nZ2xlQnV0dG9uKTtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIG1lbnVUb2dnbGUuU2h1dCgkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIHBvc3RTaHV0Q2FsbGJhY2spO1xuICAgIH1cbiAgICAvLyBTcGFjZSBvciBFbnRlclxuICAgIGVsc2UgaWYgKGtleUNvZGUgPT09IDEzIHx8IGtleUNvZGUgPT09IDMyKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBtZW51VG9nZ2xlLlRvZ2dsZVN0YXRlKFxuICAgICAgICAkbWVudVRvZ2dsZUJ1dHRvbixcbiAgICAgICAgJG1lbnVUb2dnbGVUYXJnZXQsXG4gICAgICAgIHBvc3RPcGVuQ2FsbGJhY2ssXG4gICAgICAgIHBvc3RTaHV0Q2FsbGJhY2tcbiAgICAgICk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBEZWZhdWx0IFRvZ2dsZSBCdXR0b24gS2V5Ym9hcmQgZXZlbnQgaGFuZGxlclxuICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcbiAgICovXG4gIGNvbnN0IGRlZmF1bHRUb2dnbGVUYXJnZXRLZXlib2FyZEhhbmRsZXIgPSAoZXZlbnQpID0+IHtcbiAgICB2YXIgJHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICB2YXIga2V5Q29kZSA9IGV2ZW50LndoaWNoO1xuXG4gICAgLy8gRVNDQVBFXG4gICAgaWYgKGtleUNvZGUgPT09IDI3KSB7XG4gICAgICAvLyBjb25zb2xlLmxvZygncHJlc3NlZCBlc2NhcGUsIHRvZ2dsZSB0YXJnZXQnLCAkdGFyZ2V0KTtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGlmICgkdGFyZ2V0LnRhZ05hbWUgIT09ICdCVVRUT04nICYmICEkdGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnanMtbWVudS10b2dnbGUtYnV0dG9uJykpIHtcbiAgICAgICAgbWVudVRvZ2dsZS5CYWNrT3V0KHBvc3RTaHV0Q2FsbGJhY2spO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuXG4gIC8vIFNldCBrZXlib2FyZCBoYW5kbGVyc1xuICBpZiAodHlwZW9mIHRvZ2dsZUJ1dHRvbktleWJvYXJkSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICRtZW51VG9nZ2xlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0b2dnbGVCdXR0b25LZXlib2FyZEhhbmRsZXIpO1xuICB9XG4gIGVsc2Uge1xuICAgICRtZW51VG9nZ2xlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBkZWZhdWx0VG9nZ2xlQnV0dG9uS2V5Ym9hcmRIYW5kbGVyKTtcbiAgfVxuXG4gIC8vIFNldCBrZXlib2FyZCBoYW5kbGVyc1xuICBpZiAodHlwZW9mIHRvZ2dsZVRhcmdldEtleWJvYXJkSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICRtZW51VG9nZ2xlVGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0b2dnbGVUYXJnZXRLZXlib2FyZEhhbmRsZXIpO1xuICB9XG4gIGVsc2Uge1xuICAgICRtZW51VG9nZ2xlVGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBkZWZhdWx0VG9nZ2xlVGFyZ2V0S2V5Ym9hcmRIYW5kbGVyKTtcbiAgfVxuXG4gIC8vIEFkZCBjbG9zZSBidXR0b24gaWYgY2xhc3MgaGFzIGJlZW4gYWRkZWQgdG8gdG9nZ2xlYWJsZSBjb250YWluZXJcbiAgaWYgKCRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLXdpdGgtY2xvc2UnKSkge1xuICAgIGNvbnN0ICRtZW51VG9nZ2xlYWJsZUNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgJG1lbnVUb2dnbGVhYmxlQ2xvc2UuY2xhc3NMaXN0LmFkZCgnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGVfX2Nsb3NlJyk7XG4gICAgJG1lbnVUb2dnbGVhYmxlQ2xvc2Uuc2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJywgbWVudVRvZ2dsZVRhcmdldElEKTtcbiAgICAkbWVudVRvZ2dsZWFibGVDbG9zZS5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9XCJlbGVtZW50LWludmlzaWJsZVwiPkNsb3NlPC9zcGFuPic7XG5cbiAgICAkbWVudVRvZ2dsZWFibGVDbG9zZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdzaHV0IGJ1dHRvbicsIHRoaXMpO1xuICAgICAgbWVudVRvZ2dsZS5TaHV0KCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgcG9zdFNodXRDYWxsYmFjayk7XG4gICAgfSk7XG5cbiAgICAkbWVudVRvZ2dsZVRhcmdldC5hcHBlbmRDaGlsZCgkbWVudVRvZ2dsZWFibGVDbG9zZSk7XG4gIH1cblxuICBvcHRpbWl6ZWRSZXNpemUuYWRkKCgpID0+IHtcbiAgICBjb25zdCBtZW51VG9nZ2xlQnV0dG9uRGlzcGxheSA9IGdldENvbXB1dGVkU3R5bGUoJG1lbnVUb2dnbGVCdXR0b24pLmRpc3BsYXk7XG4gICAgLy8gT24gcmVzaXplIHJlbW92ZSBjbGFzc2VzIGlmIHRoZSB0b2dnbGUgYnV0dG9uIGlzIGhpZGRlblxuICAgIGlmIChtZW51VG9nZ2xlQnV0dG9uRGlzcGxheSA9PT0gJ25vbmUnICYmICRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUnKSkge1xuICAgICAgLy8gUmVtb3ZlIGNsYXNzZXNcbiAgICAgICRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlJyk7XG4gICAgfVxuICAgIC8vIElmIHRoZSBidXR0b24gaXNuJ3QgaGlkZGVuIGFuZCB3ZSBkb24ndCBoYXZlIHRoZSBqcyB0b2dnbGUgY2xhc3NlcywgcmUtYWRkXG4gICAgZWxzZSBpZiAobWVudVRvZ2dsZUJ1dHRvbkRpc3BsYXkgIT09ICdub25lJyAmJiAhJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZScpKSB7XG4gICAgICAkbWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QuYWRkKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZScpO1xuICAgIH1cblxuICAgIC8vIE9uIHBhZ2UgcmVzaXplIG1ha2Ugc3VyZSBtZW51IGlzbid0IGFuZCB3b24ndCBiZSBjbGlwcGVkXG4gICAgaWYgKCRib2R5LmRhdGFzZXQubWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0KSB7XG4gICAgICBtZW51VG9nZ2xlLkFkanVzdE1lbnVBbmRQYWdlSGVpZ2h0cyhkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgkYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCkpO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKHR5cGVvZiBwb3N0SW5pdENhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcG9zdEluaXRDYWxsYmFjaygkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIG1lbnVUb2dnbGUuT3BlbiwgbWVudVRvZ2dsZS5TaHV0KTtcbiAgfVxufTtcbiJdLCJmaWxlIjoibWVudS10b2dnbGUuanMifQ==
