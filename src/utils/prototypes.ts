/**
 * @returns {string}
 */

String.prototype.toKatakana = function () {
  const target = this;
  return target.replace(/[ぁ-ん]/g, function (hiraganaChar) {
    return String.fromCharCode(hiraganaChar.charCodeAt(0) + 0x60);
  });
}