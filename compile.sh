#!/bin/bash

#exit ASAP if anything fails
set -e

node_modules/.bin/krl-compiler < test-rulesets/events.krl > src/rulesets/events.js 
node_modules/.bin/krl-compiler < test-rulesets/hello-world.krl > src/rulesets/hello-world.js 
node_modules/.bin/krl-compiler < test-rulesets/persistent.krl > src/rulesets/persistent.js 
