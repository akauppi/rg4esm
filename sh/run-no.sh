#!/bin/bash
set -eu -o pipefail

# List possibly outdated dependencies, in all the subpackages.
#
PATHS=". package playground"

for _PATH in $PATHS   # overriding 'PATH'... not recommended.
do
  # 'npm ... outdated' (npm 8.0.0) exits with non-0 if there are outdated entries. We want to keep going.
  #
  npm --prefix "$_PATH" outdated || true
done
