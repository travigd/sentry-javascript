export function waitForXHR(xhr: { readyState: number }, cb: () => unknown): unknown {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    return cb();
  }

  setTimeout(function() {
    waitForXHR(xhr, cb);
  }, 1000 / 60);
}
