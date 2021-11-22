const div = document.createElement('div');
document.body.appendChild(div);
div.addEventListener(
  'click',
  function() {
    window.element = div;
    window.context = this;
    // eslint-disable-next-line no-undef
    foo();
  },
  false,
);

const click = new MouseEvent('click');
div.dispatchEvent(click);
