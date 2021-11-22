const a = {
  a: '1'.repeat('100'),
  b: '2'.repeat('100'),
  c: '3'.repeat('100'),
};
a.d = a.a;
a.e = a;

Promise.reject(a);
