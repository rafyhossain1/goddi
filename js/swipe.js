/* ==========================================================
   Swipe — Card gesture engine
   - Horizontal drag with rotation
   - Snap back below threshold
   - Fly off + callback past threshold
   - Reports active direction so the card can show a
     left/right stamp and highlight the corresponding choice
   ========================================================== */
(function () {
  'use strict';

  const THRESHOLD_RATIO = 0.28; // fraction of card width to commit
  const HINT_RATIO      = 0.10; // fraction of card width to show stamp

  function bind(cardEl, handlers) {
    let dragging = false;
    let startX = 0;
    let currentX = 0;
    let cardWidth = 0;
    let committed = false;
    let lastSide = null; // last reported drag direction; avoids redundant callback fires

    function onDown(e) {
      if (committed) return;
      dragging = true;
      cardWidth = cardEl.getBoundingClientRect().width;
      startX = pointerX(e);
      currentX = 0;
      cardEl.classList.add('dragging');
    }

    function onMove(e) {
      if (!dragging) return;
      currentX = pointerX(e) - startX;
      apply(currentX);
      // prevent scrolling while swiping horizontally
      if (Math.abs(currentX) > 8 && e.cancelable) e.preventDefault();
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      cardEl.classList.remove('dragging');

      const commitThreshold = cardWidth * THRESHOLD_RATIO;
      if (Math.abs(currentX) > commitThreshold) {
        const side = currentX > 0 ? 'right' : 'left';
        committed = true;
        cardEl.classList.add(`goddi-card--commit-${side}`);
        cardEl.style.transform = '';
        cardEl.removeAttribute('data-drag-dir');
        if (typeof handlers.onCommit === 'function') {
          // Fire after the fly-off animation plays
          setTimeout(() => handlers.onCommit(side), 320);
        }
      } else {
        // Snap back — clear preview state
        cardEl.style.transform = '';
        cardEl.removeAttribute('data-drag-dir');
        setActiveChoice(null);
        emitSide(null);
      }
    }

    function apply(dx) {
      const rotate = dx / 18; // degrees, ~rise of 33° at ~600px drag
      cardEl.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;

      const hintThreshold = cardWidth * HINT_RATIO;
      if (dx > hintThreshold) {
        cardEl.setAttribute('data-drag-dir', 'right');
        setActiveChoice('right');
        emitSide('right');
      } else if (dx < -hintThreshold) {
        cardEl.setAttribute('data-drag-dir', 'left');
        setActiveChoice('left');
        emitSide('left');
      } else {
        cardEl.removeAttribute('data-drag-dir');
        setActiveChoice(null);
        emitSide(null);
      }
    }

    // Notify the game module which side (if any) is currently being dragged
    // toward. Fires only on transitions so we don't spam every pointermove.
    function emitSide(side) {
      if (side === lastSide) return;
      lastSide = side;
      if (typeof handlers.onDragSide === 'function') {
        handlers.onDragSide(side);
      }
    }

    function setActiveChoice(side) {
      const choices = cardEl.querySelectorAll('.goddi-card__choice');
      choices.forEach(c => c.classList.remove('active'));
      if (side) {
        const el = cardEl.querySelector(`.goddi-card__choice--${side}`);
        if (el) el.classList.add('active');
      }
    }

    function pointerX(e) {
      if (e.touches && e.touches.length) return e.touches[0].clientX;
      if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
      return e.clientX;
    }

    // Mouse
    cardEl.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    // Touch
    cardEl.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);

    // Return an unbind handle in case the game decides to clean up a card
    return function unbind() {
      cardEl.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      cardEl.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchcancel', onUp);
    };
  }

  window.Swipe = { bind };
})();
