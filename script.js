// 各カテゴリーのスライダーを独立して初期化します。
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const slider = carousel.querySelector('.slider');
  const cards = [...slider.querySelectorAll('.work-card')];
  const previous = carousel.querySelector('.previous');
  const next = carousel.querySelector('.next');
  const section = carousel.closest('.works');
  const pagination = section.querySelector('.pagination');
  const status = section.querySelector('.slide-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let frame;
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
  function goTo(index) {
    slider.scrollTo({ left: position(cards[Math.max(0, Math.min(index, cards.length - 1))]), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
  function update() {
    const image = cards[0].querySelector('img');
    previous.style.top = next.style.top = `${image.getBoundingClientRect().height / 2 + 4}px`;
    current = cards.reduce((closest, card, index) => Math.abs(position(card) - slider.scrollLeft) < Math.abs(position(cards[closest]) - slider.scrollLeft) ? index : closest, 0);
    dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === current)));
    previous.disabled = current === 0;
    next.disabled = current === cards.length - 1;
    const text = `${current + 1} / ${cards.length}：${cards[current].querySelector('h3').textContent}`;
    if (status.textContent !== text) status.textContent = text;
  }
  previous.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  slider.addEventListener('keydown', (event) => {
    if (event.target !== slider) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); goTo(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  slider.addEventListener('scroll', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); }, { passive: true });
  new ResizeObserver(() => { goTo(current); update(); }).observe(slider);
  previous.hidden = next.hidden = cards.length < 2;
  pagination.hidden = false;
  update();
});
