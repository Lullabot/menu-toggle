/**
 * Optimized resize handler
 * @see https://developer.mozilla.org/en-US/docs/Web/Events/resize#requestAnimationFrame
 *
 * @example
 *     optimizedResize.add(() => console.log('Resource conscious resize callback!'));
 */

// eslint-disable-next-line no-unused-vars
export const resize = (function() {
  let callbacks = [],
      running = false;
  // Fired on resize event
  const onResize = () => {
    if (!running) {
      running = true;
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(runCallbacks);
      }
      else {
        setTimeout(runCallbacks, 66);
      }
    }
  };

  // Run the callbacks
  const runCallbacks = () => {
    callbacks.forEach(function (callback) {
      callback();
    });
    running = false;
  };

  // Adds callback to loop
  const addCallback = (callback) => {
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
    },
  };
}());

/**
 * Optimized scroll handler
 * @see https://developer.mozilla.org/en-US/docs/Web/Events/resize#requestAnimationFrame
 *
 * @example
 *     scroll.add(() => console.log('Resource conscious scroll callback!'));
 */
// eslint-disable-next-line no-unused-vars
export const scroll = (function() {
  let callbacks = [],
      running = false;
  // Fired on scroll event
  const onScroll = () => {
    if (!running) {
      running = true;
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(runCallbacks);
      }
      else {
        setTimeout(runCallbacks, 66);
      }
    }
  };

  // Run the callbacks
  const runCallbacks = () => {
    callbacks.forEach(function (callback) {
      callback();
    });
    running = false;
  };

  // Adds callback to loop
  const addCallback = (callback) => {
    if (callback) {
      callbacks.push(callback);
    }
  };

  return {
    // Public method to add additional callback
    'add': function add(callback) {
      if (!callbacks.length) {
        document.addEventListener('scroll', onScroll, {'passive': true,});
      }
      addCallback(callback);
    },
  };
}());

