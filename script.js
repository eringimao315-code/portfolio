// スマホは従来の1枚表示、PCは複製カードで継ぎ目なくループします。
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const slider = carousel.querySelector('.slider');
  const cards = [...slider.querySelectorAll('.work-card')];
  const previous = carousel.querySelector('.previous');
  const next = carousel.querySelector('.next');
  const section = carousel.closest('.works');
  const pagination = section.querySelector('.pagination');
  const status = section.querySelector('.slide-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 768px)');
  const copyCount = Math.min(3, cards.length);
  let current = 0, physical = 0, loop = false, moving = false, frame, settleTimer;
  let rendered = cards;
  const modulo = (index) => (index + cards.length) % cards.length;
  const dots = cards.map((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `${index + 1}番目の作品を表示：${card.querySelector('h3').textContent}`);
    button.setAttribute('aria-controls', slider.id);
    button.addEventListener('click', () => goTo(index));
    pagination.append(button);
    return button;
  });
  function position(card) {
    return card.getBoundingClientRect().left - slider.getBoundingClientRect().left + slider.scrollLeft - parseFloat(getComputedStyle(slider).paddingLeft);
  }
  function update() {
    const image = cards[0].querySelector('img');
    previous.style.top = next.style.top = `${image.getBoundingClientRect().height / 2 + 4}px`;
    const nearest = rendered.reduce((closest, card, index) => Math.abs(position(card) - slider.scrollLeft) < Math.abs(position(rendered[closest]) - slider.scrollLeft) ? index : closest, 0);
    current = loop ? modulo(nearest - copyCount) : nearest;
    dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === current)));
    previous.disabled = !loop && current === 0;
    next.disabled = !loop && current === cards.length - 1;
    const text = `${current + 1} / ${cards.length}：${cards[current].querySelector('h3').textContent}`;
    if (status.textContent !== text) status.textContent = text;
  }
  function settle() {
    clearTimeout(settleTimer);
    update();
    if (loop) {
      physical = copyCount + current;
      // 同じ画像の本体に即座に戻し、端からも次の1枚へ進めるようにします。
      if (Math.abs(slider.scrollLeft - position(rendered[physical])) > 1) {
        slider.scrollTo({ left: position(rendered[physical]), behavior: 'instant' });
      }
    }
    moving = false;
  }
  function scrollToPhysical(index) {
    physical = index;
    moving = loop && !reducedMotion.matches;
    slider.scrollTo({ left: position(rendered[index]), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 200);
  }
  function goTo(index) {
    const target = Math.max(0, Math.min(index, cards.length - 1));
    scrollToPhysical(loop ? copyCount + target : target);
  }
  function move(direction) {
    if (loop) {
      if (moving) return;
      scrollToPhysical(copyCount + current + direction);
    } else {
      goTo(current + direction);
    }
  }
  function clone(card) {
    const copy = card.cloneNode(true);
    copy.dataset.loopClone = '';
    copy.setAttribute('aria-hidden', 'true');
    copy.tabIndex = -1;
    return copy;
  }
  function configure() {
    clearTimeout(settleTimer);
    moving = false;
    slider.querySelectorAll('[data-loop-clone]').forEach((copy) => copy.remove());
    loop = desktop.matches && cards.length > 1;
    if (loop) {
      const before = document.createDocumentFragment();
      cards.slice(-copyCount).forEach((card) => before.append(clone(card)));
      slider.prepend(before);
      cards.slice(0, copyCount).forEach((card) => slider.append(clone(card)));
    }
    rendered = [...slider.querySelectorAll('.work-card')];
    physical = loop ? copyCount + current : current;
    slider.scrollTo({ left: position(rendered[physical]), behavior: 'instant' });
    update();
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  slider.addEventListener('keydown', (event) => {
    if (event.target !== slider) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  slider.addEventListener('scroll', () => {
    cancelAnimationFrame(frame); frame = requestAnimationFrame(update);
    clearTimeout(settleTimer); settleTimer = setTimeout(settle, 160);
  }, { passive: true });
  slider.addEventListener('scrollend', settle);
  desktop.addEventListener('change', configure);
  new ResizeObserver(() => {
    moving = false;
    physical = loop ? copyCount + current : current;
    slider.scrollTo({ left: position(rendered[physical]), behavior: 'instant' });
    update();
  }).observe(slider);
  previous.hidden = next.hidden = cards.length < 2;
  pagination.hidden = false;
  configure();
});
