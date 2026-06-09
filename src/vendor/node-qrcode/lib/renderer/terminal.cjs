const big = require('./terminal/terminal.cjs')
const small = require('./terminal/terminal-small.cjs')

exports.render = function (qrData, options, cb) {
  if (options && options.small) {
    return small.render(qrData, options, cb)
  }
  return big.render(qrData, options, cb)
}
