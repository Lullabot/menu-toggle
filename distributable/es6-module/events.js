"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scroll = exports.resize = void 0;

/**
 * Optimized resize handler
 * @see https://developer.mozilla.org/en-US/docs/Web/Events/resize#requestAnimationFrame
 *
 * @example
 *     optimizedResize.add(() => console.log('Resource conscious resize callback!'));
 */
// eslint-disable-next-line no-unused-vars
var resize = function () {
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
/**
 * Optimized scroll handler
 * @see https://developer.mozilla.org/en-US/docs/Web/Events/resize#requestAnimationFrame
 *
 * @example
 *     scroll.add(() => console.log('Resource conscious scroll callback!'));
 */
// eslint-disable-next-line no-unused-vars


exports.resize = resize;

var scroll = function () {
  var callbacks = [],
      running = false; // Fired on scroll event

  var onScroll = function onScroll() {
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
        document.addEventListener('scroll', onScroll, {
          'passive': true
        });
      }

      addCallback(callback);
    }
  };
}();

exports.scroll = scroll;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50cy5qcyJdLCJuYW1lcyI6WyJyZXNpemUiLCJjYWxsYmFja3MiLCJydW5uaW5nIiwib25SZXNpemUiLCJ3aW5kb3ciLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJydW5DYWxsYmFja3MiLCJzZXRUaW1lb3V0IiwiZm9yRWFjaCIsImNhbGxiYWNrIiwiYWRkQ2FsbGJhY2siLCJwdXNoIiwiYWRkIiwibGVuZ3RoIiwiYWRkRXZlbnRMaXN0ZW5lciIsInNjcm9sbCIsIm9uU2Nyb2xsIiwiZG9jdW1lbnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7Ozs7OztBQVFBO0FBQ08sSUFBTUEsTUFBTSxHQUFJLFlBQVc7QUFDaEMsTUFBSUMsU0FBUyxHQUFHLEVBQWhCO0FBQUEsTUFDSUMsT0FBTyxHQUFHLEtBRGQsQ0FEZ0MsQ0FHaEM7O0FBQ0EsTUFBTUMsUUFBUSxHQUFHLFNBQVhBLFFBQVcsR0FBTTtBQUNyQixRQUFJLENBQUNELE9BQUwsRUFBYztBQUNaQSxNQUFBQSxPQUFPLEdBQUcsSUFBVjs7QUFDQSxVQUFJRSxNQUFNLENBQUNDLHFCQUFYLEVBQWtDO0FBQ2hDRCxRQUFBQSxNQUFNLENBQUNDLHFCQUFQLENBQTZCQyxZQUE3QjtBQUNELE9BRkQsTUFHSztBQUNIQyxRQUFBQSxVQUFVLENBQUNELFlBQUQsRUFBZSxFQUFmLENBQVY7QUFDRDtBQUNGO0FBQ0YsR0FWRCxDQUpnQyxDQWdCaEM7OztBQUNBLE1BQU1BLFlBQVksR0FBRyxTQUFmQSxZQUFlLEdBQU07QUFDekJMLElBQUFBLFNBQVMsQ0FBQ08sT0FBVixDQUFrQixVQUFVQyxRQUFWLEVBQW9CO0FBQ3BDQSxNQUFBQSxRQUFRO0FBQ1QsS0FGRDtBQUdBUCxJQUFBQSxPQUFPLEdBQUcsS0FBVjtBQUNELEdBTEQsQ0FqQmdDLENBd0JoQzs7O0FBQ0EsTUFBTVEsV0FBVyxHQUFHLFNBQWRBLFdBQWMsQ0FBQ0QsUUFBRCxFQUFjO0FBQ2hDLFFBQUlBLFFBQUosRUFBYztBQUNaUixNQUFBQSxTQUFTLENBQUNVLElBQVYsQ0FBZUYsUUFBZjtBQUNEO0FBQ0YsR0FKRDs7QUFNQSxTQUFPO0FBQ0w7QUFDQSxXQUFPLFNBQVNHLEdBQVQsQ0FBYUgsUUFBYixFQUF1QjtBQUM1QixVQUFJLENBQUNSLFNBQVMsQ0FBQ1ksTUFBZixFQUF1QjtBQUNyQlQsUUFBQUEsTUFBTSxDQUFDVSxnQkFBUCxDQUF3QixRQUF4QixFQUFrQ1gsUUFBbEM7QUFDRDs7QUFDRE8sTUFBQUEsV0FBVyxDQUFDRCxRQUFELENBQVg7QUFDRDtBQVBJLEdBQVA7QUFTRCxDQXhDc0IsRUFBaEI7QUEwQ1A7Ozs7Ozs7QUFPQTs7Ozs7QUFDTyxJQUFNTSxNQUFNLEdBQUksWUFBVztBQUNoQyxNQUFJZCxTQUFTLEdBQUcsRUFBaEI7QUFBQSxNQUNJQyxPQUFPLEdBQUcsS0FEZCxDQURnQyxDQUdoQzs7QUFDQSxNQUFNYyxRQUFRLEdBQUcsU0FBWEEsUUFBVyxHQUFNO0FBQ3JCLFFBQUksQ0FBQ2QsT0FBTCxFQUFjO0FBQ1pBLE1BQUFBLE9BQU8sR0FBRyxJQUFWOztBQUNBLFVBQUlFLE1BQU0sQ0FBQ0MscUJBQVgsRUFBa0M7QUFDaENELFFBQUFBLE1BQU0sQ0FBQ0MscUJBQVAsQ0FBNkJDLFlBQTdCO0FBQ0QsT0FGRCxNQUdLO0FBQ0hDLFFBQUFBLFVBQVUsQ0FBQ0QsWUFBRCxFQUFlLEVBQWYsQ0FBVjtBQUNEO0FBQ0Y7QUFDRixHQVZELENBSmdDLENBZ0JoQzs7O0FBQ0EsTUFBTUEsWUFBWSxHQUFHLFNBQWZBLFlBQWUsR0FBTTtBQUN6QkwsSUFBQUEsU0FBUyxDQUFDTyxPQUFWLENBQWtCLFVBQVVDLFFBQVYsRUFBb0I7QUFDcENBLE1BQUFBLFFBQVE7QUFDVCxLQUZEO0FBR0FQLElBQUFBLE9BQU8sR0FBRyxLQUFWO0FBQ0QsR0FMRCxDQWpCZ0MsQ0F3QmhDOzs7QUFDQSxNQUFNUSxXQUFXLEdBQUcsU0FBZEEsV0FBYyxDQUFDRCxRQUFELEVBQWM7QUFDaEMsUUFBSUEsUUFBSixFQUFjO0FBQ1pSLE1BQUFBLFNBQVMsQ0FBQ1UsSUFBVixDQUFlRixRQUFmO0FBQ0Q7QUFDRixHQUpEOztBQU1BLFNBQU87QUFDTDtBQUNBLFdBQU8sU0FBU0csR0FBVCxDQUFhSCxRQUFiLEVBQXVCO0FBQzVCLFVBQUksQ0FBQ1IsU0FBUyxDQUFDWSxNQUFmLEVBQXVCO0FBQ3JCSSxRQUFBQSxRQUFRLENBQUNILGdCQUFULENBQTBCLFFBQTFCLEVBQW9DRSxRQUFwQyxFQUE4QztBQUFDLHFCQUFXO0FBQVosU0FBOUM7QUFDRDs7QUFDRE4sTUFBQUEsV0FBVyxDQUFDRCxRQUFELENBQVg7QUFDRDtBQVBJLEdBQVA7QUFTRCxDQXhDc0IsRUFBaEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE9wdGltaXplZCByZXNpemUgaGFuZGxlclxuICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9FdmVudHMvcmVzaXplI3JlcXVlc3RBbmltYXRpb25GcmFtZVxuICpcbiAqIEBleGFtcGxlXG4gKiAgICAgb3B0aW1pemVkUmVzaXplLmFkZCgoKSA9PiBjb25zb2xlLmxvZygnUmVzb3VyY2UgY29uc2Npb3VzIHJlc2l6ZSBjYWxsYmFjayEnKSk7XG4gKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG5leHBvcnQgY29uc3QgcmVzaXplID0gKGZ1bmN0aW9uKCkge1xuICBsZXQgY2FsbGJhY2tzID0gW10sXG4gICAgICBydW5uaW5nID0gZmFsc2U7XG4gIC8vIEZpcmVkIG9uIHJlc2l6ZSBldmVudFxuICBjb25zdCBvblJlc2l6ZSA9ICgpID0+IHtcbiAgICBpZiAoIXJ1bm5pbmcpIHtcbiAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgaWYgKHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShydW5DYWxsYmFja3MpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHNldFRpbWVvdXQocnVuQ2FsbGJhY2tzLCA2Nik7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFJ1biB0aGUgY2FsbGJhY2tzXG4gIGNvbnN0IHJ1bkNhbGxiYWNrcyA9ICgpID0+IHtcbiAgICBjYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSk7XG4gICAgcnVubmluZyA9IGZhbHNlO1xuICB9O1xuXG4gIC8vIEFkZHMgY2FsbGJhY2sgdG8gbG9vcFxuICBjb25zdCBhZGRDYWxsYmFjayA9IChjYWxsYmFjaykgPT4ge1xuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4ge1xuICAgIC8vIFB1YmxpYyBtZXRob2QgdG8gYWRkIGFkZGl0aW9uYWwgY2FsbGJhY2tcbiAgICAnYWRkJzogZnVuY3Rpb24gYWRkKGNhbGxiYWNrKSB7XG4gICAgICBpZiAoIWNhbGxiYWNrcy5sZW5ndGgpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uUmVzaXplKTtcbiAgICAgIH1cbiAgICAgIGFkZENhbGxiYWNrKGNhbGxiYWNrKTtcbiAgICB9LFxuICB9O1xufSgpKTtcblxuLyoqXG4gKiBPcHRpbWl6ZWQgc2Nyb2xsIGhhbmRsZXJcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvRXZlbnRzL3Jlc2l6ZSNyZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgIHNjcm9sbC5hZGQoKCkgPT4gY29uc29sZS5sb2coJ1Jlc291cmNlIGNvbnNjaW91cyBzY3JvbGwgY2FsbGJhY2shJykpO1xuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbmV4cG9ydCBjb25zdCBzY3JvbGwgPSAoZnVuY3Rpb24oKSB7XG4gIGxldCBjYWxsYmFja3MgPSBbXSxcbiAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgLy8gRmlyZWQgb24gc2Nyb2xsIGV2ZW50XG4gIGNvbnN0IG9uU2Nyb2xsID0gKCkgPT4ge1xuICAgIGlmICghcnVubmluZykge1xuICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICBpZiAod2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJ1bkNhbGxiYWNrcyk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dChydW5DYWxsYmFja3MsIDY2KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUnVuIHRoZSBjYWxsYmFja3NcbiAgY29uc3QgcnVuQ2FsbGJhY2tzID0gKCkgPT4ge1xuICAgIGNhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9KTtcbiAgICBydW5uaW5nID0gZmFsc2U7XG4gIH07XG5cbiAgLy8gQWRkcyBjYWxsYmFjayB0byBsb29wXG4gIGNvbnN0IGFkZENhbGxiYWNrID0gKGNhbGxiYWNrKSA9PiB7XG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgLy8gUHVibGljIG1ldGhvZCB0byBhZGQgYWRkaXRpb25hbCBjYWxsYmFja1xuICAgICdhZGQnOiBmdW5jdGlvbiBhZGQoY2FsbGJhY2spIHtcbiAgICAgIGlmICghY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBvblNjcm9sbCwgeydwYXNzaXZlJzogdHJ1ZSx9KTtcbiAgICAgIH1cbiAgICAgIGFkZENhbGxiYWNrKGNhbGxiYWNrKTtcbiAgICB9LFxuICB9O1xufSgpKTtcblxuIl0sImZpbGUiOiJldmVudHMuanMifQ==
