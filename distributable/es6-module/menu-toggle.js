"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.menuToggleInit = exports.menuToggleToggleState = exports.menuToggleOpen = exports.menuToggleBackOut = exports.menuToggleShut = exports.menuToggleAdjustMenuAndPageHeights = void 0;

var _events = require("./events");

var _polyfill = require("./polyfill");

// @todo Lots of bugs going from desktop to mobile nav
// @todo test in browsers
// @todo accessibility audit
// @todo make sure no-js works
// @todo make sure it can handle regular buttons
// Run closest polyfill
(0, _polyfill.closest)();
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
}); // Helper functions ----------------------------------------------------

/**
 * Ensures that the menu area and page are tall enough to show the menu
 * @param {DOM Object} $menuToggleTarget Sibling element to toggle button that opens
 */

var menuToggleAdjustMenuAndPageHeights = function menuToggleAdjustMenuAndPageHeights($menuToggleTarget) {
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


exports.menuToggleAdjustMenuAndPageHeights = menuToggleAdjustMenuAndPageHeights;

var menuToggleShut = function menuToggleShut($menuToggleButton, $menuToggleTarget, postShutCallback) {
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
      setTimeout(menuToggleShut($activeMenuToggleChildren[i], document.getElementById($activeMenuToggleChildren[i].getAttribute('aria-controls')), postShutCallback), 0);
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


exports.menuToggleShut = menuToggleShut;

var menuToggleBackOut = function menuToggleBackOut(postShutCallback) {
  // See where focus is and close nearest parent open toggle
  if (document.activeElement.tagName !== 'BODY') {
    var $openParentToggleTarget = document.activeElement.closest('.js-menu-toggle__toggleable--open');

    if ($openParentToggleTarget) {
      var $openParentToggle = document.querySelector("[aria-controls=\"".concat($openParentToggleTarget.getAttribute('id'), "\"]")); // console.log('Back out', $openParentToggle);

      menuToggleShut($openParentToggle, $openParentToggleTarget, postShutCallback);
      return;
    }
  } // Close the toggle that was opened last


  var $body = document.querySelector('body');

  if ($body.dataset.menuToggleLastOpenToggleTarget && $body.dataset.menuToggleLastOpenToggleTarget !== '') {
    var $openTarget = document.getElementById($body.dataset.menuToggleLastOpenToggleTarget);

    if ($openTarget) {
      var $openTargetToggle = document.querySelector("[aria-controls=\"".concat($body.dataset.menuToggleLastOpenToggleTarget, "\"]")); // console.log('Closed last open', $openTargetToggle);

      menuToggleShut($openTargetToggle, $openTarget, postShutCallback);
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


exports.menuToggleBackOut = menuToggleBackOut;

var menuToggleOpen = function menuToggleOpen($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback) {
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
        menuToggleShut($lastOpenToggleTargetsButton, $lastOpenToggleTarget, postShutCallback);
      }
    }
  }

  menuToggleAdjustMenuAndPageHeights($menuToggleTarget);
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


exports.menuToggleOpen = menuToggleOpen;

var menuToggleToggleState = function menuToggleToggleState($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback) {
  $menuToggleTarget.classList.toggle('js-menu-toggle__toggleable--open');

  if ($menuToggleTarget.classList.contains('js-menu-toggle__toggleable--open')) {
    menuToggleOpen($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
  } else {
    // console.log('toggleState', $menuToggleButton);
    menuToggleShut($menuToggleButton, $menuToggleTarget, postShutCallback);
  }
};
/**
 * Initialize menu toggles
 * @param {DOM Object} $menuToggleButton The input label to toggle, should have class of 'menu-toggle-button'
 */


exports.menuToggleToggleState = menuToggleToggleState;

var menuToggleInit = function menuToggleInit($menuToggleButton, postInitCallback, toggleButtonKeyboardHandler, toggleTargetKeyboardHandler, postOpenCallback, postShutCallback) {
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
    menuToggleToggleState($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
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
      menuToggleOpen($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
    } // LEFT
    else if (keyCode === 37) {
        event.preventDefault();
        event.stopPropagation(); // console.log('Left Button', $menuToggleButton);

        menuToggleShut($menuToggleButton, $menuToggleTarget, postShutCallback);
      } // DOWN
      else if (keyCode === 40) {
          event.preventDefault();
          event.stopPropagation();
          menuToggleOpen($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
        } // UP
        else if (keyCode === 38) {
            event.preventDefault();
            event.stopPropagation(); // console.log('Up Button', $menuToggleButton);

            menuToggleShut($menuToggleButton, $menuToggleTarget, postShutCallback);
          } // ESCAPE
          else if (keyCode === 27) {
              // console.log('pressed escape, toggle button', $menuToggleButton);
              event.preventDefault();
              event.stopPropagation();
              menuToggleShut($menuToggleButton, $menuToggleTarget, postShutCallback);
            } // Space or Enter
            else if (keyCode === 13 || keyCode === 32) {
                event.preventDefault();
                event.stopPropagation();
                menuToggleToggleState($menuToggleButton, $menuToggleTarget, postOpenCallback, postShutCallback);
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
        menuToggleBackOut(postShutCallback);
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
      menuToggleShut($menuToggleButton, $menuToggleTarget, postShutCallback);
    });
    $menuToggleTarget.appendChild($menuToggleableClose);
  }

  _events.resize.add(function () {
    var menuToggleButtonDisplay = getComputedStyle($menuToggleButton).display; // On resize remove classes if the toggle button is hidden

    if (menuToggleButtonDisplay === 'none' && $menuToggleTarget.classList.contains('js-menu-toggle__toggleable')) {
      // Remove classes
      $menuToggleTarget.classList.remove('js-menu-toggle__toggleable');
    } // If the button isn't hidden and we don't have the js toggle classes, re-add
    else if (menuToggleButtonDisplay !== 'none' && !$menuToggleTarget.classList.contains('js-menu-toggle__toggleable')) {
        $menuToggleTarget.classList.add('js-menu-toggle__toggleable');
      } // On page resize make sure menu isn't and won't be clipped


    if ($body.dataset.menuToggleLastOpenToggleTarget) {
      menuToggleAdjustMenuAndPageHeights(document.getElementById($body.dataset.menuToggleLastOpenToggleTarget));
    }
  });

  if (typeof postInitCallback === 'function') {
    postInitCallback($menuToggleButton, $menuToggleTarget, menuToggleOpen, menuToggleShut);
  }
};

exports.menuToggleInit = menuToggleInit;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUtdG9nZ2xlLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJkYXRhc2V0IiwibWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0IiwibWVudVRvZ2dsZUFkanVzdE1lbnVBbmRQYWdlSGVpZ2h0cyIsIiRtZW51VG9nZ2xlVGFyZ2V0IiwiJGJvZHlJbm5lciIsImNsYXNzTGlzdCIsImNvbnRhaW5zIiwic3R5bGUiLCJzZXRQcm9wZXJ0eSIsImlubmVySGVpZ2h0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwidG9wIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJhZGQiLCJtZW51VG9nZ2xlQ29udGVudFdyYXBwZXJIZWlnaHQiLCJvZmZzZXRIZWlnaHQiLCJib3R0b21PZlRvZ2dsZVRhcmdldCIsIm1lbnVUb2dnbGVTaHV0IiwiJG1lbnVUb2dnbGVCdXR0b24iLCJwb3N0U2h1dENhbGxiYWNrIiwiJGJvZHkiLCJyZW1vdmVQcm9wZXJ0eSIsInNldEF0dHJpYnV0ZSIsInJlbW92ZSIsImdldEF0dHJpYnV0ZSIsInBhcmVudE1lbnVUb2dnbGUiLCIkcGFyZW50TWVudVRvZ2dsZVRhcmdldCIsImdldEVsZW1lbnRCeUlkIiwiJGFjdGl2ZU1lbnVUb2dnbGVDaGlsZHJlbiIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJsZW5ndGgiLCJpIiwic2V0VGltZW91dCIsImZvY3VzIiwibWVudVRvZ2dsZUJhY2tPdXQiLCJhY3RpdmVFbGVtZW50IiwidGFnTmFtZSIsIiRvcGVuUGFyZW50VG9nZ2xlVGFyZ2V0IiwiY2xvc2VzdCIsIiRvcGVuUGFyZW50VG9nZ2xlIiwiJG9wZW5UYXJnZXQiLCIkb3BlblRhcmdldFRvZ2dsZSIsIm1lbnVUb2dnbGVPcGVuIiwicG9zdE9wZW5DYWxsYmFjayIsImN1cnJlbnRUb2dnbGVUYXJnZXQiLCIkbGFzdE9wZW5Ub2dnbGVUYXJnZXQiLCJjaGlsZE9mT3BlblRvZ2dsZVRhcmdldCIsIiRsYXN0T3BlblRvZ2dsZVRhcmdldHNCdXR0b24iLCJtZW51VG9nZ2xlVG9nZ2xlU3RhdGUiLCJ0b2dnbGUiLCJtZW51VG9nZ2xlSW5pdCIsInBvc3RJbml0Q2FsbGJhY2siLCJ0b2dnbGVCdXR0b25LZXlib2FyZEhhbmRsZXIiLCJ0b2dnbGVUYXJnZXRLZXlib2FyZEhhbmRsZXIiLCJtZW51VG9nZ2xlVGFyZ2V0SUQiLCJjb250cm9scyIsImNoZWNrYm94SUQiLCIkbWVudVRvZ2dsZUNoZWNrYm94IiwiJG1lbnVUb2dnbGVOZXdCdXR0b24iLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwic3BsaXQiLCJmb3JFYWNoIiwiY2xhc3NOYW1lIiwicmVwbGFjZSIsInBhcmVudE5vZGUiLCJyZXBsYWNlQ2hpbGQiLCJnZXRDb21wdXRlZFN0eWxlIiwiZGlzcGxheSIsInBhcmVudEVsZW1lbnQiLCJkZWZhdWx0VG9nZ2xlQnV0dG9uS2V5Ym9hcmRIYW5kbGVyIiwiZXZlbnQiLCJrZXlDb2RlIiwid2hpY2giLCJwcmV2ZW50RGVmYXVsdCIsInN0b3BQcm9wYWdhdGlvbiIsImRlZmF1bHRUb2dnbGVUYXJnZXRLZXlib2FyZEhhbmRsZXIiLCIkdGFyZ2V0IiwidGFyZ2V0IiwiJG1lbnVUb2dnbGVhYmxlQ2xvc2UiLCJhcHBlbmRDaGlsZCIsInJlc2l6ZSIsIm1lbnVUb2dnbGVCdXR0b25EaXNwbGF5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkE7O0FBQ0FBLE1BQU0sQ0FBQ0MsZ0JBQVAsQ0FBd0Isa0JBQXhCLEVBQTRDLFlBQVk7QUFDdERDLEVBQUFBLFFBQVEsQ0FBQ0MsYUFBVCxDQUF1QixNQUF2QixFQUErQkMsT0FBL0IsQ0FBdUNDLDhCQUF2QyxHQUF3RSxFQUF4RTtBQUNELENBRkQsRSxDQUlBOztBQUNBOzs7OztBQUlPLElBQU1DLGtDQUFrQyxH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bXBvcnQge3Jlc2l6ZSx9IGZyb20gJy4vZXZlbnRzJztcbmltcG9ydCB7Y2xvc2VzdCx9IGZyb20gJy4vcG9seWZpbGwnO1xuXG4vLyBAdG9kbyBMb3RzIG9mIGJ1Z3MgZ29pbmcgZnJvbSBkZXNrdG9wIHRvIG1vYmlsZSBuYXZcbi8vIEB0b2RvIHRlc3QgaW4gYnJvd3NlcnNcbi8vIEB0b2RvIGFjY2Vzc2liaWxpdHkgYXVkaXRcbi8vIEB0b2RvIG1ha2Ugc3VyZSBuby1qcyB3b3Jrc1xuLy8gQHRvZG8gbWFrZSBzdXJlIGl0IGNhbiBoYW5kbGUgcmVndWxhciBidXR0b25zXG5cbi8vIFJ1biBjbG9zZXN0IHBvbHlmaWxsXG5jbG9zZXN0KCk7XG5cbi8qKlxuICogSGFuZGxlcyBjb2xsYXBzaWJsZSBtZWdhIG1lbnUgYmVoYXZpb3JcbiAqXG4gKiBSZXBsYWNlcyBpbml0aWFsIG1hcmt1cCB3aXRoIGlkZWFsIGFjY2Vzc2libGUgbWFya3VwLCBpbml0aWFsIG1hcmt1cCB3b3JrcyB3aXRob3V0IEpTIGJ1dCBpc24ndCBncmVhdCBmb3IgYWNjZXNzaWJpbGl0eTtcbiAqXG4gKiBJbml0aWFsIG1hcmt1cCBzaG91bGQgaGF2ZSB0aGUgZm9sbG93aW5nIGVsZW1lbnRzOlxuICogICAgIDxpbnB1dCBpZD1cImRlc2t0b3AtYnVyZ2VyLXRvZ2dsZVwiIGNsYXNzPVwibWVudS10b2dnbGUgdS1lbGVtZW50LWludmlzaWJsZVwiIHR5cGU9XCJjaGVja2JveFwiIGFyaWEtY29udHJvbHM9XCJkZXNrdG9wLWJ1cmdlci1tZW51LWNvbnRhaW5lclwiPlxuICogICAgIDxsYWJlbCBjbGFzcz1cIm1lbnUtdG9nZ2xlLWJ1dHRvblwiIGZvcj1cImRlc2t0b3AtYnVyZ2VyLXRvZ2dsZVwiIGRhdGEtY29udHJvbHM9XCJkZXNrdG9wLWJ1cmdlci1tZW51LWNvbnRhaW5lclwiPlxuICogICAgICAgTWVudSBpY29uIG9yIExhYmVsIFRleHRcbiAqICAgICAgIDxzcGFuIGNsYXNzPVwibWVudS10b2dnbGUtYXNzaXN0aXZlLXRleHQgdS1lbGVtZW50LWludmlzaWJsZVwiPlRvZ2dsZSBtZW51IHZpc2liaWxpdHk8L3NwYW4+XG4gKiAgICAgPC9sYWJlbD5cbiAqICAgICA8ZGl2IGNsYXNzPVwibWVudS10b2dnbGVfX3RvZ2dsZWFibGVcIj5cbiAqICAgICAgIDxkaXYgY2xhc3M9XCJtZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS1jb250ZW50LXdyYXBwZXJcIj5cbiAqICAgICAgICAgQ29udGVudCBpbiBDb2xsYXBzaWJsZSBDb250YWluZXJcbiAqICAgICAgIDwvZGl2PlxuICogICAgIDwvZGl2PlxuICovXG5cbi8vIEtlZXBzIHRyYWNrIG9mIGxhc3Qgb3BlbiB0b2dnbGVcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24gKCkge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQgPSAnJztcbn0pO1xuXG4vLyBIZWxwZXIgZnVuY3Rpb25zIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8qKlxuICogRW5zdXJlcyB0aGF0IHRoZSBtZW51IGFyZWEgYW5kIHBhZ2UgYXJlIHRhbGwgZW5vdWdoIHRvIHNob3cgdGhlIG1lbnVcbiAqIEBwYXJhbSB7RE9NIE9iamVjdH0gJG1lbnVUb2dnbGVUYXJnZXQgU2libGluZyBlbGVtZW50IHRvIHRvZ2dsZSBidXR0b24gdGhhdCBvcGVuc1xuICovXG5leHBvcnQgY29uc3QgbWVudVRvZ2dsZUFkanVzdE1lbnVBbmRQYWdlSGVpZ2h0cyA9ICgkbWVudVRvZ2dsZVRhcmdldCkgPT4ge1xuICBjb25zdCAkYm9keUlubmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmJvZHktaW5uZXInKTtcbiAgaWYgKCRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLWZ1bGwtaGVpZ2h0JykpIHtcbiAgICAkbWVudVRvZ2dsZVRhcmdldC5zdHlsZS5zZXRQcm9wZXJ0eSgnaGVpZ2h0JywgYCR7d2luZG93LmlubmVySGVpZ2h0IC0gJG1lbnVUb2dnbGVUYXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wfXB4YCk7XG4gICAgJGJvZHlJbm5lci5zdHlsZS5zZXRQcm9wZXJ0eSgnbWluLWhlaWdodCcsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXS5jbGFzc0xpc3QuYWRkKCd1LWJvZHktbm8tc2Nyb2xsJyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uc3QgbWVudVRvZ2dsZUNvbnRlbnRXcmFwcGVySGVpZ2h0ID0gJG1lbnVUb2dnbGVUYXJnZXQucXVlcnlTZWxlY3RvcignLm1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLWNvbnRlbnQtd3JhcHBlcicpLm9mZnNldEhlaWdodDtcbiAgICBjb25zdCBib3R0b21PZlRvZ2dsZVRhcmdldCA9IG1lbnVUb2dnbGVDb250ZW50V3JhcHBlckhlaWdodCArICRtZW51VG9nZ2xlVGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgICAkbWVudVRvZ2dsZVRhcmdldC5zdHlsZS5zZXRQcm9wZXJ0eSgnaGVpZ2h0JywgYCR7bWVudVRvZ2dsZUNvbnRlbnRXcmFwcGVySGVpZ2h0fXB4YCk7XG4gICAgJGJvZHlJbm5lci5zdHlsZS5zZXRQcm9wZXJ0eSgnbWluLWhlaWdodCcsIGAke2JvdHRvbU9mVG9nZ2xlVGFyZ2V0fXB4YCk7XG4gIH1cbn07XG5cbi8qKlxuICogU2h1dHMgYSBtZW51XG4gKiBAcGFyYW0ge0RPTSBPYmplY3R9ICRtZW51VG9nZ2xlQnV0dG9uIEJ1dHRvbiB0b2dnbGVcbiAqIEBwYXJhbSB7RE9NIE9iamVjdH0gJG1lbnVUb2dnbGVUYXJnZXQgU2libGluZyBlbGVtZW50IHRvIHRvZ2dsZSBidXR0b24gdGhhdCBvcGVuc1xuICogQHBhcmFtIHtmdW5jdGlvbn0gICBwb3N0U2h1dENhbGxiYWNrICBGdW5jdGlvbiB0byBjYWxsIGFmdGVyIHNodXQgY29kZVxuICovXG5leHBvcnQgY29uc3QgbWVudVRvZ2dsZVNodXQgPSAoJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBwb3N0U2h1dENhbGxiYWNrKSA9PiB7XG4gIC8vIFF1aWNrIGV4aXQgaWYgaXQncyBhbHJlYWR5IHNodXRcbiAgaWYgKCEkbWVudVRvZ2dsZUJ1dHRvbi5jbGFzc0xpc3QuY29udGFpbnMoJ2pzLW1lbnUtdG9nZ2xlLWJ1dHRvbi0tYWN0aXZlJykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgJGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG4gIGNvbnN0ICRib2R5SW5uZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYm9keS1pbm5lcicpO1xuICAkYm9keUlubmVyLnN0eWxlLnJlbW92ZVByb3BlcnR5KCdtaW4taGVpZ2h0Jyk7XG4gICRtZW51VG9nZ2xlQnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAkbWVudVRvZ2dsZUJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdqcy1tZW51LXRvZ2dsZS1idXR0b24tLWFjdGl2ZScpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdLmNsYXNzTGlzdC5yZW1vdmUoJ3UtYm9keS1uby1zY3JvbGwnKTtcbiAgaWYgKCEkbWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1mdWxsLWhlaWdodCcpKSB7XG4gICAgJG1lbnVUb2dnbGVUYXJnZXQuc3R5bGUuc2V0UHJvcGVydHkoJ2hlaWdodCcsICcwJyk7XG4gIH1cbiAgJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZSgnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLW9wZW4nKTtcbiAgaWYgKCRtZW51VG9nZ2xlVGFyZ2V0LmdldEF0dHJpYnV0ZSgnaWQnKSA9PT0gJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQpIHtcbiAgICBpZiAoJG1lbnVUb2dnbGVUYXJnZXQuZGF0YXNldC5wYXJlbnRNZW51VG9nZ2xlKSB7XG4gICAgICAkYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCA9ICRtZW51VG9nZ2xlVGFyZ2V0LmRhdGFzZXQucGFyZW50TWVudVRvZ2dsZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAkYm9keS5kYXRhc2V0Lm1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCA9ICcnO1xuICAgIH1cbiAgfVxuXG4gIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGlzIGEgY2hpbGQgdG9nZ2xlIGFuZCBtYW5hZ2UgY2xhc3Nlc1xuICBjb25zdCAkcGFyZW50TWVudVRvZ2dsZVRhcmdldCA9ICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgkbWVudVRvZ2dsZVRhcmdldC5kYXRhc2V0LnBhcmVudE1lbnVUb2dnbGUpO1xuICBpZiAoJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQpIHtcbiAgICAkcGFyZW50TWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS0tYWN0aXZlLWNoaWxkJywgJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1hY3RpdmUtY2hpbGQtLXRyYW5zaXRpb25lZCcpO1xuICB9XG4gICRtZW51VG9nZ2xlQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoJ2pzLW1lbnUtdG9nZ2xlLWJ1dHRvbi0tYWN0aXZlJyk7XG4gICRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1vcGVuJyk7XG5cbiAgLy8gQ2xvc2UgYW55IG9wZW4gY2hpbGQgbWVudVRvZ2dsZXNcbiAgY29uc3QgJGFjdGl2ZU1lbnVUb2dnbGVDaGlsZHJlbiA9ICRtZW51VG9nZ2xlVGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy5qcy1tZW51LXRvZ2dsZS1idXR0b24tLWFjdGl2ZScpO1xuICBpZiAoJGFjdGl2ZU1lbnVUb2dnbGVDaGlsZHJlbi5sZW5ndGgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8ICRhY3RpdmVNZW51VG9nZ2xlQ2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIFNodXQgb3BlbiBjaGlsZHJlbiB3aGVuIGl0J3MgY29udmVuaWVudFxuICAgICAgc2V0VGltZW91dChcbiAgICAgICAgbWVudVRvZ2dsZVNodXQoXG4gICAgICAgICAgJGFjdGl2ZU1lbnVUb2dnbGVDaGlsZHJlbltpXSxcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgkYWN0aXZlTWVudVRvZ2dsZUNoaWxkcmVuW2ldLmdldEF0dHJpYnV0ZSgnYXJpYS1jb250cm9scycpKSxcbiAgICAgICAgICBwb3N0U2h1dENhbGxiYWNrXG4gICAgICAgICksXG4gICAgICAgIDBcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLy8gUHV0IGZvY3VzIG9uIHRvZ2dsZSdzIGJ1dHRvbiBhZnRlciBjbG9zZVxuICAkbWVudVRvZ2dsZUJ1dHRvbi5mb2N1cygpO1xuXG4gIGlmICh0eXBlb2YgcG9zdFNodXRDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHBvc3RTaHV0Q2FsbGJhY2soJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCAkcGFyZW50TWVudVRvZ2dsZVRhcmdldCk7XG4gIH1cbn07XG5cbi8qKlxuICogQmFjayBvdXQgb2YgY3VycmVudCBjb250ZXh0XG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSAgcG9zdFNodXRDYWxsYmFja1xuICovXG5leHBvcnQgY29uc3QgbWVudVRvZ2dsZUJhY2tPdXQgPSAocG9zdFNodXRDYWxsYmFjaykgPT4ge1xuICAvLyBTZWUgd2hlcmUgZm9jdXMgaXMgYW5kIGNsb3NlIG5lYXJlc3QgcGFyZW50IG9wZW4gdG9nZ2xlXG4gIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50LnRhZ05hbWUgIT09ICdCT0RZJykge1xuICAgIGNvbnN0ICRvcGVuUGFyZW50VG9nZ2xlVGFyZ2V0ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5jbG9zZXN0KCcuanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLW9wZW4nKTtcbiAgICBpZiAoJG9wZW5QYXJlbnRUb2dnbGVUYXJnZXQpIHtcbiAgICAgIGNvbnN0ICRvcGVuUGFyZW50VG9nZ2xlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2FyaWEtY29udHJvbHM9XCIkeyRvcGVuUGFyZW50VG9nZ2xlVGFyZ2V0LmdldEF0dHJpYnV0ZSgnaWQnKX1cIl1gKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdCYWNrIG91dCcsICRvcGVuUGFyZW50VG9nZ2xlKTtcbiAgICAgIG1lbnVUb2dnbGVTaHV0KFxuICAgICAgICAkb3BlblBhcmVudFRvZ2dsZSxcbiAgICAgICAgJG9wZW5QYXJlbnRUb2dnbGVUYXJnZXQsXG4gICAgICAgIHBvc3RTaHV0Q2FsbGJhY2tcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgLy8gQ2xvc2UgdGhlIHRvZ2dsZSB0aGF0IHdhcyBvcGVuZWQgbGFzdFxuICBjb25zdCAkYm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKTtcbiAgaWYgKCRib2R5LmRhdGFzZXQubWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0ICYmICRib2R5LmRhdGFzZXQubWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0ICE9PSAnJykge1xuICAgIGNvbnN0ICRvcGVuVGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQpO1xuICAgIGlmICgkb3BlblRhcmdldCkge1xuICAgICAgY29uc3QgJG9wZW5UYXJnZXRUb2dnbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbYXJpYS1jb250cm9scz1cIiR7JGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXR9XCJdYCk7XG4gICAgICAvLyBjb25zb2xlLmxvZygnQ2xvc2VkIGxhc3Qgb3BlbicsICRvcGVuVGFyZ2V0VG9nZ2xlKTtcbiAgICAgIG1lbnVUb2dnbGVTaHV0KFxuICAgICAgICAkb3BlblRhcmdldFRvZ2dsZSxcbiAgICAgICAgJG9wZW5UYXJnZXQsXG4gICAgICAgIHBvc3RTaHV0Q2FsbGJhY2tcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIC8vIGNvbnNvbGUubG9nKCdDb3VsZG5cXCd0IGZpbmQgbWVudSB0b2dnbGUgdG8gYmFja291dCBvZicpO1xufTtcblxuLyoqXG4gKiBPcGVuIGEgbWVudVxuICogQHBhcmFtIHtET00gT2JqZWN0fSAkbWVudVRvZ2dsZUJ1dHRvbiBCdXR0b24gdG9nZ2xlXG4gKiBAcGFyYW0ge0RPTSBPYmplY3R9ICRtZW51VG9nZ2xlVGFyZ2V0IFNpYmxpbmcgZWxlbWVudCB0byB0b2dnbGUgYnV0dG9uIHRoYXQgb3BlbnNcbiAqIEBwYXJhbSB7ZnVuY3Rpb259ICAgcG9zdE9wZW5DYWxsYmFjayAgRnVuY3Rpb24gdG8gcnVuIGFmdGVyIG9wZW4gYmVoYXZpb3JzXG4gKi9cbmV4cG9ydCBjb25zdCBtZW51VG9nZ2xlT3BlbiA9ICgkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIHBvc3RPcGVuQ2FsbGJhY2ssIHBvc3RTaHV0Q2FsbGJhY2spID0+IHtcbiAgY29uc3QgJGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG4gIGNvbnN0IGN1cnJlbnRUb2dnbGVUYXJnZXQgPSAkbWVudVRvZ2dsZUJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKTtcbiAgY29uc3QgbWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0ID0gJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQ7XG5cbiAgLy8gU2h1dCBhbiBvcGVuIHRvZ2dsZSBzbyBsb25nIGFzIGl0IGlzbid0IGEgcGFyZW50IG9mIHRoZSBvbmUgd2UncmUgb3BlbmluZ1xuICBpZiAoXG4gICAgbWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0XG4gICAgJiYgbWVudVRvZ2dsZUxhc3RPcGVuVG9nZ2xlVGFyZ2V0ICE9PSBjdXJyZW50VG9nZ2xlVGFyZ2V0XG4gICkge1xuICAgIGNvbnN0ICRsYXN0T3BlblRvZ2dsZVRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1lbnVUb2dnbGVMYXN0T3BlblRvZ2dsZVRhcmdldCk7XG4gICAgY29uc3QgY2hpbGRPZk9wZW5Ub2dnbGVUYXJnZXQgPSAkbGFzdE9wZW5Ub2dnbGVUYXJnZXQuY29udGFpbnMoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY3VycmVudFRvZ2dsZVRhcmdldCkpO1xuICAgIGlmICghY2hpbGRPZk9wZW5Ub2dnbGVUYXJnZXQpIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdCYWNrIE91dCBEdXJpbmcgT3BlbicsICRtZW51VG9nZ2xlQnV0dG9uKTtcbiAgICAgIC8vIEZpbmQgdGhlIHRvZ2dsZSB0YXJnZXQncyBidXR0b25cbiAgICAgIGNvbnN0ICRsYXN0T3BlblRvZ2dsZVRhcmdldHNCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbYXJpYS1jb250cm9scz1cIicgKyBtZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQgKyAnXCJdJyk7XG4gICAgICBpZiAoJGxhc3RPcGVuVG9nZ2xlVGFyZ2V0c0J1dHRvbikge1xuICAgICAgICBtZW51VG9nZ2xlU2h1dCgkbGFzdE9wZW5Ub2dnbGVUYXJnZXRzQnV0dG9uLCAkbGFzdE9wZW5Ub2dnbGVUYXJnZXQsIHBvc3RTaHV0Q2FsbGJhY2spO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBtZW51VG9nZ2xlQWRqdXN0TWVudUFuZFBhZ2VIZWlnaHRzKCRtZW51VG9nZ2xlVGFyZ2V0KTtcbiAgJG1lbnVUb2dnbGVCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgJG1lbnVUb2dnbGVCdXR0b24uY2xhc3NMaXN0LmFkZCgnanMtbWVudS10b2dnbGUtYnV0dG9uLS1hY3RpdmUnKTtcbiAgJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LmFkZCgnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLW9wZW4nKTtcbiAgY29uc3QgJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgkbWVudVRvZ2dsZVRhcmdldC5kYXRhc2V0LnBhcmVudE1lbnVUb2dnbGUpO1xuICBpZiAoJHBhcmVudE1lbnVUb2dnbGVUYXJnZXQpIHtcbiAgICAkcGFyZW50TWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QuYWRkKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS0tYWN0aXZlLWNoaWxkJyk7XG4gIH1cbiAgJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQgPSBjdXJyZW50VG9nZ2xlVGFyZ2V0O1xuXG4gIGlmICh0eXBlb2YgcG9zdE9wZW5DYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHBvc3RPcGVuQ2FsbGJhY2soJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCAkcGFyZW50TWVudVRvZ2dsZVRhcmdldCk7XG4gIH1cbn07XG5cbi8qKlxuICogVG9nZ2xlIGEgZ2l2ZW4gbWVudVxuICovXG5leHBvcnQgY29uc3QgbWVudVRvZ2dsZVRvZ2dsZVN0YXRlID0gKCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgcG9zdE9wZW5DYWxsYmFjaywgcG9zdFNodXRDYWxsYmFjaykgPT4ge1xuICAkbWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QudG9nZ2xlKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZS0tb3BlbicpO1xuXG4gIGlmICgkbWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlLS1vcGVuJykpIHtcbiAgICBtZW51VG9nZ2xlT3BlbigkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIHBvc3RPcGVuQ2FsbGJhY2ssIHBvc3RTaHV0Q2FsbGJhY2spO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIGNvbnNvbGUubG9nKCd0b2dnbGVTdGF0ZScsICRtZW51VG9nZ2xlQnV0dG9uKTtcbiAgICBtZW51VG9nZ2xlU2h1dCgkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIHBvc3RTaHV0Q2FsbGJhY2spO1xuICB9XG59O1xuXG4vKipcbiAqIEluaXRpYWxpemUgbWVudSB0b2dnbGVzXG4gKiBAcGFyYW0ge0RPTSBPYmplY3R9ICRtZW51VG9nZ2xlQnV0dG9uIFRoZSBpbnB1dCBsYWJlbCB0byB0b2dnbGUsIHNob3VsZCBoYXZlIGNsYXNzIG9mICdtZW51LXRvZ2dsZS1idXR0b24nXG4gKi9cbmV4cG9ydCBjb25zdCBtZW51VG9nZ2xlSW5pdCA9IChcbiAgJG1lbnVUb2dnbGVCdXR0b24sXG4gIHBvc3RJbml0Q2FsbGJhY2ssXG4gIHRvZ2dsZUJ1dHRvbktleWJvYXJkSGFuZGxlcixcbiAgdG9nZ2xlVGFyZ2V0S2V5Ym9hcmRIYW5kbGVyLFxuICBwb3N0T3BlbkNhbGxiYWNrLFxuICBwb3N0U2h1dENhbGxiYWNrXG4gICkgPT4ge1xuICBpZiAoJG1lbnVUb2dnbGVCdXR0b24udGFnTmFtZSA9PT0gJ0JVVFRPTicgJiYgJG1lbnVUb2dnbGVCdXR0b24uY2xhc3NMaXN0LmNvbnRhaW5zKCdqcy1tZW51LXRvZ2dsZS1idXR0b24nKSkge1xuICAgIC8vIEFib3J0LCB3ZSd2ZSBhbHJlYWR5IGluaXRpYWxpemVkIHRoaXMhXG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IG1lbnVUb2dnbGVUYXJnZXRJRCA9ICRtZW51VG9nZ2xlQnV0dG9uLmRhdGFzZXQuY29udHJvbHM7XG4gIGNvbnN0ICRtZW51VG9nZ2xlVGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWVudVRvZ2dsZVRhcmdldElEKTtcbiAgY29uc3QgJGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG5cbiAgaWYgKCRtZW51VG9nZ2xlQnV0dG9uLnRhZ05hbWUgPT09ICdMQUJFTCcpIHtcbiAgICBjb25zdCBjaGVja2JveElEID0gJG1lbnVUb2dnbGVCdXR0b24uZ2V0QXR0cmlidXRlKCdmb3InKTtcbiAgICBjb25zdCAkbWVudVRvZ2dsZUNoZWNrYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2hlY2tib3hJRCk7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGJ1dHRvbiBIVE1MIHRvIHJlcGxhY2UgY2hlY2tib3hcbiAgICAgKi9cbiAgICBjb25zdCAkbWVudVRvZ2dsZU5ld0J1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICRtZW51VG9nZ2xlTmV3QnV0dG9uLmlubmVySFRNTCA9ICRtZW51VG9nZ2xlQnV0dG9uLmlubmVySFRNTDtcbiAgICAvLyBHZXQgY2xhc3NlcyBmcm9tIGN1cnJlbnQgYnV0dG9uIGFuZCBhZGQgdGhlbSB0byBuZXcgYnV0dG9uXG4gICAgJG1lbnVUb2dnbGVCdXR0b24uZ2V0QXR0cmlidXRlKCdjbGFzcycpLnNwbGl0KCcgJykuZm9yRWFjaChjbGFzc05hbWUgPT4ge1xuICAgICAgLy8gU3RyaXAgd2hpdGUgc3BhY2VcbiAgICAgIGNsYXNzTmFtZSA9IGNsYXNzTmFtZS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG4gICAgICBpZiAoY2xhc3NOYW1lLmxlbmd0aCkge1xuICAgICAgICAkbWVudVRvZ2dsZU5ld0J1dHRvbi5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgJG1lbnVUb2dnbGVOZXdCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJywgJG1lbnVUb2dnbGVCdXR0b24uZ2V0QXR0cmlidXRlKCdkYXRhLWNvbnRyb2xzJykpO1xuICAgICRtZW51VG9nZ2xlTmV3QnV0dG9uLnNldEF0dHJpYnV0ZSgnaWQnLCBjaGVja2JveElEKTtcbiAgICAkbWVudVRvZ2dsZU5ld0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGFzcG9wdXAnLCAndHJ1ZScpO1xuICAgICRtZW51VG9nZ2xlTmV3QnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuXG4gICAgLy8gUmVtb3ZlIGNoZWNrYm94XG4gICAgJG1lbnVUb2dnbGVDaGVja2JveC5yZW1vdmUoKTtcbiAgICAvLyBSZXBsYWNlIGxhYmVsIHdpdGggYnV0dG9uXG4gICAgJG1lbnVUb2dnbGVCdXR0b24ucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoJG1lbnVUb2dnbGVOZXdCdXR0b24sICRtZW51VG9nZ2xlQnV0dG9uKTtcbiAgICAkbWVudVRvZ2dsZUJ1dHRvbiA9ICRtZW51VG9nZ2xlTmV3QnV0dG9uO1xuICB9XG5cbiAgLy8gQ2xhc3MgdG8gbGV0IHVzIGtub3cgdGhpcyBoYXMgYmVlbiBpbml0aWFsaXplZFxuICAkbWVudVRvZ2dsZUJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdqcy1tZW51LXRvZ2dsZS1idXR0b24nKTtcblxuICAvLyBJZiB0aGUgdG9nZ2xlIGlzIHZpc2libGUsIGFkZCBjbGFzcyB0byB0YXJnZXQgdG8gc2hvdyB0aGlzIEpTIGhhcyBiZWVuIHByb2Nlc3NlZFxuICBpZiAoZ2V0Q29tcHV0ZWRTdHlsZSgkbWVudVRvZ2dsZUJ1dHRvbikuZGlzcGxheSAhPT0gJ25vbmUnKSB7XG4gICAgJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LmFkZCgnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUnKTtcbiAgfVxuXG4gIC8vIElmIHdlIGhhdmUgYSBwYXJlbnQgdG9nZ2xlIHNldCBhbiBhdHRyaWJ1dGUgdGhhdCBnaXZlcyB1cyB0aGUgaWRcbiAgLy8gQHRvZG8gVGVzdCBpbiBJRVxuICBjb25zdCAkcGFyZW50TWVudVRvZ2dsZVRhcmdldCA9ICRtZW51VG9nZ2xlVGFyZ2V0LnBhcmVudEVsZW1lbnQuY2xvc2VzdCgnLm1lbnUtdG9nZ2xlX190b2dnbGVhYmxlJyk7XG4gIGlmICgkcGFyZW50TWVudVRvZ2dsZVRhcmdldCAhPT0gbnVsbCkge1xuICAgICRtZW51VG9nZ2xlVGFyZ2V0LmRhdGFzZXQucGFyZW50TWVudVRvZ2dsZSA9ICRwYXJlbnRNZW51VG9nZ2xlVGFyZ2V0LmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgfVxuXG4gIC8vIFRvZ2dsZSBidXR0b24gY2xpY2sgYmVoYXZpb3JcbiAgJG1lbnVUb2dnbGVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgbWVudVRvZ2dsZVRvZ2dsZVN0YXRlKCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgcG9zdE9wZW5DYWxsYmFjaywgcG9zdFNodXRDYWxsYmFjayk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBEZWZhdWx0IFRvZ2dsZSBCdXR0b24gS2V5Ym9hcmQgZXZlbnQgaGFuZGxlclxuICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcbiAgICovXG4gIGNvbnN0IGRlZmF1bHRUb2dnbGVCdXR0b25LZXlib2FyZEhhbmRsZXIgPSAoZXZlbnQpID0+IHtcbiAgICAvLyB2YXIgJHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICB2YXIga2V5Q29kZSA9IGV2ZW50LndoaWNoO1xuXG4gICAgLy8gUklHSFRcbiAgICBpZiAoa2V5Q29kZSA9PT0gMzkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIG1lbnVUb2dnbGVPcGVuKCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgcG9zdE9wZW5DYWxsYmFjaywgcG9zdFNodXRDYWxsYmFjayk7XG4gICAgfVxuICAgIC8vIExFRlRcbiAgICBlbHNlIGlmIChrZXlDb2RlID09PSAzNykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgLy8gY29uc29sZS5sb2coJ0xlZnQgQnV0dG9uJywgJG1lbnVUb2dnbGVCdXR0b24pO1xuICAgICAgbWVudVRvZ2dsZVNodXQoXG4gICAgICAgICRtZW51VG9nZ2xlQnV0dG9uLFxuICAgICAgICAkbWVudVRvZ2dsZVRhcmdldCxcbiAgICAgICAgcG9zdFNodXRDYWxsYmFja1xuICAgICAgKTtcbiAgICB9XG4gICAgLy8gRE9XTlxuICAgIGVsc2UgaWYgKGtleUNvZGUgPT09IDQwKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBtZW51VG9nZ2xlT3BlbigkbWVudVRvZ2dsZUJ1dHRvbiwgJG1lbnVUb2dnbGVUYXJnZXQsIHBvc3RPcGVuQ2FsbGJhY2ssIHBvc3RTaHV0Q2FsbGJhY2spO1xuICAgIH1cbiAgICAvLyBVUFxuICAgIGVsc2UgaWYgKGtleUNvZGUgPT09IDM4KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAvLyBjb25zb2xlLmxvZygnVXAgQnV0dG9uJywgJG1lbnVUb2dnbGVCdXR0b24pO1xuICAgICAgbWVudVRvZ2dsZVNodXQoJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBwb3N0U2h1dENhbGxiYWNrKTtcbiAgICB9XG4gICAgLy8gRVNDQVBFXG4gICAgZWxzZSBpZiAoa2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdwcmVzc2VkIGVzY2FwZSwgdG9nZ2xlIGJ1dHRvbicsICRtZW51VG9nZ2xlQnV0dG9uKTtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIG1lbnVUb2dnbGVTaHV0KCRtZW51VG9nZ2xlQnV0dG9uLCAkbWVudVRvZ2dsZVRhcmdldCwgcG9zdFNodXRDYWxsYmFjayk7XG4gICAgfVxuICAgIC8vIFNwYWNlIG9yIEVudGVyXG4gICAgZWxzZSBpZiAoa2V5Q29kZSA9PT0gMTMgfHwga2V5Q29kZSA9PT0gMzIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIG1lbnVUb2dnbGVUb2dnbGVTdGF0ZShcbiAgICAgICAgJG1lbnVUb2dnbGVCdXR0b24sXG4gICAgICAgICRtZW51VG9nZ2xlVGFyZ2V0LFxuICAgICAgICBwb3N0T3BlbkNhbGxiYWNrLFxuICAgICAgICBwb3N0U2h1dENhbGxiYWNrXG4gICAgICApO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRGVmYXVsdCBUb2dnbGUgQnV0dG9uIEtleWJvYXJkIGV2ZW50IGhhbmRsZXJcbiAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XG4gICAqL1xuICBjb25zdCBkZWZhdWx0VG9nZ2xlVGFyZ2V0S2V5Ym9hcmRIYW5kbGVyID0gKGV2ZW50KSA9PiB7XG4gICAgdmFyICR0YXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgdmFyIGtleUNvZGUgPSBldmVudC53aGljaDtcblxuICAgIC8vIEVTQ0FQRVxuICAgIGlmIChrZXlDb2RlID09PSAyNykge1xuICAgICAgLy8gY29uc29sZS5sb2coJ3ByZXNzZWQgZXNjYXBlLCB0b2dnbGUgdGFyZ2V0JywgJHRhcmdldCk7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBpZiAoJHRhcmdldC50YWdOYW1lICE9PSAnQlVUVE9OJyAmJiAhJHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2pzLW1lbnUtdG9nZ2xlLWJ1dHRvbicpKSB7XG4gICAgICAgIG1lbnVUb2dnbGVCYWNrT3V0KHBvc3RTaHV0Q2FsbGJhY2spO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuXG4gIC8vIFNldCBrZXlib2FyZCBoYW5kbGVyc1xuICBpZiAodHlwZW9mIHRvZ2dsZUJ1dHRvbktleWJvYXJkSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICRtZW51VG9nZ2xlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0b2dnbGVCdXR0b25LZXlib2FyZEhhbmRsZXIpO1xuICB9XG4gIGVsc2Uge1xuICAgICRtZW51VG9nZ2xlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBkZWZhdWx0VG9nZ2xlQnV0dG9uS2V5Ym9hcmRIYW5kbGVyKTtcbiAgfVxuXG4gIC8vIFNldCBrZXlib2FyZCBoYW5kbGVyc1xuICBpZiAodHlwZW9mIHRvZ2dsZVRhcmdldEtleWJvYXJkSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICRtZW51VG9nZ2xlVGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0b2dnbGVUYXJnZXRLZXlib2FyZEhhbmRsZXIpO1xuICB9XG4gIGVsc2Uge1xuICAgICRtZW51VG9nZ2xlVGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBkZWZhdWx0VG9nZ2xlVGFyZ2V0S2V5Ym9hcmRIYW5kbGVyKTtcbiAgfVxuXG4gIC8vIEFkZCBjbG9zZSBidXR0b24gaWYgY2xhc3MgaGFzIGJlZW4gYWRkZWQgdG8gdG9nZ2xlYWJsZSBjb250YWluZXJcbiAgaWYgKCRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWVudS10b2dnbGVfX3RvZ2dsZWFibGUtLXdpdGgtY2xvc2UnKSkge1xuICAgIGNvbnN0ICRtZW51VG9nZ2xlYWJsZUNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgJG1lbnVUb2dnbGVhYmxlQ2xvc2UuY2xhc3NMaXN0LmFkZCgnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGVfX2Nsb3NlJyk7XG4gICAgJG1lbnVUb2dnbGVhYmxlQ2xvc2Uuc2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJywgbWVudVRvZ2dsZVRhcmdldElEKTtcbiAgICAkbWVudVRvZ2dsZWFibGVDbG9zZS5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9XCJlbGVtZW50LWludmlzaWJsZVwiPkNsb3NlPC9zcGFuPic7XG5cbiAgICAkbWVudVRvZ2dsZWFibGVDbG9zZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdzaHV0IGJ1dHRvbicsIHRoaXMpO1xuICAgICAgbWVudVRvZ2dsZVNodXQoJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBwb3N0U2h1dENhbGxiYWNrKTtcbiAgICB9KTtcblxuICAgICRtZW51VG9nZ2xlVGFyZ2V0LmFwcGVuZENoaWxkKCRtZW51VG9nZ2xlYWJsZUNsb3NlKTtcbiAgfVxuXG4gIHJlc2l6ZS5hZGQoKCkgPT4ge1xuICAgIGNvbnN0IG1lbnVUb2dnbGVCdXR0b25EaXNwbGF5ID0gZ2V0Q29tcHV0ZWRTdHlsZSgkbWVudVRvZ2dsZUJ1dHRvbikuZGlzcGxheTtcbiAgICAvLyBPbiByZXNpemUgcmVtb3ZlIGNsYXNzZXMgaWYgdGhlIHRvZ2dsZSBidXR0b24gaXMgaGlkZGVuXG4gICAgaWYgKG1lbnVUb2dnbGVCdXR0b25EaXNwbGF5ID09PSAnbm9uZScgJiYgJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdqcy1tZW51LXRvZ2dsZV9fdG9nZ2xlYWJsZScpKSB7XG4gICAgICAvLyBSZW1vdmUgY2xhc3Nlc1xuICAgICAgJG1lbnVUb2dnbGVUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZSgnanMtbWVudS10b2dnbGVfX3RvZ2dsZWFibGUnKTtcbiAgICB9XG4gICAgLy8gSWYgdGhlIGJ1dHRvbiBpc24ndCBoaWRkZW4gYW5kIHdlIGRvbid0IGhhdmUgdGhlIGpzIHRvZ2dsZSBjbGFzc2VzLCByZS1hZGRcbiAgICBlbHNlIGlmIChtZW51VG9nZ2xlQnV0dG9uRGlzcGxheSAhPT0gJ25vbmUnICYmICEkbWVudVRvZ2dsZVRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlJykpIHtcbiAgICAgICRtZW51VG9nZ2xlVGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ2pzLW1lbnUtdG9nZ2xlX190b2dnbGVhYmxlJyk7XG4gICAgfVxuXG4gICAgLy8gT24gcGFnZSByZXNpemUgbWFrZSBzdXJlIG1lbnUgaXNuJ3QgYW5kIHdvbid0IGJlIGNsaXBwZWRcbiAgICBpZiAoJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQpIHtcbiAgICAgIG1lbnVUb2dnbGVBZGp1c3RNZW51QW5kUGFnZUhlaWdodHMoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJGJvZHkuZGF0YXNldC5tZW51VG9nZ2xlTGFzdE9wZW5Ub2dnbGVUYXJnZXQpKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmICh0eXBlb2YgcG9zdEluaXRDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHBvc3RJbml0Q2FsbGJhY2soJG1lbnVUb2dnbGVCdXR0b24sICRtZW51VG9nZ2xlVGFyZ2V0LCBtZW51VG9nZ2xlT3BlbiwgbWVudVRvZ2dsZVNodXQpO1xuICB9XG59O1xuIl0sImZpbGUiOiJtZW51LXRvZ2dsZS5qcyJ9
