/*!
* connect logger-statsd middleware
*
* @author Pete Fritchman <petef@databits.net>
* MPL 1.1/GPL 2.0/LGPL 2.1
*/

/*
 * Generate statsd updates for each request.
 *
 * - statsd counters named "response.$code" (e.g. response.200)
 * - a statsd timer named "response_time"
 *
 * Options:
 *   - `statsd`   the statsd connection object
 *   - `prefix`   statsd metric name prefix. include the trailing "."
 *                (default "")
 *
 * @param {Object} options
 * @api public
 */
module.exports = function(options) {
  var statsd_client;
  if (options === null) {
      options = {};
  }
  
  if (!options.statsd) {
    throw new Error('no valid statsd client passed in');
  }

  if (!options.prefix) {
    options.prefix = '';
  }

  statsd_client = options.statsd;

  return function(req, res, next){
    req._stats_startTime = new Date();

    var end = res.end;
    var path = req.path.replace(/\//g, '.');
    var method = req.method;
    res.end = function(chunk, encoding) {
      var reqTime = new Date() - req._stats_startTime;

      end.call(res, chunk, encoding);

      /* request time */
      statsd_client.timing(options.prefix + "response_time" + path + "." + method, reqTime);

      /* responses by status code */
      statsd_client.increment(options.prefix + "response" + path + "." + method + "." + res.statusCode);
    };

    next();
  };
};
