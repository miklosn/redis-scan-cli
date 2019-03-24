# redis-scan-cli

Filters redis keys on a glob pattern and performs actions on them. Right now, it is only possible to delete the found keys, or print them in verbose mode.

* Doesn't use the redis KEYS command: safe to use on production systems
* Handles non-ascii keys

# Install

1. Download a binary for your platform from the [releases page](https://github.com/miklosn/redis-scan-cli/releases).

2. Make it executable and place it somewhere on PATH.

# Usage

```
Usage: redis-scan-cli [options] <pattern>

Options:
  -V, --version            output the version number
  --host <host>            Redis host (default: 127.0.0.1)
  -p, --port <port>        Redis port (default: 6379)
  -a, --auth <password>    Redis password (default: none)
  -b, --batch <batchsize>  Batch size to use for scan (default 1000)
  -d, --delete             Delete keys found
  -v, --verbose            Set verbose logging
  -h, --help               output usage information
  ```