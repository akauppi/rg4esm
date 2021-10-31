#!/bin/bash
set -eu -o pipefail

#
# Apply the patches to standard 'raygun4js' distributable, making it usable from ECMAScript module.
#
# Requires:
#   - tr
#   - patch
#
TARGET=lib/raygun.esm.js
SOURCE=node_modules/raygun4js/dist/raygun.js

PRELUDE=patch/prelude.js
EPILOGUE=patch/epilogue.js

if [[ -f $TARGET ]]; then
  mv $TARGET $TARGET.~was.$( date +%F_%T )
fi

# Make sure '$TARGET' only exists if the patching was successful.

tr -d '\r' < $SOURCE > $TARGET.~

patch -p0 --forward $TARGET.~ patch/raygun4js.2.22.5.patch

cat patch/prelude.js $TARGET.~ patch/epilogue.js > $TARGET
rm $TARGET.~
