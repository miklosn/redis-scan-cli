const redis = require('redis');
const program = require('commander');
const jsesc = require('jsesc');
const { Signale } = require('signale');
const { promisify } = require('util');

program
  .version('0.1.1')
  .arguments('<pattern>')
  .option('--host <host>', 'Redis host (default: 127.0.0.1)')
  .option('-p, --port <port>', 'Redis port (default: 6379)')
  .option('-a, --auth <password>', 'Redis password (default: none)')
  .option(
    '-b, --batch <batchsize>',
    'Batch size to use for scan (default 1000)',
    parseInt
  )
  .option('-d, --delete', 'Delete keys found')
  .option('-v, --verbose', 'Set verbose logging');

program.parse(process.argv);

if (!program.args || !program.args[0]) {
  program.help();
}

const loggerOptions = {};

const logger = new Signale(loggerOptions);

const debug = message => {
  if (program.verbose) {
    logger.debug(message);
  }
};

const options = {
  host: '127.0.0.1',
  port: 6379,
  return_buffers: true
};
let batch = 1000;
if (program.batch) {
  batch = program.batch;
}

if (program.host) {
  options.host = program.host;
}

if (program.port) {
  options.port = program.port;
}

if (program.auth) {
  options.password = program.auth;
}

const client = redis.createClient(options);
const scanAsync = promisify(client.scan).bind(client);
//const getAsync = promisify(client.get).bind(client);
const deleteAsync = promisify(client.del).bind(client);

client.on('error', function(err) {
  logger.fatal(err);
  process.exit(1);
});

const scan = async (cursor, pattern, reply) => {
  const results = await scanAsync(cursor, 'MATCH', pattern, 'COUNT', batch);
  let keys = results[1];
  keys.forEach(key => {
    reply.push(key);
    debug(`Found "${jsesc(key.toString())}"`);
  });
  cursor = results[0].toString();
  if (cursor !== '0') {
    debug(`Cursor at ${cursor}`);
    await scan(cursor, pattern, reply);
  }
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
const deleteKeys = async keys => {
  await asyncForEach(keys, async key => {
    await deleteAsync(key);
    debug(`Deleted "${jsesc(key.toString())}"`);
  });
};

exports.main = async () => {
  try {
    const client = await redis.createClient(options);
    client.on('error', function(err) {
      logger.fatal(err);
      process.exit(1);
    });
    client.on('ready', function() {
      // logger.debug(event);
    });
    let keys = [];
    logger.time('scan');
    await scan('0', program.args[0], keys);
    logger.timeEnd('scan');
    logger.complete(`Found ${keys.length} keys`);

    if (program.delete) {
      logger.time('delete');
      await deleteKeys(keys);
      logger.timeEnd('delete');
      logger.complete(`Deleted ${keys.length} keys`);
    }
    process.exit(0);
  } catch (error) {
    logger.fatal(error);
  }
};

if (module === require.main) {
  exports.main();
}
