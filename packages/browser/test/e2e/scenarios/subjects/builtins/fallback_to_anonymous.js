const div = document.createElement('div');
document.body.appendChild(div);
div.addEventListener(
  'click',
  function() {
    foo();
  },
  false,
);
const click = new MouseEvent('click');
div.dispatchEvent(click);
