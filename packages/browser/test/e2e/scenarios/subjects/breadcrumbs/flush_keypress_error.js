// keypress <input/>
const keypress = new KeyboardEvent('keypress');
const input = document.getElementsByTagName('input')[0];
input.addEventListener('keypress');
input.dispatchEvent(keypress);

undefined(); // throw exception
