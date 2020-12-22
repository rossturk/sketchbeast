#!/bin/bash

pushd public
scp -r * dreamy.rtrk.us:sketchbeast.com/
popd
