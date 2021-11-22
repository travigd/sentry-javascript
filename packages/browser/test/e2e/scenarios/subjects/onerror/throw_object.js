function throwObjectError() {
  throw { error: 'stuff is broken', somekey: 'ok' };
}

throwObjectError();
