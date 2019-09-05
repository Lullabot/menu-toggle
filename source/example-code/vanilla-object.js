/* global menuToggle */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const $menuToggleButtons = document.querySelectorAll('.menu-toggle__button');
  for (let i = 0; i < $menuToggleButtons.length; i++) {
    menuToggle.Init($menuToggleButtons[i]);
  }
});
