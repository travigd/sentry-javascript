// click <input/>
const click = new MouseEvent('click');
function kaboom() {
  throw new Error('lol');
}
Object.defineProperty(click, 'target', { get: kaboom });

const input = document.querySelector('.a'); // leaf node
input.addEventListener('click');
input.dispatchEvent(click);

Sentry.captureMessage('test');
