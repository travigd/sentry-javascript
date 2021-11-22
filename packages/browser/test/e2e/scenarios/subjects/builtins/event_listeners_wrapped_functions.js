const div = document.createElement('div');
document.body.appendChild(div);
const fooFn = function() {
  foo();
};
const barFn = function() {
  bar();
};
div.addEventListener('click', fooFn);
div.addEventListener('click', barFn);
div.removeEventListener('click', barFn);
div.dispatchEvent(new MouseEvent('click'));
