import { waitForXHR } from '../../../utils/browserHelpers.ts';

const xhr = new XMLHttpRequest();
xhr.open('POST', '/base/subjects/example.json');
xhr.send('{"foo":"bar"}');

waitForXHR(xhr, function() {
  Sentry.captureMessage('test');
});
